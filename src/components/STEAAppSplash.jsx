import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

// The approved STEA app icon (derived from public/stea-app-icon-final.png).
// The startup splash itself now lives in index.html so it can paint before the
// JS bundle loads; this component shares the same branding when it is mounted.
const STEA_LOGO = "/icons/icon-192x192.png";
const STEA_LOGO_FALLBACK = "/icons/icon-512x512.png";
const SPLASH_BG = "#05060a";
const SPLASH_GOLD = "#F5A623";
const SPLASH_GOLD_2 = "#FFD17C";
const SPLASH_BLUE = "#2563EB";
const SPLASH_BORDER = "rgba(245,166,35,.22)";

export default function STEAAppSplash({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let cancelled = false;
    let frameId = 0;
    const startedAt = performance.now();

    const step = (now) => {
      if (cancelled) return;
      const elapsed = now - startedAt;
      const target = Math.min(100, Math.floor(elapsed / 20));
      setProgress((current) => Math.max(current, target));

      if (target >= 100) {
        setTimeout(() => {
          if (cancelled) return;
          setVisible(false);
          onCompleteRef.current?.();
        }, 160);
        return;
      }

      frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.01, transition: { duration: 0.35, ease: "easeOut" } }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: `radial-gradient(circle at 50% 38%, rgba(245,166,35,.16), transparent 30%), radial-gradient(circle at 18% 18%, rgba(37,99,235,.11), transparent 32%), linear-gradient(180deg, ${SPLASH_BG} 0%, #0b0d14 100%)`,
            display: "grid",
            placeItems: "center",
            userSelect: "none",
            padding: "max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: "min(420px, calc(100vw - 40px))",
              padding: 0,
              borderRadius: 0,
              background: "transparent",
              border: "none",
              boxShadow: "none",
              textAlign: "center",
              backdropFilter: "none",
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.035, 1], boxShadow: ["0 14px 34px rgba(0,0,0,.26)", "0 18px 42px rgba(245,166,35,.24)", "0 14px 34px rgba(0,0,0,.26)"] }}
              transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
              style={{
                width: 100,
                height: 100,
                margin: "0 auto 30px",
                display: "grid",
                placeItems: "center",
                background: "transparent",
                border: "none",
                borderRadius: 0,
                boxShadow: "none",
              }}
            >
              <img
                src={STEA_LOGO}
                alt="STEA S"
                onError={(event) => {
                  if (event.currentTarget.src.endsWith(STEA_LOGO_FALLBACK)) return;
                  event.currentTarget.src = STEA_LOGO_FALLBACK;
                }}
                style={{
                  width: 74,
                  height: 74,
                  objectFit: "contain",
                  display: "block",
                  filter: "drop-shadow(0 12px 26px rgba(245,166,35,.24))",
                }}
              />
            </motion.div>

            <div style={{ width: "100%", height: 4, borderRadius: 0, background: "rgba(255,255,255,.10)", overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", borderRadius: 0, background: `linear-gradient(90deg, ${SPLASH_GOLD}, ${SPLASH_GOLD_2}, ${SPLASH_BLUE})`, boxShadow: "none", transition: "width 0.08s linear" }} />
            </div>

            </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
