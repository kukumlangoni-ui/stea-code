import {
  memo,
  useEffect,
  useMemo,
  useState,
} from "react";

import { TOKENS } from "./tokens.js";

import {
  resolveFavicon,
  extractHostname,
  deriveNameFromUrl,
} from "./favicon.js";

function FaviconTile({
  url = "",
  domain = "",
  faviconUrl = "",
  name = "",
  size = 32,
  className = "",
}) {
  const hostname = useMemo(
    () => extractHostname(domain || url || ""),
    [domain, url]
  );

  const resolvedName = useMemo(
    () =>
      name ||
      deriveNameFromUrl(url || "") ||
      hostname,
    [name, url, hostname]
  );

  const resolved = useMemo(
    () =>
      resolveFavicon({
        faviconUrl,
        url,
        domain: hostname,
        name: resolvedName,
      }),
    [faviconUrl, url, hostname, resolvedName]
  );

  const [networkReady, setNetworkReady] = useState(false);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [loadedSrc, setLoadedSrc] = useState(null);

  useEffect(() => {
    setCandidateIdx(0);
    setLoadedSrc(null);
    setNetworkReady(false);

    let cancelled = false;
    let idleId = null;
    let timerId = null;

    const enable = () => {
      if (!cancelled) setNetworkReady(true);
    };

    if (
      typeof window !== "undefined" &&
      typeof window.requestIdleCallback === "function"
    ) {
      idleId = window.requestIdleCallback(enable, {
        timeout: 280,
      });
    } else {
      timerId = window.setTimeout(enable, 40);
    }

    return () => {
      cancelled = true;

      if (
        idleId !== null &&
        typeof window.cancelIdleCallback === "function"
      ) {
        window.cancelIdleCallback(idleId);
      }

      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
    };
  }, [url, faviconUrl, hostname]);

  const candidates = resolved.candidates || [];

  const currentSrc =
    networkReady && candidateIdx < candidates.length
      ? candidates[candidateIdx]?.src
      : "";

  const letter = resolved.letter;
  const [paletteA, paletteB] = resolved.palette;
  const isImageLoaded = loadedSrc === currentSrc && currentSrc !== "";

  const nextOnError = () => {
    setLoadedSrc(null);

    setCandidateIdx((index) =>
      index + 1 < candidates.length
        ? index + 1
        : candidates.length
    );
  };

  const shellSize = size;
  const innerSize = Math.max(
    20,
    Math.round(size * 0.72)
  );

  const shellRadius = Math.max(
    9,
    Math.round(size * 0.28)
  );

  const innerRadius = Math.max(
    6,
    Math.round(innerSize * 0.24)
  );

  return (
    <span
      className={`favicon-tile premium-site-icon ${className}`.trim()}
      aria-hidden="true"
      style={{
        position: "relative",

        width: shellSize,
        height: shellSize,

        flex: `0 0 ${shellSize}px`,

        display: "inline-grid",
        placeItems: "center",

        overflow: "hidden",

        borderRadius: shellRadius,

        background:
          "linear-gradient(145deg, rgba(255,255,255,.075), rgba(255,255,255,.025))",

        border:
          "1px solid rgba(255,255,255,.11)",

        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,.06), 0 5px 14px rgba(0,0,0,.18)",

        boxSizing: "border-box",

        userSelect: "none",
      }}
    >
      <span
        className="premium-site-icon-inner"
        style={{
          position: "relative",

          width: innerSize,
          height: innerSize,

          display: "grid",
          placeItems: "center",

          overflow: "hidden",

          borderRadius: innerRadius,

          background:
            isImageLoaded
              ? "rgba(255,255,255,.96)"
              : `linear-gradient(135deg, ${paletteA}, ${paletteB})`,

          color: "#fff",

          boxShadow:
            "0 2px 8px rgba(0,0,0,.22)",

          fontSize: Math.max(
            10,
            Math.round(innerSize * 0.43)
          ),

          fontWeight: 900,

          lineHeight: 1,
        }}
      >
        <span
          style={{
            position: "absolute",
            inset: 0,

            display: "grid",
            placeItems: "center",

            opacity: isImageLoaded ? 0 : 1,

            transition:
              "opacity 100ms ease",
          }}
        >
          {letter}
        </span>

        {currentSrc && (
          <img key={currentSrc || "fallback"}
            src={currentSrc}
            alt=""
            width={innerSize}
            height={innerSize}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={() => setLoadedSrc(currentSrc)}
            onError={nextOnError}
            style={{
              position: "absolute",
              inset: 0,

              width: "100%",
              height: "100%",

              padding: Math.max(
                1,
                Math.round(innerSize * 0.06)
              ),

              boxSizing: "border-box",

              objectFit: "contain",

              opacity: isImageLoaded ? 1 : 0,

              transition:
                "opacity 120ms ease",

              display: "block",
            }}
          />
        )}
      </span>

      <style>{`
        .premium-site-icon {
          transform: translateZ(0);
          transition:
            transform 160ms ease,
            border-color 160ms ease,
            box-shadow 160ms ease;
        }

        article:hover .premium-site-icon,
        button:hover .premium-site-icon,
        a:hover .premium-site-icon {
          transform: translateY(-1px) scale(1.035);
          border-color: rgba(245, 166, 35, .25) !important;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.08),
            0 7px 18px rgba(0,0,0,.24),
            0 0 0 1px rgba(245,166,35,.035);
        }

        @media (prefers-reduced-motion: reduce) {
          .premium-site-icon {
            transition: none !important;
          }
        }
      `}</style>
    </span>
  );
}

export default memo(FaviconTile);
