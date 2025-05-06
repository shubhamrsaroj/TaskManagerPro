'use client';

import { io } from 'socket.io-client';

// Process API URL to get the base URL for socket connection
const getBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  // Remove /api suffix if present to get the base URL
  return apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
};

// Create a socket instance
const socket = io(getBaseUrl(), {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000, // Increase timeout to 20 seconds
});

// Connect socket with authentication token
export const connectSocket = (token: string) => {
  try {
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
      // You can implement fallback functionality here
      // For example, polling for notifications instead of real-time
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      // Auto-reconnect logic can be added here if needed
    });
  } catch (error) {
    console.error('Error in socket connection setup:', error);
    // Application should continue to work even if socket fails
  }
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket; 