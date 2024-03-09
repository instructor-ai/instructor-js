---
draft: False
date: 2024-03-07
slug: open-source-local-structured-output-zod-json-openai
tags:
  - llms
  - opensource
  - together
  - llama-cpp-python
  - anyscale
  - groq
  - mistral
  - ollama
authors:
  - jxnl
---

# Structured Output for Open Source and Local LLMS

Originally, Instructor facilitated API interactions solely via the OpenAI SDK, with an emphasis on function calling by incorporating [Zod](https://zod.dev/) for structured data validation and serialization.

As the year progressed, we expanded our toolkit by integrating [JSON mode](../../concepts/patching.md#json-mode), thus enhancing our adaptability to vision models and open source models. This advancement now enables us to support an extensive range of models, from [GPT](https://openai.com/api/) and [Mistral](https://mistral.ai) to virtually any model accessible through [Ollama](https://ollama.ai) and [Hugging Face](https://huggingface.co/models). For more insights into leveraging JSON mode with various models, refer back to our detailed guide on [Patching](../../concepts/patching.md).

<!-- more -->

## Exploring Different OpenAI Clients with Instructor

Below, we explore some of the notable clients integrated with Instructor, providing structured outputs and enhanced capabilities, complete with examples of how to initialize and patch each client.

## Local Models

### Ollama: A New Frontier for Local Models

For an in-depth exploration of Ollama, including setup and advanced features, refer to the documentation. The [Ollama official website](https://ollama.ai/download) also provides essential resources, model downloads, and community support for newcomers.

```
ollama run llama2
```

```js
import Instructor from "@instructor-ai/instructor"
import OpenAI from "openai"
import { z } from "zod"

const UserExtractSchema = z.object({
  age: z.number(),
  name: z.string()
})

const oai = new OpenAI({
  apiKey: "ollama",  // required, but unused
  baseUrl: "http://localhost:11434/v1", // updated API URL
})

const client = Instructor({
  client: oai,
  mode: "FUNCTIONS"
})

const user = await client.chat.completions.create({
  model: "llama2",
  messages: [{ role: "user", content: "Jason is 30 years old" }],
  response_model: { schema: UserExtractSchema, name: "UserExtractSchema" }
})

console.log(user)
// { age: 30, name: "Jason" }
```

## Alternative Providers

### Anyscale

```bash
export ANYSCALE_API_KEY="your-api-key"
```

```js
import { z } from "zod";
import Instructor from "@instructor-js/instructor";
import OpenAI from "openai";

// Define the schema using Zod
const UserExtractSchema = z.object({
  name: z.string(),
  age: z.number(),
});

// Initialize OpenAI client
const oai = new OpenAI({
  apiKey: process.env.ANYSCALE_API_KEY,
  base_url: "https://api.endpoints.anyscale.com/v1",
});

// Patch the OpenAI client with Instructor-js
const client = Instructor({
  client: oai,
  mode: "JSON_SCHEMA"
});

// Use the patched client to create a chat completion
const resp = await client.chat.completions.create({
  model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
  messages: [
    { role: "system", content: "You are a world class extractor" },
    { role: "user", content: 'Extract the following entities: "Jason is 20"' },
  ],
  response_model: { schema: UserExtractSchema, name: "UserExtractSchema" },
});

console.log(resp);
// Expected output: { name: 'Jason', age: 20 }
```

### Groq

[Groq's official documentation](https://groq.com/), offers a unique approach to processing with its tensor architecture. This innovation significantly enhances the performance of structured output processing.

```bash
export GROQ_API_KEY="your-api-key"
```

```js
import { z } from "zod";
import Instructor from "@instructor-js/instructor";
import Groq from "groq-sdk";

// Initialize Groq client
const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Define the schema using Zod
const UserExtractSchema = z.object({
  name: z.string(),
  age: z.number(),
});

// Patch the Groq client with Instructor-js
const client = Instructor({
  client: groqClient,
  mode: "FUNCTIONS",
});

// Use the patched client to create a chat completion
const user = await client.chat.completions.create({
  model: "mixtral-8x7b-32768",
  response_model: { schema: UserExtractSchema, name: "UserExtract" },
  messages: [
    { role: "user", content: "Extract jason is 25 years old" },
  ],
});

console.log(user);
// { name: 'jason', age: 25 }
```

### Together AI

Together AI, when combined with Instructor, offers a seamless experience for developers looking to leverage structured outputs in their applications.

```bash
export TOGETHER_API_KEY="your-api-key"
```

```js
import { z } from "zod";
import Instructor from "@instructor-js/instructor";
import OpenAI from "openai";


const client = Instructor({
  client: new OpenAI({
    apiKey: process.env.TOGETHER_API_KEY,
    base_url: "https://api.together.xyz/v1",
  }),
  mode: "TOOLS",
});

const UserExtractSchema = z.object({
  name: z.string(),
  age: z.number(),
});

const user = await client.chat.completions.create({
  model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
  response_model: { schema: UserExtractSchema, name: "UserExtract" },
  messages: [
    { role: "user", content: "Extract jason is 25 years old" },
  ],
});

console.assert(user instanceof UserExtractSchema, "Should be instance of UserExtract");
console.log(user);
//> name='jason', age=25
```
