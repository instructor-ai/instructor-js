import assert from "assert"
import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

enum MULTI_CLASSIFICATION_LABELS {
  "BILLING" = "billing",
  "GENERAL_QUERY" = "general_query",
  "HARDWARE" = "hardware"
}

const MultiClassificationSchema = z.object({
  predicted_labels: z.array(z.nativeEnum(MULTI_CLASSIFICATION_LABELS))
})

type MultiClassification = z.infer<typeof MultiClassificationSchema>

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "FUNCTIONS"
})

const createClassification = async (data: string): Promise<MultiClassification | undefined> => {
  const classification: MultiClassification = await client.chat.completions.create({
    messages: [{ role: "user", content: `"Classify the following support ticket: ${data}` }],
    model: "gpt-3.5-turbo",
    response_model: MultiClassificationSchema,
    max_retries: 3
  })

  return classification || undefined
}

const classification = await createClassification(
  "My account is locked and I can't access my billing info. Phone is also broken"
)
// OUTPUT: { predicted_labels: [ 'billing', 'hardware' ] }

console.log({ classification })

assert(
  classification?.predicted_labels.includes(MULTI_CLASSIFICATION_LABELS.BILLING) &&
    classification?.predicted_labels.includes(MULTI_CLASSIFICATION_LABELS.HARDWARE),
  `Expected ${classification?.predicted_labels} to include ${MULTI_CLASSIFICATION_LABELS.BILLING} and ${MULTI_CLASSIFICATION_LABELS.HARDWARE}`
)
