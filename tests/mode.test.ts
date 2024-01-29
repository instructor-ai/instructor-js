import Instructor from "@/instructor"
import { Mode } from "@/types"
import { describe, expect, test } from "bun:test"
import OpenAI from "openai"
import { z } from "zod"

import { MODE } from "@/constants/modes"

const models_latest = ["gpt-3.5-turbo-1106", "gpt-4-1106-preview"]
const models_old = ["gpt-3.5-turbo", "gpt-4"]
const models_anyscale = ["mistralai/Mistral-7B-Instruct-v0.1"]

const createTestCases = (): { model: string; mode: Mode }[] => {
  const { FUNCTIONS, JSON_SCHEMA, ...rest } = MODE
  const modes = Object.values(rest)

  return [
    ...models_anyscale.flatMap(model => ({ model, mode: JSON_SCHEMA })),
    ...models_latest.flatMap(model => modes.map(mode => ({ model, mode }))),
    ...models_old.flatMap(model => ({ model, mode: FUNCTIONS }))
  ]
}

const UserSchema = z.object({
  age: z.number(),
  name: z.string().refine(name => name.includes(" "), {
    message: "Name must contain a space"
  })
})

async function extractUser(model: string, mode: Mode) {
  const anyscale = mode === MODE.JSON_SCHEMA
  const oai = new OpenAI({
    baseURL: anyscale ? "https://api.endpoints.anyscale.com/v1" : undefined,
    apiKey: anyscale ? process.env.ANYSCALE_API_KEY : process.env.OPENAI_API_KEY ?? undefined,
    organization: process.env.OPENAI_ORG_ID ?? undefined
  })

  const client = Instructor({
    client: oai,
    mode: mode
  })

  const user = await client.chat.completions.create({
    messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
    model: model,
    response_model: { schema: UserSchema, name: "User" },
    max_retries: 4,
    seed: !anyscale ? 1 : undefined
  })

  return user
}

describe("Modes", async () => {
  const testCases = createTestCases()

  for await (const { model, mode } of testCases) {
    test(`Should return extracted name and age for model ${model} and mode ${mode}`, async () => {
      const user = await extractUser(model, mode)

      expect(user.name).toEqual("Jason Liu")
      expect(user.age).toEqual(30)
    })
  }
})
