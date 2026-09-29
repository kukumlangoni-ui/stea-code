import React, { useState, useEffect, useMemo } from 'react';

export default function SitesAdminMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let unsubscribe = null;
    let isMounted = true;
    const fetchMembers = async () => {
      try {
        const { getFirebaseDb, collection, onSnapshot } = await import('../../firebase.js');
        const db = getFirebaseDb();
        unsubscribe = onSnapshot(collection(db, "users"), (snap) => {
          if (!isMounted) return;
          const list = [];
          snap.forEach(doc => {
            const d = doc.data();
            list.push({ 
              id: doc.id, 
              name: d.name || d.displayName || 'Unknown',
              email: d.email || 'No email',
              role: d.role || 'user',
              provider: d.provider || 'email',
              joinDate: d.createdAt?.toDate ? d.createdAt.toDate().toLocaleDateString() : 'N/A',
              lastLogin: d.lastLogin?.toDate ? d.lastLogin.toDate().toLocaleDateString() : 'N/A'
            });
          });
          setMembers(list);
          setLoading(false);
        });
      } catch (e) {
        console.error("Failed to fetch users", e);
        if (isMounted) setLoading(false);
      }
    };
    fetchMembers();
    return () => { 
      isMounted = false; 
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members;
    const lower = search.toLowerCase();
    return members.filter(m => 
      m.name.toLowerCase().includes(lower) || 
      m.email.toLowerCase().includes(lower)
    );
  }, [search, members]);

  return (
    <div style={{ color: '#F0F2F5' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Users ({members.length})</h1>
        <input 
          type="text" 
          placeholder="Search by name or email..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', width: 250 }}
        />
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,.1)' }}>
              <th style={{ padding: 12 }}>Name</th>
              <th style={{ padding: 12 }}>Email</th>
              <th style={{ padding: 12 }}>Join Date</th>
              <th style={{ padding: 12 }}>Last Login</th>
              <th style={{ padding: 12 }}>Provider</th>
              <th style={{ padding: 12 }}>Role</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map(member => (
              <tr key={member.id} style={{ borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                <td style={{ padding: 12 }}>{member.name}</td>
                <td style={{ padding: 12 }}>{member.email}</td>
                <td style={{ padding: 12 }}>{member.joinDate}</td>
                <td style={{ padding: 12 }}>{member.lastLogin}</td>
                <td style={{ padding: 12 }}>{member.provider}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: 4, 
                    background: member.role === 'admin' || member.role === 'super_admin' ? '#0f5132' : 'rgba(255,255,255,.1)',
                    color: '#fff', fontSize: 12
                  }}>
                    {member.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
