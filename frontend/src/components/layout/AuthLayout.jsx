import React from 'react';
import { Outlet, Link, Navigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import LoadingSpinner from '../common/LoadingSpinner';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--parchment)' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--parchment)' }}
    >
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex lg:w-[44%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'var(--cream)', borderRight: '1px solid var(--border)' }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute w-72 h-72 rounded-full"
          style={{
            background: 'var(--sage-light)',
            top: '-60px',
            right: '-60px',
            filter: 'blur(40px)',
            opacity: 0.7,
          }}
        />
        <div
          className="absolute w-56 h-56 rounded-full"
          style={{
            background: 'var(--gold-light)',
            bottom: '80px',
            left: '-40px',
            filter: 'blur(40px)',
            opacity: 0.7,
          }}
        />

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 relative z-10">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--sage)' }}
          >
            <BarChart3 size={18} color="#fff" strokeWidth={2} />
          </div>
          <span className="font-serif text-2xl" style={{ color: 'var(--ink)' }}>
            Pollify
          </span>
        </Link>

        {/* Center content */}
        <div className="relative z-10">
          <div
            className="w-12 h-1 rounded-full mb-8"
            style={{ background: 'var(--sage)' }}
          />
          <h2
            className="font-serif text-4xl leading-tight mb-6"
            style={{ color: 'var(--ink)' }}
          >
            Collect insights that actually matter
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
            Build polls in minutes, share with anyone, and watch responses arrive in real time.
          </p>

          {/* Mini stats */}
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: 'Polls created', value: '10k+' },
              { label: 'Responses collected', value: '250k+' },
              { label: 'Avg. completion', value: '84%' },
              { label: 'Real-time updates', value: '< 1s' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl p-4"
                style={{ background: '#fff', border: '1px solid var(--border)' }}
              >
                <div
                  className="font-serif text-2xl mb-1"
                  style={{ color: 'var(--sage)' }}
                >
                  {s.value}
                </div>
                <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs relative z-10" style={{ color: 'var(--ink-faint)' }}>
          © 2025 Pollify. Hackathon project.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--sage)' }}
              >
                <BarChart3 size={18} color="#fff" strokeWidth={2} />
              </div>
              <span className="font-serif text-xl" style={{ color: 'var(--ink)' }}>
                Pollify
              </span>
            </Link>
          </div>

          <div
            className="rounded-2xl p-8"
            style={{
              background: '#fff',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}