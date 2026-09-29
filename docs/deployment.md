# STEA Deployment Guide

This document outlines the exact deployment steps to deploy STEA to production.

## 1. Prerequisites
- A Google Cloud Platform (GCP) Account
- Firebase CLI installed (`npm install -g firebase-tools`)
- Node.js environment
- Project configured on Firebase (Firestore, Authentication, Hosting)

## 2. Environment Variables Configuration
1. Login to a target cloud hosting provider or set up secrets.
2. The following variables must be defined in the deployed environment to function:
   - `GEMINI_API_KEY`: Required for AI Chat. (Get from Google AI Studio).
   - `SPORTS_API_KEY`: Required for fetching sports scores. (Get from api-sports.io).
   - `APP_URL`: Set automatically if using Google Cloud Run, else manually set to `https://stea.africa`.
   - `VITE_ADSENSE_PUBLISHER_ID`: Your AdSense publisher ID (optional).

## 3. Firebase Deployment Configuration
The `firestore.rules` and `firebase.json` files are pre-configured.

Execute the following steps:
1. `firebase login`
2. `firebase use [YOUR_PROJECT_ID]`
3. `firebase deploy --only firestore:rules`

## 4. Frontend & Backend Deployment
If deploying as a monolith (Vite + Express):
1. Build the application: `npm run build`
2. Start the production server: `npm start`

If deploying onto Google Cloud Run (Recommended for AI Studio):
1. Create a `Dockerfile` specifying `npm run build` then `npm start`.
2. Deploy the container:
   `gcloud run deploy stea-app --source . --region europe-west1 --allow-unauthenticated`
3. Make sure you map secrets (API keys) onto the Cloud Run execution environment.

## 5. Domain Configuration
To use `stea.africa`:
1. Use Cloud Run Custom Domains or configure a Global Load Balancer to route `stea.africa` to your Cloud Run service.
2. Update DNS A and AAAA records accordingly.

## 6. Post-Deployment Checks
- [ ] Connect PWA context checks out. `manifest.webmanifest` and `sw.js` fetch locally ok.
- [ ] SEO Tags properly crawlable. Test using Google Search Console URL inspection.
- [ ] Rate limiters are working (trigger >50 requests to `/api/` in 5 mins and observe 429 status code).
- [ ] Test the backend NECTA results API at `/api/necta/schools?examType=csee&year=2024`.
- [ ] Verify `chaba_orders` create webhook processing locally or manually.
