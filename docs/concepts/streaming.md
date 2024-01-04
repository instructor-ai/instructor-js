A common use case of structured extraction is defining a single schema class and then making another schema to create a list to do multiple extraction

By enabling streaming, you can do multiple extractions in a single request, and then iterate over the results as they come in.

!!! warning "Streaming changes the nature of the response"

    When streaming is enabled, the response is no longer a single object, but an iterable of objects. This means that you can no longer use the response as a single object, but must iterate over it.

    This is a tradeoff for usability. If you want to use the response as a single object, you can disable streaming.

    ```ts
    const user = await client.chat.completions.create({
      messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
      model: "gpt-3.5-turbo",
      response_model: UserSchema,
    })
    ```

```ts
import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

const UserSchema = z.object({
  age: z.number(),
  name: z.string()
})

type User = Partial<z.infer<typeof UserSchema>>

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "FUNCTIONS"
})
```

## Extracting Tasks using `stream=true`

By using Iterable you get a very convenient class with prompts and names automatically defined:

```ts
const userStream = await client.chat.completions.create({
  messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
  model: "gpt-3.5-turbo",
  response_model: UserSchema,
  max_retries: 3,
  stream: true
})

let user: User = {}

for await (const result of userStream) {
  try {
    user = result
    expect(result).toHaveProperty("_isValid")
    expect(result).toHaveProperty("name")
    expect(result).toHaveProperty("age")
  } catch (e) {
    console.log(e)
    break
  }
}
```