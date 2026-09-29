import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AlertTriangle, BookOpen, Box, ClipboardList, Globe, Info, MessageSquare, Package, RefreshCw, School, ShieldAlert, Users, X } from "lucide-react";
import { startAfter } from "firebase/firestore";
import { collection, getCountFromServer, getDocs, getFirebaseDb, limit, orderBy, query, doc, getDoc } from "../firebase.js";
import { AdminLayout, AdminPageHeader } from "./AdminLayout.jsx";
import { getPreviewCollectionCount, getPreviewCollectionDocs } from "./previewData.js";
import { ADMIN_V2_NAVIGATION, hasAdminV2Permission } from "./permissions.js";
import ClassroomPage from "./ClassroomPage.jsx";
import WebsitesPage from "./WebsitesPage.jsx";
import ToolsPage from "./ToolsPage.jsx";
import MarketplacePage from "./MarketplacePage.jsx";
import ServicesPage from "./ServicesPage.jsx";
import NotificationsPage from "./NotificationsPage.jsx";
import DailyPage from "./DailyPage.jsx";
import UsersPage from "./UsersPage.jsx";
import MarketingPage from "./MarketingPage.jsx";
import EducationPage from "./EducationPage.jsx";
import CommunityPage from "./CommunityPage.jsx";

const DASHBOARD_METRICS = [
  ["Users", "users", Users], ["Resources", "study_resources", BookOpen], ["Websites", "websites", Globe], ["Products", "products", Package],
  ["Orders", "marketplace_orders", ClipboardList], ["Classes", "classes", School], ["Feedback", "feedback", MessageSquare], ["Notifications", "notificationCampaigns", Box],
];

const COLLECTION_INVENTORY = [
  { name:"users", status:"Active", type:"Identity profiles", risk:"Critical", action:"Keep", purpose:"User profiles, role metadata, classroom role, and seller state.", usedBy:"Auth, Profile, Classroom, Student Center, Marketplace admin", dependencies:"Firebase Auth, admins", duplicate:"None", migration:"Retain as the canonical user profile collection." },
  { name:"admins", status:"Active", type:"Admin identity", risk:"Critical", action:"Keep", purpose:"UID-based administrator identity records.", usedBy:"App authentication bootstrap", dependencies:"users, Firebase Auth", duplicate:"None", migration:"Retain; future role actions require audit logging." },
  { name:"study_resources", status:"Active", type:"Academic content", risk:"Critical", action:"Keep", purpose:"Canonical academic notes, papers, and teacher/student resource uploads.", usedBy:"Notes, Past Papers, Exams Hub, teacher tools", dependencies:"users, Storage", duplicate:"education_notes, education_past_papers, notes, past_papers", migration:"Canonical academic destination; consolidate only in a future approved migration." },
  { name:"resources", status:"Active", type:"General resources", risk:"High", action:"Keep", purpose:"General resource and current Tips Resources listing content.", usedBy:"Explore, Tips Resources, admin resource managers", dependencies:"Storage", duplicate:"tips_resources", migration:"Keep while the tips content boundary is formally decided." },
  { name:"tips_resources", status:"Duplicate", type:"Tips detail path", risk:"High", action:"Review", purpose:"Published tips resource detail route content.", usedBy:"TipsResourceDetailPage", dependencies:"Storage", duplicate:"resources", migration:"Resolve listing/detail mismatch before any consolidation." },
  { name:"education_notes", status:"Unknown", type:"Education notes", risk:"Medium", action:"Review", purpose:"Standalone Education Notes page uploads.", usedBy:"EducationNotesPage, UploadDocumentModal", dependencies:"Storage", duplicate:"study_resources", migration:"Inventory schema and records before migration planning." },
  { name:"education_past_papers", status:"Unknown", type:"Education papers", risk:"Medium", action:"Review", purpose:"Standalone Education Past Papers uploads.", usedBy:"EducationPastPapersPage, UploadDocumentModal", dependencies:"Storage", duplicate:"study_resources", migration:"Inventory schema and records before migration planning." },
  { name:"notes", status:"Legacy", type:"Legacy academic content", risk:"High", action:"Migrate Later", purpose:"Legacy name found in rules and diagnostic scripts only.", usedBy:"No runtime page confirmed", dependencies:"Unknown", duplicate:"study_resources", migration:"Do not touch until authenticated counts and samples are reviewed." },
  { name:"past_papers", status:"Legacy", type:"Legacy academic content", risk:"High", action:"Migrate Later", purpose:"Legacy collection name discovered by audit scripts.", usedBy:"No runtime page confirmed", dependencies:"Unknown", duplicate:"study_resources", migration:"Do not touch until authenticated counts and samples are reviewed." },
  { name:"classes", status:"Active", type:"Canonical classrooms", risk:"Critical", action:"Keep", purpose:"Current classroom parent records.", usedBy:"Classroom, join/view, attendance and quiz flows", dependencies:"classStudents, assignments, quizzes, attendanceSessions", duplicate:"attendanceClasses", migration:"Canonical classroom collection; retain compatibility reads during future migration." },
  { name:"attendanceClasses", status:"Legacy", type:"Classroom compatibility", risk:"Critical", action:"Migrate Later", purpose:"Legacy classroom parent records still read by classroom flows.", usedBy:"Classroom, Class Join, Attendance Class View", dependencies:"classStudents, attendance subcollections", duplicate:"classes", migration:"Requires class, membership, and reference reconciliation." },
  { name:"attendanceSessions", status:"Active", type:"Attendance sessions", risk:"Critical", action:"Keep", purpose:"Time-bound attendance sessions.", usedBy:"Classroom and attendance components", dependencies:"records subcollection, classes", duplicate:"attendanceRecords", migration:"Retain as canonical session model." },
  { name:"attendanceRecords", status:"Legacy", type:"Flat attendance fallback", risk:"High", action:"Migrate Later", purpose:"Legacy top-level attendance records fallback.", usedBy:"StudentDashboard", dependencies:"users, classes", duplicate:"attendanceSessions/records", migration:"Map only after record-level validation." },
  { name:"assignments", status:"Active", type:"Class assignments", risk:"Critical", action:"Keep", purpose:"Assignments and teacher-created class notes.", usedBy:"Classroom, teacher dashboard", dependencies:"classes, assignmentSubmissions, Storage", duplicate:"None", migration:"Retain." },
  { name:"assignmentSubmissions", status:"Active", type:"Student submissions", risk:"Critical", action:"Keep", purpose:"Student work, grading, marks, and feedback.", usedBy:"Classroom, ClassReports, grading tools", dependencies:"assignments, users, Storage", duplicate:"None", migration:"Retain." },
  { name:"quizzes", status:"Active", type:"Class quizzes", risk:"Critical", action:"Keep", purpose:"Quiz definitions and nested submissions.", usedBy:"Classroom, quiz player, teacher tools", dependencies:"classes, submissions subcollection", duplicate:"None", migration:"Retain." },
  { name:"quizResults", status:"Active", type:"Quiz attempts", risk:"Critical", action:"Keep", purpose:"Top-level quiz attempts and leaderboard data.", usedBy:"Quiz player, leaderboards, teacher dashboard", dependencies:"quizzes, users", duplicate:"None", migration:"Retain." },
  { name:"products", status:"Active", type:"Marketplace catalog", risk:"Critical", action:"Keep", purpose:"Marketplace products and seller inventory.", usedBy:"Marketplace, checkout, seller/admin tools", dependencies:"users, sellers, Storage", duplicate:"None", migration:"Retain." },
  { name:"marketplace_orders", status:"Active", type:"Marketplace orders", risk:"Critical", action:"Keep", purpose:"Primary Tanzania marketplace order record.", usedBy:"orderService, MarketplaceManager", dependencies:"products, users, payments", duplicate:"orders", migration:"Canonical marketplace order collection." },
  { name:"orders", status:"Duplicate", type:"Compatibility orders", risk:"High", action:"Migrate Later", purpose:"Unified order copy created by marketplace checkout.", usedBy:"Seller/Admin order views, tracking fallback", dependencies:"marketplace_orders", duplicate:"marketplace_orders", migration:"Reconcile business order IDs before making read-only legacy." },
  { name:"payments", status:"Active", type:"Payment review", risk:"High", action:"Keep", purpose:"Payment evidence and review status.", usedBy:"PaymentReviewManager", dependencies:"orders, service subscriptions", duplicate:"None", migration:"Retain." },
  { name:"websites", status:"Active", type:"Website directory", risk:"High", action:"Keep", purpose:"Published website solutions and metadata.", usedBy:"WebsiteSolutionsPage, WebsitesManager", dependencies:"website_solution_categories, Storage", duplicate:"website_solutions", migration:"Retain; review legacy path separately." },
  { name:"digital_tools", status:"Active", type:"Digital tool catalog", risk:"High", action:"Keep", purpose:"Primary digital tools data path.", usedBy:"Digital Tools UI and manager", dependencies:"servicePaymentMethods, tool subscriptions", duplicate:"digitalTools", migration:"Canonical tool destination after checksum validation." },
  { name:"digitalTools", status:"Duplicate", type:"Compatibility digital catalog", risk:"High", action:"Migrate Later", purpose:"Same-ID compatibility copy for digital tools.", usedBy:"Digital Tools UI and legacy subscription manager", dependencies:"digital_tools", duplicate:"digital_tools", migration:"Stop dual-write only after verified migration and rollback plan." },
  { name:"notifications", status:"Active", type:"In-app notifications", risk:"High", action:"Keep", purpose:"Global and classroom notification records.", usedBy:"Global bell, classroom, notifications manager", dependencies:"users", duplicate:"None", migration:"Retain." },
  { name:"notificationCampaigns", status:"Active", type:"Notification campaigns", risk:"High", action:"Keep", purpose:"Broadcast campaign history and delivery counts.", usedBy:"NotificationsManager", dependencies:"notificationTokens", duplicate:"None", migration:"Retain." },
  { name:"notificationTokens", status:"Active", type:"Push tokens", risk:"Critical", action:"Keep", purpose:"Active device push-token registry.", usedBy:"usePushNotifications, notification send API", dependencies:"Firebase Messaging, users", duplicate:"fcm_tokens not detected", migration:"Retain and protect." },
  { name:"feedback", status:"Active", type:"Feedback inbox", risk:"High", action:"Keep", purpose:"User ratings, suggestions, and admin replies.", usedBy:"Feedback popup, FeedbackManager", dependencies:"users", duplicate:"None", migration:"Retain." },
  { name:"reports", status:"Active", type:"Content reports", risk:"High", action:"Keep", purpose:"Reported content and moderation records.", usedBy:"ReportModal, ReportsAndAnalyticsManager", dependencies:"users, resources", duplicate:"None", migration:"Retain." },
  { name:"service_requests", status:"Active", type:"Service requests", risk:"High", action:"Keep", purpose:"Website, app, and system service inquiries.", usedBy:"ServiceRequestPage, WebsiteDesignServicePage", dependencies:"users", duplicate:"None", migration:"Retain." },
  { name:"classroomAuditLogs", status:"Active", type:"Classroom audit trail", risk:"High", action:"Keep", purpose:"Partial classroom action history.", usedBy:"Attendance and submission tools", dependencies:"classes, users", duplicate:"audit_logs", migration:"Keep while unified audit_logs architecture is introduced later." },
  { name:"audit_logs", status:"Unknown", type:"Planned audit architecture", risk:"Low", action:"Unknown", purpose:"Future immutable administrative audit log collection.", usedBy:"Not implemented", dependencies:"Privileged server actions", duplicate:"classroomAuditLogs", migration:"Do not create from this inspector." },
];

const DUPLICATE_GROUPS = [
  ["Classes", "classes", "attendanceClasses", "classes remains canonical; attendanceClasses remains a protected legacy compatibility path."],
  ["Digital tools", "digital_tools", "digitalTools", "digital_tools is canonical; digitalTools remains dual-written compatibility data."],
  ["Marketplace orders", "marketplace_orders", "orders", "marketplace_orders is canonical; orders requires ID reconciliation before retirement."],
  ["General resources", "resources", "tips_resources", "Current listing/detail paths differ; decide the content boundary before any migration."],
  ["Academic resources", "study_resources", "education_notes / education_past_papers / notes / past_papers", "study_resources is the canonical academic destination; legacy paths require inventory first."],
];

const pageConfig = {
  users:["Users", "Real Firebase Authentication user management and exports."], marketing:["Marketing", "Email contacts, Brevo exports, and future direct sync foundation."], education:["Education", "Academic content inventory for notes, papers, resources, and tips."], classroom:["Classroom", "Classes, attendance, assignments, quizzes, and submissions."], websites:["Websites", "Website solutions and category management foundation."], marketplace:["Marketplace", "Products, orders, payments, and sellers."], services:["Services", "Service requests, subscriptions, and payment methods."], notifications:["Notifications", "Campaign history and in-app notification foundation."], feedback:["Feedback", "Feedback, reports, bugs, and suggestions."], analytics:["Analytics", "Read-only analytics foundation. Aggregates are intentionally not created yet."], security:["Security", "Security and audit log foundation. No destructive controls are enabled."], settings:["Settings", "Read-only configuration foundation for site and payment settings."],
};

function formatCount(value) { return value === null ? "Unavailable" : value.toLocaleString(); }

function DashboardPage({ devPreview, user }) {
  const [counts, setCounts] = useState(() => Object.fromEntries(DASHBOARD_METRICS.map(([, key]) => [key, devPreview ? getPreviewCollectionCount(key) : null])));
  const [error, setError] = useState("");
  const [pwaMetrics, setPwaMetrics] = useState({
    installPromptShownCount: 0,
    installAcceptedCount: 0,
    installDismissedCount: 0,
    standaloneOpenCount: 0,
    webVisitCount: 0
  });

  useEffect(() => {
    let active = true;
    if (devPreview) {
      setCounts(Object.fromEntries(DASHBOARD_METRICS.map(([, key]) => [key, getPreviewCollectionCount(key)])));
      return () => { active = false; };
    }
    const db = getFirebaseDb();
    if (!db) return;
    Promise.all(DASHBOARD_METRICS.map(async ([, collectionName]) => {
      try { return [collectionName, (await getCountFromServer(collection(db, collectionName))).data().count]; }
      catch { return [collectionName, null]; }
    })).then((rows) => { if (active) setCounts(Object.fromEntries(rows)); }).catch(() => { if (active) setError("Some dashboard counts are unavailable for this role."); });

    // Fetch PWA install & use metrics
    getDoc(doc(db, "stea_metrics", "app_install")).then((docSnap) => {
      if (active && docSnap.exists()) {
        const data = docSnap.data();
        setPwaMetrics({
          installPromptShownCount: data.installPromptShownCount || 0,
          installAcceptedCount: data.installAcceptedCount || 0,
          installDismissedCount: data.installDismissedCount || 0,
          standaloneOpenCount: data.standaloneOpenCount || 0,
          webVisitCount: data.webVisitCount || 0,
        });
      }
    }).catch(err => console.warn("PWA metrics fetch failed", err));

    return () => { active = false; };
  }, [devPreview]);
  
  const firestoreSuperAdmin = user?.email === "stea.africa@gmail.com";
  const frontendSuperAdmin = user?.role === "super_admin" || firestoreSuperAdmin;

  return <><AdminPageHeader title="Overview Dashboard" description="Operational counts and system status." />
  {error && <div className="admin-v2-error">{error}</div>}
  
  <section className="admin-v2-stat-grid">{DASHBOARD_METRICS.map(([label, key, Icon]) => <article className="admin-v2-card" key={key}><div className="admin-v2-stat-label"><Icon size={16} color="#bb8516" />{label}</div><div className="admin-v2-stat-value">{formatCount(counts[key])}</div><div className="admin-v2-stat-note">Current collection count</div></article>)}</section>

  <section className="admin-v2-panel" style={{ marginTop: 24 }}>
    <div className="admin-v2-panel-head">STEA App Usage</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginTop: 16 }}>
      <div style={{ background: "var(--home-alpha-02, #F8FAFC)", border: "1px solid var(--home-border, #E2E8F0)", padding: 16, borderRadius: 12 }}>
        <div style={{ color: "var(--home-muted, #64748B)", fontSize: 13, fontWeight: 700 }}>Install Prompts</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "var(--home-text, #0F172A)", marginTop: 4 }}>{pwaMetrics.installPromptShownCount.toLocaleString()}</div>
      </div>
      <div style={{ background: "var(--home-alpha-02, #F8FAFC)", border: "1px solid var(--home-border, #E2E8F0)", padding: 16, borderRadius: 12 }}>
        <div style={{ color: "var(--home-muted, #64748B)", fontSize: 13, fontWeight: 700 }}>Installs / Accepted</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "var(--home-text, #0F172A)", marginTop: 4 }}>{pwaMetrics.installAcceptedCount.toLocaleString()}</div>
      </div>
      <div style={{ background: "var(--home-alpha-02, #F8FAFC)", border: "1px solid var(--home-border, #E2E8F0)", padding: 16, borderRadius: 12 }}>
        <div style={{ color: "var(--home-muted, #64748B)", fontSize: 13, fontWeight: 700 }}>Dismissals</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "var(--home-text, #0F172A)", marginTop: 4 }}>{pwaMetrics.installDismissedCount.toLocaleString()}</div>
      </div>
      <div style={{ background: "var(--home-alpha-02, #F8FAFC)", border: "1px solid var(--home-border, #E2E8F0)", padding: 16, borderRadius: 12 }}>
        <div style={{ color: "var(--home-muted, #64748B)", fontSize: 13, fontWeight: 700 }}>App Opens (Standalone)</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "var(--home-text, #0F172A)", marginTop: 4 }}>{pwaMetrics.standaloneOpenCount.toLocaleString()}</div>
      </div>
      <div style={{ background: "var(--home-alpha-02, #F8FAFC)", border: "1px solid var(--home-border, #E2E8F0)", padding: 16, borderRadius: 12 }}>
        <div style={{ color: "var(--home-muted, #64748B)", fontSize: 13, fontWeight: 700 }}>Web Visits</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "var(--home-text, #0F172A)", marginTop: 4 }}>{pwaMetrics.webVisitCount.toLocaleString()}</div>
      </div>
    </div>
  </section>

  <section className="admin-v2-panel"><div className="admin-v2-panel-head">Foundation safety</div><div className="admin-v2-empty">This dashboard is read-only. User deletion, collection operations, content deletion, migrations, and storage changes remain disabled until audit logging and protected server actions are implemented.</div></section></>;
}

function countLabel(state) {
  if (!state || state.phase === "loading") return "Loading";
  if (state.permission === "Permission denied") return "Unavailable";
  if (state.permission === "Error") return "Unavailable";
  return state.count.toLocaleString();
}

function InspectorPage({ devPreview }) {
  const [countState, setCountState] = useState({});
  const [selected, setSelected] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadCounts = useCallback(async () => {
    if (devPreview) {
      setCountState(Object.fromEntries(COLLECTION_INVENTORY.map((item) => [item.name, { phase:"complete", count:getPreviewCollectionCount(item.name), permission:"Available" }])));
      setLastUpdated(new Date());
      return;
    }
    const db = getFirebaseDb();
    if (!db) return;
    setCountState(Object.fromEntries(COLLECTION_INVENTORY.map((item) => [item.name, { phase:"loading", permission:"Available" }])));
    const results = await Promise.all(COLLECTION_INVENTORY.map(async (item) => {
      try {
        const snapshot = await getCountFromServer(collection(db, item.name));
        return [item.name, { phase:"complete", count:snapshot.data().count, permission:"Available" }];
      } catch (error) {
        const denied = error?.code === "permission-denied";
        return [item.name, { phase:"complete", count:null, permission:denied ? "Permission denied" : "Error" }];
      }
    }));
    setCountState(Object.fromEntries(results));
    setLastUpdated(new Date());
  }, [devPreview]);

  useEffect(() => { loadCounts(); }, [loadCounts]);
  const successful = Object.values(countState).filter((item) => item.permission === "Available" && item.phase === "complete").length;
  const denied = Object.values(countState).filter((item) => item.permission === "Permission denied").length;

  return <>
    <AdminPageHeader title="Backend Inspector" description="Live, read-only collection diagnostics using the audited backend inventory." />
    <div className="admin-v2-safety-banner"><ShieldAlert size={18} /><div><strong>Read-only inspector.</strong> No collections can be deleted or migrated from this page.</div></div>
    <section className="admin-v2-inspector-summary"><div><strong>{successful}</strong><span>Available counts</span></div><div><strong>{denied}</strong><span>Permission denied</span></div><div><strong>{COLLECTION_INVENTORY.length}</strong><span>Known collections</span></div><button onClick={loadCounts}><RefreshCw size={15} /> Refresh counts</button></section>
    <section className="admin-v2-panel"><div className="admin-v2-panel-head">Collection inventory <span>{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Loading live counts"}</span></div><div className="admin-v2-table-wrap"><table className="admin-v2-table"><thead><tr><th>Collection</th><th>Status</th><th>Document count</th><th>Permission</th><th>Risk</th><th>Recommendation</th></tr></thead><tbody>{COLLECTION_INVENTORY.map((item) => { const state = countState[item.name]; return <tr key={item.name} className="admin-v2-clickable-row" onClick={() => setSelected(item)}><td><button className="admin-v2-row-link"><strong>{item.name}</strong><Info size={14} /></button></td><td><span className={`admin-v2-badge ${item.status.toLowerCase()}`}>{item.status}</span></td><td>{countLabel(state)}</td><td><span className={`admin-v2-permission ${state?.permission === "Permission denied" ? "denied" : state?.permission === "Error" ? "error" : ""}`}>{state?.permission || "Loading"}</span></td><td><span className={`admin-v2-risk ${item.risk.toLowerCase()}`}>{item.risk}</span></td><td>{item.action}</td></tr>; })}</tbody></table></div></section>
    <section className="admin-v2-panel"><div className="admin-v2-panel-head">Duplicate groups</div><div className="admin-v2-duplicate-list">{DUPLICATE_GROUPS.map(([domain, canonical, legacy, note]) => <article key={domain}><div><strong>{domain}</strong><span>{canonical} <b>vs</b> {legacy}</span></div><p>{note}</p></article>)}</div></section>
    {selected && <div className="admin-v2-drawer-layer" role="dialog" aria-modal="true" aria-label={`${selected.name} collection details`}><button className="admin-v2-drawer-backdrop" onClick={() => setSelected(null)} aria-label="Close collection details" /><aside className="admin-v2-drawer"><button className="admin-v2-drawer-close" onClick={() => setSelected(null)} aria-label="Close"><X size={20} /></button><div className="admin-v2-eyebrow">Collection detail</div><h2>{selected.name}</h2><div className="admin-v2-drawer-status"><span className={`admin-v2-badge ${selected.status.toLowerCase()}`}>{selected.status}</span><span className={`admin-v2-risk ${selected.risk.toLowerCase()}`}>{selected.risk} risk</span></div><dl><dt>Purpose</dt><dd>{selected.purpose}</dd><dt>Used by</dt><dd>{selected.usedBy}</dd><dt>Dependencies</dt><dd>{selected.dependencies}</dd><dt>Duplicate relationship</dt><dd>{selected.duplicate}</dd><dt>Migration recommendation</dt><dd>{selected.migration}</dd></dl><div className="admin-v2-drawer-warning"><AlertTriangle size={17} /><span>Deletion risk: {selected.risk}. This inspector does not provide delete or migration actions.</span></div></aside></div>}
  </>;
}

const AUDIT_SEVERITIES = ["low", "medium", "high", "critical"];

function auditTime(value) {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function SecurityPage({ devPreview }) {
  const [logs, setLogs] = useState([]);
  const [state, setState] = useState("loading");
  const [filters, setFilters] = useState({ action:"", entity:"", severity:"", email:"", from:"", to:"" });

  const loadLogs = useCallback(async () => {
    if (devPreview) {
      setLogs(getPreviewCollectionDocs("audit_logs"));
      setState("ready");
      return;
    }
    const db = getFirebaseDb();
    if (!db) { setState("error"); return; }
    setState("loading");
    try {
      const snapshot = await getDocs(query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(250)));
      setLogs(snapshot.docs.map((item) => ({ id:item.id, ...item.data() })));
      setState("ready");
    } catch (error) {
      setState(error?.code === "permission-denied" ? "denied" : "error");
    }
  }, [devPreview]);

  useEffect(() => { loadLogs(); }, [loadLogs]);
  const actionTypes = useMemo(() => [...new Set(logs.map((item) => item.action).filter(Boolean))].sort(), [logs]);
  const entities = useMemo(() => [...new Set(logs.map((item) => item.entity).filter(Boolean))].sort(), [logs]);
  const visibleLogs = useMemo(() => logs.filter((item) => {
    const timestamp = auditTime(item.timestamp);
    if (filters.action && item.action !== filters.action) return false;
    if (filters.entity && item.entity !== filters.entity) return false;
    if (filters.severity && item.severity !== filters.severity) return false;
    if (filters.email && !String(item.performedByEmail || "").toLowerCase().includes(filters.email.toLowerCase())) return false;
    if (filters.from && (!timestamp || timestamp < new Date(`${filters.from}T00:00:00`))) return false;
    if (filters.to && (!timestamp || timestamp > new Date(`${filters.to}T23:59:59`))) return false;
    return true;
  }), [filters, logs]);
  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]:value }));

  return <>
    <AdminPageHeader title="Security & Audit Logs" description="Read-only administrative audit history. Protected actions will remain disabled until server-side audit writes are enabled." />
    <div className="admin-v2-safety-banner"><ShieldAlert size={18} /><div><strong>Protected admin actions will require audit logs before they can be enabled.</strong></div></div>
    <section className="admin-v2-panel"><div className="admin-v2-panel-head">Audit log filters <button className="admin-v2-text-action" onClick={loadLogs}><RefreshCw size={14} /> Refresh</button></div><div className="admin-v2-filter-grid"><label>Action type<select value={filters.action} onChange={(event) => setFilter("action", event.target.value)}><option value="">All actions</option>{actionTypes.map((item) => <option key={item}>{item}</option>)}</select></label><label>Entity<select value={filters.entity} onChange={(event) => setFilter("entity", event.target.value)}><option value="">All entities</option>{entities.map((item) => <option key={item}>{item}</option>)}</select></label><label>Severity<select value={filters.severity} onChange={(event) => setFilter("severity", event.target.value)}><option value="">All severities</option>{AUDIT_SEVERITIES.map((item) => <option key={item}>{item}</option>)}</select></label><label>Admin email<input value={filters.email} onChange={(event) => setFilter("email", event.target.value)} placeholder="Filter email" /></label><label>From<input type="date" value={filters.from} onChange={(event) => setFilter("from", event.target.value)} /></label><label>To<input type="date" value={filters.to} onChange={(event) => setFilter("to", event.target.value)} /></label></div></section>
    {state === "loading" && <div className="admin-v2-empty">Loading audit logs...</div>}
    {state === "denied" && <div className="admin-v2-error">Permission denied. Audit logs are restricted to the configured security role.</div>}
    {state === "error" && <div className="admin-v2-error">Audit logs could not be read. No data was changed.</div>}
    {state === "ready" && logs.length === 0 && <div className="admin-v2-empty">No audit logs yet. Audit logging will begin when protected admin actions are enabled.</div>}
    {state === "ready" && logs.length > 0 && <section className="admin-v2-panel"><div className="admin-v2-panel-head">Audit history <span>{visibleLogs.length} matching logs</span></div><div className="admin-v2-table-wrap"><table className="admin-v2-table"><thead><tr><th>Time</th><th>Action</th><th>Entity</th><th>Admin</th><th>Severity</th><th>Reason</th></tr></thead><tbody>{visibleLogs.map((item) => { const timestamp = auditTime(item.timestamp); return <tr key={item.id}><td>{timestamp ? timestamp.toLocaleString() : "Unavailable"}</td><td>{item.action || "Unknown"}</td><td>{item.entity}{item.entityId ? ` / ${item.entityId}` : ""}</td><td>{item.performedByEmail || "Unknown"}</td><td><span className={`admin-v2-risk ${String(item.severity || "medium").toLowerCase()}`}>{item.severity || "medium"}</span></td><td>{item.reason || "-"}</td></tr>; })}</tbody></table></div></section>}
  </>;
}

const USERS_PAGE_SIZE = 25;
const EDUCATION_SOURCES = [
  { name:"study_resources", label:"Academic Resources", role:"canonical", warning:"Recommended canonical academic collection." },
  { name:"resources", label:"General Resources", role:"general", warning:"General resources collection; separate from the academic canonical model." },
  { name:"education_notes", label:"Notes", role:"isolated", warning:"Isolated collection. Review before any future consolidation." },
  { name:"education_past_papers", label:"Past Papers", role:"isolated", warning:"Isolated collection. Review before any future consolidation." },
  { name:"tips_resources", label:"Tips Resources", role:"duplicate", warning:"Duplicate/detail-only risk: public listing and detail paths currently differ." },
];

function userDate(value) {
  const date = auditTime(value);
  return date ? date.toLocaleDateString() : "Unknown";
}

function userValue(value) {
  return value === null || value === undefined || value === "" ? "Unknown" : String(value);
}

function UserActions() {
  const message = "Protected actions will be enabled after audit-log server actions are ready.";
  return <div className="admin-v2-user-actions"><button disabled title={message}>Change Role</button><button disabled title={message}>Suspend User</button><button disabled title={message}>Delete User</button></div>;
}


function resourceTitle(item) { return userValue(item.title || item.name || item.titleEn); }
function resourceType(item) { return userValue(item.type || item.resourceType || item.categoryType); }
function resourceCategory(item) { return userValue(item.subject || item.category || item.level); }
function resourceAuthor(item) { return userValue(item.authorName || item.uploaderName || item.ownerName || item.authorId || item.ownerId || item.uploadedBy); }
function resourceStatus(item) { return userValue(item.status || (item.published || item.isPublished ? "published" : "")); }
function resourceLink(item) { return item.fileUrl || item.pdfUrl || item.link || item.url || ""; }

function ResourceActions() {
  const message = "Protected actions will be enabled after migration and audit-log workflows are ready.";
  return <div className="admin-v2-user-actions"><button disabled title={message}>Edit</button><button disabled title={message}>Publish</button><button disabled title={message}>Feature</button><button disabled title={message}>Delete</button><button disabled title={message}>Move to Canonical</button></div>;
}


function FoundationPage({ id }) { const [title, description] = pageConfig[id]; return <><AdminPageHeader title={title} description={description} /><div className="admin-v2-empty">{title} is prepared as a route and permission-scoped V2 surface. Data mutation controls are intentionally unavailable in this foundation release.</div></>; }

function PageGate({ user, permission, children }) { return hasAdminV2Permission(user, permission) ? children : <Navigate to="/admin" replace />; }

export default function AdminV2App({ user, devPreview = false }) {
  const isSuperAdmin = user?.role === "super_admin" || user?.email === "stea.africa@gmail.com";
  const canEdit = isSuperAdmin;
  const mode = isSuperAdmin ? "super_admin" : "read_only";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = useMemo(() => ADMIN_V2_NAVIGATION.find((item) => item.path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(item.path))?.label || "Admin", [location.pathname]);
  if (!ADMIN_V2_NAVIGATION.some((item) => hasAdminV2Permission(user, item.permission))) return <Navigate to="/" replace />;
  return <AdminLayout user={user} title={title} sidebarOpen={sidebarOpen} onSidebarOpen={() => setSidebarOpen(true)} onSidebarClose={() => setSidebarOpen(false)} devPreview={devPreview} isSuperAdmin={isSuperAdmin} canEdit={canEdit} mode={mode}><Routes><Route index element={<PageGate user={user} permission="dashboard.view"><DashboardPage devPreview={devPreview} user={user} /></PageGate>} />{Object.keys(pageConfig).filter((id) => !["security", "users", "marketing", "education", "classroom", "websites", "marketplace", "services", "notifications", "tools", "community"].includes(id)).map((id) => <Route key={id} path={id} element={<PageGate user={user} permission={`${id}.view`}><FoundationPage id={id} /></PageGate>} />)}<Route path="users" element={<PageGate user={user} permission="users.view"><UsersPage devPreview={devPreview} isSuperAdmin={isSuperAdmin} /></PageGate>} /><Route path="marketing" element={<PageGate user={user} permission="marketing.view"><MarketingPage isSuperAdmin={isSuperAdmin} /></PageGate>} /><Route path="education" element={<PageGate user={user} permission="education.view"><EducationPage devPreview={devPreview} isSuperAdmin={isSuperAdmin} /></PageGate>} /><Route path="classroom" element={<PageGate user={user} permission="classroom.view"><ClassroomPage devPreview={devPreview} isSuperAdmin={isSuperAdmin} /></PageGate>} /><Route path="websites" element={<PageGate user={user} permission="websites.view"><WebsitesPage devPreview={devPreview} isSuperAdmin={isSuperAdmin} /></PageGate>} /><Route path="marketplace" element={<PageGate user={user} permission="marketplace.view"><MarketplacePage devPreview={devPreview} isSuperAdmin={isSuperAdmin} /></PageGate>} /><Route path="services" element={<PageGate user={user} permission="services.view"><ServicesPage devPreview={devPreview} isSuperAdmin={isSuperAdmin} /></PageGate>} /><Route path="notifications" element={<PageGate user={user} permission="notifications.view"><NotificationsPage devPreview={devPreview} isSuperAdmin={isSuperAdmin} /></PageGate>} /><Route path="daily" element={<PageGate user={user} permission="daily.view"><DailyPage devPreview={devPreview} isSuperAdmin={isSuperAdmin} /></PageGate>} /><Route path="tools" element={<PageGate user={user} permission="tools.view"><ToolsPage devPreview={devPreview} isSuperAdmin={isSuperAdmin} /></PageGate>} /><Route path="community" element={<PageGate user={user} permission="community.view"><CommunityPage isSuperAdmin={isSuperAdmin} /></PageGate>} /><Route path="security" element={<PageGate user={user} permission="security.view"><SecurityPage devPreview={devPreview} /></PageGate>} /><Route path="backend-inspector" element={<PageGate user={user} permission="inspector.view"><InspectorPage devPreview={devPreview} /></PageGate>} /><Route path="*" element={<Navigate to="/admin" replace />} /></Routes></AdminLayout>;
}
