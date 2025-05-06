'use client';

import { io } from 'socket.io-client';

// Create a socket instance
const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Connect socket with authentication token
export const connectSocket = (token: string) => {
  // Set auth token
  socket.auth = { token };
  
  // Connect to the socket server
  socket.connect();
  
  // Log connection status
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket; 