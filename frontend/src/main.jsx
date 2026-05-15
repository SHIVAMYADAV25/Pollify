// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        gutter={10}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: 'var(--ink)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'DM Sans, sans-serif',
            boxShadow: '0 4px 12px rgba(28,26,22,0.10)',
          },
          success: { iconTheme: { primary: '#4A7C59', secondary: '#fff' } },
          error: { iconTheme: { primary: '#D9604A', secondary: '#fff' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);