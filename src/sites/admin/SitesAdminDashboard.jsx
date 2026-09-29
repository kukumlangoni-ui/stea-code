import React, { useState, useEffect } from 'react';
import { useAdminSitesCatalog } from './useAdminSitesCatalog.js';
import { useWebsiteCategories } from '../../hooks/useWebsiteCategories.js';

export default function SitesAdminDashboard() {
  const { websites, initialLoadDone } = useAdminSitesCatalog();
  const { categories } = useWebsiteCategories(websites);
  
  const [stats, setStats] = useState({
    members: null,
    pendingSubmissions: null,
    searchesToday: null,
    zeroResultQueries: null
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchUsers = async (db, collection, getDocs) => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        if (isMounted) setStats(s => ({ ...s, members: usersSnap.size }));
      } catch (e) {
        if (isMounted) setStats(s => ({ ...s, members: 'Error' }));
      }
    };
    
    const fetchPending = async (db, collection, query, where, getDocs) => {
      try {
        const pendingSnap = await getDocs(query(collection(db, 'websiteSubmissions'), where('status', '==', 'pending')));
        if (isMounted) setStats(s => ({ ...s, pendingSubmissions: pendingSnap.size }));
      } catch (e) {
        if (isMounted) setStats(s => ({ ...s, pendingSubmissions: 'Error' }));
      }
    };
    
    const fetchSearches = async (db, doc, getDoc) => {
      try {
        // Use daily summary for today
        const today = new Date().toISOString().split('T')[0];
        const dayRef = doc(db, 'sites_analytics_daily', today);
        const daySnap = await getDoc(dayRef);
        if (isMounted) {
          if (daySnap.exists()) {
            const d = daySnap.data();
            setStats(s => ({ ...s, searchesToday: d.searchCount || 0, zeroResultQueries: d.zeroResultCount || 0 }));
          } else {
            setStats(s => ({ ...s, searchesToday: 0, zeroResultQueries: 0 }));
          }
        }
      } catch (e) {
        if (isMounted) setStats(s => ({ ...s, searchesToday: 'Error', zeroResultQueries: 'Error' }));
      }
    };
    
    const fetchStats = async () => {
      try {
        const { getFirebaseDb, collection, getDocs, query, where, doc, getDoc } = await import('../../firebase.js');
        const db = getFirebaseDb();
        
        // Load independently so one failure doesn't block others
        fetchUsers(db, collection, getDocs);
        fetchPending(db, collection, query, where, getDocs);
        fetchSearches(db, doc, getDoc);
        
        if (isMounted) setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();
    return () => { isMounted = false; };
  }, []);

  const StatCard = ({ title, value, color }) => (
    <div style={{ 
      backgroundColor: 'rgba(10,14,23,.97)', 
      border: '1px solid rgba(255,255,255,.08)', 
      borderRadius: 16, 
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }}>
      <div style={{ color: 'rgba(255,255,255,.62)', fontSize: 14, fontWeight: 500 }}>{title}</div>
      <div style={{ color: color || '#F0F2F5', fontSize: 32, fontWeight: 700 }}>
        {value === null ? '—' : value}
      </div>
    </div>
  );

  const published = websites.filter(w => w.status !== 'draft');
  const drafts = websites.filter(w => w.status === 'draft');
  const featured = websites.filter(w => w.featured === true);
  const developers = websites.filter(w => w.category === 'developers');
  const recentSites = websites.sort((a, b) => (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0) - (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0)).slice(0, 10);

  return (
    <div style={{ color: '#F0F2F5' }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, margin: '0 0 24px 0' }}>Dashboard Overview</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
        gap: 20,
        marginBottom: 40
      }}>
        <StatCard title="Total Websites" value={websites.length} color="#F5A623" />
        <StatCard title="Published" value={published.length} color="#4ADE80" />
        <StatCard title="Drafts" value={drafts.length} color="#F87171" />
        <StatCard title="Featured" value={featured.length} color="#FFD17C" />
        <StatCard title="Categories" value={categories.length} />
        <StatCard title="Developer Resources" value={developers.length} />
        <StatCard title="Members" value={stats.members} />
        <StatCard title="Pending Submissions" value={stats.pendingSubmissions} color="#60A5FA" />
        <StatCard title="Recent Searches" value={stats.searchesToday} color="#818CF8" />
        <StatCard title="Zero Results" value={stats.zeroResultQueries} color="#F472B6" />
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 16px 0' }}>Recent Websites</h2>
      <div style={{ 
        backgroundColor: 'rgba(10,14,23,.97)', 
        border: '1px solid rgba(255,255,255,.08)', 
        borderRadius: 16,
        overflow: 'hidden'
      }}>
        {!initialLoadDone && websites.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.38)' }}>Loading recent websites...</div>
        ) : recentSites.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.38)' }}>No websites found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,.08)', backgroundColor: 'rgba(255,255,255,.02)' }}>
                <th style={{ padding: '16px 20px', textAlign: 'left', color: 'rgba(255,255,255,.62)', fontWeight: 500, fontSize: 13, textTransform: 'uppercase' }}>Name</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', color: 'rgba(255,255,255,.62)', fontWeight: 500, fontSize: 13, textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', color: 'rgba(255,255,255,.62)', fontWeight: 500, fontSize: 13, textTransform: 'uppercase' }}>Category</th>
              </tr>
            </thead>
            <tbody>
              {recentSites.map(site => (
                <tr key={site.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 500 }}>{site.name || 'Unnamed'}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,.38)', marginTop: 4 }}>{site.url || site.domain || 'No URL'}</div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                      backgroundColor: site.status === 'published' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                      color: site.status === 'published' ? '#4ADE80' : '#F87171'
                    }}>
                      {site.status || 'draft'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'rgba(255,255,255,.62)', fontSize: 14 }}>
                    {site.category || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
