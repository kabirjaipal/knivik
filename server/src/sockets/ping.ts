import { Socket, Server } from 'socket.io';
import logger from '../lib/logger.js';

export default (socket: Socket, io: Server) => () => {
  logger.info({ socketId: socket.id }, 'Received PING, sending PONG');
  socket.emit('pong');
};
