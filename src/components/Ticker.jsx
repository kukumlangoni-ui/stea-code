import React from 'react';

const tickerItems = [
  '📚 New Notes Added',
  '💼 120+ New Jobs',
  '🛍️ New Products',
  '🔥 Trending Creator',
  '🎓 CSEE Results Out Now',
  '🏪 Become a Seller'
];

export function Ticker() {
  return (
    <div className="stea-ticker-container" style={{ 
      background: '#05070c', 
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)', 
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      zIndex: 50
    }}>
      <style>{`
        .stea-ticker-container {
          height: 36px;
        }
        @media (max-width: 767px) {
          .stea-ticker-container {
            height: 30px !important;
          }
        }
        .stea-ticker-track {
          display: flex;
          gap: 60px;
          white-space: nowrap;
          padding-left: 20px;
          animation: ticker-scroll 30s linear infinite;
          width: max-content;
          align-items: center;
        }
        @media (max-width: 767px) {
          .stea-ticker-track {
            gap: 40px;
          }
        }
        .stea-ticker-container:hover .stea-ticker-track {
          animation-play-state: paused;
        }
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      
      <div className="stea-ticker-track">
        {/* Render twice for seamless loop */}
        {[...tickerItems, ...tickerItems].map((item, i) => (
          <span 
            key={i} 
            className="stea-ticker-item"
            style={{ 
              fontWeight: 900, 
              color: '#F5A623', 
              textTransform: 'uppercase', 
              letterSpacing: '1.2px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {item}
            <span style={{ color: 'rgba(255, 166, 35, 0.25)', margin: '0 8px' }}>✦</span>
          </span>
        ))}
      </div>
      
      {/* Gradient overlays for smooth fade edges */}
      <div style={{ 
        position: 'absolute', 
        left: 0, 
        top: 0, 
        bottom: 0, 
        width: '40px', 
        background: 'linear-gradient(to right, #05070c, transparent)', 
        zIndex: 2,
        pointerEvents: 'none'
      }} />
      <div style={{ 
        position: 'absolute', 
        right: 0, 
        top: 0, 
        bottom: 0, 
        width: '40px', 
        background: 'linear-gradient(to left, #05070c, transparent)', 
        zIndex: 2,
        pointerEvents: 'none'
      }} />
    </div>
  );
}
