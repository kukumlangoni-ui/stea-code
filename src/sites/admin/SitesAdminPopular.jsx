import React, { useState } from 'react';
import { useAdminSitesCatalog } from './useAdminSitesCatalog.js';
import { useAuth } from '../../hooks/useAuth.js';
import { logAdminActivity } from '../../utils/siteAnalytics.js';

export default function SitesAdminPopular() {
  const { websites, initialLoadDone } = useAdminSitesCatalog();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const togglePopular = async (site) => {
    const isPop = site.isPopular === true || site.popular === true;
    const newPop = !isPop;
    try {
      const { getFirebaseDb, doc, setDoc } = await import('../../firebase.js');
      const db = getFirebaseDb();
      await setDoc(doc(db, "websites", site.id), { isPopular: newPop, popular: newPop }, { merge: true });
      await logAdminActivity(user, 'popular_toggled', 'website', site.id, { newPop });
      alert("Updated popular status.");
    } catch (e) {
      alert("Failed to update popular state");
    }
  };

  const popularSites = websites.filter(w => w.isPopular === true || w.popular === true);
  
  const searchResults = search.trim().length > 1 
    ? websites.filter(w => w.name.toLowerCase().includes(search.toLowerCase()) && !(w.isPopular || w.popular))
    : [];

  const isBooting = !initialLoadDone && websites.length === 0;

  return (
    <div style={{ color: '#F0F2F5', maxWidth: 1000 }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Popular Apps</h1>
      <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>Manage canonical popular apps. Current: {popularSites.length}</p>
      
      {isBooting ? <p>Loading canonical catalog...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Current Popular */}
          <div>
            <h2 style={{ fontSize: 18, marginBottom: 16 }}>Currently Popular ({popularSites.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {popularSites.length === 0 ? <p style={{ color: 'rgba(255,255,255,0.4)' }}>No popular apps.</p> : null}
              {popularSites.map(site => (
                <div key={site.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{site.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{site.url || site.domain}</div>
                  </div>
                  <button onClick={() => togglePopular(site)} style={{ padding: '6px 12px', background: 'rgba(220,53,69,0.2)', color: '#ff6b6b', border: '1px solid rgba(220,53,69,0.3)', borderRadius: 6, cursor: 'pointer' }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Add to Popular */}
          <div>
            <h2 style={{ fontSize: 18, marginBottom: 16 }}>Add to Popular</h2>
            <input 
              type="text" 
              placeholder="Search website catalog..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: '#111', color: '#fff', border: '1px solid #333', borderRadius: 8, marginBottom: 16 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {searchResults.slice(0, 10).map(site => (
                <div key={site.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{site.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{site.url || site.domain}</div>
                  </div>
                  <button onClick={() => togglePopular(site)} style={{ padding: '6px 12px', background: 'rgba(245,166,35,0.1)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 6, cursor: 'pointer' }}>
                    Add to Popular
                  </button>
                </div>
              ))}
              {search.trim().length > 1 && searchResults.length === 0 && (
                <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 20 }}>No matches found in catalog.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
