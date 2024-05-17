import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

const QueryTypeSchema = z.enum(["SINGLE", "MERGE_MULTIPLE_RESPONSES"])

const QuerySchema = z.object({
  id: z.number(),
  question: z.string(),
  dependencies: z.array(z.number()).optional(),
  node_type: QueryTypeSchema.default("SINGLE")
})

const QueryPlanSchema = z.object({
  query_graph: z.array(QuerySchema)
})

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "FUNCTIONS"
})

const createQueryPlan = async (question: string) => {
  const queryPlan = await client.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are a world class query planning algorithm capable of breaking apart questions into its dependency queries such that the answers can be used to inform the parent question. Do not answer the questions, simply provide a correct compute graph with good specific questions to ask and relevant dependencies. Before you call the function, think step-by-step to get a better understanding of the problem."
      },
      {
        role: "user",
        content: `Consider: ${question}\nGenerate the correct query plan.`
      }
    ],
    model: "gpt-4o",
    response_model: { schema: QueryPlanSchema, name: "Query Plan Decomposition" },
    max_tokens: 1000,
    temperature: 0.0,
    max_retries: 2,
    seed: 1
  })

  return queryPlan || undefined
}

const queryPlan = await createQueryPlan(
  "What is the difference in populations of Canada and the Jason's home country?"
)

// "{\"query_graph\":[{\"id\":1,\"question\":\"What is the population of Canada?\",\"dependencies\":[],\"node_type\":\"SINGLE\"},{\"id\":2,\"question\":\"What is the name of Jason's home country?\",\"dependencies\":[],\"node_type\":\"SINGLE\"},{\"id\":3,\"question\":\"What is the population of {country}?\",\"dependencies\":[2],\"node_type\":\"SINGLE\"},{\"id\":4,\"question\":\"What is the difference in population between Canada and {country}?\",\"dependencies\":[1,3],\"node_type\":\"MERGE_MULTIPLE_RESPONSES\"}]}"
console.log({ queryPlan: JSON.stringify(queryPlan) })
