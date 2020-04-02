const {hToMs, delay, calMoy} = require('../util/utilitaire');

const arduino = require('./arduino');

// object envoyer au client
let dataArduino = {
    temperatureAir:0,
    consigneAir:0,
    modifConsigneAir:0,
    tauxHumidite:0,
    consigneHum:0,
    modifConsigneHum:0,
    dureeAction:0,
    coeff:0,
    etatVanneFroid:0,
    moySec:0,
    moyHum:0,
    tempsDeshum:0,
    tempsOuvertureBrume:0,
    tempsFermetureBrume:0,
    dureeActivationBrume:0,
    etalonageAir:0,
    etalonageHum:0,
    etalonageSec:0,
    nbJour:0,
    suiviProcess:"",
    suiviSousProcess:""
};

// Variable Champignon
dataArduino.consigneAir = 17;
dataArduino.modifConsigneAir = 0.12;

dataArduino.consigneHum = 86;
dataArduino.modifConsigneHum = 0.12;

dataArduino.nbJour = 10;

let etapeEnCour = "Lancement de l'application";
dataArduino.suiviProcess = "Lancement de l'application";
let detailEtape = "Veuillez patienter";
dataArduino.suiviSousProcess = "Veuillez patienter";

const launch = async (port) => {
    // initialisation carte arduino
    await arduino.connectBoard(port);
    
    launchCron();

    await launchApp();
}

let continueGestion = true;
const launchApp = async () => {
    await gestionTemperature();

    if(dataArduino.nbJour > 5){
        await gestionHumidite();
    }

    // attente entre le procédé
    await delay(5, "minute");

    console.log(dataArduino);

    if(continueGestion){
        launchApp(); // refaire le traitement
    }
}

module.exports = {launch};

function launchCron(){
    setInterval(() => {
        dataArduino.consigneAir -= dataArduino.modifConsigneAir;

        dataArduino.consigneHum -= dataArduino.modifConsigneHum;
    }, hToMs(12));

    setInterval(() => {
        dataArduino.nbJour++;
    }, hToMs(24));

    console.log("Cron lancer");
}

// GESTION TEMPERATURE ---------------------------------------
function gestionTemperature(){
    return new Promise(async (resolve, reject) => {
        setEtape("Gestion Temperature", "Mesure temperature Air");

        let temperatureAir = await arduino.getTemperature("A0")
            .catch((err) => {
                console.log("Problème valeur temperature Air (A0)");
                console.log(err);
                reject("Temperature incorrecte");
            });
        console.log("Temperature Air mesurée : " + temperatureAir);
        dataArduino.temperatureAir = temperatureAir + dataArduino.etalonageAir;
    
        setEtape("Gestion Temperature", "Regulation de l'air en cours");
        await regulateurAir(temperatureAir, dataArduino.consigneAir);

        resolve();
    });
}

function regulateurAir(temp, consigne){
    return new Promise(async (resolve, reject) => {
        let deltaTemp = temp - consigne;
        dataArduino.coeff = deltaTemp;
        
        let dureeAction = dureeRegulationAir(deltaTemp); // en secondes
        dataArduino.dureeAction = dureeAction;
    
        if(dureeAction != 0){
            if(deltaTemp > 0){
                setEtape("Gestion Temperature", "Temperature Air trop haute");
                await ouvrirVanneAir(dureeAction);
                dataArduino.etatVanneFroid += dureeAction;
            }else{
                setEtape("Gestion Temperature", "Temperature Air trop basse");
                await fermerVanneAir(dureeAction);
                dataArduino.etatVanneFroid -= dureeAction;
            }

            if(dataArduino.etatVanneFroid < 0) dataArduino.etatVanneFroid = 0;
            else if(dataArduino.etatVanneFroid > 30) dataArduino.etatVanneFroid = 30;
        }else{
            setEtape("Gestion Temperature", "Temperature Air OK");
        }

        resolve();
    });
}

function dureeRegulationAir(deltaTemp){
    let dureeAction = 0;

    if(deltaTemp > 1.5){
        dureeAction = 40;
    }else if(deltaTemp > 1){
        dureeAction = 15;
    }else if(deltaTemp > 0.5){
        dureeAction = 5;
    }else if(deltaTemp > 0.3){
        dureeAction = 2;
    }

    if(deltaTemp < -1.5){
        dureeAction = 40;
    }else if(deltaTemp < -1){
        dureeAction = 15;
    }else if(deltaTemp < -0.5){
        dureeAction = 5;
    }else if(deltaTemp < -0.3){
        dureeAction = 2;
    }

    return dureeAction;
}

function ouvrirVanneAir(duree){
    setEtape("Gestion Temperature", "Ouverture Vanne en cours");

    let vanneToUse = [25, 27];
    return useVanne(duree, vanneToUse);
}

function fermerVanneAir(duree){
    setEtape("Gestion Temperature", "Fermeture Vanne en cours");

    let vanneToUse = [25];
    return useVanne(duree, vanneToUse);
}

function useVanne(duree, listVanne){
    return new Promise(async (resolve, reject) => {
        arduino.turnLow(listVanne);
        await delay(duree * 1000);
        arduino.turnHigh(listVanne);

        resolve();
    });
}


// GESTION HUMIDITE
function gestionHumidite(){
    return new Promise(async (resolve, reject) => {
        setEtape("Gestion Humidite", "Mesure temperature Sec/Humide");

        arduino.turnLow(7);
        let tempSecAndHum = await mesureSecAndHum();
        arduino.turnHigh(7);
        
        setEtape("Gestion Humidite", "Calcul Taux Humidite");
        let tauxHumidite = calculHumidite(tempSecAndHum);
        console.log("Taux Humidite : " + tauxHumidite +  "%");
        dataArduino.tauxHumidite = tauxHumidite;

        setEtape("Gestion Humidite", "Regulation de l'humidite en cours");
        await regulateurHumidite(tauxHumidite);

        resolve();
    });
}

function regulateurHumidite(tauxHumidite){
    return new Promise(async (resolve, reject) => {
        let deltaHum = dataArduino.consigneHum - tauxHumidite;

        if(deltaHum > 0){
            let tempsFermetureBrume = 0;

            if(deltaHum > 3){
                tempsFermetureBrume = 30;
            }else if(deltaHum > 2){
                tempsFermetureBrume = 45;
            }else if(deltaHum > 1){
                tempsFermetureBrume = 60;
            }else if(deltaHum > 0.3){
                tempsFermetureBrume = 105;
            }

            setEtape("Gestion Humidite", "Lancement Brume : " + tempsFermetureBrume + " secondes");
            await periodeBrume(tempsFermetureBrume);
        }else{
            let timerDesHum = 0;
            if(deltaHum < -3){
                timerDesHum = 30;
            }else if(deltaHum < -2){
                timerDesHum = 45;
            }else if(deltaHum < -1){
                timerDesHum = 60;
            }else if(deltaHum < -0.3){
                timerDesHum = 105;
            }

            setEtape("Gestion Humidite", "Lancement Deshum: " + timerDesHum + " secondes");
            dataArduino.tempsDeshum = timerDesHum;

            arduino.turnLow(6);
            await delay(timerDesHum, "seconde");
            arduino.turnHigh(6);
        }
        
        resolve();
    });
}

function periodeBrume(tempsFermetureBrume){
    return new Promise(async (resolve,reject) => {
        let continueMesure = true;
        delay(10, "minute").then(() => {
            continueMesure = false;
        });

        while(continueMesure){
            arduino.turnLow(31);
            await delay(15, "seconde");
            dataArduino.tempsOuvertureBrume = 15;

            arduino.turnHigh(31);
            await delay(tempsFermetureBrume, "seconde");
            dataArduino.tempsFermetureBrume = tempsFermetureBrume;
        }
    });
}

function calculHumidite(tempSecAndHum){
    let tempSec = tempSecAndHum.sec;
    let tempHum = tempSecAndHum.hum;

    let pressSaturanteSec = calculPression(tempSecAndHum.sec);
    let pressSaturanteHum = calculPression(tempSecAndHum.hum);

    let pw = pressSaturanteHum - 1013 * 0.000662 * (tempSec - tempHum);

    return pw/pressSaturanteSec * 100;
}

function calculPression(temp){
    let pression = 0;

    let tabPressionSaturante = [12.28,12.364,12.448,12.532,12.616,12.7,12.784,12.868,12.952,13.036,13.12,13.21,13.3,13.39,13.48,13.57,13.66,13.75,13.84,13.93,14.02,14.115,14.21,14.305,14.4,14.495,14.59,14.685,14.78,14.875,14.97,15.071,15.172,15.273,15.374,15.475,15.576,15.677,15.778,15.879,
        15.98,16.087,16.194,16.301,16.408,16.515,16.622,16.729,16.836,16.943,17.05,17.163,17.276,17.389,17.502,17.615,17.728,17.841,17.954,18.067,18.18,18.299,18.418,18.537,18.656,18.775,18.894,19.013,19.132,19.251,19.37,19.496,19.622,19.748,19.874,20,20.126,20.252,20.378,20.504,20.63,20.764,20.898,
        21.032,21.166,21.3,21.434,21.568,21.702,21.836,21.97,22.111,22.252,22.393,22.534,22.675,22.816,22.957,23.098,23.239,23.38,23.529,23.678,23.827,23.976,24.125,24.274,24.423,24.572,24.721,24.87,25.026,25.182,25.338,25.494,25.65,25.806,25.962,26.118,26.274,26.43,26.596,26.762,26.928,27.094,
        27.26,27.426,27.592,27.758,27.924,28.09,28.264,28.438,28.612,28.786,28.96,29.134,29.308,29.482,29.656,29.83,30.014,30.198,30.382,30.566,30.75,30.934,31.118,31.302,31.486,31.67,31.863,32.056,32.249,32.442,32.635,32.828,33.021,33.214,33.407,33.6,33.804,34.008,34.212,34.416,34.62,34.824,35.028,
        35.232,35.436,35.64,35.856,36.072,36.288,36.504,36.72,36.936,37.152,37.368,37.584,37.8,38.025,38.25,38.475,38.7,38.925,39.15,39.375,39.6,39.825,40.05,40.288,40.526,40.764,41.002,41.24,41.478,41.716,41.954,42.192,42.43,42.679,42.928,43.177,43.426,43.675,43.924,44.173,44.422,44.671,44.92,
        45.183,45.446,45.709,45.972,46.235,46.498,46.761,47.024,47.287,47.55,47.825,48.1,48.375,48.65,48.925,49.2,49.475,49.75,50.025,50.3,50.589,50.878,51.167,51.456,51.745,52.034,52.323,52.612,52.901,53.19,53.494,53.798,54.102,54.406,54.71,55.014,55.318,55.622,55.926,56.23];

    let tempIterateur = 10;
    let finTempIterateur = 35;
    let iterateur = 0;

    while(tempIterateur <= finTempIterateur && pression == 0){
        if(temp > tempIterateur - 0.05 && temp <= tempIterateur + 0.05){
            pression = tabPressionSaturante[iterateur];
        }else{
            iterateur++;
            tempIterateur += 0.1;
        }
    }
    
    return pression;
}

//return Promise {{sec:tempSec, hum:tempHum}}
function mesureSecAndHum(){
    return new Promise(async (resolve, reject) => {
        let continueMesure = true;
        let useCapteurHum = false;
        
        delay(3, "minute").then(() => {
            continueMesure = false;
        });
        delay(90, "seconde").then(() => {
            useCapteurHum = true;
        });

        let totalSec = []; // temp Sec = moyenne totalSec
        let tempSec = 0;

        let totalHum = [];
        let tempHum = 100; // temp hum = valeur la plus basse

        while(continueMesure){
            if(!useCapteurHum){
                let tempSecTmp = await arduino.getTemperature("A2");

                totalSec.push(tempSecTmp);
            }else{
                let tabTemp = await Promise.all([arduino.getTemperature("A2"), arduino.getTemperature("A1")]);
                
                totalSec.push(tabTemp[0]);
                totalHum.push(tabTemp[1]);
            }
        }

        tempSec = calMoy(totalSec);
        dataArduino.moySec = tempSec + dataArduino.etalonageSec;
        
        tempHum = calMoy(totalHum);
        dataArduino.moyHum = tempHum + dataArduino.etalonageHum;

        console.log(tempSec);
        console.log(tempHum);
        
        resolve({sec:tempSec, hum:tempHum});
    });
}
// FRIGO

function setEtape(etape, detail){
    dataArduino.suiviProcess = etape;
    dataArduino.suiviSousProcess = detail;

    console.log("-----------------Changement Etape/Sous Details-------------------");
    console.log(dataArduino.suiviProcess);
    console.log(dataArduino.suiviSousProcess);
}