import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';
import { StorageMediaField } from "./AdminUI.jsx";
import { Edit2, Trash2, Plus, X, Search, FileText, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

const G = "#f5a623";

export default function ExamsHubManager({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    type: 'past_paper', // past_paper, note, practice, bundle
    title: '',
    description: '',
    level: 'Form 4',
    subject: '',
    topic: '',
    year: new Date().getFullYear().toString(),
    examType: 'NECTA',
    region: '',
    status: 'published',
    published: true,
    featured: false,
    isPremium: false,
    tags: '',
    contentSourceType: 'upload', // upload, link
    fileUrl: '',
    externalLink: '',
    imageSourceType: 'upload', // upload, link
    imageUrl: '',
    imageExternalUrl: ''
  });

  const db = getFirebaseDb();

  const fetchItems = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, 'study_resources'));
      if (user?.role === 'creator') {
        q = query(collection(db, 'study_resources'), where('ownerId', '==', user.uid));
      }
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const canDirect = !!user?.canPublishDirect;
      const payload = { 
        ...form,
        updatedAt: serverTimestamp()
      };

      if (currentId) {
        // Preserve original metadata
        delete payload.id;
        delete payload.createdAt;
        delete payload.ownerId;
        delete payload.ownerName;
        delete payload.sector;
        
        await updateDoc(doc(db, 'study_resources', currentId), payload);
      } else {
        payload.ownerId = user?.uid || "admin";
        payload.ownerName = user?.displayName || "Admin";
        payload.sector = "exams";
        payload.createdAt = serverTimestamp();
        payload.status = canDirect ? "published" : "pending_review";
        payload.published = canDirect;
        if (canDirect) {
          payload.approvedBy = user?.uid || "admin";
          payload.approvedAt = serverTimestamp();
        }
        await addDoc(collection(db, 'study_resources'), payload);
      }
      setIsEditing(false);
      fetchItems();
    } catch (err) {
      console.error(err);
      alert("Error saving item");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteDoc(doc(db, 'study_resources', id));
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setForm({
      type: 'past_paper',
      title: '',
      description: '',
      level: 'Form 4',
      subject: '',
      topic: '',
      year: new Date().getFullYear().toString(),
      examType: 'NECTA',
      region: '',
      status: 'active',
      featured: false,
      isPremium: false,
      tags: '',
      contentSourceType: 'upload',
      fileUrl: '',
      externalLink: '',
      imageSourceType: 'upload',
      imageUrl: '',
      imageExternalUrl: ''
    });
    setCurrentId(null);
  };

  const filteredItems = items.filter(item => {
    if (filterType === 'pending_review') {
       if (item.status !== 'pending_review') return false;
    } else {
       if (filterType !== 'all' && item.type !== filterType) return false;
    }
    if (search && !item.title.toLowerCase().includes(search.toLowerCase()) && !item.subject?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (isEditing) {
    return (
      <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.05)", padding: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ fontSize: 20, fontWeight: 800 }}>{currentId ? "Edit Resource" : "Add New Resource"}</h3>
          <button onClick={() => setIsEditing(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: "grid", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Field label="Resource Type">
              <Select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="past_paper">Past Paper</option>
                <option value="note">Notes</option>
                <option value="practice">Practice/Quiz</option>
                <option value="bundle">Featured Bundle</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </Select>
            </Field>
          </div>

          <Field label="Title">
            <Input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Biology Form 4 NECTA 2022" />
          </Field>

          <Field label="Description">
            <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Brief description..." />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
            <Field label="Level / Class">
              <Select value={form.level} onChange={e => setForm({...form, level: e.target.value})}>
                <option value="Form 1">Form 1</option>
                <option value="Form 2">Form 2</option>
                <option value="Form 3">Form 3</option>
                <option value="Form 4">Form 4</option>
                <option value="Form 5">Form 5</option>
                <option value="Form 6">Form 6</option>
                <option value="Primary">Primary</option>
                <option value="All">All Levels</option>
              </Select>
            </Field>
            <Field label="Subject">
              <Input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="e.g. Biology" />
            </Field>
            <Field label="Year">
              <Input type="number" value={form.year} onChange={e => setForm({...form, year: e.target.value})} placeholder="e.g. 2022" />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Field label="Exam Type">
              <Select value={form.examType} onChange={e => setForm({...form, examType: e.target.value})}>
                <option value="NECTA">NECTA</option>
                <option value="Mock">Mock</option>
                <option value="Pre-National">Pre-National</option>
                <option value="Joint">Joint</option>
                <option value="Terminal">Terminal</option>
                <option value="Annual">Annual</option>
                <option value="Midterm">Midterm</option>
                <option value="Topic">Topic Notes</option>
              </Select>
            </Field>
            <Field label="Region / Source (Optional)">
              <Input value={form.region} onChange={e => setForm({...form, region: e.target.value})} placeholder="e.g. Dar es Salaam, TAHOSSA" />
            </Field>
          </div>

          <Field label="Topic (Optional - mostly for Notes)">
            <Input value={form.topic} onChange={e => setForm({...form, topic: e.target.value})} placeholder="e.g. Classification of Living Things" />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: 20, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
              <h4 style={{ margin: "0 0 16px", fontSize: 14, color: G }}>Content Source</h4>
              <Field label="Source Type">
                <Select value={form.contentSourceType} onChange={e => setForm({...form, contentSourceType: e.target.value})}>
                  <option value="upload">Upload File (PDF)</option>
                  <option value="link">External Link</option>
                </Select>
              </Field>
              {form.contentSourceType === 'upload' ? (
                <StorageMediaField label="Upload File or Paste Auto-link" value={form.fileUrl} onChange={val => setForm({...form, fileUrl: val})} accept="*/*" />
              ) : (
                <Field label="External Link">
                  <Input value={form.externalLink} onChange={e => setForm({...form, externalLink: e.target.value})} placeholder="https://..." />
                </Field>
              )}
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", padding: 20, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
              <h4 style={{ margin: "0 0 16px", fontSize: 14, color: G }}>Cover Image</h4>
              <Field label="Image Source Type">
                <Select value={form.imageSourceType} onChange={e => setForm({...form, imageSourceType: e.target.value})}>
                  <option value="upload">Upload Image</option>
                  <option value="link">Image URL</option>
                </Select>
              </Field>
              {form.imageSourceType === 'upload' ? (
                <StorageMediaField label="Upload Image or Paste URL" value={form.imageUrl} onChange={val => setForm({...form, imageUrl: val})} />
              ) : (
                <Field label="External Image URL">
                  <Input value={form.imageExternalUrl} onChange={e => setForm({...form, imageExternalUrl: e.target.value})} placeholder="https://..." />
                </Field>
              )}
            </div>
          </div>

          <Field label="Tags (comma separated)">
            <Input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="biology, form4, 2022, necta" />
          </Field>

          <div style={{ display: "flex", gap: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={form.featured} onChange={e => setForm({...form, featured: e.target.checked})} />
              Featured Resource
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={form.isPremium} onChange={e => setForm({...form, isPremium: e.target.checked})} />
              Premium (Paid)
            </label>
          </div>

          <button type="submit" style={{ background: G, color: "#000", padding: "14px", borderRadius: 12, fontWeight: 800, border: "none", cursor: "pointer", marginTop: 10 }}>
            Save Resource
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", overflowX: "auto", scrollbarWidth: "none" }}>
          {['all', 'pending_review', 'past_paper', 'note', 'practice', 'bundle'].map(t => (
            <button 
              key={t}
              onClick={() => setFilterType(t)}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.1)",
                background: filterType === t ? "rgba(255,255,255,0.1)" : "transparent",
                color: filterType === t ? "#fff" : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                textTransform: "capitalize"
              }}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: 10, color: "rgba(255,255,255,0.4)" }} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "8px 16px 8px 36px", color: "#fff", outline: "none" }}
            />
          </div>
          <button 
            onClick={() => { resetForm(); setIsEditing(true); }}
            style={{ background: G, color: "#000", padding: "8px 16px", borderRadius: 12, fontWeight: 700, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
          >
            <Plus size={18} /> Add Resource
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.5)" }}>Loading...</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filteredItems.map(item => (
            <div key={item.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: G }}>
                  {item.type === 'past_paper' ? <FileText size={24} /> : item.type === 'note' ? <ImageIcon size={24} /> : <LinkIcon size={24} />}
                </div>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>{item.title}</h4>
                  <div style={{ display: "flex", gap: 12, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                    <span>{item.level}</span>
                    <span>•</span>
                    <span>{item.subject}</span>
                    <span>•</span>
                    <span>{item.year}</span>
                    <span style={{ color: item.status === 'active' ? '#4ade80' : '#f87171' }}>{item.status}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {item.status === 'pending_review' && (
                   <button 
                      onClick={async () => {
                         const db = getFirebaseDb();
                         await updateDoc(doc(db, 'study_resources', item.id), { status: 'published', published: true, approvedBy: user?.uid || 'admin', approvedAt: serverTimestamp() });
                         fetchItems();
                      }}
                      style={{ background: "#10b981", border: "none", padding: "0 16px", borderRadius: 8, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}
                   >
                     Approve
                   </button>
                )}
                <button onClick={() => { setForm(item); setCurrentId(item.id); setIsEditing(true); }} style={{ background: "rgba(255,255,255,0.1)", border: "none", width: 36, height: 36, borderRadius: 8, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(item.id)} style={{ background: "rgba(239,68,68,0.1)", border: "none", width: 36, height: 36, borderRadius: 8, color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.02)", borderRadius: 16 }}>
              No resources found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper components
const Field = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    <label style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{label}</label>
    {children}
  </div>
);

const Input = (props) => (
  <input {...props} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#fff", outline: "none", fontSize: 14, ...props.style }} />
);

const Textarea = (props) => (
  <textarea {...props} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#fff", outline: "none", fontSize: 14, minHeight: 100, resize: "vertical", ...props.style }} />
);

const Select = (props) => (
  <select {...props} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#fff", outline: "none", fontSize: 14, appearance: "none", ...props.style }}>
    {props.children}
  </select>
);
