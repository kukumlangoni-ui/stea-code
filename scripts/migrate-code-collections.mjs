// migrate-code-collections.mjs
// Copies STEA Code collections from Sites Firebase → Code Firebase
// Run once: node scripts/migrate-code-collections.mjs

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const SITES_KEY = join(homedir(), 'Desktop', 'sites-key.json');
const CODE_KEY  = join(homedir(), 'Desktop', 'code-key.json');

// Collections to migrate. Add more if you find them.
const COLLECTIONS = [
  'stea_code_products',
  'stea_code_product_previews',
  'stea_code_product_sources',
  'stea_code_entitlements',
  'stea_code_orders',
  'stea_code_resources',
  'stea_code_inspiration',
  'stea_code_hosting',
  'stea_code_resources_directory',
  'stea_app_events',
  'stea_metrics',
];

const sitesApp = initializeApp(
  { credential: cert(JSON.parse(readFileSync(SITES_KEY, 'utf8'))) },
  'sites'
);
const codeApp = initializeApp(
  { credential: cert(JSON.parse(readFileSync(CODE_KEY, 'utf8'))) },
  'code'
);

const srcDb  = getFirestore(sitesApp);
const destDb = getFirestore(codeApp);

async function copyCollection(name) {
  const snap = await srcDb.collection(name).get();
  if (snap.empty) {
    console.log(`  ${name}: EMPTY (skipped)`);
    return 0;
  }

  let copied = 0;
  // Firestore batches cap at 500 writes
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = destDb.batch();
    const chunk = snap.docs.slice(i, i + 400);
    for (const doc of chunk) {
      batch.set(destDb.collection(name).doc(doc.id), doc.data());
    }
    await batch.commit();
    copied += chunk.length;
  }
  console.log(`  ${name}: ${copied} docs copied`);
  return copied;
}

async function main() {
  console.log('=== STEA Code migration: Sites → Code ===\n');
  let total = 0;
  for (const name of COLLECTIONS) {
    try {
      total += await copyCollection(name);
    } catch (err) {
      console.log(`  ${name}: ERROR — ${err.message}`);
    }
  }
  console.log(`\n=== DONE — ${total} total docs copied ===`);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
