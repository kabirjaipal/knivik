import { Socket, Server } from 'socket.io';
import logger from '../lib/logger.js';

export default (socket: Socket, io: Server) => (userId: string) => {
  const authenticatedUserId = socket.data.user.id;
  
  if (userId === authenticatedUserId) {
    socket.join(`user:${userId}`);
    logger.info({ socketId: socket.id, userId }, 'Socket joined user room');
  } else {
    logger.warn({ socketId: socket.id, userId, authenticatedUserId }, 'Unauthorized user room join attempt');
  }
};
