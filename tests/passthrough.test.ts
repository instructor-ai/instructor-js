import Instructor from "@/instructor"
import { expect, test } from "bun:test"
import OpenAI from "openai"
import { Stream } from "openai/streaming.mjs"
import { type } from "ts-inference-check"

test("Passthrough from instruct to openai", async () => {
  const oai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? undefined,
    organization: process.env.OPENAI_ORG_ID ?? undefined
  })

  const client = Instructor({
    client: oai,
    mode: "FUNCTIONS"
  })

  // ensures that when no `response_model` is provided, the response type is `ChatCompletion`
  const completionOpenAI = await client.chat.completions.create({
    messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
    model: "gpt-3.5-turbo",
    seed: 1
  })

  expect(type(completionOpenAI).strictly.is<OpenAI.Chat.ChatCompletion>(true)).toBeTrue()

  const completionOpenAIStreaming = await client.chat.completions.create({
    messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
    model: "gpt-3.5-turbo",
    seed: 1,
    stream: true
  })

  expect(
    type(completionOpenAIStreaming).strictly.is<
      Stream<OpenAI.Chat.Completions.ChatCompletionChunk>
    >(true)
  ).toBeTrue()
})
