import { OAIStream, readableStreamToAsyncGenerator } from "@/oai/stream"
import {
  ChatCompletionCreateParamsWithModel,
  InstructorConfig,
  Mode,
  NonStreamType,
  ReturnTypeBasedOnParams,
  ReturnWithModel,
  StreamType
} from "@/types"
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

import { MODE, MODE_TO_PARAMS, MODE_TO_PARSER } from "@/constants/modes"

import { omit } from "./lib"

const MAX_RETRIES_DEFAULT = 0

class Instructor {
  readonly client: OpenAI
  readonly mode: Mode
  readonly debug: boolean = false

  /**
   * Creates an instance of the `Instructor` class.
   * @param {OpenAI} client - The OpenAI client.
   * @param {string} mode - The mode of operation.
   */
  constructor({ client, mode, debug = false }: InstructorConfig) {
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

  private async chatCompletionStandard<T extends z.ZodTypeAny>({
    max_retries = MAX_RETRIES_DEFAULT,
    ...params
  }: ChatCompletionCreateParamsWithModel<T>): Promise<Promise<z.infer<T>>> {
    let attempts = 0
    let validationIssues = ""
    let lastMessage: ChatCompletionMessageParam | null = null

    const completionParams = this.buildChatCompletionParams(params)

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

        const parsedCompletion = parser(completion)
        return JSON.parse(parsedCompletion) as z.infer<T>
      } catch (error) {
        throw error
      }
    }

    const makeCompletionCallWithRetries = async () => {
      try {
        const data = await makeCompletionCall()

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

    return makeCompletionCallWithRetries()
  }

  private chatCompletionStream<P, T extends z.ZodTypeAny>({
    streamOutputType = "GENERATOR",
    ...params
  }: ChatCompletionCreateParamsWithModel<T>): ReturnWithModel<
    P,
    z.infer<T>,
    "READABLE" | "GENERATOR"
  > {
    const completionParams = this.buildChatCompletionParams(params)

    const makeCompletionCall = async () => {
      const resolvedParams = completionParams

      try {
        this.log("making completion call with params: ", resolvedParams)

        const completion = await this.client.chat.completions.create(resolvedParams)
        const parser = MODE_TO_PARSER[this.mode]

        if (!("choices" in completion)) {
          return OAIStream({ res: completion, parser })
        }
      } catch (error) {
        throw error
      }
    }

    const getStream = async () => {
      try {
        const data = await makeCompletionCall()

        return this.partialStreamResponse({
          stream: data,
          schema: params.response_model.schema,
          streamOutputType
        })
      } catch (error) {
        console.error("Instructor: error making completion call")
        throw error
      }
    }

    return getStream() as ReturnWithModel<P, T, typeof streamOutputType>
  }

  private async partialStreamResponse({ stream, schema, streamOutputType }) {
    let _activePath: (string | number | undefined)[] = []
    let _completedPaths: (string | number | undefined)[][] = []

    const streamParser = new SchemaStream(schema, {
      typeDefaults: {
        string: null,
        number: null,
        boolean: null
      },
      onKeyComplete: ({ activePath, completedPaths }) => {
        _activePath = activePath
        _completedPaths = completedPaths
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
                _activePath,
                _completedPaths
              })
            )
          )
        } catch (e) {
          console.error(`Error in the partial stream validation stream`, e, chunk)
        }
      },
      flush() {
        this.activePath = undefined
      }
    })

    stream.pipeThrough(parser)
    parser.readable.pipeThrough(validationStream)

    if (streamOutputType === "READABLE") {
      return validationStream.readable
    }

    return readableStreamToAsyncGenerator(validationStream.readable)
  }

  /**
   * Builds the chat completion parameters.
   * @param {ChatCompletionCreateParamsWithModel} params - The parameters for chat completion.
   * @returns {ChatCompletionCreateParams} The chat completion parameters.
   */
  private buildChatCompletionParams = <T extends z.ZodTypeAny>({
    response_model: { name, schema, description },

    ...params
  }: ChatCompletionCreateParamsWithModel<T>): ChatCompletionCreateParams => {
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

    const paramsForMode = MODE_TO_PARAMS[this.mode](
      definition,
      omit(["max_retries"], params),
      this.mode
    )

    return {
      stream: false,
      ...paramsForMode
    }
  }

  private handleStreamWithModel<T extends z.ZodTypeAny>(
    params: ChatCompletionCreateParamsWithModel<T>
  ): Promise<StreamType<"READABLE" | "GENERATOR", z.infer<T>>> {
    if (this.isOutputTypeStream(params.streamOutputType)) {
      return this.chatCompletionStream(params)
    }

    if (this.isOutputTypeGenerator(params.streamOutputType)) {
      return this.chatCompletionStream(params)
    }

    throw new Error("Invalid streamOutputType")
  }

  private async handleStandardWithModel<T extends z.ZodTypeAny>(
    params: ChatCompletionCreateParamsWithModel<T>
  ): Promise<NonStreamType<z.infer<T>>> {
    return this.chatCompletionStandard(params)
  }

  private isChatCompletionCreateParamsWithModel<T extends z.ZodTypeAny>(
    params: ChatCompletionCreateParamsWithModel<T>
  ): params is ChatCompletionCreateParamsWithModel<T> {
    return "response_model" in params
  }

  private isOutputTypeStream(streamOutputType): streamOutputType is "READABLE" {
    return streamOutputType === "READABLE"
  }

  private isOutputTypeGenerator(streamOutputType): streamOutputType is "GENERATOR" {
    return streamOutputType === "GENERATOR"
  }

  public getSchemaStub({ schema, defaultData = {} }) {
    const streamParser = new SchemaStream(schema, {
      typeDefaults: {
        string: null,
        number: null,
        boolean: null
      }
    })

    return streamParser.getSchemaStub(schema, defaultData)
  }

  public chat = {
    completions: {
      create: async <
        T extends z.ZodTypeAny | undefined,
        P extends T extends z.ZodTypeAny
          ? ChatCompletionCreateParamsWithModel<T>
          : ChatCompletionCreateParams & { response_model: never }
      >(
        params: P
      ): Promise<ReturnTypeBasedOnParams<typeof params>> => {
        if (this.isChatCompletionCreateParamsWithModel(params)) {
          const paramsWithDefaults = {
            ...params,
            max_retries: params.max_retries ?? MAX_RETRIES_DEFAULT,
            streamOutputType: params.stream ? params.streamOutputType ?? "GENERATOR" : undefined
          }
          if (params.stream) {
            return this.handleStreamWithModel(paramsWithDefaults) as ReturnTypeBasedOnParams<
              typeof paramsWithDefaults
            >
          } else {
            return this.handleStandardWithModel(paramsWithDefaults) as ReturnTypeBasedOnParams<
              typeof paramsWithDefaults
            >
          }
        } else {
          const result:
            | Stream<OpenAI.Chat.Completions.ChatCompletionChunk>
            | OpenAI.Chat.Completions.ChatCompletion = params.stream
            ? await this.client.chat.completions.create(params)
            : await this.client.chat.completions.create(params)

          return result as ReturnTypeBasedOnParams<typeof params>
        }
      }
    }
  }
}

type OAIClientExtended = OpenAI & Instructor

/**
 * Creates an instance of the `Instructor` class.
 * @param {OpenAI} client - The OpenAI client.
 * @param {string} mode - The mode of operation.
 * @param {boolean} debug - Whether to log debug messages.
 * @returns {OAIClientExtended} The extended OpenAI client.
 * @example
 * import createInstructor from "@instructor-ai/instructor"
 * import OpenAI from "openai
 *
 * const OAI = new OpenAi({})
 *
 * const client = createInstructor({
 *  client: OAI,
 * mode: "TOOLS",
 * })
 *
 * @param args
 * @returns
 */
export default function (args: { client: OpenAI; mode: Mode; debug?: boolean }): OAIClientExtended {
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
