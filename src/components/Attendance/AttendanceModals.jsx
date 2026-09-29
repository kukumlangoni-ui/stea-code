import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, Eye, Clock, Square, X } from "lucide-react";

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.85)",
  backdropFilter: "blur(10px)",
  display: "grid",
  placeItems: "center",
  zIndex: 4000,
  padding: 20
};

const modalContentStyle = {
  background: "#12141c",
  padding: 32,
  borderRadius: 28,
  width: "100%",
  maxWidth: 440,
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 24px 48px rgba(0,0,0,0.5)"
};

export function LiveTimer({ endTime }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!endTime) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = endTime - now;
      if (diff <= 0) {
        setTimeLeft("00:00");
        setIsUrgent(true);
        clearInterval(interval);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      setIsUrgent(diff < 300000); // Less than 5 mins
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <div style={{ fontSize: 24, fontWeight: 900, color: isUrgent ? "#EF4444" : "#10B981", marginTop: 4 }}>
      {timeLeft}
    </div>
  );
}

export function AttendanceModals({ 
  sessionConflict, setSessionConflict, 
  extendingSession, setExtendingSession, 
  onOpenMonitor, onEndSession, onExtendTime 
}) {
  if (!sessionConflict && !extendingSession) return null;

  return (
    <>
      <AnimatePresence>
        {sessionConflict && (
          <div key="modal-session-conflict" style={modalOverlayStyle}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ ...modalContentStyle, border: "1px solid #10B981" }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(16, 185, 129, 0.1)", color: "#10B981", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
                  <AlertCircle size={32} />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Attendance already active</h2>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>You already have a running register for <strong>{sessionConflict.classData.className}</strong>.</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button 
                  onClick={() => { onOpenMonitor(sessionConflict.session); setSessionConflict(null); }}
                  style={{ width: "100%", background: "#10B981", color: "#000", border: "none", padding: 14, borderRadius: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <Eye size={18} /> Open Current Register
                </button>
                <button 
                  onClick={() => { setExtendingSession(sessionConflict.session); setSessionConflict(null); }}
                  style={{ width: "100%", background: "rgba(245, 166, 35, 0.1)", color: "#F5A623", border: "1px solid rgba(245, 166, 35, 0.3)", padding: 14, borderRadius: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <Clock size={18} /> Extend Time
                </button>
                <button 
                  onClick={() => { onEndSession(sessionConflict.session.id); }}
                  style={{ width: "100%", background: "rgba(239, 68, 68, 0.1)", color: "#EF4444", border: "1px solid rgba(239, 68, 68, 0.3)", padding: 14, borderRadius: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <Square size={18} fill="currentColor" /> End Current Register
                </button>
                <button 
                  onClick={() => setSessionConflict(null)}
                  style={{ width: "100%", background: "transparent", color: "rgba(255,255,255,0.4)", border: "none", padding: 12, borderRadius: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Ghairi (Cancel)
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {extendingSession && (
          <div key="modal-extending-session" style={modalOverlayStyle}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={modalContentStyle}>
              <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>Extend Attendance</h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>Select how many minutes to add to the current session for <strong>{extendingSession.className}</strong>.</p>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 20 }}>
                {[5, 10, 15, 30].map(mins => (
                  <button 
                    key={mins}
                    onClick={() => onExtendTime(extendingSession.id, mins)}
                    style={{ background: "rgba(245, 166, 35, 0.1)", color: "#F5A623", border: "1px solid rgba(245, 166, 35, 0.2)", padding: 12, borderRadius: 10, fontWeight: 800, cursor: "pointer" }}
                  >
                    +{mins}m
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setExtendingSession(null)}
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", color: "#fff", border: "none", padding: 12, borderRadius: 10, fontWeight: 700, cursor: "pointer" }}
              >
                Ghairi
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
