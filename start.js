//Transpile all code following this line with babel and use 'env'
require('babel-register') ({
    presets: [ 'env' ]
})

//Import the rest of the server application
module.exports = require('./server.js')