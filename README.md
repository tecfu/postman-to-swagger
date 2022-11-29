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

## Options
<a name="options_properties"></a>


### Options: All Targets Specs ```object```


| Param | Type | Description |
| --- | --- | --- |
| source_spec | <code>string</code> | default: "postman2.1". <br/> options: "postman2.1" |
| target_spec | <code>string</code> | default: "openapi3.0". <br/> options: "swagger2.0", "openapi3.0" |
| require_all | <code>array</code> | default: ["headers", "body", "query", "path"]  |
| omit | <code>object</code> | default: {<br/>headers: ["Content-Type", "X-Requested-With"]<br/>} |
| info | <code>object</code> | default: {} |
| responses | <code>object</code> | default: {<br/>200: {<br/>description: "OK"<br/>}<br/>} |



### Options: Swagger 2.x ```object```

| Param | Type | Description |
| --- | --- | --- |
| host | <code>string</code> | default: '' <br/> Note: Only applies to Swagger 2.0 output |
| basepath | <code>string</code> | default: '' <br/> Note: Only applies to Swagger 2.0 output |
| schemes | <code>string</code> | default: '' <br/> Note: Only applies to Swagger 2.0 output |



### Options: OpenAPI 3.x ```object```

| Param | Type | Description |
| --- | --- | --- |
| servers | <code>array</code> | default: []  <br/> Note: Only applies to OpenAPI 3.0 output |



## Example

```js
const p2s = require('postman-to-swagger')
const yaml = require('js-yaml')
const fs = require('fs')
const postmanJson = require('./postman_collection.json')
const swaggerJson = p2s(postmanJson, {
  target_spec: "swagger2.0",
  info: {
    version: 'v1'
  }
})

//let output = JSON.stringify(swaggerJson, null, 2)
let output = yaml.dump(swaggerJson)

// Save to file
fs.writeFileSync(
  'swagger.yaml',
  output,
  'utf8'
)
```


## License

[MIT](LICENSE)
