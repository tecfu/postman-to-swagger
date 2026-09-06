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

function toOpenAPI3(collection, options = {}) {
  validateCollection(collection)
  const config = mergeOptions(options)
  const result = {
    openapi: '3.0.3',
    info: {
      title: collection.info?.name || 'Postman Collection',
      description: collection.info?.description || 'No description',
      version: '1.0.0',
      ...config.info
    },
    paths: {}
  }

  if (config.servers) result.servers = config.servers

  for (const item of flattenItems(collection.item)) {
    const request = item.request
    const method = operationMethod(request)
    const url = getUrl(request)
    const path = normalizePath(url.path)
    if (!result.paths[path]) result.paths[path] = {}
    if (result.paths[path][method]) throw new Error(`Duplicate operation for ${method.toUpperCase()} ${path}`)

    const operation = {
      summary: item.name,
      responses: responseMap(config.responses),
      parameters: getParameters(request, config, 'openapi3')
    }

    const body = getBody(request)
    if (body !== null) {
      const header = (request.header || []).find(h => h?.key?.toLowerCase() === 'content-type' && h.value)
      const mediaType = header?.value.split(';')[0].trim() || 'application/json'
      operation.requestBody = {
        required: config.require_all.includes('body'),
        content: { [mediaType]: { schema: inferSchema(body, true) } }
      }
    }

    if (!operation.parameters.length) delete operation.parameters
    result.paths[path][method] = operation
  }
  return result
}

module.exports = toOpenAPI3
