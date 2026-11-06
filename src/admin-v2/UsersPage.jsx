import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "./AdminLayout.jsx";
import { Check, CheckCircle, ChevronLeft, ChevronRight, Copy, RefreshCw, Search, ShieldAlert, Users } from "lucide-react";
import { fetchAdminJson } from "./marketingContacts.js";

const PAGE_SIZE = 25;

// ---- helpers ----
function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function relativeTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

function providerBadge(provider) {
  if (provider === "email") return <span className="admin-v2-badge" style={{ background: "#dcfce7", color: "#15803d" }}>Email gate</span>;
  if (provider === "firebase") return <span className="admin-v2-badge" style={{ background: "#dbeafe", color: "#1d4ed8" }}>Firebase</span>;
  return <span className="admin-v2-badge unknown">{provider || "Unknown"}</span>;
}

export default function UsersPage({ isSuperAdmin }) {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState(0);

  // One fetch of the whole directory (capped at 5000 by the API); search,
  // pagination and copy are all client-side.
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminJson("/api/admin/users?all=1");
      setUsers(data.users || []);
      setTotal(Number(data.total || (data.users || []).length));
    } catch (err) {
      setError(err?.message || "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleSyncFirebase = async () => {
    setSyncing(true);
    setError("");
    setMessage("");
    try {
      const result = await fetchAdminJson("/api/admin/stea-code/users/sync", { method: "POST" });
      if (result?.ok) {
        setMessage(`Synced ${result.synced} users (${result.created} new, ${result.updated} updated)`);
      }
      await loadUsers();
    } catch (err) {
      setError(err?.message || "Could not sync users.");
    } finally {
      setSyncing(false);
    }
  };

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((u) => String(u.email || "").toLowerCase().includes(needle));
  }, [users, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const counts = useMemo(() => ({
    email: users.filter((u) => u.provider === "email").length,
    firebase: users.filter((u) => u.provider === "firebase").length,
    thisWeek: users.filter((u) => {
      const t = new Date(u.createdAt || 0).getTime();
      return Number.isFinite(t) && Date.now() - t < 7 * 24 * 3600 * 1000;
    }).length,
  }), [users]);

  const handleCopyEmails = async () => {
    const emails = filtered.map((u) => u.email).filter(Boolean);
    if (!emails.length) return;
    const text = emails.join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API unavailable (insecure context / permissions) — fallback.
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try { document.execCommand("copy"); } catch { /* ignore */ }
      area.remove();
    }
    setCopied(emails.length);
    setMessage(`Copied ${emails.length} email${emails.length === 1 ? "" : "s"} to the clipboard.`);
    window.setTimeout(() => setCopied(0), 2500);
  };

  return (
    <>
      <AdminPageHeader title="Users & Leads" description="Everyone captured by the email gate and Firebase sign-ins — your newsletter audience." />

      {!isSuperAdmin && (
        <div className="admin-v2-safety-banner" style={{ marginBottom: 24 }}><ShieldAlert size={18} /><div><strong>Sync disabled.</strong> Only the owner (Super Admin) can sync Firebase users.</div></div>
      )}
      {error && <div className="admin-v2-error">{error}</div>}
      {message && <div className="admin-v2-safety-banner" style={{ marginBottom: 18 }}><CheckCircle size={18} /><div>{message}</div></div>}

      <div className="admin-v2-stats-row">
        <div className="admin-v2-stat-card"><div className="admin-v2-stat-icon"><Users size={24} /></div><div><h4 className="admin-v2-stat-value">{total.toLocaleString()}</h4><p className="admin-v2-stat-label">Total Users</p></div></div>
        <div className="admin-v2-stat-card"><div className="admin-v2-stat-icon"><Users size={24} /></div><div><h4 className="admin-v2-stat-value">{counts.email.toLocaleString()}</h4><p className="admin-v2-stat-label">Email Gate</p></div></div>
        <div className="admin-v2-stat-card"><div className="admin-v2-stat-icon"><Users size={24} /></div><div><h4 className="admin-v2-stat-value">{counts.firebase.toLocaleString()}</h4><p className="admin-v2-stat-label">Firebase</p></div></div>
        <div className="admin-v2-stat-card"><div className="admin-v2-stat-icon"><Users size={24} /></div><div><h4 className="admin-v2-stat-value">{counts.thisWeek.toLocaleString()}</h4><p className="admin-v2-stat-label">New this week</p></div></div>
      </div>

      <section className="admin-v2-panel">
        <div className="admin-v2-panel-head">User tools <span>{filtered.length.toLocaleString()} of {users.length.toLocaleString()}</span></div>
        <div className="admin-v2-filter-grid admin-v2-users-filter-grid">
          <label>
            Search
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#8a8071" }} />
              <input
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                placeholder="Filter by email"
                style={{ paddingLeft: 30 }}
              />
            </div>
          </label>
          <div className="admin-v2-action-strip">
            <button onClick={handleCopyEmails} disabled={!filtered.length}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? `Copied ${copied}` : "Copy Emails"}
            </button>
            <button onClick={loadUsers} disabled={loading}><RefreshCw size={14} /> Refresh</button>
            <button onClick={handleSyncFirebase} disabled={!isSuperAdmin || syncing} title={!isSuperAdmin ? "Sync requires owner access" : undefined}>{syncing ? <RefreshCw size={14} className="admin-v2-spin" /> : <RefreshCw size={14} />} Sync Firebase users</button>
          </div>
        </div>
      </section>

      {loading ? <div className="admin-v2-empty">Loading users...</div> : (
        <section className="admin-v2-panel admin-v2-users-table">
          <div className="admin-v2-panel-head">
            Users
            <span>
              Page {safePage} of {pageCount} · {filtered.length.toLocaleString()} users
            </span>
          </div>
          <div className="admin-v2-table-wrap">
            <table className="admin-v2-table">
              <thead><tr><th>Email</th><th>Provider</th><th>Sign-up Date</th><th>Last Active</th></tr></thead>
              <tbody>{pageRows.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.email || "—"}</strong></td>
                  <td>{providerBadge(item.provider)}</td>
                  <td title={formatDate(item.createdAt)}>{formatDate(item.createdAt)}</td>
                  <td title={formatDate(item.lastActiveAt)}>{relativeTime(item.lastActiveAt)}</td>
                </tr>
              ))}</tbody>
            </table>
            {!pageRows.length && <div className="admin-v2-empty">No users found. Email-gate signups appear here automatically.</div>}
          </div>
          {pageCount > 1 && (
            <div className="admin-v2-action-strip" style={{ justifyContent: "flex-end", padding: "12px 16px" }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}><ChevronLeft size={14} /> Prev</button>
              <span style={{ alignSelf: "center", fontSize: 13, color: "#6b6253" }}>{safePage} / {pageCount}</span>
              <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={safePage >= pageCount}>Next <ChevronRight size={14} /></button>
            </div>
          )}
        </section>
      )}
    </>
  );
}
