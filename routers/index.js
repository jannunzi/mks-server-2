'use strict';

const { statusRouter } = require('./routers/status-router');
const { configRouter } = require('./routers/config-router');
const { schemaRouter } = require('./routers/schema-router');
const { extractRouter} = require('./routers/extract-router');
const { uploadRouter } = require('./routers/upload-router');
const { firmwareRouter } = require('./routers/firmware-upload-router');
const { scopeRouter } = require('./routers/scope-router');
const { authRouter } = require('./routers/auth-router');
const { logRouter } = require('./routers/log-router');



module.exports = {statusRouter, configRouter, schemaRouter, 
                  extractRouter, uploadRouter, firmwareRouter,
                  scopeRouter, authRouter, logRouter};
