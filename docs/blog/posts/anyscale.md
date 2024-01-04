---
draft: False
date: 2024-01-01
slug: patching
tags:
  - patching
  - open source
authors:
  - jxnl
---

# Structured Outputs with Anyscale and Zod

Open-source LLMS are gaining popularity, and the release of Anyscale's Mistral model has made it possible to obtain structured outputs using JSON schema at any scale. Instead of relying on a model's default output mode, you can utilize JSON schema to obtain structured outputs. This approach is a time-saving alternative to extensive prompt engineering.

By the end of this blog post, you will learn how to effectively utilize instructor with Anyscale. But before we proceed, let's first explore the concept of patching.

## Understanding Modes

Instructor's patch enhances a openai api it with the following features, you can learn more about them [here](../../concepts/modes.md), for anyscale they support `JSON_SCHEMA` and `FUNCTIONS` modes. and with instructor we'll be able to use the following features:

- `response_model` in `create` calls that returns a pydantic model
- `max_retries` in `create` calls that retries the call if it fails by using a backoff strategy

## Anyscale

The good news is that Anyscale employs the same OpenAI client, and its models support some of these output modes too!

!!! note "Getting access"

    If you want to try this out for yourself check out the [Anyscale](https://anyscale.com/) website. You can get started [here](https://docs.anyscale.com/get-started).

Let's explore one of the models available in Anyscale's extensive collection!

```ts
import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

const UserSchema = z.object({
  age: z.number(),
  name: z.string()
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
  model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
  messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
  response_model: UserSchema,
})

console.log(user)
// {
//  age: 30,
//  name: "Jason Liu",
// }

```

You can find more information about Anyscale's output mode support [here](https://docs.endpoints.anyscale.com/).