import Instructor from "@/instructor"
import { describe, expect, test } from "bun:test"
import OpenAI from "openai"
import { z } from "zod"

async function extractUser({ schema }) {
  const oai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? undefined,
    organization: process.env.OPENAI_ORG_ID ?? undefined
  })

  const client = Instructor({
    client: oai,
    mode: "TOOLS"
  })

  const user = await client.chat.completions.create({
    messages: [{ role: "user", content: "do nothing" }],
    model: "gpt-4o",
    response_model: { schema: schema, name: "User" }
  })

  return user
}

describe("zod-schema test", () => {
  test("Should return default values", async () => {
    const UserSchema = z.object({
      age: z.number().default(30),
      name: z.string().default("Jason Liu"),
      favoriteFood: z.string().default("Pizza"),
      favoriteColor: z.string().default("Blue")
    })

    const user = await extractUser({
      schema: UserSchema
    })

    expect(user.name).toEqual("Jason Liu")
    expect(user.age).toEqual(30)
    expect(user.favoriteFood).toEqual("Pizza")
    expect(user.favoriteColor).toEqual("Blue")
  })
})
