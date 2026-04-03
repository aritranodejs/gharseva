import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Standard fallback if .env is missing. For Android emulator, host localhost is 10.0.2.2
// Using user's current dev IP 192.168.1.6
const getBaseURL = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  
  // Generic fallback for local development if .env is missing
  return 'http://127.0.0.1:5000/api/';
};

const API_URL = getBaseURL();
const API_URL_NO_SLASH = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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

// Intercept requests to attach the JWT token if available
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userAccessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error securely retrieving the JWT:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses for token refresh
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
        const refreshToken = await AsyncStorage.getItem('userRefreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL_NO_SLASH}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = data.data;

        await AsyncStorage.setItem('userAccessToken', accessToken);
        await AsyncStorage.setItem('userRefreshToken', newRefreshToken);

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await AsyncStorage.multiRemove(['userAccessToken', 'userRefreshToken', 'userData']);
        // Redirect logic should be handled by navigation state listener
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

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
