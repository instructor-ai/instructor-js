import OpenAI from "openai"

/**
 * `OAIResponseTextParser` parses a JSON string and extracts the text content.
 *
 * @param {string} data - The JSON string to parse.
 * @returns {string} - The extracted text content.
 *
 */
export function OAIResponseTextParser(
  data:
    | string
    | OpenAI.Chat.Completions.ChatCompletionChunk
    | OpenAI.Chat.Completions.ChatCompletion
) {
  const parsedData = typeof data === "string" ? JSON.parse(data) : data

  const text = parsedData?.choices[0]?.message?.content ?? null

  return text
}

/**
 * `OAIResponseFnArgsParser` parses a JSON string and extracts the function call arguments.
 *
 * @param {string} data - The JSON string to parse.
 * @returns {Object} - The extracted function call arguments.
 *
 */
export function OAIResponseFnArgsParser(
  data:
    | string
    | OpenAI.Chat.Completions.ChatCompletionChunk
    | OpenAI.Chat.Completions.ChatCompletion
) {
  const parsedData = typeof data === "string" ? JSON.parse(data) : data
  const text =
    parsedData.choices?.[0].delta?.function_call?.arguments ??
    parsedData.choices?.[0]?.message?.function_call?.arguments ??
    null

  return text
}

/**
 * `OAIResponseToolArgsParser` parses a JSON string and extracts the tool call arguments.
 *
 * @param {string} data - The JSON string to parse.
 * @returns {Object} - The extracted tool call arguments.
 *
 */
export function OAIResponseToolArgsParser(
  data:
    | string
    | OpenAI.Chat.Completions.ChatCompletionChunk
    | OpenAI.Chat.Completions.ChatCompletion
) {
  const parsedData = typeof data === "string" ? JSON.parse(data) : data

  const text =
    parsedData.choices?.[0].delta?.tool_calls?.[0]?.function?.arguments ??
    parsedData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ??
    null

  return text
}

/**
 * `OAIResponseJSONParser` parses a JSON string and extracts the JSON content.
 *
 * @param {string} data - The JSON string to parse.
 * @returns {Object} - The extracted JSON content.
 *
 */
export function OAIResponseJSONStringParser(
  data:
    | string
    | OpenAI.Chat.Completions.ChatCompletionChunk
    | OpenAI.Chat.Completions.ChatCompletion
) {
  const parsedData = typeof data === "string" ? JSON.parse(data) : data
  const text =
    parsedData.choices?.[0].delta?.content ?? parsedData?.choices[0]?.message?.content ?? null

  return text
}


/**
 * `OAIResponseJSONParser` parses a JSON string and extracts the JSON content.
 * 
 * @param {string} data - The JSON string to parse.
 * @returns {Object} - The extracted JSON content.
 * 
 * 
 */
export function OAIResponseJSONParser(
  data:
    | string
    | OpenAI.Chat.Completions.ChatCompletionChunk
    | OpenAI.Chat.Completions.ChatCompletion
) {
  const parsedData = typeof data === "string" ? JSON.parse(data) : data
  const text =
    parsedData.choices?.[0].delta?.content ?? parsedData?.choices[0]?.message?.content ?? null

  const jsonRegex = /```json\n([\s\S]*?)\n```/;
  const match = text.match(jsonRegex);


  return match ? match[1] : text;
}
