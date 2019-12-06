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
                    .then((ports) => {
                        socket.emit('listPortName', ports.map(value => value.comName));
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
                                socket.emit('erreur', err);
                            });

                            socket.emit("connectPort", true);
                        }
                    })
                    .catch((err) => {
                        socket.emit("connectPort", false);
                        socket.emit('erreur', err);
                    });
                //setTimeout(()=>console.log(port.isOpen),5000);
            });

            socket.on('saveJour', (nbJour) => {
                this.arduino.envoieJour(nbJour);
            });
        }
    }
}

module.exports = Client;