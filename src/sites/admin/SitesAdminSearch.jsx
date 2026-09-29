import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.js';

export default function SitesAdminSearch() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingSiteFor, setAddingSiteFor] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchEvents = async () => {
      try {
        const { getFirebaseDb, collection, getDocs, query, orderBy, limit } = await import('../../firebase.js');
        const db = getFirebaseDb();
        const snap = await getDocs(query(collection(db, "siteSearchEvents"), orderBy("timestamp", "desc"), limit(500)));
        if (!isMounted) return;
        const list = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        setEvents(list);
      } catch (e) {
        console.error("Failed to fetch search events", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchEvents();
    return () => { isMounted = false; };
  }, []);

  const totalSearches = events.length;
  const zeroResults = events.filter(e => e.resultCount === 0);
  
  // Aggregate zero results
  const zeroResultMap = {};
  zeroResults.forEach(e => {
    const q = e.normalizedQuery || e.query;
    if (!q) return;
    if (!zeroResultMap[q]) zeroResultMap[q] = { query: q, count: 0, lastSearched: e.timestamp?.toDate() || new Date() };
    zeroResultMap[q].count += 1;
    const dt = e.timestamp?.toDate();
    if (dt && dt > zeroResultMap[q].lastSearched) zeroResultMap[q].lastSearched = dt;
  });
  
  const topZeroResults = Object.values(zeroResultMap).sort((a, b) => b.count - a.count);

  const resolveQuery = async (queryObj) => {
    alert("In a full flow, this opens the Website Editor prefilled with keywords: " + queryObj.query);
    setAddingSiteFor(null);
  };

  return (
    <div style={{ color: '#F0F2F5' }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Search Analytics & Growth</h1>
      
      {loading ? <p>Loading real search data...</p> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 24, borderRadius: 12 }}>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Recent Searches (500 limit)</div>
              <div style={{ fontSize: 32, fontWeight: 'bold' }}>{totalSearches}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 24, borderRadius: 12 }}>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Zero-Result Queries</div>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#ff6b6b' }}>{zeroResults.length}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 24, borderRadius: 12 }}>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Miss Rate</div>
              <div style={{ fontSize: 32, fontWeight: 'bold' }}>
                {totalSearches > 0 ? Math.round((zeroResults.length / totalSearches) * 100) : 0}%
              </div>
            </div>
          </div>

          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Zero-Result Opportunity Workflow</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>Turn unmet search demand into catalog growth. Add sites for these terms.</p>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,.1)' }}>
                <th style={{ padding: 12 }}>Unmet Query</th>
                <th style={{ padding: 12 }}>Search Count</th>
                <th style={{ padding: 12 }}>Last Searched</th>
                <th style={{ padding: 12 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {topZeroResults.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No zero-result searches found! Great job.</td></tr>
              ) : topZeroResults.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                  <td style={{ padding: 12, fontWeight: 500, color: '#F5A623' }}>"{item.query}"</td>
                  <td style={{ padding: 12 }}>{item.count}</td>
                  <td style={{ padding: 12, color: 'rgba(255,255,255,0.6)' }}>{item.lastSearched?.toLocaleDateString()}</td>
                  <td style={{ padding: 12 }}>
                    <button onClick={() => resolveQuery(item)} style={{ padding: '6px 12px', background: '#F5A623', color: '#000', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
                      Add Website
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
