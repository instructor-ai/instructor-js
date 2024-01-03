# Using LLMValidator with OpenAI's GPT-3.5 Turbo for Enhanced Text Validation in JavaScript

### Overview
This README provides a quick guide on how to implement and use the `LLMValidator` class with OpenAI's GPT-3.5 Turbo model in JavaScript. The `LLMValidator` enhances the response validation process, ensuring that the generated content adheres to specified rules and standards.

### Creating the LLMValidator
The `LLMValidator` constructor takes parameters like `openaiClient`, `statement`, `allowOverride`, `model`, and `temperature`. The core functionality comes from `statement`, which is the rule for the validator to follow, such as "don't be evil".

```
const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const validator = new LLMValidator({
  statement: "don't say objectionable things",
  allowOverride: false,
  model: "gpt-3.5-turbo",
  temperature: 0,
  openaiClient: oai
})
```

You can attach a validator directly to a schema like this:

```
const QuestionAnswerSchemaNoEvil = z.object({
  question: z.string(),
  answer: z.string().refine(async answer => {
    const validator = new LLMValidator({
      statement: "don't say objectionable things",
      allowOverride: false,
      model: "gpt-3.5-turbo",
      temperature: 0,
      openaiClient: new OpenAI({
        apiKey: process.env.OPENAI_API_KEY ?? undefined,
        organization: process.env.OPENAI_ORG_ID ?? undefined
      })
    })
    await validator.validate(answer)
    return true
  })
})

await QuestionAnswerSchemaNoEvil.parseAsync(qa)
```

### Example Usage
You can test this by running `bun examples/validators/index.ts`.

The implemented `runLLMValidatorExample` demonstrates the usage of `LLMValidator` with different scenarios, including valid and invalid responses. 

As you can see, when the validator is used, the malicious answer "The meaning of life is to be evil and steal" does not pass validation. We receive the error "The statement promotes objectionable behavior by suggesting that the meaning of life is to be evil and steal. This goes against the rule of not saying objectionable things.". 