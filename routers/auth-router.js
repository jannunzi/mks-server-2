'use strict';


const express = require('express');
const bodyParser = require('body-parser')

const authRouter = express.Router();

authRouter.use(bodyParser.json());

//defines the base authorization levels, based on passwords
const ROLE = {
    role: "ANONYMOUS",
    privileges: {
    deviceStatus: true,
    dashboard: true,
    uploadDataEncryptedSbf: true,
    uploadDataUnencryptedSbf: false,
    uploadData: true,
    deviceConfigCustomer: false,
    deviceConfigProduct: false,
    firmwareUpload: false,
    scopeData: false
    }
  }
 
let role = ROLE

authRouter.post('/login', (req, res) => {
    
    if(req.body && req.body.password) {
        if (req.body.password.toUpperCase() === "10AD") {
            role.role = "FIRMWARE_UPLOADER"
            role.privileges.firmwareUpload = true
        } else if (req.body.password.toUpperCase() === "DABB1E") {
            role.role = "CUSTOMER_CONFIGURATOR"
            role.privileges.deviceConfigCustomer = true
            role.privileges.scopeData = true
        } else if (req.body.password.toUpperCase() === "HIGHPOWER100!") {
            role.role = "UNENCRYPTED_TBD"
            role.privileges.deviceConfigProduct = true
            role.privileges.uploadDataEncryptedSbf = false
            role.privileges.uploadDataUnencryptedSbf = true
            role.privileges.firmwareUpload = true
        }
    }
    res.json(role)
})

authRouter.post('/currentRole', (req, res) => {
    res.json(role)
})

authRouter.post('/logout', (req, res) => {
    role = {
        role: "ANONYMOUS",
        privileges: {
        deviceStatus: true,
        dashboard: true,
        uploadDataEncryptedSbf: true,
        uploadDataUnencryptedSbf: false,
        uploadData: true,
        deviceConfigCustomer: false,
        deviceConfigProduct: false,
        firmwareUpload: false,
        scopeData: false
        }
    }   
    res.json(role)
})

module.exports = authRouter;