import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

export enum MULTI_CLASSIFICATION_LABELS {
  "BILLING" = "billing",
  "GENERAL_QUERY" = "general_query",
  "HARDWARE" = "hardware"
}

const MultiClassificationSchema = z.object({
  predicted_labels: z.array(z.nativeEnum(MULTI_CLASSIFICATION_LABELS))
})

export type MultiClassification = z.infer<typeof MultiClassificationSchema>

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "TOOLS"
})

const createClassification = async (data: string) => {
  const classification = await client.chat.completions.create({
    messages: [{ role: "user", content: `"Classify the following support ticket: ${data}` }],
    model: "gpt-3.5-turbo",
    response_model: { schema: MultiClassificationSchema, name: "MultiClassification" },
    max_retries: 3,
    seed: 1
  })

  return classification
}

export const multiClassification = await createClassification(
  "My account is locked and I can't access my billing info. Phone is also broken"
)
// OUTPUT: { predicted_labels: [ 'billing', 'hardware' ] }

// console.log({ multiClassification })
