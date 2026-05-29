import { Socket, Server } from 'socket.io';

export default (socket: Socket, io: Server) => () => {
  console.log(`[SOCKET] Received PING from ${socket.id}, sending PONG`);
  socket.emit('pong');
};
