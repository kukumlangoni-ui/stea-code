# STEA CODE Audit — Homepage & Admin

Date: 2026-09-21
Scope: /code homepage, /code-admin, product preview pipeline.

## Confirmed issues

### A1. Cards are "blind" — no running preview
- `src/pages/stea-code/SteaCodeHomeV2.jsx:1502` `useLivePreview = Boolean(product?.preview?.enabled)`.
- Seed products in `src/data/stea-code/codeProductsServer.js` have NO `preview` field and NO `posterImageUrl`.
- So `ProductPreview` (line 1504) falls through to `.sc-preview-unavailable` gradient (the "generic orbs").
- The catalog API DOES expose `hasSource: true` for these products (`server.ts:1220`), but the client ignores it.
- Even if the client mounted `SteaCodeProductLivePreview`, the endpoint `GET /api/stea-code/products/:productId/preview` (`server.ts:1247`) returns 404 because `getSteaCodePreviewSource` (`server.ts:1144`) only reads from `stea_code_product_previews` collection or `product.preview.{html,css,js}` — neither exists for seeds.
- **Root cause**: seed source lives in `protectedFiles[]`, which the preview pipeline never reads.

### A2. Free product contradiction ("Free to use" + "Source files not available")
- `SteaCodeHomeV2.jsx:3086` renders "Source files not available" for free products without source.
- A free product should be unpublishable without source.

### A3. Admin "DEV PREVIEW MODE" banner + data mismatch
- `src/admin-v2/previewData.js:15` defines `ADMIN_V2_PREVIEW_BANNER = "DEV PREVIEW MODE — No real data changes"`.
- Admin studio may be showing the mock preview catalog (1 product) while homepage reads 9 from server catalog.
- Admin CSS: `admin-v2.css` is imported at `SteaCodeAdminApp.jsx:34`, so styling should load. The unstyled appearance is likely the preview/mock shell, not missing CSS.

### A4. Empty homepage state
- `SteaCodeHomeV2.jsx:481-487` filters `status === "published" && homepageVisible === true`.
- New products default `homepageVisible` to false → "No products approved for the homepage yet."

## Fix plan (in order)
1. Server: `getSteaCodePreviewSource` falls back to assembling a preview from `protectedFiles` (free) / `demoPreview` (premium).
2. Client: `ProductPreview` mounts `SteaCodeProductLivePreview` when `hasSource` is true.
3. Client: free products without source show "Preview only" — never "Free to use, open the code".
4. Admin: default `homepageVisible: true` on publish; readiness checklist blocks publish of free products without source.
