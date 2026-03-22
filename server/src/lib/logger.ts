import pino from 'pino';
import config from './config.js';

const logger = pino({
  level: config.LOG_LEVEL,
  ...(config.LOG_PRETTY && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname,req,res,responseTime,requestId,userId',
      },
    },
  }),
});

export default logger;
