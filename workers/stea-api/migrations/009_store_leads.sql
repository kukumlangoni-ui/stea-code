-- Store leads: emails captured from the premium soft-gate.
-- Separate from staff_users (which is the admin/employee identity table).
CREATE TABLE IF NOT EXISTS store_leads (
  email TEXT PRIMARY KEY,
  source TEXT,
  product_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_store_leads_created_at ON store_leads (created_at);
