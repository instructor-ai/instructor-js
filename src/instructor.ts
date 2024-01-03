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
import { OAIStream } from "@/oai/stream"
import OpenAI from "openai"
import { ChatCompletionCreateParams } from "openai/resources/index.mjs"
import { SchemaStream } from "schema-stream"
import { ZodObject } from "zod"
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

type PatchedChatCompletionCreateParams = ChatCompletionCreateParams & {
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  response_model?: ZodObject<any>
  max_retries?: number
}

class Instructor {
  readonly client: OpenAI
  readonly mode: MODE

  /**
   * Creates an instance of the `Instructor` class.
   * @param {OpenAI} client - The OpenAI client.
   * @param {string} mode - The mode of operation.
   */
  constructor({ client, mode }: { client: OpenAI; mode: MODE }) {
    this.client = client
    this.mode = mode
  }

  /**
   * Handles chat completion with retries.
   * @param {PatchedChatCompletionCreateParams} params - The parameters for chat completion.
   * @returns {Promise<any>} The response from the chat completion.
   */
  chatCompletion = async ({ max_retries = 3, ...params }: PatchedChatCompletionCreateParams) => {
    let attempts = 0
    let validationIssues = ""
    let lastMessage = null

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
                content: `Your last response had the following zod validation issues, please try again and fix any issues: ${validationIssues}`
              }
            ]
          }
        }

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

        const validation = params.response_model.safeParse(data)
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
        return data
      } catch (error) {
        if (attempts < max_retries) {
          attempts++
          return await makeCompletionCallWithRetries()
        } else {
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

    return validationStream
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

    const definition = {
      name: "response_model",
      ...jsonSchema.definitions.response_model
    }

    const paramsForMode = MODE_TO_PARAMS[this.mode](definition, params, this.mode)

    return {
      stream: false,
      ...paramsForMode
    }
  }

  /**
   * Public chat interface.
   */
  public chat = {
    completions: {
      create: this.chatCompletion
    }
  }
}

type OAIClientExtended = OpenAI & Instructor

export default function (args: { client: OpenAI; mode: MODE }): OAIClientExtended {
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
