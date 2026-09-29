import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, User, LogOut, ChevronRight, 
  Settings, CreditCard, ShieldCheck, Mail, Database, Bell
} from "lucide-react";
import { 
  getFirebaseAuth, 
  getFirebaseDb, 
  signOut,
  doc,
  getDoc,
  updateDoc
} from "../firebase.js";
import { useSettings } from "../contexts/SettingsContext.jsx";
import { Portal, G, CB, BORDER } from "./ui/LayoutUtils.jsx";
import { useMobile } from "../hooks/useMobile.js";

export function ProfileModal({ user, onClose, onUser }) {
  const isMobile = useMobile();
  const { t } = useSettings();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(user);

  useEffect(() => {
    async function fetchFullProfile() {
      const db = getFirebaseDb();
      if (!db || !user?.uid) return;
      try {
        const d = await getDoc(doc(db, "users", user.uid));
        if (d.exists()) {
          setUserData(prev => ({ ...prev, ...d.data() }));
        }
      } catch (err) {
        if (import.meta.env.DEV) console.warn("Fetch profile failed:", err);
      }
    }
    fetchFullProfile();
  }, [user?.uid]);

  const doSignOut = async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    try {
      await signOut(auth);
      onUser(null);
      onClose();
    } catch (e) {
      if (import.meta.env.DEV) console.error("SignOut failed:", e);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "account", label: "Account", icon: Settings },
    { id: "billing", label: "Orders", icon: CreditCard },
  ];

  if (userData?.role === "admin") {
    tabs.push({ id: "system", label: "Admin", icon: Database });
  }

  const TabPill = ({ label, icon: Icon, id }) => {
    const active = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          width: "100%", padding: "14px 18px", borderRadius: 12,
          background: active ? "rgba(245,166,35,.08)" : "transparent",
          border: `1px solid ${active ? "rgba(245,166,35,.15)" : "transparent"}`,
          color: active ? G : "rgba(255,255,255,.45)",
          fontWeight: active ? 800 : 500, fontSize: 13.5,
          cursor: "pointer", transition: "all .2s",
          textAlign: "left",
        }}
      >
        <Icon size={18} style={{ opacity: active ? 1 : .6 }} />
        {label}
        {active && <motion.div layoutId="active-ind" style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: G }} />}
      </button>
    );
  };

  return (
    <Portal>
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 9000,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: isMobile ? 0 : 20,
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: "absolute", inset: 0,
            background: "rgba(4,5,9,0.95)",
            backdropFilter: "blur(24px)",
          }}
        />

        <motion.div
           initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.98, y: 10 }}
           animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
           exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.98, y: 10 }}
           transition={{ type: "spring", damping: 30, stiffness: 300 }}
           style={{
             position: "relative",
             width: "100%", maxWidth: 900, height: isMobile ? "94vh" : 640,
             background: "#0d0f17",
             borderRadius: isMobile ? "32px 32px 0 0" : 32,
             border: "1px solid rgba(255,255,255,.07)",
             boxShadow: "0 40px 120px rgba(0,0,0,0.9)",
             overflow: "hidden",
             display: "flex", flexDirection: isMobile ? "column" : "row",
             alignSelf: isMobile ? "flex-end" : "center",
           }}
        >
           <div style={{
             width: isMobile ? "100%" : 280,
             background: "rgba(255,255,255,.015)",
             borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,.05)",
             borderBottom: isMobile ? "1px solid rgba(255,255,255,.05)" : "none",
             padding: 32,
             display: "flex", flexDirection: "column",
           }}>
             <div style={{ marginBottom: 36, textAlign: isMobile ? "center" : "left" }}>
               <div style={{ 
                 width: 84, height: 84, borderRadius: 24, margin: isMobile ? "0 auto 16px" : "0 0 16px",
                 background: "linear-gradient(135deg, #1e2029, #13151c)",
                 border: "1px solid rgba(255,255,255,.08)",
                 display: "flex", alignItems: "center", justifyContent: "center",
                 overflow: "hidden", position: "relative"
               }}>
                 {userData.photoURL ? (
                    <img src={userData.photoURL} referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                 ) : (
                    <User size={38} color="rgba(255,255,255,.15)" />
                 )}
               </div>
               <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4, letterSpacing: "-.02em" }}>{userData.name || userData.displayName || "STEA User"}</h3>
               <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: isMobile ? "center" : "flex-start" }}>
                 <div style={{ padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", color: G, fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }}>
                   {userData.role || "Mwanachama"}
                 </div>
               </div>
             </div>

             <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: 8, marginBottom: 24, overflowX: isMobile ? "auto" : "visible" }} className="no-scrollbar">
                {tabs.map(t => <TabPill key={t.id} {...t} />)}
             </div>

             <div style={{ marginTop: isMobile ? 0 : "auto", paddingBottom: isMobile ? 24 : 0 }}>
               <button
                 onClick={doSignOut}
                 style={{
                   width: "100%", padding: "14px", borderRadius: 12,
                   background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.15)",
                   color: "#ef4444", fontSize: 13, fontWeight: 800,
                   display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                   cursor: "pointer", transition: "0.2s"
                 }}
                 onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,.12)"}
                 onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,.08)"}
               >
                 <LogOut size={16} />
                 Sign Out
               </button>
             </div>
           </div>

           <div style={{ flex: 1, padding: "clamp(24px,5vw,52px)", overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
                 <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 32, fontWeight: 900, letterSpacing: "-.04em" }}>
                   {tabs.find(t => t.id === activeTab)?.label}
                 </h2>
                 <button onClick={onClose} style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", color: "rgba(255,255,255,.45)", width: 44, height: 44, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <X size={20} />
                 </button>
              </div>

              {activeTab === "profile" && (
                <div className="fade-in">
                  <div style={{ display: "grid", gap: 24 }}>
                    <div style={{ padding: 24, borderRadius: 20, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.05)" }}>
                       <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                          <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(245,166,35,.1)", display: "flex", alignItems: "center", justifyContent: "center", color: G }}>
                            <Mail size={22} />
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }}>Email Address</div>
                            <div style={{ fontSize: 15, fontWeight: 700 }}>{userData.email}</div>
                          </div>
                       </div>
                       <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(34,197,94,.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#4ade80" }}>
                            <ShieldCheck size={22} />
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }}>Account Status</div>
                            <div style={{ fontSize: 15, fontWeight: 700 }}>Active - Verified</div>
                          </div>
                       </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                       <div style={{ padding: 24, borderRadius: 20, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.05)", textAlign: "center" }}>
                          <div style={{ fontSize: 24, fontWeight: 900, color: G, marginBottom: 4 }}>0</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)", fontWeight: 700 }}>KOZI ZILIZOKAMILIKA</div>
                       </div>
                       <div style={{ padding: 24, borderRadius: 20, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.05)", textAlign: "center" }}>
                          <div style={{ fontSize: 24, fontWeight: 900, color: G, marginBottom: 4 }}>0</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)", fontWeight: 700 }}>ZANA ULIZODOWNLOAD</div>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "billing" && (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                   <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,.05)", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
                      <CreditCard size={28} color="rgba(255,255,255,.15)" />
                   </div>
                   <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Miamala yako</h3>
                   <p style={{ color: "rgba(255,255,255,.45)", fontSize: 14 }}>Bado huna muamala wowote uliofanyika.</p>
                </div>
              )}

              {activeTab === "account" && (
                <div style={{ display: "grid", gap: 12 }}>
                   {[
                     { label: "Badili jina la kuonekana", op: "Settings" },
                     { label: "Sanidi Double Authentication", op: "Security" },
                     { label: "Pokea Notifications za Barua pepe", op: "Notify", active: true }
                   ].map((item, idx) => (
                     <div key={idx} style={{ padding: 20, borderRadius: 16, background: "rgba(255,255,255,.022)", border: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center" }}>
                       <div style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</div>
                       <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
                          {item.active && <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 700 }}>ON</div>}
                          <ChevronRight size={16} color="rgba(255,255,255,.2)" />
                       </div>
                     </div>
                   ))}
                </div>
              )}
           </div>
        </motion.div>
      </div>
    </Portal>
  );
}
