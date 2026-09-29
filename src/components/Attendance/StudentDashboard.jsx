import { useState, useEffect, useMemo } from "react";
import { QrCode, LogIn, History, Play, CheckCircle2, MapPin, Users, BookOpen, UserCircle, Loader2, PlayCircle, ChevronRight, Bell } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { getFirebaseDb, getFirebaseAuth } from "../../firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { UploadResourceForm } from "../STEAHub/UploadResourceForm.jsx";
import { UserResourcesList } from "../STEAHub/UserResourcesList.jsx";
import AttendanceSubmissionModal from "./AttendanceSubmissionModal";
import STEAClassroomLoader from "../common/STEAClassroomLoader";

function toMillis(value) {
  if (!value) return null;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (value instanceof Date) return value.getTime();
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function getAttendanceSessionKey(session) {
  if (!session) return "";
  return (
    session.id ||
    session.sessionId ||
    `${session.classId || ""}_${session.sessionCode || session.joinCode || session.code || ""}_${toMillis(session.startTime || session.createdAt || session.startedAt) || ""}`
  );
}

function dedupeByKey(items, getKey) {
  const map = new Map();
  (Array.isArray(items) ? items : []).forEach((item) => {
    const key = getKey?.(item);
    if (!key || map.has(key)) return;
    map.set(key, item);
  });
  return Array.from(map.values());
}

function getSessionTime(session) {
  return (
    session?.startTime?.seconds ||
    session?.createdAt?.seconds ||
    session?.startTime?.toMillis?.() ||
    session?.createdAt?.toMillis?.() ||
    toMillis(session?.startTime || session?.createdAt || session?.startedAt) ||
    0
  );
}

function dedupeActiveAttendanceSessions(sessions = []) {
  const bySessionId = new Map();

  sessions.forEach((session) => {
    const sessionKey =
      session.id ||
      session.sessionId ||
      `${session.classId}_${session.sessionCode || session.joinCode || session.code || ""}_${getSessionTime(session)}`;

    if (!bySessionId.has(sessionKey)) {
      bySessionId.set(sessionKey, session);
    }
  });

  const byClassId = new Map();

  Array.from(bySessionId.values()).forEach((session) => {
    const classKey = session.classId || session.classID || session.classDocId;

    if (!classKey) return;

    const existing = byClassId.get(classKey);

    if (!existing || getSessionTime(session) > getSessionTime(existing)) {
      byClassId.set(classKey, session);
    }
  });

  return Array.from(byClassId.values());
}

const Breadcrumbs = ({ paths }) => (
  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 16, fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
    {paths.map((p, i) => (
      <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {p.onClick ? (
          <button 
            type="button" 
            onClick={p.onClick} 
            style={{ background: "none", border: "none", color: "inherit", font: "inherit", cursor: "pointer", padding: 0, transition: "color 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#F5A623"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
          >
            {p.label}
          </button>
        ) : (
          <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>{p.label}</span>
        )}
        {i < paths.length - 1 && <span style={{ opacity: 0.5 }}>&rarr;</span>}
      </span>
    ))}
  </div>
);

export function StudentDashboard({ onBack, user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("classes"); // classes, history, submit, resources
  const [showCodeInput, setShowCodeInput] = useState(null); // 'class' or 'attendance'
  const [code, setCode] = useState("");
  
  const [myClasses, setMyClasses] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [liveAssignments, setLiveAssignments] = useState([]);
  const [liveQuizzes, setLiveQuizzes] = useState([]);
  const [liveResources, setLiveResources] = useState([]);
  const [liveAnnouncements, setLiveAnnouncements] = useState([]);
  const [history, setHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [classReadStates, setClassReadStates] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loaderFinished, setLoaderFinished] = useState(false);

  useEffect(() => {
    if (loading) {
      setLoaderFinished(false);
    }
  }, [loading]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState(user?.displayName || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [attendanceSubmitContext, setAttendanceSubmitContext] = useState(null);
  const [toast, setToast] = useState(null);
  const [queryError, setQueryError] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);
  
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();

  useEffect(() => {
    if (!user || !db) {
       setLoading(false);
       return;
    }

    let cancelled = false;
    const loadClasses = () => {
      const qStudentClasses = query(collection(db, "classEnrollments"), where("studentId", "==", user.uid));
      return onSnapshot(
        qStudentClasses,
        (snap) => {
          if (cancelled) return;
          const results = snap.docs.map(doc => {
            const data = doc.data() || {};
            const classId = data.classId || doc.id;
            return {
              ...data,
              id: classId,
              classId,
              className: data.className || data.name || data.title || "",
              subject: data.subject || "",
              classCode: data.classCode || data.joinCode || "",
              joinCode: data.classCode || data.joinCode || "",
              teacherName: data.teacherName || data.ownerName || "Mwalimu",
              teacherId: data.teacherId || data.ownerId || data.createdBy || "",
              status: data.status || "active",
              deleted: data.deleted || false
            };
          }).filter(c => c.status !== "deleted" && c.deleted !== true && c.enrollmentStatus !== "removed");
          setMyClasses(results);
          setLoading(false);
        },
        (err) => {
          if (cancelled) return;
          console.warn("Student class load failed:", err);
          setQueryError(err?.message || String(err));
          setLoading(false);
        }
      );
    };
    const unsubClasses = loadClasses();

    const q3 = query(collection(db, "notifications"), where("userId", "==", user.uid));
    const unsubNotif = onSnapshot(q3, snap => {
        let arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        arr.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });
        setNotifications(arr);
    }, (err) => {
        console.warn("Student notifications load failed:", err);
        setNotifications([]);
    });

    const qReadStates = query(collection(db, "classReadStates"), where("userId", "==", user.uid));
    const unsubReadStates = onSnapshot(qReadStates, snap => {
        setClassReadStates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
        console.warn("Student class read states load failed:", err);
        setClassReadStates([]);
    });

    return () => { cancelled = true; unsubNotif(); unsubReadStates(); unsubClasses(); };
  }, [user, db]);

  const uniqueMyClasses = useMemo(() => dedupeByKey(
    myClasses,
    (classroom) => classroom?.id || classroom?.classId || `${classroom?.className || classroom?.name || ""}_${classroom?.teacherId || ""}`
  ), [myClasses]);
  const joinedClassIds = useMemo(() => new Set(uniqueMyClasses.map((c) => c.id).filter(Boolean)), [uniqueMyClasses]);
  const classById = useMemo(() => {
    const map = new Map();
    uniqueMyClasses.forEach((classroom) => {
      if (!classroom?.id) return;
      map.set(classroom.id, classroom);
    });
    return map;
  }, [uniqueMyClasses]);

  useEffect(() => {
    const classIds = Array.from(joinedClassIds);
    if (!db || classIds.length === 0) {
      setActiveSessions([]);
      setHistory([]);
      return undefined;
    }

    const sessionsById = new Map();
    const recordsBySessionId = new Map();
    const recordUnsubs = new Map();
    const applyHistory = () => {
      const items = [...recordsBySessionId.values()]
        .sort((a, b) => (toMillis(b.checkInTime || b.timestamp || b.createdAt || b.sessionDate) || 0) - (toMillis(a.checkInTime || a.timestamp || a.createdAt || a.sessionDate) || 0));
      setHistory(items);
    };
    const applySessions = () => {
      const now = Date.now();
      const active = dedupeActiveAttendanceSessions(
        [...sessionsById.values()]
        .filter((session) => {
          const createdAt = toMillis(session.createdAt || session.startedAt);
          return createdAt && (now - createdAt < 24 * 60 * 60 * 1000); // Only keep sessions from the last 24h
        })
        .sort((a, b) => (toMillis(b.createdAt) || 0) - (toMillis(a.createdAt) || 0))
      );
      setActiveSessions(active);
    };

    const unsubscribers = classIds.map((classId) => onSnapshot(
      query(collection(db, "attendanceSessions"), where("classId", "==", classId)),
      (snapshot) => {
        snapshot.docs.forEach((item) => {
          const session = { id: item.id, ...item.data() };
          sessionsById.set(item.id, session);
          if (!recordUnsubs.has(item.id)) {
            const recordRef = doc(db, "attendanceSessions", item.id, "records", user.uid);
            const unsubRecord = onSnapshot(recordRef, (recordSnap) => {
              if (!recordSnap.exists()) {
                recordsBySessionId.delete(item.id);
                applyHistory();
                return;
              }
              const classroom = classById.get(session.classId) || {};
              const record = recordSnap.data() || {};
              recordsBySessionId.set(item.id, {
                id: `${item.id}_${user.uid}`,
                sessionId: item.id,
                classId: session.classId,
                className: session.className || classroom.className || classroom.name || "Class",
                attendanceCode: session.sessionCode || session.joinCode || session.code || "",
                sessionCode: session.sessionCode || session.joinCode || session.code || "",
                checkInTime: record.checkInTime || record.timestamp || record.createdAt,
                timestamp: record.checkInTime || record.timestamp || record.createdAt,
                status: record.status || "present",
                method: record.method || record.checkInMethod || "student",
                sessionDate: session.createdAt || session.startedAt || record.createdAt,
                teacherName: session.teacherName || classroom.teacherName || "",
              });
              applyHistory();
            }, (error) => {
              console.warn("Student nested attendance record load failed:", error);
            });
            recordUnsubs.set(item.id, unsubRecord);
          }
        });
        applySessions();
      },
      (error) => console.warn("Student class attendance load failed:", error)
    ));

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      recordUnsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, [db, joinedClassIds, user?.uid, classById]);

  useEffect(() => {
    const classIds = Array.from(joinedClassIds);
    if (!db || classIds.length === 0) {
      setLiveAssignments([]);
      setLiveResources([]);
      setLiveQuizzes([]);
      setLiveAnnouncements([]);
      return undefined;
    }

    const buckets = {
      assignments: new Map(),
      resources: new Map(),
      quizzes: new Map(),
      announcements: new Map(),
    };
    const recentOnly = (item) => {
      const time = toMillis(item.createdAt || item.updatedAt || item.scheduledAt);
      return time && (Date.now() - time) < (7 * 24 * 60 * 60 * 1000);
    };
    const publishable = (item) => item.deleted !== true && item.status !== "deleted" && item.visibility !== "draft" && item.status !== "draft";
    const mergeBucket = (key) => Array.from(buckets[key].values()).flat();
    const unsubs = [];

    classIds.forEach((classId) => {
      unsubs.push(onSnapshot(
        query(collection(db, "assignments"), where("classId", "==", classId)),
        (snap) => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(recentOnly).filter(publishable);
          buckets.assignments.set(classId, items.filter(item => item.type !== "note"));
          buckets.resources.set(`assignment-notes-${classId}`, items.filter(item => item.type === "note"));
          setLiveAssignments(mergeBucket("assignments"));
          setLiveResources(mergeBucket("resources"));
        },
        (error) => {
          console.warn("Student class assignments load failed:", error);
          setQueryError("Some class updates could not be loaded.");
        }
      ));

      unsubs.push(onSnapshot(
        query(collection(db, "classResources"), where("classId", "==", classId)),
        (snap) => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(recentOnly).filter(publishable);
          buckets.resources.set(`class-resources-${classId}`, items);
          setLiveResources(mergeBucket("resources"));
        },
        (error) => {
          console.warn("Student class resources load failed:", error);
        }
      ));

      unsubs.push(onSnapshot(
        query(collection(db, "quizzes"), where("classId", "==", classId)),
        (snap) => {
          buckets.quizzes.set(classId, snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(recentOnly).filter(publishable));
          setLiveQuizzes(mergeBucket("quizzes"));
        },
        (error) => {
          console.warn("Student class quizzes load failed:", error);
          setQueryError("Some class updates could not be loaded.");
        }
      ));

      unsubs.push(onSnapshot(
        query(collection(db, "announcements"), where("classId", "==", classId)),
        (snap) => {
          buckets.announcements.set(classId, snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(recentOnly).filter(publishable));
          setLiveAnnouncements(mergeBucket("announcements"));
        },
        (error) => {
          console.warn("Student class announcements load failed:", error);
          setQueryError("Some class updates could not be loaded.");
        }
      ));
    });

    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  }, [db, joinedClassIds]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Derived state to securely filter items ONLY to joined classes
  const myClassIds = new Set(uniqueMyClasses.map(c => c.id).filter(Boolean));
  const readStateByClassId = useMemo(() => {
    const map = {};
    classReadStates.forEach((state) => {
      if (!state?.classId) return;
      map[state.classId] = state;
    });
    return map;
  }, [classReadStates]);
  const uniqueActiveSessions = useMemo(() => dedupeByKey(activeSessions, getAttendanceSessionKey), [activeSessions]);
  const visibleLiveSessions = useMemo(() => dedupeActiveAttendanceSessions(uniqueActiveSessions), [uniqueActiveSessions]);
  const submittedSessionIds = useMemo(() => new Set(history.map(h => h.sessionId)), [history]);
  const filteredSessions = visibleLiveSessions
    .map(s => {
      const endTimeToUse = toMillis(s.endsAt || s.endTime || s.expiresAt);
      const remainingSeconds = endTimeToUse ? Math.max(0, Math.floor((endTimeToUse - now) / 1000)) : null;
      const isExpiredTime = endTimeToUse ? (now >= endTimeToUse) : false;
      const isClosedStatus = s.status === "closed" || s.status === "ended" || s.isActive === false;
      
      const isSubmitted = submittedSessionIds.has(s.id);
      
      let computedStatus = "live";
      if (isSubmitted) computedStatus = "submitted";
      else if (isClosedStatus) computedStatus = "ended";
      else if (isExpiredTime) computedStatus = "expired";
      
      return { ...s, remainingSeconds, computedStatus, isExpired: computedStatus !== "live" };
    })
    .filter(s => myClassIds.has(s.classId));
  const liveSessionKeys = useMemo(() => new Set(filteredSessions.map((session) => getAttendanceSessionKey(session))), [filteredSessions]);
  const filteredAssignments = liveAssignments.filter(a => myClassIds.has(a.classId));
  const filteredQuizzes = liveQuizzes.filter(q => myClassIds.has(q.classId));
  const filteredResources = liveResources.filter(r => myClassIds.has(r.classId));
  const filteredAnnouncements = liveAnnouncements.filter(a => myClassIds.has(a.classId));

  const allUpdates = [
    ...filteredSessions.map(s => ({ ...s, feedType: 'session' })),
    ...filteredAssignments.map(a => ({ ...a, feedType: 'assignment' })),
    ...filteredQuizzes.map(q => ({ ...q, feedType: 'quiz' })),
    ...filteredResources.map(r => ({ ...r, feedType: 'resource' })),
    ...filteredAnnouncements.map(a => ({ ...a, feedType: 'announcement' }))
  ].sort((a, b) => {
    const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || a.startTime || 0);
    const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || b.startTime || 0);
    return tB - tA; // Newest first
  }).filter((item) => item.feedType !== 'session' || !liveSessionKeys.has(getAttendanceSessionKey(item)));


  const handleJoinByCode = (e) => {
    e.preventDefault();
    if (code.trim()) {
      const uCode = code.toUpperCase().trim();
      if (showCodeInput === 'class') {
        navigate(`/classroom/join/${uCode}`);
      } else {
        setAttendanceSubmitContext({
          attendanceCode: uCode
        });
        setShowCodeInput(null);
        setCode("");
      }
    }
  };

  const openAttendanceModal = (session) => {
    if (!session) return;
    setAttendanceSubmitContext({
      sessionId: session.id,
      classId: session.classId,
      attendanceCode: session.sessionCode || session.joinCode || session.code || "",
      className: session.className || "",
      subject: session.subject || ""
    });
  };

  const [showClassPicker, setShowClassPicker] = useState(false);

  const handleUpdateProfile = async (e) => {
     e.preventDefault();
     if(!profileName.trim()) return;
     setSavingProfile(true);
     try {
       await updateProfile(auth.currentUser, { displayName: profileName });
       await updateDoc(doc(db, "users", user.uid), { displayName: profileName });
       setToast({ type: "success", message: "Wasifu umesasishwa kikamilifu!" });
       setShowProfileModal(false);
     } catch (err) {
       console.error("Error updating profile", err);
       setToast({ type: "error", message: "Imeshindwa kusasisha. Jaribu tena." });
     }
     setSavingProfile(false);
  };

  if (!loaderFinished) {
      return (
        <STEAClassroomLoader 
          progress={loading ? 85 : 100} 
          onComplete={() => setLoaderFinished(true)} 
        />
      );
   }

  const breadcrumbs = [
    { label: "Home", onClick: () => {
       if (window.history.state && window.history.state.idx > 0) {
         navigate(-1);
       } else {
         navigate("/");
       }
    }},
    { label: "STEA Classroom", onClick: onBack },
    { label: "Student Dashboard" }
  ];

  return (
    <div style={{ color: "#fff", padding: "24px 16px", paddingBottom: "120px", maxWidth: 800, margin: "0 auto", minHeight: "100vh" }}>
      {toast && (
        <div role="status" style={{ position: "fixed", top: 20, right: 20, zIndex: 3000, maxWidth: 360, padding: "12px 16px", borderRadius: 12, background: toast.type === "error" ? "#991b1b" : "#166534", color: "#fff", fontWeight: 700, boxShadow: "0 12px 30px rgba(0,0,0,.3)" }}>
          {toast.message}
        </div>
      )}
      <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
           <Breadcrumbs paths={breadcrumbs} />
           <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Student Center</h1>
           <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Karibu, {user?.displayName || "Mwanafunzi"}</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
           <div style={{ position: "relative" }}>
             <button 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ 
                  background: "rgba(255,255,255,0.1)", 
                  border: "none", 
                  color: "#fff", 
                  padding: "10px", 
                  borderRadius: 12, 
                  display: "flex", 
                  alignItems: "center", 
                  cursor: "pointer", 
                  fontWeight: 700,
                  boxShadow: notifications.filter(n => !n.isRead).length > 0 ? "0 0 15px rgba(239, 68, 68, 0.6)" : "none",
                }}
             >
                <Bell size={18} color={notifications.filter(n => !n.isRead).length > 0 ? "#F5A623" : "#fff"} />
                {notifications.filter(n => !n.isRead).length > 0 && (
                   <div style={{ position: "absolute", top: -4, right: -4, background: "#EF4444", color: "#FFF", fontSize: 10, fontWeight: 900, width: 18, height: 18, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 10px #EF4444" }}>
                     {notifications.filter(n => !n.isRead).length}
                   </div>
                )}
             </button>
             <AnimatePresence>
                {showNotifications && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                     style={{ position: "absolute", top: 48, right: 0, width: 320, background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, zIndex: 100, boxShadow: "0 10px 40px rgba(0,0,0,0.5)", overflow: "hidden" }}
                   >
                     <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", fontWeight: 900, display: "flex", justifyContent: "space-between" }}>
                       <span>Notifications</span>
                     </div>
                     <div style={{ maxHeight: 300, overflowY: "auto" }}>
                        {notifications.length === 0 ? (
                           <div style={{ padding: 24, textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>No new notifications</div>
                        ) : (
                           notifications.map(n => (
                              <div 
                                key={n.id}
                                onClick={async () => {
                                   if (!n.isRead) {
                                      await updateDoc(doc(getFirebaseDb(), "notifications", n.id), { isRead: true });
                                   }
                                   setShowNotifications(false);
                                   if (n.classId && n.link) {
                                      navigate(`/class/${n.classId}/${n.link}`);
                                   } else if (n.classId) {
                                      navigate(`/class/${n.classId}`);
                                   }
                                }}
                                style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", background: n.isRead ? "transparent" : "rgba(245, 166, 35, 0.05)", display: "flex", gap: 12, alignItems: "flex-start" }}
                              >
                                 <div style={{ width: 8, height: 8, borderRadius: 4, background: n.isRead ? "transparent" : "#F5A623", marginTop: 6, flexShrink: 0 }} />
                                 <div>
                                    <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4, color: n.isRead ? "rgba(255,255,255,0.8)" : "#fff" }}>{n.title}</div>
                                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>{n.message}</div>
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                   </motion.div>
                )}
             </AnimatePresence>
           </div>

           <button 
              onClick={() => setShowProfileModal(true)}
              style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "10px 14px", borderRadius: 12, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 700 }}
           >
              <UserCircle size={18} /> Wasifu Wangu
           </button>
        </div>
      </div>

      <AnimatePresence>
        {(filteredSessions.length > 0 || filteredAssignments.length > 0 || filteredQuizzes.length > 0 || filteredAnnouncements.length > 0) && activeTab === "classes" && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginBottom: 24 }}
          >
            {filteredSessions.length > 0 && (
              <div style={{ marginBottom: 18, display: "grid", gap: 12 }}>
                {filteredSessions.map((session) => {
                  const isLive = session.computedStatus === "live";
                  const isSubmitted = session.computedStatus === "submitted";
                  const isEnded = session.computedStatus === "ended";
                  const isExpired = session.computedStatus === "expired";
                  
                  const bg = isLive ? "linear-gradient(180deg, rgba(16,185,129,0.16), rgba(16,185,129,0.08))" : "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))";
                  const border = isLive ? "1px solid rgba(16,185,129,0.28)" : "1px solid rgba(255,255,255,0.1)";
                  const shadow = isLive ? "0 10px 24px rgba(16,185,129,0.12)" : "0 10px 24px rgba(0,0,0,0.2)";
                  
                  let statusTitle = "LIVE ATTENDANCE ACTIVE";
                  let statusColor = "#10B981";
                  if (isSubmitted) { statusTitle = "ATTENDANCE SUBMITTED"; statusColor = "#3B82F6"; }
                  else if (isEnded) { statusTitle = "ATTENDANCE ENDED"; statusColor = "#9CA3AF"; }
                  else if (isExpired) { statusTitle = "ATTENDANCE EXPIRED"; statusColor = "#9CA3AF"; }

                  return (
                    <div
                      key={session.id || session.sessionId || `${session.classId}_${session.sessionCode || session.joinCode || session.code || ""}`}
                      style={{
                        background: bg,
                        border: border,
                        borderRadius: 18,
                        padding: 16,
                        boxShadow: shadow
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 900, color: statusColor, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>{statusTitle}</div>
                          <div style={{ fontSize: 17, fontWeight: 900, color: "#fff", lineHeight: 1.25, opacity: isLive ? 1 : 0.7 }}>{session.className || "Attendance session"}</div>
                          <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 13, marginTop: 6, lineHeight: 1.4 }}>
                            Class: {session.className || "Class"}{session.subject ? ` · Subject: ${session.subject}` : ""}
                          </div>
                          {isLive && (
                            <div style={{ color: "#F5A623", fontSize: 13, fontWeight: 800, marginTop: 8 }}>
                              Code: {session.sessionCode || session.joinCode || session.code || "------"}
                            </div>
                          )}
                          <div style={{ color: statusColor, fontSize: 13, fontWeight: 800, marginTop: 6 }}>
                            {isLive ? (session.remainingSeconds !== null ? `${Math.floor(session.remainingSeconds / 60)}:${String(session.remainingSeconds % 60).padStart(2, "0")} remaining` : "Live") : (isSubmitted ? "Marked Present" : "Closed")}
                          </div>
                        </div>
                        {isLive && (
                          <button
                            onClick={() => openAttendanceModal(session)}
                            style={{
                              background: "#F5A623",
                              color: "#111",
                              border: "none",
                              borderRadius: 12,
                              padding: "12px 18px",
                              fontWeight: 900,
                              cursor: "pointer",
                              minWidth: 160,
                              boxShadow: "0 8px 18px rgba(245,166,35,0.24)"
                            }}
                          >
                            Mark Attendance
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: "#10B981", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                   <span className="pulse-dot" style={{ width: 8, height: 8, background: "#10B981", borderRadius: "50%" }} />
                   🔔 LIVE UPDATES / YANAYOENDELEA
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                   {allUpdates.length === 0 ? (
                      <div style={{ textAlign: "center", padding: 40, opacity: 0.5, fontSize: 14 }}>Hakuna matukio mapya kwenye madarasa yako.</div>
                   ) : (
                      allUpdates.map(item => {
                         if (item.feedType === 'session') {
                            const s = item;
                            if (s.isExpired) {
                               return (
                                  <div 
                                     key={`exp-${s.id}`}
                                     className="glass-card" 
                                     style={{ padding: 20, borderRadius: 20, display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(239, 68, 68, 0.3)", opacity: 0.7, textAlign: "left", width: "100%" }}
                                  >
                                     <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                           <span style={{ fontSize: 10, background: "rgba(239, 68, 68, 0.15)", color: "#EF4444", padding: "2px 8px", borderRadius: 6, fontWeight: 800 }}>🔴 MAHUDHURIO (IMEFUNGWA)</span>
                                        </div>
                                        <div style={{ fontWeight: 900, fontSize: 17, color: "#EF4444" }}>{s.className}</div>
                                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4, display: "flex", alignItems: "center", gap: 12 }}>
                                           <span>Mwalimu: {s.teacherName || "Mwalimu"}</span>
                                           <span style={{ color: "#EF4444", fontWeight: 700 }}>⛔ Muda umeisha</span>
                                        </div>
                                     </div>
                                  </div>
                               );
                            }
                            
                            const expiringSoon = s.remainingSeconds !== null && s.remainingSeconds <= 600;
                            const borderColor = expiringSoon ? "rgba(245, 166, 35, 0.4)" : "rgba(16, 185, 129, 0.3)";
                            const titleColor = expiringSoon ? "#F5A623" : "#10B981";
                            return (
                               <button 
                                  key={`att-${s.id}`} 
                                  onClick={() => openAttendanceModal(s)}
                                  className={`glass-card ${expiringSoon ? '' : 'pulse-glow'}`} 
                                  style={{ padding: 20, borderRadius: 20, display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${borderColor}`, cursor: "pointer", textAlign: "left", width: "100%", boxShadow: `0 0 15px ${borderColor}` }}
                               >
                                 <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                       {expiringSoon ? (
                                          <span style={{ fontSize: 10, background: "rgba(245, 166, 35, 0.15)", color: "#F5A623", padding: "2px 8px", borderRadius: 6, fontWeight: 800 }}>🟡 MAHUDHURIO (KARIBU KUFUNGWA)</span>
                                       ) : (
                                          <span style={{ fontSize: 10, background: "rgba(16, 185, 129, 0.15)", color: "#10B981", padding: "2px 8px", borderRadius: 6, fontWeight: 800 }} className="pulse-dot">🟢 MAHUDHURIO LIVE</span>
                                       )}
                                    </div>
                                    <div style={{ fontWeight: 900, fontSize: 17, color: titleColor }}>{s.className}</div>
                                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4, display: "flex", alignItems: "center", gap: 12 }}>
                                       <span>Mwalimu: {s.teacherName || "Mwalimu"}</span>
                                       {s.remainingSeconds !== null && (
                                         <span style={{ color: titleColor, fontWeight: 700 }}>
                                           🕒 {Math.floor(s.remainingSeconds / 60)}:{String(s.remainingSeconds % 60).padStart(2, "0")} remaining
                                         </span>
                                       )}
                                    </div>
                                 </div>
                                 <div style={{ background: titleColor, color: "#000", padding: "8px 16px", borderRadius: 12, fontWeight: 900, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                                    <Play size={14} fill="#000" /> Mark Attendance
                                 </div>
                               </button>
                            );
                         }
                         
                         if (item.feedType === 'assignment') {
                            const a = item;
                            return (
                               <button 
                                  key={`ass-${a.id}`} 
                                  onClick={() => navigate(`/class/${a.classId}`)}
                                  className="glass-card pulse-glow-blue" 
                                  style={{ padding: 20, borderRadius: 20, display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid rgba(59, 130, 246, 0.3)`, cursor: "pointer", textAlign: "left", width: "100%", boxShadow: `0 0 15px rgba(59, 130, 246, 0.2)` }}
                               >
                                 <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontSize: 10, background: "rgba(59, 130, 246, 0.15)", color: "#3B82F6", padding: "2px 8px", borderRadius: 6, fontWeight: 800 }} className="pulse-dot">📘 ASSIGNMENT MPYA</span>
                                    </div>
                                    <div style={{ fontWeight: 900, fontSize: 17, color: "#3B82F6" }}>{a.title || a.className}</div>
                                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4, display: "flex", alignItems: "center", gap: 12 }}>
                                       <span>{a.className}</span>
                                    </div>
                                 </div>
                               </button>
                            );
                         }

                         if (item.feedType === 'quiz') {
                            const q = item;
                            return (
                               <button 
                                  key={`quiz-${q.id}`} 
                                  onClick={() => navigate(`/attendance/quiz/${q.id}`)}
                                  className="glass-card pulse-glow-purple" 
                                  style={{ padding: 20, borderRadius: 20, display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid rgba(168, 85, 247, 0.3)`, cursor: "pointer", textAlign: "left", width: "100%", boxShadow: `0 0 15px rgba(168, 85, 247, 0.2)` }}
                               >
                                 <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontSize: 10, background: "rgba(168, 85, 247, 0.15)", color: "#A855F7", padding: "2px 8px", borderRadius: 6, fontWeight: 800 }} className="pulse-dot">📝 QUIZ MPYA</span>
                                    </div>
                                    <div style={{ fontWeight: 900, fontSize: 17, color: "#A855F7" }}>{q.title || q.className}</div>
                                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4, display: "flex", alignItems: "center", gap: 12 }}>
                                       <span>{q.className}</span>
                                    </div>
                                 </div>
                               </button>
                            );
                         }

                         if (item.feedType === 'announcement') {
                            const a = item;
                            return (
                               <div 
                                  key={`ann-${a.id}`} 
                                  className="glass-card pulse-glow-gold" 
                                  style={{ padding: 20, borderRadius: 20, display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid rgba(245, 166, 35, 0.3)`, textAlign: "left", width: "100%", boxShadow: `0 0 15px rgba(245, 166, 35, 0.2)` }}
                               >
                                 <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontSize: 10, background: "rgba(245, 166, 35, 0.15)", color: "#F5A623", padding: "2px 8px", borderRadius: 6, fontWeight: 800 }} className="pulse-dot">📢 TANGAZO KUTOKA {a.className?.toUpperCase() || "DARASANI"}</span>
                                    </div>
                                    <div style={{ fontWeight: 900, fontSize: 17, color: "#F5A623" }}>{a.title || "Tangazo Jipya"}</div>
                                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
                                       {a.content}
                                    </div>
                                 </div>
                               </div>
                            );
                         }
                         
                         return null;
                      })
                   )}
                </div>
            </div>

            <style>{`
              .pulse-dot { animation: pulse 1.5s infinite; }
              @keyframes pulse { 0% { transform: scale(0.95); opacity: 0.7; } 70% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(0.95); opacity: 0.7; } }
              .pulse-glow { animation: pulseGlow 2s infinite; }
              @keyframes pulseGlow { 0% { box-shadow: 0 0 5px rgba(16, 185, 129, 0.2); } 50% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.6); } 100% { box-shadow: 0 0 5px rgba(16, 185, 129, 0.2); } }
              .pulse-glow-blue { animation: pulseGlowBlue 2s infinite; }
              @keyframes pulseGlowBlue { 0% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.2); } 50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.6); } 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.2); } }
              .pulse-glow-purple { animation: pulseGlowPurple 2s infinite; }
              @keyframes pulseGlowPurple { 0% { box-shadow: 0 0 5px rgba(168, 85, 247, 0.2); } 50% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.6); } 100% { box-shadow: 0 0 5px rgba(168, 85, 247, 0.2); } }
              .pulse-glow-gold { animation: pulseGlowGold 2s infinite; }
              @keyframes pulseGlowGold { 0% { box-shadow: 0 0 5px rgba(245, 166, 35, 0.2); } 50% { box-shadow: 0 0 20px rgba(245, 166, 35, 0.6); } 100% { box-shadow: 0 0 5px rgba(245, 166, 35, 0.2); } }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
        <button 
           className="glass-card"
           onClick={() => { setCode(""); setShowCodeInput("class"); setShowClassPicker(false); }}
           style={{ padding: 24, borderRadius: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", background: showCodeInput === 'class' ? "rgba(255,255,255,0.1)" : "none" }}
        >
          <div style={{ background: "#F5A62320", padding: 12, borderRadius: 16 }}>
             <Users size={24} color="#F5A623" />
          </div>
          <span style={{ fontWeight: 800, color: "#fff" }}>Jiunge na Darasa</span>
        </button>

        <button 
           className="glass-card"
           onClick={() => { 
             if (myClasses.length === 0) {
                setCode(""); setShowCodeInput("attendance"); setShowClassPicker(false); 
             } else {
                setShowClassPicker(!showClassPicker); setShowCodeInput(null);
             }
           }}
           style={{ padding: 24, borderRadius: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", background: showClassPicker ? "rgba(255,255,255,0.1)" : "none" }}
        >
          <div style={{ background: "#10B98120", padding: 12, borderRadius: 16 }}>
            <LogIn size={24} color="#10B981" />
          </div>
          <span style={{ fontWeight: 800, color: "#fff" }}>Weka Mahudhurio</span>
        </button>
      </div>

      <AnimatePresence>
        {showClassPicker && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card"
            style={{ padding: 24, borderRadius: 24, marginBottom: 32 }}
          >
             <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Chagua darasa kuweka mahudhurio</h3>
             <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {myClasses.map(c => {
                   const activeSess = visibleLiveSessions.find(s => s.classId === c.id && !s.isExpired);
                   return (
                      <button 
                        key={c.id} 
                        onClick={() => {
                          if (activeSess) {
                            openAttendanceModal(activeSess);
                            setShowClassPicker(false);
                          } else {
                            // Show code input specifically for this class? 
                            // User request says: Mark Attendance button should first show: Choose Class
                            // If they choose, we can either go to class view or ask for code.
                            // Let's ask for code but with the context of this class.
                            navigate(`/class/${c.id}`);
                          }
                        }}
                        style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: 16, borderRadius: 16, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", color: "#fff" }}
                      >
                         <div style={{ textAlign: "left" }}>
                            <div style={{ fontWeight: 800 }}>{c.className}</div>
                            <div style={{ fontSize: 12, opacity: 0.5 }}>{c.subject}</div>
                         </div>
                         {activeSess ? (
                           <div style={{ background: "#10B98120", color: "#10B981", fontSize: 10, fontWeight: 900, padding: "4px 8px", borderRadius: 6 }}>LIVE</div>
                         ) : (
                           <ChevronRight size={16} opacity={0.3} />
                         )}
                      </button>
                   );
                })}
                <button 
                  onClick={() => { setShowClassPicker(false); setShowCodeInput("attendance"); }}
                  style={{ width: "100%", background: "transparent", border: "1px dashed rgba(255,255,255,0.3)", padding: 16, borderRadius: 16, color: "rgba(255,255,255,0.5)", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
                >
                  Tumia Code Moja kwa Moja
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCodeInput && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card" 
            style={{ padding: 24, borderRadius: 24, marginBottom: 32 }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>
              {showCodeInput === 'class' ? "Weka Class Code kujiunga" : "Weka Attendance Session Code"}
            </h3>
            <form onSubmit={handleJoinByCode} style={{ display: "flex", gap: 12 }}>
              <input 
                type="text" 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. W7605Q"
                style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "14px 20px", borderRadius: 12, color: "#fff", outline: "none", fontSize: 16 }}
              />
              <button 
                type="submit"
                style={{ background: showCodeInput === 'class' ? "#F5A623" : "#10B981", color: "#000", border: "none", padding: "14px 24px", borderRadius: 12, fontWeight: 900, cursor: "pointer" }}
              >
                Endelea
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, overflowX: "auto", paddingBottom: 8, scrollbarWidth: 'none' }}>
          <button 
            onClick={() => setActiveTab("classes")}
            style={{ padding: "8px 16px", borderRadius: 12, background: activeTab === 'classes' ? 'rgba(255,255,255,0.1)' : 'transparent', border: "none", color: "#fff", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            Madarasa Yangu
          </button>
          <button 
            onClick={() => setActiveTab("submit")}
            style={{ padding: "8px 16px", borderRadius: 12, background: activeTab === 'submit' ? 'rgba(255,255,255,0.1)' : 'transparent', border: "none", color: "#fff", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            Submit Resource
          </button>
          <button 
            onClick={() => setActiveTab("resources")}
            style={{ padding: "8px 16px", borderRadius: 12, background: activeTab === 'resources' ? 'rgba(255,255,255,0.1)' : 'transparent', border: "none", color: "#fff", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            My Contributions
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            style={{ padding: "8px 16px", borderRadius: 12, background: activeTab === 'history' ? 'rgba(255,255,255,0.1)' : 'transparent', border: "none", color: "#fff", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            Historia
          </button>
      </div>

      {activeTab === 'classes' ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {queryError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(239, 68, 68, 0.16)',
              borderRadius: 20,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              justifyContent: 'space-between',
              boxShadow: '0 4px 20px rgba(239, 68, 68, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>⚠️</span>
                <div style={{ textAlign: 'left' }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#f87171' }}>Darasa limeshindwa kupakia / Class Query Error</h4>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                    Unable to load classes from database. Showing cached local data if available.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  window.location.reload();
                }}
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                Retry
              </button>
            </div>
          )}
          {loading ? (
             <div style={{ textAlign: "center", padding: 40, opacity: 0.5 }}>loadinging...</div>
          ) : myClasses.length > 0 ? (
             myClasses.map(c => {
               const classState = readStateByClassId[c.id] || {};
               const unreadAssignments = filteredAssignments.filter(x => x.classId === c.id && !classState.assignment?.[x.id]);
               const unreadQuizzes = filteredQuizzes.filter(x => x.classId === c.id && !classState.quiz?.[x.id]);
               const unreadResources = filteredResources.filter(x => x.classId === c.id && !classState.resource?.[x.id]);
               const unreadAnnouncements = filteredAnnouncements.filter(x => x.classId === c.id && !classState.announcement?.[x.id]);
               const classUpdates = [...unreadAssignments, ...unreadQuizzes, ...unreadResources, ...unreadAnnouncements];
               return (
               <div key={c.id} onClick={() => navigate(`/class/${c.id}`)} className="glass-card responsive-card-row" style={{ padding: "20px 24px", borderRadius: 20, cursor: "pointer", position: "relative" }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>{c.className}</h3>
                    <div style={{ display: "flex", gap: 12, color: "rgba(255,255,255,0.5)", fontSize: 13, alignItems: "center", flexWrap: "wrap" }}>
                      <span>{c.subject}</span>
                      <span>•</span>
                      <span>{c.teacherName}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    {classUpdates.length > 0 && (
                      <div style={{ padding: "6px 12px", background: "rgba(59,130,246,0.18)", color: "#93c5fd", fontWeight: 900, borderRadius: 999, fontSize: 12 }}>
                        {classUpdates.length} new
                      </div>
                    )}
                    <div style={{ padding: "8px 16px", background: "#F5A623", color: "#000", fontWeight: 900, borderRadius: 12, fontSize: 14, alignSelf: "flex-start" }}>
                      OPEN
                    </div>
                  </div>
               </div>
             )})
          ) : (
             <div style={{ textAlign: "center", padding: "60px 20px" }} className="glass-card">
               <BookOpen size={48} style={{ margin: "0 auto 16px", opacity: 0.1 }} />
               <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Bado hujajiunga na darasa lolote.</h3>
               <button 
                 onClick={() => { setCode(""); setShowCodeInput("class"); }}
                 style={{ background: "#F5A623", color: "#000", border: "none", padding: "12px 24px", borderRadius: 12, fontWeight: 800, marginTop: 16, cursor: "pointer" }}
               >
                 Jiunge kwa Class Code
               </button>
               <button
                 onClick={() => { setCode(""); setShowCodeInput("class"); setToast({ message: "Enter a class code to restore an older class to your profile.", type: "info" }); }}
                 style={{ display: "block", margin: "12px auto 0", background: "transparent", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.22)", padding: "9px 16px", borderRadius: 10, fontWeight: 800, cursor: "pointer" }}
               >
                 Repair My Classes
               </button>
             </div>
          )}
        </div>
      ) : activeTab === 'submit' ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <UploadResourceForm user={user} role="student" onSuccess={() => { setToast({ type: "success", message: "Resource submitted securely! It will be available after admin approval." }); setActiveTab('resources'); }} />
        </div>
      ) : activeTab === 'resources' ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>My Contributions</h2>
          <UserResourcesList user={user} filterType="" />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {history.length > 0 ? (
             history.map(r => (
                <div key={r.id} className="glass-card responsive-card-row" style={{ padding: 16, borderRadius: 16 }}>
                   <div>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{r.className}</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                        {r.timestamp?.toDate ? new Date(r.timestamp.toDate()).toLocaleString() : "Just now"}
                      </div>
                   </div>
                   <div style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", padding: "6px 12px", borderRadius: 12, fontSize: 12, fontWeight: 800, alignSelf: "flex-start" }}>
                     HUDHURIO LIMEKUBALIWA
                   </div>
                </div>
             ))
          ) : (
             <div style={{ textAlign: "center", padding: "60px 20px" }} className="glass-card">
               <History size={48} style={{ margin: "0 auto 16px", opacity: 0.1 }} />
               <p style={{ opacity: 0.5 }}>Historia ya mahudhurio yako itaonekana hapa.</p>
             </div>
          )}
        </div>
      )}

      {showProfileModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "grid", placeItems: "center", zIndex: 1000, padding: 16 }}>
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             style={{ background: "#111", padding: 32, borderRadius: 24, width: "100%", maxWidth: 400, border: "1px solid rgba(255,255,255,0.1)" }}
           >
             <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24 }}>Badilisha Wasifu</h2>
             <form onSubmit={handleUpdateProfile}>
               <div style={{ marginBottom: 24 }}>
                 <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Jina Lako</label>
                 <input 
                   type="text"
                   value={profileName}
                   onChange={e => setProfileName(e.target.value)}
                   placeholder="Mfano: John Doe"
                   style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "14px", borderRadius: 12, color: "#fff", outline: "none" }}
                   required
                 />
               </div>
               <div style={{ display: "flex", gap: 12 }}>
                 <button type="button" onClick={() => setShowProfileModal(false)} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "none", padding: 14, borderRadius: 12, color: "#fff", fontWeight: 700, cursor: "pointer" }}>Ghairi</button>
                 <button type="submit" disabled={savingProfile} style={{ flex: 1, background: "#10B981", color: "#fff", border: "none", padding: 14, borderRadius: 12, fontWeight: 900, cursor: savingProfile ? "not-allowed" : "pointer", opacity: savingProfile ? 0.7 : 1 }}>Sasiha</button>
               </div>
             </form>
           </motion.div>
        </div>
      )}

      {attendanceSubmitContext && (
         <AttendanceSubmissionModal 
           initialCode={attendanceSubmitContext.attendanceCode}
           initialSession={attendanceSubmitContext}
           onClose={() => setAttendanceSubmitContext(null)}
           onSuccess={() => setAttendanceSubmitContext(null)}
         />
      )}
    </div>
  );
}
