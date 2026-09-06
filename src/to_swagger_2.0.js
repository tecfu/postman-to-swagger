const {
  validateCollection,
  flattenItems,
  mergeOptions,
  getUrl,
  normalizePath,
  inferSchema,
  getBody,
  getParameters,
  responseMap,
  operationMethod
} = require('./utils')

function toSwagger2(collection, options = {}) {
  validateCollection(collection)
  const config = mergeOptions(options)
  const result = {
    swagger: '2.0',
    info: {
      title: collection.info?.name || 'Postman Collection',
      description: collection.info?.description || 'No description',
      version: '1.0.0',
      ...config.info
    },
    paths: {}
  }

  if (config.host) result.host = config.host
  if (config.basepath) result.basePath = config.basepath
  result.schemes = config.schemes || ['https']
  if (config.consumes) result.consumes = config.consumes
  if (config.produces) result.produces = config.produces

  for (const item of flattenItems(collection.item)) {
    const request = item.request
    const method = operationMethod(request)
    const url = getUrl(request)
    const path = normalizePath(url.path)
    if (!result.paths[path]) result.paths[path] = {}
    if (result.paths[path][method]) throw new Error(`Duplicate operation for ${method.toUpperCase()} ${path}`)

    const operation = {
      summary: item.name,
      parameters: getParameters(request, config, 'swagger2.0'),
      responses: responseMap(config.responses)
    }

    const body = getBody(request)
    if (body !== null) {
      const parameter = {
        in: 'body',
        name: 'body',
        required: config.require_all.includes('body'),
        schema: inferSchema(body, false)
      }
      operation.parameters.push(parameter)
    }

    result.paths[path][method] = operation
  }
  return result
}

module.exports = toSwagger2
