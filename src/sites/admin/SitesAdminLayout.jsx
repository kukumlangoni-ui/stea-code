import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAdminSitesCatalog } from './useAdminSitesCatalog.js';
import { useAuth } from '../../hooks/useAuth.js';

const NAV_ITEMS = [
  { path: '', label: 'Overview', icon: '📊' },
  { path: 'websites', label: 'Websites', icon: '🌐' },
  { path: 'categories', label: 'Categories', icon: '📁' },
  { path: 'developers', label: 'Developers', icon: '👨‍💻' },
  { path: 'popular', label: 'Popular', icon: '🔥' },
  { path: 'search', label: 'Search', icon: '🔍' },
  { path: 'members', label: 'Users', icon: '👥' },
  { path: 'submissions', label: 'Submitted Suggestions', icon: '📥' },
  { path: 'analytics', label: 'Analytics', icon: '📈' },
  { path: 'settings', label: 'Settings', icon: '⚙️' },
];

function SidebarContent({ currentPath, setMobileMenuOpen, user, signOut }) {
  const { hasReceivedServerSnapshot, error, triggerFetch } = useAdminSitesCatalog();
  
  let statusColor = '#F5A623'; // Connecting
  let statusText = 'Connecting';
  if (hasReceivedServerSnapshot) {
    statusColor = '#4ADE80';
    statusText = 'Live';
  } else if (error) {
    statusColor = '#F87171';
    statusText = 'Offline';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '0 8px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/sites-icons/pwa-192x192.png" alt="Logo" style={{ width: 30, height: 30, borderRadius: 8 }} />
          <span style={{ color: '#F0F2F5', fontWeight: 600, fontSize: 17 }}>Admin Panel</span>
        </div>
      </div>
      <a
        href="/websites"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '10px 14px', marginBottom: 16, borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(245,166,35,0.12) 100%)',
          border: '1px solid rgba(212,175,55,0.35)', color: '#F5D061',
          textDecoration: 'none', fontSize: 13, fontWeight: 700,
          transition: 'all 0.2s',
        }}
      >
        <span>🌐</span>
        <span>View Live Sites Homepage</span>
      </a>
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath === item.path || (item.path === '' && currentPath === '');
          return (
            <Link
              key={item.path}
              to={`/admin${item.path ? `/${item.path}` : ''}`}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                borderRadius: 12, textDecoration: 'none',
                backgroundColor: isActive ? 'rgba(245,166,35,.1)' : 'transparent',
                color: isActive ? '#F5A623' : 'rgba(255,255,255,.62)',
                transition: 'all 0.2s'
              }}
            >
              <span>{item.icon}</span>
              <span style={{ fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div style={{ marginTop: 'auto', paddingTop: 24, paddingBottom: 16, display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, fontSize: 13, color: 'rgba(255,255,255,0.62)' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusColor }} />
        <span>{statusText}</span>
        {error && (
          <button onClick={() => triggerFetch()} style={{ background: 'none', border: 'none', color: '#F5A623', cursor: 'pointer', fontSize: 13, textDecoration: 'underline', padding: 0, marginLeft: 4 }}>
            Retry
          </button>
        )}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '0 8px' }}>
          {user?.photoURL ? (
            <div style={{ position: 'relative', width: 32, height: 32 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F0F2F5', fontSize: '14px', fontWeight: 'bold' }}>
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <img 
                src={user.photoURL} 
                alt="Admin Profile" 
                style={{ position: 'absolute', inset: 0, width: 32, height: 32, borderRadius: '50%', opacity: 0, transition: 'opacity 0.2s' }} 
                onLoad={(e) => { e.target.style.opacity = 1; }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F0F2F5', fontSize: '14px', fontWeight: 'bold' }}>
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
          )}
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: '#F0F2F5', fontSize: 14, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.displayName || 'Admin'}</div>
            <div style={{ color: 'rgba(255,255,255,.38)', fontSize: 12, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.email}</div>
          </div>
        </div>
        <button
          onClick={signOut}
          style={{
            width: '100%', padding: '10px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,.05)',
            border: '1px solid rgba(255,255,255,.08)', color: '#F0F2F5', cursor: 'pointer', textAlign: 'center'
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function SitesAdminLayout({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const signOut = async () => {
    const { getFirebaseAuth, signOut: fbSignOut } = await import('../../firebase.js');
    const auth = getFirebaseAuth();
    await fbSignOut(auth);
  };

  const getActivePath = () => {
    const parts = location.pathname.split('/admin');
    const path = parts[1] ? parts[1].substring(1) : '';
    return path.replace(/^\//, '');
  };

  const currentPath = getActivePath();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#080B14', fontFamily: 'system-ui, sans-serif' }}>
      <aside style={{
        display: 'none', width: 240, backgroundColor: 'rgba(10,14,23,.97)', borderRight: '1px solid rgba(255,255,255,.08)',
        position: 'sticky', top: 0, height: '100vh',
        '@media (min-width: 768px)': { display: 'block' }
      }}>
        <SidebarContent
          currentPath={currentPath}
          setMobileMenuOpen={setMobileMenuOpen}
          user={user}
          signOut={signOut}
        />
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px',
          backgroundColor: 'rgba(10,14,23,.97)', borderBottom: '1px solid rgba(255,255,255,.08)',
          position: 'sticky', top: 0, zIndex: 10,
          '@media (min-width: 768px)': { display: 'none' }
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/sites-icons/pwa-192x192.png" alt="Logo" style={{ width: 28, height: 28, borderRadius: 8 }} />
            <span style={{ color: '#F0F2F5', fontWeight: 600 }}>STEA Admin</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            style={{ background: 'none', border: 'none', color: '#F0F2F5', cursor: 'pointer', fontSize: 24 }}
          >
            ☰
          </button>
        </header>

        {mobileMenuOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
            <div 
              style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} 
              onClick={() => setMobileMenuOpen(false)}
            />
            <div style={{ position: 'relative', width: 280, backgroundColor: 'rgba(10,14,23,.97)', height: '100%', transform: 'translateX(0)', transition: 'transform 0.3s' }}>
              <SidebarContent
                currentPath={currentPath}
                setMobileMenuOpen={setMobileMenuOpen}
                user={user}
                signOut={signOut}
              />
            </div>
          </div>
        )}

        <main style={{ flex: 1, padding: 24, overflowX: 'hidden' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (min-width: 768px) {
          aside { display: block !important; }
          header { display: none !important; }
        }
      `}</style>
    </div>
  );
}
