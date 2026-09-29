import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore";
import fs from "fs";
import path from "path";

const CONFIG_PATH = path.resolve('firebase-applet-config.json');
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

const app = initializeApp(config);
const db = getFirestore(app);

async function scan() {
  console.log("=== QUICK PRODUCTS AUDIT ===");
  try {
    const colRef = collection(db, "products");
    const q = query(colRef, limit(20));
    const snapshot = await getDocs(q);
    console.log(`Found ${snapshot.size} products from 'products' collection in sample query.`);
    
    snapshot.docs.forEach((d) => {
      const data = d.data();
      console.log(`- ID: ${d.id}`);
      console.log(`  Name: ${data.name}`);
      console.log(`  Category: ${data.category}`);
      console.log(`  Sector: ${data.sector}`);
      console.log(`  Status: ${data.status}`);
      console.log(`  Published: ${data.published}`);
      console.log(`  IsActive: ${data.isActive}`);
      console.log(`  Visible: ${data.visible}`);
    });
  } catch (err) {
    console.error("Error standard products collection query:", err.message);
  }
}

scan();
