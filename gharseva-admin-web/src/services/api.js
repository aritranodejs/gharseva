import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to add token (if exists)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add interceptor to handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('adminRefreshToken');

      if (refreshToken) {
        try {
          // Call refresh endpoint
          const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            refreshToken
          });

          if (res.data.success) {
            const { accessToken, refreshToken: newRefreshToken } = res.data.data;
            
            // Store new tokens
            localStorage.setItem('adminToken', accessToken);
            localStorage.setItem('adminRefreshToken', newRefreshToken);

            // Update header and retry original request
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // If refresh fails, clear tokens and redirect to login
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminRefreshToken');
          localStorage.removeItem('adminData');
          window.location.href = '/login';
        }
      } else {
        // No refresh token, redirect to login
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const getImageUrl = (path) => {
  if (!path) return null;
  
  const IMAGEKIT_BASE = 'https://ik.imagekit.io/zq0ku52lz';
  const baseUrl = import.meta.env.VITE_IMAGE_BASE_URL || 'http://127.0.0.1:5000';

  // 1. Recognize direct data URIs (Failsafe)
  if (path.startsWith('data:image/')) {
    return path;
  }

  // 2. Clear known 'localhost/0' or 'file://' errors
  if (path.includes('localhost/0') || path.startsWith('file://')) {
    return null;
  }

  // 3. Handle Cloud Paths (ImageKit)
  if (path.startsWith('/uploads')) {
    return `${IMAGEKIT_BASE}${path}`;
  }

  // 4. Handle Legacy / Absolute URLs
  if (path.startsWith('http')) {
    // Fix legacy localhost saves or mismatches
    if (path.includes('localhost:5000')) {
      return path.replace('http://localhost:5000', baseUrl);
    }
    if (path.includes('127.0.0.1:5000')) {
      return path.replace('http://127.0.0.1:5000', baseUrl);
    }
    return path;
  }

  // 5. Handle local relative paths
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${baseUrl}/${cleanPath}`;
};

export default api;
