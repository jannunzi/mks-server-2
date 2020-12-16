'use strict';

const PREFIX = process.env.MKS_PREFIX || ''
const LOG = '/var/ftp/log';
const TMP = `${PREFIX}/tmp`;
const MNT = `${PREFIX}/mnt`;

const express = require('express');
const bodyParser = require('body-parser')
const utils = require('../commons/utils')
const extractRouter = express.Router();
const JSZip = require('jszip');
const twoDigits = (number) => ("0" + number).slice(-2);

var fs = require('fs-extra');

extractRouter.use(bodyParser.json());

let UPLOAD_FILES_ZIP = ''

let uploadFileMap = {
    Faults:         { fileBeginsWith: 'fault',        folderPath: `${LOG}/Faults`,        folderZip: 'Faults',            filePath: `${LOG}/fault0.txt`,        fileZip: "Faults.txt"},
    ConfigIDs:      { fileBeginsWith: 'configid',     folderPath: `${TMP}/ConfigIds`,     folderZip: 'ConfigIDs',         filePath: `${TMP}/ConfigIDs.txt`,     fileZip: "ConfigIDs.txt"},
    ConfigChanges:  { fileBeginsWith: 'configchange', folderPath: `${LOG}/ConfigChanges`, folderZip: 'ConfigChanges',     filePath: `${LOG}/ConfigChange0.txt`, fileZip: "ConfigChanges.txt"},
    Combined:       { fileBeginsWith: 'combined',     folderPath: `${LOG}/Combined`,      folderZip: 'Combined',          filePath: `${LOG}/combined0.txt`,     fileZip: "Combined.txt"},
    Notes:          { fileBeginsWith: 'note',         folderPath: `${LOG}/Notes`,         folderZip: 'Notes',             filePath: `${LOG}/notes0.txt`,        fileZip: "Notes.txt"},
    ConfigFiles:    { fileBeginsWith: 'applyfile',    folderPath: `${TMP}/apply`,         folderZip: 'Configs/Apply',     filePath: `${TMP}/apply`,             fileZip: ""},
    SavedConfigs:   { fileBeginsWith: 'savedfile',    folderPath: `${MNT}/config`,        folderZip: 'Configs/MNT',       filePath: `${MNT}/config`,            fileZip: ""},
    Warnings:       { fileBeginsWith: 'warning',      folderPath: `${LOG}/Warnings`,      folderZip: 'Warnings',          filePath: `${LOG}/warning0.txt`,      fileZip: "Warnings.txt"},
    WebsiteLog:     { fileBeginsWith: 'web',          folderPath: `${LOG}/WebsiteLog`,    folderZip: 'WebsiteLog',        filePath: `${LOG}/web0.txt`,          fileZip: "WebsiteLog.txt"},
    Schema:         { fileBeginsWith: 'schemafile',   folderPath: `${TMP}/schema`,        folderZip: 'Schemas',           filePath: `NOT APPLICABLE`,           fileZip: "NOT APPLICABLE"},
    FirmwareInfo:   { fileBeginsWith: 'not used',     folderPath: 'not used',             folderZip: 'FirmwareInfo',      filePath: 'not used',                 fileZip: "not used"},
  }
  
extractRouter.get('/download-upload-files', (req, res) => {
    const sleep = (milliseconds) => {
      return new Promise(resolve => setTimeout(resolve, milliseconds))
    }
    sleep(5000).then(() => {
      res.download(`${LOG}/${UPLOAD_FILES_ZIP}.aes`, (err) => {
        if (err)
            return res.status(404).send(err)
        else {
          fs.unlinkSync(`${LOG}/${UPLOAD_FILES_ZIP}`)
          fs.unlinkSync(`${LOG}/${UPLOAD_FILES_ZIP}.aes`)
        }
      });
    })
})
  
  
extractRouter.put('/upload-files', (req, res) => {
    let deviceUploadFilesLog = ["SERVER: EXTRACT FILES FROM GENERATOR"];
    deviceUploadFilesLog.push(new Date().toISOString())
    const zip = new JSZip();
    const fileKeys = Object.keys(req.body).map((i) => req.body[i])
    let missing = []
    let empty = []
    deviceUploadFilesLog.push('FILES REQUESTED TO EXTRACT FROM GENERATOR')
    deviceUploadFilesLog.push(fileKeys)
    
    // handle most of the file types except ConfigIds, ConfigFiles and WebsiteLog
    const filesInLog = fs.readdirSync(`${LOG}`, { withFileTypes: true })
    
    fileKeys.forEach(fileKey => {
      if(fileKey === 'ConfigIDs' || fileKey === 'ConfigFiles' || fileKey === 'WebsiteLog') {
        return
      }
      const fileBeginsWith = uploadFileMap[fileKey].fileBeginsWith
      const folderZip = uploadFileMap[fileKey].folderZip
      uploadFileMap[fileKey].fileCount = 0
      filesInLog.forEach(fileInLog => {
        const fileInLogLowerCase = `${fileInLog}`.toLowerCase()
        if(fileInLogLowerCase.indexOf(fileBeginsWith) >= 0) {
          uploadFileMap[fileKey].fileCount++
          const content = fs.readFileSync(`${LOG}/${fileInLog}`).toString()
          zip.file(`${folderZip}/${fileInLog}`, content)
          deviceUploadFilesLog.push(fileInLog)
        }
      })
      if(uploadFileMap[fileKey].fileCount === 0) {
        missing.push(fileKey)
      }
    })
  
    
    // handle ConfigIds
    if(fileKeys.indexOf('ConfigIDs') >= 0) {
      deviceUploadFilesLog.push('')
      deviceUploadFilesLog.push('EXTRACT CONFIGIDS FROM TMP/CONFIGIDS')
  
      const folderZip4 = uploadFileMap['ConfigIDs'].folderZip
      if(fs.existsSync(`${TMP}/ConfigIDs.txt`)) {
        const configIDsFile = fs.readFileSync(`${TMP}/ConfigIDs.txt`).toString()
        deviceUploadFilesLog.push(configIDsFile)
        try {
          const json = JSON.parse(configIDsFile)
          let pretty = utils.prettyJson(json)
          zip.file(`${folderZip4}/ConfigIDs.txt`, pretty)
        } catch (e) {
          deviceUploadFilesLog.push('ERROR: ' + e)
          zip.file(`${folderZip4}/ConfigIDs.txt`, configIDsFile)
        }
      } else {
        missing.push('ConfigIDs')
      }
    }
  
    // Handle website logs
    if(fileKeys.indexOf('WebsiteLog') >= 0) {
      
      deviceUploadFilesLog.push('')
      deviceUploadFilesLog.push('EXTRACT WEBSITELOGS FROM VAR/FTP/LOG/')
  
      const folderZip = uploadFileMap['WebsiteLog'].folderZip
      if(fs.existsSync(`${LOG}/web0.txt`)) {
        const filesInLog = fs.readdirSync(`${LOG}`, { withFileTypes: true })
        filesInLog.forEach( file => {
          if(file.indexOf("web") >= 0 ) {
            const content = fs.readFileSync(`${LOG}/${file}`).toString()
            zip.file(`${folderZip}/${file}`, content)
            deviceUploadFilesLog.push(file)
          }
        })  
      }    
    } else {
      missing.push('WebsiteLog')
    }
    
  
  
    // handle ConfigFiles
    if(fileKeys.indexOf('ConfigFiles') >= 0) {
      
      const filesInTmpApply = fs.readdirSync(`${TMP}/apply`, { withFileTypes: true })
      const fileKey = 'ConfigFiles'
      const folderZip = uploadFileMap[fileKey].folderZip
      const folderPath = uploadFileMap[fileKey].folderPath
      if(filesInTmpApply.length === 0) {
        missing.push('ApplyConfigs')
      }
      deviceUploadFilesLog.push('')
      deviceUploadFilesLog.push('EXTRACT CONFIGS FROM TMP/APPLY')
      filesInTmpApply.forEach(file => {
        const content = fs.readFileSync(`${folderPath}/${file}`).toString()
        deviceUploadFilesLog.push(`${file}`)
        try {
          const json = JSON.parse(content)
          let pretty = utils.prettyJson(json)
          zip.file(`${folderZip}/${file}`, pretty)
        } catch (e) {
          deviceUploadFilesLog.push('ERROR: ' + e)
          zip.file(`${folderZip}/${file}`, content)
        }
        
      })
  
      // also download mnt/config
      const filesInMntConfig = fs.readdirSync(`${MNT}/config`, { withFileTypes: true })
      const fileKey2 = 'SavedConfigs'
      const folderZip2 = uploadFileMap[fileKey2].folderZip
      const folderPath2 = uploadFileMap[fileKey2].folderPath
  
      if(filesInMntConfig.length === 0) {
        missing.push('SavedConfigs')
      }
      deviceUploadFilesLog.push('')
      deviceUploadFilesLog.push('EXTRACT CONFIGS FROM MNT/CONFIG')
      filesInMntConfig.forEach(file => {
          const stat = fs.statSync(`${folderPath2}/${file}`)
          if(!stat.isDirectory()) {
            const content = fs.readFileSync(`${folderPath2}/${file}`).toString()
            deviceUploadFilesLog.push(`${file}`)
            try {
              const json = JSON.parse(content)
              let pretty = utils.prettyJson(json)
              zip.file(`${folderZip2}/${file}`, pretty)
            } catch (e) {
              deviceUploadFilesLog.push('ERROR: ' + e)
              zip.file(`${folderZip2}/${file}`, content)
            }
          }
          
      })
  
      // also download tmp/schema
      const filesInTmpSchema = fs.readdirSync(`${TMP}/schema`, { withFileTypes: true })
      const fileKey3 = 'Schema'
      const folderZip3 = uploadFileMap[fileKey3].folderZip
      const folderPath3 = uploadFileMap[fileKey3].folderPath
      if(filesInTmpSchema.length === 0) {
        missing.push('SchemaFiles')
      }
      deviceUploadFilesLog.push('')
      deviceUploadFilesLog.push('EXTRACT SCHEMAS FROM TMP/SCHEMA')
      filesInTmpSchema.forEach(file => {
        const content = fs.readFileSync(`${folderPath3}/${file}`).toString()
        try {
          deviceUploadFilesLog.push(`${file}`)
          const json = JSON.parse(content)
          let pretty = utils.prettyJson(json)
          zip.file(`${folderZip3}/${file}`, pretty)
        } catch (e) {
          deviceUploadFilesLog.push('ERROR: ' + e)
          zip.file(`${folderZip3}/${file}`, content)
        }
        
      })
  
      //extract and include the /version/buildVersions.py file
      deviceUploadFilesLog.push('')
      deviceUploadFilesLog.push('EXTRACT BUILD VERSIONS AND CONFIGIDS')
      const fileKey4 = "FirmwareInfo";
      const folderZip4 = uploadFileMap[fileKey4].folderZip
      const buildVersionFile = fs.readFileSync('/versions/buildVersions.py').toString()
      deviceUploadFilesLog.push(buildVersionFile)
      try {
        const json = JSON.parse(buildVersionFile)
        let pretty = utils.prettyJson(json)
        zip.file(`${folderZip4}/buildVersion.txt`, pretty)
      } catch (e) {
        deviceUploadFilesLog.push('ERROR: ' + e)
        zip.file(`${folderZip4}/buildVersion.txt`, buildVersionFile)
      }
      
    }
  
    zip.generateAsync({type:"nodebuffer"})
        .then( content => {
  
          const now = new Date()
  
          const year = now.getFullYear()
          const month = twoDigits(now.getMonth() + 1)
          const day = twoDigits(now.getDate())
          const hour = twoDigits(now.getHours())
          const minute = twoDigits(now.getMinutes())
          const second = twoDigits(now.getSeconds())
  
          const timeStamp = `${year}${month}${day}_${hour}${minute}${second}`
          //hostname is found in the /etc/hostname
          //check if the file exist and it is formatted correctly before using it
  
          UPLOAD_FILES_ZIP = `${timeStamp}_UploadFiles.zip`
          UPLOAD_FILES_ZIP = UPLOAD_FILES_ZIP.split(' ').join('-')
          if(fs.existsSync(`${MNT}/config/rootfs/etc/hostname`)) {
            const HOSTNAME_FILE = fs.readFileSync(`${MNT}/config/rootfs/etc/hostname`).toString().trim().split('_');
            if (HOSTNAME_FILE.length === 3) {
                UPLOAD_FILES_ZIP = `${HOSTNAME_FILE[1]}_${HOSTNAME_FILE[2]}_${timeStamp}_UploadFiles.zip`
                UPLOAD_FILES_ZIP = UPLOAD_FILES_ZIP.split(' ').join('-')
            }
          }
          fs.writeFileSync(`${LOG}/${UPLOAD_FILES_ZIP}`, content)
          utils.openSslEncrypt(
            `${LOG}/${UPLOAD_FILES_ZIP}`,
            `${LOG}/${UPLOAD_FILES_ZIP}.aes`)
  
        })
        fs.appendFile(`${LOG}/web0.txt`, JSON.stringify(deviceUploadFilesLog, null, 4), err => {
          if (err)
            return res.status(404).send(err)
        })
    res.send({missing, empty})
})


module.exports = extractRouter;