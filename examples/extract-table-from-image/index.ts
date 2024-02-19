import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

const IMAGE_URL = "https://duquark.files.wordpress.com/2019/12/graph.jpg?w=700&h=499"

const TableResponseSchema = z.object({
  title: z.string(),
  caption: z.string(),
  table: z.any()
})

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID
})

const instructor = Instructor({
  client: oai,
  mode: "MD_JSON"
})

const extractTableFromImage = async (imageUrl: string) => {
  const response = await instructor.chat.completions.create({
    model: "gpt-4-vision-preview",
    response_model: {
      schema: TableResponseSchema,
      name: "table extraction"
    },
    max_tokens: 1_000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: imageUrl
            }
          },
          {
            type: "text",
            text: `
                First, take a moment to reason about the best set of headers for the table. 
                Then, write a concise title and brief caption for the image above.
                Lastly, produce the table.
              `
          }
        ]
      }
    ]
  })

  return response
}

const table = await extractTableFromImage(IMAGE_URL)
console.log("Extracted Table: ", table)
