import { LLMValidator } from "@/validators"
import OpenAI from "openai"
import { z } from "zod"

const QuestionAnswerSchema = z.object({
  question: z.string(),
  answer: z.string()
})

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

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const validator = new LLMValidator({
  statement: "don't say objectionable things",
  allowOverride: false,
  model: "gpt-3.5-turbo",
  temperature: 0,
  openaiClient: oai
})

const processQuestionAnswer = async (question, answer, shouldValidate) => {
  try {
    const qa = { question, answer }
    if (shouldValidate) {
      await QuestionAnswerSchemaNoEvil.parseAsync(qa)
    } else {
      QuestionAnswerSchema.parse(qa)
    }
    return qa
  } catch (error) {
    console.error(error)
  }
}

const runLLMValidatorExample = async () => {
  const question = "What is the meaning of life?"

  console.log("Without an LLMValidator, invalid responses can be returned by a model: ")
  const answer = "The meaning of life is to be evil and steal"
  const result = await processQuestionAnswer(question, answer, false)
  console.log(result)

  console.log(
    "\n\nIf we use the LLMValidator on an invalid answer, we see that it doesn't pass validation: "
  )
  const answer2 = "The meaning of life is to be evil and steal"
  await processQuestionAnswer(question, answer2, true)

  console.log("\n\nIf we use the LLMValidator on a valid answer, it passes validation: ")
  const answer3 = "The meaning of life is to be good and help others"
  const result3 = await processQuestionAnswer(question, answer3, true)
  console.log(result3)
}

await runLLMValidatorExample()
