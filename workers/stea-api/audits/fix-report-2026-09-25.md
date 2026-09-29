# STEA Code Bug Fix Report — 2026-09-25

## Summary

- **6 bugs fixed** (all code changes ready, builds verified)
- **1 issue is not a bug** (Card Zoom controls are functional)
- **2 data issues** identified (not code bugs)
- **Deploy status**: Both builds pass. Deploy required — see instructions below.

---

## All Bugs — Status Table

| # | Bug | Status | Root Cause | Fix Location | Verified |
|---|-----|--------|------------|--------------|----------|
| 1 | Products slow to appear | ✅ FIXED | No `Cache-Control` → no edge cache → 1.16s TTFB | `workers/stea-api/src/routes/catalog.ts`, `content.ts` | tsc passes |
| 2 | Card dimensions wrong | ✅ FIXED | Hardcoded `aspect-ratio: 16/11` ignored admin `preview.width/height` | `src/pages/stea-code/SteaCodeHomeV2.jsx` | Build passes |
| 3 | Black bar at top of cards | ✅ FIXED | Same as #2 — aspect ratio mismatch → letterboxing | Same as #2 | Same as #2 |
| 4 | Two-state preview looks wrong | ✅ FIXED | Same as #2 — both states share same card container | Same as #2 | Same as #2 |
| 5 | Clicking cards doesn't open modal | ✅ FIXED | After 1.5s, iframe gets `pointer-events: auto` and eats clicks | `src/pages/stea-code/SteaCodeHomeV2.jsx` | Build passes |
| 6 | Admin edit: files/code/info disappear | ✅ FIXED | **Missing route** — `GET /admin/.../preview` returned 404 (only PUT existed) | `workers/stea-api/src/routes/admin.ts`, `index.ts` | tsc passes |
| 7 | Save deletes all fields | ✅ FIXED | Shallow merge was replacing entire JSON objects (preview, package). Added deep merge + undefined-skipping + read-modify-write. | `workers/stea-api/src/routes/admin.ts` | tsc passes |
| 8 | Only first card shows animated preview | ✅ CONFIRMED WORKING | Frontend builder (`buildReactDoc`, `buildHtmlCssJsDoc`) is correct. API returns all fields (jsx, css, html). The admin modal was empty because of bug #6 (no GET preview route). | N/A — fixed by bug #6 | Verified via API + code review |
| 9 | Card Zoom buttons "not working" | ❌ NOT A BUG | Buttons DO work — they set `form.cardZoom` which changes viewport size. Visual difference in `cover` mode is subtle. | N/A | — |

---

## Detailed Fixes

### Fix 1 — Card dimensions + black bar (bugs 2, 3, 4)

**File:** `src/pages/stea-code/SteaCodeHomeV2.jsx` — `CodeProductCard` (lines 1333-1335, 1408)

```jsx
const previewW = Number(product?.preview?.width)  || 1440;
const previewH = Number(product?.preview?.height) || 900;
const cardAspect = `${previewW} / ${previewH}`;
// Applied to <motion.button> style:
style={{ ..., aspectRatio: cardAspect, ... }}
```

Card now reads admin-set `preview.width / preview.height` and applies exact aspect ratio. No more hardcoded 16/11, no more letterboxing / dark bars.

### Fix 2 — Click-to-preview regression (bug 5)

**File:** `src/pages/stea-code/SteaCodeHomeV2.jsx` — `CodeProductCard` (line 1418)

Changed `interactive={cardInteractive}` → `interactive={false}` permanently.

The iframe inside the card stays `pointer-events: none` always. Clicks always pass through to the card button → modal always opens. Animations still run (interactive only gates pointer-events, not JS execution).

### Fix 3 — Admin form fields disappear (bug 6)

**Files:** 
- `workers/stea-api/src/routes/admin.ts` — added `handleAdminGetPreview` function
- `workers/stea-api/src/index.ts` — added GET route + import

The `GET /admin/stea-code/products/:productId/preview` route was missing entirely. Frontend's `getAdminSteaCodePreview()` called it, got 404, and the preview code editors stayed empty. Added the missing endpoint that reads from the `previews` table with fallback to embedded product.preview.

### Fix 4 — Save deletes fields (bug 7)

**File:** `workers/stea-api/src/routes/admin.ts` — `handleAdminUpdateProduct`

Rewrote from shallow `setDoc` merge to explicit read-modify-write with:
1. **Read existing** row from D1
2. **Deep merge** — top-level spread + deep merge for JSON object columns (preview, package, etc.)
3. **Skip undefined** fields (don't overwrite with undefined)
4. **Write back** full row via `setDoc(..., false)` (no double-merge)
5. **Return full updated product** (so frontend sees complete state)

This protects against:
- Accidentally replacing nested JSON objects (e.g. sending `preview: { enabled: true }` no longer wipes `preview.html`)
- `undefined` values from frontend overwriting real data
- Returning stale/partial data in the response

### Fix 5 — Homepage speed / caching (bug 1)

**Files:**
- `workers/stea-api/src/routes/catalog.ts`
- `workers/stea-api/src/routes/content.ts`

Added `Cache-Control` headers:
- **Catalog:** `public, max-age=300, s-maxage=300, stale-while-revalidate=600` (5 min)
- **Product detail:** `public, max-age=120, s-maxage=120, stale-while-revalidate=300` (2 min)
- **Preview:** `public, max-age=120, s-maxage=120, stale-while-revalidate=300` (2 min)

Removed dead `cacheTtl` options from old Firestore-era code.

**Expected impact:** Catalog TTFB drops from ~1.16s to ~50ms on edge-cached hits.

---

## Data Issues (Not Code Bugs)

### D1: `publicFiles` is null for 9/10 products
- Only `glow-button-effect` has `publicFiles` array
- `fileNames` exists for all products (just names, no content)
- **Impact:** Low — `preview.enabled=true` triggers live preview for 9 products
- **Fix:** Admin can re-save source files, or run migration to rebuild from `sources` table

### D1: 2 products have no live preview on cards
- `stea-glow-motion-button` — preview exists but `enabled: false`
- `aurora-glowing-buttons-pack` — no preview document at all
- **Impact:** These 2 cards show "preview unavailable" placeholder
- **Fix:** Admin action — enable preview or upload poster

### D1: `hasSource` field missing
- Referenced in frontend but not in D1 schema
- **Impact:** Low — "Source included" badge may not show
- **Fix:** Add column or compute from `sources` table existence

---

## Build Verification

### Frontend (Vite)
```
✓ built in 3.74s
dist/assets/SteaCodeHomeV2-CEUSTLBp.js
  aspectRatio: 1 occurrence  ✅ (dynamic card dimensions)
  interactive:!1: 1 occurrence ✅ (permanent non-interactive)
```

### Worker (TypeScript)
```
npx tsc --noEmit — 0 errors
```

---

## Deploy Instructions

### Step 1: Deploy Worker (Cloudflare)
```bash
cd "/Users/mac/Desktop/STEA Africa/workers/stea-api"
npx wrangler deploy
```
**Required for:** Bug 1 (caching), Bug 6 (admin preview GET), Bug 7 (save merge)

### Step 2: Deploy Frontend (Firebase Hosting)
```bash
cd "/Users/mac/Desktop/STEA Africa"
npm run build
firebase deploy --only hosting --project swahilitecheliteacademy
```
**Required for:** Bug 2/3/4 (card dimensions), Bug 5 (click-to-preview)

### Step 3: Verify after deploy

```bash
# 1. Worker — admin preview GET route works (was 404)
curl -s "https://code.stea.africa/api/admin/stea-code/products/glass-motion-car/preview" | head -c 100
# Should say "Authentication required" (not "Not found")

# 2. Worker — catalog has cache control
curl -sI "https://code.stea.africa/api/stea-code/catalog" | grep -i cache-control
# Should show: cache-control: public, max-age=300...

# 3. Frontend — find the SteaCodeHomeV2 chunk
curl -s "https://code.stea.africa" | grep -oE 'assets/SteaCodeHomeV2-[^"]+\.js' | head -1

# 4. Verify aspectRatio fix in deployed chunk
curl -s "https://code.stea.africa/assets/SteaCodeHomeV2-XXXXXX.js" | grep -c "aspectRatio"
# Should return 1 or more

# 5. Verify interactive=false in deployed chunk
curl -s "https://code.stea.africa/assets/SteaCodeHomeV2-XXXXXX.js" | grep -c "interactive:!1"
# Should return 1 or more
```

### Step 4: Browser verification
1. Hard reload `https://code.stea.africa` (Cmd+Shift+R)
2. **Card dimensions:** Inspect a card → Computed → `aspect-ratio` should show actual product ratio (e.g. `1440 / 900`)
3. **No dark bars:** Preview fills card edge-to-edge
4. **Click works:** Click any card after waiting 3 seconds → modal opens
5. **Catalog speed:** Second load should be near-instant (cached)
6. **Admin form:** Edit a product → Preview tab should show code correctly → Save → fields still there
