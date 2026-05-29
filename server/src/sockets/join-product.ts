import { Socket, Server } from 'socket.io';
import { db } from '../lib/db.js';
import logger from '../lib/logger.js';

export default (socket: Socket, io: Server) => async (productId: string) => {
  const userId = socket.data.user.id;
  
  // Verify ownership
  const product = await db.client.product.findUnique({
    where: { id: productId, userId }
  });

  if (product) {
    socket.join(`product:${productId}`);
    logger.info({ socketId: socket.id, productId, userId }, 'Socket joined product room');
    
    // Immediately sync scanning status on joining
    try {
      const userDb = await db.client.user.findUnique({
        where: { id: userId },
        select: { isScanning: true }
      });
      if (userDb?.isScanning) {
        socket.emit('scan-status', {
          isScanning: true,
          status: 'RUNNING'
        });
      }
    } catch (err: any) {
      logger.error({ err: err.message, productId }, 'Failed to check scanning status during join-product');
    }
  } else {
    logger.warn({ socketId: socket.id, productId, userId }, 'Unauthorized product room join attempt');
  }
};
