// NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--parchment)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="font-serif mb-4" style={{ fontSize: 120, lineHeight: 1, color: 'var(--cream-deeper)', userSelect: 'none' }}>
          404
        </div>
        <h1 className="font-serif text-2xl mb-3" style={{ color: 'var(--ink)' }}>Page not found</h1>
        <p className="text-sm mb-8 max-w-sm mx-auto" style={{ color: 'var(--ink-muted)' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="btn btn-secondary">← Home</Link>
          <Link to="/dashboard" className="btn btn-primary">
            Dashboard <ArrowRight size={15} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}