import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

const textBlock = `
In our recent online meeting, participants from various backgrounds joined to discuss the upcoming tech conference. The names and contact details of the participants were as follows:

- Name: John Doe, Email: johndoe@email.com, Twitter: @TechGuru44
- Name: Jane Smith, Email: janesmith@email.com, Twitter: @DigitalDiva88
- Name: Alex Johnson, Email: alexj@email.com, Twitter: @CodeMaster2023
- Name: Emily Clark, Email: emilyc@email.com, Twitter: @InnovateQueen
- Name: Ron Stewart, Email: ronstewart@email.com, Twitter: @RoboticsRon5
- Name: Sarah Lee, Email: sarahlee@email.com, Twitter: @AI_Aficionado
- Name: Mike Brown, Email: mikeb@email.com, Twitter: @FutureTechLeader
- Name: Lisa Green, Email: lisag@email.com, Twitter: @CyberSavvy101
- Name: David Wilson, Email: davidw@email.com, Twitter: @GadgetGeek77
- Name: Daniel Kim, Email: danielk@email.com, Twitter: @DataDrivenDude

During the meeting, we agreed on several key points. The conference will be held on March 15th, 2024, at the Grand Tech Arena located at 4521 Innovation Drive. Dr. Emily Johnson, a renowned AI researcher, will be our keynote speaker.

The budget for the event is set at $50,000, covering venue costs, speaker fees, and promotional activities. Each participant is expected to contribute an article to the conference blog by February 20th.

A follow-up meeting is scheduled for January 25th at 3 PM GMT to finalize the agenda and confirm the list of speakers.
`

const ExtractionValuesSchema = z.object({
  users: z
    .array(
      z.object({
        name: z.string(),
        handle: z.string(),
        twitter: z.string()
      })
    )
    .min(5),
  date: z.string(),
  location: z.string(),
  budget: z.number(),
  deadline: z.string().min(1)
})

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "TOOLS"
})

let extraction = {}

const extractionStream = await client.chat.completions.create({
  messages: [{ role: "user", content: textBlock }],
  model: "gpt-4o",
  response_model: {
    schema: ExtractionValuesSchema,
    name: "value extraction"
  },
  max_retries: 3,
  stream: true,
  seed: 1
})

for await (const result of extractionStream) {
  try {
    extraction = result
    console.clear()
    console.table(extraction)
  } catch (e) {
    console.log(e)
    break
  }
}

console.clear()
console.log("completed extraction:")
console.table(extraction)
