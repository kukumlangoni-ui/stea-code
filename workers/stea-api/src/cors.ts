/**
 * CORS handling for the STEA Code Worker.
 * Static allowlist + pattern matching for Cloudflare Pages preview URLs.
 */

const STATIC_ALLOWED_ORIGINS = new Set([
  "https://code.stea.africa",
  "https://stea.africa",
  "https://www.stea.africa",
  "https://swahilitecheliteacademy.web.app",
  "https://swahilitecheliteacademy.firebaseapp.com",
]);

const PATTERN_ALLOWED_ORIGINS = [
  /^https:\/\/stea-code\.pages\.dev$/,
  /^https:\/\/[a-z0-9-]+\.stea-code\.pages\.dev$/,
  /^https:\/\/stea-sites\.pages\.dev$/,
  /^https:\/\/[a-z0-9-]+\.stea-sites\.pages\.dev$/,
];

export function isAllowedOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false;
  if (STATIC_ALLOWED_ORIGINS.has(origin)) return true;
  return PATTERN_ALLOWED_ORIGINS.some((rx) => rx.test(origin));
}

export function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = isAllowedOrigin(origin) ? origin! : "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function isPreflight(req: Request): boolean {
  return req.method === "OPTIONS";
}

export function preflightResponse(req: Request): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}
