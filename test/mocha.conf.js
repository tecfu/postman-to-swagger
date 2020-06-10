/* globals describe, it */
const path = require("path")
const fs = require("fs")
const glob = require("glob")
const cp = require("child_process")
const DOC_ROOT = path.resolve(`${__dirname}/../`)
const colors = require("colors")
const jsdiff = require("diff")
const chai = require("chai")
const expect = chai.expect

// Test all example scripts against their saved output
const exampleScripts = glob.sync(`${DOC_ROOT}/examples/*.js`)

exampleScripts.forEach(function(element) {
  let stdout = cp.execSync(`node ${element}`, {
    encoding: "utf8"
  })
  let filename = element.split("/").pop()
  filename = filename.split(".")[0] + '.yaml'
  let savedFilePath = `${DOC_ROOT}/test/saved/${filename}`
  
  switch(true){
    case(process.argv[2] === 'save'):
    //save tests
      fs.writeFileSync(savedFilePath, stdout, 'utf8');
      break;

    case(process.argv[2] === 'display'):
    //show tests (do nothing)
      console.log(stdout)
      break;

    default:
    //run tests
      let expected = fs.readFileSync(savedFilePath, "utf-8")

      describe(`Test: ${element}`, () => {
        it(`Should match char for char`, function() {
          var diff = jsdiff.diffChars(stdout, expected);
          
          if(diff.length > 1) {
            diff.forEach(function(part){
              // green for additions, red for deletions
              // grey for common parts
              var color = part.added ? 'green' :
                part.removed ? 'red' : 'grey';
              process.stderr.write(part.value[color]);
            });
          }

          expect(diff).to.have.length(1)
        })
      })
  }
})
