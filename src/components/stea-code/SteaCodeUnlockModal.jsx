import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { getFirebaseAuth } from "../../firebase.js";
import SteaCodeLogo from "./SteaCodeLogo.jsx";

/**
 * Unlock modal — shown when a signed-in user tries to copy/download
 * a premium product they don't own.
 *
 * Props: { product, onClose, onPurchased }
 * - product: the product being unlocked
 * - onClose: dismiss callback
 * - onPurchased: called when purchase completes (rare in this flow since
 *   Stripe redirects away, but kept for future embedded payment support)
 */
export default function SteaCodeUnlockModal({ product, onClose, onPurchased }) {
  const reduceMotion = useReducedMotion();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(null); // "product" | "pro" | null
  const primaryBtnRef = useRef(null);
  const sweepTimerRef = useRef(null);
  const sweepActiveRef = useRef(false);
  const userInteractedRef = useRef(false);
  const secondaryBtnRef = useRef(null);
  const secondarySweepTimerRef = useRef(null);
  const secondarySweepActiveRef = useRef(false);
  const secondaryUserInteractedRef = useRef(false);

  const productTitle =
    (product?.titleEn && String(product.titleEn).trim()) ||
    (product?.titleZh && String(product.titleZh).trim()) ||
    "this component";
  const productPrice = Number(product?.price || 0);
  const productId = product?.id || "";

  // --- Prismatic autoplay sweep ---
  useEffect(() => {
    const btn = primaryBtnRef.current;
    if (!btn) return;

    // Respect reduced motion — no autoplay sweep
    if (reduceMotion) return;

    const doSweep = () => {
      if (userInteractedRef.current) return;
      btn.classList.add("is-sweeping");
      sweepActiveRef.current = true;
      setTimeout(() => {
        btn.classList.remove("is-sweeping");
        sweepActiveRef.current = false;
      }, 900);
    };

    const startLoop = () => {
      if (userInteractedRef.current) return;
      sweepTimerRef.current = setInterval(() => {
        if (!userInteractedRef.current) {
          doSweep();
        }
      }, 2600);
    };

    // First sweep after a short delay, then loop
    const initialDelay = setTimeout(() => {
      doSweep();
      startLoop();
    }, 600);

    // Stop autoplay on first user interaction
    const stopAutoplay = () => {
      if (userInteractedRef.current) return;
      userInteractedRef.current = true;
      if (sweepTimerRef.current) {
        clearInterval(sweepTimerRef.current);
        sweepTimerRef.current = null;
      }
      if (sweepActiveRef.current) {
        btn.classList.remove("is-sweeping");
        sweepActiveRef.current = false;
      }
    };

    btn.addEventListener("pointerenter", stopAutoplay, { once: true });
    btn.addEventListener("pointerdown", stopAutoplay, { once: true });
    btn.addEventListener("focus", stopAutoplay, { once: true });
    btn.addEventListener("keydown", stopAutoplay, { once: true });

    return () => {
      clearTimeout(initialDelay);
      if (sweepTimerRef.current) clearInterval(sweepTimerRef.current);
      btn.removeEventListener("pointerenter", stopAutoplay);
      btn.removeEventListener("pointerdown", stopAutoplay);
      btn.removeEventListener("focus", stopAutoplay);
      btn.removeEventListener("keydown", stopAutoplay);
    };
  }, [reduceMotion]);

  // --- Secondary button autoplay sweep (staggered from primary) ---
  useEffect(() => {
    const btn = secondaryBtnRef.current;
    if (!btn || reduceMotion) return;

    const doSweep = () => {
      if (secondaryUserInteractedRef.current) return;
      btn.classList.add("is-sweeping");
      secondarySweepActiveRef.current = true;
      setTimeout(() => {
        btn.classList.remove("is-sweeping");
        secondarySweepActiveRef.current = false;
      }, 900);
    };

    // Offset start (1900ms vs primary's 600ms) so they never sweep in sync
    const initialDelay = setTimeout(() => {
      doSweep();
      secondarySweepTimerRef.current = setInterval(() => {
        if (!secondaryUserInteractedRef.current) doSweep();
      }, 2600);
    }, 1900);

    const stopAutoplay = () => {
      if (secondaryUserInteractedRef.current) return;
      secondaryUserInteractedRef.current = true;
      if (secondarySweepTimerRef.current) {
        clearInterval(secondarySweepTimerRef.current);
        secondarySweepTimerRef.current = null;
      }
      if (secondarySweepActiveRef.current) {
        btn.classList.remove("is-sweeping");
        secondarySweepActiveRef.current = false;
      }
    };

    btn.addEventListener("pointerenter", stopAutoplay, { once: true });
    btn.addEventListener("pointerdown", stopAutoplay, { once: true });
    btn.addEventListener("focus", stopAutoplay, { once: true });
    btn.addEventListener("keydown", stopAutoplay, { once: true });

    return () => {
      clearTimeout(initialDelay);
      if (secondarySweepTimerRef.current) clearInterval(secondarySweepTimerRef.current);
      btn.removeEventListener("pointerenter", stopAutoplay);
      btn.removeEventListener("pointerdown", stopAutoplay);
      btn.removeEventListener("focus", stopAutoplay);
      btn.removeEventListener("keydown", stopAutoplay);
    };
  }, [reduceMotion]);

  const handleBuyProduct = useCallback(async () => {
    setError("");
    setLoading("product");
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) {
        // Edge case: user reached modal while signed out.
        // Save intent, close modal, open sign-in instead of showing error.
        try {
          sessionStorage.setItem("stea_pending_action", JSON.stringify({
            type: "unlock",
            productId,
          }));
        } catch {
          // sessionStorage may be unavailable in private browsing
        }
        onClose?.();
        window.dispatchEvent(new Event("open-auth"));
        return;
      }
      const token = await user.getIdToken(true);

      const res = await fetch("/api/stea-code/checkout-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
      setLoading(null);
    }
  }, [productId, onClose]);

  const handleBuyPro = useCallback(async () => {
    setError("");
    setLoading("pro");
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Not signed in");
      const token = await user.getIdToken(true);

      const res = await fetch("/api/stea-code/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
      setLoading(null);
    }
  }, []);

  const isLoading = loading !== null;

  return createPortal(
    <motion.div
      className="sc-unlock-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sc-unlock-title"
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
    >
      <div className="sc-unlock-modal-bg" onClick={onClose} aria-hidden="true" />

      <div className="sc-unlock-modal-centered">
        <motion.div
          className="sc-unlock-panel"
          role="document"
          initial={{ opacity: 0, y: 8, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.985 }}
          transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        >
          <button
            type="button"
            className="sc-unlock-close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* Logo + wordmark */}
          <div className="sc-unlock-brand">
            <SteaCodeLogo size={28} alt="" />
            <span className="sc-unlock-brand-word">steacode</span>
          </div>

          {/* Heading */}
          <h2 id="sc-unlock-title" className="sc-unlock-title">
            Unlock the full source code
          </h2>

          {/* Body copy */}
          <p className="sc-unlock-body">
            Get the complete code package and AI prompt for {productTitle}.
          </p>

          {/* "You get" checklist */}
          <ul className="sc-unlock-perks">
            <li>
              <svg className="sc-unlock-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Complete source files (HTML, CSS, JS)
            </li>
            <li>
              <svg className="sc-unlock-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              AI prompt to rebuild it in Cursor or Claude
            </li>
            <li>
              <svg className="sc-unlock-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Commercial use license
            </li>
            <li>
              <svg className="sc-unlock-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Lifetime access — no subscription
            </li>
          </ul>

          {/* Primary CTA — prismatic pill */}
          <button
            ref={primaryBtnRef}
            type="button"
            className="sc-unlock-modal__primary"
            onClick={handleBuyProduct}
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 24" aria-hidden="true" focusable="false">
              <path d="m18 0 8 12 10-8-4 20H4L0 4l10 8 8-12z"></path>
            </svg>
            <span>
              {loading === "product" ? "Preparing checkout…" : `Unlock this — $${productPrice.toFixed(2)}`}
            </span>
          </button>
          <p className="sc-unlock-subcopy">One-time purchase · Instant access</p>

          {/* Divider */}
          <div className="sc-unlock-divider" role="separator" aria-label="or">
            <span>or</span>
          </div>

          {/* Secondary CTA — glossy cyan-blue gradient */}
          <button
            ref={secondaryBtnRef}
            type="button"
            className="sc-unlock-modal__secondary"
            onClick={handleBuyPro}
            disabled={isLoading}
          >
            {loading === "pro" ? (
              <>
                <svg className="sc-unlock-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                <span>Preparing checkout…</span>
              </>
            ) : (
              <span>Get everything — €29 lifetime</span>
            )}
          </button>
          <p className="sc-unlock-subcopy sc-unlock-subcopy--muted">
            Every component on steacode. Current and future.
          </p>

          {error && (
            <div className="sc-unlock-error" role="alert">
              {error}
            </div>
          )}

          {/* Dismiss link */}
          <button
            type="button"
            className="sc-unlock-dismiss"
            onClick={onClose}
          >
            Not now
          </button>
        </motion.div>
      </div>
    </motion.div>,
    document.body
  );
}
