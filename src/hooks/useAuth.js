import { useState, useEffect } from "react";

/**
 * Staff/admin auth. Firebase is only needed by the admin app, so it is loaded
 * on demand — importing it statically put ~300 kB plus its module-level
 * initialisation on the storefront's critical boot path, where any failure
 * (blocked analytics, invalid config, restricted WebView) aborts bundle
 * evaluation and blanks the whole page before React can mount.
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    let unsubscribe = () => {};

    (async () => {
      try {
        const [
          { getFirebaseAuth, getFirebaseDb, isAdminEmail },
          { onAuthStateChanged },
          { doc, getDoc },
        ] = await Promise.all([
          import("../firebase.js"),
          import("firebase/auth"),
          import("firebase/firestore"),
        ]);

        if (!alive) return;

        const auth = getFirebaseAuth();
        const db = getFirebaseDb();

        if (!auth || !db) {
          setLoading(false);
          return;
        }

        unsubscribe = onAuthStateChanged(auth, async (u) => {
          if (!alive) return;

          if (!u) {
            setUser(null);
            setLoading(false);
            return;
          }

          let role = "user";
          let source = "default";

          try {
            if (isAdminEmail(u.email)) {
              role = "super_admin";
              source = "email_whitelist";
            } else {
              // Check admins collection
              const adminSnap = await getDoc(doc(db, "admins", u.uid));
              if (adminSnap.exists()) {
                if (
                  adminSnap.data().role === "super_admin" ||
                  adminSnap.data().email === "stea.africa@gmail.com"
                ) {
                  role = "super_admin";
                  source = "admins_collection";
                } else {
                  role = adminSnap.data().role || "admin";
                  source = "admins_collection";
                }
              } else {
                // Check users collection
                const userSnap = await getDoc(doc(db, "users", u.uid));
                if (userSnap.exists() && userSnap.data().role) {
                  role = userSnap.data().role;
                  source = role === "super_admin" ? "users_collection_super" : "users_collection";
                }
              }
            }
          } catch (e) {
            console.error("Auth role detection error:", e);
          }

          if (!alive) return;

          // Expose a new proxy to trigger React updates and preserve methods
          const enhancedUser = new Proxy(u, {
            get(target, prop) {
              if (prop === "role") return role;
              if (prop === "roleSource") return source;
              const value = target[prop];
              if (typeof value === "function") {
                return value.bind(target);
              }
              return value;
            },
          });

          console.log(`[DEBUG Auth] User: ${u.email} | Role: ${role} | Source: ${source}`);
          setUser(enhancedUser);
          setLoading(false);
        });
      } catch (error) {
        // Never let admin auth bring the storefront down.
        console.error("Auth initialisation failed:", error);
        if (alive) {
          setUser(null);
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
      try {
        unsubscribe();
      } catch { /* already torn down */ }
    };
  }, []);

  return { user, loading };
}
