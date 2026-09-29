import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const STEA_LOGO =
  "/stea-www-globe.png";

const STEA_LOGO_FALLBACK =
  "/stea-www-globe-512.png";

const SPLASH_GOLD = "#F5A623";
const SPLASH_GOLD_2 = "#FFD17C";
const SPLASH_BLUE = "#2563EB";

export function UnifiedLoadingScreen({
  isLoading,
  onComplete,
  message = "Loading STEA...",
  subtitle = "",
}) {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (exiting) return undefined;

    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (!isLoading) {
          if (current >= 100) {
            return 100;
          }

          return Math.min(
            100,
            current + 14
          );
        }

        if (current >= 95) {
          return current;
        }

        return Math.min(
          95,
          current +
            (Math.random() < 0.5
              ? 3
              : 5)
        );
      });
    }, 40);

    return () => {
      window.clearInterval(timer);
    };
  }, [isLoading, exiting]);

  useEffect(() => {
    if (
      progress < 100 ||
      exiting
    ) {
      return undefined;
    }

    setExiting(true);

    const timer =
      window.setTimeout(() => {
        onComplete?.();
      }, 220);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    progress,
    exiting,
    onComplete,
  ]);

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="unified-loader"
          initial={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          transition={{
            duration: 0.3,
            ease: "easeOut",
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            overflow: "hidden",
            userSelect: "none",

            padding:
              "max(20px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left))",

            background:
              "radial-gradient(circle at 50% 48%, rgba(245,166,35,.10) 0%, rgba(245,166,35,.035) 22%, transparent 42%), radial-gradient(circle at 18% 22%, rgba(37,99,235,.05) 0%, transparent 34%), linear-gradient(180deg, #05060a 0%, #070910 100%)",
          }}
        >
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.96,
              y: 8,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            transition={{
              duration: 0.5,
              ease: [
                0.16,
                1,
                0.3,
                1,
              ],
            }}
            style={{
              width:
                "min(300px, calc(100vw - 48px))",

              display: "flex",
              flexDirection:
                "column",
              alignItems: "center",
              justifyContent:
                "center",

              textAlign: "center",

              background:
                "transparent",
              border: "none",
              boxShadow: "none",
            }}
          >
            <motion.img
              src={STEA_LOGO}
              alt="STEA"
              onError={(event) => {
                if (
                  event.currentTarget.src.endsWith(
                    STEA_LOGO_FALLBACK
                  )
                ) {
                  return;
                }

                event.currentTarget.src =
                  STEA_LOGO_FALLBACK;
              }}
              animate={{
                scale: [
                  1,
                  1.04,
                  1,
                ],
                filter: [
                  "drop-shadow(0 10px 24px rgba(245,166,35,.18))",
                  "drop-shadow(0 14px 34px rgba(245,166,35,.32))",
                  "drop-shadow(0 10px 24px rgba(245,166,35,.18))",
                ],
              }}
              transition={{
                duration: 2.4,
                ease: "easeInOut",
                repeat: Infinity,
              }}
              style={{
                width:
                  "clamp(76px, 10vw, 94px)",
                height:
                  "clamp(76px, 10vw, 94px)",

                objectFit:
                  "contain",
                display: "block",

                marginBottom: 30,
              }}
            />

            <div
              style={{
                width: "100%",
                height: 4,

                overflow: "hidden",
                borderRadius: 999,

                background:
                  "rgba(255,255,255,.09)",
              }}
            >
              <motion.div
                style={{
                  width: `${progress}%`,
                  height: "100%",

                  borderRadius: 999,

                  background:
                    `linear-gradient(
                      90deg,
                      ${SPLASH_GOLD} 0%,
                      ${SPLASH_GOLD_2} 54%,
                      ${SPLASH_BLUE} 100%
                    )`,

                  boxShadow:
                    "0 0 14px rgba(245,166,35,.18)",
                }}
              />
            </div>

            <div
              style={{
                marginTop: 15,

                fontSize: 10,
                fontWeight: 800,

                letterSpacing:
                  "0.24em",
                textTransform:
                  "uppercase",

                color:
                  "rgba(255,255,255,.46)",
              }}
            >
              {message
                .replace(
                  /\.+$/,
                  ""
                )
                .toUpperCase()}
            </div>

            {subtitle ? (
              <div
                style={{
                  marginTop: 8,

                  maxWidth: 260,

                  fontSize: 12,
                  lineHeight: 1.5,

                  color:
                    "rgba(255,255,255,.30)",
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
