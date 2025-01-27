import { omit } from "@/lib"
import OpenAI from "openai"
import { z } from "zod"
import { thinkingJsonParser, withResponseModel, MODE as ZMODE } from "zod-stream"

import { Mode } from "../types"

export const MODE: typeof ZMODE = ZMODE

export const MODE_TO_RESPONSE_PARSER = {
  [MODE.THINKING_MD_JSON]: thinkingJsonParser
}

export const PROVIDERS = {
  OAI: "OAI",
  ANYSCALE: "ANYSCALE",
  TOGETHER: "TOGETHER",
  ANTHROPIC: "ANTHROPIC",
  GROQ: "GROQ",
  OTHER: "OTHER"
} as const

export type Provider = keyof typeof PROVIDERS

export const PROVIDER_SUPPORTED_MODES: {
  [key in Provider]: Mode[]
} = {
  [PROVIDERS.OTHER]: [MODE.FUNCTIONS, MODE.TOOLS, MODE.JSON, MODE.JSON_SCHEMA, MODE.MD_JSON],
  [PROVIDERS.OAI]: [MODE.FUNCTIONS, MODE.TOOLS, MODE.JSON, MODE.MD_JSON],
  [PROVIDERS.ANYSCALE]: [MODE.TOOLS, MODE.JSON, MODE.JSON_SCHEMA, MODE.MD_JSON],
  [PROVIDERS.TOGETHER]: [MODE.TOOLS, MODE.JSON, MODE.JSON_SCHEMA, MODE.MD_JSON],
  [PROVIDERS.ANTHROPIC]: [MODE.MD_JSON, MODE.TOOLS],
  [PROVIDERS.GROQ]: [MODE.TOOLS, MODE.FUNCTIONS, MODE.MD_JSON]
} as const

export const NON_OAI_PROVIDER_URLS = {
  [PROVIDERS.ANYSCALE]: "api.endpoints.anyscale",
  [PROVIDERS.TOGETHER]: "api.together.xyz",
  [PROVIDERS.OAI]: "api.openai.com",
  [PROVIDERS.ANTHROPIC]: "api.anthropic.com",
  [PROVIDERS.GROQ]: "api.groq.com"
} as const

export const PROVIDER_PARAMS_TRANSFORMERS = {
  [PROVIDERS.GROQ]: {
    [MODE.TOOLS]: function groqToolsParamsTransformer<
      T extends z.AnyZodObject,
      P extends OpenAI.ChatCompletionCreateParams
    >(params: ReturnType<typeof withResponseModel<T, "TOOLS", P>>) {
      if (params.tools.some(tool => tool) && params.stream) {
        console.warn("Streaming may not be supported when using tools in Groq, try MD_JSON instead")
        return params
      }

      return params
    }
  },
  [PROVIDERS.ANYSCALE]: {
    [MODE.JSON_SCHEMA]: function removeAdditionalPropertiesKeyJSONSchema<
      T extends z.AnyZodObject,
      P extends OpenAI.ChatCompletionCreateParams
    >(params: ReturnType<typeof withResponseModel<T, "JSON_SCHEMA", P>>) {
      if ("additionalProperties" in params.response_format.schema) {
        return {
          ...params,
          response_format: {
            ...params.response_format,
            schema: omit(["additionalProperties"], params.response_format.schema)
          }
        }
      }

      return params
    },
    [MODE.TOOLS]: function removeAdditionalPropertiesKeyTools<
      T extends z.AnyZodObject,
      P extends OpenAI.ChatCompletionCreateParams
    >(params: ReturnType<typeof withResponseModel<T, "TOOLS", P>>) {
      if (params.tools.some(tool => tool.function?.parameters)) {
        return {
          ...params,
          tools: params.tools.map(tool => {
            if (tool.function?.parameters) {
              return {
                ...tool,
                function: {
                  ...tool.function,
                  parameters: omit(["additionalProperties"], tool.function.parameters)
                }
              }
            }

            return tool
          })
        }
      }

      return params
    }
  }
} as const

export const PROVIDER_SUPPORTED_MODES_BY_MODEL = {
  [PROVIDERS.OTHER]: {
    [MODE.FUNCTIONS]: ["*"],
    [MODE.TOOLS]: ["*"],
    [MODE.JSON]: ["*"],
    [MODE.MD_JSON]: ["*"],
    [MODE.JSON_SCHEMA]: ["*"],
    [MODE.THINKING_MD_JSON]: ["*"]
  },
  [PROVIDERS.OAI]: {
    [MODE.FUNCTIONS]: ["*"],
    [MODE.TOOLS]: ["*"],
    [MODE.JSON]: ["*"],
    [MODE.MD_JSON]: ["*"]
  },
  [PROVIDERS.TOGETHER]: {
    [MODE.MD_JSON]: ["*"]
    // [MODE.JSON_SCHEMA]: ["*"]
    // [MODE.TOOLS]: ["*"]
  },
  [PROVIDERS.ANYSCALE]: {
    [MODE.MD_JSON]: ["*"]
    // [MODE.JSON_SCHEMA]: ["*"]
    // [MODE.TOOLS]: ["*"]
  },
  [PROVIDERS.ANTHROPIC]: {
    [MODE.MD_JSON]: ["*"],
    [MODE.TOOLS]: ["*"]
  },
  [PROVIDERS.GROQ]: {
    [MODE.TOOLS]: ["*"],
    [MODE.MD_JSON]: ["*"],
    [MODE.THINKING_MD_JSON]: ["deepseek-r1-distill-llama-70b"]
  }
}
