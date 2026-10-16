import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  LogOut,
  MoreVertical,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import {
  listStaff,
  updateStaff,
  deleteStaff,
  forceLogoutStaff,
} from "../services/staffAuth.js";
import AddStaffModal from "./AddStaffModal.jsx";
import ResetPasswordModal from "./ResetPasswordModal.jsx";
import "./team.css";

const ROLE_ICONS = { owner: ShieldCheck, admin: ShieldCheck, editor: Users };

function timeAgo(iso) {
  if (!iso) return "Never";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Never";
  const diff = Date.now() - then;
  if (diff < 60_000) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/**
 * Team Management panel — staff CRUD. Only reachable by owner/admin.
 * The viewer's own row is pinned first with a "You" badge.
 */
export default function TeamPanel({ staff, isOwner }) {
  const currentId = staff?.id;
  const isAdmin = isOwner || staff?.role === "approver";

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openMenuFor, setOpenMenuFor] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [showAdd, setShowAdd] = useState(false);
  const [resetFor, setResetFor] = useState(null);
  const [confirmDeleteFor, setConfirmDeleteFor] = useState(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const users = await listStaff();
      setMembers(users);
    } catch (err) {
      setError(err?.message || "Failed to load team.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [load]);

  // Pin viewer first, then by created date desc.
  const sorted = useMemo(() => {
    const copy = [...members];
    copy.sort((a, b) => {
      if (a.id === currentId) return -1;
      if (b.id === currentId) return 1;
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });
    return copy;
  }, [members, currentId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sorted.filter((m) => {
      if (roleFilter !== "all" && m.role !== roleFilter) return false;
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (q) {
        const hay = `${m.email} ${m.displayName || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [sorted, search, roleFilter, statusFilter]);

  async function runAction(id, action, successMsg) {
    if (busyId) return;
    setBusyId(id);
    try {
      await action();
      showToast(successMsg);
      await load();
    } catch (err) {
      setError(err?.message || "Action failed.");
    } finally {
      setBusyId(null);
      setOpenMenuFor(null);
    }
  }

  const isSelf = (id) => id === currentId;
  const isLastOwner = useMemo(
    () => members.filter((m) => m.role === "owner" && m.status === "active").length <= 1,
    [members]
  );

  function canPromote(member) {
    return isOwner && member.role === "editor";
  }
  function canDemote(member) {
    if (!isOwner || member.role !== "approver") return false;
    if (member.id === currentId) return false; // can't change your own role
    return true;
  }
  // Prevent demoting the last remaining owner down to admin.
  function canRevoke(member) {
    if (!isOwner) return false;
    if (isSelf(member.id)) return false; // can't revoke yourself
    if (member.role === "owner" && isLastOwner) return false; // can't revoke last owner
    return true;
  }
  function canDelete(member) {
    if (!isOwner) return false;
    if (isSelf(member.id)) return false; // can't delete yourself
    if (member.role === "owner" && isLastOwner) return false;
    return true;
  }
  function canReset(member) {
    return isOwner && !isSelf(member.id);
  }
  function canForceLogout(member) {
    return isOwner && !isSelf(member.id);
  }
  function canRestore(member) {
    return isOwner && member.status === "revoked" && !isSelf(member.id);
  }

  async function handlePromote(member) {
    await runAction(member.id, () => updateStaff(member.id, { role: "approver" }), `${member.email} promoted to approver`);
  }
  async function handleDemote(member) {
    await runAction(member.id, () => updateStaff(member.id, { role: "editor" }), `${member.email} demoted to editor`);
  }
  async function handleRevoke(member) {
    await runAction(member.id, () => updateStaff(member.id, { status: "revoked" }), `${member.email} access revoked`);
  }
  async function handleRestore(member) {
    await runAction(member.id, () => updateStaff(member.id, { status: "active" }), `${member.email} access restored`);
  }
  async function handleForceLogout(member) {
    await runAction(member.id, () => forceLogoutStaff(member.id), `${member.email} logged out of all devices`);
  }
  async function handleDelete(member) {
    await runAction(member.id, () => deleteStaff(member.id), `${member.email} deleted`);
    setConfirmDeleteFor(null);
  }

  function roleBadgeClass(role) {
    return role === "owner" ? "team-role-owner" : role === "approver" ? "team-role-approver" : "team-role-editor";
  }

  if (loading) {
    return (
      <div className="team-panel">
        <div className="team-loading">
          <Loader2 className="team-spinner" size={18} /> Loading team…
        </div>
      </div>
    );
  }

  return (
    <div className="team-panel">
      <div className="team-header">
        <div className="team-header-copy">
          <h3>Team</h3>
          <p>Manage staff access and roles.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="team-btn-ghost" onClick={load} title="Refresh">
            <RefreshCw size={15} /> Refresh
          </button>
          {isAdmin && isOwner && (
            <button type="button" className="team-add-btn" onClick={() => setShowAdd(true)}>
              <Plus size={16} /> Add member
            </button>
          )}
        </div>
      </div>

      <div className="team-filters">
        <div className="team-search">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or name…"
            aria-label="Search team"
          />
        </div>
        <select
          className="team-filter-select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter by role"
        >
          <option value="all">All roles</option>
          <option value="owner">Owner</option>
          <option value="approver">Approver</option>
          <option value="editor">Editor</option>
        </select>
        <select
          className="team-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="revoked">Revoked</option>
        </select>
      </div>

      {error && (
        <div className="team-error">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div className="team-card">
        {filtered.length === 0 ? (
          <div className="team-empty">
            <Users size={40} />
            <div className="team-empty-title">
              {members.length === 0 ? "No team members yet. Add your first one." : "No members match your filters."}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="team-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last login</th>
                  <th>Created</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const self = isSelf(m.id);
                  const RoleIcon = ROLE_ICONS[m.role] || Users;
                  const busy = busyId === m.id;
                  return (
                    <tr key={m.id} className={self ? "team-row-you" : undefined}>
                      <td>
                        <div className="team-cell-user">
                          <span className="team-cell-name">
                            {m.displayName || "Unnamed"}
                            {self && <span className="team-you-badge">You</span>}
                          </span>
                          <span className="team-cell-email">{m.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`team-role-badge ${roleBadgeClass(m.role)}`}>
                          <RoleIcon size={12} /> {m.role}
                        </span>
                      </td>
                      <td>
                        <span className={`team-status-pill ${m.status === "active" ? "team-status-active" : "team-status-revoked"}`}>
                          {m.status === "active" ? <CheckCircle2 size={12} /> : <UserX size={12} />}
                          {m.status === "active" ? "Active" : "Revoked"}
                        </span>
                      </td>
                      <td>
                        <span className={`team-cell-time ${m.lastLoginAt ? "" : "never"}`}>
                          {m.lastLoginAt ? timeAgo(m.lastLoginAt) : "Never"}
                        </span>
                      </td>
                      <td>
                        <span className="team-cell-time">{timeAgo(m.createdAt)}</span>
                      </td>
                      <td className="team-actions">
                        {!isOwner && null}
                        {isOwner && busy ? (
                          <Loader2 className="team-spinner" size={18} style={{ color: "#8a8a94" }} />
                        ) : null}
                        {isOwner && !busy ? (
                          <button
                            type="button"
                            className="team-actions-btn"
                            onClick={() => setOpenMenuFor(openMenuFor === m.id ? null : m.id)}
                            aria-label={`Actions for ${m.email}`}
                          >
                            <MoreVertical size={16} />
                          </button>
                        ) : null}

                        {isOwner && openMenuFor === m.id && (
                          <div className="team-actions-menu">
                            {canReset(m) && (
                              <button type="button" className="team-action-item" onClick={() => { setOpenMenuFor(null); setResetFor(m); }}>
                                <RotateCcw size={14} /> Reset password
                              </button>
                            )}
                            {canForceLogout(m) && (
                              <button type="button" className="team-action-item" onClick={() => handleForceLogout(m)}>
                                <LogOut size={14} /> Force logout all devices
                              </button>
                            )}
                            {canPromote(m) && (
                              <button type="button" className="team-action-item" onClick={() => handlePromote(m)}>
                                <ShieldCheck size={14} /> Promote to admin
                              </button>
                            )}
                            {canDemote(m) && (
                              <button type="button" className="team-action-item" onClick={() => handleDemote(m)}>
                                <Users size={14} /> Demote to editor
                              </button>
                            )}
                            {canRestore(m) && (
                              <button type="button" className="team-action-item" onClick={() => handleRestore(m)}>
                                <CheckCircle2 size={14} /> Restore access
                              </button>
                            )}
                            {canRevoke(m) && (
                              <button type="button" className="team-action-item is-danger" onClick={() => handleRevoke(m)}>
                                <UserX size={14} /> Revoke access
                              </button>
                            )}
                            {canDelete(m) && (
                              <button type="button" className="team-action-item is-danger" onClick={() => { setOpenMenuFor(null); setConfirmDeleteFor(m); }}>
                                <Trash2 size={14} /> Delete permanently
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAdd && (
        <AddStaffModal
          onClose={() => setShowAdd(false)}
          onCreated={() => showToast("Member added")}
        />
      )}

      {resetFor && (
        <ResetPasswordModal
          member={resetFor}
          onClose={() => setResetFor(null)}
          onDone={() => showToast("Password reset")}
        />
      )}

      {confirmDeleteFor && (
        <div className="team-modal-overlay" role="alertdialog" aria-modal="true" aria-label="Confirm delete">
          <div className="team-modal">
            <h4>Delete member?</h4>
            <p className="team-modal-sub">
              <strong style={{ color: "#fff" }}>{confirmDeleteFor.email}</strong> will lose access
              permanently and their uploaded products will be reassigned to you.
            </p>
            <div className="team-modal-actions">
              <button type="button" className="team-btn-ghost" onClick={() => setConfirmDeleteFor(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="team-btn-primary"
                style={{ background: "#ef4444", color: "#fff" }}
                onClick={() => handleDelete(confirmDeleteFor)}
                disabled={busyId === confirmDeleteFor.id}
              >
                {busyId === confirmDeleteFor.id ? <Loader2 className="team-spinner" size={16} /> : <Trash2 size={15} />}
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="team-toast" role="status">
          <CheckCircle2 size={16} style={{ color: "#f5a623" }} /> {toast}
        </div>
      )}
    </div>
  );
}
