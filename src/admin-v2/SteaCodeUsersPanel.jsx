import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Users } from "lucide-react";
import { getAdminSteaCodeUsers, syncAdminSteaCodeUsers } from "../services/steaCodeAdmin.js";

// ---- helpers ----
function timeAgo(value) {
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
  if (source === "firebase") {
    return <span className="sc-users-badge sc-users-badge-firebase">Firebase</span>;
  }
  if (source === "staff") {
    return <span className="sc-users-badge sc-users-badge-staff">Staff</span>;
  }
  return <span className="sc-users-badge sc-users-badge-unknown">Unknown</span>;
}

export default function SteaCodeUsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({ search: "", source: "", status: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminSteaCodeUsers({ force: true });
      setUsers(data.users || []);
    } catch (err) {
      setError(err?.message || "Couldn't load users. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    setMessage("");
    setError("");
    try {
      const res = await syncAdminSteaCodeUsers();
      if (res?.ok) {
        setMessage(`Synced ${res.synced} users (${res.created} new, ${res.updated} updated)`);
      }
      await load();
    } catch (err) {
      setError(err?.message || "Couldn't sync users. Try again.");
    } finally {
      setSyncing(false);
    }
  };

  const sourceOptions = useMemo(
    () => [...new Set(users.map((u) => u.source || "unknown").filter(Boolean))].sort(),
    [users]
  );

  const visibleUsers = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return users
      .filter((u) => {
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
      })
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }, [filters, users]);

  const isDisabled = (u) =>
    Number(u.disabled) === 1 || String(u.status).toLowerCase() === "disabled";

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <div className="sc-admin-panel">
      <div className="sc-admin-product-toolbar">
        <div className="sc-admin-search">
          <Search size={16} />
          <input
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            placeholder="Search users by email, name, UID…"
          />
        </div>
        <div className="sc-admin-filter-row">
          <select
            className="sc-users-select"
            value={filters.source}
            onChange={(e) => setFilter("source", e.target.value)}
          >
            <option value="">All sources</option>
            {sourceOptions.map((s) => (
              <option key={s} value={s}>{s === "firebase" ? "Firebase" : s === "staff" ? "Staff" : s}</option>
            ))}
          </select>
          <select
            className="sc-users-select"
            value={filters.status}
            onChange={(e) => setFilter("status", e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
          <button className="sc-users-sync-btn" onClick={handleSync} disabled={syncing}>
            {syncing ? <RefreshCw size={14} className="sc-spin" /> : <RefreshCw size={14} />}
            {syncing ? "Syncing…" : "Sync Firebase users"}
          </button>
        </div>
      </div>

      {message && <div className="sc-users-banner">{message}</div>}
      {error && (
        <div className="sc-users-error">
          {error}
          <button className="sc-users-retry" onClick={load} disabled={loading}>Try again</button>
        </div>
      )}

      <div className="admin-v2-table-wrap">
        {loading ? (
          <table className="admin-v2-table">
            <thead>
              <tr><th>User</th><th>Email</th><th>Source</th><th>Orders</th><th>Total spent</th><th>Last login</th><th>Joined</th><th>Status</th></tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3, 4].map((i) => (
                <tr key={i}>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((c) => (
                    <td key={c}><div className="sc-users-skeleton" /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="admin-v2-table">
            <thead>
              <tr><th>User</th><th>Email</th><th>Source</th><th>Orders</th><th>Total spent</th><th>Last login</th><th>Joined</th><th>Status</th></tr>
            </thead>
            <tbody>
              {visibleUsers.map((u) => {
                const initials = (u.displayName || u.email || "U").slice(0, 2).toUpperCase();
                return (
                  <tr key={u.id || u.email}>
                    <td>
                      <div className="sc-admin-user-cell">
                        <div className="sc-admin-user-avatar">{initials}</div>
                        <div><strong style={{ color: "#ffffff", display: "block" }}>{u.displayName || "—"}</strong></div>
                      </div>
                    </td>
                    <td>{u.email || "—"}</td>
                    <td>{sourceBadge(u.source)}</td>
                    <td><strong>{u.orderCount ?? 0}</strong></td>
                    <td><span className="sc-admin-price">{formatMoney(u.totalSpent)}</span></td>
                    <td>{timeAgo(u.lastLoginAt)}</td>
                    <td>{timeAgo(u.createdAt)}</td>
                    <td>
                      <span className={`sc-admin-status ${isDisabled(u) ? "is-banned" : "is-active"}`}>
                        {isDisabled(u) ? "Disabled" : "Active"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {visibleUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className="sc-admin-empty-row">
                    <div className="sc-admin-empty-state">
                      <Users size={36} className="sc-admin-empty-icon" />
                      <div className="sc-admin-empty-title">No users yet</div>
                      <div className="sc-admin-empty-caption">Click “Sync Firebase users” to import Firebase customers.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
