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

  If you are able to use a search, lead the messages blank.

  Tips for rewriting queries:
    * These rewritten queries will be used in a semantic search index. So include alternative meanings and assume that the query should match the embeddings of the answer. 

  Tips for tagging the question type:
    * PERSONAL_DATA: The query is asking for personal data. The answer should be a list of personal data.
    * INTERNET: The query is asking for information on the internet or latest information that may not be available in the context.
    * TRANSCRIPTS: The query is asking for a transcript of a conversation or a meeting.
    * ACTIVITY LOG: The query is asking for a log of activities or summaries of activities.
    
  Tip for additional instructions:
    * If there are instructions on how to process the response given the search results include them here. For example, if you want to summarize a transcript, you should first search for the transcript and the additional instructions should include the instructions to summarize. 

  The current date is ${formattedDate} and the current time is ${time}.
  `

  return systemPrompt
}

const SearchQuery = z.object({
  rewrittenQuery: z
    .string()
    .optional()
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
      "YYYY/MM/DD Format, The earliest date of the context that is relevant to the query, null if the query is not time sensitive"
    ),
  maxDate: z
    .string()
    .optional()
    .describe(
      "YYYY/MM/DD Format, The latest date of the context that is relevant to the query, null if the query is not time sensitive"
    )
  // keywords: z.array(z.string()).describe("Keywords that are relevant to a Full Text Search Engine"),
})

const Response = z.object({
  message: z
    .string()
    .optional()
    .describe("The response to the message, if you need to make a search query, provide it below."),
  query: z.array(
    SearchQuery.describe(
      "If you need additional information, please provide it here. If you do not need additional information, please leave this blank."
    )
  )
  // additionalInstructions: z.string().optional().describe("If you need additional information, please provide it here. If you do not need additional information, please leave this blank."),
})

const oai = new OpenAI({
  apiKey: process.env.OPENAI_KEY
})

const client = Instructor({
  client: oai,
  mode: "TOOLS"
})

type Extraction = Partial<z.infer<typeof SearchQuery>>

export const runExtractionStream = async (query: string) => {
  const systemPrompt = getSystem()

  let extraction: Extraction = {}
  const extractionStream = await client.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: query }
    ],
    model: "gpt-4o",
    response_model: {
      schema: SearchQuery,
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

const runExtraction = async (query: string) => {
  const systemPrompt = getSystem()

  const extraction = await client.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: query }
    ],
    model: "gpt-4o",
    response_model: {
      schema: Response,
      name: "Respond"
    },
    seed: 1
  })

  console.log(JSON.stringify({ query, extraction }, null, 2))
}

const failingQuestions = [
  "What did I do last week? Write at least 10 bullet points",
  "Give a summary of the daily standup today with Bart. The spoken language is Dutch",
  "Please summarize the action items from today's meeting",
  "How was my day?",
  "Did he mention anything else about the terminal in the past 2 weeks? Please write 3 action items in the form of bullet points",
  "Summarize the meeting with Pinterest this morning",
  "Can you summarize the transcript from 11:00AM to present?",
  "What was I doing last week?",
  "What is 10 + 10?",
  "I recently looked up a Royal Caribbean cruise. What price did it show me?",
  "Please summarize in detail Monday, the 17th of April 2023, starting from 10:00am and highlight any key aspects, todos and so on. Leave out any information about FASD/FAS/PFAS.",
  "what was the name of the standup tool i saw recently",
  "Can you summarize the transcript from 11:00AM to present?"
]

failingQuestions.forEach(question => {
  runExtraction(question)
})
