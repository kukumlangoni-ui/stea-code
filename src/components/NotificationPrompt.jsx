import { X } from "lucide-react";
import usePushNotifications from "../hooks/usePushNotifications.js";

const G = "#F5A623";
const G2 = "#FFD17C";

export default function NotificationPrompt({ user = null }) {
  const {
    dismissPrompt,
    message,
    requestPermission,
    shouldShowPrompt,
    status,
  } = usePushNotifications(user);

  if (!shouldShowPrompt) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="STEA notification opt-in"
      style={{
        position: "fixed",
        left: "50%",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)",
        transform: "translateX(-50%)",
        zIndex: 900,
        width: "calc(100vw - 32px)",
        maxWidth: 420,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: "100%",
          border: "1px solid #E4E8ED",
          borderRadius: 14,
          padding: 14,
          background: "#fff",
          boxShadow: "0 14px 42px rgba(17,24,39,.15)",
          color: "#111827",
          pointerEvents: "auto",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              overflow: "hidden",
              border: "1px solid #F1F5F9"
            }}
          >
            <img 
              src="/stea-brand/stea-s-logo-transparent-512.png" 
              alt="STEA" 
              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, letterSpacing: 0, color: "#111827" }}>
                Get STEA updates
              </h3>
              <button
                onClick={dismissPrompt}
                aria-label="Dismiss notification prompt"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 9,
                  border: "1px solid #E5E7EB",
                  background: "#F9FAFB",
                  color: "#6B7280",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <X size={14} />
              </button>
            </div>

            <p style={{ margin: "4px 0 12px", color: "#6B7280", fontSize: 12, lineHeight: 1.35 }}>
              Receive new resources, NECTA updates, marketplace drops and important STEA announcements.
            </p>

            {message && (
              <div style={{ marginBottom: 10, color: status === "denied" || status === "error" ? "#EF4444" : "#4B5563", fontSize: 12 }}>
                {message}
              </div>
            )}

            {shouldShowPrompt && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={requestPermission}
                  disabled={status === "working"}
                  style={{
                    border: "none",
                    borderRadius: 10,
                    padding: "9px 12px",
                    background: `linear-gradient(135deg, ${G}, ${G2})`,
                    color: "#111",
                    fontSize: 12,
                    fontWeight: 900,
                    cursor: status === "working" ? "wait" : "pointer",
                    flex: "1 1 150px",
                  }}
                >
                  {status === "working" ? "Enabling..." : "Allow Notifications"}
                </button>
                <button
                  onClick={dismissPrompt}
                  style={{
                    border: "1px solid #E5E7EB",
                    borderRadius: 10,
                    padding: "9px 12px",
                    background: "#F9FAFB",
                    color: "#4B5563",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    flex: "1 1 110px",
                  }}
                >
                  Maybe Later
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
