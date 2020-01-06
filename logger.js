const winston = require('winston');
const { createLogger, format} = {...winston};
const { combine, timestamp, printf} = format;

require('winston-daily-rotate-file');

const path = require('path');

// Info
let transportInfo =  new winston.transports.DailyRotateFile(
  { level:"info",
    filename: './log/serveur/info/logInfo.log', 
    maxsize: "209 715 200", maxFiles:5}
  );

const formatInfo = printf(({ level, label, message, timestamp }) => {
    return `${timestamp} ${level} : ${label} => ${message}`;
  });

const loggerInfo = createLogger({
    format: combine(
      timestamp(),
      formatInfo
    ),
    transports: [
        transportInfo
    ]
});

loggerInfo.exitOnError = false;

// Arduino
let transportArduino = new winston.transports.File(
  { filename: './log/arduino/logArduino.log', 
    maxsize: "209 715 200", maxFiles:5}
  );

const formatArduino = printf(({level, label, message, modifParametre, timestamp }) => {
    return `${timestamp} ${level} : ${label} => #${message} / Valeur Manuelle modifier #[${modifParametre}]`;
  });

const loggerArduino = createLogger({
    format: combine(
      timestamp(),
      formatArduino
    ),
    transports: [
        transportArduino
    ]
});

loggerArduino.exitOnError = false;

// Erreur
let transportErreur = new winston.transports.DailyRotateFile(
  { level:"error",
    filename: './log/serveur/erreur/logErreur.log', 
    maxsize: "209 715 200", maxFiles:5}
  );

const formatErreur = printf(({ level, label, message, timestamp }) => {
    return `${timestamp} ${level} : ${label} => ${message}`;
  });

const loggerErreur = createLogger({
    format: combine(
      timestamp(),
      formatErreur
    ),
    transports: [
        transportErreur
    ]
});

loggerErreur.exitOnError = false;

let logErreur = (label, message) => {
  loggerErreur.error({label: label, message:message});
}

module.exports = {
    loggerErreur:logErreur,
    loggerArduino:loggerArduino,
    loggerInfo:loggerInfo
};