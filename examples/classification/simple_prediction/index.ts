import assert from "assert"
import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

enum CLASSIFICATION_LABELS {
  "SPAM" = "SPAM",
  "NOT_SPAM" = "NOT_SPAM"
}

const SimpleClassificationSchema = z.object({
  class_label: z.nativeEnum(CLASSIFICATION_LABELS)
})

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

const classification = await createClassification(
  "Hello there I'm a nigerian prince and I want to give you money"
)
// OUTPUT: { class_label: 'SPAM' }

console.log({ classification })

assert(
  classification?.class_label === CLASSIFICATION_LABELS.SPAM,
  `Expected ${classification?.class_label} to be ${CLASSIFICATION_LABELS.SPAM}`
)
