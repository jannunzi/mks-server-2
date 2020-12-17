'use strict';

const { SCOPE_PRESETS } = require('../config');

const express = require('express');
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const scopeRouter = express.Router();


scopeRouter.use(bodyParser.json());

const scope = (req, res) => {
  const scope = require("./mock/scope")
  res.send(scope)
}
const scopeStreams = (req, res) => {
  res.send(require("./mock/scopeStreams"))
}
const scopeStreamsStream = (req, res) => {
  res.send(require(`./mock/scopeStreams${req.params['stream'].replace(/ /g, "")}`))
}
const scopeCaptures = (req, res) => {
  res.send(require("./mock/scopeCapture"))
}
const scopeCapturesCapture = (req, res) => {
  res.send(require("./mock/scopeCaptureCapture"))
}
const scopeCapturesSchema = (req, res) => {
  res.send(require("./mock/scopeCapturesSchema"))
}
const renders = (req, res) => {
  res.send(require("./mock/renders"))
}
const scopeRendersJobId = (req, res) => {
  res.send(require("./mock/rendersJobId"))
}
const scopeTriggerTriggerParameter = (req, res) => {
  res.send(200)
}

const downloadSbfFile = (req, res) => {
  const sbfPath = req['sbfPath']
  const sbfFile = req['sbfFile']
  res.send(sbfFile)
}

scopeRouter.get("/scope", scope)
scopeRouter.get("/scope/streams", scopeStreams)
scopeRouter.get("/scope/streams/:stream", scopeStreamsStream)

scopeRouter.get("/scope/captures", scopeCaptures)
scopeRouter.get("/scope/captures/:capture", scopeCapturesCapture)
scopeRouter.get("/scope/captures/schema", scopeCapturesSchema)

scopeRouter.get("/scope/renders", renders)
scopeRouter.get("/scope/renders/:jobId", scopeRendersJobId)

scopeRouter.get("/scope/trigger/:triggerParameter", scopeTriggerTriggerParameter)

scopeRouter.get("/scope/sbf/:sbfPath/:sbfFile", downloadSbfFile)


scopeRouter.get("/scope-presets", (req, res) => {
    res.json(SCOPE_PRESETS.presets)
  })
  
scopeRouter.get("/scope-presets/:presetId", (req, res) => {
    res.json(SCOPE_PRESETS.presets.find(preset => preset._id === req.params.presetId))
})

scopeRouter.get("/scope-presets/:presetId/channels", (req, res) => {
    res.json(SCOPE_PRESETS.presets.find(preset => preset._id === req.params.presetId).channels)
})

scopeRouter.get('/scope-streams', (req, res) => {
    fetch('http://10.10.11.34:80/scope', {
        method: 'GET'
        }).then((res) =>  {
            return res.json()
        }).then((data) => {
            return res.status(200).json(data);
        }).catch (err => {
            console.log('error = ', err)
        })

})

scopeRouter.post('/scope-capture', (req, res) => {
    fetch( 'http://10.10.11.34/scope/capture/Capture_0', {
        method: POST,
        body: req.body
        }).then((req) => {
            return res.json()
        }).then((capture) => {
            return res.status(200).json(capture);
        }).cath(err => {
            console.log('error = ', err)
        })
})


module.exports = scopeRouter;
