let socket = null;

let consigneTemperature = "";
let consigneHumidite = "";

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

socket.on("erreur", affichageErreur);


function affichageErreur(err)
{
    $('.messageErreur').text(err);
    $('.erreur').fadeToggle().delay(5000).fadeToggle();
    console.log(err);
};

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
        socket.emit('choixPort', $('#listPort').val());
    });

    let pasAir = 0.5;

    $('#consigneAirDown').click(()=>{
        let textAir = $('#consigneAir').text();

        let valAir = Number(textAir.substring(0, textAir.length - 2));

        if((valAir - 0.5) > 10){
            socket.emit('newConsigneAir', valAir - 0.5);
        }else{
            affichageErreur("Consigne Air demandé trop bas");
        }
    });

    
    $('#consigneAirUp').click(()=>{
        let textAir = $('#consigneAir').text();
        
        let valAir = Number(textAir.substring(0, textAir.length - 2)); 
        
        if((valAir + 0.5) < 40){
            socket.emit('newConsigneAir', valAir + 0.5);
        }else{
            affichageErreur("Consigne humidite trop bas");
        }
    });

    $('#consigneHumDown').click(()=>{
        let textHum = $('#consigneHum').text();

        let valHum = Number(textHum.substring(0, textHum.length - 1)); 

        if((valHum - 0.5) > 60){
            socket.emit('newConsigneHum', valHum - 0.5);
        }else{
            affichageErreur("Consigne humidite trop bas"); 
        }
    });

    $('#consigneHumUp').click(()=>{
        let textHum = $('#consigneHum').text();

        let valHum = Number(textHum.substring(0, textHum.length - 1)); 

        if((valHum + 0.5) < 100){
            socket.emit('newConsigneHum', valHum + 0.5);
        }else{
            affichageErreur("Consigne humidite trop haute"); 
        }
    });    

    $('.gestionJour').click(() => {
        let jour = parseInt($('#saisiJour').val(), 10);

        if(jour != "" && Number.isInteger(jour)){
            $('.nbJour').text(jour);
            socket.emit('saveJour', jour);
        }
    });

    $('#dureeActivation').keyup(() => {      
        let nbActivation = calculActivation($('#dureeActivation').val());
        $('#nbActivation').val(nbActivation);
    });

    $('#nbActivation').keyup(() => {
        let dureeActivation = calculActivation($('#nbActivation').val());
        $('#dureeActivation').val(dureeActivation);
    });  

    $('.gestionActivationBrume').click(() => {
        $('.nbActivation5J').text($('#nbActivation').val());
        $('.dureeActivation5J').text($('#dureeActivation').val());

        socket.emit('dureeActivation', $('.dureeActivation5J').text());
    });

    $('.closePort').click(() => {
        socket.emit('closePort');
    })
}

function calculActivation(nb){
    return 1440 / nb;
}

function setAppChampi(data){
    $('.temperatureAir').text(arrondi(data.temperatureAir));
    
    $('.consigneAir').text(arrondi(data.consigneAir) + "°C");
    // $('.consigneAir').attr('data-progress', (arrondi(data.consigneAir) - 10) * 100 / 30);

    $('.modifConsigneAir').text(data.modifConsigneAir);
    $('.tauxHumidite').text(arrondi(data.tauxHumidite));
    
    $('.consigneHum').text(arrondi(data.consigneHum) + "%");
    // $('.consigneHum').attr('data-progress', arrondi(data.consigneHum));
    
    $('.modifConsigneHum').text(data.modifConsigneHum);
    $('.coeff').text(arrondi(data.coeff));
    $('.moySec').text(arrondi(data.moySec));
    $('.moyHum').text(arrondi(data.moyHum));
    $('.tempsDeshum').text(arrondi(data.tempsDeshum / 1000));
    $('.tempsOuvertureBrume').text(arrondi(data.tempsOuvertureBrume / 1000));
    $('.tempsFermetureBrume').text(arrondi(data.tempsFermetureBrume / 1000));
    $('.nbJour').text(data.nbJour);
    $('.suiviProcess').text(data.suiviProcess);
    $('.suiviSousProcess').text(data.suiviSousProcess);
}

const arrondi = (val) => Math.round(val * 100) / 100;