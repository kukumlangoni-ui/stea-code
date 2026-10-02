import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth, GoogleAuthProvider,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, signInWithRedirect, getRedirectResult,
  signOut, onAuthStateChanged, sendPasswordResetEmail,
} from "firebase/auth";
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, setDoc, onSnapshot, query, orderBy, limit,
  serverTimestamp, increment, where, getDocFromServer, runTransaction, writeBatch,
  initializeFirestore, getFirestore, or, getCountFromServer, collectionGroup, arrayUnion, arrayRemove
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";

// Import the Firebase configuration
import { firebaseConfig } from '../firebaseConfig.js';

export const ADMIN_EMAILS = ["stea.africa@gmail.com"];
export const isAdminEmail = (email) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(String(email).trim().toLowerCase());
};
export const ADMIN_EMAIL = ADMIN_EMAILS[0]; // Keep for backward compatibility

export const normalizeEmail = (email) => {
  if (!email) return "";
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes("@")) return `${trimmed}@gmail.com`;
  return trimmed;
};

// ── Init (safe, runs once) ────────────────────────────
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const databaseId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

// Simple initialization: use named database if provided by the applet environment
let db;
try {
  // Use robust settings for stability in restricted environments
  db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
    experimentalForceLongPolling: true
  }, databaseId);
  console.log(`[Firebase] Initialized Firestore with dbId: ${databaseId || "(default)"} (with forceLongPolling)`);
} catch (e) {
  // If already initialized (common during hot-module-replacement in dev), use getFirestore
  db = getFirestore(app, databaseId);
  console.log(`[Firebase] Using existing Firestore instance for dbId: ${databaseId || "(default)"}`);
}
const storage = getStorage(app);
// Set reasonable retry limits to avoid long-hanging operations that eventually fail
// storage.maxRetryTime is for individual retries, maxOperationRetryTime is for the whole op.
storage.maxRetryTime = 30000; // 30 seconds
storage.maxOperationRetryTime = 30000;

const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

function installStorageRequestTracer() {
  if (typeof window === "undefined" || typeof XMLHttpRequest === "undefined") return;
  if (window.__STEA_STORAGE_XHR_TRACER__) return;
  window.__STEA_STORAGE_XHR_TRACER__ = true;

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function tracedOpen(method, url, ...rest) {
    this.__steaStorageTrace = {
      method,
      url: String(url || ""),
      startedAt: Date.now(),
    };
    return originalOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function tracedSend(body) {
    const trace = this.__steaStorageTrace;
    const shouldTrace = trace?.url?.includes("firebasestorage.googleapis.com");
    if (shouldTrace) {
      console.log("[storage request]", {
        method: trace.method,
        url: trace.url,
        bucket: app.options.storageBucket,
        projectId: app.options.projectId,
        bodyType: body?.constructor?.name || typeof body,
      });
      this.addEventListener("loadend", () => {
        console.log("[storage response]", {
          method: trace.method,
          url: trace.url,
          status: this.status,
          statusText: this.statusText,
          durationMs: Date.now() - trace.startedAt,
          responseText: this.responseText,
        });
      });
    }
    return originalSend.call(this, body);
  };
}

installStorageRequestTracer();

// Messaging: lazy init to avoid crash on Safari/Firefox
let _messaging = null;
export const getMessagingInstance = async () => {
  if (_messaging) return _messaging;
  try {
    if (!("Notification" in window) || !navigator.serviceWorker) return null;
    const { getMessaging } = await import("firebase/messaging");
    _messaging = getMessaging(app);
    return _messaging;
  } catch { return null; }
};

export { app, auth, db, storage, analytics, GoogleAuthProvider };
export {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, signInWithRedirect, getRedirectResult,
  signOut, onAuthStateChanged, sendPasswordResetEmail,
};
export {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, setDoc, onSnapshot, query, orderBy, limit,
  serverTimestamp, increment, where, getDocFromServer, runTransaction, or, getCountFromServer, collectionGroup, arrayUnion, arrayRemove, writeBatch,
  initializeFirestore, getFirestore
};
export { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject };

export const getFirebaseApp = () => app;

export function logStorageUpload(uploadPath) {
  console.log("PROJECT:", app.options.projectId);
  console.log("BUCKET:", app.options.storageBucket);
  console.log("UPLOAD PATH:", uploadPath);
}

export function logFirebaseStorageError(error) {
  console.error(error);
  console.error(error?.code);
  console.error(error?.message);
  console.error(error?.serverResponse || error?.customData?.serverResponse || null);
}

export function getExactStorageErrorMessage(error) {
  const code = error?.code || "storage/unknown";
  const message = error?.message || "Firebase Storage upload failed.";
  return `${code}: ${message}`;
}

/**
 * Uploads a file to Firebase Storage and returns its download URL.
 * @param {File} file The file to upload.
 * @param {string} path The storage path (e.g., 'products/image.jpg').
 * @returns {Promise<string>} The download URL.
 */
export const uploadToStorage = async (file, path) => {
  if (!file) throw new Error("No file selected.");
  try {
    logStorageUpload(path);
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return url;
  } catch (error) {
    handleStorageError(error);
  }
};


export const handleStorageError = (error) => {
  const code = error.code || "unknown";
  logFirebaseStorageError(error);
  console.error(`[storage error] ${code}:`, error);
  if (code === "storage/retry-limit-exceeded") {
    throw new Error(getExactStorageErrorMessage(error));
  }
  if (code === "storage/unauthorized") {
    throw new Error(getExactStorageErrorMessage(error));
  }
  if (code === "storage/quota-exceeded") {
    throw new Error(getExactStorageErrorMessage(error));
  }
  throw error;
};


// Compat helpers
export const initFirebase = () => ({ auth, db });
export const getFirebaseAuth = () => auth;
export const getFirebaseDb = () => db;

export const OperationType = {
  CREATE: "create", UPDATE: "update", DELETE: "delete",
  LIST: "list", GET: "get", WRITE: "write",
};

function safeStringify(obj) {
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (cache.has(value)) return;
      cache.add(value);
    }
    return value;
  });
}

export function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    code: error.code || "unknown",
    authInfo: {
      userId: auth.currentUser?.uid, 
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType, path,
  };
  
  // Log the error for diagnostic purposes
  console.error(`[firestore error] ${operationType} on ${path}:`, safeStringify(errInfo));

  // Only throw for critical write operations or specific user data fetches
  // Public settings and FAQs should fail gracefully to avoid app-breaking crashes
  const isPublicPath = path && (
    path.startsWith("site_settings") || 
    path.startsWith("faqs") || 
    path.startsWith("chaba_payment_methods") || 
    path.startsWith("chaba_products") ||
    path.startsWith("necta_results") ||
    path.startsWith("sponsored") ||
    path.startsWith("updates") ||
    path.startsWith("news") ||
    path.startsWith("tips")
  );
  const isReadOp = operationType === OperationType.GET || operationType === OperationType.LIST;

  if (isPublicPath && isReadOp) {
    return null; // Silently fail for public read operations
  }

  throw new Error(safeStringify(errInfo));
}

// ── Connection Test ──────────────────────────────────
export async function testConnection() {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      console.log(`Testing Firestore connection (Attempt ${attempts + 1}/${maxAttempts})...`);
      // Attempt to fetch a non-existent doc from server to verify config
      await getDocFromServer(doc(db, "_connection_test_", "ping"));
      console.log("Firestore connection verified.");
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes("Missing or insufficient permissions")) {
        console.log("Firestore connection verified (permission denied, but server reached).");
        return true;
      }

      attempts++;
      console.error(`Firestore Connection Test Attempt ${attempts} failed:`, error);
      
      if (error instanceof Error && error.message.includes("the client is offline")) {
        if (attempts < maxAttempts) {
          console.log("Retrying in 2 seconds...");
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        console.error("CRITICAL: Firestore is offline. This usually means the Firebase configuration is incorrect or the project needs to be re-provisioned.");
        return false;
      }
      // Other errors mean we reached the server
      return true;
    }
  }
  return false;
}
