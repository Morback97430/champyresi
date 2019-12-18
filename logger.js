const winston = require('winston');
const { createLogger, format} = {...winston};
const { combine, timestamp, printf} = format;

require('winston-daily-rotate-file');

const path = require('path');

// Info
let transportInfo = new winston.transports.DailyRotateFile(
    {
        level:"info",
        filename: path.join('log/serveur', 'logInfo-%DATE%.log'),
        datePattern: 'DD-MM-YYYY',
        maxSize:'20m',
        maxFiles:'3',
    }
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
let transportArduino = new winston.transports.DailyRotateFile(
    {
        filename: path.join('log/arduino', 'logArduino-%DATE%.log'),
        datePattern: 'DD-MM-YYYY',
        maxSize:'2g',
        maxFiles:'3',
    }
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
    {
        level:"error",
        filename: path.join('log/serveur', 'logErreur-%DATE%.log'),
        datePattern: 'DD-MM-YYYY',
        maxSize:'20m',
        maxFiles:'3',
    }
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

module.exports = {
    loggerErreur:loggerErreur,
    loggerArduino:loggerArduino,
    loggerInfo:loggerInfo
};