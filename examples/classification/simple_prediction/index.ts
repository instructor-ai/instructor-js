import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

export enum SIMPLE_CLASSIFICATION_LABELS {
  "SPAM" = "SPAM",
  "NOT_SPAM" = "NOT_SPAM"
}

const SimpleClassificationSchema = z.object({
  class_label: z.nativeEnum(SIMPLE_CLASSIFICATION_LABELS)
})

export type SimpleClassification = z.infer<typeof SimpleClassificationSchema>

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "FUNCTIONS"
})

const createClassification = async (data: string) => {
  const classification = await client.chat.completions.create({
    messages: [{ role: "user", content: `"Classify the following text: ${data}` }],
    model: "gpt-3.5-turbo",
    response_model: { schema: SimpleClassificationSchema, name: "SimpleClassification" },
    max_retries: 3,
    seed: 1
  })

  return classification
}

export const simpleClassification = await createClassification(
  "Hello there I'm a nigerian prince and I want to give you money"
)
// OUTPUT: { class_label: 'SPAM' }

// console.log({ classification })
