# STEA Code API — Cloudflare Worker

Backend API for STEA Code, running on Cloudflare Workers.

## What it does

- Serves all `/api/stea-code/*` and `/api/admin/stea-code/*` routes
- Reads/writes product metadata to Firestore (via REST API, no Admin SDK)
- Stores large assets (packages, preview videos) in Cloudflare R2
- Generates signed R2 download URLs (AWS SigV4 via Web Crypto)
- Verifies Firebase Auth ID tokens (Web Crypto, no Admin SDK)

## Required Secrets (set via `wrangler secret put`)

| Secret | Description |
|---|---|
| `R2_ACCOUNT_ID` | Your Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 access key ID |
| `R2_SECRET_ACCESS_KEY` | R2 secret access key |
| `R2_BUCKET_NAME` | R2 bucket name (default: `steacode`) |
| `FIREBASE_SERVICE_ACCOUNT` | Full JSON string of the Firebase service account |
| `FIREBASE_PROJECT_ID` | Firebase project ID (e.g. `swahilitecheliteacademy`) |

## Setup & Deploy

```bash
# 1. Install dependencies
cd workers/stea-api
npm install

# 2. Log in to Cloudflare (only needed once)
npx wrangler login

# 3. Set each secret (will prompt for the value)
npx wrangler secret put R2_ACCOUNT_ID
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
npx wrangler secret put R2_BUCKET_NAME
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT
npx wrangler secret put FIREBASE_PROJECT_ID

# 4. Deploy the Worker
npx wrangler deploy
```

After deployment, Wrangler prints the Worker URL:
```
https://stea-api.<your-subdomain>.workers.dev
```

## Update Firebase Hosting Rewrite

Open `firebase.json` in the project root and update the `/api/**` rewrite:

```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "/api/**",
        "destination": "https://stea-api.<your-subdomain>.workers.dev/api/**"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

Then deploy hosting:

```bash
firebase deploy --only hosting --project swahilitecheliteacademy
```

## Local Development

```bash
cd workers/stea-api
npm install
npx wrangler dev
```

Note: R2 bindings require a real bucket connection. Use `wrangler dev --remote` for full R2 access during local testing.

## API Routes

### Public
| Method | Path | Description |
|---|---|---|
| GET | `/api/stea-code/catalog` | List all published products |
| GET | `/api/stea-code/products/:id` | Product detail |
| GET | `/api/stea-code/products/:id/preview` | Live preview source |
| GET | `/api/stea-code/products/:id/free-content` | Free product source files |
| GET | `/api/stea-code/products/:id/content` | Premium source files (auth + entitlement) |
| GET | `/api/stea-code/products/:id/download` | 302 redirect to signed R2 download URL |

### Admin (requires admin email)
| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/stea-code/products` | List all products |
| GET | `/api/admin/stea-code/products/:id/source` | Get source files |
| PUT | `/api/admin/stea-code/products/:id/source` | Save source files |
| POST | `/api/admin/stea-code/products/:id/package/upload` | Upload .zip to R2 |
| POST | `/api/admin/stea-code/products/:id/preview/upload` | Upload video/poster to R2 |
