import React from 'react';

export default function SteaLogo({ size = 'md', hideText = false }) {
  const sizes = { sm: 28, md: 36, lg: 48 };
  const px = sizes[size] || 36;
  const shouldHideText = hideText || size === 'sm';
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Golden S mark image */}
      <img
        src="/stea-brand/favicon-transparent.png"
        alt="S"
        style={{
          width: px,
          height: px,
          objectFit: 'contain',
          flexShrink: 0,
          imageRendering: '-webkit-optimize-contrast'
        }}
        onError={(e) => {
          e.target.src = "/stea-brand/app-icon-white-bg.png";
        }}
      />
      {/* Fallback (hidden by default) */}
      <div style={{
        display: 'none',
        width: px, height: px,
        background: 'linear-gradient(135deg, #F5A623, #D4891A)',
        borderRadius: px * 0.25,
        alignItems: 'center', justifyContent: 'center',
        fontWeight: 900, fontSize: px * 0.55, color: '#000',
        fontFamily: 'system-ui',
        flexShrink: 0
      }}>
        S
      </div>
      {/* STEA text */}
      {!shouldHideText && (
        <span style={{
          fontSize: px * 0.55, fontWeight: 900,
          color: '#FFFFFF', letterSpacing: -0.5,
          fontFamily: 'system-ui'
        }}>
          STEA
        </span>
      )}
    </div>
  );
}
