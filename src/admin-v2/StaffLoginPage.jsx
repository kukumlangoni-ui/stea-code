import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { staffLogin } from "../services/staffAuth.js";
import "./staff-login.css";

/**
 * Staff login page — dark, premium, matches the steacode theme.
 * Talks to the Cloudflare staff auth backend. On success saves the token and
 * redirects to /admin. On failure shows an inline error, clears the password.
 */
export default function StaffLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const emailRef = useRef(null);
  const errorLiveRef = useRef(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    const trimmedEmail = email.trim();
    const trimmedPassword = password;

    if (!trimmedEmail) {
      setError("Please enter your email.");
      return;
    }
    if (!trimmedPassword) {
      setError("Please enter your password.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const staff = await staffLogin(trimmedEmail, trimmedPassword);
      // Token is already saved by staffLogin(). Navigate to the admin panel.
      navigate("/admin", { replace: true });
      // eslint-disable-next-line no-unused-vars
      void staff;
    } catch (err) {
      setError(err?.message || "Login failed. Please check your credentials.");
      setPassword("");
      setSubmitting(false);
      errorLiveRef.current?.focus?.();
    }
  }

  return (
    <div className="staff-login-page" data-staff-login>
      <div className="staff-login-card">
        <img
          src="/stea-code-logo.png"
          alt="steacode logo"
          className="staff-login-logo"
          height="40"
          width="40"
        />

        <h1 className="staff-login-title">Staff Access</h1>
        <p className="staff-login-sub">Sign in to manage products and orders.</p>

        {error && (
          <div className="staff-login-error" role="alert" ref={errorLiveRef} aria-live="polite">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="staff-login-form" noValidate>
          <label className="staff-login-field">
            <span className="staff-login-label">Email</span>
            <input
              ref={emailRef}
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@steacode.africa"
              autoComplete="email"
              aria-label="Email"
            />
          </label>

          <label className="staff-login-field">
            <span className="staff-login-label">Password</span>
            <span className="staff-login-password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-label="Password"
              />
              <button
                type="button"
                className="staff-login-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </label>

          <button type="submit" className="staff-login-submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="staff-login-spinner" size={18} />
                <span>Signing in…</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
