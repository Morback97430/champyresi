const express = require('express');
const app = express();

const server = app.listen(3000,() => {
  console.log('Example app listening on port 3000!');
});

const io = require('socket.io')(server);
const serialPort = require('serialport');

io.on('connection', (socket) => {
  socket.on('reqListPort', (data) => {
    let listPortName = [];
    serialPort.list((err, ports) => {
      listPortName = ports.map(value => value.comName);
      socket.emit('listPortName', listPortName);
    });
  });
 
  socket.on('choixPort', (choixPort) => {
    console.log(choixPort);

    let jsonDataTest = '{"temperatureAir": 0, "consigneAir": 20.52, "tauxHumidite": 0, "consigneHum": 95, "modifConsigneAir": 0.12, "modifConsigneHum": 0.12, "dureeAction": 0, "coeff": 0, "etatVanneFroid": 10, "moySec": 0, "moyHum": 0, "nbJour": 1, "Millis": 0}';
    socket.emit('dataJson', JSON.parse(jsonDataTest));
  });

  // socket.on('choixPort', (choixPort) => {
  //   console.log(choixPort);
  //   const port = new serialPort(choixPort,{baudRate:9600});
  //   port.open(function (err) {
  //     if (err) {
  //       return console.log('Error opening port: ', err.message)
  //     }
  //   });
  // });
})

const Arduino = require('./arduino');

let arduino = new Arduino();
arduino.setJson("testJson"); // deplacer dans on data de serial port

app.use(
  express.static(__dirname + '/public')
);

app.get('/',  (req, res) => {
    res.render('./public/index.html');
});