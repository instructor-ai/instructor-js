import OpenAI from "openai"
import type { ChatCompletionCreateParams } from "openai/resources/index.mjs"
import { Stream } from "openai/streaming.mjs"
import { z } from "zod"

import { MODE } from "@/constants/modes"

export type Mode = keyof typeof MODE
export type StreamOutput = "READABLE" | "GENERATOR"

export type InstructorConfig = {
  client: OpenAI
  mode: Mode
  debug?: boolean
}

export type ResponseModel<T extends z.ZodTypeAny> = {
  schema: T
  name: string
  description?: string
}

export type InstructorChatCompletionParams<T extends z.ZodTypeAny> = {
  response_model: ResponseModel<T>
  max_retries?: number
  streamOutputType?: StreamOutput
}

export type ChatCompletionCreateParamsWithModel<T extends z.ZodTypeAny> =
  InstructorChatCompletionParams<T> & ChatCompletionCreateParams

export type StreamType<S, T extends z.ZodTypeAny> = S extends "READABLE"
  ? Promise<ReadableStream<Uint8Array>>
  : Promise<AsyncGenerator<Partial<T>, void, unknown>>

export type NonStreamType<T> = Promise<T>

export type ReturnWithModel<P, U extends z.ZodTypeAny, S extends StreamOutput> = P extends {
  stream: true
  response_model: ResponseModel<U>
}
  ? StreamType<S, U>
  : NonStreamType<U>

export type ReturnWithoutModel<P> = P extends { stream: true }
  ? Stream<OpenAI.Chat.Completions.ChatCompletionChunk>
  : OpenAI.Chat.Completions.ChatCompletion

export type ReturnTypeBasedOnParams<P> = P extends {
  stream: true
  streamOutputType: "READABLE"
  response_model: ResponseModel<infer T>
}
  ? ReadableStream<Uint8Array> & { _encodedType?: Partial<z.infer<T>> }
  : P extends {
        stream: true
        streamOutputType?: "GENERATOR"
        response_model: ResponseModel<infer T>
      }
    ? AsyncGenerator<Partial<z.infer<T>>, void, unknown>
    : P extends { response_model: ResponseModel<infer T> }
      ? Promise<z.infer<T>>
      : P extends { stream: true }
        ? Stream<OpenAI.Chat.Completions.ChatCompletionChunk>
        : OpenAI.Chat.Completions.ChatCompletion
