# Entity Graph example Overview

This example is designed to extract and visualize entities from text documents using TypeScript, OpenAI GPT-4, and zod for schema validation. It features an entity graph visualized using the [vis-network](https://github.com/visjs/vis-network)library, specifically tailored for interactive network/graph data representations.

## Defining Schemas

Define your entity and document extraction schemas using zod for structured data validation.

```ts
const EntitySchema = z.object({
  id: z
    .number()
    .describe(
      "Unique identifier for the entity, used for deduplication, design a scheme allows multiple entities"
    ),
  subquote_string: z
    .array(z.string())
    .describe(
      "Correctly resolved value of the entity, if the entity is a reference to another entity, this should be the id of the referenced entity, include a few more words before and after the value to allow for some context to be used in the resolution"
    ),
  entity_title: z.string(),
  properties: z.array(PropertySchema).describe("List of properties of the entity"),
  dependencies: z
    .array(z.number())
    .describe("List of entity ids that this entity depends or relies on to resolve it")
})

const DocumentExtractionSchema = z.object({
  entities: z
    .array(EntitySchema)
    .describe(
      "Body of the answer, each fact should be its separate object with a body and a list of sources"
    )
})

type DocumentExtraction = z.infer<typeof DocumentExtractionSchema>
```

## Configuration

Set up the OpenAI and Instructor client with your API key and organization ID.

## Extracting Entities

Use the askAi function to send a text document to the GPT-4 model. This function will return structured data conforming to your defined schemas.

## Visualizing Entities

The `saveHtmlDocument` function takes the extracted entities and generates an HTML document visualizing these entities as a graph.

## Functions

`generateHtmlLabel(entity)``
Generates HTML table for each entity with its properties.

`createSvgImage(entity)`
Converts the HTML table to an SVG image for visualization.

`createHtmlDocument(data)`
Creates the final HTML document for the entity graph, using the [vis-network](https://github.com/visjs/vis-network) library for interactive visualization.

`saveHtmlDocument(entities, name)`
Saves the generated HTML document to the file system.

## Example

```ts
const content = `Sample Legal Contract...`;
const model = await askAi(content);
saveHtmlDocument(model, "entityGraph");
```

This example illustrates the process of document analysis, entity extraction, and visualization. It's crucial to understand that this is an **example setup**. The components, such as [vis-network](https://github.com/visjs/vis-network), can be modified or replaced to suit your specific needs and preferences. After generating the HTML file, you can open it in a web browser to view and interact with the entity graph.
