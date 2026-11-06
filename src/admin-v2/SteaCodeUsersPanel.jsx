import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Copy, RefreshCw, Search, Users } from "lucide-react";
import { getAdminSteaCodeUsers, syncAdminSteaCodeUsers } from "../services/steaCodeAdmin.js";

const PAGE_SIZE = 25;

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

function providerBadge(provider) {
  if (provider === "staff") {
    return <span className="sc-users-badge" style={{ background: "#fef3c7", color: "#92400e" }}>Staff</span>;
  }
  if (provider === "email") {
    return <span className="sc-users-badge" style={{ background: "#dcfce7", color: "#15803d" }}>Email</span>;
  }
  if (provider === "firebase") {
    return <span className="sc-users-badge sc-users-badge-firebase">Firebase</span>;
  }
  return <span className="sc-users-badge sc-users-badge-unknown">{provider || "Unknown"}</span>;
}

export default function SteaCodeUsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({ search: "", provider: "", status: "" });
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminSteaCodeUsers({ force: true });
      if (data?._fallback) {
        // The service swallows non-auth API errors into this sentinel —
        // surface them instead of silently rendering an empty table.
        setUsers([]);
        setError("Couldn't load users from the API. Try again.");
      } else {
        setUsers(data.users || []);
      }
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

  const providerOptions = useMemo(
    () => [...new Set(users.map((u) => u.provider || "unknown").filter(Boolean))].sort(),
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
        if (filters.provider && String(u.provider || "unknown") !== filters.provider) return false;
        if (filters.status) {
          const disabled = Number(u.disabled) === 1 || String(u.status).toLowerCase() === "disabled";
          if (filters.status === "active" && disabled) return false;
          if (filters.status === "disabled" && !disabled) return false;
        }
        return true;
      })
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }, [filters, users]);

  const pageCount = Math.max(1, Math.ceil(visibleUsers.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = visibleUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleCopyEmails = async () => {
    const emails = visibleUsers.map((u) => u.email).filter(Boolean);
    if (!emails.length) return;
    const text = emails.join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
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

  const isDisabled = (u) =>
    Number(u.disabled) === 1 || String(u.status).toLowerCase() === "disabled";

  const setFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

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
            value={filters.provider}
            onChange={(e) => setFilter("provider", e.target.value)}
          >
            <option value="">All providers</option>
            {providerOptions.map((p) => (
              <option key={p} value={p}>{p === "firebase" ? "Firebase" : p === "email" ? "Email" : p}</option>
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
          <button className="sc-users-sync-btn" onClick={handleCopyEmails} disabled={!visibleUsers.length}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? `Copied ${copied}` : "Copy Emails"}
          </button>
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
              <tr><th>User</th><th>Email</th><th>Provider</th><th>Orders</th><th>Total spent</th><th>Last active</th><th>Joined</th><th>Status</th></tr>
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
              <tr><th>User</th><th>Email</th><th>Provider</th><th>Orders</th><th>Total spent</th><th>Last active</th><th>Joined</th><th>Status</th></tr>
            </thead>
            <tbody>
              {pageRows.map((u) => {
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
                    <td>{providerBadge(u.provider)}</td>
                    <td><strong>{u.orderCount ?? 0}</strong></td>
                    <td><span className="sc-admin-price">{formatMoney(u.totalSpent)}</span></td>
                    <td>{timeAgo(u.lastActiveAt || u.lastLoginAt)}</td>
                    <td>{timeAgo(u.createdAt)}</td>
                    <td>
                      <span className={`sc-admin-status ${isDisabled(u) ? "is-banned" : "is-active"}`}>
                        {isDisabled(u) ? "Disabled" : "Active"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="sc-admin-empty-row">
                    <div className="sc-admin-empty-state">
                      <Users size={36} className="sc-admin-empty-icon" />
                      <div className="sc-admin-empty-title">No users yet</div>
                      <div className="sc-admin-empty-caption">Email-gate signups appear here automatically.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        {!loading && visibleUsers.length > PAGE_SIZE && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, padding: "12px 16px" }}>
            <button className="sc-users-sync-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}>
              <ChevronLeft size={14} /> Prev
            </button>
            <span style={{ fontSize: 13, color: "#9aa1b5" }}>
              Page {safePage} of {pageCount} · {visibleUsers.length.toLocaleString()} users
            </span>
            <button className="sc-users-sync-btn" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={safePage >= pageCount}>
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
