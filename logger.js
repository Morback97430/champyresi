const winston = require('winston');
const { createLogger, format} = {...winston};
const { combine, timestamp, printf} = format;

require('winston-daily-rotate-file');

const path = require('path');

let transportArduino = new winston.transports.DailyRotateFile(
    {
        filename: path.join('log', 'logArduino-%DATE%.log'),
        datePattern: 'DD-MM-YYYY',
        maxSize:'2g',
        maxFiles:'3',
    }
);

const formatArduino = printf(({ level, label, message, timestamp }) => {
    return `${timestamp} ${level} : ${label} => ${message}`;
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

module.exports = loggerArduino;