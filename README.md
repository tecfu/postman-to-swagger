# Postman to Swagger

This project intends to output a valid `swagger.yaml` or `openapi.yaml` file from a Postman collection input.

You can convert:

| INPUT | OUTPUT |
|---|---|
| [Postman 2.1](https://schema.getpostman.com/json/collection/latest/docs/index.html) (`PostmanCollection.json`) | [Swagger 2.0](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md) (`swagger.yaml`) <br/><br/>[OpenAPI 3.0](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.3.md) (`openapi.yaml`)|


> Please Note:

Postman schema doesn't quite match up 1-to-1 against Swagger/OpenAPI schema.
So some target spec defaults are automatically implemented when absent in the source spec.


## Installation

```sh
npm install tecfu/postman-to-swagger
```

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
  'swagger.yaml',
  output,
  'utf8'
)
```

## Defaults


```js
const defaults = {
  source_spec: "postman2.1",
  target_spec: "openapi3.0",
  require_all: ["headers", "body", "query", "path"],
  omit: {
    headers: ["Content-Type", "X-Requested-With"]
  },
  info: {},
  host: null,      // applies only to swagger2.0 output
  basepath: null,  // applies only to swagger2.0 output
  schemes: null,   // applies only to swagger2.0 output
  servers: null,   // applies only to openapi3.0 output
  responses: {
    200: {
      description: "OK"
    }
  }
}
```

## License

[MIT](LICENSE)
