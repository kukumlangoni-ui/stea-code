import { useState, useEffect } from "react";
import { getFirebaseAuth, getFirebaseDb, isAdminEmail } from "../firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    
    if (!auth || !db) {
       setLoading(false);
       return;
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
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
              if (adminSnap.data().role === "super_admin" || adminSnap.data().email === "stea.africa@gmail.com") {
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
                if (role === "super_admin") {
                  source = "users_collection_super";
                } else {
                  source = "users_collection";
                }
              }
            }
          }
        } catch(e) {
          console.error("Auth role detection error:", e);
        }
        
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
          }
        });

        console.log(`[DEBUG Auth] User: ${u.email} | Role: ${role} | Source: ${source}`);
        setUser(enhancedUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { user, loading };
}
