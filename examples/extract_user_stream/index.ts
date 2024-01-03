import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

const UserSchema = z.object({
  age: z.number(),
  name: z.string().refine(name => name.includes(" "), {
    message: "Name must contain a space"
  })
})

type User = Partial<z.infer<typeof UserSchema>>

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "FUNCTIONS"
})

const userStream = await client.chat.completions.create({
  messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
  model: "gpt-3.5-turbo",
  response_model: UserSchema,
  max_retries: 3,
  stream: true
})

const reader = userStream.readable.getReader()
const decoder = new TextDecoder()

let result: User = {}
let done = false

while (!done) {
  try {
    const { value, done: doneReading } = await reader.read()
    done = doneReading

    if (done) {
      break
    }

    const chunkValue = decoder.decode(value)
    result = JSON.parse(chunkValue)
    console.log(result)
  } catch (e) {
    done = true
    console.log(e)
    break
  }
}
