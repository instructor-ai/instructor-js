import Instructor from "@/index"
import { omit } from "@/lib"
import { describe, expect, test } from "bun:test"
import { createLLMClient } from "llm-polyglot"
import z from "zod"

const anthropicClient = createLLMClient({
  provider: "anthropic",
  apiKey: process.env.ANTHROPIC_API_KEY
})

describe("LLMClient Anthropic Provider - mode: TOOLS", () => {
  const instructor = Instructor({
    client: anthropicClient,
    mode: "TOOLS"
  })

  test("basic completion", async () => {
    const completion = await instructor.chat.completions.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: "My name is Dimitri Kennedy."
        }
      ],
      response_model: {
        name: "extract_name",
        schema: z.object({
          name: z.string()
        })
      }
    })

    expect(omit(["_meta"], completion)).toEqual({ name: "Dimitri Kennedy" })
  })

  test("complex schema", async () => {
    const completion = await instructor.chat.completions.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `User Data Submission:

            First Name: John
            Last Name: Doe
            Contact Details:
            Email: john.doe@example.com
            Phone Number: 555-1234
            Job History:
            
            Company Name: Acme Corp
            Role: Software Engineer
            Years: 5
            Company Name: Globex Inc.
            Role: Lead Developer
            Years: 3
            Skills:
            
            Programming
            Leadership
            Communication
            `
        }
      ],
      response_model: {
        name: "process_user_data",
        schema: z.object({
          story: z
            .string()
            .describe("A long and mostly made up story about the user - minimum 500 words"),
          userDetails: z.object({
            firstName: z.string(),
            lastName: z.string(),
            contactDetails: z.object({
              email: z.string(),
              phoneNumber: z.string().optional()
            })
          }),
          jobHistory: z.array(
            z.object({
              companyName: z.string(),
              role: z.string(),
              years: z.number().optional()
            })
          ),
          skills: z.array(z.string())
        })
      }
    })

    expect(omit(["_meta", "story"], completion)).toEqual({
      userDetails: {
        firstName: "John",
        lastName: "Doe",
        contactDetails: {
          email: "john.doe@example.com",
          phoneNumber: "555-1234"
        }
      },
      jobHistory: [
        {
          companyName: "Acme Corp",
          role: "Software Engineer",
          years: 5
        },
        {
          companyName: "Globex Inc.",
          role: "Lead Developer",
          years: 3
        }
      ],
      skills: ["Programming", "Leadership", "Communication"]
    })
  })
})

describe("LLMClient Anthropic Provider - mode: TOOLS - stream", () => {
  const instructor = Instructor({
    client: anthropicClient,
    mode: "TOOLS"
  })

  test("basic completion", async () => {
    const completion = await instructor.chat.completions.create({
      model: "claude-3-sonnet-20240229",
      stream: true,
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: "My name is Dimitri Kennedy."
        }
      ],
      response_model: {
        name: "extract_name",
        schema: z.object({
          name: z.string()
        })
      }
    })

    let final = {}

    for await (const result of completion) {
      final = result
    }

    //@ts-expect-error ignore for testing
    expect(omit(["_meta"], final)).toEqual({ name: "Dimitri Kennedy" })
  })

  test("complex schema", async () => {
    const completion = await instructor.chat.completions.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      stream: true,
      messages: [
        {
          role: "user",
          content: `User Data Submission:

            First Name: John
            Last Name: Doe
            Contact Details:
            Email: john.doe@example.com
            Phone Number: 555-1234
            Job History:
            
            Company Name: Acme Corp
            Role: Software Engineer
            Years: 5
            Company Name: Globex Inc.
            Role: Lead Developer
            Years: 3
            Skills:
            
            Programming
            Leadership
            Communication
            `
        }
      ],
      response_model: {
        name: "process_user_data",
        schema: z.object({
          story: z
            .string()
            .describe("A long and mostly made up story about the user - minimum 500 words"),
          userDetails: z.object({
            firstName: z.string(),
            lastName: z.string(),
            contactDetails: z.object({
              email: z.string(),
              phoneNumber: z.string().optional()
            })
          }),
          jobHistory: z.array(
            z.object({
              companyName: z.string(),
              role: z.string(),
              years: z.number().optional()
            })
          ),
          skills: z.array(z.string())
        })
      }
    })

    let final = {}

    for await (const result of completion) {
      final = result
    }

    //@ts-expect-error ignore for testing
    expect(omit(["_meta", "story"], final)).toEqual({
      userDetails: {
        firstName: "John",
        lastName: "Doe",
        contactDetails: {
          email: "john.doe@example.com",
          phoneNumber: "555-1234"
        }
      },
      jobHistory: [
        {
          companyName: "Acme Corp",
          role: "Software Engineer",
          years: 5
        },
        {
          companyName: "Globex Inc.",
          role: "Lead Developer",
          years: 3
        }
      ],
      skills: ["Programming", "Leadership", "Communication"]
    })
  })
})
