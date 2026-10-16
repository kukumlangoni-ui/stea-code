import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "../services/staffAuth.js";
import { useAuth } from "../hooks/useAuth.js";
import AdminLoadingScreen from "./AdminLoadingScreen.jsx";
import { StaffProvider } from "./StaffContext.jsx";

/**
 * Staff auth gate — sits ABOVE the admin panel.
 *
 * Decision order:
 *  1. If a staff token exists → validate via /staff/me.
 *       - 200 → load staff into StaffProvider, render children (staff mode).
 *       - 401/403 → clear token, redirect to /staff/login.
 *  2. No staff token → fall through to the existing Firebase path (customers /
 *     legacy owners) by rendering children with staff=null. SteaCodeAdminApp
 *     decides the Firebase behavior exactly as before.
 *  3. No staff token AND no Firebase user → redirect to /staff/login.
 */
export default function StaffAuthGate({ children }) {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [phase, setPhase] = useState("loading"); // loading | staff | firebase | redirect
  const [staff, setStaff] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const token = getToken();
    if (!token) {
      setPhase("firebase");
      return;
    }

    (async () => {
      try {
        const r = await fetch("/api/stea-code/staff/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (r.ok) {
          const data = await r.json();
          setStaff(data?.staff || null);
          setPhase("staff");
        } else {
          localStorage.removeItem("stea_staff_token");
          setPhase("redirect");
        }
      } catch {
        if (cancelled) return;
        setPhase("redirect");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  if (phase === "loading" || (phase === "firebase" && authLoading)) {
    return <AdminLoadingScreen />;
  }

  if (phase === "redirect") {
    return <Navigate to="/staff/login" replace />;
  }

  if (phase === "firebase") {
    // No staff token. If a Firebase user exists, keep the legacy path.
    // If neither, redirect to the staff login.
    if (!user) {
      return <Navigate to="/staff/login" replace />;
    }
    return <StaffProvider staff={null}>{children}</StaffProvider>;
  }

  // staff mode
  return <StaffProvider staff={staff}>{children}</StaffProvider>;
}
