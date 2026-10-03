/**
 * userActivity.js — lightweight "active in the last 15 minutes" tracking.
 *
 * Not real-time presence (that would need RTDB + onDisconnect). This writes
 * a timestamp + current path to the user's own Firestore doc on sign-in,
 * on route changes, and every 5 minutes while the tab is open.
 *
 * The admin dashboard queries users whose lastActive > 15 min ago.
 */

import { db, doc, setDoc, serverTimestamp, getFirebaseDb } from "../firebase.js";

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Write lastActive / lastPath / email to the user's Firestore doc.
 * Never throws — errors are console.warn'd only.
 */
export async function markUserActive(user) {
  if (!user?.uid) return;
  try {
    const firestoreDb = getFirebaseDb() || db;
    if (!firestoreDb) return;
    const userRef = doc(firestoreDb, "users", user.uid);
    await setDoc(
      userRef,
      {
        lastActive: serverTimestamp(),
        lastPath: typeof window !== "undefined" ? window.location.pathname : "/",
        email: user.email || "",
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("[userActivity] markUserActive failed:", err?.message || err);
  }
}

/**
 * Start tracking: immediate mark, popstate listener, and 5-min heartbeat.
 * Returns a cleanup function.
 */
export function startActivityTracking(user) {
  if (!user?.uid) {
    return () => {};
  }

  // Immediate mark on sign-in / mount
  markUserActive(user);

  // Update on back/forward navigation
  const handlePopState = () => {
    markUserActive(user);
  };
  window.addEventListener("popstate", handlePopState);

  // Lightweight heartbeat so long-open tabs stay counted
  const intervalId = setInterval(() => {
    markUserActive(user);
  }, HEARTBEAT_INTERVAL_MS);

  // Cleanup
  return function stopTracking() {
    window.removeEventListener("popstate", handlePopState);
    clearInterval(intervalId);
  };
}
