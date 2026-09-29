// Script to query using the configured DB from src/firebase.js
import { db } from "../src/firebase.js";
import { collection, getDocs, limit, query } from "firebase/firestore";

const COLLECTIONS_TO_SCAN = [
  "prompts", "promptLab", "prompt_lab",
  "ai", "aiLab", "ai_posts",
  "videos", "lessons", "courses", "video_courses",
  "techhub", "posts", "tech_tips", "tips", "updates", "news",
  "tools", "digital_tools", "digitalTools", "deals", "subscription_plans",
  "articles", "resources", "education", "study_resources", "learning_resources",
  "websites", "website_solutions", "websiteSolutions"
];

async function scan() {
  console.log("=== STARTING SCAN VIA COMPILED CLIENT DB ===");
  const results = [];
  
  for (const colName of COLLECTIONS_TO_SCAN) {
    try {
      const colRef = collection(db, colName);
      // Fetch maximum 5 docs to see if data exists and inspect schema
      const q = query(colRef, limit(5));
      const snapshot = await getDocs(q);
      const count = snapshot.size;
      
      let sampleId = null;
      let sampleData = null;
      
      if (count > 0) {
        sampleId = snapshot.docs[0].id;
        sampleData = snapshot.docs[0].data();
      }
      
      results.push({
        collectionName: colName,
        hasData: count > 0,
        documentCountEstimate: count, // Since we used limit(5), this is local count
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
  console.log("=== SCAN COMPLETE ===");
  process.exit(0);
}

scan();
