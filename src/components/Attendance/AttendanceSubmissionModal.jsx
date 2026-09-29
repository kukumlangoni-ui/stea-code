import { useState, useEffect } from "react";
import { getFirebaseDb, getFirebaseAuth } from "../../firebase";
import { 
  collection, doc, getDoc, getDocs, query, where, setDoc, serverTimestamp, updateDoc, increment
} from "firebase/firestore";
import { X, MapPin, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

const G = "#F5A623";

function toMillis(value) {
  if (!value) return null;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (value instanceof Date) return value.getTime();
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

// Haversine distance calculator in meters
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

export default function AttendanceSubmissionModal({ initialCode = "", initialSession = null, onClose, onSuccess }) {
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;

  const [sessionCode, setSessionCode] = useState(initialSession?.attendanceCode || initialCode);
  const [studentName, setStudentName] = useState(user?.displayName || "");
  const [studentId, setStudentId] = useState("");
  const [studentPhone, setStudentPhone] = useState("");

  const [sessionData, setSessionData] = useState(
    initialSession?.sessionId ? {
      id: initialSession.sessionId,
      classId: initialSession.classId || "",
      className: initialSession.className || "",
      subject: initialSession.subject || "",
      sessionCode: initialSession.attendanceCode || initialCode || "",
      joinCode: initialSession.attendanceCode || initialCode || "",
      code: initialSession.attendanceCode || initialCode || ""
    } : null
  );
  const [validatingCode, setValidatingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [locationStatus, setLocationStatus] = useState("");

  // Real-time lookup of session code
  useEffect(() => {
    if (initialSession?.sessionId && initialSession.classId) {
      setSessionCode(initialSession.attendanceCode || initialCode || "");
      setSessionData({
        id: initialSession.sessionId,
        classId: initialSession.classId,
        className: initialSession.className || "",
        subject: initialSession.subject || "",
        sessionCode: initialSession.attendanceCode || initialCode || "",
        joinCode: initialSession.attendanceCode || initialCode || "",
        code: initialSession.attendanceCode || initialCode || ""
      });
      setErrorMsg("");
      return;
    }

    if (!db || sessionCode.trim().length < 4) {
      setSessionData(null);
      return;
    }

    const fetchSession = async () => {
      setValidatingCode(true);
      setErrorMsg("");
      try {
        const uCode = sessionCode.toUpperCase().trim();
        // Look up by joinCode or sessionCode
        let q = query(collection(db, "attendanceSessions"), where("joinCode", "==", uCode), where("status", "==", "active"));
        let snap = await getDocs(q);
        
        if (snap.empty) {
          q = query(collection(db, "attendanceSessions"), where("sessionCode", "==", uCode), where("status", "==", "active"));
          snap = await getDocs(q);
        }

        if (snap.empty) {
          setErrorMsg("Code si sahihi.");
          setSessionData(null);
        } else {
          const sDoc = snap.docs[0];
          const sData = sDoc.data();
          const endTime = toMillis(sData.endsAt || sData.endTime || sData.expiresAt);
          
          if (sData.isActive !== true || (endTime && Date.now() >= endTime)) {
             setErrorMsg("Attendance imefungwa au muda umeisha.");
             setSessionData(null);
          } else {
             setSessionData({ id: sDoc.id, ...sData });
             setErrorMsg("");
             
             // Pre-fill user profile info for this class if logged in
             if (user?.uid) {
                getDoc(doc(db, "classes", sData.classId, "classStudents", user.uid)).then(studentSnap => {
                   if (studentSnap.exists()) {
                      const sProfile = studentSnap.data();
                      setStudentName(prev => prev || sProfile.studentName || user.displayName || "");
                      setStudentId(prev => prev || sProfile.studentId || "");
                      setStudentPhone(prev => prev || sProfile.studentPhone || sProfile.phone || "");
                   } else {
                      // Fallback to legacy
                      getDoc(doc(db, "attendanceClasses", sData.classId, "classStudents", user.uid)).then(legacySnap => {
                         if (legacySnap.exists()) {
                            const sProfile = legacySnap.data();
                            setStudentName(prev => prev || sProfile.studentName || user.displayName || "");
                            setStudentId(prev => prev || sProfile.studentId || "");
                            setStudentPhone(prev => prev || sProfile.studentPhone || sProfile.phone || "");
                         }
                      }).catch(() => {});
                   }
                }).catch(() => {});
             }
          }
        }
      } catch (err) {
        console.error("Session fetch error:", err);
      } finally {
        setValidatingCode(false);
      }
    };

    fetchSession();
  }, [sessionCode, db, user, initialSession, initialCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!db) return;

    if (!user) {
      setErrorMsg("Tafadhali ingia au jiunge kwanza na darasa hili.");
      window.dispatchEvent(new CustomEvent("open-auth"));
      return;
    }

    if (!sessionData) {
      setErrorMsg("Code si sahihi.");
      return;
    }

    if (!studentName.trim() || !studentId.trim()) {
      setErrorMsg("Full Name and Student ID are required.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const classId = sessionData.classId;
      const sessionEnd = toMillis(sessionData.endsAt || sessionData.endTime || sessionData.expiresAt);
      if (sessionData.status !== "active" || sessionData.isActive !== true || (sessionEnd && Date.now() >= sessionEnd)) {
        setErrorMsg("Attendance imefungwa au muda umeisha.");
        return;
      }

      // 1. Verify Class Membership
      const studentDoc = await getDoc(doc(db, "classes", classId, "classStudents", user.uid));
      let isMember = studentDoc.exists();
      if (!isMember) {
        const legacyDoc = await getDoc(doc(db, "attendanceClasses", classId, "classStudents", user.uid));
        isMember = legacyDoc.exists();
      }

      if (!isMember) {
         setErrorMsg("Hujaunganishwa na darasa hili.");
         setSubmitting(false);
         return;
      }

      // Check duplicate check-in under the subcollection `/attendanceSessions/{sessionId}/records/{studentUid}`
      const recordRef = doc(db, "attendanceSessions", sessionData.id, "records", user.uid);
      const recordSnap = await getDoc(recordRef);
      if (recordSnap.exists()) {
         setErrorMsg("Umeshahudhuria session hii.");
         setSubmitting(false);
         return;
      }

      // 2. Capture Location
      let locationObj = null;
      let status = "present";
      let locStatus = "not_required";

      if (sessionData.gpsRequired) {
        try {
          const position = await new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
              return reject(new Error("Browser doesn't support GPS"));
            }
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, enableHighAccuracy: true });
          });

          const { latitude, longitude, accuracy } = position.coords;
          
          // Geofence check if center and radius exist
          const centerLat = sessionData.centerLat !== undefined ? sessionData.centerLat : sessionData.latitude;
          const centerLng = sessionData.centerLng !== undefined ? sessionData.centerLng : sessionData.longitude;
          const radius = sessionData.radiusMeters !== undefined ? sessionData.radiusMeters : (sessionData.radius || 150);

          let dist = null;
          if (centerLat != null && centerLng != null) {
            dist = calculateDistanceMeters(centerLat, centerLng, latitude, longitude);
            if (dist <= radius) {
              status = "present";
              locStatus = "inside_zone";
            } else {
              status = "present_flagged";
              locStatus = "outside_zone";
            }
          } else {
            status = "present";
            locStatus = "inside_zone";
          }

          locationObj = {
            lat: latitude,
            lng: longitude,
            accuracy: accuracy,
            timestamp: position.timestamp,
            status: locStatus,
            distance: dist
          };
        } catch (geoErr) {
          console.warn("GPS tracking permission denied or failed:", geoErr);
          status = "present_review";
          locStatus = "denied";
          locationObj = {
            status: "denied",
            error: geoErr.message || "denied"
          };
        }
      } else {
        // GPS not required
        status = "present";
        locStatus = "inside_zone";
      }

      setLocationStatus(locStatus);

      // 3. Write Attendance Record
      const record = {
        sessionId: sessionData.id,
        classId: classId,
        teacherId: sessionData.teacherId || "",
        studentUid: user.uid,
        studentName: studentName.trim(),
        studentId: studentId.trim(),
        studentEmail: user.email || "",
        attendanceCode: sessionCode.toUpperCase().trim(),
        status: status,
        locationStatus: locStatus,
        method: "student",
        codeUsed: sessionCode.toUpperCase().trim(),
        submittedAt: serverTimestamp(),
        checkInTime: serverTimestamp(),
        location: locationObj,
        // Legacy compat fields
        userId: user.uid,
        sessionCode: sessionCode.toUpperCase().trim(),
        studentPhone: studentPhone.trim(),
        className: sessionData.className || "",
        timestamp: Date.now()
      };

      // Store in subcollection directly
      await setDoc(recordRef, record);
      await updateDoc(doc(db, "attendanceSessions", sessionData.id), {
        studentCount: increment(1)
      }).catch(() => {});

      // Write Audit Log
      await addDoc(collection(db, "classroomAuditLogs"), {
        action: "attendance_submitted",
        classId: classId,
        className: sessionData.className || "",
        userId: user.uid,
        userName: studentName.trim(),
        timestamp: serverTimestamp(),
        details: {
          sessionId: sessionData.id,
          status,
          locationStatus: locStatus
        }
      }).catch(err => console.error("Error writing audit log:", err));

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess(sessionData);
        if (onClose) onClose();
      }, 3000); // Allow more time to read warnings if any

    } catch (err) {
      console.error("Attendance submission failed:", err);
      setErrorMsg("Failed to submit attendance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={modalOverlayStyle} className="px-md-20">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={modalContentStyle}
        className="modal-full-mobile"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16 }}>
             <h2 style={{ fontSize: 20, fontWeight: 900, display: "flex", alignItems: "center", gap: 10 }}>
              <MapPin color={G} /> Thibitisha Mahudhurio
           </h2>
           <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
             <X size={20} />
           </button>
        </div>

        {success ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
             {(!locationStatus || locationStatus === "inside_zone" || locationStatus === "not_required") ? (
               <>
                 <div style={{ background: "#10b98120", width: 80, height: 80, borderRadius: "50%", display: "grid", placeItems: "center", margin: "0 auto 24px" }}>
                    <CheckCircle2 size={40} color="#10b981" />
                 </div>
                 <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8, color: "#10b981" }}>Hudhurio Limeongezwa!</h3>
                 <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>Mahudhurio yako yamekamilika kikamilifu.</p>
               </>
             ) : locationStatus === "outside_zone" ? (
               <>
                 <div style={{ background: "rgba(245, 166, 35, 0.15)", width: 80, height: 80, borderRadius: "50%", display: "grid", placeItems: "center", margin: "0 auto 24px" }}>
                    <AlertCircle size={40} color="#F5A623" />
                 </div>
                 <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8, color: "#F5A623" }}>Imetuma (Nje ya Eneo)</h3>
                 <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, padding: "0 20px", lineHeight: 1.5 }}>
                   Attendance imetumwa lakini uko nje ya eneo lililoruhusiwa.
                 </p>
               </>
             ) : (
               <>
                 <div style={{ background: "rgba(239, 68, 68, 0.15)", width: 80, height: 80, borderRadius: "50%", display: "grid", placeItems: "center", margin: "0 auto 24px" }}>
                    <AlertCircle size={40} color="#EF4444" />
                 </div>
                 <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8, color: "#EF4444" }}>Imetuma (Review)</h3>
                 <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, padding: "0 20px", lineHeight: 1.5 }}>
                   Location haijaruhusiwa. Mwalimu ataona kama manual review.
                 </p>
               </>
             )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
             {errorMsg && (
               <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)", padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 600 }}>
                  {errorMsg}
               </div>
             )}

             <div>
                <label style={labelStyle}>ATTENDANCE SESSION CODE *</label>
                <div style={{ position: "relative" }}>
                  <input 
                    type="text" 
                    value={sessionCode} 
                    onChange={e => setSessionCode(e.target.value)} 
                    placeholder="e.g. S108K9" 
                    required 
                    disabled={validatingCode || submitting}
                    style={{ ...inputStyle, textTransform: "uppercase" }}
                  />
                  {validatingCode && <Loader2 size={16} className="animate-spin" style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: G }} />}
                </div>
             </div>

             {sessionData && (
                <div style={{ background: "rgba(245, 166, 35, 0.05)", border: `1px solid ${G}20`, borderRadius: 16, padding: 14, fontSize: 13 }}>
                   <div style={{ fontWeight: 800, color: G }}>Darasa: {sessionData.className}</div>
                   {sessionData.subject ? <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>Somo: {sessionData.subject}</div> : null}
                   {sessionData.gpsRequired && <div style={{ fontSize: 11, color: "#10b981", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>🟢 Mahali (GPS) inahitajika kwa mahudhurio haya.</div>}
                </div>
             )}

             <div>
                <label style={labelStyle}>JINA KAMILI (FULL NAME) *</label>
                <input 
                  type="text" 
                  value={studentName} 
                  onChange={e => setStudentName(e.target.value)} 
                  placeholder="e.g. John Juma" 
                  required 
                  disabled={submitting}
                  style={inputStyle}
                />
             </div>

             <div>
                <label style={labelStyle}>NAMBA YA MWANAFUNZI (STUDENT ID) *</label>
                <input 
                  type="text" 
                  value={studentId} 
                  onChange={e => setStudentId(e.target.value)} 
                  placeholder="e.g. ST-1002" 
                  required 
                  disabled={submitting}
                  style={inputStyle}
                />
             </div>

             <div>
                <label style={labelStyle}>NAMBA YA SIMU (PHONE) - HIARI</label>
                <input 
                  type="tel" 
                  value={studentPhone} 
                  onChange={e => setStudentPhone(e.target.value)} 
                  placeholder="e.g. 07XXXXXXXX" 
                  disabled={submitting}
                  style={inputStyle}
                />
             </div>

             <div style={{ display: "flex", gap: 12, marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 16 }}>
                <button type="button" onClick={onClose} disabled={submitting} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "none", padding: 14, borderRadius: 12, color: "#fff", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                <button 
                  type="submit" 
                  disabled={submitting || validatingCode || !sessionData} 
                  style={{ flex: 2, background: (sessionData && !submitting) ? G : "rgba(255,255,255,0.05)", color: (sessionData && !submitting) ? "#000" : "rgba(255,255,255,0.2)", border: "none", padding: 14, borderRadius: 12, fontWeight: 900, cursor: (sessionData && !submitting) ? "pointer" : "not-allowed" }}
                >
                  {submitting ? "Inatuma..." : "Hudhuria Sasa"}
                </button>
             </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "grid", placeItems: "center", zIndex: 5000, padding: 20 };
const modalContentStyle = { background: "#0c0e14", padding: 28, borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)", color: "#fff", display: "flex", flexDirection: "column", width: "100%", maxWidth: 440 };
const labelStyle = { display: "block", fontSize: 11, fontWeight: 900, marginBottom: 8, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 };
const inputStyle = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "14px 18px", borderRadius: 14, color: "#fff", outline: "none", fontSize: 15 };
