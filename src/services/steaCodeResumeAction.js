/* =============================================================
 * STEA Code — Resume action service (safe, sessionStorage backed)
 * ============================================================= */

const SESSION_KEY = "stea_code_pending_action";

export const STEA_CODE_ACTION_TYPES = {
  PREMIUM_CHECKOUT: "premium-checkout",
  FREE_CODE: "free-code",
  PURCHASES: "purchases",
  PAYMENT_RETURN: "payment-return",
};

function safeParse(raw) {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return null;
    if (typeof obj.type !== "string") return null;
    const allowed = Object.values(STEA_CODE_ACTION_TYPES);
    if (!allowed.includes(obj.type)) return null;
    const out = { type: obj.type };
    if (typeof obj.productId === "string") out.productId = obj.productId;
    if (typeof obj.orderId === "string") out.orderId = obj.orderId;
    return out;
  } catch {
    return null;
  }
}

export function getSteaCodePendingAction() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    return safeParse(raw);
  } catch {
    return null;
  }
}

export function setSteaCodePendingAction(action) {
  if (typeof window === "undefined") return;
  try {
    if (!action) {
      window.sessionStorage.removeItem(SESSION_KEY);
      return;
    }
    const safe = safeParse(JSON.stringify(action));
    if (!safe) {
      window.sessionStorage.removeItem(SESSION_KEY);
      return;
    }
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(safe));
  } catch {
    /* ignore */
  }
}

export function clearSteaCodePendingAction() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function makePremiumCheckoutAction(productId) {
  return {
    type: STEA_CODE_ACTION_TYPES.PREMIUM_CHECKOUT,
    productId: String(productId || "").trim(),
  };
}

export function makeFreeCodeAction(productId) {
  return {
    type: STEA_CODE_ACTION_TYPES.FREE_CODE,
    productId: String(productId || "").trim(),
  };
}

export function makePurchasesAction() {
  return { type: STEA_CODE_ACTION_TYPES.PURCHASES };
}

export function makePaymentReturnAction(orderId) {
  return {
    type: STEA_CODE_ACTION_TYPES.PAYMENT_RETURN,
    orderId: String(orderId || "").trim(),
  };
}
