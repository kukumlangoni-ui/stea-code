-- 004_user_sync.sql
-- Add Firebase-user sync columns to the `users` table.
--
-- The `provider` column ALREADY exists on the users table (verified via
-- pragma_table_info), so it is NOT re-added here to keep this migration
-- runnable. Only the columns needed for the Firebase sync are added:
--   firebaseUid  → the Firebase localId (== users.id after sync)
--   lastLoginAt  → ISO timestamp of the user's last Firebase sign-in
--   disabled     → 0/1 mirror of Firebase `disabled`
--   syncedAt     → ISO timestamp of the last successful sync
--
-- Run once via:
--   npx wrangler d1 execute stea-code-db --remote --file=migrations/004_user_sync.sql

ALTER TABLE users ADD COLUMN firebaseUid TEXT;
ALTER TABLE users ADD COLUMN lastLoginAt TEXT;
ALTER TABLE users ADD COLUMN disabled INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN syncedAt TEXT;

CREATE INDEX IF NOT EXISTS idx_users_firebase ON users(firebaseUid);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider);
