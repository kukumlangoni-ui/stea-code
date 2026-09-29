import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, User } from "lucide-react";
import STEAAvatar from "./STEAAvatar.jsx";

const G = "#F5A623";

const MENU_SECTIONS = [
  {
    label: "Main",
    items: [
      { emoji: "🏠", name: "Home", path: "/" },
      { emoji: "📚", name: "Education", path: "/education" },
      { emoji: "🛒", name: "Marketplace", path: "/duka" },
      { emoji: "💼", name: "Gigs & Kazi", path: "/kazi" },
      { emoji: "🎨", name: "Creators", path: "/creator" },
      { emoji: "⭐", name: "STEA Official", path: "/about" },
    ],
  },
  {
    label: "Explore",
    items: [
      { emoji: "🌐", name: "Discover Websites", path: "/websites" },
      { emoji: "👤", name: "Profile", path: "/profile" },
      { emoji: "🔔", name: "Notifications", action: "scrollTop" },
    ],
  },
  {
    label: "More",
    items: [
      { emoji: "💛", name: "Support STEA", path: "/advertise" },
      { emoji: "❓", name: "Help Center", path: "/faq" },
      { emoji: "ℹ️", name: "About STEA", path: "/about" },
    ],
  },
];

export default function MobileDrawer({ isOpen, onClose, user, onAuth }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleItemClick = (item) => {
    if (item.action === "scrollTop") {
      onClose();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (item.path) {
      navigate(item.path);
      onClose();
    }
  };

  const isActive = (path) => {
    if (!path) return false;
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              zIndex: 10001,
            }}
          />

          {/* Drawer panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(320px, 85vw)",
              background: "rgba(12,12,12,0.95)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              borderLeft: "1px solid rgba(255,255,255,0.08)",
              zIndex: 10002,
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
            }}
          >
            {/* Header — close button */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                padding: "16px 16px 8px",
              }}
            >
              <button
                onClick={onClose}
                aria-label="Close menu"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#fff",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "rgba(255,255,255,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "rgba(255,255,255,0.06)";
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* User section */}
            <div
              style={{
                padding: "8px 20px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {user ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <STEAAvatar user={user} size="md" />
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontFamily:
                          "'Bricolage Grotesque', sans-serif",
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#fff",
                      }}
                    >
                      {user.displayName || "STEA User"}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontFamily:
                          "'Instrument Sans', system-ui, sans-serif",
                        fontSize: 12,
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      {user.email || ""}
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    if (onAuth) onAuth();
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 0",
                    borderRadius: 12,
                    border: "none",
                    background: `linear-gradient(135deg, ${G}, #FFD17C)`,
                    color: "#050505",
                    fontFamily:
                      "'Bricolage Grotesque', sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Menu sections */}
            <nav style={{ flex: 1, padding: "8px 0" }}>
              {MENU_SECTIONS.map((section, sIdx) => (
                <div key={section.label}>
                  {/* Section label */}
                  <p
                    style={{
                      margin: 0,
                      padding: "12px 20px 6px",
                      fontFamily:
                        "'Instrument Sans', system-ui, sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {section.label}
                  </p>

                  {section.items.map((item) => {
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.name}
                        onClick={() => handleItemClick(item)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          width: "100%",
                          padding: "14px 20px",
                          border: "none",
                          borderLeft: active
                            ? `3px solid ${G}`
                            : "3px solid transparent",
                          background: active
                            ? "rgba(245,166,35,0.06)"
                            : "transparent",
                          color: active ? G : "rgba(255,255,255,0.8)",
                          fontFamily:
                            "'Instrument Sans', system-ui, sans-serif",
                          fontSize: 14,
                          fontWeight: active ? 600 : 500,
                          cursor: "pointer",
                          textAlign: "left",
                          transition:
                            "background 0.2s, color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.background =
                              "rgba(255,255,255,0.05)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.background =
                              "transparent";
                          }
                        }}
                      >
                        <span style={{ fontSize: 18, lineHeight: 1 }}>
                          {item.emoji}
                        </span>
                        {item.name}
                      </button>
                    );
                  })}

                  {/* Divider between sections */}
                  {sIdx < MENU_SECTIONS.length - 1 && (
                    <div
                      style={{
                        height: 1,
                        margin: "4px 20px",
                        background: "rgba(255,255,255,0.06)",
                      }}
                    />
                  )}
                </div>
              ))}
            </nav>

            {/* Footer branding */}
            <div
              style={{
                padding: "16px 20px 24px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily:
                    "'Bricolage Grotesque', sans-serif",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.2)",
                }}
              >
                STEA Africa ·{" "}
                <span style={{ color: "rgba(245,166,35,0.4)" }}>
                  Built for Africa
                </span>
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
