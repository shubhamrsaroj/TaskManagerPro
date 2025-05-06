'use client';

import axios from 'axios';
import { getToken } from './auth';

// Create API instance with timeout and better error handling
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
  withCredentials: true, // Important for CORS with credentials
});

// Add request debugging in non-production environments
const isDev = process.env.NODE_ENV !== 'production';

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (isDev) {
      console.log(`API Request [${config.method?.toUpperCase()}] ${config.url}`, {
        data: config.data,
        headers: config.headers,
      });
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    if (isDev) {
      console.log(`API Response [${response.status}] ${response.config.url}`, {
        data: response.data,
      });
    }
    return response;
  },
  (error) => {
    // Log detailed error information
    const errorDetails = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
    };
    
    console.error('API Response Error:', errorDetails);
    
    // Handle specific HTTP status codes
    if (error.response?.status === 401) {
      // Handle 401 error - we'll redirect in the component
      console.error('Authentication error - not automatically redirecting');
    } else if (error.response?.status === 403) {
      console.error('Permission denied');
    } else if (error.response?.status === 500) {
      console.error('Server error');
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    } else if (!error.response) {
      console.error('Network error - server may be unreachable');
    }
    
    return Promise.reject(error);
  }
);

export default api; 