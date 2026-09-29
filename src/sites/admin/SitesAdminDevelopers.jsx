import React, { useState } from 'react';
import { useAdminSitesCatalog } from './useAdminSitesCatalog.js';
import { useAuth } from '../../hooks/useAuth.js';
import { logAdminActivity } from '../../utils/siteAnalytics.js';

const DEV_SUBCATEGORIES = [
  'Vibe Coding & AI Dev', 'Code Editors & IDEs', 'Version Control', 'APIs & Services',
  'Web Development', 'App Development', 'Backend Development', 'Databases',
  'Cloud Platforms', 'Deployment & DevOps', 'Hosting & Domains', 'UI/UX & Design Tools',
  'Testing & Debugging', 'Performance & Monitoring', 'Security', 'Documentation & Learning',
  'Community & Q&A', 'Blocks & Components', 'Open Source', 'Developer News'
];

export default function SitesAdminDevelopers() {
  const { websites, initialLoadDone } = useAdminSitesCatalog();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(DEV_SUBCATEGORIES[0]);

  const toggleStatus = async (site) => {
    const newStatus = site.status === 'published' ? 'draft' : 'published';
    try {
      const { getFirebaseDb, doc, setDoc } = await import('../../firebase.js');
      const db = getFirebaseDb();
      await setDoc(doc(db, "websites", site.id), { status: newStatus }, { merge: true });
      await logAdminActivity(user, 'dev_resource_toggled', 'website', site.id, { newStatus });
      alert("Status updated! Will reflect locally in a moment.");
    } catch (e) {
      alert("Failed to update status");
    }
  };

  const devSites = websites.filter(w => w.category === 'developers');
  const filtered = devSites.filter(w => {
    const sub = w.subcategory || w.subcategorySlug || '';
    const tabSlug = activeTab.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and');
    return sub.toLowerCase() === activeTab.toLowerCase() || sub.toLowerCase() === tabSlug;
  });

  const isBooting = !initialLoadDone && websites.length === 0;

  return (
    <div style={{ color: '#F0F2F5' }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Developer Resources</h1>
      <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>Total resources: {devSites.length} / 48 baseline</p>
      
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        {DEV_SUBCATEGORIES.map(sub => {
          const tabSlug = sub.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and');
          const count = devSites.filter(w => {
            const wsub = w.subcategory || w.subcategorySlug || '';
            return wsub.toLowerCase() === sub.toLowerCase() || wsub.toLowerCase() === tabSlug;
          }).length;
          
          return (
            <button 
              key={sub}
              onClick={() => setActiveTab(sub)}
              style={{
                padding: '8px 16px',
                background: activeTab === sub ? '#F5A623' : 'rgba(255,255,255,0.05)',
                color: activeTab === sub ? '#000' : '#fff',
                border: 'none',
                borderRadius: 20,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                fontWeight: activeTab === sub ? 600 : 400
              }}
            >
              {sub} ({count})
            </button>
          );
        })}
      </div>

      {isBooting ? (
        <p>Loading canonical catalog...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,.1)' }}>
              <th style={{ padding: 12 }}>Name</th>
              <th style={{ padding: 12 }}>URL</th>
              <th style={{ padding: 12 }}>Status</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No resources found in this subcategory.</td></tr>
            ) : filtered.map(site => (
              <tr key={site.id} style={{ borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                <td style={{ padding: 12, fontWeight: 500 }}>{site.name}</td>
                <td style={{ padding: 12, color: 'rgba(255,255,255,0.6)' }}>{site.url || site.domain}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: 4, 
                    background: site.status === 'published' ? '#0f5132' : '#842029',
                    color: '#fff', fontSize: 12
                  }}>
                    {site.status || 'draft'}
                  </span>
                </td>
                <td style={{ padding: 12 }}>
                  <button onClick={() => toggleStatus(site)} style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: 4, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none' }}>
                    {site.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
