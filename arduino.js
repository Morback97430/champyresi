let events = require('events');

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
        // TODO sauvegarde dans fichier avant remplacement
        this.json = pJson;
    }

    getJson(){
        return this.json;
    }

    listPort(){
        // TODO utiliser err
        return this.serialPort.list();
    }

    connect(choixPort){
        if(this.port == null){
           this.port = new this.serialPort(choixPort,{baudRate:9600,autoOpen:false});
        }else{
            this.port.close((err) => {
                if(!err){
                 // bien close&
                }else{
                    console.log(err.message);
                }
            });
        }

        return new Promise((resolve, reject) => {
            this.port.open((err) => {
                if(err){
                    console.log(err.message);
                    reject(false);
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
                                this.eventEmitter.emit("error",err.message);
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
}

module.exports = Arduino;