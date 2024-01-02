# instructor-js

This is a WIP of the port of the [Instructor Python Library](https://github.com/jxnl/instructor) by [@jxnlco](https://twitter.com/jxnlco).
This library brings structured prompting to LLMs. Instead of receiving text as output, Instructor will coax the LLM to output valid JSON that maps directly to the provided Ecto schema.
If the LLM fails to do so, or provides values that do not pass your validations, it will provide you utilities to automatically retry with the LLM to correct errors.
The simple goal of this project is to provide a simple, type-safe, and easy to use interface for the OpenAI API.

```ts
import { z } from "zod";
import { instruct } from "instructor";
import OpenAI from "openai";

const UserSchema = z.object({
  age: z.number(),
  name: z.string().refine(name => name.includes(" "), {
    message: "Name must contain a space"
  })
})

type User = z.infer<typeof UserSchema>

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "FUNCTIONS" // or TOOLS or MD_JSON or JSON_SCHEMA or JSON
})

const user: User = await client.chat.completions.create({
  messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
  model: "gpt-3.5-turbo",
  response_model: UserSchema,
  max_retries: 3
})

assert(user.age === 30)
assert(user.name === "Jason Liu")
```

Or if it makes more sense to you, you can use the builder pattern:

```ts
const response = await client.chat.completions.create({
  messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
  model: "gpt-3.5-turbo",
  response_model: UserSchema,
  max_retries: 3,
});

const user: User = response.model;
```

## Roadmap


## TODO

- [ ] Add `llm_validator`
- [ ] Logging for Distillation / Finetuning
- [ ] Support Streaming
- [ ] Optional/Maybe types
- [ ] Add Tutorials, include in docs
    - [ ] Text Classification
    - [ ] Self Critique
    - [ ] Image Extracting Tables
    - [ ] Moderation
    - [ ] Citations
    - [ ] Knowledge Graph
    - [ ] Entity Resolution
    - [ ] Search Queries
    - [ ] Query Decomposition
    - [ ] Recursive Schemas
    - [ ] Table Extraction
    - [ ] Action Item and Dependency Mapping
    - [ ] Multi-File Code Generation
    - [ ] PII Data Sanitization

These translations provide a structured approach to creating TypeScript schemas with Zod, mirroring the functionality and intent of the original Python examples.
