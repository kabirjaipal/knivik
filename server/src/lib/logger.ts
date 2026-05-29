import pino from 'pino';
import config from './config.js';

const logger = pino({
  level: config.LOG_LEVEL,
  redact: {
    paths: [
      'email', 'password', 'token', 'jwt', 
      'req.headers.authorization', 'req.headers.cookie',
      'user.email', 'user.password', 'res.headers["set-cookie"]'
    ],
    remove: true
  },
  ...(config.LOG_PRETTY && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd hh:MM:ss TT',
        ignore: 'pid,hostname,req,res,responseTime',
      },
    },
  }),
});

export default logger;
