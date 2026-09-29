const { configstore } = require("/usr/local/lib/node_modules/firebase-tools/lib/configstore.js");
const firebaseAuth = require("/usr/local/lib/node_modules/firebase-tools/lib/auth.js");

const SOURCE_PROJECT = "swahilitecheliteacademy";
const DESTINATION_PROJECT = "alphaportal-3e1d8";
const SOURCE_BUCKET = "swahilitecheliteacademy.firebasestorage.app";
const DESTINATION_BUCKET = "alphaportal-3e1d8.firebasestorage.app";
const mode = process.argv[2] || "--dry-run";

if (!["--dry-run", "--copy", "--delete-source"].includes(mode)) throw new Error("Use --dry-run, --copy, or --delete-source.");

async function accessToken() {
  const refreshToken = configstore.get("tokens")?.refresh_token;
  if (!refreshToken) throw new Error("Firebase CLI refresh token is missing. Run firebase login --reauth.");
  return (await firebaseAuth.getAccessToken(refreshToken, [])).access_token;
}

async function api(token, url, options = {}) {
  const response = await fetch(url, { ...options, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(options.headers || {}) } });
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(`${response.status} ${url}: ${JSON.stringify(body)}`);
  return body;
}

function firestoreBase(project) {
  return `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
}

async function getDocument(token, project, path) {
  const response = await fetch(`${firestoreBase(project)}/${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (response.status === 404) return null;
  const body = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(body)}`);
  return body;
}

async function collectionIds(token, project, documentPath) {
  let pageToken = "";
  const ids = [];
  do {
    const body = await api(token, `${firestoreBase(project)}/${documentPath}:listCollectionIds`, { method: "POST", body: JSON.stringify({ pageSize: 1000, pageToken }) });
    ids.push(...(body.collectionIds || []));
    pageToken = body.nextPageToken || "";
  } while (pageToken);
  return ids;
}

async function listCollection(token, project, parentPath, collectionId) {
  let pageToken = "";
  const documents = [];
  do {
    const parent = parentPath ? `/${parentPath}` : "";
    const query = new URLSearchParams({ pageSize: "300", showMissing: "true" });
    if (pageToken) query.set("pageToken", pageToken);
    const body = await api(token, `${firestoreBase(project)}${parent}/${collectionId}?${query}`);
    documents.push(...(body.documents || []));
    pageToken = body.nextPageToken || "";
  } while (pageToken);
  return documents;
}

function relativeDocumentPath(documentName) {
  return documentName.split("/documents/")[1];
}

async function walkDocument(token, project, documentPath, rows) {
  const document = await getDocument(token, project, documentPath);
  if (document) rows.push({ path: documentPath, fields: document.fields || {} });
  for (const collectionId of await collectionIds(token, project, documentPath)) {
    const children = await listCollection(token, project, documentPath, collectionId);
    for (const child of children) await walkDocument(token, project, relativeDocumentPath(child.name), rows);
  }
}

async function alphaRows(token, project) {
  const rows = [];
  await walkDocument(token, project, "schools/alpha", rows);
  return rows;
}

async function commitWrites(token, project, writes) {
  if (!writes.length) return;
  await api(token, `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents:commit`, { method: "POST", body: JSON.stringify({ writes }) });
}

async function copyDocuments(token, rows) {
  for (let offset = 0; offset < rows.length; offset += 400) {
    const writes = rows.slice(offset, offset + 400).map((row) => ({ update: { name: `${firestoreBase(DESTINATION_PROJECT)}/${row.path}`, fields: row.fields } }));
    await commitWrites(token, DESTINATION_PROJECT, writes);
  }
}

async function listFiles(token, bucket) {
  const names = new Set();
  for (const prefix of ["alpha/", "schools/alpha/"]) {
    let pageToken = "";
    do {
      const query = new URLSearchParams({ prefix, maxResults: "1000" });
      if (pageToken) query.set("pageToken", pageToken);
      const body = await api(token, `https://storage.googleapis.com/storage/v1/b/${bucket}/o?${query}`);
      for (const item of body.items || []) names.add(item.name);
      pageToken = body.nextPageToken || "";
    } while (pageToken);
  }
  return [...names];
}

async function copyFiles(token, names) {
  for (const name of names) {
    const source = encodeURIComponent(name);
    let rewriteToken = "";
    do {
      const suffix = rewriteToken ? `?rewriteToken=${encodeURIComponent(rewriteToken)}` : "";
      const body = await api(token, `https://storage.googleapis.com/storage/v1/b/${SOURCE_BUCKET}/o/${source}/rewriteTo/b/${DESTINATION_BUCKET}/o/${source}${suffix}`, { method: "POST", body: "{}" });
      rewriteToken = body.done ? "" : body.rewriteToken;
    } while (rewriteToken);
  }
}

async function deleteSource(token, rows, files) {
  const ordered = [...rows].sort((a, b) => b.path.split("/").length - a.path.split("/").length);
  for (let offset = 0; offset < ordered.length; offset += 400) {
    const writes = ordered.slice(offset, offset + 400).map((row) => ({ delete: `${firestoreBase(SOURCE_PROJECT)}/${row.path}` }));
    await commitWrites(token, SOURCE_PROJECT, writes);
  }
  for (const name of files) {
    const response = await fetch(`https://storage.googleapis.com/storage/v1/b/${SOURCE_BUCKET}/o/${encodeURIComponent(name)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok && response.status !== 404) throw new Error(`Storage delete failed for ${name}: ${response.status} ${await response.text()}`);
  }
}

async function main() {
  const token = await accessToken();
  const sourceRows = await alphaRows(token, SOURCE_PROJECT);
  const destinationRowsBefore = await alphaRows(token, DESTINATION_PROJECT);
  const sourceFiles = await listFiles(token, SOURCE_BUCKET);
  const destinationFilesBefore = await listFiles(token, DESTINATION_BUCKET);
  console.log(JSON.stringify({ mode, sourceDocuments: sourceRows.length, destinationDocuments: destinationRowsBefore.length, sourceFiles: sourceFiles.length, destinationFiles: destinationFilesBefore.length }, null, 2));
  if (mode === "--dry-run") return;
  if (mode === "--copy") {
    await copyDocuments(token, sourceRows);
    await copyFiles(token, sourceFiles);
  }
  const destinationRows = await alphaRows(token, DESTINATION_PROJECT);
  const destinationFiles = await listFiles(token, DESTINATION_BUCKET);
  const destinationPaths = new Set(destinationRows.map((row) => row.path));
  const destinationFileNames = new Set(destinationFiles);
  const missingDocuments = sourceRows.filter((row) => !destinationPaths.has(row.path));
  const missingFiles = sourceFiles.filter((name) => !destinationFileNames.has(name));
  console.log(JSON.stringify({ verifiedDestinationDocuments: destinationRows.length, verifiedDestinationFiles: destinationFiles.length, missingDocuments: missingDocuments.map((row) => row.path), missingFiles }, null, 2));
  if (missingDocuments.length || missingFiles.length) throw new Error("Destination is incomplete. Source was not deleted.");
  if (mode === "--delete-source") {
    await deleteSource(token, sourceRows, sourceFiles);
    console.log(JSON.stringify({ deletedSourceDocuments: sourceRows.length, deletedSourceFiles: sourceFiles.length }, null, 2));
  }
}

main().catch((error) => { console.error(error.stack || error.message); process.exit(1); });
