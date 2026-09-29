import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCw, ShieldAlert, X, Edit, CheckCircle, Ban } from "lucide-react";
import { collection, getDocs, getFirebaseDb, limit, query, doc, updateDoc } from "../firebase.js";
import { AdminPageHeader } from "./AdminLayout.jsx";
import { getPreviewCollectionDocs } from "./previewData.js";
import { createAuditLog } from "./auditLog.js";
import { AdminConfirmationModal } from "./AdminConfirmationModal.jsx";

const SOURCES = ["products", "marketplace_orders", "orders", "payments", "sellers", "seller_applications"];
const TABS = [["products", "Products"], ["orders", "Orders"], ["payments", "Payments"], ["sellers", "Sellers"], ["applications", "Seller Applications"], ["legacy", "Legacy / Duplicates"]];

function value(input) { return input === null || input === undefined || input === "" ? "Unknown" : String(input); }
function dateValue(input) { if (!input) return "Unknown"; const date = input?.toDate ? input.toDate() : new Date(input); return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString(); }
function amount(input) { const parsed = Number(input); return Number.isFinite(parsed) ? `TZS ${parsed.toLocaleString()}` : value(input); }
function seller(item) { return value(item.sellerName || item.sellerBusinessName || item.sellerEmail || item.sellerId || item.ownerName || item.ownerId); }
function buyer(item) { return value(item.buyerName || item.customerName || item.userName || item.userEmail || item.userId); }
function title(item) { return value(item.productName || item.name || item.title || item.businessName || item.fullName); }

function MarketplaceActions({ tab, item, isSuperAdmin, onAction }) {
  if (!isSuperAdmin) {
    const message = "Protected marketplace actions require Super Admin privileges.";
    const labels = { products:["Add Product", "Edit Product", "Delete Product"], orders:["Change Order Status"], payments:["Approve Payment", "Reject Payment"], sellers:["Approve Seller"], applications:["Approve Seller", "Reject Seller"] }[tab] || ["No actions"];
    return <div className="admin-v2-user-actions">{labels.map((label) => <button key={label} disabled title={message}>{label}</button>)}</div>;
  }

  return (
    <div className="admin-v2-user-actions">
      {tab === "products" && (
        <button className="admin-v2-btn-secondary" onClick={() => onAction("editStatus", item, "status", item.status === "active" ? "inactive" : "active")}>
          <Edit size={14} /> Toggle Active
        </button>
      )}
      {tab === "orders" && (
        <select 
          style={{ padding: "4px 8px", fontSize: 12, borderRadius: 6, border: "1px solid #E5E7EB" }}
          value={item.status || "pending"}
          onChange={(e) => onAction("editStatus", item, "status", e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      )}
      {tab === "payments" && item.status !== "approved" && (
        <button className="admin-v2-btn-secondary" onClick={() => onAction("editStatus", item, "status", "approved")}>
          <CheckCircle size={14} /> Approve
        </button>
      )}
      {tab === "sellers" && (
        <select 
          style={{ padding: "4px 8px", fontSize: 12, borderRadius: 6, border: "1px solid #E5E7EB" }}
          value={item.status || "pending"}
          onChange={(e) => onAction("editStatus", item, "status", e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="suspended">Suspended</option>
        </select>
      )}
      {tab === "applications" && (
        <>
          <button className="admin-v2-btn-secondary" onClick={() => onAction("editStatus", item, "status", "approved")}><CheckCircle size={14} /> Approve</button>
          <button className="admin-v2-btn-secondary" style={{ color: "#DC2626" }} onClick={() => onAction("editStatus", item, "status", "rejected")}><Ban size={14} /> Reject</button>
        </>
      )}
    </div>
  );
}

function matchesTab(item, tab) {
  if (tab === "products") return item.sourceCollection === "products";
  if (tab === "orders") return ["marketplace_orders", "orders"].includes(item.sourceCollection);
  if (tab === "payments") return item.sourceCollection === "payments";
  if (tab === "sellers") return item.sourceCollection === "sellers";
  if (tab === "applications") return item.sourceCollection === "seller_applications";
  return false;
}

function fields(tab, item, productCountBySeller) {
  if (tab === "products") return [["Product Name", title(item)], ["Category", value(item.category)], ["Seller", seller(item)], ["Price", amount(item.salePrice ?? item.price ?? item.salePriceTZS)], ["Status", value(item.status)], ["Stock", value(item.stock ?? item.quantity)], ["Created Date", dateValue(item.createdAt)]];
  if (tab === "orders") return [["Order ID", value(item.orderId || item.id)], ["Buyer", buyer(item)], ["Seller", seller(item)], ["Amount", amount(item.totalAmount ?? item.totalPrice ?? item.price)], ["Status", value(item.status)], ["Source Collection", item.sourceCollection], ["Created Date", dateValue(item.createdAt)]];
  if (tab === "payments") return [["Payment ID", value(item.paymentId || item.paymentReference || item.id)], ["User", buyer(item)], ["Amount", amount(item.amountPaid ?? item.amount ?? item.totalAmount)], ["Method", value(item.paymentMethod)], ["Status", value(item.reviewStatus || item.status)], ["Related Order / Service", value(item.orderId || item.serviceId || item.subscriptionId)], ["Created Date", dateValue(item.createdAt || item.submittedAt)]];
  if (tab === "sellers") return [["Seller Name", title(item)], ["Email", value(item.email || item.sellerEmail)], ["Status", value(item.status)], ["Products Count", value(productCountBySeller.get(item.id) ?? productCountBySeller.get(item.userId) ?? productCountBySeller.get(item.sellerId))], ["Joined Date", dateValue(item.createdAt)]];
  return [["Applicant Name", title(item)], ["Email", value(item.email)], ["Business Name", value(item.businessName)], ["Status", value(item.status)], ["Submitted Date", dateValue(item.createdAt || item.submittedAt)]];
}

function MarketplaceDrawer({ item, tab, onClose, isSuperAdmin, onAction }) {
  const images = [item.imageUrl, item.image, item.thumbnailUrl, ...(Array.isArray(item.images) ? item.images : [])].filter(Boolean);
  return <div className="admin-v2-drawer-layer" role="dialog" aria-modal="true" aria-label="Marketplace detail"><button className="admin-v2-drawer-backdrop" onClick={onClose} aria-label="Close marketplace details" /><aside className="admin-v2-drawer"><button className="admin-v2-drawer-close" onClick={onClose} aria-label="Close"><X size={20} /></button><div className="admin-v2-eyebrow">Marketplace detail</div><h2>{title(item)}</h2>{images[0] && <img className="admin-v2-website-image" src={images[0]} alt="" />}<div className="admin-v2-drawer-status"><span className={`admin-v2-badge ${item.sourceCollection === "orders" ? "duplicate" : ""}`}>{item.sourceCollection}</span></div><dl><dt>Document ID</dt><dd>{item.id}</dd><dt>Source collection</dt><dd>{item.sourceCollection}</dd><dt>Status</dt><dd>{value(item.reviewStatus || item.status)}</dd><dt>User IDs</dt><dd>{value(item.userId || item.buyerId || item.sellerId || item.ownerId)}</dd><dt>Related order ID</dt><dd>{value(item.orderId || item.marketplaceOrderId)}</dd><dt>Related payment ID</dt><dd>{value(item.paymentId || item.paymentReference)}</dd><dt>Amount</dt><dd>{amount(item.totalAmount ?? item.totalPrice ?? item.amount ?? item.price)}</dd><dt>Metadata</dt><dd>{value(item.description || item.businessName || item.category)}</dd><dt>Status history</dt><dd>{Array.isArray(item.statusHistory) ? item.statusHistory.join(", ") : "Unknown"}</dd><dt>Created date</dt><dd>{dateValue(item.createdAt || item.submittedAt)}</dd><dt>Updated date</dt><dd>{dateValue(item.updatedAt)}</dd></dl><div className="admin-v2-drawer-warning"><AlertTriangle size={17} /><span>{item.sourceCollection === "orders" ? "Compatibility/unified order copy. Duplicate order writes must not be cleaned until the migration phase." : "Current marketplace record."}</span></div><MarketplaceActions tab={tab} item={item} isSuperAdmin={isSuperAdmin} onAction={onAction} /></aside></div>;
}

export default function MarketplacePage({ devPreview, isSuperAdmin }) {
  const [records, setRecords] = useState([]);
  const [sourceState, setSourceState] = useState({});
  const [tab, setTab] = useState("products");
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ search:"", source:"", category:"", status:"", seller:"", method:"", created:"" });
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
      await createAuditLog("edit_marketplace_status", item.sourceCollection, item.id, { [field]: item[field] }, { [field]: newVal }, reason);
      await updateDoc(doc(db, item.sourceCollection, item.id), { [field]: newVal });
      setRecords(records.map(r => r.id === item.id && r.sourceCollection === item.sourceCollection ? { ...r, [field]: newVal } : r));
      if (selected && selected.id === item.id) setSelected({ ...selected, [field]: newVal });
    }
  };

  const products = useMemo(() => records.filter((item) => item.sourceCollection === "products"), [records]);
  const productCountBySeller = useMemo(() => { const counts = new Map(); products.forEach((item) => { [item.sellerId, item.ownerId].filter(Boolean).forEach((id) => counts.set(id, (counts.get(id) || 0) + 1)); }); return counts; }, [products]);
  const categoryOptions = useMemo(() => [...new Set(products.map((item) => item.category).filter(Boolean))].sort(), [products]);
  const statusOptions = useMemo(() => [...new Set(records.map((item) => item.reviewStatus || item.status).filter(Boolean))].sort(), [records]);
  const methods = useMemo(() => [...new Set(records.filter((item) => item.sourceCollection === "payments").map((item) => item.paymentMethod).filter(Boolean))].sort(), [records]);
  const filtered = useMemo(() => records.filter((item) => {
    if (!matchesTab(item, tab)) return false;
    const searchable = [title(item), item.orderId, buyer(item), seller(item), item.email, item.paymentId, item.paymentReference, item.id].join(" ").toLowerCase();
    if (filters.search && !searchable.includes(filters.search.toLowerCase())) return false;
    if (filters.source && item.sourceCollection !== filters.source) return false;
    if (filters.category && item.category !== filters.category) return false;
    if (filters.status && (item.reviewStatus || item.status) !== filters.status) return false;
    if (filters.seller && !seller(item).toLowerCase().includes(filters.seller.toLowerCase())) return false;
    if (filters.method && item.paymentMethod !== filters.method) return false;
    if (filters.created && item.createdAt?.toDate?.().toISOString().slice(0, 10) !== filters.created) return false;
    return true;
  }), [filters, records, tab]);
  const headers = filtered[0] ? fields(tab, filtered[0], productCountBySeller).map(([label]) => label) : [];
  const setFilter = (key, input) => setFilters((current) => ({ ...current, [key]:input }));

  return <>
    <AdminPageHeader title="Marketplace Management" description="Manage orders, products, sellers, and payments." />
    {!isSuperAdmin && (
      <div className="admin-v2-safety-banner"><ShieldAlert size={18} /><div><strong>Read-only marketplace inventory.</strong> Super Admin is required to change statuses.</div></div>
    )}
    
    {confirming && (
      <AdminConfirmationModal
        title="Confirm Status Change"
        actionDescription={`You are about to change the ${confirming.field} of ${title(confirming.item)} to "${confirming.newVal}".`}
        onClose={() => setConfirming(null)}
        onConfirm={handleAction}
      />
    )}

    <section className="admin-v2-source-status admin-v2-marketplace-source-status"><div className="admin-v2-panel-head">Collection access <button className="admin-v2-text-action" onClick={loadData}><RefreshCw size={14} /> Refresh</button></div>{SOURCES.map((source) => <div key={source}><strong>{source}</strong><span className={`admin-v2-permission ${sourceState[source] === "Permission denied" ? "denied" : sourceState[source] === "Unavailable" ? "error" : ""}`}>{sourceState[source] || "Loading"}</span></div>)}</section>
    <div className="admin-v2-tabs" role="tablist">{TABS.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "is-active" : ""} onClick={() => setTab(id)}>{label}</button>)}</div>
    {tab === "legacy" ? <section className="admin-v2-panel"><div className="admin-v2-panel-head">Legacy and duplicate guidance</div><div className="admin-v2-duplicate-list"><article><div><strong>products</strong><span>Canonical marketplace catalog</span></div><p>Current product catalog for marketplace browsing and seller inventory.</p></article><article><div><strong>marketplace_orders</strong><span>Canonical marketplace order record</span></div><p>Primary Tanzania marketplace order collection.</p></article><article><div><strong>orders</strong><span>Compatibility/unified order copy</span></div><p>Duplicate order writes must not be cleaned until a validated migration phase.</p></article><article><div><strong>payments</strong><span>Payment review queue</span></div><p>Retain separately from order records for review and evidence workflows.</p></article></div></section> : <><section className="admin-v2-panel"><div className="admin-v2-panel-head">Search and filters</div><div className="admin-v2-filter-grid admin-v2-marketplace-filter-grid"><label>Search<input value={filters.search} onChange={(event) => setFilter("search", event.target.value)} placeholder="Product, order, buyer, seller, ID" /></label><label>Source collection<select value={filters.source} onChange={(event) => setFilter("source", event.target.value)}><option value="">All sources</option>{SOURCES.map((source) => <option key={source}>{source}</option>)}</select></label><label>Category<select value={filters.category} onChange={(event) => setFilter("category", event.target.value)}><option value="">All categories</option>{categoryOptions.map((item) => <option key={item}>{item}</option>)}</select></label><label>Status<select value={filters.status} onChange={(event) => setFilter("status", event.target.value)}><option value="">All statuses</option>{statusOptions.map((item) => <option key={item}>{item}</option>)}</select></label><label>Seller<input value={filters.seller} onChange={(event) => setFilter("seller", event.target.value)} placeholder="Filter seller" /></label><label>Payment method<select value={filters.method} onChange={(event) => setFilter("method", event.target.value)}><option value="">All methods</option>{methods.map((item) => <option key={item}>{item}</option>)}</select></label><label>Created date<input type="date" value={filters.created} onChange={(event) => setFilter("created", event.target.value)} /></label></div></section>{records.length === 0 && Object.values(sourceState).some((state) => state === "Loading") ? <div className="admin-v2-empty">Loading marketplace collections...</div> : filtered.length === 0 ? <div className="admin-v2-empty">No records match the current tab and filters. Collection access is shown above.</div> : <><section className="admin-v2-panel admin-v2-marketplace-table"><div className="admin-v2-panel-head">{TABS.find(([id]) => id === tab)?.[1]} <span>{filtered.length} visible records</span></div><div className="admin-v2-table-wrap"><table className="admin-v2-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}<th>Actions</th></tr></thead><tbody>{filtered.map((item) => <tr key={`${item.sourceCollection}:${item.id}`}>{fields(tab, item, productCountBySeller).map(([label, field]) => <td key={label}>{field}</td>)}<td><button className="admin-v2-view-button" onClick={() => setSelected(item)}>View</button><MarketplaceActions tab={tab} item={item} isSuperAdmin={isSuperAdmin} onAction={(action, it, field, newVal) => setConfirming({ action, item: it, field, newVal })} /></td></tr>)}</tbody></table></div></section><section className="admin-v2-marketplace-cards">{filtered.map((item) => <article key={`${item.sourceCollection}:${item.id}`}><div><strong>{title(item)}</strong><span>{item.sourceCollection}</span></div><dl>{fields(tab, item, productCountBySeller).slice(1, 5).map(([label, field]) => <div key={label}><dt>{label}</dt><dd>{field}</dd></div>)}</dl><button className="admin-v2-view-button" onClick={() => setSelected(item)}>View details</button><MarketplaceActions tab={tab} item={item} isSuperAdmin={isSuperAdmin} onAction={(action, it, field, newVal) => setConfirming({ action, item: it, field, newVal })} /></article>)}</section></>}</>}
    {selected && <MarketplaceDrawer item={selected} tab={tab} onClose={() => setSelected(null)} isSuperAdmin={isSuperAdmin} onAction={(action, it, field, newVal) => setConfirming({ action, item: it, field, newVal })} />}
  </>;
}
