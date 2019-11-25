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
                            });

                            // EventListener quand new dataJson emit to client
                            this.eventArduino.on('dataJson', (valJson) =>{
                                socket.emit('dataJson', valJson);
                            });

                            this.eventArduino.on('error', (err) => {
                                socket.emit('error', err);
                            });

                            socket.emit("connectPort", true);
                        }
                    })
                    .catch((etatport) => {
                        socket.emit("connectPort", etatport);
                    });
                //setTimeout(()=>console.log(port.isOpen),5000);
            });
        }
    }
}

module.exports = Client;