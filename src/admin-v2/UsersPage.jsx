import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "./AdminLayout.jsx";
import { CheckCircle, RefreshCw, Search, ShieldAlert, Users } from "lucide-react";
import { fetchAdminJson } from "./marketingContacts.js";

// ---- helpers ----
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

function formatMoney(value) {
  const n = Number(value || 0);
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function sourceBadge(source) {
  if (source === "firebase") return <span className="admin-v2-badge" style={{ background: "#dbeafe", color: "#1d4ed8" }}>Firebase</span>;
  if (source === "staff") return <span className="admin-v2-badge" style={{ background: "#fef3c7", color: "#b45309" }}>Staff</span>;
  return <span className="admin-v2-badge unknown">Unknown</span>;
}

export default function UsersPage({ isSuperAdmin }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ search: "", source: "", status: "" });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminJson("/api/admin/stea-code/users");
      setUsers(data.users || []);
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

  const sourceOptions = useMemo(() => [...new Set(users.map((u) => u.source || "unknown").filter(Boolean))].sort(), [users]);
  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  const visibleUsers = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return users.filter((u) => {
      if (search) {
        const haystack = `${u.email || ""} ${u.displayName || ""} ${u.id || ""}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (filters.source && String(u.source || "unknown") !== filters.source) return false;
      if (filters.status) {
        const disabled = Number(u.disabled) === 1 || String(u.status).toLowerCase() === "disabled";
        if (filters.status === "active" && disabled) return false;
        if (filters.status === "disabled" && !disabled) return false;
      }
      return true;
    });
  }, [filters, users]);

  const counts = useMemo(() => ({
    firebase: users.filter((u) => u.source === "firebase").length,
    staff: users.filter((u) => u.source === "staff").length,
    disabled: users.filter((u) => Number(u.disabled) === 1 || String(u.status).toLowerCase() === "disabled").length,
  }), [users]);

  return (
    <>
      <AdminPageHeader title="Users" description="All Firebase customers and staff members across STEA Code." />

      {!isSuperAdmin && (
        <div className="admin-v2-safety-banner" style={{ marginBottom: 24 }}><ShieldAlert size={18} /><div><strong>Sync disabled.</strong> Only the owner (Super Admin) can sync Firebase users.</div></div>
      )}
      {error && <div className="admin-v2-error">{error}</div>}
      {message && <div className="admin-v2-safety-banner" style={{ marginBottom: 18 }}><CheckCircle size={18} /><div>{message}</div></div>}

      <div className="admin-v2-stats-row">
        <div className="admin-v2-stat-card"><div className="admin-v2-stat-icon"><Users size={24} /></div><div><h4 className="admin-v2-stat-value">{users.length.toLocaleString()}</h4><p className="admin-v2-stat-label">Total Users</p></div></div>
        <div className="admin-v2-stat-card"><div className="admin-v2-stat-icon"><Users size={24} /></div><div><h4 className="admin-v2-stat-value">{counts.firebase.toLocaleString()}</h4><p className="admin-v2-stat-label">Firebase Customers</p></div></div>
        <div className="admin-v2-stat-card"><div className="admin-v2-stat-icon"><Users size={24} /></div><div><h4 className="admin-v2-stat-value">{counts.staff.toLocaleString()}</h4><p className="admin-v2-stat-label">Staff Members</p></div></div>
        <div className="admin-v2-stat-card"><div className="admin-v2-stat-icon"><Users size={24} /></div><div><h4 className="admin-v2-stat-value">{counts.disabled.toLocaleString()}</h4><p className="admin-v2-stat-label">Disabled</p></div></div>
      </div>

      <section className="admin-v2-panel">
        <div className="admin-v2-panel-head">User tools <span>{visibleUsers.length.toLocaleString()} visible</span></div>
        <div className="admin-v2-filter-grid admin-v2-users-filter-grid">
          <label>Search<input value={filters.search} onChange={(event) => setFilter("search", event.target.value)} placeholder="Email, name, or UID" /></label>
          <label>Source<select value={filters.source} onChange={(event) => setFilter("source", event.target.value)}><option value="">All sources</option>{sourceOptions.map((item) => <option key={item} value={item}>{item === "firebase" ? "Firebase" : item === "staff" ? "Staff" : item}</option>)}</select></label>
          <label>Status<select value={filters.status} onChange={(event) => setFilter("status", event.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="disabled">Disabled</option></select></label>
          <div className="admin-v2-action-strip">
            <button onClick={loadUsers} disabled={loading}><RefreshCw size={14} /> Refresh</button>
            <button onClick={handleSyncFirebase} disabled={!isSuperAdmin || syncing} title={!isSuperAdmin ? "Sync requires owner access" : undefined}>{syncing ? <RefreshCw size={14} className="admin-v2-spin" /> : <RefreshCw size={14} />} Sync Firebase users</button>
          </div>
        </div>
      </section>

      {loading ? <div className="admin-v2-empty">Loading users...</div> : (
        <section className="admin-v2-panel admin-v2-users-table">
          <div className="admin-v2-panel-head">Users <span>read-only · suspend / role actions coming soon</span></div>
          <div className="admin-v2-table-wrap">
            <table className="admin-v2-table">
              <thead><tr><th>User</th><th>Email</th><th>Source</th><th>Orders</th><th>Total spent</th><th>Last login</th><th>Joined</th><th>Status</th></tr></thead>
              <tbody>{visibleUsers.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.displayName || "—"}</strong></td>
                  <td>{item.email || "—"}</td>
                  <td>{sourceBadge(item.source)}</td>
                  <td>{item.orderCount ?? 0}</td>
                  <td>{formatMoney(item.totalSpent)}</td>
                  <td>{relativeTime(item.lastLoginAt)}</td>
                  <td>{relativeTime(item.createdAt)}</td>
                  <td>{Number(item.disabled) === 1 || String(item.status).toLowerCase() === "disabled" ? <span className="admin-v2-badge" style={{ background: "#fee2e2", color: "#b91c1c" }}>Disabled</span> : <span className="admin-v2-badge" style={{ background: "#dcfce7", color: "#15803d" }}>Active</span>}</td>
                </tr>
              ))}</tbody>
            </table>
            {!visibleUsers.length && <div className="admin-v2-empty">No users found. Click <strong>Sync Firebase users</strong> to pull the Firebase customer list.</div>}
          </div>
        </section>
      )}
    </>
  );
}
