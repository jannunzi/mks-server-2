'use strict';

const FIRMWARE = '/var/ftp/firmware';
const SCOPE_FILES = '/var/ftp/scope';
const express = require('express');
const bodyParser = require('body-parser')
const multer = require('multer')
const path = require('path');

const firmwareRouter = express.Router();

var fs = require('fs-extra');

firmwareRouter.use(bodyParser.json());

const readLastLines = require('read-last-lines');


//create a fileObject for the firmware file location on the target
var firmwarePath = Object.assign({}, {
  dir: FIRMWARE // TODO: this used to point to /var/tmp/??
})
//set the file path location with the file Object
var filepath = path.format(firmwarePath)

//setup the storage to save the firmware download file
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, filepath)
  },
  filename(req, file, cb) {
    cb(null, `${file.fieldname}`)
  }
})

var upload = multer({ storage }).single("IronNewt.zcz")


firmwareRouter.get("/firmware-download-status-start/:token", (req, res) => {
    fs.appendFileSync(`${FIRMWARE}/Upgrade_Results.txt`, `${req.params.token}\n`)
    res.sendStatus(200)
})

firmwareRouter.get("/firmware-download-status-monitor/:token", (req, res) => {
    const token = req.params.token
    readLastLines.read(`${FIRMWARE}/Upgrade_Results.txt`, 100)
      .then((lines) => {
        lines = lines.split("\n")
        const tokenIndex = lines.findIndex(line => line.indexOf(token) >= 0)
        lines = lines.slice(tokenIndex)
        res.send({
          upgradeResults: lines
        })
    });
})


// *********  generator firmware download endpoints **********
firmwareRouter.post('/firmware-download', upload, (req, res) => {

  const scopeFilePath = `${SCOPE_FILES}`

  //remove the scope files, else the firmware file
  //may not download due to lack of space 
  const removeDir = (path) => {
      if (fs.existsSync(path)) {
      const files = fs.readdirSync(scopeFilePath)
      if (files.length > 0) {
        files.forEach(function(filename) {
          if (fs.statSync(scopeFilePath + "/" + filename).isDirectory()) {
            removeDir(scopeFilePath + "/" + filename)
          } else {
            fs.unlinkSync(scopeFilePath + "/" + filename)
          }
        })
        fs.rmdirSync(scopeFilePath)
      } else {
        fs.rmdirSync(scopeFilePath)
      }
    } else {
      console.log("Directory path not found.")
    }
  }
  //call the recursive function to remove the scope files
  removeDir(scopeFilePath)
  //add back the scope directory under /var/ftp/scope, some process may be looking for it
  fs.mkdirSync(`${SCOPE_FILES}`)

  upload(req, res, function (err) {
    //deal with the error(s)
    if (err) {
      // An error occurred when uploading
      return res.end(err)
    } else {

    return res.end('File Update Success');
    }
  })
})

module.exports = firmwareRouter;
