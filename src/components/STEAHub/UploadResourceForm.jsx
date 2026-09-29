import React, { useState, useEffect } from 'react';
import {
  getExactStorageErrorMessage,
  getFirebaseDb,
  logFirebaseStorageError,
  logStorageUpload,
  storage,
} from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Loader2, UploadCloud, X, Check, FileText, FileDown } from 'lucide-react';
import { motion } from 'framer-motion';

const G = "#F5A623";

const CATEGORIES = {
  past_paper: 'Past Paper',
  note: 'Study Note',
  material: 'General Resource',
  practice: 'Practice Exam'
};

const LEVELS = ['Primary', 'O-Level (Form 1-4)', 'A-Level (Form 5-6)', 'University', 'General'];

export function UploadResourceForm({ user, role, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [notice, setNotice] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [form, setForm] = useState({
    title: '',
    type: 'note',
    level: 'O-Level (Form 1-4)',
    subject: '',
    year: new Date().getFullYear().toString(),
    description: '',
    tags: ''
  });

  const showNotice = (type, message) => setNotice({ type, message });

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const handleAutoCategorize = () => {
    if (!form.title.trim()) {
      showNotice("error", "Tafadhali andika jina la faili kwanza (mfano: 'Form 4 Physics Past paper 2023')");
      return;
    }
    const t = form.title.toLowerCase();
    
    let level = 'General';
    if (t.includes('form 1') || t.includes('form one') || t.includes('f1') || t.includes('f-1')) level = 'O-Level (Form 1-4)';
    else if (t.includes('form 2') || t.includes('form two') || t.includes('f2') || t.includes('f-2')) level = 'O-Level (Form 1-4)';
    else if (t.includes('form 3') || t.includes('form three') || t.includes('f3') || t.includes('f-3')) level = 'O-Level (Form 1-4)';
    else if (t.includes('form 4') || t.includes('form four') || t.includes('f4') || t.includes('f-4') || t.includes('o-level')) level = 'O-Level (Form 1-4)';
    else if (t.includes('form 5') || t.includes('form five') || t.includes('f5') || t.includes('f-5')) level = 'A-Level (Form 5-6)';
    else if (t.includes('form 6') || t.includes('form six') || t.includes('f6') || t.includes('f-6') || t.includes('a-level')) level = 'A-Level (Form 5-6)';
    else if (t.includes('primary') || t.includes('darasa') || t.includes('std')) level = 'Primary';
    else if (t.includes('university') || t.includes('chuo') || t.includes('college')) level = 'University';

    let subject = '';
    if (t.includes('physics') || t.includes('fizikia')) subject = 'Physics';
    else if (t.includes('chemistry') || t.includes('kemia')) subject = 'Chemistry';
    else if (t.includes('biology') || t.includes('biolojia')) subject = 'Biology';
    else if (t.includes('mathematics') || t.includes('maths') || t.includes('math') || t.includes('hisabati')) subject = 'Mathematics';
    else if (t.includes('english') || t.includes('kiingereza')) subject = 'English';
    else if (t.includes('kiswahili')) subject = 'Kiswahili';
    else if (t.includes('history') || t.includes('historia')) subject = 'History';
    else if (t.includes('geography') || t.includes('jiografia')) subject = 'Geography';
    else if (t.includes('civics')) subject = 'Civics';
    else if (t.includes('commerce')) subject = 'Commerce';
    else if (t.includes('bookkeeping') || t.includes('book keeping')) subject = 'Bookkeeping';

    let year = new Date().getFullYear().toString();
    const yearMatch = t.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      year = yearMatch[1];
    }

    let type = 'note';
    if (t.includes('past paper') || t.includes('paper') || t.includes('mtihani') || t.includes('pastpaper')) type = 'past_paper';
    else if (t.includes('note') || t.includes('notes') || t.includes('summary')) type = 'note';
    else if (t.includes('quiz') || t.includes('practice') || t.includes('test') || t.includes('swali') || t.includes('maswali')) type = 'practice';

    const tagsArr = [];
    if (level !== 'General') tagsArr.push(level.replace(' (Form 1-4)', '').replace(' (Form 5-6)', ''));
    if (subject) tagsArr.push(subject);
    if (type) tagsArr.push(CATEGORIES[type] || type);
    if (year) tagsArr.push(year);
    if (t.includes('necta')) tagsArr.push('NECTA');

    setForm({
      ...form,
      level,
      subject: subject || form.subject,
      year: year || form.year,
      type,
      tags: tagsArr.join(', ')
    });
  };

  const hasChanges = form.title.trim() !== "" || form.description.trim() !== "" || file !== null;

  const handleCancelSafe = () => {
    if (hasChanges && !loading) {
       setConfirmDialog({
         title: "Discard changes?",
         message: "Una mabadiliko ambayo hayajahifadhiwa. Je, unataka kuondoka?",
         confirmText: "Discard",
         cancelText: "Keep editing",
         onConfirm: () => onCancel()
       });
    } else {
       onCancel();
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.title || !file) {
       showNotice("error", "Please provide a title and select a file.");
       return;
    }

    setLoading(true);
    try {
      const isTeacher = role === 'teacher' || role === 'admin';
      const status = isTeacher ? 'published' : 'pending_review';
      
      let downloadUrl = '';
      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const uploadPath = `resources/${user.uid}/${Date.now()}_${safeName}`;
        logStorageUpload(uploadPath);
        const fileRef = ref(storage, uploadPath);
        const snapshot = await uploadBytes(fileRef, file);
        downloadUrl = await getDownloadURL(snapshot.ref);
      }

      const db = getFirebaseDb();
      const payload = {
        title: form.title,
        type: form.type,
        level: form.level,
        subject: form.subject,
        year: form.year,
        description: form.description,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        status,
        published: status === 'published',
        downloadUrl,
        ownerId: user.uid,
        ownerName: user.displayName || 'STEA User',
        ownerRole: role,
        createdAt: serverTimestamp(),
        clicks: 0,
        downloads: 0
      };

      await addDoc(collection(db, 'study_resources'), payload);
      setLoading(false);
      onSuccess?.();
    } catch (err) {
      logFirebaseStorageError(err);
      showNotice("error", `Failed to upload resource. ${getExactStorageErrorMessage(err)}`);
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, margin: '20px 0' }}>
      {notice && (
        <div role="status" style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: notice.type === "error" ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)", color: notice.type === "error" ? "#fca5a5" : "#86efac", border: `1px solid ${notice.type === "error" ? "rgba(239,68,68,0.18)" : "rgba(16,185,129,0.18)"}`, fontSize: 13, fontWeight: 700 }}>
          {notice.message}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800 }}>Upload New Resource</h3>
        {onCancel && (
           <button type="button" onClick={handleCancelSafe} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
             <X size={20} />
           </button>
         )}
      </div>

      {confirmDialog && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", display: "grid", placeItems: "center", zIndex: 5000, padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 420, background: "#0c0e14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 24, color: "#fff" }}>
            <h3 style={{ marginTop: 0, fontSize: 20, fontWeight: 900 }}>{confirmDialog.title}</h3>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>{confirmDialog.message}</p>
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button type="button" onClick={() => setConfirmDialog(null)} style={{ flex: 1, background: "rgba(255,255,255,0.06)", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 800 }}>{confirmDialog.cancelText || "Cancel"}</button>
              <button type="button" onClick={() => { const fn = confirmDialog.onConfirm; setConfirmDialog(null); fn?.(); }} style={{ flex: 1, background: "#F5A623", color: "#000", border: "none", borderRadius: 10, padding: 12, fontWeight: 900 }}>{confirmDialog.confirmText || "Confirm"}</button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Title</label>
                <button
                  type="button"
                  onClick={handleAutoCategorize}
                  title="Auto-categorize from your title!"
                  style={{
                    background: 'rgba(245, 166, 35, 0.1)',
                    border: '1px solid rgba(245, 166, 35, 0.25)',
                    color: G,
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                  }}
                  data-hover-target="true"
                >
                  ✨ Auto-Categorize
                </button>
             </div>
             <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required style={inputStyle} placeholder="e.g. Form 4 Physics Notes" />
          </div>
          <div style={{ flex: '1 1 150px' }}>
             <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Resource Type</label>
             <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={inputStyle}>
                {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k} style={{ color: '#000' }}>{v}</option>)}
             </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 150px' }}>
             <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Level / Category</label>
             <select value={form.level} onChange={e => setForm({...form, level: e.target.value})} style={inputStyle}>
                {LEVELS.map(l => <option key={l} value={l} style={{ color: '#000' }}>{l}</option>)}
             </select>
          </div>
          <div style={{ flex: '1 1 150px' }}>
             <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Subject</label>
             <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} style={inputStyle} placeholder="e.g. Physics" />
          </div>
          <div style={{ flex: '1 1 100px' }}>
             <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Year</label>
             <input value={form.year} onChange={e => setForm({...form, year: e.target.value})} style={inputStyle} placeholder="2024" />
          </div>
        </div>

        <div>
           <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Description (Optional)</label>
           <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{...inputStyle, height: 80, resize: 'vertical'}} placeholder="Briefly describe this material..." />
        </div>

        <div>
           <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Tags (Comma separated)</label>
           <input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} style={inputStyle} placeholder="e.g. NECTA, Mechanics, Topic 1" />
        </div>

        <div style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 12, border: '1px dashed rgba(255,255,255,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
           <UploadCloud size={32} color="rgba(255,255,255,0.4)" />
           <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Select PDF or Document file</div>
           <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={e => setFile(e.target.files?.[0])} style={{ color: '#fff', fontSize: 13 }} />
        </div>

        {role === 'student' && (
           <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 8 }}>
             ℹ️ Note: Your material will be published after admin review.
           </div>
        )}

        <button type="submit" disabled={loading} style={{
          background: `linear-gradient(135deg, ${G}, #FFD17C)`,
          color: '#050508',
          border: 'none',
          padding: '14px 24px',
          borderRadius: 12,
          fontWeight: 800,
          cursor: loading ? 'default' : 'pointer',
          marginTop: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: loading ? 0.7 : 1
        }}>
          {loading ? <Loader2 size={18} className="spin" /> : <UploadCloud size={18} />}
          {loading ? "Uploading..." : `Submit ${CATEGORIES[form.type] || 'Resource'}`}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  padding: '10px 14px',
  color: '#fff',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.2s'
};
