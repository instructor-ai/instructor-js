import OpenAI from "openai";
import { instructor } from "../../src";
import { z } from "zod";

const client = instructor.patch({
  client: new OpenAI(),
  mode: instructor.MODE.TOOLS,
});

client.chat.completions
  .create({
    messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
    model: "gpt-3.5-turbo",
    response_model: z.object({
      age: z.number(),
      // name should be uppercase, or
      name: z.string().refine((name) => name === name.toUpperCase(), {
        message: "name should have uppercase",
      }),
    }),
    max_retries: 3,
  })
  .then(console.log);
