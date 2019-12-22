let events = require('events');

let loggerArduino = require("./logger").loggerArduino;
let loggerInfo = require("./logger").loggerInfo;

class Arduino{
    constructor(pSerialPort){
        this.serialPort = pSerialPort;
        this.json = "noJson";

        this.enregistreJson = false;
        this.jsonComplet = ""; // Stock l'enregistrement du json envoyer depuis Arduino

        this.modifParametre = [];

        this.port = null;
        this.eventEmitter = new events.EventEmitter();
    }

    setJson(pJson){
       loggerArduino.info({label:"Arduino", message:pJson, modifParametre:this.modifParametre});
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
            this.port = new this.serialPort(choixPort,{baudRate:9600,autoOpen:false,});
            this.port.on('close', () => {
                this.eventEmitter.emit('connectPort', false);
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
                    this.port.on('data', (data) => {
                        process.stdout.write(data); // TODO transform en pipe avec readLine buffer => string
                        
                        if (data == "FIN JSON"){
                            this.enregistreJson = false;
                            try
                            {
                                this.eventEmitter.emit("dataJson", JSON.parse(this.jsonComplet));

                                this.setJson(this.jsonComplet);                                
                            }catch(err)
                            {
                                this.eventEmitter.emit("erreur", err.message);
                            }
                            this.jsonComplet = "";
                        }

                        if (this.enregistreJson){
                            this.jsonComplet += data;
                        }

                        if (data == "DEBUT JSON")
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
        
        this.port.write(label + "\n",);
        this.port.write(dataJson + "\n");
    }
}

module.exports = Arduino;