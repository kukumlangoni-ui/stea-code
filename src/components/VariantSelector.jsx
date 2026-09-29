/**
 * VariantSelector — Premium product variant UI for Tanzania Marketplace.
 * Renders variant groups (Storage, RAM, Color, Size, etc.)
 * Mobile-first, highlight selected, error on missing required selection.
 */
import React from "react";
import { motion } from "framer-motion";
import { fmtTZS } from "../hooks/useDeliverySettings.js";

const G       = "#F5A623";
const BORDER  = "rgba(255,255,255,.09)";
const SURFACE = "rgba(255,255,255,.04)";

/**
 * @param {{ product, selectedVariant, onSelect, error }}
 */
export default function VariantSelector({ product, selectedVariant, onSelect, error }) {
  const variants = (product?.variants || []).filter(v => v.active !== false);
  if (variants.length === 0) return null;

  // Group by `groupLabel` (e.g. "Storage", "Color") or treat as flat list
  const groups = {};
  variants.forEach(v => {
    const g = v.groupLabel || v.optionName || "Options";
    (groups[g] = groups[g] || []).push(v);
  });
  const groupKeys = Object.keys(groups);

  const basePrice = Number(product?.discountPrice ?? product?.price ?? 0);

  return (
    <div style={{ marginTop: 18 }}>
      {groupKeys.map(group => {
        const items = groups[group].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        return (
          <div key={group} style={{ marginBottom: 18 }}>
            {/* Group heading */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,.55)", textTransform: "uppercase", letterSpacing: ".07em" }}>
                {group}
              </span>
              {selectedVariant && items.some(v => v.id === selectedVariant.id || v.label === selectedVariant.label) && (
                <span style={{ fontSize: 11, fontWeight: 800, color: G }}>
                  — {selectedVariant.label}
                </span>
              )}
            </div>

            {/* Variant chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {items.map(v => {
                const isSelected = selectedVariant?.id
                  ? selectedVariant.id === v.id
                  : selectedVariant?.label === v.label;
                const outOfStock = v.stock !== undefined && Number(v.stock) <= 0;
                const vPrice = v.price !== undefined && v.price !== "" ? Number(v.price) : null;
                const vOldPrice = v.oldPrice !== undefined && v.oldPrice !== "" ? Number(v.oldPrice) : null;
                const priceDiff = vPrice !== null ? vPrice - basePrice : null;

                return (
                  <motion.button
                    key={v.id || v.label}
                    whileTap={!outOfStock ? { scale: 0.96 } : {}}
                    onClick={() => !outOfStock && onSelect(v)}
                    disabled={outOfStock}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      padding: vPrice !== null ? "10px 14px" : "9px 16px",
                      borderRadius: 12,
                      border: isSelected
                        ? `2px solid ${G}`
                        : `1.5px solid ${outOfStock ? "rgba(255,255,255,.05)" : BORDER}`,
                      background: isSelected
                        ? `${G}10`
                        : outOfStock ? "rgba(255,255,255,.02)" : SURFACE,
                      cursor: outOfStock ? "not-allowed" : "pointer",
                      opacity: outOfStock ? 0.45 : 1,
                      position: "relative",
                      transition: "border-color .15s, background .15s",
                      minWidth: 80,
                    }}
                  >
                    {/* Selected dot */}
                    {isSelected && (
                      <div style={{
                        position: "absolute", top: 6, right: 6,
                        width: 8, height: 8, borderRadius: "50%",
                        background: G,
                      }} />
                    )}

                    {/* Variant image (if provided) */}
                    {v.imageUrl && (
                      <img
                        src={v.imageUrl}
                        alt={v.label}
                        style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", marginBottom: 6 }}
                        referrerPolicy="no-referrer"
                        onError={e => { e.target.style.display = "none"; }}
                      />
                    )}

                    {/* Label */}
                    <span style={{
                      fontSize: 13, fontWeight: isSelected ? 900 : 700,
                      color: isSelected ? G : outOfStock ? "rgba(255,255,255,.3)" : "#fff",
                      lineHeight: 1.2,
                    }}>
                      {v.label}
                    </span>

                    {/* Price */}
                    {vPrice !== null && (
                      <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: isSelected ? G : "rgba(255,255,255,.7)" }}>
                          {fmtTZS(vPrice)}
                        </span>
                        {vOldPrice !== null && vOldPrice > vPrice && (
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)", textDecoration: "line-through" }}>
                            {fmtTZS(vOldPrice)}
                          </span>
                        )}
                        {priceDiff !== null && priceDiff !== 0 && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: priceDiff > 0 ? "#f87171" : "#4ade80" }}>
                            {priceDiff > 0 ? `+${fmtTZS(priceDiff)}` : `-${fmtTZS(Math.abs(priceDiff))}`}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Out of stock badge */}
                    {outOfStock && (
                      <span style={{ fontSize: 9, fontWeight: 800, color: "#f87171", marginTop: 2, textTransform: "uppercase", letterSpacing: ".04em" }}>
                        Imeisha
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(239,68,68,.10)",
            border: "1px solid rgba(239,68,68,.25)",
            borderRadius: 10, padding: "10px 14px",
            fontSize: 13, fontWeight: 700, color: "#fca5a5",
            marginTop: 6,
          }}
        >
          ⚠️ {error}
        </motion.div>
      )}
    </div>
  );
}
