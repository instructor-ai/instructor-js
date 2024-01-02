import assert from "assert"
import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

enum CLASIFICATION_LABELS {
  "SPAM" = "SPAM",
  "NOT_SPAM" = "NOT_SPAM"
}

const SimgpleClasificationSchema = z.object({
  class_label: z.nativeEnum(CLASIFICATION_LABELS)
})

type SimpleClasification = z.infer<typeof SimgpleClasificationSchema>

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "FUNCTIONS"
})

const createClasification = async (data: string): Promise<SimpleClasification | undefined> => {
  const clasification = (await client.chat.completions.create({
    messages: [{ role: "user", content: `"Classify the following text: ${data}` }],
    model: "gpt-3.5-turbo",
    //@ts-expect-error same as above
    response_model: SimgpleClasificationSchema,
    max_retries: 3
  })) as SimpleClasification

  return clasification || undefined
}

const clasification = await createClasification(
  "Hello there I'm a nigerian prince and I want to give you money"
)

console.log({ clasification })

assert(
  clasification.class_label === CLASIFICATION_LABELS.SPAM,
  `Expected ${clasification.class_label} to be ${CLASIFICATION_LABELS.SPAM}`
)

console.log(clasification)
