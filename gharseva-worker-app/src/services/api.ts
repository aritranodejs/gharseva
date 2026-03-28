import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// In development, use physical device IP or localhost for emulator
// We prioritize the environment variable if set by Expo
const getBaseURL = () => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  
  // High-priority fallback to the user's current development IP
  const devIp = '192.168.1.6'; 
  return `http://${devIp}:5000/api`;
};

export const API_URL = getBaseURL();

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('workerToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Helper to handle image URLs consistently.
 * Replaces localhost with dynamic IP and prepends base URL for relative paths.
 */
export const getImageUrl = (path?: string) => {
  if (!path) return null;
  
  const serverBase = API_URL.replace('/api', '');

  if (path.startsWith('http')) {
    // Fix legacy localhost saves
    if (path.includes('localhost:5000')) {
      return path.replace('http://localhost:5000', serverBase);
    }
    return path;
  }

  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${serverBase}/${cleanPath}`;
};

export default api;
