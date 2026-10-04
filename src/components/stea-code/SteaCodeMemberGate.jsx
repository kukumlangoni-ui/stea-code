/* =============================================================
 * steacode — Dedicated Member Gate component
 * Dark, premium, developer-focused. SAME Firebase / Google auth.
 * NOT the generic STEA AuthModal visual design.
 * ============================================================= */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X, Loader2 } from "lucide-react";
import {
  GoogleAuthProvider,
  getFirebaseAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "../../firebase.js";
import { sendEmailVerification } from "firebase/auth";
import { useSteaCodeI18n } from "./useSteaCodeI18n.js";
import { touchSteaCodeMemberProfile } from "../../services/steaCodeMemberService.js";
import {
  clearSteaCodePendingAction,
  getSteaCodePendingAction,
  setSteaCodePendingAction,
} from "../../services/steaCodeResumeAction.js";
import { trackUserEvent } from "../../services/analytics.js";
import { getSteaCodeProduct, getSteaCodeProductPreview } from "../../services/steaCodeCommerce.js";
import { fetchEntitlements } from "../../services/steaCodeEntitlements.js";

const I18N = {
  en: {
    title: "Join steacode",
    subtitle: "Save your purchases and access them anywhere.",
    googleButton: "Continue with Google",
    connecting: "Connecting…",
    featureAccount: "Free developer account",
    featureAccess: "Access your purchased code",
    featureSame: "Same STEA account everywhere",
    alreadyMember: "Already a STEA member?",
    sameAccount: "Continue using the same Google account.",
    close: "Close member gate",
    cancelError: "Google sign-in was cancelled.",
    connectError: "We couldn't connect your account. Please try again.",
    providerError: "This Google account could not be used right now.",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "••••••••",
    confirmPasswordLabel: "Confirm password",
    orDivider: "or",
    signInBtn: "Sign in",
    signingIn: "Signing in…",
    signUpBtn: "Create account",
    signingUp: "Creating account…",
    toggleToSignUp: "New to steacode?",
    toggleToSignUpLink: "Create an account",
    toggleToSignIn: "Already have an account?",
    toggleToSignInLink: "Sign in",
    forgotPassword: "Forgot password?",
    resetSent: "Password reset email sent.",
    resetHint: "Enter your email and we'll send you a reset link.",
    emailRequired: "Please enter your email.",
    passwordRequired: "Please enter your password.",
    passwordTooShort: "Password must be at least 6 characters.",
    passwordMismatch: "Passwords do not match.",
    invalidEmail: "That email doesn't look right.",
    wrongPassword: "Wrong email or password.",
    emailInUse: "That email is already registered.",
    weakPassword: "Password is too weak.",
    genericAuthError: "Something went wrong. Please try again.",
  },
  zhCN: {
    title: "加入 steacode",
    subtitle: "保存购买记录，随时随地访问。",
    googleButton: "使用 Google 继续",
    connecting: "正在连接…",
    featureAccount: "免费开发者账户",
    featureAccess: "访问你已购买的代码",
    featureSame: "同一个 STEA 账户，随处使用",
    alreadyMember: "已经是 STEA 成员？",
    sameAccount: "继续使用同一个 Google 账户。",
    close: "关闭会员入口",
    cancelError: "Google 登录已取消。",
    connectError: "我们无法连接你的账户。请重试。",
    providerError: "该 Google 账户暂时无法使用。",
    emailLabel: "邮箱",
    emailPlaceholder: "you@example.com",
    passwordLabel: "密码",
    passwordPlaceholder: "••••••••",
    confirmPasswordLabel: "确认密码",
    orDivider: "或",
    signInBtn: "登录",
    signingIn: "登录中…",
    signUpBtn: "创建账户",
    signingUp: "创建中…",
    toggleToSignUp: "新用户？",
    toggleToSignUpLink: "创建账户",
    toggleToSignIn: "已有账户？",
    toggleToSignInLink: "登录",
    forgotPassword: "忘记密码？",
    resetSent: "密码重置邮件已发送。",
    resetHint: "请输入邮箱，我们会发送重置链接。",
    emailRequired: "请输入邮箱。",
    passwordRequired: "请输入密码。",
    passwordTooShort: "密码至少需要 6 位。",
    passwordMismatch: "两次密码不一致。",
    invalidEmail: "邮箱格式不正确。",
    wrongPassword: "邮箱或密码错误。",
    emailInUse: "该邮箱已注册。",
    weakPassword: "密码强度过低。",
    genericAuthError: "出错了，请重试。",
  },
  sw: {
    title: "Join steacode",
    subtitle: "Save your purchases and access them anywhere.",
    googleButton: "Continue with Google",
    connecting: "Connecting…",
    featureAccount: "Free developer account",
    featureAccess: "Access your purchased code",
    featureSame: "Same STEA account everywhere",
    alreadyMember: "Already a STEA member?",
    sameAccount: "Continue using the same Google account.",
    close: "Close member gate",
    cancelError: "Google sign-in was cancelled.",
    connectError: "We couldn't connect your account. Please try again.",
    providerError: "This Google account could not be used right now.",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "••••••••",
    confirmPasswordLabel: "Confirm password",
    orDivider: "or",
    signInBtn: "Sign in",
    signingIn: "Signing in…",
    signUpBtn: "Create account",
    signingUp: "Creating account…",
    toggleToSignUp: "New to steacode?",
    toggleToSignUpLink: "Create an account",
    toggleToSignIn: "Already have an account?",
    toggleToSignInLink: "Sign in",
    forgotPassword: "Forgot password?",
    resetSent: "Password reset email sent.",
    resetHint: "Enter your email and we'll send you a reset link.",
    emailRequired: "Please enter your email.",
    passwordRequired: "Please enter your password.",
    passwordTooShort: "Password must be at least 6 characters.",
    passwordMismatch: "Passwords do not match.",
    invalidEmail: "That email doesn't look right.",
    wrongPassword: "Wrong email or password.",
    emailInUse: "That email is already registered.",
    weakPassword: "Password is too weak.",
    genericAuthError: "Something went wrong. Please try again.",
  },
};

function tField(uiLocale, key) {
  const locale = uiLocale === "zhCN" ? "zhCN" : uiLocale === "sw" ? "sw" : "en";
  return I18N[locale]?.[key] ?? I18N.en[key] ?? key;
}

function humanAuthError(error, uiLocale) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();
  if (
    code.includes("popup-closed-by-user") ||
    code.includes("cancelled-popup") ||
    code.includes("auth/cancelled") ||
    message.includes("popup closed") ||
    message.includes("closed by user")
  ) {
    return tField(uiLocale, "cancelError");
  }
  if (
    code.includes("network") ||
    code.includes("timeout") ||
    code.includes("unavailable")
  ) {
    return tField(uiLocale, "connectError");
  }
  if (
    code.includes("invalid") ||
    code.includes("disabled") ||
    code.includes("operation-not-allowed") ||
    code.includes("provider") ||
    code.includes("credential")
  ) {
    return tField(uiLocale, "providerError");
  }
  return tField(uiLocale, "connectError");
}

function humanEmailAuthError(error, uiLocale) {
  const code = String(error?.code || "").toLowerCase();
  const map = {
    "auth/invalid-email": "invalidEmail",
    "auth/wrong-password": "wrongPassword",
    "auth/user-not-found": "wrongPassword",
    "auth/invalid-credential": "wrongPassword",
    "auth/email-already-in-use": "emailInUse",
    "auth/weak-password": "weakPassword",
    "auth/too-many-requests": "genericAuthError",
    "auth/network-request-failed": "genericAuthError",
  };
  const key = map[code] || "genericAuthError";
  return tField(uiLocale, key);
}

export default function SteaCodeMemberGate({
  open = false,
  pendingAction = null,
  locale: localeProp,
  onClose,
  onAuthenticated,
}) {
  const { uiLocale: hookLocale } = useSteaCodeI18n();
  const uiLocale = localeProp || hookLocale || "en";

  const [loading, setLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [error, setError] = useState("");

  const [mode, setMode] = useState("signIn"); // "signIn" | "signUp"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);
  const googleBtnRef = useRef(null);

  const resolvedPending = useMemo(() => {
    if (pendingAction) return pendingAction;
    return getSteaCodePendingAction();
  }, [pendingAction, open]);

  useEffect(() => {
    if (open) {
      setError("");
      setEmailError("");
      setResetSuccess(false);
      setShowReset(false);
      if (pendingAction) {
        setSteaCodePendingAction(pendingAction);
      }
    }
  }, [open, pendingAction]);

  // Resume pending action on modal mount if user is authenticated
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.sessionStorage.getItem("stea_pending_action") : null;
      if (!raw) return;
      const pending = JSON.parse(raw);
      const auth = getFirebaseAuth();
      const currentUser = auth?.currentUser;
      if (currentUser && pending && pending.productId) {
        window.sessionStorage.removeItem("stea_pending_action");
        if (pending.type === "download") {
          window.location.href = `/api/stea-code/products/${encodeURIComponent(pending.productId)}/download`;
          void trackUserEvent("download", { productId: pending.productId, email: currentUser?.email || "" });
        } else if (pending.type === "copy-source" || pending.type === "copy-prompt") {
          void (async () => {
            try {
              // Fetch the product to check if it's premium
              const prod = await getSteaCodeProduct(pending.productId);
              const isPremium = String(prod?.pricingType || "").toLowerCase() === "premium";

              // For premium products, verify the user has access before copying
              if (isPremium) {
                const entitlements = await fetchEntitlements();
                const hasProLifetime = entitlements?.hasProLifetime === true;
                const ownsProduct = entitlements?.productIds?.has?.(pending.productId) === true;
                if (!hasProLifetime && !ownsProduct) {
                  // No access — open the unlock modal instead of copying
                  try {
                    sessionStorage.removeItem("stea_pending_action");
                  } catch {
                    /* sessionStorage may be unavailable */
                  }
                  window.dispatchEvent(
                    new CustomEvent("stea:open-unlock", {
                      detail: { productId: pending.productId },
                    })
                  );
                  return;
                }
              }

              let text = "";
              if (pending.type === "copy-prompt") {
                text = String(prod?.aiPrompt || "");
              } else {
                const preview = await getSteaCodeProductPreview(pending.productId);
                text = String(preview?.sourceCodeHtml || preview?.preview || "");
                if (!text) {
                  text = String(prod?.sourceCode || "");
                }
              }
              if (text && navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                void trackUserEvent("copy", { productId: pending.productId, email: currentUser?.email || "" });
              }
            } catch (err) {
              console.warn("[MemberGate] Resumed copy failed:", err);
            }
          })();
        }
      }
    } catch (e) {
      console.warn("[MemberGate] failed to resume pending action on mount:", e);
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const initialFocusTimer = window.setTimeout(() => {
      if (closeBtnRef.current) closeBtnRef.current.focus();
      else if (googleBtnRef.current) googleBtnRef.current.focus();
    }, 40);
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      } else if (e.key === "Tab") {
        const container = dialogRef.current;
        if (!container) return;
        const focusables = container.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.clearTimeout(initialFocusTimer);
      window.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const handleClose = useCallback(() => {
    if (loading || emailLoading) return;
    const user = getFirebaseAuth()?.currentUser;
    if (!user) {
      clearSteaCodePendingAction();
    }
    onClose?.();
  }, [loading, emailLoading, onClose]);

  const doGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();

    if (!auth) {
      setError(tField(uiLocale, "connectError"));
      return;
    }

    if (loading || emailLoading) return;

    setLoading(true);
    setError("");
    setEmailError("");
    setAuthMessage("");

    try {
      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, provider);

      if (!result?.user) {
        throw new Error("Google authentication returned no user.");
      }

      void touchSteaCodeMemberProfile().catch((profileError) => {
        console.warn(
          "[STEA CODE] Member profile sync failed after successful authentication:",
          profileError?.code || profileError?.message || "unknown"
        );
      });

      const action = getSteaCodePendingAction();
      clearSteaCodePendingAction();
      onAuthenticated?.(result.user, action);
    } catch (err) {
      console.error("[STEA CODE MEMBER AUTH]", {
        code: err?.code || null,
        message: err?.message || "Unknown authentication error",
      });

      setError(humanAuthError(err, uiLocale));
    } finally {
      setLoading(false);
    }
  }, [loading, emailLoading, onAuthenticated, uiLocale]);

  const doEmailAuth = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setEmailError(tField(uiLocale, "connectError"));
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setEmailError(tField(uiLocale, "emailRequired"));
      return;
    }
    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setEmailError(tField(uiLocale, "invalidEmail"));
      return;
    }
    if (!password) {
      setEmailError(tField(uiLocale, "passwordRequired"));
      return;
    }
    if (mode === "signUp") {
      if (password.length < 6) {
        setEmailError(tField(uiLocale, "passwordTooShort"));
        return;
      }
      if (password !== confirmPassword) {
        setEmailError(tField(uiLocale, "passwordMismatch"));
        return;
      }
    }

    if (emailLoading || loading) return;

    setEmailLoading(true);
    setEmailError("");
    setError("");

    try {
      let result;
      if (mode === "signIn") {
        result = await signInWithEmailAndPassword(auth, cleanEmail, password);
      } else {
        result = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      }

      if (!result?.user) {
        throw new Error("Authentication returned no user.");
      }

      // New password accounts: fire the verification email immediately.
      // Non-blocking — failure here never blocks sign-up.
      let verificationSent = false;
      if (mode === "signUp") {
        try {
          await sendEmailVerification(result.user);
          verificationSent = true;
        } catch (verifyError) {
          console.warn(
            "[STEA CODE] Verification email failed:",
            verifyError?.code || verifyError?.message || "unknown"
          );
        }
      }

      void touchSteaCodeMemberProfile().catch((profileError) => {
        console.warn(
          "[STEA CODE] Member profile sync failed after successful authentication:",
          profileError?.code || profileError?.message || "unknown"
        );
      });

      const action = getSteaCodePendingAction();
      clearSteaCodePendingAction();
      onAuthenticated?.(result.user, action, { isNewUser: mode === "signUp", verificationSent });
    } catch (err) {
      console.error("[STEA CODE MEMBER EMAIL AUTH]", {
        code: err?.code || null,
        message: err?.message || "Unknown error",
      });
      setEmailError(humanEmailAuthError(err, uiLocale));
    } finally {
      setEmailLoading(false);
    }
  }, [email, password, confirmPassword, mode, emailLoading, loading, onAuthenticated, uiLocale]);

  const doForgotPassword = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setEmailError(tField(uiLocale, "connectError"));
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setEmailError(tField(uiLocale, "emailRequired"));
      return;
    }
    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setEmailError(tField(uiLocale, "invalidEmail"));
      return;
    }

    if (emailLoading || loading) return;

    setEmailLoading(true);
    setEmailError("");
    setResetSuccess(false);

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setResetSuccess(true);
    } catch (err) {
      console.error("[STEA CODE PASSWORD RESET]", err);
      setEmailError(humanEmailAuthError(err, uiLocale));
    } finally {
      setEmailLoading(false);
    }
  }, [email, emailLoading, loading, uiLocale]);

  if (!open) return null;

  const t = (k) => tField(uiLocale, k);
  const isBusy = loading || emailLoading;

  return createPortal(
    <div className="sc-member-gate-root" data-open="1">
      <div
        className="sc-member-gate-backdrop"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className="sc-member-gate-centered"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sc-member-gate-title"
        ref={dialogRef}
      >
        <div className="sc-member-gate-panel">
          <button
            ref={closeBtnRef}
            type="button"
            className="sc-member-gate-close"
            onClick={handleClose}
            aria-label={t("close")}
            disabled={isBusy}
          >
            <X size={16} />
          </button>

          {authMessage ? (
            <div className="sc-member-gate-auth-message" role="status">
              {authMessage}
            </div>
          ) : null}

          <div className="sc-member-gate-mark">
            <img
              src="/stea-apps/stea-code.png"
              alt=""
              width="72"
              height="48"
              className="sc-member-gate-mark-img"
            />
          </div>

          <h1 id="sc-member-gate-title" className="sc-member-gate-title">
            {t("title")}
          </h1>

          <p className="sc-member-gate-subtitle">
            {t("subtitle")}
          </p>

          <button
            ref={googleBtnRef}
            type="button"
            className="sc-member-gate-google-btn"
            onClick={doGoogle}
            disabled={isBusy}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="sc-member-gate-spinner" />
                <span>{t("connecting")}</span>
              </>
            ) : (
              <>
                <span className="sc-member-gate-google-icon" aria-hidden="true">
                  <svg viewBox="0 0 48 48" width="18" height="18">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.65 32.881 29.219 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                    <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.195 0-9.603-3.291-11.182-7.813l-6.548 5.059C9.5 40.367 16.221 44 24 44z" />
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.084 5.57l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                  </svg>
                </span>
                <span>{t("googleButton")}</span>
              </>
            )}
          </button>

          {error ? (
            <div className="sc-member-gate-error" role="alert">{error}</div>
          ) : null}

          <div className="sc-member-gate-or">
            <span className="sc-member-gate-or-line" />
            <span className="sc-member-gate-or-text">{t("orDivider")}</span>
            <span className="sc-member-gate-or-line" />
          </div>

          {showReset ? (
            <>
              <p className="sc-member-gate-reset-hint">{t("resetHint")}</p>
              <input
                type="email"
                className="sc-member-gate-input"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                disabled={isBusy}
              />
              {resetSuccess ? (
                <div className="sc-member-gate-success" role="status">
                  {t("resetSent")}
                </div>
              ) : null}
              <button
                type="button"
                className="sc-member-gate-submit"
                onClick={doForgotPassword}
                disabled={isBusy}
              >
                {emailLoading ? t("signingIn") : t("forgotPassword")}
              </button>
              <button
                type="button"
                className="sc-member-gate-link"
                onClick={() => { setShowReset(false); setEmailError(""); setResetSuccess(false); }}
                disabled={isBusy}
              >
                {t("toggleToSignInLink")}
              </button>
            </>
          ) : (
            <>
              <input
                type="email"
                className="sc-member-gate-input"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                disabled={isBusy}
              />
              <input
                type="password"
                className="sc-member-gate-input"
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signUp" ? "new-password" : "current-password"}
                disabled={isBusy}
              />
              {mode === "signUp" && (
                <input
                  type="password"
                  className="sc-member-gate-input"
                  placeholder={t("confirmPasswordLabel")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={isBusy}
                />
              )}
              <button
                type="button"
                className="sc-member-gate-submit"
                onClick={doEmailAuth}
                disabled={isBusy}
              >
                {emailLoading
                  ? t(mode === "signUp" ? "signingUp" : "signingIn")
                  : t(mode === "signUp" ? "signUpBtn" : "signInBtn")}
              </button>
              <div className="sc-member-gate-row">
                <button
                  type="button"
                  className="sc-member-gate-link"
                  onClick={() => { setShowReset(true); setEmailError(""); }}
                  disabled={isBusy}
                >
                  {t("forgotPassword")}
                </button>
              </div>
              {mode === "signIn" ? (
                <p className="sc-member-gate-toggle">
                  {t("toggleToSignUp")}{" "}
                  <button
                    type="button"
                    className="sc-member-gate-link"
                    onClick={() => { setMode("signUp"); setEmailError(""); }}
                    disabled={isBusy}
                  >
                    {t("toggleToSignUpLink")}
                  </button>
                </p>
              ) : (
                <p className="sc-member-gate-toggle">
                  {t("toggleToSignIn")}{" "}
                  <button
                    type="button"
                    className="sc-member-gate-link"
                    onClick={() => { setMode("signIn"); setEmailError(""); }}
                    disabled={isBusy}
                  >
                    {t("toggleToSignInLink")}
                  </button>
                </p>
              )}
            </>
          )}

          {emailError ? (
            <div className="sc-member-gate-error" role="alert">{emailError}</div>
          ) : null}

          <ul className="sc-member-gate-features">
            <li>
              <span className="sc-member-gate-check"><Check size={12} /></span>
              <span>{t("featureAccount")}</span>
            </li>
            <li>
              <span className="sc-member-gate-check"><Check size={12} /></span>
              <span>{t("featureAccess")}</span>
            </li>
            <li>
              <span className="sc-member-gate-check"><Check size={12} /></span>
              <span>{t("featureSame")}</span>
            </li>
          </ul>

          <div className="sc-member-gate-already">
            <strong>{t("alreadyMember")}</strong>
            <span>{t("sameAccount")}</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export { I18N as STEA_CODE_MEMBER_GATE_I18N };
