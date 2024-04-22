---
draft: False
date: 2024-01-01
slug: anyscale 
tags:
  - patching
  - open source
authors:
  - jxnl
---

# Structured Outputs with Anyscale and Zod

Open-source LLMS are gaining popularity, and the release of Anyscale's Mistral model has made it possible to obtain structured outputs using JSON schema at any scale. Instead of relying on a model's default output mode, you can utilize JSON schema to obtain structured outputs. This approach is a time-saving alternative to extensive prompt engineering.

By the end of this blog post, you will learn how to effectively utilize instructor with Anyscale. But before we proceed, let's first explore the concept of patching.

<!-- more -->

## Understanding Modes

Instructor's patch enhances a openai api it with the following features, you can learn more about them [here](../../concepts/patching.md), for anyscale they support `JSON_SCHEMA` and `TOOLS` modes. and with instructor we'll be able to use the following features:

- `response_model` in `create` calls that returns a Zod schema
- `max_retries` in `create` calls that retries the call if it fails by using a backoff strategy

## Anyscale

The good news is that Anyscale employs the same OpenAI client, and its models support some of these output modes too!

!!! note "Getting access"

    If you want to try this out for yourself check out the [Anyscale](https://anyscale.com/) website. You can get started [here](https://docs.anyscale.com/get-started).

Let's explore one of the models available in Anyscale's extensive collection!

```js
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
  baseURL: "https://api.endpoints.anyscale.com/v1",
  apiKey: process.env.ANYSCALE_API_KEY ?? undefined,
})

const client = Instructor({
  client: oai,
  mode: "JSON_SCHEMA"
})

const user = await client.chat.completions.create({
  messages: [{ role: "user", content: "Harry Potter" }],
  model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
  response_model: { schema: UserSchema },
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

You can find more information about Anyscale's output mode support [here](https://docs.endpoints.anyscale.com/).
