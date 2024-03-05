import Instructor from "@/instructor"
import { describe, expect, test } from "bun:test"
import OpenAI from "openai"
import { z } from "zod"
import { type Mode } from "zod-stream"

import { Provider, PROVIDER_SUPPORTED_MODES_BY_MODEL, PROVIDERS } from "@/constants/providers"

const default_oai_model = "gpt-4-1106-preview"
const default_anyscale_model = "mistralai/Mixtral-8x7B-Instruct-v0.1"
const default_together_model = "mistralai/Mixtral-8x7B-Instruct-v0.1"

const provider_config = {
  [PROVIDERS.OAI]: {
    baseURL: "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY
  },
  [PROVIDERS.ANYSCALE]: {
    baseURL: "https://api.endpoints.anyscale.com/v1",
    apiKey: process.env.ANYSCALE_API_KEY
  },
  [PROVIDERS.TOGETHER]: {
    baseURL: "https://api.together.xyz",
    apiKey: process.env.TOGETHER_API_KEY
  }
}

const createTestCases = (): { model: string; mode: Mode; provider: Provider }[] => {
  const testCases: { model: string; mode: Mode; provider: Provider }[] = []

  Object.entries(PROVIDER_SUPPORTED_MODES_BY_MODEL[PROVIDERS.OAI]).forEach(
    ([mode, models]: [Mode, string[]]) => {
      if (models.includes("*")) {
        testCases.push({ model: default_oai_model, mode, provider: PROVIDERS.OAI })
      } else {
        models.forEach(model => testCases.push({ model, mode, provider: PROVIDERS.OAI }))
      }
    }
  )

  Object.entries(PROVIDER_SUPPORTED_MODES_BY_MODEL).forEach(
    ([provider, modesByModel]: [Provider, Record<Mode, string[]>]) => {
      if (provider === PROVIDERS.ANYSCALE) {
        Object.entries(modesByModel).forEach(([mode, models]: [Mode, string[]]) => {
          if (models.includes("*")) {
            testCases.push({
              model: default_anyscale_model,
              mode,
              provider
            })
          } else {
            models.forEach(model => testCases.push({ model, mode, provider }))
          }
        })
      }

      if (provider === PROVIDERS.TOGETHER) {
        Object.entries(modesByModel).forEach(([mode, models]: [Mode, string[]]) => {
          if (models.includes("*")) {
            testCases.push({
              model: default_together_model,
              mode,
              provider
            })
          } else {
            models.forEach(model => testCases.push({ model, mode, provider }))
          }
        })
      }
    }
  )

  return testCases
}

const UserSchema = z.object({
  age: z.number(),
  name: z.string().refine(name => name.includes(" "), {
    message: "Name must contain a space"
  })
})

async function extractUser(model: string, mode: Mode, provider: Provider) {
  const config = provider_config[provider]
  const oai = new OpenAI({
    ...config,
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
    max_retries: 4
  })

  return user
}

describe("Modes", async () => {
  const testCases = createTestCases()

  for await (const { model, mode, provider } of testCases) {
    test(`${provider}: Should return extracted name and age for model ${model} and mode ${mode}`, async () => {
      const user = await extractUser(model, mode, provider)

      expect(user.name).toEqual("Jason Liu")
      expect(user.age).toEqual(30)
    })
  }
})
