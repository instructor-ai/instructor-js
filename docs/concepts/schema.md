# Zod Schemas 

Zod is a TypeScript-first schema declaration and validation library. It is designed to be easy to use with TypeScript and to be a good fit for the language. It is the primary way of prompt engineering, just note that the room of response_model must be `z.object`.

## Basic Usage

```ts
import { z } from 'zod';

const schema = z.object({
  name: z.string(),
  age: z.number(),
});
```

## Descriptions are Prompts

One of the core things about instructors is that it's able to use these descriptions as part of the prompt. 

```ts
const userDetails = z.object({
  name: z.string().description('Your full name'),
  age: z.number(),
}).description('Fully extracted user detail');
```

## Inferred Types

We can also generate types using zod schemas.

```ts
const schema = z.object({
  name: z.string(),
  age: z.number(),
});

type SchemaType = z.infer<typeof schema>;
```

## Default Values

In order to help the language model, we can also define defaults for the values.

```ts
const schema = z.object({
  name: z.string(),
  age: z.number().optional(),
  isStudent: z.boolean().default(false),
});
```

## Optional Values 

We can also define optional values.

```ts
const schema = z.object({
  name: z.string(),
  age: z.number().optional(),
});
```

## Nested Schemas

Powerful schemas can be created by nesting schemas.

```ts
const schema = z.object({
  name: z.string(),
  address: z.object({
    street: z.string(),
    city: z.string(),
  }),
});
```

## Arrays

Arrays can be defined using the `z.array` method

```ts
const schema = z.object({
  name: z.string(),
  friends: z.array(z.string()),
});
```

## Enums 

Enums can be defined using the `z.enum` method

```ts
const schema = z.object({
  name: z.string(),
  role: z.enum(['admin', 'user']),
});
```