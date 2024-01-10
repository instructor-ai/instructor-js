import { OAIClientExtended } from "@/instructor"
import type { ChatCompletionCreateParams } from "openai/resources/chat/completions.mjs"
import { RefinementCtx, z } from "zod"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsyncSuperRefineFunction = (data: any, ctx: RefinementCtx) => Promise<any>

export const LLMValidator = (
  instructor: OAIClientExtended,
  statement: string,
  params: Omit<ChatCompletionCreateParams, "messages">
): AsyncSuperRefineFunction => {
  const schema = z.object({
    isValid: z.boolean(),
    reason: z.string().optional()
  })

  const fn = async (value, ctx) => {
    const validated = await instructor.chat.completions.create({
      ...params,
      model: "gpt-4",
      response_model: { schema, name: "Validator" },
      stream: false,
      max_retries: 0,
      messages: [
        {
          role: "system",
          content:
            "You are a world class validation model. Capable to determine if the following value is valid for the statement, if it is not, explain why and suggest a new value."
        },
        {
          role: "user",
          content: `Does \`${value}\` follow the rules: ${statement}`
        }
      ]
    })
    console.log(validated)

    if (!validated.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: validated.reason,
        fatal: true
      })
    }
  }
  return fn
}

// const ValidatorSchema = z.object({
//   isValid: z.boolean(),
//   reason: z.string().optional(),
//   fixedValue: z.string().optional()
// })

// interface Validator {
//   validate(statement: string, allowOverride: boolean): Promise<string>
// }

// export class LLMValidator implements Validator {
//   // instructor type for client
//   readonly client: OAIClientExtended
//   readonly allowOverride: boolean
//   readonly statement: string

//   /**
//    * Creates an instance of the `LLMValidator` class.
//    * @param {OpenAI} openaiClient - The OpenAI client.
//    * @param {string} statement - The statement to validate against.
//    * @param {boolean} allowOverride - Whether to allow the model to override the value.
//    * @param {string} model - The model to use for validation.
//    * @param {number} temperature - The temperature to use for validation.
//    */
//   constructor({
//     client,
//     statement
//   }: {
//     client: OAIClientExtended
//     statement: string
//     allowOverride: boolean
//   }) {
//     this.client = client
//     this.statement = statement
//   }
//   validate = async (value: string): Promise<string> => {
//     const response = await this.client.chat.completions.create({
//       response_model: { schema: ValidatorSchema, name: "Validator" },
//       messages: [
//         {
//           role: "system",
//           content:
//             "You are a world class validation model. Capable to determine if the following value is valid for the statement, if it is not, explain why and suggest a new value."
//         },
//         {
//           role: "user",
//           content: `Does \`${value}\` follow the rules: ${this.statement}`
//         }
//       ],
//       model: this.model,
//       temperature: this.temperature
//     })

//     if (!response.isValid) {
//       throw new Error(response.reason)
//     }

//     if (this.allowOverride && !response.isValid && response.fixedValue) {
//       // if the value is not valid, but we allow override, return the fixed value
//       return response.fixed_value
//     }

//     return value
//   }
// }
