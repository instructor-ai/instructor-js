import Intructor, { type OAIClientExtended } from "@/instructor"
import OpenAI from "openai"
import * as z from "zod"

const Validator = z.object({
  isValid: z
    .boolean()
    .default(true)
    .describe("Whether the attribute is valid based on the requirements"),
  reason: z
    .string()
    .optional()
    .describe("The error message if the attribute is not valid, otherwise None"),
  fixedValue: z
    .string()
    .optional()
    .describe("If the attribute is not valid, suggest a new value for the attribute")
})

export function llmValidator({
  statement,
  allowOverride = false,
  model = "gpt-3.5-turbo",
  temperature = 0,
  openaiClient
}: {
  statement: string
  allowOverride?: boolean
  model?: string
  temperature?: number
  openaiClient?: OAIClientExtended
}) {
  const client = openaiClient ?? Intructor({ client: new OpenAI(), mode: "FUNCTIONS" })

  async function llm(v) {
    const response = await client.chat.completions.create({
      response_model: Validator,
      messages: [
        {
          role: "system",
          content:
            "You are a world class validation model. Capable to determine if the following value is valid for the statement, if it is not, explain why and suggest a new value."
        },
        {
          role: "user",
          content: `Does ${v} follow the rules: ${statement}`
        }
      ],
      model,
      temperature
    })

    // If the response is not valid, return the reason, this could be used in
    // the future to generate a better response, via reasking mechanism.
    if (!response.isValid) return response.reason
    if (allowOverride && !response.isValid && response.fixedValue) return response.fixedValue

    return v
  }

  return llm
}

export function openaiModeration(openaiClient: OpenAI) {
  const client = openaiClient ?? new OpenAI()

  async function validateMessageWithOpenaiMod(v: string) {
    const response = await client.moderations.create({ input: v })
    const out = response.results[0]
    const categoryString = Object.keys(out.categories)
      .filter(k => out.categories[k])
      .map(c => out.categories[c])
      .join(", ")
    if (out.flagged) {
      throw Error(`${v} was flagged for ${categoryString}`)
    }

    return v
  }

  return validateMessageWithOpenaiMod
}
