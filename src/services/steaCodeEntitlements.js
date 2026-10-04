/**
 * Entitlements service — fetches the current user's product entitlements.
 *
 * Used by the homepage to gate premium product copy/download buttons.
 */

import { getFirebaseAuth } from "../firebase.js";

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
    const auth = getFirebaseAuth();
    const user = auth?.currentUser;
    if (!user) {
      return EMPTY_STATE;
    }

    const token = await user.getIdToken();

    const res = await fetch("/api/stea-code/entitlements/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
