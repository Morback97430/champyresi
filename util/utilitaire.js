// calcul une moyenne a partir d'un tableau 1D de nombre
exports.calMoy = (tab) => {
    const reducer = (current, total) => current + total;  
    return tab.reduce(reducer) / tab.length;
}

// convertion heure to milliseconde
exports.hToMs = (h) => {
    return h * 60 * 60 * 1000;
}

// attente en milliseconde
exports.delay = (duree, unite = "millis") => {
    switch(unite){
        case "minute": return new Promise((resolve, reject) => {
            setTimeout(resolve, duree * 60 * 1000);
        });

        case "seconde": return new Promise((resolve, reject) => {
            setTimeout(resolve, duree * 1000);
        });

        default: return new Promise((resolve, reject) => {
            setTimeout(resolve, duree);
        });
    }

}