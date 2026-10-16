import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { staffFetch, staffLogout } from "../services/staffAuth.js";

const StaffContext = createContext(null);

/**
 * Provides the current staff member + derived role booleans to the admin panel.
 *
 * Wrapped around <SteaCodeAdminApp />. The StaffAuthGate loads the staff
 * object via /me and passes it into this provider; signOut() clears the token
 * and sends the user back to /staff/login.
 */
export function StaffProvider({ staff: initialStaff = null, children }) {
  const navigate = useNavigate();
  const [staff, setStaff] = useState(initialStaff);

  const refresh = useCallback(async () => {
    try {
      const r = await staffFetch("/staff/me");
      if (!r.ok) return null;
      const data = await r.json();
      setStaff(data?.staff || null);
      return data?.staff || null;
    } catch {
      setStaff(null);
      return null;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await staffLogout();
    } finally {
      setStaff(null);
      navigate("/staff/login", { replace: true });
    }
  }, [navigate]);

  const value = useMemo(() => {
    const role = staff?.role || "";
    return {
      staff,
      isOwner: role === "owner",
      isAdmin: role === "owner" || role === "admin",
      isEditor: role === "editor",
      role,
      signOut,
      refresh,
    };
  }, [staff, signOut, refresh]);

  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
}

export function useStaff() {
  const ctx = useContext(StaffContext);
  if (!ctx) {
    throw new Error("useStaff must be used within a <StaffProvider>");
  }
  return ctx;
}
