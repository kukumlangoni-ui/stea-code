-- 2026-11-06 — SteaCode email verification codes for the soft-gate login.
--
-- A fresh 6-digit code is issued per (email, code) pair. We only STORE the
-- SHA-256 hash of the code on disk — the plaintext never touches D1. The
-- plaintext is emailed to the user and lives in memory inside the Worker
-- during send-code, then immediately discarded.
--
-- TTL is 10 minutes. On verify we also invalidate the code so it cannot be
-- reused (replay-resistant).

CREATE TABLE IF NOT EXISTS verification_codes (
  id           TEXT PRIMARY KEY,
  email        TEXT NOT NULL,
  code_hash    TEXT NOT NULL,              -- SHA-256 hex of the 6-digit code
  created_at   TEXT NOT NULL,              -- ISO 8601
  expires_at   TEXT NOT NULL,              -- 10 minutes later
  consumed_at  TEXT,                       -- set on successful verify (1‑time use)
  created_by   TEXT DEFAULT "soft-gate"    -- "soft-gate" | "admin-reset" etc.
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_email
  ON verification_codes (email, expires_at DESC);

-- Ephemeral — codes that have either expired or been consumed are never
-- read again. A single 10-minute TTL covers all uses, so we don't need a
-- scheduled cleanup job; the table auto‑truncates itself over time.
