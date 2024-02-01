import { MODE, type Mode } from "zod-stream"

export const PROVIDERS = {
  OAI: "OAI",
  ANYSCALE: "ANYSCALE",
  TOGETHER: "TOGETHER",
  OTHER: "OTHER"
} as const

export type Provider = keyof typeof PROVIDERS

export const PROVIDER_SUPPORTED_MODES: {
  [key in Provider]: Mode[]
} = {
  [PROVIDERS.OTHER]: [MODE.FUNCTIONS, MODE.TOOLS, MODE.JSON, MODE.MD_JSON, MODE.JSON_SCHEMA],
  [PROVIDERS.OAI]: [MODE.FUNCTIONS, MODE.TOOLS, MODE.JSON, MODE.MD_JSON],
  [PROVIDERS.ANYSCALE]: [MODE.TOOLS, MODE.JSON, MODE.JSON_SCHEMA],
  [PROVIDERS.TOGETHER]: [MODE.TOOLS, MODE.JSON, MODE.MD_JSON, MODE.JSON_SCHEMA]
} as const

export const NON_OAI_PROVIDER_URLS = {
  [PROVIDERS.ANYSCALE]: "api.endpoints.anyscale",
  [PROVIDERS.TOGETHER]: "api.together.xyz",
  [PROVIDERS.OAI]: "api.openai.com"
} as const

export const PROVIDER_SUPPORTED_MODES_BY_MODEL = {
  [PROVIDERS.OTHER]: {
    [MODE.FUNCTIONS]: ["*"],
    [MODE.TOOLS]: ["*"],
    [MODE.JSON]: ["*"],
    [MODE.MD_JSON]: ["*"],
    [MODE.JSON_SCHEMA]: ["*"]
  },
  [PROVIDERS.OAI]: {
    [MODE.FUNCTIONS]: ["*"],
    [MODE.TOOLS]: ["*"],
    [MODE.JSON]: [
      "gpt-3.5-turbo-1106",
      "gpt-4-1106-preview",
      "gpt-4-0125-preview",
      "gpt-4-turbo-preview"
    ],
    [MODE.MD_JSON]: ["*"]
  },
  [PROVIDERS.TOGETHER]: {
    [MODE.JSON_SCHEMA]: [
      "mistralai/Mixtral-8x7B-Instruct-v0.1",
      "mistralai/Mistral-7B-Instruct-v0.1",
      "togethercomputer/CodeLlama-34b-Instruct"
    ],
    [MODE.MD_JSON]: ["*"],
    [MODE.TOOLS]: [
      "mistralai/Mixtral-8x7B-Instruct-v0.1",
      "mistralai/Mistral-7B-Instruct-v0.1",
      "togethercomputer/CodeLlama-34b-Instruct"
    ]
  },
  [PROVIDERS.ANYSCALE]: {
    [MODE.JSON_SCHEMA]: [
      "mistralai/Mistral-7B-Instruct-v0.1",
      "mistralai/Mixtral-8x7B-Instruct-v0.1"
    ],
    [MODE.MD_JSON]: ["*"],
    [MODE.TOOLS]: ["mistralai/Mistral-7B-Instruct-v0.1", "mistralai/Mixtral-8x7B-Instruct-v0.1"]
  }
}
