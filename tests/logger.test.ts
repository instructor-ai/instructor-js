import Instructor from "@/instructor"
import { describe, expect, spyOn, test } from "bun:test"
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

async function extractUser() {
  const ExtractionValuesSchema = z.object({
    users: z
      .array(
        z.object({
          name: z.string(),
          handle: z.string(),
          twitter: z.string()
        })
      )
      .min(3),
    location: z.string(),
    budget: z.number()
  })

  const oai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? undefined,
    organization: process.env.OPENAI_ORG_ID ?? undefined
  })

  const client = Instructor({
    client: oai,
    mode: "TOOLS",
    logger: (level, ...args) => console.log(`[CUSTOM LOGGER | ${level}]`, ...args)
  })

  const extraction = await client.chat.completions.create({
    messages: [{ role: "user", content: textBlock }],
    model: "gpt-4o",
    response_model: { schema: ExtractionValuesSchema, name: "Extr" },
    max_retries: 1,
    seed: 1
  })

  return extraction
}

describe("Custom Logger", () => {
  test("Should log using custom logger", async () => {
    const consoleSpy = spyOn(console, "log")
    await extractUser()

    expect(consoleSpy.mock.calls.flatMap(args => args.join(" ")).toString()).toContain(
      "[CUSTOM LOGGER"
    )

    consoleSpy.mockRestore()
  })
})
