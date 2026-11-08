import React, { useState, useEffect, useRef } from "react";
import { useCloudflareAuth } from "../../hooks/useCloudflareAuth";
import "./stea-code-member-gate.css";

export default function SteaCodeMemberGate({
  open,
  onClose,
  onAuthenticated,
  // Accepted for backwards compatibility with callers that still pass them.
  onSuccess,
  pendingAction: _pendingAction,
  locale: _locale,
}) {
  const { user } = useCloudflareAuth(); // Read user state
  const [step, setStep] = useState(1); // 1 = Email, 2 = OTP, 3 = Success
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [orbitActive, setOrbitActive] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef([]);

  // If user is already logged in, immediately close the modal and call success
  useEffect(() => {
    if (open && user) {
      if (onAuthenticated) onAuthenticated(user);
      if (onSuccess) onSuccess();
      onClose?.();
    }
  }, [open, user, onClose, onAuthenticated, onSuccess]);

  // Reset the flow each time the gate opens.
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setEmail("");
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setLoading(false);
    setOrbitActive(false);
    setSuccess(false);
  }, [open]);

  useEffect(() => {
    if (step === 2 && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send code");
      
      // Save email for prefill
      localStorage.setItem("stea_last_email", email);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (loading || success) return;
    const newOtp = [...otp];
    newOtp[index] = value.replace(/[^0-9]/g, "");
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }

    if (index === 5 && newOtp.join("").length === 6) {
      triggerVerify(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasteData.length === 6) {
      const newOtp = pasteData.split("");
      setOtp(newOtp);
      triggerVerify(pasteData);
    }
  };

  const triggerVerify = async (code) => {
    setLoading(true);
    setOrbitActive(true);
    setError("");

    setTimeout(async () => {
      setOrbitActive(false);
      try {
        const res = await fetch("/api/auth/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Invalid code");

        // Save to localStorage on success
        const newUser = { email, loggedIn: true };
        localStorage.setItem("stea_user", JSON.stringify(newUser));
        
        setSuccess(true);
        if (onAuthenticated) onAuthenticated(newUser);
        if (onSuccess) onSuccess();
        
        setTimeout(() => {
          onClose?.();
          setTimeout(() => {
            setStep(1); setEmail(""); setOtp(["","","","","",""]); setSuccess(false);
          }, 300);
        }, 1500);

      } catch (err) {
        setError(err.message);
        setLoading(false);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        document.getElementById("gate-card")?.classList.add("shake");
        setTimeout(() => document.getElementById("gate-card")?.classList.remove("shake"), 500);
      }
    }, 1600);
  };

  if (!open || user) return null; // Never render if already logged in

  return (
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/50 p-4">
      <div id="gate-card" className="sc-gate-card w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {step === 1 && (
          <div className="flex flex-col items-center text-center">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Sign in to SteaCode</h2>
            <p className="text-sm text-gray-500 mb-6">Enter your email to receive a secure login code.</p>
            <form onSubmit={handleSendCode} className="w-full">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border-2 border-gray-200 p-3 mb-4 focus:border-yellow-500 focus:outline-none"
              />
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-yellow-500 py-3 font-bold text-white hover:bg-yellow-600 disabled:opacity-50">
                {loading ? "Sending..." : "Send Code"}
              </button>
            </form>
            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center text-center">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Check your email</h2>
            <p className="text-sm text-gray-500 mb-6">
              We sent a 6-digit code to<br /><strong>{email}</strong>
            </p>

            <div className="sc-gate-stage">
              <div className={`sc-gate-inputs ${loading || success ? "hidden" : ""}`}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handlePaste}
                    className={`sc-gate-pill ${digit ? "filled" : ""} ${error ? "error" : ""}`}
                    inputMode="numeric"
                  />
                ))}
              </div>

              <div className={`sc-orbit-layer ${orbitActive ? "active" : ""}`}>
                <div className="sc-orbit-ring">
                  {otp.map((digit, i) => {
                    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
                    return (
                      <div key={i} className="sc-orbit-node" style={{
                        '--dx': `${Math.cos(angle) * 80}px`,
                        '--dy': `${Math.sin(angle) * 80}px`,
                        animationDelay: `${i * 40}ms`
                      }}>
                        {digit}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={`sc-loading-layer ${loading && !orbitActive ? "active" : ""}`}>
                <div className="sc-loading-core">
                  <div className="sc-loading-ring"></div>
                  <div className="sc-loading-inner">...</div>
                </div>
              </div>

              <div className={`sc-success-layer ${success ? "active" : ""}`}>
                <div className="sc-success-vault">
                  <svg className="sc-checkmark" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
