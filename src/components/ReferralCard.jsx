import { useMemo, useState } from "react";
import { Check, Copy, Facebook, MessageCircle, Send, Share2, Trophy, Users } from "lucide-react";
import { motion } from "motion/react";
import { referralLink, REFERRAL_BADGES } from "../services/referralService.js";

const GOLD = "#D4AF37";

function ShareButton({ label, icon: Icon, onClick, color }) {
  return <button type="button" onClick={onClick} aria-label={`Share to ${label}`} style={{ flex: 1, minWidth: 64, border: "1px solid #E5E7EB", background: "#fff", borderRadius: 14, padding: "10px 6px", color, cursor: "pointer", fontWeight: 800, fontSize: 10 }}>
    <Icon size={18} style={{ display: "block", margin: "0 auto 5px" }} />{label}
  </button>;
}

export default function ReferralCard({ profile, compact = false, onViewLeaderboard }) {
  const [copied, setCopied] = useState(false);
  const code = profile?.referralCode || "";
  const link = useMemo(() => referralLink(code), [code]);
  const count = profile?.referralCount || 0;
  const points = profile?.referralPoints || 0;
  const message = `Join me on STEA — a community built for learning, opportunity and growth. Use my invite link: ${link}`;
  const share = (network) => {
    const url = encodeURIComponent(link); const text = encodeURIComponent(message);
    const urls = {
      WhatsApp: `https://wa.me/?text=${text}`,
      Telegram: `https://t.me/share/url?url=${url}&text=${encodeURIComponent("Join me on STEA")}`,
      Facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      X: `https://twitter.com/intent/tweet?text=${text}`,
    };
    window.open(urls[network], "_blank", "noopener,noreferrer");
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); } catch { const input = document.createElement("input"); input.value = link; document.body.appendChild(input); input.select(); document.execCommand("copy"); input.remove(); }
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };

  return <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 180, damping: 22 }} style={{ borderRadius: 24, padding: compact ? 18 : 22, background: "linear-gradient(135deg, #111827 0%, #30260a 100%)", color: "#fff", boxShadow: "0 18px 36px rgba(17,24,39,.15)", overflow: "hidden", position: "relative" }}>
    <div style={{ position: "absolute", width: 150, height: 150, right: -50, top: -70, borderRadius: "50%", background: "rgba(212,175,55,.18)" }} />
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div><div style={{ color: "#F2D675", fontSize: 11, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" }}>STEA referral program</div><h2 style={{ margin: "5px 0 0", fontSize: compact ? 19 : 23, letterSpacing: "-.03em" }}>Grow STEA. Earn rewards.</h2></div>
        <div style={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 14, background: "rgba(212,175,55,.18)", color: "#F2D675" }}><Share2 size={21} /></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "18px 0" }}>
        <div style={{ borderRadius: 16, padding: 12, background: "rgba(255,255,255,.09)" }}><Users size={16} color="#F2D675" /><strong style={{ display: "block", fontSize: 22, marginTop: 5 }}>{count}</strong><span style={{ color: "rgba(255,255,255,.7)", fontSize: 11, fontWeight: 700 }}>Total invites</span></div>
        <div style={{ borderRadius: 16, padding: 12, background: "rgba(255,255,255,.09)" }}><Trophy size={16} color="#F2D675" /><strong style={{ display: "block", fontSize: 22, marginTop: 5 }}>{points}</strong><span style={{ color: "rgba(255,255,255,.7)", fontSize: 11, fontWeight: 700 }}>Points earned</span></div>
      </div>

      <div style={{ marginBottom: 12 }}><span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.65)" }}>YOUR REFERRAL CODE</span><div style={{ marginTop: 5, padding: "10px 12px", borderRadius: 12, border: "1px dashed rgba(242,214,117,.7)", color: "#F2D675", fontWeight: 900, letterSpacing: ".08em" }}>{code || "Preparing your code…"}</div></div>
      {!compact && <><div style={{ display: "flex", gap: 8, alignItems: "center", padding: 7, borderRadius: 14, background: "#fff", marginBottom: 12 }}><span style={{ flex: 1, minWidth: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", color: "#4B5563", fontSize: 12, paddingLeft: 5 }}>{link}</span><button type="button" onClick={copy} disabled={!code} style={{ border: 0, padding: "9px 11px", borderRadius: 10, background: GOLD, color: "#1F2937", cursor: "pointer", fontWeight: 900, display: "flex", gap: 5, alignItems: "center" }}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy"}</button></div>
      <div style={{ display: "flex", gap: 8 }}><ShareButton label="WhatsApp" icon={MessageCircle} color="#25D366" onClick={() => share("WhatsApp")} /><ShareButton label="Telegram" icon={Send} color="#229ED9" onClick={() => share("Telegram")} /><ShareButton label="Facebook" icon={Facebook} color="#1877F2" onClick={() => share("Facebook")} /><ShareButton label="X" icon={() => <span style={{ fontSize: 18, lineHeight: 1 }}>𝕏</span>} color="#111827" onClick={() => share("X")} /></div></>}
      {compact && <button type="button" onClick={copy} disabled={!code} style={{ width: "100%", padding: 11, border: 0, borderRadius: 12, cursor: "pointer", background: GOLD, color: "#1F2937", fontWeight: 900 }}>{copied ? "Invite link copied" : "Copy invite link"}</button>}
      {!compact && <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 15 }}>{REFERRAL_BADGES.map((badge) => <span key={badge.id} style={{ padding: "5px 8px", borderRadius: 999, fontSize: 10, fontWeight: 800, background: count >= badge.threshold ? "rgba(212,175,55,.2)" : "rgba(255,255,255,.07)", color: count >= badge.threshold ? "#F2D675" : "rgba(255,255,255,.55)" }}>{badge.icon} {badge.threshold} · {badge.name}</span>)}</div>}
      {onViewLeaderboard && <button type="button" onClick={onViewLeaderboard} style={{ marginTop: 16, padding: 0, border: 0, background: "transparent", color: "#F2D675", fontWeight: 800, cursor: "pointer" }}>View referral leaderboard →</button>}
    </div>
  </motion.section>;
}
