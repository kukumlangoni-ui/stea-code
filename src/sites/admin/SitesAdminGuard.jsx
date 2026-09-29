import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import SitesAdminLogin from './SitesAdminLogin.jsx';
import { useNavigate } from 'react-router-dom';
import { isAdminEmail } from '../../firebase.js';

export default function SitesAdminGuard({ children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#080B14' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(245,166,35,.2)', borderTopColor: '#F5A623', animation: 'spin 1s linear infinite' }}>
          <style>{`
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}</style>
        </div>
      </div>
    );
  }

  if (!user) {
    return <SitesAdminLogin />;
  }

  const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'super_admin' || isAdminEmail(user.email)));

  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#080B14', color: '#F0F2F5', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 24, marginBottom: 16 }}>Access Denied</h1>
        <p style={{ color: 'rgba(255,255,255,.62)', marginBottom: 24 }}>You do not have permission to access the Admin Console.</p>
        <button 
          onClick={() => navigate('/websites')}
          style={{ padding: '10px 20px', borderRadius: 14, backgroundColor: '#F5A623', color: '#080B14', border: 'none', fontWeight: 600, cursor: 'pointer' }}
        >
          Return to STEA
        </button>
      </div>
    );
  }

  return children;
}
