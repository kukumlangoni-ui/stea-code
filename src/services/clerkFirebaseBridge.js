// Exchanges a Clerk session token for a Firebase custom token via the Worker,
// then signs the user into Firebase so all existing Firebase code paths work.
import { getFirebaseAuth } from "../firebase.js";
export async function exchangeClerkForFirebase(clerkSessionToken) {
  const r = await fetch("/api/stea-code/auth/bridge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: clerkSessionToken }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err?.error || `Bridge failed (${r.status})`);
  }
  const data = await r.json();
  if (!data?.firebaseToken) throw new Error("Bridge returned no token");
  return data.firebaseToken;
}
export async function signInFirebaseWithCustomToken(firebaseToken) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase not configured");
  const { signInWithCustomToken } = await import("firebase/auth");
  await signInWithCustomToken(auth, firebaseToken);
}
