import assert from "assert"
import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

enum MULTI_CLASIFICATION_LABELS {
  "BILLING" = "billing",
  "GENERAL_QUERY" = "general_query",
  "HARDWARE" = "hardware"
}

const MultiClasificationSchema = z.object({
  predicted_labels: z.array(z.nativeEnum(MULTI_CLASIFICATION_LABELS))
})

type MultiClasification = z.infer<typeof MultiClasificationSchema>

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "FUNCTIONS"
})

const createClasification = async (data: string): Promise<MultiClasification | undefined> => {
  const clasification = (await client.chat.completions.create({
    messages: [{ role: "user", content: `"Classify the following support ticket: ${data}` }],
    model: "gpt-3.5-turbo",
    //@ts-expect-error same as above
    response_model: MultiClasificationSchema,
    max_retries: 3
  })) as MultiClasification

  return clasification || undefined
}

const clasification = await createClasification(
  "My account is locked and I can't access my billing info. Phone is also broken"
)

console.log({ clasification })

assert(
  clasification.predicted_labels.includes(MULTI_CLASIFICATION_LABELS.BILLING) &&
    clasification.predicted_labels.includes(MULTI_CLASIFICATION_LABELS.HARDWARE),
  `Expected ${clasification.predicted_labels} to include ${MULTI_CLASIFICATION_LABELS.BILLING} and ${MULTI_CLASIFICATION_LABELS.HARDWARE}`
)
