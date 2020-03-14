let io = require('./serveur');

let serialPort = require('serialport');

let events = require('events');
let Readline = require('@serialport/parser-readline');

let loggerArduino = require("./logger").loggerArduino;
let loggerInfo = require("./logger").loggerInfo;
let loggerErreur = require("./logger").loggerErreur;

class Arduino{
    constructor(){
        this.json = "";

        this.modifParametre = [];

        this.port = null;
        this.parser = null;
    }

    setJson(pJson){
       loggerArduino.info({label:"Arduino", message:pJson, modifParametre:this.modifParametre});

       this.modifParametre = [];
       this.json = pJson;

       this.emitJson();
    }

    getJson(){
        return this.json;
    }

    emitJson(){
        if(this.json){
            try
            {
                io.emit('dataJson', JSON.parse(this.json));
            }catch(err){
                loggerErreur("Json Parse onData", this.json);
                //this.eventEmitter.emit("erreur", err.message);
            }
        }
    }

    listPort(){
        return serialPort.list();
    }

    connect(choixPort){
        this.initSerialPort(choixPort)
        .then(() => {
            this.emitJson();
            io.emit("connectPort", true);
        })
        .catch((err) => {console.log(err)
            io.emit("connectPort", false);
            loggerErreur("Port", err.message);
            io.emit('erreur', err);
        });
        
    }


    initSerialPort(choixPort){
        if(this.port == null){
            this.port = new serialPort(choixPort,{baudRate:1000000, autoOpen:false});
            this.parser = new Readline("\n");
            this.parser.on('data', (data) => {
                try{
                    JSON.parse(data);
                }
                catch(err){
                    console.log(data);
                }
                this.setJson(data);                                
            });
            this.port.pipe(this.parser);
            this.port.on('close', () => {
                io.emit('connectPort', false);
                this.port = null;
            });

            //io.emit('connectPort', false);
        }else if(!this.isOpen()){
            this.port = null;
        }

        return new Promise((resolve, reject) => {
            if(this.port == null){
                reject("Port non Valide, choissisez un port");
            }
            
            this.port.open((err) => {
                if(err){
                    this.port = null;
                    reject("Connection echec port(" + choixPort + ")");
                }else{
                    // Plusieur rajout event 'data' ??
                    resolve();
                }
            });
        });
    }

    close(){
        return new Promise((resolve, reject) => {
            this.port.close((err) => {
            if(err){
                console.log("Erreur fermeture port");
                reject(err);
            }else{
                console.log("Port is close");
            }
            
            this.port = null;
            resolve();
        })});
    }

    isOpen(){
        return this.port != null ? this.port.isOpen : false;
    }

    envoieData(label, data){
        let dataJson = JSON.stringify(data);
        loggerInfo.info({
            label:"Changement Consigne",
            message:label + " " + dataJson
        });
        this.modifParametre.push([label, dataJson]);
        
        try{
            this.port.write(label + "\n");
            this.port.write(dataJson + "\n");
        }catch(e){
            // Erreur quand fermeture du port
        }
    }

    parseData(dataBrut){
        if(!this.json){
            this.json = dataBrut.split("#")[1].split(" / Valeur Manuelle modifier")[0];
        }

        this.emitJson();
    }
}

module.exports = Arduino;