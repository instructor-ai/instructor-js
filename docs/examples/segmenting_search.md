# Segmenting Search Queries

In this example, we will demonstrate how to leverage the `MultiTask` and `enum` features of OpenAI Function Call to segment search queries. We will define the necessary schemas using Zod and demonstrate how segment queries into multiple sub queries and execute them in parallel.

!!! tips "Motivation"

    Extracting a list of tasks from text is a common use case for leveraging language models. This pattern can be applied to various applications, such as virtual assistants like Siri or Alexa, where understanding user intent and breaking down requests into actionable tasks is crucial. In this example, we will demonstrate how to use OpenAI Function Call to segment search queries and execute them in parallel.

## Structure of the Data

`SearchTypeSchema` is a Zod schema that defines the structure of a search query object. It has three fields: `title`, `query`, and `type`. The `title` field is the title of the request, the `query` field is the query to search for relevant content, and the `type` field is the type of search. The `executeSearch` function is used to execute the search query.

```ts
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

const SearchTypeSchema = z
  .enum(["VIDEO", "EMAIL"])
  .describe("Enumeration representing the types of searchs that can be performed")

const SearchSchema = z
  .object({
    title: z.string().describe("Title of the request"),
    query: z.string().describe("Query to search fro relevant content"),
    type: SearchTypeSchema.describe("Type of search")
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
  "Please send me the video from last week about the investment case study and also documents about your GPDR policy"
)
executeMultiSearch(queries)

// >>> Searching for `Video` with query `investment case study` using `SearchType.VIDEO`
// >>> Searching for `Documents` with query `GPDR policy` using `SearchType.EMAIL`
```
