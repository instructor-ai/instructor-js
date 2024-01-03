import Instructor from "@/instructor"
import { describe, expect, test } from "bun:test"
import OpenAI from "openai"
import { z } from "zod"

async function extractUser() {
  const UserSchema = z.object({
    age: z.number(),
    name: z.string()
  })

  type User = z.infer<typeof UserSchema>

  const oai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? undefined,
    organization: process.env.OPENAI_ORG_ID ?? undefined
  })

  const client = Instructor({
    client: oai,
    mode: "FUNCTIONS"
  })

  const user: User = await client.chat.completions.create({
    messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
    model: "gpt-3.5-turbo",
    response_model: UserSchema
  })

  return user
}

async function extractUserValidated() {
  const UserSchema = z.object({
    age: z.number(),
    name: z
      .string()
      .refine(name => name === name.toUpperCase(), {
        message: "Name must be uppercase, please try again"
      })
      .describe("The users name, all uppercase")
  })

  type User = z.infer<typeof UserSchema>

  const oai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? undefined,
    organization: process.env.OPENAI_ORG_ID ?? undefined
  })

  const client = Instructor({
    client: oai,
    mode: "TOOLS"
  })

  const user: User = await client.chat.completions.create({
    messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
    model: "gpt-3.5-turbo",
    response_model: UserSchema,
    max_retries: 3
  })

  return user
}

async function extractUserMany() {
  const UserSchema = z.object({
    age: z.number(),
    name: z.string()
  })

  const UsersSchema = z
    .object({
      users: z.array(UserSchema)
    })
    .describe("Correctly formatted list of users")

  type Users = z.infer<typeof UsersSchema>

  const oai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? undefined,
    organization: process.env.OPENAI_ORG_ID ?? undefined
  })

  const client = Instructor({
    client: oai,
    mode: "FUNCTIONS"
  })

  const user: Users = await client.chat.completions.create({
    messages: [{ role: "user", content: "Jason is 30 years old, Sarah is 12" }],
    model: "gpt-3.5-turbo",
    response_model: UsersSchema,
    max_retries: 3
  })

  return user
}

describe("FunctionCall", () => {
  test("Should return extracted name and age based on schema", async () => {
    const user = await extractUser()

    expect(user.name).toEqual("Jason Liu")
    expect(user.age).toEqual(30)
  })
})

describe("FunctionCallValidated", () => {
  test("Name should be uppercase based on validation check", async () => {
    const user = await extractUserValidated()

    expect(user.name).toEqual("JASON LIU")
    expect(user.age).toEqual(30)
  })
})

describe("FunctionCallMany", () => {
  test("Should return extracted name and age based on schema", async () => {
    const users = await extractUserMany()
    expect(users.users[0].name).toEqual("Jason")
    expect(users.users[0].age).toEqual(30)
    expect(users.users[1].name).toEqual("Sarah")
    expect(users.users[1].age).toEqual(12)
  })
})
