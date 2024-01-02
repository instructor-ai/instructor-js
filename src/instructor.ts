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
import { ChatCompletion, ChatCompletionCreateParamsNonStreaming } from "openai/resources/index.mjs"
import { ZodObject } from "zod"
import zodToJsonSchema from "zod-to-json-schema"

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

export default class Instructor {
  private client: OpenAI
  private mode: MODE

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
  private chatCompletion = async ({
    max_retries = 3,
    ...params
  }: PatchedChatCompletionCreateParams) => {
    let attempts = 0
    let validationIssues = []
    let lastMessage = null

    const completionParams = this.buildChatCompletionParams(params)

    const makeCompletionCall = async () => {
      let resolvedParams = completionParams

      try {
        if (validationIssues.length > 0) {
          resolvedParams = {
            ...completionParams,
            messages: [
              ...completionParams.messages,
              ...(lastMessage ? [lastMessage] : []),
              {
                role: "system",
                content: `Your last response had the following validation issues, please try again: ${validationIssues.join(
                  ", "
                )}`
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
        const validation = params.response_model.safeParse(data)

        if (!validation.success) {
          if ("error" in validation) {
            lastMessage = {
              role: "assistant",
              content: JSON.stringify(data)
            }

            validationIssues = validation.error.issues.map(issue => issue.message)
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

  /**
   * Builds the chat completion parameters.
   * @param {PatchedChatCompletionCreateParams} params - The parameters for chat completion.
   * @returns {ChatCompletionCreateParamsNonStreaming} The chat completion parameters.
   */
  private buildChatCompletionParams = ({
    response_model,
    ...params
  }: PatchedChatCompletionCreateParams): ChatCompletionCreateParamsNonStreaming => {
    const jsonSchema = zodToJsonSchema(response_model, "response_model")

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
