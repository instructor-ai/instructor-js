---
draft: False
date: 2024-02-01
slug: together
tags:
  - patching
  - open source
authors:
  - jxnl
---

# Structured Outputs with Together and Zod

Open-source LLMS are gaining popularity, and the release of Togethers's Mistral model has made it possible to obtain structured outputs using JSON schema. Instead of relying on a model's default output mode, you can utilize JSON schema to obtain structured outputs. This approach is a time-saving alternative to extensive prompt engineering.

By the end of this blog post, you will learn how to effectively utilize instructor with Togethers. But before we proceed, let's first explore the concept of patching.

<!-- more -->

## Understanding Modes

Instructor's patch enhances a openai api it with the following features, you can learn more about them [here](../../concepts/patching.md), for Togethers they support `JSON_SCHEMA` and `TOOLS` modes. and with instructor we'll be able to use the following features:

- `response_model` in `create` calls that returns a Zod schema
- `max_retries` in `create` calls that retries the call if it fails by using a backoff strategy

## Anyscale

The good news is that Anyscale employs the same OpenAI client, and its models support some of these output modes too!

!!! note "Getting access"

    If you want to try this out for yourself check out the [Together Compute](https://together.ai/) website. You can get started [here](https://docs.together.ai/docs/quickstart).

Let's explore one of the models available in Together's extensive collection!

```ts
import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

const property = z.object({
  name: z.string(),
  value: z.string()
}).describe("A property defined by a name and value")

const UserSchema = z.object({
  age: z.number(),
  name: z.string(),
  properties: z.array(property)
})

const oai = new OpenAI({
  baseUrl='https://api.together.xyz',
  apiKey: process.env.TOGETHER_API_KEY ?? undefined,
})

const client = Instructor({
  client: oai,
  mode: "JSON_SCHEMA"
})

const user = await client.chat.completions.create({
  messages: [{ role: "user", content: "Harry Potter" }],
  model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
  response_model: { schema: UserSchema, name: "UserSchema" },
  max_retries: 3
})

console.log(user)
/**
 * {
  age: 17,
  name: "Harry Potter",
  properties: [
    {
      name: "House",
      value: "Gryffindor",
    }, {
      name: "Wand",
      value: "Holly and Phoenix feather",
    }
  ],
}
 */
```

You can find more information about Togethers's output mode support [here](https://docs.together.ai/docs/json-mode/).
