# Staff Authentication — STEA Code

Complete staff auth + access management, **entirely on Cloudflare** (Worker + D1).
No Firebase. No Clerk. No external auth services.

Customers still use Firebase — this system is **separate** and only for staff
(owners / admins / editors). Customer auth is untouched.

## How it works

- **Passwords**: PBKDF2-SHA256, 100k iterations, 16-byte random salt (Web Crypto).
- **Sessions**: opaque random 64-hex tokens (NOT JWTs) stored in `staff_sessions`.
  12-hour expiry. Revocation = single row update.
- **Instant revocation**: `requireStaff()` checks `status = 'active'` on **every**
  API call and kills the session on first post-revoke request.
- **Roles**: `owner` (everything) → `admin` (manage staff + all products) →
  `editor` (only their own products, cannot publish).

## Files

| File | Purpose |
|---|---|
| `migrations/001_staff_auth.sql` | Creates tables + product ownership columns |
| `src/staff-auth/crypto.ts` | Password hashing / token generation |
| `src/staff-auth/middleware.ts` | `requireStaff()` middleware + role checks |
| `src/routes/staff.ts` | All staff endpoints |
| `src/routes/admin.ts` | Product write endpoints (createdByStaff + editor rules) |
| `src/index.ts` | Router registration |
| `src/services/staffAuth.js` | Frontend data layer (token + fetch helpers) |

## Database tables

- `staff_users` — id, email, password_hash, password_salt, display_name, role, status, created/updated, last_login_at
- `staff_sessions` — token, staff_id, issued/expires/revoked, user_agent, ip
- `staff_audit` — id, staff_id, action, target, meta, created_at
- `products` — added `createdByStaff`, `approvedByStaff`, `approvedAt`, `rejectionReason`

## Endpoints

```
POST   /api/stea-code/staff/login                          → { token, staff }
POST   /api/stea-code/staff/logout                         → { ok }
GET    /api/stea-code/staff/me                             → { staff, session }
GET    /api/stea-code/staff/users            (admin/owner) → { users }
POST   /api/stea-code/staff/users            (admin/owner) → { user }
PATCH  /api/stea-code/staff/users/:id        (owner)       → { user }
DELETE /api/stea-code/staff/users/:id        (owner)       → { ok }
POST   /api/stea-code/staff/users/:id/reset-password (owner) → { ok }
POST   /api/stea-code/staff/users/:id/force-logout (owner)   → { ok }
GET    /api/stea-code/staff/products         (any staff)   → { products, total }
GET    /api/stea-code/staff/audit            (owner)       → { entries }
GET    /api/stea-code/staff/approvals        (owner)       → { approvals }
POST   /api/stea-code/staff/products/:id/approve (owner)   → { ok, status }
```

All staff routes require `Authorization: Bearer <token>`. The first login with
bootstrap credentials creates the **owner** account.

## 1. Apply the migration

```bash
cd ~/Desktop/stea-code/workers/stea-api && npx wrangler d1 execute stea-code-db --remote --file=migrations/001_staff_auth.sql
```

## 2. Set bootstrap credentials as Worker secrets

```bash
cd ~/Desktop/stea-code/workers/stea-api && npx wrangler secret put STAFF_BOOTSTRAP_EMAIL
```
→ paste your owner email, e.g. `kukumlangoni@gmail.com`

```bash
npx wrangler secret put STAFF_BOOTSTRAP_PASSWORD
```
→ paste a strong password (12+ chars, mixed). **Save it** — it's your first owner login.

## 3. Deploy

```bash
cd ~/Desktop/stea-code/workers/stea-api && npx wrangler deploy
```

## 4. Run the 9 verification tests

Replace `BOOTSTRAP_EMAIL` / `BOOTSTRAP_PASSWORD` below. `code.stea.africa` is the
host for `code.stea.africa/api/*`.

```bash
API=https://code.stea.africa/api/stea-code/staff
```

**1. Login with bootstrap → token**
```bash
curl -s -X POST $API/login -H "Content-Type: application/json" \
  -d '{"email":"BOOTSTRAP_EMAIL","password":"BOOTSTRAP_PASSWORD"}'
# → { token, staff:{ role:"owner" } }
```

**2. GET /me with that token**
```bash
TOKEN="<paste owner token from step 1>"
curl -s $API/me -H "Authorization: Bearer $TOKEN"
# → { staff:{ email: BOOTSTRAP_EMAIL, role:"owner" }, session }
```

**3. Login with wrong password → 401**
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST $API/login \
  -H "Content-Type: application/json" \
  -d '{"email":"BOOTSTRAP_EMAIL","password":"WRONG"}'
# → 401
```

**4. Create a test editor**
```bash
curl -s -X POST $API/users -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"editor@test.com","password":"StrongPass123!","displayName":"Test Editor","role":"editor"}'
# → 201 { user:{ role:"editor", status:"active" } }
```

**5. Login as editor → different token**
```bash
curl -s -X POST $API/login -H "Content-Type: application/json" \
  -d '{"email":"editor@test.com","password":"StrongPass123!"}'
# → { token, staff:{ role:"editor" } }
```

**6. GET /users as editor → 403**
```bash
EDITOR_TOKEN="<paste editor token>"
curl -s -o /dev/null -w "%{http_code}\n" $API/users -H "Authorization: Bearer $EDITOR_TOKEN"
# → 403
```

**7. Revoke editor as owner**
```bash
EDITOR_ID="<grab the editor id from step 4 response>"
curl -s -X PATCH $API/users/$EDITOR_ID -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"status":"revoked"}'
# → { user:{ status:"revoked" } }
```

**8. GET /me as editor with old token → 403 (revoked)**
```bash
curl -s -o /dev/null -w "%{http_code}\n" $API/me -H "Authorization: Bearer $EDITOR_TOKEN"
# → 403
```

**9. Login as editor with correct password → 403 (revoked)**
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST $API/login \
  -H "Content-Type: application/json" \
  -d '{"email":"editor@test.com","password":"StrongPass123!"}'
# → 403
```

**All 9 must pass.** If step 8/9 return 403, instant revocation works.

## Staff product flow

- A staff user creates a product through the **same product create/update
  endpoints** used by the admin panel (they accept staff Bearer tokens now).
- `createdByStaff` is set automatically. `editor` role is forced to `status =
  'draft'` on create; they can edit their own products but **cannot** set
  `published` directly (they can set `pending` for review).
- Owner/admin can publish directly.
- Owner reviews pending products via `GET /staff/approvals` and approves with
  `POST /staff/products/:id/approve` → `{ approved: true }` (publishes) or
  `{ approved: false, reason }` (rejects).

## Security notes

- Passwords never logged; hashes compare in constant time.
- `password_hash` / `password_salt` are never returned by any API.
- Sessions are opaque tokens (revocable, no signing needed).
- Product scoping: editors only see products where `createdByStaff = their id`.
- Staff cannot see Orders / Payments / Users / Entitlements / other staff
  (those admin views stay Firebase-owner-only).

## No UI yet

This is **backend only** (Session 2 builds the staff admin UI). The data layer
`src/services/staffAuth.js` is ready for the frontend to use.
