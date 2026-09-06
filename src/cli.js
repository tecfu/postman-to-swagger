#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')
const convert = require('./index')

function usage() {
  return `Usage: postman-to-swagger <input.json> [output.json] [options]

Convert a Postman collection to Swagger 2.0 or OpenAPI 3.0.

Options:
  -t, --target <spec>       Target spec: openapi3.0 (default) or swagger2.0
  -o, --output <file>       Write the converted document to this file
      --pretty              Pretty-print JSON output (default)
      --compact             Emit compact JSON
  -h, --help                Show this help
  -v, --version             Show the package version

Examples:
  postman-to-swagger collection.json
  postman-to-swagger collection.json openapi.json
  postman-to-swagger collection.json -o swagger.json --target swagger2.0
  cat collection.json | postman-to-swagger - -
`
}

function packageVersion() {
  return require('../package.json').version
}

function parseArgs(argv) {
  const positional = []
  const options = { target_spec: 'openapi3.0', pretty: true, output: null }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    switch (arg) {
      case '-h':
      case '--help':
        options.help = true
        break
      case '-v':
      case '--version':
        options.version = true
        break
      case '-t':
      case '--target':
        if (!argv[i + 1]) throw new Error(`${arg} requires a value`)
        options.target_spec = argv[++i]
        break
      case '-o':
      case '--output':
        if (!argv[i + 1]) throw new Error(`${arg} requires a value`)
        options.output = argv[++i]
        break
      case '--pretty':
        options.pretty = true
        break
      case '--compact':
        options.pretty = false
        break
      default:
        // A lone '-' is the conventional stdin/stdout path, not an option.
        if (arg !== '-' && arg.startsWith('-')) throw new Error(`Unknown option '${arg}'`)
        positional.push(arg)
    }
  }

  if (!options.help && !options.version && positional.length > 2) {
    throw new Error('Too many positional arguments')
  }
  if (!options.output && positional[1]) options.output = positional[1]
  options.input = positional[0] || null
  return options
}

const MAX_INPUT_BYTES = 25 * 1024 * 1024 // 25MB guard against memory exhaustion

function readInput(input) {
  if (!input || input === '-') {
    const data = fs.readFileSync(0, 'utf8')
    if (Buffer.byteLength(data, 'utf8') > MAX_INPUT_BYTES) throw new Error('Input exceeds maximum allowed size')
    return data
  }
  const resolved = path.resolve(input)
  if (fs.statSync(resolved).size > MAX_INPUT_BYTES) throw new Error('Input exceeds maximum allowed size')
  return fs.readFileSync(resolved, 'utf8')
}

function writeOutput(output, destination) {
  if (!destination || destination === '-') {
    process.stdout.write(output)
    return
  }
  fs.writeFileSync(path.resolve(destination), output, 'utf8')
}

function main(argv = process.argv.slice(2)) {
  try {
    const options = parseArgs(argv)
    if (options.help) {
      process.stdout.write(usage())
      return 0
    }
    if (options.version) {
      process.stdout.write(`${packageVersion()}\n`)
      return 0
    }
    if (!options.input) throw new Error('An input collection is required')

    const collection = JSON.parse(readInput(options.input))
    const result = convert(collection, { target_spec: options.target_spec })
    const output = JSON.stringify(result, null, options.pretty ? 2 : 0) + '\n'
    writeOutput(output, options.output)
    return 0
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n`)
    return 1
  }
}

if (require.main === module) process.exitCode = main()

module.exports = { main, parseArgs }
