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

socket.on("erreur", (err) =>
{
    $('.messageErreur').text(err);
    $('.erreur').fadeToggle().delay(5000).fadeToggle();
    console.log(err);
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

    $('#choixPort').prop('disabled', false);
}

function bindEvent(){
    $('#choixPort').click(() => {
        // TODO controle val choixPort
        $('#choixPort').prop('disabled', true);
        socket.emit('choixPort', $('#listPort').val());
    });

    $('.gestionJour').click(() => {
        let jour = parseInt($('#saisiJour').val(), 10);

        if(jour != "" && Number.isInteger(jour)){
            $('.nbJour').text(jour);
            socket.emit('saveJour', jour);
        }
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