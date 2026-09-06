const test = require('node:test')
const assert = require('node:assert/strict')
const convert = require('../src')

function collection(items) {
  return { info: { name: 'Example', description: 'Example API' }, item: items }
}

function requestItem(name, request, response) {
  return { name, request, response }
}

test('converts raw JSON bodies to OpenAPI 3 requestBody', () => {
  const output = convert(collection([
    requestItem('Create', {
      method: 'POST',
      header: [{ key: 'Content-Type', value: 'application/json' }],
      url: { path: ['users'] },
      body: { mode: 'raw', raw: '{"id": 1, "active": true}' }
    })
  ]))

  const operation = output.paths['/users'].post
  assert.equal(output.openapi, '3.0.3')
  assert.equal(operation.requestBody.required, true)
  assert.deepEqual(operation.requestBody.content['application/json'].schema, {
    type: 'object',
    properties: { id: { type: 'integer' }, active: { type: 'boolean' } }
  })
  assert.equal(operation.parameters, undefined)
})

test('keeps Swagger 2 body parameters and infers integer schemas', () => {
  const output = convert(collection([
    requestItem('Create', {
      method: 'POST',
      url: { path: ['users'] },
      body: { mode: 'raw', raw: '{"id": 1}' }
    })
  ]), { target_spec: 'swagger2.0' })

  const parameter = output.paths['/users'].post.parameters[0]
  assert.equal(parameter.in, 'body')
  assert.equal(parameter.schema.properties.id.type, 'integer')
})

test('recursively traverses nested folders and preserves methods on a path', () => {
  const output = convert(collection([
    { name: 'outer', item: [{ name: 'inner', item: [
      requestItem('Get', { method: 'GET', url: { path: ['users', '{{id}}'] } }),
      requestItem('Patch', { method: 'PATCH', url: { path: ['users', '{{id}}'] } })
    ] }] }
  ]))

  assert.ok(output.paths['/users/{id}'].get)
  assert.ok(output.paths['/users/{id}'].patch)
  assert.equal(output.paths['/users/{id}'].get.parameters[0].schema.type, 'string')
})

test('handles missing optional Postman request fields', () => {
  const output = convert(collection([
    requestItem('Simple', { method: 'GET', url: { path: ['health'] } })
  ]))
  assert.deepEqual(output.paths['/health'].get.responses, { 200: { description: 'OK' } })
})

test('deep-merges partial options instead of losing defaults', () => {
  const output = convert(collection([
    requestItem('Simple', {
      method: 'GET',
      header: [{ key: 'Accept', value: 'application/json' }, { key: 'X-Requested-With', value: 'x' }],
      url: { path: ['health'] }
    })
  ]), { omit: { headers: [] } })

  assert.equal(output.paths['/health'].get.parameters.length, 2)
})

test('rejects duplicate operations instead of silently overwriting them', () => {
  assert.throws(() => convert(collection([
    requestItem('One', { method: 'GET', url: { path: ['users'] } }),
    requestItem('Two', { method: 'GET', url: { path: ['users'] } })
  ])), /Duplicate operation/)
})

test('validates the collection shape and target spec', () => {
  assert.throws(() => convert({}), /item.*array/)
  assert.throws(() => convert(collection([]), { target_spec: 'openapi4.0' }), /not supported/)
})
