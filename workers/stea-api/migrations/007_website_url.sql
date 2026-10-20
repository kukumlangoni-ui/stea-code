-- 007_website_url.sql
-- Public "Visit Website" URL for a product.
--
-- A single TEXT column holding the product's public marketing/demo website.
-- When set, the homepage card and the product modal render a "Visit Website"
-- button that opens the URL in a new tab.
--
-- It is public information (no auth/entitlement gate) and is small, so it is
-- returned inline by the catalog endpoints — see HOMEPAGE_CARD_COLUMNS in
-- src/routes/catalog.ts.
--
-- NOTE: SQLite has no "ADD COLUMN IF NOT EXISTS", so this migration is NOT
-- idempotent — re-running it fails with "duplicate column name". It has
-- ALREADY been applied to production (stea-code-db). Keep this file only as
-- the record of that change / for fresh databases.
--
-- Apply on a fresh database via:
--   npx wrangler d1 execute stea-code-db --remote --file=migrations/007_website_url.sql

ALTER TABLE products ADD COLUMN websiteUrl TEXT;
