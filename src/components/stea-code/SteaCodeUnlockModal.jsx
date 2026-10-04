import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { getFirebaseAuth } from "../../firebase.js";

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

  const productTitle =
    (product?.titleEn && String(product.titleEn).trim()) ||
    (product?.titleZh && String(product.titleZh).trim()) ||
    "this component";
  const productPrice = Number(product?.price || 0);
  const productId = product?.id || "";

  const handleBuyProduct = useCallback(async () => {
    setError("");
    setLoading("product");
    try {
      const auth = getFirebaseAuth();
      const user = auth?.currentUser;
      if (!user) {
        setError("Please sign in first");
        setLoading(null);
        return;
      }
      const token = await user.getIdToken();
      const res = await fetch("/api/stea-code/checkout-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data?.error || "Failed to create checkout");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
      setLoading(null);
    }
  }, [productId]);

  const handleBuyPro = useCallback(async () => {
    setError("");
    setLoading("pro");
    try {
      const res = await fetch("/api/stea-code/checkout", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data?.error || "Failed to create checkout");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
      setLoading(null);
    }
  }, []);

  if (!product) return null;

  return createPortal(
    <motion.div
      className="sc-unlock-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sc-unlock-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={reduceMotion ? { duration: 0.08 } : { duration: 0.12, ease: "easeOut" }}
    >
      <motion.button
        className="sc-unlock-modal-bg"
        onClick={onClose}
        aria-label="Close unlock modal"
        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
        animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        transition={reduceMotion ? { duration: 0.08 } : { duration: 0.15, ease: "easeOut" }}
      />

      <div className="sc-unlock-modal-centered">
        <motion.div
          className="sc-unlock-panel"
          role="document"
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={reduceMotion ? { duration: 0.08 } : { duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
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

          <h2 id="sc-unlock-title" className="sc-unlock-title">
            {productTitle}
          </h2>

          <p className="sc-unlock-body">
            Unlock this component to copy the source code and AI prompt.
            Or get everything on steacode, forever.
          </p>

          <div className="sc-unlock-actions">
            <button
              type="button"
              className="sc-unlock-btn sc-unlock-btn--primary"
              onClick={handleBuyProduct}
              disabled={loading !== null}
            >
              {loading === "product" ? (
                <>
                  <svg className="sc-unlock-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  <span>Preparing checkout…</span>
                </>
              ) : (
                <span>Unlock this — ${productPrice.toFixed(2)}</span>
              )}
            </button>

            <button
              type="button"
              className="sc-unlock-btn sc-unlock-btn--secondary"
              onClick={handleBuyPro}
              disabled={loading !== null}
            >
              {loading === "pro" ? (
                <>
                  <svg className="sc-unlock-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  <span>Preparing checkout…</span>
                </>
              ) : (
                <span>Or get everything — €29 lifetime</span>
              )}
            </button>
          </div>

          {error && (
            <div className="sc-unlock-error" role="alert">
              {error}
            </div>
          )}

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
