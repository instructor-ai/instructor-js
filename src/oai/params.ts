import { FunctionPayload } from "./fns"

export function OAIBuildFunctionParams(definition: FunctionPayload, params) {
  return {
    ...params,
    function_call: {
      name: definition.name
    },
    functions: [
      ...(params?.functions ?? []),
      {
        name: definition.name,
        description: definition.description,
        parameters: {
          type: "object",
          properties: definition.parameters,
          required: definition.required
        }
      }
    ]
  }
}

export function OAIBuildToolFunctionParams(definition: FunctionPayload, params) {
  return {
    ...params,
    tool_choice: {
      type: "function",
      function: { name: definition.name }
    },
    tools: [
      ...(params?.tools ?? []),
      {
        type: "function",
        function: {
          name: definition.name,
          description: definition.description,
          parameters: {
            type: "object",
            properties: definition.parameters,
            required: definition.required
          }
        }
      }
    ]
  }
}

export function OAIBuildMessageBasedParams(definition: FunctionPayload, params) {
  return {
    ...params,
    messages: [
      ...(params?.messages ?? []),
      {
        role: "SYSTEM",
        content: `
          Given a user prompt, you will return fully valid JSON based on the following description and schema.
          You will return no other prose. You will take into account the descriptions for each paramater within the schema
          and return a valid JSON object that matches the schema and those instructions.

          description: ${definition.description}
          paramaters: ${JSON.stringify(definition.parameters)}
        `
      }
    ]
  }
}
