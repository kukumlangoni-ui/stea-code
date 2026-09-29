/**
 * SitesMemberGate + engagement engine (P12 — STEA V2).
 *
 * Behavior:
 *  - NEVER auto-popups on first visit.
 *  - NEVER shows timers.
 *  - Shows only after engagement triggers:
 *      opens >= 6–10
 *      OR multiple meaningful category visits (>= 4)
 *      OR returning visitor
 *      OR a "member action" when logged out (e.g. Fav attempt — use `forceOpen=true`)
 *
 * Engine state (persisted to localStorage):
 *   stea_sites_member_gate = {
 *     opens, categoryVisits, lastShownAt, dismissedAt, sessionShown
 *   }
 *
 * Rules:
 *  - Maximum 1 passive gate per session.
 *  - Dismissed → respected cooldown of 3 days minimum.
 *  - If user != null (logged-in) → passive gate is NEVER shown.
 *
 * Exports:
 *   - useSitesMemberGate() → engine + helpers for views to call
 *   - default <SitesMemberGate {...props}> → premium dark modal UI
 */
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { X, Heart, Bookmark, MessageSquare, CheckCircle2 } from "lucide-react";
import { TOKENS } from "./tokens.js";
import { useSitesLanguage } from "../../i18n/index.js";

const LS_KEY = "stea_sites_member_gate";
const SESSION_KEY = "stea_sites_member_gate_session";
const COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 days minimum after dismiss
const PASSIVE_OPEN_THRESHOLD = 8;
const PASSIVE_CATEGORY_THRESHOLD = 4;
const RETURN_VISITOR_DAYS = 2;

/* ---------------------------- persistence helpers ---------------------------- */
function safeRead() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p && typeof p === "object" ? p : null;
  } catch { return null; }
}
function safeWrite(partial) {
  if (typeof window === "undefined") return;
  try {
    const cur = safeRead() || {};
    const next = { opens: 0, categoryVisits: 0, lastShownAt: null, dismissedAt: null, sessionShown: false, ...cur, ...partial };
    window.localStorage.setItem(LS_KEY, JSON.stringify(next));
    return next;
  } catch { return null; }
}
function sessionShown() {
  if (typeof window === "undefined") return true;
  return window.sessionStorage.getItem(SESSION_KEY) === "1";
}
function markSessionShown() {
  try { if (typeof window !== "undefined") window.sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
}

/* ------------------------------ engine hook ------------------------------ */
export function useSitesMemberGate({ user } = {}) {
  const read = useCallback(() => safeWrite({}), []);
  const [forceOpen, setForceOpen] = useState(false);

  const bump = useCallback((field, value = 1) => {
    if (user) return null; // logged-in: no engagement tracking needed (never passive gate)
    const current = safeRead() || { opens: 0, categoryVisits: 0 };
    return safeWrite({
      opens: field === "opens" ? (Number(current.opens) || 0) + value : (Number(current.opens) || 0),
      categoryVisits: field === "categoryVisits" ? (Number(current.categoryVisits) || 0) + value : (Number(current.categoryVisits) || 0),
    });
  }, [user]);

  const recordWebsiteOpen = useCallback(() => bump("opens", 1), [bump]);
  const recordCategoryVisit = useCallback(() => bump("categoryVisits", 1), [bump]);

  const shouldPassivelyOpen = useCallback(() => {
    if (user) return false; // never show if logged in
    if (sessionShown()) return false;
    const s = safeRead() || {};
    const now = Date.now();
    if (s.dismissedAt && now - Number(s.dismissedAt || 0) < COOLDOWN_MS) return false;
    if (s.lastShownAt && now - Number(s.lastShownAt || 0) < 60 * 60 * 1000) return false; // 1 hour hard min
    const opens = Number(s.opens) || 0;
    const cats = Number(s.categoryVisits) || 0;
    const returning = s.lastShownAt && now - Number(s.lastShownAt) >= RETURN_VISITOR_DAYS * 86400000;
    return opens >= PASSIVE_OPEN_THRESHOLD || cats >= PASSIVE_CATEGORY_THRESHOLD || returning;
  }, [user]);

  const markOpened = useCallback(() => {
    safeWrite({ lastShownAt: Date.now() });
    markSessionShown();
  }, []);

  const markDismissed = useCallback(() => {
    safeWrite({ dismissedAt: Date.now() });
    markSessionShown();
  }, []);

  const tryPassiveOpen = useCallback(() => {
    if (!shouldPassivelyOpen()) return false;
    markOpened();
    setForceOpen(true);
    return true;
  }, [shouldPassivelyOpen, markOpened]);

  const openGate = useCallback(() => { // member-action trigger
    markOpened();
    setForceOpen(true);
  }, [markOpened]);

  const closeGate = useCallback(() => setForceOpen(false), []);

  // Engine state for UI components
  const engine = useMemo(() => {
    const s = safeRead() || {};
    return {
      state: s,
      open: forceOpen,
      openGate,
      closeGate,
      dismiss: () => { markDismissed(); setForceOpen(false); },
      tryPassiveOpen,
      recordWebsiteOpen,
      recordCategoryVisit,
      bump,
    };
  }, [forceOpen, openGate, closeGate, markDismissed, tryPassiveOpen, recordWebsiteOpen, recordCategoryVisit, bump]);

  return engine;
}

/* --------------------------------- UI --------------------------------- */
function SitesMemberGate({
  open = false,
  user = null,
  onClose,
  onDismiss,
  onBecomeMember,
  onSignIn,
  showSignInFirst = false,
}) {
  const { t } = useSitesLanguage();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!open) { setMounted(false); setVisible(false); return undefined; }
    setMounted(true);
    const r = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(r);
  }, [open]);

  // Never show if user logged-in (safety net)
  if (!mounted || user) return null;

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => {
      onDismiss && onDismiss();
      onClose && onClose();
    }, 160);
  };

  const close = () => {
    setVisible(false);
    setTimeout(() => { onClose && onClose(); }, 160);
  };

  const signIn = () => {
    try { window.dispatchEvent(new CustomEvent("open-auth")); } catch {}
    onSignIn && onSignIn();
    close();
  };

  const become = () => {
    try { window.dispatchEvent(new CustomEvent("open-auth")); } catch {}
    onBecomeMember && onBecomeMember();
    close();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sites-member-gate-title"
      className={`sites-membergate ${visible ? "is-visible" : ""}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div className="sites-membergate-panel">
        <button
          type="button"
          className="sites-membergate-close"
          onClick={dismiss}
          aria-label={t("buttons.notNow", "Not now")}
        >
          <X size={16} />
        </button>

        <div className="sites-membergate-brand">
          <span className="sites-membergate-logo" aria-hidden>ST</span>
          <div>
            <div className="sites-membergate-brandname">STEA <span style={{ color: TOKENS.gold }}>Sites</span></div>
            <div className="sites-membergate-subtitle">{t("memberGate.tagline", "Save the internet you actually use.")}</div>
          </div>
        </div>

        <p className="sites-membergate-desc">
          {t("memberGate.paragraph", "Become a STEA member to sync your favorites, recently visited websites and community activity across your devices.")}
        </p>

        <ul className="sites-membergate-benefits">
          <li><CheckCircle2 size={15} /> {t("memberGate.benefitSync", "Sync favorites")}</li>
          <li><CheckCircle2 size={15} /> {t("memberGate.benefitRecent", "Keep recent sites")}</li>
          <li><CheckCircle2 size={15} /> {t("memberGate.benefitComment", "Comment and recommend")}</li>
          <li><CheckCircle2 size={15} /> {t("memberGate.benefitAnywhere", "Use your collection anywhere")}</li>
        </ul>

        <div className="sites-membergate-actions">
          <button type="button" className="sites-membergate-primary" onClick={become}>
            {t("memberGate.become", "Become a Member")}
          </button>
        </div>

        <div className="sites-membergate-alt">
          {showSignInFirst ? (
            <button type="button" className="sites-membergate-signin" onClick={signIn}>
              {t("memberGate.alreadyMemberSignin", "Sign in")}
            </button>
          ) : (
            <>
              {t("memberGate.alreadyMember", "Already a member?")}{" "}
              <button type="button" className="sites-membergate-signin" onClick={signIn}>
                {t("memberGate.signin", "Sign in")}
              </button>
            </>
          )}
        </div>

        <button type="button" className="sites-membergate-dismiss" onClick={dismiss}>
          {t("memberGate.notNow", "Not now")}
        </button>
      </div>

      <style>{`
        .sites-membergate {
          position: fixed; inset: 0; z-index: var(--stea-z-modal, 100);
          background: rgba(5, 7, 11, 0.62);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: grid; place-items: center;
          padding: 18px;
          opacity: 0; transition: opacity 180ms ease;
          pointer-events: ${visible ? "auto" : "none"};
        }
        .sites-membergate.is-visible { opacity: 1; }

        .sites-membergate-panel {
          position: relative;
          width: min(420px, 100%);
          background: ${TOKENS.panel};
          border: 1px solid ${TOKENS.border};
          border-radius: ${TOKENS.radiusLg}px;
          color: ${TOKENS.text};
          padding: 28px 26px 22px;
          box-shadow: 0 30px 80px rgba(0,0,0,0.55);
          transform: translateY(8px);
          opacity: 0;
          transition: opacity 180ms ease, transform 180ms ease;
        }
        .sites-membergate.is-visible .sites-membergate-panel { opacity: 1; transform: translateY(0); }

        .sites-membergate-close {
          position: absolute; top: 14px; right: 14px;
          width: 30px; height: 30px; border-radius: 999px;
          border: 1px solid ${TOKENS.border};
          background: ${TOKENS.panel2}; color: ${TOKENS.text2};
          display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: color 140ms, border-color 140ms, background 140ms;
        }
        .sites-membergate-close:hover { color: ${TOKENS.text}; border-color: ${TOKENS.borderHi}; }

        .sites-membergate-brand { display:flex; align-items:center; gap: 12px; margin-bottom: 14px; }
        .sites-membergate-logo {
          width: 40px; height: 40px; border-radius: 12px;
          background: linear-gradient(135deg, ${TOKENS.goldHi}, ${TOKENS.gold});
          color: #111;
          display: inline-flex; align-items: center; justify-content: center;
          font-weight: 900; letter-spacing: -0.02em;
        }
        .sites-membergate-brandname {
          font-family: "'Bricolage Grotesque', 'Instrument Sans', system-ui, sans-serif";
          font-size: 15.5px; font-weight: 900; letter-spacing: -0.01em;
        }
        .sites-membergate-subtitle {
          color: ${TOKENS.text2};
          font-size: 12.5px; font-weight: 600;
        }

        .sites-membergate-desc {
          margin: 0 0 16px;
          color: ${TOKENS.text2};
          font-size: 13.5px; line-height: 1.55;
        }

        .sites-membergate-benefits {
          list-style: none; padding: 0; margin: 0 0 22px;
          display: grid; gap: 9px;
        }
        .sites-membergate-benefits li {
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; font-weight: 700; color: ${TOKENS.text};
        }
        .sites-membergate-benefits li svg { color: ${TOKENS.goldHi}; flex: 0 0 auto; }

        .sites-membergate-primary {
          width: 100%;
          min-height: 46px;
          border: 0;
          border-radius: 12px;
          background: linear-gradient(180deg, ${TOKENS.goldHi}, ${TOKENS.gold});
          color: #111;
          font-family: inherit; font-size: 14px; font-weight: 900;
          letter-spacing: 0.01em;
          cursor: pointer;
          box-shadow: 0 10px 26px rgba(245, 166, 35, 0.25);
          transition: transform 140ms ease, filter 140ms ease;
        }
        .sites-membergate-primary:hover { transform: translateY(-1px); filter: brightness(1.04); }

        .sites-membergate-alt {
          margin: 14px 0 4px;
          text-align: center;
          color: ${TOKENS.text3};
          font-size: 12.5px; font-weight: 600;
        }
        .sites-membergate-signin {
          appearance: none; background: transparent; border: 0; padding: 0;
          color: ${TOKENS.goldHi}; font-weight: 900; cursor: pointer;
          font: inherit; letter-spacing: 0.01em;
          text-decoration: none;
        }
        .sites-membergate-signin:hover { color: ${TOKENS.gold}; }

        .sites-membergate-dismiss {
          width: 100%; margin-top: 14px;
          background: transparent; border: 0; color: ${TOKENS.text3};
          font: inherit; font-size: 12px; font-weight: 700; cursor: pointer;
          padding: 6px 0;
        }
        .sites-membergate-dismiss:hover { color: ${TOKENS.text2}; }

        @media (prefers-reduced-motion: reduce) {
          .sites-membergate, .sites-membergate-panel,
          .sites-membergate-primary { transition: none !important; }
        }
        @media (max-width: 520px) {
          .sites-membergate { padding: 10px; align-items: end; }
          .sites-membergate-panel { width: 100%; border-radius: 18px 18px 16px 16px; padding: 22px 20px 18px; }
        }
      `}</style>
    </div>
  );
}

export default memo(SitesMemberGate);
