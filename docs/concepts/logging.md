In order to see the requests made to OpenAI and the responses, you can set debug to true when initializing Instructor. This will show the requests and responses made to OpenAI. This can be useful for debugging and understanding the requests and responses made to OpenAI.

```typescript
const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "TOOLS",
  debug: true // <== HERE
})

const UserSchema = z.object({
  // Description will be used in the prompt
  age: z.number().describe("The age of the user"),
  name: z.string()
})

// User will be of type z.infer<typeof UserSchema>
const user = await client.chat.completions.create({
  messages: [{ role: "user", content: "Jason Liu is 30 years old" }],
  model: "gpt-3.5-turbo",
  response_model: {
    schema: UserSchema,
    name: "User"
  }
})
// [Instructor:DEBUG] 2024-03-28T13:42:00.178Z: User making completion call with params:  {
//   messages: [ { role: 'user', content: 'Jason Liu is 30 years old' } ],
//   model: 'gpt-3.5-turbo',
//   stream: false,
//   tool_choice: { type: 'function', function: { name: 'User' } },
//   tools: [ { type: 'function', function: [Object] } ]
// }
// [Instructor:DEBUG] 2024-03-28T13:42:00.846Z: User Completion validation:  { success: true, data: { age: 30, name: 'Jason Liu' } }

console.log(user)
// { age: 30, name: "Jason Liu" }
```