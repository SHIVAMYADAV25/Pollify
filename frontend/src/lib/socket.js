// frontend/src/lib/socket.js
//
// Production change: In dev, socket connects to window.location.origin (proxied by Vite).
// In prod, the backend is a different origin — we must connect to VITE_API_URL explicitly.
//
// __API_BASE__ is injected at build time by vite.config.js.

import { io } from 'socket.io-client';
import { getAccessToken } from './api';

// In dev __API_BASE__ is '' so we fall back to window.location.origin (Vite proxy handles it).
// In prod __API_BASE__ is 'https://your-backend.railway.app'.
const SOCKET_URL = __API_BASE__ || window.location.origin;

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      path: '/socket.io',
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();

  s.auth = {
    token: getAccessToken(),
  };

  if (!s.connected) s.connect();

  return s;
};

// Leave public respondent room
export const leavePollRoom = (shareCode) => {
  if (socket && socket.connected) socket.emit('leave:poll', shareCode);
};

// Leave creator dashboard notification room
export const leaveCreatorRoom = (userId) => {
  if (socket && socket.connected) socket.emit('leave:creator', userId);
};

// Leave isolated admin analytics room (poll:admin:{shareCode})
export const leaveAdminRoom = (shareCode) => {
  if (socket && socket.connected) socket.emit('leave:admin', shareCode);
};

export const disconnectSocket = () => {
  if (socket && socket.connected) socket.disconnect();
};

export default getSocket;