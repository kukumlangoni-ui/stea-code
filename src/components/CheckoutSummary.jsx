/**
 * CheckoutSummary — Live sticky order summary for Tanzania Marketplace checkout.
 * Shows on all steps: product, variant, qty, delivery, total.
 */
import React from "react";
import { ShoppingCart } from "lucide-react";
import { fmtTZS, resolveUnitPrice, calcTotal, getDeliveryFee } from "../hooks/useDeliverySettings.js";

const G      = "#F5A623";
const BORDER = "rgba(255,255,255,.08)";

function Row({ label, value, accent, strike, small }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: small ? 6 : 8 }}>
      <span style={{ fontSize: small ? 11 : 13, color: "rgba(255,255,255,.5)", fontWeight: 600 }}>{label}</span>
      <span style={{
        fontSize: small ? 11 : 13,
        fontWeight: 800,
        color: accent ? G : "#fff",
        textDecoration: strike ? "line-through" : "none",
        opacity: strike ? 0.4 : 1,
      }}>
        {value}
      </span>
    </div>
  );
}

export default function CheckoutSummary({ product, selectedVariant, quantity = 1, deliveryOption, deliverySettings, step }) {
  if (!product) return null;

  const unitPrice    = resolveUnitPrice(product, selectedVariant);
  const deliveryFee  = getDeliveryFee(deliveryOption, deliverySettings);
  const total        = calcTotal(unitPrice, quantity, deliveryFee);
  const name         = product.name || product.title || "Bidhaa";
  const hasVariants  = (product.variants || []).filter(v => v.active !== false).length > 0;

  const deliveryLabels = {
    pickup: "Pickup (Bure)",
    local:  `Dar es Salaam – ${fmtTZS(deliverySettings?.localFee ?? 5000)}`,
    region: `Mkoa Mwingine – ${fmtTZS(deliverySettings?.regionFee ?? 15000)}`,
  };

  return (
    <div style={{
      background: "rgba(255,255,255,.04)",
      border: `1px solid ${BORDER}`,
      borderRadius: 16,
      padding: "16px 18px",
      marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${BORDER}` }}>
        <ShoppingCart size={15} color={G} />
        <span style={{ fontSize: 12, fontWeight: 800, color: G, textTransform: "uppercase", letterSpacing: ".06em" }}>
          Muhtasari wa Oda
        </span>
      </div>

      <Row label="Bidhaa" value={name.length > 28 ? name.slice(0, 28) + "…" : name} small />

      {/* Variant */}
      {hasVariants && (
        <Row
          label="Chaguo"
          value={selectedVariant ? selectedVariant.label : "—Bado hujachagua—"}
          accent={!!selectedVariant}
          small
        />
      )}

      {/* Quantity */}
      {Number(quantity) > 1 && <Row label="Idadi" value={`× ${quantity}`} small />}

      {/* Unit price */}
      <Row label="Bei ya Bidhaa" value={unitPrice > 0 ? fmtTZS(unitPrice) : "—"} />

      {/* Delivery */}
      {deliveryOption && (
        <Row
          label="Utoaji"
          value={deliveryFee === 0 ? "Bure" : fmtTZS(deliveryFee)}
        />
      )}

      {!deliveryOption && (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", paddingBottom: 6 }}>
          Utoaji: bado hujachagua
        </div>
      )}

      {/* Divider */}
      <div style={{ borderTop: `1px solid ${BORDER}`, margin: "10px 0" }} />

      {/* Total */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,.6)" }}>Jumla</span>
        <span style={{ fontSize: 20, fontWeight: 900, color: G }}>
          {unitPrice > 0 ? fmtTZS(total) : "—"}
        </span>
      </div>

      {Number(quantity) > 1 && (
        <div style={{ textAlign: "right", fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 2 }}>
          ({fmtTZS(unitPrice + deliveryFee)} × {quantity})
        </div>
      )}
    </div>
  );
}
