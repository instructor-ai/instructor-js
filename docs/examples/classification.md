# Text Classification

This tutorial showcases how to implement text classification tasks—specifically, single-label and multi-label classifications—using the OpenAI API.

!!! tips "Motivation"

    Text classification is a common problem in many NLP applications, such as spam detection or support ticket categorization. The goal is to provide a systematic way to handle these cases using OpenAI's GPT models.

## Single-Label Classification

### Defining the Structures

For single-label classification, we first define an **`enum`** for possible labels and a Zod schema for the output.

```ts
import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

enum CLASSIFICATION_LABELS {
  "SPAM" = "SPAM",
  "NOT_SPAM" = "NOT_SPAM"
}

const SimpleClassificationSchema = z.object({
  class_label: z.nativeEnum(CLASSIFICATION_LABELS)
})

type SimpleClassification = z.infer<typeof SimpleClassificationSchema>

```

### Classifying Text

The function **`classify`** will perform the single-label classification.

```js
const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "FUNCTIONS"
})

async function classify(data: string): Promise<SimpleClassification> {
  const classification = await client.chat.completions.create({
    messages: [{ role: "user", content: `"Classify the following text: ${data}` }],
    model: "gpt-3.5-turbo",
    response_model: { schema: SimpleClassificationSchema },
    max_retries: 3
  })

  return classification
}

const classification = await classify(
  "Hello there I'm a nigerian prince and I want to give you money"
)

console.log({ classification })
// { class_label: 'SPAM' }
```

## Multi-Label Classification

### Defining the Structures

For multi-label classification, we introduce a new enum class and a different Zod schema to handle multiple labels.

```ts
enum MULTI_CLASSIFICATION_LABELS {
  "BILLING" = "billing",
  "GENERAL_QUERY" = "general_query",
  "HARDWARE" = "hardware"
}

const MultiClassificationSchema = z.object({
  predicted_labels: z.array(z.nativeEnum(MULTI_CLASSIFICATION_LABELS))
})

type MultiClassification = z.infer<typeof MultiClassificationSchema>
```

### Classifying Text

The function **`multi_classify`** is responsible for multi-label classification.

```ts
async function multi_classify(data: string): Promise<MultiClassification> {
  const classification = await client.chat.completions.create({
    messages: [{ role: "user", content: `"Classify the following support ticket: ${data}` }],
    model: "gpt-3.5-turbo",
    response_model: { schema: MultiClassificationSchema },
    max_retries: 3
  })
  return classification 
}

const classification = await multi_classify(
  "My account is locked and I can't access my billing info. Phone is also broken"
)

console.log({ classification })
// { predicted_labels: [ 'billing', 'hardware' ] }
```
