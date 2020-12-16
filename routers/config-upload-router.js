'use strict';

const PREFIX = process.env.MKS_PREFIX || '';
const MNT = `${PREFIX}/mnt`;
const LOG = '/var/ftp/log';
const TMP = `${PREFIX}/tmp`;
const MNT_CONFIG = `${MNT}/config`;
const TMP_APPLY = `${TMP}/apply`;
const express = require('express');
const bodyParser = require('body-parser')

const uploadRouter = express.Router();
const exec = require('child_process').execSync;
const multer = require('multer')
const path = require('path');
const OPENSSL_DECRYPTION_GENERIC_CMD = `openssl aes-256-cbc -d -salt -md md5 -k n0v1n@ -in INPUT_FILE -out OUTPUT_FILE`;
const UNZIP = `unzip INPUT_FILE -d OUTPUT_FILE`;
const utils = require('../commons/utils');

var fs = require('fs-extra');

uploadRouter.use(bodyParser.json());


var configStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, `${TMP}`)
    },
    filename: function (req, file, cb) {
      cb(null, `${file.originalname}`)
    }
  })
  var configUpload = multer({ storage: configStorage }).array('config')
  

  // *********  generator config file download endpoints **********
uploadRouter.post('/config-download', configUpload, function (req, res, next) {
    let deviceConfigDownloadLog = ["SERVER: CONFIG UPDATE TO GENERATOR"];
  
    //declare shared variables
    let INPUT_FILE = '';
    let OUTPUT_FILE = '';
    let CMD = '';
  
    if(!req.files) {
      var err = 'ERROR: FILE DOWNLOAD FAILED';
      deviceConfigDownloadLog.push(err)
      fs.appendFile(`${LOG}/web0.txt`, JSON.stringify(deviceConfigDownloadLog, null, 4), err => {
        if (err)
          return res.status(404).send(err)
      })
      return res.status(404).send(err)
    } else {
  
        //replace the .zip.aes with .zip and decrypt the .aes file
          //logging
          deviceConfigDownloadLog.push(new Date().toISOString())   
          deviceConfigDownloadLog.push('Filename: ', + req.files[0].originalname)
          deviceConfigDownloadLog.push('Size: ' + req.files[0].size)
  
          INPUT_FILE = req.files[0].path
          OUTPUT_FILE = INPUT_FILE.replace('.zip.aes', '.zip')
          CMD = OPENSSL_DECRYPTION_GENERIC_CMD
              .replace('INPUT_FILE', INPUT_FILE)
              .replace('OUTPUT_FILE', OUTPUT_FILE)
    
          deviceConfigDownloadLog.push('DECRYPT FILE')
          deviceConfigDownloadLog.push('INPUT_FILE: ' + INPUT_FILE)
          deviceConfigDownloadLog.push('OUTPUT_FILE: ' + OUTPUT_FILE)
          //call the decrypt command
          exec(CMD, (error, stdout, stderr) => {
            if(error) {
              deviceConfigDownloadLog.push('DECRYPT ERROR: ' + `${error.message}`);
              fs.appendFile(`${LOG}/web0.txt`, JSON.stringify(deviceConfigDownloadLog, null, 4), err => {
                if (err)
                  return res.status(404).send(err)
              })
              return res.end(error)
            }
            if(stderr) {
              deviceConfigDownloadLog.push('DECRYPT ERROR: ' + `${stderr}`);
              fs.appendFile(`${LOG}/web0.txt`, JSON.stringify(deviceConfigDownloadLog, null, 4), err => {
                if (err)
                  return res.status(404).send(err)
              })
              return res.end(error)
            }
            deviceConfigDownloadLog.push('DECRYPT MSG: ' + `${stdout}`);        
          })
        
          //replace the .zip extension with no extention
          INPUT_FILE = OUTPUT_FILE
          OUTPUT_FILE = OUTPUT_FILE.replace('.zip', '')
          CMD = UNZIP
              .replace('INPUT_FILE', INPUT_FILE)
              .replace('OUTPUT_FILE', OUTPUT_FILE)
          console.log('output file = ', OUTPUT_FILE)
          deviceConfigDownloadLog.push('UNZIP FILE')
          deviceConfigDownloadLog.push('INPUT_FILE: ' + INPUT_FILE)
          deviceConfigDownloadLog.push('OUTPUT_FILE: ' + OUTPUT_FILE)
  
          fs.ensureDirSync(`${OUTPUT_FILE}`)

  
          //call the unzip command
          exec(CMD, (error, stdout, stderr) => {
            if(error) {
              deviceConfigDownloadLog.push('UNZIP ERROR: ' + `${error.message}`);
              fs.appendFile(`${LOG}/web0.txt`, JSON.stringify(deviceConfigDownloadLog, null, 4), err => {
                if (err)
                  return res.status(404).send(err)
              })
              return res.end(error)
            }
            if(stderr) {
              deviceConfigDownloadLog.push('UNZIP ERROR: ' + `${stderr}`);
              fs.appendFile(`${LOG}/web0.txt`, JSON.stringify(deviceConfigDownloadLog, null, 4), err => {
                if (err)
                  return res.status(404).send(err)
              })
              return res.end(error)
            }
            deviceConfigDownloadLog.push('UNZIP MSG: ' + `${stdout}`);        
          })
          
        //move the config files into their respective folders in the generator
          deviceConfigDownloadLog.push('UPDATE TO GENERATOR MNT/CONFIG');
        //check if the file contains configs/MNT
          if(fs.existsSync(`${OUTPUT_FILE}/Configs/MNT`)) {
              // copy permanent configs to mnt/config
              const permanentConfigFiles = fs.readdirSync(`${OUTPUT_FILE}/Configs/MNT`, { withFileTypes: true });
              permanentConfigFiles.forEach(file => {
                const stat = fs.statSync(`${OUTPUT_FILE}/Configs/MNT/${file}`);
                if (!stat.isDirectory() && path.extname(`${file}`) === '.json') {
                  const data = fs.readFileSync(`${OUTPUT_FILE}/Configs/MNT/${file}`).toString();
                  fs.writeFileSync(`${MNT_CONFIG}/${file}`, data);
                  deviceConfigDownloadLog.push(`${file}`);
                  deviceConfigDownloadLog.push(JSON.parse(data));
                }
              });
          //file does not contain configs/MNT
          } else {
              deviceConfigDownloadLog.push("no configs/MNT in upload file")
          }

          //check if the file contains configs/Apply
          if(fs.existsSync(`${OUTPUT_FILE}/Configs/Apply`)) {
              deviceConfigDownloadLog.push('UPDATE TO GENERATOR TMP/APPLY');
              // copy temporary configs to tmp/apply
              const temporaryConfigFiles = fs.readdirSync(`${OUTPUT_FILE}/Configs/Apply`, { withFileTypes: true });
              temporaryConfigFiles.forEach(file => {
                const stat_1 = fs.statSync(`${OUTPUT_FILE}/Configs/Apply/${file}`);
                if (!stat_1.isDirectory() && path.extname(`${file}`) === '.json') {
                  const data_1 = fs.readFileSync(`${OUTPUT_FILE}/Configs/Apply/${file}`).toString();
                  fs.writeFileSync(`${TMP_APPLY}/${file}`, data_1);
                  deviceConfigDownloadLog.push(`${file}`);
                  deviceConfigDownloadLog.push(JSON.parse(data_1 ));
                }
              });
          //file does not contain configs/Apply
          } else {
            deviceConfigDownloadLog.push("no configs/Apply in upload file")
          }

          //log the results of uploading the configs
          fs.appendFile(`${LOG}/web0.txt`, JSON.stringify(deviceConfigDownloadLog, null, 4), err => {
            if (err)
              return res.status(404).send(err)
          })
        
    }//else
      fs.unlinkSync(req.files[0].path)
      fs.unlinkSync(req.files[0].path.replace('.zip.aes', '.zip'))
      utils.rmdir(req.files[0].path.replace('.zip.aes', ''))      
    res.sendStatus(200)
  })


  module.exports = uploadRouter;