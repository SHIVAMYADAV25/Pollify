import React from 'react';

export default function QRCode({ value, size = 160, className = '' }) {
  if (!value) return null;

  const encodedUrl = encodeURIComponent(value);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUrl}&qzone=1&format=svg`;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <img
        src={qrSrc}
        alt="QR Code"
        width={size}
        height={size}
        style={{ display: 'block' }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.parentElement.innerHTML = `<p style="padding:12px;text-align:center;font-size:10px;color:var(--ink-faint);word-break:break-all;font-family:JetBrains Mono,monospace">${value}</p>`;
        }}
      />
    </div>
  );
}