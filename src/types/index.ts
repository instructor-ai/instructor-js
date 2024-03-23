import OpenAI from "openai"
import { Stream } from "openai/streaming"
import { z } from "zod"
import {
  CompletionMeta as ZCompletionMeta,
  type Mode as ZMode,
  type ResponseModel as ZResponseModel
} from "zod-stream"

export type GenericCreateParams = Omit<Partial<OpenAI.ChatCompletionCreateParams>, "model"> & {
  model: string
  messages: OpenAI.ChatCompletionCreateParams["messages"]
  stream?: boolean
  max_tokens?: number | null
}

export type GenericChatCompletion = Partial<OpenAI.Chat.Completions.ChatCompletion> & {
  [key: string]: unknown
}

export type GenericChatCompletionStream = AsyncIterable<
  Partial<OpenAI.Chat.Completions.ChatCompletionChunk> & { [key: string]: unknown }
>

export type CreateMethodReturnType<
  P extends GenericCreateParams,
  Completion = GenericChatCompletion,
  Chunk = GenericChatCompletionStream
> = P extends { stream: true } ? Promise<Chunk> : Promise<Completion>

export type OpenAILikeClient<
  P extends GenericCreateParams = GenericCreateParams,
  Completion = GenericChatCompletion,
  Chunk = GenericChatCompletionStream
> =
  | OpenAI
  | {
      baseURL: string
      chat: {
        completions: {
          create: (params: P) => CreateMethodReturnType<P, Completion, Chunk>
        }
      }
    }

export type LogLevel = "debug" | "info" | "warn" | "error"
export type CompletionMeta = Partial<ZCompletionMeta> & {
  usage?: OpenAI.CompletionUsage
}
export type Mode = ZMode
export type ResponseModel<T extends z.AnyZodObject> = ZResponseModel<T>

export interface InstructorConfig<C extends OpenAILikeClient> {
  client: C
  mode: Mode
  debug?: boolean
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
    Promise<AsyncGenerator<Partial<z.infer<T>> & { _meta?: CompletionMeta }, void, unknown>>
  : P extends { response_model: ResponseModel<infer T> } ?
    Promise<z.infer<T> & { _meta?: CompletionMeta }>
  : C extends OpenAI ?
    P extends { stream: true } ?
      Stream<OpenAI.Chat.Completions.ChatCompletionChunk>
    : OpenAI.Chat.Completions.ChatCompletion
  : P extends { stream: true } ? Promise<GenericChatCompletionStream>
  : Promise<GenericChatCompletion>
