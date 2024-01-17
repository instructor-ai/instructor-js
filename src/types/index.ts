import OpenAI from "openai"
import type { ChatCompletionCreateParams } from "openai/resources/index.mjs"
import { Stream } from "openai/streaming.mjs"
import { z } from "zod"

import { MODE } from "@/constants/modes"

export type Mode = keyof typeof MODE
export type LogLevel = "debug" | "info" | "warn" | "error"

export type InstructorConfig = {
  client: OpenAI
  mode: Mode
  debug?: boolean
}

export type ResponseModel<T extends z.AnyZodObject> = {
  schema: T
  name: string
  description?: string
}

export type InstructorChatCompletionParams<T extends z.AnyZodObject> = {
  response_model: ResponseModel<T>
  max_retries?: number
}

export type ChatCompletionCreateParamsWithModel<T extends z.AnyZodObject> =
  InstructorChatCompletionParams<T> & ChatCompletionCreateParams

export type ReturnWithoutModel<P> = P extends { stream: true }
  ? Stream<OpenAI.Chat.Completions.ChatCompletionChunk>
  : OpenAI.Chat.Completions.ChatCompletion

export type ReturnTypeBasedOnParams<P> = P extends {
  stream: true
  response_model: ResponseModel<infer T>
}
  ? Promise<AsyncGenerator<Partial<z.infer<T>>, void, unknown>>
  : P extends { response_model: ResponseModel<infer T> }
    ? Promise<z.infer<T>>
    : P extends { stream: true }
      ? Stream<OpenAI.Chat.Completions.ChatCompletionChunk>
      : OpenAI.Chat.Completions.ChatCompletion
