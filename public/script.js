let socket = null;

$(document).ready(() => {

bindEvent();

socket = io();

socket.on('dataJson', (data) => {
    console.log(data);
    setAppChampi(data);
});

socket.on('listPortName', (listPortName) => {
    $('#listPort').html("");

    listPortName.forEach(port => {
        $('#listPort').append(new Option(port, port));
    });
});



socket.on('connectPort', (isOpen) => {
    if(isOpen){
        accesApp();
    }else{
        // TODO template retry port connection
        closeAccessApp();
        socket.emit('reqListPort');
    }
});

socket.on("error",(err) =>
{
    console.log(err.message);
});


// Première demande de liste Port
socket.emit('reqListPort');

});//fin du chargement du document HTML

function accesApp(){
    $('.appChampi').removeClass('d-none');
    $('.choixPort').addClass('d-none');
}

function closeAccessApp(){
    $('.appChampi').addClass('d-none');
    $('.choixPort').removeClass('d-none');
}

function bindEvent(){
    $('#choixPort').click(() => {
        // TODO controle val choixPort
        socket.emit('choixPort', $('#listPort').val());
    });
}

function setAppChampi(data){
    $('.temperatureAir').text(data.temperatureAir);
    $('.consigneAir').text(data.consigneAir);
    $('.modifConsigneAir').text(data.modifConsigneAir);
    $('.tauxHumidite').text(data.tauxHumidite);
    $('.consigneHum').text(data.consigneHum);
    $('.modifConsigneHum').text(data.modifConsigneHum);
    $('.coeff').text(data.coeff);
    $('.moySec').text(data.moySec);
    $('.moyHum').text(data.moyHum);
    $('.tempsDeshum').text(data.tempsDeshum);
    $('.tempsOuvertureBrume').text(data.tempsOuvertureBrume);
    $('.tempsFermetureBrume').text(data.tempsFermetureBrume);
    $('.nbJour').text(data.nbJour);
}