import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      autoConnect: false,
      withCredentials: true,
    });
  }
  return socket;
}

export function connectSocket(userId?: string) {
  const s = getSocket();
  if (!s.connected) s.connect();
  if (userId) s.emit('join_user', userId);
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}
