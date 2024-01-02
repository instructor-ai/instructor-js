import { z } from "zod";
import OpenAI from "openai";
import { MODES, patch } from "instructor";

const SimplePredictionSchema = z.object({
  class_label: z.enum(["spam", "not_spam"]),
});

type SimplePrediction = z.infer<typeof SimplePredictionSchema>;

const client = patch({
  client: new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  }),
  mode: MODES.TOOLS,
});

const classify = async (data: string): Promise<SimplePrediction> => {
  return await client.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `Classify the following text: ${data}`,
      }
    ],
    model: "gpt-4-0613",
    responseModel: SimplePredictionSchema,
  }) 
};

const run = async () => {
  const prediction = await classify("Hello there I'm a nigerian prince and I want to give you money");
  if (prediction.class_label != "spam") {
    throw new Error("Expected spam");
  }

  console.log(`Classified as: ${prediction.class_label}`);
};

run();
