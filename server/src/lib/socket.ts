import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import logger from './logger.js';
import config from './config.js';
import { auth } from './auth.js';
import { db } from './db.js';
import { fromNodeHeaders } from 'better-auth/node';

let io: Server | null = null;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [...config.CORS_ORIGIN.split(',').map((origin: string) => origin.trim()), 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
  });

  // Authentication Middleware
  io.use(async (socket, next) => {
    console.log(`[SOCKET] Handshake attempt: ${socket.id} from ${socket.handshake.address}`);
    try {
      // Add a 10s timeout to session check to prevent hanging handshakes during heavy DB load
      const sessionPromise = auth.api.getSession({
        headers: fromNodeHeaders(socket.request.headers)
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 40000)
      );

      const session = await Promise.race([sessionPromise, timeoutPromise]) as any;

      if (!session) {
        logger.warn({ socketId: socket.id }, 'Socket connection rejected: No valid session');
        return next(new Error('Authentication failed: No session'));
      }

      socket.data.user = session.user;
      next();
    } catch (error: any) {
      logger.error({ 
        message: error.message, 
        socketId: socket.id,
        error 
      }, 'Socket auth middleware error');
      
      if (error.message === 'Auth timeout') {
        return next(new Error('Authentication timed out'));
      }
      next(new Error('Internal server error during authentication'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[SOCKET] New connection established: ${socket.id}`);
    logger.info({ socketId: socket.id }, 'New socket connection');

    socket.on('ping', () => {
      console.log(`[SOCKET] Received PING from ${socket.id}, sending PONG`);
      socket.emit('pong');
    });

    socket.on('join-product', async (productId: string) => {
      const userId = socket.data.user.id;
      
      // Verify ownership
      const product = await db.client.product.findUnique({
        where: { id: productId, userId }
      });

      if (product) {
        socket.join(`product:${productId}`);
        logger.info({ socketId: socket.id, productId, userId }, 'Socket joined product room');
      } else {
        logger.warn({ socketId: socket.id, productId, userId }, 'Unauthorized product room join attempt');
      }
    });

    socket.on('join-user', (userId: string) => {
      const authenticatedUserId = socket.data.user.id;
      
      if (userId === authenticatedUserId) {
        socket.join(`user:${userId}`);
        logger.info({ socketId: socket.id, userId }, 'Socket joined user room');
      } else {
        logger.warn({ socketId: socket.id, userId, authenticatedUserId }, 'Unauthorized user room join attempt');
      }
    });

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Socket disconnected');
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export const emitScanStatus = (userId: string, productId: string, isScanning: boolean, status: string) => {
  if (!io) return;
  
  // Emit to user room
  io.to(`user:${userId}`).emit('scan-status', {
    productId,
    isScanning,
    status
  });

  // Also emit to product room specifically
  io.to(`product:${productId}`).emit('scan-status', {
    isScanning,
    status
  });
};

export const getSocketStats = () => {
  if (!io) {
    return { activeConnections: 0, clients: [] };
  }
  const sockets = Array.from(io.sockets.sockets.values());
  const clients = sockets.map(s => ({
    id: s.id,
    userId: s.data?.user?.id || 'anonymous',
    username: s.data?.user?.username || 'anonymous',
    email: s.data?.user?.email || 'anonymous',
    rooms: Array.from(s.rooms).filter(r => r !== s.id) // Filter out the socket ID itself which acts as a default room
  }));
  return {
    activeConnections: sockets.length,
    clients
  };
};
