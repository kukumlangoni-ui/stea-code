import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Download, FileText, Search, Upload } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import SEOHead from '../components/SEOHead.jsx';
import UploadDocumentModal from '../components/UploadDocumentModal.jsx';
import STEAHeader from "../components/shared/STEAHeader.jsx";
import { db, collection, query, orderBy, onSnapshot } from '../firebase.js';

const LEVELS = ['O-Level', 'A-Level', 'University', 'Primary', 'Other'];
const CLASSES = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Other'];
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Geography', 'History', 'Civics', 'English', 'Kiswahili', 'Other'];

function NoteCard({ note }) {
  const fileUrl = note.fileUrl || note.url || '';
  return <article onMouseEnter={(event) => { event.currentTarget.style.transform = 'translateY(-3px)'; event.currentTarget.style.boxShadow = '0 18px 36px rgba(17,24,39,.10)'; }} onMouseLeave={(event) => { event.currentTarget.style.transform = 'translateY(0)'; event.currentTarget.style.boxShadow = '0 8px 22px rgba(17,24,39,.05)'; }} style={{ minHeight: 215, padding: 18, display: 'flex', flexDirection: 'column', border: '1px solid #E5E7EB', borderRadius: 16, background: '#FFFFFF', boxShadow: '0 8px 22px rgba(17,24,39,.05)', transition: 'transform .18s ease, box-shadow .18s ease' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}><div style={{ width: 40, height: 40, display: 'grid', placeItems: 'center', flexShrink: 0, borderRadius: 12, background: 'rgba(37,99,235,.10)', color: '#2563EB' }}><BookOpen size={19} /></div><div style={{ minWidth: 0 }}><span style={{ display: 'block', color: '#2563EB', fontSize: 10, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' }}>{note.subject || 'Study note'} · {note.classForm || note.level || 'General'}</span><h2 style={{ margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 16, letterSpacing: '-.02em' }}>{note.title || 'Untitled note'}</h2></div></div>
    <p style={{ flex: 1, margin: '13px 0', color: '#4B5563', fontSize: 13, lineHeight: 1.55 }}>{note.topic ? `Topic: ${note.topic}` : note.description || 'Study material for this subject.'}</p>
    <div style={{ display: 'flex', gap: 8 }}><a href={fileUrl || undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!fileUrl} style={{ flex: 1, padding: '9px 10px', borderRadius: 10, background: '#2563EB', color: '#FFFFFF', textAlign: 'center', textDecoration: 'none', fontSize: 12, fontWeight: 800, pointerEvents: fileUrl ? 'auto' : 'none', opacity: fileUrl ? 1 : .55 }}><FileText size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />View</a><a href={fileUrl || undefined} download aria-disabled={!fileUrl} style={{ width: 39, display: 'grid', placeItems: 'center', border: '1px solid #D4AF37', borderRadius: 10, color: '#8F6D00', background: '#FFFFFF', pointerEvents: fileUrl ? 'auto' : 'none', opacity: fileUrl ? 1 : .55 }} title="Download"><Download size={15} /></a></div>
  </article>;
}

export default function EducationNotesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [classForm, setClassForm] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'education_notes'), orderBy('createdAt', 'desc')), (snapshot) => { setNotes(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))); setLoading(false); }, () => setLoading(false));
    return unsubscribe;
  }, []);

  const topics = useMemo(() => [...new Set(notes.map((note) => note.topic).filter(Boolean))].sort(), [notes]);
  const visibleNotes = useMemo(() => notes.filter((note) => {
    const queryText = `${note.title || ''} ${note.subject || ''} ${note.topic || ''}`.toLowerCase();
    return (!level || note.level === level) && (!classForm || note.classForm === classForm) && (!subject || note.subject === subject) && (!topic || note.topic === topic) && (!search || queryText.includes(search.toLowerCase()));
  }), [notes, search, level, classForm, subject, topic]);
  const featured = visibleNotes.filter((note) => note.featured).concat(visibleNotes.filter((note) => !note.featured)).slice(0, 3);
  const recent = visibleNotes.filter((note) => !featured.some((item) => item.id === note.id));
  const selectStyle = { width: '100%', height: 42, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 10, background: '#FFFFFF', color: '#374151', fontSize: 13, outline: 'none' };

  return <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#111827', fontFamily: "'Instrument Sans', system-ui, sans-serif" }}>
    <SEOHead title="STEA Notes" description="Find study notes by level, subject, topic, and class." />
    <STEAHeader title="Notes" user={user} />
    <main style={{ width: 'min(1120px, 100%)', margin: '0 auto', padding: '30px 16px 48px' }}>
      <section style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}><div><p style={{ margin: '0 0 7px', color: '#9A7700', fontSize: 11, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>Study library</p><h1 style={{ margin: 0, fontSize: 'clamp(28px, 6vw, 42px)', letterSpacing: '-.045em' }}>Find the notes you need.</h1></div><button type="button" onClick={() => user ? setShowUpload(true) : window.dispatchEvent(new CustomEvent('open-auth'))} style={{ padding: '10px 13px', border: 0, borderRadius: 10, background: '#D4AF37', color: '#111827', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}><Upload size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />Upload note</button></section>
      <section style={{ padding: 14, marginBottom: 26, border: '1px solid #E5E7EB', borderRadius: 16, background: '#FFFFFF', boxShadow: '0 6px 18px rgba(17,24,39,.04)' }}><div style={{ height: 46, display: 'flex', alignItems: 'center', gap: 10, padding: '0 13px', border: '1px solid #E5E7EB', borderRadius: 11, background: '#F8FAFC' }}><Search size={18} color="#2563EB" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notes, subjects or topics" style={{ width: '100%', border: 0, outline: 0, background: 'transparent', color: '#111827', fontSize: 14 }} /></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 10, marginTop: 12 }}><select value={level} onChange={(event) => setLevel(event.target.value)} style={selectStyle}><option value="">All levels</option>{LEVELS.map((value) => <option key={value}>{value}</option>)}</select><select value={classForm} onChange={(event) => setClassForm(event.target.value)} style={selectStyle}><option value="">All classes/forms</option>{CLASSES.map((value) => <option key={value}>{value}</option>)}</select><select value={subject} onChange={(event) => setSubject(event.target.value)} style={selectStyle}><option value="">All subjects</option>{SUBJECTS.map((value) => <option key={value}>{value}</option>)}</select><select value={topic} onChange={(event) => setTopic(event.target.value)} style={selectStyle}><option value="">All topics</option>{topics.map((value) => <option key={value}>{value}</option>)}</select></div></section>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading notes...</div> : visibleNotes.length === 0 ? <div style={{ padding: '48px 20px', textAlign: 'center', border: '1px dashed #CBD5E1', borderRadius: 16, background: '#FFFFFF', color: '#6B7280' }}>No notes available yet. New study notes are coming soon.</div> : <><section><h2 style={{ margin: '0 0 13px', fontSize: 19 }}>Featured Notes</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>{featured.map((note) => <NoteCard key={note.id} note={note} />)}</div></section>{recent.length > 0 && <section style={{ marginTop: 30 }}><h2 style={{ margin: '0 0 13px', fontSize: 19 }}>Recent Notes</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>{recent.map((note) => <NoteCard key={note.id} note={note} />)}</div></section>}</>}
    </main>
    <UploadDocumentModal isOpen={showUpload} onClose={() => setShowUpload(false)} type="notes" />
  </div>;
}
