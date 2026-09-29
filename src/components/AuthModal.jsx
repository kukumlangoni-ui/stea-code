import React, { useState } from "react";
import { motion } from "motion/react";
import { X, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import {
  getFirebaseAuth,
  getFirebaseDb,
  GoogleAuthProvider,
  isAdminEmail,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  normalizeEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail
} from "../firebase.js";
import { Portal } from "./ui/LayoutUtils.jsx";
import { useMobile } from "../hooks/useMobile.js";
import { useSettings } from "../contexts/SettingsContext.jsx";
import { applyPendingReferral } from "../services/referralService.js";

const G = '#F5A623';
const GOLD = '#D4AF37';
const AUTH_PANEL = "rgba(12,17,28,.96)";
const AUTH_FIELD = "rgba(255,255,255,.055)";
const AUTH_FIELD_ACTIVE = "rgba(255,255,255,.085)";
const AUTH_BORDER = "rgba(255,255,255,.13)";
const AUTH_TEXT = "#ffffff";
const AUTH_MUTED = "rgba(255,255,255,.66)";
const AUTH_SOFT = "rgba(255,255,255,.48)";

const TRANSLATIONS = {
  en: {
    welcomeBack: "Welcome back",
    createAccount: "Create your STEA account",
    continueTo: "Continue to STEA",
    login: "Login",
    register: "Register",
    email: "Email",
    phone: "Phone",
    emailPlaceholder: "Email address",
    phonePlaceholder: "Phone number (e.g. 0712345678)",
    fullNamePlaceholder: "Full Name",
    passwordPlaceholder: "Password",
    confirmPasswordPlaceholder: "Confirm Password",
    continueWithGoogle: "Continue with Google",
    or: "or",
    signInBtn: "Sign In",
    registerBtn: "Create Account",
    forgotPassword: "Forgot password?",
    backToLogin: "← Back to Login",
    sendResetLink: "Send Reset Link",
    emailPhoneRequired: "Please enter your email or phone number.",
    passwordRequired: "Please enter your password.",
    passwordsMismatch: "Passwords do not match.",
    passwordLength: "Password must be at least 6 characters.",
    resetSuccess: "✅ Password reset link sent to your email!",
    firebaseError: "⚠️ Firebase configuration error."
  },
  sw: {
    welcomeBack: "Karibu tena",
    createAccount: "Unda akaunti yako ya STEA",
    continueTo: "Endelea na STEA",
    login: "Ingia",
    register: "Jisajili",
    email: "Email",
    phone: "Simu",
    emailPlaceholder: "Barua pepe (Email)",
    phonePlaceholder: "Namba ya simu (Mfano: 0712345678)",
    fullNamePlaceholder: "Jina Kamili",
    passwordPlaceholder: "Nenosiri (Password)",
    confirmPasswordPlaceholder: "Thibitisha Nenosiri",
    continueWithGoogle: "Endelea na Google",
    or: "au",
    signInBtn: "Ingia Sasa",
    registerBtn: "Fungua Akaunti",
    forgotPassword: "Umesahau nenosiri?",
    backToLogin: "← Rudi kwenye Ingia",
    sendResetLink: "Tuma Link ya Reset",
    emailPhoneRequired: "Weka barua pepe au namba ya simu.",
    passwordRequired: "Weka nenosiri lako.",
    passwordsMismatch: "Nenosiri hazifanani.",
    passwordLength: "Nenosiri liwe na herufi 6 au zaidi.",
    resetSuccess: "✅ Link ya kurekebisha nenosiri imetumwa!",
    firebaseError: "⚠️ Firebase haijasanidiwa."
  },
  zh: {
    welcomeBack: "欢迎回来",
    createAccount: "创建您的 STEA 帐户",
    continueTo: "继续前往 STEA",
    login: "登录",
    register: "注册",
    email: "电子邮箱",
    phone: "手机号码",
    emailPlaceholder: "电子邮箱地址",
    phonePlaceholder: "手机号码（例如 0712345678）",
    fullNamePlaceholder: "全名",
    passwordPlaceholder: "密码",
    confirmPasswordPlaceholder: "确认密码",
    continueWithGoogle: "使用 Google 继续",
    or: "或",
    signInBtn: "登录",
    registerBtn: "创建帐户",
    forgotPassword: "忘记密码？",
    backToLogin: "← 返回登录",
    sendResetLink: "发送重置链接",
    emailPhoneRequired: "请输入邮箱或手机号码。",
    passwordRequired: "请输入密码。",
    passwordsMismatch: "密码不匹配。",
    passwordLength: "密码长度必须至少为 6 个字符。",
    resetSuccess: "✅ 密码重置链接已发送到您的邮箱！",
    firebaseError: "⚠️ Firebase 未配置。"
  }
};

export function AuthModal({ onClose, onUser, selectedClassroomRole = null, classroomMode = false }) {
  const isMobile = useMobile();
  const { language, setLanguage } = useSettings();

  const [mode, setMode] = useState("login"); // 'login' | 'register' | 'forgot'
  const [method, setMethod] = useState("email"); // 'email' | 'phone'

  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); // Stores either email or phone input
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [countryCode, setCountryCode] = useState("+255");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const t = (key) => {
    const lang = language === 'zh' ? 'zh' : (language === 'sw' ? 'sw' : 'en');
    return TRANSLATIONS[lang][key] || TRANSLATIONS['en'][key] || key;
  };

  const switchTo = (m) => {
    setMode(m);
    setErr("");
  };

  const saveUser = async (user, displayName, provider) => {
    const db = getFirebaseDb();
    if (!db) return;
    try {
      const r = doc(db, "users", user.uid);
      const s = await getDoc(r);
      let data = s.exists() ? s.data() : {};
      let role = isAdminEmail(user.email) ? "admin" : "user";
      if (s.exists() && data.role) {
        if (data.role !== "user" || !isAdminEmail(user.email)) {
          role = data.role;
        }
      }

      if (!s.exists()) {
        data = {
          uid: user.uid,
          name: displayName || user.displayName || "",
          email: user.email,
          role,
          provider,
          createdAt: serverTimestamp()
        };
        if (selectedClassroomRole === 'teacher' || selectedClassroomRole === 'student') {
          data.classroomRole = selectedClassroomRole;
        }
        await setDoc(r, data);
      }

      onUser({
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.displayName,
        photoURL: user.photoURL,
        ...data,
        role: role
      });
    } catch (err) {
      if (import.meta.env.DEV) console.warn("Error saving user:", err);
      onUser({
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.displayName,
        photoURL: user.photoURL,
        role: isAdminEmail(user.email) ? "admin" : "user"
      });
    }
  };

  const doGoogle = async () => {
    const auth = getFirebaseAuth();
    if (!auth) { setErr(t("firebaseError")); return; }
    try {
      setLoading(true); setErr("");
      const res = await signInWithPopup(auth, new GoogleAuthProvider());
      await saveUser(res.user, res.user.displayName, "google");
      await applyPendingReferral(res.user);
      onClose();
    } catch (e) {
      if (import.meta.env.DEV) console.warn("Google Auth error:", e);
      setErr(getAuthErrorMessage(e));
    } finally { setLoading(false); }
  };

  const doEmail = async () => {
    const auth = getFirebaseAuth();
    if (!auth) { setErr(t("firebaseError")); return; }
    if (!email.trim()) { setErr(t("emailPhoneRequired")); return; }
    if (!pw) { setErr(t("passwordRequired")); return; }

    setLoading(true); setErr("");

    let loginIdentifier = email;
    if (method === 'phone') {
      let rawPhone = email.trim();
      if (rawPhone.startsWith('0')) rawPhone = rawPhone.substring(1);
      loginIdentifier = `${countryCode.trim()}${rawPhone}`;
    }
    const normalizedEmail = normalizeEmail(loginIdentifier);

    try {
      if (mode === "login") {
        const res = await signInWithEmailAndPassword(auth, normalizedEmail, pw);
        await saveUser(res.user, res.user.displayName || name, "email");
      } else {
        if (pw !== pw2) { setErr(t("passwordsMismatch")); setLoading(false); return; }
        if (pw.length < 6) { setErr(t("passwordLength")); setLoading(false); return; }
        const res = await createUserWithEmailAndPassword(auth, normalizedEmail, pw);
        await saveUser(res.user, name, "email");
      }
      await applyPendingReferral(res.user);
      onClose();
    } catch (e) {
      if (import.meta.env.DEV) console.warn("Email Auth error:", e);
      setErr(getAuthErrorMessage(e));
    } finally { setLoading(false); }
  };

  const doForgot = async () => {
    const auth = getFirebaseAuth();
    if (!auth) { setErr(t("firebaseError")); return; }
    if (!email) { setErr(t("emailPhoneRequired")); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setErr(t("resetSuccess"));
    } catch (e) {
      if (import.meta.env.DEV) console.warn("Reset error:", e);
      setErr(getAuthErrorMessage(e));
    } finally { setLoading(false); }
  };

  function getAuthErrorMessage(error) {
    const code = error?.code;
    const messages = {
      "auth/invalid-credential": t("auth/invalid-credential") || "Email/Phone au password si sahihi.",
      "auth/email-already-in-use": t("auth/email-already-in-use") || "Email/Phone tayari inatumiwa.",
      "auth/wrong-password": t("auth/wrong-password") || "Nenosiri si sahihi.",
      "auth/user-not-found": t("auth/user-not-found") || "Akaunti haikupatikana.",
      "auth/invalid-email": t("auth/invalid-email") || "Barua pepe si sahihi.",
      "auth/weak-password": t("auth/weak-password") || "Nenosiri ni dhaifu.",
      "auth/network-request-failed": t("auth/network-request-failed") || "Network imeharibika.",
      "auth/too-many-requests": t("auth/too-many-requests") || "Umejaribu mara nyingi mno.",
      "auth/popup-closed-by-user": t("auth/popup-closed-by-user") || "Google popup imefungwa.",
      "auth/cancelled-popup-request": t("auth/cancelled-popup-request") || "Google login imefutwa."
    };
    return messages[code] || "Hitilafu imetokea. Tafadhali jaribu tena.";
  }

  const inputStyle = {
    width: "100%",
    height: 48,
    borderRadius: 8,
    border: `1px solid ${AUTH_BORDER}`,
    background: AUTH_FIELD,
    color: AUTH_TEXT,
    padding: "0 14px",
    outline: "none",
    fontFamily: "inherit",
    fontSize: 14,
    boxSizing: "border-box",
    transition: "all 0.2s ease"
  };

  return (
    <Portal>
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: isMobile ? "12px" : "16px",
          background: "rgba(0, 0, 0, 0.68)",
          backdropFilter: "blur(14px)"
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 420,
            background: `radial-gradient(circle at 50% 0%, rgba(245,166,35,.12), transparent 34%), linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.035)), ${AUTH_PANEL}`,
            borderRadius: classroomMode ? 24 : 14,
            border: classroomMode ? `1px solid ${GOLD}55` : `1px solid ${AUTH_BORDER}`,
            boxShadow: "0 28px 90px rgba(0,0,0,.58), inset 0 1px 0 rgba(255,255,255,.10)",
            padding: isMobile ? "26px 18px 22px" : "36px 28px 30px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            maxHeight: "calc(100vh - 32px)",
            overflowY: "auto"
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,.09)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            style={{
              position: "absolute",
              top: isMobile ? 12 : 16,
              right: isMobile ? 12 : 16,
              border: "none",
              background: "none",
              cursor: "pointer",
              color: AUTH_MUTED,
              padding: 6,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.2s"
            }}
          >
            <X size={18} />
          </button>

          {/* Titles */}
          <div style={{ textAlign: "center", marginBottom: isMobile ? 14 : 18 }}>
            <h2 style={{ fontSize: isMobile ? 22 : 25, fontWeight: 800, color: AUTH_TEXT, margin: "0 0 5px", letterSpacing: '-0.03em' }}>
              {classroomMode && mode === "login" ? "Welcome to STEA Classroom" : classroomMode && mode === "register" ? "Create your Classroom account" : mode === "login" ? t("welcomeBack") : mode === "register" ? t("createAccount") : "Reset Password"}
            </h2>
            <p style={{ fontSize: 13, color: AUTH_MUTED, margin: 0, fontWeight: classroomMode ? 600 : 400 }}>
              {classroomMode && mode !== 'forgot' ? 'Learn. Teach. Grow.' : t("continueTo")}
            </p>
          </div>

          {/* Tabs */}
          {mode !== "forgot" && (
            <div style={{ display: "flex", borderBottom: `1px solid ${AUTH_BORDER}`, marginBottom: isMobile ? 14 : 18 }}>
              {["login", "register"].map((m) => (
                <button
                  key={m}
                  onClick={() => switchTo(m)}
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    borderBottom: mode === m ? `2px solid ${G}` : "2px solid transparent",
                    color: mode === m ? G : AUTH_MUTED,
                    fontWeight: 700,
                    fontSize: 14,
                    padding: "10px 0",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {m === "login" ? t("login") : t("register")}
                </button>
              ))}
            </div>
          )}

          {/* Language Switcher (Segmented Control Pill Style) */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: isMobile ? 14 : 18 }}>
            <div style={{
              display: 'inline-flex',
              background: 'rgba(255,255,255,.055)',
              borderRadius: 20,
              padding: 2,
              border: `1px solid ${AUTH_BORDER}`
            }}>
              {[['en', 'EN'], ['sw', 'SW'], ['zh', '中文']].map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  style={{
                    background: language === code ? 'rgba(245,166,35,.18)' : 'transparent',
                    border: 'none',
                    color: language === code ? G : AUTH_MUTED,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '6px 12px',
                    borderRadius: 18,
                    cursor: 'pointer',
                    boxShadow: language === code ? 'inset 0 1px 0 rgba(255,255,255,.12)' : 'none',
                    transition: 'all 0.15s ease-in-out'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {err && (
            <div
              style={{
                marginBottom: 16,
                padding: "10px 12px",
                borderRadius: 8,
                border: `1px solid ${err.startsWith("✅") ? "#e6f4ea" : "#fce8e6"}`,
                background: err.startsWith("✅") ? "#e6f4ea" : "#fce8e6",
                color: err.startsWith("✅") ? "#137333" : "#c5221f",
                fontSize: 12.5,
                fontWeight: 500,
                lineHeight: 1.4,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              {err.startsWith("✅")
                ? <CheckCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                : <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />}
              <span style={{ flex: 1 }}>{err}</span>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 10 : 12 }}>

            {/* Google Login button */}
            {mode !== "forgot" && (
              <button
                onClick={doGoogle}
                disabled={loading}
                style={{
                  width: "100%",
                  height: 48,
                  borderRadius: 8,
                  border: `1px solid ${AUTH_BORDER}`,
                  background: AUTH_FIELD,
                  color: AUTH_TEXT,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  transition: "background-color 0.2s",
                  opacity: loading ? .6 : 1
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = AUTH_FIELD_ACTIVE; }}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = AUTH_FIELD}
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  style={{ width: 18, height: 18 }} alt="Google" />
                {t("continueWithGoogle")}
              </button>
            )}

            {mode !== "forgot" && (
              <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0' }}>
                <div style={{ flex: 1, height: '1px', background: AUTH_BORDER }}></div>
                <span style={{ padding: '0 10px', fontSize: 12, color: AUTH_SOFT }}>{t("or")}</span>
                <div style={{ flex: 1, height: '1px', background: AUTH_BORDER }}></div>
              </div>
            )}

            {/* Email / Phone Inputs */}
            {mode === "register" && (
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: AUTH_TEXT }}>Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(245,166,35,.18)`; e.target.style.background = AUTH_FIELD_ACTIVE; }}
                  onBlur={e => { e.target.style.borderColor = AUTH_BORDER; e.target.style.boxShadow = "none"; e.target.style.background = AUTH_FIELD; }}
                />
              </div>
            )}

            {mode !== "forgot" && (
              <div style={{
                display: 'flex',
                background: 'rgba(255,255,255,.055)',
                borderRadius: 8,
                padding: 3,
                border: `1px solid ${AUTH_BORDER}`,
                marginBottom: 8
              }}>
                <button
                  onClick={() => { setMethod('email'); setEmail(''); }}
                  style={{
                    flex: 1,
                    background: method === 'email' ? 'rgba(245,166,35,.18)' : 'transparent',
                    border: 'none',
                    color: method === 'email' ? G : AUTH_MUTED,
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '8px 0',
                    borderRadius: 6,
                    cursor: 'pointer',
                    boxShadow: method === 'email' ? 'inset 0 1px 0 rgba(255,255,255,.12)' : 'none',
                    transition: 'all 0.15s ease-in-out'
                  }}
                >
                  {t("email")}
                </button>
                <button
                  onClick={() => { setMethod('phone'); setEmail(''); }}
                  style={{
                    flex: 1,
                    background: method === 'phone' ? 'rgba(245,166,35,.18)' : 'transparent',
                    border: 'none',
                    color: method === 'phone' ? G : AUTH_MUTED,
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '8px 0',
                    borderRadius: 6,
                    cursor: 'pointer',
                    boxShadow: method === 'phone' ? 'inset 0 1px 0 rgba(255,255,255,.12)' : 'none',
                    transition: 'all 0.15s ease-in-out'
                  }}
                >
                  {t("phone")}
                </button>
              </div>
            )}

            {method === 'phone' && mode !== 'forgot' ? (
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ width: 100 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: AUTH_TEXT }}>Country Code</label>
                  <input
                    type="text"
                    placeholder="+255"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(245,166,35,.18)`; e.target.style.background = AUTH_FIELD_ACTIVE; }}
                    onBlur={e => { e.target.style.borderColor = AUTH_BORDER; e.target.style.boxShadow = "none"; e.target.style.background = AUTH_FIELD; }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: AUTH_TEXT }}>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(245,166,35,.18)`; e.target.style.background = AUTH_FIELD_ACTIVE; }}
                    onBlur={e => { e.target.style.borderColor = AUTH_BORDER; e.target.style.boxShadow = "none"; e.target.style.background = AUTH_FIELD; }}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: AUTH_TEXT }}>Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(245,166,35,.18)`; e.target.style.background = AUTH_FIELD_ACTIVE; }}
                  onBlur={e => { e.target.style.borderColor = AUTH_BORDER; e.target.style.boxShadow = "none"; e.target.style.background = AUTH_FIELD; }}
                />
              </div>
            )}

            {mode !== "forgot" && (
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: AUTH_TEXT }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="Enter your password"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    style={{ ...inputStyle, paddingRight: 40 }}
                    onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(245,166,35,.18)`; e.target.style.background = AUTH_FIELD_ACTIVE; }}
                    onBlur={e => { e.target.style.borderColor = AUTH_BORDER; e.target.style.boxShadow = "none"; e.target.style.background = AUTH_FIELD; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: AUTH_MUTED, padding: 0, display: "flex", alignItems: "center" }}
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {mode === "register" && (
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: AUTH_TEXT }}>Confirm Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={pw2}
                    onChange={(e) => setPw2(e.target.value)}
                    style={{ ...inputStyle, paddingRight: 40 }}
                    onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(245,166,35,.18)`; e.target.style.background = AUTH_FIELD_ACTIVE; }}
                    onBlur={e => { e.target.style.borderColor = AUTH_BORDER; e.target.style.boxShadow = "none"; e.target.style.background = AUTH_FIELD; }}
                  />
                </div>
              </div>
            )}

            {mode === "login" && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: G }}
                  />
                  <label htmlFor="rememberMe" style={{ fontSize: 13, color: AUTH_MUTED, cursor: "pointer", userSelect: "none", fontWeight: 500 }}>
                    Remember me
                  </label>
                </div>
                <button
                  onClick={() => switchTo("forgot")}
                  style={{
                    background: "none",
                    border: "none",
                    color: G,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Primary Submit Button */}
            <button
              onClick={mode === "forgot" ? doForgot : doEmail}
              disabled={loading}
              style={{
                width: "100%",
                height: 48,
                borderRadius: 8,
                border: "none",
                background: `linear-gradient(135deg, ${G}, #FFD17C)`,
                color: "#111827",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: 8,
                transition: "background-color 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.05)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'none'}
            >
              {loading ? "Please wait..." : mode === "login" ? t("signInBtn") : mode === "register" ? t("registerBtn") : t("sendResetLink")}
            </button>

            <div style={{ textAlign: "center", paddingTop: 8 }}>
              {mode === "forgot" ? (
                <button
                  onClick={() => switchTo("login")}
                  style={{
                    background: "none",
                    border: "none",
                    color: G,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {t("backToLogin")}
                </button>
              ) : null}
            </div>
          </div>
        </motion.div>
      </div>
    </Portal>
  );
}
