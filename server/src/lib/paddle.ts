import { Paddle, Environment } from '@paddle/paddle-node-sdk';
import config from './config.js';

export const paddle = new Paddle(config.PADDLE_API_KEY || '', {
  environment: (config.PADDLE_ENVIRONMENT === 'production' ? Environment.production : Environment.sandbox),
});

export default paddle;
