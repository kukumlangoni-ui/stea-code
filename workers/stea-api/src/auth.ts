/**
 * Firebase Auth ID token verification using Web Crypto.
 *
 * Fetches Google's JWK set, caches them, and verifies the JWT
 * signature + audience (project ID) + expiry.
 *
 * Does NOT use firebase-admin (which requires Node.js crypto modules).
 */

import { Env } from "./firestore";
import { getSessionUser } from "./session";

interface DecodedToken {
  uid: string;
  email?: string;
  [key: string]: any;
}

interface JwkKey extends JsonWebKey {
  kid?: string;
}

let cachedKeys: { keys: Record<string, JwkKey>; expiresAt: number } | null = null;

const FIREBASE_JWKS_URL =
  "https://www.googleapis.com/robot/v1/metadata/jwk/securetoken@system.gserviceaccount.com";

function base64UrlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function parseJwt(token: string): { header: any; payload: any; signature: string; signingInput: string } {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT format");
  const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[0])));
  const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])));
  return {
    header,
    payload,
    signature: parts[2],
    signingInput: `${parts[0]}.${parts[1]}`,
  };
}

async function getJwks(): Promise<Record<string, JwkKey>> {
  const now = Date.now();
  if (cachedKeys && cachedKeys.expiresAt > now) return cachedKeys.keys;

  const res = await fetch(FIREBASE_JWKS_URL);
  if (!res.ok) throw new Error(`Failed to fetch Firebase JWK set: ${res.status}`);

  const body = (await res.json()) as { keys?: JwkKey[] };
  const keyMap: Record<string, JwkKey> = {};
  for (const k of body.keys || []) {
    if (k.kid) keyMap[k.kid] = k;
  }

  const cacheControl = res.headers.get("cache-control") || "";
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) * 1000 : 60 * 60 * 1000;

  cachedKeys = { keys: keyMap, expiresAt: now + maxAge };
  return keyMap;
}

/**
 * Verify a Firebase ID token and return the decoded payload.
 * Throws if the token is invalid, expired, or signed by the wrong project.
 */
export async function verifyFirebaseToken(env: Env, token: string): Promise<DecodedToken> {
  const { header, payload, signature, signingInput } = parseJwt(token);

  // Check expiry
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) throw new Error("Token expired");
  if (payload.iat && payload.iat > now + 300) throw new Error("Token issued in the future");

  // Check audience = project ID
  if (payload.aud !== env.FIREBASE_PROJECT_ID) {
    throw new Error(`Token audience mismatch: ${payload.aud} !== ${env.FIREBASE_PROJECT_ID}`);
  }

  // Check issuer
  const expectedIss = `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`;
  if (payload.iss !== expectedIss) {
    throw new Error(`Token issuer mismatch`);
  }

  // Verify signature
  const keys = await getJwks();
  const kid = header.kid as string;
  const jwk = keys[kid];
  if (!jwk) throw new Error(`Public key not found for kid: ${kid}`);

  const publicKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const signatureBytes = base64UrlDecode(signature);
  const dataBytes = new TextEncoder().encode(signingInput);

  const valid = await crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    publicKey,
    signatureBytes,
    dataBytes
  );

  if (!valid) throw new Error("Invalid token signature");

  return {
    uid: payload.sub,
    email: payload.email,
    ...payload,
  };
}

/**
 * Cloudflare Access authentication.
 *
 * When a request passes through a Cloudflare Access application, Cloudflare
 * injects `Cf-Access-Authenticated-User-Email` after the user has logged in.
 * We only need that header — no token verification, no Firebase, no cookies.
 *
 * Returns the normalized (trimmed, lower-cased) email, or null when the
 * request is not authenticated.
 *
 * Note: direct requests that bypass Access never receive this header from
 * Cloudflare (Cloudflare strips client-supplied copies), so the header can be
 * trusted only when every route is fronted by the Access application.
 */
export function getAuthenticatedUser(request: Request): string | null {
  const raw = request.headers.get("Cf-Access-Authenticated-User-Email");
  if (!raw) return null;
  const email = raw.trim().toLowerCase();
  return email || null;
}

// ---------------------------------------------------------------------------
// CF_Authorization cookie verification
//
// The email header above is injected ONLY on requests that pass through an
// Access application. Our public storefront paths must stay open, so they are
// not behind Access — yet after login their API calls still need identity.
// The CF_Authorization cookie is set host-wide by Access, so we verify its
// signature against the team's published certs and read `email` from it.
// ---------------------------------------------------------------------------

const ACCESS_TEAM_DOMAIN = "https://ancient-feather-03ae.cloudflareaccess.com";
const ACCESS_CERTS_URL = `${ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`;

let cachedAccessKeys: { keys: Record<string, JwkKey>; expiresAt: number } | null = null;

async function getAccessJwks(): Promise<Record<string, JwkKey>> {
  const now = Date.now();
  if (cachedAccessKeys && cachedAccessKeys.expiresAt > now) return cachedAccessKeys.keys;

  const res = await fetch(ACCESS_CERTS_URL);
  if (!res.ok) throw new Error(`Failed to fetch Access certs: ${res.status}`);

  const body = (await res.json()) as { keys?: JwkKey[] };
  const keyMap: Record<string, JwkKey> = {};
  for (const k of body.keys || []) {
    if (k.kid) keyMap[k.kid] = k;
  }

  cachedAccessKeys = { keys: keyMap, expiresAt: now + 60 * 60 * 1000 };
  return keyMap;
}

/**
 * Verify a CF_Authorization JWT and return the user's email.
 * Returns null for missing / malformed / expired / wrongly-signed tokens.
 */
export async function verifyAccessToken(token: string): Promise<string | null> {
  try {
    const { header, payload, signature, signingInput } = parseJwt(token);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;
    if (payload.iss && payload.iss !== ACCESS_TEAM_DOMAIN) return null;

    const keys = await getAccessJwks();
    const jwk = keys[header.kid as string];
    if (!jwk) return null;

    const publicKey = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const valid = await crypto.subtle.verify(
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      publicKey,
      base64UrlDecode(signature),
      new TextEncoder().encode(signingInput)
    );

    if (!valid) return null;

    const email = String(payload.email || "").trim().toLowerCase();
    return email || null;
  } catch {
    return null;
  }
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      return part.slice(idx + 1).trim();
    }
  }
  return null;
}

/**
 * Resolve the caller's email from Access: the injected header when the route
 * is Access-protected, otherwise the verified CF_Authorization cookie.
 */
export async function resolveAccessEmail(request: Request): Promise<string | null> {
  const header = getAuthenticatedUser(request);
  if (header) return header;

  const token = readCookie(request, "CF_Authorization");
  if (!token) return null;
  return verifyAccessToken(token);
}

export interface RequestUser {
  uid: string;
  email: string | null;
  source: "access" | "session" | "firebase";
}

/**
 * Resolve the caller from Cloudflare Access, then the first-party email
 * session (cookie or Bearer token), then a Firebase ID token for clients that
 * still send one (admin / legacy).
 * Returns null when none of them is present or valid.
 */
export async function resolveRequestUser(req: Request, env: Env): Promise<RequestUser | null> {
  const accessEmail = await resolveAccessEmail(req);
  if (accessEmail) {
    return { uid: accessEmail, email: accessEmail, source: "access" };
  }

  const sessionUser = await getSessionUser(req, env);
  if (sessionUser) {
    return { uid: sessionUser.id, email: sessionUser.email, source: "session" };
  }

  const token = extractBearerToken(req);
  if (!token) return null;

  try {
    const decoded = await verifyFirebaseToken(env, token);
    return {
      uid: decoded.uid,
      email: (String(decoded.email || "").trim().toLowerCase()) || null,
      source: "firebase",
    };
  } catch {
    return null;
  }
}

/**
 * Extract the Bearer token from the Authorization header.
 */
export function extractBearerToken(req: Request): string | null {
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}
