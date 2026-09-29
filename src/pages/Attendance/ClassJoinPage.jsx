import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  getFirebaseAuth,
  getFirebaseDb,
  onAuthStateChanged,
} from "../../firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";
import STEAHeader from "../../components/shared/STEAHeader.jsx";
import STEAClassroomLoader from "../../components/common/STEAClassroomLoader";
import { buildClassJoinLink, normalizeClassCode } from "../../services/classCodeService";

const GOLD = "#D4AF37";
const BLUE = "#2563EB";
const LOGO = "/stea-brand/stea-s-logo-transparent-512.png";
const PENDING_JOIN_KEY = "stea_pending_class_join";

function getClassTitle(classData) {
  return classData?.className || classData?.name || classData?.title || "STEA Classroom";
}

function getClassCode(classData, fallback = "") {
  return normalizeClassCode(classData?.classCode || classData?.joinCode || classData?.code || fallback);
}

function getRequestedInviteCode(routeCode, search) {
  const params = new URLSearchParams(search || "");
  const candidates = [
    routeCode,
    params.get("classCode"),
    params.get("joinCode"),
    params.get("code"),
    params.get("inviteCode"),
    params.get("invite"),
    params.get("token"),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeClassCode(candidate);
    if (normalized) return normalized;
  }

  return "";
}

function getLoadErrorMessage(error, inviteExists) {
  const code = String(error?.code || error?.message || "").toLowerCase();

  if (!navigator.onLine || code.includes("unavailable") || code.includes("network")) {
    return "Network problem. Check your connection and try again.";
  }

  if (code.includes("permission-denied") || code.includes("unauthorized") || code.includes("forbidden")) {
    return "Permission denied. This invite may need a refreshed session.";
  }

  if (code.includes("not-found")) {
    return inviteExists ? "Invite expired. Please ask your teacher for a fresh link." : "Class not found. Check the invite link and try again.";
  }

  if (inviteExists) {
    return "Invite expired. Please ask your teacher for a fresh link.";
  }

  return "Invalid invite link. Please check the QR code or invite URL.";
}

function getJoinApiErrorMessage(code) {
  if (code === "DUPLICATE_STUDENT_ID") return "This student ID is already registered for this class.";
  if (code === "DUPLICATE_EMAIL") return "This email is already registered for this class.";
  if (code === "INVALID_INVITE") return "Invite expired or invalid. Please ask your teacher for a fresh link.";
  if (code === "EXPIRED_INVITE") return "Invite expired or invalid. Please ask your teacher for a fresh link.";
  return "We couldn't complete your request right now. Please try again.";
}

function JoinNotice({ type = "info", children }) {
  const danger = type === "error";
  const success = type === "success";
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "12px 14px",
        borderRadius: 14,
        border: `1px solid ${danger ? "#FCA5A5" : success ? "#A7F3D0" : "#BFDBFE"}`,
        background: danger ? "#FEF2F2" : success ? "#ECFDF5" : "#EFF6FF",
        color: danger ? "#991B1B" : success ? "#065F46" : "#1D4ED8",
        fontSize: 13,
        fontWeight: 700,
        lineHeight: 1.45,
      }}
    >
      {danger ? <AlertTriangle size={17} /> : success ? <CheckCircle size={17} /> : <ShieldCheck size={17} />}
      <span>{children}</span>
    </div>
  );
}

export default function ClassJoinPage() {
  const { classCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  const requestedInviteCode = useMemo(() => getRequestedInviteCode(classCode, location.search), [classCode, location.search]);

  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [inviteData, setInviteData] = useState(null);
  const [user, setUser] = useState(null);
  const [checkingMembership, setCheckingMembership] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [joinedClassId, setJoinedClassId] = useState("");
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [joinForm, setJoinForm] = useState({
    fullName: "",
    studentId: "",
    phone: "",
    email: "",
    department: "",
    notes: "",
  });

  const classTitle = getClassTitle(classData);
  const canonicalCode = getClassCode(classData, requestedInviteCode);
  const joinLink = useMemo(() => buildClassJoinLink(canonicalCode), [canonicalCode]);

  const getJoinedClassRoute = () => `/class/${joinedClassId || classData?.id || ""}`;

  const goToJoinedClass = () => {
    const route = getJoinedClassRoute();
    if (!user) {
      console.info("[ClassJoin] logged-out view class held on public confirmation page", {
        attemptedRoute: route,
        currentRoute: `${location.pathname}${location.search}`,
        authenticatedUid: null,
        classId: joinedClassId || classData?.id || null,
      });
      setNotice("Sign in to view the class dashboard. You have already joined successfully.");
      window.dispatchEvent(new CustomEvent("open-auth"));
      return;
    }

    console.info("[ClassJoin] navigating joined student to class page", {
      route,
      currentRoute: `${location.pathname}${location.search}`,
      authenticatedUid: user.uid,
      classId: joinedClassId || classData?.id || null,
    });
    navigate(route);
  };

  const joinAnotherClass = () => {
    setJoinSuccess(false);
    setJoinedClassId("");
    setNotice("");
    setFormError("");
    setJoinForm((previous) => ({
      ...previous,
      studentId: "",
      phone: "",
      department: "",
      notes: "",
    }));
  };

  const goToClassroomHome = () => {
    if (!user) {
      console.info("[ClassJoin] logged-out classroom home navigation held on public confirmation page", {
        attemptedRoute: "/classroom",
        currentRoute: `${location.pathname}${location.search}`,
        authenticatedUid: null,
        classId: joinedClassId || classData?.id || null,
      });
      setNotice("Sign in to open your STEA Classroom dashboard. You can stay here safely after joining.");
      window.dispatchEvent(new CustomEvent("open-auth"));
      return;
    }

    console.info("[ClassJoin] navigating joined student to classroom dashboard", {
      route: "/classroom/student-dashboard",
      currentRoute: `${location.pathname}${location.search}`,
      authenticatedUid: user.uid,
      classId: joinedClassId || classData?.id || null,
    });
    navigate("/classroom/student-dashboard");
  };

  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setJoinForm((previous) => ({
          ...previous,
          fullName: currentUser.displayName || previous.fullName,
          email: currentUser.email || previous.email,
        }));
      }
    });
  }, [auth]);

  useEffect(() => {
    const fetchClass = async () => {
      if (!db || !requestedInviteCode) {
        setLoadError("Invalid invite link. Please check the QR code or invite URL.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError("");
      setInviteData(null);
      setClassData(null);

      let inviteSnap = null;

      try {
        let classSnapshot = null;
        let isOldCollection = false;
        const legacyFields = ["joinCode", "classCode", "code"];

        try {
          inviteSnap = await getDoc(doc(db, "classCodes", requestedInviteCode));
        } catch (inviteError) {
          console.warn(`[ClassJoin] invite metadata lookup failed at classCodes/${requestedInviteCode}:`, inviteError);
        }

        const inviteExists = Boolean(inviteSnap?.exists?.());
        const inviteMeta = inviteExists ? { id: inviteSnap.id, ...inviteSnap.data() } : null;
        setInviteData(inviteMeta);

        if (inviteMeta?.classId) {
          classSnapshot = await getDoc(doc(db, "classes", inviteMeta.classId));
          if (!classSnapshot.exists()) {
            classSnapshot = await getDoc(doc(db, "attendanceClasses", inviteMeta.classId));
            isOldCollection = classSnapshot.exists();
          }
        }

        if (!classSnapshot?.exists() && user) {
          for (const field of legacyFields) {
            const snapshot = await getDocs(query(collection(db, "classes"), where(field, "==", requestedInviteCode)));
            if (!snapshot.empty) {
              classSnapshot = snapshot.docs[0];
              break;
            }
          }
        }

        if (!classSnapshot?.exists() && user) {
          for (const field of legacyFields) {
            const snapshot = await getDocs(query(collection(db, "attendanceClasses"), where(field, "==", requestedInviteCode)));
            if (!snapshot.empty) {
              classSnapshot = snapshot.docs[0];
              isOldCollection = true;
              break;
            }
          }
        }

        if (!classSnapshot?.exists() && import.meta.env.DEV && requestedInviteCode === "DEMO12") {
          setClassData({
            id: "demo-class-1",
            className: "Physics Form 4 (Demo)",
            subject: "Physics",
            teacherName: "Mr. Preview",
            schoolName: "STEA Academy",
            classCode: "DEMO12",
            status: "active",
          });
          return;
        }

        if (!inviteExists && !classSnapshot?.exists()) {
          setLoadError("Invalid invite link. Please check the QR code or invite URL.");
          return;
        }

        const classFromSnapshot = classSnapshot?.exists?.() ? classSnapshot.data() : null;
        const classId = classSnapshot?.id || inviteMeta?.classId || "";
        const mergedClassData = {
          id: classId,
          ...inviteMeta,
          ...classFromSnapshot,
          classCode: classFromSnapshot?.classCode || classFromSnapshot?.joinCode || classFromSnapshot?.code || inviteMeta?.classCode || inviteMeta?.joinCode || requestedInviteCode,
          joinCode: classFromSnapshot?.joinCode || classFromSnapshot?.classCode || classFromSnapshot?.code || inviteMeta?.joinCode || inviteMeta?.classCode || requestedInviteCode,
          code: classFromSnapshot?.code || classFromSnapshot?.classCode || classFromSnapshot?.joinCode || inviteMeta?.code || requestedInviteCode,
          joinUrl: classFromSnapshot?.joinUrl || inviteMeta?.joinUrl || buildClassJoinLink(classFromSnapshot?.classCode || classFromSnapshot?.joinCode || classFromSnapshot?.code || inviteMeta?.classCode || requestedInviteCode),
          isOldCollection: Boolean(isOldCollection || classFromSnapshot?.isOldCollection),
        };

        if (!classId) {
          setLoadError(getLoadErrorMessage({ code: "not-found" }, inviteExists));
          return;
        }

        if (inviteMeta?.status === "deleted" || inviteMeta?.deleted === true) {
          setLoadError("Invite expired. Please ask your teacher for a fresh link.");
          return;
        }

        if (classFromSnapshot?.status === "deleted" || classFromSnapshot?.deleted === true) {
          setLoadError("This class is no longer available.");
          return;
        }

        if (classFromSnapshot?.status && classFromSnapshot.status !== "active") {
          setLoadError("Invite expired. Please ask your teacher for a fresh link.");
          return;
        }

        setClassData(mergedClassData);
      } catch (error) {
        console.error(`[ClassJoin] class invite lookup failed for code ${requestedInviteCode}:`, error);
        setLoadError(getLoadErrorMessage(error, Boolean(inviteSnap)));
      } finally {
        setLoading(false);
      }
    };

    fetchClass();
  }, [db, requestedInviteCode, user]);

  const openAuth = () => {
    if (canonicalCode) sessionStorage.setItem(PENDING_JOIN_KEY, canonicalCode);
    setNotice("Sign in to continue joining this class.");
    window.dispatchEvent(new CustomEvent("open-auth"));
  };

  const verifyMembership = async () => {
    if (!user || !classData || !db) return;

    if (import.meta.env.DEV && classData.id === "demo-class-1") return;

    setCheckingMembership(true);
    setNotice("");

    try {
      const collectionName = classData.isOldCollection ? "attendanceClasses" : "classes";
      const recordSnap = await getDoc(doc(db, collectionName, classData.id, "classStudents", user.uid));

      if (!recordSnap.exists()) return;

      if (recordSnap.data().status === "active") {
        setNotice("You are already in this class. Opening your classroom...");
        navigate(`/class/${classData.id}`);
      } else {
        setFormError("Your previous access was removed. Please contact your teacher.");
      }
    } catch (error) {
      console.warn("Class membership check failed:", error);
      setFormError("Unable to check your class access. Please try again.");
    } finally {
      setCheckingMembership(false);
    }
  };

  useEffect(() => {
    if (!user || !classData) return;
    const pendingCode = sessionStorage.getItem(PENDING_JOIN_KEY);
    if (pendingCode === canonicalCode) sessionStorage.removeItem(PENDING_JOIN_KEY);
    verifyMembership();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, classData?.id, canonicalCode]);

  const handleJoinClassSubmit = async (event) => {
    event.preventDefault();
    if (!classData || !db) {
      return;
    }

    const fullName = joinForm.fullName.trim();
    const studentId = joinForm.studentId.trim();
    const phone = joinForm.phone.trim();
    const email = (joinForm.email || user?.email || "").trim();
    const department = joinForm.department.trim();
    const notes = joinForm.notes.trim();

    if (!fullName || !studentId) {
      setFormError("Student full name and student ID are required.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    setNotice("");

    try {
      if (import.meta.env.DEV && classData.id === "demo-class-1") {
        window.setTimeout(() => {
          setJoinSuccess(true);
          setJoinedClassId(classData.id);
          setSubmitting(false);
          if (user) {
            console.info("[ClassJoin] navigating joined student to class page", {
              route: `/class/${classData.id}`,
              currentRoute: `${location.pathname}${location.search}`,
              authenticatedUid: user.uid,
              classId: classData.id,
            });
            window.setTimeout(() => navigate(`/class/${classData.id}`), 1200);
          }
        }, 700);
        return;
      }

      const headers = { "Content-Type": "application/json" };
      if (user?.getIdToken) {
        try {
          headers.Authorization = `Bearer ${await user.getIdToken()}`;
        } catch (error) {
          console.warn("[ClassJoin] optional auth token fetch failed before join request", {
            code: error?.code || "unknown",
            authenticatedUid: user?.uid || null,
            inviteToken: canonicalCode || requestedInviteCode,
          });
        }
      }

      console.info("[ClassJoin] Sending secure join request", {
        operation: "https-post",
        path: "/api/classroom/join",
        authenticatedUid: user?.uid || null,
        inviteToken: canonicalCode || requestedInviteCode,
      });

      const response = await fetch("/api/classroom/join", {
        method: "POST",
        headers,
        body: JSON.stringify({
          inviteToken: canonicalCode || requestedInviteCode,
          fullName,
          studentId,
          email,
          phone,
          department,
          note: notes,
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result?.ok) {
        console.error("[ClassJoin] secure join request failed", {
          operation: "https-post",
          path: "/api/classroom/join",
          firebaseCode: result?.code || `HTTP_${response.status}`,
          authenticatedUid: user?.uid || null,
          inviteToken: canonicalCode || requestedInviteCode,
        });
        setFormError(getJoinApiErrorMessage(result?.code));
        return;
      }

      console.info("[ClassJoin] secure join request succeeded", {
        operation: "https-post",
        path: "/api/classroom/join",
        memberPath: result.memberPath,
        authenticatedUid: user?.uid || null,
        inviteToken: canonicalCode || requestedInviteCode,
      });

      setJoinSuccess(true);
      setJoinedClassId(result.classId || classData.id);
      setNotice(user ? "Class joined. Opening your classroom..." : "");
      window.dispatchEvent(new Event("stea-data-sync"));
      if (user) {
        const nextRoute = `/class/${result.classId || classData.id}`;
        console.info("[ClassJoin] navigating joined student to class page", {
          route: nextRoute,
          currentRoute: `${location.pathname}${location.search}`,
          authenticatedUid: user.uid,
          classId: result.classId || classData.id,
        });
        window.setTimeout(() => navigate(nextRoute), 1200);
      } else {
        console.info("[ClassJoin] staying on public join confirmation for logged-out student", {
          currentRoute: `${location.pathname}${location.search}`,
          authenticatedUid: null,
          classId: result.classId || classData.id,
        });
      }
    } catch (error) {
      console.error("[ClassJoin] secure join request crashed", {
        operation: "https-post",
        path: "/api/classroom/join",
        firebaseCode: error?.code || "unknown",
        authenticatedUid: user?.uid || null,
        inviteToken: canonicalCode || requestedInviteCode,
      }, error);
      setFormError("We couldn't complete your request right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/classroom");
  };

  if (loading) return <STEAClassroomLoader progress={85} />;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", color: "#111827", fontFamily: "'Instrument Sans', system-ui, sans-serif" }}>
      <STEAHeader
        appName="STEA Classroom"
        appIcon={LOGO}
        user={user}
        homeTo="/classroom"
        menuButton={({ buttonStyle }) => (
          <button
            type="button"
            onClick={handleBack}
            style={{ ...buttonStyle, width: 40, height: 40, borderRadius: 12 }}
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeft size={20} color="#374151" />
          </button>
        )}
        showSearch={false}
        showLanguage
        showApps
        primaryAction={user ? null : {
          label: "Sign In",
          color: "gold",
          onClick: openAuth,
        }}
      />

      <main style={{ width: "min(920px, 100%)", margin: "0 auto", padding: "24px clamp(14px, 4vw, 40px) 56px", boxSizing: "border-box" }}>
        <section style={{ display: "grid", gap: 18 }}>
          <div style={{ textAlign: "center", padding: "18px 0 4px" }}>
            <div style={{ width: 76, height: 76, borderRadius: 24, margin: "0 auto 16px", display: "grid", placeItems: "center", background: "#FFFFFF", border: `1px solid ${GOLD}`, boxShadow: "0 14px 34px rgba(212,175,55,0.16)" }}>
              <img src={LOGO} alt="STEA" style={{ width: 48, height: 48, objectFit: "contain" }} />
            </div>
            <h1 style={{ margin: 0, fontSize: "clamp(28px, 7vw, 44px)", lineHeight: 1.08, fontWeight: 900, color: "#111827", letterSpacing: 0 }}>
              Join Classroom
            </h1>
            <p style={{ margin: "10px auto 0", maxWidth: 560, color: "#64748B", fontSize: 15, lineHeight: 1.6 }}>
              Confirm the class details, add your student information, and join your teacher's STEA Classroom.
            </p>
          </div>

          {loadError ? (
            <div style={{ border: "1px solid #FCA5A5", background: "#FEF2F2", borderRadius: 22, padding: 24, textAlign: "center" }}>
              <AlertTriangle size={36} color="#DC2626" />
              <h2 style={{ margin: "12px 0 8px", fontSize: 20, fontWeight: 900, color: "#991B1B" }}>Invite not available</h2>
              <p style={{ margin: "0 0 18px", color: "#7F1D1D", lineHeight: 1.5 }}>{loadError}</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <button type="button" onClick={() => window.location.reload()} style={{ border: 0, borderRadius: 12, padding: "12px 18px", background: GOLD, color: "#111827", fontWeight: 900, cursor: "pointer" }}>
                  Try Again
                </button>
                <button type="button" onClick={handleBack} style={{ border: 0, borderRadius: 12, padding: "12px 18px", background: "#FFFFFF", color: "#111827", fontWeight: 900, cursor: "pointer" }}>
                  Go Back
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 16 }}>
              <section style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 24, padding: 20, boxShadow: "0 16px 40px rgba(15,23,42,0.06)" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, display: "grid", placeItems: "center", background: "#FFF8E1", color: "#8F6D00", flexShrink: 0 }}>
                    <BookOpen size={25} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em", color: "#8F6D00", marginBottom: 6 }}>Class Invite</div>
                    <h2 style={{ margin: 0, fontSize: 22, lineHeight: 1.2, color: "#111827", fontWeight: 900 }}>{classTitle}</h2>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, color: "#64748B", fontSize: 13, fontWeight: 700 }}>
                      {inviteData?.subject && <span>{inviteData.subject}</span>}
                      {classData?.subject && <span>{classData.subject}</span>}
                      {classData?.section && <span>Section {classData.section}</span>}
                      {classData?.room && <span>Room {classData.room}</span>}
                      <span>Code {canonicalCode || requestedInviteCode || "Pending"}</span>
                    </div>
                    <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "center", color: "#374151", fontSize: 14 }}>
                      <Users size={17} color={BLUE} />
                      <span>{classData?.teacherName || inviteData?.teacherName || classData?.ownerName || "Your teacher"}</span>
                    </div>
                  </div>
                </div>
              </section>

              {joinSuccess && !user ? (
                <section style={{ background: "#FFFFFF", border: "1px solid #A7F3D0", borderRadius: 24, padding: 22, boxShadow: "0 16px 40px rgba(15,23,42,0.06)", display: "grid", gap: 16, textAlign: "center" }}>
                  <div style={{ width: 60, height: 60, borderRadius: 18, display: "grid", placeItems: "center", margin: "0 auto", background: "#ECFDF5", color: "#047857" }}>
                    <CheckCircle size={32} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 22, lineHeight: 1.2, color: "#065F46", fontWeight: 900 }}>You have joined the class successfully.</h2>
                    <p style={{ margin: "8px auto 0", maxWidth: 520, color: "#64748B", fontSize: 14, lineHeight: 1.55 }}>
                      Your teacher can now see your details in the class list. You can sign in later if you want to view your classroom dashboard.
                    </p>
                  </div>
                  {notice && <JoinNotice type="info">{notice}</JoinNotice>}
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                    <button type="button" onClick={goToJoinedClass} style={{ border: 0, borderRadius: 12, padding: "12px 16px", background: GOLD, color: "#111827", fontWeight: 900, cursor: "pointer" }}>
                      View Class
                    </button>
                    <button type="button" onClick={joinAnotherClass} style={{ border: "1px solid #DDE5EF", borderRadius: 12, padding: "12px 16px", background: "#FFFFFF", color: "#111827", fontWeight: 900, cursor: "pointer" }}>
                      Join Another Class
                    </button>
                    <button type="button" onClick={goToClassroomHome} style={{ border: "1px solid #DDE5EF", borderRadius: 12, padding: "12px 16px", background: "#F8FAFC", color: "#111827", fontWeight: 900, cursor: "pointer" }}>
                      Go to STEA Classroom
                    </button>
                  </div>
                </section>
              ) : (
              <form onSubmit={handleJoinClassSubmit} style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 24, padding: 20, boxShadow: "0 16px 40px rgba(15,23,42,0.06)", display: "grid", gap: 14 }}>
                <div>
                  <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 900, color: "#111827" }}>Student details</h2>
                  <p style={{ margin: 0, color: "#64748B", fontSize: 13, lineHeight: 1.5 }}>These details help your teacher identify you in class records.</p>
                </div>

                {notice && <JoinNotice type={joinSuccess ? "success" : "info"}>{notice}</JoinNotice>}
                {formError && <JoinNotice type="error">{formError}</JoinNotice>}
                {joinSuccess && !notice && <JoinNotice type="success">Class joined. Opening your classroom...</JoinNotice>}

                {!user && <JoinNotice>You can join with this invite link. Sign in is optional.</JoinNotice>}

                <label style={{ display: "grid", gap: 7, color: "#374151", fontSize: 13, fontWeight: 900 }}>
                  Student full name
                  <input
                    type="text"
                    value={joinForm.fullName}
                    onChange={(event) => setJoinForm({ ...joinForm, fullName: event.target.value })}
                    placeholder="e.g. Asha John"
                    disabled={submitting || joinSuccess}
                    required
                    style={inputStyle}
                  />
                </label>

                <label style={{ display: "grid", gap: 7, color: "#374151", fontSize: 13, fontWeight: 900 }}>
                  Student ID / registration number
                  <input
                    type="text"
                    value={joinForm.studentId}
                    onChange={(event) => setJoinForm({ ...joinForm, studentId: event.target.value })}
                    placeholder="e.g. S1234"
                    disabled={submitting || joinSuccess}
                    required
                    style={inputStyle}
                  />
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                  <label style={{ display: "grid", gap: 7, color: "#374151", fontSize: 13, fontWeight: 900 }}>
                    Email
                    <input
                      type="email"
                      value={joinForm.email}
                      onChange={(event) => setJoinForm({ ...joinForm, email: event.target.value })}
                      placeholder="student@example.com"
                      disabled={submitting || joinSuccess}
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ display: "grid", gap: 7, color: "#374151", fontSize: 13, fontWeight: 900 }}>
                    Phone
                    <input
                      type="tel"
                      value={joinForm.phone}
                      onChange={(event) => setJoinForm({ ...joinForm, phone: event.target.value })}
                      placeholder="+255..."
                      disabled={submitting || joinSuccess}
                      style={inputStyle}
                    />
                  </label>
                </div>

                <label style={{ display: "grid", gap: 7, color: "#374151", fontSize: 13, fontWeight: 900 }}>
                  Class / department
                  <input
                    type="text"
                    value={joinForm.department}
                    onChange={(event) => setJoinForm({ ...joinForm, department: event.target.value })}
                    placeholder="Optional"
                    disabled={submitting || joinSuccess}
                    style={inputStyle}
                  />
                </label>

                <label style={{ display: "grid", gap: 7, color: "#374151", fontSize: 13, fontWeight: 900 }}>
                  Note to teacher
                  <textarea
                    value={joinForm.notes}
                    onChange={(event) => setJoinForm({ ...joinForm, notes: event.target.value })}
                    placeholder="Optional"
                    disabled={submitting || joinSuccess}
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.45 }}
                  />
                </label>

                <button
                  type="submit"
                  disabled={submitting || checkingMembership || joinSuccess}
                  style={{
                    minHeight: 52,
                    border: 0,
                    borderRadius: 14,
                    background: "linear-gradient(135deg, #D4AF37, #F5A623)",
                    color: "#111827",
                    fontSize: 15,
                    fontWeight: 900,
                    cursor: submitting || checkingMembership || joinSuccess ? "not-allowed" : "pointer",
                    opacity: submitting || checkingMembership ? 0.76 : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {submitting || checkingMembership ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : joinSuccess ? <CheckCircle size={18} /> : null}
                  {submitting ? "Joining..." : checkingMembership ? "Checking..." : joinSuccess ? "Joined" : "Join Classroom"}
                </button>

                <div style={{ color: "#94A3B8", fontSize: 11, lineHeight: 1.45, wordBreak: "break-all" }}>
                  Invite link: {joinLink}
                </div>
              </form>
              )}
            </div>
          )}
        </section>
      </main>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  minHeight: 46,
  boxSizing: "border-box",
  border: "1px solid #DDE5EF",
  borderRadius: 13,
  background: "#FFFFFF",
  color: "#111827",
  font: "inherit",
  fontSize: 14,
  fontWeight: 700,
  outline: "none",
  padding: "11px 13px",
};
