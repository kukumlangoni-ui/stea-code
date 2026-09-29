import {
  db, doc, getDoc, setDoc, addDoc, collection, runTransaction,
  serverTimestamp, increment, arrayUnion,
} from "../firebase.js";

export const REFERRAL_REWARD = 50;
export const REFERRAL_BADGES = [
  { id: "community_builder", name: "Community Builder", icon: "🌱", threshold: 5 },
  { id: "ambassador", name: "Ambassador", icon: "🤝", threshold: 25 },
  { id: "legend", name: "Legend", icon: "👑", threshold: 100 },
];

const normalizeCode = (code) => String(code || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

const makeCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const random = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `STEA-${random}`;
};

export async function ensureReferralProfile(user) {
  if (!user?.uid) return null;
  const userRef = doc(db, "users", user.uid);
  const current = await getDoc(userRef);
  if (current.exists() && current.data().referralCode) return current.data().referralCode;

  // A short retry loop makes a code collision practically impossible without relying on an index query.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = makeCode();
    const codeRef = doc(db, "referralCodes", code);
    const created = await runTransaction(db, async (transaction) => {
      const [profile, codeEntry] = await Promise.all([transaction.get(userRef), transaction.get(codeRef)]);
      if (profile.exists() && profile.data().referralCode) return profile.data().referralCode;
      if (codeEntry.exists()) return null;
      transaction.set(codeRef, { ownerId: user.uid, createdAt: serverTimestamp() });
      transaction.set(userRef, {
        referralCode: code,
        referralCount: 0,
        referralPoints: 0,
        referralBadges: [],
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return code;
    });
    if (created) return created;
  }
  throw new Error("Unable to create a unique referral code. Please try again.");
}

export function getReferralCodeFromLocation() {
  if (typeof window === "undefined") return "";
  const code = normalizeCode(new URLSearchParams(window.location.search).get("ref"));
  if (code) sessionStorage.setItem("stea_pending_referral", code);
  return code || normalizeCode(sessionStorage.getItem("stea_pending_referral"));
}

export async function trackReferralVisit() {
  const code = getReferralCodeFromLocation();
  if (!code || typeof window === "undefined") return;
  const key = `stea_referral_visit_${code}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");
  try {
    const codeSnap = await getDoc(doc(db, "referralCodes", code));
    if (!codeSnap.exists()) return;
    await addDoc(collection(db, "referralClicks"), {
      code,
      referrerId: codeSnap.data().ownerId,
      path: window.location.pathname,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // Tracking must never prevent a visitor from using the app.
    console.warn("Referral visit tracking failed", error);
  }
}

export async function applyPendingReferral(user) {
  if (!user?.uid) return false;
  const code = getReferralCodeFromLocation();
  if (!code) return false;

  const inviteeRef = doc(db, "users", user.uid);
  const codeRef = doc(db, "referralCodes", code);
  const referralRef = doc(db, "referrals", user.uid);
  const applied = await runTransaction(db, async (transaction) => {
    const [codeSnap, inviteeSnap, referralSnap] = await Promise.all([
      transaction.get(codeRef), transaction.get(inviteeRef), transaction.get(referralRef),
    ]);
    if (!codeSnap.exists() || referralSnap.exists()) return false;
    const referrerId = codeSnap.data().ownerId;
    if (!referrerId || referrerId === user.uid) return false;

    const referrerRef = doc(db, "users", referrerId);
    const referrerSnap = await transaction.get(referrerRef);
    if (!referrerSnap.exists()) return false;
    const nextCount = (referrerSnap.data().referralCount || 0) + 1;
    const newBadges = REFERRAL_BADGES
      .filter((badge) => nextCount >= badge.threshold)
      .map((badge) => badge.id);

    transaction.set(referralRef, {
      referrerId,
      inviteeId: user.uid,
      referralCode: code,
      status: "completed",
      rewardPoints: REFERRAL_REWARD,
      createdAt: serverTimestamp(),
    });
    transaction.set(inviteeRef, {
      referredBy: referrerId,
      referralCodeUsed: code,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    transaction.update(referrerRef, {
      referralCount: increment(1),
      referralPoints: increment(REFERRAL_REWARD),
      points: increment(REFERRAL_REWARD),
      referralBadges: arrayUnion(...newBadges),
      updatedAt: serverTimestamp(),
    });
    return true;
  });
  if (applied && typeof window !== "undefined") sessionStorage.removeItem("stea_pending_referral");
  return applied;
}

export function referralLink(code) {
  const origin = typeof window === "undefined" ? "https://stea.africa" : window.location.origin;
  return `${origin}/referrals?ref=${encodeURIComponent(code)}`;
}
