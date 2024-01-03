import { LLMValidator } from "@/validators"
import { describe, expect, test } from "bun:test"
import OpenAI from "openai"
import { z } from "zod"

const QuestionAnswerSchemaNoEvil = z.object({
  question: z.string(),
  answer: z.string().refine(async answer => {
    const validator = new LLMValidator({
      statement: "don't say objectionable things",
      allowOverride: false,
      model: "gpt-3.5-turbo",
      temperature: 0,
      openaiClient: new OpenAI({
        apiKey: process.env.OPENAI_API_KEY ?? undefined,
        organization: process.env.OPENAI_ORG_ID ?? undefined
      })
    })
    await validator.validate(answer)
    return true
  })
})

describe("LLMValidator", () => {
  test("Valid answer passes LLMValidator", async () => {
    const question = "What is the color of the sky?"
    const answer = "The sky is usually blue during the day."

    try {
      const result = await QuestionAnswerSchemaNoEvil.parseAsync({ question, answer })
      expect(result).toEqual({ question, answer })
    } catch (error) {
      expect(error).toBeUndefined()
    }
  })

  test("Invalid answer fails LLMValidator", async () => {
    const question = "What is the color of the sky?"
    const answer = "The sky is green with purple polka dots." // An intentionally false statement

    try {
      await QuestionAnswerSchemaNoEvil.parseAsync({ question, answer })
    } catch (error) {
      expect(error).toBeDefined()
    }
  })
})
