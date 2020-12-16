'use strict';

//initializations
const express = require('express');
const cors = require('cors');

const { PORT } = require('./config');

const app = express();

//initalize the routers
const statusRouter = require('./routers/status-router');
const configRouter = require('./routers/config-router');
const schemaRouter = require('./routers/schema-router');
const extractRouter = require('./routers/extract-router');
const uploadRouter = require('./routers/config-upload-router');
const scopeRouter = require('./routers/scope-router');
const logRouter = require('./routers/log-router');
const firmwareRouter = require('./routers/firmware-upload-router');
const authRouter = require('./routers/auth-router');


//CORS
app.use(cors())

app.use(function (req,res, next) {
    console.log('request = ', req.url, req.body, req.method);
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, Origin');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    next();
});

app.use('/', statusRouter);
app.use('/', configRouter);
app.use('/', schemaRouter);
app.use('/', extractRouter);
app.use('/', uploadRouter);
app.use('/', scopeRouter);
app.use('/', logRouter);
app.use('/', firmwareRouter);
app.use('/', authRouter);

app.use('*', (req, res) => {
    return res.status(404).json({ message: 'Not Found' });
});

// Referenced by both runServer and closeServer. closeServer
// assumes runServer has run and set `server` to a server object
let server;

function runServer() {
    console.log('run server started');
    return new Promise((resolve, reject) => {
        server = app.listen(PORT, () => {
            console.log(`Your app is listening on port ${PORT}`);
            resolve(server);
        })
            .on('error', err => {
                reject(err);
            });
    });
}

// this function closes the server, and returns a promise. we'll
//  use it in our integration tests later.
function closeServer() {

    return new Promise((resolve, reject) => {
        console.log('Closing server');
        server.close(err => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    })

}

// if server.js is called directly (aka, with `node server.js`), this block
// runs.  but we also export the runServer comand so other code, like test code
// can start the server as needed
if (require.main === module) {
    runServer().catch(err => console.error(
        'Server did not start', err));
} else {
    closeServer().catch(err => console.error(
        'Server did not close', err))
}


module.exports  = {app, runServer, closeServer}


