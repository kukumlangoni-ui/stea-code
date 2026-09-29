import React, { useState, useMemo } from "react";
import { Copy, Heart, Download, Sparkles } from "lucide-react";

/** Max 5 tools with valid http(s) URLs; supports legacy shapes */
export function normalizePromptTools(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((t) => ({
      toolName: String(t?.toolName || t?.name || t?.label || "").trim(),
      iconUrl: String(t?.iconUrl || "").trim(),
      toolUrl: String(t?.toolUrl || t?.url || "").trim(),
    }))
    .filter((t) => /^https?:\/\//i.test(t.toolUrl))
    .slice(0, 5)
    .map((t) => ({
      ...t,
      toolName: t.toolName || toolNameFromUrl(t.toolUrl),
    }));
}

function toolNameFromUrl(url) {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    return h.split(".")[0] || "AI";
  } catch {
    return "AI";
  }
}

function fallbackInitial(name) {
  const s = (name || "A").trim();
  return (s[0] || "A").toUpperCase();
}

/**
 * Shared prompt card for Prompt Lab + homepage preview.
 * Matches WebsiteSolutionCard premium black/gold layout.
 */
export function PromptLabCard({ p, onLike, className = "", style = {} }) {
  const [copied, setCopied] = useState(false);
  const [badIconIdx, setBadIconIdx] = useState(() => new Set());
  
  const ACCENT = "#F5A623"; // Gold accent for prompts
  const BORDER = "rgba(255,255,255,.08)";

  const image = p.imageUrl || p.image || "";
  const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop";
  const imageToUse = image || FALLBACK_IMAGE;

  const title = p.title || p.name || "Untitled Prompt";
  const desc = p.description || p.prompt || "No description available";
  const fullPromptText = (p.prompt || p.description || "").trim();
  const category = p.tags?.[0] || p.category || "Prompt";
  const likesCount = p.likes || 0;
  const isPremiumPrompt = !!p.isPremium;
  
  const tools = useMemo(() => normalizePromptTools(p.tools), [p.tools]);

  const handleCopy = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!fullPromptText) return;
    navigator.clipboard.writeText(fullPromptText).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openTool = (e, url) => {
    e.preventDefault();
    e.stopPropagation();
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        textAlign: "left",
        background: "rgba(15, 17, 21, 0.6)",
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        overflow: "hidden",
        position: "relative",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        fontFamily: "'Instrument Sans', system-ui, sans-serif",
        width: "100%",
        height: "100%",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        ...style
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "rgba(245,166,35,0.45)";
        e.currentTarget.style.transform = "translateY(-6px)";
        e.currentTarget.style.boxShadow = "0 12px 30px rgba(245,166,35,0.15)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = BORDER;
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)";
      }}
    >
      {/* Image Container */}
      <div style={{ 
        width: "100%", 
        aspectRatio: "4 / 3", 
        background: "rgba(255,255,255,.03)", 
        position: "relative", 
        overflow: "hidden" 
      }}>
        <img
          src={imageToUse}
          alt={title}
          loading="lazy"
          decoding="async"
          style={{ 
            width: "100%", 
            height: "100%", 
            objectFit: "cover", 
            objectPosition: "center",
            display: "block",
            transition: "transform 0.4s ease"
          }}
          referrerPolicy="no-referrer"
          onError={e => {
            e.target.src = FALLBACK_IMAGE;
          }}
        />

        {/* Featured / Premium Badge */}
        {isPremiumPrompt && (
          <div style={{ 
            position: "absolute", 
            top: 12, 
            left: 12, 
            background: ACCENT, 
            color: "#000", 
            fontSize: 10, 
            fontWeight: 900, 
            padding: "4px 10px", 
            borderRadius: 8, 
            textTransform: "uppercase", 
            letterSpacing: ".04em",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: 4
          }}>
            <Sparkles size={10} color="#000" /> PREMIUM
          </div>
        )}

        {/* Top Right Likes (Optional) */}
        {typeof onLike === "function" && (
          <button
            type="button"
            onClick={(e) => onLike(e, p.id)}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "rgba(0,0,0,.6)",
              border: "1px solid rgba(255,255,255,.1)",
              backdropFilter: "blur(4px)",
              color: "#fff",
              padding: "4px 8px",
              borderRadius: 20,
              cursor: "pointer",
              zIndex: 2,
              transition: "all .2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,.8)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,.6)"}
          >
            <Heart size={12} fill={likesCount > 0 ? "white" : "none"} />
            <span style={{ fontSize: 11, fontWeight: 700 }}>{likesCount}</span>
          </button>
        )}
      </div>

      {/* Content Area */}
      <div style={{ padding: "16px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
        {category && (
          <div style={{ 
            fontSize: 10, 
            fontWeight: 900, 
            color: ACCENT, 
            textTransform: "uppercase", 
            letterSpacing: ".08em", 
            marginBottom: 6,
            opacity: 0.9
          }}>
            {category}
          </div>
        )}

        <h3 style={{ 
          fontSize: 16, 
          fontWeight: 800, 
          color: "#fff", 
          margin: "0 0 8px", 
          lineHeight: 1.2, 
          display: "-webkit-box", 
          WebkitLineClamp: 2, 
          WebkitBoxOrient: "vertical", 
          overflow: "hidden" 
        }}>
          {title}
        </h3>

        <p style={{ 
          fontSize: 13, 
          color: "rgba(255,255,255,0.5)", 
          margin: "0 0 16px", 
          lineHeight: 1.5, 
          display: "-webkit-box", 
          WebkitLineClamp: 2, 
          WebkitBoxOrient: "vertical", 
          overflow: "hidden", 
          flex: 1 
        }}>
          {desc}
        </p>

        {/* Tools row */}
        {tools.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".05em" }}>
              Use with
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {tools.map((tool, idx) => {
                const showFallback = !tool.iconUrl || badIconIdx.has(idx);
                return (
                  <a
                    key={`${p.id}-${idx}`}
                    href={tool.toolUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={tool.toolName}
                    onClick={(e) => openTool(e, tool.toolUrl)}
                    style={{
                      width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", textDecoration: "none", color: "#fff"
                    }}
                  >
                    {!showFallback ? (
                      <img
                        src={tool.iconUrl}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        referrerPolicy="no-referrer"
                        onError={() => setBadIconIdx((prev) => new Set(prev).add(idx))}
                      />
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 700 }}>{fallbackInitial(tool.toolName)}</span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          gap: 12,
          marginTop: "auto",
          paddingTop: 12,
          borderTop: "1px solid rgba(255,255,255,0.05)"
        }}>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              flex: 1,
              height: 36,
              borderRadius: 8,
              background: "rgba(245,166,35,0.1)",
              border: "1px solid rgba(245,166,35,0.2)",
              color: ACCENT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              transition: "all .2s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(245,166,35,0.15)";
              e.currentTarget.style.borderColor = "rgba(245,166,35,0.4)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(245,166,35,0.1)";
              e.currentTarget.style.borderColor = "rgba(245,166,35,0.2)";
            }}
          >
            <Copy size={14} /> {copied ? "COPIED!" : "COPY PROMPT"}
          </button>

          {p.howToUse && (
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              title="Download Guide"
              style={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,.05)",
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 8,
                color: "rgba(255,255,255,.6)",
                cursor: "pointer",
                transition: "all .2s"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(255,255,255,.1)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(255,255,255,.05)";
                e.currentTarget.style.color = "rgba(255,255,255,.6)";
              }}
            >
              <Download size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

