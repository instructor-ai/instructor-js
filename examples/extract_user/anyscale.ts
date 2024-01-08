import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

const property = z
  .object({
    name: z.string(),
    value: z.string()
  })
  .describe("A property defined by a name and value")

const UserSchema = z.object({
  age: z.number(),
  name: z.string(),
  properties: z.array(property)
})

const oai = new OpenAI({
  baseURL: "https://api.endpoints.anyscale.com/v1",
  apiKey: process.env.ANYSCALE_API_KEY ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "JSON_SCHEMA"
})

const user = await client.chat.completions.create({
  messages: [{ role: "user", content: "Harry Potter" }],
  model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
  response_model: { schema: UserSchema, name: "User" },
  max_retries: 3
})

console.log(user)
/**
 * {
  age: 17,
  name: "Harry Potter",
  properties: [
    {
      name: "House",
      value: "Gryffindor",
    }, {
      name: "Wand",
      value: "Holly and Phoenix feather",
    }
  ],
}
 */
