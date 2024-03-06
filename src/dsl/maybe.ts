import { z } from "zod"

export type Maybe<T extends z.ZodTypeAny> = z.ZodObject<{
  result: z.ZodOptional<T>
  error: z.ZodDefault<z.ZodBoolean>
  message: z.ZodOptional<z.ZodString>
}>

/**
 * Create a Maybe model for a given Zod schema. This allows you to return a model that includes fields for `result`, `error`, and `message` for situations where the data may not be present in the context.
 * @param schema The Zod schema to wrap with maybe.
 * @returns A Zod schema that includes fields for `result`, `error`, and `message`.
 */
export const maybe = <T extends z.ZodTypeAny>(schema: T): Maybe<T> =>
  z.object({
    result: schema
      .optional()
      .describe(
        "Correctly extracted result, if any, from the provided context, otherwise undefined"
      ),
    error: z.boolean().default(false),
    message: z
      .string()
      .optional()
      .describe(
        "Error message if no result was found, should be short and concise, otherwise undefined"
      )
  }) satisfies Maybe<T>
