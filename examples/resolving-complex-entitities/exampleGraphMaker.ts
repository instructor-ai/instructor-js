import fs from "fs"

function generateHtmlLabel(entity) {
  const rows = entity.properties
    .map(prop => `<tr><td>${prop.key}</td><td>${prop.resolved_absolute_value}</td></tr>`)
    .join("")

  return `
  <table style="border: 1px solid black; border-collapse: collapse; width: 100%;">
  <tr><td colspan="2" style="border: 1px solid black; text-align: center;"><b>${entity.entity_title}</b></td></tr>
  ${rows}
</table>`
}

function createSvgImage(entity) {
  const htmlLabel = generateHtmlLabel(entity).replace(/\n/g, "").trim()

  const estimatedWidth = 300
  const estimatedHeight = 100
  const backgroundColor = "white"

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${estimatedWidth}" height="${estimatedHeight}">
      <rect x="0" y="0" width="100%" height="100%" fill="${backgroundColor}"/>
      <foreignObject x="0" y="0" width="${estimatedWidth}px" height="${estimatedHeight}px">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-size:12px; width: ${estimatedWidth}px; height: ${estimatedHeight}px; display: flex; align-items: center; justify-content: center;">
        ${htmlLabel}
      </div>
    </foreignObject>
    </svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function createHtmlDocument(data) {
  const nodeDefs = data.entities
    .map(entity => {
      return `{id: ${entity.id}, image: '${createSvgImage(entity)}', shape: 'image'}`
    })
    .join(",\n")

  const edgeDefs: string[] = []
  data.entities.forEach(entity => {
    entity.dependencies.forEach(depId => {
      edgeDefs.push(`{from: ${entity.id}, to: ${depId}}`)
    })
  })

  const html = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Entity graph</title>
        <script type="text/javascript" src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
        <link href="https://unpkg.com/vis-network/styles/vis-network.min.css" rel="stylesheet" type="text/css" />
        <style>
          body, html {
          height: 100%;
          margin: 0;
          overflow: hidden;
          }
          #mynetwork {
          width: 100%;
          height: 100%;
          border: 1px solid lightgray;
          }
        </style>
    </head>
    <body>
        <div id="mynetwork"></div>
        <script>
          const nodes = new vis.DataSet([${nodeDefs}]);
          const edges = new vis.DataSet([${edgeDefs.join(",\n")}]);
          
          const options = {
            scale: 2.0,
            edges: {
              smooth: true,
            arrows: {
              to: { enabled: true, scaleFactor: 0.3, type: 'arrow' }
            },
            color: "black"
          },
          layout: {
            hierarchical: {
              enabled: true,
              levelSeparation: 75,
              nodeSpacing: 600,
              treeSpacing: 200,
              direction: 'DU',
              shakeTowards: 'roots'
            }
          },
            physics: {
              enabled: false
            }
          };
          
          const container = document.getElementById('mynetwork');
          const graphData = {
              nodes: nodes,
              edges: edges
          };
          const network = new vis.Network(container, graphData, options);
          network.moveTo({
            scale: 2
          });
        </script>
    </body>
  </html>
  `
  return html
}

export const saveHtmlDocument = (entities, name: string) => {
  const htmlContent = createHtmlDocument(entities)
  fs.writeFileSync(`${name}.html`, htmlContent)
}
