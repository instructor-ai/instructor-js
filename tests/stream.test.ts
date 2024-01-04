import Instructor from "@/instructor"
import { describe, expect, test } from "bun:test"
import OpenAI from "openai"
import { z } from "zod"

async function extractUser() {
  const UserSchema = z.object({
    age: z.number(),
    name: z.string().refine(name => name.includes(" "), {
      message: "Name must contain a space"
    }),
    thingsThatAreAsOldAsTheUser: z.array(z.string(), {
      description: "a list of random things that are the same age as the user"
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
    response_model: { UserSchema },
    max_retries: 3,
    stream: true
  })

  let user: User = {}

  for await (const result of userStream) {
    try {
      user = result
      expect(result).toHaveProperty("_isValid")
      expect(result).toHaveProperty("name")
      expect(result).toHaveProperty("age")
    } catch (e) {
      console.log(e)
      break
    }
  }

  return user
}

describe("StreamFunctionCall", () => {
  test("Should return extracted name and age based on schema and safe to parse json in stream", async () => {
    const user = await extractUser()

    expect(user.name).toEqual("Jason Liu")
    expect(user.age).toEqual(30)
  })
})
