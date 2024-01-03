import { MODE } from "@/constants/modes"

export function OAIBuildFunctionParams(definition, params) {
  const { name, description, ...definitionParams } = definition

  return {
    ...params,
    function_call: {
      name: name
    },
    functions: [
      ...(params?.functions ?? []),
      {
        name: name,
        description: description ?? undefined,
        paramaters: definitionParams
      }
    ]
  }
}

export function OAIBuildToolFunctionParams(definition, params) {
  const { name, description, ...definitionParams } = definition

  return {
    ...params,
    tool_choice: {
      type: "function",
      function: { name }
    },
    tools: [
      {
        type: "function",
        function: {
          name: name,
          description: description ?? undefined,
          parameters: definitionParams
        }
      },
      ...(params?.tools ?? [])
    ]
  }
}

export function OAIBuildMessageBasedParams(definition, params, mode) {
  const MODE_SPECIFIC_CONFIGS = {
    [MODE.JSON]: {
      response_format: { type: "json_object" }
    },
    [MODE.JSON_SCHEMA]: {
      //TODO: not sure what is different about this mode - the OAI sdk doesnt accept a schema here
      response_format: { type: "json_object" }
    }
  }

  const modeConfig = MODE_SPECIFIC_CONFIGS[mode] ?? {}

  return {
    ...params,
    ...modeConfig,
    messages: [
      ...(params?.messages ?? []),
      {
        role: "system",
        content: `
          Given a user prompt, you will return fully valid JSON based on the following description and schema.
          You will return no other prose. You will take into account any descriptions or required paramaters within the schema
          and return a valid JSON object that matches the schema and those instructions.

          description: ${definition?.description}
          json schema: ${JSON.stringify(definition)}
        `
      }
    ]
  }
}
