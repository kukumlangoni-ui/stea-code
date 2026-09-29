import React, { useState, useEffect } from 'react';
import { getFirebaseDb } from '../../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { FileText, Loader2, Edit2, Trash2, Globe, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const G = "#F5A623";

export function UserResourcesList({ user, filterType }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    if (!user) return;
    const db = getFirebaseDb();
    let q = query(
      collection(db, 'study_resources'), 
      where('ownerId', '==', user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (filterType) {
        data = data.filter(d => d.type === filterType);
      }
      setResources(data.sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
      setLoading(false);
    });

    return () => unsub();
  }, [user, filterType]);

  const handleDelete = async (id) => {
     setConfirmDialog({
       title: "Delete resource?",
       message: "Delete this resource permanently?",
       confirmText: "Delete",
       cancelText: "Cancel",
       onConfirm: async () => {
         try {
            await deleteDoc(doc(getFirebaseDb(), 'study_resources', id));
         } catch(e) {
            console.error(e);
         }
       }
     });
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Loader2 className="spin" color={G} /></div>;

  if (resources.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 20 }}>
        <FileText size={40} color="rgba(255,255,255,0.2)" style={{ marginBottom: 16 }} />
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Hujapakia resource yoyote hapa bado.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
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
      {resources.map(res => (
         <div key={res.id} style={{
           background: 'rgba(255,255,255,0.03)',
           border: '1px solid rgba(255,255,255,0.06)',
           borderRadius: 16,
           padding: '16px 20px',
           display: 'flex',
           justifyContent: 'space-between',
           alignItems: 'center'
         }}>
            <div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                 <h4 style={{ fontSize: 16, fontWeight: 700 }}>{res.title}</h4>
                 {res.status === 'published' ? (
                    <span style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', padding: '2px 8px', borderRadius: 10 }}>
                      <CheckCircle size={10} /> Published
                    </span>
                 ) : (
                    <span style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(251, 146, 60, 0.1)', color: '#fb923c', padding: '2px 8px', borderRadius: 10 }}>
                      <Clock size={10} /> Pending Review
                    </span>
                 )}
               </div>
               <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', gap: 12 }}>
                 <span>{res.subject || res.level}</span>
                 {res.clicks !== undefined && <span>👁️ {res.clicks} views</span>}
               </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
               {res.downloadUrl && (
                  <a href={res.downloadUrl} target="_blank" rel="noreferrer" style={{ color: G, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                     View PDF
                  </a>
               )}
               <button onClick={() => handleDelete(res.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 4 }}>
                  <Trash2 size={16} />
               </button>
            </div>
         </div>
      ))}
    </div>
  );
}
