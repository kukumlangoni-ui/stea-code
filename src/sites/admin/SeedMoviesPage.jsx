import { useState, useEffect, useMemo } from "react";
import { getFirebaseDb, collection, getDocs, addDoc, query, where, serverTimestamp } from "../../firebase.js";
import seedMovieSites from "../../data/seedMovieSites.js";

const CATEGORY = "Movies & TV Shows";
const CATEGORY_SLUG = "movies-tv-shows";

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return url || "";
  }
}

// Translate Firebase error codes into safe, actionable admin-facing messages.
function friendlyError(code, message) {
  switch (code) {
    case "permission-denied":
      return "Permission denied — your admin session is not authorized to write to the websites collection. Sign in as an admin/editor/manager.";
    case "unauthenticated":
      return "Not authenticated — your session expired. Please sign in again as an admin.";
    case "unauthorized":
      return "Unauthorized — this account does not have admin/editor/manager role.";
    case "invalid-argument":
      return `Invalid argument — ${message || "check the document fields."}`;
    case "failed-precondition":
      return "Failed precondition — the Firestore rules rejected this write (check required fields like category).";
    default:
      return `${code} — ${message || "unknown error"}`;
  }
}

const PRICING_LABEL = {
  paid: "PAID",
  free: "FREE",
  freemium: "FREEMIUM",
  "ad-supported": "AD-SUPPORTED",
  "rental-purchase": "RENTAL",
  unknown: "UNKNOWN",
};

const STATUS_LABEL = {
  official: "OFFICIAL",
  verified: "VERIFIED",
  unverified: "UNVERIFIED",
  unofficial: "UNOFFICIAL",
};

const STATUS_COLOR = {
  official: "#48bb78",
  verified: "#4299e1",
  unverified: "#d69e2e",
  unofficial: "#f56565",
};

export default function SeedMoviesPage() {
  const [existingDomains, setExistingDomains] = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [approved, setApproved] = useState(false);
  const [importing, setImporting] = useState(false);
  const [log, setLog] = useState([]);

  const addLog = (msg) => setLog((prev) => [...prev, msg]);

  // Load existing website domains for dedup
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const db = getFirebaseDb();
        const q = query(collection(db, "websites"), where("categorySlug", "==", CATEGORY_SLUG));
        const snap = await getDocs(q);
        const domains = new Set();
        snap.forEach((doc) => {
          const d = (doc.data().domain || doc.data().hostname || "").toLowerCase().replace(/^www\./i, "");
          if (d) domains.add(d);
        });
        if (!cancelled) {
          setExistingDomains([...domains]);
          setLoadingExisting(false);
        }
      } catch (e) {
        if (!cancelled) {
          const code = e?.code || "unknown";
          console.error("[seed-movies] Failed to load existing sites:", { code, message: e.message });
          addLog(`Failed to load existing sites: ${friendlyError(code, e.message)}`);
          setLoadingExisting(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Build reviewed list with classification
  const reviewed = useMemo(() => {
    const existingSet = new Set(existingDomains);
    return seedMovieSites.map((site, idx) => {
      const domain = getDomain(site.url);
      const exists = existingSet.has(domain);
      return {
        idx: idx + 1,
        name: site.name,
        domain,
        url: site.url,
        pricingType: site.pricingType || "unknown",
        sourceStatus: site.sourceStatus || "unverified",
        exists,
        action: exists ? "SKIP" : "NEW",
      };
    });
  }, [existingDomains]);

  const newCount = reviewed.filter((r) => !r.exists).length;
  const skipCount = reviewed.filter((r) => r.exists).length;
  const canImport = approved && newCount > 0 && !importing && !loadingExisting;

  const handleImport = async () => {
    if (!canImport) return;
    setImporting(true);
    setLog([]);
    const db = getFirebaseDb();

    // Re-fetch for fresh dedup
    const existingSet = new Set(existingDomains);
    try {
      const q = query(collection(db, "websites"), where("categorySlug", "==", CATEGORY_SLUG));
      const snap = await getDocs(q);
      snap.forEach((doc) => {
        const d = (doc.data().domain || doc.data().hostname || "").toLowerCase().replace(/^www\./i, "");
        if (d) existingSet.add(d);
      });
    } catch (e) {
      const code = e?.code || "unknown";
      console.error("[seed-movies] Re-fetch existing domains failed:", { code, message: e.message });
      addLog(`Error fetching existing domains: ${friendlyError(code, e.message)}`);
      setImporting(false);
      return;
    }

    let added = 0;
    let skipped = 0;
    let failed = 0;

    for (const site of seedMovieSites) {
      const domain = getDomain(site.url);
      if (existingSet.has(domain)) {
        skipped++;
        addLog(`⏭ Skip (exists): ${site.name} (${domain})`);
        continue;
      }

      const payload = {
        name: site.name,
        title: site.name,
        url: site.url,
        normalizedUrl: site.url,
        link: site.url,
        websiteUrl: site.url,
        mainUrl: site.url,
        domain,
        hostname: domain,
        category: CATEGORY,
        categoryName: CATEGORY,
        categorySlug: CATEGORY_SLUG,
        subcategory: "",
        subCategory: "",
        subcategorySlug: "",
        subCategorySlug: "",
        description: site.description,
        summary: site.description,
        status: "published",
        published: true,
        active: true,
        isAdult: false,
        is_adult: false,
        safetyRating: "Unknown",
        pricing: site.pricing || "Free",
        pricingType: site.pricingType || "unknown",
        sourceStatus: site.sourceStatus || "unverified",
        mobileFriendly: true,
        mirrorUrl: "",
        tags: site.tags && site.tags.length ? site.tags : ["movies", "tv shows", "streaming"],
        appDownloads: { playStore: "", appStore: "", windows: "", mac: "", linux: "" },
        platforms: [],
        downloadLinks: [],
        visits: 0,
        favoritesCount: 0,
        clicks: 0,
        source: "seed_movies_import",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        await addDoc(collection(db, "websites"), payload);
        existingSet.add(domain);
        added++;
        addLog(`✅ Added: ${site.name} (${domain})`);
      } catch (e) {
        failed++;
        const code = e?.code || "unknown";
        const friendly = friendlyError(code, e.message);
        // Log precise error to browser console for diagnosis
        console.error("[seed-movies] Firestore write failed:", { name: site.name, domain, code, message: e.message });
        addLog(`❌ Failed: ${site.name} (${domain}) — ${friendly}`);
      }
    }

    addLog(`\nDone. Added: ${added} | Skipped: ${skipped} | Failed: ${failed}`);
    setImporting(false);
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Seed Movies &amp; TV Sites</h1>
      <p style={styles.subtitle}>
        Review every entry below. Existing domains are auto-skipped. Import only publishes entries you approve.
      </p>

      {/* Summary */}
      <div style={styles.summaryRow}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryNum}>{reviewed.length}</div>
          <div style={styles.summaryLabel}>Total in catalog</div>
        </div>
        <div style={{ ...styles.summaryCard, borderColor: "rgba(72,187,120,0.4)" }}>
          <div style={{ ...styles.summaryNum, color: "#48bb78" }}>{newCount}</div>
          <div style={styles.summaryLabel}>New (will import)</div>
        </div>
        <div style={{ ...styles.summaryCard, borderColor: "rgba(148,163,184,0.4)" }}>
          <div style={{ ...styles.summaryNum, color: "#94a3b8" }}>{skipCount}</div>
          <div style={styles.summaryLabel}>Exists (will skip)</div>
        </div>
      </div>

      {/* Review Table */}
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Domain</th>
              <th style={styles.th}>Pricing</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {reviewed.map((r) => (
              <tr key={r.domain + r.name} style={r.exists ? styles.rowSkip : styles.rowNew}>
                <td style={styles.td}>{r.idx}</td>
                <td style={styles.td}>{r.name}</td>
                <td style={{ ...styles.td, fontFamily: "monospace", fontSize: 12 }}>{r.domain}</td>
                <td style={styles.td}>
                  <span style={styles.badge}>{PRICING_LABEL[r.pricingType] || r.pricingType}</span>
                </td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, color: STATUS_COLOR[r.sourceStatus] || "#94a3b8", borderColor: STATUS_COLOR[r.sourceStatus] ? `${STATUS_COLOR[r.sourceStatus]}55` : "rgba(255,255,255,0.15)" }}>
                    {STATUS_LABEL[r.sourceStatus] || r.sourceStatus}
                  </span>
                </td>
                <td style={styles.td}>
                  {r.exists ? (
                    <span style={{ color: "#94a3b8", fontSize: 12 }}>SKIP</span>
                  ) : (
                    <span style={{ color: "#48bb78", fontSize: 12, fontWeight: 600 }}>NEW</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Approval + Import */}
      <div style={styles.approveBox}>
        <label style={styles.approveLabel}>
          <input
            type="checkbox"
            checked={approved}
            onChange={(e) => setApproved(e.target.checked)}
            disabled={importing || loadingExisting}
            style={styles.checkbox}
          />
          I have reviewed all {reviewed.length} entries above and approve importing the {newCount} new site{newCount !== 1 ? "s" : ""}.
        </label>
        <button
          onClick={handleImport}
          disabled={!canImport}
          style={{ ...styles.importBtn, opacity: canImport ? 1 : 0.4, cursor: canImport ? "pointer" : "not-allowed" }}
        >
          {importing ? "Importing…" : `Import ${newCount} New Site${newCount !== 1 ? "s" : ""}`}
        </button>
      </div>

      {/* Import Log */}
      {log.length > 0 && (
        <pre style={styles.log}>
{log.join("\n")}
        </pre>
      )}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "32px 24px 80px",
    fontFamily: "'Instrument Sans', system-ui, sans-serif",
    color: "#fff",
    background: "#0a0b10",
    minHeight: "100vh",
  },
  title: { fontSize: 24, marginBottom: 6, fontWeight: 700 },
  subtitle: { color: "#9ca3af", marginBottom: 24, fontSize: 14, lineHeight: 1.5 },
  summaryRow: { display: "flex", gap: 14, marginBottom: 24 },
  summaryCard: {
    flex: 1,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "16px 20px",
    textAlign: "center",
  },
  summaryNum: { fontSize: 32, fontWeight: 800, lineHeight: 1, marginBottom: 4 },
  summaryLabel: { fontSize: 12, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" },
  tableWrap: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    textAlign: "left",
    padding: "12px 14px",
    background: "rgba(255,255,255,0.04)",
    color: "#9ca3af",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: 600,
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  td: { padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  rowNew: {},
  rowSkip: { opacity: 0.45 },
  badge: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: 10,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.03em",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
  },
  approveBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    background: "rgba(124,58,237,0.06)",
    border: "1px solid rgba(124,58,237,0.25)",
    borderRadius: 12,
    padding: "16px 20px",
    marginBottom: 24,
  },
  approveLabel: { display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer" },
  checkbox: { width: 16, height: 16, accentColor: "#7C3AED" },
  importBtn: {
    background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
    border: "none",
    color: "#fff",
    padding: "11px 26px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  log: {
    background: "#11131b",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: 16,
    fontSize: 12,
    overflowX: "auto",
    maxHeight: 420,
    overflowY: "auto",
    whiteSpace: "pre-wrap",
    lineHeight: 1.6,
  },
};
