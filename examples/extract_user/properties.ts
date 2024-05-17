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
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "TOOLS"
})

const user = await client.chat.completions.create({
  messages: [{ role: "user", content: "Happy Potter" }],
  model: "gpt-4o",
  response_model: { schema: UserSchema, name: "User" },
  max_retries: 3,
  seed: 1
})

console.log(user)
/** 
 * {
  age: 17,
  name: "Happy Potter",
  properties: [
    {
      name: "Occupation",
      value: "Student",
    }, {
      name: "School",
      value: "Hogwarts School of Witchcraft and Wizardry",
    }
  ],
}
*/
