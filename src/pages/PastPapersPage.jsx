import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getFirebaseDb } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Search, Loader2, ArrowLeft, FileText } from 'lucide-react';
import { ResourceCard } from './ExamsHubPage';
import { useAuth } from '../hooks/useAuth.js';

const G = "#f5a623";

export default function PastPapersPage() {
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const { user } = useAuth();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState(initialQ);
  
  const [filters, setFilters] = useState({
    level: 'All',
    subject: 'All',
    year: 'All'
  });

  const db = getFirebaseDb();

  useEffect(() => {
    const fetchPapers = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'study_resources'), where('type', '==', 'past_paper'));
        const snap = await getDocs(q);
        let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Content Approval Filter: Filter out pending/rejected past papers unless owner or admin
        data = data.filter(item => {
          if (item.status && item.status !== 'published' && item.status !== 'active') {
            if (user && item.authorId === user.uid) return true;
            return false;
          }
          return true;
        });

        // Sort by createdAt descending
        data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setItems(data);

        // Log Active User & Past Papers Area View Analytics
        if (db) {
          const { addDoc, collection: fsColl, serverTimestamp } = await import('firebase/firestore');
          addDoc(fsColl(db, 'analytics_events'), {
            type: 'page_view',
            page: 'past_papers_page',
            userId: user?.uid || 'guest',
            userEmail: user?.email || 'Anonymous Guest',
            createdAt: serverTimestamp()
          }).catch(err => console.warn(err));
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchPapers();
  }, [db, user]);

  const filteredItems = items.filter(item => {
    if (searchQ && !item.title.toLowerCase().includes(searchQ.toLowerCase()) && !item.subject?.toLowerCase().includes(searchQ.toLowerCase()) && !item.tags?.toLowerCase().includes(searchQ.toLowerCase())) return false;
    if (filters.level !== 'All' && item.level !== filters.level) return false;
    if (filters.subject !== 'All' && item.subject !== filters.subject) return false;
    if (filters.year !== 'All' && item.year !== filters.year) return false;
    return true;
  });

  const uniqueLevels = ['All', ...new Set(items.map(i => i.level).filter(Boolean))];
  const uniqueSubjects = ['All', ...new Set(items.map(i => i.subject).filter(Boolean))];
  const uniqueYears = ['All', ...new Set(items.map(i => i.year).filter(Boolean))].sort((a,b) => b-a);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0f", color: "#fff", padding: "clamp(72px,10vw,100px) clamp(16px,4vw,40px) 100px", overflowX: "hidden" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        
        <Link to="/exams" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.5)", textDecoration: "none", marginBottom: 32, fontWeight: 600 }}>
          <ArrowLeft size={16} /> Rudi Exams Hub
        </Link>

        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 40, fontWeight: 900, marginBottom: 16 }}>Past Papers</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, maxWidth: 600 }}>
            Tafuta na pakua mitihani iliyopita ya NECTA, Mock, na Pre-National kwa madarasa yote.
          </p>
        </div>

        {/* Search & Filters */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 24, padding: 24, marginBottom: 40 }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
            <div style={{ flex: "1 1 300px", position: "relative" }}>
              <Search size={20} style={{ position: "absolute", left: 16, top: 14, color: "rgba(255,255,255,0.4)" }} />
              <input 
                type="text" 
                placeholder="Tafuta mtihani..." 
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "14px 16px 14px 48px", color: "#fff", fontSize: 16, outline: "none" }}
              />
            </div>
          </div>
          
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>DARASA</label>
              <select value={filters.level} onChange={e => setFilters({...filters, level: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", color: "#fff", outline: "none", appearance: "none" }}>
                {uniqueLevels.map(l => <option key={l} value={l}>{l === 'All' ? 'Madarasa Yote' : l}</option>)}
              </select>
            </div>
            <div style={{ flex: "1 1 200px" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>SOMO</label>
              <select value={filters.subject} onChange={e => setFilters({...filters, subject: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", color: "#fff", outline: "none", appearance: "none" }}>
                {uniqueSubjects.map(s => <option key={s} value={s}>{s === 'All' ? 'Masomo Yote' : s}</option>)}
              </select>
            </div>
            <div style={{ flex: "1 1 200px" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>MWAKA</label>
              <select value={filters.year} onChange={e => setFilters({...filters, year: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", color: "#fff", outline: "none", appearance: "none" }}>
                {uniqueYears.map(y => <option key={y} value={y}>{y === 'All' ? 'Miaka Yote' : y}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <Loader2 size={40} color={G} className="animate-spin" style={{ margin: "0 auto 20px" }} />
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Inatafuta mitihani...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {filteredItems.map(item => (
              <ResourceCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 60, background: "rgba(255,255,255,0.02)", borderRadius: 24, border: "1px dashed rgba(255,255,255,0.1)" }}>
            <FileText size={48} color="rgba(255,255,255,0.2)" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Hakuna Mitihani Iliyopatikana</h3>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Jaribu kubadili maneno ya utafutaji au filters.</p>
          </div>
        )}

      </div>
    </div>
  );
}
