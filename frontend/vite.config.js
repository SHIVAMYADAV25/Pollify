// frontend/vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // In development, Vite proxies /api and /socket.io to the local backend.
  // In production (Vercel/Netlify), the frontend calls VITE_API_URL directly,
  // and /api routes are NOT proxied (backend is on a separate domain).
  const isDev = mode === 'development';

  return {
    plugins: [react()],

    server: {
      port: 5173,
      proxy: isDev
        ? {
            '/api': {
              target: 'http://localhost:5000',
              changeOrigin: true,
              secure: false,
            },
            '/socket.io': {
              target: 'http://localhost:5000',
              changeOrigin: true,
              ws: true,
            },
          }
        : undefined,
    },

    build: {
      outDir: 'dist',
      sourcemap: false,
    },

    define: {
      // Exposes the API base URL to the app at build time.
      // In dev this is '' (empty) because the proxy rewrites /api → localhost:5000.
      // In prod this is 'https://your-backend.railway.app'.
      __API_BASE__: JSON.stringify(isDev ? '' : (env.VITE_API_URL || '')),
    },
  };
});