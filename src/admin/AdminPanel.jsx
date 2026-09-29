import { useState, useEffect } from "react";
import {
  getFirebaseDb, collection, addDoc, serverTimestamp, getCountFromServer, query, where, getDocs
} from "../firebase.js";
import MarketplaceManager from "./MarketplaceManager.jsx";
import ChabaManager from "./ChabaManager.jsx";

import { 
  Btn, Toast, G 
} from "./AdminUI.jsx";
import {
  AdminDashboardStyles,
  AdminSectionCard,
  AdminSidebar,
  AdminStatCard,
  AdminTopbar,
} from "./AdminDashboardComponents.jsx";
import {
  Bell,
  BookOpen,
  FileText,
  Globe,
  GraduationCap,
  Megaphone,
  MonitorCog,
  Package,
  Send,
  ShoppingBag,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { isAdminEmail } from "../firebase.js";
import TechContentManager from "./managers/TechContentManager.jsx";
import TipsResourcesManager from "./managers/TipsResourcesManager.jsx";
import ExamsHubManager from "./ExamsHubManager.jsx";
import CoursesManager from "./managers/CoursesManager.jsx";
import ResourcesManager from "./managers/ResourcesManager.jsx";
import WebsitesManager from "./managers/WebsitesManager.jsx";
import NectaManager from "./managers/NectaManager.jsx";
import PromptsManager from "./managers/PromptsManager.jsx";
import DigitalToolsManager from "./managers/DigitalToolsManager.jsx";
import SponsoredAdsManager from "./managers/SponsoredAdsManager.jsx";
import UsersManager from "./managers/UsersManager.jsx";
import SiteContentManager from "./managers/SiteContentManager.jsx";
import SubscriptionManager from "./managers/SubscriptionManager.jsx";
import NotificationsManager from "./managers/NotificationsManager.jsx";
import AdminDiagnostics from "./managers/AdminDiagnostics.jsx";
import ReportsAndAnalyticsManager from "./managers/ReportsAndAnalyticsManager.jsx";
import FeedbackManager from "./managers/FeedbackManager.jsx";

// ══════════════════════════════════════════════════════
// MAIN ADMIN PANEL
// ══════════════════════════════════════════════════════
export default function AdminPanel({ user, onBack }) {
  const [section, setSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [counts,  setCounts]  = useState({ tips:0, posts:0, updates:0, deals:0, courses:0, users:0, marketplace:0, websites:0, prompts:0, sponsored_ads:0, orders:0, subscriptions:0, payments:0, deliveries:0, message_templates:0, necta:0, exams:0, news:0, ai:0, gigs:0, chaba_products:0, chaba_orders:0, tips_resources:0, feedback:0 });
  const [countErrors, setCountErrors] = useState({});
  const [authStats, setAuthStats] = useState(null);
  const [syncingUsers, setSyncingUsers] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  // Analytics summary state
  const [feedbackSummary, setFeedbackSummary] = useState({ total:0, newCount:0, avgRating:0, repliedCount:0 });
  const [notifSummary, setNotifSummary]       = useState({ totalCampaigns:0, totalSent:0 });

  const db = getFirebaseDb();

  const toast_ = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const seedSampleData = async () => {
    if (!window.confirm("Hii itaongeza data za mfano kwenye database yako. Unaendelea?")) return;
    setLoading(true);
    try {
      // Add a tip
      await addDoc(collection(db, "tips"), {
        title: "Jinsi ya Kutumia AI Kukuza Biashara Yako",
        content: "AI inaweza kukusaidia katika mambo mengi kama vile customer service, marketing, na data analysis.",
        category: "AI & Business",
        author: "STEA Team",
        views: 0,
        createdAt: serverTimestamp(),
        imageUrl: "https://picsum.photos/seed/ai/800/600"
      });
      toast_("Data za mfano zimeongezwa!");
    } catch (err) {
      console.error(err);
      toast_("Imeshindwa kuongeza data", "error");
    } finally {
      setLoading(false);
    }
  };

  const sAllowed = (user, sectionId) => {
    const role = user?.role;
    const email = user?.email?.toLowerCase();
    if (isAdminEmail(email)) return true;
    if (role === "super_admin" || role === "admin") return true;
    if (sectionId === "overview") return true;

    let assignedSector = user?.sector || "general";
    if (assignedSector === "tech_tips") assignedSector = "tips";
    if (assignedSector === "site_updates") assignedSector = "updates";
    if (assignedSector === "ai_lab") assignedSector = "ai";
    if (assignedSector === "sponsored_ads") assignedSector = "ads";

    if (role === "manager") {
      const managerSections = (user?.sectors || [assignedSector]);
      return managerSections.includes(sectionId) || ["commerce","delivery","requests"].includes(sectionId);
    }
    if (role === "editor") {
      const editorSections = (user?.sectors || [assignedSector]);
      return editorSections.includes(sectionId);
    }
    if (role === "viewer") return sectionId === assignedSector;
    if (role === "creator") return sectionId === assignedSector;
    if (role === "seller") return ["marketplace", "orders", "tips", "content"].includes(sectionId);
    if (role === "reviewer") return sectionId === assignedSector;
    return false;
  };

  useEffect(() => {
    if (!db) return;
    const colToSection = {
      deals: "deals", marketplace: "marketplace", sponsored_ads: "ads", 
      orders: "marketplace", chaba_orders: "chaba", chaba_products: "chaba",
      subscriptions: "subs", users: "users", site_settings: "content",
      exams: "exams", gigs: "gigs", courses: "courses", resources: "resources",
      websites: "websites", prompts: "prompts", necta: "necta", tips: "tips",
      posts: "posts", updates: "updates", news: "content", ai: "content",
      deliveries: "marketplace", payments: "subs", message_templates: "notifications",
      feedback: "feedback"
    };

    const fetchAuthStats = async (sync = false) => {
      try {
        const authLib = await import("../firebase.js");
        const authInstance = authLib.getFirebaseAuth();
        if (!authInstance || !authInstance.currentUser) return;
        const token = await authInstance.currentUser.getIdToken(true);
        if (!token) return;
        
        if (sync) setSyncingUsers(true);
        const endpoint = `/api/admin/users/stats${sync ? "?sync=true" : ""}`;
        console.log("[admin] fetching auth stats:", endpoint);
        const res = await fetch(endpoint, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const contentType = res.headers.get("content-type") || "";
        console.log("[admin] auth stats response:", res.status, contentType);
        if (!res.ok) {
          let detail = `Auth stats endpoint failed (${res.status}).`;
          if (contentType.includes("application/json")) {
            const err = await res.json().catch(() => ({}));
            detail = err.detail || err.error || detail;
          } else {
            detail = "Admin backend endpoint is unavailable on this server.";
          }
          throw new Error(detail);
        }
        if (!contentType.includes("application/json")) {
          throw new Error("Admin backend returned HTML instead of JSON for auth stats. Check /api/admin/users/stats routing.");
        }
        const data = await res.json();
        setAuthStats(data);
        if (sync) toast_(`Imesawazisha! Profaili ${data.syncedCount} zimeundwa.`);
      } catch (e) {
        console.error("Failed to fetch auth stats:", e);
        if (sync) toast_(e.message || "Failed to sync auth stats", "error");
      } finally {
        if (sync) setSyncingUsers(false);
      }
    };

    const fetchCounts = async () => {
      fetchAuthStats();
      const cols = Object.keys(colToSection);
      cols.forEach(async (c) => {
        const sectionId = colToSection[c];
        if (!sAllowed(user, sectionId)) return;
        try {
          const countRef = c === "feedback"
            ? query(collection(db, c), where("status", "==", "new"))
            : collection(db, c);
          const snapshot = await getCountFromServer(countRef);
          setCounts(prev => ({ ...prev, [c]: snapshot.data().count }));
        } catch (err) {
          console.error(`Error counting ${c}:`, err);
          setCountErrors(prev => ({ ...prev, [c]: err.message }));
        }
      });
    };

    const fetchAnalytics = async () => {
      if (!db) return;
      try {
        // Feedback analytics – use statically imported getDocs/collection
        const fbSnap = await getDocs(collection(db, "feedback"));
        const fbDocs = fbSnap.docs.map(d => d.data());
        const total        = fbDocs.length;
        const newCount     = fbDocs.filter(d => (d.status||"new") === "new").length;
        const repliedCount = fbDocs.filter(d => d.status === "replied").length;
        const avgRating    = total ? (fbDocs.reduce((s,d)=>s+(Number(d.rating)||0),0)/total).toFixed(1) : 0;
        setFeedbackSummary({ total, newCount, avgRating: Number(avgRating), repliedCount });

        // Notification analytics
        const nSnap = await getDocs(collection(db, "notificationCampaigns"));
        const nDocs = nSnap.docs.map(d => d.data());
        const totalCampaigns = nDocs.length;
        const totalSent      = nDocs.reduce((s,d)=>s+(d.sentCount||0),0);
        setNotifSummary({ totalCampaigns, totalSent });
      } catch {}
    };

    fetchCounts();
    fetchAnalytics();
    window.__syncAuthStats = () => fetchAuthStats(true);
    const interval = setInterval(fetchCounts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [db, user, section]);

  const triggerAuthSync = () => {
    if (window.__syncAuthStats) window.__syncAuthStats();
  };

  const SECTIONS = [
    { id:"overview", icon:"📊", label:"System Overview" },
    { id:"exams",    icon:"📖", label:"Exam Hub" },
    { id:"gigs",     icon:"💼", label:"Gigs & Talent" },
    { id:"courses",  icon:"🎓", label:"Course Portal" },
    { id:"resources", icon:"📚", label:"Resources Hub" },
    { id:"tips_resources", icon:"📋", label:"Tips Resources" },
    { id:"websites", icon:"🌐", label:"Website Templates" },
    { id:"content",  icon:"📝", label:"Site Content" },
    { id:"tips",     icon:"💡", label:"Daily Tech Tips" },
    { id:"updates",  icon:"📢", label:"Platform Updates" },
    { id:"prompts",  icon:"🤖", label:"Prompt Lab" },
    { id:"deals",    icon:"🛠️", label:"Digital Tools" },
    { id:"subs",     icon:"💳", label:"Payments & Subscriptions" },
    { id:"payments", icon:"💰", label:"Master Payment Methods" },
    { id:"marketplace", icon:"🛒", label:"Tanzania Marketplace" },
    { id:"chaba", icon:"🇨🇳", label:"Agiza China (Chaba)" },
    { id:"notifications", icon:"🔔", label:`Notifications${counts.feedback ? ` • ${counts.feedback}` : ""}` },
    { id:"feedback", icon:"💬", label:`Feedback Inbox${counts.feedback ? ` • ${counts.feedback}` : ""}` },
    { id:"ads", icon:"📢", label:"Sponsored Ads" },
    { id:"necta",    icon:"🎓", label:"NECTA Results" },
    { id:"reports",  icon:"⚠️", label:"Reports & Analytics" },
    { id:"users",    icon:"👥", label:"Users / Team" },
    { id:"diagnostics", icon:"🛠️", label:"Diagnostics & Logs" },
  ];

  const filteredSections = SECTIONS.filter(s => sAllowed(user, s.id));
  const activeSection = filteredSections.find(s => s.id === section) || filteredSections[0] || { label: "Dashboard", id: "overview" };
  const openSection = (id) => {
    setSection(id);
    setSidebarOpen(false);
  };

  if (!user || user.status === "disabled" || (!isAdminEmail(user.email) && !['admin', 'super_admin', 'manager', 'seller', 'creator', 'reviewer', 'editor'].includes(user.role))) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#ff85cf", fontFamily: "'Instrument Sans', sans-serif" }}>
         <h3 style={{ fontSize: 24, marginBottom: 12 }}>Access Denied</h3>
         <p style={{ color: "rgba(255,255,255,0.6)" }}>You do not have permission to access the Stea Admin Dashboard.</p>
         <button onClick={onBack} style={{ marginTop: 24, padding: "12px 24px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Go Back</button>
      </div>
    );
  }

  return (
    <>
      <AdminDashboardStyles />
      <div className="admin-layout">
        <AdminSidebar
          sections={filteredSections}
          activeId={section}
          onSelect={openSection}
          onBack={onBack}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
        />

        <div className="admin-main-container">
          <AdminTopbar
            title={activeSection.label || "Dashboard"}
            breadcrumb={`Admin / ${activeSection.label || "Dashboard"}`}
            user={user}
            onMenu={() => setSidebarOpen(true)}
            onQuickAction={() => setSection("notifications")}
          />

          <div className="admin-main-content">
            {section === "overview" && (
              <div>
                {toast && <Toast msg={toast.msg} type={toast.type} />}
                <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
                  <div style={{ minWidth: 280, flex: 1 }}>
                    <h1 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 32, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
                      Karibu, <span style={{ color: G }}>{user?.displayName || "Admin"}</span> 👋
                    </h1>
                    <p style={{ color: "rgba(255,255,255,.45)", fontSize: 15, margin: 0, lineHeight: 1.5 }}>
                      Mifumo yote ya STEA ipo mikononi mwako. Dhibiti content, watumiaji, na malipo hapa.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    {authStats?.missingProfilesCount > 0 && (
                      <Btn onClick={triggerAuthSync} disabled={syncingUsers} color="#10b981" textColor="#fff" style={{ height: 46 }}>
                        {syncingUsers ? "Inasawazisha..." : `🔄 Sawazisha Profaili ${authStats.missingProfilesCount}`}
                      </Btn>
                    )}
                    <Btn onClick={seedSampleData} disabled={loading} color="rgba(255,255,255,.05)" textColor="#fff" style={{ border: "1px solid rgba(255,255,255,.1)", height: 46 }}>
                      {loading ? "Inaongeza..." : "🌱 Ongeza Data za Mfano"}
                    </Btn>
                  </div>
                </div>

                {/* ── Analytics Summary Bar ── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
                  {/* Users health */}
                  <div style={{ background: "rgba(255,133,207,0.06)", border: "1px solid rgba(255,133,207,0.15)", borderRadius: 16, padding: "16px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 18 }}>👥</span>
                      <span style={{ fontWeight: 800, fontSize: 13, color: "rgba(255,255,255,.7)" }}>User Health</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "rgba(255,255,255,.4)" }}>Auth users</span>
                        <strong style={{ color: "#ff85cf" }}>{authStats?.authUsersCount ?? "—"}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "rgba(255,255,255,.4)" }}>Firestore profiles</span>
                        <strong style={{ color: "#a5b4fc" }}>{authStats?.firestoreUsersCount ?? "—"}</strong>
                      </div>
                      {(authStats?.missingProfilesCount || 0) > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                          <span style={{ color: "rgba(255,255,255,.4)" }}>Missing profiles</span>
                          <strong style={{ color: "#f87171" }}>{authStats.missingProfilesCount}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Feedback analytics */}
                  <div style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.15)", borderRadius: 16, padding: "16px 18px" }} onClick={() => setSection("feedback")} role="button" title="Open Feedback">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, cursor: "pointer" }}>
                      <span style={{ fontSize: 18 }}>💬</span>
                      <span style={{ fontWeight: 800, fontSize: 13, color: "rgba(255,255,255,.7)" }}>Feedback</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "rgba(255,255,255,.4)" }}>Total</span>
                        <strong style={{ color: G }}>{feedbackSummary.total}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "rgba(255,255,255,.4)" }}>New / unread</span>
                        <strong style={{ color: feedbackSummary.newCount > 0 ? "#34d399" : "rgba(255,255,255,.4)" }}>{feedbackSummary.newCount}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "rgba(255,255,255,.4)" }}>Avg rating</span>
                        <strong style={{ color: G }}>{feedbackSummary.avgRating > 0 ? `${feedbackSummary.avgRating} ★` : "—"}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Notifications analytics */}
                  <div style={{ background: "rgba(103,240,193,0.06)", border: "1px solid rgba(103,240,193,0.15)", borderRadius: 16, padding: "16px 18px" }} onClick={() => setSection("notifications")} role="button" title="Open Notifications">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, cursor: "pointer" }}>
                      <span style={{ fontSize: 18 }}>🔔</span>
                      <span style={{ fontWeight: 800, fontSize: 13, color: "rgba(255,255,255,.7)" }}>Notifications</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "rgba(255,255,255,.4)" }}>Campaigns sent</span>
                        <strong style={{ color: "#67f0c1" }}>{notifSummary.totalCampaigns}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "rgba(255,255,255,.4)" }}>Total delivered</span>
                        <strong style={{ color: "#67f0c1" }}>{notifSummary.totalSent.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Platform content */}
                  <div style={{ background: "rgba(161,190,252,0.06)", border: "1px solid rgba(161,190,252,0.15)", borderRadius: 16, padding: "16px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 18 }}>📚</span>
                      <span style={{ fontWeight: 800, fontSize: 13, color: "rgba(255,255,255,.7)" }}>Content</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "rgba(255,255,255,.4)" }}>Courses</span>
                        <strong style={{ color: "#a5b4fc" }}>{counts.courses}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "rgba(255,255,255,.4)" }}>Resources</span>
                        <strong style={{ color: "#a5b4fc" }}>{counts.resources}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "rgba(255,255,255,.4)" }}>Exams</span>
                        <strong style={{ color: "#a5b4fc" }}>{counts.exams}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="admin-grid" style={{ marginBottom: 32 }}>
                  <AdminStatCard icon={GraduationCap} label="Courses" value={counts.courses} error={countErrors.courses} color="#67f0c1" helper="Total active programs" />
                  <AdminStatCard icon={BookOpen} label="Resources" value={counts.resources} error={countErrors.resources} color="#a5b4fc" helper="Study guides & files" />
                  <AdminStatCard icon={ShoppingBag} label="TZ Products" value={counts.marketplace} error={countErrors.marketplace} color="#fbbf24" helper="Marketplace items" />
                  <AdminStatCard icon={ShoppingBag} label="Agiza China" value={counts.chaba_products} error={countErrors.chaba_products} color="#67f0c1" helper="Chaba marketplace" />
                  <AdminStatCard icon={Zap} label="Subscriptions" value={counts.subscriptions} error={countErrors.subscriptions} color="#a5b4fc" helper="Active user plans" />
                  <AdminStatCard icon={Package} label="TZ Orders" value={counts.orders} error={countErrors.orders} color="#67f0c1" helper="Total shop orders" />
                  <AdminStatCard icon={Package} label="China Orders" value={counts.chaba_orders} error={countErrors.chaba_orders} color="#ff85cf" helper="Chaba shipments" />
                  <AdminStatCard icon={Megaphone} label="Ads" value={counts.sponsored_ads} error={countErrors.sponsored_ads} color="#f5a623" helper="Live promotions" />
                  <AdminStatCard icon={Users} label="Auth Users" value={authStats?.authUsersCount || counts.users} error={countErrors.users} color="#ff85cf" helper="Total registered" />
                  <AdminStatCard icon={Users} label="User Profiles" value={authStats?.firestoreUsersCount || counts.users} color="#818cf8" helper="Firestore profiles" />
                  <AdminStatCard icon={FileText} label="Exams" value={counts.exams} error={countErrors.exams} color="#a5b4fc" helper="Hub documents" />
                  <AdminStatCard icon={Users} label="Gigs" value={counts.gigs} error={countErrors.gigs} color="#818cf8" helper="Open opportunities" />
                  <AdminStatCard icon={Globe} label="Websites" value={counts.websites} error={countErrors.websites} color="#818cf8" helper="Tech solutions" />
                  <AdminStatCard icon={Sparkles} label="Prompts" value={counts.prompts} error={countErrors.prompts} color="#ff85cf" helper="AI templates" />
                  <AdminStatCard icon={MonitorCog} label="Site Content" value={counts.site_settings} error={countErrors.site_settings} color="#67f0c1" helper="Global configurations" />
                </div>

                <AdminSectionCard title="Quick actions">
                  <div className="admin-quick-grid">
                    {[
                      { title: "Add course", desc: "Create or update a learning program.", target: "courses", icon: <GraduationCap size={20} /> },
                      { title: "Add resource", desc: "Upload guides, files, and study assets.", target: "resources", icon: <BookOpen size={20} /> },
                      { title: "Add website/tool", desc: "Publish websites or digital tools.", target: "websites", icon: <Globe size={20} /> },
                      { title: "Add post/update", desc: "Create tips, guides, and announcements.", target: "content", icon: <FileText size={20} /> },
                      { title: "Send notification", desc: "Reach opted-in STEA users.", target: "notifications", icon: <Send size={20} /> },
                      { title: "Feedback inbox", desc: "Review user ratings and maoni.", target: "feedback", icon: <Bell size={20} /> },
                      { title: "Review feedback", desc: "Check users, requests, and engagement.", target: "users", icon: <Users size={20} /> },
                    ].filter(action => sAllowed(user, action.target)).map(action => (
                      <button key={action.title} className="admin-quick-card" onClick={() => setSection(action.target)}>
                        <div style={{ color: G, marginBottom: 4 }}>{action.icon}</div>
                        <strong>{action.title}</strong>
                        <span>{action.desc}</span>
                      </button>
                    ))}
                  </div>
                </AdminSectionCard>
              </div>
            )}

            {sAllowed(user, "marketplace") && section === "marketplace" && <><h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 28, margin: "0 0 24px" }}>🛒 <span style={{ color: G }}>STEA Duka (Marketplace)</span></h2><MarketplaceManager user={user}/></>}
            {section === "ads" && <><h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 28, margin: "0 0 24px" }}>📢 <span style={{ color: G }}>Sponsored Ads</span></h2><SponsoredAdsManager /></>}
            {sAllowed(user, "subs") && section === "subs" && <SubscriptionManager user={user}/>}
            {sAllowed(user, "payments") && section === "payments" && <SubscriptionManager user={user} defaultTab="methods" />}
            {sAllowed(user, "chaba") && section === "chaba" && <ChabaManager />}
            {section === "notifications" && <NotificationsManager />}
            {sAllowed(user, "feedback") && section === "feedback" && <FeedbackManager />}
            {sAllowed(user, "deals") && section === "deals" && <><h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 28, margin: "0 0 24px" }}>🏷️ Manage <span style={{ color: G }}>Digital Tools</span></h2><DigitalToolsManager user={user}/></>}
            {sAllowed(user, "exams") && section === "exams" && <><h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 28, margin: "0 0 24px" }}>📝 Manage <span style={{ color: G }}>Exam Hub</span></h2><ExamsHubManager user={user}/></>}
            {sAllowed(user, "gigs") && section === "gigs" && <><h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 28, margin: "0 0 24px" }}>💼 Manage <span style={{ color: G }}>Gigs & Jobs</span></h2><TechContentManager collectionName="gigs" user={user}/></>}
            {sAllowed(user, "courses") && section === "courses" && <><h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 28, margin: "0 0 24px" }}>🎓 Manage <span style={{ color: G }}>Courses</span></h2><CoursesManager user={user}/></>}
            {sAllowed(user, "resources") && section === "resources" && <><h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 28, margin: "0 0 24px" }}>📚 Manage <span style={{ color: G }}>Resources</span></h2><ResourcesManager user={user}/></>}
            {section === "tips_resources" && <><h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 28, margin: "0 0 24px" }}>📋 Manage <span style={{ color: G }}>Tips Resources</span></h2><TipsResourcesManager user={user}/></>}
            {sAllowed(user, "websites") && section === "websites" && <><h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 28, margin: "0 0 24px" }}>🌐 Manage <span style={{ color: G }}>Websites</span></h2><WebsitesManager user={user}/></>}
            {sAllowed(user, "tips") && section === "tips" && <><h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 28, margin: "0 0 24px" }}>💡 Manage <span style={{ color: G }}>Daily Tech Tips</span></h2><TechContentManager collectionName="tips" user={user}/></>}
            {sAllowed(user, "updates") && section === "updates" && <><h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 28, margin: "0 0 24px" }}>📢 Manage <span style={{ color: G }}>Platform Updates</span></h2><TechContentManager collectionName="updates" user={user}/></>}
            {sAllowed(user, "prompts") && section === "prompts" && <><h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 28, margin: "0 0 24px" }}>🤖 Manage <span style={{ color: G }}>Prompt Lab</span></h2><PromptsManager user={user}/></>}
            {sAllowed(user, "necta") && section === "necta" && <><h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 28, margin: "0 0 24px" }}>🎓 Manage <span style={{ color: G }}>NECTA Results</span></h2><NectaManager user={user}/></>}
            {sAllowed(user, "content") && section === "content" && <><h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 28, margin: "0 0 24px" }}>📝 Manage <span style={{ color: G }}>Site Content</span></h2><SiteContentManager user={user}/></>}
            {sAllowed(user, "reports") && section === "reports" && <><h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 28, margin: "0 0 24px" }}>⚠️ <span style={{ color: G }}>Reports & Analytics</span> Center</h2><ReportsAndAnalyticsManager user={user}/></>}
            {sAllowed(user, "users") && section === "users" && <><h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 28, margin: "0 0 24px" }}>👥 Manage <span style={{ color: G }}>Users</span></h2><UsersManager user={user}/></>}
            {sAllowed(user, "diagnostics") && section === "diagnostics" && <AdminDiagnostics user={user} />}

            {section !== "overview" && !sAllowed(user, section) && (
              <div style={{ padding: 40, textAlign: 'center', color: '#ff4444' }}>
                <h2>Access Denied</h2>
                <p>You do not have permission to view this section.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
