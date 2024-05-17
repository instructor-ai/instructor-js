import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

import { saveHtmlDocument } from "./exampleGraphMaker"

const PropertySchema = z.object({
  key: z.string(),
  value: z.string(),
  resolved_absolute_value: z.string()
})

const EntitySchema = z.object({
  id: z
    .number()
    .describe(
      "Unique identifier for the entity, used for deduplication, design a scheme allows multiple entities"
    ),
  subquote_string: z
    .array(z.string())
    .describe(
      "Correctly resolved value of the entity, if the entity is a reference to another entity, this should be the id of the referenced entity, include a few more words before and after the value to allow for some context to be used in the resolution"
    ),
  entity_title: z.string(),
  properties: z.array(PropertySchema).describe("List of properties of the entity"),
  dependencies: z
    .array(z.number())
    .describe("List of entity ids that this entity depends or relies on to resolve it")
})

const DocumentExtractionSchema = z.object({
  entities: z
    .array(EntitySchema)
    .describe(
      "Body of the answer, each fact should be its separate object with a body and a list of sources"
    )
})

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "TOOLS"
})

const askAi = async (input: string) => {
  const answer = await client.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are a perfect entity resolution system that extracts facts from the document. Extract and resolve a list of entities from the following document:"
      },
      {
        role: "user",
        content: input
      }
    ],
    model: "gpt-4o",
    response_model: { schema: DocumentExtractionSchema, name: "Document Extraction" },
    max_retries: 3,
    seed: 1
  })

  return answer
}

const content = `
Sample Legal Contract
Agreement Contract

This Agreement is made and entered into on 2020-01-01 by and between Company A ("the Client") and Company B ("the Service Provider").

Article 1: Scope of Work

The Service Provider will deliver the software product to the Client 30 days after the agreement date.

Article 2: Payment Terms

The total payment for the service is $50,000.
An initial payment of $10,000 will be made within 7 days of the the signed date.
The final payment will be due 45 days after [SignDate].

Article 3: Confidentiality

The parties agree not to disclose any confidential information received from the other party for 3 months after the final payment date.

Article 4: Termination

The contract can be terminated with a 30-day notice, unless there are outstanding obligations that must be fulfilled after the [DeliveryDate].
`

const model = await askAi(content)
/*
OUTPUT:
{
  "entities": [
    {
      "id": 1,
      "subquote_string": [
        "This Agreement is made and entered into on 2020-01-01 by and between Company A (\"the Client\") and Company B (\"the Service Provider\")."
      ],
      "entity_title": "Agreement Contract",
      "properties": [
        {
          "key": "Date",
          "value": "2020-01-01",
          "resolved_absolute_value": "2020-01-01"
        },
        {
          "key": "Client",
          "value": "Company A",
          "resolved_absolute_value": "Company A"
        },
        {
          "key": "Service Provider",
          "value": "Company B",
          "resolved_absolute_value": "Company B"
        }
      ],
      "dependencies": []
    },
    {
      "id": 2,
      "subquote_string": [
        "The Service Provider will deliver the software product to the Client 30 days after the agreement date."
      ],
      "entity_title": "Delivery",
      "properties": [
        {
          "key": "Days from Agreement Date",
          "value": "30",
          "resolved_absolute_value": "2020-01-31"
        }
      ],
      "dependencies": [
        1
      ]
    },
    {
      "id": 3,
      "subquote_string": [
        "The total payment for the service is $50,000.",
        "An initial payment of $10,000 will be made within 7 days of the the signed date.",
        "The final payment will be due 45 days after [SignDate]."
      ],
      "entity_title": "Payment Terms",
      "properties": [
        {
          "key": "Total Payment",
          "value": "$50,000",
          "resolved_absolute_value": "50000"
        },
        {
          "key": "Initial Payment",
          "value": "$10,000",
          "resolved_absolute_value": "10000"
        },
        {
          "key": "Initial Payment Date",
          "value": "7 days after signed date",
          "resolved_absolute_value": "2020-01-08"
        },
        {
          "key": "Final Payment Date",
          "value": "45 days after signed date",
          "resolved_absolute_value": "2020-02-15"
        }
      ],
      "dependencies": [
        1
      ]
    },
    {
      "id": 4,
      "subquote_string": [
        "The parties agree not to disclose any confidential information received from the other party for 3 months after the final payment date."
      ],
      "entity_title": "Confidentiality",
      "properties": [
        {
          "key": "Non-Disclosure Period",
          "value": "3 months after final payment date",
          "resolved_absolute_value": "2020-05-15"
        }
      ],
      "dependencies": [
        3
      ]
    },
    {
      "id": 5,
      "subquote_string": [
        "The contract can be terminated with a 30-day notice, unless there are outstanding obligations that must be fulfilled after the [DeliveryDate]."
      ],
      "entity_title": "Termination",
      "properties": [
        {
          "key": "Notice Period",
          "value": "30 day",
          "resolved_absolute_value": "30 days"
        }
      ],
      "dependencies": [
        2
      ]
    }
  ]
}
*/

console.log({ model: JSON.stringify(model) })

// Create HTMl document from the model
saveHtmlDocument(model, "entityGraph")
