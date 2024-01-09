# Why use Instructor?

??? question "Why use Zod?"

    Its hard to answer the question of why use Instructor without first answering [why use Zod.](https://zod.dev/?id=introduction):


    - **Powered by OpenAI** &mdash; Instructor is powered by OpenAI's function calling API. This means you can use the same API for both prompting and extraction.

    - **Customization** &mdash; Zod is highly customizable. You can define your own validators, custom error messages, and more.

    - **Ecosystem** &mdash; Zod is the most widely used data validation library for Typescript.

    - **Battle tested** &mdash; Zod is downloaded over 24M times/month and is supported by a large community of contributors. If you're trying to do something with Zod, someone else has probably already done it.

Our `Instructor` client for the `OpenAI` class introduces three key enhancements:

- **Response Mode:** Specify a Zod model to streamline data extraction.
- **Max Retries:** Set your desired number of retry attempts for requests.
- **Validation Context:** Provide a context object for enhanced validator access.
  A Glimpse into Instructor's Capabilities

!!! note "Using Validators"

    Learn more about validators checkout our blog post [Good llm validation is just good validation](https://jxnl.github.io/instructor/blog/2023/10/23/good-llm-validation-is-just-good-validation/)

With Instructor, your code becomes more efficient and readable. Here’s a quick peek:

## Understanding the `Instructor` class

Lets go over the `Instructor` class. And see how we can leverage it to make use of instructor

### Step 1: Patch the OpenAI client

First, import the required libraries and construct the Instructor class by passing in the OpenAI client. This exposes new functionality with the `response_model` parameter.

```ts
import Instructor from "@instructor-ai/instructor";
import OpenAI from "openai"
import { z } from "zod"

// Create the OpenAI client
const oai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? undefined,
    organization: process.env.OPENAI_ORG_ID ?? undefined,
})

// This enables response_model keyword
// from client.chat.completions.create
const client = Instructor({
    client: oai,
    mode: "FUNCTIONS"
})
```

### Step 2: Define the Zod Model

Create a Zod model to define the structure of the data you want to extract. This model will map directly to the information in the prompt.

```ts
import { z } from "zod"

const UserSchema = z.object({
    age: z.number(),
    name: z.string(),
})

type User = z.infer<typeof UserSchema>
```

### Step 3: Extract

Use the `client.chat.completions.create` method to send a prompt and extract the data into the Zod object. The `response_model` parameter specifies the Zod schema to use for extraction. Its helpful to annotate the variable with the type of the response model, which will help your IDE provide autocomplete and spell check.

```ts

const user = await client.chat.completions.create({
    messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
    model: "gpt-3.5-turbo",
    response_model: { schema: UserSchema }
})

console.log(user)
// { age: 30, name: "Jason Liu" }
```

## Understanding Validation

!!! warning "This section is a work in progress"

    This section is a work in progress. Consider contributing by opening a PR.

## Self Correcting on Validation Error

Here, the `UserDetails` Zod schema is passed as the `response_model`, and `max_retries` is set to 2.

```ts
import Instructor from "@instructor-ai/instructor";
import OpenAI from "openai"
import { z } from "zod"

const oai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? undefined,
    organization: process.env.OPENAI_ORG_ID ?? undefined,
})

// Apply the patch to the OpenAI client
const client = Instructor({
    client: oai,
    mode: "FUNCTIONS"
})

// Use refine to ensure the name is uppercase
const UserDetails = z.object({
    age: z.number(),
    name: z.string().refine((v) => v.toUpperCase() === v, {
        message: "Name must be in uppercase.",
    }
})

const user = await client.chat.completions.create({
    messages: [{ role: "user", content: "Extract jason is 30 years old" }],
    model: "gpt-3.5-turbo",
    response_model: { schema: UserDetails },
    max_retries: 2,
})

console.log(user.name)
// JASON
```

As you can see, we've baked in a self correcting mechanism into the model. This is a powerful way to make your models more robust and less brittle without including a lot of extra code or prompts.