// ═══════════════════════════════════════════════════════════════════════════
// STEA Africa — DEV-only Firestore emulator integration.
// ═══════════════════════════════════════════════════════════════════════════
//
// COMPILE-TIME LIFETIME GUARANTEE:
// This file is ONLY loaded via a dynamic import() inside src/firebase.js:
//
//     if (import.meta.env.DEV) await import('./firebase.emulator.dev-only.js');
//
// In production builds `import.meta.env.DEV === false`. The entire `if`
// body is dead code, Rollup/Vite drops the dynamic import, and this whole
// module is excluded from the final bundle. The production dist therefore
// contains ZERO code / strings / exports originating here.
//
// DO NOT statically import this file from anywhere that's reachable in a
// production build tree.
// ═══════════════════════════════════════════════════════════════════════════

import { connectFirestoreEmulator } from "firebase/firestore";

/**
 * Run once immediately after the browser Firestore `db` instance exists.
 *
 * Side effects (DEV only — never happens in production):
 *   1. Sets window.__STEA_FIRESTORE_EMULATOR_CONNECTED__ connect-once flag
 *   2. Wires connectFirestoreEmulator(db, host, port)
 *   3. Console golden banner → admin sees emulator is active
 *   4. Red firewall console error + soft-fail flag if expected-but-missing
 *
 * Returns a small snapshot used by Admin UI badge + write-action guards.
 */
export function wireLocalFirebaseEmulatorOnce({ app, db, /* auth unused by strategy B */ }) {
  if (typeof window === "undefined") {
    return {
      usesFirestoreEmulator: true,
      localFirestoreExpected: false,
      firestoreEmulatorConnected: false,
      emulatorEndpoint: null,
    };
  }

  const hostname = window.location.hostname;
  const expected = hostname === "localhost" || hostname === "127.0.0.1";
  let connected = false;

  if (expected && !window.__STEA_FIRESTORE_EMULATOR_CONNECTED__) {
    window.__STEA_FIRESTORE_EMULATOR_CONNECTED__ = true;
    try {
      connectFirestoreEmulator(db, "127.0.0.1", 8080);
      connected = true;
      // eslint-disable-next-line no-console
      console.log(
        "%c[Firebase] DEV localhost → Firestore emulator 127.0.0.1:8080",
        "background:#f5a623;color:#000;padding:2px 6px;border-radius:3px;font-weight:700"
      );
    } catch (e) {
      const m = String(e?.message || "");
      if (m.includes("already set") || m.includes("already")) {
        connected = true;
        // eslint-disable-next-line no-console
        console.log("[Firebase] Emulator already connected — skipping duplicate connect.");
      } else {
        // eslint-disable-next-line no-console
        console.error("[Firebase] Failed to connect Firestore emulator:", m);
      }
    }
  } else if (expected && window.__STEA_FIRESTORE_EMULATOR_CONNECTED__) {
    connected = true;
  }

  if (expected && !connected) {
    // eslint-disable-next-line no-console
    console.error(
      "%c[FIREWALL] Local Firestore emulator is not connected. Production writes are BLOCKED in development.",
      "background:#dc2626;color:#fff;padding:4px 8px;border-radius:4px;font-weight:800"
    );
    window.__STEA_FIRESTORE_SOFT_FAIL__ = true;
  }

  return {
    usesFirestoreEmulator: true,
    localFirestoreExpected: expected,
    firestoreEmulatorConnected: connected,
    emulatorEndpoint: expected ? "127.0.0.1:8080" : null,
  };
}

/**
 * POINT 8 firewall guard for write actions. Called by steaCodeAdmin.js
 * before every POST/PATCH/PUT/DELETE Admin API request.
 *
 * Production build: this function is never loaded (module not imported).
 * steaCodeAdmin.js already checks import.meta.env.DEV before calling into
 * this helper, so production code paths are 100% isolated.
 */
export function assertLocalFirestoreConnectedOnDev(snapshot, label = "") {
  if (!snapshot) return;
  if (!snapshot.localFirestoreExpected) return;
  if (!snapshot.firestoreEmulatorConnected) {
    throw new Error(
      `Local Firestore emulator is not connected. Production writes are blocked in development. (${label})`
    );
  }
}

/**
 * Client wrapper used by Admin app topbar LOCAL FIRESTORE banner.
 * Returns the snapshot memoized from initial wiring. Same as writing
 * `snapshot` directly — but having a single export keeps the API stable.
 */
export function getFirebaseDevModeSnapshot(snapshot) {
  return snapshot || {
    usesFirestoreEmulator: false,
    localFirestoreExpected: false,
    firestoreEmulatorConnected: false,
    emulatorEndpoint: null,
  };
}

// Keep connectAuthEmulator importable and callable but intentionally NOT
// wired by default. Strategy B requires REAL Firebase Auth tokens. Admin
// SDK verifyIdToken() on server.ts still runs against the real Firebase
// project — this is by design and what makes admin login authoritative
// without needing fake tokens or a local users collection.
export { /* connectAuthEmulator intentionally unused in Strategy B */ };
