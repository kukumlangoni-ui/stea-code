import React, { useState, useEffect } from "react";
import { 
  getFirebaseDb, collection, query, limit, onSnapshot, where, 
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp, 
  handleFirestoreError, OperationType 
} from "../../firebase.js";
import { Btn, Field, Input, Textarea, Toast, ConfirmDialog, ImageUploadField, AdminThumb } from "../AdminUI.jsx";
import { TanzaniaMarketplaceImageEditorTrigger } from "../TanzaniaMarketplaceImageEditorModal.jsx";
import { normalizeTzProductImageDisplay } from "../../utils/tanzaniaProductImageDisplay.js";

const G = "#F5A623";
const BORDER = "rgba(255,255,255,.1)";

const ProductItem = React.memo(({ item, del, setEditing, setForm }) => (
  <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", background: "#1a1d2e", padding: "14px 18px", display: "flex", gap: 12, alignItems: "center" }}>
    <AdminThumb src={item.imageUrl} fallback="🏷️" />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 800, fontSize: 15 }}>{item.name}</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>{item.category} · {item.price}</div>
      <div style={{ fontSize: 11, color: item.status === 'published' ? '#00C48C' : '#F5A623', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>{item.status} {item.featured ? '• FEATURED' : ''}</div>
    </div>
    <div style={{ display: "flex", gap: 8 }}>
      <Btn onClick={() => { setEditing(item.id); setForm({ ...item }); window.scrollTo({ top: 0, behavior: "smooth" }); }} color="rgba(245,166,35,.12)" textColor={G} style={{ padding: "8px 14px" }}>✏️</Btn>
      <Btn onClick={() => del(item.id)} color="rgba(239,68,68,.12)" textColor="#fca5a5" style={{ padding: "8px 14px" }}>🗑️</Btn>
    </div>
  </div>
));

export default function ProductsManager({ user }) {
  const [docs, setDocs] = useState([]);
  const [marketplaceType, setMarketplaceType] = useState("tanzania"); // "tanzania" or "china"
  const [form, setForm] = useState({ 
    name: "", description: "", price: "", oldPrice: "", imageUrl: "", images: [], category: "phones",
    monetizationType: "manual_lead", whatsappLink: "", sellerName: "", featured: false,
    hasSafariOption: false,
    payment_mpesa: "", payment_airtel: "", payment_tigo: "", payment_bank: "", payment_lipa: "",
    // Bulk / Steps
    minQty: 1, stepQty: 1, cartonQty: 0, 
    // China specific
    air_price: 0, shipping_options: ["sea"], estimatedDelivery: "", productType: "single",
    bulk_prices: [], // array of {quantity, price}
    imageFit: "cover", imagePositionX: 50, imagePositionY: 50, imageZoom: 1,
  });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);
  const [confirm, setConfirm] = useState(null);

  const db = getFirebaseDb();
  const toast_ = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const collectionName = marketplaceType === "china" ? "chaba_products" : "products";

  useEffect(() => {
    if (!db) return;
    let q = query(collection(db, collectionName), limit(1000));
    if (user?.role === "seller" || user?.role === "creator") {
      q = query(collection(db, collectionName), where("ownerId", "==", user.uid), limit(1000));
    }
    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      fetched.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
      setDocs(fetched);
    }, (err) => {
      console.error("Error loading products:", err);
    });
    return () => unsub();
  }, [db, user?.role, user?.uid, collectionName]);

  const addBulkTier = () => setForm(f => ({ ...f, bulk_prices: [...(f.bulk_prices || []), { quantity: 0, price: 0 }] }));
  const removeBulkTier = (idx) => setForm(f => ({ ...f, bulk_prices: f.bulk_prices.filter((_, i) => i !== idx) }));
  const updateBulkTier = (idx, field, val) => {
    const newTiers = [...form.bulk_prices];
    newTiers[idx] = { ...newTiers[idx], [field]: Number(val) };
    setForm(f => ({ ...f, bulk_prices: newTiers }));
  };

  const save = async () => {
    const name = (form.name || "").toString();
    if (!name.trim()) { toast_("Weka jina la bidhaa kwanza", "error"); return; }
    
    // Check for at least one payment method
    const hasPayment = form.payment_mpesa?.trim() || form.payment_airtel?.trim() || 
                       form.payment_tigo?.trim() || form.payment_bank?.trim() || 
                       form.payment_lipa?.trim();
    
    if (!hasPayment) {
      toast_("Tafadhali weka angalau njia moja ya malipo (MPesa, Airtel, etc)", "error");
      return;
    }

    setLoading(true);
    try {
      const canDirect = !!user?.canPublishDirect;
      const data = { 
        ...form,
        title: form.name || form.title || "",
        description: form.description || "",
        image: form.imageUrl || form.image || "",
        images: Array.isArray(form.images) ? form.images : [],
        category: form.category || "Electronics",
        active: form.active ?? true,
        published: form.published ?? (editing ? form.published : canDirect),
        status: form.status ?? (editing ? form.status : (canDirect ? "published" : "pending_review")),
        isChabaData: marketplaceType === "china",
        updatedAt: serverTimestamp()
      };

      if (!editing) {
        data.createdAt = serverTimestamp();
        data.ownerId = user?.uid || "admin";
        data.ownerName = user?.displayName || "Admin";
        data.ownerRole = user?.role || "admin";
        data.sector = "products";
      } else {
        delete data.createdAt;
        delete data.ownerId;
        delete data.ownerName;
        delete data.ownerRole;
        delete data.sector;
        delete data.id;
      }

      Object.keys(data).forEach(key => {
        if (data[key] === undefined || data[key] === null) data[key] = "";
      });

      if (marketplaceType === "china") {
        delete data.imageFit;
        delete data.imagePositionX;
        delete data.imagePositionY;
        delete data.imageZoom;
      } else {
        const tz = normalizeTzProductImageDisplay(form);
        data.imageFit = tz.imageFit;
        data.imagePositionX = tz.imagePositionX;
        data.imagePositionY = tz.imagePositionY;
        data.imageZoom = tz.imageZoom;
      }

      if (editing) {
        await updateDoc(doc(db, collectionName, editing), data);
        toast_("Imesahihishwa!");
      } else { 
        await addDoc(collection(db, collectionName), data); 
        toast_("Bidhaa imewekwa live!"); 
      }
      setForm({ 
        name: "", description: "", price: "", oldPrice: "", imageUrl: "", images: [], category: "phones", 
        monetizationType: "manual_lead", whatsappLink: "", sellerName: "", featured: false,
        hasSafariOption: false,
        payment_mpesa: "", payment_airtel: "", payment_tigo: "", payment_bank: "", payment_lipa: "",
        minQty: 1, stepQty: 1, cartonQty: 0, 
        air_price: 0, shipping_options: ["sea"], estimatedDelivery: "", productType: "single", bulk_prices: [],
        imageFit: "cover", imagePositionX: 50, imagePositionY: 50, imageZoom: 1,
      });
      setEditing(null);
    } catch (e) {
      console.error(e);
      if (e.message.includes("insufficient permissions")) {
        handleFirestoreError(e, editing ? OperationType.UPDATE : OperationType.CREATE, collectionName);
      }
      toast_(e.message, "error");
    }
    setLoading(false);
  };

  const del = async (id) => {
    setConfirm({ msg: "Una uhakika unataka kufuta bidhaa hii?", onConfirm: async () => { await deleteDoc(doc(db, collectionName, id)); setConfirm(null); toast_("Bidhaa imefutwa"); }, onCancel: () => setConfirm(null) });
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {confirm && <ConfirmDialog {...confirm} />}

      {/* Marketplace Selector */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <button onClick={() => setMarketplaceType("tanzania")} style={{ flex: 1, padding: "12px", borderRadius: 12, background: marketplaceType === "tanzania" ? G : "rgba(255,255,255,.05)", color: marketplaceType === "tanzania" ? "#000" : "#fff", fontWeight: 800, border: "none", cursor: "pointer" }}>Tanzania Marketplace</button>
        <button onClick={() => setMarketplaceType("china")} style={{ flex: 1, padding: "12px", borderRadius: 12, background: marketplaceType === "china" ? G : "rgba(255,255,255,.05)", color: marketplaceType === "china" ? "#000" : "#fff", fontWeight: 800, border: "none", cursor: "pointer" }}>Agiza China (China)</button>
      </div>

      <div style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,.08)", background: "#141823", padding: 24, marginBottom: 28 }}>
        <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 20, margin: "0 0 20px" }}>{editing ? "✏️ Hariri Bidhaa" : "➕ Ongeza Bidhaa Mpya"} ({marketplaceType === "china" ? "China" : "Tanzania"})</h3>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <Field label="Jina la Bidhaa *"><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Sony WH-1000XM4" /></Field>
            <Field label="Category">
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ width: "100%", padding: 10, borderRadius: 8, background: "#1a1d2e", border: "1px solid rgba(255,255,255,.1)", color: "white" }}>
                {marketplaceType === "china" ? (
                  <>
                    <option value="clothes-fashion">Clothes & Fashion</option>
                    <option value="shoes-footwear">Shoes & Footwear</option>
                    <option value="electronics">Electronics</option>
                    <option value="spare-parts">Spare Parts</option>
                    <option value="accessories">Accessories</option>
                    <option value="home-lifestyle">Home & Lifestyle</option>
                    <option value="toys-sports">Toys & Sports</option>
                    <option value="other">Other</option>
                  </>
                ) : (
                  <>
                    <option value="phones">Phones</option>
                    <option value="laptops">Laptops</option>
                    <option value="accessories">Accessories</option>
                    <option value="furniture">Furniture</option>
                    <option value="beauty">Beauty</option>
                    <option value="electronics">Electronics</option>
                    <option value="spare_parts">Spare Parts</option>
                  </>
                )}
              </select>
            </Field>
          </div>
          <ImageUploadField label="Main Image URL" value={form.imageUrl} onChange={val => setForm(f => ({ ...f, imageUrl: val }))} />
          
          {/* Additional Images */}
          <div style={{ padding: 16, borderRadius: 12, background: "rgba(255,255,255,.02)", border: `1px solid ${BORDER}` }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: 13, color: "rgba(255,255,255,.5)" }}>ADDITIONAL IMAGES (UP TO 10)</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
              {(form.images || []).map((img, i) => (
                <div key={i} style={{ position: "relative" }}>
                   <AdminThumb src={img} size={64} />
                   <button onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))} style={{ position: "absolute", top: -8, right: -8, background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: 10 }}>✕</button>
                </div>
              ))}
              {(form.images || []).length < 10 && (
                <ImageUploadField label="" value="" onChange={val => setForm(f => ({ ...f, images: [...f.images, val] }))} />
              )}
            </div>
          </div>

          {marketplaceType === "tanzania" && (
            <div style={{ padding: 16, borderRadius: 12, background: "rgba(255,255,255,.02)", border: `1px solid ${BORDER}` }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: 13, color: "rgba(255,255,255,.5)" }}>
                MWONEKANO WA PICHA (UKURASA WA BIDHAA)
              </h4>
              <TanzaniaMarketplaceImageEditorTrigger
                imageUrl={(form.images && form.images[0]) || form.imageUrl || ""}
                value={form}
                disabled={!((form.images && form.images[0]) || form.imageUrl)}
                onApply={(d) => setForm((f) => ({ ...f, ...d }))}
              />
            </div>
          )}
          
          <Field label="Maelezo"><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Maelezo ya bidhaa..." style={{ minHeight: 80 }} /></Field>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
            <Field label="Bei ya Meli / Unit Price"><Input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="TZS 850,000" /></Field>
            {marketplaceType === "china" && <Field label="Bei ya Ndege (Air)"><Input value={form.air_price} onChange={e => setForm(f => ({ ...f, air_price: e.target.value }))} placeholder="Optional" /></Field>}
            <Field label="Bei ya Zamani"><Input value={form.oldPrice} onChange={e => setForm(f => ({ ...f, oldPrice: e.target.value }))} placeholder="TZS 950,000" /></Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
            <Field label="Min Quantity"><Input type="number" value={form.minQty} onChange={e => setForm(f => ({ ...f, minQty: e.target.value }))} /></Field>
            <Field label="Step Quantity (Multiples)"><Input type="number" value={form.stepQty} onChange={e => setForm(f => ({ ...f, stepQty: e.target.value }))} /></Field>
            <Field label="Carton Quantity"><Input type="number" value={form.cartonQty} onChange={e => setForm(f => ({ ...f, cartonQty: e.target.value }))} /></Field>
          </div>

          {marketplaceType === "china" && (
            <div style={{ padding: 16, borderRadius: 12, background: "rgba(255,255,255,.02)", border: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: 13, color: G }}>BULK PRICING TIERS</h4>
                <button onClick={addBulkTier} style={{ padding: "4px 10px", borderRadius: 6, background: G, color: "#000", border: "none", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>+ Add Tier</button>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {(form.bulk_prices || []).map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input type="number" placeholder="Min Qty" value={t.quantity} onChange={e => updateBulkTier(i, "quantity", e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 6, background: "#1a1d2e", border: `1px solid ${BORDER}`, color: "#fff" }} />
                    <input type="number" placeholder="Unit Price" value={t.price} onChange={updateBulkTier.bind(null, i, "price")} style={{ flex: 1, padding: 8, borderRadius: 6, background: "#1a1d2e", border: `1px solid ${BORDER}`, color: "#fff" }} />
                    <button onClick={() => removeBulkTier(i)} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <Field label="WhatsApp Override Number"><Input value={form.whatsappLink} onChange={e => setForm(f => ({ ...f, whatsappLink: e.target.value }))} placeholder="2557XXXXXXXX (Leave blank for default)" /></Field>
            <Field label="Est. Delivery Time"><Input value={form.estimatedDelivery} onChange={e => setForm(f => ({ ...f, estimatedDelivery: e.target.value }))} placeholder="e.g. 2-3 Weeks Air" /></Field>
          </div>

          <div style={{ padding: "16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <h4 style={{ fontSize: 13, fontWeight: 900, marginBottom: 12, color: G, textTransform: "uppercase" }}>💰 Payment Methods (Required)</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <Field label="Vodacom M-Pesa No"><Input value={form.payment_mpesa} onChange={e => setForm(f => ({ ...f, payment_mpesa: e.target.value }))} placeholder="07XXXXXXXX" /></Field>
              <Field label="Airtel Money No"><Input value={form.payment_airtel} onChange={e => setForm(f => ({ ...f, payment_airtel: e.target.value }))} placeholder="06XXXXXXXX" /></Field>
              <Field label="Tigo Pesa No"><Input value={form.payment_tigo} onChange={e => setForm(f => ({ ...f, payment_tigo: e.target.value }))} placeholder="06XXXXXXXX" /></Field>
              <Field label="Bank (Name & Acc)"><Input value={form.payment_bank} onChange={e => setForm(f => ({ ...f, payment_bank: e.target.value }))} placeholder="NMB: 123..." /></Field>
              <Field label="Lipa Namba"><Input value={form.payment_lipa} onChange={e => setForm(f => ({ ...f, payment_lipa: e.target.value }))} placeholder="54321..." /></Field>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} id="featured-product" />
              <label htmlFor="featured-product" style={{ fontSize: 14, cursor: "pointer" }}>Mark as Featured (Homepage)</label>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="checkbox" checked={form.hasSafariOption} onChange={e => setForm(f => ({ ...f, hasSafariOption: e.target.checked }))} id="safari-option" />
              <label htmlFor="safari-option" style={{ fontSize: 14, cursor: "pointer", color: G, fontWeight: 700 }}>Enable "Book Your Safari" Button</label>
            </div>
          </div>
          <Btn onClick={save} disabled={loading}>{loading ? "Inahifadhi..." : editing ? "💾 Hifadhi" : "🚀 Weka Live"}</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {docs.map(item => (
          <ProductItem key={item.id} item={item} del={del} setEditing={setEditing} setForm={setForm} />
        ))}
      </div>
    </div>
  );
}
