import { moderationValidator } from "@/dsl/validator"
import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

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
}

try {
  await Response.parseAsync({ message: "I want to hurt myself." })
} catch (error) {
  console.log(error)
}
