let io = require('./serveur');

let loggerErreur = require("./logger").loggerErreur;

io.on('connection', (socket) => {
    Client.newConnection(socket);
});

function connectToArduino(arduino){
    new Client(arduino);
}

class Client{
    static get arduino(){
        return this.hasOwnProperty('_arduino') ? this._arduino : void 0;
    }

    static set arduino(p){
        this._arduino = p;
    }
    
    static get eventArduino(){
        return this.hasOwnProperty('_eventArduino') ? this._eventArduino : void 0;
    }

    static set eventArduino(p){
        this._eventArduino = p;
    }

    constructor(pArduino){
        if(!Client.arduino){
            Client.arduino = pArduino;
        }
    }

    static newConnection(socket){
        if(Client.arduino.isOpen()){
            socket.emit("connectPort", true);
            // TODO emit dataJson dernier Json Uniquement a se utilisateur
            //Client.arduino.emitJson();
        }
        
        socket.on('reqListPort', () => {
            Client.arduino.listPort()
                .then((ports, err) => {
                    if(!err){
                        io.emit('listPortName', ports.map(value => value.comName));
                    }else{
                        loggerErreur("Liste Port", err);
                    }
            });
        });           
        
        socket.on('closePort', () =>{
            Client.arduino.close()
                .then(() => {
                    io.emit("connectPort", false);
                })
                .catch((err) => {
                    loggerErreur("closePort", err);
                });
        })

        socket.on('choixPort', (choixPort) => {
            Client.arduino.connect(choixPort)  
            //setTimeout(()=>console.log(port.isOpen),5000);
        });

        socket.on('saveJour', (nbJour) => {
            Client.arduino.envoieData("J", {nBJ:nbJour});
        });

        socket.on('dureeActivation', (dureeActivation) => {
            Client.arduino.envoieData("dA", {dA:dureeActivation});
        });

        socket.on("newConsigneAir", (consigneAir) => {
            consigneAir.replace(",",".");
            if(consigneAir == parseFloat(consigneAir)){
                Client.arduino.envoieData("mA", {cA:consigneAir});
            }
        });

        socket.on("newConsigneHum", (consigneHum) => {
            consigneHum.replace(",",".");
            if(consigneHum == parseFloat(consigneHum)){
                Client.arduino.envoieData("mH",{cH:consigneHum});
            }
        });

        socket.on("newModifAir", (modifAir) => {
            modifAir.replace(",",".");
            if(modifAir == parseFloat(modifAir)){
                Client.arduino.envoieData("mFA",{cFA:modifAir});
            }
        });
    
        socket.on("newModifHum", (modifHum) => {
            modifHum.replace(",", ".");
            if(modifHum == parseFloat(modifHum)){
                Client.arduino.envoieData("mFH",{cFH:modifHum});
            }
        });

        socket.on("newEtalonageAir", (etalAir) => 
        {
            Client.arduino.envoieData("eAir",{eAir:etalAir});
        });

        
        socket.on("newEtalonageSec", (etalSec) => 
        {
            Client.arduino.envoieData("eSec",{eSec:etalSec});
        });

        
        socket.on("newEtalonageHum", (etalHum) => 
        {
            Client.arduino.envoieData("eHum",{eHum:etalHum});
        });
    }
}

module.exports = connectToArduino;