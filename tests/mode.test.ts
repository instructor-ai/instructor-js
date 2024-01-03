import Instructor from "@/instructor"
import { describe, expect, test } from "bun:test"
import OpenAI from "openai"
import { z } from "zod"

import { MODE } from "@/constants/modes"

const models_latest = ["gpt-3.5-turbo-1106", "gpt-4-1106-preview"]
const models_old = ["gpt-3.5-turbo", "gpt-4"]

const createTestCases = (): { model: string; mode: MODE }[] => {
  const { FUNCTIONS, ...rest } = MODE
  const modes = Object.values(rest)

  return [
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

type User = z.infer<typeof UserSchema>

async function extractUser(model: string, mode: MODE) {
  const oai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? undefined,
    organization: process.env.OPENAI_ORG_ID ?? undefined
  })

  const client = Instructor({
    client: oai,
    mode: mode
  })

  const user: User = await client.chat.completions.create({
    messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
    model: model,
    response_model: UserSchema,
    max_retries: 3
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
