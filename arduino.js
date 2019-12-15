let events = require('events');

let loggerArduino = require("./logger").loggerArduino;

class Arduino{
    constructor(pSerialPort){
        this.serialPort = pSerialPort;
        this.json = "noJson";

        this.enregistreJson = false;
        this.jsonComplet = "";

        this.port = null;
        this.eventEmitter = new events.EventEmitter();
    }

    setJson(pJson){
       loggerArduino.info({label:"Arduino", message:this.jsonComplet});
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
            this.port = new this.serialPort(choixPort,{baudRate:9600,autoOpen:false});
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

                        this.eventEmitter.emit('dataJson', data);
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
        this.writeJson(label, data);
    }

    writeJson(label, data){
        this.port.write(label + "\n");
        console.log(JSON.stringify(data));
        this.port.write(JSON.stringify(data) + "\n");
    }
}

module.exports = Arduino;