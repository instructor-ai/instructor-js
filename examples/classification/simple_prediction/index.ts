import assert from "assert"
import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

enum CLASIFICATION_LABELS {
  "SPAM" = "SPAM",
  "NOT_SPAM" = "NOT_SPAM"
}

const SimpleClasificationSchema = z.object({
  class_label: z.nativeEnum(CLASIFICATION_LABELS)
})

type SimpleClasification = z.infer<typeof SimpleClasificationSchema>

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "FUNCTIONS"
})

const createClasification = async (data: string): Promise<SimpleClasification | undefined> => {
  const clasification: SimpleClasification = await client.chat.completions.create({
    messages: [{ role: "user", content: `"Classify the following text: ${data}` }],
    model: "gpt-3.5-turbo",
    response_model: SimpleClasificationSchema,
    max_retries: 3
  })

  return clasification || undefined
}

const clasification = await createClasification(
  "Hello there I'm a nigerian prince and I want to give you money"
)
// OUTPUT: { class_label: 'SPAM' }

console.log({ clasification })

assert(
  clasification.class_label === CLASIFICATION_LABELS.SPAM,
  `Expected ${clasification.class_label} to be ${CLASIFICATION_LABELS.SPAM}`
)
