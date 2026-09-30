-- ============================================================
-- STEA Code — Cloudflare D1 Schema
-- Migrated from Firestore collections:
--   stea_code_products        → products
--   stea_code_product_previews → previews
--   stea_code_product_sources  → sources
--   stea_code_entitlements    → entitlements
--   stea_code_orders           → orders
--   stea_code_webhook_events   → webhook_events
-- ============================================================
-- Design decisions:
--   1. Column names are camelCase to match field names used in Worker
--      route code (titleEn, pricingType, createdAt, etc.). This ensures
--      getDoc()/listDocs() can return D1 rows directly as the `data`
--      object without a mapping layer, preserving API response shapes.
--   2. Timestamps stored as TEXT (ISO 8601 strings) because the
--      existing code creates them with new Date().toISOString() and
--      the frontend expects ISO strings.
--   3. Arrays and nested objects stored as TEXT (JSON). The Worker's
--      getDoc/setDoc layer handles JSON.parse / JSON.stringify.
--   4. Booleans stored as INTEGER (0/1). SQLite type affinity handles
--      this; the Worker layer converts 0/1 ↔ false/true.
--   5. extraData TEXT column on flexible tables catches any fields
--      not in the explicit schema (admin can write arbitrary fields
--      via body spread). The Worker layer merges extraData back on read.
--   6. Foreign keys declared but not enforced (D1/SQLite default).
--   7. Indexes on every WHERE/JOIN column used by route handlers.
-- ============================================================

-- ============ Table 1: products ============
-- Source collection: stea_code_products
-- Fields confirmed from routes/catalog.ts, routes/content.ts,
-- routes/admin.ts, routes/download.ts
CREATE TABLE IF NOT EXISTS products (
  id                    TEXT PRIMARY KEY,
  slug                  TEXT,
  titleEn               TEXT,
  titleZh               TEXT,
  shortDescriptionEn    TEXT,
  shortDescriptionZh    TEXT,
  price                 REAL,
  pricingType           TEXT,
  category              TEXT,
  status                TEXT,
  featured              INTEGER DEFAULT 0,
  homepageVisible       INTEGER DEFAULT 0,
  tags                  TEXT,       -- JSON array of strings
  frameworks            TEXT,       -- JSON array of strings
  languages             TEXT,       -- JSON array of strings
  craftNoteEn           TEXT,
  aiPrompt              TEXT,
  previewVideoUrl       TEXT,
  posterImageUrl        TEXT,
  liveUrl               TEXT,
  repoUrl               TEXT,
  previewMode           TEXT DEFAULT 'live',  -- 'live' | 'video' | 'poster'
  preview               TEXT,       -- JSON object: { videoKey, posterKey, fullDocument, html, css, javascript, jsx, ... }
  designWidth           INTEGER DEFAULT 640,  -- logical canvas width for the component
  designHeight          INTEGER DEFAULT 480,  -- logical canvas height for the component
  publicFiles           TEXT,       -- JSON array of file objects
  protectedFiles        TEXT,       -- JSON array of file objects
  sourceFiles           TEXT,       -- JSON array of file objects
  sourceCode            TEXT,
  fileNames             TEXT,       -- JSON array of strings
  package               TEXT,       -- JSON object: { storageKey, size, filename, uploadedAt }
  createdAt             TEXT,       -- ISO 8601 string
  updatedAt             TEXT,       -- ISO 8601 string
  createdBy             TEXT,
  updatedBy             TEXT,
  extraData             TEXT        -- JSON: catch-all for fields not in schema
);

CREATE INDEX IF NOT EXISTS idx_products_status    ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug      ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_homepage  ON products(status, homepageVisible);
CREATE INDEX IF NOT EXISTS idx_products_featured  ON products(status, featured);

-- ============ Table 2: previews ============
-- Source collection: stea_code_product_previews
-- Keyed by productId (Firestore doc ID = productId)
-- Fields confirmed from routes/content.ts, routes/admin.ts, routes/catalog.ts
CREATE TABLE IF NOT EXISTS previews (
  productId       TEXT PRIMARY KEY,
  runtime         TEXT,
  html            TEXT,
  css             TEXT,
  javascript      TEXT,
  jsx             TEXT,
  tsx             TEXT,
  fullDocument    TEXT,
  baseUrl         TEXT,
  externalUrl     TEXT,
  width           INTEGER,
  height          INTEGER,
  viewportMode    TEXT,
  scaleMode       TEXT,
  enabled         INTEGER DEFAULT 1,
  videoKey        TEXT,
  posterKey       TEXT,
  updatedAt       TEXT,       -- ISO 8601 string
  updatedBy       TEXT,
  extraData       TEXT        -- JSON: catch-all for fields not in schema
);

CREATE INDEX IF NOT EXISTS idx_previews_productId ON previews(productId);

-- ============ Table 3: sources ============
-- Source collection: stea_code_product_sources
-- Keyed by productId (Firestore doc ID = productId)
-- Fields confirmed from routes/content.ts, routes/admin.ts
CREATE TABLE IF NOT EXISTS sources (
  productId     TEXT PRIMARY KEY,
  files         TEXT,       -- JSON array of { path, language, content }
  updatedAt     TEXT,       -- ISO 8601 string
  updatedBy     TEXT,
  extraData     TEXT        -- JSON: catch-all
);

CREATE INDEX IF NOT EXISTS idx_sources_productId ON sources(productId);

-- ============ Table 4: entitlements ============
-- Source collection: stea_code_entitlements
-- Doc ID format: "{uid}_{productId}"
-- Fields confirmed from routes/content.ts, routes/download.ts
-- Code accesses: entitlementDoc.data.orderId, entitlementDoc.data.licenseType
CREATE TABLE IF NOT EXISTS entitlements (
  id            TEXT PRIMARY KEY,
  userId        TEXT NOT NULL,
  productId     TEXT NOT NULL,
  source        TEXT,         -- purchase | subscription | grant
  orderId       TEXT,
  licenseType   TEXT,
  grantedAt     TEXT,         -- ISO 8601 string
  expiresAt     TEXT,         -- ISO 8601 string
  extraData     TEXT,         -- JSON: catch-all
  UNIQUE(userId, productId)
);

CREATE INDEX IF NOT EXISTS idx_entitlements_userId    ON entitlements(userId);
CREATE INDEX IF NOT EXISTS idx_entitlements_productId ON entitlements(productId);

-- ============ Table 5: orders ============
-- Source collection: stea_code_orders
-- No route handler reads from this collection directly,
-- but data is migrated for completeness.
CREATE TABLE IF NOT EXISTS orders (
  id              TEXT PRIMARY KEY,
  userId          TEXT,
  productId       TEXT,
  amount          REAL,
  currency        TEXT,
  status          TEXT,
  provider        TEXT,
  providerOrderId TEXT,
  createdAt       TEXT,         -- ISO 8601 string
  extraData       TEXT          -- JSON: catch-all
);

CREATE INDEX IF NOT EXISTS idx_orders_userId    ON orders(userId);
CREATE INDEX IF NOT EXISTS idx_orders_status    ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_createdAt ON orders(createdAt);

-- ============ Table 6: webhook_events ============
-- Source collection: stea_code_webhook_events
-- No route handler reads from this collection directly,
-- but data is migrated for completeness.
CREATE TABLE IF NOT EXISTS webhook_events (
  id          TEXT PRIMARY KEY,
  provider    TEXT,
  eventType   TEXT,
  payload     TEXT,           -- JSON: raw webhook payload
  receivedAt  TEXT,           -- ISO 8601 string
  processed   INTEGER DEFAULT 0,
  extraData   TEXT            -- JSON: catch-all
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider   ON webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_receivedAt ON webhook_events(receivedAt);

-- ============ Migration manifest ============
-- Tracks which Firestore docs have been migrated to D1.
-- Used by the migration script for idempotency and auditing.
CREATE TABLE IF NOT EXISTS _migration_manifest (
  source_collection  TEXT NOT NULL,
  source_doc_id      TEXT NOT NULL,
  target_table       TEXT NOT NULL,
  target_id          TEXT NOT NULL,
  migrated_at        INTEGER NOT NULL,   -- Unix ms
  PRIMARY KEY (source_collection, source_doc_id)
);

-- ============ Table 7: favorites ============
-- User's favorite/bookmarked products.
-- One row per (userId, productId) pair.
CREATE TABLE IF NOT EXISTS favorites (
  userId    TEXT NOT NULL,
  productId TEXT NOT NULL,
  createdAt TEXT NOT NULL,       -- ISO 8601 string
  PRIMARY KEY (userId, productId)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user    ON favorites(userId);
CREATE INDEX IF NOT EXISTS idx_favorites_product ON favorites(productId);

-- ============ Table 8: user_downloads ============
-- Tracks which users have downloaded which products.
-- Useful for "My Downloads" page and download analytics.
CREATE TABLE IF NOT EXISTS user_downloads (
  id           TEXT PRIMARY KEY,  -- uuid
  userId       TEXT NOT NULL,
  productId    TEXT NOT NULL,
  downloadedAt TEXT NOT NULL,     -- ISO 8601 string
  licenseType  TEXT               -- personal | commercial | null for free
);

CREATE INDEX IF NOT EXISTS idx_user_downloads_user    ON user_downloads(userId);
CREATE INDEX IF NOT EXISTS idx_user_downloads_product ON user_downloads(productId);

-- ============ Counter columns on products ============
-- Real engagement counters — incremented by API endpoints.
-- (Added via ALTER TABLE after initial table creation.)
-- Run these in D1 Console:
--   ALTER TABLE products ADD COLUMN views     INTEGER DEFAULT 0;
--   ALTER TABLE products ADD COLUMN copies    INTEGER DEFAULT 0;
--   ALTER TABLE products ADD COLUMN downloads INTEGER DEFAULT 0;

-- ============ Table 9: error_logs ============
-- Frontend error logs sent via POST /api/log-error.
-- Useful for monitoring production issues without Sentry.
CREATE TABLE IF NOT EXISTS error_logs (
  id          TEXT PRIMARY KEY,
  level       TEXT DEFAULT 'error',
  message     TEXT,
  stack       TEXT,
  url         TEXT,
  user_agent  TEXT,
  created_at  TEXT
);

CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at DESC);
