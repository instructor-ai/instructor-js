import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

const UserSchema = z.object({
  age: z.number(),
  name: z.string()
})

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "TOOLS"
})

const user = await client.chat.completions.create({
  messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
  model: "gpt-4o",
  response_model: {
    schema: UserSchema,
    name: "User"
  },
  max_retries: 3,
  seed: 1
})

console.log(user)

// {
//  age: 30,
//  name: "Jason Liu",
// }
