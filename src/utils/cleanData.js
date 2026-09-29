/**
 * cleanData / deepCleanData
 * Recursively strips undefined values so Firestore never throws
 * "Unsupported field value: undefined"
 */

export function cleanData(obj) {
  if (Array.isArray(obj)) return obj.map(cleanData);
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, cleanData(v)])
    );
  }
  return obj;
}

export const deepCleanData = cleanData;

/**
 * Generate a stable random ID (no crypto dep)
 */
export function genId(prefix = "") {
  return `${prefix}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Format TZS price
 */
export function fmtTZS(n) {
  if (!n && n !== 0) return "—";
  return `TZS ${Number(n).toLocaleString()}`;
}

/**
 * Format date from Firestore Timestamp or date string
 */
export function fmtDate(v, fallback = "—") {
  if (!v) return fallback;
  try {
    const d = v?.toDate ? v.toDate() : new Date(v);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return fallback;
  }
}

/**
 * Add days to a Date
 */
export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Check if date is expired
 */
export function isExpired(expiryDateOrTs) {
  if (!expiryDateOrTs) return false;
  const d = expiryDateOrTs?.toDate ? expiryDateOrTs.toDate() : new Date(expiryDateOrTs);
  return d < new Date();
}

/**
 * Days until expiry (negative = already expired)
 */
export function daysUntilExpiry(expiryDateOrTs) {
  if (!expiryDateOrTs) return null;
  const d = expiryDateOrTs?.toDate ? expiryDateOrTs.toDate() : new Date(expiryDateOrTs);
  return Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
}
