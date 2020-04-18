let io = require('./serveur');
let gestionChampignon = require('./gestionChampignon');
let serialPort = require('serialport');

let client = {
    io:io,
    gestionChampignon:gestionChampignon,
    setupSocket:setupSocket,
    sendEtat:sendEtat,
    emitDataArduino:emitDataArduino
}

gestionChampignon.setupClient(client);

function setupSocket(socket){
    socket.on('choixPort', async (port) => {
        try{
          if(!gestionChampignon.isLaunch()){
            await gestionChampignon.launch(port);
            sendEtat();
          }
        }catch(err){
          console.log(err);
        }
    });

    socket.on('reqListPort', () => {
        serialPort.list()
            .then((ports, err) => {
                if(!err){
                    io.emit('listPortName', ports.map(value => value.comName));
                }else{
                    console.log(err)
                }
        });
    });

    socket.on('saveJour', (nbJour) => {
        gestionChampignon.dataArduino.nbJour = nbJour;
        emitDataArduino();
    });

    socket.on('dureeActivation', (dureeActivation) => {
        gestionChampignon.dataArduino.dureeActivationBrume = dureeActivation;
        emitDataArduino();
    });

    socket.on("newConsigneAir", (consigneAir) => {
        gestionChampignon.dataArduino.consigneAir = consigneAir;
        emitDataArduino();
    });

    socket.on("newConsigneHum", (consigneHum) => {
        gestionChampignon.dataArduino.consigneHum = consigneHum;
        emitDataArduino();
    });

    socket.on("newModifAir", (modifAir) => {
        gestionChampignon.dataArduino.modifConsigneAir = modifAir;
        emitDataArduino();
    });

    socket.on("newModifHum", (modifHum) => {
        gestionChampignon.dataArduino.modifConsigneHum = modifHum;
        emitDataArduino();
    });

    socket.on("newEtalonageAir", (etalAir) => {
        gestionChampignon.dataArduino.etalonageAir = etalAir;
        emitDataArduino();
    });

    socket.on("newEtalonageSec", (etalSec) => {
        gestionChampignon.dataArduino.etalonageSec = etalSec;
        emitDataArduino();
    });

    socket.on("newEtalonageHum", (etalHum) => {
        gestionChampignon.dataArduino.etalonageHum = etalHum;
        emitDataArduino();
    });
}

function sendEtat() {
    if(!gestionChampignon.isLaunch()){
        io.emit("connectPort", false);
    }else{
        io.emit("connectPort", true);
    }
}

function emitDataArduino(){
    io.emit('dataJson', gestionChampignon.dataArduino);
}

module.exports = {...client};