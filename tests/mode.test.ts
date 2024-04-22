import Instructor from "@/instructor"
import { describe, expect, test } from "bun:test"
import OpenAI from "openai"
import { z } from "zod"
import { type Mode } from "zod-stream"

import { MODE, Provider, PROVIDER_SUPPORTED_MODES_BY_MODEL, PROVIDERS } from "@/constants/providers"

const default_oai_model = "gpt-4-turbo"
const default_anyscale_model = "mistralai/Mixtral-8x7B-Instruct-v0.1"
const default_together_model = "mistralai/Mixtral-8x7B-Instruct-v0.1"
const default_groq_model = "llama3-70b-8192"

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
  },
  [PROVIDERS.GROQ]: {
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY
  }
}

const createTestCases = (): {
  model: string
  mode: Mode
  provider: Provider
  defaultMessage?: OpenAI.ChatCompletionMessageParam
}[] => {
  const testCases: {
    model: string
    mode: Mode
    provider: Provider
    defaultMessage?: OpenAI.ChatCompletionMessageParam
  }[] = []

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
          if (mode === MODE.MD_JSON) {
            // Skip MD_JSON for Anyscale - its somewhat supported but super flakey
            return
          }

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

      if (provider === PROVIDERS.GROQ) {
        Object.entries(modesByModel).forEach(([mode, models]: [Mode, string[]]) => {
          if (models.includes("*")) {
            testCases.push({
              model: default_groq_model,
              mode,
              provider,
              defaultMessage: {
                role: "system",
                content:
                  "You are a function calling LLM that uses the data extracted from the User function to extract user data from the user prompt."
              }
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
  name: z.string()
})

async function extractUser(
  model: string,
  mode: Mode,
  provider: Provider,
  defaultMessage?: OpenAI.ChatCompletionMessageParam
) {
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
    messages: [
      ...(defaultMessage ? [defaultMessage] : []),
      { role: "user", content: "Jason Liu is 30 years old" }
    ],
    model: model,
    response_model: { schema: UserSchema, name: "User" },
    max_retries: 4
  })

  return user
}

describe("Modes", async () => {
  const testCases = createTestCases()

  for await (const { model, mode, provider, defaultMessage } of testCases) {
    if (provider !== PROVIDERS.GROQ) {
      test(`${provider}: Should return extracted name and age for model ${model} and mode ${mode}`, async () => {
        const user = await extractUser(model, mode, provider, defaultMessage)

        expect(user.name).toEqual("Jason Liu")
        expect(user.age).toEqual(30)
      })
    } else {
      test.todo(
        `${provider}: Should return extracted name and age for model ${model} and mode ${mode}`,
        async () => {
          const user = await extractUser(model, mode, provider, defaultMessage)

          expect(user.name).toEqual("Jason Liu")
          expect(user.age).toEqual(30)
        }
      )
    }
  }
})
