# instructor-js

This is a WIP of the [instructor](https://github.com/jxnl/instructor) project implemented in JavaScript.
I am not a JavaScript developer, so this is a learning project for me, if you're interested in contributing seriously to this project, please contact me on [Twitter](https://twitter.com/jxnlco)

The simple goal of this project is to provide a simple, type-safe, and easy to use interface for the OpenAI API.

```ts
import { z } from "zod";
import { Instructor } from "instructor";

const UserSchema = z.object({
  age: z.number(),
  name: z.string().refine((name) => name.includes(" "), {
    message: "Name must contain a space",
  }),
});

type User = z.infer<typeof UserSchema>;

const client = Instructor.from_client(OpenAI());

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

- [ ] Patching with Tools and Functions
- [ ] Patching with JSON MODE
- [ ] Throwing Validation errors with ZOD
- [ ] Retrying Validations
