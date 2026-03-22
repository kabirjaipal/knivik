import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import logger from './logger.js';
import config from './config.js';
import { db } from './db.js';

let io: SocketIOServer | null = null;

export const initSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: config.CORS_ORIGIN.split(',').map((origin: string) => origin.trim()),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`New socket connection [ID: ${socket.id}]`);

    socket.on('join-user-room', async (userId: string) => {
      socket.join(`user:${userId}`);
      logger.info(`Socket joined user room [ID: ${socket.id}, User: ${userId}]`);

      try {
        const user = await db.client.user.findUnique({ where: { id: userId }, select: { isScanning: true, lastScanStatus: true } });
        if (user) {
          socket.emit('scan-status', { isScanning: user.isScanning, status: user.lastScanStatus });
        }
      } catch (err) {
        logger.error({ err }, 'Error fetching user state on join-user-room');
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected [ID: ${socket.id}]`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};
