# Patching

Instructor enhances client functionality with three new keywords for backwards compatibility. This allows use of the enhanced client as usual, with structured output benefits.

- `response_model`: Defines the response type for `chat.completions.create`.
- `max_retries`: Determines retry attempts for failed `chat.completions.create` validations.

The default mode is `instructor.Mode.TOOLS` which is the recommended mode for OpenAI clients. This mode is the most stable and is the most recommended for OpenAI clients. The other modes are for other clients and are not recommended for OpenAI clients.

## Tool Calling

This is the recommended method for OpenAI clients. It is the most stable as functions is being deprecated soon.

```js
import Instructor from "@instructor-ai/instructor"
import OpenAI from "openai"

const client = Instructor({
  client: new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? undefined,
    organization: process.env.OPENAI_ORG_ID ?? undefined
  }),
  mode: "TOOLS"
})
```

## Function Calling

Note that function calling is soon to be deprecated in favor of TOOL mode for OpenAI. But will still be supported for other clients.

```js
import Instructor from "@instructor-ai/instructor"
import OpenAI from "openai"

const client = Instructor({
  client: new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? undefined,
    organization: process.env.OPENAI_ORG_ID ?? undefined
  }),
  mode: "FUNCTIONS"
})
```

## JSON Mode

JSON mode uses OpenAI's JSON fromat for responses. by setting `response_format={"type": "json_object"}` in the `chat.completions.create` method.

```js
import Instructor from "@instructor-ai/instructor"
import OpenAI from "openai"

const client = Instructor({
  client: new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? undefined,
    organization: process.env.OPENAI_ORG_ID ?? undefined
  }),
  mode: "JSON"
})
```

## JSON Schema Mode

JSON Schema mode uses OpenAI's JSON format for responses. by setting `response_format={"type": "json_object", schema:response_model.model_json_schema()}` in the `chat.completions.create` method. This is only available for select clients (e.g. llama-cpp-python, Anyscale, Together)

```js
import Instructor from "@instructor-ai/instructor"
import OpenAI from "openai"

const client = Instructor({
  client: new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? undefined,
    organization: process.env.OPENAI_ORG_ID ?? undefined
  }),
  mode: "JSON_SCHEMA"
})
```

## Markdown JSON Mode

This just asks for the response in JSON format, but it is not recommended, and may not be supported in the future, this is just left to support vision models and will not give you the full benefits of instructor.

!!! warning "Experimental"

    This is not recommended, and may not be supported in the future, this is just left to support vision models.

```js
const client = Instructor({
  client: new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? undefined,
    organization: process.env.OPENAI_ORG_ID ?? undefined
  }),
  mode: "MD_JSON"
})
```
