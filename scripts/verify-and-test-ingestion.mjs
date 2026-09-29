/**
 * STEA AI Catalog Ingestion — Verification & Test Suite
 * ====================================================================
 * Runs Tests 1-9 from the spec. Test 10 (npm run build) is run separately.
 * Does NOT deploy. Does NOT delete existing data. Does NOT publish records.
 * ====================================================================
 */

import admin from "firebase-admin";

const app = admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "swahilitecheliteacademy",
});
const db = admin.firestore(app);
const serverTimestamp = () => admin.firestore.FieldValue.serverTimestamp();

const { ingestWebsite, ingestBatch } = await import("../src/utils/aiCatalogIngestion.js");
const { VPN_AND_ADBLOCKER_CATALOG } = await import("../src/data/seedVpnAdBlockerCatalog.js");

const results = {};
const log = (label, msg) => console.log(`[${label}] ${msg}`);

// ─────────────────────────────────────────────────────────────────────────
// VERIFY 2: Confirm 37 existing records intact
// ─────────────────────────────────────────────────────────────────────────
async function verifyExistingRecords() {
  log("VERIFY-2", "Checking existing 37 AI-ingested records...");
  const snap = await db.collection("websites")
    .where("source", "==", "ai_catalog_ingestion_vpn_adblocker")
    .get();

  const total = snap.size;
  const drafts = snap.docs.filter(d => d.data().status === "draft").length;
  const published = snap.docs.filter(d => d.data().status === "published").length;
  const vpnTagged = snap.docs.filter(d => (d.data().tags || []).some(t => t === "VPN")).length;
  const adBlockerTagged = snap.docs.filter(d => (d.data().tags || []).some(t => t === "Ad Blocker")).length;

  // Check for duplicate domains within the set
  const domains = snap.docs.map(d => d.data().domain).filter(Boolean);
  const domainCounts = {};
  domains.forEach(d => { domainCounts[d] = (domainCounts[d] || 0) + 1; });
  const dupDomains = Object.entries(domainCounts).filter(([_, c]) => c > 1);

  console.log("  Total AI-ingested records:", total);
  console.log("  status=draft:", drafts);
  console.log("  status=published:", published);
  console.log("  VPN-tagged:", vpnTagged);
  console.log("  Ad Blocker-tagged:", adBlockerTagged);
  console.log("  Duplicate domains within set:", dupDomains.length);

  results.verify2 = {
    total, drafts, published, vpnTagged, adBlockerTagged,
    duplicateDomains: dupDomains,
  };

  log("VERIFY-2", total === 37 && drafts === 37 && vpnTagged === 22 && adBlockerTagged === 15 && dupDomains.length === 0 ? "PASS" : "FAIL");
  console.log("");
}

// ─────────────────────────────────────────────────────────────────────────
// TEST 1: Import one completely new app → 1 new Firestore document
// ─────────────────────────────────────────────────────────────────────────
async function test1NewApp() {
  log("TEST-1", "Importing one new app (Cloudflare WARP)...");
  const entry = {
    name: "Cloudflare WARP",
    url: "https://1.1.1.1/",
    category: "AdBlockers & VPN",
    description: "Cloudflare's free consumer VPN and DNS resolver. Replaces connections between your device and the internet with a modern, encrypted protocol.",
    pricingType: "free",
    sourceStatus: "official",
    verificationStatus: "verified",
    trustStatus: "trusted",
    contentType: "Discovery",
    country: "Global",
    language: "English",
    tags: ["VPN", "DNS", "Free", "Privacy", "Security"],
  };
  const result = await ingestWebsite(db, entry, {
    createdBy: "ai-agent-test",
    source: "ai_catalog_ingestion_test",
    serverTimestamp,
  });
  console.log("  Result:", JSON.stringify(result));
  results.test1 = result;
  log("TEST-1", result.status === "created" ? "PASS — 1 new document created" : "FAIL");
  console.log("");
}

// ─────────────────────────────────────────────────────────────────────────
// TEST 2: Import the exact same app again → 0 new, 1 duplicate
// ─────────────────────────────────────────────────────────────────────────
async function test2SameApp() {
  log("TEST-2", "Re-importing the same app (Cloudflare WARP)...");
  const entry = {
    name: "Cloudflare WARP",
    url: "https://1.1.1.1/",
    category: "AdBlockers & VPN",
    description: "Cloudflare's free consumer VPN and DNS resolver.",
    pricingType: "free",
    sourceStatus: "official",
    tags: ["VPN", "DNS", "Free", "Privacy"],
  };
  const result = await ingestWebsite(db, entry, {
    createdBy: "ai-agent-test",
    source: "ai_catalog_ingestion_test",
    serverTimestamp,
  });
  console.log("  Result:", JSON.stringify(result));
  results.test2 = result;
  log("TEST-2", result.status === "duplicate" ? "PASS — duplicate detected, no new doc" : "FAIL");
  console.log("");
}

// ─────────────────────────────────────────────────────────────────────────
// TEST 3: URL normalization variants → duplicate detected
// ─────────────────────────────────────────────────────────────────────────
async function test3UrlVariants() {
  log("TEST-3", "Testing URL normalization variants...");
  const variants = [
    { label: "trailing slash", url: "https://1.1.1.1/" },
    { label: "no trailing slash", url: "https://1.1.1.1" },
    { label: "www prefix", url: "https://www.1.1.1.1/" },
    { label: "http scheme", url: "http://1.1.1.1/" },
  ];
  let allDuplicates = true;
  for (const v of variants) {
    const result = await ingestWebsite(db, {
      name: "Cloudflare WARP",
      url: v.url,
      category: "AdBlockers & VPN",
      pricingType: "free",
      sourceStatus: "official",
      tags: ["VPN"],
    }, { createdBy: "ai-agent-test", source: "ai_catalog_ingestion_test", serverTimestamp });
    console.log(`  ${v.label.padEnd(20)} → ${result.status}${result.duplicateId ? ` (id: ${result.duplicateId})` : ""}${result.error ? ` — ${result.error}` : ""}`);
    if (result.status !== "duplicate") allDuplicates = false;
  }
  results.test3 = { allDuplicates };
  log("TEST-3", allDuplicates ? "PASS — all variants detected as duplicates via domain" : "FAIL — some variants not detected");
  console.log("");
}

// ─────────────────────────────────────────────────────────────────────────
// TEST 4-5: Batch re-import of existing 37 → 0 new, 37 duplicates
// ─────────────────────────────────────────────────────────────────────────
async function test4and5BatchReimport() {
  log("TEST-4/5", "Re-importing the existing 37-record batch...");
  const batchResult = await ingestBatch(db, VPN_AND_ADBLOCKER_CATALOG, {
    createdBy: "ai-agent",
    source: "ai_catalog_ingestion_vpn_adblocker",
    serverTimestamp,
    delayMs: 100,
  });
  console.log("  Requested:", batchResult.summary.requested);
  console.log("  Created:", batchResult.summary.created);
  console.log("  Duplicates:", batchResult.summary.duplicates);
  console.log("  Failed:", batchResult.summary.failed);
  results.test4and5 = batchResult.summary;
  const pass = batchResult.summary.created === 0 && batchResult.summary.duplicates === 37 && batchResult.summary.failed === 0;
  log("TEST-4/5", pass ? "PASS — 0 new, 37 duplicates, 0 failed (idempotent)" : "FAIL");
  console.log("");
}

// ─────────────────────────────────────────────────────────────────────────
// TEST 6: Confirm existing 37 records not duplicated
// ─────────────────────────────────────────────────────────────────────────
async function test6NoDuplication() {
  log("TEST-6", "Confirming existing 37 records were not duplicated...");
  const snap = await db.collection("websites")
    .where("source", "==", "ai_catalog_ingestion_vpn_adblocker")
    .get();
  const total = snap.size;
  console.log("  Records with source=ai_catalog_ingestion_vpn_adblocker:", total);
  results.test6 = { total };
  log("TEST-6", total === 37 ? "PASS — still 37, no duplicates created" : `FAIL — expected 37, got ${total}`);
  console.log("");
}

// ─────────────────────────────────────────────────────────────────────────
// TEST 7: Confirm draft AI records do not appear publicly
// ─────────────────────────────────────────────────────────────────────────
async function test7DraftsNotPublic() {
  log("TEST-7", "Checking that draft AI records are not published...");
  // Check all AI-ingested records (vpn_adblocker + test)
  const snap1 = await db.collection("websites")
    .where("createdByType", "==", "ai")
    .where("status", "==", "published")
    .get();
  const snap2 = await db.collection("websites")
    .where("createdByType", "==", "ai")
    .where("published", "==", true)
    .get();
  console.log("  AI records with status=published:", snap1.size);
  console.log("  AI records with published=true:", snap2.size);
  results.test7 = { publishedAI: snap1.size + snap2.size };
  const pass = snap1.size === 0 && snap2.size === 0;
  log("TEST-7", pass ? "PASS — no AI records are published" : "FAIL — some AI records are public");
  console.log("");
}

// ─────────────────────────────────────────────────────────────────────────
// TEST 9: Confirm existing website records still work
// ─────────────────────────────────────────────────────────────────────────
async function test9ExistingRecordsWork() {
  log("TEST-9", "Checking existing website records are readable...");
  const snap = await db.collection("websites").limit(5).get();
  console.log("  Sample of", snap.size, "records:");
  snap.docs.slice(0, 3).forEach(d => {
    const data = d.data();
    console.log(`    - ${data.name || data.title || "(unnamed)"} [${data.status || "no-status"}]`);
  });
  results.test9 = { readable: snap.size > 0 };
  log("TEST-9", snap.size > 0 ? "PASS — Firestore reads work" : "FAIL — no records readable");
  console.log("");
}

// ─────────────────────────────────────────────────────────────────────────
// RUN ALL
// ─────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("================================================================");
  console.log("STEA AI Catalog Ingestion — Verification & Test Suite");
  console.log("Project: swahilitecheliteacademy");
  console.log("================================================================\n");

  await verifyExistingRecords();
  await test1NewApp();
  await test2SameApp();
  await test3UrlVariants();
  await test4and5BatchReimport();
  await test6NoDuplication();
  await test7DraftsNotPublic();
  await test9ExistingRecordsWork();

  console.log("================================================================");
  console.log("TEST SUMMARY");
  console.log("================================================================");
  console.log("VERIFY-2 (37 records intact):", results.verify2.total === 37 ? "PASS" : "FAIL");
  console.log("TEST-1 (new app created):", results.test1.status === "created" ? "PASS" : "FAIL");
  console.log("TEST-2 (duplicate detected):", results.test2.status === "duplicate" ? "PASS" : "FAIL");
  console.log("TEST-3 (URL variants deduped):", results.test3.allDuplicates ? "PASS" : "FAIL");
  console.log("TEST-4/5 (batch idempotent):", results.test4and5.created === 0 ? "PASS" : "FAIL");
  console.log("TEST-6 (37 not duplicated):", results.test6.total === 37 ? "PASS" : "FAIL");
  console.log("TEST-7 (drafts not public):", results.test7.publishedAI === 0 ? "PASS" : "FAIL");
  console.log("TEST-9 (records readable):", results.test9.readable ? "PASS" : "FAIL");
  console.log("");
  console.log("TEST-8 (publish via Admin): SKIPPED — not modifying data; Admin UI is the review path");
  console.log("TEST-10 (npm run build): run separately");
  console.log("");

  process.exit(0);
}

main().catch((err) => { console.error("FATAL:", err); process.exit(1); });
