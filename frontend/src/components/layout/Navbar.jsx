import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ListChecks, PlusCircle, LogOut, ChevronDown,
  Menu, X, BarChart3
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setDropOpen(false);
    navigate('/');
  };

  const navLinks = isAuthenticated
    ? [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/polls', label: 'My Polls', icon: ListChecks },
        { to: '/polls/create', label: 'New Poll', icon: PlusCircle },
      ]
    : [];

  const isActive = (path) =>
    location.pathname === path

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <nav className="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--sage)' }}
            >
              <BarChart3 size={16} color="#fff" strokeWidth={2} />
            </div>
            <span
              className="font-serif text-xl tracking-tight"
              style={{ color: 'var(--ink)' }}
            >
              Pollify
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  color: isActive(to) ? 'var(--sage)' : 'var(--ink-muted)',
                  background: isActive(to) ? 'var(--sage-light)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive(to)) e.currentTarget.style.background = 'var(--cream)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive(to)) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setDropOpen((v) => !v)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all duration-150"
                  style={{
                    background: dropOpen ? 'var(--cream-dark)' : 'var(--cream)',
                    borderColor: 'var(--border)',
                    color: 'var(--ink)',
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold"
                    style={{ background: 'var(--sage)', color: '#fff' }}
                  >
                    {initials}
                  </div>
                  <span className="text-sm font-medium max-w-[120px] truncate">
                    {user?.name?.split(' ')[0]}
                  </span>
                  <ChevronDown
                    size={14}
                    style={{
                      color: 'var(--ink-muted)',
                      transform: dropOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>

                <AnimatePresence>
                  {dropOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.14 }}
                      className="absolute right-0 mt-2 w-56 rounded-xl overflow-hidden"
                      style={{
                        background: '#fff',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-lg)',
                      }}
                    >
                      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                        <p className="text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>
                          Signed in as
                        </p>
                        <p className="text-sm font-medium mt-0.5 truncate" style={{ color: 'var(--ink)' }}>
                          {user?.email}
                        </p>
                      </div>
                      <div className="p-1.5">
                        <button
                          onClick={handleLogout}
                          className="btn btn-ghost w-full justify-start text-sm py-2 px-3"
                          style={{ color: 'var(--coral)' }}
                        >
                          <LogOut size={15} />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary btn-sm">Sign in</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: 'var(--ink-muted)' }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    color: isActive(to) ? 'var(--sage)' : 'var(--ink-light)',
                    background: isActive(to) ? 'var(--sage-light)' : 'transparent',
                  }}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}

              <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm"
                    style={{ color: 'var(--coral)' }}
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <Link to="/login" className="btn btn-secondary flex-1 text-sm">Sign in</Link>
                    <Link to="/register" className="btn btn-primary flex-1 text-sm">Get started</Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}