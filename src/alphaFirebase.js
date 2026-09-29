import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { firebaseConfig as steaFirebaseConfig } from "../firebaseConfig.js";

export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  signOut,
} from "firebase/auth";
export {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
export {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

const alphaFirebaseConfig = {
  apiKey: import.meta.env.VITE_ALPHA_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_ALPHA_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_ALPHA_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_ALPHA_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_ALPHA_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_ALPHA_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_ALPHA_FIREBASE_MEASUREMENT_ID,
};

const requiredConfig = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"];
const missingConfig = requiredConfig.filter((key) => !alphaFirebaseConfig[key]);

export const isDedicatedAlphaFirebaseConfigured = missingConfig.length === 0;
const effectiveConfig = isDedicatedAlphaFirebaseConfigured ? alphaFirebaseConfig : steaFirebaseConfig;

if (!isDedicatedAlphaFirebaseConfigured) {
  console.warn(`[Alpha Firebase] Dedicated project is not configured; using STEA Firebase temporarily. Missing: ${missingConfig.join(", ")}`);
}

const alphaApp = getApps().find((app) => app.name === "alpha-school-portal")
  || initializeApp(effectiveConfig, "alpha-school-portal");

const alphaAuth = getAuth(alphaApp);
let alphaDb;
try {
  alphaDb = initializeFirestore(alphaApp, {
    ignoreUndefinedProperties: true,
    experimentalForceLongPolling: true,
  });
} catch {
  alphaDb = getFirestore(getApp("alpha-school-portal"));
}
const alphaStorage = getStorage(alphaApp);

export const getFirebaseApp = () => alphaApp;
export const getFirebaseAuth = () => alphaAuth;
export const getFirebaseDb = () => alphaDb;
export const storage = alphaStorage;
