// var five = require("johnny-five");
// var board = new five.Board({
//     port: "COM122"
//   });

// board.on("ready", () =>{
//     new five.Pin("A0").read((error, value) => {
//         console.log(value)
//     });
// })

// let five = require('johnny-five');
// let board = null;

// const arduino = {
//     listPort : () => {
//         return serialPort.list();
//     },

//     connectBoard : (pathPort) => {
//         board = new five.Board({
//             port: pathPort
//         });

//         return new Promise((resolve, reject) => {
//             board.on("ready", () => {
              
//               resolve();
//             })
//         })
//     }
// }

// arduino.connectBoard("COM13").then(() => {
//   new five.Pin("A0").read((error, value) => {
//     console.log(value)
//   });
// })

const {launch} = require('./gestionChampignon');