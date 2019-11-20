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
    const port = new serialPort(choixPort,{baudRate:9600,autoOpen:false});
    port.open(function(err)
    {
      if(err){
        console.log(err.message);
      }else{
        port.on('data', (data)=>{
          process.stdout.write(data);
        });
      }
    });
    //setTimeout(()=>console.log(port.isOpen),5000);
  });
});
const Arduino = require('./arduino');

let arduino = new Arduino();
arduino.setJson("testJson"); // deplacer dans on data de serial port

let socketPort = false;
app.use(
  express.static(__dirname + '/public')
);

app.get('/',  (req, res) => {
    res.render('./public/index.html');
});