# Postman to Swagger

Convert Postman 2.1 collections into Swagger 2.0 or OpenAPI 3.0 documents.

The converter preserves the CommonJS API while generating standards-shaped request parameters and OpenAPI 3 `requestBody` objects. Nested Postman folders are traversed recursively.

## Requirements

- Node.js 22.18 or newer

## Installation

```sh
npm install tecfu/postman-to-swagger
```

## Usage

```js
const p2s = require('postman-to-swagger')
const yaml = require('yaml')
const fs = require('node:fs')
const postmanJson = JSON.parse(fs.readFileSync('./postman_collection.json', 'utf8'))

const openapi = p2s(postmanJson, {
  target_spec: 'openapi3.0',
  info: { version: '1.0.0' }
})

fs.writeFileSync('openapi.yaml', yaml.stringify(openapi), 'utf8')
```

For Swagger 2.0, set `target_spec: 'swagger2.0'`. Swagger 2.0 request bodies are emitted as `in: body` parameters; OpenAPI 3 request bodies use `requestBody.content` as required by the OpenAPI 3 specification.

## Options

| Option | Default | Description |
| --- | --- | --- |
| `source_spec` | `postman2.1` | Supported Postman source schema. |
| `target_spec` | `openapi3.0` | `swagger2.0` or `openapi3.0`. |
| `require_all` | `['headers', 'body', 'query', 'path']` | Marks supported request components as required. |
| `omit.headers` | `['Content-Type', 'X-Requested-With']` | Headers excluded from generated parameters. Matching is case-insensitive. |
| `info` | `{}` | Values merged into the generated `info` object. |
| `responses` | `{ 200: { description: 'OK' } }` | Default response map when a request has no response examples. |
| `host` | `null` | Swagger 2.0 host. |
| `basepath` | `null` | Swagger 2.0 base path. |
| `schemes` | `null` | Swagger 2.0 schemes; defaults to `https`. |
| `servers` | `null` | OpenAPI 3 servers. |

Raw JSON request bodies are parsed with JSON5 and recursively converted into object, array, string, boolean, number, and integer schemas. Other Postman body modes are currently left unmodeled.

## Development

```sh
npm install
npm test
```

The test suite uses Node's built-in `node:test` runner and runs in GitHub Actions against Node.js 22, 24, and 26.

## License

[MIT](LICENSE)
