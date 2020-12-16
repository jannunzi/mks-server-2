'use strict';

const LOG = '/var/ftp/log';

const express = require('express');
const bodyParser = require('body-parser')

const logRouter = express.Router();

var fs = require('fs-extra');

logRouter.use(bodyParser.json());



//end point for client to write to log file
logRouter.put('/writeLog', (req, res) => {
    let writeToLog = [`CLIENT: ${req.body.heading}`];
    writeToLog.push(new Date().toISOString())
    
    if (Array.isArray(req.body.content)) {
      req.body.content.forEach( c => {
      writeToLog.push(c)
      })
    } else {
      writeToLog.push(req.body.content)
    }
    
    fs.appendFile(`${LOG}/web0.txt`, JSON.stringify(writeToLog, null, 4), err => {
      if (err)
        return res.status(404).send(err)
    })
    res.sendStatus(200)
   
})


module.exports = logRouter;