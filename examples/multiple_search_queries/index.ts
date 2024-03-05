import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "FUNCTIONS"
})

const SearchSchema = z
  .object({
    title: z.string().describe("Title of the request"),
    query: z.string().describe("Query to search for relevant content"),
    type: z.enum(["VIDEO", "EMAIL"]).describe("Type of search")
  })
  .describe(
    "Object representing a single search query which contains title, query, and the search type"
  )

type Search = z.infer<typeof SearchSchema>

async function executeSearch(search: Search) {
  setTimeout(
    () => console.log(`Searching for ${search.title} with ${search.query} using ${search.type}`),
    1000
  )
}

const MultiSearchSchema = z
  .object({
    searches: z.array(SearchSchema).describe("List of searches")
  })
  .describe("Object representing multiple search queries")

type MultiSearch = z.infer<typeof MultiSearchSchema>

async function executeMultiSearch(multiSearch: MultiSearch) {
  return Promise.all(
    multiSearch.searches.map((search: Search) => {
      executeSearch(search)
    })
  )
}

/**
 * Convert a string into multiple search queries
 */
async function segment(data: string): Promise<MultiSearch> {
  return await client.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant."
      },
      {
        role: "user",
        content: `Consider the data below:\n${data} and segment it into multiple search queries`
      }
    ],
    model: "gpt-4-1106-preview",
    response_model: { schema: MultiSearchSchema, name: "Multi Search" },
    max_tokens: 1000,
    temperature: 0.1
  })
}

const queries = await segment(
  "Please send me the video from last week about the investment case study and also documents about your GPDR policy?"
)
executeMultiSearch(queries)

// >>> Searching for Investment Case Study Video with video from last week about the investment case study using VIDEO
// >>> Searching for GDPR Policy Documents with documents about GDPR policy using EMAIL
