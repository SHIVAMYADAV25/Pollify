import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--parchment)' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}