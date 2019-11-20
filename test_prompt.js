const SerialPort = require('serialport');
const port = new SerialPort('COM6',{baudRate:9600});

port.on('open', ()=>{
    port.on('data', (data)=>{
        process.stdout.write(data);
    });
});
port.on('error', (err)=>{
    err && console.error(err);
});

process.stdin.on('data', (data)=>{
    console.log(data);
    port.write(data);
});