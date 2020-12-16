'use strict';


//file system directories on generator used to extract or copy to/from
const MNT = '/mnt';
const TMP = '/tmp';
const LOG = '/var/ftp/log';

const express = require('express');
const bodyParser = require('body-parser')

const configRouter = express.Router();

var fs = require('fs-extra');

configRouter.use(bodyParser.json());


// generalized configuration retrieval
configRouter.get('/device-config/:configName', (req, res) => {
    console.log('config name = ', req.params.configName)
    let deviceConfigLog = ["SERVER: GET DEVICE CONFIG"];
    deviceConfigLog.push(new Date().toISOString())
  
    let configName = req.params.configName
    console.log('configname = ', configName)
  
    let config = JSON.parse(fs.readFileSync(`${TMP}/apply/${configName}`).toString())
  
    deviceConfigLog.push(config)
    fs.appendFile(`${LOG}/web0.txt`, JSON.stringify(deviceConfigLog, null, 4), err => {
      if (err)
        return res.status(404).send(err)
    })
    return res.status(200).json(config)
  });
  
  
  configRouter.put('/applyConfigs/:configName', (req, res) => {
    let deviceConfigApplyLog = ["SERVER: DEVICE CONFIG APPLY"];
    deviceConfigApplyLog.push(new Date().toISOString())
    let fileName = req.params.configName
    const tmpConfigFilePath = `${TMP}/apply/${fileName}`
    const configToApply = JSON.stringify(req.body, null, 4);
    deviceConfigApplyLog.push(tmpConfigFilePath);
    deviceConfigApplyLog.push(req.body)
    
    fs.writeFile(tmpConfigFilePath, configToApply, (err) => {
      if(err) {
        deviceConfigApplyLog.push(err)
        fs.appendFile(`${LOG}/web0.txt`, JSON.stringify(deviceConfigApplyLog, null, 4), error => {
          if (err)
            return res.status(404).send(error)
        }) 
        return res.status(404).send(err)
      } 
    })
    fs.appendFile(`${LOG}/web0.txt`, JSON.stringify(deviceConfigApplyLog, null, 4), err => {
      if (err)
        return res.status(404).send(err)
    })
    return res.sendStatus(200);
  })
  
  
  configRouter.put('/saveConfigs/:configName', (req, res) => {
    let deviceConfigSaveLog = ["SERVER: DEVICE CONFIG SAVE"];
    deviceConfigSaveLog.push(new Date().toISOString())
    let fileName = req.params.configName;
    const tmpConfigFilePath = `${TMP}/apply/${fileName}` 
    const mntConfigFilePath = `${MNT}/config/${fileName}`
    const configToSave = JSON.stringify(req.body, null, 4)
    deviceConfigSaveLog.push(mntConfigFilePath);
    deviceConfigSaveLog.push(req.body)
    
    //write to /mnt/config
    fs.writeFile(mntConfigFilePath, configToSave, (err) => {
      if(err) {
        deviceConfigSaveLog.push(err)
        fs.appendFile(`${LOG}/web0.txt`, JSON.stringify(deviceConfigSaveLog, null, 4), err => {
          if (err)
            return res.status(404).send(err)
        })
        return res.sendStatus(404)
      }
    })
    //write to /tmp so that if the user navigates to another config, then
    //comes back, they will see the change they made
    fs.writeFile(tmpConfigFilePath, configToSave, (err) => {
      if(err) {
        deviceConfigApplyLog.push(err)
        fs.appendFile(`${LOG}/web0.txt`, JSON.stringify(deviceConfigApplyLog, null, 4), error => {
          if (err)
            return res.status(404).send(error)
        }) 
        return res.status(404).send(err)
      } 
    })
    fs.appendFile(`${LOG}/web0.txt`, JSON.stringify(deviceConfigSaveLog, null, 4), err => {
      if (err)
        return res.status(404).send(err)
    })
    return res.sendStatus(204);
  })

  module.exports = configRouter;