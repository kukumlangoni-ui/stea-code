import React, { useEffect, useRef, useState } from "react";
import { Bookmark, ChevronRight, Globe, LogIn, LogOut, Settings, Shield, User, UserPlus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import STEAAvatar from "../STEAAvatar.jsx";
import SettingsModal from "../SettingsModal.jsx";
import { auth, isAdminEmail } from "../../firebase";

function isAdminUser(user) {
  const role = String(user?.role || "").toLowerCase();
  return Boolean(user && (isAdminEmail(user.email) || ["super_admin", "admin", "manager", "editor"].includes(role)));
}

function getRoleLabel(user, isAdmin) {
  if (!user) return "";
  const role = String(user?.role || user?.classroomRole || "").toLowerCase();
  if (isAdmin) return "Admin";
  if (role === "teacher") return "Teacher";
  if (role === "student") return "Student";
  return "User";
}

function getAdminRoute(location) {
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const path = location.pathname || "";
  if (host === "sites.stea.africa" || path.startsWith("/websites") || path.startsWith("/site/")) return "/admin/websites";
  if (host === "classroom.stea.africa" || path.startsWith("/classroom") || path.startsWith("/teacher")) return "/admin/classroom";
  return "/admin";
}

export function STEAProfileMenu({ user, onSignIn, onSignOut }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = isAdminUser(user);
  const roleLabel = getRoleLabel(user, isAdmin);
  const adminRoute = getAdminRoute(location);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setProfileOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname, location.search]);

  const closeMenu = () => setProfileOpen(false);

  const runSignIn = () => {
    closeMenu();
    if (onSignIn) onSignIn();
    else window.dispatchEvent(new CustomEvent("open-auth"));
  };

  const runSignOut = async () => {
    closeMenu();
    if (onSignOut) onSignOut();
    else await auth.signOut();
    if (location.pathname.startsWith("/admin") || location.pathname === "/profile") navigate("/", { replace: true });
  };

  const actionButton = {
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "1px solid #E5EAF0",
    background: "#fff",
    color: "#374151",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    flexShrink: 0,
    overflow: "hidden"
  };

  const menuIcon = (icon, tone = "default") => (
    <span className={`stea-profile-menu-icon stea-profile-menu-icon--${tone}`}>{icon}</span>
  );

  const menuText = (label, description, labelStyle = {}) => (
    <span className="stea-profile-menu-copy">
      <span className="stea-profile-menu-label" style={labelStyle}>{label}</span>
      {description ? <span className="stea-profile-menu-desc">{description}</span> : null}
    </span>
  );

  const row = ({ icon, tone, label, description, onClick, admin = false, danger = false }) => (
    <button
      type="button"
      className={`stea-profile-menu-row${admin ? " admin-panel-row" : ""}`}
      onClick={onClick}
    >
      {menuIcon(icon, tone)}
      {menuText(label, description, danger ? { color: "#ef4444" } : admin ? { color: "#8F6D00" } : {})}
      {danger ? <span /> : <ChevronRight size={16} color={admin ? "rgba(143,109,0,0.5)" : "#CBD5E1"} />}
    </button>
  );

  return (
    <div ref={containerRef} className="stea-profile-menu-wrap" style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        style={actionButton}
        onClick={() => setProfileOpen((value) => !value)}
        aria-label={user ? "Profile menu" : "Guest menu"}
        aria-expanded={profileOpen}
      >
        {user ? <STEAAvatar user={user} size="sm" /> : <User size={20} />}
      </button>

      {profileOpen && (
        <div className="stea-profile-menu" role="menu" aria-label="Profile menu">
          <div className="stea-profile-card">
            <STEAAvatar user={user} size="md" />
            <div className="stea-profile-card-copy">
              <strong>{user ? (user.displayName || "STEA User") : "Guest User"}</strong>
              <span>{user ? (user.email || "No email available") : "Sign in to access your account"}</span>
              {user && <em className={isAdmin ? "admin" : ""}>{roleLabel}</em>}
            </div>
          </div>

          <div className="stea-profile-menu-list">
            {user ? (
              <>
                {isAdmin && row({
                  icon: <Shield size={18} />,
                  tone: "admin",
                  label: "Admin Panel",
                  description: "Manage STEA content",
                  admin: true,
                  onClick: () => { closeMenu(); navigate(adminRoute); }
                })}
                {row({
                  icon: <User size={18} />,
                  label: "My Profile",
                  description: "View your account",
                  onClick: () => { closeMenu(); navigate("/profile"); }
                })}
                {row({
                  icon: <Bookmark size={18} />,
                  label: "Saved Websites",
                  description: "Your favorites",
                  onClick: () => { closeMenu(); navigate("/favorites"); }
                })}
                {row({
                  icon: <Settings size={18} />,
                  label: "Account Settings",
                  description: "Preferences and security",
                  onClick: () => { closeMenu(); setSettingsOpen(true); }
                })}
                {row({
                  icon: <Globe size={18} />,
                  label: "Language",
                  description: "English (US)",
                  onClick: () => { closeMenu(); window.dispatchEvent(new CustomEvent("open-language-switcher")); }
                })}
                <div className="stea-profile-menu-divider" />
                {row({
                  icon: <LogOut size={18} />,
                  tone: "danger",
                  label: "Sign Out",
                  description: "Leave this device",
                  danger: true,
                  onClick: runSignOut
                })}
              </>
            ) : (
              <>
                {row({
                  icon: <LogIn size={18} />,
                  tone: "success",
                  label: "Sign In",
                  description: "Access your account",
                  onClick: runSignIn
                })}
                {row({
                  icon: <UserPlus size={18} />,
                  label: "Create Account",
                  description: "Join STEA today",
                  onClick: runSignIn
                })}
                <div className="stea-profile-menu-divider" />
                {row({
                  icon: <Globe size={18} />,
                  label: "Language",
                  description: "English (US)",
                  onClick: () => { closeMenu(); window.dispatchEvent(new CustomEvent("open-language-switcher")); }
                })}
              </>
            )}
          </div>
        </div>
      )}

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <style>{`
        .stea-profile-menu {
          position: fixed;
          top: 82px;
          right: 12px;
          width: min(320px, calc(100vw - 24px));
          max-height: calc(100dvh - 94px);
          overflow-y: auto;
          background: #ffffff;
          border: 1px solid #e5eaf0;
          border-radius: 22px;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.16);
          padding: 12px;
          z-index: 9999;
          box-sizing: border-box;
        }
        .stea-profile-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 16px;
          background: linear-gradient(135deg, #fff8e1, #ffffff);
          border: 1px solid rgba(212, 175, 55, 0.25);
          margin-bottom: 10px;
        }
        .stea-profile-card-copy {
          min-width: 0;
          display: grid;
          gap: 2px;
        }
        .stea-profile-card-copy strong {
          font-size: 15px;
          font-weight: 900;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .stea-profile-card-copy span {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .stea-profile-card-copy em {
          justify-self: start;
          margin-top: 4px;
          padding: 2px 8px;
          border-radius: 8px;
          background: #e2e8f0;
          color: #475569;
          font-size: 10px;
          font-style: normal;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .stea-profile-card-copy em.admin {
          background: #D4AF37;
          color: #fff;
        }
        .stea-profile-menu-list {
          display: grid;
          gap: 4px;
        }
        .stea-profile-menu-row {
          width: 100%;
          min-height: 52px;
          display: grid;
          grid-template-columns: 36px minmax(0, 1fr) 18px;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          border: none;
          background: transparent;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .stea-profile-menu-row:hover,
        .stea-profile-menu-row:active {
          background: #f8fafc;
        }
        .stea-profile-menu-icon {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #f1f5f9;
          color: #64748b;
        }
        .stea-profile-menu-icon--admin {
          background: rgba(212,175,55,0.15);
          color: #D4AF37;
        }
        .stea-profile-menu-icon--danger {
          background: #fef2f2;
          color: #ef4444;
        }
        .stea-profile-menu-icon--success {
          background: rgba(16,185,129,0.15);
          color: #10B981;
        }
        .stea-profile-menu-copy {
          min-width: 0;
          display: grid;
          gap: 2px;
        }
        .stea-profile-menu-label {
          display: block;
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .stea-profile-menu-desc {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .admin-panel-row {
          background: #fff8e1;
          border: 1px solid rgba(212, 175, 55, 0.35);
        }
        .admin-panel-row:hover,
        .admin-panel-row:active {
          background: #fff3c4;
        }
        .stea-profile-menu-divider {
          height: 1px;
          background: #e2e8f0;
          margin: 4px 0;
        }
        @media (max-width: 640px) {
          .stea-profile-menu {
            top: 70px;
            right: 10px;
            width: calc(100vw - 20px);
            max-height: calc(100dvh - 82px);
          }
        }
      `}</style>
    </div>
  );
}

export default STEAProfileMenu;
