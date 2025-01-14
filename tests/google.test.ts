import Instructor from "@/index"
import { omit } from "@/lib"
import { describe, expect, test } from "bun:test"
import { createLLMClient } from "llm-polyglot"
import z from "zod"

const googleClient = createLLMClient({
  provider: "google",
  apiKey: process.env.GEMINI_API_KEY
})

describe("LLMClient google Provider - mode: TOOLS", () => {
  const instructor = Instructor({
    client: googleClient,
    mode: "TOOLS"
  })

  test("basic completion", async () => {
    const completion = await instructor.chat.completions.create({
      model: "gemini-1.5-flash-latest",
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
      model: "gemini-1.5-flash-latest",
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

describe("LLMClient google Provider - mode: TOOLS - stream", () => {
  const instructor = Instructor({
    client: googleClient,
    mode: "TOOLS"
  })

  test("basic completion", async () => {
    const completion = await instructor.chat.completions.create({
      model: "gemini-1.5-flash-latest",
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
      model: "gemini-1.5-flash-latest",
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

describe("LLMClient google Provider - Grounding", () => {
  test("grounding with structured output", async () => {
    const completion = await googleClient.chat.completions.create({
      model: "gemini-1.5-flash-latest",
      messages: [
        {
          role: "user",
          content:
            "You are a food critic. Review the most popular Italian restaurants in Boston's North End, focusing on their traditional dishes."
        }
      ],
      groundingThreshold: 0.7,
      max_tokens: 1000,
      stream: false
    })

    console.log("completion", JSON.stringify(completion, null, 2))
    expect(completion.choices?.[0]?.message?.content).toBeTruthy()
  })

  test("grounding with different thresholds", async () => {
    const highThreshold = await googleClient.chat.completions.create({
      model: "gemini-1.5-flash-latest",
      messages: [
        {
          role: "user",
          content: "What are the current top-rated Italian restaurants in Boston's North End?"
        }
      ],
      groundingThreshold: 0.9,
      max_tokens: 1000
    })

    // Lower threshold for more general responses
    const lowThreshold = await googleClient.chat.completions.create({
      model: "gemini-1.5-flash-latest",
      messages: [
        {
          role: "user",
          content: "What are the current top-rated Italian restaurants in Boston's North End?"
        }
      ],
      groundingThreshold: 0.5,
      max_tokens: 1000
    })

    console.log("highThreshold", JSON.stringify(highThreshold, null, 2))
    console.log("lowThreshold", JSON.stringify(lowThreshold, null, 2))

    expect(highThreshold.choices?.[0]?.message?.content).not.toBe(
      lowThreshold.choices?.[0]?.message?.content
    )
  })
})

// test("cache manager with session and grounding", async () => {
//   const sessionId = `test-session-${Date.now()}`

//   // Create cache
//   const cache = await googleClient.cacheManager.create({
//     model: "gemini-1.5-pro",
//     max_tokens: 1000,
//     messages: [
//       {
//         role: "system",
//         content: "You are a helpful assistant that provides structured data about restaurants."
//       }
//     ],
//     ttlSeconds: 3600
//   })

//   const completion1 = await googleClient.chat.completions.create({
//     model: "gemini-1.5-pro",
//     max_tokens: 1000,
//     groundingThreshold: 0.8,
//     messages: [
//       {
//         role: "user",
//         content: "What's the best Italian restaurant in Boston's North End for a romantic dinner?"
//       }
//     ],
//     additionalProperties: {
//       sessionId,
//       cacheName: cache.name
//     }
//   })

//   expect(completion1.choices?.[0]?.message?.content).toBeTruthy()

//   // Follow-up question in same session
//   const completion2 = await googleClient.chat.completions.create({
//     model: "gemini-1.5-pro",
//     max_tokens: 1000,
//     groundingThreshold: 0.8,
//     messages: [
//       {
//         role: "user",
//         content: `What are their most popular dishes?`
//       }
//     ],
//     additionalProperties: {
//       sessionId,
//       cacheName: cache.name
//     }
//   })

//   console.log("completion2", JSON.stringify(completion2, null, 2))

//   expect(completion2.choices?.[0]?.message?.content).toBeTruthy()

//   if (cache?.name) {
//     await googleClient.cacheManager.delete(cache.name)
//   }
// })
