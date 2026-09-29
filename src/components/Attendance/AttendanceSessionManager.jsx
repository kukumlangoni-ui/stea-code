import { useState, useEffect } from "react";
import { getFirebaseDb, getFirebaseAuth } from "../../firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  orderBy,
  deleteDoc
} from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { 
  Clock, 
  Play, 
  Square, 
  Users, 
  History, 
  X,
  Maximize,
  Loader2,
  Check,
  AlertCircle,
  Copy
} from "lucide-react";
import { notifyClassStudents } from "./notificationUtils";
import { StartSessionModal } from "./TeacherModals";
import AttendanceSubmissionModal from "./AttendanceSubmissionModal";

const G = "#F5A623";

export default function AttendanceSessionManager({ classId, teacherId, isTeacher, className }) {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [loading, setLoading] = useState(true);
  const [sessionConflict, setSessionConflict] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Loading State
  const [isStartingRegister, setIsStartingRegister] = useState(false);

  const db = getFirebaseDb();
  const previewAuthEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_PREVIEW_AUTH === "true";

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!classId || !db) return;
    const q = isTeacher
      ? query(collection(db, "attendanceSessions"), where("classId", "==", classId))
      : query(
          collection(db, "attendanceSessions"),
          where("classId", "==", classId),
          where("status", "==", "active"),
          where("isActive", "==", true)
        );
    const unsub = onSnapshot(q, (snap) => {
      let sess = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Sort on client instead of composite index
      sess.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

      
      if (previewAuthEnabled && sess.length === 0) {
        sess = [{
           id: "demo-sess-1",
           joinCode: "ATT123",
           durationSeconds: 300,
           startTime: Date.now() - 60000,
           endTime: Date.now() + 240000,
           status: "active"
        }];
      }

      setSessions(sess);
      
      const active = sess.find(s => s.status === "active");
      if (active) {
        // Automatically close if past endTime
        if (active.endTime && Date.now() > active.endTime) {
          updateDoc(doc(db, "attendanceSessions", active.id), { status: "closed" });
          setActiveSession(null);
        } else {
          setActiveSession(active);
        }
      } else {
        setActiveSession(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [classId, db, isTeacher, previewAuthEnabled]);

  const startSession = async (durationMinutes, gpsRequired, centerLat = null, centerLng = null, radiusMeters = null, code = null) => {
    if (isStartingRegister) return;
    if (!db || !isTeacher) return;

    // Check for active session conflict
    const existingActive = sessions.find(s => s.status === "active" && (!s.endTime || s.endTime > Date.now()));
    if (existingActive) {
      setSessionConflict(existingActive);
      setShowStartModal(false);
      return;
    }
    
    setIsStartingRegister(true);

    const actualCode = code || Math.random().toString(36).substring(2, 8).toUpperCase();
    const now = Date.now();
    const durationSeconds = durationMinutes * 60;
    const endTime = now + (durationSeconds * 1000);

    try {
      const auth = getFirebaseAuth();
      const currentUser = auth?.currentUser;

      const docRef = await addDoc(collection(db, "attendanceSessions"), {
        classId,
        teacherId,
        teacherEmail: currentUser?.email || "",
        className,
        code: actualCode,
        sessionCode: actualCode, // dual-compatibility
        joinCode: actualCode, // dual-compatibility
        durationSeconds: durationSeconds,
        durationMinutes,
        startsAt: now,
        endsAt: endTime,
        startTime: now, // legacy
        endTime, // legacy
        gpsRequired: gpsRequired,
        requireGpsForAttendance: gpsRequired,
        centerLat,
        centerLng,
        radiusMeters,
        status: "active",
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Write Audit Log
      await addDoc(collection(db, "classroomAuditLogs"), {
        action: "attendance_started",
        classId: classId,
        className: className || "",
        userId: teacherId,
        userName: currentUser?.displayName || "Mwalimu",
        timestamp: serverTimestamp(),
        details: {
          sessionId: docRef.id,
          code: actualCode,
          durationMinutes,
          gpsRequired,
          centerLat,
          centerLng,
          radiusMeters
        }
      }).catch(err => console.error("Error writing audit log:", err));
      
      await notifyClassStudents(classId, {
         type: "attendance",
         title: "Attendance Started",
         message: `A new attendance register has been opened for ${className}.`,
         link: "attendance",
         createdBy: teacherId
      });

      setShowStartModal(false);
      setIsStartingRegister(false);

    } catch (err) {
      showToast("Imeshindwa kuanzisha register. Tafadhali jaribu tena.", "error");
      setIsStartingRegister(false);
    }
  };

  const endSession = async (sessionId) => {
    if (!db || !isTeacher) return;
    try {
      const auth = getFirebaseAuth();
      const currentUser = auth?.currentUser;

      await updateDoc(doc(db, "attendanceSessions", sessionId), {
        status: "ended",
        isActive: false,
        endedAt: serverTimestamp(),
        endTime: Date.now(),
        endsAt: Date.now()
      });

      // Write Audit Log
      await addDoc(collection(db, "classroomAuditLogs"), {
        action: "attendance_ended",
        classId: classId,
        className: className || "",
        userId: teacherId,
        userName: currentUser?.displayName || "Mwalimu",
        timestamp: serverTimestamp(),
        details: {
          sessionId: sessionId
        }
      }).catch(err => console.error("Error writing audit log:", err));
      
      await notifyClassStudents(classId, {
         type: "attendance",
         title: "Attendance Closed",
         message: `The attendance register for ${className} is now closed.`,
         link: "attendance",
         createdBy: teacherId
      });
    } catch(err) {
      showToast("Hitilafu imetokea kufunga session", "error");
    }
  };

  const deleteSession = (sessionId) => {
     setConfirmDeleteId(sessionId);
  };

  const performDeleteSession = async () => {
     try {
       await deleteDoc(doc(db, "attendanceSessions", confirmDeleteId));
       setConfirmDeleteId(null);
       showToast("Session imefutwa");
     } catch (e) {
       showToast("Imeshindwa kufuta", "error");
     }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", opacity: 0.5 }}>loadinging...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* Active Session Display */}
      {activeSession ? (
        <ActiveSessionView session={activeSession} onEnd={() => endSession(activeSession.id)} isTeacher={isTeacher} />
      ) : (
        <div className="glass-card" style={{ padding: 32, borderRadius: 24, textAlign: "center", background: "rgba(255,255,255,0.02)" }}>
           <Clock size={48} style={{ margin: "0 auto 16px", opacity: 0.2 }} />
           <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>Hakuna Attendance inayoendelea</h3>
           <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>Mwalimu anaweza kuanzisha session ya mahudhurio ya muda maalum.</p>
           {isTeacher && (
             <button 
               onClick={() => setShowStartModal(true)}
               style={{ background: G, color: "#000", border: "none", padding: "12px 24px", borderRadius: 12, fontWeight: 900, display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}
             >
               <Play size={18} fill="currentColor" /> Start Register
             </button>
           )}
        </div>
      )}

      {/* Session History */}
      {sessions.length > 0 && (
        <div className="glass-card" style={{ padding: 24, borderRadius: 24 }}>
           <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
             <History size={18} color={G} /> Historia ya Mahudhurio
           </h3>
           <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
             {sessions.map(s => (
               <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>
                      {new Date(s.startTime).toLocaleDateString()} at {new Date(s.startTime).toLocaleTimeString()}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                      Code: <span style={{ color: G, fontWeight: 900 }}>{s.joinCode}</span> • Duration: {s.durationSeconds}s
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ background: s.status === "active" ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)", color: s.status === "active" ? "#10b981" : "rgba(255,255,255,0.5)", padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>
                      {s.status}
                    </div>
                    {isTeacher && s.status !== "active" && (
                       <button onClick={() => deleteSession(s.id)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer" }}>
                         <X size={16} />
                       </button>
                    )}
                  </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* Start Modal */}
      <AnimatePresence>
        {showStartModal && (
          <StartSessionModal 
             item={{ id: classId, className: className }}
             onClose={() => setShowStartModal(false)}
             onSubmit={({ duration, gpsRequired, centerLat, centerLng, radiusMeters, code }) => {
                 startSession(duration, gpsRequired, centerLat, centerLng, radiusMeters, code);
             }}
          />
        )}
      </AnimatePresence>

      {/* Session Conflict Modal */}
      <AnimatePresence>
        {sessionConflict && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", zIndex: 1100 }} className="px-md-20">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: "#0c0e14", padding: 32, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, width: "100%", maxWidth: 440 }} className="modal-full-mobile">
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(245,166,35,0.1)", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
                   <AlertCircle size={32} color={G} />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 12, textAlign: "center" }}>Attendance already active</h2>
                <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24, textAlign: "center", lineHeight: 1.6 }}>
                  This class already has an active attendance session in progress. You cannot start a new one until the current one is closed.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                   <button 
                     onClick={() => setSessionConflict(null)}
                     style={{ width: "100%", background: G, color: "#000", border: "none", padding: "14px", borderRadius: 14, fontWeight: 900, cursor: "pointer" }}
                   >
                     Miondoko ya Sasa (Keep Current)
                   </button>
                   <button 
                     onClick={() => {
                       endSession(sessionConflict.id);
                       setSessionConflict(null);
                     }}
                     style={{ width: "100%", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", padding: "14px", borderRadius: 14, fontWeight: 800, cursor: "pointer" }}
                   >
                     End Current Register
                   </button>
                   <button onClick={() => setSessionConflict(null)} style={{ padding: 12, background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", fontWeight: 700, cursor: "pointer" }}>
                     Cancel
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function ActiveSessionView({ session, onEnd, isTeacher }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [records, setRecords] = useState([]);
  const [classStudents, setClassStudents] = useState([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extending, setExtending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [myAttendance, setMyAttendance] = useState(null);
  const db = getFirebaseDb();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(session.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const extendTime = async (minutes) => {
    if (!db || !isTeacher) return;
    setExtending(true);
    try {
      const additionalMs = minutes * 60000;
      // eslint-disable-next-line react-hooks/purity
      const currentEndTime = session.endsAt || session.endTime || session.expiresAt || Date.now();
      // eslint-disable-next-line react-hooks/purity
      const newEndTime = Math.max(Date.now(), currentEndTime) + additionalMs;
      const { updateDoc, doc } = await import("firebase/firestore");
      await updateDoc(doc(db, "attendanceSessions", session.id), {
        endsAt: newEndTime,
        endTime: newEndTime,
        status: "active",
        isActive: true
      });

      // Write Audit Log
      const auth = getFirebaseAuth();
      const currentUser = auth?.currentUser;
      await addDoc(collection(db, "classroomAuditLogs"), {
        action: "attendance_extended",
        classId: session.classId || "",
        className: session.className || "",
        userId: currentUser?.uid || session.teacherId || "",
        userName: currentUser?.displayName || "Mwalimu",
        timestamp: serverTimestamp(),
        details: {
          sessionId: session.id,
          extendedMinutes: minutes,
          newEndTime: newEndTime
        }
      }).catch(err => console.error("Error writing audit log:", err));

      showToast(`Muda umeongezwa kwa dakika ${minutes}.`);
      setShowExtendModal(false);
    } catch(err) {
      showToast("Kosa limejitokeza katika kuongeza muda.", "error");
    }
    setExtending(false);
  };

  useEffect(() => {
    const updateTimer = () => {
      const currentEndTime = session.endsAt || session.endTime || session.expiresAt || Date.now();
      const remaining = Math.max(0, Math.floor((currentEndTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0 && isTeacher && (session.status !== "expired" && session.status !== "ended")) {
        // Just trigger visual change on teacher side, not a hard end to avoid looping
        onEnd();
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session.endTime, session.endsAt, session.expiresAt, session.status, isTeacher, onEnd]);

  useEffect(() => {
    if (!db || !isTeacher) return undefined;
    const q = collection(db, "attendanceSessions", session.id, "records");
    const unsub = onSnapshot(q, snap => {
      let recs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      recs.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));
      if (previewAuthEnabled && session.id === "demo-sess-1" && recs.length === 0) {
        recs = [
           { id: "r1", studentName: "Amani Juma", timestamp: Date.now() },
           { id: "r2", studentName: "Sarah Michael", timestamp: Date.now() },
           { id: "r3", studentName: "Daudi M", timestamp: Date.now() }
        ];
      }
      setRecords(recs);
    });
    return unsub;
  }, [session.id, db, isTeacher, previewAuthEnabled]);

  useEffect(() => {
    if (!session?.classId || !db || !isTeacher) return undefined;
    let unsub2;
    const unsub1 = onSnapshot(collection(db, "classes", session.classId, "classStudents"), (snap) => {
      if (!snap.empty) {
        setClassStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else {
        unsub2 = onSnapshot(collection(db, "attendanceClasses", session.classId, "classStudents"), (snap2) => {
          setClassStudents(snap2.docs.map(d => ({ id: d.id, ...d.data() })));
        });
      }
    });
    return () => {
      unsub1();
      if (unsub2) unsub2();
    };
  }, [session?.classId, db, isTeacher]);

  useEffect(() => {
    if (!db || isTeacher) return undefined;
    const user = getFirebaseAuth()?.currentUser;
    if (!user?.uid) return undefined;
    return onSnapshot(doc(db, "attendanceSessions", session.id, "records", user.uid), (snapshot) => {
      setMyAttendance(snapshot.exists() ? snapshot.data() : null);
    });
  }, [db, isTeacher, session.id]);

  const displayStudents = records.map(record => {
    const student = classStudents.find(s => s.studentId === record.studentId || s.userId === record.userId) || {};
    return {
      ...student,
      id: record.id,
      studentName: record.studentName || student.studentName,
      studentId: record.studentId || student.studentId,
      email: record.email || student.email,
      record
    };
  });

  const presentCount = displayStudents.length;

  // eslint-disable-next-line react-hooks/purity
  const currentEndTime = session.endsAt || session.endTime || session.expiresAt || Date.now();
  // eslint-disable-next-line react-hooks/purity
  const currentStartTime = session.startsAt || session.startTime || Date.now();
  const totalSeconds = (currentEndTime - currentStartTime) / 1000;
  const isExpired = timeLeft === 0;
  const progress = Math.min(100, Math.max(0, (timeLeft / totalSeconds) * 100));
  const joinLink = `https://stea.africa/attendance/join/${session.joinCode}`;

  return (
    <div className="glass-card" style={{ padding: fullscreen ? 40 : 20, borderRadius: 24, position: fullscreen ? "fixed" : "relative", inset: fullscreen ? 0 : "auto", zIndex: fullscreen ? 2000 : 1, background: fullscreen ? "#05060a" : "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: fullscreen ? "100vh" : "auto" }}>
      
      {isTeacher && (
        <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 12 }}>
           {!fullscreen && (
              <button onClick={() => setShowExtendModal(true)} style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981", padding: "0 16px", borderRadius: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                + Add Time
              </button>
           )}
           <button onClick={() => setFullscreen(!fullscreen)} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", width: 44, height: 44, borderRadius: 12, display: "grid", placeItems: "center", cursor: "pointer" }}>
              <Maximize size={20} />
           </button>
           <button onClick={onEnd} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", padding: "0 16px", borderRadius: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
             <Square size={14} fill="currentColor" /> Funga Mwenyewe
           </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 24, alignItems: "center", marginBottom: 32, width: "100%", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
             <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: 800 }}>Muda Uliobaki</div>
             {session.gpsRequired && (
                <span style={{ fontSize: 10, background: "rgba(16,185,129,0.1)", color: "#10b981", padding: "2px 8px", borderRadius: 8, fontWeight: 700, border: "1px solid rgba(16,185,129,0.2)" }}>
                   GPS ON
                </span>
             )}
          </div>
          <div style={{ fontSize: fullscreen ? 80 : 36, fontWeight: 900, color: timeLeft <= 10 ? "#ef4444" : "#F5A623", fontVariantNumeric: "tabular-nums" }}>
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 400, height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden", marginBottom: 40 }}>
        <div style={{ height: "100%", background: timeLeft <= 10 ? "#ef4444" : G, width: `${progress}%`, transition: "width 1s linear" }} />
      </div>

      {isTeacher ? (
         <>
            <div style={{ background: "#fff", padding: fullscreen ? 40 : 12, borderRadius: 20, marginBottom: 16, boxShadow: "0 10px 20px rgba(0,0,0,0.3)" }}>
              <QRCodeSVG value={joinLink} size={fullscreen ? 300 : 120} level="H" />
            </div>

            <div style={{ textAlign: "center", marginBottom: 24 }}>
               <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: 800, marginBottom: 8 }}>Class Code</div>
               <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
                 <div style={{ fontSize: fullscreen ? 64 : 28, fontWeight: 900, letterSpacing: 6, color: "#fff", lineHeight: 1 }}>{session.joinCode}</div>
                 <button 
                   onClick={handleCopyCode}
                   title="Copy Code"
                   style={{ 
                     background: copied ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)", 
                     border: "1px solid " + (copied ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.1)"), 
                     color: copied ? "#10b981" : "#fff", 
                     cursor: "pointer", 
                     padding: 8, 
                     borderRadius: 10,
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "center",
                     transition: "all 0.2s"
                   }}
                 >
                   {copied ? <Check size={18} /> : <Copy size={18} />}
                 </button>
               </div>
            </div>
         </>
      ) : (
         <div style={{ textAlign: "center", padding: "32px 0" }}>
             <div style={{ marginBottom: 24, padding: 20, borderRadius: 18, border: "1px solid rgba(16,185,129,.35)", background: "rgba(16,185,129,.1)" }}>
                 <div style={{ color: "#10b981", fontSize: 12, fontWeight: 900, letterSpacing: 1, marginBottom: 12 }}>LIVE ATTENDANCE ACTIVE</div>
                 <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>{session.className || "Class attendance"}</div>
                 <div style={{ color: "rgba(255,255,255,.72)", marginBottom: 16 }}>Code: <strong style={{ color: "#fff", letterSpacing: 1 }}>{session.joinCode || session.sessionCode || session.code}</strong></div>
                 {myAttendance ? (
                   <div style={{ color: "#10b981", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 8 }}><Check size={18} /> My attendance: {myAttendance.status || "present"}</div>
                 ) : (
                   <button 
                     onClick={() => setShowSubmitModal(true)}
                     style={{ background: G, color: "#000", border: "none", padding: "14px 24px", borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10 }}
                   >
                     <Check size={20} /> Mark Attendance
                   </button>
                 )}
             </div>
         </div>
      )}

      {isTeacher && !fullscreen && (
        <div style={{ width: "100%" }}>
           <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
             <span>Waliohudhuria Live</span>
             <span style={{ color: "#F5A623" }}>{presentCount} / {classStudents.length} Wanafunzi</span>
           </h4>
           <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
             {displayStudents.length === 0 ? (
               <div style={{ textAlign: "center", padding: 20, opacity: 0.4 }}>No students have joined yet. Waiting for check-ins...</div>
             ) : (
               displayStudents.map(student => (
                 <div key={student.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 12 }}>
                   <div style={{ fontWeight: 800 }}>{student.studentName}</div>
                   <div style={{ fontSize: 12, color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "4px 8px", borderRadius: 6, fontWeight: 700 }}>Present</div>
                 </div>
               ))
             )}
           </div>
        </div>
      )}

      {/* Extend Modal */}
      <AnimatePresence>
        {showExtendModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", zIndex: 1000 }} className="px-md-20">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: "#0c0e14", padding: 32, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, width: "100%", maxWidth: 400 }}>
                <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Muda wa Ziada</h2>
                <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>Ongeza muda kwa session inayoendelea.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                   {[5, 10, 15].map(m => (
                     <button
                       key={m}
                       onClick={() => extendTime(m)}
                       disabled={extending}
                       style={{ 
                         background: "rgba(255,255,255,0.03)", 
                         border: "1px solid rgba(255,255,255,0.05)", 
                         color: "#fff", 
                         padding: "16px", borderRadius: 16, fontWeight: 800, cursor: extending ? "not-allowed" : "pointer", opacity: extending ? 0.5 : 1
                       }}
                     >
                       + {m} Dakika {m === 5 ? "(5 Min)" : `(${m} Min)`}
                     </button>
                   ))}
                   <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                     <input 
                       type="number" 
                       id="customExtendTime"
                       placeholder="Dakika (Mf. 20)" 
                       style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px 16px", borderRadius: 12, outline: "none" }}
                     />
                     <button 
                       onClick={() => {
                         const val = parseInt(document.getElementById("customExtendTime").value);
                         if (val && val > 0) extendTime(val);
                       }}
                       disabled={extending}
                       style={{ background: "#F5A623", color: "#000", border: "none", padding: "0 20px", borderRadius: 12, fontWeight: 800, cursor: extending ? "not-allowed" : "pointer" }}
                     >
                       Weka
                     </button>
                   </div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                   <button onClick={() => setShowExtendModal(false)} disabled={extending} style={{ flex: 1, background: "transparent", border: "none", color: "#fff", fontWeight: 700, cursor: extending ? "not-allowed" : "pointer" }}>Ghairi</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showSubmitModal && (
         <AttendanceSubmissionModal 
           initialCode={session.joinCode || session.sessionCode}
           initialSession={{
             sessionId: session.id,
             classId: session.classId,
             attendanceCode: session.joinCode || session.sessionCode || session.code,
             className: session.className || ""
           }}
           onClose={() => setShowSubmitModal(false)}
           onSuccess={() => setShowSubmitModal(false)}
         />
      )}
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
            <h3 style={{ margin: "0 0 10px" }}>Futa Kipindi cha Mahudhurio?</h3>
            <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.6)", margin: "0 0 20px" }}>Je, una uhakika unataka kufuta session hii na rekodi zake? Kitendo hiki hakiwezi kurejeshwa.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDeleteId(null)} style={{ flex: 1, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#fff", borderRadius: 8, cursor: "pointer" }}>Ghairi / Cancel</button>
              <button onClick={performDeleteSession} style={{ flex: 1, padding: "10px 14px", border: 0, background: "#dc2626", color: "#fff", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Futa / Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
