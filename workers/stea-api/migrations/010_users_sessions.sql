-- First-party email sessions (replaces Cloudflare Access for store users).
--
-- `users` already exists in production with camelCase columns (it is shared
-- with the admin panel + Firebase sync), so this statement only guarantees a
-- matching schema on a fresh database. Email-login inserts into `createdAt`.
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  displayName TEXT,
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'active',
  provider TEXT,
  createdAt TEXT,
  lastActiveAt TEXT,
  extraData TEXT,
  firebaseUid TEXT,
  lastLoginAt TEXT,
  disabled INTEGER DEFAULT 0,
  syncedAt TEXT
);

-- Only the SHA-256 hash of the session token is stored, never the raw value.
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);
