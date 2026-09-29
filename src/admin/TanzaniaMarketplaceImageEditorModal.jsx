import React, { useState, useEffect } from "react";
import { X, Pencil } from "lucide-react";
import {
  DEFAULT_TZ_PRODUCT_IMAGE_DISPLAY,
  normalizeTzProductImageDisplay,
  tzProductDetailImageStyle,
} from "../utils/tanzaniaProductImageDisplay.js";

const G = "#F5A623";

const labelStyle = {
  fontSize: 11,
  fontWeight: 800,
  color: "rgba(255,255,255,.45)",
  textTransform: "uppercase",
  letterSpacing: ".07em",
  marginBottom: 6,
  display: "block",
};

function Slider({ label, min, max, step, value, onChange }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={labelStyle}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: G }}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: G }}
      />
    </div>
  );
}

/** Pencil + modal to edit Tanzania marketplace hero image framing (saved on product). */
export function TanzaniaMarketplaceImageEditorTrigger({ imageUrl, value, onApply, disabled }) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState(() => normalizeTzProductImageDisplay(value));

  useEffect(() => {
    if (open) setLocal(normalizeTzProductImageDisplay(value));
  }, [open, value]);

  const setField = (k, v) => setLocal((prev) => ({ ...prev, [k]: v }));

  const handleApply = () => {
    onApply(normalizeTzProductImageDisplay(local));
    setOpen(false);
  };

  const previewStyle = tzProductDetailImageStyle(local);

  return (
    <>
      <div style={{ position: "relative", display: "inline-block", verticalAlign: "top" }}>
        <div
          className="tanzania-detail-image-wrap"
          style={{
            width: "min(100%, 260px)",
            margin: 0,
            opacity: disabled ? 0.45 : 1,
            pointerEvents: disabled ? "none" : "auto",
          }}
        >
          <div className="tanzania-detail-image-frame">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                className="tanzania-detail-image"
                style={previewStyle}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="tanzania-detail-image-empty" style={{ minHeight: 120, fontSize: 48 }}>
                📷
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          title="Hariri muonekano wa picha"
          disabled={disabled || !imageUrl}
          onClick={() => setOpen(true)}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "none",
            background: "rgba(0,0,0,0.55)",
            color: "#fff",
            cursor: disabled || !imageUrl ? "not-allowed" : "pointer",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
          }}
        >
          <Pencil size={17} />
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100002,
            background: "rgba(0,0,0,0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            overflowY: "auto",
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            style={{
              width: "min(520px, 100%)",
              borderRadius: 18,
              background: "#141823",
              border: "1px solid rgba(255,255,255,.1)",
              padding: "20px 20px 18px",
              maxHeight: "92vh",
              overflowY: "auto",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 18, fontWeight: 900 }}>
                Muonekano wa picha — Tanzania
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  background: "rgba(255,255,255,.06)",
                  border: "none",
                  borderRadius: 10,
                  width: 40,
                  height: 40,
                  cursor: "pointer",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="tanzania-detail-image-wrap" style={{ width: "100%", maxWidth: "100%", marginBottom: 18 }}>
              <div className="tanzania-detail-image-frame">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt=""
                    className="tanzania-detail-image"
                    style={previewStyle}
                    referrerPolicy="no-referrer"
                  />
                ) : null}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <span style={labelStyle}>Mtindo wa kujaza</span>
              <div style={{ display: "flex", gap: 10 }}>
                {["cover", "contain"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setField("imageFit", m)}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 10,
                      border:
                        local.imageFit === m ? `2px solid ${G}` : "1px solid rgba(255,255,255,.12)",
                      background: local.imageFit === m ? `${G}22` : "rgba(255,255,255,.04)",
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <Slider label="Zoom" min={1} max={2} step={0.01} value={local.imageZoom} onChange={(v) => setField("imageZoom", v)} />
            <Slider
              label="Msimamo mlalo (%)"
              min={0}
              max={100}
              step={1}
              value={local.imagePositionX}
              onChange={(v) => setField("imagePositionX", v)}
            />
            <Slider
              label="Msimamo wima (%)"
              min={0}
              max={100}
              step={1}
              value={local.imagePositionY}
              onChange={(v) => setField("imagePositionY", v)}
            />

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setLocal({ ...DEFAULT_TZ_PRODUCT_IMAGE_DISPLAY })}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,.12)",
                  background: "transparent",
                  color: "rgba(255,255,255,.75)",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Rejesha chaguo-msingi
              </button>
              <button
                type="button"
                onClick={handleApply}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "none",
                  background: G,
                  color: "#000",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Tumia
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
