# instructor-js

This is a WIP of the [instructor](https://github.com/jxnl/instructor) project implemented in JavaScript.
I am not a JavaScript developer, so this is a learning project for me, if you're interested in contributing seriously to this project, please contact me on [Twitter](https://twitter.com/jxnlco)

The simple goal of this project is to provide a simple, type-safe, and easy to use interface for the OpenAI API.

```ts
import { z } from "zod";
import { instruct } from "instructor";
import OpenAI from "openai";

const UserSchema = z.object({
  age: z.number(),
  name: z.string().refine((name) => name.includes(" "), {
    message: "Name must contain a space",
  }),
});

type User = z.infer<typeof UserSchema>;

const client = instruct.patch({
  client: OpenAI(process.env.OPENAI_API_KEY, process.env.OPENAI_ORG_ID),
  mode: instruct.MODES.TOOLS,
});

const user: User = await client.chat.completions.create({
  messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
  model: "gpt-3.5-turbo",
  response_model: UserSchema,
  max_retries: 3,
});
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
