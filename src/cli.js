'use strict';

const p2o = require('./index.js');
const yaml = require('yaml');
const fs = require('fs');

const postmanJson = yaml.parse(fs.readFileSync(process.argv[2] || './postman_collection.json','utf8'));
const openapiJson = p2o(postmanJson, {
  info: {
    version: '1.0.0'
  }
});

const output = yaml.stringify(openapiJson);

fs.writeFileSync('openapi.yaml',output,'utf8');
