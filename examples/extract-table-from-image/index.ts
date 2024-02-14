import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

const IMAGE_URL = "https://duquark.files.wordpress.com/2019/12/graph.jpg?w=700&h=499"

const TableResponseSchema = z.object({
  title: z.string(),
  caption: z.string(),
  table: z.any()
})
type TableResponse = z.infer<typeof TableResponseSchema>

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID
})

const instructor = Instructor({
  client: oai,
  mode: "MD_JSON"
})

const extractTableFromImage = async (imageUrl: string): Promise<TableResponse | undefined> => {
  try {
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
            { type: "text", text: "Describe this data accurately as a table in markdown format." },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            },
            {
              type: "text",
              text: `
                First, take a moment to reason about the best set of headers for the tables. 
                Then, write a concise title and brief caption for the image above.
                Lastly, produce the table.
              `
            }
          ]
        }
      ]
    })

    return response
  } catch (error) {
    console.error("Failed to extract table from image:", error)
    return undefined
  }
}

const table = await extractTableFromImage(IMAGE_URL)

if (table) {
  console.log("Extracted Table:", table)
} else {
  console.log("No table extracted or an error occurred.")
}
