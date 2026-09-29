import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, FileSpreadsheet, RefreshCw, Send, Users } from "lucide-react";
import { AdminPageHeader } from "./AdminLayout.jsx";
import { contactSummary, downloadBrevoCsv, downloadContactsExcel, fetchAdminJson, syncUsersToFirestore } from "./marketingContacts.js";

export default function MarketingPage({ isSuperAdmin }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalAuthUsers: 0, missingProfiles: 0 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminJson("/api/admin/users");
      setUsers(data.authUsers || []);
      setStats({ totalAuthUsers: data.totalAuthUsers || 0, missingProfiles: data.missingProfiles || 0 });
    } catch (err) {
      setError(err?.message || "Could not load marketing contacts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  const summary = useMemo(() => contactSummary(users), [users]);

  const syncUsers = async () => {
    setSyncing(true);
    setError("");
    setMessage("");
    try {
      const result = await syncUsersToFirestore();
      setMessage(`Sync complete. ${result.syncedCount || 0} contact${result.syncedCount === 1 ? "" : "s"} updated in Firestore.`);
      await loadContacts();
    } catch (err) {
      setError(err?.message || "Could not sync contacts.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <AdminPageHeader title="Email Marketing" description="Prepare Firebase Auth contacts for Brevo campaigns and future direct API syncing." />
      {error && <div className="admin-v2-error">{error}</div>}
      {message && <div className="admin-v2-safety-banner" style={{ marginBottom: 18 }}><Send size={18} /><div>{message}</div></div>}

      <div className="admin-v2-stats-row">
        <div className="admin-v2-stat-card"><div className="admin-v2-stat-icon"><Users size={24} /></div><div><h4 className="admin-v2-stat-value">{summary.total.toLocaleString()}</h4><p className="admin-v2-stat-label">Total Contacts</p></div></div>
        <div className="admin-v2-stat-card"><div className="admin-v2-stat-icon"><Send size={24} /></div><div><h4 className="admin-v2-stat-value">{summary.subscribers.toLocaleString()}</h4><p className="admin-v2-stat-label">Subscribers</p></div></div>
        <div className="admin-v2-stat-card"><div className="admin-v2-stat-icon"><Users size={24} /></div><div><h4 className="admin-v2-stat-value">{summary.unsubscribed.toLocaleString()}</h4><p className="admin-v2-stat-label">Unsubscribed</p></div></div>
        <div className="admin-v2-stat-card"><div className="admin-v2-stat-icon"><RefreshCw size={24} /></div><div><h4 className="admin-v2-stat-value">{stats.missingProfiles.toLocaleString()}</h4><p className="admin-v2-stat-label">Need Sync</p></div></div>
      </div>

      <section className="admin-v2-panel">
        <div className="admin-v2-panel-head">Brevo-ready contact tools <span>{loading ? "Loading contacts" : `${stats.totalAuthUsers.toLocaleString()} Auth users`}</span></div>
        <div className="admin-v2-marketing-actions">
          <button onClick={loadContacts} disabled={loading}><RefreshCw size={15} /> Refresh</button>
          <button onClick={syncUsers} disabled={!isSuperAdmin || syncing}>{syncing ? <RefreshCw size={15} className="admin-v2-spin" /> : <RefreshCw size={15} />} Sync Users</button>
          <button onClick={() => downloadBrevoCsv(users)} disabled={!users.length}><Download size={15} /> Export CSV</button>
          <button onClick={() => downloadContactsExcel(users)} disabled={!users.length}><FileSpreadsheet size={15} /> Download Excel</button>
          <a href="https://app.brevo.com/" target="_blank" rel="noopener noreferrer"><ExternalLink size={15} /> Open Brevo</a>
        </div>
      </section>

      <section className="admin-v2-panel">
        <div className="admin-v2-panel-head">Future API sync foundation</div>
        <div className="admin-v2-empty">
          Contacts are normalized through a shared Brevo export layer. A future direct “Sync to Brevo” action can reuse the same contact shape and call the Brevo API from a protected server endpoint.
        </div>
      </section>
    </>
  );
}
