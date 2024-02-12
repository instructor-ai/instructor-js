import fs from "fs"
import Instructor from "@instructor-ai/instructor"
import OpenAI from "openai"
import { z } from "zod"

const oai = new OpenAI({
  baseURL: "https://api.together.xyz",
  apiKey: process.env.TOGETHER_API_KEY ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "TOOLS"
})

const Summary = z.object({
  title: z.string().describe("Short Descriptive Title"),
  actionItems: z.array(z.string()).describe(
    `A list of action items, short and to the point, make sure
       all action item lists are fully resolved if they are nested`
  )
})

/**
 * This week I have to get some groceries, pack for my trip to peru and
 * also buy the plane tickets for that trip.
 */
const transcription = await client.audio.transcriptions.create({
  file: fs.createReadStream("audio.mp3"),
  model: "whisper-1",
  response_format: "verbose_json"
})

const extract = await client.chat.completions.create({
  messages: [
    {
      role: "system",
      content:
        "The following is a transcript of a voice message, extract the relevant actions, correctly return JSON"
    },
    {
      role: "user",
      content: transcription.text
    }
  ],
  model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
  response_model: { schema: Summary, name: "SummarizeNotes" },
  max_retries: 2
})

console.log(extract)
/**
 {
  title: "Grocery and Travel Preparation",
  actionItems: [ "Get groceries", "Pack for Peru trip", "Buy plane tickets for Peru trip"
  ],
 }
 */
