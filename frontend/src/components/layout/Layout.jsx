// src/components/layout/Layout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--parchment)' }}>
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--cream)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
            © 2025 Pollify — Built for the hackathon
          </p>
        </div>
      </footer>
    </div>
  );
}