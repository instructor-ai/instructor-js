import OpenAI from "openai"
import { Stream } from "openai/streaming"

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
    | Stream<OpenAI.Chat.Completions.ChatCompletionChunk>
    | OpenAI.Chat.Completions.ChatCompletion
) {
  const parsedData = typeof data === "string" ? JSON.parse(data) : data

  const text = parsedData?.choices[0]?.message?.content ?? "{}"

  return JSON.parse(text)
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
    | Stream<OpenAI.Chat.Completions.ChatCompletionChunk>
    | OpenAI.Chat.Completions.ChatCompletion
) {
  const parsedData = typeof data === "string" ? JSON.parse(data) : data

  const text = parsedData.choices?.[0]?.message?.function_call?.arguments ?? "{}"

  return JSON.parse(text)
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
    | Stream<OpenAI.Chat.Completions.ChatCompletionChunk>
    | OpenAI.Chat.Completions.ChatCompletion
) {
  const parsedData = typeof data === "string" ? JSON.parse(data) : data

  const text = parsedData.choices?.[0]?.message?.tool_call?.function?.arguments ?? "{}"

  return JSON.parse(text)
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
    | Stream<OpenAI.Chat.Completions.ChatCompletionChunk>
    | OpenAI.Chat.Completions.ChatCompletion
) {
  const parsedData = typeof data === "string" ? JSON.parse(data) : data
  const text = parsedData?.choices[0]?.message?.content ?? "{}"

  return JSON.parse(text)
}
