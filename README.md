# instructor-js

This is a WIP of the [instructor](https://github.com/jxnl/instructor) project implemented in JavaScript.
I am not a JavaScript developer, so this is a learning project for me, if you're interested in contributing seriously to this project, please contact me on [Twitter](https://twitter.com/jxnlco)

The simple goal of this project is to provide a simple, type-safe, and easy to use interface for the OpenAI API.

```ts
import { z } from "zod";
import { instruct } from "instructor";
import OpenAI from "openai";

const UserSchema = z.object({
  age: z.number(),
  name: z.string().refine((name) => name.includes(" "), {
    message: "Name must contain a space",
  }),
});

type User = z.infer<typeof UserSchema>;

const client = instruct.patch({
  client: OpenAI(process.env.OPENAI_API_KEY, process.env.OPENAI_ORG_ID),
  mode: instruct.MODES.TOOLS,
});

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

## Prompting Ideas for Zod

To adapt these Python examples for TypeScript using Zod, you'll need to translate the Python class definitions and Pydantic models into Zod schemas. Zod is a TypeScript-first schema declaration and validation library that allows you to build complex schemas with great ease and efficiency. Here's how you can convert the given examples:

### Modular Chain of Thought

Translate the `Role` and `UserDetail` models to Zod schemas. Implement the chain of thought as a string field.

```typescript
import { z } from "zod";

const RoleSchema = z.object({
  chain_of_thought: z
    .string()
    .nonempty("Think step by step to determine the correct title"),
  title: z.string(),
});

const UserDetailSchema = z.object({
  age: z.number(),
  name: z.string(),
  role: RoleSchema,
});
```

### Utilize Optional Attributes

For optional attributes, use Zod's `.optional()` method.

```typescript
const UserDetailSchema = z.object({
  age: z.number(),
  name: z.string(),
  role: z.string().optional(),
});
```

### Handling Errors Within Function Calls

Implement a wrapper class for handling errors using Zod's `.union()` method.

```typescript
const MaybeUserSchema = z.union([
  UserDetailSchema,
  z.object({
    error: z.boolean().default(false),
    message: z.string().optional(),
  }),
]);
```

### Tips for Enumerations

Use Zod's enum construct for standardized fields.

```typescript
const RoleEnum = z.enum(["PRINCIPAL", "TEACHER", "STUDENT", "OTHER"]);

const UserDetailSchema = z.object({
  age: z.number(),
  name: z.string(),
  role: RoleEnum,
});
```

### Reiterate Long Instructions

Repeat complex instructions in the schema's descriptions.

```typescript
const RoleSchema = z.object({
  instructions: z
    .string()
    .nonempty(
      "Restate the instructions and rules to correctly determine the title."
    ),
  title: z.string(),
});

const UserDetailSchema = z.object({
  age: z.number(),
  name: z.string(),
  role: RoleSchema,
});
```

### Handle Arbitrary Properties

For arbitrary properties, use a list of key-value pairs.

```typescript
const PropertySchema = z.object({
  key: z.string(),
  value: z.string(),
});

const UserDetailSchema = z.object({
  age: z.number(),
  name: z.string(),
  properties: z
    .array(PropertySchema)
    .max(5, "Extract any other properties that might be relevant."),
});
```

### Defining Relationships Between Entities

Explicitly define relationships in the schema.

```typescript
const UserDetailSchema = z.object({
  id: z.number(),
  age: z.number(),
  name: z.string(),
  friends: z.array(z.number()),
});

const UserRelationshipsSchema = z.object({
  users: z.array(UserDetailSchema),
});
```

### Reusing Components with Different Contexts

Reuse components for different contexts.

```typescript
const TimeRangeSchema = z.object({
  start_time: z.number(),
  end_time: z.number(),
});

const UserDetailSchema = z.object({
  id: z.number(),
  age: z.number(),
  name: z.string(),
  work_time: TimeRangeSchema,
  leisure_time: TimeRangeSchema,
});
```

These translations provide a structured approach to creating TypeScript schemas with Zod, mirroring the functionality and intent of the original Python examples.
