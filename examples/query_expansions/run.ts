import readline from "readline"
import Instructor from "@/instructor"
import { OpenAI } from "openai"
import { z } from "zod"

const getSystem = () => {
  const currentDate = new Date()
  const formattedDate = currentDate.toLocaleDateString()
  const time = currentDate.toLocaleTimeString()
  const systemPrompt = `
  You are a world class query understanding algorithm that is able to:

  1. rewrite queries to be specific to the context, include additional terms that are relevant to the context, and remove terms that are not relevant to the context.
  2. consider the date and relative and absolute time of the query and the context.
  3. When the query is the search query should be fully qualified, and contain all themes, entities, and keywords that are relevant to the context.

  Tips:
    * PERSONAL_DATA: The query is asking for personal data. The answer should be a list of personal data.
    * INTERNET: The query is asking for information on the internet or latest information that may not be available in the context.
    * TRANSCRIPTS: The query is asking for a transcript of a conversation or a meeting.

  The current date is ${formattedDate} and the current time is ${time}.
  `

  return systemPrompt
}

const ExtractionValuesSchema = z.object({
  rewrittenQuery: z
    .string()
    .describe(
      "Rewrite the query to be specific to the context. This will be used to do semantic search, so make sure it is specific to the context."
    ),
  questionType: z.array(
    z
      .string()
      .describe(
        "The type of question that is being asked. This will be used to determine the type of answer that is expected. MUST be one of the following: PERSONAL_DATA, INTERNET, TRANSCRIPTS"
      )
  ),
  minDate: z
    .string()
    .optional()
    .describe(
      "The earliest date of the context that is relevant to the query, null if the query is not time sensitive"
    ),
  maxDate: z
    .string()
    .optional()
    .describe(
      "The latest date of the context that is relevant to the query, null if the query is not time sensitive"
    ),
  keywords: z.array(z.string()).describe("Keywords that are relevant to a Full Text Search Engine")
})

const oai = new OpenAI({
  apiKey: process.env.OPENAI_KEY
})

const client = Instructor({
  client: oai,
  mode: "TOOLS"
})

type Extraction = Partial<z.infer<typeof ExtractionValuesSchema>>

const runExtraction = async (query: string) => {
  const systemPrompt = getSystem()

  let extraction: Extraction = {}
  const extractionStream = await client.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: query }
    ],
    model: "gpt-4o",
    response_model: {
      schema: ExtractionValuesSchema,
      name: "value_extraction"
    },
    stream: true,
    seed: 1
  })

  for await (const result of extractionStream) {
    try {
      extraction = result
      console.clear()
      console.log(extraction)
    } catch (e) {
      console.log(e)
      break
    }
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.question("Enter your query: ", query => {
  runExtraction(query)
  rl.close()
})
