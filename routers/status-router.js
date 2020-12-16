'use strict';

const PREFIX = process.env.MKS_PREFIX || ''
const MNT = `${PREFIX}/mnt`;
const TMP = `${PREFIX}/tmp`;
const VERSIONS = `${PREFIX}/versions`;
const UPTIME = `${PREFIX}/proc/uptime`;
const LOG = '/var/ftp/log';

const express = require('express');
const bodyParser = require('body-parser')

const statusRouter = express.Router();
statusRouter.use(bodyParser.json());

//fileSystem object for reading in configs and schema
var fs = require('fs-extra');
var logrotate = require('logrotator');
var rotator = logrotate.rotator;
var xmlConverter = require('xml-js')

//create the web0.txt if it doesn't exits
if(!fs.existsSync(`${LOG}/web0.txt`))
  fs.createFileSync(`${LOG}/web0.txt`)
  
//create the log rotator
rotator.register(`${LOG}/web0.txt`, {
  schedule: '20m', 
  size: '1m', 
  compress: true, 
  count: 9, 
  format: function(index) {
    var d = new Date().toISOString();
    return d;
  }
});

rotator.on('rotate', (file) => {
  fs.appendFile(`${LOG}/web0.txt`, file + ' was rotated', err => {
    if (err)
      return res.status(404).send(err)
  })
})


// *********  generator status endpoint **********
statusRouter.get('/device-status', (req, res) => {
    let deviceStatusLog = ["SERVER: GET DEVICE STATUS"];
    deviceStatusLog.push(new Date().toISOString())
    let missing = {
      configIds: 'SUCCESS',
      hostname: 'SUCCESS',
      serial: 'SUCCESS',
      model: 'SUCCESS',
      uptime: 'SUCCESS',
      firmwareVersion: 'SUCCESS'
  }
    var deviceStatus = [];
    var hostname = [];
    var uptime = [];
  
  
    //deviceStatus.xml file contains the firmware checksum value
    //currently not reported to client
    if(fs.existsSync(`${TMP}/deviceStatus.xml`)) {
      var xmlFile = fs.readFileSync(`${TMP}/deviceStatus.xml`).toString()
      if(xmlFile != '') {
        var deviceStatusJson = xmlConverter.xml2json(xmlFile, {compact: true, spaces: 4})
        deviceStatus.push(JSON.parse(deviceStatusJson))
      } else {
        missing.configIds = 'FAILURE';
      }
    } else {
      missing.configIds = 'FAILURE'
    }
    deviceStatusLog.push(deviceStatus)
    //uptime is found in the /proc/uptime
    if(fs.existsSync(UPTIME)) {
      var uptimeFile = fs.readFileSync(UPTIME).toString()
      if(uptimeFile != '' ) {
        var line = uptimeFile.split(/\s+/)
        uptimeFile = {
          UptimeSeconds: line[0]
        }
          uptime.push(uptimeFile)
      } else {
        missing.uptime ='FAILURE'
      }
    } else {
      missing.uptime ='FAILURE'
    }
    deviceStatusLog.push(uptime)
    //hostname file contains the model number, servial number and the
    //host name is a concat of model and serial number
    if(fs.existsSync(`${MNT}/config/rootfs/etc/hostname`)) {
      const hostnameFile = fs.readFileSync(`${MNT}/config/rootfs/etc/hostname`).toString().trim().split('_')
      //check for mal-formed hostname file
      if(hostnameFile.length === 3) {
          if(hostnameFile[1] && hostnameFile[2])  
            var host_name = {
              hostname: hostnameFile[1].concat('_').concat('SN').concat(hostnameFile[2])
            }
          else
            missing.hostname = 'FAILURE'
  
          if(hostnameFile[1])
            var modelNumber = {
              model: hostnameFile[1]
            }
          else
          missing.model = 'FAILURE'
  
          if(hostnameFile[2])
            var serialNumber = {
              serial: hostnameFile[2]
            }
          else 
          missing.serial = 'FAILURE'
  
          hostname.push(host_name)
          hostname.push(serialNumber)
          hostname.push(modelNumber)
      } else {
          missing.hostname = 'FAILURE'
          missing.serial = 'FAILURE'
          missing.model = 'FAILURE'
      }
    } else {
      missing.hostname = 'FAILURE'
      missing.serial = 'FAILURE'
      missing.model = 'FAILURE'
      }
      deviceStatusLog.push(hostname)
      deviceStatusLog.push(missing)
      //Firmware version is found in the /versions/buildVersions.py file
      if(fs.existsSync(`${VERSIONS}/buildVersions.py`)) {
          var firmwareVersion = fs.readFileSync(`${VERSIONS}/buildVersions.py`).toString();
          let firmwareFile = [];
          // var firmwareVersion = firmwareVersionFile.split(/\s+/)
          let index = firmwareVersion.indexOf("revisionMajor")
          for(let i=index; i < firmwareVersion.length; i++){
            firmwareFile.push(firmwareVersion[i])
          }
          firmwareVersion = firmwareFile.join('');
          firmwareFile = firmwareVersion.split(/\n+/);
          firmwareVersion = {
            revisionMajor: firmwareFile[0],
            revisionMinor: firmwareFile[1],
            revisionEdit: firmwareFile[2],
            revisionTag: firmwareFile[3]
        }
        deviceStatus.push(firmwareVersion)
      } else {
        missing.firmwareVersion = 'FAILURE'
      }
      deviceStatusLog.push(firmwareVersion)
    
      fs.appendFile(`${LOG}/web0.txt`, JSON.stringify(deviceStatusLog, null, 4), err => {
        if (err) {
          return res.status(404).send(err);
        }
      })
      return res.status(200).send({missing, deviceStatus, hostname, uptime, firmwareVersion})
  })

  module.exports = statusRouter;