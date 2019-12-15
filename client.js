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
                this.arduino.envoieData("jour", {nbJour:nbJour});
            });

            socket.on('dureeActivation', (dureeActivation) => {
                this.arduino.envoieData("dureeActivation", {dureeActivation:dureeActivation});
            });

            socket.on("newConsigne",(envoie) =>
            {
                if (envoie.consigneAir != parseInt(envoie.consigneAir))
                {
                    envoie.consigneAir = null;
                }
                if (envoie.consigneHum != parseInt(envoie.consigneHum))
                {
                    envoie.consigneHum = null;
                }
                if (envoie.modifConsigneAir != parseInt(envoie.modifConsigneAir))
                {
                    envoie.modifConsigneAir = null;
                }
                if (envoie.modifConsigneHum != parseInt(envoie.modifConsigneHum))
                {
                    envoie.modifConsigneHum = null;
                }
                
                console.log(envoie);
            });
        }
    }
}

module.exports = Client;