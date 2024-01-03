import { llmValidator } from "@/dsl/validators"
import Instructor from "@/instructor"
import { describe, expect, test } from "bun:test"
import OpenAI from "openai"
import { SafeParseError, SafeParseSuccess, z } from "zod"

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "FUNCTIONS"
})

const QuestionAnswerSchema = z.object({
  question: z.string(),
  answer: z.string().transform(
    llmValidator({
      statement: "don't say objectionable things",
      openaiClient: client
    })
  )
})

type QuestionAnswer = z.infer<typeof QuestionAnswerSchema>

describe("Validator", async () => {
  test(`Should succeed in parsing`, async () => {
    const { success } = await QuestionAnswerSchema.safeParseAsync({
      question: "What is your name?",
      answer: "Jason Liu"
    })

    expect(success).toEqual(true)
  })

  test(`Should not succeed in parsing`, async () => {
    const { success, error } = (await QuestionAnswerSchema.safeParseAsync({
      question: "What is the meaning of life?",
      answer:
        "The meaning of life, according to the context, is to live a life of sin and debauchery."
    })) as SafeParseError<QuestionAnswer>

    expect(success).toEqual(false)
    expect(error).toBeDefined()
  })

  test(`Should not succeed and overrides value with fixedValue`, async () => {
    const ModifiedQuestionAnswer = QuestionAnswerSchema.extend({
      answer: z.string().transform(
        llmValidator({
          statement: "don't say objectionable things",
          allowOverride: true,
          openaiClient: client
        })
      )
    })
    const questionAnswerValue = {
      question: "What is the meaning of life?",
      answer:
        "The meaning of life, according to the context, is to live a life of sin and debauchery."
    }
    const { success, data } = (await ModifiedQuestionAnswer.safeParseAsync(
      questionAnswerValue
    )) as SafeParseSuccess<QuestionAnswer>

    expect(success).toEqual(true)
    expect(data).not.toEqual(questionAnswerValue.answer)
  })
})
