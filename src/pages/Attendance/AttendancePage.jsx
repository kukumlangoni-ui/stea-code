import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { RoleSelector } from "../../components/Attendance/RoleSelector.jsx";
import { TeacherDashboard } from "../../components/Attendance/TeacherDashboard.jsx";
import { StudentDashboard } from "../../components/Attendance/StudentDashboard.jsx";
import { getFirebaseAuth, getFirebaseDb, onAuthStateChanged } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { SteaEcosystemBanner, SteaExploreMore } from "../../components/SteaEcosystem.jsx";
import STEAClassroomLoader from "../../components/common/STEAClassroomLoader";
import { getClassroomRole, setClassroomRole, clearClassroomRole, migrateLegacyRole } from "../../utils/classroomRoleStorage.js";

export default function AttendancePage() {
  const [role, setRole] = useState(null); // 'teacher', 'student'
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getFirebaseAuth();
    let resolvedAuthState = false;
    const previewAuthEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_PREVIEW_AUTH === "true";
    const previewFallback = previewAuthEnabled
      ? window.setTimeout(() => {
          if (!resolvedAuthState) {
            setUser({ uid: "preview_user", displayName: "Preview User", email: "preview@stea.africa" });
            setLoading(false);
          }
        }, 2500)
      : null;
    
    // We no longer auto-load the role from localStorage/DB on mount to ensure
    // the user always sees the Role Selection screen at /classroom as requested.
    
    if (auth) {
      const unsub = onAuthStateChanged(auth, async (u) => {
        resolvedAuthState = true;
        if (previewFallback) window.clearTimeout(previewFallback);
        if (!u && previewAuthEnabled) {
           setUser({ uid: "preview_user", displayName: "Preview User", email: "preview@stea.africa" });
        } else {
           setUser(u);
           if (u?.uid) {
             setRole(getClassroomRole(u.uid) || migrateLegacyRole(u.uid));
           } else {
             setRole(null);
           }
           // We can still fetch the user doc but we won't auto-set the role state here
           // to prevent auto-redirecting from the selection screen.
        }
        setLoading(false);
      });
      return () => {
        resolvedAuthState = true;
        if (previewFallback) window.clearTimeout(previewFallback);
        unsub();
      };
    } else {
      resolvedAuthState = true;
      if (previewFallback) window.clearTimeout(previewFallback);
      if (previewAuthEnabled) {
        setUser({ uid: "preview_user", displayName: "Preview User", email: "preview@stea.africa" });
      }
      setLoading(false);
    }
  }, []);

  // Handle routing based on role and current path
  useEffect(() => {
    if (loading) return;

    const path = location.pathname;

    // Strict teacher paths bypass role check
    if (path.startsWith('/teacher')) {
       // if they have no role, force set it to teacher just in case
       if (role !== 'teacher') {
         setRole('teacher');
         setClassroomRole(user?.uid, 'teacher');
       }
       return;
    }

    // If user is on a specific dashboard but has no role, bounce to chooser
    if (!role || (role !== 'teacher' && role !== 'student')) {
      if (path !== "/classroom" && path !== "/attendance") {
        navigate("/classroom", { replace: true });
      }
    } else {
      // User has a role. We only redirect if they are trying to access the OTHER dashboard.
      if (path === "/classroom/teacher-dashboard" && role !== 'teacher') {
         navigate(`/classroom/${role}-dashboard`, { replace: true });
      } else if (path === "/classroom/student-dashboard" && role !== 'student') {
         navigate(`/classroom/${role}-dashboard`, { replace: true });
      }
    }
    // Note: We removed the auto-redirect from /classroom to /dashboard
  }, [role, location.pathname, loading, navigate]);

  const handleRoleSelect = async (selectedRole) => {
     setRole(selectedRole);
     setClassroomRole(user?.uid, selectedRole);
     
     if (user && user.uid !== "preview_user") {
       try {
         const db = getFirebaseDb();
         await setDoc(doc(db, "users", user.uid), { classroomRole: selectedRole }, { merge: true });
       } catch (err) {
         console.error("Failed to save role", err);
       }
     }
     
     navigate(`/classroom/${selectedRole}-dashboard`);
  };

  const handleSwitchRole = () => {
    setRole(null);
    clearClassroomRole(user?.uid);
    navigate("/classroom");
  };

  if (loading) {
    return <STEAClassroomLoader progress={85} />;
  }

  if (!user) {
    return (
      <div style={{ minHeight: "80vh", display: "grid", placeItems: "center", color: "#fff", background: "#05060a" }}>
        <div style={{ textAlign: "center", padding: 20, maxWidth: 400 }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🔒</div>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Ingia kwenye Classroom Portal</h2>
          <p style={{ color: "rgba(255,255,255,.5)", marginBottom: 32, lineHeight: 1.6 }}>Unahitaji kuwa umeingia kwenye akaunti yako ya STEA kuanza kutumia mfumo wa madarasa, mahudhurio, na quizzes.</p>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent("open-auth"))}
            style={{ 
                background: "#F5A623", color: "#111", border: "none", padding: "14px 40px", 
                borderRadius: 16, fontWeight: 900, fontSize: 16, cursor: "pointer",
                width: "100%"
            }}
          >
            Ingia Sasa
          </button>
        </div>
      </div>
    );
  }

  const path = location.pathname;

  // New strict teacher routes handling
  const isTeacherRoute = path.startsWith('/teacher');

  if (isTeacherRoute) {
     return <TeacherDashboard onBack={handleSwitchRole} user={user} />;
  }

  if (path === "/classroom/teacher-dashboard" && role === 'teacher') {
    return <TeacherDashboard onBack={handleSwitchRole} user={user} />;
  }

  if (path === "/classroom/student-dashboard" && role === 'student') {
    return <StudentDashboard onBack={handleSwitchRole} user={user} />;
  }

  return (
    <div style={{ background: "#05060a", minHeight: "100vh", display: "flex", flexDirection: "column", paddingTop: "76px" }}>
      {/* Top Premium Navbar */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        padding: "16px 20px", 
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        background: "rgba(5, 6, 10, 0.5)",
        backdropFilter: "blur(12px)",
        width: "100%"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#F5A623", fontWeight: 900, fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>
            STEA Classroom
          </span>
        </div>
      </div>

      {/* Ecosystem Discovery Banner */}
      <SteaEcosystemBanner page="classroom" />

      {/* Main Content Area */}
      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <RoleSelector onSelect={handleRoleSelect} />
      </div>

      {/* Explore More STEA */}
      <SteaExploreMore exclude="classroom" />
    </div>
  );
}
