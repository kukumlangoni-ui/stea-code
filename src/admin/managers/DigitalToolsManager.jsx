/**
 * DigitalToolsManager — repaired all null/undefined crashes
 * Root causes fixed:
 *   1. null plans / galleryImages from Firestore bypassed default params → crash
 *   2. Missing onSnapshot error handler for subscription_categories
 *   3. openEdit() now normalises all array fields before setting form state
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  getFirebaseDb, collection, query, limit, onSnapshot,
  doc, setDoc, deleteDoc, serverTimestamp,
} from "../../firebase.js";
import { StorageMediaField, Toast } from "../AdminUI.jsx";
import { cleanData, genId } from "../../utils/cleanData.js";

const G = "#F5A623";
const BORDER = "rgba(255,255,255,.08)";
const DEFAULT_CATEGORIES = [
  "AI Assistant","AI Tools","Design Tools","Streaming","Security",
  "Education","Website Services","Seller Plans","Other",
];
const CURRENCIES = ["TZS", "USD", "CNY"];

const EMPTY_TOOL = {
  title: "", slug: "", category: "AI Assistant",
  shortDescription: "", fullDescription: "",
  thumbnailUrl: "", galleryImages: [],
  brandName: "TRINOVA AI", poweredBy: "TRINOVA AI",
  regularPrice: "", salePrice: "", regularPriceTZS: "", salePriceTZS: "",
  currencies: ["TZS", "USD", "CNY"],
  rating: "4.8", members: "", membersJoined: "",
  badgeLabel: "", status: "draft", featured: false,
  plans: [],
  paymentMethods: [],
  paymentInstructions: "Tuma TZS {amount} kupitia Lipa Namba 555999 (STEA). Kisha weka namba ya uthibitisho.",
  whatsappSupport: "255757053354",
};

const EMPTY_PLAN = {
  id: "", name: "", durationDays: 30,
  description: "",
  price: "", oldPrice: "",
  prices: { TZS: "", USD: "", CNY: "" },
  features: [],
  badge: "",
  isDefault: false,
  isPopular: false,
  enabled: true,
  isActive: true,
  sortOrder: 0,
};

const CHATGPT_PLUS_PRESET = {
  title: "ChatGPT Plus",
  slug: "chatgpt-plus",
  category: "AI Assistant",
  brandName: "TRINOVA AI",
  poweredBy: "TRINOVA AI",
  shortDescription: "Premium AI assistant access for faster answers, smarter productivity, study help, coding, writing, and business support.",
  fullDescription: "ChatGPT Plus helps students, creators, developers, and professionals work faster with advanced AI support. Use it for study assistance, coding help, writing, business planning, research, content creation, and daily productivity.",
  badgeLabel: "Popular",
  status: "published",
  featured: true,
  salePriceTZS: 10000,
  regularPriceTZS: 15000,
  paymentInstructions: "Tuma TZS {amount} kupitia Lipa Namba 555999 (STEA). Kisha weka namba ya uthibitisho.\nFor USD/CNY payments, choose PayPal, WeChat Pay, or Alipay and upload your payment proof.",
  whatsappSupport: "+255757053354",
  plans: [
    {
      id: "starter-access",
      name: "Starter Access",
      durationDays: 30,
      description: "Entry access for focused study and productivity.",
      features: ["Faster AI responses", "Study and homework assistance", "Writing and content support", "Powered by TRINOVA AI"],
      prices: { TZS: 10000, USD: 4, CNY: 29 },
      badge: "Limited Offer",
      isPopular: false,
      isDefault: false,
      enabled: true,
      isActive: true,
      sortOrder: 1,
    },
    {
      id: "pro-access",
      name: "Pro Access",
      durationDays: 30,
      description: "Balanced access for students, creators, and business support.",
      features: ["Advanced reasoning support", "Coding and debugging help", "Business and content creation support", "Powered by TRINOVA AI"],
      prices: { TZS: 20000, USD: 8, CNY: 58 },
      badge: "Popular",
      isPopular: true,
      isDefault: true,
      enabled: true,
      isActive: true,
      sortOrder: 2,
    },
    {
      id: "premium-access",
      name: "Premium Access",
      durationDays: 90,
      description: "Best value for longer productivity workflows.",
      features: ["Priority productivity workflow", "Suitable for students, creators, and professionals", "Longer access window", "Powered by TRINOVA AI"],
      prices: { TZS: 50000, USD: 20, CNY: 145 },
      badge: "Best Value",
      isPopular: false,
      isDefault: false,
      enabled: true,
      isActive: true,
      sortOrder: 3,
    },
  ],
};

/** Ensure a value is always a valid array (never null or undefined) */
const safeArr = (v) => (Array.isArray(v) ? v : []);

/** Normalise a tool from Firestore so every array field is safe */
function normaliseTool(tool) {
  return {
    ...EMPTY_TOOL,
    ...tool,
    plans: safeArr(tool?.plans).map((plan, index) => ({
      ...EMPTY_PLAN,
      ...plan,
      prices: {
        TZS: plan?.prices?.TZS ?? plan?.prices?.tzs ?? plan?.priceTZS ?? plan?.price ?? "",
        USD: plan?.prices?.USD ?? plan?.prices?.usd ?? plan?.priceUSD ?? "",
        CNY: plan?.prices?.CNY ?? plan?.prices?.cny ?? plan?.priceCNY ?? "",
      },
      features: safeArr(plan?.features),
      badge: plan?.badge ?? plan?.badgeLabel ?? "",
      isPopular: !!(plan?.isPopular || plan?.isDefault),
      isActive: plan?.isActive !== false && plan?.enabled !== false,
      enabled: plan?.enabled !== false && plan?.isActive !== false,
      sortOrder: Number(plan?.sortOrder ?? index),
    })),
    galleryImages: safeArr(tool?.galleryImages),
    regularPrice: tool?.regularPrice ?? tool?.regularPriceTZS ?? "",
    salePrice: tool?.salePrice ?? tool?.salePriceTZS ?? "",
    regularPriceTZS: tool?.regularPriceTZS ?? tool?.regularPrice ?? "",
    salePriceTZS: tool?.salePriceTZS ?? tool?.salePrice ?? "",
    brandName: tool?.brandName ?? "TRINOVA AI",
    poweredBy: tool?.poweredBy ?? "TRINOVA AI",
    currencies: safeArr(tool?.currencies).length ? safeArr(tool?.currencies) : ["TZS", "USD", "CNY"],
    paymentMethods: safeArr(tool?.paymentMethods),
    rating: tool?.rating ?? "4.8",
    members: tool?.members ?? tool?.membersJoined ?? "",
    membersJoined: tool?.membersJoined ?? "",
    badgeLabel: tool?.badgeLabel ?? "",
    thumbnailUrl: tool?.thumbnailUrl ?? "",
    shortDescription: tool?.shortDescription ?? "",
    fullDescription: tool?.fullDescription ?? "",
    paymentInstructions: tool?.paymentInstructions ?? EMPTY_TOOL.paymentInstructions,
    whatsappSupport: tool?.whatsappSupport ?? "255757053354",
  };
}

function slugify(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const iSt = {
  width: "100%", height: 42, borderRadius: 10,
  background: "rgba(255,255,255,.05)", border: `1px solid ${BORDER}`,
  color: "#fff", padding: "0 14px", outline: "none",
  fontFamily: "inherit", fontSize: 14, boxSizing: "border-box",
};
const lSt = {
  fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.45)",
  textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5, display: "block",
};
const cardSt = { background: "#0e1018", borderRadius: 14, border: `1px solid ${BORDER}`, padding: 16 };

// ── Toggle Switch ─────────────────────────────────────
function ToggleSwitch({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: value ? G : "rgba(255,255,255,.15)",
        position: "relative", cursor: "pointer", transition: ".2s", flexShrink: 0,
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        position: "absolute", top: 3, left: value ? 21 : 3,
        transition: ".2s", boxShadow: "0 1px 4px rgba(0,0,0,.3)",
      }} />
    </div>
  );
}

// ── Plan Editor ───────────────────────────────────────
function PlanEditor({ plans, onChange }) {
  // FIX: always work with a safe array regardless of what was passed
  const safePlans = safeArr(plans);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PLAN);

  const openNew = () => { setForm({ ...EMPTY_PLAN, id: genId("plan_") }); setEditing("new"); };
  const openEdit = (i) => { setForm({ ...EMPTY_PLAN, ...safePlans[i] }); setEditing(i); };
  const cancel = () => { setEditing(null); setForm(EMPTY_PLAN); };

  const save = () => {
    if (!form.name || !form.prices?.TZS) return;
    const normalized = {
      ...form,
      price: Number(form.prices.TZS) || 0,
      prices: {
        TZS: Number(form.prices.TZS) || 0,
        USD: Number(form.prices.USD) || 0,
        CNY: Number(form.prices.CNY) || 0,
      },
      features: safeArr(form.features),
      durationDays: Number(form.durationDays) || 30,
      enabled: form.isActive !== false && form.enabled !== false,
      isActive: form.isActive !== false && form.enabled !== false,
      isPopular: !!form.isPopular,
      isDefault: !!form.isDefault,
      sortOrder: Number(form.sortOrder) || safePlans.length + 1,
    };
    const updated = [...safePlans];
    if (editing === "new") updated.push(normalized);
    else updated[editing] = normalized;
    onChange(updated);
    cancel();
  };

  const fmtPrice = (v) => {
    const n = Number(v);
    return isNaN(n) ? "0" : n.toLocaleString();
  };

  return (
    <div>
      <label style={lSt}>Plans / Mipango</label>
      <div style={{ display: "grid", gap: 8, marginBottom: safePlans.length > 0 ? 10 : 0 }}>
        {safePlans.map((p, i) => (
          <div
            key={p.id || i}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px", borderRadius: 10,
              background: "rgba(255,255,255,.04)", border: `1px solid ${BORDER}`,
              opacity: p.enabled === false ? 0.5 : 1,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 800, fontSize: 13 }}>{p.name || "—"}</span>
              {p.isDefault && (
                <span style={{
                  marginLeft: 6, fontSize: 10,
                  background: `${G}20`, color: G, padding: "2px 6px",
                  borderRadius: 4, fontWeight: 800,
                }}>DEFAULT</span>
              )}
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)", marginTop: 2 }}>
                {p.durationDays || 0}d | TZS {fmtPrice(p.prices?.TZS ?? p.price)} | USD {fmtPrice(p.prices?.USD)} | CNY ¥{fmtPrice(p.prices?.CNY)}
                {p.oldPrice ? ` (was ${fmtPrice(p.oldPrice)})` : ""}
              </div>
            </div>
            <button
              onClick={() => onChange(safePlans.map((x, j) => ({ ...x, isDefault: j === i })))}
              title="Set default"
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, opacity: p.isDefault ? 1 : 0.35 }}
            >⭐</button>
            <button
              onClick={() => onChange(safePlans.map((x, j) => j === i ? { ...x, enabled: !x.enabled } : x))}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14 }}
            >{p.enabled === false ? "🔴" : "🟢"}</button>
            <button
              onClick={() => openEdit(i)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#60a5fa", fontWeight: 700, fontSize: 12 }}
            >Edit</button>
            <button
              onClick={() => onChange(safePlans.filter((_, j) => j !== i))}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontWeight: 700, fontSize: 12 }}
            >✕</button>
          </div>
        ))}
      </div>

      {editing !== null ? (
        <div style={{ background: "rgba(255,255,255,.03)", border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>
            {editing === "new" ? "➕ Add Plan" : "✏️ Edit Plan"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={lSt}>Plan Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. 1 Month" style={iSt} />
            </div>
            <div>
              <label style={lSt}>Duration (Days) *</label>
              <input type="number" value={form.durationDays} onChange={e => setForm(f => ({ ...f, durationDays: Number(e.target.value) }))} style={iSt} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={lSt}>Price (TZS) *</label>
              <input type="number" value={form.prices?.TZS || form.price || ""} onChange={e => setForm(f => ({ ...f, price: e.target.value, prices: { ...(f.prices || {}), TZS: e.target.value } }))} placeholder="10000" style={iSt} />
            </div>
            <div>
              <label style={lSt}>USD Price</label>
              <input type="number" value={form.prices?.USD || ""} onChange={e => setForm(f => ({ ...f, prices: { ...(f.prices || {}), USD: e.target.value } }))} placeholder="4" style={iSt} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={lSt}>CNY Price ¥</label>
              <input type="number" value={form.prices?.CNY || ""} onChange={e => setForm(f => ({ ...f, prices: { ...(f.prices || {}), CNY: e.target.value } }))} placeholder="29" style={iSt} />
            </div>
            <div>
              <label style={lSt}>Badge Label</label>
              <input value={form.badge || ""} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} placeholder="Popular / Best Value" style={iSt} />
            </div>
          </div>
          <div>
            <label style={lSt}>Plan Features (one per line)</label>
            <textarea
              value={safeArr(form.features).join("\n")}
              onChange={e => setForm(f => ({ ...f, features: e.target.value.split("\n").map(x => x.trim()).filter(Boolean) }))}
              placeholder={"Faster AI responses\nCoding and debugging help\nPowered by TRINOVA AI"}
              style={{ ...iSt, height: 90, resize: "vertical", paddingTop: 10 }}
            />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.7)" }}>
            <input type="checkbox" checked={!!form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} />
            Set as default plan
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.7)" }}>
            <input type="checkbox" checked={!!form.isPopular} onChange={e => setForm(f => ({ ...f, isPopular: e.target.checked, isDefault: e.target.checked ? true : f.isDefault }))} />
            Mark as popular
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.7)" }}>
            <input type="checkbox" checked={form.isActive !== false && form.enabled !== false} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked, enabled: e.target.checked }))} />
            Active plan
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={save}
              disabled={!form.name || !form.prices?.TZS}
              style={{
                flex: 1, height: 38, borderRadius: 10, border: "none",
                background: G, color: "#000", fontWeight: 800, cursor: "pointer",
                opacity: (!form.name || !form.prices?.TZS) ? 0.5 : 1,
              }}
            >{editing === "new" ? "Add Plan" : "Save Plan"}</button>
            <button onClick={cancel} style={{ height: 38, padding: "0 16px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", color: "rgba(255,255,255,.6)", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button
          onClick={openNew}
          style={{
            height: 38, padding: "0 16px", borderRadius: 10,
            border: `1px dashed ${BORDER}`, background: "transparent",
            color: "rgba(255,255,255,.5)", fontWeight: 700, cursor: "pointer",
            width: "100%", fontSize: 13,
          }}
        >+ Add Plan</button>
      )}
    </div>
  );
}

// ── Gallery Field ─────────────────────────────────────
function GalleryField({ value, onChange }) {
  // FIX: always safe array regardless of null/undefined input
  const safeValue = safeArr(value);
  return (
    <div>
      <label style={lSt}>Gallery Images (URL or Upload)</label>
      <div style={{ display: "grid", gap: 8, marginBottom: safeValue.length > 0 ? 8 : 0 }}>
        {safeValue.map((url, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <img
              src={url} alt=""
              style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: `1px solid ${BORDER}` }}
              onError={e => { e.target.style.opacity = ".3"; }}
            />
            <span style={{ flex: 1, fontSize: 11, color: "rgba(255,255,255,.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</span>
            <button
              onClick={() => onChange(safeValue.filter((_, j) => j !== i))}
              style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16 }}
            >✕</button>
          </div>
        ))}
      </div>
      <StorageMediaField
        label=""
        value=""
        onChange={url => { if (url) onChange([...safeValue, url]); }}
      />
    </div>
  );
}

// ── Tool Row ──────────────────────────────────────────
function ToolRow({ tool, onEdit, onDelete, onToggle, onToggleFeatured }) {
  const sc = tool.status === "published" ? "#22c55e" : tool.status === "draft" ? "#fbbf24" : "#6b7280";
  const plans = safeArr(tool.plans);
  return (
    <div style={{ ...cardSt, display: "flex", gap: 14, alignItems: "flex-start" }}>
      {tool.thumbnailUrl ? (
        <img src={tool.thumbnailUrl} alt="" style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: `1px solid ${BORDER}` }} />
      ) : (
        <div style={{ width: 64, height: 64, borderRadius: 10, background: `${G}20`, display: "grid", placeItems: "center", fontSize: 24, flexShrink: 0 }}>🛠️</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          <span style={{ fontWeight: 900, fontSize: 15 }}>{tool.title || "Untitled"}</span>
          {tool.featured && <span style={{ fontSize: 9, background: `${G}20`, color: G, padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}>FEATURED</span>}
          <span style={{ fontSize: 10, background: `${sc}18`, color: sc, padding: "2px 8px", borderRadius: 4, fontWeight: 800, textTransform: "uppercase" }}>
            {tool.status || "draft"}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)", marginBottom: 4 }}>
          {tool.category || "—"} · {plans.length} plan{plans.length !== 1 ? "s" : ""}
        </div>
        <div style={{ fontSize: 13, color: G, fontWeight: 800 }}>
          {tool.salePriceTZS || tool.salePrice
            ? `TZS ${Number(tool.salePriceTZS || tool.salePrice).toLocaleString()}`
            : tool.regularPriceTZS || tool.regularPrice
              ? `TZS ${Number(tool.regularPriceTZS || tool.regularPrice).toLocaleString()}`
              : "—"}
        </div>
        {tool.shortDescription && (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 400 }}>
            {tool.shortDescription}
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        <button onClick={() => onEdit(tool)} style={{ background: "#3b82f618", border: "1px solid #3b82f630", color: "#60a5fa", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>Edit</button>
        <button onClick={() => onToggle(tool)} style={{ background: tool.status === "published" ? "rgba(239,68,68,.1)" : "rgba(34,197,94,.1)", border: `1px solid ${tool.status === "published" ? "rgba(239,68,68,.2)" : "rgba(34,197,94,.2)"}`, color: tool.status === "published" ? "#ef4444" : "#22c55e", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
          {tool.status === "published" ? "Unpublish" : "Publish"}
        </button>
        <button onClick={() => onToggleFeatured(tool)} style={{ background: `${G}10`, border: `1px solid ${G}20`, color: G, borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
          {tool.featured ? "Unfeature" : "⭐ Feature"}
        </button>
        <button onClick={() => onDelete(tool)} style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.15)", color: "#ef4444", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Archive</button>
      </div>
    </div>
  );
}

// ── Main Manager ──────────────────────────────────────
export default function DigitalToolsManager({ user }) {
  const [activeTab, setActiveTab] = useState("tools");
  const [tools, setTools] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(normaliseTool(EMPTY_TOOL));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const db = getFirebaseDb();
  const toast_ = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Load digital_tools
  useEffect(() => {
    if (!db) { setLoading(false); return; }
    setFetchError(null);
    let primary = [];
    let compat = [];
    const publishTools = () => {
      const byKey = new Map();
      [...primary, ...compat].forEach(tool => {
        const key = tool.slug || tool.id;
        if (!byKey.has(key)) byKey.set(key, tool);
      });
      const arr = Array.from(byKey.values());
      arr.sort((a, b) =>
        (b.updatedAt?.seconds || b.createdAt?.seconds || 0) -
        (a.updatedAt?.seconds || a.createdAt?.seconds || 0)
      );
      setTools(arr);
      setLoading(false);
    };
    const unsubPrimary = onSnapshot(
      query(collection(db, "digital_tools"), limit(500)),
      snap => {
        primary = snap.docs.map(d => ({ id: d.id, _collection: "digital_tools", ...d.data() }));
        publishTools();
      },
      err => {
        console.error("digital_tools read error:", err);
        setFetchError(err.code === "permission-denied"
          ? "Permission denied — check Firestore rules for digital_tools collection."
          : err.message);
        setLoading(false);
      }
    );
    const unsubCompat = onSnapshot(
      query(collection(db, "digitalTools"), limit(500)),
      snap => {
        compat = snap.docs.map(d => ({ id: d.id, _collection: "digitalTools", ...d.data() }));
        publishTools();
      },
      err => { console.warn("digitalTools read error:", err.message); }
    );
    return () => { unsubPrimary(); unsubCompat(); };
  }, [db]);

  // Load categories — with error handler to prevent unhandled rejection
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(
      collection(db, "subscription_categories"),
      snap => { setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() }))); },
      err => { console.warn("subscription_categories read error:", err.message); }
    );
    return () => unsub();
  }, [db]);

  useEffect(() => {
    if (!db) return undefined;
    return onSnapshot(
      query(collection(db, "paymentMethods"), limit(500)),
      snap => {
        const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        arr.sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
        setPaymentMethods(arr);
      },
      err => { console.warn("paymentMethods read error:", err.message); }
    );
  }, [db]);

  const allCats = categories.length > 0
    ? categories.map(c => c.name).filter(Boolean)
    : DEFAULT_CATEGORIES;

  const set = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), []);

  const openEdit = (tool) => {
    // FIX: normalise before setting — converts null arrays to []
    setForm(normaliseTool(tool));
    setEditing(tool.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openNew = () => {
    setForm(normaliseTool(EMPTY_TOOL));
    setEditing(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!form.title?.trim()) { toast_("Title required", "error"); return; }
    setSaving(true);
    try {
      const slug = form.slug || slugify(form.title);
      const data = cleanData({
        title: form.title.trim(),
        slug,
        category: form.category || "Other",
        shortDescription: form.shortDescription || "",
        fullDescription: form.fullDescription || "",
        thumbnailUrl: form.thumbnailUrl || "",
        galleryImages: safeArr(form.galleryImages),
        brandName: form.brandName || "TRINOVA AI",
        poweredBy: form.poweredBy || "TRINOVA AI",
        regularPrice: form.regularPrice !== "" ? Number(form.regularPrice) : null,
        salePrice: form.salePrice !== "" ? Number(form.salePrice) : null,
        regularPriceTZS: form.regularPriceTZS !== "" ? Number(form.regularPriceTZS) : (form.regularPrice !== "" ? Number(form.regularPrice) : null),
        salePriceTZS: form.salePriceTZS !== "" ? Number(form.salePriceTZS) : (form.salePrice !== "" ? Number(form.salePrice) : null),
        currencies: safeArr(form.currencies).length ? safeArr(form.currencies) : ["TZS", "USD", "CNY"],
        rating: form.rating || "4.8",
        members: form.members || form.membersJoined || "",
        membersJoined: form.membersJoined || "",
        badgeLabel: form.badgeLabel || "",
        status: form.status || "draft",
        published: form.status === "published",
        featured: !!form.featured,
        plans: safeArr(form.plans).map(p => cleanData({
          id: p.id || genId("plan_"),
          name: p.name || "",
          description: p.description || "",
          durationDays: Number(p.durationDays) || 30,
          features: safeArr(p.features),
          prices: {
            TZS: Number(p.prices?.TZS ?? p.price ?? 0) || 0,
            USD: Number(p.prices?.USD ?? 0) || 0,
            CNY: Number(p.prices?.CNY ?? 0) || 0,
          },
          price: Number(p.prices?.TZS ?? p.price ?? 0) || 0,
          oldPrice: p.oldPrice !== "" ? Number(p.oldPrice) : null,
          badge: p.badge || p.badgeLabel || "",
          badgeLabel: p.badge || p.badgeLabel || "",
          isPopular: !!p.isPopular,
          isDefault: !!p.isDefault,
          enabled: p.enabled !== false && p.isActive !== false,
          isActive: p.enabled !== false && p.isActive !== false,
          sortOrder: Number(p.sortOrder) || 0,
        })),
        paymentMethods: safeArr(form.paymentMethods),
        paymentInstructions: form.paymentInstructions || EMPTY_TOOL.paymentInstructions,
        whatsappSupport: form.whatsappSupport || "255757053354",
        updatedAt: serverTimestamp(),
        sector: "digital_tools",
      });

      if (editing) {
        await setDoc(doc(db, "digital_tools", editing), data, { merge: true });
        await setDoc(doc(db, "digitalTools", editing), data, { merge: true });
        toast_("✅ Imesahihishwa!");
      } else {
        const newRef = doc(collection(db, "digital_tools"));
        await setDoc(newRef, {
          ...data,
          createdAt: serverTimestamp(),
          ownerId: user?.uid || "admin",
        }, { merge: true });
        await setDoc(doc(db, "digitalTools", newRef.id), {
          ...data,
          createdAt: serverTimestamp(),
          ownerId: user?.uid || "admin",
        }, { merge: true });
        toast_("✅ Tool imewekwa!");
      }
      setShowForm(false);
      setEditing(null);
      setForm(normaliseTool(EMPTY_TOOL));
    } catch (e) {
      console.error(e);
      toast_("❌ " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (tool) => {
    const s = tool.status === "published" ? "draft" : "published";
    try {
      await setDoc(doc(db, "digital_tools", tool.id), { status: s, published: s === "published", updatedAt: serverTimestamp() }, { merge: true });
      await setDoc(doc(db, "digitalTools", tool.id), { status: s, published: s === "published", updatedAt: serverTimestamp() }, { merge: true });
      toast_(s === "published" ? "Published!" : "Unpublished");
    } catch (e) { toast_(e.message, "error"); }
  };

  const handleToggleFeatured = async (tool) => {
    try {
      await setDoc(doc(db, "digital_tools", tool.id), { featured: !tool.featured, updatedAt: serverTimestamp() }, { merge: true });
      await setDoc(doc(db, "digitalTools", tool.id), { featured: !tool.featured, updatedAt: serverTimestamp() }, { merge: true });
      toast_(tool.featured ? "Removed from featured" : "⭐ Featured!");
    } catch (e) { toast_(e.message, "error"); }
  };

  const handleDelete = async (tool) => {
    if (!window.confirm(`Permanently DELETE "${tool.title}"? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, "digital_tools", tool.id));
      await deleteDoc(doc(db, "digitalTools", tool.id));
      toast_("Permanently deleted.");
    } catch (e) { toast_(e.message, "error"); }
  };

  const displayed = tools.filter(t => {
    if (t.status === "archived") return false;
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (t.title || "").toLowerCase().includes(q) ||
        (t.category || "").toLowerCase().includes(q) ||
        (t.shortDescription || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ color: "#fff", fontFamily: "'Instrument Sans',system-ui,sans-serif" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 18, borderBottom: `1px solid ${BORDER}` }}>
        {[
          { id: "tools", label: "Tools" },
          { id: "payments", label: "Payment Settings" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              height: 38,
              padding: "0 14px",
              borderRadius: 10,
              border: `1px solid ${activeTab === tab.id ? G : BORDER}`,
              background: activeTab === tab.id ? G : "transparent",
              color: activeTab === tab.id ? "#111" : "rgba(255,255,255,.68)",
              fontWeight: 900,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "payments" ? (
        <div style={{ color: "rgba(255,255,255,.5)", background: "rgba(255,255,255,.05)", padding: 20, borderRadius: 14 }}>
           Global payment methods are now managed inside the new <strong>STEA Subscription Management</strong> dashboard.
        </div>
      ) : (
        <>

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Total", value: tools.filter(t => t.status !== "archived").length, color: "#a3e635" },
          { label: "Published", value: tools.filter(t => t.status === "published").length, color: "#22c55e" },
          { label: "Draft", value: tools.filter(t => t.status === "draft").length, color: "#fbbf24" },
          { label: "Featured", value: tools.filter(t => t.featured).length, color: G },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,.04)", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Permission / fetch error notice */}
      {fetchError && (
        <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 12, padding: "14px 18px", marginBottom: 16, fontSize: 13, color: "#fca5a5" }}>
          ⚠️ {fetchError}
          <div style={{ marginTop: 6, fontSize: 11, color: "rgba(255,255,255,.4)" }}>
            Make sure your Firestore rules allow admins to read the <code>digital_tools</code> collection. You can still add tools — they will appear once rules are updated.
          </div>
        </div>
      )}

      {showForm ? (
        /* ──────── FORM ──────── */
        <div style={{ maxWidth: 700 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <button
              onClick={() => { setShowForm(false); setEditing(null); }}
              style={{ background: "rgba(255,255,255,.07)", border: "none", color: "#fff", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontWeight: 700 }}
            >← Back</button>
            <h3 style={{ margin: 0, fontWeight: 900, fontSize: 18 }}>{editing ? "Edit Tool" : "New Digital Tool"}</h3>
            <button
              onClick={() => setForm(normaliseTool({ ...EMPTY_TOOL, ...CHATGPT_PLUS_PRESET }))}
              style={{ marginLeft: "auto", background: `${G}18`, border: `1px solid ${G}30`, color: G, borderRadius: 10, padding: "8px 12px", cursor: "pointer", fontWeight: 900, fontSize: 12 }}
            >Load ChatGPT Plus Default</button>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {/* Basic Info */}
            <div style={cardSt}>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 14, color: G }}>📋 Basic Info</div>
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <label style={lSt}>Title *</label>
                  <input
                    value={form.title}
                    onChange={e => { set("title", e.target.value); if (!editing) set("slug", slugify(e.target.value)); }}
                    placeholder="e.g. Canva Pro, ChatGPT Plus"
                    style={iSt}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={lSt}>Slug (auto)</label>
                    <input value={form.slug} onChange={e => set("slug", e.target.value)} style={iSt} />
                  </div>
                  <div>
                    <label style={lSt}>Category</label>
                    <select value={form.category} onChange={e => set("category", e.target.value)} style={{ ...iSt, cursor: "pointer" }}>
                      {allCats.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={lSt}>Brand Name</label>
                    <input value={form.brandName} onChange={e => set("brandName", e.target.value)} placeholder="TRINOVA AI" style={iSt} />
                  </div>
                  <div>
                    <label style={lSt}>Powered By Label</label>
                    <input value={form.poweredBy} onChange={e => set("poweredBy", e.target.value)} placeholder="TRINOVA AI" style={iSt} />
                  </div>
                </div>
                <div>
                  <label style={lSt}>Short Description</label>
                  <input value={form.shortDescription} onChange={e => set("shortDescription", e.target.value)} placeholder="One-liner" style={iSt} />
                </div>
                <div>
                  <label style={lSt}>Full Description</label>
                  <textarea
                    value={form.fullDescription}
                    onChange={e => set("fullDescription", e.target.value)}
                    placeholder="Detailed description... Use - for bullet features"
                    style={{ ...iSt, height: 100, resize: "vertical", paddingTop: 10 }}
                  />
                </div>
              </div>
            </div>

            {/* Media */}
            <div style={cardSt}>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 14, color: G }}>🖼️ Media</div>
              <div style={{ display: "grid", gap: 12 }}>
                <StorageMediaField label="Thumbnail / Cover Image" value={form.thumbnailUrl} onChange={url => set("thumbnailUrl", url)} />
                <GalleryField value={form.galleryImages} onChange={v => set("galleryImages", v)} />
              </div>
            </div>

            {/* Fallback Pricing */}
            <div style={cardSt}>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 14, color: G }}>💰 Fallback Pricing</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={lSt}>Regular Price (TZS)</label>
                  <input type="number" value={form.regularPriceTZS || form.regularPrice} onChange={e => { set("regularPrice", e.target.value); set("regularPriceTZS", e.target.value); }} placeholder="15000" style={iSt} />
                </div>
                <div>
                  <label style={lSt}>Sale Price (TZS)</label>
                  <input type="number" value={form.salePriceTZS || form.salePrice} onChange={e => { set("salePrice", e.target.value); set("salePriceTZS", e.target.value); }} placeholder="10000" style={iSt} />
                </div>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginTop: 6 }}>Used as fallback when no plans are defined.</div>
            </div>

            {/* Plans */}
            <div style={cardSt}>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 14, color: G }}>📅 Subscription Plans</div>
              <PlanEditor plans={form.plans} onChange={v => set("plans", v)} />
            </div>

            {/* Meta */}
            <div style={cardSt}>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 14, color: G }}>⚙️ Meta</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div><label style={lSt}>Rating</label><input value={form.rating} onChange={e => set("rating", e.target.value)} placeholder="4.8" style={iSt} /></div>
                <div><label style={lSt}>Members</label><input value={form.members || form.membersJoined} onChange={e => { set("members", e.target.value); set("membersJoined", e.target.value); }} placeholder="1,240+" style={iSt} /></div>
                <div><label style={lSt}>Badge Label</label><input value={form.badgeLabel} onChange={e => set("badgeLabel", e.target.value)} placeholder="🔥 Popular" style={iSt} /></div>
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                  <ToggleSwitch value={form.status === "published"} onChange={v => set("status", v ? "published" : "draft")} />
                  Published
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                  <ToggleSwitch value={!!form.featured} onChange={v => set("featured", v)} />
                  Featured
                </label>
              </div>
            </div>

            {/* Payment */}
            <div style={cardSt}>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 14, color: G }}>💳 Payment Instructions</div>
              <div style={{ display: "grid", gap: 10 }}>
                <div>
                  <label style={lSt}>Instructions (use {"{amount}"} placeholder)</label>
                  <textarea value={form.paymentInstructions} onChange={e => set("paymentInstructions", e.target.value)} style={{ ...iSt, height: 80, resize: "vertical", paddingTop: 10 }} />
                </div>
                <div>
                  <label style={lSt}>WhatsApp Support Number</label>
                  <input value={form.whatsappSupport} onChange={e => set("whatsappSupport", e.target.value)} placeholder="255757053354" style={iSt} />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleSave}
                disabled={saving || !form.title}
                style={{
                  flex: 1, height: 48, borderRadius: 12, border: "none",
                  background: G, color: "#000", fontWeight: 900, fontSize: 14,
                  cursor: (saving || !form.title) ? "not-allowed" : "pointer",
                  opacity: (saving || !form.title) ? 0.6 : 1,
                }}
              >{saving ? "Inahifadhi..." : editing ? "Hifadhi Mabadiliko" : "Ongeza Tool"}</button>
              <button
                onClick={() => { setShowForm(false); setEditing(null); }}
                style={{ height: 48, padding: "0 20px", borderRadius: 12, border: `1px solid ${BORDER}`, background: "transparent", color: "rgba(255,255,255,.6)", fontWeight: 700, cursor: "pointer" }}
              >Acha</button>
            </div>
          </div>
        </div>
      ) : (
        /* ──────── LIST ──────── */
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tools..."
              style={{ ...iSt, flex: 1, minWidth: 180, maxWidth: 300 }}
            />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...iSt, width: 130, cursor: "pointer" }}>
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <button
              onClick={openNew}
              style={{ height: 42, padding: "0 20px", borderRadius: 10, border: "none", background: G, color: "#000", fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
            >+ New Tool</button>
          </div>

          {loading ? (
            <div style={{ display: "grid", gap: 10 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ ...cardSt, height: 88, background: "rgba(255,255,255,.03)", animation: "pulse 1.5s infinite" }} />
              ))}
              <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.7}}`}</style>
            </div>
          ) : displayed.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px", background: "rgba(255,255,255,.02)", borderRadius: 16, border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛠️</div>
              <p style={{ color: "rgba(255,255,255,.4)", margin: "0 0 16px" }}>
                {search ? "Hakuna tools zinazolingana na utafutaji." : "Hakuna digital tools bado. Anza na kuongeza tool ya kwanza."}
              </p>
              {!search && (
                <button onClick={openNew} style={{ padding: "10px 22px", borderRadius: 12, border: "none", background: G, color: "#000", fontWeight: 800, cursor: "pointer" }}>
                  + Add First Tool
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {displayed.map(t => (
                <ToolRow
                  key={t.id}
                  tool={t}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                  onToggleFeatured={handleToggleFeatured}
                />
              ))}
            </div>
          )}
        </>
      )}
        </>
      )}
    </div>
  );
}
