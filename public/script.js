let socket = null;

$(document).ready(() => {

bindEvent();

socket = io();

socket.on('dataJson', (data) => {
    console.log(data);
    $('.appChampi').removeClass('d-none');
    $('.choixPort').addClass('d-none');

    setAppChampi(data);
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