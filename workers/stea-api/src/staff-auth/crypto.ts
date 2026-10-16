/**
 * Password hashing + token generation for the Staff Auth system.
 *
 * PBKDF2-SHA256, 100,000 iterations, 32-byte derived key, 16-byte random salt.
 * Uses Cloudflare Web Crypto (SubtleCrypto) — no npm dependencies.
 */

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const saltBytes = salt ? hexToBytes(salt) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return { hash: bytesToHex(new Uint8Array(bits)), salt: bytesToHex(saltBytes) };
}

export async function verifyPassword(password: string, expectedHash: string, salt: string): Promise<boolean> {
  const { hash } = await hashPassword(password, salt);
  // Constant-time compare
  if (hash.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  return diff === 0;
}

export function generateToken(): string {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
}
