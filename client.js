let loggerErreur = require("./logger").loggerErreur;

class Client{
    constructor(pArduino){
        this.arduino = pArduino;
        this.eventArduino = null;
    }

    newConnection(socket){
        if(this.arduino.isOpen()){
            socket.emit("connectPort", true);
            // TODO emit dataJson dernier Json
        }else{
            socket.on('reqListPort', () => {
                this.arduino.listPort()
                    .then((ports, err) => {
                        if(!err){
                            socket.emit('listPortName', ports.map(value => value.comName));
                        }else{
                            loggerErreur.error({label:"Liste Port", message:err});
                        }
                });
            });           
            
            socket.on('choixPort', (choixPort) => {
                this.arduino.connect(choixPort)
                    .then((etatPort) => {
                        if(this.eventArduino == null){
                            this.eventArduino = etatPort;
                        
                            this.eventArduino.on('connectPort', (etatPort) => {
                                socket.emit('connectPort', false);
                                socket.emit('erreur', "Port fermer, choissisez un port");
                            });

                            // EventListener quand new dataJson emit to client
                            this.eventArduino.on('dataJson', (valJson) =>{
                                socket.emit('dataJson', valJson);
                            });

                            this.eventArduino.on('erreur', (err) => {
                                loggerErreur.error({label:"Port on erreur", message:err});
                                socket.emit('erreur', err);
                            });

                            socket.emit("connectPort", true);
                        }
                    })
                    .catch((err) => {
                        socket.emit("connectPort", false);
                        loggerErreur.error({label:"Port ", message:err});
                        socket.emit('erreur', err);
                    });
                //setTimeout(()=>console.log(port.isOpen),5000);
            });

            socket.on('saveJour', (nbJour) => {
                this.arduino.envoieData("J", {nBJ:nbJour});
            });

            socket.on('dureeActivation', (dureeActivation) => {
                this.arduino.envoieData("dA", {dA:dureeActivation});
            });

            socket.on("newConsigne",(envoie) =>
            {
                envoie.consigneAir.replace(",",".");
                envoie.consigneHum.replace(",",".");
                envoie.modifConsigneAir.replace(",",".");
                envoie.modifConsigneHum.replace(",",".");
                
                if (envoie.consigneAir == parseFloat(envoie.consigneAir))
                {
                    this.arduino.envoieData("mA",{cA:envoie.consigneAir});
                }
                if (envoie.consigneHum == parseFloat(envoie.consigneHum))
                {
                    this.arduino.envoieData("mH",{cH:envoie.consigneHum});
                }
                if (envoie.modifConsigneAir == parseFloat(envoie.modifConsigneAir))
                {
                    this.arduino.envoieData("mFA",{cFA:envoie.modifConsigneAir});
                }
                if (envoie.modifConsigneHum == parseFloat(envoie.modifConsigneHum))
                {
                    this.arduino.envoieData("mFH",{cFH:envoie.modifConsigneHum});
                }
            });

            socket.on("newConsigneAir", (consigneAir) => {
                consigneAir.replace(",",".");
                if(consigneAir == parseFloat(consigneAir)){
                    this.arduino.envoieData("ma", {cA:consigneAir});
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
        }
    }
}

module.exports = Client;