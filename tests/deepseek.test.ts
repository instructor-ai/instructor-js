import Instructor from "@/index"
import { describe, expect, test } from "bun:test"
import OpenAI from "openai"
import { z } from "zod"

const textBlock = `
In our recent online meeting, participants from various backgrounds joined to discuss the upcoming tech conference. The names and contact details of the participants were as follows:

- Name: John Doe, Email: johndoe@email.com, Twitter: @TechGuru44
- Name: Jane Smith, Email: janesmith@email.com, Twitter: @DigitalDiva88
- Name: Alex Johnson, Email: alexj@email.com, Twitter: @CodeMaster2023

During the meeting, we agreed on several key points. The conference will be held on March 15th, 2024, at the Grand Tech Arena located at 4521 Innovation Drive. Dr. Emily Johnson, a renowned AI researcher, will be our keynote speaker.

The budget for the event is set at $50,000, covering venue costs, speaker fees, and promotional activities. Each participant is expected to contribute an article to the conference blog by February 20th.

A follow-up meeting is scheduled for January 25th at 3 PM GMT to finalize the agenda and confirm the list of speakers.
`

const ExtractionValuesSchema = z.object({
  users: z
    .array(
      z.object({
        name: z.string(),
        email: z.string(),
        twitter: z.string()
      })
    )
    .min(3),
  conference: z.object({
    date: z.string(),
    venue: z.string(),
    budget: z.number(),
    keynoteSpeaker: z.string()
  }),
  nextMeeting: z.object({
    date: z.string(),
    time: z.string(),
    timezone: z.string()
  })
})

describe("thinking parser - live tests", () => {
  test("should parse r1 response with thinking tags", async () => {
    const groq = new OpenAI({
      apiKey: process.env["GROQ_API_KEY"] ?? undefined,
      baseURL: "https://api.groq.com/openai/v1"
    })

    const client = Instructor({
      client: groq,
      mode: "THINKING_MD_JSON",
      debug: true
    })

    const result = await client.chat.completions.create({
      messages: [{ role: "user", content: textBlock }],
      model: "deepseek-r1-distill-llama-70b",
      response_model: { schema: ExtractionValuesSchema, name: "Extract" },
      max_retries: 4
    })

    console.log("result", result)

    expect(result._meta?.thinking).toBeDefined()
    expect(typeof result._meta?.thinking).toBe("string")

    expect(result.users).toHaveLength(3)
    expect(result.users[0]).toHaveProperty("name")
    expect(result.users[0]).toHaveProperty("email")
    expect(result.users[0]).toHaveProperty("twitter")

    expect(result.conference).toBeDefined()
    expect(result.conference.budget).toBe(50000)
    expect(result.conference.keynoteSpeaker).toBe("Dr. Emily Johnson")

    expect(result.nextMeeting).toBeDefined()
    expect(result.nextMeeting.timezone).toBe("GMT")
  })
})
