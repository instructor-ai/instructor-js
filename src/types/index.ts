import OpenAI from "openai"
import { Stream } from "openai/streaming"
import { z } from "zod"
import {
  CompletionMeta,
  type Mode as ZMode,
  type ResponseModel as ZResponseModel
} from "zod-stream"

export type LogLevel = "debug" | "info" | "warn" | "error"

export type Mode = ZMode
export type ResponseModel<T extends z.AnyZodObject> = ZResponseModel<T>

export type InstructorConfig = {
  client: OpenAI
  mode: Mode
  debug?: boolean
}

export type InstructorChatCompletionParams<T extends z.AnyZodObject> = {
  response_model: ResponseModel<T>
  max_retries?: number
}

export type ChatCompletionCreateParamsWithModel<T extends z.AnyZodObject> =
  InstructorChatCompletionParams<T> & OpenAI.ChatCompletionCreateParams

export type ReturnWithoutModel<P> =
  P extends { stream: true } ? OpenAI.Chat.Completions.ChatCompletion
  : OpenAI.Chat.Completions.ChatCompletion

export type ReturnTypeBasedOnParams<P> =
  P extends (
    {
      stream: true
      response_model: ResponseModel<infer T>
    }
  ) ?
    Promise<AsyncGenerator<Partial<z.infer<T>> & { _meta: CompletionMeta }, void, unknown>>
  : P extends { response_model: ResponseModel<infer T> } ? Promise<z.infer<T>>
  : P extends { stream: true } ? Stream<OpenAI.Chat.Completions.ChatCompletionChunk>
  : OpenAI.Chat.Completions.ChatCompletion
