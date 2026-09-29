import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import SEOHead from '../components/SEOHead.jsx';
import STEAHeader from "../components/shared/STEAHeader.jsx";

const CATS = ['💼 Jobs', '⚡ Gigs', '🎓 Internships', '🧑‍💻 Freelance Work', '📢 Opportunities', '📝 Career Tips'];

export default function SteaGigsKaziPage() {
  const { user } = useAuth(); const navigate = useNavigate(); const [query, setQuery] = useState('');
  return <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#111827', fontFamily: "'Instrument Sans',system-ui,sans-serif" }}>
    <SEOHead title="STEA Gigs & Kazi" description="Jobs, gigs, internships and freelance opportunities." />
    <STEAHeader title="Gigs & Kazi" user={user} primaryAction={<button onClick={() => navigate('/contact')} style={{ padding: '9px 11px', border: 0, borderRadius: 10, background: '#2563EB', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Post</button>} />
    <main style={{ width: 'min(1120px,100%)', margin: '0 auto', padding: '28px 16px 52px' }}><section style={{ marginBottom: 20 }}><p style={{ margin: '0 0 7px', color: '#9A7700', fontSize: 11, fontWeight: 900, letterSpacing: '.13em', textTransform: 'uppercase' }}>Opportunity hub</p><h1 style={{ margin: 0, fontSize: 'clamp(30px,7vw,48px)', letterSpacing: '-.05em' }}>Find your next opportunity.</h1><p style={{ margin: '10px 0 0', color: '#4B5563', fontSize: 15 }}>Jobs, gigs, internships and freelance work for emerging talent.</p></section><section style={{ padding: 14, border: '1px solid #E5E7EB', borderRadius: 16, background: '#fff' }}><div style={{ height: 46, display: 'flex', alignItems: 'center', gap: 10, padding: '0 13px', border: '1px solid #E5E7EB', borderRadius: 11, background: '#F8FAFC' }}><Search size={18} color="#2563EB" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search opportunities" style={{ width: '100%', border: 0, outline: 0, background: 'transparent', fontSize: 14 }} /></div></section><section style={{ marginTop: 24 }}><h2 style={{ fontSize: 19 }}>Browse opportunities</h2><div style={{ padding: '42px 20px', textAlign: 'center', border: '1px dashed #CBD5E1', borderRadius: 16, background: '#fff', color: '#6B7280' }}>No opportunities available yet. New gigs and jobs are coming soon.</div></section><section style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10 }}>{CATS.map((item) => <div key={item} style={{ padding: 12, border: '1px solid #E5E7EB', borderRadius: 12, background: '#fff', fontSize: 13, fontWeight: 800 }}>{item}</div>)}</section></main>
  </div>;
}
