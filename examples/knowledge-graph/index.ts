import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

const NodeSchema = z.object({
  id: z.number(),
  label: z.string(),
  color: z.string()
})

const EdgeSchema = z.object({
  source: z.number(),
  target: z.number(),
  label: z.string(),
  color: z.string().default("black")
})

const KnowledgeGraphSchema = z.object({
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema)
})

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "JSON"
})

const createGraph = async (input: string) => {
  const graph = await client.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `Help me understand following by describing as a detailed knowledge graph: ${input}`
      }
    ],
    model: "gpt-3.5-turbo-1106",
    response_model: { schema: KnowledgeGraphSchema, name: "Knowledge Graph" },
    max_retries: 5,
    seed: 1
  })

  return graph
}

const graph = await createGraph("Teach me about quantum mechanics")
// "{"nodes":[{"id":1,"label":"Quantum Mechanics","color":"blue"},{"id":2,"label":"Wave-Particle Duality","color":"green"},{"id":3,"label":"Quantum Superposition","color":"green"},{"id":4,"label":"Quantum Entanglement","color":"green"},{"id":5,"label":"Quantum Tunneling","color":"green"}],"edges":[{"source":1,"target":2,"label":"Related to","color":"black"},{"source":1,"target":3,"label":"Related to","color":"black"},{"source":1,"target":4,"label":"Related to","color":"black"},{"source":1,"target":5,"label":"Related to","color":"black"}]}"
console.log({ graph: JSON.stringify(graph) })
