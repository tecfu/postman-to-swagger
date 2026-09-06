const toSwagger2 = require('./to_swagger_2.0')
const toOpenAPI3 = require('./to_openapi_3.0')
const { mergeOptions } = require('./utils')

module.exports = (source, options = {}) => {
  const config = mergeOptions(options)
  switch (config.target_spec) {
    case 'swagger2.0':
      return toSwagger2(source, config)
    case 'openapi3.0':
      return toOpenAPI3(source, config)
    default:
      throw new Error(`Target spec '${config.target_spec}' not supported`)
  }
}
