import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2, X } from "lucide-react";
import { createStaff } from "../services/staffAuth.js";
import "./team.css";

/**
 * Modal to add a new staff member.
 * Roles offered: Editor / Admin (Owner is never an option here).
 */
export default function AddStaffModal({ onClose, onCreated }) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("editor");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const emailRef = useRef(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    const cleanEmail = email.trim();
    const cleanName = displayName.trim();

    if (!cleanEmail) return setError("Email is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) return setError("Please enter a valid email address.");
    if (!cleanName) return setError("Display name is required.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    setError("");
    setSubmitting(true);
    try {
      await createStaff({ email: cleanEmail, password, displayName: cleanName, role });
      onCreated?.();
      onClose?.();
    } catch (err) {
      setError(err?.message || "Failed to create member.");
      setSubmitting(false);
    }
  }

  return (
    <div className="team-modal-overlay" role="dialog" aria-modal="true" aria-label="Add team member">
      <div className="team-modal">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h4>Add member</h4>
            <p className="team-modal-sub">Invite a teammate to manage products.</p>
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

        <form onSubmit={handleSubmit} noValidate>
          <div className="team-modal-field">
            <label className="team-modal-label" htmlFor="team-email">Email</label>
            <input
              id="team-email"
              ref={emailRef}
              type="email"
              className="team-modal-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@steacode.africa"
              autoComplete="off"
            />
          </div>

          <div className="team-modal-field">
            <label className="team-modal-label" htmlFor="team-name">Display name</label>
            <input
              id="team-name"
              type="text"
              className="team-modal-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Full name"
              autoComplete="off"
            />
          </div>

          <div className="team-modal-field">
            <label className="team-modal-label" htmlFor="team-pass">Password</label>
            <span className="team-password-wrap">
              <input
                id="team-pass"
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
            <label className="team-modal-label" htmlFor="team-confirm">Confirm password</label>
            <input
              id="team-confirm"
              type={showPassword ? "text" : "password"}
              className="team-modal-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              autoComplete="new-password"
            />
          </div>

          <div className="team-modal-field">
            <span className="team-modal-label">Role</span>
            <div className="team-role-options">
              <label className={`team-role-option ${role === "editor" ? "is-active" : ""}`}>
                <input
                  type="radio"
                  name="role"
                  value="editor"
                  checked={role === "editor"}
                  onChange={() => setRole("editor")}
                />
                <strong>Editor</strong>
                <p>Can create products. Submits for owner approval before publishing.</p>
              </label>
              <label className={`team-role-option ${role === "approver" ? "is-active" : ""}`}>
                <input
                  type="radio"
                  name="role"
                  value="approver"
                  checked={role === "approver"}
                  onChange={() => setRole("approver")}
                />
                <strong>Approver</strong>
                <p>Full product management. Cannot manage staff or billing.</p>
              </label>
            </div>
          </div>

          {error && <div className="team-modal-error" role="alert">{error}</div>}

          <div className="team-modal-actions">
            <button type="button" className="team-btn-ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="team-btn-primary" disabled={submitting}>
              {submitting ? <Loader2 className="team-spinner" size={16} /> : null}
              Create member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
