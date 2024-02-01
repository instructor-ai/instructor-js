import {
  ChatCompletionCreateParamsWithModel,
  InstructorConfig,
  LogLevel,
  ReturnTypeBasedOnParams
} from "@/types"
import OpenAI from "openai"
import { z } from "zod"
import ZodStream, { OAIResponseParser, OAIStream, withResponseModel, type Mode } from "zod-stream"
import { fromZodError } from "zod-validation-error"

import {
  NON_OAI_PROVIDER_URLS,
  Provider,
  PROVIDER_SUPPORTED_MODES,
  PROVIDER_SUPPORTED_MODES_BY_MODEL,
  PROVIDERS
} from "./constants/providers"

const MAX_RETRIES_DEFAULT = 0

class Instructor {
  readonly client: OpenAI
  readonly mode: Mode
  readonly provider: Provider
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

    const provider =
      this.client?.baseURL.includes(NON_OAI_PROVIDER_URLS.ANYSCALE) ? PROVIDERS.ANYSCALE
      : this.client?.baseURL.includes(NON_OAI_PROVIDER_URLS.TOGETHER) ? PROVIDERS.TOGETHER
      : PROVIDERS.OAI

    this.provider = provider

    this.validateOptions()
  }

  private validateOptions() {
    const isModeSupported = PROVIDER_SUPPORTED_MODES[this.provider].includes(this.mode)

    if (!isModeSupported) {
      throw new Error(`Mode ${this.mode} is not supported by provider ${this.provider}`)
    }
  }

  private validateModelModeSupport<T extends z.AnyZodObject>(
    params: ChatCompletionCreateParamsWithModel<T>
  ) {
    if (this.provider !== PROVIDERS.OAI) {
      const modelSupport = PROVIDER_SUPPORTED_MODES_BY_MODEL[this.provider][this.mode]

      if (!modelSupport.includes("*") && !modelSupport.includes(params.model)) {
        throw new Error(
          `Model ${params.model} is not supported by provider ${this.provider} in mode ${this.mode}`
        )
      }
    }
  }

  private log<T extends unknown[]>(level: LogLevel, ...args: T) {
    if (!this.debug && level === "debug") {
      return
    }

    const timestamp = new Date().toISOString()
    switch (level) {
      case "debug":
        console.debug(`[Instructor:DEBUG] ${timestamp}:`, ...args)
        break
      case "info":
        console.info(`[Instructor:INFO] ${timestamp}:`, ...args)
        break
      case "warn":
        console.warn(`[Instructor:WARN] ${timestamp}:`, ...args)
        break
      case "error":
        console.error(`[Instructor:ERROR] ${timestamp}:`, ...args)
        break
    }
  }

  private async chatCompletionStandard<T extends z.AnyZodObject>({
    max_retries = MAX_RETRIES_DEFAULT,
    response_model,
    ...params
  }: ChatCompletionCreateParamsWithModel<T>): Promise<z.infer<T>> {
    let attempts = 0
    let validationIssues = ""
    let lastMessage: OpenAI.ChatCompletionMessageParam | null = null

    const completionParams = withResponseModel({
      params: {
        ...params,
        stream: false
      },
      mode: this.mode,
      response_model
    })

    const makeCompletionCall = async () => {
      let resolvedParams = completionParams

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

      this.log("debug", response_model.name, "making completion call with params: ", resolvedParams)

      const completion = await this.client.chat.completions.create(resolvedParams)

      const parsedCompletion = OAIResponseParser(
        completion as OpenAI.Chat.Completions.ChatCompletion
      )
      try {
        return JSON.parse(parsedCompletion) as z.infer<T>
      } catch (error) {
        this.log("error", "failed to parse completion", parsedCompletion, this.mode)
      }
    }

    const makeCompletionCallWithRetries = async () => {
      try {
        const data = await makeCompletionCall()

        const validation = await response_model.schema.safeParseAsync(data)
        this.log("debug", response_model.name, "Completion validation: ", validation)

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
          this.log("debug", response_model.name, "Retrying, attempt: ", attempts)
          attempts++
          return await makeCompletionCallWithRetries()
        } else {
          this.log("debug", response_model.name, "Max attempts reached: ", attempts)
          throw error
        }
      }
    }

    return makeCompletionCallWithRetries()
  }

  private async chatCompletionStream<T extends z.AnyZodObject>({
    max_retries,
    response_model,
    ...params
  }: ChatCompletionCreateParamsWithModel<T>): Promise<AsyncGenerator<Partial<T>, void, unknown>> {
    if (max_retries) {
      this.log("warn", "max_retries is not supported for streaming completions")
    }

    const completionParams = withResponseModel({
      params: {
        ...params,
        stream: true
      },
      response_model,
      mode: this.mode
    })

    const streamClient = new ZodStream({
      debug: this.debug ?? false
    })

    return streamClient.create({
      completionPromise: async () => {
        const completion = await this.client.chat.completions.create(completionParams)

        return OAIStream({
          res: completion
        })
      },
      response_model
    })
  }

  private isChatCompletionCreateParamsWithModel<T extends z.AnyZodObject>(
    params: ChatCompletionCreateParamsWithModel<T>
  ): params is ChatCompletionCreateParamsWithModel<T> {
    return "response_model" in params
  }

  private isStandardStream(
    params: OpenAI.ChatCompletionCreateParams
  ): params is OpenAI.ChatCompletionCreateParams {
    return "stream" in params && params.stream === true
  }

  public chat = {
    completions: {
      create: async <
        T extends z.AnyZodObject,
        P extends T extends z.AnyZodObject ? ChatCompletionCreateParamsWithModel<T>
        : OpenAI.ChatCompletionCreateParams & { response_model: never }
      >(
        params: P
      ): Promise<ReturnTypeBasedOnParams<P>> => {
        this.validateModelModeSupport(params)

        if (this.isChatCompletionCreateParamsWithModel(params)) {
          if (params.stream) {
            return this.chatCompletionStream(params) as ReturnTypeBasedOnParams<
              P & { stream: true }
            >
          } else {
            return this.chatCompletionStandard(params) as ReturnTypeBasedOnParams<P>
          }
        } else {
          const result: OpenAI.Chat.Completions.ChatCompletion =
            this.isStandardStream(params) ?
              await this.client.chat.completions.create(params)
            : await this.client.chat.completions.create(params)

          return result as ReturnTypeBasedOnParams<P>
        }
      }
    }
  }
}

export type OAIClientExtended = OpenAI & Instructor

/**
 * Creates an instance of the `Instructor` class.
 * @param {OpenAI} client - The OpenAI client.
 * @param {string} mode - The mode of operation.
 * @param {boolean} debug - Whether to log debug messages.
 * @returns {OAIClientExtended} The extended OpenAI client.
 *
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
