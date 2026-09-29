# STEA Code Bug Fix Report — 2026-09-24

## Summary

- **4 bugs fixed** (code changes ready, build verified)
- **2 bugs are data issues** (not code bugs — need admin action)
- **1 bug requires browser verification after deploy**
- **Deploy status**: Frontend build ready in `dist/`, Worker build passes TypeScript. Both need manual deploy (firebase deploy + wrangler deploy) — network issue from this machine blocks Google APIs.

---

## Per-Bug Table

| ID | Bug | Status | Root Cause | Fix Location | Verified |
|----|-----|--------|------------|--------------|----------|
| 1 | Products slow to appear on homepage | ✅ FIXED (code) | No `Cache-Control` header → no edge caching → 1.16s TTFB on every request | `workers/stea-api/src/routes/catalog.ts`, `content.ts` | Build passes, needs deploy |
| 2 | Card dimensions wrong on homepage | ✅ FIXED (code) | Hardcoded `aspect-ratio: 16/11` in CSS — ignored admin `preview.width/height` | `src/pages/stea-code/SteaCodeHomeV2.jsx` (CodeProductCard) | Build passes, needs deploy |
| 3 | Black bar at top of cards | ✅ FIXED (code) | Same as #2 — aspect ratio mismatch → iframe letterboxing | Same as #2 | Same as #2 |
| 4 | Two-state preview looks wrong | ✅ FIXED (code) | Same as #2 — both states share same card container | Same as #2 | Same as #2 |
| 5 | Clicking cards doesn't open modal | ✅ FIXED (code) | After 1.5s, iframe gets `pointer-events: auto` and eats clicks | `src/pages/stea-code/SteaCodeHomeV2.jsx` (interactive={false}) | Build passes, needs deploy |
| 6 | Admin edit: files/code/info disappear | ✅ FIXED (code) | **Missing route** — `GET /admin/stea-code/products/:id/preview` returned 404. Frontend called it but only PUT existed. | `workers/stea-api/src/routes/admin.ts`, `index.ts` | tsc passes, needs deploy |
| 7 | Empty dark boxes (preview unavailable) | ⚠️ DATA ISSUE | 2 products have no live preview: `stea-glow-motion-button` (enabled=false) and `aurora-glowing-buttons-pack` (no preview doc at all). Also `publicFiles` is null for 9/10 products (migrated as null from Firestore). | N/A (data, not code) | Confirmed via API |

---

## Detailed Fixes

### Fix 1 — Card dimensions + black bar (bugs 2, 3, 4)

**File:** `src/pages/stea-code/SteaCodeHomeV2.jsx` — `CodeProductCard` (lines 1333-1335, 1408)

**Change:** Added dynamic `aspectRatio` computed from `product.preview.width / product.preview.height` and applied via inline style.

```jsx
const previewW = Number(product?.preview?.width)  || 1440;
const previewH = Number(product?.preview?.height) || 900;
const cardAspect = `${previewW} / ${previewH}`;
// ...
style={{ ..., aspectRatio: cardAspect, ... }}
```

**Why it works:** The card previously had hardcoded `aspect-ratio: 16/11` (1.4545), but most previews are 1440×900 = 1.6 ratio. The mismatch caused letterboxing (dark bars from `#0a0a0f` background showing through). Now the card exactly matches the admin-configured preview dimensions.

**Fallback:** If no preview or missing dims, defaults to 1440/900 (16/10). The CSS `16/11` remains as a pre-hydration fallback but is overridden by the inline style.

### Fix 2 — Click-to-preview regression (bug 5)

**File:** `src/pages/stea-code/SteaCodeHomeV2.jsx` — `CodeProductCard` (line 1418)

**Change:** `interactive={cardInteractive}` → `interactive={false}`

**Why it works:** After 1.5s, `cardInteractive` became `true`, which set `pointer-events: auto` on the iframe. Clicks on the preview area were absorbed by the iframe instead of bubbling to the card's `<motion.button>` onClick handler. Setting `interactive={false}` permanently keeps the iframe non-interactive in the card — clicks always pass through to the card button → modal always opens.

**Animations still run:** The `interactive` prop only controls `pointer-events` and a CSS class. It does NOT stop JS execution or `requestAnimationFrame`. The iframe always has `sandbox="allow-scripts"`.

### Fix 3 — Admin form fields disappearing (bug 6)

**Files:** 
- `workers/stea-api/src/routes/admin.ts` — added `handleAdminGetPreview` (24 lines)
- `workers/stea-api/src/index.ts` — added GET route + import

**Change:** The `GET /admin/stea-code/products/:productId/preview` route was completely missing. The frontend's `getAdminSteaCodePreview()` function called it, got a 404, and the form's preview code editors stayed empty. Added the missing endpoint that reads from the `previews` table (with fallback to embedded preview on product doc).

### Fix 4 — Homepage speed / caching (bug 1)

**Files:**
- `workers/stea-api/src/routes/catalog.ts`
- `workers/stea-api/src/routes/content.ts`

**Change:** Added `Cache-Control` headers to all public GET endpoints:
- **Catalog:** `public, max-age=300, s-maxage=300, stale-while-revalidate=600` (5 min cache, 10 min SWR)
- **Product detail:** `public, max-age=120, s-maxage=120, stale-while-revalidate=300` (2 min)
- **Preview:** `public, max-age=120, s-maxage=120, stale-while-revalidate=300` (2 min)
- **Preview null:** `public, max-age=60, s-maxage=60` (1 min)

Also removed dead `cacheTtl` options from `getDoc`/`listDocs` calls — those were for the old Firestore edge cache which no longer exists.

**Expected impact:** Catalog TTFB should drop from ~1.16s to ~50ms on cached hits (Cloudflare edge cache).

---

## Data Issues (Not Code Bugs)

### D1: `publicFiles` is null for 9/10 products
- `glow-button-effect` has `publicFiles` array (4 items) ✅
- All other products have `publicFiles: null` ❌
- `fileNames` array exists for all products (just names, no content)
- This is a migration artifact — `publicFiles` was likely not populated in Firestore either, or the migration dropped it
- **Impact:** Minimal — `preview.enabled=true` triggers live preview for 9 products. Only affects `hasPublicHtmlCss` fallback path.
- **Fix needed:** Admin can re-save source files to populate `publicFiles`, or we run a migration to rebuild them from the `sources` table.

### D1: 2 products have no live preview
- `stea-glow-motion-button` — preview exists but `enabled: false`
- `aurora-glowing-buttons-pack` — no preview document at all
- **Impact:** These 2 cards show the "preview unavailable" placeholder (`<>` icon)
- **Fix needed:** Admin action — enable the preview or upload a poster image

### D1: `hasSource` field missing from all products
- `hasSource` is referenced in frontend but not in D1 schema
- Was likely a boolean field in Firestore that didn't make it into the migration
- **Impact:** Minimal — `preview.enabled=true` covers the main use case. The "Source included" badge on product cards might not show correctly.
- **Fix needed:** Add `hasSource INTEGER` column to products table, or compute it from the existence of a `sources` row.

---

## Build Verification

### Frontend (Vite)
```
✓ built in 3.74s
dist/assets/SteaCodeHomeV2-CEUSTLBp.js — contains both fixes
  - aspectRatio:u (1 occurrence) — dynamic aspect ratio
  - interactive:!1 (1 occurrence) — permanent non-interactive
```

### Worker (TypeScript)
```
npx tsc --noEmit — 0 errors
```

---

## Deploy Instructions

### Frontend (Firebase Hosting)
```bash
cd "/Users/mac/Desktop/STEA Africa"
npm run build
firebase deploy --only hosting --project swahilitecheliteacademy
```

### Worker (Cloudflare)
```bash
cd "/Users/mac/Desktop/STEA Africa/workers/stea-api"
npx wrangler deploy
```

### Verification after deploy
```bash
# 1. Check catalog has Cache-Control
curl -sI "https://code.stea.africa/api/stea-code/catalog" | grep -i cache-control

# 2. Check admin preview endpoint works
curl -s "https://code.stea.africa/api/admin/stea-code/products/magnetic-text-reveal/preview" -H "Authorization: Bearer <token>" | head -c 200

# 3. Find the SteaCodeHomeV2 chunk
curl -s "https://code.stea.africa" | grep -oE 'assets/SteaCodeHomeV2-[^"]+\.js' | head -1

# 4. Verify aspectRatio in deployed chunk
curl -s "https://code.stea.africa/assets/SteaCodeHomeV2-XXXXXX.js" | grep -c "aspectRatio"
# Should return 1 or more
```

---

## New Issues Discovered

1. **Deployed bundle is stale** — the live site's `SteaCodeHomeV2-BpuM-8MY.js` does NOT contain our fixes (0 occurrences of `aspectRatio`, 0 of `cardAspect`). The user's earlier "release complete" deploy didn't include these changes (they were made after their deploy).

2. **`hasSource` field missing** — referenced in frontend but not in D1. Low impact but should be fixed.

3. **`publicFiles` mostly null** — data gap from migration. Low impact but worth fixing.

---

## Recommendations

1. **Deploy both frontend and Worker together** — the admin form fix (bug 6) is a Worker-side change, and the card fixes are frontend. Deploy both in one session.

2. **After deploy, verify in browser:**
   - Card aspect ratio matches product dimensions (no dark bars)
   - Clicking any card (even after waiting) opens the modal
   - Admin editor loads preview code correctly
   - Catalog loads fast (< 500ms on second load)

3. **Follow up with data fixes:**
   - Enable preview for `stea-glow-motion-button` (or upload poster)
   - Add `hasSource` field to products table
   - Rebuild `publicFiles` from sources table
