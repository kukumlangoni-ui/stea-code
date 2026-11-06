/**
 * Store session hook (first-party email login).
 *
 * The store no longer relies on Cloudflare Access. `/api/auth/login-email`
 * sets an HttpOnly `stea_session` cookie; the browser cannot read either the
 * cookie or an injected header, so on load we ask `/api/auth/me` who is
 * signed in and treat a resolved email as the current user.
 *
 * Login happens inside `SteaCodeMemberGate` (email form). Logout simply hits
 * `/api/auth/logout`, which clears the cookie and redirects to the homepage.
 */

import { useCallback, useEffect, useState } from "react";

export const STORE_LOGIN_URL = "/?login=1";
export const STORE_LOGOUT_URL = "/api/auth/logout";

const SESSION_TTL_MS = 60 * 1000;

// Shared between every component using the hook so a page load only hits
// /api/auth/me once.
let cachedEmail = null;
let cachedAt = 0;
let inFlight = null;

function toUser(email) {
  if (!email) return null;
  return {
    email,
    uid: `email:${email}`,
    displayName: email.split("@")[0],
    emailVerified: true,
    providerId: "email-session",
  };
}

/**
 * Fetch the current session email (or null).
 * Safe to call outside React. `force` bypasses the short-lived cache.
 */
export async function fetchCloudflareSession({ force = false } = {}) {
  if (!force && cachedAt && Date.now() - cachedAt < SESSION_TTL_MS) {
    return cachedEmail;
  }
  if (!force && inFlight) return inFlight;

  inFlight = fetch("/api/auth/me", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" },
  })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = await res.json();
      return typeof data?.email === "string" ? data.email.trim().toLowerCase() : null;
    })
    .catch(() => null)
    .then((email) => {
      cachedEmail = email;
      cachedAt = Date.now();
      inFlight = null;
      return email;
    });

  return inFlight;
}

/**
 * Point the browser at the SPA login gate on the homepage.
 * Only same-origin paths are forwarded, absolute URLs collapse to "/".
 */
export function getCloudflareLoginUrl(redirectUrl) {
  if (typeof window === "undefined") return STORE_LOGIN_URL;

  let target =
    redirectUrl ||
    `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (/^https?:\/\//i.test(target)) {
    try {
      const url = new URL(target);
      target = url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : "/";
    } catch {
      target = "/";
    }
  }
  if (!target.startsWith("/") || target.startsWith("//")) target = "/";

  const params = new URLSearchParams({ login: "1" });
  if (target !== "/" && !target.startsWith("/?")) params.set("redirect_url", target);
  return `/?${params.toString()}`;
}

export function getCloudflareLogoutUrl() {
  return STORE_LOGOUT_URL;
}

/**
 * A previous Access handshake could leave the browser on
 * /api/auth/login?redirect_url=... — rewrite it to the clean product URL.
 */
function cleanAuthRedirectUrl() {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  if (!pathname.startsWith("/api/auth/login")) return;
  const target = new URLSearchParams(search).get("redirect_url");
  const safeTarget =
    target && target.startsWith("/") && !target.startsWith("//") ? target : "/";
  window.history.replaceState({}, "", safeTarget);
}

export function useCloudflareAuth() {
  const [email, setEmail] = useState(() =>
    cachedAt ? cachedEmail : null
  );
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async ({ force = true } = {}) => {
    const next = await fetchCloudflareSession({ force });
    setEmail(next);
    setLoading(false);
    return next;
  }, []);

  useEffect(() => {
    let alive = true;
    // Clean the address bar first — a user returning from the legacy Access
    // hop should see the product URL, not /api/auth/login?redirect_url=...
    cleanAuthRedirectUrl();
    fetchCloudflareSession({ force: false }).then((next) => {
      if (!alive) return;
      setEmail(next);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  // The gate fires this after a successful email login so every mounted
  // instance picks up the new session without a reload.
  useEffect(() => {
    const onAuthChanged = () => {
      refresh({ force: true });
    };
    window.addEventListener("stea-auth-changed", onAuthChanged);
    return () => window.removeEventListener("stea-auth-changed", onAuthChanged);
  }, [refresh]);

  const login = useCallback((redirectUrl) => {
    window.location.assign(getCloudflareLoginUrl(redirectUrl));
  }, []);

  const logout = useCallback(() => {
    window.location.assign(getCloudflareLogoutUrl());
  }, []);

  return {
    user: toUser(email),
    email,
    loading,
    login,
    logout,
    refresh,
  };
}
