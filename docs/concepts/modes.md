# Modes 

Instructor enhances client functionality with three new keywords for backwards compatibility. This allows use of the enhanced client as usual, with structured output benefits.

- `response_model`: Defines the response type for `chat.completions.create`.
- `max_retries`: Determines retry attempts for failed `chat.completions.create` validations.
- `validation_context`: Provides extra context to the validation process.

There are three methods for structured output:

1. **Function Calling**: The primary method. Use this for stability and testing.
2. **Tool Calling**: Useful in specific scenarios; lacks the reasking feature of OpenAI's tool calling API.
3. **JSON Mode**: Offers closer adherence to JSON but with more potential validation errors. Suitable for specific non-function calling clients.

## Function Calling

```ts
import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

const client = Instructor({
    client: oai,
    mode: "FUNCTIONS",
})
```

## Tool Calling

```python
import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

const client = Instructor({
    client: oai,
    mode: "TOOLS",
})
```

## JSON Mode

```ts
import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

const client = Instructor({
    client: oai,
    mode: "JSON",
})
```

## Markdown JSON Mode

!!! warning "Experimental"

    This is not recommended, and may not be supported in the future, this is just left to support vision models.

    ```ts
    import Instructor from "@/instructor"
    import OpenAI from "openai"
    import { z } from "zod"

    const oai = new OpenAI({})
    const client = Instructor({
        client: oai,
        mode: "MD_JSON",
    })
    ```
