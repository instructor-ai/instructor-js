import Instructor from "@/instructor";
import { describe, expect, test } from "bun:test";
import OpenAI from "openai";
import { z } from "zod";

const models = ["gpt-3.5-turbo", "gpt-4"];
const modes = ["FUNCTIONS", "JSON", "TOOLS"];

const createTestCases = () => {
  return models.flatMap(model => modes.map(mode => ({ model, mode })));
};

const UserSchema = z.object({
  age: z.number(),
  name: z.string().refine(name => name.includes(" "), {
    message: "Name must contain a space"
  })
});

type User = z.infer<typeof UserSchema>;

async function extractUser(model: string, mode: string) {
  const oai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? undefined,
    organization: process.env.OPENAI_ORG_ID ?? undefined
  });

  const client = Instructor({
    client: oai,
    mode: mode as "FUNCTIONS" | "JSON" | "TOOLS"
  });

  const user: User = await client.chat.completions.create({
    messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
    model: model,
    response_model: UserSchema,
    max_retries: 3
  });

  return user;
}

describe("FunctionCall", () => {
  const testCases = createTestCases();

  test.each(testCases)("Should return extracted name and age for model %s and mode %s", async ({ model, mode }) => {
    const user = await extractUser(model, mode);

    expect(user.name).toEqual("Jason Liu");
    expect(user.age).toEqual(30);
  });
});
