function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

module.exports = (collection, config) => {

  const output = {}

  // openapi version
  output.openapi = "3.0.0"

  // info object
  output.info = {}
  output.info.title = (config.info && config.info.name) 
    ? config.info.name : (collection.info.name || "")
  output.info.description = (config.info && config.info.description) 
    ? config.info.description : (collection.info.description || "No description")
  output.info.version = (config.info && config.info.version) 
    ? config.info.version : "1.0.0"
  
  // servers
  if (config.servers) output.servers = config.servers;

  // paths
  output.paths = getPaths(collection, config)

  return output
}

const getPaths = (collection, config) => {
  let result = {}

  let allItems = collection.item
    .map(grouping => grouping.item)
    .flat(1)
    .forEach(item =>  {
      if (!item || Object.keys(item) === 0) return;
      let path = `/${(item.request.url.path || []).join('/')}`
        .replace(/{{/g,'{')
        .replace(/}}/g,'}')
      result[path] = result[path] || {}
      
      // each method (GET, POST, PUT, DELETE) for path
      result[path][item.request.method.toLowerCase()] = {

        summary: item.name, 

        // parameter types: [query, path, header, body, form]
        parameters: getParameters(
          item.request.header,
          item.request.body,
          item.request.url,
          config
        ),

        responses: getResponses(item.response, config)
      }
    })
  
  return result
}


const getParameters = (header, body, url, config) => {
  result = []
  result.push(processReqHeader(header, config))
  result.push(processReqBody(body, config))
  result.push(processReqPath(url, config))
  result.push(processReqQuery(url, config))
  
  return result.flat(1)
}


const processReqHeader = (header, config) => {
  let result
  result = header.map(object => {
    // early exit if omitted
    if (config.omit.headers.indexOf(object.key) !== -1) {
      return null
    }
    
    let result = {}
    result.in = "header"
    result.name = object.key
    if (config.require_all.indexOf("headers") !== -1) result.required = true
    result.schema = { type: "string" };
    return result
  }).filter( x => x)
  
  return result
}


const processReqBody = (body, config) => {
  let result = {}
  let parsedBody, parsedBodyKeys
  if (!body || !body.raw) {
    return []
  }

  try {
    parsedBody = JSON.parse(body.raw)
    parsedBodyKeys = Object.keys(parsedBody)
  }
  catch(err) {
    throw new Error(`Request body must be array or object, instead got: ${body}`)
  }

  result.in = "body"
  result.name = (parsedBodyKeys.length === 1) ? parsedBodyKeys[0] : "body"
  result.schema = bodyItemToOpenAPI(parsedBody, config)
  if (config.require_all.indexOf("body") !== -1) result.required = true
  return result
}


const processReqQuery = (url, config) => {
  let result
  if (!url.query || !url.query.length) return []

  result = url.query.map (query => {
    let result = {}
    result.in = 'query'
    result.name = query.key
    result.schema = { type: typeof query.value };
    if (config.require_all.indexOf("query") !== -1) result.required = true
    return result
  })

  return result
}


const processReqPath = (url, config) => {
  let result
  if (!url.path || url.path.length === 1) return []

  // clone && remove first element because its never a slug
  let paths = url.path.slice(1)

  result = paths.map (path => {
    if (path.indexOf('{{') === -1) return null
    let result = {}
    result.in = 'path'
    result.name = path.match(/{{(.*)}}/)[1]
    result.schema = { type: typeof result.name };
    result.required = true
    
    return result
  }).filter( x => x)

  return result
}


const bodyItemToOpenAPI = (value, config) => {
  let result
  let type = (Array.isArray(value)) ? "array" : typeof value

  switch(type){
    case("array"):
      result = {
        type: "array",
        items: {
          type: (typeof value[0] === 'number') ? "number" : "string"
        }
      }
      break

    case("object"):
      result = {
        type: "object",
        properties: {}
      }

      Object.entries(value)
        .forEach(arr => {result.properties[arr[0]] = bodyItemToOpenAPI(arr[1], config)})
      break

    case("string" || "number"):
      result = {
        type: type
      }
      break

    default:
      throw new Error(`Type ${type} not supported`)
  }

  return result
}


const getResponses = (responses, config) => { 
  if (!responses.length) return clone(config.responses);

  let result = {}
  responses.forEach (response => {
    result[response.code] = { description: response.status }
  })
  return result
}
