/**
 * Digital tools subscription admin.
 * Reads toolSubscriptions plus legacy digital_tool_orders/user_subscriptions.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDownloadURL,
  getFirebaseDb,
  limit,
  onSnapshot,
  query,
  ref,
  serverTimestamp,
  setDoc,
  storage,
  uploadBytes,
} from "../../firebase.js";
import { Toast } from "../AdminUI";
import { addDays, cleanData, daysUntilExpiry, fmtDate } from "../../utils/cleanData.js";
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  Clock,
  CreditCard,
  Edit3,
  Eye,
  FileImage,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";

const G = "#F5A623";
const BORDER = "rgba(255,255,255,.08)";
const CURRENCIES = ["TZS", "USD", "CNY"];
const STATUSES = ["pending", "active", "expired", "rejected", "cancelled"];
const METHOD_TYPES = ["mobile_money", "card", "paypal", "qr", "bank", "other"];

const iSt = {
  width: "100%",
  height: 42,
  borderRadius: 10,
  background: "rgba(255,255,255,.05)",
  border: `1px solid ${BORDER}`,
  color: "#fff",
  padding: "0 12px",
  outline: "none",
  fontFamily: "inherit",
  fontSize: 13,
  boxSizing: "border-box",
};
const lSt = {
  display: "block",
  fontSize: 11,
  fontWeight: 850,
  color: "rgba(255,255,255,.45)",
  textTransform: "uppercase",
  letterSpacing: ".07em",
  marginBottom: 5,
};
const cardSt = {
  background: "rgba(255,255,255,.03)",
  borderRadius: 14,
  border: `1px solid ${BORDER}`,
  padding: 16,
};

const EMPTY_SUB = {
  toolId: "",
  toolTitle: "",
  userName: "",
  userEmail: "",
  whatsapp: "",
  country: "Tanzania",
  currency: "TZS",
  planId: "",
  planName: "",
  durationDays: 30,
  amount: "",
  paymentMethod: "M-Pesa",
  paymentReference: "",
  paymentProofUrl: "",
  status: "active",
  startsAt: "",
  expiresAt: "",
  notes: "",
};

const EMPTY_METHOD = {
  name: "",
  type: "mobile_money",
  currency: "TZS",
  country: "Tanzania",
  instructions: "",
  accountNumber: "",
  accountName: "",
  qrCodeUrl: "",
  linkedToolId: "",
  isActive: true,
  sortOrder: 1,
};

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(currency, value) {
  const n = toNumber(value);
  if (currency === "USD") return `USD $${n.toLocaleString()}`;
  if (currency === "CNY") return `CNY ¥${n.toLocaleString()}`;
  return `TZS ${n.toLocaleString()}`;
}

function toDateInput(value) {
  if (!value) return "";
  try {
    const d = value?.toDate ? value.toDate() : new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function statusColor(status) {
  if (status === "active") return { bg: "rgba(34,197,94,.14)", text: "#22c55e" };
  if (status === "pending") return { bg: "rgba(251,191,36,.16)", text: "#fbbf24" };
  if (status === "rejected" || status === "expired") return { bg: "rgba(239,68,68,.14)", text: "#f87171" };
  return { bg: "rgba(148,163,184,.13)", text: "#cbd5e1" };
}

function StatusBadge({ status }) {
  const c = statusColor(status || "pending");
  return <span style={{ borderRadius: 999, padding: "4px 9px", background: c.bg, color: c.text, fontSize: 10, fontWeight: 950, textTransform: "uppercase" }}>{status || "pending"}</span>;
}

function TabButton({ active, label, count, onClick }) {
  return (
    <button onClick={onClick} style={{ border: `1px solid ${active ? G : BORDER}`, background: active ? G : "transparent", color: active ? "#111" : "rgba(255,255,255,.66)", height: 38, padding: "0 13px", borderRadius: 10, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}>
      {label}
      {Number(count) > 0 && <span style={{ borderRadius: 999, background: active ? "rgba(0,0,0,.16)" : "rgba(245,166,35,.16)", color: active ? "#111" : G, padding: "1px 7px", fontSize: 11 }}>{count}</span>}
    </button>
  );
}

function normalizeSubscription(docData, collectionName) {
  const d = docData || {};
  if (collectionName === "digital_tool_orders") {
    return {
      id: d.id,
      _collection: collectionName,
      _legacy: true,
      toolId: d.toolId || "",
      toolTitle: d.toolTitle || "",
      userId: d.userId || "",
      userName: d.fullName || d.userName || "",
      userEmail: d.email || d.userEmail || "",
      whatsapp: d.phone || d.whatsapp || "",
      country: d.country || "Tanzania",
      currency: d.currency || "TZS",
      planId: d.selectedPlanId || d.planId || "",
      planName: d.selectedPlanName || d.planName || "",
      durationDays: Number(d.durationDays) || 30,
      amount: toNumber(d.amount || d.amountPaid),
      paymentMethod: d.paymentMethod || "",
      paymentReference: d.paymentReference || "",
      paymentProofUrl: d.paymentProofUrl || "",
      status: d.status === "approved" ? "active" : d.status || "pending",
      startsAt: d.startDate || d.startsAt || "",
      expiresAt: d.expiryDate || d.expiresAt || "",
      approvedAt: d.approvedAt || "",
      approvedBy: d.approvedBy || "",
      notes: d.notes || "",
      createdAt: d.createdAt || "",
      updatedAt: d.updatedAt || "",
    };
  }

  if (collectionName === "user_subscriptions") {
    return {
      id: d.id,
      _collection: collectionName,
      _legacy: true,
      toolId: d.toolId || "",
      toolTitle: d.toolTitle || d.planName || "",
      userId: d.userId || "",
      userName: d.userName || d.fullName || "",
      userEmail: d.userEmail || d.email || "",
      whatsapp: d.whatsapp || d.phone || "",
      country: d.country || "Tanzania",
      currency: d.currency || "TZS",
      planId: d.planId || "",
      planName: d.planName || "",
      durationDays: Number(d.durationDays) || 30,
      amount: toNumber(d.amount || d.amountPaid),
      paymentMethod: d.paymentMethod || "",
      paymentReference: d.paymentReference || "",
      paymentProofUrl: d.paymentProofUrl || "",
      status: d.status || "active",
      startsAt: d.startsAt || d.startDate || "",
      expiresAt: d.expiresAt || d.expiryDate || "",
      approvedAt: d.approvedAt || "",
      approvedBy: d.approvedBy || "",
      notes: d.notes || "",
      createdAt: d.createdAt || "",
      updatedAt: d.updatedAt || "",
    };
  }

  return {
    id: d.id,
    _collection: collectionName,
    toolId: d.toolId || "",
    toolTitle: d.toolTitle || "",
    userId: d.userId || "",
    userName: d.userName || d.fullName || "",
    userEmail: d.userEmail || d.email || "",
    whatsapp: d.whatsapp || d.phone || "",
    country: d.country || "Tanzania",
    currency: d.currency || "TZS",
    planId: d.planId || "",
    planName: d.planName || "",
    durationDays: Number(d.durationDays) || 30,
    amount: toNumber(d.amount || d.amountPaid),
    paymentMethod: d.paymentMethod || "",
    paymentReference: d.paymentReference || "",
    paymentProofUrl: d.paymentProofUrl || "",
    status: d.status || "pending",
    startsAt: d.startsAt || "",
    expiresAt: d.expiresAt || "",
    approvedAt: d.approvedAt || "",
    approvedBy: d.approvedBy || "",
    notes: d.notes || "",
    createdAt: d.createdAt || "",
    updatedAt: d.updatedAt || "",
  };
}

function subscriptionPayload(sub) {
  return cleanData({
    toolId: sub.toolId || "",
    toolTitle: sub.toolTitle || "",
    userId: sub.userId || "",
    userName: sub.userName || "",
    userEmail: sub.userEmail || "",
    whatsapp: sub.whatsapp || "",
    country: sub.country || "",
    currency: sub.currency || "TZS",
    planId: sub.planId || "",
    planName: sub.planName || "",
    durationDays: Number(sub.durationDays) || 30,
    amount: toNumber(sub.amount),
    paymentMethod: sub.paymentMethod || "",
    paymentReference: sub.paymentReference || "",
    paymentProofUrl: sub.paymentProofUrl || "",
    status: sub.status || "pending",
    startsAt: sub.startsAt || "",
    expiresAt: sub.expiresAt || "",
    approvedAt: sub.approvedAt || "",
    approvedBy: sub.approvedBy || "",
    notes: sub.notes || "",
  });
}

function buildStats(subscriptions) {
  const revenue = { TZS: 0, USD: 0, CNY: 0 };
  const byTool = {};
  subscriptions.forEach((sub) => {
    if (sub.status !== "active") return;
    const currency = CURRENCIES.includes(sub.currency) ? sub.currency : "TZS";
    revenue[currency] += toNumber(sub.amount);
    const tool = sub.toolTitle || "Unknown Tool";
    byTool[tool] = (byTool[tool] || 0) + toNumber(sub.amount);
  });
  return {
    total: subscriptions.length,
    active: subscriptions.filter((s) => s.status === "active").length,
    pending: subscriptions.filter((s) => s.status === "pending").length,
    expired: subscriptions.filter((s) => s.status === "expired" || daysUntilExpiry(s.expiresAt) < 0).length,
    rejected: subscriptions.filter((s) => s.status === "rejected").length,
    revenue,
    byTool,
    recent: [...subscriptions].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 8),
    expiringSoon: subscriptions.filter((s) => {
      const days = daysUntilExpiry(s.expiresAt);
      return s.status === "active" && days !== null && days >= 0 && days <= 7;
    }).slice(0, 8),
  };
}

function StatCard({ label, value, icon, color = G }) {
  return (
    <div style={cardSt}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ color: "rgba(255,255,255,.48)", fontSize: 12, fontWeight: 850 }}>{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div style={{ color, fontSize: 25, fontWeight: 950, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function SubscriptionForm({ form, setForm, tools, onSave, onCancel, saving }) {
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  return (
    <div style={{ ...cardSt, borderColor: "rgba(245,166,35,.28)", marginBottom: 16 }}>
      <div style={{ color: G, fontWeight: 950, marginBottom: 14 }}>Manual Subscription</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
        <div><label style={lSt}>Full Name</label><input value={form.userName} onChange={(e) => set("userName", e.target.value)} style={iSt} /></div>
        <div><label style={lSt}>Email</label><input value={form.userEmail} onChange={(e) => set("userEmail", e.target.value)} style={iSt} /></div>
        <div><label style={lSt}>WhatsApp</label><input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} style={iSt} /></div>
        <div><label style={lSt}>Country</label><input value={form.country} onChange={(e) => set("country", e.target.value)} style={iSt} /></div>
        <div>
          <label style={lSt}>Tool</label>
          <select value={form.toolId} onChange={(e) => {
            const tool = tools.find((t) => t.id === e.target.value);
            setForm((prev) => ({ ...prev, toolId: e.target.value, toolTitle: tool?.title || prev.toolTitle }));
          }} style={{ ...iSt, cursor: "pointer" }}>
            <option value="">Select tool</option>
            {tools.map((tool) => <option key={`${tool._collection}-${tool.id}`} value={tool.id}>{tool.title || tool.name}</option>)}
          </select>
        </div>
        <div><label style={lSt}>Tool Title</label><input value={form.toolTitle} onChange={(e) => set("toolTitle", e.target.value)} style={iSt} /></div>
        <div><label style={lSt}>Plan</label><input value={form.planName} onChange={(e) => set("planName", e.target.value)} style={iSt} /></div>
        <div><label style={lSt}>Duration Days</label><input type="number" value={form.durationDays} onChange={(e) => set("durationDays", e.target.value)} style={iSt} /></div>
        <div><label style={lSt}>Currency</label><select value={form.currency} onChange={(e) => set("currency", e.target.value)} style={{ ...iSt, cursor: "pointer" }}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div><label style={lSt}>Amount</label><input type="number" value={form.amount} onChange={(e) => set("amount", e.target.value)} style={iSt} /></div>
        <div><label style={lSt}>Payment Method</label><input value={form.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)} style={iSt} /></div>
        <div><label style={lSt}>Reference</label><input value={form.paymentReference} onChange={(e) => set("paymentReference", e.target.value)} style={iSt} /></div>
        <div><label style={lSt}>Starts At</label><input type="date" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} style={iSt} /></div>
        <div><label style={lSt}>Expires At</label><input type="date" value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} style={iSt} /></div>
        <div><label style={lSt}>Status</label><select value={form.status} onChange={(e) => set("status", e.target.value)} style={{ ...iSt, cursor: "pointer" }}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
      </div>
      <div style={{ marginTop: 10 }}><label style={lSt}>Admin Notes</label><textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} style={{ ...iSt, height: 78, paddingTop: 9, resize: "vertical" }} /></div>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button onClick={onSave} disabled={saving} style={{ height: 40, padding: "0 18px", border: "none", borderRadius: 10, background: G, color: "#111", fontWeight: 950, cursor: "pointer", opacity: saving ? 0.65 : 1 }}>Save</button>
        <button onClick={onCancel} style={{ height: 40, padding: "0 18px", border: `1px solid ${BORDER}`, borderRadius: 10, background: "transparent", color: "rgba(255,255,255,.66)", fontWeight: 850, cursor: "pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

function SubscriptionsTab({ subscriptions, tools, db, user, toast_, onViewProof }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [tool, setTool] = useState("all");
  const [currency, setCurrency] = useState("all");
  const [method, setMethod] = useState("all");
  const [country, setCountry] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(EMPTY_SUB);
  const [saving, setSaving] = useState(false);
  const stats = useMemo(() => buildStats(subscriptions), [subscriptions]);

  const countries = useMemo(() => Array.from(new Set(subscriptions.map((s) => s.country).filter(Boolean))).sort(), [subscriptions]);
  const methods = useMemo(() => Array.from(new Set(subscriptions.map((s) => s.paymentMethod).filter(Boolean))).sort(), [subscriptions]);

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subscriptions.filter((sub) => {
      if (status !== "all" && sub.status !== status) return false;
      if (tool !== "all" && sub.toolId !== tool && sub.toolTitle !== tool) return false;
      if (currency !== "all" && sub.currency !== currency) return false;
      if (method !== "all" && sub.paymentMethod !== method) return false;
      if (country !== "all" && sub.country !== country) return false;
      if (!q) return true;
      return [sub.userName, sub.userEmail, sub.whatsapp, sub.toolTitle, sub.paymentReference].join(" ").toLowerCase().includes(q);
    });
  }, [subscriptions, search, status, tool, currency, method, country]);

  const saveToToolSubscriptions = async (sub, updates = {}) => {
    const id = sub.id || doc(collection(db, "toolSubscriptions")).id;
    const payload = cleanData({
      ...subscriptionPayload(sub),
      ...updates,
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, "toolSubscriptions", id), payload, { merge: true });
    if (sub._legacy && sub._collection && sub.id) {
      const legacyStatus = updates.status === "active" && sub._collection === "digital_tool_orders" ? "approved" : updates.status;
      await setDoc(doc(db, sub._collection, sub.id), cleanData({ status: legacyStatus, updatedAt: serverTimestamp() }), { merge: true });
    }
  };

  const approve = async (sub) => {
    const start = sub.startsAt ? new Date(sub.startsAt) : new Date();
    const expiry = sub.expiresAt ? new Date(sub.expiresAt) : addDays(start, Number(sub.durationDays) || 30);
    await saveToToolSubscriptions(sub, {
      status: "active",
      startsAt: start.toISOString(),
      expiresAt: expiry.toISOString(),
      approvedAt: serverTimestamp(),
      approvedBy: user?.uid || user?.email || "admin",
    });
    toast_("Subscription approved.");
  };

  const updateStatus = async (sub, nextStatus) => {
    await saveToToolSubscriptions(sub, { status: nextStatus });
    toast_(`Marked ${nextStatus}.`);
  };

  const renew = async (sub) => {
    const days = Number(window.prompt("Renew for how many days?", String(sub.durationDays || 30)));
    if (!days) return;
    const base = sub.expiresAt && daysUntilExpiry(sub.expiresAt) > 0 ? new Date(sub.expiresAt) : new Date();
    await saveToToolSubscriptions(sub, { status: "active", expiresAt: addDays(base, days).toISOString(), durationDays: days });
    toast_("Subscription renewed.");
  };

  const editExpiry = async (sub) => {
    const value = window.prompt("New expiry date (YYYY-MM-DD)", toDateInput(sub.expiresAt));
    if (!value) return;
    await saveToToolSubscriptions(sub, { expiresAt: new Date(value).toISOString() });
    toast_("Expiry updated.");
  };

  const editNotes = async (sub) => {
    const notes = window.prompt("Admin notes", sub.notes || "");
    if (notes === null) return;
    await saveToToolSubscriptions(sub, { notes });
    toast_("Notes updated.");
  };

  const openManual = () => {
    setForm({ ...EMPTY_SUB, startsAt: new Date().toISOString().slice(0, 10), expiresAt: addDays(new Date(), 30).toISOString().slice(0, 10) });
    setEditingId("");
    setShowForm(true);
  };

  const openEdit = (sub) => {
    setForm({
      ...EMPTY_SUB,
      ...sub,
      amount: sub.amount || "",
      startsAt: toDateInput(sub.startsAt),
      expiresAt: toDateInput(sub.expiresAt),
    });
    setEditingId(sub.id);
    setShowForm(true);
  };

  const saveManual = async () => {
    if (!form.userName || !form.toolTitle) {
      toast_("Name and tool title are required.", "error");
      return;
    }
    setSaving(true);
    try {
      const id = editingId || doc(collection(db, "toolSubscriptions")).id;
      await setDoc(doc(db, "toolSubscriptions", id), cleanData({
        ...subscriptionPayload(form),
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : "",
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : "",
        createdAt: editingId ? undefined : serverTimestamp(),
        updatedAt: serverTimestamp(),
      }), { merge: true });
      setShowForm(false);
      setEditingId("");
      setForm(EMPTY_SUB);
      toast_("Subscription saved.");
    } catch (error) {
      toast_(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 16 }}>
        <StatCard label="Total" value={stats.total} icon={<Users size={18} />} color="#a5b4fc" />
        <StatCard label="Active" value={stats.active} icon={<CheckCircle size={18} />} color="#22c55e" />
        <StatCard label="Pending" value={stats.pending} icon={<Clock size={18} />} color="#fbbf24" />
        <StatCard label="Expired" value={stats.expired} icon={<AlertTriangle size={18} />} color="#f87171" />
        {CURRENCIES.map((cur) => <StatCard key={cur} label={`${cur} Revenue`} value={money(cur, stats.revenue[cur])} icon={<CreditCard size={18} />} />)}
      </div>

      <div style={{ ...cardSt, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(180px,1fr) repeat(5,minmax(120px,160px)) auto", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 11, top: 13, color: "rgba(255,255,255,.35)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, WhatsApp, tool, reference" style={{ ...iSt, paddingLeft: 34 }} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...iSt, cursor: "pointer" }}><option value="all">All Status</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          <select value={tool} onChange={(e) => setTool(e.target.value)} style={{ ...iSt, cursor: "pointer" }}><option value="all">All Tools</option>{tools.map((t) => <option key={`${t._collection}-${t.id}`} value={t.id}>{t.title || t.name}</option>)}</select>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ ...iSt, cursor: "pointer" }}><option value="all">All Currency</option>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
          <select value={method} onChange={(e) => setMethod(e.target.value)} style={{ ...iSt, cursor: "pointer" }}><option value="all">All Methods</option>{methods.map((m) => <option key={m}>{m}</option>)}</select>
          <select value={country} onChange={(e) => setCountry(e.target.value)} style={{ ...iSt, cursor: "pointer" }}><option value="all">All Countries</option>{countries.map((c) => <option key={c}>{c}</option>)}</select>
          <button onClick={openManual} style={{ height: 42, border: "none", borderRadius: 10, background: G, color: "#111", fontWeight: 950, padding: "0 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}><Plus size={16} /> Add User</button>
        </div>
      </div>

      {showForm && <SubscriptionForm form={form} setForm={setForm} tools={tools} onSave={saveManual} onCancel={() => setShowForm(false)} saving={saving} />}

      <div style={{ display: "grid", gap: 10 }}>
        {displayed.length === 0 && <div style={{ ...cardSt, textAlign: "center", color: "rgba(255,255,255,.45)", padding: 34 }}>No subscriptions match the current filters.</div>}
        {displayed.map((sub) => {
          const expDays = daysUntilExpiry(sub.expiresAt);
          return (
            <div key={`${sub._collection}-${sub.id}`} style={{ ...cardSt, borderColor: sub.status === "pending" ? "rgba(245,166,35,.28)" : BORDER }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(220px,1fr) minmax(170px,.8fr) minmax(160px,.7fr) auto", gap: 14, alignItems: "start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
                    <strong style={{ fontSize: 15 }}>{sub.userName || "-"}</strong>
                    <StatusBadge status={sub.status} />
                    {sub._legacy && <span style={{ borderRadius: 999, background: "rgba(148,163,184,.13)", color: "#cbd5e1", padding: "3px 8px", fontSize: 10, fontWeight: 900 }}>legacy</span>}
                  </div>
                  <div style={{ color: "rgba(255,255,255,.52)", fontSize: 12, lineHeight: 1.6 }}>{sub.userEmail || "-"}<br />{sub.whatsapp || "-"}</div>
                  <div style={{ color: "rgba(255,255,255,.36)", fontSize: 11, marginTop: 4 }}>{sub.country || "-"}<br />Submitted: {fmtDate(sub.createdAt)}</div>
                </div>
                <div>
                  <div style={{ color: G, fontWeight: 950, marginBottom: 4 }}>{sub.toolTitle || "-"}</div>
                  <div style={{ color: "rgba(255,255,255,.54)", fontSize: 12, lineHeight: 1.6 }}>Plan: {sub.planName || "-"}<br />Duration: {sub.durationDays || 30} days</div>
                </div>
                <div>
                  <div style={{ fontWeight: 950, color: "#fff", marginBottom: 4 }}>{money(sub.currency || "TZS", sub.amount)}</div>
                  <div style={{ color: "rgba(255,255,255,.54)", fontSize: 12, lineHeight: 1.6 }}>{sub.paymentMethod || "-"}<br />Ref: {sub.paymentReference || "-"}</div>
                  {sub.paymentProofUrl && <button onClick={() => onViewProof(sub.paymentProofUrl)} style={{ marginTop: 8, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.05)", color: "#fff", borderRadius: 8, padding: "6px 9px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 850 }}><Eye size={13} /> Proof</button>}
                </div>
                <div style={{ display: "grid", gap: 6, minWidth: 150 }}>
                  <div style={{ color: expDays !== null && expDays <= 7 ? "#fbbf24" : "rgba(255,255,255,.52)", fontSize: 12, marginBottom: 3 }}>Expires: {fmtDate(sub.expiresAt)}{expDays !== null ? ` (${expDays}d)` : ""}</div>
                  {sub.status === "pending" && <button onClick={() => approve(sub)} style={actionBtn("#22c55e")}><CheckCircle size={13} /> Approve</button>}
                  {sub.status === "pending" && <button onClick={() => updateStatus(sub, "rejected")} style={actionBtn("#f87171", true)}><XCircle size={13} /> Reject</button>}
                  {sub.status === "active" && <button onClick={() => updateStatus(sub, "cancelled")} style={actionBtn("#f87171", true)}><Ban size={13} /> Cancel</button>}
                  {sub.status !== "active" && sub.status !== "pending" && <button onClick={() => approve(sub)} style={actionBtn("#22c55e")}><CheckCircle size={13} /> Mark Active</button>}
                  <button onClick={() => updateStatus(sub, "expired")} style={actionBtn("#fbbf24", true)}><AlertTriangle size={13} /> Mark Expired</button>
                  <button onClick={() => renew(sub)} style={actionBtn(G, true)}><RefreshCw size={13} /> Renew</button>
                  <button onClick={() => editExpiry(sub)} style={actionBtn("#60a5fa", true)}><Edit3 size={13} /> Expiry</button>
                  <button onClick={() => editNotes(sub)} style={actionBtn("#cbd5e1", true)}><FileImage size={13} /> Notes</button>
                  <button onClick={() => openEdit(sub)} style={actionBtn("#a5b4fc", true)}><Edit3 size={13} /> Edit</button>
                </div>
              </div>
              {sub.notes && <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${BORDER}`, color: "rgba(255,255,255,.52)", fontSize: 12 }}>Notes: {sub.notes}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function actionBtn(color, soft = false) {
  return {
    minHeight: 30,
    borderRadius: 8,
    border: soft ? `1px solid ${color}55` : "none",
    background: soft ? `${color}18` : color,
    color: soft ? color : "#fff",
    fontWeight: 900,
    fontSize: 11,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    padding: "6px 8px",
  };
}

export function PaymentMethodsTab({ methods, db, toast_, tools = [] }) {
  const [form, setForm] = useState(EMPTY_METHOD);
  const [editing, setEditing] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setForm(EMPTY_METHOD);
    setEditing("");
  };

  const uploadQr = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileRef = ref(storage, `paymentMethods/qr/${Date.now()}_${safeName}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      set("qrCodeUrl", url);
      toast_("QR code uploaded.");
    } catch (error) {
      toast_(error?.code === "storage/unauthorized" ? "Storage upload blocked. Add Storage rules for paymentMethods/qr." : error.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name) {
      toast_("Payment method name is required.", "error");
      return;
    }
    setSaving(true);
    try {
      const id = editing || doc(collection(db, "paymentMethods")).id;
      await setDoc(doc(db, "paymentMethods", id), cleanData({
        ...form,
        sortOrder: Number(form.sortOrder) || 0,
        updatedAt: serverTimestamp(),
        createdAt: editing ? undefined : serverTimestamp(),
      }), { merge: true });
      toast_("Payment method saved.");
      reset();
    } catch (error) {
      toast_(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(280px,420px) minmax(0,1fr)", gap: 16 }}>
      <div style={cardSt}>
        <div style={{ color: G, fontWeight: 950, marginBottom: 14 }}>{editing ? "Edit Payment Method" : "Add Payment Method"}</div>
        <div style={{ display: "grid", gap: 10 }}>
          <div><label style={lSt}>Name</label><input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="M-Pesa" style={iSt} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label style={lSt}>Type</label><select value={form.type} onChange={(e) => set("type", e.target.value)} style={{ ...iSt, cursor: "pointer" }}>{METHOD_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div><label style={lSt}>Currency</label><select value={form.currency} onChange={(e) => set("currency", e.target.value)} style={{ ...iSt, cursor: "pointer" }}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}<option>ALL</option></select></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label style={lSt}>Country</label><input value={form.country} onChange={(e) => set("country", e.target.value)} style={iSt} /></div>
            <div><label style={lSt}>Sort Order</label><input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} style={iSt} /></div>
          </div>
          {tools.length > 0 && (
            <div>
              <label style={lSt}>Linked Tool Optional</label>
              <select value={form.linkedToolId || ""} onChange={(e) => set("linkedToolId", e.target.value)} style={{ ...iSt, cursor: "pointer" }}>
                <option value="">All digital tools</option>
                {tools.map((tool) => <option key={`${tool._collection || "tool"}-${tool.id}`} value={tool.id}>{tool.title || tool.name || tool.slug || tool.id}</option>)}
              </select>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label style={lSt}>Account Number</label><input value={form.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} style={iSt} /></div>
            <div><label style={lSt}>Account Name</label><input value={form.accountName} onChange={(e) => set("accountName", e.target.value)} style={iSt} /></div>
          </div>
          <div><label style={lSt}>Instructions</label><textarea value={form.instructions} onChange={(e) => set("instructions", e.target.value)} placeholder="Use {amount} placeholder for dynamic payment amount." style={{ ...iSt, height: 92, resize: "vertical", paddingTop: 9 }} /></div>
          <div><label style={lSt}>QR Code URL</label><input value={form.qrCodeUrl} onChange={(e) => set("qrCodeUrl", e.target.value)} placeholder="https://..." style={iSt} /></div>
          <label style={{ ...iSt, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "rgba(255,255,255,.66)" }}>
            <QrCode size={16} color={G} /> {uploading ? "Uploading..." : "Upload QR code image"}
            <input type="file" accept="image/*" onChange={(e) => uploadQr(e.target.files?.[0])} style={{ display: "none" }} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,.72)", fontWeight: 850 }}>
            <input type="checkbox" checked={!!form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
            Active
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={save} disabled={saving} style={{ height: 40, flex: 1, border: "none", borderRadius: 10, background: G, color: "#111", fontWeight: 950, cursor: "pointer", opacity: saving ? 0.65 : 1 }}>Save Method</button>
            <button onClick={reset} style={{ height: 40, padding: "0 14px", border: `1px solid ${BORDER}`, borderRadius: 10, background: "transparent", color: "rgba(255,255,255,.66)", fontWeight: 850, cursor: "pointer" }}>Clear</button>
          </div>
          <div style={{ color: "rgba(255,255,255,.38)", fontSize: 12, lineHeight: 1.5 }}>
            Firebase Storage is configured in this app. If QR upload fails, use the QR URL field and add Storage rules for paymentMethods/qr.
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
        {methods.length === 0 && <div style={{ ...cardSt, textAlign: "center", color: "rgba(255,255,255,.45)" }}>No payment methods yet.</div>}
        {methods.map((method) => (
          <div key={method.id} style={cardSt}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              {method.qrCodeUrl ? <img src={method.qrCodeUrl} alt={method.name} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 12, background: "#fff", border: `1px solid ${BORDER}` }} /> : <div style={{ width: 72, height: 72, borderRadius: 12, display: "grid", placeItems: "center", border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.04)", color: G }}><CreditCard size={24} /></div>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <strong>{method.name}</strong>
                  <span style={{ color: method.isActive ? "#22c55e" : "#f87171", fontSize: 11, fontWeight: 950 }}>{method.isActive ? "ACTIVE" : "INACTIVE"}</span>
                </div>
                <div style={{ color: "rgba(255,255,255,.52)", fontSize: 12, lineHeight: 1.6, marginTop: 4 }}>{method.type} | {method.currency} | {method.country}<br />{method.accountName || "-"} {method.accountNumber || ""}</div>
                {method.instructions && <div style={{ color: "rgba(255,255,255,.42)", fontSize: 12, marginTop: 7, lineHeight: 1.5 }}>{method.instructions}</div>}
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                <button onClick={() => { setForm({ ...EMPTY_METHOD, ...method }); setEditing(method.id); }} style={actionBtn("#60a5fa", true)}><Edit3 size={13} /> Edit</button>
                <button onClick={() => setDoc(doc(db, "paymentMethods", method.id), { isActive: !method.isActive, updatedAt: serverTimestamp() }, { merge: true })} style={actionBtn(method.isActive ? "#f87171" : "#22c55e", true)}>{method.isActive ? "Deactivate" : "Activate"}</button>
                <button onClick={async () => { if (window.confirm("Delete this payment method?")) { await deleteDoc(doc(db, "paymentMethods", method.id)); toast_("Payment method deleted."); } }} style={actionBtn("#f87171", true)}><Trash2 size={13} /> Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsTab({ subscriptions }) {
  const stats = useMemo(() => buildStats(subscriptions), [subscriptions]);
  const toolRows = Object.entries(stats.byTool).sort((a, b) => b[1] - a[1]).slice(0, 10);
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
        <StatCard label="Total Subscriptions" value={stats.total} icon={<Users size={18} />} color="#a5b4fc" />
        <StatCard label="Active" value={stats.active} icon={<CheckCircle size={18} />} color="#22c55e" />
        <StatCard label="Pending Payments" value={stats.pending} icon={<Clock size={18} />} color="#fbbf24" />
        <StatCard label="Expired" value={stats.expired} icon={<AlertTriangle size={18} />} color="#f87171" />
        {CURRENCIES.map((cur) => <StatCard key={cur} label={`${cur} Revenue`} value={money(cur, stats.revenue[cur])} icon={<CreditCard size={18} />} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
        <div style={cardSt}>
          <div style={{ color: G, fontWeight: 950, marginBottom: 12 }}>Revenue by Tool</div>
          {toolRows.length === 0 ? <div style={{ color: "rgba(255,255,255,.42)" }}>No active revenue yet.</div> : toolRows.map(([tool, amount]) => (
            <div key={tool} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: `1px solid ${BORDER}` }}>
              <span>{tool}</span><strong style={{ color: G }}>TZS {Number(amount).toLocaleString()}</strong>
            </div>
          ))}
        </div>
        <div style={cardSt}>
          <div style={{ color: G, fontWeight: 950, marginBottom: 12 }}>Recent Subscribers</div>
          {stats.recent.map((sub) => <div key={`${sub._collection}-${sub.id}`} style={{ padding: "9px 0", borderBottom: `1px solid ${BORDER}`, color: "rgba(255,255,255,.7)" }}>{sub.userName || "-"}<br /><span style={{ color: "rgba(255,255,255,.42)", fontSize: 12 }}>{sub.toolTitle} | {money(sub.currency, sub.amount)}</span></div>)}
        </div>
        <div style={cardSt}>
          <div style={{ color: G, fontWeight: 950, marginBottom: 12 }}>Expiring Soon</div>
          {stats.expiringSoon.length === 0 ? <div style={{ color: "rgba(255,255,255,.42)" }}>No active subscriptions expiring within 7 days.</div> : stats.expiringSoon.map((sub) => <div key={`${sub._collection}-${sub.id}`} style={{ padding: "9px 0", borderBottom: `1px solid ${BORDER}`, color: "rgba(255,255,255,.7)" }}>{sub.userName || "-"}<br /><span style={{ color: "#fbbf24", fontSize: 12 }}>{sub.toolTitle} | {fmtDate(sub.expiresAt)}</span></div>)}
        </div>
      </div>
    </div>
  );
}

function CategoriesTab({ db, toast_ }) {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", status: "active" });
  const [editing, setEditing] = useState("");

  useEffect(() => {
    if (!db) return undefined;
    return onSnapshot(collection(db, "subscription_categories"), (snap) => {
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (error) => console.warn("subscription_categories read error:", error.message));
  }, [db]);

  const save = async () => {
    if (!form.name) {
      toast_("Category name is required.", "error");
      return;
    }
    const id = editing || doc(collection(db, "subscription_categories")).id;
    await setDoc(doc(db, "subscription_categories", id), cleanData({
      ...form,
      slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      updatedAt: serverTimestamp(),
      createdAt: editing ? undefined : serverTimestamp(),
    }), { merge: true });
    setForm({ name: "", description: "", status: "active" });
    setEditing("");
    toast_("Category saved.");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(260px,380px) minmax(0,1fr)", gap: 16 }}>
      <div style={cardSt}>
        <div style={{ color: G, fontWeight: 950, marginBottom: 12 }}>{editing ? "Edit Category" : "Add Category"}</div>
        <div style={{ display: "grid", gap: 10 }}>
          <div><label style={lSt}>Name</label><input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} style={iSt} /></div>
          <div><label style={lSt}>Description</label><textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} style={{ ...iSt, height: 80, paddingTop: 9, resize: "vertical" }} /></div>
          <div><label style={lSt}>Status</label><select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} style={{ ...iSt, cursor: "pointer" }}><option>active</option><option>inactive</option></select></div>
          <button onClick={save} style={{ height: 40, border: "none", borderRadius: 10, background: G, color: "#111", fontWeight: 950, cursor: "pointer" }}>Save Category</button>
        </div>
      </div>
      <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
        {categories.map((cat) => (
          <div key={cat.id} style={{ ...cardSt, display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div><strong>{cat.name}</strong><div style={{ color: "rgba(255,255,255,.45)", fontSize: 12, marginTop: 4 }}>{cat.description || ""}</div></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setEditing(cat.id); setForm({ name: cat.name || "", description: cat.description || "", status: cat.status || "active" }); }} style={actionBtn("#60a5fa", true)}>Edit</button>
              <button onClick={async () => { if (window.confirm("Delete category?")) { await deleteDoc(doc(db, "subscription_categories", cat.id)); toast_("Category deleted."); } }} style={actionBtn("#f87171", true)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsTab({ db, toast_ }) {
  const [settings, setSettings] = useState({
    defaultPaymentInstructions: "Tuma TZS {amount} kupitia Lipa Namba 555999 (STEA). Kisha weka namba ya uthibitisho.",
    defaultWA: "255757053354",
    paymentNumber: "555999",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!db) return undefined;
    return onSnapshot(doc(db, "subscription_settings", "defaults"), (snap) => {
      if (snap.exists()) setSettings((prev) => ({ ...prev, ...snap.data() }));
    }, (error) => console.warn("subscription_settings read error:", error.message));
  }, [db]);

  const save = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "subscription_settings", "defaults"), cleanData({ ...settings, updatedAt: serverTimestamp() }), { merge: true });
      toast_("Settings saved.");
    } catch (error) {
      toast_(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 560, ...cardSt }}>
      <div style={{ color: G, fontWeight: 950, marginBottom: 12 }}>Subscription Defaults</div>
      <div style={{ display: "grid", gap: 10 }}>
        <div><label style={lSt}>WhatsApp Support</label><input value={settings.defaultWA} onChange={(e) => setSettings((p) => ({ ...p, defaultWA: e.target.value }))} style={iSt} /></div>
        <div><label style={lSt}>Payment Number</label><input value={settings.paymentNumber} onChange={(e) => setSettings((p) => ({ ...p, paymentNumber: e.target.value }))} style={iSt} /></div>
        <div><label style={lSt}>Default Instructions</label><textarea value={settings.defaultPaymentInstructions} onChange={(e) => setSettings((p) => ({ ...p, defaultPaymentInstructions: e.target.value }))} style={{ ...iSt, height: 110, paddingTop: 9, resize: "vertical" }} /></div>
        <button onClick={save} disabled={saving} style={{ height: 42, border: "none", borderRadius: 10, background: G, color: "#111", fontWeight: 950, cursor: "pointer", opacity: saving ? 0.65 : 1 }}>Save Settings</button>
      </div>
    </div>
  );
}

export default function SubscriptionManager({ user }) {
  const db = getFirebaseDb();
  const [activeTab, setActiveTab] = useState("subscriptions");
  const [rawSubs, setRawSubs] = useState([]);
  const [tools, setTools] = useState([]);
  const [methods, setMethods] = useState([]);
  const [toast, setToast] = useState(null);
  const [proofUrl, setProofUrl] = useState("");
  const toast_ = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3400);
  }, []);

  useEffect(() => {
    if (!db) return undefined;
    const state = { toolSubscriptions: [], digital_tool_orders: [], user_subscriptions: [] };
    const publish = () => {
      const map = new Map();
      [...state.toolSubscriptions, ...state.digital_tool_orders, ...state.user_subscriptions].forEach((sub) => {
        const key = sub.id || `${sub.userEmail}-${sub.toolTitle}-${sub.createdAt?.seconds || ""}`;
        if (!map.has(key)) map.set(key, sub);
      });
      setRawSubs(Array.from(map.values()));
    };
    const unsubs = [
      onSnapshot(query(collection(db, "toolSubscriptions"), limit(1000)), (snap) => {
        state.toolSubscriptions = snap.docs.map((d) => normalizeSubscription({ id: d.id, ...d.data() }, "toolSubscriptions"));
        publish();
      }, (error) => console.warn("toolSubscriptions read error:", error.message)),
      onSnapshot(query(collection(db, "digital_tool_orders"), limit(1000)), (snap) => {
        state.digital_tool_orders = snap.docs.map((d) => normalizeSubscription({ id: d.id, ...d.data() }, "digital_tool_orders"));
        publish();
      }, (error) => console.warn("digital_tool_orders read error:", error.message)),
      onSnapshot(query(collection(db, "user_subscriptions"), limit(1000)), (snap) => {
        state.user_subscriptions = snap.docs.map((d) => normalizeSubscription({ id: d.id, ...d.data() }, "user_subscriptions"));
        publish();
      }, (error) => console.warn("user_subscriptions read error:", error.message)),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, [db]);

  useEffect(() => {
    if (!db) return undefined;
    let primary = [];
    let compat = [];
    const publish = () => {
      const seen = new Map();
      [...primary, ...compat].forEach((tool) => {
        const key = tool.slug || tool.id;
        if (!seen.has(key)) seen.set(key, tool);
      });
      setTools(Array.from(seen.values()));
    };
    const unsubs = [
      onSnapshot(query(collection(db, "digital_tools"), limit(500)), (snap) => {
        primary = snap.docs.map((d) => ({ id: d.id, _collection: "digital_tools", ...d.data() }));
        publish();
      }),
      onSnapshot(query(collection(db, "digitalTools"), limit(500)), (snap) => {
        compat = snap.docs.map((d) => ({ id: d.id, _collection: "digitalTools", ...d.data() }));
        publish();
      }, () => publish()),
      onSnapshot(query(collection(db, "paymentMethods"), limit(500)), (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        arr.sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
        setMethods(arr);
      }, (error) => console.warn("paymentMethods read error:", error.message)),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, [db]);

  const stats = useMemo(() => buildStats(rawSubs), [rawSubs]);

  return (
    <div style={{ color: "#fff", fontFamily: "'Instrument Sans',system-ui,sans-serif" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div style={{ display: "flex", gap: 8, paddingBottom: 12, marginBottom: 18, borderBottom: `1px solid ${BORDER}`, overflowX: "auto" }}>
        <TabButton active={activeTab === "subscriptions"} label="Manage Subscriptions" count={stats.pending} onClick={() => setActiveTab("subscriptions")} />
        <TabButton active={activeTab === "methods"} label="Payment Methods" count={methods.filter((m) => m.isActive).length} onClick={() => setActiveTab("methods")} />
        <TabButton active={activeTab === "analytics"} label="Analytics" onClick={() => setActiveTab("analytics")} />
        <TabButton active={activeTab === "categories"} label="Categories" onClick={() => setActiveTab("categories")} />
        <TabButton active={activeTab === "settings"} label="Settings" onClick={() => setActiveTab("settings")} />
      </div>

      {activeTab === "subscriptions" && <SubscriptionsTab subscriptions={rawSubs} tools={tools} db={db} user={user} toast_={toast_} onViewProof={setProofUrl} />}
      {activeTab === "methods" && <PaymentMethodsTab methods={methods} db={db} toast_={toast_} tools={tools} />}
      {activeTab === "analytics" && <AnalyticsTab subscriptions={rawSubs} />}
      {activeTab === "categories" && <CategoriesTab db={db} toast_={toast_} />}
      {activeTab === "settings" && <SettingsTab db={db} toast_={toast_} />}

      {proofUrl && (
        <div onClick={() => setProofUrl("")} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.82)", display: "grid", placeItems: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 820, width: "100%", background: "#0d0f16", border: `1px solid ${BORDER}`, borderRadius: 18, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
              <strong>Payment Proof</strong>
              <button onClick={() => setProofUrl("")} style={{ border: `1px solid ${BORDER}`, background: "transparent", color: "#fff", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}>Close</button>
            </div>
            {/\.(png|jpg|jpeg|webp|gif)(\?|$)/i.test(proofUrl) ? <img src={proofUrl} alt="Payment proof" style={{ maxWidth: "100%", maxHeight: "75vh", display: "block", margin: "0 auto", borderRadius: 12 }} /> : <a href={proofUrl} target="_blank" rel="noreferrer" style={{ color: G }}>Open proof file</a>}
          </div>
        </div>
      )}
    </div>
  );
}
