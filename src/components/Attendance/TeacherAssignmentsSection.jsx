import React, { useState, useMemo } from 'react';
import { ClipboardList, Plus, Search, Trash2, Edit3, Eye, FileText, CheckCircle, Clock, Copy } from 'lucide-react';
import { getFirebaseDb } from '../../firebase';
import { doc, updateDoc, deleteDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

import AssignmentSubmissions from './AssignmentSubmissions.jsx';
import AssignmentModal from './AssignmentModal.jsx';

export function TeacherAssignmentsSection({ 
  allAssignments, 
  classes, 
  notify, 
  user,
  setClassSelectorAction,
  isMobile
}) {
  const [activeTab, setActiveTab] = useState('all'); // all, active, closed
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  const [viewingSubmissions, setViewingSubmissions] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  const db = getFirebaseDb();

  // Filter only assignments
  const assignmentDocs = allAssignments.filter(a => a.type === 'assignment').map(a => ({
    ...a,
    className: classes.find(c => c.id === a.classId)?.className || a.className || 'Unknown Class'
  }));

  const filtered = useMemo(() => {
    return assignmentDocs.filter(a => {
      if (activeTab === 'published' && a.status !== 'published') return false;
      if (activeTab === 'draft' && a.status !== 'draft') return false;
      if (activeTab === 'closed' && a.status !== 'closed') return false;

      const titleMatch = (a.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      const classMatch = classFilter === 'all' || a.classId === classFilter;

      return titleMatch && classMatch;
    }).sort((a, b) => {
      const tA = a.createdAt?.seconds || 0;
      const tB = b.createdAt?.seconds || 0;
      if (sortBy === 'newest') return tB - tA;
      if (sortBy === 'oldest') return tA - tB;
      if (sortBy === 'due_soon' && a.dueDate && b.dueDate) {
        return a.dueDate.seconds - b.dueDate.seconds;
      }
      return 0;
    });
  }, [assignmentDocs, activeTab, searchQuery, classFilter, sortBy]);

  const handleDelete = async (assignment) => {
    try {
      await deleteDoc(doc(db, 'assignments', assignment.id));
      notify('Assignment deleted');
    } catch (e) {
      console.error(e);
      notify('Could not delete assignment', 'error');
    }
  };

  const handleToggleStatus = async (assignment, newStatus) => {
    try {
      await updateDoc(doc(db, 'assignments', assignment.id), {
        status: newStatus
      });
      notify(`Status changed to ${newStatus}`);
    } catch (e) {
      notify('Could not update status', 'error');
    }
  };

  const handleDuplicate = async (assignment) => {
    try {
      const copy = { ...assignment };
      delete copy.id;
      delete copy.className; // Remove our locally injected className
      copy.title = `${copy.title} (Copy)`;
      copy.status = 'draft';
      copy.createdAt = serverTimestamp();
      copy.updatedAt = serverTimestamp();
      
      await addDoc(collection(db, 'assignments'), copy);
      notify('Assignment duplicated as draft');
    } catch (e) {
      console.error(e);
      notify('Could not duplicate assignment', 'error');
    }
  };

  if (viewingSubmissions) {
    const classData = classes.find(c => c.id === viewingSubmissions.classId);
    return (
      <AssignmentSubmissions 
        assignment={viewingSubmissions}
        onBack={() => setViewingSubmissions(null)}
        isTeacher={true}
        user={user}
        classData={classData}
        classStudents={classData?.students || []}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {editingAssignment && (
        <AssignmentModal
          classId={editingAssignment.classId}
          teacherId={user?.uid}
          assignment={editingAssignment}
          onClose={() => setEditingAssignment(null)}
        />
      )}
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? "column" : "row", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 900, color: '#fff', margin: 0 }}>Assignments Control Center</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: 14 }}>Manage all class assignments, view submissions, and mark grades</p>
        </div>
        <button 
          onClick={() => setClassSelectorAction('create_assignment')}
          style={{ background: "#F5A623", color: "#000", border: 'none', padding: "12px 20px", borderRadius: 12, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", width: isMobile ? "100%" : "auto", justifyContent: "center" }}
        >
          <Plus size={18} /> New Assignment
        </button>
      </div>

      {/* Search & filters Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
        <div style={{ position: 'relative', flex: '2 1 250px' }}>
          <input
            type="text"
            placeholder="Search assignment title..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', height: 42, padding: '0 16px 0 40px', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
          />
          <Search size={14} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 14, top: 14 }} />
        </div>

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

        <div style={{ flex: '1 1 150px' }}>
          <select
            value={activeTab}
            onChange={e => setActiveTab(e.target.value)}
            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', height: 42, padding: '0 12px', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        
        <div style={{ flex: '1 1 150px' }}>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', height: 42, padding: '0 12px', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="due_soon">Due Soon</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      {filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.05)' }}>
          <ClipboardList size={48} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 16px' }} />
          <h4 style={{ color: '#fff', fontSize: 16, margin: '0 0 8px 0' }}>No assignments found</h4>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: 13 }}>Create a new assignment or change your filters.</p>
        </div>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 650 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: '#F5A623', textTransform: 'uppercase' }}>Assignment Name</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: '#F5A623', textTransform: 'uppercase' }}>Class Name</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: '#F5A623', textTransform: 'uppercase', textAlign: 'center' }}>Due Date</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: '#F5A623', textTransform: 'uppercase', textAlign: 'center' }}>Marks</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: '#F5A623', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: '#F5A623', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(assignment => {
                const isPub = assignment.status === 'published';
                const isClosed = assignment.status === 'closed';
                
                const createdAtTs = assignment.createdAt?.toMillis ? assignment.createdAt.toMillis() : (assignment.createdAt instanceof Date ? assignment.createdAt.getTime() : 0);
                // eslint-disable-next-line react-hooks/purity
                const isNew = createdAtTs > 0 && (Date.now() - createdAtTs) < 24 * 60 * 60 * 1000;
                
                return (
                  <tr key={assignment.id} style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    transition: 'all 0.3s',
                    background: isNew ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                    boxShadow: isNew ? 'inset 2px 0 0 #3B82F6' : 'none'
                  }} className="hover:bg-white/5">
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontWeight: 800, color: '#fff', fontSize: 14 }}>{assignment.title}</div>
                        {isNew && <span style={{ fontSize: 9, background: '#3B82F6', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, boxShadow: '0 0 10px rgba(59,130,246,0.5)' }}>New</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {assignment.description || 'Hakuna maelezo yaliyowekwa...'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{assignment.className}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                      {assignment.dueDate ? new Date(assignment.dueDate.seconds * 1000).toLocaleString() : 'No deadline'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: '#fff', fontSize: 13 }}>{assignment.totalMarks || 100}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        fontSize: 10,
                        fontWeight: 800,
                        background: isPub ? 'rgba(16, 185, 129, 0.12)' : isClosed ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255,255,255,0.05)',
                        color: isPub ? '#10B981' : isClosed ? '#EF4444' : 'rgba(255,255,255,0.4)',
                        padding: '4px 10px',
                        borderRadius: 6,
                        textTransform: 'uppercase'
                      }}>
                        {assignment.status || 'draft'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          onClick={() => setViewingSubmissions(assignment)}
                          style={{ background: 'rgba(59, 130, 246, 0.1)', border: 'none', padding: '6px 10px', borderRadius: 8, color: '#3B82F6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800 }}
                          title="View Submissions"
                        >
                          <ClipboardList size={14} /> Submissions
                        </button>
                        <select 
                          value={assignment.status || "draft"}
                          onChange={(e) => handleToggleStatus(assignment, e.target.value)}
                          style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px', fontSize: 11, outline: 'none', cursor: 'pointer', height: 28 }}
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="closed">Closed</option>
                        </select>
                        <button
                          onClick={() => setEditingAssignment(assignment)}
                          style={{ background: 'rgba(255,255,255,0.04)', border: 'none', padding: 6, borderRadius: 8, color: '#F5A623', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Edit Assignment"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDuplicate(assignment)}
                          style={{ background: 'rgba(255,255,255,0.04)', border: 'none', padding: 6, borderRadius: 8, color: '#10B981', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Duplicate Assignment"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(assignment)}
                          style={{ background: 'rgba(239,68,68,0.08)', border: 'none', padding: 6, borderRadius: 8, color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Delete Assignment"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 4000, display: "grid", placeItems: "center", padding: 20, background: "rgba(0,0,0,.7)" }}>
          <div style={{ background: "#0c0e14", padding: 24, borderRadius: 18, maxWidth: 420, width: "100%", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Delete assignment?</h3>
            <p style={{ margin: "12px 0 0", color: "rgba(255,255,255,0.68)", lineHeight: 1.6 }}>{deleteTarget.title}</p>
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, border: "none", borderRadius: 12, padding: "12px 14px", background: "rgba(255,255,255,0.05)", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={async () => { await handleDelete(deleteTarget); setDeleteTarget(null); }} style={{ flex: 1, border: "none", borderRadius: 12, padding: "12px 14px", background: "#dc2626", color: "#fff", fontWeight: 900, cursor: "pointer" }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherAssignmentsSection;
