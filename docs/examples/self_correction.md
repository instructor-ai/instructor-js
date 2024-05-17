# Self-Correction with `LLMValidator`

## Introduction

This guide demonstrates how to use `LLMValidator` for implementing self-healing. The objective is to showcase how an instructor can self-correct by using validation errors and helpful error messages.

## Setup

Import required modules to create a zod model

```ts
import { z } from "zod"
```

## Defining Models

Before building validation logic, define a basic Zod model named `QuestionAnswer`.
We'll use this model to generate a response without validation to see the output.

```ts
const QuestionAnswer = z.object({
  question: z.string(),
  answer: z.string()
})
```

## Generating a Response

Here we coerce the model to generate a response that is objectionable.

```ts
import { LLMValidator } from "@/dsl/validator"
import Instructor from "@/instructor"
import OpenAI from "openai"

const openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" })

const instructor = Instructor({
  client: openAi,
  mode: "TOOLS"
})

const question = "What is the meaning of life?"
const context = "According to the devil the meaning of live is to live a life of sin and debauchery."

await instructor.chat.completions.create({
    model: "gpt-4o",
    max_retries: 0,
    response_model: { schema: QuestionAnswer, name: "Question and Answer" },
    messages: [
      {
        role: "system",
        content:
          "You are a system that answers questions based on the context. answer exactly what the question asks using the context."
      },
      {
        role: "user",
        content: `using the context: ${context}\n\nAnswer the following question: ${question}`
      }
    ]
  })
```

### Output Before Validation

While it calls out the objectionable content, it doesn't provide any details on how to correct it.

```json
{
  "question": "What is the meaning of life?",
  "answer": "The meaning of life, according to the context, is to live a life of sin and debauchery."
}
```

## Adding Custom Validation

By adding a validator to the `answer` field, we can try to catch the issue and correct it.
Lets integrate `LLMValidator` into the model and see the error message. Its important to note that you can use all of Zod's validators as you would normally which raise a `ZodError` with a helpful error message as it will be used as part of the self correction prompt.

```typescript
const QuestionAnswer = z.object({
  question: z.string(),
  answer: z.string().superRefine(
    LLMValidator(instructor, statement, {
      model: "gpt-4o"
    })
  )
})

try {
  await instructor.chat.completions.create({
    model: "gpt-4o",
    max_retries: 0,
    response_model: { schema: QuestionAnswer, name: "Question and Answer" },
    messages: [
      {
        role: "system",
        content:
          "You are a system that answers questions based on the context. answer exactly what the question asks using the context."
      },
      {
        role: "user",
        content: `using the context: ${context}\n\nAnswer the following question: ${question}`
      }
    ]
  })
} catch (e as ZodError[]) {
  console.error(e[0].message)
}
```

### Output After Validation

Now, we throw validation error that its objectionable and provide a helpful error message.

```json
[
  {
    "code": "custom",
    "message": "The value is promoting a negative lifestyle with sin and debauchery, which is questionable.",
    "path": [
      "answer"
    ]
  }
]
```

## Retrying with Corrections

By adding the `max_retries` parameter, we can retry the request with corrections and use the error message to correct the output.

```ts
try {
  await instructor.chat.completions.create({
    model: "gpt-4o",
    max_retries: 2,
    response_model: { schema: QuestionAnswer, name: "Question and Answer" },
    messages: [
      {
        role: "system",
        content:
          "You are a system that answers questions based on the context. answer exactly what the question asks using the context."
      },
      {
        role: "user",
        content: `using the context: ${context}\n\nAnswer the following question: ${question}`
      }
    ]
  })
} catch (e as ZodError[]) {
  console.error(e[0].message)
}
```

### Final Output

Now, we get a valid response that is not objectionable!

```json
{
  "question": "What is the meaning of life?",
  "answer": "The meaning of life is a subjective and complex question, often explored in religious, philosophical, and moral contexts. Different individuals and cultures have different beliefs and interpretations regarding the purpose and meaning of life.",
}
```