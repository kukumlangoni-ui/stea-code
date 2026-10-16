import { useEffect, useRef } from "react";
import { useAuth as useClerkAuth, useClerk } from "@clerk/clerk-react";
import { getFirebaseAuth } from "../../firebase.js";
import {
  exchangeClerkForFirebase,
  signInFirebaseWithCustomToken,
} from "../../services/clerkFirebaseBridge.js";
export default function ClerkBridge() {
  const { isLoaded, isSignedIn, getToken, signOut: clerkSignOut } = useClerkAuth();
  const clerk = useClerk();
  const busyRef = useRef(false);
  // Bridge in: Clerk signed in → Firebase sign in via custom token
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const firebaseAuth = getFirebaseAuth();
    if (firebaseAuth?.currentUser) return; // already bridged
    if (busyRef.current) return;
    busyRef.current = true;
    (async () => {
      try {
        const clerkToken = await getToken();
        if (!clerkToken) return;
        const firebaseToken = await exchangeClerkForFirebase(clerkToken);
        await signInFirebaseWithCustomToken(firebaseToken);
        console.log("[ClerkBridge] Firebase session established");
      } catch (err) {
        console.error("[ClerkBridge] bridge failed:", err?.message || err);
      } finally {
        busyRef.current = false;
      }
    })();
  }, [isLoaded, isSignedIn, getToken]);
  // Bridge out: if Clerk signs out, sign out of Firebase too
  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) return;
    const firebaseAuth = getFirebaseAuth();
    if (firebaseAuth?.currentUser) {
      firebaseAuth.signOut().catch(() => {});
    }
  }, [isLoaded, isSignedIn]);
  return null;
}
