import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

export default function EcosystemModalShell({
  open,
  title,
  subtitle,
  onClose,
  children,
  maxWidth = 560,
}) {
  return (
    <AnimatePresence>
      {open && (
        <div
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose?.();
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            background: "rgba(2, 6, 15, 0.78)",
            backdropFilter: "blur(10px)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            style={{
              width: "100%",
              maxWidth,
              maxHeight: "min(92vh, 860px)",
              overflow: "hidden",
              borderRadius: 24,
              background: "linear-gradient(145deg, rgba(17,22,32,0.99) 0%, rgba(8,12,20,0.995) 100%)",
              border: "1px solid rgba(212,175,55,0.20)",
              boxShadow: "0 34px 100px rgba(0,0,0,0.62), 0 0 48px rgba(212,175,55,0.06)",
              color: "#F8FAFC",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
                padding: "18px 20px 14px",
                borderBottom: "1px solid rgba(148,163,184,0.12)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(212,175,55,0.025) 100%)",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "rgba(212,175,55,0.12)",
                    border: "1px solid rgba(212,175,55,0.34)",
                    color: "#F3C95C",
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  STEA
                </div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 22,
                    lineHeight: 1.1,
                    fontWeight: 900,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {title}
                </h2>
                {subtitle ? (
                  <p
                    style={{
                      margin: "8px 0 0",
                      color: "#94A3B8",
                      fontSize: 14,
                      lineHeight: 1.55,
                      maxWidth: 440,
                    }}
                  >
                    {subtitle}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close popup"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.18)",
                  background: "rgba(255,255,255,0.045)",
                  color: "#CBD5E1",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                padding: 20,
                overflowY: "auto",
                maxHeight: "calc(min(92vh, 860px) - 90px)",
              }}
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
