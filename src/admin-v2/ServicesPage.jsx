import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCw, ShieldAlert, X, CheckCircle, Ban, Edit } from "lucide-react";
import { collection, getDocs, getFirebaseDb, limit, query, doc, updateDoc } from "../firebase.js";
import { AdminPageHeader } from "./AdminLayout.jsx";
import { getPreviewCollectionDocs } from "./previewData.js";
import { createAuditLog } from "./auditLog.js";
import { AdminConfirmationModal } from "./AdminConfirmationModal.jsx";

const SOURCES = ["service_requests", "serviceSubscriptions", "servicePaymentMethods", "subscriptionServices", "servicePlans", "toolSubscriptions", "payments"];
const TABS = [["requests", "Service Requests"], ["subscriptions", "Subscriptions"], ["methods", "Payment Methods"], ["plans", "Service Plans"], ["tools", "Tool Subscriptions"], ["payments", "Payments"], ["legacy", "Legacy / Notes"]];

function value(input) { return input === null || input === undefined || input === "" ? "Unknown" : String(input); }
function dateValue(input) { if (!input) return "Unknown"; const date = input?.toDate ? input.toDate() : new Date(input); return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString(); }
function amount(input) { const parsed = Number(input); return Number.isFinite(parsed) ? `TZS ${parsed.toLocaleString()}` : value(input); }
function client(item) { return value(item.clientName || item.fullName || item.customerName || item.userName || item.email || item.userId); }
function service(item) { return value(item.serviceTitle || item.serviceName || item.serviceType || item.serviceId || item.toolTitle || item.toolId); }
function plan(item) { return value(item.planName || item.planTitle || item.planId); }

function ServiceActions({ tab, item, isSuperAdmin, onAction }) {
  if (!isSuperAdmin) {
    const message = "Protected service actions will be enabled after audit-log server actions are ready.";
    const labels = { requests:["Approve Request", "Reject Request", "Delete Request"], subscriptions:["Change Status"], methods:["Edit Payment Method"], plans:["Edit Plan"], tools:["Change Status"], payments:["Approve Payment", "Reject Payment"] }[tab] || ["No actions"];
    return <div className="admin-v2-user-actions">{labels.map((label) => <button key={label} disabled title={message}>{label}</button>)}</div>;
  }

  return (
    <div className="admin-v2-user-actions">
      {tab === "requests" && (
        <select 
          style={{ padding: "4px 8px", fontSize: 12, borderRadius: 6, border: "1px solid #E5E7EB" }}
          value={item.status || "pending"}
          onChange={(e) => onAction("editStatus", item, "status", e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      )}
      {tab === "subscriptions" && (
        <select 
          style={{ padding: "4px 8px", fontSize: 12, borderRadius: 6, border: "1px solid #E5E7EB" }}
          value={item.status || "pending"}
          onChange={(e) => onAction("editStatus", item, "status", e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      )}
      {tab === "tools" && (
        <select 
          style={{ padding: "4px 8px", fontSize: 12, borderRadius: 6, border: "1px solid #E5E7EB" }}
          value={item.status || "pending"}
          onChange={(e) => onAction("editStatus", item, "status", e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      )}
      {tab === "payments" && item.status !== "approved" && (
        <button className="admin-v2-btn-secondary" onClick={() => onAction("editStatus", item, "status", "approved")}>
          <CheckCircle size={14} /> Approve
        </button>
      )}
      {tab === "methods" && (
        <button className="admin-v2-btn-secondary" onClick={() => alert("Edit modal would open here.")}>
          <Edit size={14} /> Edit Method
        </button>
      )}
      {tab === "plans" && (
        <button className="admin-v2-btn-secondary" onClick={() => alert("Edit modal would open here.")}>
          <Edit size={14} /> Edit Plan
        </button>
      )}
    </div>
  );
}

function matchesTab(item, tab) {
  return ({ requests:item.sourceCollection === "service_requests", subscriptions:item.sourceCollection === "serviceSubscriptions", methods:item.sourceCollection === "servicePaymentMethods", plans:["subscriptionServices", "servicePlans"].includes(item.sourceCollection), tools:item.sourceCollection === "toolSubscriptions", payments:item.sourceCollection === "payments" })[tab] || false;
}

function fields(tab, item) {
  if (tab === "requests") return [["Request ID", value(item.requestId || item.id)], ["Service Type", service(item)], ["Client Name", client(item)], ["Email / WhatsApp", value(item.email || item.whatsapp || item.phone)], ["Status", value(item.status)], ["Budget / Amount", amount(item.budget ?? item.amount ?? item.totalAmount)], ["Created Date", dateValue(item.createdAt)]];
  if (tab === "subscriptions") return [["Subscription ID", value(item.subscriptionId || item.id)], ["Service", service(item)], ["Plan", plan(item)], ["User / Client", client(item)], ["Amount", amount(item.amount)], ["Status", value(item.status)], ["Created Date", dateValue(item.createdAt)]];
  if (tab === "methods") return [["Method Name", value(item.name || item.title || item.methodName)], ["Type", value(item.type || item.methodType)], ["Status", value(item.status || (item.isActive ? "active" : ""))], ["Currency", value(item.currency)], ["Created Date", dateValue(item.createdAt)]];
  if (tab === "plans") return [["Plan Name", value(item.planName || item.name || item.title)], ["Service", service(item)], ["Price", amount(item.price ?? item.amount)], ["Duration", value(item.durationDays || item.duration)], ["Status", value(item.status || (item.isActive ? "active" : ""))], ["Source", item.sourceCollection]];
  if (tab === "tools") return [["Tool", service(item)], ["Plan", plan(item)], ["User / Client", client(item)], ["Amount", amount(item.amount)], ["Status", value(item.status)], ["Created Date", dateValue(item.createdAt)]];
  return [["Payment ID", value(item.paymentId || item.paymentReference || item.id)], ["User", client(item)], ["Amount", amount(item.amountPaid ?? item.amount ?? item.totalAmount)], ["Method", value(item.paymentMethod)], ["Status", value(item.reviewStatus || item.status)], ["Related Service / Request", value(item.serviceId || item.requestId || item.orderId || item.subscriptionId)], ["Created Date", dateValue(item.createdAt || item.submittedAt)]];
}

function ServiceDrawer({ item, tab, onClose, isSuperAdmin, onAction }) {
  return <div className="admin-v2-drawer-layer" role="dialog" aria-modal="true" aria-label="Service detail"><button className="admin-v2-drawer-backdrop" onClick={onClose} aria-label="Close service details" /><aside className="admin-v2-drawer"><button className="admin-v2-drawer-close" onClick={onClose} aria-label="Close"><X size={20} /></button><div className="admin-v2-eyebrow">Service detail</div><h2>{service(item)}</h2><div className="admin-v2-drawer-status"><span className="admin-v2-badge">{item.sourceCollection}</span></div><dl><dt>Document ID</dt><dd>{item.id}</dd><dt>Source collection</dt><dd>{item.sourceCollection}</dd><dt>Client</dt><dd>{client(item)}</dd><dt>Email / WhatsApp</dt><dd>{value(item.email || item.whatsapp || item.phone)}</dd><dt>Service / request</dt><dd>{service(item)}</dd><dt>Plan</dt><dd>{plan(item)}</dd><dt>Amount / budget</dt><dd>{amount(item.amount ?? item.budget ?? item.totalAmount)}</dd><dt>Payment method</dt><dd>{value(item.paymentMethod)}</dd><dt>Payment proof URL</dt><dd>{value(item.proofUrl || item.paymentProofUrl)}</dd><dt>Status</dt><dd>{value(item.reviewStatus || item.status)}</dd><dt>Related IDs</dt><dd>{value(item.requestId || item.subscriptionId || item.serviceId || item.toolId || item.orderId)}</dd><dt>Created</dt><dd>{dateValue(item.createdAt || item.submittedAt)}</dd><dt>Updated</dt><dd>{dateValue(item.updatedAt)}</dd></dl><div className="admin-v2-drawer-warning"><AlertTriangle size={17} /><span>Current service record.</span></div><ServiceActions tab={tab} item={item} isSuperAdmin={isSuperAdmin} onAction={onAction} /></aside></div>;
}

export default function ServicesPage({ devPreview, isSuperAdmin }) {
  const [records, setRecords] = useState([]);
  const [sourceState, setSourceState] = useState({});
  const [tab, setTab] = useState("requests");
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ search:"", source:"", service:"", status:"", method:"", created:"" });
  const [confirming, setConfirming] = useState(null);

  const loadData = useCallback(async () => {
    if (devPreview) return;
    const db = getFirebaseDb();
    setSourceState(Object.fromEntries(SOURCES.map((source) => [source, "Loading"])));
    if (!db) return;
    const results = await Promise.all(SOURCES.map(async (source) => {
      try { const snapshot = await getDocs(query(collection(db, source), limit(100))); return [source, "Available", snapshot.docs.map((docSnap) => ({ id:docSnap.id, sourceCollection:source, ...docSnap.data() }))]; }
      catch (error) { return [source, error?.code === "permission-denied" ? "Permission denied" : "Unavailable", []]; }
    }));
    setRecords(results.flatMap(([, , docs]) => docs)); setSourceState(Object.fromEntries(results.map(([source, state]) => [source, state])));
  }, [devPreview]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAction = async (reason) => {
    if (!confirming) return;
    const db = getFirebaseDb();
    const { action, item, field, newVal } = confirming;

    if (action === "editStatus") {
      await createAuditLog("edit_service_status", item.sourceCollection, item.id, { [field]: item[field] }, { [field]: newVal }, reason);
      await updateDoc(doc(db, item.sourceCollection, item.id), { [field]: newVal });
      setRecords(records.map(r => r.id === item.id && r.sourceCollection === item.sourceCollection ? { ...r, [field]: newVal } : r));
      if (selected && selected.id === item.id) setSelected({ ...selected, [field]: newVal });
    }
  };

  const services = useMemo(() => [...new Set(records.map(service).filter((item) => item !== "Unknown"))].sort(), [records]);
  const statuses = useMemo(() => [...new Set(records.map((item) => item.reviewStatus || item.status).filter(Boolean))].sort(), [records]);
  const methods = useMemo(() => [...new Set(records.map((item) => item.paymentMethod).filter(Boolean))].sort(), [records]);
  const filtered = useMemo(() => records.filter((item) => {
    if (!matchesTab(item, tab)) return false;
    const searchable = [client(item), item.email, item.whatsapp, service(item), plan(item), item.paymentId, item.paymentReference, item.id].join(" ").toLowerCase();
    if (filters.search && !searchable.includes(filters.search.toLowerCase())) return false;
    if (filters.source && item.sourceCollection !== filters.source) return false;
    if (filters.service && service(item) !== filters.service) return false;
    if (filters.status && (item.reviewStatus || item.status) !== filters.status) return false;
    if (filters.method && item.paymentMethod !== filters.method) return false;
    if (filters.created && item.createdAt?.toDate?.().toISOString().slice(0, 10) !== filters.created) return false;
    return true;
  }), [filters, records, tab]);
  const headers = filtered[0] ? fields(tab, filtered[0]).map(([label]) => label) : [];
  const setFilter = (key, input) => setFilters((current) => ({ ...current, [key]:input }));

  return <>
    <AdminPageHeader title="Services Management" description="Manage service requests, subscriptions, and payments." />
    {!isSuperAdmin && (
      <div className="admin-v2-safety-banner"><ShieldAlert size={18} /><div><strong>Read-only service inventory.</strong> Super Admin is required to change statuses.</div></div>
    )}

    {confirming && (
      <AdminConfirmationModal
        title="Confirm Status Change"
        actionDescription={`You are about to change the ${confirming.field} of this service record to "${confirming.newVal}".`}
        onClose={() => setConfirming(null)}
        onConfirm={handleAction}
      />
    )}

    <section className="admin-v2-source-status admin-v2-services-source-status"><div className="admin-v2-panel-head">Collection access <button className="admin-v2-text-action" onClick={loadData}><RefreshCw size={14} /> Refresh</button></div>{SOURCES.map((source) => <div key={source}><strong>{source}</strong><span className={`admin-v2-permission ${sourceState[source] === "Permission denied" ? "denied" : sourceState[source] === "Unavailable" ? "error" : ""}`}>{sourceState[source] || "Loading"}</span></div>)}</section>
    <div className="admin-v2-tabs" role="tablist">{TABS.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "is-active" : ""} onClick={() => setTab(id)}>{label}</button>)}</div>
    {tab === "legacy" ? <section className="admin-v2-panel"><div className="admin-v2-panel-head">Service data notes</div><div className="admin-v2-duplicate-list"><article><div><strong>service_requests</strong><span>Main service request records</span></div><p>Primary records for website, app, and system requests.</p></article><article><div><strong>serviceSubscriptions</strong><span>Subscription requests</span></div><p>Client subscription request records.</p></article><article><div><strong>servicePaymentMethods</strong><span>Service payment options</span></div><p>Shared payment method configuration for service subscriptions.</p></article><article><div><strong>subscriptionServices / servicePlans</strong><span>Service catalog and plans</span></div><p>Catalog and plan structure; retain separately from client subscriptions.</p></article><article><div><strong>toolSubscriptions / payments</strong><span>Tool subscriptions and shared payments</span></div><p>Tool subscription records and the shared payment review collection remain distinct.</p></article></div></section> : <><section className="admin-v2-panel"><div className="admin-v2-panel-head">Search and filters</div><div className="admin-v2-filter-grid admin-v2-services-filter-grid"><label>Search<input value={filters.search} onChange={(event) => setFilter("search", event.target.value)} placeholder="Client, email, service, plan, payment ID" /></label><label>Collection / source<select value={filters.source} onChange={(event) => setFilter("source", event.target.value)}><option value="">All sources</option>{SOURCES.map((source) => <option key={source}>{source}</option>)}</select></label><label>Service type<select value={filters.service} onChange={(event) => setFilter("service", event.target.value)}><option value="">All services</option>{services.map((item) => <option key={item}>{item}</option>)}</select></label><label>Status<select value={filters.status} onChange={(event) => setFilter("status", event.target.value)}><option value="">All statuses</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label><label>Payment method<select value={filters.method} onChange={(event) => setFilter("method", event.target.value)}><option value="">All methods</option>{methods.map((item) => <option key={item}>{item}</option>)}</select></label><label>Created date<input type="date" value={filters.created} onChange={(event) => setFilter("created", event.target.value)} /></label></div></section>{records.length === 0 && Object.values(sourceState).some((state) => state === "Loading") ? <div className="admin-v2-empty">Loading service collections...</div> : filtered.length === 0 ? <div className="admin-v2-empty">No records match the current tab and filters. Collection access is shown above.</div> : <><section className="admin-v2-panel admin-v2-services-table"><div className="admin-v2-panel-head">{TABS.find(([id]) => id === tab)?.[1]} <span>{filtered.length} visible records</span></div><div className="admin-v2-table-wrap"><table className="admin-v2-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}<th>Actions</th></tr></thead><tbody>{filtered.map((item) => <tr key={`${item.sourceCollection}:${item.id}`}>{fields(tab, item).map(([label, field]) => <td key={label}>{field}</td>)}<td><button className="admin-v2-view-button" onClick={() => setSelected(item)}>View</button><ServiceActions tab={tab} item={item} isSuperAdmin={isSuperAdmin} onAction={(action, it, field, newVal) => setConfirming({ action, item: it, field, newVal })} /></td></tr>)}</tbody></table></div></section><section className="admin-v2-services-cards">{filtered.map((item) => <article key={`${item.sourceCollection}:${item.id}`}><div><strong>{service(item)}</strong><span>{item.sourceCollection}</span></div><dl>{fields(tab, item).slice(1, 5).map(([label, field]) => <div key={label}><dt>{label}</dt><dd>{field}</dd></div>)}</dl><button className="admin-v2-view-button" onClick={() => setSelected(item)}>View details</button><ServiceActions tab={tab} item={item} isSuperAdmin={isSuperAdmin} onAction={(action, it, field, newVal) => setConfirming({ action, item: it, field, newVal })} /></article>)}</section></>}</>}
    {selected && <ServiceDrawer item={selected} tab={tab} onClose={() => setSelected(null)} isSuperAdmin={isSuperAdmin} onAction={(action, it, field, newVal) => setConfirming({ action, item: it, field, newVal })} />}
  </>;
}
