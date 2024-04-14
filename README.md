# instructor-js

_Structured extraction in Typescript, powered by llms, designed for simplicity, transparency, and control._

---

[![Twitter Follow](https://img.shields.io/twitter/follow/jxnlco?style=social)](https://twitter.com/jxnlco)
[![Twitter Follow](https://img.shields.io/twitter/follow/dimitrikennedy?style=social)](https://twitter.com/dimitrikennedy)
[![NPM Version](https://img.shields.io/npm/v/@instructor-ai/instructor.svg)](https://www.npmjs.com/package/@instructor-ai/instructor)
[![Documentation](https://img.shields.io/badge/docs-available-brightgreen)](https://jxnl.github.io/instructor-js)
[![GitHub issues](https://img.shields.io/github/issues/instructor-ai/instructor-js.svg)](https://github.com/instructor-ai/instructor-js/issues)
[![Discord](https://img.shields.io/discord/1192334452110659664?label=discord)](https://discord.gg/CV8sPM5k5Y)

Dive into the world of Typescript-based structured extraction, by OpenAI's function calling API and Zod, typeScript-first schema validation with static type inference. Instructor stands out for its simplicity, transparency, and user-centric design. Whether you're a seasoned developer or just starting out, you'll find Instructor's approach intuitive and steerable.


## Installation

```bash
bun add @instructor-ai/instructor zod openai
```

```bash
npm i @instructor-ai/instructor zod openai
```

```bash
pnpm add @instructor-ai/instructor zod openai
```

## Basic Usage
To check out all the tips and tricks to prompt and extract data, check out the [documentation](https://instructor-ai.github.io/instructor-js/tips/prompting/).


```typescript

import Instructor from "@instructor-ai/instructor";
import OpenAI from "openai"
import { z } from "zod"

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "TOOLS"
})

const UserSchema = z.object({
  // Description will be used in the prompt
  age: z.number().describe("The age of the user"), 
  name: z.string()
})


// User will be of type z.infer<typeof UserSchema>
const user = await client.chat.completions.create({
  messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
  model: "gpt-3.5-turbo",
  response_model: { 
    schema: UserSchema, 
    name: "User"
  }
})

console.log(user)
// { age: 30, name: "Jason Liu" }
```


## API Reference

### Instructor Class
The main class for creating an Instructor client.

**createInstructor**
```typescript
function createInstructor<C extends GenericClient | OpenAI>(args: {
  client: OpenAILikeClient<C>;
  mode: Mode;
  debug?: boolean;
}): InstructorClient<C>
```

Creates an instance of the Instructor class.

- client: An OpenAI-like client.
- mode: The mode of operation.
- debug: Whether to log debug messages.

Returns the extended OpenAI-Like client.


**chat.completions.create**
```typescript
chat.completions.create<
        T extends z.AnyZodObject,
        P extends T extends z.AnyZodObject ? ChatCompletionCreateParamsWithModel<T>
        : ClientTypeChatCompletionParams<OpenAILikeClient<C>> & { response_model: never }
      >(
        params: P
      ): Promise<ReturnTypeBasedOnParams<typeof this.client, P>>
```
When response_model is present in the params, creates a chat completion with structured extraction based on the provided schema - otherwise will proxy back to the provided client.

- params: Chat completion parameters including the response model schema.
- Returns a promise resolving to the extracted data based on the schema.


### Modes

Instructor supports different modes for defining the structure and format of the response from the language model. These modes are defined in the `zod-stream` package and are as follows:

- `FUNCTIONS` (*DEPRECATED*): Generates a response using OpenAI's function calling API. It maps to the necessary parameters for the function calling API, including the `function_call` and `functions` properties. 

- `TOOLS`: Generates a response using OpenAI's tool specification. It constructs the required parameters for the tool specification, including the `tool_choice` and `tools` properties.

- `JSON`: It sets the `response_format` to `json_object` and includes the JSON schema in the system message to guide the response generation. (Together & Anyscale)

- `MD_JSON`: Generates a response in JSON format embedded within a Markdown code block. It includes the JSON schema in the system message and expects the response to be a valid JSON object wrapped in a Markdown code block.

- `JSON_SCHEMA`: Generates a response using "JSON mode" that conforms to a provided JSON schema. It sets the `response_format` to `json_object` with the provided schema and includes the schema description in the system message.



## Examples


### Streaming Completions
Instructor supports partial streaming completions, allowing you to receive extracted data in real-time as the model generates its response. This can be useful for providing a more interactive user experience or processing large amounts of data incrementally.

```typescript
import Instructor from "@instructor-ai/instructor"
import OpenAI from "openai"
import { z } from "zod"

const textBlock = `
  In our recent online meeting, participants from various backgrounds joined to discuss the upcoming tech conference. 
  The names and contact details of the participants were as follows:

  - Name: John Doe, Email: johndoe@email.com, Twitter: @TechGuru44
  - Name: Jane Smith, Email: janesmith@email.com, Twitter: @DigitalDiva88
  - Name: Alex Johnson, Email: alexj@email.com, Twitter: @CodeMaster2023

  During the meeting, we agreed on several key points. The conference will be held on March 15th, 2024, at the Grand Tech Arena located at 4521 Innovation Drive. Dr. Emily Johnson, a renowned AI researcher, will be our keynote speaker. The budget for the event is set at $50,000, covering venue costs, speaker fees, and promotional activities. 

  Each participant is expected to contribute an article to the conference blog by February 20th. A follow-up meeting is scheduled for January 25th at 3 PM GMT to finalize the agenda and confirm the list of speakers.
`

async function extractData() {
  const ExtractionSchema = z.object({
    users: z.array(
      z.object({
        name: z.string(),
        handle: z.string(),
        twitter: z.string()
      })
    ).min(3),
    location: z.string(),
    budget: z.number()
  })

  const oai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? undefined,
    organization: process.env.OPENAI_ORG_ID ?? undefined
  })

  const client = Instructor({
    client: oai,
    mode: "TOOLS"
  })

  const extractionStream = await client.chat.completions.create({
    messages: [{ role: "user", content: textBlock }],
    model: "gpt-3.5-turbo",
    response_model: {
      schema: ExtractionSchema,
      name: "Extraction"
    },
    max_retries: 3,
    stream: true
  })

  let extractedData = {}
  for await (const result of extractionStream) {
    extractedData = result
    console.log("Partial extraction:", result)
  }
  
  console.log("Final extraction:", extractedData)
}

extractData()
```

In this example, we define an ExtractionSchema using Zod to specify the structure of the data we want to extract. We then create an Instructor client with streaming enabled and pass the schema to the response_model parameter.

The extractionStream variable holds an async generator that yields partial extraction results as they become available. We iterate over the stream using a for await...of loop, updating the extractedData object with each partial result and logging it to the console.

Finally, we log the complete extracted data once the stream is exhausted.


### Using Different Providers via proxy
Instructor supports various providers that adhere to the OpenAI API specification. You can easily switch between providers by configuring the appropriate client and specifying the desired model and mode.

**Anyscale**
```typescript
import Instructor from "@instructor-ai/instructor"
import OpenAI from "openai"
import { z } from "zod"

const UserSchema = z.object({
  age: z.number(),
  name: z.string().refine(name => name.includes(" "), {
    message: "Name must contain a space"
  })
})

async function extractUser() {
  const client = new OpenAI({
    baseURL: "https://api.endpoints.anyscale.com/v1",
    apiKey: process.env.ANYSCALE_API_KEY
  })

  const instructor = Instructor({
    client: client,
    mode: "TOOLS"
  })

  const user = await instructor.chat.completions.create({
    messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
    model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
    response_model: {
      schema: UserSchema,
      name: "User"
    },
    max_retries: 4
  })

  return user
}

const anyscaleUser = await extractUser()
console.log("Anyscale user:", anyscaleUser)
```

**Together**
```typescript
import Instructor from "@instructor-ai/instructor"
import OpenAI from "openai"
import { z } from "zod"

const UserSchema = z.object({
  age: z.number(),
  name: z.string().refine(name => name.includes(" "), {
    message: "Name must contain a space"
  })
})

async function extractUser() {
  const client = new OpenAI({
    baseURL: "https://api.together.xyz/v1",
    apiKey: process.env.TOGETHER_API_KEY
  })

  const instructor = Instructor({
    client: client,
    mode: "TOOLS"
  })

  const user = await instructor.chat.completions.create({
    messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
    model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
    response_model: {
      schema: UserSchema,
      name: "User"
    },
    max_retries: 4
  })

  return user
}

const togetherUser = await extractUser()
console.log("Together user:", togetherUser)
```

In these examples, we specify a specific base URL and API key from Anyscale, and Together..

The extractUser function takes the model, mode, and provider as parameters. It retrieves the corresponding provider configuration, creates an OpenAI client, and initializes an Instructor instance with the specified mode.

We then call instructor.chat.completions.create with the desired model, response schema, and other parameters to extract the user information.

By varying the provider, model, and mode arguments when calling extractUser, you can easily switch between different providers and configurations.


### Using Non-OpenAI Providers with llm-polyglot

Instructor supports integration with providers that don't adhere to the OpenAI SDK, such as Anthropic, Azure, and Cohere, through the [`llm-polyglot`](https://github.com/hack-dance/island-ai/tree/main/public-packages/llm-client) library maintained by @dimitrikennedy. This library provides a unified interface for interacting with various language models across different providers.

```typescript
import { createLLMClient } from "llm-polyglot"
import Instructor from "@instructor-ai/instructor"
import { z } from "zod"

const anthropicClient = createLLMClient({
  provider: "anthropic",
  apiKey: process.env.ANTHROPIC_API_KEY
})

const UserSchema = z.object({
  age: z.number(),
  name: z.string()
})

const instructor = Instructor<typeof anthropicClient>({
  client: anthropicClient,
  mode: "TOOLS"
})

async function extractUser() {
  const user = await instructor.chat.completions.create({
    model: "claude-3-opus-20240229",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: "My name is Dimitri Kennedy."
      }
    ],
    response_model: {
      name: "extract_name",
      schema: UserSchema
    }
  })

  return user
}

// Example usage
const extractedUser = await extractUser()
console.log("Extracted user:", extractedUser)
```

In this example, we use the createLLMClient function from the llm-polyglot library to create a client for the Anthropic provider. We pass the provider name ("anthropic") and the corresponding API key to the function.

Next, we define a UserSchema using Zod to specify the structure of the user data we want to extract.

We create an Instructor instance by passing the Anthropic client and the desired mode to the Instructor function. Note that we use Instructor<typeof anthropicClient> to specify the client type explicitly.

The extractUser function demonstrates how to use the Instructor instance to extract user information from a given input. We call instructor.chat.completions.create with the appropriate model ("claude-3-opus-20240229" in this case), parameters, and the response_model that includes our UserSchema.

Finally, we log the extracted user information.

By leveraging the llm-polyglot library, Instructor enables seamless integration with a wide range of providers beyond those that follow the OpenAI SDK. This allows you to take advantage of the unique capabilities and models offered by different providers while still benefiting from the structured extraction and validation features of Instructor.

For additional support and information on using other providers with [llm-polyglot](https://github.com/hack-dance/island-ai/tree/main/public-packages/llm-client), please refer to the library's documentation and examples.


## More Examples

If you'd like to see more check out our [cookbook](docs/examples/index.md).

[Installing Instructor](docs/installation.md) is a breeze.


## Built on Island AI

Instructor is built on top of several powerful packages from the [Island AI](https://github.com/hack-dance/island-ai) toolkit, developed and maintained by [Dimitri Kennedy](https://twitter.com/dimitrikennedy). These packages provide essential functionality for structured data handling and streaming with Large Language Models.

### zod-stream

[zod-stream](https://github.com/hack-dance/island-ai/tree/main/public-packages/zod-stream) is a client module that interfaces directly with LLM streams. It utilizes Schema-Stream for efficient parsing and is equipped with tools for processing raw responses from OpenAI, categorizing them by mode (function, tools, JSON, etc.), and ensuring proper error handling and stream conversion. It's ideal for API integration delivering structured LLM response streams.

### schema-stream

[schema-stream](https://github.com/hack-dance/island-ai/tree/main/public-packages/schema-stream) is a JSON streaming parser that incrementally constructs and updates response models based on Zod schemas. It's designed for real-time data processing and incremental model hydration.


### llm-polyglot

[llm-polyglot](https://github.com/hack-dance/island-ai/tree/main/public-packages/llm-client) is a library that provides a unified interface for interacting with various language models across different providers, such as OpenAI, Anthropic, Azure, and Cohere. It simplifies the process of working with multiple LLM providers and enables seamless integration with Instructor.

Instructor leverages the power of these Island AI packages to deliver a seamless and efficient experience for structured data extraction and streaming with LLMs. The collaboration between Dimitri Kennedy, the creator of Island AI, and Jason Liu, the author of the original Instructor Python package, has led to the development of the TypeScript version of Instructor, which introduces the concept of partial JSON streaming from LLM's.

For more information about Island AI and its packages, please refer to the [Island AI repository](https://github.com/hack-dance/island-ai).


## Why use Instructor?

The question of using Instructor is fundamentally a question of why to use zod.

1. **Works with the OpenAI SDK** — Instructor follows OpenAI's API. This means you can use the same API for both prompting and extraction across multiple providers that support the OpenAI API.

2. **Customizable** — Zod is highly customizable. You can define your own validators, custom error messages, and more.

3. **Ecosystem** Zod is the most widely used data validation library for Typescript.

4. **Battle Tested** — Zod is downloaded over 24M times per month, and supported by a large community of contributors.




## Contributing

If you want to help out, checkout some of the issues marked as `good-first-issue` or `help-wanted`. Found [here](https://github.com/instructor-ai/instructor-js/labels/good%20first%20issue). They could be anything from code improvements, a guest blog post, or a new cook book.

Checkout the [contribution guide]() for details on how to set things up, testing, changesets and guidelines.

> ℹ️ **Tip:**  Support in other languages

    Check out ports to other languages below:

    - [Python](https://www.github.com/jxnl/instructor)
    - [Elixir](https://github.com/thmsmlr/instructor_ex/)

    If you want to port Instructor to another language, please reach out to us on [Twitter](https://twitter.com/jxnlco) we'd love to help you get started!

## License

This project is licensed under the terms of the MIT License.
