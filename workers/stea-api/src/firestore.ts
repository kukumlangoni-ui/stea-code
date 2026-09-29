/**
 * D1 database client for STEA Code.
 *
 * Replaces the Firestore REST API client. Same exported function names
 * so route files don't change. Collection names are mapped to D1 table
 * names via TABLE_MAP.
 *
 * JSON columns are stored as TEXT in D1 and parsed/stringified here.
 * Boolean columns are stored as INTEGER 0/1 and converted here.
 * Unknown fields go into the extraData TEXT (JSON) column.
 */

export interface Env {
  DB: D1Database;
  FIREBASE_PROJECT_ID: string;
}

export interface FirestoreDoc {
  id: string;
  data: Record<string, any>;
}

// ============================================================
// Table schema definitions
// ============================================================

interface TableSchema {
  table: string;
  pkColumn: string;
  columns: string[];
  jsonColumns: Set<string>;
  boolColumns: Set<string>;
  numColumns: Set<string>;
}

const TABLE_MAP: Record<string, string> = {
  stea_code_products: "products",
  stea_code_product_previews: "previews",
  stea_code_product_sources: "sources",
  stea_code_entitlements: "entitlements",
  stea_code_orders: "orders",
  stea_code_webhook_events: "webhook_events",
};

const SCHEMAS: Record<string, TableSchema> = {
  products: {
    table: "products",
    pkColumn: "id",
    columns: [
      "id", "slug", "titleEn", "titleZh", "shortDescriptionEn",
      "shortDescriptionZh", "price", "pricingType", "category",
      "status", "featured", "homepageVisible", "tags", "frameworks",
      "languages", "craftNoteEn", "aiPrompt", "previewVideoUrl",
      "posterImageUrl", "previewMode", "preview", "designWidth", "designHeight",
      "publicFiles", "protectedFiles",
      "sourceFiles", "sourceCode", "fileNames", "package",
      "createdAt", "updatedAt", "createdBy", "updatedBy", "extraData",
    ],
    jsonColumns: new Set([
      "tags", "frameworks", "languages", "preview", "publicFiles",
      "protectedFiles", "sourceFiles", "sourceCode", "fileNames",
      "package", "extraData",
    ]),
    boolColumns: new Set(["featured", "homepageVisible"]),
    numColumns: new Set(["price", "designWidth", "designHeight"]),
  },
  previews: {
    table: "previews",
    pkColumn: "productId",
    columns: [
      "productId", "runtime", "html", "css", "javascript", "jsx",
      "tsx", "fullDocument", "baseUrl", "externalUrl", "width",
      "height", "viewportMode", "scaleMode", "enabled", "videoKey",
      "posterKey", "updatedAt", "updatedBy", "extraData",
    ],
    jsonColumns: new Set(["extraData"]),
    boolColumns: new Set(["enabled"]),
    numColumns: new Set(["width", "height"]),
  },
  sources: {
    table: "sources",
    pkColumn: "productId",
    columns: ["productId", "files", "updatedAt", "updatedBy", "extraData"],
    jsonColumns: new Set(["files", "extraData"]),
    boolColumns: new Set(),
    numColumns: new Set(),
  },
  entitlements: {
    table: "entitlements",
    pkColumn: "id",
    columns: [
      "id", "userId", "productId", "source", "orderId", "licenseType",
      "grantedAt", "expiresAt", "extraData",
    ],
    jsonColumns: new Set(["extraData"]),
    boolColumns: new Set(),
    numColumns: new Set(),
  },
  orders: {
    table: "orders",
    pkColumn: "id",
    columns: [
      "id", "userId", "productId", "amount", "currency", "status",
      "provider", "providerOrderId", "createdAt", "extraData",
    ],
    jsonColumns: new Set(["extraData"]),
    boolColumns: new Set(),
    numColumns: new Set(["amount"]),
  },
  webhook_events: {
    table: "webhook_events",
    pkColumn: "id",
    columns: [
      "id", "provider", "eventType", "payload", "receivedAt",
      "processed", "extraData",
    ],
    jsonColumns: new Set(["payload", "extraData"]),
    boolColumns: new Set(["processed"]),
    numColumns: new Set(),
  },
};

function resolveTable(collection: string): { tableName: string; schema: TableSchema } {
  const tableName = TABLE_MAP[collection] || collection;
  const schema = SCHEMAS[tableName];
  if (!schema) {
    throw new Error(`Unknown table: ${tableName} (collection: ${collection})`);
  }
  return { tableName, schema };
}

// ============================================================
// Row conversion: D1 row ↔ JS data
// ============================================================

function parseRow(row: Record<string, any>, schema: TableSchema): Record<string, any> {
  const data: Record<string, any> = {};

  for (const col of schema.columns) {
    if (col === "extraData") continue;
    let val = row[col];

    if (val === null || val === undefined) {
      data[col] = null;
      continue;
    }

    if (schema.jsonColumns.has(col)) {
      try {
        data[col] = JSON.parse(val);
      } catch {
        data[col] = val;
      }
    } else if (schema.boolColumns.has(col)) {
      data[col] = val === 1 || val === true;
    } else {
      data[col] = val;
    }
  }

  // Merge extraData back into the data object
  const extraRaw = row.extraData;
  if (extraRaw) {
    try {
      const extra = JSON.parse(extraRaw);
      if (extra && typeof extra === "object") {
        for (const [k, v] of Object.entries(extra)) {
          if (!(k in data)) data[k] = v;
        }
      }
    } catch {
      // Ignore malformed extraData
    }
  }

  return data;
}

function prepareRow(
  data: Record<string, any>,
  docId: string,
  schema: TableSchema
): { columns: string[]; values: any[] } {
  const pk = schema.pkColumn;
  const merged: Record<string, any> = { ...data, [pk]: docId };

  const row: Record<string, any> = {};
  const extra: Record<string, any> = {};

  for (const col of schema.columns) {
    if (col === "extraData") continue;
    if (col in merged || col === pk) {
      let val = merged[col];

      if (val === undefined) {
        val = null;
      }

      if (val === null) {
        row[col] = null;
      } else if (schema.jsonColumns.has(col)) {
        row[col] = JSON.stringify(val);
      } else if (schema.boolColumns.has(col)) {
        row[col] = val ? 1 : 0;
      } else if (schema.numColumns.has(col)) {
        row[col] = typeof val === "number" ? val : Number(val) || null;
      } else if (typeof val === "object") {
        row[col] = JSON.stringify(val);
      } else {
        row[col] = val;
      }
    }
  }

  // Collect unknown fields into extraData
  for (const [k, v] of Object.entries(merged)) {
    if (k === pk) continue;
    if (!schema.columns.includes(k)) {
      extra[k] = v;
    }
  }
  row.extraData = Object.keys(extra).length > 0 ? JSON.stringify(extra) : null;

  const columns = Object.keys(row);
  const values = columns.map((c) => row[c]);
  return { columns, values };
}

// ============================================================
// CRUD operations
// ============================================================

export async function getDoc(
  env: Env,
  collection: string,
  docId: string,
  opts?: { cacheTtl?: number }
): Promise<FirestoreDoc | null> {
  const { tableName, schema } = resolveTable(collection);
  const pk = schema.pkColumn;

  const row = await env.DB.prepare(`SELECT * FROM ${tableName} WHERE ${pk} = ?`)
    .bind(docId)
    .first();

  if (!row) return null;

  const data = parseRow(row as Record<string, any>, schema);
  return { id: docId, data };
}

export async function listDocs(
  env: Env,
  collection: string,
  opts?: { cacheTtl?: number; cacheKey?: string; where?: Record<string, any>; limit?: number }
): Promise<FirestoreDoc[]> {
  const { tableName, schema } = resolveTable(collection);
  const pk = schema.pkColumn;

  let sql = `SELECT * FROM ${tableName}`;
  const params: any[] = [];

  if (opts?.where) {
    const entries = Object.entries(opts.where);
    if (entries.length > 0) {
      const clauses = entries.map(([k, v]) => {
        params.push(v);
        return `${k} = ?`;
      });
      sql += ` WHERE ${clauses.join(" AND ")}`;
    }
  }

  if (opts?.limit) {
    sql += ` LIMIT ${Math.floor(opts.limit)}`;
  }

  const result = await env.DB.prepare(sql).bind(...params).all();
  const rows = result.results || [];

  return rows.map((row) => {
    const data = parseRow(row as Record<string, any>, schema);
    const id = (row as Record<string, any>)[pk] || "";
    return { id, data };
  });
}

export async function setDoc(
  env: Env,
  collection: string,
  docId: string,
  data: Record<string, any>,
  merge: boolean = true
): Promise<void> {
  const { tableName, schema } = resolveTable(collection);
  const pk = schema.pkColumn;

  let finalData: Record<string, any> = { ...data };

  if (merge) {
    const existing = await env.DB.prepare(`SELECT * FROM ${tableName} WHERE ${pk} = ?`)
      .bind(docId)
      .first();

    if (existing) {
      const existingData = parseRow(existing as Record<string, any>, schema);
      finalData = { ...existingData, ...data, [pk]: docId };
    } else {
      finalData = { ...data, [pk]: docId };
    }
  } else {
    finalData = { ...data, [pk]: docId };
  }

  const { columns, values } = prepareRow(finalData, docId, schema);
  const placeholders = columns.map(() => "?").join(", ");
  const sql = `INSERT OR REPLACE INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders})`;

  await env.DB.prepare(sql).bind(...values).run();
}

export async function deleteDoc(
  env: Env,
  collection: string,
  docId: string
): Promise<void> {
  const { tableName, schema } = resolveTable(collection);
  const pk = schema.pkColumn;

  await env.DB.prepare(`DELETE FROM ${tableName} WHERE ${pk} = ?`)
    .bind(docId)
    .run();
}
