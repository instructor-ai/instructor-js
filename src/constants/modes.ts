export const MODE = {
  FUNCTIONS: "FUNCTIONS",
  TOOLS: "TOOLS",
  JSON: "JSON",
  MD_JSON: "MD_JSON",
  JSON_SCHEMA: "JSON_SCHEMA"
} as const

export type MODE = keyof typeof MODE
