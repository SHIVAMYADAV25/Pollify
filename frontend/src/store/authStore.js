import { create } from 'zustand';
import api, { setAccessToken, clearAccessToken } from '../lib/api';

const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  // Called once on app mount — exchanges httpOnly refresh cookie for a new access token
  initialize: async () => {
    try {
      const res = await api.post('/auth/refresh');
      setAccessToken(res.data.accessToken);

      set({
        user: res.data.user,
        accessToken: res.data.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      // No valid refresh cookie — treat as logged out
      clearAccessToken();

      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });

    // Access token stored in memory only — refresh token lives in httpOnly cookie
    setAccessToken(res.data.accessToken);

    set({
      user: res.data.user,
      accessToken: res.data.accessToken,
      isAuthenticated: true,
    });
  },

  register: async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });

    setAccessToken(res.data.accessToken);

    set({
      user: res.data.user,
      accessToken: res.data.accessToken,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Clear locally regardless of server response
    }

    clearAccessToken();

    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
  },
}));

export default useAuthStore;