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

Instructor's patch enhances a openai api it with the following features, you can learn more about them [here](../../concepts/modes.md), for Togethers they support `JSON_SCHEMA` and `TOOLS` modes. and with instructor we'll be able to use the following features:

- `response_model` in `create` calls that returns a Zod schema
- `max_retries` in `create` calls that retries the call if it fails by using a backoff strategy

## Anyscale

The good news is that Anyscale employs the same OpenAI client, and its models support some of these output modes too!

!!! note "Getting access"

    If you want to try this out for yourself check out the [Together Compute](https://together.ai/) website. You can get started [here](https://docs.together.ai/docs/quickstart).

Let's explore one of the models available in Together's extensive collection!

```ts
import Instructor from "@instructor-ai/instructor";
import OpenAI from "openai"
import { z } from "zod"


const oai = new OpenAI({
  baseURL: "https://api.together.xyz",
  apiKey: process.env.TOGETHER_API_KEY ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "TOOLS"
})

const Summary = z.object({
  title: z.string().describe("Short Descriptive Title"),
  actionItems: z.array(z.string()).describe("A list of action items, short and to the point")
})

const extract = await client.chat.completions.create({
  messages: [
    {
      role: "system",
      content:
        "The following is a transcript of a voice message, extract the relevant actions, correctly return JSON"
    },
    {
      role: "user",
      content:
        "This week I have to get some groceries, pack for my trip to peru and also buy the plane tickets."
    }
  ],
  model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
  response_model: { schema: Summary, name: "SummarizeNotes" },
  max_retries: 2
})

console.log(extract)
/**
 * {
 *  title: "Weekly Tasks",
 *  actionItems: ["get some groceries", "pack for my trip to peru", "buy the plane tickets"]
 * }
 */
```
You can find more information about Togethers's output mode support [here](https://docs.together.ai/docs/json-mode/).
