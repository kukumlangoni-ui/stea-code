import { Env } from "../firestore";
import { corsHeaders, isPreflight, preflightResponse } from "../cors";

function jsonResponse(data: any, status: number, origin: string | null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

export async function handleAuthBridge(req: Request, env: Env): Promise<Response> {
  const origin = req.headers.get("origin");
  if (isPreflight(req)) return preflightResponse(req);
  try {
    const body: any = await req.json();
    const clerkToken = String(body?.token || "").trim();
    if (!clerkToken) return jsonResponse({ error: "Missing token" }, 400, origin);
    const clerkSecret = (env as any).CLERK_SECRET_KEY;
    if (!clerkSecret) return jsonResponse({ error: "Clerk not configured" }, 500, origin);
    // Verify Clerk session token
    const verifyRes = await fetch("https://api.clerk.com/v1/sessions/verify", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clerkSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: clerkToken }),
    });
    if (!verifyRes.ok) {
      const errBody = await verifyRes.text().catch(() => "");
      return jsonResponse({ error: "Invalid Clerk session", detail: errBody.slice(0, 200) }, 401, origin);
    }
    const verified: any = await verifyRes.json();
    const clerkUserId = String(verified?.sub || verified?.userId || "").trim();
    if (!clerkUserId) return jsonResponse({ error: "Invalid Clerk session subject" }, 401, origin);
    // Fetch the Clerk user for email + displayName
    const userRes = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
      headers: { Authorization: `Bearer ${clerkSecret}` },
    });
    if (!userRes.ok) return jsonResponse({ error: "Cannot fetch Clerk user" }, 500, origin);
    const clerkUser: any = await userRes.json();
    const email =
      clerkUser?.email_addresses?.find((e: any) => e?.id === clerkUser?.primary_email_address_id)
        ?.email_address ||
      clerkUser?.email_addresses?.[0]?.email_address ||
      "";
    const first = String(clerkUser?.first_name || "").trim();
    const last = String(clerkUser?.last_name || "").trim();
    const displayName = [first, last].filter(Boolean).join(" ") || "";
    // Mint Firebase custom token
    const saRaw = (env as any).FIREBASE_SERVICE_ACCOUNT;
    if (!saRaw) return jsonResponse({ error: "Firebase not configured" }, 500, origin);
    const firebaseToken = await mintFirebaseCustomToken(saRaw, clerkUserId, email, displayName);
    return jsonResponse({ firebaseToken }, 200, origin);
  } catch (e: any) {
    return jsonResponse({ error: e?.message || "Bridge failed" }, 500, origin);
  }
}

// ---- Firebase custom token minting (RS256 JWT signed with the service account) ----
async function mintFirebaseCustomToken(
  saJson: string,
  uid: string,
  email: string,
  displayName: string
): Promise<string> {
  const sa = JSON.parse(saJson);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload: any = {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
    iat: now,
    exp: now + 3600,
    uid,
  };
  if (email) payload.claims = { email, ...(displayName ? { name: displayName } : {}) };
  const enc = (obj: any) =>
    btoa(JSON.stringify(obj)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  const toSign = `${enc(header)}.${enc(payload)}`;
  const pem = String(sa.private_key || "").replace(/\\n/g, "\n");
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    raw.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    new TextEncoder().encode(toSign)
  );
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${toSign}.${sig}`;
}
