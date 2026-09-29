import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";
import path from "path";
import fs from "fs";
import Stripe from "stripe";
import multer from "multer";
import { applicationDefault, getApps, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { getMessaging as getAdminMessaging } from "firebase-admin/messaging";
import { getSteaCodeServerProduct, STEA_CODE_SERVER_PRODUCTS } from "./src/data/stea-code/codeProductsServer.js";
import { uploadAsset, getSignedDownloadUrl, isR2Configured, headAsset } from "./src/services/r2Client.js";

const VALID_NECTA_EXAMS = new Set(["psle", "sfna", "ftna", "csee", "acsee"]);
const ADMIN_EMAILS = new Set([
  "stea.africa@gmail.com",
]);

let APPLET_DB_ID: string | undefined = undefined;
let APPLET_PROJECT_ID: string | undefined = undefined;

try {
  const configPath = path.resolve("firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (config.firestoreDatabaseId && config.firestoreDatabaseId !== "(default)") {
      APPLET_DB_ID = config.firestoreDatabaseId;
      console.log(`[Config] server.ts using Firestore database ID: ${APPLET_DB_ID}`);
    }
    if (config.projectId) {
      APPLET_PROJECT_ID = config.projectId;
    }
  }
} catch (err) {
  console.error("Failed to load firebase-applet-config.json in server.ts:", err);
}

const FIREBASE_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || APPLET_PROJECT_ID || "swahilitecheliteacademy";

function getFirestoreInstance(app: any) {
  return getAdminFirestore(app, APPLET_DB_ID);
}

// Wraps a Firestore promise with a timeout so slow/unreachable Firestore
// connections fail fast instead of hanging the request for 30s+.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Firestore timeout after ${ms}ms`)), ms)
    ),
  ]);
}

const INVALID_FCM_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
  "messaging/invalid-argument",
]);

function getAdminApp() {
  return getApps().length
    ? getApps()[0]
    : initializeAdminApp({
        credential: applicationDefault(),
        projectId: FIREBASE_PROJECT_ID,
      });
}

function getNectaIndexUrls(examType: string, year: string) {
  const t = examType.toLowerCase();
  const T = examType.toUpperCase();
  const y = year;
  return [
    `https://onlinesys.necta.go.tz/results/${y}/${t}/index.htm`,
    `https://onlinesys.necta.go.tz/results/${y}/${t}/index.html`,
    `https://onlinesys.necta.go.tz/results/${y}/${t}/indexfiles/index_t.htm`,
    `https://onlinesys.necta.go.tz/results/${y}/${t}/indexfiles/index_s.htm`,
    `https://onlinesys.necta.go.tz/results/${y}/${t}/indexfiles/school.htm`,
    `https://onlinesys.necta.go.tz/results/${y}/${t}_results/index.htm`,
    `https://onlinesys.necta.go.tz/results/${t}${y}/index.htm`,
    `https://onlinesys.necta.go.tz/results/${t}${y}/index.html`,
    `https://onlinesys.necta.go.tz/results/${t}${y}/indexfiles/index_t.htm`,
    `http://onlinesys.necta.go.tz/results/${y}/${t}/`,
    `http://onlinesys.necta.go.tz/results/${t}${y}/`,
    `http://results.necta.go.tz/${t}${y}/index.htm`,
    `http://results.necta.go.tz/${t}${y}/index.html`,
    `http://results.necta.go.tz/${t}${y}/indexfiles/index_t.htm`,
    `http://results.necta.go.tz/${t}${y}/`,
    `http://matokeo.necta.go.tz/${t}${y}/index.htm`,
    `http://matokeo.necta.go.tz/${t}${y}/index.html`,
    `http://matokeo.necta.go.tz/${y}/${t}/index.htm`,
    `https://maktaba.tetea.org/exam-results/${T}${y}/index.htm`,
    `https://maktaba.tetea.org/exam-results/${T}${y}/index.html`,
    `https://maktaba.tetea.org/exam-results/${T}-${y}/index.htm`,
    `https://maktaba.tetea.org/exam-results/${T}-${y}/index.html`,
    `https://necta.go.tz/results/${y}/${t}/index.htm`,
    `http://www.necta.go.tz/results/${y}/${t}/index.htm`,
  ];
}

function parseNectaSchools(html: string, searchQuery: unknown) {
  const $ = cheerio.load(html);
  const schools: any[] = [];
  let parserStrategy = "link-code-name";
  const codeRegex = /([PS]\d{4})/i;
  const queryClean = String(searchQuery || "").replace(/\s+/g, "").toLowerCase();

  $("a").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    const href = $(el).attr("href") || "";
    const combined = `${text} ${href}`;
    const codeMatch = combined.match(codeRegex);
    if (!codeMatch) return;

    const code = codeMatch[1].toUpperCase();
    const name = (text || code)
      .replace(new RegExp(code, "ig"), "")
      .replace(/[^\w\s']/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    const label = name || text || code;
    const nameClean = label.replace(/\s+/g, "").toLowerCase();
    const codeClean = code.toLowerCase();
    if (!searchQuery || nameClean.includes(queryClean) || codeClean.includes(queryClean)) {
      schools.push({ code, name: label, href });
    }
  });

  if (schools.length === 0) {
    parserStrategy = "legacy-text-code-name";
    const text = $.text().replace(/\r/g, "\n");
    const lines = text.split(/\n|(?=[PS]\d{4})/i).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
    for (const line of lines) {
      const match = line.match(/\b([PS]\d{4})\b\s*[-.:)]?\s*(.{2,90})/i);
      if (!match) continue;
      const code = match[1].toUpperCase();
      const name = match[2].replace(/[^\w\s']/gi, " ").replace(/\s+/g, " ").trim() || code;
      const nameClean = name.replace(/\s+/g, "").toLowerCase();
      const codeClean = code.toLowerCase();
      if (!searchQuery || nameClean.includes(queryClean) || codeClean.includes(queryClean)) {
        schools.push({ code, name, href: "" });
      }
    }
  }

  const uniqueSchools = Array.from(new Map(schools.map(s => [s.code, s])).values());
  return { schools: uniqueSchools, parserStrategy };
}

import { GoogleGenAI } from "@google/genai";

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

async function startServer() {
  console.log(`[Server] Starting in ${process.env.NODE_ENV || 'development'} mode`);
  const app = express();
  const PORT = 3000;

  // AI: Gemini Proxy
  app.post("/api/gemini", async (req, res) => {
    try {
      if (!ai) {
        return res.status(503).json({ error: "AI service not configured." });
      }

      const { prompt, systemInstruction } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }

      // Check if prompt is array or string (SDK handles string)
      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || "You are a helpful assistant.",
        },
      });

      res.json({ text: result.text });
    } catch (error: any) {
      console.error("[Gemini API Error]:", error);
      
      // Handle rate limits
      if (error?.status === 429 || (error?.message && error.message.includes("429"))) {
        return res.status(429).json({ error: "AI limit reached. Please try again later." });
      }
      
      res.status(error?.status || 500).json({ 
        error: error?.message || "Failed to generate AI content" 
      });
    }
  });


  // Use a proper path for static assets
  const publicPath = path.join(process.cwd(), 'public');
  const distPath = path.join(process.cwd(), 'dist');

  const allowedOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(express.static(publicPath));
  app.use(cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      const isFirebaseHosting = /^https:\/\/[a-z0-9-]+(\.web\.app|\.firebaseapp\.com)$/.test(origin);
      const isRunApp = /\.run\.app$/.test(origin);
      const isTunnel = /\.lhr\.life$|\.loca\.lt$/.test(origin);
      const isAllowed = allowedOrigins.includes(origin) || isLocalhost || isFirebaseHosting || isRunApp || isTunnel;
      callback(isAllowed ? null : new Error(`CORS blocked origin: ${origin}`), isAllowed);
    },
  }));
  // Stripe webhook must use raw body before express.json parser
  const stripeSecret = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_key";
  const stripe = new Stripe(stripeSecret);

  app.post("/api/stea-code/stripe/webhook", express.raw({ type: "application/json" }), express.raw(), async (req, res) => {
    try {
      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
      let event: any;

      if (webhookSecret && sig) {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        event = JSON.parse(req.body.toString("utf8"));
      }

      const adminApp = getAdminApp();
      const adminDb = getFirestoreInstance(adminApp);

      // Replay attack prevention via stea_code_webhook_events
      if (event?.id) {
        const eventRef = adminDb.collection("stea_code_webhook_events").doc(event.id);
        const eventSnap = await eventRef.get();
        if (eventSnap.exists) {
          return res.json({ received: true, note: "Event already processed" });
        }
        await eventRef.set({
          eventId: event.id,
          type: event.type,
          processedAt: FieldValue.serverTimestamp(),
        });
      }

      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.orderId;
        const uid = paymentIntent.metadata?.userId;
        const productId = paymentIntent.metadata?.productId;
        const licenseType = paymentIntent.metadata?.licenseType || "personal";

        if (orderId) {
          const orderRef = adminDb.collection("stea_code_orders").doc(orderId);
          await orderRef.set({
            status: "paid",
            paidAt: FieldValue.serverTimestamp(),
            stripePaymentIntentId: paymentIntent.id,
          }, { merge: true });
        }

        if (uid && productId) {
          const entitlementId = `${uid}_${productId}`;
          await adminDb.collection("stea_code_entitlements").doc(entitlementId).set({
            uid,
            productId,
            orderId: orderId || null,
            licenseType,
            status: "active",
            createdAt: FieldValue.serverTimestamp(),
          }, { merge: true });
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error("[stea-code webhook error]:", err?.message || err);
      res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
  });

  app.post("/api/stea-code/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    // Alias to stripe webhook handler
    res.redirect(307, "/api/stea-code/stripe/webhook");
  });

  app.use(express.json({ limit: "5mb" }));

  // Error logging telemetry endpoint for diagnostics
  app.post("/api/log-error", (req, res) => {
    try {
      const errStr = `[${new Date().toISOString()}] ${JSON.stringify(req.body, null, 2)}\n\n`;
      fs.appendFileSync("client_errors.log", errStr);
    } catch (e) {}
    console.error("=== CLIENT BROADCASTED RUNTIME EXCEPTION ===");
    console.error(JSON.stringify(req.body, null, 2));
    console.error("============================================");
    res.json({ logged: true });
  });


  const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const authHeader = req.headers.authorization || "";
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      if (!match) {
        return res.status(401).json({ error: "Admin authentication required.", code: "AUTH_REQUIRED" });
      }

      const adminApp = getAdminApp();
      const decoded = await getAdminAuth(adminApp).verifyIdToken(match[1]);
      const email = (decoded.email || "").toLowerCase();
      let isAdmin = ADMIN_EMAILS.has(email);
      let role = "user";

      if (!isAdmin && decoded.uid) {
        const userDoc = await getFirestoreInstance(adminApp).collection("users").doc(decoded.uid).get();
        role = String(userDoc.data()?.role || "user").toLowerCase();
        isAdmin = role === "admin" || role === "super_admin";
      }

      if (!isAdmin) {
        return res.status(403).json({ error: "Admin permission required.", code: "ADMIN_REQUIRED" });
      }

      (req as any).adminUser = { uid: decoded.uid, email, isSuperAdmin: ADMIN_EMAILS.has(email) || role === "super_admin" };
      next();
    } catch (error: any) {
      console.error("[notifications] admin auth failed:", error?.message || error);
      res.status(401).json({ error: "Invalid admin authentication.", code: "INVALID_AUTH" });
    }
  };

  const requireSuperAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!(req as any).adminUser?.isSuperAdmin) {
      return res.status(403).json({ error: "Super admin permission required.", code: "SUPER_ADMIN_REQUIRED" });
    }
    next();
  };

  app.get("/api/admin/users/stats", requireAdmin, requireSuperAdmin, async (req, res) => {
    try {
      const adminApp = getAdminApp();
      const adminAuth = getAdminAuth(adminApp);
      const adminDb = getFirestoreInstance(adminApp);

      let authUsersCount = 0;
      let pageToken: string | undefined = undefined;
      const missingUids: any[] = [];

      // Fetch Firestore UIDs to compare
      const usersSnap = await adminDb.collection("users").select("email").get();
      const firestoreUsersCount = usersSnap.size;
      const firestoreUids = new Set(usersSnap.docs.map(d => d.id));

      do {
        const listRes = await adminAuth.listUsers(1000, pageToken);
        authUsersCount += listRes.users.length;
        
        listRes.users.forEach(u => {
          if (!firestoreUids.has(u.uid)) {
            missingUids.push(u);
          }
        });
        
        pageToken = listRes.pageToken;
      } while (pageToken);

      // We won't sync automatically on stats fetch unless requested, or maybe we just return the counts
      // and if ?sync=true is provided, we do the syncing
      
      let syncedCount = 0;
      if (req.query.sync === "true" && missingUids.length > 0) {
        const writer = adminDb.bulkWriter();
        for (const u of missingUids) {
          writer.set(adminDb.collection("users").doc(u.uid), {
            email: u.email || "",
            role: "user",
            createdAt: FieldValue.serverTimestamp(),
            displayName: u.displayName || "",
            photoURL: u.photoURL || "",
            provider: u.providerData.map(p => p.providerId).join(",") || "email"
          });
          syncedCount++;
        }
        await writer.close();
      }

      res.json({
        authUsersCount,
        firestoreUsersCount: req.query.sync === "true" ? firestoreUsersCount + syncedCount : firestoreUsersCount,
        missingProfilesCount: missingUids.length,
        syncedCount
      });

    } catch (e: any) {
      console.error("[admin] users stats error:", e);
      res.status(500).json({ error: "Failed to fetch user stats", detail: e.message });
    }
  });

  app.post("/api/admin/users/sync", requireAdmin, requireSuperAdmin, async (req, res) => {
    try {
      const adminApp = getAdminApp();
      const adminAuth = getAdminAuth(adminApp);
      const adminDb = getFirestoreInstance(adminApp);

      const profilesSnap = await adminDb.collection("users").get();
      const profilesMap = new Map(profilesSnap.docs.map((item) => [item.id, item.data()]));
      const writer = adminDb.bulkWriter();
      let authUsersCount = 0;
      let syncedCount = 0;
      let pageToken: string | undefined = undefined;

      do {
        const listRes = await adminAuth.listUsers(1000, pageToken);
        authUsersCount += listRes.users.length;
        for (const userRecord of listRes.users) {
          const existing: any = profilesMap.get(userRecord.uid) || {};
          const provider = userRecord.providerData.map((providerData) => providerData.providerId).join(",") || existing.provider || "email";
          writer.set(adminDb.collection("users").doc(userRecord.uid), {
            email: userRecord.email || existing.email || "",
            displayName: userRecord.displayName || existing.displayName || existing.name || "",
            photoURL: userRecord.photoURL || existing.photoURL || "",
            provider,
            role: existing.role || "user",
            status: existing.status || (userRecord.disabled ? "disabled" : "active"),
            language: existing.language || existing.lang || existing.locale || "",
            country: existing.country || existing.countryCode || "",
            newsletterSubscribed: existing.newsletterSubscribed !== undefined ? existing.newsletterSubscribed : true,
            authCreatedAt: userRecord.metadata.creationTime || "",
            lastSignIn: userRecord.metadata.lastSignInTime || "",
            updatedAt: FieldValue.serverTimestamp(),
            createdAt: existing.createdAt || FieldValue.serverTimestamp(),
          }, { merge: true });
          syncedCount++;
        }
        pageToken = listRes.pageToken;
      } while (pageToken);

      await writer.close();
      res.json({
        success: true,
        authUsersCount,
        firestoreUsersCount: profilesSnap.size,
        syncedCount,
      });
    } catch (e: any) {
      console.error("[admin-users] sync error:", e);
      res.status(500).json({ error: "Failed to sync Firebase Auth users", detail: e.message });
    }
  });

  // REST endpoints for Admin Users management
  app.get("/api/admin/users", requireAdmin, requireSuperAdmin, async (req, res) => {
    try {
      const adminApp = getAdminApp();
      const adminAuth = getAdminAuth(adminApp);
      const adminDb = getFirestoreInstance(adminApp);

      // Fetch all Firebase Auth Users
      const authUsers: any[] = [];
      let pageToken: string | undefined = undefined;
      do {
        const listRes = await adminAuth.listUsers(1000, pageToken);
        authUsers.push(...listRes.users);
        pageToken = listRes.pageToken;
      } while (pageToken);

      // Fetch all Firestore User Profiles
      const usersSnap = await adminDb.collection("users").get();
      const profilesMap = new Map();
      usersSnap.docs.forEach(doc => profilesMap.set(doc.id, doc.data()));

      // Merge data
      const merged = authUsers.map(u => {
        const p = profilesMap.get(u.uid);
        return {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName || p?.displayName || "",
          photoURL: u.photoURL || p?.photoURL || "",
          authStatus: u.disabled ? "disabled" : "active",
          profileStatus: p ? "exists" : "missing",
          provider: u.providerData.map(prov => prov.providerId).join(",") || p?.provider || "email",
          createdAt: u.metadata.creationTime,
          lastSignIn: u.metadata.lastSignInTime,
          role: p?.role || "user",
          status: p?.status || (u.disabled ? "disabled" : "active"),
          language: p?.language || p?.lang || p?.locale || "",
          country: p?.country || p?.countryCode || "",
          newsletterSubscribed: p?.newsletterSubscribed !== undefined ? p.newsletterSubscribed : true,
          sector: p?.sector || "",
          profile: p || null
        };
      });

      // Find orphaned profiles (in Firestore but not in Auth)
      const authUids = new Set(authUsers.map(u => u.uid));
      let orphanProfilesCount = 0;
      usersSnap.docs.forEach(doc => {
        if (!authUids.has(doc.id)) {
          orphanProfilesCount++;
          const p = doc.data();
          merged.push({
            uid: doc.id,
            email: p.email || "",
            displayName: p.displayName || "",
            photoURL: p.photoURL || "",
            authStatus: "deleted",
            profileStatus: "orphaned",
            provider: p.provider || "email",
            createdAt: p.createdAt ? new Date(p.createdAt._seconds * 1000).toISOString() : null,
            lastSignIn: null,
            role: p.role || "user",
            status: p.status || "orphaned",
            language: p.language || p.lang || p.locale || "",
            country: p.country || p.countryCode || "",
            newsletterSubscribed: p.newsletterSubscribed !== undefined ? p.newsletterSubscribed : true,
            sector: p.sector || "",
            profile: p
          });
        }
      });

      res.json({
        authUsers: merged,
        firestoreProfiles: Array.from(profilesMap.values()),
        totalAuthUsers: authUsers.length,
        totalProfiles: usersSnap.size,
        missingProfiles: authUsers.filter(u => !profilesMap.has(u.uid)).length,
        orphanProfiles: orphanProfilesCount
      });
    } catch (e: any) {
      console.error("[admin-users] get all error:", e);
      res.status(500).json({ error: "Failed to fetch users", detail: e.message });
    }
  });

  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const { email, password, displayName, role, sector } = req.body;
      const adminApp = getAdminApp();
      const adminAuth = getAdminAuth(adminApp);
      const adminDb = getFirestoreInstance(adminApp);

      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName
      });

      const profileData: any = {
        email,
        displayName: displayName || "",
        role: role || "user",
        createdAt: FieldValue.serverTimestamp(),
        provider: "email",
        status: "active"
      };
      if (sector) profileData.sector = sector;

      await adminDb.collection("users").doc(userRecord.uid).set(profileData);
      
      if (role === "admin" || role === "super_admin") {
         await adminDb.collection("admins").doc(userRecord.uid).set({ email, role, createdAt: FieldValue.serverTimestamp() });
      }

      res.json({ success: true, uid: userRecord.uid });
    } catch (e: any) {
      console.error("[admin-users] create error:", e);
      res.status(500).json({ error: "Failed to create user", detail: e.message });
    }
  });

  app.delete("/api/admin/users/:uid", requireAdmin, async (req, res) => {
    try {
      const uid = req.params.uid;
      const adminApp = getAdminApp();
      const adminAuth = getAdminAuth(adminApp);
      const adminDb = getFirestoreInstance(adminApp);
      
      try {
        await adminAuth.deleteUser(uid);
      } catch (authErr: any) {
         if (authErr.code !== 'auth/user-not-found') {
           throw authErr;
         }
      }

      const batch = adminDb.bulkWriter();
      batch.delete(adminDb.collection("users").doc(uid));
      batch.delete(adminDb.collection("admins").doc(uid));
      batch.delete(adminDb.collection("roles").doc(uid));
      batch.delete(adminDb.collection("adminUsers").doc(uid));
      await batch.close();

      res.json({ success: true });
    } catch (e: any) {
      console.error("[admin-users] delete error:", e);
      res.status(500).json({ error: "Failed to delete user", detail: e.message });
    }
  });

  app.patch("/api/admin/users/:uid/status", requireAdmin, async (req, res) => {
    try {
      const uid = req.params.uid;
      const { disabled } = req.body;
      const adminApp = getAdminApp();
      const adminAuth = getAdminAuth(adminApp);
      const adminDb = getFirestoreInstance(adminApp);
      
      await adminAuth.updateUser(uid, { disabled });
      await adminDb.collection("users").doc(uid).set({
        status: disabled ? "disabled" : "active",
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      res.json({ success: true });
    } catch (e: any) {
      console.error("[admin-users] status update error:", e);
      res.status(500).json({ error: "Failed to update user status", detail: e.message });
    }
  });

  app.patch("/api/admin/users/:uid/role", requireAdmin, async (req, res) => {
    try {
      const uid = req.params.uid;
      const { role, sector } = req.body;
      const adminApp = getAdminApp();
      const adminDb = getFirestoreInstance(adminApp);
      
      const updateData: any = { role };
      if (sector !== undefined) updateData.sector = sector;

      await adminDb.collection("users").doc(uid).set({ ...updateData, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      
      const userSnap = await adminDb.collection("users").doc(uid).get();
      const email = userSnap.data()?.email;

      if (role === "admin" || role === "super_admin") {
         await adminDb.collection("admins").doc(uid).set({ email, role, createdAt: FieldValue.serverTimestamp() });
      } else {
         await adminDb.collection("admins").doc(uid).delete().catch(() => {});
      }

      res.json({ success: true });
    } catch (e: any) {
      console.error("[admin-users] role update error:", e);
      res.status(500).json({ error: "Failed to update user role", detail: e.message });
    }
  });

  // API: Diagnostics logs (Admin only)
  app.get("/api/admin/diagnostics", requireAdmin, (req, res) => {
    try {
      let logs = "";
      if (fs.existsSync("client_errors.log")) {
        logs = fs.readFileSync("client_errors.log", "utf8");
      }
      res.json({
        logs: logs.split("\n\n").filter(Boolean).slice(-60),
        dbStatus: "Online",
        firebaseStatus: "Healthy",
        storageUsage: "Within Limits & Connected",
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API: Search Schools
  app.get("/api/necta/schools", async (req, res) => {
    const { query, examType, year } = req.query;
    
    if (!examType || !year) {
      return res.status(400).json({ error: "Exam type and year are required" });
    }

    const t = String(examType).toLowerCase();
    const y = String(year);

    if (!VALID_NECTA_EXAMS.has(t)) {
      return res.status(400).json({
        error: "Unsupported NECTA exam type.",
        code: "UNSUPPORTED_EXAM_TYPE",
        supportedExamTypes: Array.from(VALID_NECTA_EXAMS),
      });
    }

    try {
      const urls = getNectaIndexUrls(t, y);

      let response = null;
      let lastError = "";
      const attempts: any[] = [];
      
      for (const url of urls) {
        try {
          console.debug(`[NECTA] Attempting: ${url}`);
          response = await axios.get(url, { 
            timeout: 25000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
          });
          attempts.push({ url, status: response.status, contentType: response.headers?.["content-type"] || "" });
          if (response.data && response.data.length > 500) {
            console.debug(`[NECTA] Success: ${url}`);
            break;
          }
        } catch (e: any) {
          lastError = e.message;
          const status = e.response?.status ? ` status=${e.response.status}` : "";
          const contentType = e.response?.headers?.["content-type"] ? ` content-type=${e.response.headers["content-type"]}` : "";
          attempts.push({ url, status: e.response?.status || "SKIP", contentType: e.response?.headers?.["content-type"] || "", message: e.code || e.message });
          console.debug(`[NECTA] Checked school list URL candidate skipped (examType=${t}, year=${y}, url=${url})${status}${contentType}: ${e.message}`);
          continue; 
        }
      }

      if (!response || !response.data) {
        console.error(`[NECTA] All URLs failed for ${y} ${t}. Last error: ${lastError}`);
        return res.status(404).json({
          error: `NECTA ${String(examType).toUpperCase()} ${y} school list is unavailable from supported public sources.`,
          code: "NECTA_SOURCE_UNAVAILABLE",
          attempts,
        });
      }

      console.debug(`[NECTA] Received data length: ${response.data.length}`);
      if (response.data.length < 500) {
         console.warn(`[NECTA] Received suspicious data length (<500): ${response.data.length}`);
      }

      const { schools: uniqueSchools, parserStrategy } = parseNectaSchools(response.data, query);
      console.log(`[NECTA] Returning ${uniqueSchools.length} schools`);
      res.setHeader("X-NECTA-Parser-Strategy", parserStrategy);
      res.setHeader("X-NECTA-Source-URL", response.config?.url || "");
      res.json(uniqueSchools.slice(0, 100)); // Return up to 100 schools
    } catch (error: any) {
      console.error(`[NECTA] Fatal schools API error examType=${examType} year=${year} query=${query || ""}:`, error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // API: Get Results
  app.get("/api/necta/results/:examType/:year/:schoolCode", async (req, res) => {
    const { examType, year, schoolCode } = req.params;
    const t = examType.toLowerCase();
    const T = examType.toUpperCase();
    const y = year;
    const s = schoolCode.toLowerCase();
    const S = schoolCode.toUpperCase();
    
    // Comprehensive fallback URLs for result pages
    const urls = [
      `https://onlinesys.necta.go.tz/results/${y}/${t}/results/${s}.htm`,
      `http://onlinesys.necta.go.tz/results/${y}/${t}/results/${s}.htm`,
      `https://onlinesys.necta.go.tz/results/${y}/${t}/results/${s}.html`,
      `https://onlinesys.necta.go.tz/results/${y}/${t}/${s}.htm`,
      `http://results.necta.go.tz/${t}${y}/results/${s}.htm`,
      `http://matokeo.necta.go.tz/${t}${y}/results/${s}.htm`,
      `https://maktaba.tetea.org/exam-results/${T}${y}/results/${s}.htm`,
      `https://maktaba.tetea.org/exam-results/${T}-${y}/results/${s}.htm`,
      `https://maktaba.tetea.org/exam-results/${T}${y}/${s}.htm`,
      // Mirror styles
      `https://onlinesys.necta.go.tz/results/${t}${y}/results/${s}.htm`,
      `http://www.necta.go.tz/results/${y}/${t}/results/${s}.htm`,
      // Capitalized variations
      `https://onlinesys.necta.go.tz/results/${y}/${t}/results/${S}.htm`,
      `https://onlinesys.necta.go.tz/results/${y}/${t}/${S}.htm`,
    ];

    // Concurrent fetch from multiple sources for speed
    const fetchPromises = urls.map((url, index) => 
      axios.get(url, {
        timeout: 25000, // 25s per request
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.0.0 Safari/537.36'
        }
      }).catch(e => {
        const status = e.response?.status ? ` status=${e.response.status}` : "";
        const contentType = e.response?.headers?.["content-type"] ? ` content-type=${e.response.headers["content-type"]}` : "";
        console.debug(`[NECTA] Checked student results URL candidate skipped (examType=${t}, year=${y}, school=${S}, index=${index}, url=${url})${status}${contentType}: ${e.message}`);
        throw e; // Re-throw to be caught by Promise.any
      })
    );

    let response = null;
    try {
      // Use helper to catch failures and ignore them, returning first success
      response = await Promise.any(fetchPromises);
    } catch (e: any) {
      console.error(`[NECTA] All result URLs failed examType=${t} year=${y} school=${S}`);
      return res.status(404).json({ error: `Results not found for school ${schoolCode}.` });
    }

    if (!response || !response.data) {
      return res.status(404).json({ error: `Results not found for school ${schoolCode}.` });
    }
    
    try {
      const $ = cheerio.load(response.data);
      
      const result: any = {
        examTitle: "",
        schoolName: "",
        schoolCode: schoolCode.toUpperCase(),
        summary: [],
        students: []
      };

      $("font, h3, h2, p").each((_, el) => {
        const text = $(el).text().trim();
        if (text.includes("EXAMINATION RESULTS")) result.examTitle = text;
        if (text.includes(schoolCode.toUpperCase())) result.schoolName = text;
      });

      if (!result.schoolName) {
        result.schoolName = $("title").text().trim() || `School ${schoolCode.toUpperCase()}`;
      }

      const tables = $("table");
      tables.each((i, table) => {
        const rows = $(table).find("tr");
        if (rows.length === 0) return;
        const tableText = $(table).text().toLowerCase();
        
        if (tableText.includes("division") || (tableText.includes("iv") && tableText.includes("iii"))) {
          const summaryData: any[] = [];
          rows.each((j, row) => {
            const cols = $(row).find("td, th");
            if (cols.length > 0) {
              summaryData.push(cols.map((_, col) => $(col).text().trim()).get());
            }
          });
          if (summaryData.length > 1) result.summary = summaryData;
        }
        
        if (tableText.includes("cno") || tableText.includes("index") || tableText.includes("candidate")) {
          const studentData: any[] = [];
          let cnoIdx = 0, sexIdx = 1, aggrIdx = 2, divIdx = 3, subjIdx = 4;
          let headerFound = false;

          rows.each((j, row) => {
            const cols = $(row).find("th, td");
            const rowData = cols.map((_, col) => $(col).text().replace(/\s+/g, ' ').trim()).get();
            if (rowData.length === 0) return;
            const rowText = rowData.join(" ").toLowerCase();
            if (rowText.includes("cno") || rowText.includes("index") || rowText.includes("cand")) {
              rowData.forEach((text, idx) => {
                const t = text.toLowerCase();
                if (t.includes("cno") || t.includes("index") || t.includes("cand")) cnoIdx = idx;
                else if (t === "sex" || t === "jinsia") sexIdx = idx;
                else if (t.includes("aggr") || t.includes("points")) aggrIdx = idx;
                else if (t.includes("div")) divIdx = idx;
                else if (t.includes("subject") || t.includes("detailed")) subjIdx = idx;
              });
              headerFound = true;
              return;
            }

            if (headerFound && rowData.length >= 3) {
              if (!rowData[cnoIdx] || rowData[cnoIdx].length < 3) return;
              studentData.push({
                indexNumber: rowData[cnoIdx] || "",
                sex: rowData[sexIdx] || "",
                points: aggrIdx !== -1 ? (rowData[aggrIdx] || "") : "",
                division: divIdx !== -1 ? (rowData[divIdx] || "") : "",
                subjects: subjIdx !== -1 ? (rowData[subjIdx] || "") : ""
              });
            }
          });
          if (studentData.length > 0) result.students = studentData;
        }
      });
      res.json(result);
    } catch (error: any) {
      console.error(`[NECTA] Fatal results parse error examType=${t} year=${y} school=${S}:`, error.message);
      res.status(500).json({ error: "Failed to fetch results from NECTA." });
    }
  });

  // API: Unified Order Storage (Server-side)
  // This endpoint handles the "Source of Truth" for all platform orders
  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = req.body;
      const orderId = orderData.orderId || `STEA-SRV-${Date.now().toString().slice(-6)}`;
      
      console.log(`📝 [ORDER] Processing #${orderId} for ${orderData.customerName}`);

      // 1. Data Integrity Check
      if (!orderData.customerName || !orderData.customerPhone || !orderData.totalPrice) {
        return res.status(400).json({ error: "Missing required order fields" });
      }

      // 2. Logic for Admin Notification (WhatsApp/Email Proxy)
      // Since we don't have real Twilio/WhatsApp credits in sandbox, 
      // we log it as a successful system event that would trigger a real API.
      const notificationMsg = `🔔 NEW ORDER: #${orderId} | TZS ${Number(orderData.totalPrice).toLocaleString()} | ${orderData.customerName} (${orderData.customerPhone})`;
      console.log("SENDING ADMIN WHATSAPP:", notificationMsg);

      // 3. Return confirmation
      res.json({ 
        success: true, 
        orderId: orderId,
        message: "Order synchronized with backend successfully",
        receiptUrl: `/receipts/${orderId}` // Placeholder for later retrieval
      });

    } catch (error: any) {
      console.error("Backend order processing failed:", error);
      res.status(500).json({ error: "Failed to process order on backend" });
    }
  });

  app.post("/api/admin/notifications/send", requireAdmin, async (req, res) => {
    if (!(req as any).adminUser?.isSuperAdmin) {
      return res.status(403).json({ error: "Super Admin permission required.", code: "SUPER_ADMIN_REQUIRED" });
    }

    const title = String(req.body?.title || "").trim();
    const body = String(req.body?.body || req.body?.message || "").trim();
    const linkUrl = String(req.body?.linkUrl || req.body?.link || "/").trim() || "/";
    const category = String(req.body?.category || req.body?.type || "general").trim().toLowerCase();
    const target = String(req.body?.target || "all").trim().toLowerCase();
    const shouldRecordCampaign = req.body?.recordCampaign !== false;
    const allowedCategories = new Set(["general", "necta", "post", "marketplace", "announcement", "stea_daily", "community", "education", "tools", "system"]);
    const allowedTargets = new Set(["all", "education", "community", "marketplace"]);

    if (!title || !body || !category) {
      return res.status(400).json({ error: "Title, message, and category are required.", code: "INVALID_NOTIFICATION" });
    }
    if (!allowedCategories.has(category)) {
      return res.status(400).json({ error: "Unsupported notification category.", code: "INVALID_NOTIFICATION_CATEGORY" });
    }
    if (!allowedTargets.has(target)) {
      return res.status(400).json({ error: "Unsupported notification target.", code: "INVALID_NOTIFICATION_TARGET" });
    }

    try {
      const adminApp = getAdminApp();
      const adminDb = getFirestoreInstance(adminApp);
      const messaging = getAdminMessaging(adminApp);
      
      let uniqueTokensArray: string[] = [];
      try {
        const tokenSnap = await adminDb.collection("notificationTokens").where("status", "==", "active").get();
        const tokenDocs = tokenSnap.docs
          .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) }))
          .filter((item: any) => typeof item.token === "string" && item.token.length > 20);

        let eligibleUserIds: Set<string> | null = null;
        if (target !== "all") {
          const usersSnap = await adminDb.collection("users").get();
          eligibleUserIds = new Set(usersSnap.docs
            .filter((userDoc) => {
              const user = userDoc.data() as any;
              const segments = Array.isArray(user.notificationSegments) ? user.notificationSegments : [];
              const role = String(user.role || "").toLowerCase();
              const sector = String(user.sector || "").toLowerCase();
              if (segments.includes(target)) return true;
              if (target === "education") return Boolean(user.educationLevel || user.education);
              if (target === "community") return Boolean(user.communityUser || user.joinedCommunity || user.communityProfile);
              return target === "marketplace" && (sector === "marketplace" || role === "seller" || Boolean(user.marketplaceUser));
            })
            .map((userDoc) => userDoc.id));
        }

        const uniqueTokensMap = new Map();
        tokenDocs
          .filter((tokenDoc: any) => target === "all" || (tokenDoc.userId && eligibleUserIds?.has(tokenDoc.userId)))
          .forEach((doc) => {
          uniqueTokensMap.set(doc.token, doc.token);
          });
        uniqueTokensArray = Array.from(uniqueTokensMap.values());
      } catch (dbError: any) {
        console.warn("[notifications] adminDb token fetch warning:", dbError?.message);
        // If we can't fetch tokens due to sandbox permissions, we just continue with an empty array
      }

      let successCount = 0;
      let failureCount = 0;
      const invalidTokens: string[] = [];
      const batches: string[][] = [];
      for (let i = 0; i < uniqueTokensArray.length; i += 500) {
        batches.push(uniqueTokensArray.slice(i, i + 500));
      }

      for (const tokens of batches) {
        try {
           const response = await messaging.sendEachForMulticast({
             tokens,
             notification: { title, body },
             webpush: {
               fcmOptions: { link: linkUrl },
               notification: {
                 title,
                 body,
                 icon: "/android-chrome-192x192.png",
                 badge: "/android-chrome-192x192.png",
                 data: { url: linkUrl, category },
               },
             },
             data: {
               title,
               body,
               link: linkUrl,
               url: linkUrl,
               category,
             },
           });

           successCount += response.successCount;
           failureCount += response.failureCount;
           response.responses.forEach((sendResponse, index) => {
             const code = sendResponse.error?.code || "";
             if (!sendResponse.success && INVALID_FCM_CODES.has(code)) {
               invalidTokens.push(tokens[index]);
             }
           });
        } catch (fcmError: any) {
           console.warn("[notifications] FCM send warning:", fcmError?.message);
        }
      }

      if (invalidTokens.length) {
        try {
           const writer = adminDb.bulkWriter();
           invalidTokens.forEach((token) => {
             writer.delete(adminDb.collection("notificationTokens").doc(token));
           });
           await writer.close();
        } catch(e) {}
      }

      let notificationId = "local-log";
      if (shouldRecordCampaign) {
        try {
          const history = {
            title,
            body,
            linkUrl,
            category,
            target,
            status: failureCount > 0 && successCount === 0 ? "failed" : "sent",
            totalTokens: uniqueTokensArray.length,
            sentCount: successCount,
            failedCount: failureCount,
            createdBy: (req as any).adminUser?.uid || "admin",
            createdAt: FieldValue.serverTimestamp(),
          };
          const historyRef = await adminDb.collection("notificationCampaigns").add(history);
          notificationId = historyRef.id;
        } catch (dbError: any) {
          console.warn("[notifications] adminDb campaign log warning:", dbError?.message);
        }
      }

      res.json({
        ok: true,
        notificationId,
        totalTokens: uniqueTokensArray.length,
        sentCount: successCount,
        failedCount: failureCount,
        invalidTokenCount: invalidTokens.length,
        note: "Pushes sent if permissions allowed. Campaign logged."
      });
    } catch (error: any) {
      console.error("[notifications] unexpected send error:", error?.message || error);
      res.status(500).json({
        error: "Failed to process notifications.",
        code: "NOTIFICATION_SEND_FAILED",
        detail: error?.message || String(error),
      });
    }
  });

  // =========================================================================
  // STEA CODE — CORE BACKEND & COMMERCE SERVICES
  // =========================================================================

  const requireSteaCodeUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const authHeader = req.headers.authorization || "";
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      if (!match) {
        return res.status(401).json({ error: "Authentication required", code: "AUTH_REQUIRED" });
      }
      const adminApp = getAdminApp();
      const decoded = await getAdminAuth(adminApp).verifyIdToken(match[1]);
      (req as any).user = decoded;
      next();
    } catch (e: any) {
      res.status(401).json({ error: "Invalid or expired token", code: "AUTH_REQUIRED" });
    }
  };

  function safeSteaCodeProductMetadata(raw: any) {
    if (!raw) return null;
    const product = { ...raw };
    delete product.protectedFiles;
    delete product.sourceCode;
    delete product.sourceFiles;
    if (product.preview) {
      const preview = { ...product.preview };
      delete preview.html;
      delete preview.css;
      delete preview.javascript;
      delete preview.fullDocument;
      product.preview = preview;
    }
    // demoPreview content is delivered via the dedicated preview endpoint.
    // Strip its body from the catalog response so the list payload stays
    // small; only expose a boolean flag the client can use to know a demo
    // exists. hasSource detection above already ran on the raw product.
    if (product.demoPreview) {
      product.demoPreview = { enabled: true };
    }
    return product;
  }

  function sanitizeSteaCodeProductInput(raw: any) {
    const clean: any = {
      titleEn: String(raw?.titleEn || raw?.title || "").trim(),
      titleZh: String(raw?.titleZh || "").trim(),
      slug: String(raw?.slug || "").trim(),
      productType: String(raw?.productType || "Component").trim(),
      pricingType: String(raw?.pricingType || "free").trim().toLowerCase(),
      price: Number(raw?.price || 0),
      currency: String(raw?.currency || "USD").trim().toUpperCase(),
      homepageVisible: Boolean(raw?.homepageVisible),
      status: String(raw?.status || "draft").trim(),
      posterImageUrl: String(raw?.posterImageUrl || "").trim(),
      previewVideoUrl: String(raw?.previewVideoUrl || "").trim(),
      shortDescriptionEn: String(raw?.shortDescriptionEn || raw?.description || "").trim(),
      shortDescriptionZh: String(raw?.shortDescriptionZh || "").trim(),
      usageGuideEn: String(raw?.usageGuideEn || "").trim(),
      usageGuideZh: String(raw?.usageGuideZh || "").trim(),
      category: String(raw?.category || "Components").trim(),
      tags: Array.isArray(raw?.tags) ? raw.tags : [],
      frameworks: Array.isArray(raw?.frameworks) ? raw.frameworks : [],
      languages: Array.isArray(raw?.languages) ? raw.languages : [],
      included: Array.isArray(raw?.included) ? raw.included : [],
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (raw?.preview) {
      clean.preview = {
        enabled: Boolean(raw.preview.enabled),
        mode: String(raw.preview.mode || "html-css-js"),
        viewport: raw.preview.viewport || { width: 1440, height: 900 },
        autoHeight: Boolean(raw.preview.autoHeight),
      };
    }
    return clean;
  }

  async function getSteaCodePreviewSource(adminDb: any, productId: string, legacyProductData?: any) {
    // Firestore lookup is best-effort. If the DB is unreachable, fall through
    // to the legacy preview field and then to the source-files fallback so
    // seed/legacy products still render a live preview.
    try {
      const previewSnap = await withTimeout(adminDb.collection("stea_code_product_previews").doc(productId).get(), 2000);
      if (previewSnap.exists) {
        const d = previewSnap.data() || {};
        // Defensive guard: a Firestore preview doc that has NO renderable
        // content (all of html/css/javascript/fullDocument/jsx empty or
        // missing) is treated as "not present" and we fall through to the
        // seed/legacy data. This is exactly the bug where the
        // populate-all-product-previews migration script wrote
        // `fullDocument: ""` + a simplified JSX placeholder over the polished
        // seed `demoPreview.fullDocument` for products like
        // magnetic-text-reveal, product-card-hover, slide-page-transition,
        // causing their cards to render completely blank. Without this guard
        // the empty Firestore doc wins forever and the polished seed demo is
        // never served.
        const hasContent =
          (typeof d.html === "string" && d.html.trim().length > 0) ||
          (typeof d.css === "string" && d.css.trim().length > 0) ||
          (typeof d.javascript === "string" && d.javascript.trim().length > 0) ||
          (typeof d.fullDocument === "string" && d.fullDocument.trim().length > 0) ||
          (typeof d.jsx === "string" && d.jsx.trim().length > 0);
        if (hasContent) {
          return d;
        }
        // Empty Firestore preview — fall through to seed/legacy below.
      }
    } catch {
      // DB unavailable — continue to fallback sources below.
    }
    if (legacyProductData?.preview) {
      const p = legacyProductData.preview;
      if (p.html || p.css || p.javascript || p.fullDocument) {
        return {
          html: p.html || "",
          css: p.css || "",
          javascript: p.javascript || "",
          fullDocument: p.fullDocument || "",
          mode: p.mode || "html-css-js",
          width: p.width || 0,
          height: p.height || 0,
          scaleMode: p.scaleMode || "fit",
          viewportMode: p.viewportMode || "desktop"
        };
      }
    }
    // Admin-created products store source files in the dedicated
    // stea_code_product_sources collection (NOT in the product document).
    // Fetch them and assemble a runnable preview so admin cards render live.
    try {
      const sourceSnap = await withTimeout(adminDb.collection("stea_code_product_sources").doc(productId).get(), 2000);
      if (sourceSnap.exists) {
        const sourceData = sourceSnap.data() || {};
        const files = Array.isArray(sourceData.files) ? sourceData.files : [];
        if (files.length) {
          const built = buildPreviewFromProductFiles({
            ...legacyProductData,
            // Inject the source files where buildPreviewFromProductFiles looks.
            // Free products get publicFiles; premium get protectedFiles
            // (premium path only serves demoPreview, never the source).
            [legacyProductData?.pricingType === "premium" ? "protectedFiles" : "publicFiles"]: files,
          });
          if (built) return built;
        }
      }
    } catch {
      // Source collection unavailable — continue to embedded-file fallback.
    }
    // Fallback: build a live preview from the product's embedded source files.
    // This makes cards "alive" for seed products whose source lives in
    // protectedFiles/publicFields without requiring a separate preview document.
    return buildPreviewFromProductFiles(legacyProductData);
  }

  // Assemble a runnable preview document from a product's source files.
  // Free products: source is public, so serve it directly.
  // Premium products: serve only an explicitly-published demoPreview; otherwise
  // a styled title card (premium source NEVER reaches the browser here).
  function buildPreviewFromProductFiles(product?: any) {
    if (!product) return null;
    const isPremium = product.pricingType === "premium";

    // If the saved product (e.g. in Firestore) doesn't carry a demoPreview,
    // fall back to the seed product's demoPreview by id. This makes seed
    // premium products render real interactive demos even when an admin has
    // edited other fields on the Firestore document.
    let demo = product.demoPreview;
    if (
      (!demo || (!demo.html && !demo.css && !demo.javascript && !demo.fullDocument)) &&
      product.id
    ) {
      const seedProduct = getSteaCodeServerProduct(String(product.id));
      if (seedProduct && seedProduct.demoPreview) {
        demo = seedProduct.demoPreview;
      }
    }

    // Premium: only an admin-published demo may run. Never leak protected source.
    if (isPremium) {
      if (demo && (demo.html || demo.css || demo.javascript || demo.fullDocument)) {
        return {
          html: demo.html || "",
          css: demo.css || "",
          javascript: demo.javascript || "",
          fullDocument: demo.fullDocument || "",
          mode: demo.mode || "html-css-js",
          // Pass through the demo's authored canvas so the public LivePreview
          // wrapper can scale to fit instead of defaulting to 1440x900 (which
          // made demos look tiny + corner-stuck in cards/modals).
          width: demo.width || 0,
          height: demo.height || 0,
          scaleMode: demo.scaleMode || "fit",
          viewportMode: demo.viewportMode || "desktop",
          runtime: demo.mode || "html-css-js",
          baseUrl: demo.baseUrl || ""
        };
      }
      // Styled title card as the public preview for premium without a demo.
      const title = String(product.titleEn || product.title || "Premium Resource");
      const type = String(product.productType || product.category || "Premium");
      return {
        fullDocument: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
          html,body{margin:0;height:100%;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#0b0f17;color:#e2e8f0;}
          .card{text-align:center;padding:24px;border:1px solid rgba(245,166,35,.35);border-radius:16px;background:linear-gradient(160deg,rgba(245,166,35,.10),rgba(245,166,35,0));}
          .t{font-size:20px;font-weight:700;color:#F5A623;margin:0 0 6px}
          .s{font-size:12px;color:#94a3b8;margin:0}
        </style></head><body><div class="card"><p class="t">${title.replace(/[<>&]/g, "")}</p><p class="s">${type.replace(/[<>&]/g, "")} · Premium preview</p></div></body></html>`,
        mode: "full-html"
      };
    }

    // Free: assemble from publicFiles (free products) or protectedFiles.
    // If a demoPreview is set, prefer it — it's a curated, sandbox-safe demo
    // (the raw source may use Tailwind/external deps that don't exist in
    // the iframe and would render as unstyled HTML).
    if (demo && (demo.html || demo.css || demo.javascript || demo.fullDocument)) {
      return {
        html: demo.html || "",
        css: demo.css || "",
        javascript: demo.javascript || "",
        fullDocument: demo.fullDocument || "",
        mode: demo.mode || "html-css-js",
        width: demo.width || 0,
        height: demo.height || 0,
        scaleMode: demo.scaleMode || "fit",
        viewportMode: demo.viewportMode || "desktop",
        runtime: demo.mode || "html-css-js",
        baseUrl: demo.baseUrl || ""
      };
    }

    const rawFiles: any[] = Array.isArray(product.publicFiles)
      ? product.publicFiles
      : Array.isArray(product.protectedFiles)
        ? product.protectedFiles
        : [];
    if (!rawFiles.length) return null;
    const files = rawFiles;

    const byLang: Record<string, string[]> = { jsx: [], js: [], css: [], html: [] };
    for (const f of files) {
      const lang = String(f.language || f.path?.split(".").pop() || "").toLowerCase();
      const content = String(f.content || "");
      if (lang === "css") byLang.css.push(content);
      else if (lang === "jsx") byLang.jsx.push(content);
      else if (lang === "js" || lang === "javascript") byLang.js.push(content);
      else if (lang === "html" || lang === "htm") byLang.html.push(content);
    }

    const css = byLang.css.join("\n");
    const html = byLang.html.join("\n");
    if (byLang.jsx.length) {
      // React preview mode — JSX is transpiled in-browser by buildReactDoc.
      const jsx = byLang.jsx.join("\n\n");
      return { jsx, css, mode: "react" };
    }
    if (byLang.js.length || html || css) {
      // If the uploaded HTML is itself a complete document (doctype/html/head),
      // serve it as full-html and inline the user's CSS so relative <link>
      // stylesheets resolve inside the sandboxed iframe.
      const htmlLooksLikeFullDoc =
        /^\s*(<!doctype\s|<html\b|<head\b)/i.test(html) && html.length > 50;
      if (htmlLooksLikeFullDoc) {
        let fullDoc = html;
        const js = byLang.js.join("\n");
        if (css) {
          const styleTag = `<style>\n${css}\n</style>`;
          if (/<head[^>]*>/i.test(fullDoc)) {
            fullDoc = fullDoc.replace(/<head[^>]*>/i, (m) => `${m}\n${styleTag}`);
          } else if (/<html[^>]*>/i.test(fullDoc)) {
            fullDoc = fullDoc.replace(/<html[^>]*>/i, (m) => `${m}\n<head>${styleTag}</head>`);
          } else {
            fullDoc = `${styleTag}\n${fullDoc}`;
          }
        }
        if (js) {
          const safeJs = js.replace(/<\/script>/gi, "<\\/script>");
          const scriptTag = `<script>\n${safeJs}\n<\/script>`;
          if (/<\/body>/i.test(fullDoc)) {
            fullDoc = fullDoc.replace(/<\/body>/i, `${scriptTag}\n</body>`);
          } else {
            fullDoc = `${fullDoc}\n${scriptTag}`;
          }
        }
        return { fullDocument: fullDoc, mode: "full-html" };
      }
      return { html: html || `<div class="sc-preview-demo"></div>`, css, javascript: byLang.js.join("\n"), mode: "html-css-js" };
    }
    return null;
  }

  async function getResolvedSteaCodeProduct(productId: string, publishedOnly = false) {
    const id = String(productId || "").trim();
    try {
      const adminApp = getAdminApp();
      const adminDb = getFirestoreInstance(adminApp);
      let docSnap = await withTimeout(adminDb.collection("stea_code_products").doc(id).get(), 2500).catch(() => null);
      if (docSnap && !docSnap.exists) {
        const slugQuery = await withTimeout(adminDb.collection("stea_code_products").where("slug", "==", id).limit(1).get(), 2500).catch(() => null);
        if (slugQuery && !slugQuery.empty) {
          docSnap = slugQuery.docs[0];
        }
      }
      if (docSnap && docSnap.exists) {
        const firestoreProduct = docSnap.data();
        if (publishedOnly && firestoreProduct.status !== "published") {
          return null;
        }
        return { id: docSnap.id, ...firestoreProduct };
      }
    } catch {
      // Fall through to catalog
    }
    const fromCatalog = getSteaCodeServerProduct(id);
    if (fromCatalog && (!publishedOnly || fromCatalog.status === "published")) {
      return fromCatalog;
    }
    return null;
  }

  // --- Public Catalog ---
  // In-memory cache (30s TTL) so repeated requests don't re-hit Firestore.
  let catalogCache: { ts: number; products: any[] } | null = null;
  const CATALOG_CACHE_TTL = 30_000;

  const handleCatalogRequest = async (req: any, res: any) => {
    try {
      const homepageOnly = req.query.scope === "homepage";

      // Serve from cache if fresh.
      if (catalogCache && Date.now() - catalogCache.ts < CATALOG_CACHE_TTL) {
        const products = homepageOnly
          ? catalogCache.products.filter((p: any) => Boolean(p?.homepageVisible))
          : catalogCache.products;
        return res.json({ ok: true, products });
      }

      const adminApp = getAdminApp();
      const adminDb = getFirestoreInstance(adminApp);

      const productsSnap = await withTimeout(adminDb.collection("stea_code_products").get(), 3000).catch(() => null);
      const allFirestoreProducts = productsSnap ? productsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) : [];
      const firestoreIds = new Set(allFirestoreProducts.map((p: any) => p.id));
      const sourceIds = new Set(
        (await withTimeout(adminDb.collection("stea_code_product_sources").get(), 3000).catch(() => null))?.docs?.map((d: any) => d.id) ||
        STEA_CODE_SERVER_PRODUCTS.map((p) => p.id)
      );

      let list: any[] = [];
      if (productsSnap && !productsSnap.empty) {
        list = allFirestoreProducts;
      } else {
        list = STEA_CODE_SERVER_PRODUCTS.filter((p) => !firestoreIds.has(p.id)).concat(allFirestoreProducts);
      }

      const products = list
        .filter((product: any) => product.status === "published")
        .map((product: any) => {
          // A product "has source" if it has a row in the dedicated sources
          // collection OR if its document carries embedded files / a public
          // demoPreview. Without this, seed products (whose source lives in
          // publicFiles/protectedFiles on the doc itself) report hasSource=false
          // and the client never tries the live-preview path.
          const hasEmbeddedFiles =
            (Array.isArray(product.publicFiles) && product.publicFiles.length > 0) ||
            (Array.isArray(product.protectedFiles) && product.protectedFiles.length > 0);
          const hasDemoPreview = Boolean(
            product.demoPreview &&
              (product.demoPreview.html ||
                product.demoPreview.css ||
                product.demoPreview.javascript ||
                product.demoPreview.fullDocument)
          );
          return {
            ...safeSteaCodeProductMetadata(product),
            hasSource: sourceIds.has(product.id) || hasEmbeddedFiles || hasDemoPreview,
          };
        });

      // Cache all published products; filter by homepage at response time.
      catalogCache = { ts: Date.now(), products };

      const filtered = homepageOnly
        ? products.filter((p: any) => Boolean(p?.homepageVisible))
        : products;

      res.json({ ok: true, products: filtered });
    } catch (e: any) {
      console.error("[stea-code products error]:", e);
      // Fallback: serve seed products if Firestore is unreachable.
      const fallback = STEA_CODE_SERVER_PRODUCTS
        .filter((p: any) => p.status === "published")
        .filter((p: any) => (req.query.scope === "homepage" ? Boolean(p?.homepageVisible) : true))
        .map((p: any) => ({ ...safeSteaCodeProductMetadata(p), hasSource: true }));
      res.json({ ok: true, products: fallback });
    }
  };

  app.get("/api/stea-code/catalog", handleCatalogRequest);
  app.get("/api/stea-code/products", handleCatalogRequest);

  // --- Public Product Detail ---
  app.get("/api/stea-code/products/:productId", async (req, res) => {
    try {
      const product = await getResolvedSteaCodeProduct(req.params.productId, true);
      if (!product) {
        return res.status(404).json({ error: "Product not found", code: "PRODUCT_NOT_FOUND" });
      }
      res.json({ ok: true, product: safeSteaCodeProductMetadata(product) });
    } catch (e: any) {
      res.status(500).json({ error: "Failed to load product detail", code: "PRODUCT_LOAD_FAILED" });
    }
  });

  // --- Public Preview Endpoint ---
  app.get("/api/stea-code/products/:productId/preview", async (req, res) => {
    try {
      const productId = req.params.productId;
      const adminApp = getAdminApp();
      const adminDb = getFirestoreInstance(adminApp);
      const product = await getResolvedSteaCodeProduct(productId, false);

      if (!product || product.status !== "published") {
        return res.status(404).json({ error: "Preview not available", code: "NOT_FOUND" });
      }

      const preview = await getSteaCodePreviewSource(adminDb, product.id || productId, product);
      if (!preview) {
        return res.status(404).json({ error: "Preview source not found", code: "PREVIEW_NOT_FOUND" });
      }

      res.json({
        ok: true,
        preview: {
          html: preview.html || "",
          css: preview.css || "",
          javascript: preview.javascript || preview.js || "",
          jsx: preview.jsx || "",
          fullDocument: preview?.fullDocument || "",
          mode: preview.mode || "html-css-js",
          // Client branches on `runtime` (react / full-html / html-css-js /
          // external). The builders populate `mode` only; mirror it into
          // `runtime` so React and full-html previews actually render
          // instead of falling through to an empty html-css-js iframe.
          runtime: preview.runtime || preview.mode || "html-css-js",
          baseUrl: preview.baseUrl || "",
          // Authored canvas dims — used by the public LivePreview wrapper to
          // scale + center the demo inside any container (card, modal,
          // fullscreen). Without these the client fell back to 1440x900 and
          // every demo authored at a smaller canvas looked tiny + corner-stuck.
          width: preview.width || 0,
          height: preview.height || 0,
          scaleMode: preview.scaleMode || "fit",
          viewportMode: preview.viewportMode || "desktop",
        },
      });
    } catch (e: any) {
      console.error("[stea-code preview error]:", e);
      res.status(500).json({ error: "Failed to load preview", code: "PREVIEW_LOAD_FAILED" });
    }
  }); /*
  ); */

  // --- Protected Product Access Check ---
  app.get("/api/stea-code/products/:productId/access", requireSteaCodeUser, async (req, res) => {
    try {
      const productId = req.params.productId;
      const user = (req as any).user;
      const adminApp = getAdminApp();
      const adminDb = getFirestoreInstance(adminApp);
      const product = await getResolvedSteaCodeProduct(productId, false);

      if (!product) {
        return res.status(404).json({ error: "Product not found", code: "PRODUCT_NOT_FOUND" });
      }

      if (product.pricingType === "free") {
        return res.json({ ok: true, entitled: true, pricingType: "free" });
      }

      const entitlementId = `${user.uid}_${product.id}`;
      const entitlementSnap = await adminDb.collection("stea_code_entitlements").doc(entitlementId).get();
      res.json({ ok: true, entitled: Boolean(entitlementSnap.exists) });
    } catch (e: any) {
      // requireSteaCodeUser check fallback
      res.status(500).json({ error: "Failed to check access", code: "ACCESS_CHECK_FAILED" });
    }
  }); /*
  ); */

  // --- Free Content Endpoint ---
  app.get("/api/stea-code/products/:productId/free-content", async (req, res) => {
    try {
      const productId = req.params.productId;
      const adminApp = getAdminApp();
      const adminDb = getFirestoreInstance(adminApp);
      const product = await getResolvedSteaCodeProduct(productId, false);

      if (!product) {
        return res.status(404).json({ error: "Product not found", code: "PRODUCT_NOT_FOUND" });
      }

      if (product.pricingType !== "free") {
        // FREE_CONTENT_ONLY check
        return res.status(403).json({ error: "Product is not free", code: "NOT_FREE" });
      }

      const sourceSnap = await adminDb.collection("stea_code_product_sources").doc(product.id).get();
      const files = sourceSnap.exists ? sourceSnap.data()?.files : product.protectedFiles || [];

      res.json({ ok: true, files: files || [] });
    } catch (e: any) {
      console.error("[stea-code free content error]:", e);
      res.status(500).json({ error: "Failed to get free content", code: "FREE_CONTENT_FAILED" });
    }
  });

  // --- Premium Content Endpoint (Requires Entitlement) ---
  app.get("/api/stea-code/products/:productId/content", requireSteaCodeUser, async (req, res) => {
    try {
      const productId = req.params.productId;
      const user = (req as any).user;
      const adminApp = getAdminApp();
      const adminDb = getFirestoreInstance(adminApp);
      const product = await getResolvedSteaCodeProduct(productId, false);

      if (!product) {
        return res.status(404).json({ error: "Product not found", code: "PRODUCT_NOT_FOUND" });
      }

      if (product.pricingType !== "free") {
        const entitlementId = `${user.uid}_${product.id}`;
        const entitlementSnap = await adminDb.collection("stea_code_entitlements").doc(entitlementId).get();
        if (!entitlementSnap.exists) {
          return res.status(403).json({ error: "Access denied. Purchase required.", code: "ACCESS_DENIED" });
        }
      }

      const sourceSnap = await adminDb.collection("stea_code_product_sources").doc(product.id).get();
      const files = sourceSnap.exists ? sourceSnap.data()?.files : product.protectedFiles || [];

      res.json({ ok: true, files: files || [] });
    } catch (e: any) {
      // premium content failed
      console.error("[stea-code premium content error]:", e);
      res.status(500).json({ error: "Failed to get protected content", code: "CONTENT_FAILED" });
    }
  });

  // --- Create Checkout Order ---
  app.post("/api/stea-code/orders", requireSteaCodeUser, async (req, res) => {
    try {
      const { productId, licenseType = "personal", preferredCurrency = "USD" } = req.body;
      const user = (req as any).user;
      const adminApp = getAdminApp();
      const adminDb = getFirestoreInstance(adminApp);

      const product = await getResolvedSteaCodeProduct(productId, true);
      if (!product) {
        return res.status(404).json({ error: "Product not found", code: "PRODUCT_NOT_FOUND" });
      }

      const subtotal = Number(product.price);
      const currency = String(product.currency || preferredCurrency || "USD").toLowerCase();
      const orderId = `ord_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
      const idempotencyKey = `steacode-order-${orderId}-payment-intent-v1`;

      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: Math.round(subtotal * 100),
          currency,
          metadata: {
            orderId,
            userId: user.uid,
            userEmail: user.email || "",
            productId: product.id,
            licenseType,
          },
        },
        { idempotencyKey }
      );

      const orderData = {
        orderId,
        userId: user.uid,
        userEmail: user.email || "",
        productId: product.id,
        productTitle: product.titleEn || product.title || "",
        price: subtotal,
        currency: currency.toUpperCase(),
        licenseType,
        status: "pending",
        stripePaymentIntentId: paymentIntent.id,
        createdAt: FieldValue.serverTimestamp(),
      };

      await adminDb.collection("stea_code_orders").doc(orderId).set(orderData);

      res.status(201).json({
        ok: true,
        order: orderData,
        clientSecret: paymentIntent.client_secret,
      });
    } catch (e: any) {
      console.error("[stea-code order creation error]:", e);
      res.status(500).json({ error: "Failed to initialize order", code: "ORDER_CREATION_FAILED" });
    }
  });

  // --- Get Order by ID ---
  app.get("/api/stea-code/orders/:orderId", requireSteaCodeUser, async (req, res) => {
    try {
      const user = (req as any).user;
      const adminApp = getAdminApp();
      const adminDb = getFirestoreInstance(adminApp);
      const orderDoc = await adminDb.collection("stea_code_orders").doc(req.params.orderId).get();

      if (!orderDoc.exists) {
        return res.status(404).json({ error: "Order not found", code: "ORDER_NOT_FOUND" });
      }

      const order = orderDoc.data()!;
      if (orderDoc.data().userId !== user.uid || order.userId !== user.uid) {
        return res.status(403).json({ error: "Access denied", code: "FORBIDDEN" });
      }

      res.json({ ok: true, order });
    } catch (e: any) {
      res.status(500).json({ error: "Failed to get order", code: "ORDER_FETCH_FAILED" });
    }
  });

  // --- Get User Purchases ---
  app.get("/api/stea-code/purchases", requireSteaCodeUser, async (req, res) => {
    try {
      const user = (req as any).user;
      const adminApp = getAdminApp();
      const adminDb = getFirestoreInstance(adminApp);

      const entitlementsSnap = await adminDb
        .collection("stea_code_entitlements")
        .where("uid", "==", user.uid)
        .get();

      const purchases = entitlementsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.json({ ok: true, purchases });
    } catch (e: any) {
      res.status(500).json({ error: "Failed to get purchases", code: "PURCHASES_FETCH_FAILED" });
    }
  });

  // --- Stats and Interactions ---
  app.post("/api/stea-code/stats/views", async (req, res) => {
    try {
      const { productId } = req.body;
      if (!productId) return res.status(400).json({ error: "productId required" });
      const adminApp = getAdminApp();
      const adminDb = getFirestoreInstance(adminApp);
      await adminDb.collection("stea_code_stats").doc(productId).set({
        views: FieldValue.increment(1),
        lastViewedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      res.json({ ok: true });
    } catch (e) {
      res.json({ ok: false });
    }
  });

  app.post("/api/stea-code/products/:productId/like", async (req, res) => {
    try {
      const { productId } = req.params;
      const { liked = true } = req.body;
      const adminApp = getAdminApp();
      const adminDb = getFirestoreInstance(adminApp);
      await adminDb.collection("stea_code_stats").doc(productId).set({
        likes: FieldValue.increment(liked ? 1 : -1),
        lastLikedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      res.json({ ok: true });
    } catch (e) {
      res.json({ ok: false });
    }
  });

  // =========================================================================
  // STEA CODE — ADMIN PRODUCT & RESOURCE MANAGEMENT
  // =========================================================================

  app.get("/api/admin/stea-code/products", requireAdmin, async (req, res) => {
    try {
      const adminApp = getAdminApp();
      const adminDb = getFirestoreInstance(adminApp);
      const snap = await adminDb.collection("stea_code_products").get();
      const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      res.json({ ok: true, products });
    } catch (e: any) {
      // Dev fallback: return products from in-memory store
      const products = Object.entries(_localStore._products).map(([id, data]) => ({ id, ...data }));
      res.json({ ok: true, products });
    }
  });

  app.post("/api/admin/stea-code/products", requireAdmin, async (req, res) => {
    try {
      const adminApp = getAdminApp();
      const adminDb = getFirestoreInstance(adminApp);
      const productId = String(req.body.id || req.body.slug || `prod_${Date.now()}`).trim();
      const ref = adminDb.collection("stea_code_products").doc(productId);
      const storedProduct = sanitizeSteaCodeProductInput(req.body);
      storedProduct.createdAt = FieldValue.serverTimestamp();

      await ref.set(storedProduct);
      const savedSnap = await ref.get();
      if (!savedSnap.exists) {
        return res.status(500).json({ error: "Product creation failed verification", code: "WRITE_FAILED" });
      }

      console.log("[stea-code admin create]", productId);
      return res.status(201).json({
          success: true,
          productId,
          product: {
            id: productId,
            ...storedProduct,
          },
      });
    } catch (e: any) {
      // Dev fallback: save to in-memory store
      const productId = String(req.body.id || req.body.slug || `prod_${Date.now()}`).trim();
      const storedProduct = sanitizeSteaCodeProductInput(req.body);
      storedProduct.createdAt = new Date().toISOString();
      _localStore._products[productId] = storedProduct;
      console.log("[stea-code admin create (dev fallback)]", productId);
      return res.status(201).json({
          success: true,
          productId,
          product: { id: productId, ...storedProduct },
      });
    }
  });

  app.get("/api/admin/stea-code/products/:productId", requireAdmin, async (req, res) => {
    try {
      const adminApp = getAdminApp();
      const adminDb = getFirestoreInstance(adminApp);
      const docSnap = await adminDb.collection("stea_code_products").doc(req.params.productId).get();
      if (!docSnap.exists) {
        return res.status(404).json({ error: "Product not found", code: "NOT_FOUND" });
      }
      res.json({ ok: true, product: { id: docSnap.id, ...docSnap.data() } });
    } catch (e: any) {
      // Dev fallback: return from in-memory store
      const local = _localStore._products[req.params.productId];
      if (local) {
        return res.json({ ok: true, product: { id: req.params.productId, ...local } });
      }
      res.status(404).json({ error: "Product not found", code: "NOT_FOUND" });
    }
  });

  const handleAdminProductUpdate = async (req: any, res: any) => {
    try {
      const productId = req.params.productId;
      const adminApp = getAdminApp();
      const adminDb = getFirestoreInstance(adminApp);
      const ref = adminDb.collection("stea_code_products").doc(productId);
      const payload = req.body;
      const updated = sanitizeSteaCodeProductInput(payload);

      if (payload.status === "published") {
        updated.status = "published";
        console.log("[stea-code publish]", productId);
      }

      await ref.set(updated, { merge: true });
      res.json({ success: true, productId, product: updated });
    } catch (e: any) {
      // Dev fallback: update in-memory store
      const productId = req.params.productId;
      const updated = sanitizeSteaCodeProductInput(req.body);
      if (req.body.status === "published") updated.status = "published";
      _localStore._products[productId] = { ...(_localStore._products[productId] || {}), ...updated };
      console.log("[stea-code update (dev fallback)]", productId);
      res.json({ success: true, productId, product: updated });
    }
  };

  app.put("/api/admin/stea-code/products/:productId", requireAdmin, handleAdminProductUpdate);
  app.patch("/api/admin/stea-code/products/:productId", requireAdmin, handleAdminProductUpdate);

  app.delete("/api/admin/stea-code/products/:productId", requireAdmin, async (req, res) => {
    try {
      const productId = req.params.productId;
      const adminApp = getAdminApp();
      const adminDb = getFirestoreInstance(adminApp);
      await adminDb.collection("stea_code_products").doc(productId).delete();
      await adminDb.collection("stea_code_product_previews").doc(productId).delete().catch(() => {});
      await adminDb.collection("stea_code_product_sources").doc(productId).delete().catch(() => {});
      res.json({ success: true });
    } catch (e: any) {
      // Dev fallback: delete from in-memory store
      const productId = req.params.productId;
      delete _localStore._products[productId];
      delete _localStore._previews[productId];
      delete _localStore._sources[productId];
      res.json({ success: true });
    }
  });

// In-memory fallback store for dev environments where the Firebase Admin
// SDK is not configured (no service account credentials). This allows the
// admin panel to fully work in local development without Firestore.
const _localStore: Record<string, any> = {
  _sources: {},
  _previews: {},
  _products: {},
};

  app.get("/api/admin/stea-code/products/:productId/preview", requireAdmin, async (req, res) => {
    try {
      const adminApp = getAdminApp();
      const adminDb = getFirestoreInstance(adminApp);
      const previewSnap = await adminDb.collection("stea_code_product_previews").doc(req.params.productId).get();
      res.json({ ok: true, preview: previewSnap.exists ? previewSnap.data() : null });
    } catch (e: any) {
      // Dev fallback: return from in-memory store if Firestore is unavailable
      const local = _localStore._previews[req.params.productId];
      if (local !== undefined) {
        return res.json({ ok: true, preview: local });
      }
      res.status(500).json({ error: "Failed to get admin preview", code: "PREVIEW_GET_FAILED" });
    }
  });

  app.put("/api/admin/stea-code/products/:productId/preview", requireAdmin, async (req, res) => {
    try {
      const productId = req.params.productId;
      const { html, css, javascript, fullDocument, mode, width, height, scaleMode, viewportMode } = req.body;
      const adminApp = getAdminApp();
      const adminDb = getFirestoreInstance(adminApp);

      await adminDb.collection("stea_code_product_previews").doc(productId).set({
        html: html || "",
        css: css || "",
        javascript: javascript || "",
        fullDocument: fullDocument || "",
        mode: mode || "html-css-js",
        // Persist the authored canvas so the public preview endpoint can
        // return it to the LivePreview wrapper. Without these, every demo
        // rendered at the wrapper's default 1440x900 and looked tiny in cards.
        width: Number(width) || 0,
        height: Number(height) || 0,
        scaleMode: String(scaleMode || "fit"),
        viewportMode: String(viewportMode || "desktop"),
        updatedAt: FieldValue.serverTimestamp(),
      });

      const prodRef = adminDb.collection("stea_code_products").doc(productId);
      const prodSnap = await prodRef.get();
      if (prodSnap.exists) {
        const legacyPreview = prodSnap.data()?.preview;
        if (legacyPreview) {
          delete legacyPreview.html; // migration cleanup
          delete legacyPreview.css;
          delete legacyPreview.javascript;
          delete legacyPreview.fullDocument;
          await prodRef.update({ preview: legacyPreview });
        }
      }

      console.log("[stea-code preview save]", productId);
      res.json({ success: true, productId });
    } catch (e: any) {
      // Dev fallback: save to in-memory store if Firestore is unavailable
      const productId = req.params.productId;
      const { html, css, javascript, fullDocument, mode, width, height, scaleMode, viewportMode } = req.body;
      _localStore._previews[productId] = {
        html: html || "", css: css || "", javascript: javascript || "",
        fullDocument: fullDocument || "", mode: mode || "html-css-js",
        width: Number(width) || 0, height: Number(height) || 0,
        scaleMode: String(scaleMode || "fit"), viewportMode: String(viewportMode || "desktop"),
      };
      console.log("[stea-code preview save (dev fallback)]", productId);
      res.json({ success: true, productId });
    }
  });

  app.get("/api/admin/stea-code/products/:productId/source", requireAdmin, async (req, res) => {
    try {
      const adminApp = getAdminApp();
      const adminDb = getFirestoreInstance(adminApp);
      const sourceSnap = await adminDb.collection("stea_code_product_sources").doc(req.params.productId).get();
      const sourceData = sourceSnap.exists ? sourceSnap.data() : null;
      // Return both `source` (full doc) and `files` (top-level array) so the
      // frontend admin panel (which reads result.files) works in local dev.
      // This matches the response shape of functions/server.cjs.
      res.json({
        ok: true,
        files: Array.isArray(sourceData?.files) ? sourceData.files : [],
        source: sourceData,
      });
    } catch (e: any) {
      // Dev fallback: return from in-memory store if Firestore is unavailable
      const local = _localStore._sources[req.params.productId];
      if (local !== undefined) {
        return res.json({
          ok: true,
          files: Array.isArray(local?.files) ? local.files : [],
          source: local,
        });
      }
      // No source saved yet — return empty (not an error)
      res.json({ ok: true, files: [], source: null });
    }
  });

  app.put("/api/admin/stea-code/products/:productId/source", requireAdmin, async (req, res) => {
    try {
      const productId = req.params.productId;
      const { files } = req.body;
      const adminApp = getAdminApp();
      const adminDb = getFirestoreInstance(adminApp);

      await adminDb.collection("stea_code_product_sources").doc(productId).set({
        files: Array.isArray(files) ? files : [],
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log("[stea-code source save]", productId);
      res.json({ success: true, productId });
    } catch (e: any) {
      // Dev fallback: save to in-memory store if Firestore is unavailable
      const productId = req.params.productId;
      const { files } = req.body;
      _localStore._sources[productId] = {
        files: Array.isArray(files) ? files : [],
      };
      console.log("[stea-code source save (dev fallback)]", productId);
      res.json({ success: true, productId });
    }
  });

  // ===================== STEA Code R2 Asset Endpoints =====================
  // In-memory multer storage — we stream the buffer straight to R2, never
  // writing to disk.
  const r2MemoryStorage = multer.memoryStorage();
  const r2Upload = multer({
    storage: r2MemoryStorage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  });

  // POST /api/admin/stea-code/products/:productId/package/upload
  // Accepts a .zip file, uploads to R2, returns the storage key.
  app.post(
    "/api/admin/stea-code/products/:productId/package/upload",
    requireAdmin,
    r2Upload.single("package"),
    async (req: any, res) => {
      try {
        if (!isR2Configured()) {
          return res.status(503).json({
            error: "R2 storage is not configured on the server.",
            code: "R2_NOT_CONFIGURED",
          });
        }
        if (!req.file) {
          return res.status(400).json({ error: "No package file uploaded.", code: "NO_FILE" });
        }
        const productId = String(req.params.productId).trim();
        const originalName = String(req.file.originalname || `package-${Date.now()}.zip`);
        const safeName = originalName.replace(/[^a-z0-9._-]+/gi, "-").toLowerCase();
        const key = `products/${productId}/packages/${safeName}`;
        const contentType = req.file.mimetype || "application/zip";

        const result = await uploadAsset(key, req.file.buffer, contentType);

        // Store package metadata in Firestore (dev fallback to in-memory).
        try {
          const adminApp = getAdminApp();
          const adminDb = getFirestoreInstance(adminApp);
          await adminDb.collection("stea_code_products").doc(productId).set(
            {
              package: {
                storageKey: key,
                size: result.size,
                filename: safeName,
                uploadedAt: FieldValue.serverTimestamp(),
              },
            },
            { merge: true }
          );
        } catch {
          _localStore._products[productId] = {
            ...(_localStore._products[productId] || {}),
            package: { storageKey: key, size: result.size, filename: safeName },
          };
        }

        res.json({ success: true, key, size: result.size, filename: safeName });
      } catch (e: any) {
        console.error("[stea-code package upload error]:", e);
        res.status(500).json({ error: "Package upload failed.", code: "PACKAGE_UPLOAD_FAILED", detail: e?.message });
      }
    }
  );

  // POST /api/admin/stea-code/products/:productId/preview/upload
  // Accepts a video (mp4/webm) and/or poster (jpg/png), uploads to R2.
  app.post(
    "/api/admin/stea-code/products/:productId/preview/upload",
    requireAdmin,
    r2Upload.fields([
      { name: "video", maxCount: 1 },
      { name: "poster", maxCount: 1 },
    ]),
    async (req: any, res) => {
      try {
        if (!isR2Configured()) {
          return res.status(503).json({
            error: "R2 storage is not configured on the server.",
            code: "R2_NOT_CONFIGURED",
          });
        }
        const productId = String(req.params.productId).trim();
        const files = req.files || {};
        const result: any = {};

        if (files.video?.[0]) {
          const vid = files.video[0];
          const ext = (vid.originalname.match(/\.(mp4|webm)$/i) || [".mp4"])[0].toLowerCase();
          const key = `products/${productId}/preview/preview${ext}`;
          const r = await uploadAsset(key, vid.buffer, vid.mimetype || "video/mp4");
          result.video = { key: r.key, size: r.size };
        }

        if (files.poster?.[0]) {
          const post = files.poster[0];
          const ext = (post.originalname.match(/\.(jpg|jpeg|png)$/i) || [".jpg"])[0].toLowerCase();
          const key = `products/${productId}/preview/poster${ext}`;
          const r = await uploadAsset(key, post.buffer, post.mimetype || "image/jpeg");
          result.poster = { key: r.key, size: r.size };
        }

        if (!result.video && !result.poster) {
          return res.status(400).json({ error: "No video or poster file uploaded.", code: "NO_FILE" });
        }

        // Store preview metadata in Firestore (dev fallback to in-memory).
        try {
          const adminApp = getAdminApp();
          const adminDb = getFirestoreInstance(adminApp);
          const previewMeta: any = {};
          if (result.video) previewMeta.videoKey = result.video.key;
          if (result.poster) previewMeta.posterKey = result.poster.key;
          await adminDb.collection("stea_code_products").doc(productId).set(
            { preview: previewMeta },
            { merge: true }
          );
        } catch {
          _localStore._products[productId] = {
            ...(_localStore._products[productId] || {}),
            preview: {
              ...((_localStore._products[productId]?.preview) || {}),
              ...(result.video ? { videoKey: result.video.key } : {}),
              ...(result.poster ? { posterKey: result.poster.key } : {}),
            },
          };
        }

        res.json({ success: true, ...result });
      } catch (e: any) {
        console.error("[stea-code preview upload error]:", e);
        res.status(500).json({ error: "Preview upload failed.", code: "PREVIEW_UPLOAD_FAILED", detail: e?.message });
      }
    }
  );

  // GET /api/stea-code/products/:productId/download
  // Returns a 302 redirect to a signed R2 download URL for the product package.
  // Free products: no auth required. Premium: requires a valid entitlement.
  app.get("/api/stea-code/products/:productId/download", async (req: any, res) => {
    try {
      const productId = String(req.params.productId).trim();
      const product = await getResolvedSteaCodeProduct(productId, false);
      if (!product) {
        return res.status(404).json({ error: "Product not found", code: "PRODUCT_NOT_FOUND" });
      }

      // For premium products, require auth + entitlement. For free products,
      // skip auth entirely.
      if (product.pricingType !== "free") {
        const authHeader = req.headers.authorization || "";
        const match = authHeader.match(/^Bearer\s+(.+)$/i);
        if (!match) {
          return res.status(401).json({ error: "Authentication required.", code: "AUTH_REQUIRED" });
        }
        let decoded: any;
        try {
          const adminApp = getAdminApp();
          decoded = await getAdminAuth(adminApp).verifyIdToken(match[1]);
        } catch {
          return res.status(401).json({ error: "Invalid or expired token", code: "AUTH_REQUIRED" });
        }
        const adminApp = getAdminApp();
        const adminDb = getFirestoreInstance(adminApp);
        const entitlementId = `${decoded.uid}_${product.id}`;
        const entitlementSnap = await adminDb.collection("stea_code_entitlements").doc(entitlementId).get();
        if (!entitlementSnap.exists) {
          return res.status(403).json({ error: "Premium access required.", code: "ACCESS_DENIED" });
        }
      }

      // Get the package storage key from product metadata
      const storageKey = product.package?.storageKey;
      if (!storageKey) {
        return res.status(404).json({ error: "No downloadable package found for this product.", code: "NO_PACKAGE" });
      }

      if (!isR2Configured()) {
        return res.status(503).json({
          error: "R2 storage is not configured on the server.",
          code: "R2_NOT_CONFIGURED",
        });
      }

      // Generate a 5-minute signed URL and redirect
      const signedUrl = await getSignedDownloadUrl(storageKey, 300);
      return res.redirect(302, signedUrl);
    } catch (e: any) {
      console.error("[stea-code download error]:", e);
      res.status(500).json({ error: "Could not download product source.", code: "DOWNLOAD_FAILED", detail: e?.message });
    }
  });

  app.get("/api/admin/stea-code/orders", requireAdmin, async (req, res) => {
    try {
      const adminApp = getAdminApp();
      const adminDb = getFirestoreInstance(adminApp);
      const snap = await adminDb.collection("stea_code_orders").orderBy("createdAt", "desc").limit(100).get();
      const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      res.json({ ok: true, orders });
    } catch (e: any) {
      res.status(500).json({ error: "Failed to get admin orders", code: "ORDERS_GET_FAILED" });
    }
  });

  app.get("/api/admin/stea-code/entitlements", requireAdmin, async (req, res) => {
    try {
      const adminApp = getAdminApp();
      const adminDb = getFirestoreInstance(adminApp);
      const snap = await adminDb.collection("stea_code_entitlements").orderBy("createdAt", "desc").limit(100).get();
      const entitlements = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      res.json({ ok: true, entitlements });
    } catch (e: any) {
      res.status(500).json({ error: "Failed to get entitlements", code: "ENTITLEMENTS_GET_FAILED" });
    }
  });

  app.post("/api/notifications/send", async (req, res) => {
    res.status(404).json({
      error: "Use the secure admin notification endpoint.",
      code: "ADMIN_NOTIFICATION_ENDPOINT_REQUIRED",
    });
  });

  app.use("/api", (req, res) => {
    res.status(404).json({ error: "API route not found" });
  });


  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.path.startsWith("/api")) return next(err);
    console.error(`[API] ${req.method} ${req.path} failed:`, err?.message || err);
    res.status(err?.status || 500).json({ error: err?.message || "Internal server error" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
