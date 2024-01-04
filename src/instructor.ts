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
import OpenAI from "openai"
import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam
} from "openai/resources/index.mjs"
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

type PatchedChatCompletionCreateParams = ChatCompletionCreateParamsNonStreaming & {
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
                role: "system",
                content: `Your last response had the following zod validation issues, please try again: ${validationIssues}`
              }
            ]
          }
        }

        const completion = await this.client.chat.completions.create(resolvedParams)
        const response = this.parseOAIResponse(completion)

        return response
      } catch (error) {
        throw error
      }
    }

    const makeCompletionCallWithRetries = async () => {
      try {
        const data = await makeCompletionCall()
        if (params.response_model === undefined) return data
        const validation = params.response_model.safeParse(data)
        if (!validation.success) {
          if ("error" in validation) {
            lastMessage = {
              role: "assistant",
              content: JSON.stringify(data)
            }

            validationIssues = fromZodError(validation.error).message
            throw validation.error
          } else {
            throw new Error("Validation failed.")
          }
        }
        return validation.data
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

  /**
   * Builds the chat completion parameters.
   * @param {PatchedChatCompletionCreateParams} params - The parameters for chat completion.
   * @returns {ChatCompletionCreateParamsNonStreaming} The chat completion parameters.
   */
  private buildChatCompletionParams = ({
    response_model,
    ...params
  }: PatchedChatCompletionCreateParams): ChatCompletionCreateParamsNonStreaming => {
    if (response_model === undefined) {
      return {
        stream: false,
        ...params
      }
    }
    const jsonSchema = zodToJsonSchema(response_model, "response_model")

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

  /**
   * Parses the OAI response.
   * @param {ChatCompletion} response - The response from the chat completion.
   * @returns {any} The parsed response.
   */
  private parseOAIResponse = (response: ChatCompletion) => {
    const parser = MODE_TO_PARSER[this.mode]

    return parser(response)
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

// TODO: Think about moving this to it's own type file
export type OAIClientExtended = OpenAI & Instructor

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
