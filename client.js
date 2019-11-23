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

            this.arduino.listPort()
                .then((ports) => {
                        socket.emit('listPortName', ports.map(value => value.comName));
            });
            
            socket.on('choixPort', (choixPort) => {
                this.arduino.connect(choixPort)
                    .then((etatPort) => {
                        if(etatPort == false){
                            socket.emit("connectPort", false);
                        }else{
                            if(this.eventArduino == null){
                                this.eventArduino = etatPort;
                                
                                // EventListener quand new dataJson emit to client
                                this.eventArduino.on('dataJson', (valJson) =>{
                                    socket.emit('dataJson', valJson);
                                });

                                this.eventArduino.on('error', (err) => {
                                    socket.emit('error', err);
                                });

                                socket.emit("connectPort", true);
                            }
                        }
                    });
                //setTimeout(()=>console.log(port.isOpen),5000);
            });
        }
    }
}

module.exports = Client;