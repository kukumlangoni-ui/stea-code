#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createSign } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";

// ============================================================
// STEA Code — Firestore → D1 migration (curl, no-shell mode)
// ============================================================

const SA_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  || join(homedir(), "secrets/privacykey.json");
const sa = JSON.parse(readFileSync(SA_PATH, "utf8"));
const PROJECT_ID = sa.project_id || "swahilitecheliteacademy";

console.log("=== STEA Code: Firestore → D1 Migration (curl mode) ===");
console.log("Service account:", sa.client_email);
console.log("Project:", PROJECT_ID);
console.log("");

// -- curl helper (execFileSync = no shell, no escaping bugs) ---------

function curlJSON(url, extraArgs = []) {
  const args = [
    "-sS", "--max-time", "120",
    "-H", "Content-Type: application/json",
    ...extraArgs,
    url,
  ];
  let out;
  try {
    out = execFileSync("curl", args, {
      encoding: "utf8",
      maxBuffer: 200 * 1024 * 1024,
      env: process.env, // inherit HTTPS_PROXY etc.
    });
  } catch (e) {
    throw new Error(`curl failed for ${url}: ${e.message}\n${e.stderr || ""}`);
  }
  if (!out.trim()) throw new Error(`Empty response from ${url}`);
  try {
    return JSON.parse(out);
  } catch {
    throw new Error(`Non-JSON response from ${url}:\n${out.slice(0, 500)}`);
  }
}

// -- OAuth token -----------------------------------------------------

function b64url(buf) {
  return buf.toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

console.log("Getting OAuth token...");
const now = Math.floor(Date.now() / 1000);
const header = { alg: "RS256", typ: "JWT" };
const claim = {
  iss: sa.client_email,
  scope: "https://www.googleapis.com/auth/datastore",
  aud: "https://oauth2.googleapis.com/token",
  exp: now + 3600,
  iat: now,
};
const unsigned =
  `${b64url(Buffer.from(JSON.stringify(header)))}.` +
  `${b64url(Buffer.from(JSON.stringify(claim)))}`;
const signer = createSign("RSA-SHA256");
signer.update(unsigned);
const sig = signer.sign(sa.private_key);
const jwt = `${unsigned}.${b64url(sig)}`;

const tokenResp = curlJSON("https://oauth2.googleapis.com/token", [
  "-X", "POST",
  "--data-binary", JSON.stringify({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  }),
]);
const ACCESS_TOKEN = tokenResp.access_token;
if (!ACCESS_TOKEN) {
  console.error("Token response:", tokenResp);
  throw new Error("No access_token in OAuth response");
}
console.log("✅ Got OAuth token\n");

// -- Fetch a whole collection (paginated) ----------------------------

function fetchCollection(collection) {
  const docs = [];
  let pageToken = "";
  let page = 0;
  while (true) {
    const url =
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}` +
      `/databases/(default)/documents/${collection}` +
      `?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
    const resp = curlJSON(url, ["-H", `Authorization: Bearer ${ACCESS_TOKEN}`]);
    const pageDocs = resp.documents || [];
    docs.push(...pageDocs);
    page++;
    if (pageDocs.length) console.log(`  page ${page}: +${pageDocs.length} docs`);
    if (!resp.nextPageToken) break;
    pageToken = resp.nextPageToken;
  }
  return docs;
}

// -- Firestore value → plain JS --------------------------------------

function fsVal(v) {
  if (!v || typeof v !== "object") return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(fsVal);
  if ("mapValue" in v) {
    const map = {};
    const fields = v.mapValue.fields || {};
    for (const k of Object.keys(fields)) map[k] = fsVal(fields[k]);
    return map;
  }
  return null;
}

function fsDoc(doc) {
  const fields = doc.fields || {};
  const out = {};
  for (const k of Object.keys(fields)) out[k] = fsVal(fields[k]);
  return out;
}

// -- Schema map (must match your D1 schema.sql) ----------------------

const SCHEMAS = {
  stea_code_products: {
    table: "products",
    pk: "id",
    columns: ["id","slug","titleEn","titleZh","shortDescriptionEn","shortDescriptionZh","price","pricingType","category","status","featured","homepageVisible","tags","frameworks","languages","craftNoteEn","aiPrompt","previewVideoUrl","posterImageUrl","preview","publicFiles","protectedFiles","sourceFiles","sourceCode","fileNames","package","createdAt","updatedAt","createdBy","updatedBy"],
    jsonColumns: new Set(["tags","frameworks","languages","preview","publicFiles","protectedFiles","sourceFiles","sourceCode","fileNames","package"]),
    boolColumns: new Set(["featured","homepageVisible"]),
    numColumns: new Set(["price"]),
  },
  stea_code_product_previews: {
    table: "previews",
    pk: "productId",
    columns: ["productId","runtime","html","css","javascript","jsx","tsx","fullDocument","baseUrl","externalUrl","width","height","viewportMode","scaleMode","enabled","videoKey","posterKey","updatedAt","updatedBy"],
    jsonColumns: new Set([]),
    boolColumns: new Set(["enabled"]),
    numColumns: new Set(["width","height"]),
  },
  stea_code_product_sources: {
    table: "sources",
    pk: "productId",
    columns: ["productId","files","updatedAt","updatedBy"],
    jsonColumns: new Set(["files"]),
    boolColumns: new Set([]),
    numColumns: new Set([]),
  },
  stea_code_entitlements: {
    table: "entitlements",
    pk: "id",
    columns: ["id","userId","productId","source","orderId","licenseType","grantedAt","expiresAt"],
    jsonColumns: new Set([]),
    boolColumns: new Set([]),
    numColumns: new Set([]),
  },
  stea_code_orders: {
    table: "orders",
    pk: "id",
    columns: ["id","userId","productId","amount","currency","status","provider","providerOrderId","createdAt"],
    jsonColumns: new Set([]),
    boolColumns: new Set([]),
    numColumns: new Set(["amount"]),
  },
  stea_code_webhook_events: {
    table: "webhook_events",
    pk: "id",
    columns: ["id","provider","eventType","payload","receivedAt","processed"],
    jsonColumns: new Set(["payload"]),
    boolColumns: new Set(["processed"]),
    numColumns: new Set([]),
  },
};

// -- SQL value escaping ----------------------------------------------

function sqlVal(v, col, schema) {
  if (v === undefined || v === null) return "NULL";
  if (schema.jsonColumns.has(col)) {
    return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
  }
  if (schema.boolColumns.has(col)) return v ? "1" : "0";
  if (typeof v === "boolean") return v ? "1" : "0";
  if (typeof v === "number") return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
}

function buildInsert(schema, docId, data) {
  const row = { ...data };
  row[schema.pk] = docId;
  const known = schema.columns.filter(c => c in row && row[c] !== undefined);
  const cols = [...known];
  const vals = known.map(c => sqlVal(row[c], c, schema));
  return `INSERT OR REPLACE INTO ${schema.table} (${cols.join(", ")}) VALUES (${vals.join(", ")});`;
}

// -- Main ------------------------------------------------------------

const COLLECTIONS = Object.keys(SCHEMAS);
const sqlLines = [
  "-- STEA Code: Firestore → D1 migration",
  `-- Generated: ${new Date().toISOString()}`,
  "-- INSERT OR REPLACE for all migrated docs",
  "",
];

const report = {
  generatedAt: new Date().toISOString(),
  collections: {},
};

for (const col of COLLECTIONS) {
  console.log(`[migrate] Reading ${col}...`);
  try {
    const docs = fetchCollection(col);
    console.log(`  → ${docs.length} documents\n`);
    report.collections[col] = { count: docs.length, errors: [] };
    for (const doc of docs) {
      const docId = doc.name.split("/").pop();
      const data = fsDoc(doc);
      try {
        sqlLines.push(buildInsert(SCHEMAS[col], docId, data));
      } catch (e) {
        report.collections[col].errors.push({ docId, error: e.message });
      }
    }
  } catch (e) {
    console.error(`  ❌ Failed: ${e.message}\n`);
    report.collections[col] = { count: 0, errors: [{ error: e.message }] };
  }
}

writeFileSync("seed.sql", sqlLines.join("\n"));
writeFileSync("migration-report.json", JSON.stringify(report, null, 2));

console.log("✅ Wrote seed.sql (" + sqlLines.length + " lines)");
console.log("✅ Wrote migration-report.json\n");

const total = Object.values(report.collections).reduce((a, c) => a + c.count, 0);
console.log(`📊 Total docs migrated: ${total}`);
console.log("\nNext steps:");
console.log("  npx wrangler d1 execute stea-code-db --remote --file=seed.sql");
console.log("  npx wrangler deploy");
