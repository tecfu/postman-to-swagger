const p2s = require(`${__dirname}/../src/index.js`);
const yaml = require('yaml');
const fs = require('fs');

const postmanJson = yaml.parse(fs.readFileSync(process.argv[2] || `${__dirname}/../test/data/postman_collection.json`,'utf8'));
const openapiJson = p2s(postmanJson, {
  info: {
    version: '1.0.0'
  }
});

const output = yaml.stringify(openapiJson);
console.log(output)
