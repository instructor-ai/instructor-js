import OpenAI from 'openai';
import { APIPromise } from 'openai/core';
import { ChatCompletion } from 'openai/resources';
import { Chat } from 'openai/resources/chat/chat';
import { ZodSchema } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

export enum MODES {
  TOOLS = 'tools',
  // ... other modes in the future
}

export interface PatchConfig {
  client: OpenAI;
  mode?: MODES;
}

export interface ChatCompletionsCreateConfig<T> extends OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming {
  responseModel: ZodSchema<T>;
  maxRetries?: number;
}

export interface PatchedChat {
  chat: {
    completions: {
      create<T>(config: ChatCompletionsCreateConfig<T>): Promise<T>;
    };
  };
}

export type PatchedClient = OpenAI & PatchedChat;

type OpenAICompletionBody = OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming;

// There's probably a nicer way to do this, but zod doesn't give us a schema name
const DEFAULT_OPENAI_TOOL_NAME = "call_this_function";

function patchCreateChatCompletion(chat: Chat) {
  const originalFn = chat.completions.create;

  const completionFn = async <T>({responseModel, maxRetries, ...rest}: ChatCompletionsCreateConfig<T>, options?: any) => {
    if (!maxRetries) {
      maxRetries = 0;
    }

    const openaiBody: OpenAICompletionBody = rest;

    openaiBody.tool_choice = {
      type: "function",
      function: {
        name: DEFAULT_OPENAI_TOOL_NAME,
      }
    };

    openaiBody.tools = [{
      type: "function",
      function: {
        name: DEFAULT_OPENAI_TOOL_NAME,
        parameters: zodToJsonSchema(responseModel),
      }
    }]

    let retries = 0;
    let response: ChatCompletion | undefined = undefined;

    while (retries <= maxRetries) {
      try {
        // We need to provide the 'this' manually so it's not null
        response = await originalFn.call(chat.completions, openaiBody, options) as ChatCompletion; // we have to force the type because we're using .call

        // const resp = await fn(openaiBody, options);

        if (!response.choices?.[0].message?.tool_calls) {
          throw new Error("Invalid response format");
        }

        const responseObject = JSON.parse(response.choices[0].message.tool_calls[0].function.arguments);
        responseModel.parse(responseObject);

        return responseObject;
      } catch (e) {
        retries += 1
        if (retries > maxRetries) {
          throw e;          
        }
        if (response) {
          openaiBody.messages.push(response.choices[0].message);
          openaiBody.messages.push({
            role: "user",
            content: `Recall the function correctly, fix the errors, exceptions found\n${e}`,
          })
        }
      }
    }
  }

  // We can have correct types here with a bit of wrangling
  chat.completions.create = completionFn as any;
};

export function patch(config: PatchConfig): PatchedClient {
  if (!config.client) {
    throw new Error("Provide an OpenAI client");
  }

  if (!config.mode) {
    config.mode = MODES.TOOLS;
  }

  switch (config.mode) {
    case MODES.TOOLS:
      patchCreateChatCompletion(config.client.chat);
      break;      

    default:
      throw new Error("Unsupported mode: " + config.mode);
  }

  return config.client;
}
