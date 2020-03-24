const {calMoy, delay} = require('./util/utilitaire');

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

let five = require('johnny-five');
let board = new five.Board(
    { repl:false}
    );

const arduino = {
    listPort : () => {
        return serialPort.list();
    },
    
    connectBoard : () => {        
        return new Promise((resolve, reject) => {
            board.on("ready", () => {
                initPin();
                resolve();
            })
        })
    },

    program: require('./gestionChampignon'),
    
    launchProgramme(){
        program.lauch();
    }
}

let listPin = [];

function initPin(){
    // Capteur Air
    listPin["A0"] = new five.Pin("A0");
    
    // Capteur Sec
    listPin["A1"] = new five.Pin("A1");

    // Capteur Humide
    listPin["A2"] = new five.Pin("A2");

    // Vanne Fermeture
    listPin['25'] = new five.Pin(25);

    // Vanne Switch, combine avec la vanneAirF cela permet d'ouvrir
    listPin['27'] = new five.Pin(27);
}

arduino.getTemperature = (pin) =>{
    const NBMESURE = 30; // nb valeur relevé
    const NBVALMINI = 15; // nb valeur requis correcte pour calcul temperature

    let listValeur = [];

    return new Promise(async (resolve, reject) => {
        for(let nbMesure = 0; nbMesure < NBMESURE; nbMesure++){
            let valAnalog = 0;
            
            try{
                valAnalog = await getValAnalogique(pin);
            }catch(err){
                console.log(err);
                continue;
            }
            
            if(valAnalog >= 205 && valAnalog <= 1023){
                listValeur.push(valAnalog);
            }

            // attente entre chaque mesure
            await delay(500);
        }
        
        // test nb Val
        if(listValeur.length < NBVALMINI){
            reject("Trop de mesure incorrecte : " + listValeur.length + " sur " + NBMESURE);
        }

        //purge
        const BORDREDUIT = 5;
        let listValeurPurger = listValeur.slice(BORDREDUIT, listValeur.length - BORDREDUIT);
        const moyTab = calMoy(listValeurPurger);console.log(listValeurPurger);
        const moyTemp = five.Fn.map(moyTab, 205, 1023, 100, 400) / 10;

        if(moyTemp > 10 && moyTemp < 40){
            resolve(moyTemp);
        }else{
            reject("Valeur Temperature incorrecte : " + moyTemp);
        }
    });
    
}

// Recupere une valeur analogique a partir d'un pin
async function getValAnalogique(pin){
    let statePin = await new Promise((resolve, reject) => {
        try{
            listPin[pin].query((state) => {    
                resolve(state);
            });
        }catch(err){
            console.error("Valeur Analogique Pin " + pin);
            reject(err);
        }
    });

    return statePin.value;
}

arduino.turnHigh = (pins) => {
    pins.forEach(pin => {
        listPin[pin].high();
    });
}

arduino.turnLow = (pins) => {
    pins.forEach(pin => {
        listPin[pin].low();
    });
}

module.exports = arduino;