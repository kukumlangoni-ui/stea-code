/**
 * Entitlements service — fetches the current user's product entitlements.
 *
 * Used by the homepage to gate premium product copy/download buttons.
 */

const EMPTY_STATE = { hasProLifetime: false, productIds: new Set() };

/**
 * Fetch entitlements for the current signed-in user.
 *
 * Returns { hasProLifetime: boolean, productIds: Set<string> }.
 *
 * If not signed in, returns the empty shape without making a request.
 * On error, logs a warning and returns the empty shape (never throws).
 */
export async function fetchEntitlements() {
  try {
    // Cloudflare Access authenticates via the session cookie — same-origin
    // requests carry it automatically.
    const res = await fetch("/api/stea-code/entitlements/me", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn("[entitlements] HTTP", res.status);
      return EMPTY_STATE;
    }

    const data = await res.json();
    const productIds = Array.isArray(data.productIds)
      ? new Set(data.productIds.filter((id) => id && typeof id === "string"))
      : new Set();

    return {
      hasProLifetime: data.hasProLifetime === true || productIds.has("pro-lifetime"),
      productIds,
    };
  } catch (err) {
    console.warn("[entitlements] fetch failed:", err);
    return EMPTY_STATE;
  }
}
