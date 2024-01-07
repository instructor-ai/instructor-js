import {
  OAIBuildFunctionParams,
  OAIBuildMessageBasedParams,
  OAIBuildToolFunctionParams
} from "@/oai/params"
import {
  OAIResponseFnArgsParser,
  OAIResponseJSONStringParser,
  OAIResponseToolArgsParser
} from "@/oai/parser"
import { OAIStream, readableStreamToAsyncGenerator } from "@/oai/stream"
import OpenAI from "openai"
import type {
  ChatCompletionCreateParams,
  ChatCompletionMessageParam
} from "openai/resources/index.mjs"
import { Stream } from "openai/streaming.mjs"
import { SchemaStream } from "schema-stream"
import { z } from "zod"
import zodToJsonSchema from "zod-to-json-schema"
import { fromZodError } from "zod-validation-error"

import { MODE } from "@/constants/modes"

const MODE_TO_PARSER = {
  [MODE.FUNCTIONS]: OAIResponseFnArgsParser,
  [MODE.TOOLS]: OAIResponseToolArgsParser,
  [MODE.JSON]: OAIResponseJSONStringParser,
  [MODE.MD_JSON]: OAIResponseJSONStringParser,
  [MODE.JSON_SCHEMA]: OAIResponseJSONStringParser
}

const MODE_TO_PARAMS = {
  [MODE.FUNCTIONS]: OAIBuildFunctionParams,
  [MODE.TOOLS]: OAIBuildToolFunctionParams,
  [MODE.JSON]: OAIBuildMessageBasedParams,
  [MODE.MD_JSON]: OAIBuildMessageBasedParams,
  [MODE.JSON_SCHEMA]: OAIBuildMessageBasedParams
}

type ResponseModel<T> = {
  schema: T
  name?: string
  description?: string
}

type InstructorChatCompletionParams<T> = {
  response_model: ResponseModel<T>
  max_retries?: number
}

type ChatCompletionCreateParamsWithModel<T extends z.ZodTypeAny> = ChatCompletionCreateParams &
  InstructorChatCompletionParams<T>

type ReturnTypeBasedOnParams<P> = P extends ChatCompletionCreateParamsWithModel<infer T>
  ? P extends { stream: true }
    ? Promise<AsyncGenerator<z.infer<T>, void, unknown>>
    : Promise<z.infer<T>>
  : P extends { stream: true }
    ? Promise<Stream<OpenAI.Chat.Completions.ChatCompletionChunk>>
    : Promise<OpenAI.Chat.Completions.ChatCompletion>

class Instructor {
  readonly client: OpenAI
  readonly mode: MODE
  readonly debug: boolean = false

  /**
   * Creates an instance of the `Instructor` class.
   * @param {OpenAI} client - The OpenAI client.
   * @param {string} mode - The mode of operation.
   */
  constructor({ client, mode, debug = false }: { client: OpenAI; mode: MODE; debug?: boolean }) {
    this.client = client
    this.mode = mode
    this.debug = debug

    //TODO: probably some more sophisticated validation we can do here re: modes and otherwise.
    // but just throwing quick here for now.
    if (mode === MODE.JSON_SCHEMA) {
      if (!this.client.baseURL.includes("anyscale")) {
        throw new Error("JSON_SCHEMA mode is only support on Anyscale.")
      }
    }
  }

  private log = (...args) => {
    if (this.debug) {
      // ! is there a better way to do this?
      console.log("INSTRUCTOR DEBUG: ", ...args)
    }
  }

  /**
   * Handles chat completion with retries.
   * @param {ChatCompletionCreateParamsWithModel} params - The parameters for chat completion.
   * @returns {Promise<any>} The response from the chat completion.
   */
  chatCompletion = async <T extends z.ZodTypeAny>({
    max_retries = 3,
    ...params
  }: ChatCompletionCreateParamsWithModel<T>): Promise<
    Promise<z.infer<T>> | AsyncGenerator<z.infer<T>, void, unknown>
  > => {
    let attempts = 0
    let validationIssues = ""
    let lastMessage: ChatCompletionMessageParam | null = null

    const completionParams = this.buildChatCompletionParams({ ...params })

    const makeCompletionCall = async () => {
      let resolvedParams = completionParams

      try {
        if (validationIssues) {
          resolvedParams = {
            ...completionParams,
            messages: [
              ...completionParams.messages,
              ...(lastMessage ? [lastMessage] : []),
              {
                role: "user",
                content: `Please correct the function call; errors encountered:\n ${validationIssues}`
              }
            ]
          }
        }

        this.log("making completion call with params: ", resolvedParams)

        const completion = await this.client.chat.completions.create(resolvedParams)
        const parser = MODE_TO_PARSER[this.mode]

        if ("choices" in completion) {
          const parsedCompletion = parser(completion)
          return JSON.parse(parsedCompletion)
        } else {
          return OAIStream({ res: completion, parser })
        }
      } catch (error) {
        throw error
      }
    }

    const makeCompletionCallWithRetries = async () => {
      try {
        const data = await makeCompletionCall()
        if (params.stream) {
          return this.partialStreamResponse({
            stream: data,
            schema: params.response_model.schema
          })
        }

        const validation = params.response_model.schema.safeParse(data)
        this.log("Completion validation: ", validation)

        if (!validation.success) {
          if ("error" in validation) {
            lastMessage = {
              role: "assistant",
              content: JSON.stringify(data)
            }

            validationIssues = fromZodError(validation.error)?.message

            throw validation.error
          } else {
            throw new Error("Validation failed.")
          }
        }
        return validation.data
      } catch (error) {
        if (attempts < max_retries) {
          this.log("Retrying, attempt: ", attempts)
          attempts++
          return await makeCompletionCallWithRetries()
        } else {
          this.log("Max attempts reached: ", attempts)
          throw error
        }
      }
    }

    return await makeCompletionCallWithRetries()
  }

  private async partialStreamResponse({ stream, schema }) {
    let _activeKey = null
    let _completedKeys = []

    const streamParser = new SchemaStream(schema, {
      typeDefaults: {
        string: null,
        number: null,
        boolean: null
      },
      onKeyComplete: ({ activeKey, completedKeys }) => {
        _activeKey = activeKey
        _completedKeys = completedKeys
      }
    })

    const parser = streamParser.parse({})

    const textEncoder = new TextEncoder()
    const textDecoder = new TextDecoder()

    const validationStream = new TransformStream({
      transform: async (chunk, controller): Promise<void> => {
        try {
          const parsedChunk = JSON.parse(textDecoder.decode(chunk))
          const validation = schema.safeParse(parsedChunk)

          controller.enqueue(
            textEncoder.encode(
              JSON.stringify({
                ...parsedChunk,
                _isValid: validation.success,
                _activeKey,
                _completedKeys
              })
            )
          )
        } catch (e) {
          console.error(`Error in the partial stream validation stream`, e, chunk)
        }
      },
      flush() {
        this.activeKey = undefined
      }
    })

    stream.pipeThrough(parser)
    parser.readable.pipeThrough(validationStream)

    return readableStreamToAsyncGenerator(validationStream.readable)
  }

  /**
   * Builds the chat completion parameters.
   * @param {ChatCompletionCreateParamsWithModel} params - The parameters for chat completion.
   * @returns {ChatCompletionCreateParams} The chat completion parameters.
   */
  private buildChatCompletionParams = <T extends z.ZodTypeAny>({
    response_model,
    ...params
  }: ChatCompletionCreateParamsWithModel<T>): ChatCompletionCreateParams => {
    const { schema, name = "response_model", description } = response_model
    const safeName = name.replace(/[^a-zA-Z0-9]/g, "_").replace(/\s/g, "_")

    const { definitions } = zodToJsonSchema(schema, {
      name: safeName,
      errorMessages: true
    })

    if (!definitions || !definitions?.[safeName]) {
      console.warn("Could not extract json schema definitions from your schema", schema)
      throw new Error("Could not extract json schema definitions from your schema")
    }

    this.log("JSON Schema from zod: ", definitions)

    const definition = {
      name: safeName,
      description,
      ...definitions[safeName]
    }

    const paramsForMode = MODE_TO_PARAMS[this.mode](definition, params, this.mode)

    return {
      stream: false,
      ...paramsForMode
    }
  }

  chatCompletionWithoutModel = async (
    params: ChatCompletionCreateParams
  ): Promise<
    Stream<OpenAI.Chat.Completions.ChatCompletionChunk> | OpenAI.Chat.Completions.ChatCompletion
  > => {
    return this.client.chat.completions.create(params)
  }

  public chat = {
    completions: {
      create: <
        P extends ChatCompletionCreateParamsWithModel<z.ZodTypeAny> | ChatCompletionCreateParams
      >(
        params: P
      ): ReturnTypeBasedOnParams<P> => {
        if ("response_model" in params && params.response_model?.schema !== undefined) {
          return this.chatCompletion(
            params as ChatCompletionCreateParamsWithModel<z.ZodTypeAny>
          ) as ReturnTypeBasedOnParams<P>
        } else {
          return this.chatCompletionWithoutModel(
            params as ChatCompletionCreateParams
          ) as ReturnTypeBasedOnParams<P>
        }
      }
    }
  }
}
type OAIClientExtended = OpenAI & Instructor

export default function (args: { client: OpenAI; mode: MODE; debug?: boolean }): OAIClientExtended {
  const instructor = new Instructor(args)

  const instructorWithProxy = new Proxy(instructor, {
    get: (target, prop, receiver) => {
      if (prop in target) {
        return Reflect.get(target, prop, receiver)
      }

      return Reflect.get(target.client, prop, receiver)
    }
  })

  return instructorWithProxy as OAIClientExtended
}
