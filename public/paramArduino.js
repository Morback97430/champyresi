let socket = null;

let consigneTemperature = "";
let consigneHumidite = "";

$(document).ready(() => {
bindEvent();

socket = io();

socket.on('dataJson', (data) => {
    console.log(data);
    setAppChampi(data);
    setParamArduino(data);
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

// Première demande de liste Port
socket.emit('reqListPort');

});

function affichageErreur(err)
{
    $('.messageErreur').text(err);
    $('.erreur').fadeToggle().delay(5000).fadeToggle();
}

function accesApp(){
    $('.appChampi').removeClass('d-none');
    $('.choixPort').addClass('d-none');
}

function closeAccessApp(){
    $('.appChampi').addClass('d-none');
    $('.choixPort').removeClass('d-none');

    $('#choixPort').prop('disabled', false);
}

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

    $('#choixPort').click(() => {
        socket.emit('choixPort', $('#listPort').val());
    });

    $('#envoyerConsigneAir').click(()=>{
        let valAir = $('#consigneAir').val();

        if(valAir < 10){
            affichageErreur("Consigne Air demandé trop bas");
        }else if(valAir > 40){
            affichageErreur("Consigne Air demandé trop haute");
        }else{
            socket.emit('newConsigneAir', valAir);
        }
        initConsigne();
    });

    
    $('#envoyerConsigneHum').click(()=>{
        let valHum = $('#consigneHum').val();

        if(valHum < 60){
            affichageErreur("Consigne Humidité demandé trop bas");
        }else if(valHum > 100){
            affichageErreur("Consigne Humidité demandé trop haute");
        }else{
            socket.emit('newConsigneHum', valHum);
        }
        initConsigne();
    });
   
    $('#envoyerModifAir').click(()=>{
        let vitesseAir =  $('#modifConsigneAir').val();

        if(vitesseAir > 5 || vitesseAir < -5){
            affichageErreur("Vitesse doit être comprise entre 5 et -5");
        }
        else{
            socket.emit('newModifAir', vitesseAir);
        }
        initConsigne();
    });
     
    $('#envoyerModifHum').click(()=>{
        let vitesseHum = $('#modifConsigneHum').val();

        if(vitesseHum > 20 || vitesseHum < -20){
            affichageErreur("Vitesse doit être comprise entre 20 et -20");
        }
        else{
            socket.emit('newModifHum', vitesseHum);
        }
        initConsigne();
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

function initConsigne()
{
    $('#consigneAir').val("");
    $('#consigneHum').val("");
    $('#modifConsigneAir').val("");
    $('#modifConsigneHum').val("");   
}