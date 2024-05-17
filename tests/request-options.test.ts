import Instructor from "@/instructor"
import { describe, expect, test } from "bun:test"
import OpenAI from "openai"
import { z } from "zod"

const UserSchema = z.object({
  age: z.number(),
  name: z.string().refine(name => name === name.toUpperCase(), {
    message: "Name must be uppercase, please try again"
  })
})

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "FUNCTIONS"
})

describe("callWithTimeout", () => {
  test("Should fail quick with low timeout", async () => {
    try {
      const user = await client.chat.completions.create(
        {
          messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
          model: "gpt-4o",
          response_model: { schema: UserSchema, name: "User" },
          max_retries: 3,
          seed: 1
        },
        {
          timeout: 10
        }
      )

      expect().toThrow()

      return user
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
    }
  })
})
