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

export const groq = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env["GROQ_API_KEY"]
})

const client = Instructor({
  client: groq,
  mode: "MD_JSON"
})

const user = await client.chat.completions.create({
  messages: [{ role: "user", content: "Harry Potter" }],
  model: "llama3-70b-8192",
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
