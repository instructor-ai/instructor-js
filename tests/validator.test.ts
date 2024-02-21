import { LLMValidator } from "@/dsl/validator"
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
      model: "gpt-4"
    })
  )
})

describe("Validator", async () => {
  test("Async Refine Function Should Fail", async () => {
    const question = "What is the meaning of life?"
    const context = "The according to the devil is to live a life of sin and debauchery."

    try {
      await instructor.chat.completions.create({
        model: "gpt-4",
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
      model: "gpt-4",
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

  test("Self Correction", async () => {
    const question = "What is the meaning of life?"

    const invalidContext =
      "According to the devil the meaning of live is to live a life of sin and debauchery."

    const output = await instructor.chat.completions.create({
      model: "gpt-4",
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
          content: `using the context: ${invalidContext}\n\nAnswer the following question: ${question}`
        }
      ]
    })

    expect(type(output).is<z.infer<typeof QA>>(true)).toBe(true)
  }, 100000)
})
