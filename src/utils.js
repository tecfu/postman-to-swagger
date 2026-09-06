const JSON5 = require('json5')

const DEFAULT_OMIT_HEADERS = ['Content-Type', 'X-Requested-With']
const DEFAULT_REQUIRE_ALL = ['headers', 'body', 'query', 'path']

function validateCollection(collection) {
  if (!collection || typeof collection !== 'object' || Array.isArray(collection)) {
    throw new TypeError('Postman collection must be an object')
  }
  if (!Array.isArray(collection.item)) {
    throw new TypeError("Postman collection must contain an 'item' array")
  }
}

function flattenItems(items, result = []) {
  for (const item of items || []) {
    if (item && Array.isArray(item.item)) {
      flattenItems(item.item, result)
    } else if (item && item.request) {
      result.push(item)
    }
  }
  return result
}

function mergeOptions(options = {}) {
  const merged = {
    source_spec: 'postman2.1',
    target_spec: 'openapi3.0',
    require_all: [...DEFAULT_REQUIRE_ALL],
    omit: { headers: [...DEFAULT_OMIT_HEADERS] },
    info: {},
    host: null,
    basepath: null,
    schemes: null,
    servers: null,
    responses: { 200: { description: 'OK' } },
    ...options
  }
  merged.require_all = Array.isArray(options.require_all)
    ? options.require_all
    : [...DEFAULT_REQUIRE_ALL]
  merged.omit = {
    headers: Array.isArray(options.omit?.headers)
      ? options.omit.headers
      : [...DEFAULT_OMIT_HEADERS],
    ...(options.omit || {})
  }
  merged.responses = options.responses
    ? { ...options.responses }
    : { 200: { description: 'OK' } }
  return merged
}

function getUrl(request) {
  const url = request?.url
  if (!url) return { path: '/', query: [] }

  if (typeof url === 'string') return parseRawUrl(url)

  const path = Array.isArray(url.path) ? url.path : []
  const query = Array.isArray(url.query) ? url.query : []
  return { path, query }
}

function parseRawUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl.replace(/\{\{[^}]+\}\}/g, 'placeholder'))
    const path = parsed.pathname.split('/').filter(Boolean)
    const query = [...parsed.searchParams.entries()].map(([key, value]) => ({ key, value }))
    return { path, query }
  } catch {
    return { path: rawUrl.split('?')[0].split('/').filter(Boolean), query: [] }
  }
}

function variableName(value) {
  const match = typeof value === 'string' && value.match(/^\{\{([^}]+)\}\}$/)
  return match ? match[1] : null
}

function normalizePathSegment(segment) {
  const variable = variableName(segment)
  if (variable) return `{${variable}}`
  return String(segment)
}

function normalizePath(path) {
  const segments = Array.isArray(path) ? path : String(path || '').split('/').filter(Boolean)
  const normalized = segments.map(normalizePathSegment)
  return `/${normalized.join('/')}` || '/'
}

function inferSchema(value, openapi3 = false) {
  if (value === null) return openapi3 ? { nullable: true } : { type: 'string' }
  if (Array.isArray(value)) {
    const schema = { type: 'array' }
    if (value.length) schema.items = inferSchema(value[0], openapi3)
    else schema.items = {}
    return schema
  }
  switch (typeof value) {
    case 'boolean': return { type: 'boolean' }
    case 'number': return { type: Number.isInteger(value) ? 'integer' : 'number' }
    case 'object': {
      const properties = {}
      for (const [key, child] of Object.entries(value)) properties[key] = inferSchema(child, openapi3)
      return { type: 'object', properties }
    }
    default: return { type: 'string' }
  }
}

function parseBody(raw) {
  if (typeof raw !== 'string') return raw
  try {
    return JSON5.parse(raw)
  } catch (error) {
    throw new Error(`Unable to parse raw JSON request body: ${error.message}`)
  }
}

function headerEntries(request) {
  return Array.isArray(request?.header) ? request.header.filter(header => header && header.key) : []
}

function shouldOmitHeader(header, config) {
  return config.omit.headers.some(name => String(name).toLowerCase() === String(header.key).toLowerCase())
}

function getBody(request) {
  const body = request?.body
  if (!body || typeof body !== 'object' || body.mode !== 'raw' || body.raw == null) return null
  return parseBody(body.raw)
}

function getParameters(request, config, target) {
  const url = getUrl(request)
  const parameters = []
  const required = config.require_all

  if (required.includes('headers')) {
    for (const header of headerEntries(request)) {
      if (shouldOmitHeader(header, config)) continue
      parameters.push({
        name: header.key,
        in: 'header',
        required: Boolean(header.value) || required.includes('headers'),
        schema: { type: 'string' }
      })
    }
  }

  if (required.includes('query')) {
    for (const query of url.query) {
      if (!query || !query.key) continue
      parameters.push({
        name: query.key,
        in: 'query',
        required: Boolean(query.value) && required.includes('query'),
        schema: { type: 'string' }
      })
    }
  }

  if (required.includes('path')) {
    for (const segment of url.path) {
      const variable = variableName(segment)
      if (!variable) continue
      const parameter = {
        name: variable,
        in: 'path',
        required: true,
        schema: { type: 'string' }
      }
      if (target === 'swagger2.0') parameter.type = 'string'
      parameters.push(parameter)
    }
  }

  return parameters
}

function responseMap(responses) {
  const output = {}
  for (const [code, response] of Object.entries(responses || {})) {
    output[code] = typeof response === 'object' && response !== null
      ? { ...response }
      : { description: String(response) }
  }
  return output
}

function operationMethod(request) {
  const method = String(request?.method || 'get').toLowerCase()
  const allowed = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']
  if (!allowed.includes(method)) throw new Error(`Unsupported HTTP method '${method}'`)
  return method
}

module.exports = {
  validateCollection,
  flattenItems,
  mergeOptions,
  getUrl,
  normalizePath,
  inferSchema,
  getBody,
  getParameters,
  responseMap,
  operationMethod,
  variableName,
  headerEntries
}
