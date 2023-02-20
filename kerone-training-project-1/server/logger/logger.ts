import winston from "winston"


export let loggerFunction = ()=>{


const myFormat = winston.format.printf(({ label, message, timestamp }) => {
    return `${timestamp} [${label}]  ${message}`;
  });
    return winston.createLogger({
        level: 'debug',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json() 
          ),
        // defaultMeta: { service: 'user-service' },
        transports: [
            new winston.transports.File({filename: "errors.log"})
        ],
      });
}