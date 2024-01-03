import OpenAI from "openai"
import { Stream } from "openai/streaming"

interface OaiStreamArgs {
  res: Stream<OpenAI.Chat.Completions.ChatCompletionChunk>
  parser
}

/**
 * `OaiStream` creates a ReadableStream that parses the SSE response from OAI
 * and returns a parsed string from the response.
 *
 * @param {OaiStreamArgs} args - The arguments for the function.
 * @returns {ReadableStream<string>} - The created ReadableStream.
 */
export function OAIStream({ res, parser }: OaiStreamArgs): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  let cancelGenerator: () => void

  async function* generateStream(res): AsyncGenerator<string> {
    cancelGenerator = () => {
      return
    }

    for await (const part of res) {
      if (part?.choices?.[0]?.finish_reason === "stop") {
        cancelGenerator()
        break
      }

      yield parser(part)
    }
  }

  const generator = generateStream(res)

  return new ReadableStream({
    async start(controller) {
      for await (const parsedData of generator) {
        controller.enqueue(encoder.encode(parsedData))
      }

      controller.close()
    },
    cancel() {
      if (cancelGenerator) {
        cancelGenerator()
      }
    }
  })
}
