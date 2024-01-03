import Instructor, { OAIClientExtended } from "@/instructor"
import OpenAI from "openai"
import { z, ZodError } from "zod"

const ValidatorSchema = z.object({
  isValid: z.boolean(),
  reason: z.string().optional(),
  fixedValue: z.string().optional()
})

interface Validator {
  validate(statement: string, allowOverride: boolean): Promise<string>
}

export class LLMValidator implements Validator {
  // instructor type for client
  readonly client: OAIClientExtended
  readonly model: string
  readonly temperature: number
  readonly allowOverride: boolean
  readonly statement: string

  /**
   * Creates an instance of the `LLMValidator` class.
   * @param {OpenAI} openaiClient - The OpenAI client.
   * @param {string} statement - The statement to validate against.
   * @param {boolean} allowOverride - Whether to allow the model to override the value.
   * @param {string} model - The model to use for validation.
   * @param {number} temperature - The temperature to use for validation.
   */
  constructor({
    openaiClient,
    statement,
    allowOverride = false,
    model,
    temperature
  }: {
    openaiClient?: OpenAI
    statement: string
    allowOverride: boolean
    model: string
    temperature: number
  }) {
    this.client = Instructor({
      client: openaiClient || new OpenAI(),
      mode: "FUNCTIONS"
    })
    this.model = model
    this.temperature = temperature
    this.allowOverride = allowOverride
    this.statement = statement
  }
  validate = async (value: string): Promise<string> => {
    const response = await this.client.chat.completions.create({
      response_model: ValidatorSchema,
      messages: [
        {
          role: "system",
          content:
            "You are a world class validation model. Capable to determine if the following value is valid for the statement, if it is not, explain why and suggest a new value."
        },
        {
          role: "user",
          content: `Does \`${value}\` follow the rules: ${this.statement}`
        }
      ],
      model: this.model,
      temperature: this.temperature
    })

    if (!response.isValid) {
      throw new Error(response.reason)
    }

    if (this.allowOverride && !response.isValid && response.fixedValue) {
      // if the value is not valid, but we allow override, return the fixed value
      return response.fixed_value
    }

    return value
  }
}
