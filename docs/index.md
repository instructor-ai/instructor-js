# instructor-js

_Structured extraction in Typescript, powered by llms, designed for simplicity, transparency, and control._

---

[![Twitter Follow](https://img.shields.io/twitter/follow/jxnlco?style=social)](https://twitter.com/jxnlco)
[![Twitter Follow](https://img.shields.io/twitter/follow/dimitrikennedy?style=social)](https://twitter.com/dimitrikennedy)
[![Documentation](https://img.shields.io/badge/docs-available-brightgreen)](https://jxnl.github.io/instructor-js)
[![GitHub issues](https://img.shields.io/github/issues/instructor-ai/instructor-js.svg)](https://github.com/instructor-ai/instructor-js/issues)
[![Discord](https://img.shields.io/discord/1192334452110659664?label=discord)](https://discord.gg/CV8sPM5k5Y)

Dive into the world of Typescript-based structured extraction, by OpenAI's function calling API and Zod, typeScript-first schema validation with static type inference. Instructor stands out for its simplicity, transparency, and user-centric design. Whether you're a seasoned developer or just starting out, you'll find Instructor's approach intuitive and steerable.

Check us out in [Python](https://jxnl.github.io/instructor/), [Elixir](https://github.com/thmsmlr/instructor_ex/) and [PHP](https://github.com/cognesy/instructor-php/).

If you want to port Instructor to another language, please reach out to us on [Twitter](https://twitter.com/jxnlco) we'd love to help you get started!

## Usage

To check out all the tips and tricks to prompt and extract data, check out the [documentation](https://instructor-ai.github.io/instructor-js/tips/prompting/).

```ts
import Instructor from "@instructor-ai/instructor";
import OpenAI from "openai"
import { z } from "zod"

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "FUNCTIONS"
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

## Why use Instructor?

The question of using Instructor is fundamentally a question of why to use zod.

1. **Powered by OpenAI** — Instructor is powered by OpenAI's function calling API. This means you can use the same API for both prompting and extraction.

2. **Customizable** — Zod is highly customizable. You can define your own validators, custom error messages, and more.

3. **Ecosystem** Zod is the most widely used data validation library for Typescript.

4. **Battle Tested** — Zod is downloaded over 24M times per month, and supported by a large community of contributors.

## More Examples

If you'd like to see more check out our [cookbook](examples/index.md).

[Installing Instructor](installation.md) is a breeze. 

## Contributing

If you want to help out, checkout some of the issues marked as `good-first-issue` or `help-wanted`. Found [here](https://github.com/instructor-ai/instructor-js/labels/good%20first%20issue). They could be anything from code improvements, a guest blog post, or a new cook book.

## License

This project is licensed under the terms of the MIT License.
