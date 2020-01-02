let io = require('./serveur');

let events = require('events');
let Readline = require('@serialport/parser-readline');


let loggerArduino = require("./logger").loggerArduino;
let loggerInfo = require("./logger").loggerInfo;
let loggerErreur = require("./logger").loggerErreur;

class Arduino{
    constructor(pSerialPort){
        this.serialPort = pSerialPort;
        this.json = "";

        this.enregistreJson = false;
        this.jsonComplet = ""; // Stock l'enregistrement du json envoyer depuis Arduino

        this.modifParametre = [];

        this.port = null;
        this.parser = null;
        this.eventEmitter = new events.EventEmitter();
    }

    setJson(pJson){
       loggerArduino.info({label:"Arduino", message:pJson, modifParametre:this.modifParametre});

       this.modifParametre = [];
       this.json = pJson;
    }

    getJson(){
        return this.json;
    }

    listPort(){
        return this.serialPort.list();
    }

    connect(choixPort){
        if(this.port == null){
            this.port = new this.serialPort(choixPort,{baudRate:9600, autoOpen:false});
            this.parser = new Readline("\n");

            this.port.pipe(this.parser);
            this.port.on('close', () => {
                io.emit('connectPort', false);
                this.port = null;
            });
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
                    reject(err.message);
                }else{
                    // Plusieur rajout event 'data' ??
                    this.parser.on('data', (data) => {
                        if (data == "FIN JSON\r"){
                            this.enregistreJson = false;
                            try
                            {
                                io.emit("dataJson", JSON.parse(this.jsonComplet));

                                this.setJson(this.jsonComplet);                                
                            }catch(err)
                            {
                                loggerErreur.error({label:"Json Parse onData", message: this.jsonComplet});
                                //this.eventEmitter.emit("erreur", err.message);
                            }
                            this.jsonComplet = "";
                        }

                        if (this.enregistreJson){
                            this.jsonComplet += data;
                        }

                        if (data == "DEBUT JSON\r")
                        {
                            this.enregistreJson = true;
                        }
                    });
                    resolve(this.eventEmitter);
                }
            });
        });
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
        
        this.port.write(label + "\n");
        this.port.write(dataJson + "\n");
    }
}

module.exports = Arduino;