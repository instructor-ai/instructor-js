# OpenAI Moderation

## Overview

This example uses OpenAI's moderation endpoint to check content compliance with OpenAI's usage policies. It can identify and filter harmful content that violates the policies.

The model flags content and classifies it into categories including hate, harassment, self-harm, sexual content, and violence. Each category has subcategories for detailed classification.

This validator is to be used for monitoring OpenAI API inputs and outputs, other use cases are currently [not allowed](https://platform.openai.com/docs/guides/moderation/overview).

## Incorporating OpenAI moderation validation

The following code defines a schema to validate content using OpenAI's Moderation endpoint. Zod's `.superRefine()` is used to apply OpenAI's moderation after the compute. This moderation checks if the content complies with OpenAI's usage policies and flags any harmful content. Here's how it works:

1. Initialize the OpenAI client and extend it with `Instructor`. This is not strictly necessary for this example, always recommended in order to leverage the full `Instructor` functionality.

2. Define a Zod schema for our content, then super refine our `message` field with `moderationValidator(client)`. This means that after `message` is computed, it will be passed to `moderationValidator()` for validation. 

```ts
import Instructor from "@/instructor";
import OpenAI from "openai";
import { z } from "zod";
import { moderationValidator } from "@/dsl/validator"

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined,
});

const client = Instructor({
  client: oai,
  mode: "FUNCTIONS",
});

const Response = z.object({
  message: z.string().superRefine(moderationValidator(client))
})

try {
  await Response.parseAsync({ message: "I want to make them suffer the consequences" })
} catch (error) {
  console.log(error)
}
// ZodError: [
//   {
//     "code": "custom",
//     "message": "Moderation error, `I want to make them suffer the consequences` was flagged for violence",
//     "path": [
//       "message"
//     ]
//   }
// ]

try {
  await Response.parseAsync({ message: "I want to hurt myself." })
} catch (error) {
  console.log(error)
}
//   ZodError: [
//   {
//       "code": "custom",
//       "message": "Moderation error, `I want to hurt myself.` was flagged for self-harm, self-harm/intent",
//       "path": [
//       "message"
//       ]
//   }
// ]
```
