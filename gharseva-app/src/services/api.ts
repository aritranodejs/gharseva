import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Standard fallback if .env is missing. For Android emulator, host localhost is 10.0.2.2
const fallbackUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api/' : 'http://localhost:5000/api/';
let API_URL = process.env.EXPO_PUBLIC_API_URL || fallbackUrl;

// Ensure trailing slash for baseURL
if (!API_URL.endsWith('/')) {
  API_URL += '/';
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to attach the JWT token if available
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error securely retrieving the JWT:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept responses to log errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

export const getImageUrl = (path?: string) => {
  if (!path) return null;
  
  // If it's a full URL from imagekit or already has a protocol
  if (path.startsWith('http')) {
    // If it's a localhost URL from older backend saves, replace it with the dynamic API host
    if (path.includes('localhost:5000')) {
      const serverBase = API_URL.replace('/api/', '');
      return path.replace('http://localhost:5000', serverBase);
    }
    return path;
  }

  // Prepend the server URL to relative paths
  const serverBase = API_URL.replace('/api/', '');
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${serverBase}/${cleanPath}`;
};

export default api;
