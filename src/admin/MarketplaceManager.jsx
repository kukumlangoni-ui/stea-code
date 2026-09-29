import React, { useState, useEffect } from "react";
import { TanzaniaMarketplaceImageEditorTrigger } from "./TanzaniaMarketplaceImageEditorModal.jsx";
import { normalizeTzProductImageDisplay } from "../utils/tanzaniaProductImageDisplay.js";
import {
  getFirebaseDb, collection, doc, addDoc, updateDoc, deleteDoc, getDoc,
  onSnapshot, query, serverTimestamp, where, orderBy, limit
} from "../firebase.js";
import { MARKET_CATEGORIES } from "../constants/marketplace.js";
import { StorageMediaField } from "./AdminUI.jsx";
import VariantEditor from "./VariantEditor.jsx";
import { ShopProductCard } from "../components/ShopProductCard.jsx";
import { useMarketplaceExtra } from "../hooks/useMarketplaceExtra.js";
import { orderService } from "../services/orderService.js";
import { FileDown } from "lucide-react";

const G = "#F5A623";
const STEA_WA = "255757053354";

// ── Sub-condition options ─────────────────────────────
const CONDITIONS = ["New", "Used", "Refurbished"];

// ── Shared input styles ───────────────────────────────
const inputStyle = {
  height: 44, borderRadius: 10, border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.04)", color: "#fff", padding: "0 14px",
  outline: "none", fontFamily: "inherit", fontSize: 14, width: "100%", boxSizing: "border-box",
};
const labelStyle = {
  fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.45)",
  textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5, display: "block",
};
const cardStyle = {
  background: "#0e1018", borderRadius: 14, border: "1px solid rgba(255,255,255,.06)",
  padding: 16,
};

// ── Image URL list input ──────────────────────────────
function ImagesField({ value = [], onChange }) {
  const images = Array.isArray(value) ? value : [];

  const handleUpdate = (idx, url) => {
    const newImages = [...images];
    newImages[idx] = url;
    onChange(newImages.filter(Boolean));
  };

  const handleAdd = (url) => {
    if (url) onChange([...images, url]);
  };

  const handleRemove = (idx) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div style={{ background: "rgba(255,255,255,.02)", padding: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,.05)" }}>
      <label style={labelStyle}>Product Images (Upload)</label>
      <div style={{ display: "grid", gap: 8, marginBottom: images.length > 0 ? 12 : 0 }}>
        {images.map((imgUrl, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <StorageMediaField 
                value={imgUrl} 
                onChange={(url) => handleUpdate(i, url)} 
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemove(i)}
              style={{ background: "rgba(239,68,68,.1)", border: "none", color: "#ef4444", borderRadius: 8, width: 44, height: 44, cursor: "pointer", flexShrink: 0 }}
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
      
      {images.length < 10 && (
        <div style={{ marginTop: 8 }}>
          <StorageMediaField 
            label={images.length > 0 ? "Add Another Image" : "Upload Image"}
            value="" 
            onChange={(url) => handleAdd(url)} 
          />
        </div>
      )}
      <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 6 }}>
        First image will be used as the thumbnail. Drag and drop supported. Max 10 images.
      </div>
    </div>
  );
}

// ── Product Form ──────────────────────────────────────
function ProductForm({ initial, onSave, onCancel, saving }) {
  const { extraSubcategories } = useMarketplaceExtra();
  const [form, setForm] = useState({
    name: "", category: "", subcategory: "", subItem: "", brand: "",
    condition: "New", price: "", discountPrice: "", location: "",
    description: "", whatsappNumber: STEA_WA, sellerType: "stea",
    sellerName: "STEA Official", isFeatured: false, isActive: true, hasSafariOption: false, images: [],
    imageFit: "cover", imagePositionX: 50, imagePositionY: 50, imageZoom: 1,
    ...(initial || {}),
  });

  useEffect(() => {
    if (initial) {
      const t = setTimeout(() => {
        setForm({
          name: "", category: "", subcategory: "", subItem: "", brand: "",
          condition: "New", price: "", discountPrice: "", location: "",
          description: "", whatsappNumber: STEA_WA, sellerType: "stea",
          sellerName: "STEA Official", isFeatured: false, isActive: true, images: [],
          imageFit: "cover", imagePositionX: 50, imagePositionY: 50, imageZoom: 1,
          ...initial 
        });
      }, 0);
      return () => clearTimeout(t);
    }
  }, [initial]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const cat = MARKET_CATEGORIES[form.category];
  
  // Logic for dynamic fields
  const hasSubcategories = cat?.subcategories?.length > 0;
  const hasDeviceTypes = cat?.deviceTypes?.length > 0;
  const hasFilters = cat?.filters?.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.price) return;
    onSave({
      ...form,
      price: Number(form.price) || 0,
      discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
      ...normalizeTzProductImageDisplay(form),
    });
  };

  const field = (label, key, type = "text", placeholder = "") => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type} value={form[key] || ""} placeholder={placeholder}
        onChange={e => set(key, e.target.value)}
        style={inputStyle}
        onFocus={e => e.target.style.borderColor = G}
        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
      {/* Row 1: Name */}
      {field("Jina la Bidhaa *", "name", "text", "Mfano: Samsung Galaxy A54")}

      {/* Row 2: Category + Dynamic Fields */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <div>
          <label style={labelStyle}>Kategoria *</label>
          <select value={form.category} onChange={e => {
              set("category", e.target.value);
              set("subcategory", "");
              set("deviceType", "");
              set("filter", "");
           }}
            style={{ ...inputStyle, cursor: "pointer" }}>
            <option value="">Chagua Kategoria...</option>
            {Object.values(MARKET_CATEGORIES).map(c => (
              <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
            ))}
          </select>
        </div>
        
        {hasSubcategories && (
          <div>
            <label style={labelStyle}>Subcategory</label>
            <select value={form.subcategory || ""} onChange={e => set("subcategory", e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">Chagua...</option>
              {cat.subcategories.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
        {hasDeviceTypes && (
          <div>
            <label style={labelStyle}>Device Type</label>
            <select value={form.deviceType || ""} onChange={e => set("deviceType", e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">Chagua...</option>
              {cat.deviceTypes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>
      
      {hasFilters && (
         <div>
            <label style={labelStyle}>Condition</label>
            <select value={form.filter || ""} onChange={e => set("filter", e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">Chagua...</option>
              {cat.filters.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
         </div>
      )}

      {/* Row 3: Location */}
      {field("Eneo (Location)", "location", "text", "Mfano: Dar es Salaam")}

      {/* Row 4: Price + Discount */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        {field("Bei (Tsh) *", "price", "number", "Mfano: 250000")}
        {field("Bei ya Punguzo (Tsh)", "discountPrice", "number", "Optional")}
      </div>

      {/* Description */}
      <div>
        <label style={labelStyle}>Maelezo</label>
        <textarea value={form.description || ""} onChange={e => set("description", e.target.value)}
          placeholder="Elezea bidhaa yako kwa undani..."
          style={{ ...inputStyle, height: 80, resize: "vertical", padding: "10px 14px" }}
          onFocus={e => e.target.style.borderColor = G}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"} />
      </div>

      {/* Images */}
      <ImagesField value={form.images} onChange={v => set("images", v)} />

      <div style={{ ...cardStyle }}>
        <label style={labelStyle}>Mwonekano wa picha (ukurasa wa bidhaa)</label>
        <div style={{ marginTop: 10 }}>
          <TanzaniaMarketplaceImageEditorTrigger
            imageUrl={form.images?.[0] || ""}
            value={form}
            disabled={!form.images?.length}
            onApply={(d) => setForm((f) => ({ ...f, ...d }))}
          />
        </div>
      </div>

      {/* Seller section */}
      <div style={{ background: "rgba(255,255,255,.02)", borderRadius: 10, padding: 14, border: "1px solid rgba(255,255,255,.05)", display: "grid", gap: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: ".07em" }}>Seller Info</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          <div>
            <label style={labelStyle}>Aina ya Seller</label>
            <select value={form.sellerType} onChange={e => {
              set("sellerType", e.target.value);
              if (e.target.value === "stea") { set("sellerName", "STEA Official"); set("whatsappNumber", STEA_WA); }
              else { set("sellerName", ""); }
            }}
              style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="stea">STEA Official</option>
              <option value="seller">Seller wa Nje</option>
            </select>
          </div>
          {field("Jina la Seller", "sellerName", "text", "Jina la mtu au duka")}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          {field("WhatsApp Number", "whatsappNumber", "tel", "255700000000")}
          {field("Social Media Link", "socialLink", "text", "Link ya IG/FB/TikTok (Optional)")}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          {field("Working Hours", "workingHours", "text", "Mfano: 7AM - 10PM (Optional)")}
        </div>
        <div style={{ background: "rgba(255,255,255,.02)", padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,.04)", display: "grid", gap: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.45)", textTransform: "uppercase" }}>Payment Info (Seller)</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            {field("M-Pesa", "payment_mpesa", "text", "07...")}
            {field("Tigo Pesa", "payment_tigo", "text", "06...")}
            {field("Airtel Money", "payment_airtel", "text", "07...")}
            {field("Lipa Namba", "payment_lipa", "text", "No / Name")}
          </div>
          {field("Bank Details", "payment_bank", "text", "Bank, Account, Name")}
        </div>
      </div>

      {/* Flags */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", paddingBottom: 10 }}>
        {[
          { k: "isActive", label: "✅ Bidhaa Inaonekana" },
          { k: "isFeatured", label: "⭐ Featured" },
          { k: "hasSafariOption", label: "🌍 Safari Option" },
        ].map(({ k, label }) => (
          <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,.75)" }}>
            <div onClick={() => set(k, !form[k])}
              style={{ width: 40, height: 22, borderRadius: 11, background: form[k] ? G : "rgba(255,255,255,.1)", position: "relative", transition: ".2s", cursor: "pointer", border: `1px solid ${form[k] ? G : "rgba(255,255,255,.1)"}` }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: form[k] ? 20 : 2, transition: ".2s", boxShadow: "0 1px 4px rgba(0,0,0,.3)" }} />
            </div>
            {label}
          </label>
        ))}
      </div>

      {/* Variants (full system - replaces legacy colors) */}
      <div style={{ padding: "16px", background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 14 }}>
        <VariantEditor
          variants={Array.isArray(form.variants) ? form.variants : []}
          onChange={v => set("variants", v)}
        />
      </div>

      {/* Preview Section */}
      <div style={{ background: "rgba(255,255,255,.02)", borderRadius: 10, padding: 14, border: "1px solid rgba(255,255,255,.05)", display: "grid", gap: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: ".07em" }}>Product Preview</div>
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0" }}>
          <ShopProductCard product={form} onClick={() => {}} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button type="submit" disabled={saving || !form.name || !form.category || !form.price}
          style={{ flex: 1, height: 46, borderRadius: 12, border: "none", background: G, color: "#111", fontWeight: 900, cursor: "pointer", fontSize: 14, opacity: (saving || !form.name || !form.category || !form.price) ? .5 : 1 }}>
          {saving ? "Inahifadhi..." : initial?.id ? "Hifadhi Mabadiliko" : "Ongeza Bidhaa"}
        </button>
        <button type="button" onClick={onCancel}
          style={{ height: 46, padding: "0 20px", borderRadius: 12, border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "rgba(255,255,255,.6)", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
          Acha
        </button>
      </div>
    </form>
  );
}

// ── Product Row ──────────────────────────────────────
function ProductRow({ product, onEdit, onDelete, onToggle, onStatusChange }) {
  const cat = MARKET_CATEGORIES[product.category];
  const imgs = Array.isArray(product.images) ? product.images : [product.images].filter(Boolean);

  const statusColors = {
    draft: { bg: "rgba(255,255,255,.05)", text: "rgba(255,255,255,.4)" },
    pending_review: { bg: "rgba(251,191,36,.15)", text: "#fbbf24" },
    approved: { bg: "rgba(34,197,94,.15)", text: "#22c55e" },
    published: { bg: "rgba(59,130,246,.15)", text: "#3b82f6" },
    rejected: { bg: "rgba(239,68,68,.15)", text: "#ef4444" },
  };
  const s = statusColors[product.status] || statusColors.draft;

  return (
    <div className="product-row-card" style={{ ...cardStyle }}>
      <style>{`
        .product-row-card { display: flex; gap: 12px; align-items: center; transition: all 0.2s ease; }
        .product-row-card:hover { border-color: rgba(255,255,255,0.12) !important; background: rgba(255,255,255,0.02) !important; }
        @media (max-width: 640px) {
          .product-row-card { flex-direction: column; align-items: flex-start !important; gap: 14px; padding: 20px !important; }
          .product-actions { width: 100%; display: flex; gap: 8px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px; margin-top: 4px; }
          .product-actions button { font-size: 10px !important; padding: 10px 8px !important; }
        }
      `}</style>
      <div style={{ display: "flex", gap: 12, width: "100%", alignItems: "center" }}>
        {/* Thumbnail */}
        <div style={{ width: 56, height: 56, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "#0a0c14", border: "1px solid rgba(255,255,255,0.08)" }}>
          {imgs[0] ? (
            <img src={imgs[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" onError={e => { e.target.style.display = "none"; }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontSize: 24 }}>{cat?.emoji || "📦"}</div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 800, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{product.name}</span>
            <span style={{ fontSize: 9, background: s.bg, color: s.text, padding: "2px 8px", borderRadius: 6, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {product.status?.replace("_", " ") || "DRAFT"}
            </span>
            {product.isFeatured && <span style={{ fontSize: 9, background: `${G}20`, color: G, padding: "2px 8px", borderRadius: 6, fontWeight: 900 }}>FEATURED</span>}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)", marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
            <span>{cat?.emoji} {cat?.label}</span>
            {product.subcategory && <span>· {product.subcategory}</span>}
            {product.ownerName && <span style={{ color: G, fontWeight: 700 }}>· By {product.ownerName}</span>}
          </div>
          <div style={{ fontSize: 15, fontWeight: 900, color: G, marginTop: 4 }}>
            Tsh {Number(product.discountPrice || product.price || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="product-actions" style={{ display: "flex", gap: 8, flexShrink: 0, marginTop: 4 }}>
        {product.status === "pending_review" && (
          <>
            <button onClick={() => onStatusChange(product, "approved")}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(34,197,94,.3)", background: "rgba(34,197,94,.08)", color: "#22c55e", cursor: "pointer", fontSize: 11, fontWeight: 800 }}>
              Approve
            </button>
            <button onClick={() => onStatusChange(product, "rejected")}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(239,68,68,.3)", background: "rgba(239,68,68,.08)", color: "#ef4444", cursor: "pointer", fontSize: 11, fontWeight: 800 }}>
              Reject
            </button>
          </>
        )}
        {product.status === "approved" && (
          <button onClick={() => onStatusChange(product, "published")}
            style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(59,130,246,.3)", background: "rgba(59,130,246,.08)", color: "#3b82f6", cursor: "pointer", fontSize: 11, fontWeight: 800 }}>
            Publish
          </button>
        )}
        <button onClick={() => onToggle(product)}
          style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: `1px solid ${product.published ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`, background: product.published ? "rgba(239,68,68,.06)" : "rgba(34,197,94,.06)", color: product.published ? "#ef4444" : "#22c55e", cursor: "pointer", fontSize: 11, fontWeight: 800 }}>
          {product.published ? "Hide" : "Show"}
        </button>
        <button onClick={() => onEdit(product)}
          style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.05)", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 800 }}>
          Edit
        </button>
        <button onClick={() => onDelete(product)}
          style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(239,68,68,.3)", background: "rgba(239,68,68,.1)", color: "#ef4444", cursor: "pointer", fontSize: 11, fontWeight: 800 }}>
          Del
        </button>
      </div>
    </div>
  );
}

// ── Main MarketplaceManager ──────────────────────────
export default function MarketplaceManager({ user }) {
  const db = getFirebaseDb();
  const [activeTab, setActiveTab] = useState("products"); // "products", "orders"
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [filterCat, setFilterCat] = useState("all");
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!db) return;
    // Managers and Admins can see all products in marketplace sector
    // Sellers can only see their own products
    let q = query(collection(db, "products"), where("sector", "==", "marketplace"), orderBy("createdAt", "desc"), limit(500));
    
    if (user?.role === "seller") {
      q = query(collection(db, "products"), where("sector", "==", "marketplace"), where("ownerId", "==", user.uid), orderBy("createdAt", "desc"), limit(500));
    }

    const unsub = onSnapshot(q, snap => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, err => {
      console.error("MarketplaceManager fetch error:", err);
      setLoading(false);
    });

    const qOrders = query(collection(db, "marketplace_orders"), orderBy("createdAt", "desc"), limit(100));
    const unsubOrders = onSnapshot(qOrders, snap => {
      const mktOrders = snap.docs.map(d => ({ id: d.id, ...d.data(), _coll: "marketplace_orders" }));
      setOrders(mktOrders);
    }, () => {
      // Fallback to unified orders collection
      const qOrdersFallback = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(100));
      onSnapshot(qOrdersFallback, snap => {
        const allOrders = snap.docs
          .map(d => ({ id: d.id, ...d.data(), _coll: "orders" }))
          .filter(o => o.type === "marketplace" || !o.type);
        setOrders(allOrders);
      });
    });

    return () => { unsub(); unsubOrders(); };
  }, [db, user?.role, user?.uid]);

  const handleDownloadReceipt = (o) => {
    orderService.downloadReceipt(o);
  };

  const handleSave = async (formData) => {
    if (!db) return;

    // Duplicate check
    const nameExists = products.some(p => p.name.toLowerCase() === formData.name.trim().toLowerCase() && p.id !== editing?.id);
    if (nameExists) {
      showToast("Bidhaa yenye jina hili tayari inapatikana!", "error");
      return;
    }

    setSaving(true);
    try {
      // Normalize category inputs
      const dataToSave = { 
        ...formData,
        category: formData.category?.toLowerCase() || "",
        subcategory: formData.subcategory ? formData.subcategory.toLowerCase().replace(/\s+/g, '-') : "",
        updatedAt: serverTimestamp() 
      };

      if (editing?.id) {
        // Preserve original metadata
        delete dataToSave.id;
        delete dataToSave.createdAt;
        delete dataToSave.ownerId;
        delete dataToSave.ownerName;
        delete dataToSave.ownerRole;
        delete dataToSave.sector;
        
        await updateDoc(doc(db, "products", editing.id), dataToSave);
        showToast("Bidhaa imesasishwa!");
      } else {
        const canDirect = !!user?.canPublishDirect;
        const finalActiveCheck = formData.isActive !== undefined ? formData.isActive : canDirect;
        
        dataToSave.ownerId = user?.uid || "admin";
        dataToSave.ownerName = user?.displayName || "Admin";
        dataToSave.ownerRole = user?.role || "admin";
        dataToSave.sector = "marketplace";
        dataToSave.status = canDirect ? "published" : "pending_review";
        dataToSave.published = finalActiveCheck;
        dataToSave.isActive = finalActiveCheck;
        dataToSave.isFeatured = formData.isFeatured || false;
        dataToSave.createdAt = serverTimestamp();
        
        if (canDirect) {
          dataToSave.approvedBy = user?.uid || "admin";
          dataToSave.approvedAt = serverTimestamp();
        }
        
        await addDoc(collection(db, "products"), dataToSave);
        showToast("Bidhaa mpya imeongezwa!");
      }
      setShowForm(false);
      setEditing(null);
    } catch (e) {
      console.error(e);
      showToast("Imeshindwa: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "products", product.id));
      showToast("Bidhaa imefutwa.");
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
      showToast("Imeshindwa kufuta.", "error");
    }
  };

  const handleStatusChange = async (product, newStatus) => {
    if (!db) return;
    try {
      const updateData = { 
        status: newStatus, 
        published: newStatus === "published",
        isActive: newStatus === "published",
        updatedAt: serverTimestamp() 
      };
      
      if (newStatus === "approved" || newStatus === "published") {
        updateData.approvedBy = user?.uid || "admin";
        updateData.approvedAt = serverTimestamp();
      }
      
      await updateDoc(doc(db, "products", product.id), updateData);
      showToast(`Hali ya bidhaa imebadilishwa kuwa ${newStatus}.`);
    } catch (err) {
      console.error(err);
      showToast("Imeshindwa.", "error");
    }
  };

  const handleToggle = async (product) => {
    if (!db) return;
    try {
      const newActive = !(product.isActive ?? product.published);
      await updateDoc(doc(db, "products", product.id), { 
        isActive: newActive,
        published: newActive,
        status: newActive ? "published" : "approved",
        updatedAt: serverTimestamp() 
      });
      showToast(newActive ? "Bidhaa inaonekana sasa." : "Bidhaa imefichwa.");
    } catch (err) {
      console.error(err);
      showToast("Imeshindwa.", "error");
    }
  };

  const displayed = products.filter(p => {
    if (filterCat !== "all" && p.category !== filterCat) return false;
    if (search) {
      const q = search.toLowerCase();
      return (p.name||"").toLowerCase().includes(q) || (p.brand||"").toLowerCase().includes(q) || (p.location||"").toLowerCase().includes(q);
    }
    return true;
  });

  // Stats - Phase 7 improved
  const total = products.length;
  const published = products.filter(p => ["published", "active"].includes(p.status) || p.isActive === true).length;
  const pending = products.filter(p => p.status === "pending_review").length;
  const active = products.filter(p => p.isActive !== false).length;
  const featured = products.filter(p => p.isFeatured).length;
  const uniqueSellers = new Set(products.map(p => p.sellerId).filter(Boolean)).size;
  const catCounts = Object.keys(MARKET_CATEGORIES).reduce((acc, k) => {
    acc[k] = products.filter(p => p.category === k).length;
    return acc;
  }, {});

  return (
    <div style={{ color: "#fff", fontFamily: "'Instrument Sans',system-ui,sans-serif", paddingBottom: 60 }}>
      {/* Statistics Cards */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", 
        gap: 12, 
        marginBottom: 24,
        overflowX: "auto",
        paddingBottom: 4
      }}>
        {[
          { label: "Bidhaa Zote", value: total, color: "#a3e635" },
          { label: "Published", value: published, color: "#22c55e" },
          { label: "Pending", value: pending, color: "#fbbf24" },
          { label: "Muuzaji", value: uniqueSellers, color: G },
          { label: "Oda", value: orders.length, color: "#3b82f6" },
        ].map(s => (
          <div key={s.label} style={{ 
            background: "rgba(255,255,255,.03)", 
            border: "1px solid rgba(255,255,255,.06)", 
            borderRadius: 16, 
            padding: "14px 18px",
            minWidth: 120
          }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.45)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs - Mobile Scrollable */}
      <div style={{ 
        display: "flex", 
        gap: 8, 
        marginBottom: 20, 
        borderBottom: "1px solid rgba(255,255,255,0.06)", 
        paddingBottom: 14, 
        alignItems: "center",
        overflowX: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch"
      }}>
         <button onClick={() => setActiveTab("products")} style={{ background: activeTab === 'products' ? G : 'rgba(255,255,255,0.04)', color: activeTab === 'products' ? '#000' : 'rgba(255,255,255,0.6)', border: 'none', padding: '10px 18px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: 13, whiteSpace: "nowrap" }}>Bidhaa ({total})</button>
         <button onClick={() => setActiveTab("orders")} style={{ background: activeTab === 'orders' ? G : 'rgba(255,255,255,0.04)', color: activeTab === 'orders' ? '#000' : 'rgba(255,255,255,0.6)', border: 'none', padding: '10px 18px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: 13, whiteSpace: "nowrap" }}>Oda ({orders.length})</button>
         <button onClick={() => setActiveTab("delivery")} style={{ background: activeTab === 'delivery' ? G : 'rgba(255,255,255,0.04)', color: activeTab === 'delivery' ? '#000' : 'rgba(255,255,255,0.6)', border: 'none', padding: '10px 18px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: 13, whiteSpace: "nowrap" }}>Utoaji</button>
         <div style={{ marginLeft: "auto", flexShrink: 0 }}>
           <button onClick={() => window.location.reload()} style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.6)", padding: "10px 14px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>
             🔄 Refresh
           </button>
         </div>
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, padding: "13px 20px", borderRadius: 12, fontWeight: 700, fontSize: 13, background: toast.type === "error" ? "rgba(239,68,68,.95)" : "rgba(0,196,140,.95)", color: "#fff", boxShadow: "0 12px 32px rgba(0,0,0,.4)", animation: "slideUp .3s ease" }}>
          {toast.type === "error" ? "❌" : "✅"} {toast.msg}
        </div>
      )}
      <style>{`@keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

      {/* Confirm delete */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(4,5,9,.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "min(420px,90%)", borderRadius: 20, background: "#0e1018", border: "1px solid rgba(255,255,255,.1)", padding: 28 }}>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>⚠️ Futa Bidhaa</div>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              Una uhakika wa kufuta &quot;{confirmDelete.name}&quot;? Kitendo hiki hakiwezi kurudishwa.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => handleDelete(confirmDelete)}
                style={{ flex: 1, height: 42, borderRadius: 10, border: "none", background: "rgba(239,68,68,.9)", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
                Futa
              </button>
              <button onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, height: 42, borderRadius: 10, border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "rgba(255,255,255,.6)", fontWeight: 700, cursor: "pointer" }}>
                Acha
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "products" ? (
        <>
          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: "-.03em" }}>
                  🛒 STEA Marketplace
                </h2>
                <p style={{ color: "rgba(255,255,255,.45)", fontSize: 13, margin: "4px 0 0" }}>Simamia bidhaa za STEA Duka</p>
              </div>
              {!showForm && (
                <button onClick={() => { setEditing(null); setShowForm(true); }}
                  style={{ padding: "10px 20px", borderRadius: 12, border: "none", background: G, color: "#111", fontWeight: 900, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                  + Ongeza Bidhaa
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Bidhaa Zote", value: total, color: G },
              { label: "Zinaonekana", value: active, color: "#22c55e" },
              { label: "Featured", value: featured, color: "#8b5cf6" },
              ...Object.values(MARKET_CATEGORIES).map(c => ({ label: c.label, value: catCounts[c.id] || 0, color: c.color, emoji: c.emoji })),
            ].map((s, i) => (
              <div key={i} style={{ ...cardStyle, padding: "14px 16px" }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.emoji && `${s.emoji} `}{s.value}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <div style={{ ...cardStyle, marginBottom: 20, border: `1px solid ${G}30` }}>
              <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 16, color: G }}>
                {editing ? "✏️ Hariri Bidhaa" : "➕ Bidhaa Mpya"}
              </div>
              <ProductForm
                initial={editing}
                onSave={handleSave}
                onCancel={() => { setShowForm(false); setEditing(null); }}
                saving={saving}
              />
            </div>
          )}

          {/* Filter + Search */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tafuta bidhaa..."
              style={{ ...inputStyle, height: 40, flex: 1, minWidth: 160 }}
              onFocus={e => e.target.style.borderColor = G}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"}
            />
            <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
              {[{ id: "all", label: "Zote", emoji: "📦" }, ...Object.values(MARKET_CATEGORIES)].map(c => (
                <button key={c.id} onClick={() => setFilterCat(c.id)}
                  style={{ padding: "6px 12px", borderRadius: 999, fontSize: 11, fontWeight: 800, border: `1px solid ${filterCat === c.id ? G : "rgba(255,255,255,.1)"}`, background: filterCat === c.id ? `${G}15` : "transparent", color: filterCat === c.id ? G : "rgba(255,255,255,.5)", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Products list */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(255,255,255,.4)" }}>Inapakia bidhaa...</div>
          ) : displayed.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px", background: "rgba(255,255,255,.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,.05)" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🛒</div>
              <p style={{ color: "rgba(255,255,255,.4)", fontSize: 14 }}>Hakuna bidhaa. Bonyeza &quot;Ongeza Bidhaa&quot; kuanza.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", fontWeight: 700, marginBottom: 4 }}>
                {displayed.length} bidhaa {filterCat !== "all" ? `za ${MARKET_CATEGORIES[filterCat]?.label}` : "zote"}
              </div>
              {displayed.map(p => (
                <ProductRow
                  key={p.id}
                  product={p}
                  onEdit={p => { setEditing(p); setShowForm(true); window.scrollTo(0, 0); }}
                  onDelete={p => setConfirmDelete(p)}
                  onToggle={handleToggle}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Tanzania Orders ({orders.length})</h2>
          </div>
          {orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, background: "rgba(255,255,255,.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,.05)" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <p style={{ color: "rgba(255,255,255,.4)" }}>Hakuna oda zilizopatikana bado.</p>
            </div>
          ) : orders.map(o => {
            const ts = o.createdAt?.toDate?.() || (o.createdAt ? new Date(o.createdAt) : null);
            const dateStr = ts ? ts.toLocaleString() : "-";
            const total = o.totalAmount || o.totalPrice || o.price || 0;
            const statusColors = { pending: "#fbbf24", confirmed: "#22c55e", completed: "#3b82f6", cancelled: "#ef4444" };
            const statusColor = statusColors[o.status] || "#fbbf24";
            return (
              <div key={o.id} style={{ ...cardStyle, background: "#11121d" }}>
                {/* Order header */}
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, borderBottom: "1px solid rgba(255,255,255,.05)", paddingBottom: 12, marginBottom: 12, alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    {o.productImage ? (
                      <img src={o.productImage} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,.08)" }} referrerPolicy="no-referrer" onError={e => e.target.style.display = "none"} />
                    ) : (
                      <div style={{ width: 52, height: 52, borderRadius: 10, background: "rgba(255,255,255,.06)", display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>📦</div>
                    )}
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 15, color: "#fff", marginBottom: 2 }}>{o.productName || "—"}</div>
                      <div style={{ fontWeight: 900, fontSize: 13, color: G }}>#{o.orderId || o.id.substring(0,8).toUpperCase()}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{dateStr}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 900, fontSize: 18, color: "#fff" }}>TZS {Number(total).toLocaleString()}</div>
                    <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 800, background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}30`, marginTop: 4, textTransform: "uppercase" }}>
                      {o.status || "pending"}
                    </span>
                  </div>
                </div>
                {/* Details grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: 12, fontSize: 13 }}>
                  <div>
                    <div style={labelStyle}>Mteja</div>
                    <div style={{ fontWeight: 800 }}>{o.customerName || o.buyerName || "—"}</div>
                    <div style={{ color: "rgba(255,255,255,.5)" }}>{o.customerPhone || o.buyerPhone || ""}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>Utoaji</div>
                    <div style={{ fontWeight: 700, textTransform: "capitalize" }}>{o.deliveryOption || "pickup"}</div>
                    <div style={{ color: "rgba(255,255,255,.5)" }}>{o.region || o.address || ""}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>Malipo</div>
                    <div style={{ color: "#22c55e", fontWeight: 800 }}>{o.paymentMethod || "—"}</div>
                    <div style={{ color: "rgba(255,255,255,.4)", fontSize: 11, fontFamily: "monospace" }}>{o.paymentId || ""}</div>
                  </div>
                  {(o.sellerBusinessName || o.sellerName) && (
                    <div>
                      <div style={labelStyle}>Muuzaji</div>
                      <div style={{ fontWeight: 700 }}>{o.sellerBusinessName || o.sellerName}</div>
                    </div>
                  )}
                </div>
                {/* Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,.05)", flexWrap: "wrap", alignItems: "center" }}>
                  {o.proofUrl && (
                    <div style={{ marginRight: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                      <a href={o.proofUrl} target="_blank" rel="noreferrer" style={{ display: "block" }}>
                        <img src={o.proofUrl} alt="Proof" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", border: `2px solid ${G}30`, cursor: "zoom-in" }} title="Tap to view full proof" />
                      </a>
                      <span style={{ fontSize: 11, color: G, fontWeight: 700 }}>Proof Attached</span>
                    </div>
                  )}
                  <button onClick={() => handleDownloadReceipt(o)} style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: G, color: "#000", fontWeight: 800, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <FileDown size={14} /> Risiti
                  </button>
                  <button 
                    onClick={async () => {
                      if (window.confirm("Delete this order record permanently?")) {
                        try { await deleteDoc(doc(db, o._coll || "marketplace_orders", o.id)); showToast("Order deleted."); }
                        catch(e) { showToast(e.message, "error"); }
                      }
                    }} 
                    style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: 11, cursor: "pointer" }}
                  >
                    Delete Order
                  </button>
                  {(o.userId || o.buyerId) && (
                    <button 
                      onClick={async () => {
                        const uid = o.userId || o.buyerId;
                        if (window.confirm("CRITICAL: Hii itafuta mteja huyu Kila mahali kwenye platform. Je, unaendelea?")) {
                          try {
                            await deleteDoc(doc(db, "users", uid));
                            showToast("User deleted from platform.");
                          } catch(e) { showToast(e.message, "error"); }
                        }
                      }} 
                      style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(239,68,68,.3)", background: "rgba(239,68,68,.1)", color: "#ff4757", fontWeight: 800, fontSize: 11, cursor: "pointer" }}
                    >
                      Delete Platform User
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "delivery" && (
        <DeliverySettingsPanel />
      )}
    </div>
  );
}

// ─── Delivery Settings Panel ──────────────────────────────────────
function DeliverySettingsPanel() {
  const BORDER = "rgba(255,255,255,.08)";
  const iSt = { height: 44, borderRadius: 10, background: "rgba(255,255,255,.05)", border: `1px solid ${BORDER}`, color: "#fff", padding: "0 14px", fontFamily: "inherit", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" };
  const lSt = { fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.45)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6, display: "block" };

  const [form, setForm] = React.useState({
    localFee: 5000, regionFee: 15000,
    pickupLabel: "Shop Pickup – Mwenge Mpakani (Dar) / Arusha Triple A",
    localLabel: "Dar es Salaam Delivery (1-2 siku)",
    regionLabel: "Mikoa Mingine (2-5 siku)",
    paymentNumber: "0758561747", paymentNetwork: "Vodacom M-Pesa",
    adminWhatsApp: "255757053354",
  });
  const [saving, setSaving] = React.useState(false);
  const [saved,  setSaved]  = React.useState(false);
  const db = getFirebaseDb();

  React.useEffect(() => {
    if (!db) return;
    getDoc(doc(db, "site_settings", "delivery")).then(snap => {
      if (snap.exists()) setForm(f => ({ ...f, ...snap.data() }));
    }).catch(() => {});
  }, [db]);

  const save = async () => {
    if (!db) return;
    setSaving(true);
    try {
      const { setDoc: sd, serverTimestamp: st } = await import("firebase/firestore");
      await sd(doc(db, "site_settings", "delivery"), { ...form, updatedAt: st() }, { merge: true });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch(e) { alert("Error: " + e.message); }
    finally { setSaving(false); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ maxWidth: 560, display: "grid", gap: 14 }}>
      <h3 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 4px" }}>🚚 Mipangilio ya Utoaji (Delivery)</h3>

      <div style={{ background: "rgba(255,255,255,.03)", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, display: "grid", gap: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: ".06em" }}>Bei za Utoaji</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={lSt}>Dar es Salaam (TZS)</label><input type="number" value={form.localFee} onChange={e => set("localFee", Number(e.target.value))} style={iSt} /></div>
          <div><label style={lSt}>Mikoa Mingine (TZS)</label><input type="number" value={form.regionFee} onChange={e => set("regionFee", Number(e.target.value))} style={iSt} /></div>
        </div>
        <div><label style={lSt}>Pickup Label</label><input value={form.pickupLabel} onChange={e => set("pickupLabel", e.target.value)} style={iSt} /></div>
        <div><label style={lSt}>Dar Delivery Label</label><input value={form.localLabel} onChange={e => set("localLabel", e.target.value)} style={iSt} /></div>
        <div><label style={lSt}>Region Delivery Label</label><input value={form.regionLabel} onChange={e => set("regionLabel", e.target.value)} style={iSt} /></div>
      </div>

      <div style={{ background: "rgba(255,255,255,.03)", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, display: "grid", gap: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: ".06em" }}>Malipo</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={lSt}>Namba ya Malipo</label><input value={form.paymentNumber} onChange={e => set("paymentNumber", e.target.value)} style={iSt} /></div>
          <div><label style={lSt}>Mtandao (M-Pesa etc.)</label><input value={form.paymentNetwork} onChange={e => set("paymentNetwork", e.target.value)} style={iSt} /></div>
        </div>
        <div><label style={lSt}>Admin WhatsApp</label><input value={form.adminWhatsApp} onChange={e => set("adminWhatsApp", e.target.value)} placeholder="255757053354" style={iSt} /></div>
      </div>

      <button onClick={save} disabled={saving} style={{ height: 48, borderRadius: 12, border: "none", background: saved ? "#22c55e" : G, color: "#000", fontWeight: 900, fontSize: 14, cursor: "pointer", opacity: saving ? .6 : 1, transition: "background .3s" }}>
        {saving ? "Inahifadhi..." : saved ? "✅ Imehifadhiwa!" : "Hifadhi Mipangilio"}
      </button>
    </div>
  );
}
