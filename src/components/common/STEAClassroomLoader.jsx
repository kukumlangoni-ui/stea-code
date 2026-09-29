import React, { useEffect, useState } from 'react';

const GOLD = '#D4AF37';
const STEA_LOGO = '/stea-brand/stea-s-logo-transparent-512.png';
const STEA_LOGO_FALLBACK = '/stea-brand/stea-s-logo-transparent-1024.png';

export default function STEAClassroomLoader({ progress = 10, onComplete, compact = false }) {
  const [internalProgress, setInternalProgress] = useState(progress);

  // Smoothly transition progress without ever resetting backwards
  useEffect(() => {
    setInternalProgress(prev => {
      return Math.max(prev, progress);
    });
  }, [progress]);

  // Handle onComplete trigger when progress hits 100%
  useEffect(() => {
    if (internalProgress >= 100) {
      const delay = setTimeout(() => {
        if (onComplete) onComplete();
      }, 400); // smooth exit transition
      return () => clearTimeout(delay);
    }
  }, [internalProgress, onComplete]);

  // Forced light theme styles (WHITE MODE ONLY)
  const pageBg = '#F8FAFC';
  const cardBg = '#FFFFFF';
  const cardBorder = '1px solid #E5E7EB';
  const textColor = '#111827';
  const secondaryTextColor = '#6B7280';
  const progressTrackBg = '#EEF2F7';
  const cardShadow = '0 12px 32px rgba(17, 24, 39, 0.05)';
  const progressFill = 'linear-gradient(90deg, #D4AF37, #F7C948)';

  return (
    <div style={{
      minHeight: compact ? '200px' : '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: 24,
      background: compact ? 'transparent' : pageBg,
      color: textColor,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <style>{`
        @keyframes steaLogoPulse {
          0%, 100% { transform: scale(1); opacity: 0.95; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        @keyframes steaLoaderFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        width: '100%',
        maxWidth: compact ? '100%' : '420px',
        padding: compact ? '16px' : '36px',
        borderRadius: compact ? '0' : '24px',
        background: compact ? 'transparent' : cardBg,
        border: compact ? 'none' : cardBorder,
        textAlign: 'center',
        boxShadow: compact ? 'none' : cardShadow,
        animation: 'steaLoaderFadeIn 0.4s ease-out both',
        boxSizing: 'border-box'
      }}>
        {/* STEA Gold Logo container */}
        <div style={{
          width: compact ? 64 : 88,
          height: compact ? 64 : 88,
          margin: '0 auto 24px',
          borderRadius: compact ? 16 : 22,
          background: '#FFFFFF',
          border: `1px solid ${GOLD}`,
          display: 'grid',
          placeItems: 'center',
          animation: 'steaLogoPulse 2.5s ease-in-out infinite',
          boxSizing: 'border-box',
          boxShadow: '0 8px 20px rgba(212,175,55,0.08)'
        }}>
          <img
            src={STEA_LOGO}
            alt="STEA Logo"
            onError={(e) => {
              if (e.currentTarget.src.endsWith(STEA_LOGO_FALLBACK)) return;
              e.currentTarget.src = STEA_LOGO_FALLBACK;
            }}
            style={{
              width: compact ? 38 : 52,
              height: compact ? 38 : 52,
              objectFit: 'contain',
              display: 'block'
            }}
          />
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: compact ? 18 : 24,
          fontWeight: 800,
          color: textColor,
          margin: '0 0 8px 0',
          letterSpacing: '-0.02em'
        }}>
          STEA Classroom
        </h2>

        {/* Subtitle */}
        <p style={{
          fontSize: compact ? 12 : 14,
          color: secondaryTextColor,
          margin: '0 0 24px 0',
          fontWeight: 500
        }}>
          Synchronizing your classrooms...
        </p>

        {/* Progress Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%'
        }}>
          <div style={{
            flex: 1,
            height: 6,
            borderRadius: 999,
            background: progressTrackBg,
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              width: `${internalProgress}%`,
              height: '100%',
              borderRadius: 'inherit',
              background: progressFill,
              transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
          </div>
          <span style={{
            minWidth: 36,
            fontSize: 12,
            fontWeight: 800,
            color: textColor,
            textAlign: 'right'
          }}>
            {Math.round(internalProgress)}%
          </span>
        </div>
      </div>
    </div>
  );
}
