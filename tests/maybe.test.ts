import { maybe } from "@/dsl/maybe"
import Instructor from "@/instructor"
import { describe, expect, test } from "bun:test"
import OpenAI from "openai"
import { z } from "zod"

async function maybeExtractUser(content: string) {
  const UserSchema = z.object({
    age: z.number(),
    name: z.string()
  })

  const MaybeUserSchema = maybe(UserSchema)

  const oai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? undefined,
    organization: process.env.OPENAI_ORG_ID ?? undefined
  })

  const client = Instructor({
    client: oai,
    mode: "TOOLS"
  })

  const user = await client.chat.completions.create({
    messages: [{ role: "user", content: "Extract " + content }],
    model: "gpt-4o",
    response_model: { schema: MaybeUserSchema, name: "User" },
    max_retries: 3,
    seed: 1
  })

  return user
}

describe("Maybe", () => {
  test("Should properly extract name and age from content", async () => {
    const user = await maybeExtractUser("Jason Liu is 30 years old")
    expect(user.error).toBeFalse()
    expect(user.message).toBeUndefined()
    expect(user.result?.name).toEqual("Jason Liu")
    expect(user.result?.age).toEqual(30)
  })

  // test("Should return error if unable to parse content", async () => {
  //   const user = await maybeExtractUser("Unknown user")

  //   expect(user?.message).toBeString()
  //   expect(user?.error).toBeTrue()
  //   expect(user?.result).toBeUndefined()
  // })
})
