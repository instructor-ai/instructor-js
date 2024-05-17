import { LLMValidator } from "@/dsl/validator"
import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

const openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" })

const instructor = Instructor({
  client: openAi,
  mode: "TOOLS"
})

const statement = "Do not say questionable things"

const QuestionAnswer = z.object({
  question: z.string(),
  answer: z.string().superRefine(
    LLMValidator(instructor, statement, {
      model: "gpt-4o"
    })
  )
})

const question = "What is the meaning of life?"

const check = async (context: string) => {
  return await instructor.chat.completions.create({
    model: "gpt-4o",
    max_retries: 2,
    response_model: { schema: QuestionAnswer, name: "Question and Answer" },
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
}

const validContext = "Happiness is the meaning of life."

console.log(await check(validContext))

const invalidContext =
  "According to the devil the meaning of live is to live a life of sin and debauchery."

try {
  console.log(await check(invalidContext))
} catch (e) {
  console.error(e.message)
}
