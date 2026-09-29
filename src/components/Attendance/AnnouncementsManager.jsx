import { useState, useEffect } from "react";
import { getFirebaseDb } from "../../firebase";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { Bell, Trash2, Loader2, Send } from "lucide-react";
import { notifyClassStudents } from "./notificationUtils";

const G = "#F5A623";

export default function AnnouncementsManager({ classId, teacherId, isTeacher, onRead }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const db = getFirebaseDb();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!classId || !db) return;
    const q = query(
      collection(db, "announcements"),
      where("classId", "==", classId)
    );

    const unsub = onSnapshot(q, (snap) => {
      let arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      arr.sort((a,b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
        return tB - tA;
      });

      setAnnouncements(arr);
      setLoading(false);
    });

    return () => unsub();
  }, [classId, db]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const con = message.trim();
    if (!con || submitting) return;
    setSubmitting(true);
    try {
      const tit = "Announcement";
      await addDoc(collection(db, "announcements"), {
        classId,
        teacherId,
        title: tit,
        content: con,
        target: "all",
        status: "published",
        createdAt: serverTimestamp()
      });
      
      await notifyClassStudents(classId, {
         type: "announcement",
         title: tit,
         message: con.substring(0, 50) + (con.length > 50 ? "..." : ""),
         link: "announcements",
         createdBy: teacherId
      });
      
      setMessage("");
      e.target.reset();
      showToast("Tangazo limechapishwa!");
    } catch (err) {
      console.error(err);
      showToast("Imeshindikana kuchapisha tangazo", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmDeleteId(id);
  };

  const performDelete = async () => {
    try {
      await deleteDoc(doc(db, "announcements", confirmDeleteId));
      setConfirmDeleteId(null);
      showToast("Tangazo limefutwa");
    } catch (err) {
      console.error(err);
      showToast("Imeshindikana kufuta", "error");
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}><Loader2 className="animate-spin" color={G} /></div>;
  }

  return (
    <div className="glass-card" style={{ padding: 32, borderRadius: 32 }}>
      <h3 style={{ fontSize: 20, fontWeight: 900, display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <Bell size={20} color={G} /> Announcements
      </h3>

      {isTeacher && (
        <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 20, marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#F5A623", margin: "0 0 16px 0" }}>Write New Announcement</h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input 
              name="announce_title" 
              placeholder="Announcement Title" 
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: 12, borderRadius: 10, color: "#fff", outline: "none" }} 
              required 
            />
            <textarea 
              name="announce_content" 
              rows={3} 
              placeholder="Write announcement details..." 
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: 12, borderRadius: 10, color: "#fff", outline: "none", resize: "none" }} 
              required
            />
            <button 
              type="submit" 
              disabled={submitting}
              style={{ background: "#F5A623", color: "#000", border: "none", borderRadius: 10, padding: 12, fontWeight: 900, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? "Posting..." : "Publish Announcement"}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {announcements.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, opacity: 0.3 }}>
             <Bell size={48} style={{ margin: "0 auto 16px" }} />
             <p>Hakuna matangazo bado.</p>
          </div>
        ) : (
          announcements.map(ann => (
            <div key={ann.id} onClick={() => !isTeacher && onRead?.(ann.id)} style={{ background: "rgba(255,255,255,0.02)", borderLeft: `3px solid ${G}`, borderRadius: "0 16px 16px 0", padding: 20, cursor: isTeacher ? "default" : "pointer" }}>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    {ann.title && ann.title !== "Class Announcement" && (
                      <h4 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 4px 0", color: "#fff" }}>{ann.title}</h4>
                    )}
                    <p style={{ fontSize: ann.title && ann.title !== "Class Announcement" ? 14 : 16, lineHeight: 1.5, margin: 0, whiteSpace: "pre-wrap", color: ann.title && ann.title !== "Class Announcement" ? "rgba(255,255,255,0.8)" : "#fff" }}>
                      {ann.content || ann.message}
                    </p>
                  </div>
                  {isTeacher && (
                    <button onClick={() => handleDelete(ann.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", padding: "0 8px", alignSelf: "flex-start" }}>
                      <Trash2 size={16} />
                    </button>
                  )}
               </div>
               <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  {new Date(ann.createdAt?.toDate()).toLocaleString()}
               </div>
            </div>
          ))
        )}
      </div>

      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: toast.type === "error" ? "#991b1b" : "#166534",
          color: "#fff", padding: "12px 20px", borderRadius: 12, fontWeight: 700,
          boxShadow: "0 12px 30px rgba(0,0,0,.3)"
        }}>
          {toast.msg}
        </div>
      )}

      {confirmDeleteId && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(5, 6, 10, 0.75)", backdropFilter: "blur(10px)",
          display: "grid", placeItems: "center", zIndex: 99999
        }}>
          <div style={{
            background: "#1e1e24", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20, padding: 24, width: "min(380px, calc(100vw - 32px))",
            textAlign: "center", color: "#fff"
          }}>
            <h3 style={{ margin: "0 0 10px" }}>Futa Tangazo?</h3>
            <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.6)", margin: "0 0 20px" }}>Je, una uhakika unataka kufuta tangazo hili? Kitendo hiki hakiwezi kurejeshwa.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDeleteId(null)} style={{ flex: 1, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#fff", borderRadius: 8, cursor: "pointer" }}>Ghairi / Cancel</button>
              <button onClick={performDelete} style={{ flex: 1, padding: "10px 14px", border: 0, background: "#dc2626", color: "#fff", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Futa / Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
