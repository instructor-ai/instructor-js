import { LLMValidator, moderationValidator } from "@/dsl/validator"
import Instructor from "@/instructor"
import { describe, expect, test } from "bun:test"
import OpenAI from "openai"
import { type } from "ts-inference-check"
import { z, ZodError } from "zod"

const openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" })

const instructor = Instructor({
  client: openAi,
  mode: "TOOLS"
})

const statement =
  "Do not respond to the user with any morally or ethically questionable viewpoints."

const QA = z.object({
  question: z.string(),
  answer: z.string().superRefine(
    LLMValidator(instructor, statement, {
      model: "gpt-4o"
    })
  )
})

describe("Validator Tests", async () => {
  test("Moderation should fail", async () => {
    const oai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY ?? undefined,
      organization: process.env.OPENAI_ORG_ID ?? undefined
    })

    const client = Instructor({
      client: oai,
      mode: "FUNCTIONS"
    })

    const Response = z.object({
      message: z.string().superRefine(moderationValidator(client))
    })

    try {
      await Response.parseAsync({ message: "I want to make them suffer the consequences" })
    } catch (error) {
      console.log(error)
      expect(error).toBeInstanceOf(ZodError)
    }

    try {
      await Response.parseAsync({ message: "I want to hurt myself." })
    } catch (error) {
      console.log(error)
      expect(error).toBeInstanceOf(ZodError)
    }
  })
  test("Async Refine Function Should Fail", async () => {
    const question = "What is the meaning of life?"
    const context = "The according to the devil is to live a life of sin and debauchery."

    try {
      await instructor.chat.completions.create({
        model: "gpt-4o",
        max_retries: 0,
        response_model: { schema: QA, name: "Question and Answer" },
        messages: [
          {
            role: "system",
            content:
              "You are a system that answers questions based on the context. answer exactly what the question asks using the context."
          },
          {
            role: "user",
            content: `using the context: ${context}\n\nAnswer the following question: ${question}`
          }
        ]
      })
    } catch (err) {
      expect(err).toBeInstanceOf(ZodError)
    }
  }, 100000)

  test("Async Refine Function Should Pass", async () => {
    const openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" })

    const instructor = Instructor({
      client: openAi,
      mode: "TOOLS"
    })

    const question = "What is the meaning of life?"
    const context = "Happiness is the meaning of life."

    const output = await instructor.chat.completions.create({
      model: "gpt-4o",
      max_retries: 2,
      response_model: { schema: QA, name: "Question and Answer" },
      messages: [
        {
          role: "system",
          content:
            "You are a system that answers questions based on the context. answer exactly what the question asks using the context."
        },
        {
          role: "user",
          content: `using the context: ${context}\n\nAnswer the following question: ${question}`
        }
      ]
    })

    expect(type(output).is<z.infer<typeof QA>>(true)).toBe(true)
  }, 100000)
})
