import { useEffect, useState } from "react";
import { Database } from "lucide-react";

/**
 * LOCAL FIRESTORE admin status badge.
 *
 * ⚠️ Production build safety:
 *
 *   • The parent shell only mounts us if `import.meta.env.DEV` is true.
 *     Vite replaces that literal with FALSE in production builds, so
 *     <LocalFirestoreBadge /> is never rendered AND the component body
 *     JSX here is dead-code eliminated.
 *
 *   • Just to be safe the component body itself ALSO starts with an
 *     early `if (!import.meta.env.DEV)` bail — this eliminates every
 *     one of our literal strings ("LOCAL FIRESTORE", "FIRESTORE
 *     EMULATOR MISSING", endpoint text) from production dist output.
 *
 *   • The snapshot is fetched by DYNAMIC import(...) inside the
 *     useEffect; Rollup drops that import when import.meta.env.DEV is
 *     FALSE, so the firebase.emulator.dev-only.js module isn't even
 *     listed as a chunk dependency in production.
 */
export default function LocalFirestoreBadge() {
  // FIRST: Dead-code eliminate everything in prod
  if (!import.meta.env.DEV) {
    return null;
  }

  // Everything below only exists in dev builds.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [snap, setSnap] = useState(null);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    let alive = true;
    import("../firebase.emulator.dev-only.js")
      .then((mod) => {
        if (!alive) return;
        // Fetch initial state
        setSnap(mod.getFirebaseDevModeSnapshot(null));
        // After wiring promise resolves, refresh once. The ready helper is
        // intentionally private to dev builds and exposed through a window
        // side-channel, not the firebase.js export table.
        const ready =
          window.__STEA_DEV_FIRESTORE_INTERNALS__?.readyPromise?.() ||
          Promise.resolve();
        if (ready && typeof ready.then === "function") {
          ready.then(() => {
            if (!alive) return;
            setSnap(mod.getFirebaseDevModeSnapshot(null));
          });
        }
      })
      .catch((e) => {
        console.error("[LocalFirestoreBadge] failed to load emulator module:", e);
      });
    return () => { alive = false; };
  }, []);

  if (!snap || !snap.usesFirestoreEmulator || !snap.localFirestoreExpected) {
    return null;
  }

  const ok = Boolean(snap.firestoreEmulatorConnected);
  return (
    <div
      role="status"
      className={
        "sca-admin-banner sca-admin-banner--stable " +
        (ok ? "" : " sca-admin-banner--error")
      }
      style={ok
        ? { background: "linear-gradient(90deg,#f5a623 0%,#f7b955 100%)", color: "#0c0a01", fontWeight: 800, border: "1px solid #c2841a" }
        : {}}
    >
      <div className="sca-admin-banner-left">
        <Database size={16} />
        <span>
          {ok
            ? `LOCAL FIRESTORE — All product data writes go to the emulator at ${snap.emulatorEndpoint}. Production is untouched.`
            : "FIRESTORE EMULATOR MISSING — Writes are blocked. Start: npm run emulator:firestore and reload this page."}
        </span>
      </div>
    </div>
  );
}
