# Example: Answering Questions with Validated Citations

For the full code example check out [examples/validated_citations/index.ts](https://github.com/instructor-ai/instructor-js/blob/main/examples/validated_citations/index.ts)

## Overview

This example demonstrates how to use Instructor-js with Zod validators to ensure that every statement made by the Language Model (LM) is backed by a direct quote from the provided context, preventing hallucinations and ensuring citation accuracy. It defines TypeScript functions and Zod schemas to encapsulate the information of individual facts and the entire answer.


## Data Structures

### The `Fact` Schema

The `Fact` schema encapsulates a single statement or fact. It contains two properties:

- `fact`: A string representing the body of the fact or statement.
- `substring_quote`: A list of strings. Each string is a direct quote from the context that supports the `fact`.

#### Validation Method: `createFactWithContext`

This method dynamically creates a Zod schema for Fact with context-dependent validation. It validates the sources (`substring_quote`) using regex to find the span of each substring quote within the given context. If a span is not found, the quote is removed from the list.
```ts hl_lines="6 8-13"
import Instructor from "@/instructor"
import { z } from "zod"


function createFactWithContext(dynamicContext: string) {
  return z.object({
    statement: z.string(),
    substring_quote: z.array(z.string()).transform((quotes) => {
      return quotes.flatMap((quote) => {
        const spans = getSpans(quote, dynamicContext);
        return spans.map(span => dynamicContext.substring(span[0], span[1]));
      });
    })
  });
}

function getSpans(quote: string, context: string): Array<[number, number]> {
  const matches: any = [];
  // Example regex search for simplicity; adjust according to your actual implementation
  const regex = new RegExp(quote, 'g');
  let match;

  while ((match = regex.exec(context)) !== null) {
    matches.push([match.index, regex.lastIndex]);
  }
  return matches.length > 0 ? matches : [];
}
```

### The `QuestionAnswer` Schema

This schema encapsulates the question and its corresponding answer. It exists to provide a structure for responses from the OpenAI API call. It contains two properties:

- `question`: The question asked.
- `answer`: A list of `Fact` objects that make up the answer.

```ts hl_lines="5-8"
const QuestionAnswer = z.object({
  question: z.string(),
  answer: z.array(z.object({
    statement: z.string(),
    substring_quote: z.array(z.string()), // Basic structure without dynamic context validation
  }))
});
type QuestionAnswerType = z.infer<typeof QuestionAnswer>
```

#### Validation Method: `createQuestionAnswerWithContext`

This method dynamically generates a Zod schema for QuestionAnswer with context-sensitive validation, ensuring each Fact object in the answer list has at least one valid source. If a `Fact` object has no valid sources, it is removed from the `answer` list.

```ts hl_lines="5-8"
function createQuestionAnswerWithContext(dynamicContext: string) {
  const FactSchemaWithContext = createFactSchemaWithContext(dynamicContext);

  return z.object({
    question: z.string(),
    answer: z.array(FactSchemaWithContext).transform((answers) => {
      // Filter out any Facts that, after validation, have no valid quotes
      return answers.filter(fact => fact.substring_quote.length > 0);
    })
  });
}
```

## Function to Ask AI a Question

### The `askAI` Function

This function takes a string `question` and a string `context` and returns a `QuestionAnswer` object. It uses the OpenAI API with the dynamic Zod schema for validation.


```ts hl_lines="5 6 14"
import Instructor from "@/instructor"
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

async function askAI(question: string, context: string): Promise<QuestionAnswerType> {
  const response = await client.chat.completions.create({
    model: "gpt-3.5-turbo-0613",
    temperature: 0,
    response_model: { schema: QuestionAnswer, name: "Question and Answer" },
    messages: [
      { role: "system", content: "You are a world class algorithm to answer questions with correct and exact citations." },
      { role: "user", content: context },
      { role: "user", content: `Question: ${question}` },
    ],
  });
  const QuestionAnswerWithContext = createQuestionAnswerWithContext(context);
  const parsedResponse = QuestionAnswerWithContext.parse(response);

  return parsedResponse;
}
```

## Example


Here's an example of using these classes and functions to ask a question and validate the answer.

```ts
const question = "Where did he go to school?"
const context = `My name is Jason Liu, and I grew up in Toronto Canada but I was born in China.
I went to an arts high school but in university I studied Computational Mathematics and physics.
  As part of coop I worked at many companies including Stitchfix, Facebook.
  I also started the Data Science club at the University of Waterloo and I was the president of the club for 2 years.`
```

The output would be a `QuestionAnswer` object containing validated facts and their sources.

```ts
{
  question: "Where did Jason Liu go to school?",
  answer: [
    {
      statement: "Jason Liu went to an arts high school.",
      substring_quote: [ "arts high school" ],
    }, 
    {
      statement: "Jason Liu studied Computational Mathematics and physics in university.",
      substring_quote: [ "Computational Mathematics and physics" ],
    }
  ],
}
```

This ensures that every piece of information in the answer has been validated against the context.
