A common use case of structured extraction is defining a single schema class and then making another schema to create a list to do multiple extraction By enabling streaming, you can do multiple extractions in a single request, and then iterate over the results as they come in.

To see an example of streaming in production checkout this [example](https://ss.dimitri.link/j17CVTMK)

!!! warning "Important: Changes in Response Behavior with Streaming Enabled"

**Example**: Extracting Conference Information

The following TypeScript example demonstrates how to use an Async Generator for streaming responses. It includes a schema definition for extraction and iterates over a stream of data to incrementally update and display the extracted information.

```ts
import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

const ExtractionValuesSchema = z.object({
  users: z
    .array(
      z.object({
        name: z.string(),
        email: z.string(),
        twitter: z.string()
      })
    )
    .min(5),
  date: z.string(),
  location: z.string(),
  budget: z.number(),
  deadline: z.string().min(1)
})

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "TOOLS"
})


const textBlock = `
In our recent online meeting, participants from various backgrounds joined to discuss the upcoming tech conference.
The names and contact details of the participants were as follows:

- Name: John Doe, Email: johndoe@email.com, Twitter: @TechGuru44
- Name: Jane Smith, Email: janesmith@email.com, Twitter: @DigitalDiva88
- Name: Alex Johnson, Email: alexj@email.com, Twitter: @CodeMaster2023
- Name: Emily Clark, Email: emilyc@email.com, Twitter: @InnovateQueen
...

During the meeting, we agreed on several key points. The conference will be held on March 15th, 2024,
at the Grand Tech Arena located at 4521 Innovation Drive. Dr. Emily Johnson, a renowned AI researcher, will be our keynote speaker.

The budget for the event is set at $50,000, covering venue costs, speaker fees, and promotional activities.
Each participant is expected to contribute an article to the conference blog by February 20th.

A follow-up meeting is scheduled for January 25th at 3 PM GMT to finalize the agenda and confirm the list of speakers.
`

const extractionStream = await client.chat.completions.create({
  messages: [{ role: "user", content: textBlock }],
  model: "gpt-4o",
  response_model: {
    schema: ExtractionValuesSchema,
    name: "value extraction"
  },
  stream: true,
  seed: 1
})

for await (const result of extractionStream) {
  try {
    console.clear()
    console.log(result)
  } catch (e) {
    console.log(e)
    break
  }
}
```

![](https://jxnl.github.io/instructor/img/partial.gif)

Enabling streaming alters the nature of the response you receive:

**Response Type**: When streaming is enabled, the response becomes an Async Generator. This generator produces incremental updates until the final result is achieved.

**Handling the Data**: As the Async Generator yields results, you can iterate over these incremental updates. It's important to note that the data from each yield is a complete snapshot of the current extraction state and is immediately usable.

**Final Value**: The last value yielded by the generator represents the completed extraction. This value should be used as the final result.

## Understanding OpenAI Completion Requests and Streaming Responses

**Server-Sent Events (SSE) and Async Generators**

OpenAI's completion requests return responses using Server-Sent Events (SSE), a protocol used to push real-time updates from a server to a client. In this context, the Async Generator in our TypeScript example closely mirrors the behavior of SSE. Each yield from the Async Generator corresponds to an update from the server, providing a continuous stream of data until the completion of the request.

## Streaming to the Browser or other clients

### Challenges of Browser Streaming with Instructor
Instructor, while powerful for server-side data validation and extraction, presents certain challenges when streaming directly to the browser:

- **Complexity in Data Transfer**: Instructor's focus on full lifecycle validation means that streaming to the browser often involves transferring fully hydrated models. This can lead to larger data chunks, increasing the amount of data transferred.

- **Handling Data Chunks in the UI**: When streaming complete objects, there's the added complexity of managing multiple chunks, splitting, diffing, etc. This can make real-time updates in the browser more challenging to implement efficiently.

### Utilizing WebSockets
- **WebSocket Streaming**: A viable solution for streaming Instructor's data to the browser is through WebSockets. This allows for continuous streaming of the partially hydrated model, enabling immediate use in the UI.

- **Ease of Use**: Using WebSockets, developers can stream the entire partially hydrated model to the client, simplifying the process of updating the UI in real time.

### Alternatives in Serverless Environments
- **Challenges in Serverless**: In serverless environments or scenarios where WebSockets may not be feasible, streaming large, fully hydrated models becomes more complicated due to limitations in transferring large data chunks efficiently.

### Leveraging zod-stream and stream-hooks
- **Integration with zod-stream**: Instructor is built on top of [`zod-stream`](https://island.novy.work/docs/zod-stream/introduction), a library that handles the streaming aspects provided by Instructor. [`zod-stream`](https://island.novy.work/docs/zod-stream/introduction) facilitates the construction of structured completions from an API endpoint, streamlining the data handling process, and provides a client for parsing the raw stream and producing the partially hydrated model.

- **Simplifying UI Updates with stream-hooks**: For React applications, integrating [`stream-hooks` ](https://island.novy.work/docs/stream-hooks/introduction)with [`zod-stream`](https://island.novy.work/docs/zod-stream/introduction) can significantly simplify building dynamic UIs. [`stream-hooks` ](https://island.novy.work/docs/stream-hooks/introduction)manage the streaming connection and data updates efficiently, reducing overhead and complexity in real-time UI interactions.


While Instructor provides robust server-side capabilities, streaming to the browser introduces complexities that can be effectively managed either through the use of WebSockets or [`zod-stream`](https://island.novy.work/docs/zod-stream/introduction), and `stream-hooks`. These tools complement Instructor's server-side strengths, enabling a more streamlined approach to building dynamic, real-time UIs in various environments, including serverless architectures.
