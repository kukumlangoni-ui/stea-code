/**
 * useDeliverySettings — reads site_settings/delivery from Firestore.
 * Falls back to Tanzania marketplace defaults (5,000 / 15,000 TZS).
 */
import { useState, useEffect } from "react";
import { getFirebaseDb, doc, getDoc, setDoc, serverTimestamp } from "../firebase.js";

export const DELIVERY_DEFAULTS = {
  localFee:    5000,
  regionFee:   15000,
  pickupLabel: "Shop Pickup – Dar es Salaam (Mwenge Mpakani) / Arusha Triple A",
  localLabel:  "Dar es Salaam Delivery (1-2 siku)",
  regionLabel: "Mikoa Mingine (2-5 siku)",
  paymentNumber: "0758561747",
  paymentNetwork: "Vodacom M-Pesa",
  adminWhatsApp: "255757053354",
};

export function useDeliverySettings() {
  const [settings, setSettings] = useState(DELIVERY_DEFAULTS);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) { setLoading(false); return; }

    (async () => {
      try {
        const snap = await getDoc(doc(db, "site_settings", "delivery"));
        if (snap.exists()) {
          setSettings(prev => ({ ...prev, ...snap.data() }));
        }
      } catch (e) {
        console.warn("useDeliverySettings:", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { settings, loading };
}

export async function saveDeliverySettings(data) {
  const db = getFirebaseDb();
  if (!db) throw new Error("DB not init");
  await setDoc(doc(db, "site_settings", "delivery"), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// ─── Variant utilities ───────────────────────────────────────────

/** Get active variants sorted by order field */
export function getActiveVariants(product) {
  const all = product?.variants || [];
  return all
    .filter(v => v.active !== false)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

/** Does this product require a variant selection? */
export function productHasVariants(product) {
  return getActiveVariants(product).length > 0;
}

/** Calculate per-unit price (variant overrides base price) */
export function resolveUnitPrice(product, selectedVariant) {
  if (selectedVariant && selectedVariant.price !== undefined && selectedVariant.price !== "") {
    return Number(selectedVariant.price) || 0;
  }
  return Number(product?.discountPrice ?? product?.price ?? 0);
}

/** Calculate total order amount */
export function calcTotal(unitPrice, qty, deliveryFee) {
  return (Number(unitPrice) + Number(deliveryFee)) * Number(qty);
}

/** Format TZS */
export function fmtTZS(n) {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (isNaN(num)) return "—";
  return `TZS ${num.toLocaleString()}`;
}

/** Delivery fee from option key */
export function getDeliveryFee(option, settings) {
  if (option === "pickup")  return 0;
  if (option === "local")   return Number(settings?.localFee  ?? DELIVERY_DEFAULTS.localFee);
  if (option === "region")  return Number(settings?.regionFee ?? DELIVERY_DEFAULTS.regionFee);
  return 0;
}
