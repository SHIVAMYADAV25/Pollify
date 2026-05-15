// frontend/src/lib/api.js
//
// Production change: In dev, Vite proxies /api → localhost:5000 so baseURL='/api'.
// In production (frontend on Vercel, backend on Railway), the backend is a
// different origin, so baseURL must be the full backend URL.
//
// __API_BASE__ is injected at build time by vite.config.js:
//   dev  → '' (empty string, proxy kicks in)
//   prod → 'https://your-backend.railway.app'

import axios from 'axios';

const api = axios.create({
  baseURL: `${__API_BASE__}/api`,
  timeout: 15000,
  withCredentials: true, // required for httpOnly refresh cookie cross-origin
});

// In-memory access token — never touches localStorage
let _accessToken = null;

export const setAccessToken = (token) => { _accessToken = token; };
export const clearAccessToken = () => { _accessToken = null; };
export const getAccessToken = () => _accessToken;

// Attach access token from memory on every request
api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

let _isRefreshing = false;
let _refreshQueue = [];

const processQueue = (error, token = null) => {
  _refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  _refreshQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    // Never retry the refresh endpoint itself — prevents infinite loop
    if (originalRequest.url?.includes('/auth/refresh')) {
      clearAccessToken();
      return Promise.reject(err);
    }

    if (err.response?.status === 401 && !originalRequest._retried) {
      // Queue subsequent 401s while a refresh is in-flight
      if (_isRefreshing) {
        return new Promise((resolve, reject) => {
          _refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retried = true;
      _isRefreshing = true;

      try {
        // httpOnly cookie is sent automatically via withCredentials: true
        const { data } = await axios.post(
          `${__API_BASE__}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = data.accessToken;
        setAccessToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAccessToken();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        _isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default api;