import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Gift, Users } from "lucide-react";
import { db, doc, getDoc, onSnapshot } from "../firebase.js";
import { useAuth } from "../hooks/useAuth.js";
import { ensureReferralProfile, REFERRAL_BADGES, trackReferralVisit } from "../services/referralService.js";
import ReferralCard from "../components/ReferralCard.jsx";
import STEAHeader from "../components/shared/STEAHeader.jsx";

export default function ReferralsPage() {
  const navigate = useNavigate(); const { user, loading: authLoading } = useAuth(); const [profile, setProfile] = useState(null);
  useEffect(() => { trackReferralVisit(); }, []);
  useEffect(() => { if (!authLoading && !user) navigate("/?auth=true", { replace: true }); }, [authLoading, user, navigate]);
  useEffect(() => { if (!user?.uid) return; const uid = user.uid; let unsub; (async () => { await ensureReferralProfile({ uid }); unsub = onSnapshot(doc(db, "users", uid), (snap) => setProfile({ uid, ...snap.data() })); })().catch(console.error); return () => unsub?.(); }, [user?.uid]);
  if (authLoading || !user || !profile) return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#6B7280" }}>Preparing your referral hub…</div>;
  const invites = profile.referralCount || 0;
  return <div style={{ minHeight: "100vh", background: "#FAFAFA", paddingBottom: 90 }}><STEAHeader title="Invite & Earn" user={user} /><main style={{ maxWidth: 560, margin: "0 auto", padding: "16px" }}>
    <button type="button" onClick={() => navigate(-1)} style={{ border: 0, background: "transparent", color: "#6B7280", display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontWeight: 800, marginBottom: 16 }}><ArrowLeft size={16} /> Back</button>
    <ReferralCard profile={profile} onViewLeaderboard={() => navigate("/leaderboard?tab=referrals")} />
    <section style={{ marginTop: 18, padding: 18, border: "1px solid #E5E7EB", borderRadius: 20, background: "#fff" }}><div style={{ display: "flex", gap: 10, alignItems: "center" }}><div style={{ padding: 10, borderRadius: 12, background: "#FFF8E1", color: "#9A7700" }}><Gift size={20} /></div><div><h2 style={{ margin: 0, fontSize: 17 }}>Your rewards</h2><p style={{ margin: "3px 0 0", fontSize: 12, color: "#6B7280" }}>Every completed invite earns 50 STEA points.</p></div></div><div style={{ marginTop: 16, display: "grid", gap: 10 }}>{REFERRAL_BADGES.map((badge) => { const unlocked = invites >= badge.threshold; return <div key={badge.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", padding: 11, borderRadius: 12, background: unlocked ? "#FFFCF3" : "#F9FAFB", color: unlocked ? "#6C5200" : "#6B7280" }}><span>{badge.icon} <strong>{badge.name}</strong> <small>at {badge.threshold} invites</small></span>{unlocked ? <CheckCircle2 size={18} color="#B08813" /> : <span style={{ fontSize: 11, fontWeight: 800 }}>{Math.max(0, badge.threshold - invites)} to go</span>}</div>; })}</div></section>
    <section style={{ marginTop: 18, padding: 18, borderRadius: 20, background: "#fff", border: "1px solid #E5E7EB" }}><Users size={20} color="#D4AF37" /><h2 style={{ fontSize: 17, margin: "8px 0 4px" }}>How it works</h2><p style={{ margin: 0, color: "#6B7280", fontSize: 13, lineHeight: 1.55 }}>Share your unique link. When a new member creates an account through it, the invite is confirmed and you receive 50 points.</p></section>
  </main></div>;
}
