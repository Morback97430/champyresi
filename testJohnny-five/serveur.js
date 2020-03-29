const express = require('express');
const app = express();
const router = express.Router();
const path = require('path');
const gestionChampignon = require('./gestionChampignon');

const server = app.listen(3000,() => {
    console.log('Serveur en cour 3000!');
});

let io = require('socket.io')(server);
module.exports = io;

gestionChampignon.launch("COM14");