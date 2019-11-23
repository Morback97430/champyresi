let socket = null;

$(document).ready(() => {

bindEvent();

socket = io();

socket.on('dataJson', (data) => {
    console.log(data);
    setAppChampi(data);
});

socket.on('listPortName', (listPortName) => {
    listPortName.forEach(port => {
        $('#listPort').append(new Option(port, port));
    });
});



socket.on('connectPort', (isOpen) => {
    if(isOpen){
        accesApp();
    }else{
        // TODO template retry port connection
        socket.emit('reqListPort', true);
    }
});

});


function accesApp(){
    $('.appChampi').removeClass('d-none');
    $('.choixPort').addClass('d-none');
}

function bindEvent(){
    $('#choixPort').click(() => {
        // TODO controle val choixPort
        socket.emit('choixPort', $('#listPort').val());
    });
}

function setAppChampi(data){
    $('.temperatureAir').text(data.temperatureAir);
    $('.tauxHumidite').text(data.tauxHumidite);
    $('.coeff').text(data.coeff);
    $('.consigneAir').text(data.consigneAir);
    $('.consigneHum').text(data.consigneHum);
    $('.modifConsigneAir').text(data.modifConsigneAir);
    $('.modifConsigneHum').text(data.modifConsigneHum);
    $('.nbJour').text(data.nbJour);
}