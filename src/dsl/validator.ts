import { OAIClientExtended } from "@/instructor"
import OpenAI from "openai"
import { RefinementCtx, z } from "zod"

type AsyncSuperRefineFunction = (data: string, ctx: RefinementCtx) => Promise<void>

export const LLMValidator = (
  instructor: OAIClientExtended,
  statement: string,
  params: Omit<OpenAI.ChatCompletionCreateParams, "messages">
): AsyncSuperRefineFunction => {
  const schema = z.object({
    isValid: z.boolean(),
    reason: z.string().optional()
  })

  return async (value, ctx) => {
    const validated = await instructor.chat.completions.create({
      max_retries: 0,
      ...params,
      response_model: { schema, name: "Validator" },
      stream: false,
      messages: [
        {
          role: "system",
          content:
            "You are a world class validation model. Capable to determine if the following value is valid for the statement, if it is not, explain why and suggest a new value."
        },
        {
          role: "user",
          content: `Does \`${value}\` follow the rules: ${statement}`
        }
      ]
    })

    if (!validated.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: validated.reason
      })
    }
  }
}

export const moderationValidator = (client: OAIClientExtended | OpenAI) => {
  return async (value: string, ctx: z.RefinementCtx) => {
    try {
      const response = await client.moderations.create({ input: value })
      const flaggedResults = response.results.filter(result => result.flagged)

      if (flaggedResults.length > 0) {
        const flaggedCategories: string[] = []
        flaggedResults.forEach(result => {
          Object.keys(result.categories).forEach(category => {
            if (result.categories[category] === true) {
              flaggedCategories.push(category)
            }
          })
        })

        if (flaggedCategories.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Moderation error, \`${value}\` was flagged for ${flaggedCategories.join(", ")}`
          })
        }
      }
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Unexpected error during moderation: ${error instanceof Error ? error.message : "Unknown error"}`
      })
    }
  }
}
