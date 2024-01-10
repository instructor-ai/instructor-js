# General Guidelines for Zod Schema Engineering

When using Zod for schema definition and validation, adhere to principles ensuring clarity, modularity, and flexibility, similar to Pydantic.

- **Modularity**: Construct self-contained schemas for reuse.
- **Self-Description**: Describe fields using Zod's `.describe()` for clarity.
- **Optionality**: Utilize `z.union` with `z.undefined()` for optional fields.
- **Standardization**: Use `z.enum` for fields with a specific set of values, including a 'Other' option for ambiguity.
- **Dynamic Data**: Apply `z.record(z.string())` for arbitrary properties, with controlled key-value pairs.
- **Entity Relationships**: Define relationships through explicit identifiers and relationship fields.
- **Contextual Logic**: Add an optional 'chain of thought' field for context.

## Modular Chain of Thought

Leverage Zod's flexibility for modular 'chain of thought', enhancing data quality.

```ts
import { z } from 'zod';

const Role = z.object({
  chainOfThought: z.string().describe("Sequential reasoning to determine the correct title"),
  title: z.string(),
});

const UserDetail = z.object({
  age: z.number(),
  name: z.string(),
  role: Role,
});
```

## Utilizing Optional Attributes

For optional fields, use `z.union` with `z.undefined()`.

```ts
const UserDetail = z.object({
  age: z.number(),
  name: z.string(),
  role: z.string().optional(),
});
```

## Error Handling Within Schemas

Create a wrapper schema for handling both successful and error states.

```ts
const MaybeUser = z.object({
  result: UserDetail.optional(),
  error: z.boolean(),
  message: z.string().optional(),
});

// `MaybeUser` can now encapsulate both a result and an error state.
```

### Simplification with Dynamic Patterns

Utilize Zod's dynamic schema creation for streamlining error handling.

```ts
const Maybe = (schema) => z.object({
  result: schema.optional(),
  error: z.boolean(),
  message: z.string().optional(),
});

const MaybeUser = Maybe(UserDetail);
```

## Tips for Enumerations

Implement `z.enum` for standardized fields, including an 'Other' option.

```ts
const Role = z.enum(["PRINCIPAL", "TEACHER", "STUDENT", "OTHER"]);

const UserDetail = z.object({
  age: z.number(),
  name: z.string(),
  role: Role,
});
```

## Reiterate Long Instructions

For complex attributes, restate instructions in the field's description.

```ts
const Role = z.object({
  instructions: z.string().describe("Repeat the rules for determining the title."),
  title: z.string(),
});
```

## Handling Arbitrary Properties

Use `z.record(z.string())` for undefined attributes.

```ts
const UserDetail = z.object({
  age: z.number(),
  name: z.string(),
  properties: z.record(z.string()).describe("Arbitrary key-value pairs"),
});
```

## Limiting List Lengths

Control list lengths through Zod's array validations.

```ts
const Property = z.object({
  key: z.string(),
  value: z.string(),
});

const UserDetail = z.object({
  age: z.number(),
  name: z.string(),
  properties: z.array(Property).max(6).describe("Manageable set of properties"),
});
```

## Defining Entity Relationships

Explicitly define relationships in your schemas, like user friends' IDs.

```ts
const UserDetail = z.object({
  id: z.number(),
  age: z.number(),
  name: z.string(),
  friends: z.array(z.number()).describe("List of friend IDs, representing user relationships"),
});
```

## Reusing Components in Different Contexts

Reuse components in various contexts by defining them separately.

```ts
const TimeRange = z.object({
  startTime: z.number().describe("Start time in hours."),
  endTime: z.number().describe("End time in hours."),
});

const UserDetail = z.object({
  id: z.number(),
  age: z.number(),
  name: z.string(),
  workTime: TimeRange,
  leisureTime: TimeRange,
});
```

These guidelines should streamline and enhance your Zod schema creation and validation processes.