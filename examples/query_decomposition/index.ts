import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

const QueryTypeSchema = z.enum(["SINGLE", "MERGE_MULTIPLE_RESPONSES"]);

const QuerySchema = z.object({
  id: z.number(),
  question: z.string(),
  dependencies: z.array(z.number()).optional(),
  node_type: QueryTypeSchema.default("SINGLE")
})

const QueryPlanSchema = z.object({
  query_graph: z.array(QuerySchema)
})

type QueryPlan = z.infer<typeof QueryPlanSchema>

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "FUNCTIONS"
})

const createQueryPlan = async (question: string): Promise<QueryPlan | undefined> => {
  const queryPlan: QueryPlan = await client.chat.completions.create({
    messages: [
      {
        "role": "system",
        "content": "You are a world class query planning algorithm capable ofbreaking apart questions into its dependency queries such that the answers can be used to inform the parent question. Do not answer the questions, simply provide a correct compute graph with good specific questions to ask and relevant dependencies. Before you call the function, think step-by-step to get a better understanding of the problem.",
      },
      {
        "role": "user",
        "content": `Consider: ${question}\nGenerate the correct query plan.`,
      },
    ],
    model: "gpt-4-0613",
    response_model: QueryPlanSchema,
    max_retries: 1
  })

  return queryPlan || undefined
}

const queryPlan = await createQueryPlan(
  "What is the difference in populations of Canada and the Jason's home country?"
)

console.log({ queryPlan })
