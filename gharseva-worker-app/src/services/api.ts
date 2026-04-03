import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// In development, use physical device IP or localhost for emulator
// We prioritize the environment variable if set by Expo
const getBaseURL = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  return 'http://127.0.0.1:5000/api/';
};

export const API_URL = getBaseURL();
export const API_URL_NO_SLASH = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('workerAccessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('workerRefreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL_NO_SLASH}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = data.data;

        await AsyncStorage.setItem('workerAccessToken', accessToken);
        await AsyncStorage.setItem('workerRefreshToken', newRefreshToken);

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await AsyncStorage.multiRemove(['workerAccessToken', 'workerRefreshToken', 'workerData']);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Helper to handle image URLs consistently.
 * Replaces localhost with dynamic IP and prepends base URL for relative paths.
 */
export const getImageUrl = (path?: string) => {
  if (!path) return null;
  
  const serverBase = API_URL_NO_SLASH.replace('/api', '');

  if (path.startsWith('http')) {
    // Fix legacy localhost saves or mismatches
    if (path.includes('localhost:5000')) {
      return path.replace('http://localhost:5000', serverBase);
    }
    if (path.includes('127.0.0.1:5000')) {
      return path.replace('http://127.0.0.1:5000', serverBase);
    }
    return path;
  }

  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${serverBase}/${cleanPath}`;
};

export default api;
