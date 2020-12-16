'use strict';

const { SCOPE_PRESETS } = require('../config');

const express = require('express');
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const scopeRouter = express.Router();


scopeRouter.use(bodyParser.json());



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