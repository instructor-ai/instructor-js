import type {
  ChatCompletionCreateParams,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming
} from "openai/resources/index.mjs"
import { z } from "zod"
import zodToJsonSchema from "zod-to-json-schema"

import { MODE_TO_PARAMS } from "@/constants/modes"

export function withResponseModel<T extends z.ZodTypeAny>({
  response_model: { name, schema, description },
  params,
  mode
}: {
  response_model: {
    name: string
    schema: T
    description?: string
  }
  params: ChatCompletionCreateParamsStreaming | ChatCompletionCreateParamsNonStreaming
  mode: string
}): ChatCompletionCreateParams {
  const safeName = name.replace(/[^a-zA-Z0-9]/g, "_").replace(/\s/g, "_")

  const { definitions } = zodToJsonSchema(schema, {
    name: safeName,
    errorMessages: true
  })

  if (!definitions || !definitions?.[safeName]) {
    console.warn("Could not extract json schema definitions from your schema", schema)
    throw new Error("Could not extract json schema definitions from your schema")
  }

  const definition = {
    name: safeName,
    description,
    ...definitions[safeName]
  }

  const paramsForMode = MODE_TO_PARAMS[mode](definition, params, mode)

  return {
    ...paramsForMode
  }
}
