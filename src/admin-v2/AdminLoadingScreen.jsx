import React from 'react';
import './admin-loading.css';

export default function AdminLoadingScreen() {
  return (
    <div className="admin-loading-container">
      <div className="admin-loading-content">
        <div className="admin-loading-logo-wrapper">
          <div className="admin-loading-ring"></div>
          <img src="/stea-brand/stea-s-logo-transparent-512.png" alt="STEA" className="admin-loading-logo" />
        </div>
        <h2 className="admin-loading-title">Loading STEA Admin...</h2>
        <p className="admin-loading-subtext">Preparing your ecosystem dashboard</p>
        
        <div className="admin-loading-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  );
}
