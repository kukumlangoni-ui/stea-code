-- 008_purchases.sql
-- Email-keyed purchase records for the Cloudflare Access download gate.
--
-- Cloudflare Access identifies the buyer by email (Cf-Access-Authenticated-
-- User-Email), so `/api/download/:id` checks `purchases` by email instead of
-- `entitlements` by Firebase uid.
--
-- Run once via:
--   npx wrangler d1 execute stea-code-db --remote --file=migrations/008_purchases.sql

CREATE TABLE IF NOT EXISTS purchases (
  id          TEXT PRIMARY KEY,     -- Stripe session id (or uuid)
  email       TEXT NOT NULL,        -- normalized lower-case buyer email
  productId   TEXT NOT NULL,        -- product id, or 'pro-lifetime'
  orderId     TEXT,
  status      TEXT DEFAULT 'paid',  -- paid | refunded | pending
  grantedAt   TEXT,                 -- ISO 8601 string
  expiresAt   TEXT,                 -- ISO 8601 string (null = lifetime)
  extraData   TEXT                  -- JSON: catch-all
);

CREATE INDEX IF NOT EXISTS idx_purchases_email   ON purchases(email);
CREATE INDEX IF NOT EXISTS idx_purchases_product ON purchases(productId);

-- ---- Backfill existing purchases so current buyers keep access ----
-- `entitlements.extraData` stores { email } for purchases written by the
-- Stripe webhook. Rows without an email cannot be matched by Access and are
-- skipped; they remain available in `entitlements`.
INSERT OR IGNORE INTO purchases (id, email, productId, orderId, status, grantedAt, expiresAt, extraData)
SELECT
  e.id,
  lower(json_extract(e.extraData, '$.email')),
  e.productId,
  e.orderId,
  'paid',
  e.grantedAt,
  e.expiresAt,
  e.extraData
FROM entitlements e
WHERE json_extract(e.extraData, '$.email') IS NOT NULL
  AND length(trim(lower(json_extract(e.extraData, '$.email')))) > 0;

-- Same backfill from `orders` (also carries { email }), covering purchases
-- where the entitlement row is missing.
INSERT OR IGNORE INTO purchases (id, email, productId, orderId, status, grantedAt, expiresAt, extraData)
SELECT
  o.id,
  lower(json_extract(o.extraData, '$.email')),
  o.productId,
  o.id,
  CASE WHEN lower(coalesce(o.status, 'paid')) = 'paid' THEN 'paid' ELSE lower(coalesce(o.status, 'pending')) END,
  o.createdAt,
  NULL,
  o.extraData
FROM orders o
WHERE json_extract(o.extraData, '$.email') IS NOT NULL
  AND length(trim(lower(json_extract(o.extraData, '$.email')))) > 0;
