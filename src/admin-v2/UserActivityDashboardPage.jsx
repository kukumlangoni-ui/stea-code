import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownCircle,
  CheckCircle,
  Copy,
  Download,
  ExternalLink,
  Flame,
  Globe,
  HelpCircle,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import {
  db,
  getFirebaseDb,
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  limit,
  getCountFromServer,
  getDocs,
} from "../firebase.js";

function formatTimestamp(ts) {
  if (!ts) return "—";
  try {
    if (ts.toDate && typeof ts.toDate === "function") {
      return ts.toDate().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }
    if (typeof ts === "number") {
      return new Date(ts).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }
    if (typeof ts === "string") {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      }
    }
  } catch {
    /* fallback */
  }
  return String(ts);
}

export default function UserActivityDashboardPage({ isSuperAdmin, devPreview, baseRoute }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [indexUrl, setIndexUrl] = useState(null);

  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    unverifiedUsers: 0,
    totalDownloads: 0,
    totalCopies: 0,
    anonymousEvents: 0,
  });

  const [topProducts, setTopProducts] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIndexUrl(null);

    const firestoreDb = getFirebaseDb() || db;
    if (!firestoreDb) {
      setError("Firestore database client is not available.");
      setLoading(false);
      return;
    }

    try {
      // 1. Mandatory data access: Firestore aggregate counts (getCountFromServer)
      const usersCol = collection(firestoreDb, "users");
      const verifiedUsersQuery = query(usersCol, where("emailVerified", "==", true));
      const anonEventsCol = collection(firestoreDb, "anonymous_events");
      const downloadsGroupQuery = query(
        collectionGroup(firestoreDb, "events"),
        where("type", "==", "download")
      );
      const copiesGroupQuery = query(
        collectionGroup(firestoreDb, "events"),
        where("type", "==", "copy")
      );

      const [
        totalUsersSnap,
        verifiedUsersSnap,
        anonEventsSnap,
        downloadsSnap,
        copiesSnap,
      ] = await Promise.all([
        getCountFromServer(usersCol).catch((e) => {
          console.warn("[ActivityDashboard] totalUsers count error:", e);
          return { data: () => ({ count: 0 }) };
        }),
        getCountFromServer(verifiedUsersQuery).catch((e) => {
          console.warn("[ActivityDashboard] verifiedUsers count error:", e);
          return { data: () => ({ count: 0 }) };
        }),
        getCountFromServer(anonEventsCol).catch((e) => {
          console.warn("[ActivityDashboard] anonEvents count error:", e);
          return { data: () => ({ count: 0 }) };
        }),
        getCountFromServer(downloadsGroupQuery).catch((e) => {
          console.warn("[ActivityDashboard] downloads count error:", e);
          return { data: () => ({ count: 0 }) };
        }),
        getCountFromServer(copiesGroupQuery).catch((e) => {
          console.warn("[ActivityDashboard] copies count error:", e);
          return { data: () => ({ count: 0 }) };
        }),
      ]);

      const totalUsers = totalUsersSnap.data().count;
      const verifiedUsers = verifiedUsersSnap.data().count;
      const unverifiedUsers = Math.max(0, totalUsers - verifiedUsers);
      const totalDownloads = downloadsSnap.data().count;
      const totalCopies = copiesSnap.data().count;
      const anonymousEvents = anonEventsSnap.data().count;

      setMetrics({
        totalUsers,
        verifiedUsers,
        unverifiedUsers,
        totalDownloads,
        totalCopies,
        anonymousEvents,
      });

      // 2. Mandatory data access: Single collection-group query on events
      const eventsQuery = query(
        collectionGroup(firestoreDb, "events"),
        orderBy("timestamp", "desc"),
        limit(300)
      );

      const eventsSnapshot = await getDocs(eventsQuery);

      const allEvents = eventsSnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const parentUserUid = docSnap.ref.parent?.parent?.id || "";
        return {
          id: docSnap.id,
          email:
            data.email ||
            data.userEmail ||
            (parentUserUid ? `uid:${parentUserUid.slice(0, 8)}…` : "—"),
          product: data.productSlug || data.productId || data.product || "—",
          productId: data.productId || data.productSlug || "—",
          action: data.type || "—",
          timestamp: data.timestamp,
        };
      });

      // Top 10 products by downloads (ranked from the 300 most recent events)
      const downloadCounts = {};
      allEvents
        .filter((ev) => ev.action === "download" && ev.product && ev.product !== "—")
        .forEach((ev) => {
          const key = ev.product;
          downloadCounts[key] = (downloadCounts[key] || 0) + 1;
        });

      const top10 = Object.entries(downloadCounts)
        .map(([product, count]) => ({ product, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setTopProducts(top10);

      // Recent 20 events
      setRecentEvents(allEvents.slice(0, 20));
    } catch (err) {
      console.error("[UserActivityDashboard] Error:", err);
      const msg = err?.message || String(err);
      setError(msg);

      // Surface Firestore missing composite index link if thrown
      const urlMatch = msg.match(/https:\/\/console\.firebase\.google\.com[^\s)\]]+/);
      if (urlMatch) {
        setIndexUrl(urlMatch[0]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div className="sc-activity-page">
      <div className="sc-activity-header">
        <div>
          <div className="sc-activity-eyebrow">Analytics & Telemetry</div>
          <h1 className="sc-activity-title">User Activity Dashboard</h1>
          <p className="sc-activity-subtitle">
            Real-time aggregate counts, user downloads, source copies, and recent telemetry events.
          </p>
        </div>
        <button
          type="button"
          className="sc-activity-refresh-btn"
          onClick={loadDashboardData}
          disabled={loading}
          aria-label="Refresh data"
        >
          <RefreshCw size={15} className={loading ? "sc-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Surface Missing Composite Index error directly on page if thrown */}
      {indexUrl && (
        <div className="sc-activity-alert sc-activity-alert--index" role="alert">
          <div className="sc-activity-alert-icon">
            <ShieldAlert size={22} />
          </div>
          <div className="sc-activity-alert-content">
            <strong>Missing Firestore Composite Index Required</strong>
            <p>
              Firestore requires a composite index on collection group <code>events</code> with{" "}
              <code>timestamp DESC</code>. Click the link below to generate it instantly in Firebase Console:
            </p>
            <div className="sc-activity-alert-actions">
              <a
                href={indexUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sc-activity-index-link"
              >
                <span>Create Index in Firebase Console</span>
                <ExternalLink size={14} />
              </a>
              <button
                type="button"
                className="sc-activity-retry-btn"
                onClick={loadDashboardData}
              >
                Retry after index builds
              </button>
            </div>
            <div className="sc-activity-raw-err">{error}</div>
          </div>
        </div>
      )}

      {/* Surface general error if present and not already shown as index warning */}
      {error && !indexUrl && (
        <div className="sc-activity-alert sc-activity-alert--error" role="alert">
          <div className="sc-activity-alert-icon">
            <AlertCircle size={20} />
          </div>
          <div className="sc-activity-alert-content">
            <strong>Failed to load activity metrics</strong>
            <p>{error}</p>
            <button
              type="button"
              className="sc-activity-retry-btn"
              onClick={loadDashboardData}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="sc-activity-grid">
        {/* Total Registered Users */}
        <div className="sc-activity-card">
          <div className="sc-activity-card-header">
            <div className="sc-activity-card-icon sc-icon--users">
              <Users size={18} />
            </div>
            <span className="sc-activity-card-badge">users/*</span>
          </div>
          <div className="sc-activity-card-value">
            {loading ? "…" : metrics.totalUsers.toLocaleString()}
          </div>
          <div className="sc-activity-card-label">Total Registered Users</div>
        </div>

        {/* Verified vs Unverified */}
        <div className="sc-activity-card">
          <div className="sc-activity-card-header">
            <div className="sc-activity-card-icon sc-icon--verified">
              <UserCheck size={18} />
            </div>
            <span className="sc-activity-card-badge sc-badge--approx">Approximate</span>
          </div>
          <div className="sc-activity-card-value sc-activity-split-value">
            <span className="sc-val-verified">{loading ? "…" : metrics.verifiedUsers}</span>
            <span className="sc-val-divider">/</span>
            <span className="sc-val-unverified">{loading ? "…" : metrics.unverifiedUsers}</span>
          </div>
          <div className="sc-activity-card-label">
            Verified vs. Unverified
            <span className="sc-activity-hint" title="emailVerified may not be set on every profile doc">
              {" "}(approximate — emailVerified may not be on every doc)
            </span>
          </div>
        </div>

        {/* Total User Downloads */}
        <div className="sc-activity-card">
          <div className="sc-activity-card-header">
            <div className="sc-activity-card-icon sc-icon--downloads">
              <Download size={18} />
            </div>
            <span className="sc-activity-card-badge">events [download]</span>
          </div>
          <div className="sc-activity-card-value">
            {loading ? "…" : metrics.totalDownloads.toLocaleString()}
          </div>
          <div className="sc-activity-card-label">Total User Downloads</div>
        </div>

        {/* Total User Copies */}
        <div className="sc-activity-card">
          <div className="sc-activity-card-header">
            <div className="sc-activity-card-icon sc-icon--copies">
              <Copy size={18} />
            </div>
            <span className="sc-activity-card-badge">events [copy]</span>
          </div>
          <div className="sc-activity-card-value">
            {loading ? "…" : metrics.totalCopies.toLocaleString()}
          </div>
          <div className="sc-activity-card-label">Total User Copies</div>
        </div>

        {/* Anonymous Events */}
        <div className="sc-activity-card">
          <div className="sc-activity-card-header">
            <div className="sc-activity-card-icon sc-icon--anon">
              <Globe size={18} />
            </div>
            <span className="sc-activity-card-badge">anonymous_events/*</span>
          </div>
          <div className="sc-activity-card-value">
            {loading ? "…" : metrics.anonymousEvents.toLocaleString()}
          </div>
          <div className="sc-activity-card-label">Anonymous Events</div>
        </div>
      </div>

      {/* Two Column Layout: Top 10 Products & Recent 20 Events */}
      <div className="sc-activity-sections">
        {/* Top 10 Products by Downloads */}
        <section className="sc-activity-section">
          <div className="sc-activity-section-head">
            <div className="sc-activity-section-title-wrap">
              <Flame size={18} className="sc-activity-flame" />
              <h2 className="sc-activity-section-title">Top 10 Products by Downloads</h2>
            </div>
            <span className="sc-activity-section-badge">
              ranked from the 300 most recent events, not all-time
            </span>
          </div>

          <div className="sc-activity-table-wrap">
            {loading ? (
              <div className="sc-activity-empty">Loading top products…</div>
            ) : topProducts.length === 0 ? (
              <div className="sc-activity-empty">
                No downloads recorded in the 300 most recent events.
              </div>
            ) : (
              <table className="sc-activity-table">
                <thead>
                  <tr>
                    <th style={{ width: "50px" }}>#</th>
                    <th>Product</th>
                    <th style={{ width: "120px", textAlign: "right" }}>Downloads</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, idx) => (
                    <tr key={`${p.product}-${idx}`}>
                      <td className="sc-activity-rank">{idx + 1}</td>
                      <td className="sc-activity-product-cell">
                        <strong>{p.product}</strong>
                      </td>
                      <td className="sc-activity-count-cell" style={{ textAlign: "right" }}>
                        <span className="sc-activity-count-pill">{p.count}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Recent 20 Events Table */}
        <section className="sc-activity-section">
          <div className="sc-activity-section-head">
            <div className="sc-activity-section-title-wrap">
              <Activity size={18} className="sc-activity-pulse" />
              <h2 className="sc-activity-section-title">Recent 20 Events</h2>
            </div>
            <span className="sc-activity-section-badge">latest telemetry</span>
          </div>

          <div className="sc-activity-table-wrap">
            {loading ? (
              <div className="sc-activity-empty">Loading recent events…</div>
            ) : recentEvents.length === 0 ? (
              <div className="sc-activity-empty">No telemetry events logged yet.</div>
            ) : (
              <table className="sc-activity-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Product</th>
                    <th>Action</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((ev) => (
                    <tr key={ev.id}>
                      <td className="sc-activity-email-cell">
                        <span>{ev.email}</span>
                      </td>
                      <td className="sc-activity-product-cell">
                        <code>{ev.product}</code>
                      </td>
                      <td>
                        <span
                          className={`sc-action-pill ${
                            ev.action === "download"
                              ? "sc-action-pill--download"
                              : ev.action === "copy"
                              ? "sc-action-pill--copy"
                              : ""
                          }`}
                        >
                          {ev.action}
                        </span>
                      </td>
                      <td className="sc-activity-time-cell">{formatTimestamp(ev.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      <style>{`
        .sc-activity-page {
          padding: 24px 28px 60px;
          color: #e2e8f0;
          font-family: -apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif;
          max-width: 1320px;
          margin: 0 auto;
        }

        .sc-activity-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .sc-activity-eyebrow {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #f5a623;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .sc-activity-title {
          font-size: 26px;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 6px;
          letter-spacing: -0.02em;
        }

        .sc-activity-subtitle {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        .sc-activity-refresh-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #ffffff;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }

        .sc-activity-refresh-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .sc-activity-refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .sc-spin {
          animation: scSpin 1s linear infinite;
        }

        @keyframes scSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Alert styles */
        .sc-activity-alert {
          display: flex;
          gap: 14px;
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          background: rgba(245, 166, 35, 0.08);
          border: 1px solid rgba(245, 166, 35, 0.35);
          color: #fcd34d;
        }

        .sc-activity-alert--error {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.4);
          color: #fca5a5;
        }

        .sc-activity-alert-content strong {
          display: block;
          font-size: 15px;
          margin-bottom: 4px;
          color: #ffffff;
        }

        .sc-activity-alert-content p {
          margin: 0 0 12px;
          font-size: 13px;
          line-height: 1.5;
        }

        .sc-activity-alert-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }

        .sc-activity-index-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f5a623;
          color: #000000;
          font-weight: 700;
          padding: 7px 14px;
          border-radius: 6px;
          text-decoration: none;
          font-size: 12px;
          transition: background 0.15s;
        }

        .sc-activity-index-link:hover {
          background: #f7b733;
        }

        .sc-activity-retry-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .sc-activity-retry-btn:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .sc-activity-raw-err {
          font-family: monospace;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          word-break: break-all;
          margin-top: 6px;
        }

        /* Metrics grid */
        .sc-activity-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }

        .sc-activity-card {
          background: #121218;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 18px 20px;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
        }

        .sc-activity-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .sc-activity-card-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
        }

        .sc-icon--users { color: #60a5fa; background: rgba(96, 165, 250, 0.12); }
        .sc-icon--verified { color: #4ade80; background: rgba(74, 222, 128, 0.12); }
        .sc-icon--downloads { color: #f5a623; background: rgba(245, 166, 35, 0.12); }
        .sc-icon--copies { color: #a78bfa; background: rgba(167, 139, 250, 0.12); }
        .sc-icon--anon { color: #94a3b8; background: rgba(148, 163, 184, 0.12); }

        .sc-activity-card-badge {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.04);
          padding: 2px 7px;
          border-radius: 4px;
        }

        .sc-badge--approx {
          color: #fbbf24;
          background: rgba(251, 191, 36, 0.1);
        }

        .sc-activity-card-value {
          font-size: 30px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.1;
          margin-bottom: 6px;
        }

        .sc-activity-split-value {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .sc-val-verified { color: #4ade80; }
        .sc-val-divider { color: rgba(255, 255, 255, 0.3); font-size: 20px; font-weight: 400; }
        .sc-val-unverified { color: #f87171; }

        .sc-activity-card-label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.65);
        }

        .sc-activity-hint {
          display: block;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          font-weight: normal;
          margin-top: 2px;
        }

        /* Two column sections */
        .sc-activity-sections {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        @media (min-width: 980px) {
          .sc-activity-sections {
            grid-template-columns: 4fr 6fr;
          }
        }

        .sc-activity-section {
          background: #121218;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 20px 22px;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
        }

        .sc-activity-section-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .sc-activity-section-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sc-activity-flame { color: #f5a623; }
        .sc-activity-pulse { color: #60a5fa; }

        .sc-activity-section-title {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .sc-activity-section-badge {
          font-size: 11px;
          color: #fbbf24;
          background: rgba(251, 191, 36, 0.08);
          padding: 3px 8px;
          border-radius: 6px;
          font-weight: 600;
        }

        .sc-activity-table-wrap {
          overflow-x: auto;
        }

        .sc-activity-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .sc-activity-table th {
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.45);
          padding: 8px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .sc-activity-table td {
          padding: 10px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          color: #e2e8f0;
          vertical-align: middle;
        }

        .sc-activity-table tr:last-child td {
          border-bottom: 0;
        }

        .sc-activity-rank {
          color: rgba(255, 255, 255, 0.35);
          font-weight: 700;
        }

        .sc-activity-product-cell strong {
          color: #ffffff;
        }

        .sc-activity-product-cell code {
          background: rgba(255, 255, 255, 0.06);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          color: #f1f5f9;
        }

        .sc-activity-count-pill {
          background: rgba(245, 166, 35, 0.15);
          color: #f5a623;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .sc-activity-email-cell span {
          color: rgba(255, 255, 255, 0.85);
          font-family: monospace;
          font-size: 12px;
        }

        .sc-action-pill {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 2px 8px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
        }

        .sc-action-pill--download {
          background: rgba(245, 166, 35, 0.14);
          color: #f5a623;
        }

        .sc-action-pill--copy {
          background: rgba(167, 139, 250, 0.14);
          color: #a78bfa;
        }

        .sc-activity-time-cell {
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
          white-space: nowrap;
        }

        .sc-activity-empty {
          padding: 32px 16px;
          text-align: center;
          color: rgba(255, 255, 255, 0.45);
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
