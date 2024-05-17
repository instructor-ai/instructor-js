import OpenAI from "openai"
import { Stream } from "openai/streaming"
import { z } from "zod"
import {
  CompletionMeta as ZCompletionMeta,
  type Mode as ZMode,
  type ResponseModel as ZResponseModel
} from "zod-stream"

export type GenericCreateParams<M = unknown> = Omit<
  Partial<OpenAI.ChatCompletionCreateParams>,
  "model" | "messages"
> & {
  model: string
  messages: M[]
  stream?: boolean
  max_tokens?: number | null
  [key: string]: unknown
}

export type GenericRequestOptions = Partial<OpenAI.RequestOptions> & {
  [key: string]: unknown
}

export type GenericChatCompletion<T = unknown> = Partial<OpenAI.Chat.Completions.ChatCompletion> & {
  [key: string]: unknown
  choices?: T
}

export type GenericChatCompletionStream<T = unknown> = AsyncIterable<
  Partial<OpenAI.Chat.Completions.ChatCompletionChunk> & {
    [key: string]: unknown
    choices?: T
  }
>

export type GenericClient = {
  [key: string]: unknown
  baseURL?: string
  chat?: {
    completions?: {
      create?: (params: GenericCreateParams) => Promise<unknown>
    }
  }
}

export type ClientTypeChatCompletionParams<C> =
  C extends OpenAI ? OpenAI.ChatCompletionCreateParams : GenericCreateParams

export type ClientTypeChatCompletionRequestOptions<C> =
  C extends OpenAI ? OpenAI.RequestOptions : GenericRequestOptions

export type ClientType<C> =
  C extends OpenAI ? "openai"
  : C extends GenericClient ? "generic"
  : never

export type OpenAILikeClient<C> = C extends OpenAI ? OpenAI : C & GenericClient
export type SupportedInstructorClient = GenericClient | OpenAI
export type LogLevel = "debug" | "info" | "warn" | "error"

export type CompletionMeta = Partial<ZCompletionMeta> & {
  usage?: OpenAI.CompletionUsage
}

export type Mode = ZMode

export type ResponseModel<T extends z.AnyZodObject> = ZResponseModel<T>

export interface InstructorConfig<C> {
  client: OpenAILikeClient<C>
  mode: Mode
  debug?: boolean
  logger?: <T extends unknown[]>(level: LogLevel, ...args: T) => void
  retryAllErrors?: boolean
}

export type InstructorChatCompletionParams<T extends z.AnyZodObject> = {
  response_model: ResponseModel<T>
  max_retries?: number
}

export type ChatCompletionCreateParamsWithModel<T extends z.AnyZodObject> =
  InstructorChatCompletionParams<T> & GenericCreateParams

export type ReturnTypeBasedOnParams<C, P> =
  P extends (
    {
      stream: true
      response_model: ResponseModel<infer T>
    }
  ) ?
    AsyncGenerator<Partial<z.infer<T>> & { _meta?: CompletionMeta }, void, unknown>
  : P extends { response_model: ResponseModel<infer T> } ?
    Promise<z.infer<T> & { _meta?: CompletionMeta }>
  : C extends OpenAI ?
    P extends { stream: true } ?
      Stream<OpenAI.Chat.Completions.ChatCompletionChunk>
    : OpenAI.Chat.Completions.ChatCompletion
  : Promise<unknown>
