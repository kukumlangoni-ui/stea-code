/**
 * STEA Code — Firestore → Cloudflare D1 Migration Script
 *
 * Reads all documents from 6 Firestore collections, transforms them to match
 * the D1 schema, and writes SQL INSERT statements to seed.sql.
 *
 * No external dependencies — uses Node's built-in crypto module for JWT
 * signing and the global fetch() for Firestore REST API calls.
 *
 * Usage:
 *   export FIREBASE_SERVICE_ACCOUNT_PATH="/path/to/serviceAccount.json"
 *   node scripts/migrate-firestore-to-d1.mjs
 *
 * Or:
 *   export FIREBASE_SERVICE_ACCOUNT='{ ...json... }'
 *   node scripts/migrate-firestore-to-d1.mjs
 *
 * Output:
 *   - workers/stea-api/seed.sql          (SQL INSERT statements)
 *   - workers/stea-api/migration-report.json (counts + metadata)
 */

import crypto from "node:crypto";
import { writeFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WORKER_DIR = join(__dirname, "..");

// ============================================================
// Configuration
// ============================================================

const PROJECT_ID = "swahilitecheliteacademy";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const COLLECTIONS = [
  {
    firestore: "stea_code_products",
    d1Table: "products",
    pkColumn: "id",
    columns: [
      "id", "slug", "titleEn", "titleZh", "shortDescriptionEn",
      "shortDescriptionZh", "price", "pricingType", "category",
      "status", "featured", "homepageVisible", "tags", "frameworks",
      "languages", "craftNoteEn", "aiPrompt", "previewVideoUrl",
      "posterImageUrl", "preview", "publicFiles", "protectedFiles",
      "sourceFiles", "sourceCode", "fileNames", "package",
      "createdAt", "updatedAt", "createdBy", "updatedBy", "extraData",
    ],
  },
  {
    firestore: "stea_code_product_previews",
    d1Table: "previews",
    pkColumn: "productId",
    columns: [
      "productId", "runtime", "html", "css", "javascript", "jsx",
      "tsx", "fullDocument", "baseUrl", "externalUrl", "width",
      "height", "viewportMode", "scaleMode", "enabled", "videoKey",
      "posterKey", "updatedAt", "updatedBy", "extraData",
    ],
  },
  {
    firestore: "stea_code_product_sources",
    d1Table: "sources",
    pkColumn: "productId",
    columns: [
      "productId", "files", "updatedAt", "updatedBy", "extraData",
    ],
  },
  {
    firestore: "stea_code_entitlements",
    d1Table: "entitlements",
    pkColumn: "id",
    columns: [
      "id", "userId", "productId", "source", "orderId", "licenseType",
      "grantedAt", "expiresAt", "extraData",
    ],
  },
  {
    firestore: "stea_code_orders",
    d1Table: "orders",
    pkColumn: "id",
    columns: [
      "id", "userId", "productId", "amount", "currency", "status",
      "provider", "providerOrderId", "createdAt", "extraData",
    ],
  },
  {
    firestore: "stea_code_webhook_events",
    d1Table: "webhook_events",
    pkColumn: "id",
    columns: [
      "id", "provider", "eventType", "payload", "receivedAt",
      "processed", "extraData",
    ],
  },
];

// Columns that store JSON (arrays/objects) and must be stringified
const JSON_COLUMNS = new Set([
  "tags", "frameworks", "languages", "preview", "publicFiles",
  "protectedFiles", "sourceFiles", "sourceCode", "fileNames", "package",
  "files", "payload", "extraData",
]);

// Columns that are boolean → stored as INTEGER 0/1
const BOOL_COLUMNS = new Set([
  "featured", "homepageVisible", "enabled", "processed",
]);

// Columns that are numbers → stored as REAL or INTEGER
const NUM_COLUMNS = new Set([
  "price", "width", "height", "amount",
]);

// ============================================================
// Service Account + OAuth
// ============================================================

async function loadServiceAccount() {
  const { readFileSync } = await import("node:fs");
  const jsonPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const jsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (jsonPath) {
    return JSON.parse(readFileSync(jsonPath, "utf-8"));
  }
  if (jsonRaw) {
    return JSON.parse(jsonRaw);
  }
  throw new Error(
    "Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT env var."
  );
}

function base64UrlEncode(buf) {
  const bytes = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  return bytes.toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function signJWT(sa) {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const headerB64 = base64UrlEncode(Buffer.from(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(Buffer.from(JSON.stringify(payload)));
  const unsigned = `${headerB64}.${payloadB64}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  const sig = signer.sign(sa.private_key);
  const sigB64 = base64UrlEncode(sig);

  return `${unsigned}.${sigB64}`;
}

let cachedToken = null;

async function getAccessToken(sa) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }
  const jwt = signJWT(sa);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OAuth token exchange failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.token;
}

// ============================================================
// Firestore REST API
// ============================================================

async function fetchCollectionPage(token, collection, pageToken) {
  const params = new URLSearchParams({ pageSize: "300" });
  if (pageToken) params.set("pageToken", pageToken);

  const url = `${FIRESTORE_BASE}/${collection}?${params}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 429) {
    throw new Error(
      `Firestore 429 quota exhausted while reading ${collection}. ` +
      `Wait for quota reset (typically midnight Pacific time) and re-run.`
    );
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore LIST ${collection} failed: ${res.status} ${text}`);
  }

  return res.json();
}

async function fetchAllDocs(token, collection) {
  const allDocs = [];
  let pageToken = null;
  let pageCount = 0;

  do {
    const body = await fetchCollectionPage(token, collection, pageToken);
    const docs = body.documents || [];
    allDocs.push(...docs);
    pageToken = body.nextPageToken || null;
    pageCount++;
    console.log(`  Page ${pageCount}: ${docs.length} docs (total: ${allDocs.length})`);
  } while (pageToken);

  return allDocs;
}

// ============================================================
// Firestore value → JS value conversion
// ============================================================

function firestoreValueToJs(v) {
  if (v === null || v === undefined) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("referenceValue" in v) return v.referenceValue;
  if ("geoPointValue" in v) return v.geoPointValue;
  if ("arrayValue" in v) {
    return (v.arrayValue.values || []).map(firestoreValueToJs);
  }
  if ("mapValue" in v) {
    return docFieldsToJs(v.mapValue.fields || {});
  }
  return null;
}

function docFieldsToJs(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = firestoreValueToJs(v);
  }
  return out;
}

// ============================================================
// Transform: Firestore doc → D1 row
// ============================================================

function transformDoc(collectionCfg, docId, data) {
  const row = {};
  const extra = {};

  // Set the primary key
  row[collectionCfg.pkColumn] = docId;

  // For entitlements, extract userId/productId from doc ID if missing
  if (collectionCfg.d1Table === "entitlements") {
    if (!data.userId && !data.uid) {
      const parts = docId.split("_");
      if (parts.length >= 2) row.userId = parts[0];
    }
    if (!data.productId) {
      const parts = docId.split("_");
      if (parts.length >= 2) row.productId = parts.slice(1).join("_");
    }
    // Map uid → userId if Firestore used that field name
    if (data.uid && !data.userId) row.userId = data.uid;
  }

  // Process known columns
  for (const col of collectionCfg.columns) {
    if (col === collectionCfg.pkColumn) continue; // already set
    if (col === "extraData") continue; // handled at end

    let val = data[col];

    // Handle field name variants for entitlements
    if (val === undefined && col === "userId" && data.uid !== undefined) {
      val = data.uid;
    }
    if (val === undefined && col === "productId" && data.product_id !== undefined) {
      val = data.product_id;
    }

    if (val === undefined) {
      row[col] = null;
      continue;
    }

    if (val === null) {
      row[col] = null;
      continue;
    }

    if (JSON_COLUMNS.has(col)) {
      row[col] = JSON.stringify(val);
    } else if (BOOL_COLUMNS.has(col)) {
      row[col] = val ? 1 : 0;
    } else if (NUM_COLUMNS.has(col)) {
      row[col] = typeof val === "number" ? val : Number(val) || null;
    } else {
      // String or other — stringify if not already a string
      row[col] = typeof val === "string" ? val : String(val);
    }
  }

  // Collect unknown fields into extraData
  for (const [k, v] of Object.entries(data)) {
    if (k === collectionCfg.pkColumn) continue;
    if (!collectionCfg.columns.includes(k) && k !== "uid") {
      extra[k] = v;
    }
  }
  row.extraData = Object.keys(extra).length > 0 ? JSON.stringify(extra) : null;

  return row;
}

// ============================================================
// SQL generation
// ============================================================

function sqlEscape(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") {
    if (Number.isNaN(val)) return "NULL";
    return String(val);
  }
  if (typeof val === "boolean") return val ? "1" : "0";
  // String — escape single quotes by doubling them
  const str = String(val);
  return `'${str.replace(/'/g, "''")}'`;
}

function generateInsert(table, columns, row) {
  const colNames = columns.filter((c) => row[c] !== undefined);
  const values = colNames.map((c) => sqlEscape(row[c]));
  return `INSERT OR REPLACE INTO ${table} (${colNames.join(", ")}) VALUES (${values.join(", ")});`;
}

function generateManifestInsert(sourceCollection, sourceDocId, targetTable, targetId) {
  const migratedAt = Date.now();
  return `INSERT OR REPLACE INTO _migration_manifest (source_collection, source_doc_id, target_table, target_id, migrated_at) VALUES (${sqlEscape(sourceCollection)}, ${sqlEscape(sourceDocId)}, ${sqlEscape(targetTable)}, ${sqlEscape(targetId)}, ${migratedAt});`;
}

// ============================================================
// Main migration
// ============================================================

async function main() {
  console.log("=== STEA Code: Firestore → D1 Migration ===\n");

  // Load service account
  const sa = await loadServiceAccount();
  console.log(`Service account: ${sa.client_email}`);
  console.log(`Project: ${PROJECT_ID}\n`);

  // Get OAuth token
  console.log("Getting OAuth token...");
  const token = await getAccessToken(sa);
  console.log("Token acquired.\n");

  const sqlLines = [];
  const report = {
    generatedAt: new Date().toISOString(),
    project: PROJECT_ID,
    collections: [],
    totalDocs: 0,
    totalErrors: 0,
  };

  sqlLines.push("-- ============================================================");
  sqlLines.push("-- STEA Code: Firestore → D1 Migration Seed Data");
  sqlLines.push(`-- Generated: ${report.generatedAt}`);
  sqlLines.push("-- ============================================================");
  sqlLines.push("");

  for (let i = 0; i < COLLECTIONS.length; i++) {
    const cfg = COLLECTIONS[i];
    console.log(`\n[${i + 1}/${COLLECTIONS.length}] Collection: ${cfg.firestore} → ${cfg.d1Table}`);

    let docs = [];
    let error = null;

    try {
      docs = await fetchAllDocs(token, cfg.firestore);
    } catch (e) {
      error = e.message;
      console.error(`  ERROR: ${error}`);
    }

    const colReport = {
      firestoreCollection: cfg.firestore,
      d1Table: cfg.d1Table,
      totalDocs: docs.length,
      migrated: 0,
      errors: [],
    };

    if (error) {
      colReport.errors.push(error);
      report.totalErrors++;
    }

    if (docs.length > 0) {
      sqlLines.push(`-- ${cfg.firestore} → ${cfg.d1Table} (${docs.length} docs)`);
    }

    for (let j = 0; j < docs.length; j++) {
      const doc = docs[j];
      const docId = doc.name.split("/").pop();
      const data = docFieldsToJs(doc.fields || {});

      console.log(`  [${j + 1}/${docs.length}] ${docId}`);

      try {
        const row = transformDoc(cfg, docId, data);
        const insert = generateInsert(cfg.d1Table, cfg.columns, row);
        sqlLines.push(insert);

        const manifest = generateManifestInsert(
          cfg.firestore, docId, cfg.d1Table,
          row[cfg.pkColumn]
        );
        sqlLines.push(manifest);

        colReport.migrated++;
      } catch (e) {
        const errMsg = `Failed to transform ${docId}: ${e.message}`;
        colReport.errors.push(errMsg);
        console.error(`  ${errMsg}`);
        report.totalErrors++;
      }
    }

    if (docs.length > 0) {
      sqlLines.push("");
    }

    report.collections.push(colReport);
    report.totalDocs += docs.length;
  }

  // Write seed.sql
  const seedPath = join(WORKER_DIR, "seed.sql");
  writeFileSync(seedPath, sqlLines.join("\n") + "\n", "utf-8");
  const seedSize = statSync(seedPath).size;

  // Write migration report
  const reportPath = join(WORKER_DIR, "migration-report.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf-8");

  console.log("\n=== Migration Complete ===");
  console.log(`Total docs:     ${report.totalDocs}`);
  console.log(`Total errors:   ${report.totalErrors}`);
  console.log(`seed.sql:       ${seedPath} (${(seedSize / 1024).toFixed(1)} KB)`);
  console.log(`Report:         ${reportPath}`);

  // Per-collection summary
  console.log("\nPer-collection:");
  for (const c of report.collections) {
    const status = c.errors.length > 0 ? "⚠ ERRORS" : "✓";
    console.log(`  ${status} ${c.firestore} → ${c.d1Table}: ${c.migrated}/${c.totalDocs} migrated`);
    for (const err of c.errors) {
      console.log(`      ${err}`);
    }
  }
}

main().catch((e) => {
  console.error("\n=== FATAL ERROR ===");
  console.error(e);
  process.exit(1);
});
