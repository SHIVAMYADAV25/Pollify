import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form.name.trim(), form.email, form.password);
      toast.success('Account created! Welcome 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, type, Icon, placeholder) => (
    <div>
      <label
        className="block text-xs font-semibold uppercase tracking-wider mb-2"
        style={{ color: 'var(--ink-muted)' }}
      >
        {label}
      </label>
      <div className="relative">
        <Icon
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--ink-faint)' }}
        />
        <input
          type={key === 'password' ? (show ? 'text' : 'password') : type}
          className={`input-field pl-10 ${key === 'password' ? 'pr-10' : ''} ${errors[key] ? 'error' : ''}`}
          placeholder={placeholder}
          value={form[key]}
          onChange={(e) => {
            setForm((f) => ({ ...f, [key]: e.target.value }));
            setErrors((er) => ({ ...er, [key]: '' }));
          }}
        />
        {key === 'password' && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--ink-faint)' }}
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {errors[key] && (
        <p className="text-xs mt-1.5" style={{ color: 'var(--coral)' }}>{errors[key]}</p>
      )}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <h1 className="font-serif text-2xl mb-1" style={{ color: 'var(--ink)' }}>Create account</h1>
      <p className="text-sm mb-7" style={{ color: 'var(--ink-muted)' }}>
        Start collecting real insights today.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {field('name', 'Full name', 'text', User, 'Jane Smith')}
        {field('email', 'Email', 'email', Mail, 'you@example.com')}
        {field('password', 'Password', 'password', Lock, '••••••••')}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full py-3 mt-2"
        >
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <span
                className="spinner"
                style={{ width: 16, height: 16, borderWidth: 2, borderColor: '#fff', borderTopColor: 'transparent' }}
              />
              Creating account...
            </span>
          ) : (
            <>Create account <ArrowRight size={16} /></>
          )}
        </button>
      </form>

      <p className="text-center text-sm mt-6" style={{ color: 'var(--ink-muted)' }}>
        Already have an account?{' '}
        <Link to="/login" className="font-medium" style={{ color: 'var(--sage)' }}>
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}