import React, { useState } from 'react';
import { Search, Trash2, Edit3, Eye, FileText, Check, Globe } from 'lucide-react';
import { getFirebaseDb } from '../../firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

export function TeacherNotesSection({ 
  assignments, 
  webResources, 
  classes, 
  notify, 
  user 
}) {
  const [activeTab, setActiveTab] = useState('all'); // all, class, website
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  // Modals for editing note
  const [editingNote, setEditingNote] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', subject: '', level: '', published: true });
  const [confirmDialog, setConfirmDialog] = useState(null);

  const db = getFirebaseDb();

  // Extract notes from assignments
  const classNotes = assignments.filter(a => 
    a.type === 'note' || 
    (a.type === 'resource' && (
      a.title?.toLowerCase().includes('note') || 
      a.description?.toLowerCase().includes('note') ||
      a.title?.toLowerCase().includes('muhtasari') ||
      a.title?.toLowerCase().includes('summary')
    ))
  ).map(n => ({
    ...n,
    sourceType: 'class',
    className: classes.find(c => c.id === n.classId)?.className || n.className || 'Unknown Class'
  }));

  // Extract notes from website resources
  const descNotes = webResources.filter(r => r.type === 'note' && r.status !== 'deleted').map(n => ({
    ...n,
    sourceType: 'website',
    className: 'Website Note'
  }));

  // Combine
  const allNotes = [...classNotes, ...descNotes];

  // Filter notes
  const filteredNotes = allNotes.filter(n => {
    if (activeTab === 'class' && n.sourceType !== 'class') return false;
    if (activeTab === 'website' && n.sourceType !== 'website') return false;
    
    const titleMatch = (n.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = (n.description || n.instructions || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchSearch = titleMatch || descMatch;

    const matchClass = classFilter === 'all' || n.classId === classFilter;

    return matchSearch && matchClass;
  }).sort((a, b) => {
    const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
    const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
    return sortBy === 'newest' ? tB - tA : tA - tB;
  });

  const handleTogglePublish = async (note) => {
    try {
      if (note.sourceType === 'website') {
        const nextStatus = note.status === 'published' ? 'pending_review' : 'published';
        await updateDoc(doc(db, 'study_resources', note.id), {
          status: nextStatus,
          published: nextStatus === 'published'
        });
        notify(`Website note status updated to: ${nextStatus === 'published' ? 'Published' : 'Draft'}`);
      } else {
        const nextPubStatus = note.published !== false ? false : true;
        await updateDoc(doc(db, 'assignments', note.id), {
          published: nextPubStatus
        });
        notify(`Class note status updated to: ${nextPubStatus ? 'Published' : 'Draft'}`);
      }
    } catch (e) {
      console.error(e);
      notify('Failed to update publication status.', 'error');
    }
  };

  const handleDeleteNote = async (note) => {
    setConfirmDialog({
      title: 'Delete note?',
      message: `Are you sure you want to delete "${note.title}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          if (note.sourceType === 'website') {
            await deleteDoc(doc(db, 'study_resources', note.id));
          } else {
            await deleteDoc(doc(db, 'assignments', note.id));
          }
          notify('Note has been deleted successfully.');
        } catch (e) {
          console.error(e);
          notify('Could not delete note.', 'error');
        }
      }
    });
  };

  const openEditModal = (note) => {
    setEditingNote(note);
    setEditForm({
      title: note.title || '',
      description: note.description || note.instructions || '',
      subject: note.subject || '',
      level: note.level || '',
      published: note.published !== false && note.status !== 'pending_review'
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) return;
    try {
      if (editingNote.sourceType === 'website') {
        await updateDoc(doc(db, 'study_resources', editingNote.id), {
          title: editForm.title,
          description: editForm.description,
          subject: editForm.subject,
          level: editForm.level,
          status: editForm.published ? 'published' : 'pending_review',
          published: editForm.published
        });
      } else {
        await updateDoc(doc(db, 'assignments', editingNote.id), {
          title: editForm.title,
          description: editForm.description,
          published: editForm.published
        });
      }
      notify('Note has been updated successfully!');
      setEditingNote(null);
    } catch (err) {
      console.error(err);
      notify('Failed to save changes.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {confirmDialog && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", display: "grid", placeItems: "center", zIndex: 5000, padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 420, background: "#0c0e14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 24, color: "#fff" }}>
            <h3 style={{ marginTop: 0, fontSize: 20, fontWeight: 900 }}>{confirmDialog.title}</h3>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>{confirmDialog.message}</p>
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button type="button" onClick={() => setConfirmDialog(null)} style={{ flex: 1, background: "rgba(255,255,255,0.06)", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 800 }}>{confirmDialog.cancelText || "Cancel"}</button>
              <button type="button" onClick={async () => { const fn = confirmDialog.onConfirm; setConfirmDialog(null); await fn?.(); }} style={{ flex: 1, background: "#F5A623", color: "#000", border: "none", borderRadius: 10, padding: 12, fontWeight: 900 }}>{confirmDialog.confirmText || "Confirm"}</button>
            </div>
          </div>
        </div>
      )}
      {/* Title block */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0 }}>My Notes Hub</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: 14 }}>Manage all your class and website study notes in one master control panel</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', gap: 16 }}>
        {[
          { id: 'all', label: 'All Notes', count: allNotes.length },
          { id: 'class', label: 'Class Notes', count: classNotes.length },
          { id: 'website', label: 'Website Notes (STEAHub)', count: descNotes.length }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === t.id ? '2px solid #F5A623' : '2px solid transparent',
              padding: '12px 6px',
              color: activeTab === t.id ? '#F5A623' : 'rgba(255,255,255,0.5)',
              fontWeight: activeTab === t.id ? 800 : 500,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s'
            }}
          >
            {t.label}
            <span style={{ fontSize: 10, background: activeTab === t.id ? 'rgba(245, 166, 35, 0.2)' : 'rgba(255,255,255,0.05)', color: activeTab === t.id ? '#F5A623' : 'rgba(255,255,255,0.4)', padding: '2px 6px', borderRadius: 8 }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & filters Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
        <div style={{ position: 'relative', flex: '2 1 250px' }}>
          <input
            type="text"
            placeholder="Search notes name, topic, or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', height: 42, padding: '0 16px 0 40px', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
          />
          <Search size={14} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 14, top: 14 }} />
        </div>

        {activeTab !== 'website' && (
          <div style={{ flex: '1 1 180px' }}>
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', height: 42, padding: '0 12px', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
            >
              <option value="all">Mchujo wa Darasa (All Classes)</option>
              {classes.map(c => (
                <option key={c.id} value={c.id} style={{ color: '#000' }}>{c.className || c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ flex: '1 1 150px' }}>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', height: 42, padding: '0 12px', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
          >
            <option value="newest">Zamani kidogo (Newest first)</option>
            <option value="oldest">Zamani sana (Oldest first)</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      {filteredNotes.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.05)' }}>
          <FileText size={48} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 16px' }} />
          <h4 style={{ color: '#fff', fontSize: 16, margin: '0 0 8px 0' }}>No notes found</h4>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: 13 }}>Try adjusting search parameters or upload a note.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filteredNotes.map(note => {
            const isPub = note.sourceType === 'website' ? note.status === 'published' : note.published !== false;
            return (
              <div key={note.id} style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 16,
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Source badge */}
                <span style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  fontSize: 9,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  borderBottomLeftRadius: 10,
                  background: note.sourceType === 'website' ? 'rgba(245, 166, 35, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                  color: note.sourceType === 'website' ? '#F5A623' : '#3B82F6'
                }}>
                  {note.sourceType === 'website' ? 'Website Note' : 'Class Note'}
                </span>

                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, marginTop: 4 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75%' }}>{note.title}</h3>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      background: isPub ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.05)',
                      color: isPub ? '#10B981' : 'rgba(255,255,255,0.4)',
                      padding: '2px 8px',
                      borderRadius: 6
                    }}>
                      {isPub ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 12px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>
                    {note.description || note.instructions || 'Hakuna maelezo yaliyowekwa...'}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                    {note.sourceType === 'class' ? (
                      <span>🏫 Darasa: <b>{note.className}</b></span>
                    ) : (
                      <>
                        <span>👁️ {note.clicks || 0} views</span>
                        <span>•</span>
                        <span>📥 {note.downloads || 0} downloads</span>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, pt: 8, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                  <button
                    onClick={() => handleTogglePublish(note)}
                    style={{
                      flex: 1,
                      background: isPub ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                      color: isPub ? '#EF4444' : '#10B981',
                      border: 'none',
                      padding: '8px 4px',
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: '0.2s'
                    }}
                  >
                    {isPub ? 'Unpublish' : 'Publish'}
                  </button>

                  <button
                    onClick={() => openEditModal(note)}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: 'none',
                      padding: 8,
                      borderRadius: 8,
                      color: '#F5A623',
                      cursor: 'pointer'
                    }}
                    title="Edit Note"
                  >
                    <Edit3 size={14} />
                  </button>

                  {note.downloadUrl && (
                    <a
                      href={note.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        padding: 8,
                        borderRadius: 8,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="View document"
                    >
                      <Eye size={14} />
                    </a>
                  )}

                  <button
                    onClick={() => handleDeleteNote(note)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: 'none',
                      padding: 8,
                      borderRadius: 8,
                      color: '#EF4444',
                      cursor: 'pointer'
                    }}
                    title="Delete Note"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit modal popup */}
      {editingNote && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', zIndex: 4500, padding: 20 }}>
          <div style={{ background: '#0c0e14', width: '100%', maxWidth: 480, padding: 28, borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 16 }}>Kebetanisha Vidokezo ({editingNote.sourceType === 'website' ? 'Web' : 'Class'})</h2>
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6, opacity: 0.5, textTransform: 'uppercase' }}>Kichwa la Note (Title)</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: 12, borderRadius: 10, color: '#fff', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6, opacity: 0.5, textTransform: 'uppercase' }}>Maelezo (Description)</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: 12, borderRadius: 10, color: '#fff', outline: 'none', resize: 'none' }}
                />
              </div>

              {editingNote.sourceType === 'website' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6, opacity: 0.5, textTransform: 'uppercase' }}>Somo (Subject)</label>
                    <input
                      type="text"
                      value={editForm.subject}
                      onChange={e => setEditForm({...editForm, subject: e.target.value})}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: 11, borderRadius: 10, color: '#fff', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6, opacity: 0.5, textTransform: 'uppercase' }}>Kiwango (Level)</label>
                    <input
                      type="text"
                      value={editForm.level}
                      onChange={e => setEditForm({...editForm, level: e.target.value})}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: 11, borderRadius: 10, color: '#fff', outline: 'none' }}
                    />
                  </div>
                </div>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={editForm.published}
                  onChange={e => setEditForm({...editForm, published: e.target.checked})}
                  style={{ width: 16, height: 16, accentColor: '#F5A623' }}
                />
                Chapisha darsani/wavuti sasa (Published)
              </label>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: 'none', padding: 12, borderRadius: 10, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, background: '#F5A623', border: 'none', padding: 12, borderRadius: 10, fontWeight: 900, color: '#000', cursor: 'pointer' }}
                >
                  Hifadhi (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
