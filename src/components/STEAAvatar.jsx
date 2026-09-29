import { useEffect, useMemo, useState } from "react";
import { auth } from "../firebase.js";

const SIZES = { xs: 28, sm: 36, md: 44, lg: 64, xl: 90 };
const cacheKey = (id) => `stea_avatar_url_${id || "guest"}`;

function getAvatarInitials(user) {
  const value = user?.displayName || user?.fullName || user?.name || user?.email || "STEA";
  const parts = String(value).trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0]?.slice(0, 2) || "S").toUpperCase();
}

/**
 * The single avatar primitive for STEA. Pass `user` for public profiles or omit it
 * to resolve the authenticated user's profile from Firebase auth state.
 */
export default function STEAAvatar({ user: suppliedUser, size = "sm", alt, className = "", style = {}, title }) {
  const user = suppliedUser || auth.currentUser;
  const dimension = SIZES[size] || SIZES.sm;
  const source = user?.photoURL || user?.profileImage || user?.sellerProfileImage || "";
  const identity = user?.uid || user?.id || user?.email || source;
  const [imageSrc, setImageSrc] = useState("");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setReady(false); setFailed(false);
    const cached = typeof window !== "undefined" ? localStorage.getItem(cacheKey(identity)) : "";
    const nextSource = source || cached || "";
    if (!nextSource) { setImageSrc(""); setReady(true); return undefined; }
    const preload = new Image();
    preload.src = nextSource;
    preload.onload = () => {
      if (!active) return;
      if (typeof window !== "undefined" && identity) localStorage.setItem(cacheKey(identity), nextSource);
      setImageSrc(nextSource); setReady(true);
    };
    preload.onerror = () => { if (active) { setImageSrc(""); setFailed(true); setReady(true); } };
    return () => { active = false; };
  }, [identity, source]);

  const initials = useMemo(() => getAvatarInitials(user), [user]);
  const waiting = false;
  const base = {
    width: dimension, height: dimension, minWidth: dimension, minHeight: dimension,
    borderRadius: "50%", overflow: "hidden", position: "relative", display: "grid",
    placeItems: "center", border: "2px solid rgba(212,175,55,.72)",
    background: "linear-gradient(135deg, #FFF8E1, #F4E2A0)", color: "#765700",
    fontSize: Math.max(10, Math.round(dimension * .31)), fontWeight: 900, letterSpacing: ".02em",
    boxShadow: "0 3px 10px rgba(212,175,55,.18)", flexShrink: 0, ...style,
  };
  return <div className={className} style={base} title={title} aria-label={alt || "STEA profile avatar"}>
    {(waiting || !ready) && <span aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,#F7E9BA 25%,#FFF9E8 50%,#F7E9BA 75%)", backgroundSize: "200% 100%", animation: "stea-avatar-shimmer 1.2s infinite" }} />}
    {imageSrc && !failed ? <img src={imageSrc} alt={alt || ""} referrerPolicy="no-referrer" onError={() => { setFailed(true); setImageSrc(""); }} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: ready ? 1 : 0, transition: "opacity .18s ease" }} /> : ready && <span aria-hidden="true">{initials}</span>}
    <style>{`@keyframes stea-avatar-shimmer{to{background-position:-200% 0}}`}</style>
  </div>;
}
