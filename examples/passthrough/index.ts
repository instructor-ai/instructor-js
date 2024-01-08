import Instructor from "@/instructor"
import OpenAI from "openai"

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "FUNCTIONS"
})

// ensures that when no `response_model` is provided, the response type is `ChatCompletion`
const completion = (await client.chat.completions.create({
  messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
  model: "gpt-3.5-turbo",
  seed: 1
})) satisfies OpenAI.Chat.ChatCompletion

console.log(completion)
