# STEA Security Overview

This document outlines the security measures implemented in the STEA application.

## 1. API Security
- **Backend Proxying:** Sensitive API keys (Gemini, Sports Data) are managed exclusively on the server side in `backend/server.ts`. They are never exposed to the client browser.
- **Rate Limiting:** Global and endpoint-specific rate limiting (`express-rate-limit`) is applied to prevent abuse and Denial-of-Service (DoS) attacks.
  - Global: 100 requests per 15 minutes.
  - API: 50 requests per 5 minutes.
  - Orders: 10 orders per hour per IP.
- **Input Sanitization:** 
  - NECTA parameters are strictly validated against allow-lists and regex patterns.
  - AI chat inputs are limited to 2000 characters and validated for type.
  - Order payloads have required field checks and payload size limits (10kb).

## 2. Infrastructure & Secrets
- **Environment Variables:** Secrets are managed via AI Studio's environment variables. 
- **.env Safety:** `.env` files are ignored in `.gitignore`, and a sanitized `.env.example` is provided for reference.
- **Vite Configuration:** Environment variables are no longer inlined into the frontend bundle unless they are explicitly prefixed with `VITE_` (for non-sensitive data like AdSense IDs).

## 3. Database Security (Firestore)
- **Least Privilege:** Firestore rules enforce role-based access control.
- **Admin Lockdown:** Only verified admin emails defined in `firestore.rules` can perform broad write/delete operations.
- **Ownership:** Users can only read/write their own profile data.

## 4. Best Practices
- **No Hardcoded Keys:** A search-and-clean process ensures no sensitive tokens exist in the source code.
- **Secure Defaults:** The application defaults to secure communication and restricted access where possible.

## 5. Ongoing Monitoring
- System logs (`site_logs` collection in Firestore) track sync errors and potential security events for manual review.
