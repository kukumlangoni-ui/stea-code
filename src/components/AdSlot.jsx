import React, { useEffect, useState } from 'react';

/**
 * AdSlot Component - Prepares space for Google AdSense
 * usage: <AdSlot id="home-after-hero" />
 */
export default function AdSlot({ id, style = {}, type = "display", label = "Sponsored Content" }) {
  const [isVisible, setIsVisible] = useState(false);
  const publisherId = import.meta.env.VITE_ADSENSE_PUBLISHER_ID || "ca-pub-2255709876687408";

  useEffect(() => {
    // In production, you would initialize AdSense here
    // Example: (window.adsbygoogle = window.adsbygoogle || []).push({});
    
    // For now, we simulate visibility for reserved space
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      id={id}
      className="stea-ad-slot"
      style={{
        margin: '20px auto',
        maxWidth: '100%',
        minHeight: type === 'mobile-sticky' ? '72px' : type === 'in-feed' ? '120px' : type === 'sidebar' ? '300px' : type === 'display' ? '250px' : '90px',
        background: 'linear-gradient(145deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))',
        borderRadius: type === 'mobile-sticky' ? '16px 16px 0 0' : '14px',
        border: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
        ...style
      }}
    >
      {/* Dev label - invisible in production usually */}
      <div style={{
        fontSize: '10px',
        color: 'rgba(255,255,255,0.15)',
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase'
      }}>
        {label}
      </div>
      
      {/* Reserved for AdSense Script */}
      <ins className="adsbygoogle"
           style={{ display: 'block', width: '100%' }}
           data-ad-client={publisherId}
           data-ad-slot={id}
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
           
      {/* Fallback pattern */}
      {!isVisible && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)',
          animation: 'stea-pulse 2s infinite linear'
        }} />
      )}
    </div>
  );
}
