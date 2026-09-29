import React, { useState, useEffect, useMemo } from "react";
import { useMobile } from "../../hooks/useMobile.js";
import { 
  Plus, Play, Users, BookOpen, School, Copy, QrCode as QrCodeAlt, 
  MoreVertical, LayoutDashboard, FileText, ChevronRight, ChevronDown, History, 
  Settings, Scan, Loader2, Check, HelpCircle, Bell, Search, 
  Trash2, Edit3, Eye, CheckCircle2, X, BarChart3, Menu, LogOut, 
  Calendar, FileDown, ShieldCheck, Mail, Info, TrendingUp, AlertCircle, ArrowLeft, Square, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { getFirebaseDb, getFirebaseAuth } from "../../firebase";
import { 
  collection, query, where, onSnapshot, addDoc, serverTimestamp, 
  doc, updateDoc, deleteDoc, orderBy, limit, getDoc, getDocs 
} from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import STEAAvatar from "../STEAAvatar.jsx";
import STEAClassroomLoader from "../common/STEAClassroomLoader";

// Import modular pages
import { TeacherAssignmentsSection } from "./TeacherAssignmentsSection.jsx";
import { TeacherResourcesSection } from "./TeacherResourcesSection.jsx";
import { TeacherQuizzesSection } from "./TeacherQuizzesSection.jsx";
import { TeacherStudentsSection } from "./TeacherStudentsSection.jsx";
import { TeacherAnalyticsSection } from "./TeacherAnalyticsSection.jsx";

// Import Attendance & Modal components
import { AttendanceModals, LiveTimer } from "./AttendanceModals.jsx";
import { LiveAttendancePanel } from "./LiveAttendancePanel.jsx";
import { 
  CreateClassModal, ClassCreationSuccessModal, QRModal, StartSessionModal, TargetSelectionModal,
  ActionClassSelectorModal, QuickAnnouncementModal, InputField, DeleteClassModal 
} from "./TeacherModals.jsx";
import { 
  DashboardOverview, MyClassesView, AttendanceSessionsView, NotificationsView, SettingsView 
} from "./DashboardSections.jsx";

// Import other modals if needed
import { UploadResourceForm } from "../STEAHub/UploadResourceForm.jsx";
import QuizCreatorModal from "./QuizCreatorModal.jsx";
import AssignmentModal from "./AssignmentModal.jsx";

import AttendanceClassView from '../../pages/Attendance/AttendanceClassView.jsx';
import { buildClassJoinLink, createClassWithUniqueCode, ensureClassCode, runOptionalClassSetup } from '../../services/classCodeService';

export function TeacherDashboard({ onBack, user }) {
  const navigate = useNavigate();
  const db = getFirebaseDb();
  const isMobile = useMobile();

  // Navigation Shell State
  const [view, setView] = useState("dashboard"); // dashboard, overview, notes, resources, quizzes, students, attendance, analytics, notifications, settings
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(["Core"]);

  const toggleGroup = (title) => {
    setExpandedGroups(prev => prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]);
  };

  useEffect(() => {
    if (isMobile && isSidebarExpanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isSidebarExpanded, isMobile]);

  // Firestore Data States
  const [classes, setClasses] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [allQuizzes, setAllQuizzes] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allClassResources, setAllClassResources] = useState([]);
  const [allWebResources, setAllWebResources] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Load Statuses
  const [loading, setLoading] = useState(true);
  const [loaderFinished, setLoaderFinished] = useState(false);
  const [additionalLoading, setAdditionalLoading] = useState(true);

  useEffect(() => {
    if (!import.meta.env.DEV || !loading) return;
    const fallback = window.setTimeout(() => setLoading(false), 5000);
    return () => window.clearTimeout(fallback);
  }, [loading]);

  // Notifications Toast State
  const [notification, setNotification] = useState(null);

  // Modal Triggers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedQuizClass, setSelectedQuizClass] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedAttClass, setSelectedAttClass] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedAssignmentClass, setSelectedAssignmentClass] = useState(null);
  const [assignmentInitialType, setAssignmentInitialType] = useState('assignment');
  const [showQuickAnnouncement, setShowQuickAnnouncement] = useState(false);
  const [selectedAnnouncementClass, setSelectedAnnouncementClass] = useState(null);
  const [qrItem, setQrItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [liveSession, setLiveSession] = useState(null);
  const [activeQuickClassId, setActiveQuickClassId] = useState("");
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [classCreationResult, setClassCreationResult] = useState(null);
  const [sessionConflict, setSessionConflict] = useState(null);
  const [extendingSession, setExtendingSession] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  // Class Selector & Target Selector States
  const [classSelectorAction, setClassSelectorAction] = useState(null);
  const [targetSelectionAction, setTargetSelectionAction] = useState(null);

  const setShowResourceModal = ({ type, target }) => {
    if (target === 'website') {
      if (type === 'note') setView("notes");
      if (type === 'resource') setShowUploadModal(true);
    }
  };

  const [isEndingSession, setIsEndingSession] = useState(false);

  // Memoize active sessions - Unique per class
  const activeSessions = useMemo(() => {
    const sorted = [...allSessions].sort((a,b) => {
      const timeA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt?.toMillis?.() || 0);
      const timeB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt?.toMillis?.() || 0);
      return timeB - timeA;
    });
    
    const unique = [];
    const seen = new Set();
    
    sorted.forEach(s => {
      const isActive = (s.status === "active" || s.isActive === true) && (!s.endTime || s.endTime > now);

      const key = s.classId || s.className || s.id; 
      if (isActive && !seen.has(key)) {
        unique.push(s);
        seen.add(key);
      }
    });
    return unique;
  }, [allSessions, now]);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // 1. Fetch Teacher-Owned Classes
  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    const qClasses = query(
      collection(db, "classes"), 
      where("teacherId", "==", user.uid)
    );
    
    const unsubClasses = onSnapshot(qClasses, (snap) => {
      let list = snap.docs.map(d => {
        let data = d.data();
        const currentCode = String(data.classCode || data.joinCode || '').trim().toUpperCase();
        if (!/^[A-Z0-9]{6,}$/.test(currentCode) || data.classCode !== currentCode || data.joinUrl !== buildClassJoinLink(currentCode)) {
          ensureClassCode(db, d.id, data).catch(() => null);
        }
        data.classCode = currentCode;
        data.joinCode = currentCode;
        return { id: d.id, ...data };
      }).filter(c => c.status !== 'deleted' && c.deleted !== true);
      
      setClasses(list);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubClasses();
  }, [user, db]);

  // 2. Fetch Assignments & Materials from ALL classes
  useEffect(() => {
    if (!user || !db) return;
    const q = query(
      collection(db, "assignments"),
      where("teacherId", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      setAllAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Could not load class assignments:", err);
    });
    return () => unsub();
  }, [user, db]);

  // 3. Fetch Quizzes across ALL classes
  useEffect(() => {
    if (!user || !db) return;
    const q = query(
      collection(db, "quizzes"),
      where("teacherId", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      setAllQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Could not load quizzes:", err);
    });
    return () => unsub();
  }, [user, db]);

  // 4. Fetch Attendance Sessions
  useEffect(() => {
    if (!user || !db) return;
    const q = query(
      collection(db, "attendanceSessions"),
      where("teacherId", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      setAllSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Could not fetch sessions:", err);
    });
    return () => unsub();
  }, [user, db]);

  // 5. Fetch Teacher uploads in general study_resources
  useEffect(() => {
    if (!user || !db) return;
    const q = query(
      collection(db, "study_resources"),
      where("ownerId", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      setAllWebResources(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Web resources error:", err);
    });
    return () => unsub();
  }, [user, db]);

  // 6. Fetch canonical classroom resources
  useEffect(() => {
    if (!user || !db) return;
    const q = query(
      collection(db, "classResources"),
      where("teacherId", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      setAllClassResources(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.deleted !== true && r.status !== 'deleted'));
    }, (err) => {
      console.warn("Class resources error:", err);
    });
    return () => unsub();
  }, [user, db]);

  // 7. Fetch general quiz results
  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db, "quizResults"));
    const unsub = onSnapshot(q, (snap) => {
      setQuizResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Quiz results fetch error:", err);
    });
    return () => unsub();
  }, [user, db]);

  // 8. Get Announcements
  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db, "announcements"), where("teacherId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Announcements load error:", err);
    });
    return () => unsub();
  }, [user, db]);

  // 9. Fetch and flat student rosters from owned classes
  useEffect(() => {
    if (!classes || classes.length === 0 || !db) {
      setAllStudents([]);
      return;
    }

    const unsubs = [];
    const aggregatedResults = {};

    classes.forEach(cls => {
      if (!cls || !cls.id) return;
      const q = collection(db, "classes", cls.id, "classStudents");
      const unsub = onSnapshot(q, (snap) => {
        const studentsInClass = snap.docs.map(d => ({
          id: d.id,
          classId: cls.id,
          className: cls.className || cls.name,
          ...d.data()
        }));
        aggregatedResults[cls.id] = studentsInClass;
        
        // Calculate only if we have results for all classes to avoid flicker
        const allFlat = Object.values(aggregatedResults).flat();
        setAllStudents(allFlat);
      }, (e) => {
        console.warn("Student fetch ignored:", e);
      });
      unsubs.push(unsub);
    });

    return () => unsubs.forEach(u => u());
  }, [classes, db]);

  // Stats Counters
  const counters = useMemo(() => {
    if (!classes || !allStudents || !allAssignments || !allQuizzes || !allWebResources || !allSessions || !allClassResources) {
      return { classesCount: 0, studentsCount: 0, notesCount: 0, quizzesCount: 0, resourcesCount: 0, sessionsCount: 0 };
    }
    const classNotes = [
      ...(allAssignments || []).filter(a => a && (a.type === "note" || (a.type === "resource" && a.title?.toLowerCase().includes("note")))),
      ...(allClassResources || []).filter(r => r && (r.resourceCategory === "notes" || r.category === "notes"))
    ];
    const webNotes = (allWebResources || []).filter(r => r && r.type === "note");
    
    const classRes = (allClassResources || []).filter(r => r && r.visibility !== "draft" && r.status !== "draft");
    const webRes = (allWebResources || []).filter(r => r && r.type !== "note");

    const studentIds = (allStudents || []).map(s => {
      const sid = s?.studentId || s?.id;
      return sid ? String(sid).trim().toUpperCase() : null;
    }).filter(Boolean);
    const mapStudents = new Set(studentIds);

    return {
      classesCount: (classes || []).length,
      studentsCount: mapStudents.size,
      notesCount: classNotes.length + webNotes.length,
      quizzesCount: (allQuizzes || []).length,
      resourcesCount: classRes.length + webRes.length,
      sessionsCount: (allSessions || []).length
    };
  }, [classes, allStudents, allAssignments, allQuizzes, allWebResources, allSessions, allClassResources]);

  // Handler methods
  const handleCreateClass = async (formData) => {
    if (isCreatingClass) return;
    setIsCreatingClass(true);
    console.info("CREATE_CLASS_STEP_1", { flow: "teacher_dashboard", teacherId: user.uid });
    try {
      const { classRef, code, joinUrl, recovered } = await createClassWithUniqueCode(db, {
        name: formData.name,
        subject: formData.subject,
        section: formData.section || "",
        room: formData.room || "",
        schoolName: formData.schoolName,
        academicLevel: formData.academicLevel,
        description: formData.description || "",
        requireApproval: formData.requireApproval || false,
        className: formData.name,
        teacherId: user.uid,
        teacherEmail: user.email || "",
        teacherName: user.displayName || "STEA Teacher",
        createdBy: user.uid,
        status: "active",
        deleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        studentCount: 0
      });
      
      console.info("CREATE_CLASS_DOC_CREATED", { flow: "teacher_dashboard", classId: classRef.id });
      return { classRef, code, joinUrl, recovered, className: formData.name };
    } catch (e) {
      console.error("CREATE_CLASS_CATCH_ERROR", { flow: "teacher_dashboard", error: e });
      notify(e?.message || "The class could not be created. Check your connection and try again.", "error");
      throw e;
    } finally {
      setIsCreatingClass(false);
      console.info("CREATE_CLASS_FINAL_STATE", { flow: "teacher_dashboard", creating: false });
    }
  };

  const confirmDeleteClass = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      await updateDoc(doc(db, "classes", deleteItem.id), {
        status: "deleted",
        deleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: user.uid,
      });
      await addDoc(collection(db, "audit_logs"), {
        action: "soft_delete_class",
        entity: "classes",
        entityId: deleteItem.id,
        classId: deleteItem.id,
        performedByUid: user.uid,
        performedByEmail: user.email || "",
        timestamp: serverTimestamp(),
        source: "teacher_dashboard",
      });
      notify("Darasa limefichwa kutoka kwenye dashboards.");
      setClasses(prev => prev.filter(c => c.id !== deleteItem.id));
    } catch (e) {
      notify("Imeshindikana kufuta darasa", "error");
    } finally {
      setIsDeleting(false);
      setDeleteItem(null);
    }
  };

  const handleStartAttendance = (classData) => {
    // Check if this class already has an active session
    const existing = allSessions.find(s => s.classId === classData.id && s.status === "active" && (!s.endTime || s.endTime > Date.now()));
    
    if (existing) {
      setSessionConflict({ classData, session: existing });
    } else {
      setSelectedAttClass(classData);
      setShowAttendanceModal(true);
    }
  };

  const handleEndRegister = async (sessionId) => {
    setIsEndingSession(true);
    try {
      let sessionRef = doc(db, "attendanceSessions", sessionId);
      let sessionSnap = await getDoc(sessionRef);
      
      // If doc not found, try to query by sessionCode (in case sessionId is LY4758)
      if (!sessionSnap.exists() && sessionId && sessionId.length <= 8) {
        const q = query(collection(db, "attendanceSessions"), where("sessionCode", "==", sessionId));
        const res = await getDocs(q);
        if (!res.empty) {
          sessionRef = res.docs[0].ref;
          sessionSnap = res.docs[0];
        }
      }

      if (!sessionSnap.exists()) {
        console.error("End register failed: Session document not found");
        notify("Session haikupatikana.", "error");
        return;
      }
      
      const currentData = sessionSnap.data();
      
      console.log("ending register id:", sessionSnap.id);
      console.log("register code:", currentData.sessionCode);

      if (currentData.status === "closed" || currentData.status === "ended") {
        notify("Register tayari ishafungwa.");
        return;
      }
      
      const updatePayload = {
        status: "ended",
        isActive: false,
        endedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(sessionRef, updatePayload);
      
      console.log("updated successfully");
      notify("Register imefungwa kikamilifu.");
      
      if (sessionConflict?.session?.id === sessionId || sessionConflict?.session?.sessionCode === sessionId) {
        setSessionConflict(null);
      }
    } catch (err) {
      console.error("End register failed:", err);
      notify("Imeshindikana kufunga register: " + err.message, "error");
    } finally {
      setIsEndingSession(false);
    }
  };

  const handleExtendTime = async (sessionId, minutes) => {
    try {
      const session = allSessions.find(s => s.id === sessionId);
      if (!session) return;
      
      const additionalMs = minutes * 60000;
      // Support legacy endTime and expiryTime, but upgrade to endsAt
      const currentEndTime = session.endsAt || session.endTime || session.expiresAt || Date.now();
      const newEndTime = Math.max(Date.now(), currentEndTime) + additionalMs;
      
      await updateDoc(doc(db, "attendanceSessions", sessionId), {
        endsAt: newEndTime,
        endTime: newEndTime, // legacy fallback
        updatedAt: serverTimestamp()
      });
      notify(`Muda umeongezwa kwa dakika ${minutes}.`);
      setExtendingSession(null);
      if (sessionConflict) setSessionConflict(null);
    } catch (err) {
      notify("Kosa limejitokeza katika kuongeza muda.", "error");
    }
  };

  const handleCreateAttendanceSession = async (sessionConfig) => {
    try {
      // 1. Check if an active session already exists for this class
      const existing = activeSessions.find(s => s.classId === sessionConfig.classId);
      if (existing) {
        setSessionConflict({ classData: sessionConfig, session: existing });
        setShowAttendanceModal(false);
        return;
      }

      const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const sessionPayload = {
        ...sessionConfig,
        sessionCode,
        code: sessionCode,
        status: "active",
        isActive: true,
        teacherId: user.uid,
        teacherName: user.displayName || "Mwalimu",
        teacherEmail: user.email || "",
        courseName: sessionConfig.className,
        className: sessionConfig.className,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        startsAt: Date.now(),
        startTime: Date.now(), // legacy
        studentCount: 0,
        durationMinutes: sessionConfig.duration || 60,
        endsAt: Date.now() + ((sessionConfig.duration || 60) * 60 * 1000),
        endTime: Date.now() + ((sessionConfig.duration || 60) * 60 * 1000), // legacy
        expiresAt: Date.now() + ((sessionConfig.duration || 60) * 60 * 1000) // legacy
      };
      
      const docRef = await addDoc(collection(db, "attendanceSessions"), sessionPayload);
      notify("Kipindi kimezinduliwa!");
      setLiveSession({ id: docRef.id, ...sessionPayload });
      setShowAttendanceModal(false);
    } catch(err) {
      console.error("Create Session Error:", err);
      notify("Kosa limejitokeza katika kuanzisha kipindi.", "error");
    }
  };

  const location = useLocation();

  // Deduce active menu
  const path = location.pathname;
  let activeMenu = "dashboard";
  if (path.includes("/teacher/classes")) activeMenu = "classes";
  if (path.includes("/teacher/attendance")) activeMenu = "attendance";
  if (path.includes("/teacher/assignments")) activeMenu = "assignments";
  if (path.includes("/teacher/resources")) activeMenu = "resources";
  if (path.includes("/teacher/quizzes")) activeMenu = "quizzes";
  if (path.includes("/teacher/students")) activeMenu = "students";
  if (path.includes("/teacher/reports")) activeMenu = "reports";
  if (path.includes("/teacher/announcements")) activeMenu = "announcements";
  if (path.includes("/teacher/messages")) activeMenu = "messages";
  if (path.includes("/teacher/settings")) activeMenu = "settings";

  // Nav Items definition
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/teacher/dashboard" },
    { id: "classes", label: "My Classes", icon: School, path: "/teacher/classes" },
    { id: "attendance", label: "Attendance Logs", icon: CheckCircle2, path: "/teacher/attendance" },
    { id: "assignments", label: "Assignments", icon: BookOpen, path: "/teacher/assignments" },
    { id: "quizzes", label: "Quizzes / Exams", icon: HelpCircle, path: "/teacher/quizzes" },
    { id: "announcements", label: "Announcements", icon: Bell, path: "/teacher/announcements" },
    { id: "students", label: "Students", icon: Users, path: "/teacher/students" },
    { id: "reports", label: "Reports & Analytics", icon: BarChart3, path: "/teacher/reports" },
    { id: "messages", label: "Messages", icon: Mail, path: "/teacher/messages" },
    { id: "resources", label: "Resources / Notes", icon: FileDown, path: "/teacher/resources" },
    { id: "settings", label: "Settings", icon: Settings, path: "/teacher/settings" }
  ];

  const TEACHER_MENU_GROUPS = [
    { title: "Core", ids: ["dashboard", "classes"] },
    { title: "Academics", ids: ["assignments", "quizzes", "resources"] },
    { title: "People & Records", ids: ["attendance", "students"] },
    { title: "Communication", ids: ["announcements", "messages"] },
    { title: "Management", ids: ["reports", "settings"] }
  ];

  const groupedNavItems = TEACHER_MENU_GROUPS.map((group) => ({
    ...group,
    items: navItems.filter((item) => group.ids.includes(item.id)),
  })).filter((group) => group.items.length > 0);

  const renderPageView = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24, flex: 1, minHeight: 0 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/teacher/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardOverview 
            activeSessions={activeSessions} 
            setLiveSession={setLiveSession} 
            setExtendingSession={setExtendingSession} 
            handleEndSession={handleEndRegister} 
            counters={counters} 
            setShowCreateModal={setShowCreateModal} 
            setTargetSelectionAction={setTargetSelectionAction} 
            setShowResourceModal={setShowResourceModal} 
            classes={classes} 
            setClassSelectorAction={setClassSelectorAction} 
            setView={(v) => navigate(`/teacher/${v === 'dashboard' ? 'dashboard' : v}`)} 
            allQuizzes={allQuizzes} 
            notify={notify} 
            isEnding={isEndingSession}
            isMobile={isMobile}
          />} />
          <Route path="classes" element={<MyClassesView 
            classes={classes} 
            setShowCreateModal={setShowCreateModal} 
            navigate={navigate} 
            handleStartAttendance={handleStartAttendance} 
            setQrItem={setQrItem} 
            setDeleteItem={setDeleteItem} 
            notify={notify}
            isMobile={isMobile}
          />} />
          <Route path="classes/:classId/*" element={<AttendanceClassView isMobile={isMobile} />} />
          <Route path="assignments" element={<TeacherAssignmentsSection isMobile={isMobile} allAssignments={allAssignments} classes={classes} notify={notify} user={user} setClassSelectorAction={setClassSelectorAction} />} />
          <Route path="resources" element={<TeacherResourcesSection isMobile={isMobile} assignments={allAssignments} classResources={allClassResources} webResources={allWebResources} classes={classes} notify={notify} user={user} />} />
          <Route path="quizzes" element={<TeacherQuizzesSection isMobile={isMobile} quizzes={allQuizzes} quizResults={quizResults} classes={classes} notify={notify} user={user} />} />
          <Route path="students" element={<TeacherStudentsSection isMobile={isMobile} classes={classes} allStudents={allStudents} allSessions={allSessions} quizResults={quizResults} />} />
          <Route path="attendance" element={<AttendanceSessionsView 
            allSessions={allSessions} 
            setLiveSession={setLiveSession} 
            deleteDoc={deleteDoc} 
            doc={doc} 
            db={db} 
            notify={notify}
            isMobile={isMobile}
            setClassSelectorAction={setClassSelectorAction}
            handleEndSession={handleEndRegister}
            handleExtendTime={handleExtendTime}
          />} />
          <Route path="reports" element={<TeacherAnalyticsSection isMobile={isMobile} classes={classes} allStudents={allStudents} quizzes={allQuizzes} quizResults={quizResults} assignments={allAssignments} webResources={allWebResources} allSessions={allSessions} />} />
          <Route path="announcements" element={<NotificationsView 
            classes={classes} 
            announcements={announcements} 
            deleteDoc={deleteDoc} 
            doc={doc} 
            db={db} 
            notify={notify} 
            user={user} 
            addDoc={addDoc} 
            collection={collection} 
            serverTimestamp={serverTimestamp}
            isMobile={isMobile}
          />} />
          <Route path="messages" element={<div className="glass-card" style={{ padding: 32, borderRadius: 32, textAlign: "center", minHeight: 400, display: "grid", placeItems: "center" }}><h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>This section is coming soon</h2><p style={{ color: "rgba(255,255,255,0.6)" }}>Message module is under construction.</p></div>} />
          <Route path="settings" element={<SettingsView user={user} />} />
          <Route path="*" element={<Navigate to="/teacher/dashboard" replace />} />
        </Routes>
      </div>
    );
  };

  if (!loaderFinished) {
    return (
      <STEAClassroomLoader 
        progress={loading ? 85 : 100} 
        onComplete={() => setLoaderFinished(true)} 
      />
    );
  }

  return (
    <div 
      style={{ 
        display: "flex", 
        height: isMobile ? "auto" : "100vh", 
        minHeight: "100vh",
        background: "#0a0b12", 
        color: "#fff",
        overflow: isMobile ? "visible" : "hidden"
      }}
    >
      
      {/* PERSISTENT SIDEBAR */}
      {!isMobile && (
        <aside
          style={{
            width: isSidebarExpanded ? 280 : 0,
            opacity: isSidebarExpanded ? 1 : 0,
            visibility: isSidebarExpanded ? "visible" : "hidden",
            padding: isSidebarExpanded ? "24px 0" : 0,
            background: "#06070a",
            borderRight: isSidebarExpanded ? "1px solid rgba(255,255,255,0.1)" : "none",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            overflowX: "hidden",
            overflowY: "auto",
            zIndex: 10
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px" }}>
            <span style={{ fontSize: 16, fontWeight: 900 }}>STEA Admin</span>
            <button onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
              <Menu size={20} />
            </button>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, marginTop: 16 }}>
            {groupedNavItems.map(group => {
              const isExpanded = expandedGroups.includes(group.title) || !isSidebarExpanded;
              return (
                <div key={group.title} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {isSidebarExpanded && (
                    <button 
                      onClick={() => toggleGroup(group.title)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: "transparent", border: "none", width: "100%", padding: "8px 16px 4px",
                        cursor: "pointer", color: "rgba(255,255,255,0.4)"
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}>{group.title}</span>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  )}

                  {isExpanded && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: isSidebarExpanded ? "0 8px" : "0" }}>
                      {group.items.map(item => {
                        const isActive = activeMenu === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={(e) => { 
                              e.stopPropagation();
                              navigate(item.path); 
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: isSidebarExpanded ? "flex-start" : "center",
                              gap: isSidebarExpanded ? 12 : 0,
                              padding: isSidebarExpanded ? "14px 16px" : "14px 0",
                              margin: isSidebarExpanded ? "0 8px" : "0 auto",
                              width: isSidebarExpanded ? "auto" : 44,
                              height: 44,
                              borderRadius: 12,
                              fontSize: 14,
                              fontWeight: isActive ? 800 : 500,
                              border: "none",
                              cursor: "pointer",
                              textAlign: "left",
                              background: isActive ? "#F5A623" : "transparent",
                              color: isActive ? "#000000" : "rgba(255,255,255,0.6)",
                              transition: "all 0.2s ease-in-out"
                            }}
                            className={isActive ? "" : "hover:bg-white/5 hover:text-white transition-all duration-200"}
                            title={item.label}
                            aria-label={item.label}
                          >
                            <item.icon size={18} color={isActive ? "#000000" : "rgba(255,255,255,0.4)"} style={{ flexShrink: 0 }} />
                            {isSidebarExpanded && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>
      )}

      {/* MOBILE DRAWER OVERLAY */}
      <AnimatePresence>
        {isMobile && isSidebarExpanded && (
          <React.Fragment key="drawerLayout">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarExpanded(false)}
              style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", zIndex: 4000, backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{ position: "fixed", top: 0, bottom: 0, left: 0, width: "80%", maxWidth: 320, background: "#06070a", borderRight: "1px solid rgba(255,255,255,0.1)", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 20, zIndex: 4101 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 16, fontWeight: 900 }}>STEA Dashboard</span>
                <button onClick={() => setIsSidebarExpanded(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X size={18} /></button>
              </div>

              <nav style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, overflowY: "auto", overflowX: "hidden" }}>
                {groupedNavItems.map(group => {
                  const isExpanded = expandedGroups.includes(group.title);
                  return (
                    <div key={group.title} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <button 
                        onClick={() => toggleGroup(group.title)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          background: "transparent", border: "none", width: "100%", padding: "8px 16px 4px",
                          cursor: "pointer", color: "rgba(255,255,255,0.4)"
                        }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}>{group.title}</span>
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>

                      {isExpanded && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {group.items.map(item => {
                            const isActive = activeMenu === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={(e) => { 
                                  e.stopPropagation();
                                  navigate(item.path); 
                                  setIsSidebarExpanded(false); 
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                  padding: "14px 16px",
                                  minHeight: 48,
                                  borderRadius: 12,
                                  fontSize: 14,
                                  fontWeight: isActive ? 800 : 500,
                                  border: "none",
                                  cursor: "pointer",
                                  textAlign: "left",
                                  background: isActive ? "#F5A623" : "transparent",
                                  color: isActive ? "#000000" : "rgba(255,255,255,0.6)",
                                  transition: "all 0.2s ease-in-out"
                                }}
                                className={isActive ? "" : "hover:bg-white/5 hover:text-white transition-all duration-200"}
                                title={item.label}
                                aria-label={item.label}
                              >
                                <item.icon size={18} color={isActive ? "#000000" : "rgba(255,255,255,0.4)"} style={{ flexShrink: 0 }} />
                                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              <button onClick={() => { setIsSidebarExpanded(false); onBack(); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                <LogOut size={14} /> Exit
              </button>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>

      {/* RIGHT MAIN CONTENT AREA */}
      <main 
        style={{ 
          flex: 1, 
          display: "flex", 
          flexDirection: "column", 
          minWidth: 0, 
          padding: isMobile ? "16px" : "32px",
          height: isMobile ? "auto" : "100vh",
          overflowY: isMobile ? "visible" : "auto",
          paddingBottom: isMobile ? "40px" : "120px"
        }} 
      >
        {/* UNIFIED TOP NAV HEADER (Desktop & Mobile) */}
        <header className="flex justify-between items-center mb-6" style={{ background: "rgba(255,255,255,0.02)", padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {(!isSidebarExpanded || isMobile) && (
              <button onClick={() => setIsSidebarExpanded(true)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }} aria-label="Open Navigation Menu">
                <Menu size={24} />
              </button>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ background: "rgba(245, 166, 35, 0.12)", padding: 8, borderRadius: 12, flexShrink: 0 }}>
                <School size={20} color="#F5A623" />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: 0.5 }}>STEA Classroom</span>
                <p style={{ fontSize: 10, color: "#F5A623", fontWeight: 800, margin: 0, textTransform: "uppercase" }}>Teacher cockpit</p>
              </div>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* User Avatar */}
            <STEAAvatar user={user} size="sm" />
            
            {/* Exit Button */}
            <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }} className="hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all">
              <LogOut size={14} /> <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </header>

        {/* Dynamic page container view */}
        <div style={{ flex: 1 }}>
          {renderPageView()}
        </div>
      </main>

      {/* GENERAL APP WIDE ACTION MODALS */}
      <AnimatePresence>
        
        {/* Create Classroom Modal */}
        {showCreateModal && (
          <CreateClassModal key="createClassModal" onClose={() => setShowCreateModal(false)} onSubmit={handleCreateClass} onSuccess={(result) => {
            setShowCreateModal(false);
            setClassCreationResult(result);
            runOptionalClassSetup(db, result, user).then(({ warning }) => {
              if (warning) setClassCreationResult(current => current?.classRef.id === result.classRef.id ? { ...current, setupWarning: warning } : current);
            });
          }} />
        )}

        {classCreationResult && <ClassCreationSuccessModal result={classCreationResult} onOpenClass={() => { navigate(`/class/${classCreationResult.classRef.id}`); setClassCreationResult(null); }} onDone={() => setClassCreationResult(null)} />}

        {/* Upload Resource from general Hub */}
        {showUploadModal && (
          <div key="uploadModal" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", zIndex: 4000, padding: 20 }}>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} style={{ width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
              <UploadResourceForm user={user} role="teacher" onCancel={() => setShowUploadModal(false)} onSuccess={() => { setShowUploadModal(false); notify("Rasilimali/Note imepakiwa kikamilifu!"); }} />
            </motion.div>
          </div>
        )}

        {/* Create Classroom Quiz (Selected class validation context) */}
        {showQuizModal && selectedQuizClass && (
          <QuizCreatorModal 
            key="quizCreatorModal"
            classId={selectedQuizClass.id} 
            teacherId={user.uid} 
            classData={selectedQuizClass} 
            teacherName={user.displayName} 
            onClose={() => setShowQuizModal(false)} 
            onCreated={() => { setShowQuizModal(false); notify("Quiz imeundwa kufanikiwa!"); }} 
          />
        )}

        {/* Start Attendance Session code Modal */}
        {showAttendanceModal && selectedAttClass && (
          <StartSessionModal 
            key="startSessionModal"
            item={selectedAttClass} 
            onClose={() => setShowAttendanceModal(false)} 
            onSubmit={handleCreateAttendanceSession} 
          />
        )}

        {/* Live Attendance dynamic overlay Panel */}
        {liveSession && (
          <div key="liveSessionModal" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#0a0b12", zIndex: 3500, overflowY: "auto", padding: 24 }}>
            <LiveAttendancePanel 
              session={liveSession} 
              onEnd={() => setLiveSession(null)} 
              onEndSession={handleEndRegister}
              onExtendTime={(sess) => setExtendingSession(sess)}
              isEnding={isEndingSession}
            />
          </div>
        )}

        {/* QR code view popup */}
        {qrItem && <QRModal key="qrModal" item={qrItem} onClose={() => setQrItem(null)} />}

        {/* Class delete confirmation panel */}
        {deleteItem && (
          <DeleteClassModal 
            key="deleteClassModal"
            item={deleteItem} 
            isDeleting={isDeleting} 
            onClose={() => setDeleteItem(null)} 
            onConfirm={confirmDeleteClass} 
          />
        )}

        {/* Target Selection Modal (Website vs Class) */}
        {targetSelectionAction && (
          <TargetSelectionModal
            key="targetSelectionModal"
            actionType={targetSelectionAction}
            onClose={() => setTargetSelectionAction(null)}
            onSelectTarget={(target) => {
              if (target === 'website') {
                if (targetSelectionAction === 'upload_note') setView("notes");
                if (targetSelectionAction === 'upload_resource') setShowUploadModal(true);
              } else if (target === 'class') {
                setClassSelectorAction(targetSelectionAction);
              }
              setTargetSelectionAction(null);
            }}
          />
        )}

        {/* Class Selector Modal */}
        {classSelectorAction && (
          <ActionClassSelectorModal 
            key="classSelectorModal"
            classes={classes}
            genericAction={classSelectorAction}
            onClose={() => setClassSelectorAction(null)}
            onSelectClass={(selectedClass) => {
              if (classSelectorAction === 'create_quiz') {
                 setSelectedQuizClass(selectedClass);
                 setShowQuizModal(true);
              } else if (classSelectorAction === 'take_register') {
                 setSelectedAttClass(selectedClass);
                 setShowAttendanceModal(true);
              } else if (classSelectorAction === 'upload_note') {
                 setSelectedAssignmentClass(selectedClass);
                 setAssignmentInitialType('note');
                 setShowAssignmentModal(true);
              } else if (classSelectorAction === 'upload_resource') {
                 setSelectedAssignmentClass(selectedClass);
                 setAssignmentInitialType('resource');
                 setShowAssignmentModal(true);
              } else if (classSelectorAction === 'create_assignment') {
                 setSelectedAssignmentClass(selectedClass);
                 setAssignmentInitialType('assignment');
                 setShowAssignmentModal(true);
              } else if (classSelectorAction === 'post_announcement') {
                 setSelectedAnnouncementClass(selectedClass);
                 setShowQuickAnnouncement(true);
              }
              setClassSelectorAction(null);
            }}
          />
        )}

        {/* Global Attendance Alerts/Conflicts Modals */}
        <AttendanceModals 
          key="attendanceModals"
          sessionConflict={sessionConflict} 
          setSessionConflict={setSessionConflict}
          extendingSession={extendingSession}
          setExtendingSession={setExtendingSession}
          onOpenMonitor={(sess) => setLiveSession(sess)}
          onEndSession={handleEndRegister}
          onExtendTime={handleExtendTime}
        />

        {/* Quick Announcement Modal */}
        {showQuickAnnouncement && selectedAnnouncementClass && (
          <QuickAnnouncementModal 
             key="quickAnnouncementModal"
             classData={selectedAnnouncementClass} 
             teacher={user} 
             onClose={() => setShowQuickAnnouncement(false)} 
             onCreated={() => { setShowQuickAnnouncement(false); notify("Announcement posted!"); setView("notifications"); }} 
          />
        )}

        {/* Assignment Modal for notes/resources/assignments into a class */}
        {showAssignmentModal && selectedAssignmentClass && (
          <AssignmentModal 
             key="assignmentModal"
             classId={selectedAssignmentClass.id} 
             teacherId={user.uid}
             assignment={{ type: assignmentInitialType, title: "", description: "", instructions: "", dueDate: "", totalMarks: 100, allowLateSubmission: false, status: "published", attachmentUrls: [], marksPublished: false }}
             onClose={() => setShowAssignmentModal(false)}
          />
        )}

      </AnimatePresence>

      {/* Notifications Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            style={{ 
              position: "fixed", bottom: 24, right: 24, 
              background: notification.type === "error" ? "#EF4444" : "#F5A623", 
              color: "#000", padding: "12px 24px", borderRadius: 12, fontWeight: 800, 
              zIndex: 5000, boxShadow: "0 10px 25px rgba(0,0,0,0.5)" 
            }}
          >
            {notification.msg}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Sub-components moved to TeacherModals.jsx and AttendanceModals.jsx
