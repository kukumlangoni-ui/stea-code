/**
 * SitesMemberMenu — Post-login member dropdown menu for STEA header
 *
 * Shows: [Avatar] Name ▾
 * Dropdown: My Favorites, My Profile, Install App, Sign Out, Admin Console (for admins)
 */
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TOKENS } from "./tokens.js";
import SuggestWebsiteModal from "./SuggestWebsiteModal.jsx";

function SitesMemberMenu({ user }) {
  const [open, setOpen] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const displayName = user?.displayName || user?.name || user?.email?.split("@")[0] || "Member";
  const initials = displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const photoURL = user?.photoURL;

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSignOut = useCallback(async () => {
    try {
      const { getFirebaseAuth, signOut } = await import("../../firebase.js");
      const auth = getFirebaseAuth();
      if (auth) await signOut(auth);
    } catch (e) {
      console.error("Sign out error:", e);
    }
    setOpen(false);
  }, []);

  const menuItems = [
    { label: "My Favorites", icon: "❤️", onClick: () => { navigate("/favorites"); setOpen(false); } },
    { label: "Suggest a Website", icon: "💡", onClick: () => { setOpen(false); setShowSuggestModal(true); } },
    { label: "My Profile", icon: "👤", onClick: () => { setOpen(false); } },
    ...(isAdmin ? [{ label: "Admin Console", icon: "⚙️", onClick: () => { navigate("/admin"); setOpen(false); } }] : []),
    { label: "Sign Out", icon: "🚪", onClick: handleSignOut, danger: true },
  ];

  return (
    <div ref={ref} style={{ position: "relative", zIndex: 100 }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "none", border: `1px solid ${TOKENS.border}`,
          borderRadius: 999, padding: "5px 12px 5px 5px",
          cursor: "pointer", color: TOKENS.text,
          fontFamily: "inherit", fontSize: 13, fontWeight: 700,
          transition: "border-color 0.15s",
        }}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {photoURL ? (
          <img
            src={photoURL} alt="" width={28} height={28}
            style={{ borderRadius: "50%", objectFit: "cover" }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: `linear-gradient(135deg, ${TOKENS.goldHi}, ${TOKENS.gold})`,
            display: "grid", placeItems: "center",
            fontSize: 11, fontWeight: 900, color: "#111",
          }}>
            {initials}
          </div>
        )}
        <span style={{
          maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {displayName.split(" ")[0]}
        </span>
        <span style={{ fontSize: 10, color: TOKENS.text3, marginLeft: -2 }}>▾</span>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            minWidth: 200,
            background: TOKENS.panel,
            border: `1px solid ${TOKENS.borderHi}`,
            borderRadius: TOKENS.radius,
            boxShadow: "0 16px 48px rgba(0,0,0,.5)",
            padding: "6px 0",
            animation: "menuFadeIn 120ms ease-out",
          }}
        >
          {/* User info */}
          <div style={{
            padding: "10px 14px 8px", borderBottom: `1px solid ${TOKENS.border}`,
            marginBottom: 4,
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: TOKENS.text }}>{displayName}</div>
            <div style={{ fontSize: 11.5, color: TOKENS.text3, marginTop: 2 }}>{user?.email}</div>
          </div>

          {menuItems.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={item.onClick}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "9px 14px",
                background: "none", border: "none",
                color: item.danger ? TOKENS.danger : TOKENS.text,
                fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                cursor: "pointer", textAlign: "left",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = TOKENS.hover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <style>{`
            @keyframes menuFadeIn {
              from { opacity: 0; transform: translateY(-4px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
      {showSuggestModal && <SuggestWebsiteModal open={showSuggestModal} user={user} onClose={() => setShowSuggestModal(false)} />}
    </div>
  );
}

export default memo(SitesMemberMenu);
