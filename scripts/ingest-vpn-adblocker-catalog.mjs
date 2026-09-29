/**
 * STEA VPN & Ad Blocker Catalog Ingestion Script
 * ====================================================================
 * One-time script to ingest the VPN + Ad Blocker catalog into the
 * Firestore `websites` collection as drafts for Admin review.
 *
 * Usage:
 *   node scripts/ingest-vpn-adblocker-catalog.mjs [--dry-run] [--limit=N]
 *
 * Requires gcloud ADC credentials:
 *   gcloud auth application-default login
 *
 * All records are written with status: 'draft' — never published.
 * Duplicates are detected and skipped (never overwritten).
 * ====================================================================
 */

import admin from "firebase-admin";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the catalog data + ingestion utility from src/.
const { VPN_AND_ADBLOCKER_CATALOG, CATALOG_STATS } = await import(
  "../src/data/seedVpnAdBlockerCatalog.js"
);
const { ingestBatch } = await import("../src/utils/aiCatalogIngestion.js");

// ── Parse args ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;

// ── Init Firebase Admin with ADC ─────────────────────────────────────────
function initAdmin() {
  if (admin.apps.length > 0) return admin.apps[0];
  // Uses Application Default Credentials (gcloud auth application-default login).
  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: "swahilitecheliteacademy",
  });
}

const app = initAdmin();
const db = admin.firestore(app);
const serverTimestamp = () => admin.firestore.FieldValue.serverTimestamp();

// ── Run ──────────────────────────────────────────────────────────────────
async function main() {
  const entries = VPN_AND_ADBLOCKER_CATALOG.slice(0, limit);

  console.log("================================================================");
  console.log("STEA VPN & Ad Blocker Catalog Ingestion");
  console.log("================================================================");
  console.log(`Project: swahilitecheliteacademy`);
  console.log(`Mode: ${dryRun ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log(`Entries to process: ${entries.length}`);
  console.log(`  VPN: ${CATALOG_STATS.vpnRequested}`);
  console.log(`  Ad Blockers: ${CATALOG_STATS.adBlockerRequested}`);
  console.log("All records → status: 'draft' (Admin review required)");
  console.log("================================================================");
  console.log("");

  if (dryRun) {
    console.log("[DRY RUN] Would ingest the following entries:");
    entries.forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.name} → ${e.url} [${e.pricingType}]`);
    });
    console.log("");
    console.log("[DRY RUN] No Firestore writes performed.");
    return;
  }

  const results = await ingestBatch(db, entries, {
    createdBy: "ai-agent",
    source: "ai_catalog_ingestion_vpn_adblocker",
    serverTimestamp,
    delayMs: 200,
    onProgress: ({ index, total, result }) => {
      const statusLabel =
        result.status === "created" ? "✓ CREATED" :
        result.status === "duplicate" ? "⚠ DUPLICATE" : "✗ FAILED";
      console.log(
        `[${index}/${total}] ${statusLabel.padEnd(13)} ${result.name}` +
        (result.duplicateId ? ` (existing: ${result.duplicateId})` : "") +
        (result.error ? ` — ${result.error}` : "")
      );
    },
  });

  // ── Report ────────────────────────────────────────────────────────────
  console.log("");
  console.log("================================================================");
  console.log("INGESTION SUMMARY");
  console.log("================================================================");
  console.log(`Requested:  ${results.summary.requested}`);
  console.log(`Created:    ${results.summary.created}`);
  console.log(`Duplicates: ${results.summary.duplicates}`);
  console.log(`Failed:     ${results.summary.failed}`);
  console.log("================================================================");

  // Duplicates table
  if (results.duplicates.length > 0) {
    console.log("");
    console.log("DUPLICATES (skipped):");
    console.log("#  Name            Existing ID");
    results.duplicates.forEach((d, i) => {
      console.log(
        `${String(i + 1).padStart(2)}  ${d.name.padEnd(16)} ${d.duplicateId} (${d.duplicateUrl})`
      );
    });
  }

  // Failures table
  if (results.failed.length > 0) {
    console.log("");
    console.log("FAILURES:");
    results.failed.forEach((f) => {
      console.log(`  - ${f.name}: ${f.error}`);
    });
  }

  console.log("");
  console.log("All created records are in DRAFT status.");
  console.log("Review and publish from Admin → Websites.");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
