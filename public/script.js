let socket = null;

$(document).ready(() => {

bindEvent();

socket = io();

socket.on('dataJson', (data) => {
    console.log(data);
});

socket.on('listPortName', (listPortName) => {
    listPortName.forEach(port => {
        $('#listPort').append(new Option(port, port));
    });
});

socket.emit('reqListPort', true);

});

function bindEvent(){
    $('#choixPort').click(() => {
        socket.emit('choixPort', $('#listPort').val());
    });
}