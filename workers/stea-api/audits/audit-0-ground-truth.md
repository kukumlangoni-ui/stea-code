# STEA Code — Ground Truth Audit (Phase 0)

**Date:** 2026-09-24
**Auditor:** AI Agent (trae)
**Scope:** STEA Code product — API, data, frontend, deployment

---

## A. Two-App Map

| Aspect | Main STEA App | STEA Code API Worker |
|---|---|---|
| **Domain** | stea.africa / code.stea.africa | stea-api.kukumlangoni.workers.dev (internal) |
| **Platform** | Firebase Hosting + Vite/React SPA | Cloudflare Workers |
| **Project path** | `/Users/mac/Desktop/STEA Africa/` (root) | `/Users/mac/Desktop/STEA Africa/workers/stea-api/` |
| **Build command** | `npm run build` → `vite build` → `dist/` | `npx wrangler deploy` |
| **Package.json** | Root `package.json` (name: "steaclassroom") | `workers/stea-api/package.json` |
| **node_modules** | Shared root `node_modules/` | Separate `workers/stea-api/node_modules/` |
| **Routing** | `code.stea.africa/api/*` → Worker via Cloudflare Route | Handles all `/api/stea-code/*` |
| **Firebase rewrite** | `firebase.json` rewrites `/api/**` → Worker (legacy, for stea.africa) | N/A |
| **Auth** | Firebase Auth (client-side) | Firebase ID token verification (Web Crypto) |

---

## B. Deployment Reality

### What's LIVE right now

| Component | Status | Confirmed by |
|---|---|---|
| **D1 database** | ✅ LIVE | `wrangler.toml` has real `database_id`: `6184de42-de1b-4ede-9ca3-19bfb16a121c` |
| **Worker (D1 version)** | ✅ LIVE | API returns properly parsed JSON columns (tags as array, booleans as bool) |
| **Firestore** | ❌ NOT IN USE | Worker code rewritten to D1; no Firestore REST calls remain |
| **Frontend** | ✅ LIVE (Firebase Hosting) | `firebase.json` site: "swahilitecheliteacademy" |
| **Catalog API** | ✅ Working | `GET /api/stea-code/catalog` returns 10 products, 9.2 KB |
| **Preview API** | ✅ Working | `GET /api/stea-code/products/:id/preview` returns full preview object |
| **Product detail API** | ✅ Working | `GET /api/stea-code/products/:id` returns full product with preview |

### API Performance (live)

| Metric | Value |
|---|---|
| **Catalog TTFB** | 1.16s (cold) |
| **Catalog size** | 9,227 bytes |
| **Cache-Control** | ❌ None — no edge caching |
| **Status** | 200 OK |

---

## C. Data Reality

### Catalog endpoint (`/api/stea-code/catalog`)

- **10 products total** (all `status: "published"`)
- **9 products** have `homepageVisible: true`
- **JSON columns ARE parsed correctly** — `tags` is array, `fileNames` is array, `featured` is boolean, `homepageVisible` is boolean
- **`preview` is null in catalog** for most products
  - The `preview` column on the `products` table is NULL
  - Preview data lives in the **separate `previews` table** (from `stea_code_product_previews`)
  - The catalog endpoint only reads `products` table — it does NOT join with `previews`
  - In Firestore, some products had embedded preview objects; the separate preview collection was the primary source

### Detail endpoint (`/api/stea-code/products/:id`)

- Returns full product with a **parsed `preview` object**
- Example (`magnetic-text-reveal`):
  ```js
  preview: {
    viewportMode: "desktop",
    runtime: "react",
    scaleMode: "fit",
    enabled: true,
    width: 1440,
    height: 900,
    autoRun: true,
    interactive: true
  }
  ```
- The detail endpoint gets preview from `product.doc.preview` (embedded in product, from Firestore legacy)

### Preview endpoint (`/api/stea-code/products/:id/preview`)

- Returns full preview from the **`previews` table**
- All fields parsed correctly: `width`, `height`, `viewportMode`, `scaleMode`, `enabled`, `runtime`, `html`, `css`, `javascript`, `jsx`, `tsx`, `fullDocument`, etc.
- This is the **ground truth** for preview data

### D1 counts

| Table | Status |
|---|---|
| products | ⚠️ Could not verify (wrangler network issue from this machine) |
| previews | ⚠️ Same |
| sources | ⚠️ Same |
| entitlements | ⚠️ Same |
| orders | ⚠️ Same |
| webhook_events | ⚠️ Same |

**Note:** Wrangler 4.138.0 is installed locally (the brief said 3.x — local CLI was upgraded). Worker's `wrangler.toml` is fine. The network error is a local VPN/proxy issue, not a production issue.

---

## D. File Classification (Top-Level)

### 🟢 LIVE — Active Source Code

| Path | Purpose |
|---|---|
| `src/` | Main frontend React app (Vite) |
| `src/pages/stea-code/` | STEA Code pages (V2 home, views, checkout) |
| `src/components/stea-code/` | STEA Code shared components (preview, modal, etc.) |
| `src/services/steaCode*.js` | STEA Code API service layer |
| `src/data/stea-code/` | STEA Code data + fallback data |
| `src/admin-v2/` | Admin panel (v2) — Products, Orders, Entitlements |
| `workers/stea-api/` | Cloudflare Worker backend (D1 + R2) |
| `server.ts` | Express SSR server (built to `dist/server.cjs`) |
| `firebase.json` | Firebase Hosting config |
| `package.json` | Root frontend dependencies |

### 🟡 BUILD — Build Outputs & Config

| Path | Purpose |
|---|---|
| `dist/` | Built frontend (deployed to Firebase Hosting) |
| `public/` | Static assets copied to dist/ |
| `locales/` | i18n translation files |
| `index.html` | Vite entry HTML |
| `eslint.config.js` | ESLint config |
| `vite.config` | (implicit — not in root, maybe in subfolder) |

### 🔴 LEGACY — Cruft & One-Off Scripts

| Path | Count | Notes |
|---|---|---|
| Root `patch_*.cjs` / `patch_*.py` | ~40+ files | One-off patches, should be archived |
| Root `fix_*.py` / `fix_*.cjs` | ~15 files | Legacy fix scripts |
| Root `checkData*.js` | 5 files | Debug scripts |
| `.stea-release/` | ~20 folders | Release snapshots/backups |
| `.trae/scripts/` | ~20 files | Trae agent one-off scripts |
| `.trae/tmp/` | ~25 files | Temporary patches |
| `scratch/` | 4 .py files | Scratch work |
| `scripts/` | ~50 .mjs/.cjs files | Various one-off scripts, tests, seeders |
| `tests/` | 9 .test.js/.mjs files | Test files (some may be stale) |
| `docs/` | 8 .md files | Documentation (some stale) |
| `outputs/` | 2 files | PPTX outputs |
| `mocks/` | 1 package | Mock for testing |

### ❓ UNKNOWN

| Path | Notes |
|---|---|
| `src/admin/` (v1) | Legacy admin — possibly superseded by `src/admin-v2/` |
| `src/ceo/` | CEO workspace — unclear if active |
| `capacitor.config.ts` | Mobile app config — unclear if active |
| `config/firebase-applet-config.json` | Applet config — unclear |
| `server.ts` + Express | SSR server — is it actually used? Firebase Hosting serves SPA |

---

## E. Shared-State Risks

| Risk | Severity | Notes |
|---|---|---|
| **Root `node_modules/`** | ⚠️ Medium | Frontend and worker share root `node_modules`? No — worker has its own in `workers/stea-api/node_modules/`. Safe. |
| **`firebase.json` rewrites** | ⚠️ Medium | `/api/**` rewrites to Worker. But `code.stea.africa/api/*` uses Cloudflare Route directly (from `wrangler.toml`). The Firebase rewrite is for `stea.africa` (main domain). Both paths work, but two paths = two ways to break. |
| **Root `.env`** | ⚠️ Low | Frontend uses env vars from root. Worker uses its own secrets (via wrangler). No conflict. |
| **`firebase-admin` in root deps** | ⚠️ Low | Frontend has `firebase-admin` but it's for server-side use only. Worker doesn't use it. |

---

## F. Bug Root Causes (7 Bugs Mapped)

### Bug 1 — Products slow to appear on homepage
**Severity:** HIGH
**Root cause:** No `Cache-Control` header on catalog endpoint. Every request hits Worker + D1 fresh. 1.16s TTFB is too slow for a catalog of only 10 products.
**Also:** Catalog endpoint reads ALL columns including heavy JSON fields (though `sourceCode`, `protectedFiles` are stripped by `safeProduct()` — but only on the product doc, not on the preview join which doesn't exist yet).
**File:** `workers/stea-api/src/routes/catalog.ts`
**Fix:** Add `Cache-Control: public, max-age=300` (5 min) to catalog response. D1 is already local to Worker — the 1.16s is suspicious and may be cold start or something else.

### Bug 2 — Card dimensions wrong on homepage
**Severity:** HIGH
**Root cause:** Card has hardcoded `aspect-ratio: 16 / 11` (`.sc-code-card--clean` at CSS line 2566). It **never reads** `product.preview.width` or `product.preview.height`. Admin-set dimensions are completely ignored.
**File:** `src/pages/stea-code/stea-code-v2.css` line 2566
**Component:** `CodeProductCard` in `src/pages/stea-code/SteaCodeHomeV2.jsx` line 1315

### Bug 3 — Top black bar / preview not filling 100%
**Severity:** HIGH
**Root cause:** Same as Bug 2. The hardcoded 16/11 aspect ratio doesn't match the preview's actual aspect ratio (e.g. 1440×900 = 16/10 = 1.6, but card is 16/11 ≈ 1.45). The preview gets letterboxed, and the card's `background: #0a0a0f` shows through as "black bars."
**File:** Same as Bug 2
**Fix:** Same as Bug 2 — dynamic aspect ratio from `preview.width / preview.height`

### Bug 4 — Admin dimensions don't carry to homepage
**Severity:** HIGH
**Root cause:** Same as Bug 2 + compounded by the fact that the catalog endpoint returns `preview: null` for most products (because preview is in separate `previews` table, not embedded in products). The card can't read dimensions that aren't in the response.
**File:** `workers/stea-api/src/routes/catalog.ts` + CSS
**Fix:** Either (a) join previews into catalog response, or (b) embed preview metadata in the products table.

### Bug 5 — Some cards don't open preview on click
**Severity:** MEDIUM
**Root cause:** Cards always have `onClick` → `onOpen()`, so the modal should always open. BUT the content inside the modal may be blank if `preview` is null and there's no video/poster fallback. The user may perceive this as "click doesn't work" when actually the modal opens empty.
**File:** `CodeProductCard` + `ProductPreview` + modal
**Need to verify:** Whether the modal actually opens but is empty, or whether click is truly dead.

### Bug 6 — Admin edit form: files/code/info disappear
**Severity:** HIGH
**Root cause:** TBD — need to check the form init more carefully. The form expects `product.files`, `product.preview.html`, etc. Since the form loads the product via the detail endpoint (which HAS parsed preview), preview fields should work. But `source` files are loaded separately via `getAdminSteaCodeSource()` — if that endpoint has issues, source tab is empty.
**File:** `ProductStudio` in `src/admin-v2/SteaCodeCommercePanel.jsx` line 940

### Bug 7 — Two-state preview both look wrong
**Severity:** MEDIUM
**Root cause:** Same as Bug 2/3 — both states share the same card container with hardcoded aspect ratio.

---

## G. Fix Order

### Priority order (highest impact first)

1. **Bug 2/3/4/7 — Card dimensions + black bar** (one fix covers 4 bugs)
   - Make card read `preview.width` / `preview.height` from product data
   - Compute dynamic `aspect-ratio` via inline style
   - **But first:** catalog needs to include preview dimensions (currently `preview: null`)

2. **Bug 1 — Slow catalog** (Cache-Control + optimize)
   - Add `Cache-Control: public, max-age=300` to catalog endpoint
   - Investigate why 1.16s TTFB (cold start? D1 latency?)

3. **Bug 6 — Admin form fields disappearing**
   - Audit form init + save flow
   - Verify source/preview endpoints return correct shape

4. **Bug 5 — Click-to-preview regression**
   - Confirm whether modal opens empty or doesn't open at all
   - Fix accordingly

5. **Migration integrity** (verify D1 counts match Firestore)
   - Needs manual wrangler command from user (network issue blocks me)

---

## H. Key Surprises / Things to Note

1. **D1 is already LIVE** — the migration was completed and deployed. The Worker is serving D1 data, not Firestore.

2. **Wrangler local version is 4.138.0** — the brief said not to upgrade to 4.x, but the local CLI is already on 4.x. The Worker itself is still built with the 3.x in its own package.json (`"wrangler": "^3.72.0"`). The local CLI version doesn't affect the deployed Worker.

3. **`preview` is null in catalog** — this is a big deal. The card needs preview dimensions for correct sizing, but the catalog doesn't include them. Two options:
   - (a) Add a lightweight preview join to catalog (just `width`, `height`, `enabled`, `runtime`)
   - (b) Store preview metadata directly in the products table

4. **Catalog is SLOW** — 1.16s for 10 products from D1 is suspicious. Should be <100ms. Could be cold start, could be no caching, could be something else.

5. **`safeProduct()` strips preview inner fields** — but keeps the preview object itself. The issue is that `preview` is null to begin with, not that it's stripped.
