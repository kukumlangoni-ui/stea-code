import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "./AdminLayout.jsx";
import { Ban, CheckCircle, Download, FileSpreadsheet, RefreshCw, Search, Shield, ShieldAlert, Users } from "lucide-react";
import { createAuditLog } from "./auditLog";
import { AdminConfirmationModal } from "./AdminConfirmationModal.jsx";
import { contactSummary, downloadBrevoCsv, downloadContactsExcel, fetchAdminJson, syncUsersToFirestore } from "./marketingContacts.js";

const ROLES = ["user", "admin", "super_admin", "editor", "manager"];

function uniqueValues(users, key, fallback = "Unknown") {
  return [...new Set(users.map((user) => String(user[key] || user.profile?.[key] || fallback)).filter(Boolean))].sort();
}

function displayDate(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleDateString();
}

export default function UsersPage({ isSuperAdmin }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalAuthUsers: 0, totalProfiles: 0, missingProfiles: 0, orphanProfiles: 0 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(null);
  const [filters, setFilters] = useState({ search: "", provider: "", role: "", language: "" });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminJson("/api/admin/users");
      setUsers(data.authUsers || []);
      setStats({
        totalAuthUsers: data.totalAuthUsers || 0,
        totalProfiles: data.totalProfiles || 0,
        missingProfiles: data.missingProfiles || 0,
        orphanProfiles: data.orphanProfiles || 0,
      });
    } catch (err) {
      setError(err?.message || "Could not load real users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleSync = async () => {
    setSyncing(true);
    setError("");
    setMessage("");
    try {
      const result = await syncUsersToFirestore();
      setMessage(`Sync complete. ${result.syncedCount || 0} Auth user${result.syncedCount === 1 ? "" : "s"} written to Firestore.`);
      await loadUsers();
    } catch (err) {
      setError(err?.message || "Could not sync users.");
    } finally {
      setSyncing(false);
    }
  };

  const handleAction = async (reason) => {
    if (!confirming) return;
    const { action, item, newRole } = confirming;
    if (action === "suspend") {
      await createAuditLog("suspend_user", "users", item.uid, { status: item.status }, { status: "suspended" }, reason);
      await fetchAdminJson(`/api/admin/users/${encodeURIComponent(item.uid)}/status`, { method: "PATCH", body: JSON.stringify({ disabled: true }) });
      setUsers((current) => current.map((u) => u.uid === item.uid ? { ...u, status: "suspended" } : u));
    } else if (action === "activate") {
      await createAuditLog("activate_user", "users", item.uid, { status: item.status }, { status: "active" }, reason);
      await fetchAdminJson(`/api/admin/users/${encodeURIComponent(item.uid)}/status`, { method: "PATCH", body: JSON.stringify({ disabled: false }) });
      setUsers((current) => current.map((u) => u.uid === item.uid ? { ...u, status: "active" } : u));
    } else if (action === "editRole") {
      await createAuditLog("edit_user_role", "users", item.uid, { role: item.role }, { role: newRole }, reason);
      await fetchAdminJson(`/api/admin/users/${encodeURIComponent(item.uid)}/role`, { method: "PATCH", body: JSON.stringify({ role: newRole }) });
      setUsers((current) => current.map((u) => u.uid === item.uid ? { ...u, role: newRole } : u));
    }
  };

  const providerOptions = useMemo(() => uniqueValues(users, "provider"), [users]);
  const roleOptions = useMemo(() => uniqueValues(users, "role", "user"), [users]);
  const languageOptions = useMemo(() => uniqueValues(users, "language", "").filter(Boolean), [users]);
  const summary = useMemo(() => contactSummary(users), [users]);
  const adminCount = useMemo(() => users.filter((u) => u.role === "admin" || u.role === "super_admin").length, [users]);

  const visibleUsers = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return users.filter((user) => {
      if (search) {
        const haystack = `${user.email || ""} ${user.displayName || user.name || ""} ${user.uid || ""}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (filters.provider && String(user.provider || "Unknown") !== filters.provider) return false;
      if (filters.role && String(user.role || "user") !== filters.role) return false;
      if (filters.language && String(user.language || user.profile?.language || "") !== filters.language) return false;
      return true;
    });
  }, [filters, users]);

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <>
      <AdminPageHeader title="Users Management" description="Real Firebase Authentication contacts, profile sync, and Brevo-ready exports." />

      {!isSuperAdmin && (
        <div className="admin-v2-safety-banner" style={{ marginBottom: 24 }}><ShieldAlert size={18} /><div><strong>Protected actions disabled.</strong> You need Super Admin privileges to sync or edit users.</div></div>
      )}
      {error && <div className="admin-v2-error">{error}</div>}
      {message && <div className="admin-v2-safety-banner" style={{ marginBottom: 18 }}><CheckCircle size={18} /><div>{message}</div></div>}

      {confirming && (
        <AdminConfirmationModal
          title={confirming.action === "suspend" ? "Suspend User" : confirming.action === "activate" ? "Activate User" : "Edit User Role"}
          actionDescription={confirming.action === "editRole" ? `You are changing ${confirming.item.email || confirming.item.uid} to ${confirming.newRole}.` : `You are about to ${confirming.action} ${confirming.item.email || confirming.item.uid}.`}
          danger={confirming.action === "suspend"}
          onClose={() => setConfirming(null)}
          onConfirm={handleAction}
        />
      )}

      <div className="admin-v2-stats-row">
        <div className="admin-v2-stat-card"><div className="admin-v2-stat-icon"><Users size={24} /></div><div><h4 className="admin-v2-stat-value">{stats.totalAuthUsers.toLocaleString()}</h4><p className="admin-v2-stat-label">Firebase Auth Users</p></div></div>
        <div className="admin-v2-stat-card"><div className="admin-v2-stat-icon"><Users size={24} /></div><div><h4 className="admin-v2-stat-value">{stats.totalProfiles.toLocaleString()}</h4><p className="admin-v2-stat-label">Firestore Profiles</p></div></div>
        <div className="admin-v2-stat-card"><div className="admin-v2-stat-icon"><Shield size={24} /></div><div><h4 className="admin-v2-stat-value">{adminCount.toLocaleString()}</h4><p className="admin-v2-stat-label">Admins</p></div></div>
        <div className="admin-v2-stat-card"><div className="admin-v2-stat-icon"><CheckCircle size={24} /></div><div><h4 className="admin-v2-stat-value">{summary.subscribers.toLocaleString()}</h4><p className="admin-v2-stat-label">Subscribers</p></div></div>
      </div>

      <section className="admin-v2-panel">
        <div className="admin-v2-panel-head">User tools <span>{visibleUsers.length.toLocaleString()} visible</span></div>
        <div className="admin-v2-filter-grid admin-v2-users-filter-grid">
          <label>Search<input value={filters.search} onChange={(event) => setFilter("search", event.target.value)} placeholder="Email, name, or UID" /></label>
          <label>Provider<select value={filters.provider} onChange={(event) => setFilter("provider", event.target.value)}><option value="">All providers</option>{providerOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Role<select value={filters.role} onChange={(event) => setFilter("role", event.target.value)}><option value="">All roles</option>{roleOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Language<select value={filters.language} onChange={(event) => setFilter("language", event.target.value)}><option value="">All languages</option>{languageOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <div className="admin-v2-action-strip">
            <button onClick={loadUsers} disabled={loading}><RefreshCw size={14} /> Refresh</button>
            <button onClick={handleSync} disabled={!isSuperAdmin || syncing}>{syncing ? <RefreshCw size={14} className="admin-v2-spin" /> : <RefreshCw size={14} />} Sync Users</button>
            <button onClick={() => downloadBrevoCsv(users)} disabled={!users.length}><Download size={14} /> Export CSV</button>
            <button onClick={() => downloadContactsExcel(users)} disabled={!users.length}><FileSpreadsheet size={14} /> Excel</button>
          </div>
        </div>
      </section>

      {loading ? <div className="admin-v2-empty">Loading real Firebase Authentication users...</div> : (
        <>
          <section className="admin-v2-panel admin-v2-users-table">
            <div className="admin-v2-panel-head">Users <span>{stats.missingProfiles.toLocaleString()} missing Firestore profiles</span></div>
            <div className="admin-v2-table-wrap">
              <table className="admin-v2-table">
                <thead><tr><th>User</th><th>Email</th><th>UID</th><th>Provider</th><th>Created</th><th>Role</th><th>Language</th><th>Actions</th></tr></thead>
                <tbody>{visibleUsers.map((item) => (
                  <tr key={item.uid}>
                    <td><strong>{item.displayName || item.name || "Unknown Name"}</strong><br /><span className={`admin-v2-badge ${item.profileStatus === "missing" ? "unknown" : ""}`}>{item.profileStatus || "profile"}</span></td>
                    <td>{item.email || "Unknown"}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 11 }}>{item.uid}</td>
                    <td>{item.provider || "email"}</td>
                    <td>{displayDate(item.createdAt)}</td>
                    <td>{item.role || "user"}</td>
                    <td>{item.language || item.profile?.language || "-"}</td>
                    <td>{isSuperAdmin ? <div className="admin-v2-user-actions-live"><select value={item.role || "user"} onChange={(event) => setConfirming({ action: "editRole", item, newRole: event.target.value })}>{ROLES.map((role) => <option key={role} value={role}>{role}</option>)}</select>{item.status === "suspended" ? <button onClick={() => setConfirming({ action: "activate", item })}><CheckCircle size={14} /> Activate</button> : <button className="danger" onClick={() => setConfirming({ action: "suspend", item })}><Ban size={14} /> Suspend</button>}</div> : "-"}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </section>

          <div className="admin-v2-user-cards">
            {visibleUsers.map((item) => (
              <article key={item.uid}>
                <div><strong>{item.displayName || item.name || "Unknown Name"}</strong><span>{item.email || "Unknown email"}</span></div>
                <dl><div><dt>UID</dt><dd>{item.uid}</dd></div><div><dt>Provider</dt><dd>{item.provider || "email"}</dd></div><div><dt>Role</dt><dd>{item.role || "user"}</dd></div><div><dt>Created</dt><dd>{displayDate(item.createdAt)}</dd></div></dl>
              </article>
            ))}
          </div>
        </>
      )}
    </>
  );
}
