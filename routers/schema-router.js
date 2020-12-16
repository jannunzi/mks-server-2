'use strict';

const PREFIX = process.env.MKS_PREFIX || ''
const LOG = '/var/ftp/log';
const TMP = '/tmp';

const express = require('express');
const bodyParser = require('body-parser')
const refParser = require('json-schema-ref-parser');
const path = require('path');
const schemaRouter = express.Router();
var fs = require('fs-extra');

schemaRouter.use(bodyParser.json());



//  *********  generator schema endpoint **********
schemaRouter.get('/device-schema', (req, res) => {
    let deviceSchemaLog = ["SERVER: GET DEVICE SCHEMA"];
    deviceSchemaLog.push(new Date().toISOString())
    //set the file path location of the schema file with the file Object
    var schemaFileLocation = Object.assign({}, {
      dir: `${TMP}/schema`
    });
    
    let schemaFilepath = path.format(schemaFileLocation)
    // gives an array of all the schema files
  
    let schemaFiles = fs.readdirSync(schemaFilepath, { withFileTypes: true })
  
    //reads all the schema and creates an array to send back to the client
    let schemaPromises = [];
    let addJson = [];
    schemaPromises = schemaFiles.filter(file => {
      deviceSchemaLog.push(`${file}`)
      let stat = fs.statSync(`${schemaFilepath}${file}`)
      return !stat.isDirectory()
    }).map((file) => {
      addJson.push({"fileName": `${file}`});
      return refParser.dereference(`${schemaFilepath}${file}`)
    })
    Promise.all(schemaPromises).then(schemas => {
      let i = 0
      schemas.forEach(file => {
        file = Object.assign(file, addJson[i])
        i++
      })
  
      fs.appendFile(`${LOG}/web0.txt`, JSON.stringify(deviceSchemaLog, null, 4), err => {
        if (err)
          return res.status(404).send(err)
      })
      console.log('schemas = ', schemas)
      return res.status(200).json(schemas)
    })
  });




module.exports = schemaRouter;