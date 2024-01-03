import Intructor, { type OAIClientExtended } from "@/instructor"
import OpenAI from "openai"
import * as z from "zod"

const Validator = z.object({
  valid: z
    .boolean()
    .default(true)
    .describe("Whether the attribute is valid based on the requirements"),
  reason: z
    .string()
    .optional()
    .describe("The error message if the attribute is not valid, otherwise None"),
  suggestedValue: z
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

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function llm(v: any, ctx: z.RefinementCtx) {
    const response = await client.chat.completions.create({
      response_model: Validator,
      messages: [
        {
          role: "system",
          content: `# MISSION
You are a world class validation model. Capable to determine if the value provided is valid based on the statement given. If it is not, give a reason why and suggest a new value.
        `
        },
        {
          role: "user",
          content: `Does value ${v} follow the statement: ${statement}`
        }
      ],
      model,
      temperature
    })

    if (allowOverride && !response.valid && response.suggestedValue) {
      return response.fixedValue
    }
    // If the response is not valid, add the reason as an issue to zod so that
    // in the future it can generate a better response, via reasking mechanism.
    if (!response.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: response.reason
      })

      return z.NEVER
    }

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
