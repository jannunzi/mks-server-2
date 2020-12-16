const fs = require('fs')
const exec = require('child_process').exec
const OPENSSL_ENCRYPTION_CMD = `openssl aes-256-cbc -salt -md md5 -in INPUT_FILE -out OUTPUT_FILE -k n0v1n@`

const execShellCommand = (cmd)  => {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
      }
      resolve(stdout ? stdout : stderr);
    });
  });
}

const rmdir = (path) => {
  if (fs.existsSync(path)) {
    const files = fs.readdirSync(path)
    if (files.length > 0) {
      files.forEach(function(filename) {
        if (fs.statSync(path + "/" + filename).isDirectory()) {
          rmdir(path + "/" + filename )
        } else {
          fs.unlinkSync(path + "/" + filename)
        }
      })
      fs.rmdirSync(path)
    } else {
      fs.rmdirSync(path)
    }
  } else {
    console.log("Directory path not found.")
  }
}

const prettyJson = (json) => JSON.stringify(json, null, 4)

const openSslEncrypt = (inputFile, outputFile) => {
  let CMD = OPENSSL_ENCRYPTION_CMD
      .replace('INPUT_FILE', inputFile)
      .replace('OUTPUT_FILE', outputFile)
  exec(CMD)
}

module.exports = {
  execShellCommand,
  openSslEncrypt,
  prettyJson,
  rmdir
}
