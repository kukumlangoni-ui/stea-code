import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./stea-code-member-gate.css";

const CODE_LENGTH = 6;

/**
 * POST JSON and surface the Worker's `error` string, its `detail`, and the
 * HTTP status. A 200 response that is NOT JSON (e.g. the SPA fallback page)
 * is treated as a failure instead of silently "succeeding".
 */
async function postJson(url, payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }

    if (!res.ok) {
      const err = new Error((data && data.error) || `Request failed (${res.status})`);
      err.detail = (data && data.detail) || (data ? null : text.slice(0, 160));
      err.status = res.status;
      throw err;
    }
    if (!data) {
      const err = new Error("The sign-in API returned an unexpected response.");
      err.detail = `HTTP ${res.status} but the body was not JSON — check that /api/* is routed to the stea-api Worker.`;
      err.status = res.status;
      throw err;
    }
    return data;
  } catch (e) {
    if (e.name === "AbortError") {
      const err = new Error("Request timed out. Please try again.");
      err.detail = "No response from /api/auth within 15s.";
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

const emptyDigits = () => Array(CODE_LENGTH).fill("");

export default function SteaCodeMemberGate({
  open,
  pendingAction,
  onClose,
  onAuthenticated,
  // Accepted for callers that already pass a locale; the copy stays English
  // like the rest of the auth surface.
  locale: _locale,
}) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState(emptyDigits);
  const [feedback, setFeedback] = useState(null); // { message, detail }
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false); // send-code / resend in flight
  const [phase, setPhase] = useState("entry"); // entry -> orbit -> spinner -> success
  const [errorFlash, setErrorFlash] = useState(false);

  const emailRef = useRef(null);
  const digitRefs = useRef([]);
  const startedAtRef = useRef(0);
  const timersRef = useRef([]);

  const code = useMemo(() => digits.join(""), [digits]);
  const busy = phase === "orbit" || phase === "spinner" || phase === "success";

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  // Reset the flow every time the modal opens; focus the right field.
  useEffect(() => {
    if (!open) {
      clearTimers();
      return;
    }
    setStep(1);
    setDigits(emptyDigits());
    setFeedback(null);
    setNotice("");
    setLoading(false);
    setPhase("entry");
    setErrorFlash(false);
    const id = window.setTimeout(() => emailRef.current?.focus(), 50);
    timersRef.current.push(id);
    return () => clearTimers();
  }, [open, clearTimers]);

  // Escape closes the modal — but never mid-verification.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && !loading && !busy) onClose && onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, busy, onClose]);

  const focusDigit = (index) => {
    const el = digitRefs.current[index];
    if (el) {
      el.focus();
      el.select && el.select();
    }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setFeedback({ message: "Enter your email address.", detail: null });
      return;
    }
    setLoading(true);
    setFeedback(null);
    setNotice("");
    try {
      const data = await postJson("/api/auth/send-code", { email: cleanEmail });
      setEmail(cleanEmail);
      setDigits(emptyDigits());
      setPhase("entry");
      setStep(2);
      if (data && data.emailSent === false) {
        setNotice(data.warning || "The email could not be sent, but a code was created.");
      }
      const id = window.setTimeout(() => focusDigit(0), 60);
      timersRef.current.push(id);
    } catch (err) {
      setFeedback({ message: err.message, detail: err.detail || null });
    } finally {
      setLoading(false);
    }
  };

  const verify = useCallback(
    async (fullCode) => {
      if (phase !== "entry") return;
      startedAtRef.current = Date.now();
      setFeedback(null);
      setPhase("orbit");
      // Orbit masks the network round-trip; a spinner takes over if the API is
      // slower than the animation.
      const orbitTimer = window.setTimeout(() => {
        setPhase((p) => (p === "orbit" ? "spinner" : p));
      }, 900);
      timersRef.current.push(orbitTimer);

      try {
        await postJson("/api/auth/verify-code", { email: email.trim().toLowerCase(), code: fullCode });
        window.dispatchEvent(new Event("stea-auth-changed"));

        // Let the orbit finish so success never snaps in mid-animation.
        const elapsed = Date.now() - startedAtRef.current;
        const wait = Math.max(0, 900 - elapsed);
        const successTimer = window.setTimeout(() => {
          setPhase("success");
          const finishTimer = window.setTimeout(() => {
            if (onAuthenticated) onAuthenticated({ email }, pendingAction);
            else if (onClose) onClose();
          }, 1100);
          timersRef.current.push(finishTimer);
        }, wait);
        timersRef.current.push(successTimer);
      } catch (err) {
        clearTimers();
        setPhase("entry");
        setDigits(emptyDigits());
        setFeedback({ message: err.message, detail: err.detail || null });
        setErrorFlash(true);
        const id = window.setTimeout(() => {
          setErrorFlash(false);
          focusDigit(0);
        }, 550);
        timersRef.current.push(id);
      }
    },
    [clearTimers, email, onAuthenticated, onClose, pendingAction, phase]
  );

  // Auto-submit the moment the sixth digit lands — no Verify button.
  useEffect(() => {
    if (step !== 2 || phase !== "entry") return;
    if (code.length === CODE_LENGTH) verify(code);
  }, [code, phase, step, verify]);

  const applyDigits = (next) => {
    setDigits(next);
    const firstEmpty = next.findIndex((d) => !d);
    focusDigit(firstEmpty === -1 ? CODE_LENGTH - 1 : firstEmpty);
  };

  const handleDigitChange = (index, raw) => {
    if (phase !== "entry") return;
    const cleaned = raw.replace(/\D/g, "");
    const next = [...digits];
    if (cleaned.length > 1) {
      // Autofill / fast paste into one box: spread it across the row.
      cleaned
        .slice(0, CODE_LENGTH - index)
        .split("")
        .forEach((d, i) => {
          next[index + i] = d;
        });
    } else {
      next[index] = cleaned;
    }
    applyDigits(next);
  };

  const handleDigitKeyDown = (index, e) => {
    if (phase !== "entry") return;
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
        return;
      }
      if (index > 0) {
        const next = [...digits];
        next[index - 1] = "";
        setDigits(next);
        focusDigit(index - 1);
      }
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusDigit(index - 1);
    }
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      e.preventDefault();
      focusDigit(index + 1);
    }
  };

  const handlePaste = (e) => {
    if (phase !== "entry") return;
    const pasted = (e.clipboardData || window.clipboardData)?.getData("text") || "";
    const cleaned = pasted.replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!cleaned) return;
    e.preventDefault();
    const next = emptyDigits();
    cleaned.split("").forEach((d, i) => {
      next[i] = d;
    });
    applyDigits(next);
  };

  const resetToEmail = () => {
    clearTimers();
    setStep(1);
    setDigits(emptyDigits());
    setFeedback(null);
    setNotice("");
    setPhase("entry");
    const id = window.setTimeout(() => emailRef.current?.focus(), 50);
    timersRef.current.push(id);
  };

  const handleResend = async () => {
    setLoading(true);
    setFeedback(null);
    setNotice("");
    try {
      const data = await postJson("/api/auth/send-code", { email });
      setDigits(emptyDigits());
      setPhase("entry");
      setNotice(data.emailSent === false ? data.warning || "Code re-created." : "A new code is on its way.");
      const id = window.setTimeout(() => focusDigit(0), 60);
      timersRef.current.push(id);
    } catch (err) {
      setFeedback({ message: err.message, detail: err.detail || null });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const dialog = (
    <div
      className="sc-gate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sc-gate-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading && !busy) onClose && onClose();
      }}
    >
      <div className={`sc-gate__panel${errorFlash ? " is-shaking" : ""}`}>
        <div className="sc-gate__head">
          <h2 className="sc-gate__title" id="sc-gate-title">
            {step === 1 ? "Sign in to SteaCode" : phase === "success" ? "You're in" : "Check your email"}
          </h2>
          <button
            type="button"
            className="sc-gate__close"
            onClick={onClose}
            aria-label="Close"
            disabled={busy}
          >
            ✕
          </button>
        </div>

        {feedback ? (
          <div className="sc-gate__error" role="alert">
            {feedback.message}
            {feedback.detail ? <span className="sc-gate__error-detail">{feedback.detail}</span> : null}
          </div>
        ) : null}

        {notice ? (
          <div className="sc-gate__notice" role="status">
            {notice}
          </div>
        ) : null}

        {step === 1 ? (
          <form onSubmit={handleSendCode}>
            <p className="sc-gate__copy">
              Enter your email and we&apos;ll send a 6-digit login code. No password, no account to create.
            </p>
            <label className="sc-gate__label" htmlFor="sc-gate-email">
              Email
            </label>
            <input
              id="sc-gate-email"
              ref={emailRef}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="sc-gate__input"
            />
            <button type="submit" disabled={loading} className="sc-gate__submit">
              {loading ? "Sending…" : "Send code"}
            </button>
            <p className="sc-gate__footnote">We only use this address to sign you in and link your purchases.</p>
          </form>
        ) : (
          <div className="sc-gate__otp">
            {phase !== "success" ? (
              <p className="sc-gate__copy">
                We sent a 6-digit code to <strong>{email}</strong>. It expires in 10 minutes.
              </p>
            ) : (
              <p className="sc-gate__copy">Code verified. Welcome back — setting things up.</p>
            )}

            <div className="sc-gate__stage" aria-live="polite">
              <div
                className={`sc-gate__digits${phase !== "entry" ? " is-dimmed" : ""}`}
                role="group"
                aria-label="6 digit verification code"
              >
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      digitRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={CODE_LENGTH}
                    value={digit}
                    disabled={phase !== "entry"}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(index, e)}
                    onPaste={handlePaste}
                    onFocus={(e) => e.target.select && e.target.select()}
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
                    className={`sc-gate__pill${digit ? " is-filled" : ""}${feedback ? " is-error" : ""}`}
                  />
                ))}
              </div>

              {phase === "orbit" ? (
                <div className="sc-orbit" aria-hidden="true">
                  <div className="sc-orbit__ring">
                    {digits.map((digit, i) => {
                      const angle = (i / CODE_LENGTH) * Math.PI * 2 - Math.PI / 2;
                      return (
                        <span
                          key={i}
                          className="sc-orbit__node"
                          style={{
                            "--dx": `${Math.cos(angle) * 76}px`,
                            "--dy": `${Math.sin(angle) * 76}px`,
                            animationDelay: `${i * 45}ms`,
                          }}
                        >
                          {digit || "•"}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {phase === "spinner" ? (
                <div className="sc-gate-spinner" aria-hidden="true">
                  <span className="sc-gate-spinner__ring" />
                  <span className="sc-gate-spinner__core">•••</span>
                </div>
              ) : null}

              {phase === "success" ? (
                <div className="sc-gate-success" aria-hidden="true">
                  <div className="sc-gate-success__vault">
                    <svg className="sc-gate-success__check" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
              ) : null}
            </div>

            {phase === "entry" ? (
              <p className="sc-gate__hint">
                {code.length === 0
                  ? "Type the code — it signs you in automatically."
                  : `${code.length} of ${CODE_LENGTH} digits entered`}
              </p>
            ) : null}

            {phase === "entry" ? (
              <>
                <button type="button" className="sc-gate__link" onClick={handleResend} disabled={loading}>
                  {loading ? "Sending a new code…" : "Resend code"}
                </button>
                <button type="button" className="sc-gate__link" onClick={resetToEmail} disabled={loading}>
                  Use a different email
                </button>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );

  // Portal to <body>: storefront roots (e.g. `.sc-v2-home.sc-v2-has-liquid`)
  // force `position: relative` on direct children with higher specificity,
  // which would turn this overlay into an inline block far down the page.
  if (typeof document === "undefined") return dialog;
  return createPortal(dialog, document.body);
}
