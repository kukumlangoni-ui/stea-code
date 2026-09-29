import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell } from 'lucide-react';
import { useCollection } from '../hooks/useFirestore.js';
import { Skeleton } from '../components/Skeleton.jsx';
import { useMobile } from '../hooks/useMobile.js';

const G  = '#F5A623';

const W = ({ children }) => (
  <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(16px,4vw,40px)' }}>
    {children}
  </div>
);

export default function NewsUpdatesPage({ goPage }) {
  const isMobile = useMobile();
  const { docs: updatesDocs, loading: uLoading } = useCollection('updates', 'createdAt');
  const { docs: postsDocs, loading: pLoading } = useCollection('posts', 'createdAt');

  const updates = useMemo(() => {
    const combined = [...updatesDocs, ...postsDocs].filter(d => d.status !== 'draft' && d.status !== 'rejected');
    const unique = combined.filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i);
    return unique.sort((a, b) => {
      const tsA = a.createdAt?.seconds || (a.createdAt?.toDate ? a.createdAt.toDate().getTime() / 1000 : 0);
      const tsB = b.createdAt?.seconds || (b.createdAt?.toDate ? b.createdAt.toDate().getTime() / 1000 : 0);
      return tsB - tsA;
    });
  }, [updatesDocs, postsDocs]);

  const loading = uLoading || pLoading;

  return (
    <div style={{ minHeight: '100vh', background: '#05060a', color: '#fff' }}>
      <div style={{ padding: 'clamp(100px, 12vw, 120px) 0 40px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
        
        <W>
          {goPage && (
            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.08)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => goPage('home')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)', color: '#fff', cursor: 'pointer',
                marginBottom: 24,
              }}
            >
              <ArrowLeft size={20} />
            </motion.button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: 16, background: `${G}15`, border: `1px solid ${G}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={24} color={G} />
            </div>
            <div>
              <h1 style={{ fontSize: isMobile ? 28 : 36, fontWeight: 900, margin: 0, padding: 0, fontFamily: "'Bricolage Grotesque', sans-serif" }}>Platform News & Updates</h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', margin: '4px 0 0 0', fontSize: 15 }}>Latest announcements, insights, and releases from STEA.</p>
            </div>
          </div>
        </W>
      </div>

      <W>
        <div style={{ padding: '40px 0', minHeight: '60vh' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} style={{ height: 200, borderRadius: 16 }} />)}
            </div>
          ) : updates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,.4)' }}>
              No updates available at the moment.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {updates.map(item => (
                <div key={item.id} onClick={() => goPage('tips')} style={{
                  background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)',
                  padding: 20, cursor: 'pointer', transition: 'all .2s'
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: G, textTransform: 'uppercase', marginBottom: 10 }}>
                    {item.badge || item.category || 'News'}
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 10px', lineHeight: 1.4 }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.summary || item.description || ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </W>
    </div>
  );
}
