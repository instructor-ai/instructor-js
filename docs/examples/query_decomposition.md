# Planning and Executing a Query Plan

This example demonstrates how to use the OpenAI Function Call ChatCompletion model to plan and execute a query plan in a question-answering system. By breaking down a complex question into smaller sub-questions with defined dependencies, the system can systematically gather the necessary information to answer the main question.

!!! tips "Motivation"

    The goal of this example is to showcase how query planning can be used to handle complex questions, facilitate iterative information gathering, automate workflows, and optimize processes. By leveraging the OpenAI Function Call model, you can design and execute a structured plan to find answers effectively.

     **Use Cases:**

    * Complex question answering
    * Iterative information gathering
    * Workflow automation
    * Process optimization

With the OpenAI Function Call model, you can customize the planning process and integrate it into your specific application to meet your unique requirements.

## Defining the structures

Let's define the necessary models to represent the query plan and the queries.

```ts
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
```

## Planning a Query Plan

Now, let's demonstrate how to plan and execute a query plan using the defined models and the OpenAI API.

```ts
const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "FUNCTIONS",
})

const createQueryPlan = async (question: string): Promise<QueryPlan | undefined> => {
  const queryPlan: QueryPlan = await client.chat.completions.create({
    messages: [
      {
        "role": "system",
        "content": "You are a world class query planning algorithm capable of breaking apart questions into its dependency queries such that the answers can be used to inform the parent question. Do not answer the questions, simply provide a correct compute graph with good specific questions to ask and relevant dependencies. Before you call the function, think step-by-step to get a better understanding of the problem.",
      },
      {
        "role": "user",
        "content": `Consider: ${question}\nGenerate the correct query plan.`,
      },
    ],
    model: "gpt-4o",
    response_model: { schema: QueryPlanSchema },
    max_tokens: 1000,
    temperature: 0.0,
    max_retries: 2,
  })

  return queryPlan || undefined
}

const queryPlan = await createQueryPlan(
  "What is the difference in populations of Canada and the Jason's home country?"
)

console.log({ queryPlan: JSON.stringify(queryPlan) })
```

!!! warning "No RAG"

    While we build the query plan in this example, we do not propose a method to actually answer the question. You can implement your own answer function that perhaps makes a retrival and calls openai for retrival augmented generation. That step would also make use of function calls but goes beyond the scope of this example.

```json
{
  "query_graph": [
    {
      "id": 1,
      "question": "What is the population of Canada?",
      "dependencies": [],
      "node_type": "SINGLE"
    },
    {
      "id": 2,
      "question": "What is the name of Jason's home country?",
      "dependencies": [],
      "node_type": "SINGLE"
    },
    {
      "id": 3,
      "question": "What is the population of {country}?",
      "dependencies": [2],
      "node_type": "SINGLE"
    },
    {
      "id": 4,
      "question": "What is the difference in population between Canada and {country}?",
      "dependencies": [1, 3],
      "node_type": "MERGE_MULTIPLE_RESPONSES"
    }
  ]
}

```

In the above code, we define a `createQueryPlan` function that takes a question as input and generates a query plan using the OpenAI API.

## Conclusion

In this example, we demonstrated how to use the OpenAI Function Call `ChatCompletion` model to plan and execute a query plan using a question-answering system. We defined the necessary structures using Zod and created a query planner function.
