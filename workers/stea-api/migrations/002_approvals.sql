-- ============================================================
-- STEA Code — Approvals Workflow (002)
-- Adds product_revisions, staff_notifications tables and the
-- products.pending_revision_id pointer. Also renames staff role
-- 'admin' → 'approver'.
-- Apply: npx wrangler d1 execute stea-code-db --remote --file=migrations/002_approvals.sql
-- Idempotent: safe to run twice (all CREATE use IF NOT EXISTS).
-- ============================================================

-- 1. Rename 'admin' → 'approver' in staff_users
UPDATE staff_users SET role = 'approver' WHERE role = 'admin';

-- 2. Product revisions table — stores pending edits
CREATE TABLE IF NOT EXISTS product_revisions (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  submitted_by TEXT NOT NULL,          -- staff id
  status TEXT NOT NULL DEFAULT 'pending',   -- 'pending' | 'approved' | 'rejected'
  kind TEXT NOT NULL,                  -- 'new' | 'edit'
  snapshot TEXT NOT NULL,              -- JSON: the WHOLE proposed product
  original_snapshot TEXT,              -- JSON of the currently-live product (null for 'new')
  reviewer_id TEXT,
  reviewed_at TEXT,
  rejection_reason TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_revisions_status ON product_revisions(status);
CREATE INDEX IF NOT EXISTS idx_revisions_product ON product_revisions(product_id);
CREATE INDEX IF NOT EXISTS idx_revisions_submitter ON product_revisions(submitted_by);

-- 3. Notifications table
CREATE TABLE IF NOT EXISTS staff_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient_role TEXT,                 -- null = all owners+approvers
  recipient_staff_id TEXT,             -- null = all with that role
  kind TEXT NOT NULL,                  -- 'revision_submitted' | 'revision_approved' | 'revision_rejected' | 'staff_created' | 'staff_revoked'
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,                           -- optional deep link
  target_id TEXT,                      -- revision id or staff id
  read_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notif_unread ON staff_notifications(read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_recipient ON staff_notifications(recipient_role, recipient_staff_id, read_at);

-- 4. Ensure products has a last-revision pointer (idempotent)
ALTER TABLE products ADD COLUMN pending_revision_id TEXT;
CREATE INDEX IF NOT EXISTS idx_products_pending_revision ON products(pending_revision_id);
