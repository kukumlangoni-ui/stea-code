import { useState, useEffect } from "react";
import { getFirebaseDb } from "../../firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc,
  orderBy
} from "firebase/firestore";
import { 
  ClipboardList, 
  Plus, 
  Clock, 
  Calendar, 
  Trash2, 
  Edit3, 
  Eye, 
  FileText,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AssignmentModal from "./AssignmentModal";
import AssignmentSubmissions from "./AssignmentSubmissions";

const G = "#F5A623";

export default function AssignmentManager({ classId, classData, classStudents, teacherId, isTeacher: passedIsTeacher, user, userRole }) {
  const [assignments, setAssignments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [selectedSubmissionView, setSelectedSubmissionView] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const isStudent = userRole === "student";
  const isTeacher = passedIsTeacher;
  const isTeacherOwner = isTeacher;

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db || !classId) return;

    const q = query(
      collection(db, "assignments"),
      where("classId", "==", classId)
    );

    const unsub = onSnapshot(q, (snap) => {
      let arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      arr.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setAssignments(arr);
      setLoading(false);
    });

    return () => unsub();
  }, [classId]);

  const handleDelete = async (id) => {
    if (isStudent || !isTeacherOwner) {
      setNotice({ type: "error", message: "Permission denied." });
      return;
    }
    try {
      const db = getFirebaseDb();
      await deleteDoc(doc(db, "assignments", id));
      setNotice({ type: "success", message: "Assignment deleted successfully." });
    } catch (err) {
      setNotice({ type: "error", message: "Assignment could not be deleted." });
    }
  };

  const filteredAssignments = isTeacher 
    ? assignments 
    : assignments.filter(a => a.status === "published" || !a.status);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {notice && <div role="status" style={{ padding: 12, borderRadius: 10, background: notice.type === "error" ? "rgba(239,68,68,.15)" : "rgba(16,185,129,.15)", color: notice.type === "error" ? "#fca5a5" : "#86efac" }}>{notice.message}</div>}
      {selectedSubmissionView ? (
        <AssignmentSubmissions 
          assignment={selectedSubmissionView} 
          onBack={() => setSelectedSubmissionView(null)} 
          isTeacher={isTeacher}
          user={user}
          classData={classData}
          classStudents={classStudents}
        />
      ) : (
        <div className="glass-card" style={{ padding: 32, borderRadius: 32 }}>
          <div className="mobile-stack" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 16 }}>
            <h3 style={{ fontSize: 20, fontWeight: 900, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <ClipboardList size={20} color={G} /> Resources & Assignments ({filteredAssignments.length})
            </h3>
            {isTeacher && (
              <button 
                onClick={() => { setEditingAssignment(null); setShowModal(true); }}
                className="stea-action-button"
                style={{ background: G, color: "#000" }}
              >
                <Plus size={16} /> Add New
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: 40, opacity: 0.5 }}>Loading...</div>
            ) : filteredAssignments.length > 0 ? (
              filteredAssignments.map((a) => (
                <AssignmentCard 
                  key={a.id} 
                  assignment={a} 
                  isTeacher={isTeacher} 
                  onEdit={() => { setEditingAssignment(a); setShowModal(true); }}
                  onDelete={() => setDeleteTarget(a)}
                  onViewSubmissions={() => setSelectedSubmissionView(a)}
                />
              ))
            ) : (
              <div style={{ textAlign: "center", padding: 40, opacity: 0.3 }}>
                <ClipboardList size={48} style={{ margin: "0 auto 16px" }} />
                <p>Hakuna material yaliyowekwa bado.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <AssignmentModal 
          classId={classId} 
          teacherId={teacherId} 
          assignment={editingAssignment}
          onClose={() => setShowModal(false)} 
        />
      )}
      {deleteTarget && <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "grid", placeItems: "center", padding: 20, background: "rgba(0,0,0,.7)" }}><div style={{ background: "#111", padding: 24, borderRadius: 16, maxWidth: 360, width: "100%" }}><h3>Delete assignment?</h3><p style={{ opacity: .7 }}>{deleteTarget.title}</p><div style={{ display: "flex", gap: 10 }}><button onClick={() => setDeleteTarget(null)} style={btnStyle}>Cancel</button><button onClick={() => { handleDelete(deleteTarget.id); setDeleteTarget(null); }} style={{ ...btnStyle, background: "#dc2626" }}>Delete</button></div></div></div>}
    </div>
  );
}

function AssignmentCard({ assignment, isTeacher, onEdit, onDelete, onViewSubmissions }) {
  const isAssignment = assignment.type !== "resource";
  const isExpired = isAssignment && assignment.dueDate && assignment.dueDate.toDate() < new Date();

  return (
    <div style={{ 
      padding: 20, 
      borderRadius: 24, 
      background: "rgba(255,255,255,0.03)", 
      border: "1px solid rgba(255,255,255,0.05)",
      display: "flex", 
      flexDirection: "column", 
      gap: 16 
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 900, fontSize: 18 }}>{assignment.title}</span>
            <span style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 900, textTransform: "uppercase" }}>
              {assignment.type || "assignment"}
            </span>
            {assignment.status === "draft" && (
              <span style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 900 }}>DRAFT</span>
            )}
          </div>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.5 }}>
            {assignment.description || "No description provided."}
          </p>
        </div>
        
        {isAssignment && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: G }}>{assignment.totalMarks}</div>
            <div style={{ fontSize: 10, opacity: 0.5, fontWeight: 800 }}>MARKS</div>
          </div>
        )}
      </div>

      <div className="mobile-stack" style={{ justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {isAssignment && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: isExpired ? "#ef4444" : "rgba(255,255,255,0.4)" }}>
              <Clock size={14} />
              Deadline: {assignment.dueDate ? assignment.dueDate.toDate().toLocaleString() : "Not set"}
            </div>
          )}
          {assignment.attachmentUrls?.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              <FileText size={14} />
              {assignment.attachmentUrls.length} Files
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: "fit-content" }}>
          {isTeacher ? (
            <>
              <button onClick={onViewSubmissions} style={btnStyle} title={isAssignment ? "View Submissions" : "View Resource"}>
                <Eye size={14} /> <span className="sm-show">View</span>
              </button>
              <button onClick={onEdit} style={btnStyle} title="Edit">
                <Edit3 size={14} />
              </button>
              <button onClick={onDelete} style={{ ...btnStyle, color: "#ef4444" }} title="Delete">
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <button 
              onClick={onViewSubmissions} 
              className="stea-action-button"
              style={{ background: isExpired && !assignment.allowLateSubmission ? "rgba(255,255,255,0.05)" : G, color: isExpired && !assignment.allowLateSubmission ? "rgba(255,255,255,0.2)" : "#000", height: 40, padding: "0 24px", width: "auto" }}
              disabled={isExpired && !assignment.allowLateSubmission}
            >
              {isExpired && !assignment.allowLateSubmission ? "Expired" : (isAssignment ? "View & Submit" : "View Resource")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const btnStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "none",
  color: "#fff",
  padding: "8px 12px",
  borderRadius: 10,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  fontWeight: 800
};
