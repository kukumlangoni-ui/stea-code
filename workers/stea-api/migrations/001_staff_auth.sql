-- ============================================================
-- STEA Code — Staff Authentication (001)
-- Adds staff_users, staff_sessions, staff_audit tables and
-- product ownership/approval columns.
-- Apply: npx wrangler d1 execute stea-code-db --remote --file=migrations/001_staff_auth.sql
-- ============================================================

-- Staff users (employees, partners, admins)
CREATE TABLE IF NOT EXISTS staff_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'editor',        -- 'owner' | 'admin' | 'editor'
  status TEXT NOT NULL DEFAULT 'active',       -- 'active' | 'revoked'
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT,
  extra_data TEXT
);
CREATE INDEX IF NOT EXISTS idx_staff_users_email ON staff_users(email);
CREATE INDEX IF NOT EXISTS idx_staff_users_status ON staff_users(status);

-- Active sessions (JWT-style opaque tokens)
CREATE TABLE IF NOT EXISTS staff_sessions (
  token TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  user_agent TEXT,
  ip TEXT,
  FOREIGN KEY (staff_id) REFERENCES staff_users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_staff ON staff_sessions(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_expires ON staff_sessions(expires_at);

-- Audit log
CREATE TABLE IF NOT EXISTS staff_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id TEXT,
  action TEXT NOT NULL,
  target TEXT,
  meta TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_staff_audit_staff ON staff_audit(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_audit_created ON staff_audit(created_at);

-- Track which staff uploaded each product
ALTER TABLE products ADD COLUMN createdByStaff TEXT;
ALTER TABLE products ADD COLUMN approvedByStaff TEXT;
ALTER TABLE products ADD COLUMN approvedAt TEXT;
ALTER TABLE products ADD COLUMN rejectionReason TEXT;

CREATE INDEX IF NOT EXISTS idx_products_createdByStaff ON products(createdByStaff);
CREATE INDEX IF NOT EXISTS idx_products_approvedByStaff ON products(approvedByStaff);
