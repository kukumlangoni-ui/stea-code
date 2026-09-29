import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowRight, X } from "lucide-react";

export const SECRET_AFTER_DARK_KEYWORDS = [
  "afterdark",
  "after dark",
  "mature",
  "18plus",
  "18+",
  "after-dark",
  "nsfw",
];

export function isAgeVerified() {
  if (typeof window === "undefined") return false;
  try {
    const verified = sessionStorage.getItem("stea_age_verified");
    const ts = sessionStorage.getItem("stea_age_verified_ts");
    if (verified !== "true") return false;
    if (ts) {
      const elapsed = Date.now() - Number(ts);
      // Expire verification after 30 minutes
      if (elapsed > 30 * 60 * 1000) {
        sessionStorage.removeItem("stea_age_verified");
        sessionStorage.removeItem("stea_age_verified_ts");
        return false;
      }
    } else {
      sessionStorage.setItem("stea_age_verified_ts", String(Date.now()));
    }
    return true;
  } catch {
    return false;
  }
}

export function triggerAgeGateOrNavigate(navigate, targetPath = "/after-dark") {
  if (isAgeVerified()) {
    if (navigate) navigate(targetPath);
    else if (typeof window !== "undefined") window.location.href = targetPath;
  } else {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-age-gate", { detail: { targetPath } }));
    }
  }
}

export default function AgeGateModal({ open = false, onClose, onConfirm, targetPath = "/after-dark" }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  useEffect(() => {
    const handleOpenEvent = (e) => {
      if (isAgeVerified()) {
        const dest = e.detail?.targetPath || targetPath || "/after-dark";
        navigate(dest);
        return;
      }
      setIsOpen(true);
    };

    window.addEventListener("open-age-gate", handleOpenEvent);
    return () => window.removeEventListener("open-age-gate", handleOpenEvent);
  }, [navigate, targetPath]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    try {
      sessionStorage.setItem("stea_age_verified", "true");
      sessionStorage.setItem("stea_age_verified_ts", String(Date.now()));
    } catch {}
    setIsOpen(false);
    if (onConfirm) onConfirm();
    if (onClose) onClose();
    navigate(targetPath || "/after-dark");
  };

  const handleExit = () => {
    try {
      sessionStorage.removeItem("stea_age_verified");
      sessionStorage.removeItem("stea_age_verified_ts");
    } catch {}
    setIsOpen(false);
    if (onClose) onClose();
    navigate("/websites");
  };

  return (
    <div id="ageGateOverlay" className="age-gate-overlay">
      <div className="age-gate-box">
        <div className="age-gate-icon-badge">
          <span className="age-gate-icon-text">18+</span>
        </div>

        <h2 className="age-gate-title">Restricted Content</h2>
        <p className="age-gate-subtitle">Age Verification Required</p>

        <div className="age-gate-disclaimer">
          <div className="age-gate-disclaimer-item">
            <span className="age-gate-bullet">•</span>
            <p>
              <strong>Mature Content:</strong> This section contains curated links to external websites that contain mature, adult, or age-restricted content.
            </p>
          </div>
          <div className="age-gate-disclaimer-item">
            <span className="age-gate-bullet">•</span>
            <p>
              <strong>Age Certification:</strong> By continuing, you certify that you are at least <strong>18 years of age</strong> (or the legal age of majority in your region).
            </p>
          </div>
          <div className="age-gate-disclaimer-item">
            <span className="age-gate-bullet">•</span>
            <p>
              <strong>External Links:</strong> STEA does not host, own, or produce third-party content. External websites are accessed under their respective terms.
            </p>
          </div>
        </div>

        <div className="age-gate-actions">
          <button
            type="button"
            id="ageGateExit"
            className="btn-gate-exit"
            onClick={handleExit}
          >
            Exit to Public
          </button>
          <button
            type="button"
            id="ageGateConfirm"
            className="btn-gate-confirm"
            onClick={handleConfirm}
          >
            <span>I Confirm (18+)</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <style>{`
        .age-gate-overlay {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(4, 6, 12, 0.94);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          z-index: var(--stea-z-splash, 2000);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          box-sizing: border-box;
          animation: ageGateFade 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes ageGateFade {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }

        .age-gate-box {
          background: rgba(14, 18, 28, 0.95);
          border: 1px solid rgba(220, 38, 38, 0.32);
          border-radius: 20px;
          max-width: 520px;
          width: 100%;
          padding: 32px 28px;
          text-align: center;
          color: #ffffff;
          box-shadow: 0 30px 70px rgba(0, 0, 0, 0.85), 0 0 40px rgba(220, 38, 38, 0.12);
          font-family: 'Instrument Sans', system-ui, -apple-system, sans-serif;
          position: relative;
        }

        .age-gate-icon-badge {
          width: 54px;
          height: 54px;
          border-radius: 14px;
          background: rgba(220, 38, 38, 0.14);
          border: 1px solid rgba(220, 38, 38, 0.35);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
          box-shadow: 0 4px 16px rgba(220, 38, 38, 0.2);
        }

        .age-gate-icon-text {
          font-family: 'Bricolage Grotesque', system-ui, sans-serif;
          font-weight: 900;
          font-size: 19px;
          color: #F87171;
          letter-spacing: -0.02em;
        }

        .age-gate-title {
          font-family: 'Bricolage Grotesque', system-ui, sans-serif;
          color: #FFFFFF;
          font-size: 22px;
          font-weight: 850;
          margin: 0 0 4px;
          letter-spacing: -0.02em;
        }

        .age-gate-subtitle {
          color: #F87171;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin: 0 0 18px;
        }

        .age-gate-disclaimer {
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(255, 255, 255, 0.07);
          padding: 16px 18px;
          border-radius: 14px;
          margin-bottom: 22px;
          text-align: left;
          font-size: 13px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.72);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .age-gate-disclaimer-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .age-gate-bullet {
          color: #F87171;
          font-weight: 900;
          font-size: 15px;
          line-height: 1.3;
        }

        .age-gate-disclaimer p {
          margin: 0;
        }

        .age-gate-disclaimer strong {
          color: #FFFFFF;
          font-weight: 700;
        }

        .age-gate-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .btn-gate-exit, .btn-gate-confirm {
          padding: 12px 20px;
          min-height: 48px;
          border: none;
          border-radius: 12px;
          font-weight: 750;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.16s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex: 1;
        }

        .btn-gate-exit {
          background: rgba(255, 255, 255, 0.07);
          color: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .btn-gate-exit:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
        }

        .btn-gate-confirm {
          background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 4px 16px rgba(220, 38, 38, 0.4);
        }

        .btn-gate-confirm:hover {
          background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(220, 38, 38, 0.5);
        }

        @media (max-width: 480px) {
          .age-gate-box {
            padding: 24px 18px;
          }
          .age-gate-actions {
            flex-direction: column-reverse;
          }
        }
      `}</style>
    </div>
  );
}
