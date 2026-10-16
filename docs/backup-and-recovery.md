# Stea Code — D1 Database Backup & Recovery

The catalog (products, orders, entitlements, users, staff, revisions) lives in a
Cloudflare D1 database (`stea-code-db`). A permanent, tested backup path is the
only thing standing between a bad deploy / accidental wipe and total data loss.
This document covers how to back up and how to recover.

## What the backup covers

`npx wrangler d1 export --remote` dumps every table in the **remote** production
database (`stea-code-db`) to a single `.sql` file: `products`, `orders`,
`entitlements`, `users`, `staff_users`, `staff_sessions`, `staff_audit`,
`product_revisions`, `staff_notifications`, `error_logs`, etc. The dump is a
full schema + data snapshot, not a diff.

## On-demand backup

Run from the project root:

```bash
bash scripts/backup-db.sh
```

The script:

1. Dumps the remote DB to `~/Desktop/backups/stea-code-db-<YYYY-MM-DD_HHMMSS>.sql`.
2. Prints the output path and size.
3. Prunes to the **8 most recent** backups, deleting anything older.

If you'd rather pick your own destination:

```bash
cd workers/stea-api
npx wrangler d1 export stea-code-db --remote --output="$HOME/Desktop/backups/manual-$(date +%F).sql"
```

> The `stea-code-db` database name is configured under `[[d1_databases]]` in
> `workers/stea-api/wrangler.toml` — confirm it matches before running.

## Scheduling automatic backups

### macOS (launchd) — recommended for the owner's machine

Create `~/Library/LaunchAgents/com.steacode.d1backup.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.steacode.d1backup</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>/Users/mac/Desktop/stea-code/scripts/backup-db.sh</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key><integer>3</integer>
    <key>Minute</key><integer>0</integer>
  </dict>
  <key>RunAtLoad</key><false/>
  <key>StandardOutPath</key>
  <string>/Users/mac/Desktop/backups/backup.log</string>
  <key>StandardErrorPath</key>
  <string>/Users/mac/Desktop/backups/backup.err.log</string>
</dict>
</plist>
```

Load it:

```bash
launchctl load ~/Library/LaunchAgents/com.steacode.d1backup.plist
```

This backs up nightly at 03:00. Keep 8 backups ≈ 8 days of history.

### Linux / CI (cron)

```bash
0 3 * * * cd /Users/mac/Desktop/stea-code && bash scripts/backup-db.sh >> ~/Desktop/backups/backup.log 2>&1
```

### GitHub Actions (off-site copy)

A nightly scheduled workflow can run the same dump and push the `.sql` to a
private repo / R2 bucket so backups survive even if the local machine dies:

```yaml
# .github/workflows/d1-backup.yml (example)
name: d1-backup
on:
  schedule: [{ cron: "0 3 * * *" }]
  workflow_dispatch: {}
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: cd workers/stea-api && npm ci
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      - run: bash scripts/backup-db.sh
```

## Recovery

> Recovery is a **write to production**. Run `git` backups / take a manual dump
> first so you can undo a bad restore, and confirm you're restoring the right
> file.

### Restore the whole database from a backup

```bash
cd workers/stea-api
npx wrangler d1 execute stea-code-db --remote --file="$HOME/Desktop/backups/stea-code-db-<TIMESTAMP>.sql"
```

This replays the dumped SQL (create tables + insert rows). Cloudflare D1 import
upserts by primary key, so re-running is safe for restoring.

### Recover a single table / a few rows

You can't restore "one row" directly, but you can recover to a scratch local DB
and copy out what you need:

```bash
# 1) Restore the backup into a LOCAL d1 so production stays untouched
cd workers/stea-api
npx wrangler d1 execute stea-code-db --local --file="$HOME/Desktop/backups/stea-code-db-<TIMESTAMP>.sql"

# 2) Inspect the row you lost
npx wrangler d1 execute stea-code-db --local --command \
  "SELECT id, titleEn, category, subcategory, status FROM products WHERE id='prod_XXX';"

# 3) Re-insert just that row into PRODUCTION (careful — this is a real write)
npx wrangler d1 execute stea-code-db --remote --command \
  "INSERT OR REPLACE INTO products (id, slug, titleEn, category, subcategory, status, created_at, updated_at) VALUES (...);"
```

### Disaster checklist (catalog wiped / bad deploy)

1. **Stop the bleeding** — don't run more writes.
2. Take a "current damaged state" dump: `bash scripts/backup-db.sh` (or the manual
   export) so the bad state is preserved for forensics.
3. List available backups:
   ```bash
   ls -lt ~/Desktop/backups/stea-code-db-*.sql
   ```
4. Pick the newest backup from **before** the incident and restore it:
   ```bash
   cd workers/stea-api && npx wrangler d1 execute stea-code-db --remote --file="$HOME/Desktop/backups/<good-backup>.sql"
   ```
5. Verify: load the admin products list and the homepage catalog; confirm counts:
   ```bash
   npx wrangler d1 execute stea-code-db --remote --command \
     "SELECT COUNT(*) AS total, SUM(CASE WHEN subcategory='' THEN 1 ELSE 0 END) AS empty_subs FROM products;"
   ```
6. Purge stale caches — the public catalog caches in `steaCodeCommerce.js`
   (localStorage/in-memory). Hard-refresh the site or clear site data so the
   restored rows show up.

## Security & hygiene

- The `.sql` backups contain customer emails, order amounts, staff hashes and
  session tokens. **Never** commit them to the repo or share them.
- `~/Desktop/backups` should be on the encrypted disk / included in the OS-level
  (Time Machine) backup for off-machine redundancy.
- Prefer an off-site copy (R2 private bucket or a private GitHub repo) so a
  stolen/lost laptop doesn't cost you the catalog.
- Test restore at least once per quarter: dump → restore to `--local` → verify a
  known product exists. A backup you've never restored is a hope, not a plan.
