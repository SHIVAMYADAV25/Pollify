import React, { useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import useAuthStore from './store/authStore';

import Layout from './components/layout/Layout';
import AuthLayout from './components/layout/AuthLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CreatePollPage from './pages/polls/CreatePollPage';
import MyPollsPage from './pages/polls/MyPollsPage';
import PollDetailPage from './pages/polls/PollDetailPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import TakePollPage from './pages/public/TakePollPage';
import ResultsPage from './pages/public/ResultsPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  // Guard against React StrictMode double-invoke in development.
  // Without this ref, StrictMode mounts twice → two concurrent POST /auth/refresh
  // calls with the same cookie → second call hits the now-blocklisted jti → 401.
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    initialize();
  }, [initialize]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route path="/poll/:shareCode" element={<TakePollPage />} />
      <Route path="/poll/:shareCode/results" element={<ResultsPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/polls" element={<MyPollsPage />} />
          <Route path="/polls/create" element={<CreatePollPage />} />
          <Route path="/polls/:id" element={<PollDetailPage />} />
          <Route path="/polls/:id/analytics" element={<AnalyticsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}