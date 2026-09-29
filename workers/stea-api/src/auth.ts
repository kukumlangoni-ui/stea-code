/**
 * Firebase Auth ID token verification using Web Crypto.
 *
 * Fetches Google's JWK set, caches them, and verifies the JWT
 * signature + audience (project ID) + expiry.
 *
 * Does NOT use firebase-admin (which requires Node.js crypto modules).
 */

import { Env } from "./firestore";

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
 * Extract the Bearer token from the Authorization header.
 */
export function extractBearerToken(req: Request): string | null {
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}
