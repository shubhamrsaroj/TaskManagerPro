'use client';

import { connectSocket, disconnectSocket } from './socket';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string;
  user: User;
  isAuthenticated: boolean;
}

// Generate a unique session ID that won't conflict
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Get current session ID from sessionStorage or create a new one
const getOrCreateSessionId = () => {
  if (typeof window === 'undefined') return null;
  
  let sessionId = sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

// Store auth data in localStorage with session-specific key
export const saveAuthData = (token: string, user: User) => {
  try {
    // Get current session ID
    const sessionId = getOrCreateSessionId();
    if (!sessionId) return;
    
    // Create auth state
    const authState: AuthState = {
      token,
      user,
      isAuthenticated: true
    };
    
    // Store auth data in localStorage with session-specific key
    localStorage.setItem(`auth-${sessionId}`, JSON.stringify(authState));
    
    // Also store in the old format for backward compatibility
    const authData = { state: authState };
    localStorage.setItem('auth-storage', JSON.stringify(authData));
    
    // Store current user's session ID in sessionStorage
    sessionStorage.setItem('currentPath', '/dashboard');
    
    // Connect to socket with the new token
    connectSocket(token);
    
  } catch (error) {
    console.error('Failed to save auth data', error);
  }
};

// Get auth data specific to the current session
export const getAuthData = (): AuthState | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Get current session ID
    const sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) return null;
    
    // Try to get auth data for this specific session
    const authData = localStorage.getItem(`auth-${sessionId}`);
    if (authData) {
      return JSON.parse(authData);
    }
    
    // Fall back to global auth data if no session-specific data found
    const globalAuthData = localStorage.getItem('auth-storage');
    if (globalAuthData) {
      const parsed = JSON.parse(globalAuthData);
      return parsed.state || null;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get auth data', error);
    return null;
  }
};

// Get auth token
export const getToken = (): string | null => {
  const authData = getAuthData();
  return authData?.token || null;
};

// Get current user
export const getUser = (): User | null => {
  const authData = getAuthData();
  return authData?.user || null;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const authData = getAuthData();
  return !!authData?.isAuthenticated;
};

// Log out user
export const logout = () => {
  try {
    // Get current session ID
    const sessionId = sessionStorage.getItem('sessionId');
    
    // Remove session-specific auth data
    if (sessionId) {
      localStorage.removeItem(`auth-${sessionId}`);
    }
    
    // Remove global auth data
    localStorage.removeItem('auth-storage');
    
    // Clear session data
    sessionStorage.removeItem('sessionId');
    sessionStorage.removeItem('currentPath');
    
    // Disconnect socket
    disconnectSocket();
    
  } catch (error) {
    console.error('Failed to logout', error);
  }
};

// Initialize session
export const initSession = () => {
  if (typeof window === 'undefined') return;
  
  // Ensure we have a session ID
  getOrCreateSessionId();
  
  // Connect with token if authenticated
  const token = getToken();
  if (token) {
    connectSocket(token);
  }
};

// For handling page refreshes
if (typeof window !== 'undefined') {
  window.addEventListener('load', initSession);
} 