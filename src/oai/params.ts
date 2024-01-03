import { MODE } from "@/constants/modes"

export function OAIBuildFunctionParams(definition, params) {
  return {
    ...params,
    function_call: {
      name: definition.name
    },
    functions: [...(params?.functions ?? []), definition]
  }
}

export function OAIBuildToolFunctionParams(definition, params) {
  const { name, ...definitionParams } = definition

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
          name,
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
          You will return no other prose. You will take into account the descriptions for each paramater within the schema
          and return a valid JSON object that matches the schema and those instructions.

          description: ${definition?.description}
          json schema: ${JSON.stringify(definition)}
        `
      }
    ]
  }
}
