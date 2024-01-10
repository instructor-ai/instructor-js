import { omit } from "@/lib"
import { ChatCompletionCreateParamsWithModel, Mode } from "@/types"
import { ChatCompletionCreateParams } from "openai/resources/index.mjs"
import { z } from "zod"
import { JsonSchema7Type } from "zod-to-json-schema"

import { MODE } from "@/constants/modes"

type ParseParams = {
  name: string
  description?: string
} & JsonSchema7Type

export function OAIBuildFunctionParams<T extends z.ZodTypeAny>(
  definition: ParseParams,
  params: Omit<ChatCompletionCreateParamsWithModel<T>, "response_model">
): ChatCompletionCreateParams {
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
        parameters: definitionParams
      }
    ]
  }
}

export function OAIBuildToolFunctionParams<T extends z.ZodTypeAny>(
  definition: ParseParams,
  params: Omit<ChatCompletionCreateParamsWithModel<T>, "response_model">
): ChatCompletionCreateParams {
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
          description: description,
          parameters: definitionParams
        }
      },
      ...(params?.tools ?? [])
    ]
  }
}

export function OAIBuildMessageBasedParams<T extends z.ZodTypeAny>(
  definition: ParseParams,
  params: Omit<ChatCompletionCreateParamsWithModel<T>, "response_model">,
  mode: Mode
): ChatCompletionCreateParams {
  const MODE_SPECIFIC_CONFIGS = {
    [MODE.JSON]: {
      response_format: { type: "json_object" }
    },
    [MODE.JSON_SCHEMA]: {
      response_format: {
        type: "json_object",
        schema: omit(["name", "description"], definition)
      }
    }
  }

  const modeConfig = MODE_SPECIFIC_CONFIGS[mode]

  const t = {
    ...params,
    ...modeConfig,
    messages: [
      ...params.messages,
      {
        role: "system",
        content: `
          Given a user prompt, you will return fully valid JSON based on the following description and schema.
          You will return no other prose. You will take into account any descriptions or required parameters within the schema
          and return a valid and fully escaped JSON object that matches the schema and those instructions.

          description: ${definition.description}
          json schema: ${JSON.stringify(definition)}
        `
      }
    ]
  }
  return t
}
