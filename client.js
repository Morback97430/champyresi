let io = require('./serveur');

let loggerErreur = require("./logger").loggerErreur;

class Client{
    constructor(pArduino){
        this.arduino = pArduino;
        this.eventArduino = null;
    }

    newConnection(socket){
        if(this.arduino.isOpen()){
            io.emit("connectPort", true);
            // TODO emit dataJson dernier Json
            this.arduino.emitJson();
        }
        
        socket.on('reqListPort', () => {
            this.arduino.listPort()
                .then((ports, err) => {
                    if(!err){
                        io.emit('listPortName', ports.map(value => value.comName));
                    }else{
                        loggerErreur("Liste Port", err);
                    }
            });
        });           
        
        socket.on('choixPort', (choixPort) => {
            this.arduino.connect(choixPort)
                .then((etatPort) => {
                    if(this.eventArduino == null){
                        this.eventArduino = etatPort;
                    
                        this.eventArduino.on('connectPort', (etatPort) => {
                            io.emit('connectPort', false);
                            io.emit('erreur', "Port fermer, choissisez un port");
                        });

                        // EventListener quand new dataJson emit to client
                        this.eventArduino.on('dataJson', (valJson) =>{
                            io.emit('dataJson', valJson);
                        });

                        this.eventArduino.on('erreur', (err) => {
                            loggerErreur.error({label:"Port on erreur", message:err});
                            io.emit('erreur', err);
                        });

                        this.arduino.emitJson();

                        io.emit("connectPort", true);
                    }

                })
                .catch((err) => {
                    io.emit("connectPort", false);
                    loggerErreur("Port", err.message);
                    io.emit('erreur', err);
                });
            //setTimeout(()=>console.log(port.isOpen),5000);
        });

        socket.on('saveJour', (nbJour) => {
            this.arduino.envoieData("J", {nBJ:nbJour});
        });

        socket.on('dureeActivation', (dureeActivation) => {
            this.arduino.envoieData("dA", {dA:dureeActivation});
        });

        socket.on("newConsigneAir", (consigneAir) => {
            consigneAir.replace(",",".");
            if(consigneAir == parseFloat(consigneAir)){
                this.arduino.envoieData("mA", {cA:consigneAir});
            }
        });

        socket.on("newConsigneHum", (consigneHum) => {
            consigneHum.replace(",",".");
            if(consigneHum == parseFloat(consigneHum)){
                this.arduino.envoieData("mH",{cH:consigneHum});
            }
        });

        socket.on("newModifAir", (modifAir) => {
            modifAir.replace(",",".");
            if(modifAir == parseFloat(modifAir)){
                this.arduino.envoieData("mFA",{cFA:modifAir});
            }
        });
    
        socket.on("newModifHum", (modifHum) => {
            modifHum.replace(",", ".");
            if(modifHum == parseFloat(modifHum)){
                this.arduino.envoieData("mFH",{cFH:modifHum});
            }
        });

        socket.on("newEtalonageAir", (etalAir) => 
        {
            this.arduino.envoieData("eAir",{eAir:etalAir});
        });

        
        socket.on("newEtalonageSec", (etalSec) => 
        {
            this.arduino.envoieData("eSec",{eSec:etalSec});
        });

        
        socket.on("newEtalonageHum", (etalHum) => 
        {
            this.arduino.envoieData("eHum",{eHum:etalHum});
        });
    }
}

module.exports = Client;