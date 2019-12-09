let events = require('events');

const path = require('path');
const logDir = 'log';
const filename = path.join(logDir, 'logArduino.json');

const winston = require('winston');
const { createLogger, format} = {...winston};
const { combine, timestamp, printf} = format;

require('winston-daily-rotate-file');

let transport = new winston.transports.DailyRotateFile(
    {
        filename: path.join('log', 'logArduino-%DATE%.log'),
        datePattern: 'DD-MM-YYYY',
        maxSize:'2g',
        maxFiles:'3',
    }
);

const myFormat = printf(({ level, label, message, timestamp }) => {
    return `${timestamp} ${level} : ${label} => ${message}`;
  });

const logger = createLogger({
    format: combine(
      timestamp(),
      myFormat
    ),
    transports: [
        transport
    ]
});

logger.exitOnError = false;

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
                                logger.info({label:"Arduino", message:this.jsonComplet});                                
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

    envoieJour(nbJour){
        this.writeJson({nbJour:nbJour});
    }

    writeJson(data){
        this.port.write("jour");
        this.port.write(JSON.stringify(data));
    }
}

module.exports = Arduino;