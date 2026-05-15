// src/components/common/LoadingSpinner.jsx
import React from 'react';

const sizeMap = {
  sm: { size: 16, border: 2 },
  md: { size: 32, border: 2 },
  lg: { size: 48, border: 3 },
};

export default function LoadingSpinner({ size = 'md', color = 'sage' }) {
  const { size: px, border } = sizeMap[size] || sizeMap.md;
  const c = color === 'coral' ? 'var(--coral)' : color === 'gold' ? 'var(--gold)' : 'var(--sage)';
  return (
    <div
      className="spinner"
      style={{
        width: px,
        height: px,
        borderWidth: border,
        borderColor: c,
        borderTopColor: 'transparent',
      }}
    />
  );
}