const {hToMs, delay} = require('../util/utilitaire');

const arduino = require('./arduino');

// Variable Champignon
let consigneAir = 17;
let modifConsigneAir = 0.12;

let consigneHum = 86;
let modifConsigneHum = 0.12;

let nbJour = 1;

let etapeEnCour = "Lancement de l'application";
let detailEtape = "Veuillez patienter";

const launch = async () => {
    // initialisation carte arduino
    await arduino.connectBoard();
    
    launchCron();

    await launchApp();

    console.log("Fin launch");
}

const launchApp = async () => {
    await gestionTemperature();

    // attente entre le procédé
    await delay(5, "minute"); 
}

module.exports = {launch};

function launchCron(){
    setInterval(() => {
        consigneAir -= modifConsigneAir;
        consigneHum -= modifConsigneHum;
    }, hToMs(12));

    setInterval(() => {
        nbJour++;
    }, hToMs(24));

    console.log("Cron lancer");
}

function gestionTemperature(){
    return new Promise(async (resolve, reject) => {
        setEtape("Gestion Temperature", "Mesure temperature Air");

        let temperatureAir = await arduino.getTemperature("A0")
            .catch((err) => {
                console.log("Problème valeur temperature Air (A0)");
                console.log(err);
            });
        console.log("Temperature Air mesurée : " + temperatureAir);
    
        setEtape("Gestion Temperature", "Regulation de l'air en cours");
        await regulateurAir(temperatureAir, consigneAir);

        resolve();
    });
}

function regulateurAir(temp, consigne){
    return new Promise(async (resolve, reject) => {
        let deltaTemp = temp - consigne;
        
        let dureeAction = dureeRegulationAir(deltaTemp); // en secondes
    
        if(dureeAction != 0){
            if(deltaTemp > 0){
                setEtape("Gestion Temperature", "Temperature Air trop haute");
                await ouvrirVanneAir(dureeAction);
            }else{
                setEtape("Gestion Temperature", "Temperature Air trop basse");
                await fermerVanneAir(dureeAction);
            }
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
        arduino.turnHigh(listVanne);
        await delay(duree * 1000);
        arduino.turnLow(listVanne);

        resolve();
    });
}

function setEtape(etape, detail){
    etapeEnCour = etape;
    detailEtape = detail;

    console.log("-----------------Changement Etape/Sous Details-------------------");
    console.log(etapeEnCour);
    console.log(detailEtape);
}