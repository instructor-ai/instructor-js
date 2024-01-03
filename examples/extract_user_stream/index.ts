import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

const UserSchema = z.object({
  age: z.number(),
  name: z.string().refine(name => name.includes(" "), {
    message: "Name must contain a space"
  }),
  thingsThatAreTheSameAgeAsTheUser: z
    .array(z.string(), {
      description: "a list of random things that are the same age as the user"
    })
    .min(6)
})

type User = Partial<z.infer<typeof UserSchema>>

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "TOOLS"
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
      process.stdout.write(`\r final: ${JSON.stringify(result)}\n`)
      break
    }

    const chunkValue = decoder.decode(value)
    result = JSON.parse(chunkValue)
    process.stdout.write(`\r streaming: ${JSON.stringify(result)}`)
  } catch (e) {
    done = true
    console.log(e)
    break
  }
}
