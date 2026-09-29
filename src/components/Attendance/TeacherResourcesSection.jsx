import React, { useState } from 'react';
import { Search, Trash2, Edit3, Eye, FileDown, Layers, HelpCircle } from 'lucide-react';
import { getFirebaseDb } from '../../firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { notifyClassStudents } from './notificationUtils';

export function TeacherResourcesSection({ 
  assignments, 
  classResources = [],
  webResources, 
  classes, 
  notify, 
  user 
}) {
  const [activeTab, setActiveTab] = useState('class'); // class, website
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Modals for editing note
  const [editingRes, setEditingRes] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', subject: '', level: '', year: '' });
  const [confirmDialog, setConfirmDialog] = useState(null);

  const db = getFirebaseDb();

  // Class Resources (canonical collection with legacy fallback)
  const classResourcesList = (classResources.length > 0 ? classResources : assignments.filter(a => a.type !== 'assignment')).filter(r => r.deleted !== true && r.status !== 'deleted').map(r => ({
    ...r,
    sourceType: 'class',
    className: classes.find(c => c.id === r.classId)?.className || r.className || 'Unknown Class'
  }));

  // Website Resources (all study resources with type != 'note')
  const webResourcesFiltered = webResources.filter(r => r.type !== 'note' && r.status !== 'deleted').map(r => ({
    ...r,
    sourceType: 'website',
    className: 'STEAHub Website'
  }));

  const activeList = activeTab === 'class' ? classResourcesList : webResourcesFiltered;

  // Filter list
  const filteredList = activeList.filter(r => {
    const titleMatch = (r.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = (r.description || r.instructions || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchSearch = titleMatch || descMatch;

    const matchClass = activeTab === 'website' || classFilter === 'all' || r.classId === classFilter;
    const matchLevel = activeTab === 'class' || levelFilter === 'all' || r.level === levelFilter;

    return matchSearch && matchClass && matchLevel;
  }).sort((a, b) => {
    const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
    const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
    return sortBy === 'newest' ? tB - tA : tA - tB;
  });

  const handleDeleteResource = async (res) => {
    setConfirmDialog({
      title: 'Delete resource?',
      message: `Thibitisha kufuta rasilimali: "${res.title}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          if (res.sourceType === 'website') {
            await deleteDoc(doc(db, 'study_resources', res.id));
          } else {
            await deleteDoc(doc(db, 'classResources', res.id));
          }
          notify('Kifutwa kikamilifu.');
        } catch(err) {
          console.error(err);
          notify('Failed to delete resource.', 'error');
        }
      }
    });
  };

  const openEditModal = (res) => {
    setEditingRes(res);
    setEditForm({
      title: res.title || '',
      description: res.description || res.instructions || '',
      subject: res.subject || '',
      level: res.level || '',
      year: res.year || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) return;
    try {
      if (editingRes.sourceType === 'website') {
        await updateDoc(doc(db, 'study_resources', editingRes.id), {
          title: editForm.title,
          description: editForm.description,
          subject: editForm.subject,
          level: editForm.level,
          year: editForm.year
        });
      } else {
        await updateDoc(doc(db, 'classResources', editingRes.id), {
          title: editForm.title,
          description: editForm.description,
          subject: editForm.subject,
          level: editForm.level,
          year: editForm.year,
          updatedAt: new Date()
        });
      }
      notify('Mabadiliko yamehifadhiwa vyema.');
      setEditingRes(null);
    } catch(err) {
      console.error(err);
      notify('Imeshindikana kusahihisha.', 'error');
    }
  };

  const handleTogglePublish = async (res) => {
    try {
      const nextVisibility = (res.visibility || res.status) === 'published' ? 'draft' : 'published';
      if (res.sourceType === 'website') {
        await updateDoc(doc(db, 'study_resources', res.id), {
          status: nextVisibility,
          published: nextVisibility === 'published'
        });
      } else {
        await updateDoc(doc(db, 'classResources', res.id), {
          visibility: nextVisibility,
          status: nextVisibility,
          updatedAt: new Date()
        });
      }
      
      if (nextVisibility === 'published' && res.classId) {
        await notifyClassStudents(res.classId, {
          type: "resource",
          title: "New Resource",
          message: `A new resource "${res.title || 'Learning Resource'}" has been published.`,
          link: "resources",
          createdBy: user?.uid || "teacher"
        });
      }
      
      notify(`Resource ${nextVisibility === 'published' ? 'published' : 'drafted'} successfully.`);
    } catch (err) {
      console.error(err);
      notify('Failed to update publication status.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title block */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0 }}>My Resources Shelf</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: 14 }}>View and manage learning elements, past papers, general study files across all spaces</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', gap: 16 }}>
        {[
          { id: 'class', label: 'Class Resources', count: classResourcesList.length },
          { id: 'website', label: 'Website Resources & Past Papers', count: webResourcesFiltered.length }
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

      {/* Search & Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
        <div style={{ position: 'relative', flex: '2 1 250px' }}>
          <input
            type="text"
            placeholder="Search resources by title, description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', height: 42, padding: '0 16px 0 40px', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
          />
          <Search size={14} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 14, top: 14 }} />
        </div>

        {activeTab === 'class' ? (
          <div style={{ flex: '1 1 180px' }}>
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', height: 42, padding: '0 12px', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
            >
              <option value="all">Class Filter (All Classes)</option>
              {classes.map(c => (
                <option key={c.id} value={c.id} style={{ color: '#000' }}>{c.className || c.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ flex: '1 1 180px' }}>
            <select
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', height: 42, padding: '0 12px', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
            >
              <option value="all">Level Filter (All Levels)</option>
              {['Primary', 'O-Level (Form 1-4)', 'A-Level (Form 5-6)', 'University', 'General'].map(lvl => (
                <option key={lvl} value={lvl} style={{ color: '#000' }}>{lvl}</option>
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
            <option value="newest">Zamani kidoko (Newest first)</option>
            <option value="oldest">Zamani sana (Oldest first)</option>
          </select>
        </div>
      </div>

      {/* Grid displays */}
      {filteredList.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.05)' }}>
          <FileDown size={48} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 16px' }} />
          <h4 style={{ color: '#fff', fontSize: 16, margin: '0 0 8px 0' }}>No resources found</h4>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: 13 }}>Try adjusting search parameters or upload a new resource block.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filteredList.map(res => (
            <div key={res.id} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 16
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 900,
                    borderRadius: 6,
                    padding: '2px 8px',
                    background: res.sourceType === 'website' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                    color: res.sourceType === 'website' ? '#10B981' : '#3B82F6',
                    textTransform: 'uppercase'
                  }}>
                    {res.sourceType === 'website' ? (res.type?.replace('_', ' ') || 'Resource') : 'Class Material'}
                  </span>

                {res.sourceType === 'website' && (
                  <span style={{ fontSize: 11, color: '#F5A623', fontWeight: 700 }}>{res.level}</span>
                )}
              </div>

                <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 8px 0', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{res.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 12px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>
                  {res.description || res.instructions || 'No detailed instructions configured.'}
                </p>

                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'rgba(255,255,255,0.3)', alignItems: 'center' }}>
                  {res.sourceType === 'class' ? (
                    <span>🏫 Class: <b>{res.className}</b></span>
                  ) : (
                    <>
                      <span>👁️ {res.clicks || 0} clicks</span>
                      <span>•</span>
                      <span>📥 {res.downloads || 0} downloaded</span>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                {(res.downloadUrl || res.fileUrl || res.attachmentUrl || res.linkUrl) && (
                  <a
                    href={res.downloadUrl || res.fileUrl || res.attachmentUrl || res.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      background: 'rgba(245, 166, 35, 0.1)',
                      color: '#F5A623',
                      border: 'none',
                      padding: '8px 4px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      textDecoration: 'none'
                    }}
                  >
                    <Eye size={12} /> View
                  </a>
                )}

                <button
                  onClick={() => handleTogglePublish(res)}
                  style={{
                    background: (res.visibility || res.status) === 'published' ? 'rgba(251, 191, 36, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: 8,
                    color: (res.visibility || res.status) === 'published' ? '#F59E0B' : '#10B981',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    fontWeight: 800
                  }}
                >
                  {(res.visibility || res.status) === 'published' ? 'Unpublish' : 'Publish'}
                </button>

                <button
                  onClick={() => openEditModal(res)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: 8,
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12
                  }}
                >
                  <Edit3 size={12} /> Edit
                </button>

                <button
                  onClick={() => handleDeleteResource(res)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: 8,
                    color: '#EF4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Futa Resource"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm dialog */}
      {confirmDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'grid', placeItems: 'center', zIndex: 4600, padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 420, background: '#0c0e14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 24, color: '#fff' }}>
            <h3 style={{ marginTop: 0, fontSize: 20, fontWeight: 900 }}>{confirmDialog.title}</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button type="button" onClick={() => setConfirmDialog(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontWeight: 800 }}>{confirmDialog.cancelText || 'Cancel'}</button>
              <button type="button" onClick={async () => { const fn = confirmDialog.onConfirm; setConfirmDialog(null); await fn?.(); }} style={{ flex: 1, background: '#F5A623', color: '#000', border: 'none', borderRadius: 10, padding: 12, fontWeight: 900 }}>{confirmDialog.confirmText || 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingRes && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', zIndex: 4500, padding: 20 }}>
          <div style={{ background: '#0c0e14', width: '100%', maxWidth: 480, padding: 28, borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 16 }}>Edit Resource Metadata ({editingRes.sourceType === 'website' ? 'Web' : 'Class'})</h2>
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6, opacity: 0.5, textTransform: 'uppercase' }}>Jina la Resource (Title)</label>
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

              {editingRes.sourceType === 'website' && (
                <>
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
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6, opacity: 0.5, textTransform: 'uppercase' }}>Mwaka (Year)</label>
                      <input
                        type="text"
                        value={editForm.year}
                        onChange={e => setEditForm({...editForm, year: e.target.value})}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: 11, borderRadius: 10, color: '#fff', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6, opacity: 0.5, textTransform: 'uppercase' }}>Kiwango (Level)</label>
                    <select
                      value={editForm.level}
                      onChange={e => setEditForm({...editForm, level: e.target.value})}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: 11, borderRadius: 10, color: '#fff', outline: 'none' }}
                    >
                      {['Primary', 'O-Level (Form 1-4)', 'A-Level (Form 5-6)', 'University', 'General'].map(lvl => (
                        <option key={lvl} value={lvl} style={{ color: '#000' }}>{lvl}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setEditingRes(null)}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: 'none', padding: 12, borderRadius: 10, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, background: '#F5A623', border: 'none', padding: 12, borderRadius: 10, fontWeight: 900, color: '#000', cursor: 'pointer' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
