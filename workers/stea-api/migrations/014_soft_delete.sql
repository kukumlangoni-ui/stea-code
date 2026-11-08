-- Soft delete for products + catalog cache version.
--
-- deleted_at: when non-NULL the product is treated as deleted by every public
-- catalog query, but the row (and its sources/previews) stays in the database
-- so order history, entitlements, and purchases keep resolving.
--
-- meta: key/value store holding 'catalog_version'. Admin product writes bump
-- it, which changes the homepage edge-cache key and invalidates stale cards.
ALTER TABLE products ADD COLUMN deleted_at TEXT;
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
