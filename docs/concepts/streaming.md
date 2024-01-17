A common use case of structured extraction is defining a single schema class and then making another schema to create a list to do multiple extraction By enabling streaming, you can do multiple extractions in a single request, and then iterate over the results as they come in.

To see an example of streamin in production checkout this [example](https://ss.dimitri.link/j17CVTMK)

!!! warning "Important: Changes in Response Behavior with Streaming Enabled"

Enabling streaming alters the nature of the response you receive:

**Response Type**: When streaming is enabled, the response becomes an Async Generator. This generator produces incremental updates until the final result is achieved.

**Handling the Data**: As the Async Generator yields results, you can iterate over these incremental updates. It's important to note that the data from each yield is a complete snapshot of the current extraction state and is immediately usable.

**Final Value**: The last value yielded by the generator represents the completed extraction. This value should be used as the final result.

**Example**: Extracting Conference Information

The following TypeScript example demonstrates how to use an Async Generator for streaming responses. It includes a schema definition for extraction and iterates over a stream of data to incrementally update and display the extracted information.

```ts
import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"


const textBlock = `
In our recent online meeting, participants from various backgrounds joined to discuss the upcoming tech conference. The names and contact details of the participants were as follows:

- Name: John Doe, Email: johndoe@email.com, Twitter: @TechGuru44
- Name: Jane Smith, Email: janesmith@email.com, Twitter: @DigitalDiva88
- Name: Alex Johnson, Email: alexj@email.com, Twitter: @CodeMaster2023
- Name: Emily Clark, Email: emilyc@email.com, Twitter: @InnovateQueen
- Name: Ron Stewart, Email: ronstewart@email.com, Twitter: @RoboticsRon5
- Name: Sarah Lee, Email: sarahlee@email.com, Twitter: @AI_Aficionado
- Name: Mike Brown, Email: mikeb@email.com, Twitter: @FutureTechLeader
- Name: Lisa Green, Email: lisag@email.com, Twitter: @CyberSavvy101
- Name: David Wilson, Email: davidw@email.com, Twitter: @GadgetGeek77
- Name: Daniel Kim, Email: danielk@email.com, Twitter: @DataDrivenDude

During the meeting, we agreed on several key points. The conference will be held on March 15th, 2024, at the Grand Tech Arena located at 4521 Innovation Drive. Dr. Emily Johnson, a renowned AI researcher, will be our keynote speaker.

The budget for the event is set at $50,000, covering venue costs, speaker fees, and promotional activities. Each participant is expected to contribute an article to the conference blog by February 20th.

A follow-up meeting is scheduled for January 25th at 3 PM GMT to finalize the agenda and confirm the list of speakers.
`


const ExtractionValuesSchema = z.object({
  users: z
    .array(
      z.object({
        name: z.string(),
        handle: z.string(),
        twitter: z.string()
      })
    )
    .min(5),
  date: z.string(),
  location: z.string(),
  budget: z.number(),
  deadline: z.string().min(1)
})

type Extraction = Partial<z.infer<typeof ExtractionValuesSchema>>

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "TOOLS"
})

const extractionStream = await client.chat.completions.create({
  messages: [{ role: "user", content: textBlock }],
  model: "gpt-4-1106-preview",
  response_model: { schema ExtractionValuesSchema },
  max_retries: 3,
  stream: true
})

let extraction: Extraction = {}

for await (const result of extractionStream) {
  try {
    extraction = result
    console.clear()
    console.table(extraction)
  } catch (e) {
    console.log(e)
    break
  }
}

console.clear()
console.log("completed extraction:")
console.table(extraction)

```

## Understanding OpenAI Completion Requests and Streaming Responses

**Server-Sent Events (SSE) and Async Generators**

OpenAI's completion requests return responses using Server-Sent Events (SSE), a protocol used to push real-time updates from a server to a client. In this context, the Async Generator in our TypeScript example closely mirrors the behavior of SSE. Each yield from the Async Generator corresponds to an update from the server, providing a continuous stream of data until the completion of the request.

**Transforming Async Generators to Readable Streams**

While the Async Generator is suitable for server-side processing of streaming data, there may be scenarios where you need to stream data to a client, such as a web browser. In such cases, you can transform the Async Generator into a ReadableStream, which is more suitable for client-side consumption.

Here's how you can transform an Async Generator to a ReadableStream:

```typescript
import { ReadableStream } from "stream"

function asyncGeneratorToReadableStream(generator) {
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      for await (const parsedData of generator) {
        controller.enqueue(encoder.encode(JSON.stringify(parsedData)))
      }
      controller.close()
    },
    cancel() {
      if (cancelGenerator) {
        cancelGenerator()
      }
    }
  })
}

// Usage Example
const readableStream = asyncGeneratorToReadableStream(extractionStream)

// This ReadableStream can now be returned in an API endpoint or used in a similar context
```

**_In this example:_**

The asyncGeneratorToReadableStream function takes an Async Generator and an optional cancellation function.

It creates a new ReadableStream that, upon starting, iterates over the Async Generator using a for await...of loop.

Each piece of parsed data from the generator is encoded and enqueued into the stream. Once the generator completes, the stream is closed using controller.close().

If the stream is canceled (e.g., client disconnects), an optional cancelGenerator function can be invoked to stop the generator.

This approach allows for seamless integration of OpenAI's streaming completion responses into web applications and other scenarios where streaming data directly to a client is required.
