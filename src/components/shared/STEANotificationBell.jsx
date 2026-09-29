import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, X } from "lucide-react";
import { collection, query, where, onSnapshot, getFirebaseDb, updateDoc, doc, arrayUnion } from "../../firebase.js";

const GOLD = "#F5A623";

export function STEANotificationBell({ user, actionButtonStyle = {}, onSignIn }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
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
      arr.sort((a, b) => {
        const aUnread = a.userId ? !a.isRead : !(a.readBy || []).includes(user.uid);
        const bUnread = b.userId ? !b.isRead : !(b.readBy || []).includes(user.uid);
        if (aUnread !== bUnread) return bUnread - aUnread;
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setNotifications(arr);
    };

    const onError = (err) => {
      console.error("[notifications] Failed to load notifications:", err);
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isRead = (n) => n.userId
    ? n.isRead === true
    : (n.readBy || []).includes(user?.uid || "");

  const unreadCount = user ? notifications.filter(n => !isRead(n)).length : 0;

  const handleMarkRead = async (notification) => {
    if (!user || isRead(notification)) return;
    try {
      const db = getFirebaseDb();
      await updateDoc(doc(db, "notifications", notification.id), notification.userId
        ? { isRead: true }
        : { readBy: arrayUnion(user.uid) });
    } catch (e) {
      console.error("Failed to mark read:", e);
    }
  };

  const handleBellClick = () => {
    if (!user) {
      if (onSignIn) onSignIn();
      else window.dispatchEvent(new CustomEvent("open-auth"));
      return;
    }
    setOpen(v => !v);
  };

  return (
    <div ref={dropdownRef} className="stea-notification-bell-wrap" style={{ position: "relative", display: "inline-flex" }}>
      <button 
        type="button" 
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          border: "1px solid #E5EAF0",
          background: "#fff",
          color: "#374151",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          flexShrink: 0,
          fontFamily: "inherit",
          position: "relative",
          ...actionButtonStyle
        }} 
        onClick={handleBellClick} 
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span 
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#ef4444",
              color: "#fff",
              fontSize: 10,
              fontWeight: 900,
              display: "grid",
              placeItems: "center",
              boxShadow: "0 0 8px #ef4444"
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && user && (
        <div 
          className="stea-shared-product-header__panel"
          style={{
            position: "absolute",
            right: 0,
            top: 56,
            width: 320,
            maxHeight: 400,
            overflowY: "auto",
            padding: 12,
            border: "1px solid #E5EAF0",
            borderRadius: 20,
            background: "#fff",
            boxShadow: "0 18px 45px rgba(15, 23, 42, 0.16)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: 8
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: "#0f172a" }}>Notifications</span>
            {unreadCount > 0 && (
              <button 
                type="button"
                onClick={() => notifications.forEach(n => handleMarkRead(n))}
                style={{ background: "none", border: "none", fontSize: 11, fontWeight: 800, color: GOLD, cursor: "pointer" }}
              >
                Mark all read
              </button>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, overflowY: "auto", maxHeight: 320 }}>
            {notifications.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8", fontSize: 12 }}>
                No notifications
              </div>
            ) : (
              notifications.map((n) => {
                const read = isRead(n);
                return (
                  <div 
                    key={n.id}
                    onClick={() => handleMarkRead(n)}
                    style={{
                      padding: 10,
                      borderRadius: 12,
                      background: read ? "transparent" : "#f8fafc",
                      border: `1px solid ${read ? "#f1f5f9" : "#e2e8f0"}`,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      textAlign: "left"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: read ? "#64748b" : "#0f172a" }}>
                        {n.title || "Notification"}
                      </span>
                      {!read && (
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }} />
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: "#64748b", lineHeight: 1.3 }}>
                      {n.message}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default STEANotificationBell;
