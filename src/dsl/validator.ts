import { OAIClientExtended } from "@/instructor"
import type { ChatCompletionCreateParams } from "openai/resources/chat/completions.mjs"
import { RefinementCtx, z } from "zod"

type AsyncSuperRefineFunction = (data: string, ctx: RefinementCtx) => Promise<void>

export const LLMValidator = (
  instructor: OAIClientExtended,
  statement: string,
  params: Omit<ChatCompletionCreateParams, "messages">
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
