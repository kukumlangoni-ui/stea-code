// Script to scan collections using Client SDK (Vite-like setup, runs in Node.js using tsx)
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";
import path from "path";

const CONFIG_PATH = path.resolve('firebase-applet-config.json');
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

const app = initializeApp(config);
const db = getFirestore(app);

const COLLECTIONS_TO_SCAN = [
  "products", "marketplace", "tanzania_products",
  "prompts", "promptLab", "prompt_lab",
  "ai", "aiLab", "ai_posts",
  "videos", "lessons", "courses", "video_courses",
  "techhub", "posts", "tech_tips", "tips", "updates", "news",
  "tools", "digital_tools", "digitalTools",
  "articles", "resources", "education", "study_resources", "learning_resources",
  "websites", "website_solutions", "websiteSolutions"
];

async function scan() {
  console.log("=== STARTING CLIENT SDK DATABASE AUDIT ===");
  const results = [];
  
  for (const colName of COLLECTIONS_TO_SCAN) {
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      const count = snapshot.size;
      
      let lastUpdated = "None";
      let sampleId = null;
      let sampleData = null;
      
      if (count > 0) {
        let latestTime = 0;
        snapshot.docs.forEach((d) => {
          const data = d.data();
          if (!sampleData) {
            sampleData = data;
            sampleId = d.id;
          }
          const t = data.updatedAt || data.createdAt || data.submittedAt || data.timestamp;
          if (t) {
            let itemTime = 0;
            if (t.toDate) itemTime = t.toDate().getTime();
            else if (typeof t === "string" || typeof t === "number") itemTime = new Date(t).getTime();
            else if (t._seconds) itemTime = t._seconds * 1000;
            
            if (itemTime > latestTime) latestTime = itemTime;
          }
        });
        
        if (latestTime > 0) {
          lastUpdated = new Date(latestTime).toISOString();
        }
      }
      
      results.push({
        collectionName: colName,
        documentCount: count,
        lastUpdated,
        sampleId,
        sampleFields: sampleData ? Object.keys(sampleData) : []
      });
      
    } catch (err) {
      results.push({
        collectionName: colName,
        error: err.message
      });
    }
  }
  
  console.log(JSON.stringify(results, null, 2));
  console.log("=== AUDIT END ===");
}

scan();
