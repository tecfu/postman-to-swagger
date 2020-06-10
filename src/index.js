const To_Swagger2_0 = require(`${__dirname}/to_swagger_2.0.js`)
const To_OpenAPI3_0 = require(`${__dirname}/to_openapi_3.0.js`)

const defaults = {
  source_spec: "postman2.1",
  target_spec: "openapi3.0",
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

module.exports = (source, options) => {
  options = options || {}
  let config = Object.assign({}, defaults, options)
  let output

  // convert source to baseline spec (postman 2.1)

  // convert to target
  switch (true) {
    case(config.target_spec === "swagger2.0"):
      output = To_Swagger2_0(source, config)
      break;
    case(config.target_spec === "openapi3.0"):
      output = To_OpenAPI3_0(source, config)
      break;
    default:
      throw new Error(`Target spec '${config.target_spec}' not supported`)
  }

  return output
}
