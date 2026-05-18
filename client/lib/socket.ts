import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    
    if (!socketUrl) {
      throw new Error('NEXT_PUBLIC_SOCKET_URL is not defined');
    }
    
    console.log('[SOCKET] Connecting to:', socketUrl);
    
    socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      upgrade: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 45000,
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      // Verify connection with a ping
      socket?.emit('ping');
    });

    socket.on('pong', () => {
      console.log('Received PONG from server - Connection Verified');
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
    });

    socket.on('connect_error', (error) => {
      // Intentionally not logging to avoid spam
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
