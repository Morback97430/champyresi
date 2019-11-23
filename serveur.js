const express = require('express');
const app = express();

const server = app.listen(3000,() => {
  console.log('Example app listening on port 3000!');
});

const io = require('socket.io')(server);
const serialPort = require('serialport');

const Arduino = require('./arduino');
let arduino = new Arduino(serialPort);

const Client = require('./client');
let client = new Client(arduino);

io.on('connection', (socket) => {
  client.newConnection(socket);
});

app.use(
  express.static(__dirname + '/public')
);

app.get('/',  (req, res) => {
    res.render('./public/index.html');
});