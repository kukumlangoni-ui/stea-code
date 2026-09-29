import { useState, useEffect } from "react";
import { Pin, MessageSquare, ExternalLink, FileText, Play, Send, Trash2, Smile } from "lucide-react";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseDb, getFirebaseAuth } from "../../firebase";

const GOLD = "#D4AF37";

export default function AnnouncementCard({ announcement, role, user, classId }) {
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // Listen for Comments for this specific announcement
  useEffect(() => {
    if (!announcement.id || !db) return;
    const q = query(
      collection(db, "announcements", announcement.id, "comments")
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in-memory to avoid needing index creation on nested subcollections
      list.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
      setComments(list);
    });
    return () => unsub();
  }, [announcement.id, db]);

  // Pin / Unpin announcement (Teacher only)
  const handleTogglePin = async (e) => {
    e.stopPropagation();
    if (role !== "teacher") return;
    try {
      await updateDoc(doc(db, "announcements", announcement.id), {
        isPinned: !announcement.isPinned
      });
    } catch (err) {
      console.error("Pin failed", err);
    }
  };

  // Delete announcement (Teacher or Author only)
  const handleDelete = (e) => {
    e.stopPropagation();
    if (role !== "teacher" && announcement.authorId !== user.uid) return;
    setShowConfirmDelete(true);
  };

  // Submit Comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      await addDoc(collection(db, "announcements", announcement.id, "comments"), {
        content: newComment.trim(),
        authorId: user.uid,
        authorName: user.displayName || user.email,
        createdAt: serverTimestamp()
      });
      setNewComment("");
    } catch (err) {
      console.error("Comment failed", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Toggle Reactions
  const handleReact = async (emoji) => {
    const currentReactions = announcement.reactions || {};
    const updatedReactions = { ...currentReactions };
    
    // Toggle: if user already has this reaction, remove it, else set it
    if (updatedReactions[user.uid] === emoji) {
      delete updatedReactions[user.uid];
    } else {
      updatedReactions[user.uid] = emoji;
    }

    try {
      await updateDoc(doc(db, "announcements", announcement.id), {
        reactions: updatedReactions
      });
    } catch (err) {
      console.error("Reaction failed", err);
    }
    setShowReactionPicker(false);
  };

  // Compute reaction counts
  const reactionCounts = {};
  const currentReactions = announcement.reactions || {};
  Object.values(currentReactions).forEach(emoji => {
    reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
  });

  const now = Date.now();
  const schedTime = announcement.scheduledAt?.toMillis?.() || (announcement.scheduledAt ? new Date(announcement.scheduledAt).getTime() : null);
  const isScheduled = schedTime && schedTime > now;

  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #dadce0",
      borderRadius: 12,
      padding: 20,
      boxShadow: announcement.isPinned ? "0 4px 12px rgba(212, 175, 55, 0.05)" : "0 2px 6px rgba(0,0,0,0.01)",
      borderLeft: announcement.isPinned ? `4px solid ${GOLD}` : "1px solid #dadce0",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      gap: 12
    }}>
      
      {/* Top Header Pin & Metadata */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ 
            width: 36, height: 36, borderRadius: "50%", 
            background: announcement.isPinned ? "#fef7e0" : "#f1f3f4", 
            color: announcement.isPinned ? GOLD : "#5f6368", 
            display: "grid", placeItems: "center", fontWeight: 700, fontSize: 14 
          }}>
            {(announcement.authorName || 'M').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#202124", display: "flex", alignItems: "center", gap: 6 }}>
              {announcement.authorName || 'Mwalimu'}
              {announcement.authorId === announcement.teacherId && (
                <span style={{ fontSize: 10, background: "#e8f0fe", color: "#1a73e8", padding: "1px 6px", borderRadius: 4, fontWeight: 500 }}>Mwalimu</span>
              )}
            </div>
            <div style={{ fontSize: 10.5, color: "#5f6368", marginTop: 2, display: "flex", gap: 8 }}>
              <span>{announcement.createdAt ? new Date(announcement.createdAt.toDate()).toLocaleString() : ''}</span>
              {isScheduled && (
                <span style={{ color: "#b78103", fontWeight: 700 }}>
                  Scheduled: {new Date(schedTime).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {role === "teacher" && (
            <button
              onClick={handleTogglePin}
              title={announcement.isPinned ? "Unpin Announcement" : "Pin Announcement"}
              style={{
                background: announcement.isPinned ? "#fef7e0" : "none",
                border: "none",
                borderRadius: "50%",
                width: 28, height: 28,
                color: announcement.isPinned ? GOLD : "#5f6368",
                cursor: "pointer",
                display: "grid", placeItems: "center"
              }}
            >
              <Pin size={15} style={{ transform: announcement.isPinned ? "none" : "rotate(45deg)" }} />
            </button>
          )}

          {(role === "teacher" || announcement.authorId === user.uid) && (
            <button
              onClick={handleDelete}
              title="Futa Tangazo"
              style={{
                background: "none",
                border: "none",
                borderRadius: "50%",
                width: 28, height: 28,
                color: "#d93025",
                cursor: "pointer",
                display: "grid", placeItems: "center"
              }}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <p style={{ 
        fontSize: 14, color: "#3c4043", margin: 0, lineHeight: 1.6, 
        whiteSpace: "pre-wrap", overflowWrap: "anywhere" 
      }}>
        {announcement.content || announcement.message}
      </p>

      {/* Attachments Section */}
      {announcement.attachments && announcement.attachments.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          {announcement.attachments.map((att, idx) => {
            if (att.type === "image") {
              return (
                <div key={idx} style={{ maxWidth: "100%", overflow: "hidden", borderRadius: 8, border: "1px solid #dadce0" }}>
                  <img src={att.url} alt={att.name || "Attachment"} style={{ width: "100%", maxHeight: 300, objectFit: "contain", display: "block" }} />
                </div>
              );
            }
            if (att.type === "video") {
              return (
                <div key={idx} style={{ maxWidth: "100%", borderRadius: 8, overflow: "hidden", border: "1px solid #dadce0", background: "#000" }}>
                  <video src={att.url} controls style={{ width: "100%", maxHeight: 300, display: "block" }} />
                </div>
              );
            }
            if (att.type === "pdf") {
              return (
                <a key={idx} href={att.url} target="_blank" rel="noreferrer" style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8,
                  border: "1px solid #dadce0", background: "#f8f9fa", color: "#3c4043", textDecoration: "none", fontSize: 13, fontWeight: 700
                }}>
                  <FileText size={18} color="#d93025" />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.name || "Download PDF"}</span>
                  <ExternalLink size={14} color="#5f6368" />
                </a>
              );
            }
            if (att.type === "link") {
              return (
                <a key={idx} href={att.url} target="_blank" rel="noreferrer" style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8,
                  border: "1px solid #dadce0", background: "#f8f9fa", color: "#3c4043", textDecoration: "none", fontSize: 13, fontWeight: 700
                }}>
                  <Play size={18} color={GOLD} />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.name || att.url}</span>
                  <ExternalLink size={14} color="#5f6368" />
                </a>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Reactions and Comment actions bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f3f4", paddingTop: 10, marginTop: 4, flexWrap: "wrap", gap: 8 }}>
        
        {/* Reactions List and Picker */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
          {/* Active Reaction Pills */}
          {Object.entries(reactionCounts).map(([emoji, count]) => {
            const hasMyReaction = currentReactions[user.uid] === emoji;
            return (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                style={{
                  background: hasMyReaction ? "#fef7e0" : "#f1f3f4",
                  border: hasMyReaction ? `1px solid ${GOLD}` : "1px solid transparent",
                  padding: "2px 8px", borderRadius: 12, fontSize: 12, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4, fontWeight: 600
                }}
              >
                <span>{emoji}</span>
                <span style={{ fontSize: 10, color: "#5f6368" }}>{count}</span>
              </button>
            );
          })}

          {/* Add Reaction Trigger Button */}
          <button
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            style={{
              background: "none", border: "none", color: "#5f6368", cursor: "pointer",
              width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center"
            }}
            title="React"
          >
            <Smile size={16} />
          </button>

          {/* Popover Emoji Picker */}
          {showReactionPicker && (
            <div style={{
              position: "absolute", bottom: 32, left: 0, background: "#fff",
              border: "1px solid #dadce0", borderRadius: 20, padding: "6px 10px",
              display: "flex", gap: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 100
            }}>
              {["👍", "❤️", "👏", "😂", "😮"].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", padding: 0 }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comments Count Toggle */}
        <button
          onClick={() => setShowComments(!showComments)}
          style={{
            background: "none", border: "none", color: GOLD, fontSize: 12.5, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6
          }}
        >
          <MessageSquare size={15} />
          {comments.length === 0 ? "Weka Maoni / Comment" : `${comments.length} Maoni`}
        </button>
      </div>

      {/* Expanded Comments Thread */}
      {showComments && (
        <div style={{ background: "#f8f9fa", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          {comments.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, borderBottom: "1px solid #e0e0e0", paddingBottom: 10, marginBottom: 4 }}>
              {comments.map((comm) => (
                <div key={comm.id} style={{ fontSize: 12.5, color: "#3c4043" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ color: "#202124" }}>{comm.authorName}</strong>
                    <span style={{ fontSize: 9.5, color: "#5f6368" }}>
                      {comm.createdAt ? new Date(comm.createdAt.toDate()).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <p style={{ margin: "2px 0 0 0", color: "#3c4043", lineHeight: 1.4 }}>{comm.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* New Comment Input Form */}
          <form onSubmit={handleSubmitComment} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="text"
              placeholder="Andika maoni yako hapa..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              style={{
                flex: 1, padding: "8px 12px", border: "1px solid #dadce0", borderRadius: 8,
                fontSize: 12.5, outline: "none", background: "#fff", color: "#202124"
              }}
              required
            />
            <button
              type="submit"
              disabled={submittingComment || !newComment.trim()}
              style={{
                background: GOLD, color: "#fff", border: "none", width: 32, height: 32,
                borderRadius: "50%", display: "grid", placeItems: "center", cursor: "pointer",
                opacity: (!newComment.trim() || submittingComment) ? 0.5 : 1
              }}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      {showConfirmDelete && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(5, 6, 10, 0.75)", backdropFilter: "blur(10px)",
          display: "grid", placeItems: "center", zIndex: 9999
        }}>
          <div style={{
            background: "#1e1e24", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20, padding: 24, width: "min(380px, calc(100vw - 32px))",
            textAlign: "center", color: "#fff"
          }}>
            <h3 style={{ margin: "0 0 10px" }}>Futa Tangazo?</h3>
            <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.6)", margin: "0 0 20px" }}>Je, una uhakika unataka kufuta tangazo hili? Kitendo hiki hakiwezi kurejeshwa.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowConfirmDelete(false)} style={{ flex: 1, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#fff", borderRadius: 8, cursor: "pointer" }}>Hapana / Cancel</button>
              <button onClick={async () => {
                setShowConfirmDelete(false);
                try {
                  await deleteDoc(doc(db, "announcements", announcement.id));
                } catch (err) {
                  console.error("Delete failed", err);
                }
              }} style={{ flex: 1, padding: "10px 14px", border: 0, background: "#dc2626", color: "#fff", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Ndiyo / Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
