import OpenAI from "openai";
import { instruct } from ".";
import { z } from "zod";

const client = instruct.patch({
  client: new OpenAI(),
  mode: instruct.MODES.TOOLS,
});

client.chat.completions
  .create({
    messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
    model: "gpt-3.5-turbo",
    // @ts-ignore TODO fix type issue
    response_model: z.object({
      age: z.number(),
      name: z.string(),
    }),
    max_retries: 3,
  })
  .then(console.log);
