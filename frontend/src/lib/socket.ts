import { io, type Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
// Убираем суффикс /api — namespace чата (/chat) висит на корне HTTP-сервера, не под REST-префиксом
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

export function createChatSocket(token: string): Socket {
  return io(`${SOCKET_URL}/chat`, {
    auth: { token },
    transports: ['websocket'],
  });
}
