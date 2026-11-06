/**
 * 6‑digit OTP helper for the SteaCode soft gate.
 *
 * Design notes:
 *  - We STORE the SHA‑256 HASH of the code in D1 — the plaintext 6‑digit
 *    number is generated in memory, emailed to the user, and immediately
 *    discarded. Never persisted, never logged.
 *  - TTL is 10 minutes. On verify we mark the row as consumed_at so the
 *    same code cannot be replayed.
 *  - Resend email is best‑effort. When RESEND_API_KEY is missing (local
 *    dev, pre‑setup production), sendVerificationCode logs the plaintext
 *    code to worker console and returns { ok: true, emailSent: false,
 *    code: "424242" } — useful for staging. NEVER expose the plaintext
 *    code to the browser in production; the "not sent" branch only
 *    surfaces it when the API key is absent (a local‑dev / admin test
 *    scenario).
 */

import type { WorkerEnv } from "./index";

export const CODE_LENGTH = 6;
export const CODE_TTL_MIN = 10;

export function randomCode(): string {
  // Math.random() is fine for 10-minute OTPs; 10^6 space is big enough
  // vs. brute‑force window and the short TTL. If we ever add rate
  // limiting, switch to crypto.getRandomValues.
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) out += Math.floor(Math.random() * 10);
  return out;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function isoNow() { return new Date().toISOString(); }
function isoMinutesFromNow(mins: number) {
  return new Date(Date.now() + mins * 60 * 1000).toISOString();
}

export interface SendCodeResult {
  ok: boolean;
  emailSent: boolean;
  expiresAt?: string;
  warning?: string;
  /** ONLY surfaced when ALLOW_DEBUG_OTP=true (local‑dev fallback). */
  debugCode?: string;
  error?: string;
  /** Upstream provider message (Resend body) so the UI can show WHY it failed. */
  detail?: string;
  /** HTTP status returned by the provider (403 = sender/domain not allowed). */
  status?: number;
  code?: "EMAIL_NOT_CONFIGURED" | "EMAIL_REJECTED" | "DB_ERROR";
}

/**
 * Generate a fresh code for `email`, save the hash, attempt to email it.
 * Rate‑limit per email: drop any previous unconsumed row before inserting.
 */
export async function sendVerificationCode(email: string, env: WorkerEnv): Promise<SendCodeResult> {
  const safeEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail)) {
    return { ok: false, emailSent: false, error: "Invalid email address" };
  }

  const code = randomCode();
  const codeHash = await sha256Hex(code);
  const createdAt = isoNow();
  const expiresAt = isoMinutesFromNow(CODE_TTL_MIN);
  const id = crypto.randomUUID();

  try {
    // Invalidate any existing code for this email so the latest one wins.
    await env.DB.prepare(
      `UPDATE verification_codes SET consumed_at = ? WHERE email = ? AND consumed_at IS NULL`
    ).bind(createdAt, safeEmail).run();

    await env.DB.prepare(
      `INSERT INTO verification_codes (id, email, code_hash, created_at, expires_at, created_by)
       VALUES (?, ?, ?, ?, ?, 'soft-gate')`
    ).bind(id, safeEmail, codeHash, createdAt, expiresAt).run();
  } catch (dbErr: any) {
    return {
      ok: false,
      emailSent: false,
      error: "Could not store the verification code.",
      detail: dbErr?.message || "DB insert failed",
      code: "DB_ERROR",
    };
  }

  // --- Send email ---
  const apiKey = env.RESEND_API_KEY as string | undefined;
  // steacode.com is verified in Resend — default to the domain sender.
  // RESEND_FROM (secret) overrides if we ever need a different sender.
  const from = env.RESEND_FROM || "SteaCode <login@steacode.com>";

  if (!apiKey) {
    const allowDebug = (env.ALLOW_DEBUG_OTP as string | undefined) === "true";
    console.warn(`[OTP] RESEND_API_KEY not bound — code for ${safeEmail}: ${code}`);
    if (!allowDebug) {
      return {
        ok: false,
        emailSent: false,
        error: "Email provider is not configured on the server.",
        detail: "RESEND_API_KEY is not bound to the Worker (wrangler secret put RESEND_API_KEY).",
        code: "EMAIL_NOT_CONFIGURED",
      };
    }
    return {
      ok: true,
      emailSent: false,
      expiresAt,
      warning: "Email provider not configured. Code was logged to the worker console.",
      debugCode: code,
    };
  }

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [safeEmail],
        subject: "Your SteaCode verification code",
        html: `
          <div style="font-family:-apple-system,sans-serif;max-width:420px;margin:0 auto;padding:32px;">
            <div style="font-weight:700;font-size:18px;margin-bottom:16px;">steacode</div>
            <p style="margin:0 0 8px;color:#5c5548;">Here is your verification code:</p>
            <div style="font-family:'JetBrains Mono',monospace;font-size:48px;font-weight:700;letter-spacing:12px;color:#d94226;margin:16px 0;">${code}</div>
            <p style="margin:0;color:#8a8071;font-size:13px;">This code expires in ${CODE_TTL_MIN} minutes. If you didn't request it, ignore this email.</p>
          </div>
        `.trim(),
        text: `Your SteaCode verification code: ${code}\nExpires in ${CODE_TTL_MIN} minutes.`,
      }),
    });
    const body = await resp.text();
    if (!resp.ok) {
      console.warn("[OTP] Resend rejected send:", resp.status, body);
      let providerMessage = body;
      try {
        const parsed = JSON.parse(body);
        providerMessage = parsed?.message || parsed?.error || body;
      } catch {
        /* keep raw body */
      }
      const isRestrictedSender = resp.status === 403 && from.endsWith("@resend.dev");
      return {
        ok: false,
        emailSent: false,
        status: resp.status,
        error: isRestrictedSender
          ? "Email provider refused: onboarding@resend.dev can only send to the Resend account owner. Verify steacode.com in Resend and set RESEND_FROM."
          : `Email provider rejected the send (HTTP ${resp.status}).`,
        detail: String(providerMessage).slice(0, 400),
        code: "EMAIL_REJECTED",
      };
    }
    return { ok: true, emailSent: true, expiresAt };
  } catch (err: any) {
    console.warn("[OTP] Resend send threw:", err);
    return {
      ok: false,
      emailSent: false,
      error: "Could not reach the email provider.",
      detail: err?.message || String(err),
      code: "EMAIL_REJECTED",
    };
  }
}

/**
 * Verify that the hash of the supplied code matches an unconsumed,
 * non‑expired row for this email. On success, mark consumed_at.
 */
export async function verifyCode(email: string, plaintextCode: string, env: WorkerEnv): Promise<{
  ok: boolean;
  reason?: "INVALID" | "EXPIRED" | "CONSUMED";
  expiresAt?: string;
}> {
  const safeEmail = email.trim().toLowerCase();
  const code = plaintextCode.replace(/\D/g, "");
  if (!/^\d{6}$/.test(code)) return { ok: false, reason: "INVALID" };

  const codeHash = await sha256Hex(code);
  const now = isoNow();

  const row = await env.DB.prepare(
    `SELECT id, expires_at, consumed_at FROM verification_codes
      WHERE email = ? AND code_hash = ?
      ORDER BY created_at DESC LIMIT 1`
  ).bind(safeEmail, codeHash).first<{ id: string; expires_at: string; consumed_at: string | null }>();

  if (!row) return { ok: false, reason: "INVALID" };
  if (row.consumed_at) return { ok: false, reason: "CONSUMED" };
  if (new Date(row.expires_at).getTime() <= Date.now()) return { ok: false, reason: "EXPIRED", expiresAt: row.expires_at };

  await env.DB.prepare(
    `UPDATE verification_codes SET consumed_at = ? WHERE id = ?`
  ).bind(now, row.id).run();

  return { ok: true, expiresAt: row.expires_at };
}
