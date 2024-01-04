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

type PatchedChatCompletionCreateParams<Model extends z.ZodType<z.ZodTypeAny> = z.ZodTypeAny> =
  ChatCompletionCreateParams & {
    response_model?: Model extends z.ZodType<infer T> ? T : never
    max_retries?: number
  }

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
  }

  private log = (...args) => {
    if (this.debug) {
      // ! is there a better way to do this?
      console.log("INSTRUCTOR DEBUG: ", ...args)
    }
  }

  /**
   * Handles chat completion with retries.
   * @param {PatchedChatCompletionCreateParams} params - The parameters for chat completion.
   * @returns {Promise<any>} The response from the chat completion.
   */
  chatCompletion = async <Model extends z.ZodType<z.ZodTypeAny>>({
    max_retries = 3,
    ...params
  }: PatchedChatCompletionCreateParams<Model>): Promise<
    Model extends z.ZodType<infer T> ? T : never
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
            schema: params.response_model
          })
        }

        const validation = params.response_model!.safeParse(data)
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
    const streamParser = new SchemaStream(schema, {
      onKeyComplete: ({ activeKey }) => {
        _activeKey = activeKey
      }
    })

    const parser = streamParser.parse({
      stringStreaming: true
    })

    const textEncoder = new TextEncoder()
    const textDecoder = new TextDecoder()

    const validationStream = new TransformStream({
      transform: async (chunk, controller): Promise<void> => {
        try {
          const parsedChunk = JSON.parse(textDecoder.decode(chunk))
          const validation = schema.safeParse(parsedChunk)

          controller.enqueue(
            textEncoder.encode(
              JSON.stringify({ ...parsedChunk, _isValid: validation.success, _activeKey })
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
   * @param {PatchedChatCompletionCreateParams} params - The parameters for chat completion.
   * @returns {ChatCompletionCreateParams} The chat completion parameters.
   */
  private buildChatCompletionParams = ({
    response_model,
    ...params
  }: PatchedChatCompletionCreateParams): ChatCompletionCreateParams => {
    const jsonSchema = zodToJsonSchema(response_model, {
      name: "response_model",
      errorMessages: true
    })

    this.log("JSON Schema from zod: ", jsonSchema)

    const definition = {
      name: "response_model",
      ...jsonSchema.definitions?.response_model
    }

    const paramsForMode = MODE_TO_PARAMS[this.mode](definition, params, this.mode)

    return {
      stream: false,
      ...paramsForMode
    }
  }

  chatCompletionWithoutModel = async (
    params: Omit<PatchedChatCompletionCreateParams, "response_model">
  ): Promise<
    Stream<OpenAI.Chat.Completions.ChatCompletionChunk> | OpenAI.Chat.Completions.ChatCompletion
  > => {
    return this.client.chat.completions.create(params)
  }

  public chat = {
    completions: {
      create: (params: PatchedChatCompletionCreateParams) => {
        if ("response_model" in params) {
          return this.chatCompletion(params)
        } else {
          return this.chatCompletionWithoutModel(params)
        }
      }
    }
  }
}

// TODO: Think about moving this to it's own type file
export type OAIClientExtended = OpenAI & Instructor

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
