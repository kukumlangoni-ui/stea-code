import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFirebaseDb, getFirebaseAuth, onAuthStateChanged } from "../../firebase";
import { useMobile } from "../../hooks/useMobile.js";
import { 
  setDoc,
  addDoc,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy, 
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "motion/react";
import STEAClassroomLoader from "../../components/common/STEAClassroomLoader";
import { buildClassJoinLink } from "../../services/classCodeService";
import { 
  Users, 
  Calendar, 
  MapPin, 
  Book, 
  Trash2, 
  Power, 
  Copy, 
  Check, 
  ArrowLeft,
  Loader2,
  FileDown,
  Plus,
  HelpCircle,
  Eye,
  Trophy,
  Bell,
  FileUp,
  LayoutDashboard,
  ClipboardList,
  BarChart
} from "lucide-react";
import QuizCreatorModal from "../../components/Attendance/QuizCreatorModal";
import QuizLeaderboard from "../../components/Attendance/QuizLeaderboard";
import AnnouncementsManager from "../../components/Attendance/AnnouncementsManager";
import AttendanceSessionManager from "../../components/Attendance/AttendanceSessionManager";
import AssignmentManager from "../../components/Attendance/AssignmentManager";
import ClassReports from "../../components/Attendance/ClassReports";

const G = "#F5A623";

function StudentStream({ items, readState, onOpen }) {
  const active = items.filter((item) => item.feedType === "attendance" && item.status === "active" && item.isActive === true);
  const updates = [...active, ...items.filter((item) => item.feedType !== "attendance")].slice(0, 8);
  const meta = {
    attendance: ["LIVE ATTENDANCE ACTIVE", "Mark Attendance"],
    assignment: ["NEW ASSIGNMENT", "Open Assignment"],
    quiz: ["NEW QUIZ", "Take Quiz"],
    resource: ["NEW RESOURCE", "Open Resource"],
    announcement: ["NEW ANNOUNCEMENT", "Mark as read"]
  };
  return <div style={{ textAlign: "left", marginBottom: 12 }}>
    <h2 style={{ fontSize: 22, margin: "0 0 16px" }}>What’s new in this class</h2>
    <div style={{ display: "grid", gap: 12 }}>
      {updates.length === 0 ? <p style={{ color: "rgba(255,255,255,.55)" }}>No new class activity.</p> : updates.map((item) => {
        const [label, action] = meta[item.feedType] || ["CLASS UPDATE", "Open"];
        const unread = !readState?.[item.feedType]?.[item.id];
        return <article key={`${item.feedType}-${item.id}`} style={{ padding: 16, borderRadius: 16, border: `1px solid ${unread ? "rgba(245,166,35,.55)" : "rgba(255,255,255,.08)"}`, background: unread ? "rgba(245,166,35,.08)" : "rgba(255,255,255,.03)", boxShadow: unread ? "0 0 18px rgba(245,166,35,.14)" : "none" }}>
          <div style={{ fontSize: 11, color: G, fontWeight: 900, letterSpacing: .8 }}>{label}</div>
          <div style={{ fontWeight: 900, fontSize: 16, marginTop: 6 }}>{item.title || item.className || "Class update"}</div>
          <div style={{ color: "rgba(255,255,255,.62)", fontSize: 13, marginTop: 6 }}>{item.feedType === "attendance" ? `Code: ${item.sessionCode || item.joinCode || item.code || "—"}` : item.description || item.content || item.message || (item.questions ? `${item.questions.length} questions` : "")}</div>
          <button onClick={() => onOpen(item)} style={{ marginTop: 12, background: G, border: 0, color: "#111", borderRadius: 10, padding: "8px 12px", fontWeight: 900, cursor: "pointer" }}>{action}</button>
        </article>;
      })}
    </div>
  </div>;
}

function StudentResourceList({ items, onOpen }) {
  return <div className="glass-card" style={{ padding: 24, borderRadius: 24 }}><h3 style={{ marginTop: 0 }}>Resources</h3>{items.length === 0 ? <p style={{ color: "rgba(255,255,255,.55)" }}>No resources have been posted.</p> : <div style={{ display: "grid", gap: 12 }}>{items.map((item) => <button key={item.id} onClick={() => onOpen(item)} style={{ textAlign: "left", padding: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", color: "#fff", cursor: "pointer" }}><strong>{item.title || "Resource"}</strong><div style={{ marginTop: 6, fontSize: 13, opacity: .65 }}>{item.description || item.linkUrl || "Open resource"}</div><div style={{ marginTop: 8, fontSize: 11, opacity: .5, display: "flex", gap: 10, flexWrap: "wrap" }}><span>{item.resourceCategory || item.type || "resource"}</span><span>{item.teacherName || "Teacher"}</span><span>{item.visibility || item.status || "published"}</span></div></button>)}</div>}</div>;
}

function StudentProfileCard({ student, classData }) {
  const joinedAtValue = student?.joinedAt?.toDate?.()?.toLocaleDateString?.() || student?.joinedAt?.toDate?.()?.toLocaleString?.() || "—";
  const field = (primary, fallback = "—") => primary || fallback;
  return (
    <div style={{ padding: 24, borderRadius: 24, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", textAlign: "left" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#F5A623", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>My Class Profile</div>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>{field(student?.studentName)}</h3>
          <div style={{ marginTop: 6, color: "rgba(255,255,255,.55)", fontSize: 13 }}>{field(student?.studentEmail)}</div>
        </div>
        <div style={{ padding: "8px 12px", borderRadius: 999, background: "rgba(16,185,129,.12)", color: "#10B981", fontSize: 12, fontWeight: 900 }}>
          Active
        </div>
      </div>

      <div className="stea-responsive-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginTop: 20 }}>
        <div style={{ padding: 14, borderRadius: 16, background: "rgba(0,0,0,.22)" }}><div style={{ fontSize: 11, textTransform: "uppercase", color: "rgba(255,255,255,.45)", fontWeight: 800 }}>Full name</div><div style={{ marginTop: 6, fontWeight: 800 }}>{field(student?.studentName)}</div></div>
        <div style={{ padding: 14, borderRadius: 16, background: "rgba(0,0,0,.22)" }}><div style={{ fontSize: 11, textTransform: "uppercase", color: "rgba(255,255,255,.45)", fontWeight: 800 }}>Registration number / ID</div><div style={{ marginTop: 6, fontWeight: 800 }}>{field(student?.studentRegNo || student?.studentId)}</div></div>
        <div style={{ padding: 14, borderRadius: 16, background: "rgba(0,0,0,.22)" }}><div style={{ fontSize: 11, textTransform: "uppercase", color: "rgba(255,255,255,.45)", fontWeight: 800 }}>Phone number</div><div style={{ marginTop: 6, fontWeight: 800 }}>{field(student?.studentPhone || student?.phone)}</div></div>
        <div style={{ padding: 14, borderRadius: 16, background: "rgba(0,0,0,.22)" }}><div style={{ fontSize: 11, textTransform: "uppercase", color: "rgba(255,255,255,.45)", fontWeight: 800 }}>Email</div><div style={{ marginTop: 6, fontWeight: 800 }}>{field(student?.studentEmail || student?.email)}</div></div>
        <div style={{ padding: 14, borderRadius: 16, background: "rgba(0,0,0,.22)" }}><div style={{ fontSize: 11, textTransform: "uppercase", color: "rgba(255,255,255,.45)", fontWeight: 800 }}>Class name</div><div style={{ marginTop: 6, fontWeight: 800 }}>{field(classData?.className)}</div></div>
        <div style={{ padding: 14, borderRadius: 16, background: "rgba(0,0,0,.22)" }}><div style={{ fontSize: 11, textTransform: "uppercase", color: "rgba(255,255,255,.45)", fontWeight: 800 }}>Subject</div><div style={{ marginTop: 6, fontWeight: 800 }}>{field(classData?.subject)}</div></div>
        <div style={{ padding: 14, borderRadius: 16, background: "rgba(0,0,0,.22)" }}><div style={{ fontSize: 11, textTransform: "uppercase", color: "rgba(255,255,255,.45)", fontWeight: 800 }}>Section</div><div style={{ marginTop: 6, fontWeight: 800 }}>{field(classData?.section || classData?.gradeSection || classData?.classSection)}</div></div>
        <div style={{ padding: 14, borderRadius: 16, background: "rgba(0,0,0,.22)" }}><div style={{ fontSize: 11, textTransform: "uppercase", color: "rgba(255,255,255,.45)", fontWeight: 800 }}>Room</div><div style={{ marginTop: 6, fontWeight: 800 }}>{field(classData?.room || classData?.classRoom)}</div></div>
        <div style={{ padding: 14, borderRadius: 16, background: "rgba(0,0,0,.22)" }}><div style={{ fontSize: 11, textTransform: "uppercase", color: "rgba(255,255,255,.45)", fontWeight: 800 }}>Teacher name</div><div style={{ marginTop: 6, fontWeight: 800 }}>{field(classData?.teacherName)}</div></div>
        <div style={{ padding: 14, borderRadius: 16, background: "rgba(0,0,0,.22)" }}><div style={{ fontSize: 11, textTransform: "uppercase", color: "rgba(255,255,255,.45)", fontWeight: 800 }}>Class code</div><div style={{ marginTop: 6, fontWeight: 800 }}>{field(classData?.classCode || classData?.joinCode)}</div></div>
        <div style={{ padding: 14, borderRadius: 16, background: "rgba(0,0,0,.22)" }}><div style={{ fontSize: 11, textTransform: "uppercase", color: "rgba(255,255,255,.45)", fontWeight: 800 }}>Joined date</div><div style={{ marginTop: 6, fontWeight: 800 }}>{joinedAtValue}</div></div>
        <div style={{ padding: 14, borderRadius: 16, background: "rgba(0,0,0,.22)" }}><div style={{ fontSize: 11, textTransform: "uppercase", color: "rgba(255,255,255,.45)", fontWeight: 800 }}>Status</div><div style={{ marginTop: 6, fontWeight: 800, color: "#10B981" }}>{field(student?.status || "active")}</div></div>
      </div>
    </div>
  );
}

export default function AttendanceClassView() {
  const isMobile = useMobile();
  const { classId, "*": subPath } = useParams();
  const [activeTab, setActiveTab] = useState(subPath || "overview");

  useEffect(() => {
    setActiveTab(subPath || "overview");
  }, [subPath]);

  const handleTabChange = (id) => {
    setActiveTab(id);
    setSelectedQuiz(null);
    if (id === "overview") {
      navigate(`/teacher/classes/${classId}`);
    } else {
      navigate(`/teacher/classes/${classId}/${id}`);
    }
  };
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [classResources, setClassResources] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  
  // Notification State
  const [classNotifications, setClassNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Derive Teacher status
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({ studentName: "", phone: "", email: "", studentId: "" });
  const [studentProfileForm, setStudentProfileForm] = useState({ studentName: "", studentRegNo: "", studentPhone: "", studentEmail: "", section: "", notes: "" });
  const [savingClassProfile, setSavingClassProfile] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [removingStudent, setRemovingStudent] = useState(null);
  const [removalReason, setRemovalReason] = useState("");
  const [readState, setReadState] = useState({});
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => { setToast({ message, type }); window.setTimeout(() => setToast(null), 3500); };

  const handleManualStudent = async (e) => {
    e.preventDefault();
    if (!studentForm.studentName) return;
    try {
      const db = getFirebaseDb();
      const collectionName = classData.isOldCollection ? "attendanceClasses" : "classes";
      
      let docIdForStudent = editingStudent?.id;
      if (!docIdForStudent) {
         docIdForStudent = studentForm.studentId ? studentForm.studentId.trim() : Math.random().toString(36).substring(2, 10);
      }
      
      const docRef = doc(db, collectionName, classId, "classStudents", docIdForStudent);
      
      if (editingStudent) {
         await updateDoc(docRef, {
           studentName: studentForm.studentName,
           studentEmail: studentForm.email,
           phone: studentForm.phone,
           studentId: studentForm.studentId || docIdForStudent
         });
         
         const uId = editingStudent.userId || editingStudent.studentUserId;
         if (uId) {
            await addDoc(collection(db, "notifications"), {
              userId: uId,
              classId,
              type: "profile_update",
              title: "Profile Updated",
              message: "Your class profile information was updated by the teacher.",
              link: "",
              isRead: false,
              createdAt: serverTimestamp(),
              createdBy: user?.uid || "teacher"
            });
         }
      } else {
         const { getDoc } = await import("firebase/firestore");
         const existingDetails = await getDoc(docRef);
         if (existingDetails.exists()) {
             showToast("Student is already in this class.", "error");
             return;
         }

         await setDoc(docRef, {
           studentId: studentForm.studentId || docIdForStudent,
           studentName: studentForm.studentName,
           studentEmail: studentForm.email,
           phone: studentForm.phone,
           joinedAt: serverTimestamp(),
           status: "active"
         });
         await updateDoc(doc(db, collectionName, classId), {
            studentCount: increment(1),
            students: arrayUnion(docIdForStudent)
         });
      }
      setShowStudentModal(false);
      setEditingStudent(null);
      setStudentForm({ studentName: "", phone: "", email: "", studentId: "" });
    } catch (err) {
      console.error("Error managing student", err);
    }
  };

  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  const previewAuthEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_PREVIEW_AUTH === "true";

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, async (u) => {
       if (!u && previewAuthEnabled) {
          setUser({ uid: "preview_user", displayName: "Preview User" });
          setUserRole("student"); // Assuming student as default for dev preview
       } else if (u) {
          setUser(u);
          try {
             const userDoc = await import("firebase/firestore").then(({ getDoc, doc }) => getDoc(doc(getFirebaseDb(), "users", u.uid)));
             if (userDoc.exists() && userDoc.data().classroomRole) {
               setUserRole(userDoc.data().classroomRole);
             }
          } catch (e) {}
       } else {
          setUser(null);
       }
    });
  }, [auth, previewAuthEnabled]);

  useEffect(() => {
    if (!classId || !db) return;

    const unsubClass = onSnapshot(doc(db, "classes", classId), (snap) => {
      if (snap.exists()) {
        setClassData({ id: snap.id, ...snap.data() });
      } else if (import.meta.env.DEV && classId === "demo-class-1") {
        setClassData({
           id: "demo-class-1",
           className: "Physics Form 4 (Demo)",
           subject: "Physics",
           teacherName: "Mr. Preview",
           status: "active",
           joinCode: "DEMO12",
           studentCount: 12,
           teacherId: previewAuthEnabled ? "preview_user" : (user?.uid || "teacher-id"),
           demoMode: true
        });
      } else {
        // Check old collection just in case
        onSnapshot(doc(db, "attendanceClasses", classId), (snapOld) => {
           if (snapOld.exists()) {
             setClassData({ id: snapOld.id, ...snapOld.data(), isOldCollection: true });
           } else {
             setClassData(null);
           }
        });
      }
      setLoading(false);
    });

    const collectionName = classData?.isOldCollection ? "attendanceClasses" : "classes";
    
    // Listen to attendees (students joined)
    const attendeesQuery = query(
      collection(db, collectionName, classId, "classStudents"), 
      orderBy("joinedAt", "desc")
    );
    
    const unsubAttendees = onSnapshot(attendeesQuery, (snap) => {
      let arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAttendees(arr);
    });

    // Listen to quizzes
    const quizQuery = query(
      collection(db, "quizzes"),
      where("classId", "==", classId)
    );

    const unsubQuizzes = onSnapshot(quizQuery, (snap) => {
      let arr = snap.docs.map(d => ({ id: d.id, ...d.data(), feedType: "quiz" }));
      arr.sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setQuizzes(arr);
    });

    // Listen to assignments
    const assignmentsQuery = query(collection(db, "assignments"), where("classId", "==", classId));
    const unsubAssignments = onSnapshot(assignmentsQuery, (snap) => {
       const arr = snap.docs.map(d => {
         const data = d.data();
         return { id: d.id, ...data, feedType: "assignment" };
       }).filter((item) => item.type !== "resource");
       setClassNotifications(prev => {
          const others = prev.filter(p => p.feedType !== "assignment");
          return [...others, ...arr].sort((a,b) => (b.createdAt?.toMillis?.() || b.timestamp?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || a.timestamp?.toMillis?.() || 0));
       });
    });

    const resourcesQuery = query(collection(db, "classResources"), where("classId", "==", classId));
    const unsubResources = onSnapshot(resourcesQuery, (snap) => {
       const arr = snap.docs.map(d => ({ id: d.id, ...d.data(), feedType: "resource" })).filter((item) => item.deleted !== true && item.status !== "deleted");
       setClassResources(arr);
       setClassNotifications(prev => {
          const others = prev.filter(p => p.feedType !== "resource");
          return [...others, ...arr].sort((a,b) => (b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0));
       });
    });

    // Listen to announcements
    const announcementsQuery = query(collection(db, "announcements"), where("classId", "==", classId));
    const unsubAnnouncements = onSnapshot(announcementsQuery, (snap) => {
       const arr = snap.docs.map(d => ({ id: d.id, ...d.data(), feedType: "announcement" }));
       setClassNotifications(prev => {
          const others = prev.filter(p => p.feedType !== "announcement");
          return [...others, ...arr].sort((a,b) => (b.createdAt?.toMillis?.() || b.timestamp?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || a.timestamp?.toMillis?.() || 0));
       });
    });

    // Listen to attendance sessions
    const sessionsQuery = query(collection(db, "attendanceSessions"), where("classId", "==", classId));
    const unsubSessions = onSnapshot(sessionsQuery, (snap) => {
       const arr = snap.docs.map(d => ({ id: d.id, ...d.data(), feedType: "attendance" }));
       setClassNotifications(prev => {
          const others = prev.filter(p => p.feedType !== "attendance");
          return [...others, ...arr].sort((a,b) => (b.createdAt?.toMillis?.() || b.timestamp?.toMillis?.() || b.startTime || 0) - (a.createdAt?.toMillis?.() || a.timestamp?.toMillis?.() || a.startTime || 0));
       });
    });

    return () => {
      unsubClass();
      unsubAttendees();
      unsubQuizzes();
      unsubAssignments();
      unsubResources();
      unsubAnnouncements();
      unsubSessions();
    };
  }, [classId, db, classData?.isOldCollection, user?.uid]);

  useEffect(() => {
    if (!db || !classId || !user?.uid) return undefined;
    return onSnapshot(doc(db, "classReadStates", `${classId}_${user.uid}`), (snapshot) => {
      setReadState(snapshot.exists() ? snapshot.data() : {});
    });
  }, [db, classId, user?.uid]);

  // Combine quizzes into notifications when quizzes change
  useEffect(() => {
     setClassNotifications(prev => {
        const others = prev.filter(p => p.feedType !== "quiz");
        return [...others, ...quizzes].sort((a,b) => (b.createdAt?.toMillis?.() || b.timestamp?.toMillis?.() || b.startTime || 0) - (a.createdAt?.toMillis?.() || a.timestamp?.toMillis?.() || a.startTime || 0));
     });
  }, [quizzes]);

  const copyLink = () => {
    if (!classData) return;
    const url = buildClassJoinLink(classData.classCode || classData.joinCode);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleStatus = async () => {
    if (!classData || !db) return;
    const newStatus = classData.status === "active" ? "closed" : "active";
    try {
      const collectionName = classData.isOldCollection ? "attendanceClasses" : "classes";
      await updateDoc(doc(db, collectionName, classId), { status: newStatus, updatedAt: serverTimestamp() });
    } catch (err) {
      showToast("Could not update class status.", "error");
    }
  };

  const deleteClass = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteClass = async () => {
    if (!classData || !db) return;
    if (deleteConfirmation !== "DELETE") return;
    setIsDeleting(true);
    try {
      const collectionName = classData.isOldCollection ? "attendanceClasses" : "classes";
      // Soft deletion is deliberate: Firestore cannot atomically cascade nested
      // records from a browser client. All classroom queries exclude this state.
      await updateDoc(doc(db, collectionName, classId), {
        status: "deleted", deleted: true, deletedAt: serverTimestamp(), deletedBy: user?.uid || ""
      });
      await addDoc(collection(db, "audit_logs"), {
        action: "soft_delete_class", entity: collectionName, entityId: classId,
        classId, performedByUid: user?.uid || "", performedByEmail: user?.email || "",
        timestamp: serverTimestamp(), source: "class_view"
      });
      navigate("/classroom");
    } catch (err) {
      showToast("Could not delete class.", "error");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const exportCSV = () => {
    if (attendees.length === 0) return;
    const headers = ["Name", "Email", "Joined At"];
    const rows = attendees.map(a => [
      a.studentName,
      a.studentEmail || "",
      a.joinedAt?.toDate().toLocaleString() || ""
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${classData.className}_students.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const joinLink = buildClassJoinLink(classData?.classCode || classData?.joinCode);
  const isTeacher = Boolean(user?.uid && (
    user.uid === classData?.teacherId ||
    user.uid === classData?.createdBy ||
    (user.email && user.email === classData?.teacherEmail)
  ));

  const currentStudent = attendees.find(a => a.id === user?.uid || a.studentUid === user?.uid || a.userId === user?.uid || a.studentUserId === user?.uid);
  const isStudent = Boolean(currentStudent && currentStudent.status === "active" && !isTeacher);
  const isMember = isTeacher || isStudent;
  const hasStudentName = Boolean(currentStudent?.studentName);
  const hasStudentRegNo = Boolean(currentStudent?.studentRegNo || currentStudent?.studentId);
  const hasStudentPhone = Boolean(currentStudent?.studentPhone || currentStudent?.phone);
  const hasStudentEmail = Boolean(currentStudent?.studentEmail || currentStudent?.email);
  const missingStudentProfile = Boolean(isStudent && (!hasStudentName || !hasStudentRegNo || !hasStudentPhone || !hasStudentEmail));
  const needsProfileCompletion = isStudent && missingStudentProfile;
  const markRead = async (type, itemId) => {
    if (!db || !user?.uid || !isMember || isTeacher) return;
    await setDoc(doc(db, "classReadStates", `${classId}_${user.uid}`), {
      classId, userId: user.uid, [`${type}.${itemId}`]: true, updatedAt: serverTimestamp()
    }, { merge: true });
  };
  const unreadCount = (type) => classNotifications.filter((item) => item.feedType === type && !readState?.[type]?.[item.id]).length;

  useEffect(() => {
    if (!currentStudent) return;
    setStudentProfileForm({
      studentName: currentStudent.studentName || "",
      studentRegNo: currentStudent.studentRegNo || currentStudent.studentId || "",
      studentPhone: currentStudent.studentPhone || currentStudent.phone || "",
      studentEmail: currentStudent.studentEmail || currentStudent.email || user?.email || "",
      section: currentStudent.section || currentStudent.level || currentStudent.formClass || "",
      notes: currentStudent.notes || ""
    });
  }, [currentStudent, user?.email]);

  if (loading) {
    return <STEAClassroomLoader progress={85} />;
  }

  if (!classData) {
    return (
      <div style={{ minHeight: "80vh", display: "grid", placeItems: "center", color: "#fff" }}>
        <div style={{ textAlign: "center", background: "rgba(255,255,255,0.05)", padding: 40, borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)" }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Darasa halijapatikana</h2>
          <button
            onClick={() => {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate("/classroom");
              }
            }}
            style={{ background: G, color: "#000", border: "none", padding: "10px 20px", borderRadius: 12, fontWeight: 900, cursor: "pointer" }}
          >
            Rudi Darasani
          </button>
        </div>
      </div>
    );
  }

  const handleSaveClassProfile = async (event) => {
    event.preventDefault();
    if (!db || !user?.uid || !classData) return;
    if (!studentProfileForm.studentName.trim() || !studentProfileForm.studentRegNo.trim() || !studentProfileForm.studentPhone.trim() || !studentProfileForm.studentEmail.trim()) return;

    setSavingClassProfile(true);
    try {
      const collectionName = classData.isOldCollection ? "attendanceClasses" : "classes";
      await setDoc(doc(db, collectionName, classId, "classStudents", user.uid), {
        classId,
        studentUid: user.uid,
        studentName: studentProfileForm.studentName.trim(),
        studentRegNo: studentProfileForm.studentRegNo.trim(),
        studentId: studentProfileForm.studentRegNo.trim(),
        studentPhone: studentProfileForm.studentPhone.trim(),
        studentEmail: studentProfileForm.studentEmail.trim(),
        section: studentProfileForm.section.trim(),
        notes: studentProfileForm.notes.trim(),
        joinedAt: currentStudent?.joinedAt || serverTimestamp(),
        status: currentStudent?.status === "pending" ? "pending" : "active",
      }, { merge: true });
      await setDoc(doc(db, "users", user.uid), {
        joinedClassIds: arrayUnion(classId),
        updatedAt: serverTimestamp()
      }, { merge: true });
      showToast("Class profile completed successfully.");
    } catch (error) {
      console.error("Class profile save failed", error);
      showToast("Could not save class profile.", "error");
    } finally {
      setSavingClassProfile(false);
    }
  };

  const renderTabButton = (id, label, Icon) => {
    // Hide other tabs for students who are not members
    if (!isMember && id !== "overview") return null;
    if (needsProfileCompletion && !isTeacher && id !== "overview") return null;

    const isActive = activeTab === id;
    
    let hasNew = false;
    if (!isTeacher) {
      if (id === "attendance" && classNotifications.some(n => n.feedType === "session")) hasNew = true;
      if (id === "quizzes" && classNotifications.some(n => n.feedType === "quiz")) hasNew = true;
      if (id === "assignments" && classNotifications.some(n => n.feedType === "assignment")) hasNew = true;
      if (id === "resources" && classNotifications.some(n => n.feedType === "resource")) hasNew = true;
      if (id === "announcements" && classNotifications.some(n => n.feedType === "announcement")) hasNew = true;
    }

    return (
      <button 
        key={id}
        onClick={() => handleTabChange(id)}
        style={{ 
          background: "transparent",
          color: isActive ? G : "rgba(255,255,255,0.65)",
          border: "none",
          borderBottom: isActive ? `3px solid ${G}` : "3px solid transparent",
          padding: isMobile ? "10px 8px" : "14px 10px",
          borderRadius: 0,
          fontWeight: 800,
          fontSize: isMobile ? 12 : 14,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          cursor: "pointer",
          transition: "all 0.15s ease",
          minHeight: isMobile ? 44 : 52,
          flex: isMobile ? "0 0 auto" : 1,
          minWidth: isMobile ? "auto" : 0,
          whiteSpace: "nowrap",
          flexShrink: isMobile ? 0 : 1
        }}
      >
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <Icon size={isMobile ? 16 : 18} />
          {hasNew && (
             <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, background: "#ef4444", borderRadius: "50%", boxShadow: "0 0 8px #ef4444" }} />
          )}
        </div>
        <span style={{ lineHeight: 1.2 }}>{label}</span>
      </button>
    );
  };

  return (
    <div style={{ color: "#fff", maxWidth: "100%", overflowX: "hidden" }} className="safe-bottom-padding">
      {toast && <div role="status" style={{ position: "fixed", top: 20, right: 20, zIndex: 4000, maxWidth: 360, padding: "12px 16px", borderRadius: 12, background: toast.type === "error" ? "#991b1b" : "#166534", color: "#fff", fontWeight: 700, boxShadow: "0 12px 30px rgba(0,0,0,.3)" }}>{toast.message}</div>}
      <div style={{ maxWidth: 1000, margin: "0 auto", width: "100%" }}>
        
        {/* Header Actions */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 32 }}>
            <button 
              onClick={() => navigate(isTeacher ? "/teacher/classes" : "/classroom/student-dashboard")}
              style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", padding: "8px 16px", borderRadius: 12, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 800 }}
            >
              <ArrowLeft size={18} /> Rudi
            </button>

            {!isTeacher && (
              <div style={{ position: "relative" }}>
                 <button 
                   onClick={() => setShowNotifications(!showNotifications)}
                   style={{ background: "rgba(245, 166, 35, 0.1)", border: "1px solid rgba(245, 166, 35, 0.2)", color: G, padding: "8px", borderRadius: 12, cursor: "pointer", position: "relative" }}
                 >
                   <Bell size={20} />
                   {classNotifications.length > 0 && (
                     <span style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 900, width: 18, height: 18, borderRadius: "50%", display: "grid", placeItems: "center" }}>
                        {classNotifications.length}
                     </span>
                   )}
                 </button>
                 
                 <AnimatePresence>
                   {showNotifications && (
                     <motion.div 
                       initial={{ opacity: 0, y: 10, scale: 0.95 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       exit={{ opacity: 0, y: 10, scale: 0.95 }}
                       style={{ position: "absolute", top: "100%", right: 0, marginTop: 8, width: 320, background: "#0c0e14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 16, zIndex: 100, boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}
                     >
                        <h4 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 900, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                           <Bell size={16} color={G} /> Class Notifications
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 400, overflowY: "auto" }}>
                           {classNotifications.length === 0 ? (
                             <div style={{ textAlign: "center", opacity: 0.5, padding: 20, fontSize: 13 }}>No recent activity.</div>
                           ) : (
                             classNotifications.map((notif, i) => (
                               <div key={i} style={{ padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 12 }}>
                                  <div style={{ fontSize: 11, color: G, fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>
                                     {notif.feedType === "quiz" ? "New Quiz" : notif.feedType === "assignment" ? "New Assignment" : notif.feedType === "announcement" ? "Announcement" : "Live Attendance"}
                                  </div>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                                     {notif.title || notif.className || "Class Update"}
                                  </div>
                                  {notif.description && (
                                     <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                        {notif.description}
                                     </div>
                                  )}
                               </div>
                             ))
                           )}
                        </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>
            )}
           
           {isTeacher && (
             <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button 
                  onClick={toggleStatus}
                  style={{ 
                    background: classData.status === "active" ? "rgba(239,68,68,.1)" : "rgba(16,185,129,.1)", 
                    border: `1px solid ${classData.status === "active" ? "#ef444450" : "#10b98150"}`, 
                    color: classData.status === "active" ? "#ef4444" : "#10b981", 
                    padding: "8px 16px", borderRadius: 12, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 800, fontSize: 13
                  }}
                >
                  <Power size={16} /> {classData.status === "active" ? "Funga Darasa" : "Fungua Darasa"}
                </button>
                <button 
                  onClick={deleteClass}
                  style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "#ef4444", padding: "8px", borderRadius: 12, cursor: "pointer" }}
                >
                  <Trash2 size={16} />
                </button>
             </div>
           )}
        </div>

        {/* Title Section */}
        <div style={{ marginBottom: 32 }}>
           <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 900, marginBottom: 8, color: G }}>{classData.className}</h1>
           <p style={{ color: "rgba(255,255,255,.5)", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
             <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Book size={16} /> {classData.subject}</span>
             <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={16} /> {classData.schoolName}</span>
           </p>
        </div>

        {/* Tab Navigation */}
        <div 
          className="stea-horizontal-tabs"
          style={{ 
            display: "flex", 
            flexWrap: isMobile ? "nowrap" : "wrap",
            overflowX: isMobile ? "auto" : "visible",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            gap: isMobile ? 10 : 8, 
            marginBottom: 32,
            paddingBottom: isMobile ? 8 : 0,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            width: "100%"
          }}
        >
           {renderTabButton("overview", isTeacher ? "Stream" : "Stream", LayoutDashboard)}
           {renderTabButton("assignments", `Assignments${!isTeacher && unreadCount("assignment") ? ` (${unreadCount("assignment")})` : ""}`, ClipboardList)}
           {renderTabButton("quizzes", `Quizzes${!isTeacher && unreadCount("quiz") ? ` (${unreadCount("quiz")})` : ""}`, HelpCircle)}
           {!isTeacher && renderTabButton("resources", `Resources${unreadCount("resource") ? ` (${unreadCount("resource")})` : ""}`, FileDown)}
           {renderTabButton("announcements", `Announcements${!isTeacher && unreadCount("announcement") ? ` (${unreadCount("announcement")})` : ""}`, Bell)}
           {renderTabButton("attendance", "Attendance", Check)}
           {!isTeacher && renderTabButton("grades", "Grades", BarChart)}
           {renderTabButton("students", isTeacher ? "People" : "People", Users)}
           {isTeacher && renderTabButton("reports", "Grades", BarChart)}
        </div>

        {/* Tab Contents */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32, width: "100%" }}>

          {!isMember && activeTab !== "overview" && (
             <div className="glass-card" style={{ padding: 40, textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 24, background: "rgba(239, 68, 68, 0.05)" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: "#EF4444", marginBottom: 16 }}>Hujajiunga na darasa hili bado</h2>
                <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>You have not joined this class yet. Please join using the Class Code from your teacher.</p>
                <button 
                  onClick={() => navigate(`/classroom/join/${classData.classCode || classData.joinCode}`)}
                  style={{ background: G, color: "#000", border: "none", padding: "12px 28px", borderRadius: 12, fontWeight: 900, cursor: "pointer" }}
                >
                  Jiunge na Darasa Sasa / Join Class Now
                </button>
             </div>
          )}

          {isMember && activeTab === "attendance" && (
            <AttendanceSessionManager 
               classId={classId} 
               teacherId={classData.teacherId} 
               isTeacher={isTeacher} 
               className={classData.className} 
            />
          )}
          
          {activeTab === "overview" && (
            <div className="glass-card" style={{ padding: 32, borderRadius: 32, textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
               {isTeacher ? (
                 <>
                   <div style={{ background: "#fff", padding: 20, borderRadius: 24, display: "inline-block", marginBottom: 24 }}>
                      <QRCodeSVG value={joinLink} size={180} level="H" />
                   </div>

                   <div style={{ marginBottom: 32 }}>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,.4)", textTransform: "uppercase", fontWeight: 800, marginBottom: 8 }}>Class Join Code</div>
                     <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: 4, color: G }}>{classData.classCode || classData.joinCode}</div>
                   </div>
                 </>
               ) : !isMember ? (
                 <div style={{ padding: 40, textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 24, background: "rgba(239, 68, 68, 0.05)", marginBottom: 24 }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: "#EF4444", marginBottom: 16 }}>Hujajiunga na darasa hili bado</h2>
                    <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>You have not joined this class yet. Please join using the Class Code from your teacher.</p>
                    <button 
                      onClick={() => navigate(`/classroom/join/${classData.classCode || classData.joinCode}`)}
                      style={{ background: G, color: "#000", border: "none", padding: "12px 28px", borderRadius: 12, fontWeight: 900, cursor: "pointer" }}
                    >
                      Jiunge na Darasa Sasa / Join Class Now
                    </button>
                 </div>
               ) : needsProfileCompletion ? (
                 <div style={{ display: "grid", gap: 20, textAlign: "left" }}>
                   <div style={{ padding: 20, borderRadius: 20, background: "rgba(245,166,35,.06)", border: "1px solid rgba(245,166,35,.18)" }}>
                     <div style={{ fontSize: 12, fontWeight: 900, color: "#F5A623", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>Complete your class profile</div>
                     <p style={{ margin: 0, color: "rgba(255,255,255,.7)", fontSize: 14 }}>Your membership is active, but your class profile needs a few required fields before the class stream opens.</p>
                   </div>
                   <form onSubmit={handleSaveClassProfile} style={{ display: "grid", gap: 14 }}>
                     <div className="stea-responsive-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                       <label style={{ display: "grid", gap: 8, fontSize: 13, fontWeight: 700 }}>
                         Full name *
                         <input value={studentProfileForm.studentName} onChange={(e) => setStudentProfileForm((prev) => ({ ...prev, studentName: e.target.value }))} required style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.04)", color: "#fff" }} />
                       </label>
                       <label style={{ display: "grid", gap: 8, fontSize: 13, fontWeight: 700 }}>
                         Registration number / ID *
                         <input value={studentProfileForm.studentRegNo} onChange={(e) => setStudentProfileForm((prev) => ({ ...prev, studentRegNo: e.target.value }))} required style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.04)", color: "#fff" }} />
                       </label>
                       <label style={{ display: "grid", gap: 8, fontSize: 13, fontWeight: 700 }}>
                         Phone *
                         <input value={studentProfileForm.studentPhone} onChange={(e) => setStudentProfileForm((prev) => ({ ...prev, studentPhone: e.target.value }))} required style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.04)", color: "#fff" }} />
                       </label>
                       <label style={{ display: "grid", gap: 8, fontSize: 13, fontWeight: 700 }}>
                         Email *
                         <input type="email" value={studentProfileForm.studentEmail} onChange={(e) => setStudentProfileForm((prev) => ({ ...prev, studentEmail: e.target.value }))} required style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.04)", color: "#fff" }} />
                       </label>
                     </div>
                     <div className="stea-responsive-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                       <label style={{ display: "grid", gap: 8, fontSize: 13, fontWeight: 700 }}>
                         Level / Form / Class
                         <input value={studentProfileForm.section} onChange={(e) => setStudentProfileForm((prev) => ({ ...prev, section: e.target.value }))} style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.04)", color: "#fff" }} />
                       </label>
                       <label style={{ display: "grid", gap: 8, fontSize: 13, fontWeight: 700 }}>
                         Notes
                         <textarea value={studentProfileForm.notes} onChange={(e) => setStudentProfileForm((prev) => ({ ...prev, notes: e.target.value }))} rows={3} style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.04)", color: "#fff", resize: "vertical" }} />
                       </label>
                     </div>
                     <button type="submit" disabled={savingClassProfile} style={{ alignSelf: "start", background: G, color: "#000", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 900, cursor: "pointer", opacity: savingClassProfile ? 0.7 : 1 }}>
                       {savingClassProfile ? "Saving..." : "Save profile"}
                     </button>
                   </form>
                 </div>
               ) : (
                 <><StudentProfileCard student={currentStudent} classData={classData} /><div style={{ marginTop: 16 }}><StudentStream items={classNotifications} readState={readState} onOpen={(item) => {
                   markRead(item.feedType, item.id);
                   if (item.feedType === "attendance") handleTabChange("attendance");
                   else if (item.feedType === "assignment") handleTabChange("assignments");
                   else if (item.feedType === "quiz") handleTabChange("quizzes");
                   else if (item.feedType === "resource") handleTabChange("resources");
                   else if (item.feedType === "announcement") handleTabChange("announcements");
                 }} /></div></>
               )}

               {isTeacher && <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 12, display: "flex", alignItems: "center", gap: 12, maxWidth: 500, margin: "0 auto" }}>
                  <div style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {joinLink}
                  </div>
                  <button 
                    onClick={copyLink}
                    style={{ background: copied ? "#10b981" : G, color: "#000", border: "none", padding: "8px 12px", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 800, transition: ".3s" }}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy"}
                  </button>
               </div>}
               
               {isTeacher && (
                 <div className="stea-teacher-grid" style={{ marginTop: 32 }}>
                    <button onClick={() => handleTabChange("attendance")} className="stea-teacher-card">
                       <Check color={G} /> Create Attendance
                    </button>
                    <button onClick={() => { handleTabChange("quizzes"); setShowQuizModal(true); }} className="stea-teacher-card">
                       <HelpCircle color={G} /> Create Quiz
                    </button>
                    <button onClick={() => handleTabChange("assignments")} className="stea-teacher-card">
                       <FileUp color={G} /> Add Resource / Assignment
                    </button>
                    <button onClick={() => handleTabChange("announcements")} className="stea-teacher-card">
                       <Bell color={G} /> Post Announcement
                    </button>
                    <button onClick={() => handleTabChange("students")} className="stea-teacher-card">
                       <Users color={G} /> Manage Students
                    </button>
                 </div>
               )}

               {!isTeacher && currentStudent && (
                 <div style={{ marginTop: 24 }}>
                    <div style={{ 
                      padding: 24, 
                      background: "rgba(245, 166, 35, 0.05)", 
                      border: `1px solid rgba(245, 166, 35, 0.2)`, 
                      borderRadius: 24,
                      display: "flex",
                      flexDirection: "column",
                      gap: 16
                    }}>
                       <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <div style={{ 
                            width: 60, height: 60, 
                            borderRadius: "50%", 
                            background: "rgba(245, 166, 35, 0.2)", 
                            display: "grid", placeItems: "center",
                            fontSize: 24, fontWeight: 900, color: G
                          }}>
                             {currentStudent.studentName?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                             <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#fff" }}>{currentStudent.studentName}</h3>
                             <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 700, marginTop: 4 }}>
                               {currentStudent.studentEmail || "No Email Provided"}
                             </div>
                          </div>
                       </div>
                       
                       <div className="stea-responsive-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginTop: 8 }}>
                          <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px 16px", borderRadius: 16 }}>
                             <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: 800, marginBottom: 4 }}>Student ID</div>
                             <div style={{ fontSize: 16, fontWeight: 800, color: G }}>{currentStudent.studentId || "N/A"}</div>
                          </div>
                          <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px 16px", borderRadius: 16 }}>
                             <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: 800, marginBottom: 4 }}>Department</div>
                             <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{currentStudent.department || "N/A"}</div>
                          </div>
                          <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px 16px", borderRadius: 16 }}>
                             <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: 800, marginBottom: 4 }}>Status</div>
                             <div style={{ 
                               fontSize: 14, fontWeight: 800, 
                               color: currentStudent.status === "active" ? "#10b981" : "#F5A623",
                               display: "inline-block",
                               padding: "4px 10px",
                               background: currentStudent.status === "active" ? "rgba(16,185,129,0.1)" : "rgba(245,166,35,0.1)",
                               borderRadius: 8
                             }}>
                                {currentStudent.status === "active" ? "Active" : "Pending"}
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          )}

          {activeTab === "quizzes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
               {selectedQuiz ? (
                  <div className="glass-card" style={{ padding: 32, borderRadius: 32 }}>
                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                        <h3 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Matokeo ya Quiz</h3>
                        <button onClick={() => setSelectedQuiz(null)} style={{ background: "none", border: "none", color: G, fontWeight: 800, cursor: "pointer" }}>Rudi nyuma</button>
                     </div>
                     <div style={{ marginBottom: 24 }}>
                        <div style={{ fontWeight: 800, fontSize: 18, color: G }}>{selectedQuiz.title}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Live performance and leaderboard</div>
                     </div>
                     <QuizLeaderboard quizId={selectedQuiz.id} />
                  </div>
               ) : (
                  <div className="glass-card" style={{ padding: 32, borderRadius: 32 }}>
                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                       <h3 style={{ fontSize: 20, fontWeight: 900, display: "flex", alignItems: "center", gap: 10 }}>
                         <HelpCircle size={20} color={G} /> Classroom Quizzes ({isTeacher ? quizzes.length : quizzes.filter(q => q.status === "published").length})
                       </h3>
                       {isTeacher && (
                         <button 
                           onClick={() => setShowQuizModal(true)}
                           style={{ background: G, color: "#000", border: "none", padding: "8px 16px", borderRadius: 12, fontWeight: 900, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                         >
                           <Plus size={16} /> New Quiz
                         </button>
                       )}
                     </div>
                     
                     <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {(isTeacher ? quizzes : quizzes.filter(q => q.status === "published")).length > 0 ? (
                          (isTeacher ? quizzes : quizzes.filter(q => q.status === "published")).map((quiz) => (
                            <div 
                              key={quiz.id} 
                              style={{ 
                                padding: 20, borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
                                display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16
                              }}
                            >
                               <div>
                                  <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{quiz.title}</div>
                                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", display: "flex", gap: 12 }}>
                                     <span>{quiz.questions.length} Questions</span>
                                     <span>{new Date(quiz.createdAt?.toDate()).toLocaleDateString()}</span>
                                  </div>
                               </div>
                               <div style={{ display: "flex", gap: 8 }}>
                                  {isTeacher && (
                                    <button 
                                       onClick={() => setSelectedQuiz(quiz)}
                                       style={{ background: "rgba(255,255,255,0.05)", border: "none", padding: "8px 16px", borderRadius: 12, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800 }}
                                    >
                                       <Trophy size={14} color={G} /> Results
                                    </button>
                                  )}
                                  <button 
                                     onClick={() => { markRead("quiz", quiz.id); navigate(`/attendance/quiz/${quiz.id}`); }}
                                     style={{ background: !isTeacher ? G : "rgba(255,255,255,0.05)", border: "none", padding: "8px 16px", borderRadius: 12, color: !isTeacher ? "#000" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800 }}
                                  >
                                     <Eye size={14} /> {isTeacher ? "Preview" : "Play / Take Quiz"}
                                  </button>
                               </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ textAlign: "center", padding: 40, opacity: 0.3 }}>
                             <HelpCircle size={40} style={{ margin: "0 auto 12px" }} />
                             <p style={{ fontSize: 14 }}>Hakuna quiz iliyowekwa bado.</p>
                             {isTeacher && <button onClick={() => setShowQuizModal(true)} style={{ color: G, background: "none", border: "none", fontWeight: 900, marginTop: 12, cursor: "pointer" }}>Bofya Hapa kuunda Quiz</button>}
                          </div>
                        )}
                     </div>
                  </div>
               )}
            </div>
          )}

          {activeTab === "announcements" && (
            <AnnouncementsManager classId={classId} teacherId={classData.teacherId} isTeacher={isTeacher} onRead={(id) => markRead("announcement", id)} />
          )}

          {activeTab === "assignments" && (
            <AssignmentManager classId={classId} classData={classData} classStudents={attendees} teacherId={classData.teacherId} isTeacher={isTeacher} user={user} userRole={userRole} />
          )}

          {activeTab === "resources" && !isTeacher && (
            <StudentResourceList items={classResources.filter((item) => item.visibility !== "draft" && item.status !== "draft" && item.deleted !== true && item.status !== "deleted")} onOpen={(item) => {
              markRead("resource", item.id);
              const target = item.linkUrl || item.fileUrl || item.attachmentUrl || item.downloadUrl;
              if (target) window.open(target, "_blank", "noopener,noreferrer");
            }} />
          )}

          {activeTab === "grades" && !isTeacher && (
            <AssignmentManager classId={classId} classData={classData} classStudents={attendees} teacherId={classData.teacherId} isTeacher={false} user={user} userRole="student" />
          )}

          {activeTab === "reports" && isTeacher && (
            <ClassReports classId={classId} classData={classData} classStudents={attendees} />
          )}

          {activeTab === "students" && isTeacher && (
             <div className="glass-card" style={{ padding: 32, borderRadius: 32, background: "rgba(255,255,255,0.02)" }}>
                <div className="mobile-stack" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 900, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
                      <Users size={20} color={G} /> Wanafunzi ({attendees.length})
                    </h3>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", width: "100%" }}>
                       <button 
                          onClick={() => {
                             setEditingStudent(null);
                             setStudentForm({ studentName: "", phone: "", email: "", studentId: "" });
                             setShowStudentModal(true);
                          }}
                          className="stea-action-button"
                          style={{ background: G, color: "#000", flex: 1 }}
                       >
                         [+] Weka Mwanafunzi
                       </button>
                       {attendees.length > 0 && (
                         <button 
                           onClick={exportCSV}
                           className="stea-action-button"
                           style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: G, flex: 1 }}
                         >
                           <FileDown size={14} /> Export CSV
                         </button>
                       )}
                    </div>
                </div>

                {attendees.length > 0 && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
                     <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>Panga kwa:</span>
                     <select 
                       onChange={(e) => {
                          const order = e.target.value;
                          setAttendees(prev => {
                             const arr = [...prev];
                             if (order === "name") {
                                return arr.sort((a,b) => (a.studentName || "").localeCompare(b.studentName || ""));
                             } else if (order === "id") {
                                return arr.sort((a,b) => (a.studentId || "").localeCompare(b.studentId || ""));
                             } else {
                                return arr.sort((a,b) => {
                                   const tA = a.joinedAt?.toMillis?.() || 0;
                                   const tB = b.joinedAt?.toMillis?.() || 0;
                                   return tB - tA; // desc
                                });
                             }
                          });
                       }}
                       style={{ background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", padding: "6px 12px", borderRadius: 8, outline: "none", fontSize: 13 }}
                     >
                        <option value="date" style={{ background: "#111" }}>Tarehe (Mpya)</option>
                        <option value="name" style={{ background: "#111" }}>Jina (A-Z)</option>
                        <option value="id" style={{ background: "#111" }}>Student ID</option>
                     </select>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 600, overflowY: "auto", paddingRight: 8 }} className="custom-scroll">
                    {attendees.length > 0 ? (
                      attendees.map((a, i) => (
                        <div key={a.id} className="mobile-stack" style={{ alignItems: "center", gap: 16, padding: 16, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.05)", borderRadius: 16 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.05)", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 900, color: G }}>
                            {i + 1}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: 15 }}>{a.studentName || "Student"}</div>
                            <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 2, marginTop: 4 }}>
                               <span style={{ color: "rgba(255,255,255,.5)" }}><strong style={{ color: "rgba(255,255,255,.8)" }}>Reg No:</strong> {a.studentRegNo || a.studentId || "N/A"}</span>
                               <span style={{ color: "rgba(255,255,255,.5)" }}><strong style={{ color: "rgba(255,255,255,.8)" }}>Phone:</strong> {a.studentPhone || a.phone || "N/A"}</span>
                               <span style={{ color: "rgba(255,255,255,.5)" }}><strong style={{ color: "rgba(255,255,255,.8)" }}>Email:</strong> {a.studentEmail || a.email || "N/A"}</span>
                               <span style={{ color: "rgba(255,255,255,.5)" }}><strong style={{ color: "rgba(255,255,255,.8)" }}>Joined:</strong> {a.joinedAt ? new Date(a.joinedAt.toDate ? a.joinedAt.toDate() : a.joinedAt).toLocaleDateString() : "N/A"}</span>
                            </div>
                          </div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", fontWeight: 700, marginRight: 12 }}>
                             {a.status === "pending" ? (
                               <span style={{ color: "#F5A623" }}>Inasubiri...</span>
                             ) : (
                               <span style={{ color: "#10B981" }}>Active</span>
                             )}
                          </div>
                          {isTeacher && (
                             <div style={{ display: "flex", gap: 8 }}>
                               {a.status === "pending" && (
                                  <button 
                                    onClick={async () => {
                                       try {
                                         const db = getFirebaseDb();
                                         const collectionName = classData.isOldCollection ? "attendanceClasses" : "classes";
                                         await updateDoc(doc(db, collectionName, classId, "classStudents", a.id), { status: "active" });
                                         await updateDoc(doc(db, collectionName, classId), {
                                           studentCount: increment(1),
                                           students: arrayUnion(a.studentId)
                                         });
                                         showToast("Student approved.");
                                       } catch (e) {
                                         console.error("Error approving student", e);
                                       }
                                    }}
                                    style={{ background: "#10B981", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                                  >
                                    Kubali
                                  </button>
                               )}
                               <button 
                                 onClick={() => {
                                    setEditingStudent(a);
                                    setStudentForm({ studentName: a.studentName || "", phone: a.phone || "", email: a.studentEmail || "", studentId: a.studentId || "" });
                                    setShowStudentModal(true);
                                 }}
                                 style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                               >
                                 Edit
                               </button>
                               <button 
                                 onClick={() => { setRemovingStudent(a); setRemovalReason(""); }}
                                 style={{ background: "rgba(239,68,68,0.2)", color: "#EF4444", border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                               >
                                 Ondoa
                               </button>
                             </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: "center", padding: 40, opacity: 0.3 }}>
                        <Users size={48} style={{ margin: "0 auto 16px" }} />
                        <p>Hakuna mwanafunzi aliyerekodiwa bado.</p>
                      </div>
                    )}
                </div>
             </div>
          )}

          {activeTab === "students" && !isTeacher && isMember && (
            <div className="glass-card" style={{ padding: 24, borderRadius: 24 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 18 }}>People</h3>
              <div style={{ display: "grid", gap: 10 }}>
                {attendees.map((student) => <div key={student.id} style={{ padding: 12, borderRadius: 12, background: "rgba(255,255,255,.04)", display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(245,166,35,.18)", color: G, fontWeight: 900 }}>{student.studentName?.[0]?.toUpperCase() || "S"}</div><span style={{ fontWeight: 700 }}>{student.studentName || "Classmate"}</span></div>)}
              </div>
            </div>
          )}
        </div>
      </div>

      {showQuizModal && (
        <QuizCreatorModal 
          classId={classId} 
          classData={classData}
          teacherId={user?.uid} 
          teacherName={user?.displayName || user?.email}
          onClose={() => setShowQuizModal(false)}
          onCreated={(q) => {
            setShowQuizModal(false);
          }}
        />
      )}

      {showStudentModal && (
         <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "grid", placeItems: "center", zIndex: 1000 }} className="px-md-20">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: "#111", padding: 32, border: "1px solid rgba(255,255,255,0.1)" }} className="modal-full-mobile">
               <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24 }}>{editingStudent ? "Badilisha Taarifa" : "Ongeza Mwanafunzi"}</h2>
               <form onSubmit={handleManualStudent}>
                 <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                   <div>
                     <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Jina Kamili</label>
                     <input type="text" value={studentForm.studentName} onChange={e => setStudentForm({...studentForm, studentName: e.target.value})} placeholder="Mfano: Ali Hasan" required style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "12px", borderRadius: 12, color: "#fff", outline: "none" }} />
                   </div>
                   <div>
                     <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Namba ya Mwanafunzi (Student ID)</label>
                     <input type="text" value={studentForm.studentId} onChange={e => setStudentForm({...studentForm, studentId: e.target.value})} placeholder="Mfano: ST-1001" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "12px", borderRadius: 12, color: "#fff", outline: "none" }} />
                   </div>
                   <div>
                     <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Namba ya Simu (Hiari)</label>
                     <input type="text" value={studentForm.phone} onChange={e => setStudentForm({...studentForm, phone: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "12px", borderRadius: 12, color: "#fff", outline: "none" }} />
                   </div>
                   <div>
                     <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Barua Pepe (Hiari)</label>
                     <input type="email" value={studentForm.email} onChange={e => setStudentForm({...studentForm, email: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "12px", borderRadius: 12, color: "#fff", outline: "none" }} />
                   </div>
                 </div>
                 <div style={{ display: "flex", gap: 12 }}>
                   <button type="button" onClick={() => setShowStudentModal(false)} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "none", padding: 14, borderRadius: 12, color: "#fff", fontWeight: 700, cursor: "pointer" }}>Ghairi</button>
                   <button type="submit" style={{ flex: 1, background: "#10B981", color: "#fff", border: "none", padding: 14, borderRadius: 12, fontWeight: 900, cursor: "pointer" }}>Hifadhi</button>
                 </div>
               </form>
            </motion.div>
         </div>
      )}

      {showDeleteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ width: "100%", maxWidth: 400, background: "#111", border: "1px solid rgba(255,255,255,0.1)", padding: 24, borderRadius: 24 }}
          >
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8, color: "#EF4444" }}>Delete Class?</h2>
            <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 16 }}>Are you sure you want to delete <strong style={{ color: "#fff" }}>{classData.className}</strong>?</p>
            <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#EF4444", padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 16, fontWeight: 600 }}>
               The class is immediately removed from all classroom UIs. Its records are retained for a safe, audited server-side purge.
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)", marginBottom: 8 }}>Type <strong>DELETE</strong> to confirm</div>
            <input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} placeholder="DELETE" style={{ width: "100%", marginBottom: 20, padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.05)", color: "#fff" }} />
            <div style={{ display: "flex", gap: 12 }}>
              <button type="button" onClick={() => { setShowDeleteModal(false); setDeleteConfirmation(""); }} disabled={isDeleting} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "none", padding: 14, borderRadius: 12, color: "#fff", fontWeight: 700, cursor: isDeleting ? "not-allowed" : "pointer", opacity: isDeleting ? 0.5 : 1 }}>Cancel</button>
              <button onClick={confirmDeleteClass} disabled={isDeleting || deleteConfirmation !== "DELETE"} style={{ flex: 1, background: "#EF4444", color: "#fff", border: "none", padding: 14, borderRadius: 12, fontWeight: 900, cursor: isDeleting ? "not-allowed" : "pointer", opacity: isDeleting || deleteConfirmation !== "DELETE" ? 0.5 : 1 }}>
                {isDeleting ? "Deleting..." : "Yes, Delete Class"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {removingStudent && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, display: "grid", placeItems: "center", padding: 20, background: "rgba(0,0,0,.75)" }}>
          <div style={{ width: "100%", maxWidth: 420, padding: 24, borderRadius: 20, background: "#111", border: "1px solid rgba(255,255,255,.15)" }}>
            <h3 style={{ marginTop: 0 }}>Remove {removingStudent.studentName}?</h3>
            <p style={{ color: "rgba(255,255,255,.65)", fontSize: 13 }}>The student loses class access immediately and receives a notification.</p>
            <input value={removalReason} onChange={(event) => setRemovalReason(event.target.value)} placeholder="Reason (optional)" style={{ width: "100%", padding: 12, margin: "10px 0 16px", borderRadius: 10, background: "rgba(255,255,255,.05)", color: "#fff", border: "1px solid rgba(255,255,255,.15)" }} />
            <div style={{ display: "flex", gap: 10 }}><button onClick={() => setRemovingStudent(null)} style={{ flex: 1, padding: 12, border: 0, borderRadius: 10, cursor: "pointer" }}>Cancel</button><button onClick={async () => { try { const collectionName = classData.isOldCollection ? "attendanceClasses" : "classes"; const studentUid = removingStudent.studentUid || removingStudent.userId || removingStudent.studentUserId || removingStudent.id; await updateDoc(doc(db, collectionName, classId, "classStudents", removingStudent.id), { status: "removed", removedAt: serverTimestamp(), removedBy: user?.uid || "", removalReason }); await updateDoc(doc(db, "users", studentUid), { joinedClassIds: arrayRemove(classId), updatedAt: serverTimestamp() }); await addDoc(collection(db, "notifications"), { userId: studentUid, classId, type: "removed_from_class", title: "Removed from class", message: "You have been removed from this class.", isRead: false, createdAt: serverTimestamp(), createdBy: user?.uid || "" }); setRemovingStudent(null); } catch (error) { console.error("Student removal failed", error); } }} style={{ flex: 1, padding: 12, border: 0, borderRadius: 10, background: "#dc2626", color: "#fff", fontWeight: 800, cursor: "pointer" }}>Remove student</button></div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .num-hide-track::-webkit-scrollbar { display: none; }
        @media(min-width: 640px) {
           .sm-show { display: inline !important; }
           .sm-hide { display: none !important; }
           .md-pad { padding: 40px 20px !important; }
        }
      `}</style>
    </div>
  );
}
