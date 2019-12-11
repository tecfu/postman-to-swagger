# Postman to Swagger

Converts Postman 2.1 to Swagger 2.0

## Introduction

I looked all over the internet for this tool, because I didn't want to have to build it. It didn't exist, or was broken for a reason. Postman schema doesn't convert well to Swagger/OpenAPI. There's a lot of data missing.

To get around that, I've created some configuration options and implemented defaults where necessary.

This project intends to get you a valid but basic Swagger.yaml from your Postman collection. That way you can generate basic documentation. 
ft

## Example

```js
const p2s = require('postman-to-swagger')
const yaml = require('js-yaml')
const fs = require('fs')
const postmanJson = require('./postman_collection.json')
const swaggerJson = p2s(postmanJson, {
  info: {
    version: 'v1'
  }
})

//let output = JSON.stringify(swaggerJson, null, 2)
let output = yaml.safeDump(swaggerJson)

// Save to file
fs.writeFileSync(
  'Swagger.yaml',
  output,
  'utf8'
)
```

## Defaults

```js
const defaults = {
  source_spec: "postman2.1",
  target_spec: "swagger2.0",
  require_all: ["headers", "body", "query", "path"],
  omit: {
    headers: ["Content-Type", "X-Requested-With"]
  },
  info: {},
  host: null,
  basepath: null,
  schemes: null,
  responses: {
    200: {
      description: "OK"
    }
  }
}
```

## License

MIT
