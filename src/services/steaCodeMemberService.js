/* =============================================================
 * STEA Code — Member profile metadata (NOT authentication)
 * Creates/updates stea_code_members/{uid} docs on first action.
 * Authentication remains the SAME Firebase Auth as stea.africa.
 * ============================================================= */

import {
  getFirebaseAuth,
  getFirebaseDb,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "../firebase.js";

const COLLECTION = "stea_code_members";

export async function touchSteaCodeMemberProfile() {
  try {
    const user = getFirebaseAuth()?.currentUser;
    const db = getFirebaseDb();
    if (!user || !db) return null;

    const ref = doc(db, COLLECTION, user.uid);
    const snap = await getDoc(ref);
    const existing = snap.exists() ? snap.data() : null;

    const payload = {
      userId: user.uid,
      email: user.email || existing?.email || "",
      displayName: user.displayName || existing?.displayName || "",
      photoURL: user.photoURL || existing?.photoURL || "",
      joinedAt: existing?.joinedAt || serverTimestamp(),
      lastSeenAt: serverTimestamp(),
    };

    await setDoc(ref, payload, { merge: true });
    return payload;
  } catch (error) {
    if (import.meta && import.meta.env && import.meta.env.DEV) {
      console.warn("[SteaCode] touch member profile failed:", error);
    }
    return null;
  }
}
