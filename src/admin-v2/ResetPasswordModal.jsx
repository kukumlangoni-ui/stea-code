import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Eye, EyeOff, Loader2, X } from "lucide-react";
import { resetStaffPassword } from "../services/staffAuth.js";
import "./team.css";

/**
 * Modal to reset a staff member's password.
 * Warns that the reset logs them out of all devices.
 */
export default function ResetPasswordModal({ member, onClose, onDone }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const passRef = useRef(null);

  useEffect(() => {
    passRef.current?.focus();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    if (password.length < 8) return setError("New password must be at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    setError("");
    setSubmitting(true);
    try {
      await resetStaffPassword(member.id, password);
      onDone?.();
      onClose?.();
    } catch (err) {
      setError(err?.message || "Failed to reset password.");
      setSubmitting(false);
    }
  }

  return (
    <div className="team-modal-overlay" role="dialog" aria-modal="true" aria-label="Reset password">
      <div className="team-modal">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h4>Reset password</h4>
            <p className="team-modal-sub">for <strong style={{ color: "#fff" }}>{member?.email || "member"}</strong></p>
          </div>
          <button
            type="button"
            className="team-password-eye"
            onClick={onClose}
            aria-label="Close"
            style={{ padding: 8 }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="team-modal-warn">
          <AlertTriangle size={15} /> This will log them out of all devices.
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="team-modal-field">
            <label className="team-modal-label" htmlFor="team-newpass">New password</label>
            <span className="team-password-wrap">
              <input
                id="team-newpass"
                ref={passRef}
                type={showPassword ? "text" : "password"}
                className="team-modal-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="team-password-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </div>

          <div className="team-modal-field">
            <label className="team-modal-label" htmlFor="team-confirmpass">Confirm password</label>
            <input
              id="team-confirmpass"
              type={showPassword ? "text" : "password"}
              className="team-modal-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
          </div>

          {error && <div className="team-modal-error" role="alert">{error}</div>}

          <div className="team-modal-actions">
            <button type="button" className="team-btn-ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="team-btn-primary" disabled={submitting}>
              {submitting ? <Loader2 className="team-spinner" size={16} /> : null}
              Reset password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
