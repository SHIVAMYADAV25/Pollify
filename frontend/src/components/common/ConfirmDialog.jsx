import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmStyle = 'btn-danger',
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(28,26,22,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="card w-full max-w-sm"
            style={{ boxShadow: 'var(--shadow-lg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--coral-light)' }}
              >
                <AlertTriangle size={18} style={{ color: 'var(--coral)' }} />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--ink)' }}>
                  {title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
                  {message}
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={onCancel} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button onClick={onConfirm} className={`btn ${confirmStyle} btn-sm`}>
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}