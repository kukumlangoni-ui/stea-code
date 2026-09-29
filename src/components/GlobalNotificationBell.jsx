import { useState, useEffect, useRef } from "react";
import { Bell, Check, ExternalLink, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { collection, query, where, onSnapshot, getFirebaseDb, updateDoc, doc, arrayUnion } from "../firebase.js";
import { Link } from "react-router-dom";
import { useMobile } from "../hooks/useMobile.js";

const G = "#F5A623";

export default function GlobalNotificationBell({ user, light = false }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  const isMobile = useMobile();

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    
    const db = getFirebaseDb();
    if (!db) return;

    const globalQuery = query(
      collection(db, "notifications"),
      where("target", "==", "all"),
      where("isActive", "==", true)
    );
    const personalQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid)
    );

    let globalNotifications = [];
    let personalNotifications = [];
    const applyNotifications = () => {
      let arr = [...globalNotifications, ...personalNotifications];
      // Sort locally: unread first, then date descending
      arr.sort((a, b) => {
        const aUnread = a.userId ? !a.isRead : !(a.readBy || []).includes(user.uid);
        const bUnread = b.userId ? !b.isRead : !(b.readBy || []).includes(user.uid);
        if (aUnread !== bUnread) return bUnread - aUnread;
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setNotifications(arr);
      setLoading(false);
    };
    const onError = (err) => {
      console.error("[notifications] Failed to load notifications:", err);
      setLoading(false);
    };
    const globalUnsubscribe = onSnapshot(globalQuery, (snap) => {
      globalNotifications = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      applyNotifications();
    }, onError);
    const personalUnsubscribe = onSnapshot(personalQuery, (snap) => {
      personalNotifications = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      applyNotifications();
    }, onError);

    return () => {
      globalUnsubscribe();
      personalUnsubscribe();
    };
  }, [user]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!user) return null;

  const isRead = (notification) => notification.userId
    ? notification.isRead === true
    : (notification.readBy || []).includes(user.uid);
  const unreadCount = notifications.filter((notification) => !isRead(notification)).length;

  const handleMarkRead = async (notification) => {
    if (isRead(notification)) return;
    try {
      const db = getFirebaseDb();
      await updateDoc(doc(db, "notifications", notification.id), notification.userId
        ? { isRead: true }
        : { readBy: arrayUnion(user.uid) });
    } catch (e) {
      console.error("Failed to mark read:", e);
    }
  };

  const handleMarkAllRead = async () => {
    const unreads = notifications.filter((notification) => !isRead(notification));
    await Promise.all(unreads.map(handleMarkRead));
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Math.floor((new Date() - date) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  // 4. Amazing bell animation
  return (
    <div ref={dropdownRef} style={{ display: "flex", alignItems: "center", position: "relative" }}>
      <button 
        onClick={() => setOpen(!open)}
        className="bell-trigger"
        style={{
          background: light ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.05)",
          border: light ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.1)",
          borderRadius: "50%",
          width: 38,
          height: 38,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: light ? "#4B5563" : "#fff",
          cursor: "pointer",
          position: "relative",
          outline: "none"
        }}
        aria-label="Notifications"
      >
        <motion.div
           animate={unreadCount > 0 && !open ? { 
             rotate: [0, -10, 10, -10, 10, 0],
           } : { rotate: 0 }}
           transition={{ duration: 0.5, repeat: unreadCount > 0 && !open ? Infinity : 0, repeatDelay: 3 }}
           style={{ display: "flex" }}
        >
          <Bell size={20} />
        </motion.div>
        
        {unreadCount > 0 && (
          <motion.div
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             style={{
               position: "absolute",
               top: "6px",
               right: "6px",
               transform: "translate(30%, -30%)",
               background: "linear-gradient(135deg, #FF6B6B, #F5A623)",
               color: "#fff",
               fontSize: "11px",
               fontWeight: 700,
               minWidth: "20px",
               height: "20px",
               borderRadius: "999px",
               border: "2px solid white",
               display: "flex",
               alignItems: "center",
               justifyContent: "center",
               boxShadow: "0 0 10px rgba(245,166,35,0.5)",
               padding: "0 4px"
             }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.div>
        )}
      </button>

      {/* Centered Notifications Modal */}
      <AnimatePresence>
        {open && (
          <div
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999999,
              display: "flex",
              alignItems: isMobile ? "flex-end" : "center",
              justifyContent: "center",
              background: "rgba(0, 0, 0, 0.35)",
              backdropFilter: "blur(8px)",
              padding: isMobile ? "0" : "24px"
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              role="dialog"
              aria-modal="true"
              style={{
                width: "100%",
                maxWidth: isMobile ? "100%" : "720px",
                maxHeight: "85dvh",
                background: "#FFFFFF",
                borderRadius: isMobile ? "24px 24px 0 0" : "24px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sticky Header */}
              <div
                style={{
                  position: "sticky",
                  top: 0,
                  background: "#FFFFFF",
                  zIndex: 10,
                  padding: isMobile ? "16px 20px" : "20px 24px",
                  borderBottom: "1px solid #EEF2F7",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 16
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: isMobile ? 20 : 24, fontWeight: 900, color: "#111827", letterSpacing: "-0.02em" }}>
                    Notifications
                  </h2>
                  <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#6B7280" }}>
                    Latest updates from STEA
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close notifications"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: "1px solid #E5E7EB",
                    background: "#FFFFFF",
                    color: "#6B7280",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: isMobile ? "16px 20px" : "20px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  background: "#FAFAFA"
                }}
              >
                {loading ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading...</div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>No notifications yet.</div>
                ) : (
                  notifications.map(n => {
                    const notificationIsRead = isRead(n);
                    const notificationType = n.type || n.category || "System";
                    const categoryColor = notificationType === "Community" ? "#2563EB" : notificationType === "Education" ? "#10B981" : notificationType === "Marketplace" ? "#F97316" : "#D4AF37";
                    const actionLink = n.actionLink || n.linkUrl;

                    return (
                      <div
                        key={n.id}
                        style={{
                          padding: isMobile ? "12px 16px" : "16px 20px",
                          background: "#FFFFFF",
                          border: "1px solid #E5E7EB",
                          borderRadius: 16,
                          display: "flex",
                          gap: 12,
                          cursor: actionLink ? "pointer" : "default",
                          transition: "box-shadow 0.2s"
                        }}
                        onClick={() => {
                          if (!notificationIsRead) handleMarkRead(n);
                          if (actionLink) {
                            setOpen(false);
                          }
                        }}
                      >
                        {/* Unread dot */}
                        <div style={{ display: "flex", alignItems: "center", width: 8, justifyContent: "center", flexShrink: 0 }}>
                          {!notificationIsRead && (
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#D4AF37" }} />
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4, gap: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>{n.title}</span>
                            <span style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap" }}>{formatTime(n.createdAt)}</span>
                          </div>
                          <p style={{ margin: "0 0 10px 0", fontSize: 13, color: "#4B5563", lineHeight: 1.4, wordBreak: "break-word" }}>
                            {n.message || n.body}
                          </p>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: categoryColor, background: `${categoryColor}12`, padding: "4px 8px", borderRadius: 6 }}>
                              {notificationType}
                            </span>
                            {actionLink && (
                              <Link
                                to={actionLink}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!notificationIsRead) handleMarkRead(n);
                                  setOpen(false);
                                }}
                                style={{ fontSize: 11, color: "#D4AF37", display: "flex", alignItems: "center", gap: 2, fontWeight: 700, textDecoration: "none" }}
                              >
                                View <ExternalLink size={11} />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Sticky Footer Actions */}
              <div
                style={{
                  position: "sticky",
                  bottom: 0,
                  background: "#FFFFFF",
                  zIndex: 10,
                  padding: isMobile ? "12px 16px" : "16px 24px",
                  borderTop: "1px solid #EEF2F7",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                {unreadCount > 0 ? (
                  <button
                    onClick={handleMarkAllRead}
                    style={{ background: "#FFF8E1", border: "1px solid rgba(212,175,55,.28)", borderRadius: 9, color: "#8F6D00", fontSize: isMobile ? 12 : 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: isMobile ? "8px 10px" : "8px 12px", whiteSpace: "nowrap" }}
                  >
                    <Check size={16} /> Mark all as read
                  </button>
                ) : <span />}

                <button
                  onClick={() => setOpen(false)}
                  style={{
                    background: "#F3F4F6",
                    border: "none",
                    color: "#4B5563",
                    fontSize: 13,
                    fontWeight: 700,
                    padding: isMobile ? "8px 13px" : "8px 20px",
                    borderRadius: 10,
                    cursor: "pointer"
                  }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
