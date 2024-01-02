import assert from "assert"
import OpenAI, { ChatCompletion, ChatCompletionCreateParams, ChatCompletionMessage } from "openai"
import { ZodSchema } from "zod"
import { JsonSchema7Type, zodToJsonSchema } from "zod-to-json-schema"

export enum MODE {
  FUNCTIONS,
  TOOLS,
  JSON,
  MD_JSON,
  JSON_SCHEMA
}

export class OpenAISchema {
  private responseModel: ReturnType<typeof zodToJsonSchema> | any
  constructor(public zod_schema: ZodSchema) {
    this.responseModel = zodToJsonSchema(zod_schema)
  }

  get definitions() {
    return this.responseModel["definitions"]
  }

  get properties() {
    return this.responseModel["properties"]
  }

  get schema() {
    return this.responseModel
  }

  get openaiSchema() {
    return {
      name: this.responseModel["title"] || "schema",
      description:
        this.responseModel["description"] ||
        `Correctly extracted \`${
          this.responseModel["title"] || "schema"
        }\` with all the required parameters with correct types`,
      parameters: Object.keys(this.responseModel).reduce(
        (acc, curr) => {
          if (
            curr.startsWith("$") ||
            ["title", "description", "additionalProperties"].includes(curr)
          )
            return acc
          acc[curr] = this.responseModel[curr]
          return acc
        },
        {} as {
          [key: string]: object | JsonSchema7Type
        }
      )
    }
  }
}

type PatchedChatCompletionCreateParams = ChatCompletionCreateParams & {
  responseModel?: ZodSchema | OpenAISchema
  maxRetries?: number
}

function handleResponseModel(
  responseModel: ZodSchema | OpenAISchema,
  args: PatchedChatCompletionCreateParams[],
  mode: MODE = MODE.FUNCTIONS
): [OpenAISchema, PatchedChatCompletionCreateParams[], MODE] {
  if (!(responseModel instanceof OpenAISchema)) {
    responseModel = new OpenAISchema(responseModel)
  }

  if (mode === MODE.FUNCTIONS) {
    args[0].functions = [responseModel.openaiSchema]
    args[0].function_call = { name: responseModel.openaiSchema.name }
  } else if (mode === MODE.TOOLS) {
    args[0].tools = [{ type: "function", function: responseModel.openaiSchema }]
    args[0].tool_choice = {
      type: "function",
      function: { name: responseModel.openaiSchema.name }
    }
  } else if ([MODE.JSON, MODE.MD_JSON, MODE.JSON_SCHEMA].includes(mode)) {
    let message: string = `As a genius expert, your task is to understand the content and provide the parsed objects in json that match the following json_schema: \n${JSON.stringify(
      responseModel.properties
    )}`
    if (responseModel["definitions"]) {
      message += `Here are some more definitions to adhere to: \n${JSON.stringify(
        responseModel.definitions
      )}`
    }
    if (mode === MODE.JSON) {
      args[0].response_format = { type: "json_object" }
    } else if (mode == MODE.JSON_SCHEMA) {
      // ! TODO: include json schema in the response
      args[0].response_format = {
        type: "json_object"
        // This is supported my Anyscale but not OpenAI
        // schema: responseModel.schema,
      }
    } else if (mode === MODE.MD_JSON) {
      args[0].messages.push({
        role: "assistant",
        content: "```json"
      })
      args[0].stop = "```"
    }
    if (args[0].messages[0].role != "system") {
      args[0].messages.unshift({ role: "system", content: message })
    } else {
      args[0].messages[0].content += `\n${message}`
    }
  } else {
    console.error("unknown mode", mode)
  }
  return [responseModel, args, mode]
}

function processResponse(
  response: OpenAI.Chat.Completions.ChatCompletion,
  responseModel: OpenAISchema,
  mode: MODE = MODE.FUNCTIONS
) {
  const message = response.choices[0].message
  if (mode === MODE.FUNCTIONS) {
    assert.equal(
      message.function_call!.name,
      responseModel.openaiSchema.name,
      "Function name does not match"
    )
    return responseModel.zod_schema.parse(JSON.parse(message.function_call!.arguments))
  } else if (mode === MODE.TOOLS) {
    const tool_call = message.tool_calls![0]
    assert.equal(
      tool_call.function.name,
      responseModel.openaiSchema.name,
      "Tool name does not match"
    )
    return responseModel.zod_schema.parse(JSON.parse(tool_call.function.arguments))
  } else if ([MODE.JSON, MODE.MD_JSON, MODE.JSON_SCHEMA].includes(mode)) {
    return responseModel.zod_schema.parse(JSON.parse(message.content!))
  } else {
    console.error("unknown mode", mode)
  }
}

function dumpMessage(message: ChatCompletionMessage) {
  const ret: ChatCompletionMessage = {
    role: message.role,
    content: message.content || ""
  }
  if (message.tool_calls) {
    ret["content"] += JSON.stringify(message.tool_calls)
  }
  if (message.function_call) {
    ret["content"] += JSON.stringify(message.function_call)
  }
  return ret
}

export const patch = ({
  client,
  mode
}: {
  client: OpenAI
  responseModel?: ZodSchema | OpenAISchema
  max_retries?: number
  mode?: MODE
}): OpenAI => {
  client.chat.completions.create = new Proxy(client.chat.completions.create, {
    async apply(target, ctx, args: PatchedChatCompletionCreateParams[]) {
      let retries = 0,
        max_retries = args[0].maxRetries || 1,
        response: ChatCompletion | undefined = undefined,
        responseModel = args[0].responseModel
      ;[responseModel, args, mode] = handleResponseModel(responseModel!, args, mode)
      delete args[0].responseModel
      delete args[0].maxRetries
      while (retries < max_retries) {
        try {
          response = (await target.apply(
            ctx,
            args as [PatchedChatCompletionCreateParams]
          )) as ChatCompletion
          return processResponse(response, responseModel as OpenAISchema, mode)
        } catch (error: any) {
          console.error(error.errors || error)
          if (!response) {
            break
          }
          args[0].messages.push(dumpMessage(response.choices[0].message))
          args[0].messages.push({
            role: "user",
            content: `Recall the function correctly, fix the errors, exceptions found\n${error}`
          })
          if (mode == MODE.MD_JSON) {
            args[0].messages.push({ role: "assistant", content: "```json" })
          }
          retries++
          if (retries > max_retries) {
            throw error
          }
        } finally {
          response = undefined
        }
      }
    }
  })
  return client
}
