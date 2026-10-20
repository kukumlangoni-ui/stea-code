-- 006_ebook.sql
-- eBook support on the products table.
--
-- A product is now one of three kinds, carried by `productType`:
--   'component' (default) — a copy-paste component / layout / kit
--   'ebook'               — a book sold through the Library tab
--   'course'              — reserved for a future course product
--
-- Three extra TEXT columns carry the eBook payload. They are intentionally
-- NULL by default (a component product has none of them):
--
--   salesPageHtml    → the marketing "3D cover" sales page. PUBLIC — it is
--                      rendered on the card and in the product modal, so the
--                      catalog endpoint is allowed to return it.
--   bookContentHtml  → the full book (all chapters). PAID content — it is
--                      NEVER returned by the public catalog or product
--                      endpoints; it is served only by
--                      GET /api/stea-code/products/:id/book-content after an
--                      auth + entitlement check.
--   bookDownloadUrl  → optional pre-built PDF/ZIP in R2, gated the same way.
--
-- NOTE: SQLite has no "ADD COLUMN IF NOT EXISTS", so this migration is NOT
-- idempotent — re-running it fails with "duplicate column name". It has
-- ALREADY been applied to production (stea-code-db); the four columns and
-- idx_products_productType are present and productType is backfilled. Keep
-- this file only as the record of that change / for fresh databases.
--
-- Apply on a fresh database via:
--   npx wrangler d1 execute stea-code-db --remote --file=migrations/006_ebook.sql

ALTER TABLE products ADD COLUMN productType TEXT DEFAULT 'component';
ALTER TABLE products ADD COLUMN salesPageHtml TEXT;
ALTER TABLE products ADD COLUMN bookContentHtml TEXT;
ALTER TABLE products ADD COLUMN bookDownloadUrl TEXT;

-- Backfill: everything already in the Library tab is an eBook. The ADD COLUMN
-- above stamped the default 'component' onto every pre-existing row, so this
-- correction is what keeps the live 3D book card working.
UPDATE products SET productType = 'ebook' WHERE tab = 'library';

CREATE INDEX IF NOT EXISTS idx_products_productType ON products(productType);
