// Script to scan all collections and count documents in Firestore using firebase-admin
import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const CONFIG_PATH = path.resolve('firebase-applet-config.json');
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: config.projectId
  });
}

const dbId = config.firestoreDatabaseId && config.firestoreDatabaseId !== "(default)" 
  ? config.firestoreDatabaseId 
  : undefined;

const db = getFirestore(admin.app(), dbId);

async function scanDatabase() {
  console.log('=== STARTING DATABASE AUDIT ===');
  try {
    const collections = await db.listCollections();
    console.log(`Found ${collections.length} root collections.`);
    
    const results = [];
    for (const col of collections) {
      const colId = col.id;
      const snapshot = await col.limit(500).get(); // fetch up to 500 docs for audit
      const count = snapshot.size;
      
      let lastUpdated = 'Unknown';
      let sampleData = null;
      
      if (count > 0) {
        // Find latest updated or created document if fields exist, or just use the first document
        const docs = snapshot.docs;
        sampleData = docs[0].data();
        
        let latestTime = null;
        docs.forEach(doc => {
          const data = doc.data();
          const t = data.updatedAt || data.createdAt || data.submittedAt || data.timestamp;
          if (t) {
            let parsedTime = null;
            if (t.toDate) parsedTime = t.toDate();
            else if (typeof t === 'string' || typeof t === 'number') parsedTime = new Date(t);
            else if (t._seconds) parsedTime = new Date(t._seconds * 1000);
            
            if (parsedTime && (!latestTime || parsedTime > latestTime)) {
              latestTime = parsedTime;
            }
          }
        });
        
        if (latestTime) {
          lastUpdated = latestTime.toISOString();
        }
      }
      
      results.push({
        collectionName: colId,
        documentCount: count,
        lastUpdated,
        sampleFields: sampleData ? Object.keys(sampleData) : []
      });
    }
    
    console.log(JSON.stringify(results, null, 2));
    console.log('=== DATABASE AUDIT COMPLETE ===');
  } catch (error) {
    console.error('Audit failed:', error);
  }
}

scanDatabase();
