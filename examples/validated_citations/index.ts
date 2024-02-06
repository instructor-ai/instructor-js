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

function createFactSchemaWithContext(dynamicContext: string) {
  return z.object({
    statement: z.string(),
    substring_quote: z.array(z.string()).transform(quotes => {
      return quotes.flatMap(quote => {
        const spans = getSpans(quote, dynamicContext)
        return spans.map(span => dynamicContext.substring(span[0], span[1]))
      })
    })
  })
}

function createQuestionAnswerWithContext(dynamicContext: string) {
  const FactSchemaWithContext = createFactSchemaWithContext(dynamicContext)

  return z.object({
    question: z.string(),
    answer: z.array(FactSchemaWithContext).transform(answers => {
      // Filter out any Facts that, after validation, have no valid quotes
      return answers.filter(fact => fact.substring_quote.length > 0)
    })
  })
}

const QuestionAnswer = z.object({
  question: z.string(),
  answer: z.array(
    z.object({
      statement: z.string(),
      substring_quote: z.array(z.string()) // Basic structure without dynamic context validation
    })
  )
})
type QuestionAnswerType = z.infer<typeof QuestionAnswer>

function getSpans(quote: string, context: string): Array<[number, number]> {
  const matches: Array<[number, number]> = []
  const regex = new RegExp(quote, "g")
  let match

  while ((match = regex.exec(context)) !== null) {
    matches.push([match.index, regex.lastIndex])
  }

  return matches.length > 0 ? matches : []
}

async function askAI(question: string, context: string): Promise<QuestionAnswerType> {
  const response = await client.chat.completions.create({
    model: "gpt-3.5-turbo-0613",
    temperature: 0,
    response_model: { schema: QuestionAnswer, name: "Question and Answer" },
    messages: [
      {
        role: "system",
        content:
          "You are a world class algorithm to answer questions with correct and exact citations."
      },
      { role: "user", content: context },
      { role: "user", content: `Question: ${question}` }
    ]
  })
  const QuestionAnswerWithContext = createQuestionAnswerWithContext(context)
  const parsedResponse = QuestionAnswerWithContext.parse(response)

  console.log(response)
  console.log(parsedResponse)

  return parsedResponse
}

const question = "Where did he go to school?"
const context = `My name is Jason Liu, and I grew up in Toronto Canada but I was born in China.
I went to an arts high school but in university I studied Computational Mathematics and physics.
  As part of coop I worked at many companies including Stitchfix, Facebook.
  I also started the Data Science club at the University of Waterloo and I was the president of the club for 2 years.`

askAI(question, context)
