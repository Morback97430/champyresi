let socket = null;

$(document).ready(() => {

bindEvent();

socket = io();

socket.on('dataJson', (data) => {
    console.log(data);
    setParamArduino(data);
});

});

function setParamArduino(data){
    $('#etalonageAir').text(data.etalonageAir);
    $('#etalonageSec').text(data.etalonageSec);
    $('#etalonageHum').text(data.etalonageHum);
}

function bindEvent(){
    $('.etalonageAir').click(()=>{
        socket.emit('newEtalonageAir', $('#valEtalonageAir').val());
    });

    $('.etalonageSec').click(()=>{
        socket.emit('newEtalonageSec', $('#valEtalonageSec').val());
    });

    $('.etalonageHum').click(()=>{
        socket.emit('newEtalonageHum', $('#valEtalonageHum').val());
    });
}