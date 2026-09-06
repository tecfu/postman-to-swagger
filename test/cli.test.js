const test = require('node:test')
const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const path = require('node:path')

const cli = path.resolve(__dirname, '../src/cli.js')
const fixture = path.resolve(__dirname, 'data/postman_collection.json')

function run(args, input) {
  return spawnSync(process.execPath, [cli, ...args], {
    input,
    encoding: 'utf8'
  })
}

test('prints help and version', () => {
  const help = run(['--help'])
  assert.equal(help.status, 0)
  assert.match(help.stdout, /Usage: postman-to-swagger/)

  const version = run(['--version'])
  assert.equal(version.status, 0)
  assert.match(version.stdout, /^0\.3\.0\n$/)
})

test('converts an input file and selects the target spec', () => {
  const result = run([fixture, '--target', 'swagger2.0'])
  assert.equal(result.status, 0)
  const output = JSON.parse(result.stdout)
  assert.equal(output.swagger, '2.0')
})

test('supports stdin/stdout and compact output', () => {
  const input = {
    info: { name: 'CLI stdin test' },
    item: [{
      name: 'Health',
      request: { method: 'GET', url: { path: ['health'] } }
    }]
  }
  const result = run(['-', '-', '--target', 'openapi3.0', '--compact'], JSON.stringify(input))
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stderr, '')
  assert.equal(JSON.parse(result.stdout).openapi, '3.0.3')
  assert.ok(!result.stdout.includes('\n  '))
})

test('reports invalid input without a stack trace', () => {
  const result = run(['-'], '{not valid json}')
  assert.equal(result.status, 1)
  assert.match(result.stderr, /^Error:/)
})
