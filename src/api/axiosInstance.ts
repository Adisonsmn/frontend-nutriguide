import axios from 'axios';

// Bug #13: Properly type the _retry property on Axios config
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  // Bug #8: Send cookies (including refresh token) automatically
  withCredentials: true,
});

// Request interceptor — attach access token from Zustand (in-memory)
api.interceptors.request.use((config) => {
  // Access token is stored in Zustand memory, read it from localStorage key
  // that Zustand persist uses (only user + isAuthenticated are persisted,
  // but we also need the token from the current session)
  const token = window.__nutriguide_access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Bug #4: Refresh queue to prevent concurrent double-refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// Response interceptor — auto refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Bug #8: Refresh token is sent automatically via cookie (withCredentials)
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newToken = data.data.accessToken;

        // Store the new access token in memory
        window.__nutriguide_access_token = newToken;

        // Process queued requests with new token
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Refresh failed — clear auth state and redirect to login
        window.__nutriguide_access_token = null;
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// Global accessor for the access token (used by the interceptor)
declare global {
  interface Window {
    __nutriguide_access_token: string | null;
  }
}
window.__nutriguide_access_token = null;

export default api;
