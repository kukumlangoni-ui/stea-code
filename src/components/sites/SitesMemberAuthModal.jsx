/**
 * SitesMemberAuthModal — Premium Authentication Modal for STEA
 *
 * Lazy-loaded. Zero impact on public critical bundle.
 *
 * Supports:
 *  - Continue with Google (popup preferred, redirect fallback)
 *  - Continue with Email (sign in / register / forgot password)
 *  - Creates user profile in Firestore users/{uid} with role:"member"
 *  - Dark glass STEA design
 */
import { memo, useCallback, useEffect, useState } from "react";
import { X, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { TOKENS } from "./tokens.js";


function SitesMemberAuthModal({ open = true, onClose, onUser }) {
  const [mounted, setMounted] = useState(Boolean(open));
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState("login"); // login | register | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!open) {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 180);
      return () => clearTimeout(timer);
    }
    setMounted(true);
    setError("");
    setSuccess("");
    const r = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(r);
  }, [open]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setMounted(false);
      onClose && onClose();
    }, 180);
  }, [onClose]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e) => { if (e.key === "Escape" && !loading) handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, loading, handleClose]);

  // Capture Google Redirect Result if browser returned from signInWithRedirect
  useEffect(() => {
    let active = true;
    const captureRedirect = async () => {
      try {
        const { getFirebaseAuth, getRedirectResult } = await import("../../firebase.js");
        const auth = getFirebaseAuth();
        if (!auth) return;
        const result = await getRedirectResult(auth);
        if (result && result.user && active) {
          await saveUserProfile(result.user, result.user.displayName, "google");
          handleClose();
        }
      } catch (err) {
        console.warn("Redirect result error:", err);
        if (active) setError(getErrorMsg(err));
      }
    };
    captureRedirect();
    return () => {
      active = false;
    };
  }, [handleClose]);

  const getErrorMsg = (err) => {
    if (!err) return "Something went wrong. Please try again.";
    const code = err?.code || "";
    const map = {
      "auth/popup-blocked": "Your browser blocked the login popup. Redirecting to Google to sign in...",
      "auth/invalid-credential": "Email or password is incorrect. Please double-check your credentials.",
      "auth/email-already-in-use": "This email is already registered. Please sign in instead.",
      "auth/wrong-password": "Incorrect password. Please try again or reset your password.",
      "auth/user-not-found": "No account found with this email. Please register.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/weak-password": "Password must be at least 6 characters long.",
      "auth/network-request-failed": "Network error. Please check your internet connection.",
      "auth/too-many-requests": "Too many attempts. Please wait a moment before trying again.",
      "auth/popup-closed-by-user": "Google sign-in window was closed.",
      "auth/cancelled-popup-request": "Sign-in request was cancelled.",
      "auth/user-disabled": "This user account has been disabled.",
      "auth/requires-recent-login": "Please log in again to continue.",
      "auth/unauthorized-domain": "This domain is not authorized for sign in.",
      "auth/operation-not-allowed": "This sign-in provider is not enabled in Firebase.",
    };
    if (map[code]) return map[code];

    if (typeof err?.message === "string") {
      const clean = err.message
        .replace(/^Firebase:\s*(?:Error\s*)?(?:\([^)]+\)\s*:?)?/i, "")
        .replace(/\(auth\/[a-z0-9-]+\)\.?/i, "")
        .trim();
      if (clean) return clean;
    }
    return "Something went wrong. Please try again.";
  };

  const saveUserProfile = async (user, displayName, provider) => {
    try {
      const { getFirebaseDb, doc, getDoc, setDoc, serverTimestamp, isAdminEmail } = await import("../../firebase.js");
      const db = getFirebaseDb();
      if (!db) return;
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          uid: user.uid,
          name: displayName || user.displayName || "",
          email: user.email || "",
          role: "member",
          provider,
          photoURL: user.photoURL || "",
          createdAt: serverTimestamp(),
          source: "stea_sites",
        });
      }
      const data = snap.exists() ? snap.data() : {};
      const role = isAdminEmail(user.email) ? "super_admin" : (data.role || "member");
      if (onUser) onUser({ uid: user.uid, email: user.email, displayName: displayName || user.displayName, photoURL: user.photoURL, role });
    } catch (e) {
      console.error("Failed to save user profile:", e);
    }
  };

  const handleGoogle = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const { getFirebaseAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect } = await import("../../firebase.js");
      const auth = getFirebaseAuth();
      if (!auth) {
        setError("Firebase authentication is currently unavailable. Please try again later.");
        setLoading(false);
        return;
      }
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      try {
        const result = await signInWithPopup(auth, provider);
        await saveUserProfile(result.user, result.user.displayName, "google");
        handleClose();
      } catch (popupErr) {
        const code = popupErr?.code || "";
        if (code === "auth/popup-blocked") {
          setError("Your browser blocked the login popup. Redirecting to Google to sign in...");
          setTimeout(async () => {
            try {
              await signInWithRedirect(auth, provider);
            } catch (redirErr) {
              setError(getErrorMsg(redirErr));
              setLoading(false);
            }
          }, 600);
          return;
        }
        throw popupErr;
      }
    } catch (e) {
      setError(getErrorMsg(e));
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim()) { setError("Please enter your email."); return; }
    if (!password) { setError("Please enter your password."); return; }
    if (mode === "register") {
      if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
      if (password !== confirmPw) { setError("Passwords do not match."); return; }
    }
    setLoading(true); setError("");
    try {
      const { getFirebaseAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import("../../firebase.js");
      const auth = getFirebaseAuth();
      if (!auth) { setError("Firebase not available."); return; }
      let result;
      if (mode === "login") {
        result = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      } else {
        result = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      }
      await saveUserProfile(result.user, name || result.user.displayName, "email");
      handleClose();
    } catch (e) {
      setError(getErrorMsg(e));
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) { setError("Please enter your email to reset password."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const { getFirebaseAuth, sendPasswordResetEmail } = await import("../../firebase.js");
      const auth = getFirebaseAuth();
      if (!auth) { setError("Firebase not available."); return; }
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      setSuccess("Password reset link sent to your email!");
    } catch (e) {
      setError(getErrorMsg(e));
    } finally { setLoading(false); }
  };

  const switchMode = (m) => { setMode(m); setError(""); setSuccess(""); };

  if (!mounted) return null;

  const inputStyle = {
    width: "100%", height: 48, borderRadius: 10,
    border: `1px solid ${TOKENS.gold}`, background: TOKENS.panel2,
    color: TOKENS.text, padding: "0 14px",
    outline: "none", fontFamily: "inherit", fontSize: 14,
    boxSizing: "border-box", transition: "all 0.15s ease",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sites-auth-title"
      style={{
        position: "fixed", inset: 0, zIndex: 10001,
        background: "rgba(5,7,11,.72)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        display: "grid", placeItems: "center", padding: 16,
        opacity: visible ? 1 : 0,
        transition: "opacity 180ms ease",
        pointerEvents: visible ? "auto" : "none",
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div style={{
        position: "relative",
        width: "min(420px, 100%)",
        background: `radial-gradient(circle at 50% 0%, rgba(245,166,35,.08), transparent 50%), ${TOKENS.surface}`,
        border: `1px solid ${TOKENS.border}`,
        borderRadius: TOKENS.radiusLg,
        padding: "32px 26px 24px",
        boxShadow: "0 30px 80px rgba(0,0,0,.55)",
        transform: visible ? "translateY(0)" : "translateY(10px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 180ms ease, transform 180ms ease",
        maxHeight: "calc(100vh - 32px)",
        overflowY: "auto",
      }}>
        {/* Close */}
        <button
          type="button"
          onClick={handleClose}
          style={{
            position: "absolute", top: 14, right: 14,
            width: 32, height: 32, borderRadius: "50%",
            border: `1px solid ${TOKENS.border}`,
            background: TOKENS.panel2, color: TOKENS.text2,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{
            width: 56, height: 56, margin: "0 auto 12px",
            display: "flex", alignItems: "center", justifyContent: "center",
            filter: "drop-shadow(0 4px 18px rgba(245, 166, 35, 0.4))",
          }}>
            <img
              src="/stea-www-globe.png"
              alt="STEA logo"
              style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 12 }}
              width="56"
              height="56"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <h2 id="sites-auth-title" style={{
            margin: "0 0 4px", fontSize: 22, fontWeight: 900,
            color: TOKENS.text, letterSpacing: "-0.02em",
          }}>
            {mode === "forgot" ? "Reset Password" : mode === "register" ? "Create Account" : "Welcome Back"}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: TOKENS.text2, fontWeight: 600 }}>
            STEA <span style={{ color: TOKENS.gold }}>Sites</span>
          </p>
        </div>

        {/* Tabs */}
        {mode !== "forgot" && (
          <div style={{ display: "flex", borderBottom: `1px solid ${TOKENS.border}`, marginBottom: 18 }}>
            {["login", "register"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                style={{
                  flex: 1, background: "none", border: "none",
                  borderBottom: mode === m ? `2px solid ${TOKENS.gold}` : "2px solid transparent",
                  color: mode === m ? TOKENS.gold : TOKENS.text3,
                  fontWeight: 700, fontSize: 13.5, padding: "10px 0",
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        {error && (
          <div style={{
            marginBottom: 14, padding: "10px 12px", borderRadius: 10,
            border: "1px solid rgba(229,101,101,.3)",
            background: "rgba(229,101,101,.1)",
            color: TOKENS.danger, fontSize: 12.5, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div style={{
            marginBottom: 14, padding: "10px 12px", borderRadius: 10,
            border: "1px solid rgba(86,194,138,.3)",
            background: "rgba(86,194,138,.1)",
            color: TOKENS.success, fontSize: 12.5, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <CheckCircle size={15} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {mode === "forgot" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: TOKENS.text }}>Email</label>
              <input
                type="email" placeholder="your@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = TOKENS.gold; e.target.style.background = TOKENS.hover; }}
                onBlur={(e) => { e.target.style.borderColor = TOKENS.gold; e.target.style.background = TOKENS.panel2; }}
              />
            </div>
            <button
              type="button" onClick={handleForgotPassword} disabled={loading}
              style={{
                width: "100%", height: 48, borderRadius: 12, border: 0,
                background: `linear-gradient(180deg, ${TOKENS.goldHi}, ${TOKENS.gold})`,
                color: "#111", fontFamily: "inherit", fontSize: 14, fontWeight: 900,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <button
              type="button" onClick={() => switchMode("login")}
              style={{
                background: "none", border: "none", color: TOKENS.goldHi,
                fontFamily: "inherit", fontSize: 13, fontWeight: 700,
                cursor: "pointer", padding: "8px 0",
              }}
            >
              ← Back to Sign In
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Google */}
            <button
              type="button" onClick={handleGoogle} disabled={loading}
              style={{
                width: "100%", height: 48, borderRadius: 10,
                border: `1px solid ${TOKENS.gold}`, background: TOKENS.panel2,
                color: TOKENS.text, fontSize: 14, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 10, fontFamily: "inherit",
                opacity: loading ? 0.6 : 1,
                transition: "background 0.15s",
              }}
            >
              {loading ? (
                <span>Connecting to Google…</span>
              ) : (
                <>
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    width={18} height={18} alt=""
                  />
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <div style={{ display: "flex", alignItems: "center", margin: "2px 0" }}>
              <div style={{ flex: 1, height: 1, background: TOKENS.border }} />
              <span style={{ padding: "0 10px", fontSize: 12, color: TOKENS.text3 }}>or</span>
              <div style={{ flex: 1, height: 1, background: TOKENS.border }} />
            </div>

            {/* Name (register only) */}
            {mode === "register" && (
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: TOKENS.text }}>Full Name</label>
                <input
                  type="text" placeholder="Your full name" value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = TOKENS.gold; e.target.style.background = TOKENS.hover; }}
                  onBlur={(e) => { e.target.style.borderColor = TOKENS.gold; e.target.style.background = TOKENS.panel2; }}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: TOKENS.text }}>Email</label>
              <input
                type="email" placeholder="your@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = TOKENS.gold; e.target.style.background = TOKENS.hover; }}
                onBlur={(e) => { e.target.style.borderColor = TOKENS.gold; e.target.style.background = TOKENS.panel2; }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: TOKENS.text }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"} placeholder="Password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 42 }}
                  onFocus={(e) => { e.target.style.borderColor = TOKENS.gold; e.target.style.background = TOKENS.hover; }}
                  onBlur={(e) => { e.target.style.borderColor = TOKENS.gold; e.target.style.background = TOKENS.panel2; }}
                  onKeyDown={(e) => { if (e.key === "Enter" && mode === "login") handleEmailAuth(); }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: TOKENS.text3,
                    cursor: "pointer", padding: 6, display: "flex",
                  }}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password (register only) */}
            {mode === "register" && (
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: TOKENS.text }}>Confirm Password</label>
                <input
                  type="password" placeholder="Confirm password" value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = TOKENS.gold; e.target.style.background = TOKENS.hover; }}
                  onBlur={(e) => { e.target.style.borderColor = TOKENS.gold; e.target.style.background = TOKENS.panel2; }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleEmailAuth(); }}
                />
              </div>
            )}

            {/* Forgot password link */}
            {mode === "login" && (
              <button
                type="button" onClick={() => switchMode("forgot")}
                style={{
                  background: "none", border: "none", color: TOKENS.text3,
                  fontFamily: "inherit", fontSize: 12.5, fontWeight: 600,
                  cursor: "pointer", textAlign: "right", padding: "0 2px",
                  alignSelf: "flex-end",
                }}
              >
                Forgot password?
              </button>
            )}

            {/* Submit */}
            <button
              type="button" onClick={handleEmailAuth} disabled={loading}
              style={{
                width: "100%", height: 48, borderRadius: 12, border: 0,
                background: `linear-gradient(180deg, ${TOKENS.goldHi}, ${TOKENS.gold})`,
                color: "#111", fontFamily: "inherit", fontSize: 14, fontWeight: 900,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                boxShadow: "0 8px 24px rgba(245,166,35,.2)",
                transition: "transform 0.12s ease, filter 0.12s ease",
              }}
            >
              {loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(SitesMemberAuthModal);
