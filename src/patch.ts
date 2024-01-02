import OpenAI from "openai";
import { ZodSchema } from "zod";
import { JsonSchema7Type, zodToJsonSchema } from "zod-to-json-schema";

import {
  ChatCompletion,
  ChatCompletionCreateParams,
  ChatCompletionMessage,
} from "openai/resources";
import assert = require("assert");

export enum MODE {
  FUNCTIONS,
  TOOLS,
  JSON,
  MD_JSON,
  JSON_SCHEMA,
}

export class OpenAISchema {
  private response_model: ReturnType<typeof zodToJsonSchema> | any;
  constructor(public zod_schema: ZodSchema) {
    this.response_model = zodToJsonSchema(zod_schema);
  }

  get definitions() {
    return this.response_model["definitions"];
  }

  get properties() {
    return this.response_model["properties"];
  }

  get openai_schema() {
    return {
      name: this.response_model["title"] || "schema",
      description:
        this.response_model["description"] ||
        `Correctly extracted \`${
          this.response_model["title"] || "schema"
        }\` with all the required parameters with correct types`,
      parameters: Object.keys(this.response_model).reduce(
        (acc, curr) => {
          if (
            curr.startsWith("$") ||
            ["title", "description", "additionalProperties"].includes(curr)
          )
            return acc;
          acc[curr] = this.response_model[curr];
          return acc;
        },
        {} as {
          [key: string]: object | JsonSchema7Type;
        }
      ),
    };
  }
}

type PatchedChatCompletionCreateParams = ChatCompletionCreateParams & {
  response_model?: ZodSchema | OpenAISchema;
  max_retries?: number;
};

function handleResponseModel(
  response_model: ZodSchema | OpenAISchema,
  args: PatchedChatCompletionCreateParams[],
  mode: MODE = MODE.FUNCTIONS
): [OpenAISchema, PatchedChatCompletionCreateParams[], MODE] {
  if (!(response_model instanceof OpenAISchema)) {
    response_model = new OpenAISchema(response_model);
  }

  if (mode === MODE.FUNCTIONS) {
    args[0].functions = [response_model.openai_schema];
    args[0].function_call = { name: response_model.openai_schema.name };
  } else if (mode === MODE.TOOLS) {
    args[0].tools = [
      { type: "function", function: response_model.openai_schema },
    ];
    args[0].tool_choice = {
      type: "function",
      function: { name: response_model.openai_schema.name },
    };
  } else if ([MODE.JSON, MODE.MD_JSON, MODE.JSON_SCHEMA].includes(mode)) {
    let message: string = `As a genius expert, your task is to understand the content and provide the parsed objects in json that match the following json_schema: \n${JSON.stringify(
      response_model.properties
    )}`;
    if (response_model["definitions"]) {
      message += `Here are some more definitions to adhere to: \n${JSON.stringify(
        response_model.definitions
      )}`;
    }
    if (mode === MODE.JSON) {
      args[0].response_format = { type: "json_object" };
    } else if (mode == MODE.JSON_SCHEMA) {
      args[0].response_format = { type: "json_object" };
    } else if (mode === MODE.MD_JSON) {
      args[0].messages.push({
        role: "assistant",
        content: "```json",
      });
      args[0].stop = "```";
    }
    if (args[0].messages[0].role != "system") {
      args[0].messages.unshift({ role: "system", content: message });
    } else {
      args[0].messages[0].content += `\n${message}`;
    }
  } else {
    console.error("unknown mode", mode);
  }
  return [response_model, args, mode];
}

function processResponse(
  response: OpenAI.Chat.Completions.ChatCompletion,
  response_model: OpenAISchema,
  mode: MODE = MODE.FUNCTIONS
) {
  const message = response.choices[0].message;
  if (mode === MODE.FUNCTIONS) {
    assert.equal(
      message.function_call!.name,
      response_model.openai_schema.name,
      "Function name does not match"
    );
    return response_model.zod_schema.parse(
      JSON.parse(message.function_call!.arguments)
    );
  } else if (mode === MODE.TOOLS) {
    const tool_call = message.tool_calls![0];
    assert.equal(
      tool_call.function.name,
      response_model.openai_schema.name,
      "Tool name does not match"
    );
    return response_model.zod_schema.parse(
      JSON.parse(tool_call.function.arguments)
    );
  } else if ([MODE.JSON, MODE.MD_JSON, MODE.JSON_SCHEMA].includes(mode)) {
    return response_model.zod_schema.parse(JSON.parse(message.content!));
  } else {
    console.error("unknown mode", mode);
  }
}

function dumpMessage(message: ChatCompletionMessage) {
  const ret: ChatCompletionMessage = {
    role: message.role,
    content: message.content || "",
  };
  if (message.tool_calls) {
    ret["content"] += JSON.stringify(message.tool_calls);
  }
  if (message.function_call) {
    ret["content"] += JSON.stringify(message.function_call);
  }
  return ret;
}

export const patch = ({
  client,
  mode,
}: {
  client: OpenAI;
  response_model?: ZodSchema | OpenAISchema;
  max_retries?: number;
  mode?: MODE;
}): OpenAI => {
  client.chat.completions.create = new Proxy(client.chat.completions.create, {
    async apply(target, ctx, args: PatchedChatCompletionCreateParams[]) {
      let retries = 0,
        max_retries = args[0].max_retries || 1,
        response: ChatCompletion | undefined = undefined,
        response_model = args[0].response_model;
      [response_model, args, mode] = handleResponseModel(
        response_model!,
        args,
        mode
      );
      delete args[0].response_model;
      delete args[0].max_retries;

      while (retries < max_retries) {
        try {
          response = (await target.apply(
            ctx,
            args as [PatchedChatCompletionCreateParams]
          )) as ChatCompletion;
          return processResponse(
            response,
            response_model as OpenAISchema,
            mode
          );
        } catch (error: any) {
          console.error(error.errors || error);
          if (!response) {
            break;
          }
          args[0].messages.push(dumpMessage(response.choices[0].message));
          args[0].messages.push({
            role: "user",
            content: `Recall the function correctly, fix the errors, exceptions found\n${error}`,
          });
          if (mode == MODE.MD_JSON) {
            args[0].messages.push({ role: "assistant", content: "```json" });
          }
          retries++;
          if (retries > max_retries) {
            throw error;
          }
        } finally {
          response = undefined;
        }
      }
    },
  });
  return client;
};
