// fileTools.js
const fs = require('fs');
const readline = require('readline');
const Stream = require('stream');

exports.getLastLine = (fileName, minLength) => {
        return new Promise((resolve, reject)=> {
            if(fs.existsSync(fileName)){
                let inStream = fs.createReadStream(fileName);
                let outStream = new Stream;
                let rl = readline.createInterface(inStream, outStream);
    
                let lastLine = '';
    
                rl.on('line', function (line) {
                    if (line.length >= minLength) {
                        lastLine = line;
                    }
                });
    
                rl.on('error', reject)
    
                rl.on('close', function () {
                    resolve(lastLine)
                });
            }else{
                reject("pas de data fichier existant");
            }      
        })
    }