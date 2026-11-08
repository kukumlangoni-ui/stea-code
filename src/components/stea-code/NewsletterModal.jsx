import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./stea-code-newsletter.css";

/**
 * NewsletterModal — low-friction email capture for casual browsers.
 *
 * Replaces the hard "Sign In" OTP gate in the top nav: visitors get weekly
 * product updates without creating an account. Posts to
 * /api/newsletter/subscribe which upserts into the leads table — the route
 * is idempotent, so re-subscribing shows a friendly "already on the list"
 * state instead of an error.
 */
export default function NewsletterModal({ open, onClose }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [doneMessage, setDoneMessage] = useState("");
  const inputRef = useRef(null);

  // Reset the flow every time the modal opens.
  useEffect(() => {
    if (!open) return;
    setEmail("");
    setLoading(false);
    setError("");
    setDone(false);
    setDoneMessage("");
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open]);

  // Escape to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setDone(true);
      setDoneMessage(data.message || "You're in! Check your inbox for a welcome note.");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="sc-newsletter"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sc-newsletter-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="sc-newsletter__panel">
        <div className="sc-newsletter__head">
          <span className="sc-newsletter__spark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l1.9 5.7L20 9.6l-5.1 3.7L16.4 20 12 16.6 7.6 20l1.5-6.7L4 9.6l6.1-1.9L12 2z" />
            </svg>
          </span>
          <button
            type="button"
            className="sc-newsletter__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {done ? (
          <div className="sc-newsletter__success">
            <span className="sc-newsletter__success-icon" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <h2 id="sc-newsletter-title" className="sc-newsletter__title">Subscribed</h2>
            <p className="sc-newsletter__copy">{doneMessage}</p>
            <button type="button" className="sc-newsletter__button" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 id="sc-newsletter-title" className="sc-newsletter__title">Stay in the loop</h2>
            <p className="sc-newsletter__copy">
              One email per week. New components, e-books, and design resources. No spam.
            </p>

            {error && <div className="sc-newsletter__error">{error}</div>}

            <form className="sc-newsletter__form" onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="sc-newsletter__input"
                autoComplete="email"
                disabled={loading}
              />
              <button type="submit" className="sc-newsletter__button" disabled={loading}>
                {loading ? "Subscribing…" : "Subscribe Free"}
              </button>
            </form>

            <p className="sc-newsletter__trust">Join 1,000+ developers. Unsubscribe anytime.</p>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
