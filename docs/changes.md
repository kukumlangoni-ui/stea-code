# STEA Recent Changes Log

This file documents the major improvements made during the latest development iterations.

## Summary of Changes
1. **PWA Enhancements & Offline Experience**:
   - Replaced old `manifest.json` with `manifest.webmanifest`.
   - Updated `sw.js` to ensure the offline page (`offline.html`) loads cleanly when the network fails. 
   - Excluded the `/api/` paths from caching to prevent stale private data issues and added custom 503 fallback JSON resonses.
   - Handled offline translations in `offline.html` so it is bi-lingual (Swahili/English).
   - Removed 'localhost' execution of standard push interactions as it caused errors on local reload.

2. **Backend API Stability & Security**:
   - Hardened `backend/server.ts` by adding `express-rate-limit`. We defined Global Limits, Strict API Limits, and Checkout Order limits.
   - Protected AI routes (`/api/chat`) and proxy integrations to prevent API Key exposure.
   - Limited JSON body parsing to `10kb` to avoid Denial-of-Service attacks via large payloads.
   - Allowed dynamic rate limits using `NODE_ENV` configuration to not disrupt tests.

3. **SEO Improvements**:
   - Enchanced `/index.html` with advanced SEO tags, Twitter Cards, and OpenGraph parameters focusing on `stea.africa` core values.
   - Added Rich Structured Data (JSON-LD) for proper Google Indexing as a recognized Organization.
   - Upgraded `sitemap.xml` with priorities and all our new URLs (`/exams/results`, `/duka`, `/tech-tips`, etc).
   - Ensured headings inside pages are valid HTML structured headers where applicable.

4. **Integration Fixes**:
   - Fixed the AI Chat module so it proxies through standard REST `/api/chat` instead of executing client-side GenAI SDK requests.
   - Abstracted API interactions for NECTA into `SchoolResultsSearch.jsx` which displays lists of schools and fetches their results locally without relying solely on cloud-firestore.

5. **Linter Maintenance**:
   - Cleaned up unneeded eslint ignores inside pages and removed warnings connected to bad hook usages where safely refactorable.

6. **Premium Tech Vault (Resource Hub) & Homepage Redesign**:
   - Replaced "Daily Tech Tips" and "Tech Hub" instances on the frontend with the newly branded "STEA Resource Hub" & "Tech Vault".
   - Engineered the `ResourceHubPage` (`/tech`) acting as the primary index for categories like AI Guides, Phone Codes, Security Tips, and Prompts.
   - Designed `CategoryPage` and `ResourceDetailPage` with a premium light/gray aesthetic to match STEA premium styling, featuring copyable code steps and social sharing functions.
   - Built Admin scaffolding components (`ResourceAdminDashboard`, `ResourceEditorForm`) with a mock `resourceApi.js` ready to swap completely to Firestore once schemas are created.
   - **Completely redesigned the HomePage** (`HomePage.jsx`) to feature a striking light mode aesthetic (soft grays, black typography, warm gold accents) per the "Make the website feel simple, unique, premium" mandate.
   - Replaced old card styles with high-end glassmorphism, Framer Motion transitions, and modern African tech identity elements.
   - Overhauled Global Navigation (`Navbar.jsx`) keeping a dark sleek glassmorphism that floats elegantly on top of the site while maintaining light borders.
