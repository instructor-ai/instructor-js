// cases of type inference testing:
// 1. no response_model, stream
// 2. no response_model, no stream
// 3. response_model, stream, no max_retries
// 4. response_model, no stream, no max_retries
// 5. response_model, stream, max_retries
// 6. response_model, no stream, max_retries

import Instructor from "@/instructor"
import { type CompletionMeta } from "@/types"
import { describe, expect, test } from "bun:test"
import OpenAI from "openai"
import { Stream } from "openai/streaming"
import { type } from "ts-inference-check"
import { z } from "zod"

describe("Inference Checking", () => {
  const UserSchema = z.object({
    age: z.number(),
    name: z.string()
  })

  const oai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? undefined,
    organization: process.env.OPENAI_ORG_ID ?? undefined
  })

  const client = Instructor({
    client: oai,
    mode: "FUNCTIONS"
  })

  test("no response_model, no stream", async () => {
    const user = await client.chat.completions.create({
      messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
      model: "gpt-4o",
      seed: 1,
      stream: false
    })

    expect(type(user).strictly.is<OpenAI.Chat.ChatCompletion>(true)).toBe(true)
  })

  test("no response_model, stream", async () => {
    const userStream = await client.chat.completions.create({
      messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
      model: "gpt-4o",
      seed: 1,
      stream: true
    })

    expect(
      type(userStream).strictly.is<Stream<OpenAI.Chat.Completions.ChatCompletionChunk>>(true)
    ).toBe(true)
  })

  test("response_model, no stream", async () => {
    const user = await client.chat.completions.create({
      messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
      model: "gpt-4o",
      response_model: { schema: UserSchema, name: "User" },
      seed: 1,
      stream: false
    })

    expect(
      type(user).strictly.is<z.infer<typeof UserSchema> & { _meta?: CompletionMeta }>(true)
    ).toBe(true)
  })

  test("response_model, stream", async () => {
    const userStream = await client.chat.completions.create({
      messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
      model: "gpt-4o",
      response_model: { schema: UserSchema, name: "User" },
      seed: 1,
      stream: true
    })

    expect(
      type(userStream).strictly.is<
        AsyncGenerator<
          Partial<{
            name: string
            age: number
          }> & { _meta?: CompletionMeta },
          void,
          unknown
        >
      >(true)
    ).toBe(true)
  })

  test("response_model, stream, max_retries", async () => {
    const userStream = await client.chat.completions.create({
      messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
      model: "gpt-4o",
      response_model: { schema: UserSchema, name: "User" },
      seed: 1,
      stream: true,
      max_retries: 3
    })

    expect(
      type(userStream).strictly.is<
        AsyncGenerator<
          Partial<{
            name: string
            age: number
          }> & { _meta?: CompletionMeta },
          void,
          unknown
        >
      >(true)
    ).toBe(true)
  })

  test("response_model, no stream, max_retries", async () => {
    const user = await client.chat.completions.create({
      messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
      model: "gpt-4o",
      response_model: { schema: UserSchema, name: "User" },
      seed: 1,
      max_retries: 3
    })

    expect(
      type(user).strictly.is<z.infer<typeof UserSchema> & { _meta?: CompletionMeta }>(true)
    ).toBe(true)
  })
})
