import React, { useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Check } from "lucide-react";

export const G = "#F5A623";
export const G2 = "#FFD17C";
export const CB = "#141823";
export const BORDER = "rgba(255,255,255,.08)";

export const BS = {
  gold: {
    background: "rgba(245,166,35,.2)",
    color: G,
    border: "1px solid rgba(245,166,35,.3)",
  },
  blue: {
    background: "rgba(59,130,246,.2)",
    color: "#93c5fd",
    border: "1px solid rgba(59,130,246,.3)",
  },
  red: {
    background: "rgba(239,68,68,.2)",
    color: "#fca5a5",
    border: "1px solid rgba(239,68,68,.3)",
  },
  purple: {
    background: "rgba(99,102,241,.2)",
    color: "#a5b4fc",
    border: "1px solid rgba(99,102,241,.3)",
  },
  gray: {
    background: "rgba(255,255,255,.1)",
    color: "rgba(255,255,255,.8)",
    border: "1px solid rgba(255,255,255,.2)",
  },
};

export function TiltCard({ children, style = {}, className = "", onClick }) {
  const ref = useRef(null);
  const apply = useCallback((x, y) => {
    if (window.innerWidth < 768) return;
    const c = ref.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const px = (x - r.left) / r.width,
      py = (y - r.top) / r.height;
    c.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 7}deg) rotateY(${(px - 0.5) * 9}deg) translateY(-6px)`;
    c.style.boxShadow = "0 22px 54px rgba(0,0,0,.4)";
    c.style.borderColor = "rgba(245,166,35,.25)";
  }, []);
  const reset = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = "";
    ref.current.style.boxShadow = "0 12px 36px rgba(0,0,0,.2)";
    ref.current.style.borderColor = "rgba(255,255,255,.08)";
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      onClick={onClick}
      onMouseMove={(e) => apply(e.clientX, e.clientY)}
      onMouseLeave={reset}
      onTouchStart={(e) => {
        const t = e.touches[0];
        apply(t.clientX, t.clientY);
      }}
      onTouchMove={(e) => {
        const t = e.touches[0];
        apply(t.clientX, t.clientY);
      }}
      onTouchEnd={() => setTimeout(reset, 300)}
      style={{ 
        position: "relative",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,.08)",
        background: CB,
        overflow: "hidden",
        transition: "border-color .3s,box-shadow .3s",
        boxShadow: "0 12px 36px rgba(0,0,0,.2)",
        transformStyle: "preserve-3d",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Thumb({ bg, iconUrl, name, domain, badge, bt, imageUrl, fit = "cover" }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = imageUrl && !imgError;
  const [iconError, setIconError] = useState(false);
  const hasIcon = iconUrl && !iconError;

  return (
    <div
      style={{
        position: "relative",
        aspectRatio: "16/9",
        background: "rgba(255,255,255,.03)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "36px 20px 20px",
        overflow: "hidden",
        borderBottom: "1px solid rgba(255,255,255,.07)",
      }}
    >
      {hasImage ? (
        <img
          loading="lazy"
          src={imageUrl}
          alt={name}
          referrerPolicy="no-referrer"
          style={{
            width: "100%",
            height: "100%",
            objectFit: fit,
            position: "absolute",
            inset: 0,
          }}
          onError={() => setImgError(true)}
        />
      ) : (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: bg,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 30% 30%,rgba(255,255,255,.12),transparent 60%)",
              pointerEvents: "none",
            }}
          />
        </>
      )}
      {badge && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            padding: "5px 12px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 900,
            zIndex: 5,
            ...(BS[bt] || BS.gray),
          }}
        >
          {badge}
        </div>
      )}
      {!hasImage && (
        <>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              overflow: "hidden",
              display: "grid",
              placeItems: "center",
              background: "rgba(255,255,255,.1)",
              zIndex: 2,
              backdropFilter: "blur(10px)",
            }}
          >
            {hasIcon && (
              <img
                src={iconUrl}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                referrerPolicy="no-referrer"
                onError={() => setIconError(true)}
              />
            )}
          </div>
          <div
            style={{
              fontFamily: "'Bricolage Grotesque',sans-serif",
              fontSize: 15,
              fontWeight: 800,
              color: "rgba(255,255,255,.92)",
              zIndex: 2,
              textAlign: "center",
            }}
          >
            {name}
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 12px",
              borderRadius: 99,
              background: "rgba(255,255,255,.15)",
              color: "#fff",
              zIndex: 2,
            }}
          >
            {domain}
          </span>
        </>
      )}
    </div>
  );
}

export function PushBtn({ children, onClick, style = {} }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.querySelector(".ps").style.transform = "translateY(4px)";
        e.currentTarget.querySelector(".pf").style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.querySelector(".ps").style.transform = "translateY(2px)";
        e.currentTarget.querySelector(".pf").style.transform = "translateY(-2px)";
      }}
      onMouseDown={(e) => {
        e.currentTarget.querySelector(".ps").style.transform = "translateY(0px)";
        e.currentTarget.querySelector(".pf").style.transform = "translateY(0px)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.querySelector(".ps").style.transform = "translateY(4px)";
        e.currentTarget.querySelector(".pf").style.transform = "translateY(-4px)";
      }}
      style={{
        position: "relative",
        background: "transparent",
        padding: 0,
        border: "none",
        cursor: "pointer",
        outline: "none",
        ...style,
      }}
    >
      <div
        className="ps"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          borderRadius: 14,
          background: "rgba(245,166,35,.15)",
          transform: "translateY(2px)",
          transition: "transform 0.1s",
        }}
      />
      <div
        className="pf"
        style={{
          position: "relative",
          background: G,
          color: "#111",
          borderRadius: 14,
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          fontSize: 14,
          fontWeight: 900,
          transform: "translateY(-2px)",
          transition: "transform 0.1s",
        }}
      >
        {children}
      </div>
    </button>
  );
}

export function GoldBtn({ children, onClick, style = {}, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={className}
      style={{
        padding: "11px 24px",
        borderRadius: 12,
        border: "none",
        background: `linear-gradient(135deg,${G},${G2})`,
        color: "#111",
        fontWeight: 900,
        cursor: "pointer",
        fontSize: 14,
        boxShadow: "0 4px 12px rgba(245,166,35,.2)",
        transition: "all .2s",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(245,166,35,.32)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(245,166,35,.2)";
      }}
    >
      {children}
    </button>
  );
}

export function CopyBtn({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      style={{
        background: copied ? "rgba(34,197,94,.1)" : "rgba(255,255,255,.05)",
        border: `1px solid ${copied ? "rgba(34,197,94,.2)" : "rgba(255,255,255,.1)"}`,
        color: copied ? "#22c55e" : "#fff",
        padding: "6px 10px",
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 800,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        transition: "all .2s",
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function Portal({ children }) {
  return createPortal(children, document.body);
}

export function W({ children, style, className = "" }) {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(16px,5vw,32px)", ...style }} className={className}>
      {children}
    </div>
  );
}

export function SHead({ title, hi, copy }) {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
      <h2
        className="stea-h1"
        style={{
          margin: "0 0 16px",
          textAlign: "center"
        }}
      >
        {title} <span style={{ color: G }}>{hi}</span>
      </h2>
      <p
        className="stea-text-muted"
        style={{
          fontSize: "clamp(14px, 2vw, 17px)",
          lineHeight: 1.6,
          maxWidth: 600,
          margin: "0 auto 24px",
          textAlign: "center"
        }}
      >
        {copy}
      </p>
    </div>
  );
}

export function Skeleton({ type = "card" }) {
  if (type === "card") {
    return (
      <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.05)", borderRadius: 20, height: 260, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,.03),transparent)", animation: "shimmer 1.5s infinite" }} />
      </div>
    );
  }
  return null;
}
