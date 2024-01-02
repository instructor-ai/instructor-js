import { createFunctionDefinition } from "@/oai/fns"
import { z, ZodArray, ZodBoolean, ZodNumber, ZodObject, ZodRecord, ZodString } from "zod"

type AnyZodType = z.ZodTypeAny
type PropertyType = "string" | "boolean" | "number" | "object" | "array"

const getTypeFromZod = (schema: AnyZodType): PropertyType => {
  if (schema instanceof ZodNumber) {
    return "number"
  }

  if (schema instanceof ZodBoolean) {
    return "boolean"
  }

  if (schema instanceof ZodString) {
    return "string"
  }

  if (schema instanceof ZodObject) {
    return "object"
  }

  if (schema instanceof ZodArray) {
    return "array"
  }

  if (schema instanceof ZodRecord) {
    return "object"
  }

  return "string"
}

const getDescriptionAndType = (schema: AnyZodType) => {
  const maybeDescription = `
    ${schema._def?.description ?? ""}\n
    rules: ${JSON.stringify(schema._def?.checks ?? []) ?? ""}
  `

  if (schema instanceof ZodObject) {
    const properties = {}

    for (const key in schema.shape) {
      properties[key] = getDescriptionAndType(schema.shape[key])
    }

    return {
      type: getTypeFromZod(schema),
      description: maybeDescription,
      properties
    }
  }

  if (schema instanceof ZodArray) {
    return {
      type: getTypeFromZod(schema),
      description: maybeDescription,
      items: getDescriptionAndType(schema.element)
    }
  }

  return {
    type: getTypeFromZod(schema),
    description: maybeDescription
  }
}

/**
 * `createSchemaFunction` creates a schema-based function definition using the `createFunctionDefinition` utility.
 * The created function always returns null when executed, and its purpose is mainly to provide a structured
 * description of the schema in a specific format.
 *
 * @param {Object} args - The arguments for the function definition.
 * @param {z.ZodObject<any>} args.schema - The zod schema object.
 * @returns {FunctionDefinitionInterface} - The function definition.
 *
 * @example
 *
 * const schema = z.object({
 *   name: z.string(),
 *   age: z.number()
 * });
 *
 * const schemaFunctionDefinition = createSchemaFunction({ schema, name: 'mySchema', description: 'returns a person object with name and age' });
 *
 */
export function createSchemaFunction({
  schema
}: {
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.ZodObject<any>
}) {
  const propertiesMapping: {
    [index: string]: { type: PropertyType; description: string }
  } = {}

  for (const key in schema.shape) {
    propertiesMapping[key] = getDescriptionAndType(schema.shape[key])
  }

  const requiredParameters = Object.keys(propertiesMapping)

  const name = "return_json"
  const description = `Returns the assistant response as JSON.`

  const execute = async (): Promise<null> => {
    return null
  }

  return createFunctionDefinition({
    paramsSchema: schema,
    jsonSchema: propertiesMapping,
    name,
    description,
    execute,
    required: requiredParameters
  })
}
