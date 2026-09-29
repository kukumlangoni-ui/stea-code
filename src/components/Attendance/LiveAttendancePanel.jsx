import { useState, useEffect } from "react";
import { collection, query, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseDb, getFirebaseAuth } from "../../firebase";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { 
  Users, ShieldCheck, Info, Square, Clock, Loader2, CheckCircle2, DownloadCloud, AlertCircle,
  Check, X, Flag, ChevronDown, ChevronUp, MapPinOff, AlertTriangle
} from "lucide-react";
import { LiveTimer } from "./AttendanceModals.jsx";

export function LiveAttendancePanel({ session, onEnd, onEndSession, onExtendTime, isEnding }) {
  const [records, setRecords] = useState([]);
  const [classStudents, setClassStudents] = useState([]);
  const [sessionStatus, setSessionStatus] = useState(session.status || "active");
  const [expandedRecords, setExpandedRecords] = useState({});
  const [toast, setToast] = useState(null);
  const db = getFirebaseDb();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Listen to session document for real-time status updates
  useEffect(() => {
    if (!session?.id || !db) return;
    const unsubSession = onSnapshot(doc(db, "attendanceSessions", session.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSessionStatus(data.status);
      }
    });
    return () => unsubSession();
  }, [session?.id, db]);

  useEffect(() => {
    if (!session?.id || !db) return;
    const q = collection(db, "attendanceSessions", session.id, "records");
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecords(all);
    }, (err) => {
      console.error("Error loading live attendance records:", err);
    });
    return () => unsub();
  }, [session?.id, db]);

  // Fetch all students assigned to this class
  useEffect(() => {
    if (!session?.classId || !db) return;
    
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
  }, [session?.classId, db]);

  const isClosed = sessionStatus === "closed" || sessionStatus === "ended";

  // ONLY show students who have actually checked into the session (records)
  const displayStudents = records.map(record => {
    // Attempt to find full class student details, otherwise just use record data
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
  
  // Count present students (all in displayStudents are present)
  const presentCount = displayStudents.length;

  const updateRecordStatus = async (studentUid, newStatus) => {
    if (!db || !session?.id) return;
    try {
      const recordRef = doc(db, "attendanceSessions", session.id, "records", studentUid);
      await updateDoc(recordRef, {
        status: newStatus
      });

      const auth = getFirebaseAuth();
      const currentUser = auth?.currentUser;
      await addDoc(collection(db, "classroomAuditLogs"), {
        action: "assignment_graded",
        classId: session.classId || "",
        className: session.className || "",
        userId: currentUser?.uid || "",
        userName: currentUser?.displayName || "Mwalimu",
        timestamp: serverTimestamp(),
        details: {
          sessionId: session.id,
          studentUid: studentUid,
          newStatus: newStatus
        }
      }).catch(err => console.error("Error writing audit log:", err));

    } catch (e) {
      console.error("Error updating status:", e);
      showToast("Imeshindwa kubadilisha hali ya mahudhurio.", "error");
    }
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Student Name,Email,Status,Timestamp\n";
    displayStudents.forEach(s => {
      const status = s.record ? "Present" : "Absent";
      const time = s.record?.timestamp ? new Date(s.record.timestamp).toLocaleString() : "N/A";
      csvContent += `"${s.studentName}","${s.email || "N/A"}","${status}","${time}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_${session.className}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ color: "#fff", maxWidth: 900, margin: "0 auto", padding: "12px 0 pb-40" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ 
            background: isClosed ? "rgba(255,255,255,0.05)" : "#10B981", 
            color: isClosed ? "#fff" : "#000", 
            padding: "4px 12px", 
            borderRadius: 8, 
            fontSize: 11, 
            fontWeight: 900, 
            display: "inline-flex", 
            alignItems: "center", 
            gap: 6, 
            marginBottom: 12,
            border: isClosed ? "1px solid rgba(255,255,255,0.1)" : "none"
          }}>
            {!isClosed && <span className="live-pulse" style={{ width: 8, height: 8, background: "#000", borderRadius: "50%" }} />}
            {isClosed ? "REGISTER ENDED" : "LIVE ATTENDANCE MONITOR"}
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>{session.className}</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", margin: "4px 0 0 0", fontSize: 15 }}>
            {isClosed ? "Attendance collection is now finished for this session" : "Real-time student check-in monitor"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, position: "relative", zIndex: 10 }}>
          <button 
             onClick={handleExportCSV}
             style={{ 
               background: "rgba(59, 130, 246, 0.1)", 
               color: "#3B82F6", 
               border: "1px solid rgba(59, 130, 246, 0.3)", 
               padding: "12px 20px", 
               borderRadius: 12, 
               fontWeight: 800, 
               cursor: "pointer", 
               display: "flex", 
               alignItems: "center", 
               gap: 8
             }}
          >
             <DownloadCloud size={18} /> Export CSV
          </button>

          {!isClosed && (
            <button 
               onClick={() => onExtendTime(session)}
               disabled={isEnding}
               style={{ 
                 background: "rgba(245, 166, 35, 0.1)", 
                 color: "#F5A623", 
                 border: "1px solid rgba(245, 166, 35, 0.3)", 
                 padding: "12px 20px", 
                 borderRadius: 12, 
                 fontWeight: 800, 
                 cursor: isEnding ? "not-allowed" : "pointer", 
                 display: "flex", 
                 alignItems: "center", 
                 gap: 8,
                 opacity: isEnding ? 0.5 : 1
               }}
            >
               <Clock size={18} /> Extend
            </button>
          )}

          <button 
             onClick={() => !isClosed && onEndSession(session.id)}
             disabled={isEnding || isClosed}
             style={{ 
               background: isClosed ? "rgba(255,255,255,0.05)" : "rgba(239, 68, 68, 0.1)", 
               color: isClosed ? "rgba(255,255,255,0.3)" : "#EF4444", 
               border: isClosed ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(239, 68, 68, 0.3)", 
               padding: "12px 20px", 
               borderRadius: 12, 
               fontWeight: 800, 
               cursor: (isEnding || isClosed) ? "not-allowed" : "pointer", 
               display: "flex", 
               alignItems: "center", 
               gap: 8,
               opacity: isEnding ? 0.8 : 1
             }}
          >
             {isEnding ? (
               <><Loader2 size={18} className="animate-spin" /> Ending...</>
             ) : isClosed ? (
               <><CheckCircle2 size={18} /> Register Ended</>
             ) : (
               <><Square size={18} fill="currentColor" /> End Register</>
             )}
          </button>
          
          <button 
            onClick={onEnd} 
            style={{ background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", padding: "12px 20px", borderRadius: 12, fontWeight: 800, cursor: "pointer" }}
          >
            {isClosed ? "Exit Monitor" : "Close Monitor"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24, textAlign: "center", position: "relative" }}>
          <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.5, textTransform: "uppercase", letterSpacing: 1 }}>STUDENTS PRESENT</div>
          <div style={{ fontSize: 48, fontWeight: 900, marginTop: 8, color: "#10B981" }}>{presentCount} <span style={{ fontSize: 20, color: "rgba(255,255,255,0.3)" }}>/ {classStudents.length}</span></div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.5, textTransform: "uppercase", letterSpacing: 1 }}>TIME REMAINING</div>
          <LiveTimer endTime={session.endTime} />
        </div>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.5, textTransform: "uppercase", letterSpacing: 1 }}>SESSION CODE</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: "#F5A623", marginTop: 8, letterSpacing: 2 }}>{session.sessionCode}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 32, alignItems: "start" }}>
        
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Attendance Log</h3>
            <span style={{ fontSize: 12, opacity: 0.5 }}>Real-time stream active</span>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <AnimatePresence mode="popLayout">
              {displayStudents.length === 0 ? (
                <motion.div 
                   initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                   style={{ textAlign: "center", padding: 40, background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 16 }}
                >
                  <Users size={32} style={{ margin: "0 auto 12px", opacity: 0.2 }} />
                  <p style={{ opacity: 0.4, margin: 0, fontSize: 14 }}>No students have joined yet. Waiting for check-ins...</p>
                </motion.div>
              ) : (
                displayStudents.map((s, idx) => {
                  const status = s.record?.status || "present_review";
                  const locStatus = s.record?.locationStatus || s.record?.location?.status || "not_required";
                  const distance = s.record?.location?.distance;

                  let rowBorder = "rgba(16,185,129,0.1)";
                  let rowBg = "rgba(16,185,129,0.02)";
                  let leftBar = "#10B981";
                  let statusLabel = "Approved";

                  if (status === "present_flagged") {
                    rowBorder = "rgba(245,166,35,0.2)";
                    rowBg = "rgba(245,166,35,0.02)";
                    leftBar = "#F5A623";
                    statusLabel = "Flagged";
                  } else if (status === "rejected") {
                    rowBorder = "rgba(239,68,68,0.2)";
                    rowBg = "rgba(239,68,68,0.02)";
                    leftBar = "#EF4444";
                    statusLabel = "Rejected";
                  } else if (status === "present_review") {
                    rowBorder = "rgba(59,130,246,0.2)";
                    rowBg = "rgba(59,130,246,0.02)";
                    leftBar = "#3B82F6";
                    statusLabel = "Review";
                  }

                  return (
                    <motion.div 
                      key={s.id || idx} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ 
                        display: "flex", 
                        flexDirection: "column",
                        padding: "12px 16px", 
                        background: rowBg, 
                        borderRadius: 12, 
                        border: `1px solid ${rowBorder}`,
                        boxShadow: `inset 3px 0 0 ${leftBar}`
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: 12 }}>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ 
                            width: 32, 
                            height: 32, 
                            borderRadius: "50%", 
                            background: `rgba(${status === 'present' ? '16,185,129' : status === 'rejected' ? '239,68,68' : '245,166,35'}, 0.15)`, 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            color: leftBar,
                            fontSize: 14,
                            fontWeight: 900
                          }}>
                            {s.studentName ? s.studentName[0].toUpperCase() : "?"}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>{s.studentName}</div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                              ID: {s.studentId} {s.email ? `• ${s.email}` : ""}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {/* Distance Status Badges */}
                          <div 
                            onClick={() => setExpandedRecords(prev => ({ ...prev, [s.id]: !prev[s.id] }))}
                            style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", userSelect: "none" }}
                          >
                            {locStatus === "inside_zone" && (
                              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#10B981", fontSize: 10, fontWeight: 800, background: "rgba(16, 185, 129, 0.1)", padding: "4px 8px", borderRadius: 6 }}>
                                🟢 Inside zone ({distance != null ? `${distance.toFixed(0)}m` : "Verified"})
                              </div>
                            )}
                            {locStatus === "outside_zone" && (
                              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#F5A623", fontSize: 10, fontWeight: 800, background: "rgba(245, 166, 35, 0.1)", padding: "4px 8px", borderRadius: 6 }}>
                                🔴 Outside zone ({distance != null ? `${distance.toFixed(0)}m` : "Flagged"})
                              </div>
                            )}
                            {locStatus === "denied" && (
                              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#EF4444", fontSize: 10, fontWeight: 800, background: "rgba(239, 68, 68, 0.1)", padding: "4px 8px", borderRadius: 6 }}>
                                ⚠️ GPS Denied (Manual Review)
                              </div>
                            )}
                            {locStatus === "not_required" && (
                              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: 800, background: "rgba(255, 255, 255, 0.05)", padding: "4px 8px", borderRadius: 6 }}>
                                ℹ️ GPS Off (Approved)
                              </div>
                            )}
                            {expandedRecords[s.id] ? <ChevronUp size={12} opacity={0.5} /> : <ChevronDown size={12} opacity={0.5} />}
                          </div>

                          {/* Manual Override Action Controls */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 4px" }}>
                            <button 
                              onClick={(e) => { e.stopPropagation(); updateRecordStatus(s.record.studentUid || s.record.userId, "present"); }}
                              title="Approve (Weka Present)"
                              style={{ 
                                background: status === "present" ? "rgba(16,185,129,0.2)" : "transparent", 
                                color: status === "present" ? "#10B981" : "rgba(255,255,255,0.3)", 
                                border: "1px solid rgba(16,185,129,0.3)", 
                                width: 26, 
                                height: 26, 
                                borderRadius: 6, 
                                cursor: "pointer", 
                                display: "grid", 
                                placeItems: "center",
                                transition: "all 0.2s"
                              }}
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); updateRecordStatus(s.record.studentUid || s.record.userId, "present_flagged"); }}
                              title="Flag (Weka Flagged/Suspicious)"
                              style={{ 
                                background: status === "present_flagged" ? "rgba(245,166,35,0.2)" : "transparent", 
                                color: status === "present_flagged" ? "#F5A623" : "rgba(255,255,255,0.3)", 
                                border: "1px solid rgba(245,166,35,0.3)", 
                                width: 26, 
                                height: 26, 
                                borderRadius: 6, 
                                cursor: "pointer", 
                                display: "grid", 
                                placeItems: "center",
                                transition: "all 0.2s"
                              }}
                            >
                              <Flag size={14} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); updateRecordStatus(s.record.studentUid || s.record.userId, "rejected"); }}
                              title="Reject (Weka Absent/Rejected)"
                              style={{ 
                                background: status === "rejected" ? "rgba(239,68,68,0.2)" : "transparent", 
                                color: status === "rejected" ? "#EF4444" : "rgba(255,255,255,0.3)", 
                                border: "1px solid rgba(239,68,68,0.3)", 
                                width: 26, 
                                height: 26, 
                                borderRadius: 6, 
                                cursor: "pointer", 
                                display: "grid", 
                                placeItems: "center",
                                transition: "all 0.2s"
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>

                          <span style={{ background: "rgba(255, 255, 255, 0.05)", color: "rgba(255,255,255,0.6)", padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 900 }}>
                            {new Date(s.record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>

                      </div>

                      {/* Expandable Coords Panel */}
                      {expandedRecords[s.id] && (
                        <div style={{ 
                          marginTop: 10, 
                          padding: 10, 
                          background: "rgba(0,0,0,0.15)", 
                          borderRadius: 8, 
                          fontSize: 11, 
                          color: "rgba(255,255,255,0.5)", 
                          borderTop: "1px solid rgba(255,255,255,0.05)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 4
                        }}>
                          {s.record.location && s.record.location.status !== "denied" ? (
                            <>
                              <div><strong>Lat:</strong> {s.record.location.lat?.toFixed(6)} | <strong>Lng:</strong> {s.record.location.lng?.toFixed(6)}</div>
                              <div><strong>GPS Accuracy:</strong> ±{s.record.location.accuracy?.toFixed(1)}m</div>
                              {distance != null && <div><strong>Geofence Distance:</strong> {distance.toFixed(1)}m (Allowed radius: {session.radiusMeters || 150}m)</div>}
                            </>
                          ) : (
                            <div>Location info unavailable or GPS permissions denied by student.</div>
                          )}
                          <div><strong>Submission Status:</strong> <span style={{ color: leftBar, fontWeight: 700 }}>{statusLabel.toUpperCase()}</span></div>
                        </div>
                      )}

                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        <div style={{ position: "sticky", top: 24 }}>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, padding: 24, textAlign: "center" }}>
            <h4 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>Join Register</h4>
            <div style={{ background: "#fff", padding: 16, borderRadius: 20, display: "inline-block", marginBottom: 16 }}>
              <QRCodeSVG value={`https://stea.africa/attendance/join/${session.sessionCode}`} size={200} />
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: "1.5" }}>
              Students can scan this QR code or navigate to <strong>stea.africa/attendance</strong> and enter code <strong style={{ color: "#F5A623" }}>{session.sessionCode}</strong> to check-in.
            </div>
          </div>
        </div>

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
    </div>
  );
}
