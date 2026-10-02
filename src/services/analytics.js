import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "../firebase.js";

/**
 * Write a user analytics event to Firestore.
 * Signed-in users → users/{uid}/events/{auto-id}
 * Anonymous visitors → anonymous_events/{auto-id}
 * Never throws — tracking must never break the app.
 */
export async function trackUserEvent(type, payload = {}) {
  try {
    const db = getFirebaseDb();
    if (!db) return;
    const user = getFirebaseAuth()?.currentUser || null;

    const event = {
      type,
      ...payload,
      timestamp: serverTimestamp(),
      authMethod: user?.providerData?.[0]?.providerId || "anonymous",
      emailVerified: user?.emailVerified || false,
      email: user?.email || payload?.email || null,
    };

    if (user) {
      await addDoc(collection(db, "users", user.uid, "events"), event);
    } else {
      await addDoc(collection(db, "anonymous_events"), event);
    }
  } catch (err) {
    console.warn("[analytics] track failed:", err?.code || err?.message || err);
  }
}
