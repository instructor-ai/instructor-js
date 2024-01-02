import { z } from "zod"

export type FunctionPayload = {
  name: string
  description: string
  parameters: object
  required: string[]
}

export type FunctionDefinitionParams<P extends z.ZodType<unknown>, R extends z.ZodType<unknown>> = {
  jsonSchema?: object
  name: string
  description: string
  execute: (params: z.infer<P>) => Promise<z.infer<R>>
  required?: string[]
}

export type FunctionDefinitionInterface = {
  run: (params: unknown) => Promise<unknown>
  definition: FunctionPayload
}

/**
 * `createFunctionDefinition` is a function that creates a function definition. It creates a runner function
 * that validates its parameters against a provided schema before executing the provided function.
 * It also creates a payload that describes the function.
 *
 * @param {FunctionDefinitionParams} params - The parameters for the function definition.
 * @returns {FunctionDefinitionInterface} - The function definition runner function and the function payload.
 *
 * @example
 *
 * const paramsSchema = z.object({
 *   name: z.string(),
 *   age: z.number()
 * });
 *
 * const execute = async (params) => {
 *   return { message: `Hello, ${params.name}. You are ${params.age} years old.` };
 * };
 *
 * const functionDefinition = createFunctionDefinition({
 *   name: 'greet',
 *   description: 'Greets a person.',
 *   execute
 * });
 *
 */
function createFunctionDefinition<P extends z.ZodType<unknown>, R extends z.ZodType<unknown>>({
  jsonSchema,
  name,
  description,
  execute,
  required = []
}: FunctionDefinitionParams<P, R>): FunctionDefinitionInterface {
  const run = async (params: unknown): Promise<unknown> => {
    try {
      return await execute(params)
    } catch (error) {
      console.error(`Error executing function ${name}:`, error)
      throw error
    }
  }

  const functionDefinition: FunctionDefinitionInterface = {
    run,
    definition: {
      name: name,
      description: description,
      parameters: jsonSchema,
      required
    }
  }

  return functionDefinition
}

export { createFunctionDefinition }
