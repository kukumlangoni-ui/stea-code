import { useState, useEffect } from "react";
import {
  getFirebaseDb, collection, addDoc, updateDoc, deleteDoc,
  doc, getDoc, setDoc, serverTimestamp, query, where, onSnapshot,
  handleFirestoreError, OperationType
} from "../firebase.js";
import { MARKET_CATEGORIES } from "../constants/marketplace.js";
import { MessageCircle, Package, Plus, LayoutDashboard, ShoppingBag, User, CreditCard } from "lucide-react";
import { StorageMediaField } from "./AdminUI.jsx";
import { TanzaniaMarketplaceImageEditorTrigger } from "./TanzaniaMarketplaceImageEditorModal.jsx";
import { normalizeTzProductImageDisplay } from "../utils/tanzaniaProductImageDisplay.js";
import { ShopProductCard } from "../components/ShopProductCard.jsx";
import { useMarketplaceExtra } from "../hooks/useMarketplaceExtra.js";
import VariantEditor from "./VariantEditor.jsx";
import STEAAvatar from "../components/STEAAvatar.jsx";

const G = "#F5A623", G2 = "#FFD17C";

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
      <label style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.45)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5, display: "block" }}>Product Images</label>
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
        First image will be used as the thumbnail. Max 10 images.
      </div>
    </div>
  );
}

// ── Shared UI ─────────────────────────────────────────
const Btn = ({ children, onClick, color = G, textColor = "#111", disabled, style = {} }) => (
  <button onClick={onClick} disabled={disabled}
    style={{ border:"none", cursor:disabled?"not-allowed":"pointer", borderRadius:12,
      padding:"10px 18px", fontWeight:800, fontSize:13, color:textColor,
      background:color, opacity:disabled?.6:1, transition:"all .2s",
      display:"inline-flex", alignItems:"center", gap:8, flexShrink: 0, ...style }}
    onMouseEnter={e=>{ if(!disabled) e.currentTarget.style.opacity=".85"; }}
    onMouseLeave={e=>{ e.currentTarget.style.opacity="1"; }}>
    {children}
  </button>
);

const Field = ({ label, children }) => (
  <div style={{ display:"grid", gap:6 }}>
    <label style={{ fontSize:12, fontWeight:800, color:"rgba(255,255,255,.5)", textTransform:"uppercase", letterSpacing:".06em" }}>{label}</label>
    {children}
  </div>
);

const Input = (props) => (
  <input {...props} value={props.value || ""} style={{ height:46, borderRadius:12, border:"1px solid rgba(255,255,255,.1)",
    background:"rgba(255,255,255,.05)", color:"#fff", padding:"0 14px", outline:"none",
    fontFamily:"inherit", fontSize:14, width:"100%", ...props.style }}
    onFocus={e=>e.target.style.borderColor=G}
    onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.1)"}/>
);

const Textarea = (props) => (
  <textarea {...props} value={props.value || ""} style={{ borderRadius:12, border:"1px solid rgba(255,255,255,.1)",
    background:"rgba(255,255,255,.05)", color:"#fff", padding:"12px 14px", outline:"none",
    fontFamily:"inherit", fontSize:14, width:"100%", resize:"vertical", minHeight:100,
    ...props.style }}
    onFocus={e=>e.target.style.borderColor=G}
    onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.1)"}/>
);

const Select = (props) => (
  <select {...props} style={{ height:46, borderRadius:12, border:"1px solid rgba(255,255,255,.1)",
    background:"rgba(255,255,255,.05)", color:"#fff", padding:"0 14px", outline:"none",
    fontFamily:"inherit", fontSize:14, width:"100%", cursor:"pointer", ...props.style }}
    onFocus={e=>e.target.style.borderColor=G}
    onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.1)"}>
    {props.children}
  </select>
);

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, padding:"14px 20px",
      borderRadius:14, fontWeight:700, fontSize:14,
      background:type==="error"?"rgba(239,68,68,.95)":"rgba(0,196,140,.95)",
      color:"#fff", boxShadow:"0 12px 32px rgba(0,0,0,.4)",
      animation:"slideUp .3s ease" }}>
      {type==="error"?"❌":"✅"} {msg}
    </div>
  );
}

function StatCard({ icon, label, value, color = G }) {
  return (
    <div style={{ borderRadius:18, border:"1px solid rgba(255,255,255,.08)", background:"#141823",
      padding:"20px 24px", display:"flex", alignItems:"center", gap:16 }}>
      <div style={{ width:52, height:52, borderRadius:14, display:"grid", placeItems:"center",
        background:`${color}18`, fontSize:26 }}>{icon}</div>
      <div>
        <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize: 28, fontWeight:800, color, lineHeight:1 }}>
          {value}
        </div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,.45)", marginTop:4 }}>{label}</div>
      </div>
    </div>
  );
}

// ── Seller Dashboard Component ────────────────────────
export default function SellerDashboard({ user, onBack }) {
  const [section, setSection] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const db = getFirebaseDb();
  const toast_ = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!db || !user?.uid) return;

    // Listen to seller's products
    const qProducts = query(
      collection(db, "products"),
      where("ownerId", "==", user.uid)
    );
    const unsubProducts = onSnapshot(qProducts, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(fetched.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    }, (err) => {
      console.error("Error loading products:", err);
      handleFirestoreError(err, OperationType.LIST, "products");
    });

    // Listen to seller's orders
    const qOrders = query(
      collection(db, "orders"),
      where("sellerId", "==", user.uid)
    );
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(fetched.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    }, (err) => {
      console.error("Error loading orders:", err);
      handleFirestoreError(err, OperationType.LIST, "orders");
    });

    return () => {
      unsubProducts();
      unsubOrders();
    };
  }, [db, user?.uid]);

  const SECTIONS = [
    { id: "dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { id: "products", icon: <ShoppingBag size={18} />, label: "My Products" },
    { id: "add_product", icon: <Plus size={18} />, label: "Add Product" },
    { id: "orders", icon: <Package size={18} />, label: "Orders / Messages" },
    { id: "profile", icon: <User size={18} />, label: "My Profile" },
    { id: "plan", icon: <CreditCard size={18} />, label: "Subscription / Plan" },
  ];

  const handleSaveProduct = async (formData) => {
    try {
      const isNew = !editingProduct;
      const canDirect = !!user.canPublishDirect;
      
      const data = {
        ...formData,
        updatedAt: serverTimestamp(),
      };

      if (isNew) {
        data.ownerId = user.uid;
        data.ownerName = user.displayName || user.email;
        data.ownerRole = user.role || "seller";
        data.sector = "marketplace";
        data.createdAt = serverTimestamp();
        data.status = canDirect ? "published" : "pending_review";
        data.published = canDirect;
        
        if (canDirect) {
          data.approvedBy = "system_trusted";
          data.approvedAt = serverTimestamp();
        }

        await addDoc(collection(db, "products"), data);
        toast_(canDirect ? "Bidhaa imewekwa live!" : "Bidhaa imeongezwa na inasubiri review!");
      } else {
        // Preserve original metadata
        delete data.id;
        delete data.createdAt;
        delete data.ownerId;
        delete data.ownerName;
        delete data.ownerRole;
        delete data.sector;

        // If editing an already published product and user is NOT trusted, maybe it should go back to review?
        if (!canDirect && editingProduct.status === "published") {
          data.status = "pending_review";
          data.published = false;
        }
        
        await updateDoc(doc(db, "products", editingProduct.id), data);
        toast_("Bidhaa imesasishwa!");
      }
      setSection("products");
      setEditingProduct(null);
    } catch (err) {
      console.error("Error saving product:", err);
      toast_("Imeshindwa kuhifadhi bidhaa", "error");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Una uhakika unataka kufuta bidhaa hii?")) return;
    try {
      await deleteDoc(doc(db, "products", id));
      toast_("Bidhaa imefutwa");
    } catch (err) {
      console.error("Error deleting product:", err);
      toast_("Imeshindwa kufuta bidhaa", "error");
    }
  };

  return (
    <div className="seller-dashboard-container" style={{ minHeight:"100vh", display:"grid", gridTemplateColumns: "260px 1fr", background:"#0a0b0f", color: "#fff" }}>
      <style>{`
        @media (max-width: 768px) {
          .seller-dashboard-container { grid-template-columns: 1fr !important; }
          .seller-sidebar { display: ${sidebarOpen ? 'flex' : 'none'} !important; position: fixed !important; z-index: 1000 !important; background: #0a0b0f !important; width: 100% !important; }
          .seller-main-content { padding: 16px !important; }
          .mobile-menu-btn { display: block !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>

      {/* Sidebar */}
      <div className="seller-sidebar" style={{ borderRight:"1px solid rgba(255,255,255,.06)", padding:"24px 16px", position:"sticky", top:0, height:"100vh", overflowY:"auto", display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom:28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, fontWeight:800, marginBottom:4, color: G }}>🛍️ Seller Panel</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.35)" }}>STEA Marketplace</div>
          </div>
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display:"grid", gap:4 }}>
          {SECTIONS.map(s=>(
            <button key={s.id} onClick={()=>{setSection(s.id); setSidebarOpen(false); setEditingProduct(null);}}
              style={{ border:"none", borderRadius:12, padding:"12px 14px", textAlign:"left", cursor:"pointer", fontWeight:700, fontSize:14,
                background:section===s.id?`linear-gradient(135deg,${G},${G2})`:"transparent",
                color:section===s.id?"#111":"rgba(255,255,255,.65)",
                display:"flex", alignItems:"center", gap:10, transition:"all .2s" }}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop:"auto", paddingTop:24 }}>
          <button onClick={onBack} style={{ border:"1px solid rgba(255,255,255,.08)", borderRadius:12, padding:"10px 14px", background:"transparent", color:"rgba(255,255,255,.5)", cursor:"pointer", fontWeight:700, fontSize:13, width:"100%", display:"flex", alignItems:"center", gap:8 }}>
            ← Rudi Website
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="seller-main-content" style={{ padding:"28px 32px", overflowY:"auto" }}>
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} style={{ marginBottom: 20, padding: '10px 15px', background: G, border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>☰ Menu</button>
        
        {toast && <Toast msg={toast.msg} type={toast.type} />}

        {section === "dashboard" && (
          <div>
            <h1 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:32, margin:"0 0 24px" }}>
              Karibu, <span style={{ color:G }}>{user?.displayName || "Seller"}</span> 🚀
            </h1>
            
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:16, marginBottom:32 }}>
              <StatCard icon="📦" label="Total Products" value={products.length} color="#818cf8" />
              <StatCard icon="✅" label="Approved" value={products.filter(p => p.status === "approved" || p.status === "published").length} color="#22c55e" />
              <StatCard icon="⏳" label="Pending Review" value={products.filter(p => p.status === "pending_review").length} color="#fbbf24" />
              <StatCard icon="💳" label="Total Orders" value={orders.length} color="#ff85cf" />
            </div>

            <div style={{ borderRadius:20, border:"1px solid rgba(245,166,35,.2)", background:"rgba(245,166,35,.06)", padding:24 }}>
              <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, margin:"0 0 16px", color:G }}>📈 Muhtasari wa Mauzo</h3>
              <p style={{ color: "rgba(255,255,255,.5)", fontSize: 14 }}>Hapa utaona takwimu za mauzo yako pindi yatakapoanza kuingia.</p>
            </div>
          </div>
        )}

        {section === "products" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin: 0 }}>📦 Bidhaa <span style={{color:G}}>Zangu</span></h2>
              <Btn onClick={() => setSection("add_product")}>+ Ongeza Mpya</Btn>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: 40 }}>Inapakia...</div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, background: "rgba(255,255,255,.02)", borderRadius: 20 }}>
                <ShoppingBag size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                <p style={{ color: "rgba(255,255,255,.4)" }}>Huna bidhaa yoyote bado.</p>
                <Btn onClick={() => setSection("add_product")} style={{ marginTop: 16 }}>Anza Kuuza Sasa</Btn>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {products.map(p => (
                  <div key={p.id} style={{ background: "#141823", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 60, height: 60, borderRadius: 12, background: "rgba(255,255,255,.05)", overflow: "hidden", display: "grid", placeItems: "center" }}>
                      {p.imageUrl ? <img src={p.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={24} opacity={0.3} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{p.name}</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ color: G, fontWeight: 700, fontSize: 14 }}>Tsh {Number(p.price).toLocaleString()}</span>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: p.status === "approved" || p.status === "published" ? "rgba(34,197,94,.1)" : p.status === "rejected" ? "rgba(239,68,68,.1)" : "rgba(251,191,36,.1)", color: p.status === "approved" || p.status === "published" ? "#22c55e" : p.status === "rejected" ? "#ef4444" : "#fbbf24", fontWeight: 800, textTransform: "uppercase" }}>
                          {p.status?.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setEditingProduct(p); setSection("add_product"); }} style={{ background: "rgba(255,255,255,.05)", border: "none", color: "#fff", padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Edit</button>
                      <button onClick={() => handleDeleteProduct(p.id)} style={{ background: "rgba(239,68,68,.1)", border: "none", color: "#ef4444", padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {section === "add_product" && (
          <div style={{ maxWidth: 600 }}>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, marginBottom: 24 }}>
              {editingProduct ? "✏️ Hariri" : "➕ Ongeza"} <span style={{color:G}}>Bidhaa</span>
            </h2>
            <SellerProductForm 
              initial={editingProduct} 
              onSave={handleSaveProduct} 
              onCancel={() => { setSection("products"); setEditingProduct(null); }} 
            />
          </div>
        )}

        {section === "orders" && (
          <div>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, marginBottom: 24 }}>📦 Oda <span style={{color:G}}>& Ujumbe</span></h2>
            {orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, background: "rgba(255,255,255,.02)", borderRadius: 20 }}>
                <MessageCircle size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                <p style={{ color: "rgba(255,255,255,.4)" }}>Huna oda yoyote bado.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {orders.map(o => (
                  <div key={o.id} style={{ background: "#141823", borderRadius: 16, padding: 20, border: "1px solid rgba(255,255,255,.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
                      <span style={{ fontWeight: 800, fontSize: 16 }}>Oda #{o.id.substring(0,6).toUpperCase()}</span>
                      <span style={{ color: G, fontWeight: 900, fontSize: 15 }}>{o.price || "Contact"}</span>
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>Mteja</div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{o.buyerName || o.customerName}</div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>{o.buyerPhone}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>Biashara</div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{o.productName}</div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>{o.deliveryOption === "pickup" ? "Shop Pickup" : o.deliveryOption === "local" ? "Normal (DSM)" : "Region"}</div>
                      </div>
                    </div>

                    <div style={{ background: "rgba(255,255,255,.02)", padding: 12, borderRadius: 10, display: "grid", gap: 8, fontSize: 13 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "rgba(255,255,255,.5)" }}>Payment Method:</span>
                        <span style={{ fontWeight: 700 }}>{o.paymentMethod}</span>
                      </div>
                      
                      {o.category === "electronics" && (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "rgba(255,255,255,.5)" }}>Quantity / Color:</span>
                            <span style={{ fontWeight: 700 }}>{o.quantity} / {o.color || "N/A"}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "rgba(255,255,255,.5)" }}>Warranty:</span>
                            <span style={{ fontWeight: 700 }}>{o.warranty}</span>
                          </div>
                        </>
                      )}

                      {o.category === "spare_parts" && (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "rgba(255,255,255,.5)" }}>Device:</span>
                            <span style={{ fontWeight: 700 }}>{o.deviceType} ({o.deviceModel})</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "rgba(255,255,255,.5)" }}>Part:</span>
                            <span style={{ fontWeight: 700 }}>{o.partType}</span>
                          </div>
                          {o.serialNumber && (
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "rgba(255,255,255,.5)" }}>Serial:</span>
                              <span style={{ fontWeight: 700 }}>{o.serialNumber}</span>
                            </div>
                          )}
                          <div style={{ marginTop: 4, padding: 8, background: "rgba(255,255,255,.02)", borderRadius: 8 }}>
                             <span style={{ color: "rgba(255,255,255,.4)", display: "block", marginBottom: 2, fontSize: 10 }}>ISSUE DESCRIPTION</span>
                             <div style={{ fontSize: 13 }}>{o.issueDescription}</div>
                          </div>
                        </>
                      )}

                      {o.paymentId && (
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "rgba(255,255,255,.5)" }}>Transaction ID:</span>
                          <span style={{ fontWeight: 700, fontFamily: "monospace" }}>{o.paymentId}</span>
                        </div>
                      )}
                      
                      {o.region && (
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "rgba(255,255,255,.5)" }}>Region/Area:</span>
                          <span style={{ fontWeight: 700 }}>{o.region}</span>
                        </div>
                      )}
                      {o.message && (
                        <div style={{ marginTop: 8, padding: 10, background: "rgba(255,255,255,.03)", borderRadius: 8 }}>
                          <span style={{ color: "rgba(255,255,255,.5)", display: "block", marginBottom: 4, fontSize: 11, textTransform: "uppercase" }}>Ujumbe</span>
                          <span>{o.message}</span>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
                      {o.proofUrl && (
                        <a href={o.proofUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(37, 211, 102, 0.1)", color: "#25d366", padding: "8px 12px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
                          📸 Malipo Proof
                        </a>
                      )}
                      {o.devicePhotoUrl && (
                        <a href={o.devicePhotoUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(245, 166, 35, 0.1)", color: G, padding: "8px 12px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
                          🖼️ Device Photo
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {section === "profile" && (
          <div style={{ maxWidth: 500 }}>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, marginBottom: 24 }}>👤 Profile <span style={{color:G}}>Yangu</span></h2>
            <div style={{ background: "#141823", borderRadius: 20, padding: 24, border: "1px solid rgba(255,255,255,.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <STEAAvatar user={user} size="lg" />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{user?.displayName}</div>
                  <div style={{ color: "rgba(255,255,255,.4)", fontSize: 14 }}>{user?.email}</div>
                  <div style={{ fontSize: 11, color: G, fontWeight: 700, marginTop: 4 }}>🏪 Seller Account</div>
                </div>
              </div>
              <SellerProfileForm user={user} db={getFirebaseDb()} showToast={() => {}} />
            </div>
          </div>
        )}

        {section === "plan" && (
          <div style={{ maxWidth: 500 }}>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, marginBottom: 24 }}>💳 Mpango <span style={{color:G}}>wa Malipo</span></h2>
            <div style={{ background: `linear-gradient(135deg, ${G}22, transparent)`, borderRadius: 20, padding: 32, border: `1px solid ${G}33`, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: G, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>Current Plan</div>
              <div style={{ fontSize: 40, fontWeight: 900, marginBottom: 16 }}>Free Seller</div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "grid", gap: 12, color: "rgba(255,255,255,.7)", fontSize: 15 }}>
                <li>✅ Unlimited Product Listings</li>
                <li>✅ Basic Analytics</li>
                <li>✅ WhatsApp Integration</li>
                <li>❌ Featured Badge</li>
                <li>❌ Direct Publishing</li>
              </ul>
              <Btn style={{ width: "100%", height: 50, fontSize: 15 }}>Upgrade to Premium</Btn>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Seller Profile Form ───────────────────────────────
function SellerProfileForm({ user, db }) {
  const [form, setForm] = useState({
    sellerBusinessName: "",
    sellerProfileImage: "",
    sellerWhatsApp: "",
    sellerPhone: "",
    sellerEmail: "",
    sellerInstagram: "",
    sellerFacebook: "",
    sellerTikTok: "",
    sellerLocation: "",
    sellerDescription: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user?.uid || !db) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setForm(f => ({
            ...f,
            sellerBusinessName: data.sellerBusinessName || data.displayName || "",
            sellerProfileImage: data.sellerProfileImage || data.photoURL || "",
            sellerWhatsApp: data.sellerWhatsApp || "",
            sellerPhone: data.sellerPhone || data.phone || "",
            sellerEmail: data.sellerEmail || data.email || "",
            sellerInstagram: data.sellerInstagram || "",
            sellerFacebook: data.sellerFacebook || "",
            sellerTikTok: data.sellerTikTok || "",
            sellerLocation: data.sellerLocation || "",
            sellerDescription: data.sellerDescription || "",
          }));
        }
      } catch (e) { console.warn("Profile load error:", e); }
    };
    load();
  }, [user?.uid, db]);

  const handleSave = async () => {
    if (!user?.uid || !db) return;
    setSaving(true);
    try {

      const cleaned = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== undefined)
      );
      await setDoc(doc(db, "users", user.uid), cleaned, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error("Profile save error:", e);
      alert("Imeshindwa kuhifadhi profile. Jaribu tena.");
    } finally {
      setSaving(false);
    }
  };

  const inputSt = { height: 44, borderRadius: 12, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.05)", color: "#fff", padding: "0 14px", outline: "none", fontFamily: "inherit", fontSize: 14, width: "100%", boxSizing: "border-box" };
  const labelSt = { fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.45)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5, display: "block" };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <label style={labelSt}>Jina la Biashara *</label>
        <input value={form.sellerBusinessName} onChange={e => set("sellerBusinessName", e.target.value)} placeholder="Jina la duka lako" style={inputSt} onFocus={e => e.target.style.borderColor = G} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"} />
      </div>

      <div>
        <label style={labelSt}>Profile Image URL</label>
        <StorageMediaField value={form.sellerProfileImage} onChange={url => set("sellerProfileImage", url)} label="" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={labelSt}>WhatsApp (with country code)</label>
          <input value={form.sellerWhatsApp} onChange={e => set("sellerWhatsApp", e.target.value)} placeholder="255712345678" style={inputSt} onFocus={e => e.target.style.borderColor = G} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"} />
        </div>
        <div>
          <label style={labelSt}>Simu</label>
          <input value={form.sellerPhone} onChange={e => set("sellerPhone", e.target.value)} placeholder="0712345678" style={inputSt} onFocus={e => e.target.style.borderColor = G} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"} />
        </div>
      </div>

      <div>
        <label style={labelSt}>Mahali (Location)</label>
        <input value={form.sellerLocation} onChange={e => set("sellerLocation", e.target.value)} placeholder="e.g. Dar es Salaam, Kariakoo" style={inputSt} onFocus={e => e.target.style.borderColor = G} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <div>
          <label style={labelSt}>Instagram</label>
          <input value={form.sellerInstagram} onChange={e => set("sellerInstagram", e.target.value)} placeholder="@username or URL" style={inputSt} onFocus={e => e.target.style.borderColor = G} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"} />
        </div>
        <div>
          <label style={labelSt}>Facebook</label>
          <input value={form.sellerFacebook} onChange={e => set("sellerFacebook", e.target.value)} placeholder="@page or URL" style={inputSt} onFocus={e => e.target.style.borderColor = G} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"} />
        </div>
        <div>
          <label style={labelSt}>TikTok</label>
          <input value={form.sellerTikTok} onChange={e => set("sellerTikTok", e.target.value)} placeholder="@username" style={inputSt} onFocus={e => e.target.style.borderColor = G} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"} />
        </div>
      </div>

      <div>
        <label style={labelSt}>Maelezo ya Duka (Description)</label>
        <textarea
          value={form.sellerDescription}
          onChange={e => set("sellerDescription", e.target.value)}
          placeholder="Elezea biashara yako, bidhaa unazouza, n.k."
          style={{ ...inputSt, height: 90, resize: "none", paddingTop: 12 }}
          onFocus={e => e.target.style.borderColor = G}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{ height: 46, borderRadius: 12, border: "none", background: saved ? "#22c55e" : G, color: "#000", fontWeight: 900, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? .6 : 1, transition: "background .3s" }}
      >
        {saving ? "Inahifadhi..." : saved ? "✅ Imehifadhiwa!" : "Hifadhi Profile"}
      </button>
    </div>
  );
}

function SellerProductForm({ initial, onSave, onCancel }) {
  const { extraSubcategories } = useMarketplaceExtra();
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    discountPrice: "",
    category: "",
    images: initial?.imageUrl && !initial?.images ? [initial.imageUrl] : [],
    condition: "New",
    location: "",
    whatsappNumber: "",
    socialLink: "",
    imageFit: "cover",
    imagePositionX: 50,
    imagePositionY: 50,
    imageZoom: 1,
    variants: initial?.variants || [],
    ...initial
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) return;
    onSave({ ...form, ...normalizeTzProductImageDisplay(form) });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
      {/* Name */}
      <Field label="Jina la Bidhaa *">
        <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Mfano: iPhone 15 Pro" required />
      </Field>
      
      {/* Price & Category */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Bei (Tsh) *">
          <Input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="250000" required />
        </Field>
        <Field label="Kategoria *">
          <Select value={form.category} onChange={e => setForm({...form, category: e.target.value})} required>
            <option value="">Chagua...</option>
            {Object.values(MARKET_CATEGORIES).map(c => (
              <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
            ))}
          </Select>
        </Field>
      </div>
      
      {/* Subcategory */}
      {(MARKET_CATEGORIES[form.category]?.subcategories?.length > 0 || extraSubcategories[form.category]?.length > 0) && (
        <Field label="Subcategory">
          <Select value={form.subcategory} onChange={e => setForm({...form, subcategory: e.target.value})}>
            <option value="">Yote / General</option>
            {MARKET_CATEGORIES[form.category]?.subcategories?.map(s => <option key={s} value={s}>{s}</option>)}
            {extraSubcategories[form.category]?.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Bei ya Punguzo (Tsh) [Optional]">
          <Input type="number" value={form.discountPrice} onChange={e => setForm({...form, discountPrice: e.target.value})} placeholder="Optional" />
        </Field>
        <Field label="Hali ya Bidhaa (Condition)">
          <Select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})}>
            <option value="New">New</option>
            <option value="Used">Used</option>
            <option value="Refurbished">Refurbished</option>
          </Select>
        </Field>
      </div>

      {/* Images */}
      <ImagesField value={form.images} onChange={v => setForm({...form, images: v})} />

      {/* Variants Editor */}
      <div style={{ background: "rgba(255,255,255,.02)", borderRadius: 10, padding: 14, border: "1px solid rgba(255,255,255,.05)" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.45)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
          Product Variants (Colors, Sizes, etc)
        </div>
        <VariantEditor 
          variants={form.variants || []} 
          onChange={v => setForm({...form, variants: v})}
        />
      </div>

      <div style={{ background: "rgba(255,255,255,.02)", borderRadius: 10, padding: 14, border: "1px solid rgba(255,255,255,.05)" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.45)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
          Mwonekano wa picha (ukurasa wa bidhaa)
        </div>
        <TanzaniaMarketplaceImageEditorTrigger
          imageUrl={form.images?.[0] || ""}
          value={form}
          disabled={!form.images?.length}
          onApply={(d) => setForm((f) => ({ ...f, ...d }))}
        />
      </div>

      {/* Payment Details */}
      <div style={{ background: "rgba(255,255,255,.02)", borderRadius: 10, padding: 14, border: "1px solid rgba(255,255,255,.05)", display: "grid", gap: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: ".07em" }}>Maelezo ya Malipo (Seller Payment Info)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="M-Pesa Number">
            <Input value={form.payment_mpesa} onChange={e => setForm({...form, payment_mpesa: e.target.value})} placeholder="07..." />
          </Field>
          <Field label="Tigo Pesa Number">
            <Input value={form.payment_tigo} onChange={e => setForm({...form, payment_tigo: e.target.value})} placeholder="06..." />
          </Field>
          <Field label="Airtel Money Number">
            <Input value={form.payment_airtel} onChange={e => setForm({...form, payment_airtel: e.target.value})} placeholder="07..." />
          </Field>
          <Field label="Lipa Namba">
            <Input value={form.payment_lipa} onChange={e => setForm({...form, payment_lipa: e.target.value})} placeholder="Lipa No / Jina la muuzaji" />
          </Field>
        </div>
        <Field label="Bank Details (Bank, Account No, Name)">
          <Input value={form.payment_bank} onChange={e => setForm({...form, payment_bank: e.target.value})} placeholder="CRDB, 015..., JINA LAKO" />
        </Field>
      </div>

      {/* Social & Contact */}
      <div style={{ background: "rgba(255,255,255,.02)", borderRadius: 10, padding: 14, border: "1px solid rgba(255,255,255,.05)", display: "grid", gap: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: ".07em" }}>Mawasiliano na Eneo</div>
        <Field label="Eneo (Location)">
          <Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Mfano: Dar es Salaam, Kariakoo" />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="WhatsApp Number (Optional)">
            <Input value={form.whatsappNumber} onChange={e => setForm({...form, whatsappNumber: e.target.value})} placeholder="2557..." />
          </Field>
          <Field label="Social Media Link (Optional)">
            <Input value={form.socialLink} onChange={e => setForm({...form, socialLink: e.target.value})} placeholder="Instagram / TikTok / FB Link" />
          </Field>
          <Field label="Working Hours (Optional)">
            <Input value={form.workingHours} onChange={e => setForm({...form, workingHours: e.target.value})} placeholder="7:00 AM - 10:00 PM" />
          </Field>
        </div>
      </div>

      <Field label="Maelezo (Description)">
        <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Elezea bidhaa yako..." />
      </Field>

      {/* Phase 5: Colors field */}
      <Field label="Rangi / Colors (Optional)">
        <Input
          value={Array.isArray(form.colors) ? form.colors.join(", ") : (form.colors || "")}
          onChange={e => {
            const arr = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
            setForm({...form, colors: arr.length > 0 ? arr : []});
          }}
          placeholder="e.g. Black, White, Gold (separate with commas)"
        />
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginTop: 4, paddingLeft: 4 }}>Leave empty to hide color selector for buyers.</div>
      </Field>

      {/* Preview Section */}
      <div style={{ background: "rgba(255,255,255,.02)", borderRadius: 10, padding: 14, border: "1px solid rgba(255,255,255,.05)", display: "grid", gap: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: ".07em" }}>Product Preview</div>
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0" }}>
          <ShopProductCard product={form} onClick={() => {}} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <Btn type="submit" disabled={!form.name || !form.category || !form.price} style={{ flex: 1, height: 50, fontSize: 15, opacity: (!form.name || !form.category || !form.price) ? .5 : 1 }}>
          {initial ? "Hifadhi Mabadiliko" : "Ongeza Bidhaa"}
        </Btn>
        <Btn onClick={onCancel} color="rgba(255,255,255,.05)" textColor="#fff" style={{ height: 50, padding: "0 24px" }}>Acha</Btn>
      </div>
    </form>
  );
}
