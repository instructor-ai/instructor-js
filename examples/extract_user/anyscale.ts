import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

const UserSchema = z.object({
  age: z.number(),
  name: z.string()
})

const oai = new OpenAI({
  baseURL: "https://api.endpoints.anyscale.com/v1",
  apiKey: process.env.ANYSCALE_API_KEY ?? undefined,
})

const client = Instructor({
  client: oai,
  mode: "JSON_SCHEMA"
})

const user = await client.chat.completions.create({
  messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
  model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
  response_model: UserSchema,
  max_retries: 3
})

console.log(user)
// {
//  age: 30,
//  name: "Jason Liu",
// }
