const {calMoy, delay} = require('../util/utilitaire');

let five = require('johnny-five');
let board = null;

const arduino = {
    listPort : () => {
        return serialPort.list();
    },
    
    connectBoard : (port) => {        
        return new Promise((resolve, reject) => {
            board = new five.Board(
                {   port:port,
                    repl:false}
                );
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
    
    // Capteur Humide
    listPin["A1"] = new five.Pin("A1");

    // Capteur Sec
    listPin["A2"] = new five.Pin("A2");

    // Vanne Fermeture
    listPin[25] = new five.Pin(25);

    // Vanne Switch, combine avec la vanneAirF cela permet d'ouvrir
    listPin[27] = new five.Pin(27);

    // Ventilo Capteur
    listPin[7] = new five.Pin(7);

    // Met en etat fermer apr défault
    arduino.turnHigh([7, 25, 27]);
}

arduino.getTemperature = (pin) =>{
    const NBMESURE = 30; // nb valeur relevé
    const NBVALMINI = 15; // nb valeur requis correcte pour calcul temperature
    const WAITTIME = 500;

    let listValeur = [];

    console.log("Temps estimé relever de temperature => " +  (WAITTIME * NBMESURE / 1000) + " secondes");

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
            await delay(WAITTIME);
        }
        
        // test nb Val
        if(listValeur.length < NBVALMINI){
            reject("Trop de mesure incorrecte : " + listValeur.length + " sur " + NBMESURE);
        }

        // tri tableau
        listValeur.sort((a, b) => a - b);
        
        //purge
        const BORDREDUIT = 5;
        let listValeurPurger = listValeur.slice(BORDREDUIT, listValeur.length - BORDREDUIT);
        const moyTab = calMoy(listValeurPurger);
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
    if(Array.isArray(pins)){
        pins.forEach(pin => {
            listPin[pin].high();
        });
    }else{
        listPin[pins].high();
    }
}

arduino.turnLow = (pins) => {
    if(Array.isArray(pins)){
        pins.forEach(pin => {
            listPin[pin].low();
        });
    }else{
        listPin[pins].low();
    }
}

module.exports = arduino;