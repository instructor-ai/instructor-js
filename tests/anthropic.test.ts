import Instructor from "@/index"
import { createLLMClient } from "llm-polyglot"
import z from "zod"

const anthropicClient = createLLMClient({
  provider: "anthropic"
})

const instructor = Instructor<typeof anthropicClient>({
  client: anthropicClient,
  debug: true,
  mode: "MD_JSON"
})

const complete = await instructor.chat.completions.create({
  model: "claude-3-opus-20240229",
  max_tokens: 1000,
  stream: true,
  response_model: {
    schema: z.object({
      response: z.string()
    }),
    name: "response"
  },
  messages: [
    {
      role: "user",
      content: "hey how are you"
    }
  ]
})

for await (const data of complete) {
  console.clear()
  console.log(data)
}
