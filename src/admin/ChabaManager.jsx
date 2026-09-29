import React, { useState, useEffect } from "react";
import { 
    getFirebaseDb, collection, onSnapshot, query, setDoc, doc, deleteDoc, updateDoc, addDoc, serverTimestamp, where, orderBy 
} from "../firebase.js";
import { useMobile } from "../hooks/useMobile.js";
import { Trash, Edit2, Plus, PlusCircle, MinusCircle, FileDown } from "lucide-react";
import { StorageMediaField } from "./AdminUI.jsx";
import { CHINA_MARKET_CATEGORIES } from "../constants/marketplace.js";
import { orderService } from "../services/orderService.js";
import VariantEditor from "./VariantEditor.jsx";

function PaymentManager({ showToast }) {
  const [methods, setMethods] = useState([]);
  const [name, setName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [instructions, setInstructions] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const db = getFirebaseDb();
    const unsub = onSnapshot(collection(db, "chaba_payment_methods"), snap => {
        setMethods(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => {
        console.error("Firestore error (chaba_payment_methods):", err);
    });
    return unsub;
  }, []);

  const handleAdd = async () => {
    if (!name || !accountNumber) return;
    try {
        setLoading(true);
        const db = getFirebaseDb();
        await addDoc(collection(db, "chaba_payment_methods"), { 
            name, 
            accountNumber,
            instructions,
            qrCodeUrl,
            active: true,
            createdAt: Date.now()
        });
        setName(""); setAccountNumber(""); setInstructions(""); setQrCodeUrl("");
        showToast("Njia ya malipo imeongezwa!");
    } catch (e) {
        showToast("Imeshindwa: " + e.message, "error");
    } finally {
        setLoading(false);
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
        setLoading(true);
        const db = getFirebaseDb();
        await updateDoc(doc(db, "chaba_payment_methods", id), { active: !currentStatus });
    } catch (e) {
        showToast("Imeshindwa kusasisha hali", "error");
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Futa njia hii ya malipo?")) return;
    try {
        setLoading(true);
        const db = getFirebaseDb();
        await deleteDoc(doc(db, "chaba_payment_methods", id));
        showToast("Njia ya malipo imefutwa!");
    } catch (e) {
        showToast("Imeshindwa kufuta", "error");
    } finally {
        setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, background: "rgba(255,255,255,.02)", borderRadius: 12, border: `1px solid ${BORDER}` }}>
      <h3 style={{ margin: "0 0 16px" }}>Manage Payment Methods</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <input style={{ ...inputStyle, marginBottom: 0 }} placeholder="Jina (e.g. M-Pesa)" value={name} onChange={e => setName(e.target.value)} />
        <input style={{ ...inputStyle, marginBottom: 0 }} placeholder="Acc Number (e.g. 07xxxx)" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
        <input style={{ ...inputStyle, marginBottom: 0, gridColumn: "span 2" }} placeholder="Instructions (e.g. Make sure to include fee)" value={instructions} onChange={e => setInstructions(e.target.value)} />
        <div style={{ gridColumn: "span 2" }}>
            <StorageMediaField label="QR Code (Optional)" value={qrCodeUrl} onChange={setQrCodeUrl} />
        </div>
        <button onClick={handleAdd} disabled={loading} style={{ 
            height: 44, padding: "0 20px", borderRadius: 8, background: G, border: "none", 
            color: "#000", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
            gridColumn: "span 2"
        }}>Add New Payment Method</button>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {methods.map(m => (
          <div key={m.id} style={{ 
              padding: "12px 16px", borderRadius: 10, background: m.active ? "rgba(245,166,35,.05)" : "rgba(255,255,255,.03)", 
              border: m.active ? `1px solid ${G}30` : "1px solid rgba(255,255,255,.05)", display: "flex", justifyContent: "space-between", alignItems: "center" 
          }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {m.qrCodeUrl && <img src={m.qrCodeUrl} style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }} alt="QR" onClick={() => window.open(m.qrCodeUrl, '_blank')} />}
                <div>
                  <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
                      {m.name}
                      <span style={{ 
                          fontSize: 9, padding: "2px 6px", borderRadius: 4, 
                          background: m.active ? G : "rgba(255,255,255,.1)", 
                          color: m.active ? "#000" : "rgba(255,255,255,.5)" 
                      }}>
                          {m.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)" }}>{m.accountNumber} {m.instructions && `• ${m.instructions}`}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => toggleActive(m.id, m.active)} style={{ background: "rgba(255,255,255,.05)", border: "none", color: "white", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                    {m.active ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => handleDelete(m.id)} style={{ background: "rgba(239,68,68,.1)", border: "none", color: "#ef4444", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Delete</button>
              </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const BORDER = "rgba(255,255,255,0.06)";
const G = "#F5A623";
const CATEGORIES = Object.values(CHINA_MARKET_CATEGORIES).map(c => c.label);
const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 700,
  color: "rgba(255,255,255,.6)",
  marginBottom: 8,
};

const inputStyle = {
  width: "100%",
  height: 44,
  borderRadius: 8,
  border: `1px solid ${BORDER}`,
  background: "rgba(255,255,255,.02)",
  color: "#fff",
  padding: "0 12px",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  marginBottom: 16,
};

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
    <div
      style={{
        background: "rgba(255,255,255,.02)",
        padding: 14,
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,.05)",
        marginBottom: 16,
      }}
    >
      <label style={labelStyle}>Product Images (Upload)</label>
      <div
        style={{
          display: "grid",
          gap: 8,
          marginBottom: images.length > 0 ? 12 : 0,
        }}
      >
        {images.map((imgUrl, i) => (
          <div
            key={i}
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <div style={{ flex: 1 }}>
              <StorageMediaField
                value={imgUrl}
                onChange={(url) => handleUpdate(i, url)}
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemove(i)}
              style={{
                background: "rgba(239,68,68,.1)",
                border: "none",
                color: "#ef4444",
                borderRadius: 8,
                width: 44,
                height: 44,
                cursor: "pointer",
                flexShrink: 0,
              }}
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
      <div
        style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 6 }}
      >
        First image will be used as the thumbnail. Max 10 images.
      </div>
    </div>
  );
}

export default function ChabaManager() {
  const isMobile = useMobile();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("products");

  const initForm = {
    id: "",
    name: "",
    price: "",
    airPrice: "",
    category: "Electronics",
    description: "",
    images: [],
    estimatedDelivery: "",
    transportOptions: ["sea"],
    bulkPrices: [],
    variants: [],
    groupPrice: "",
    groupMinQty: 2,
    isFlashSale: false,
    isTrending: false,
    flashSaleEnd: "",
    productType: "single", // "single" or "bulk"
    minQty: 1,
    stepQty: 1,
    hasSafariOption: false,
    inStock: true,
  };

  const [form, setForm] = useState(initForm);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const db = getFirebaseDb();
    const unsubP = onSnapshot(
      query(collection(db, "chaba_products")),
      (snap) => {
        setProducts(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              ...data,
              id: d.id, // Explicitly set ID last to prevent overwrite
              productType: data.productType || "single",
              minQty: data.minQty || 1,
              stepQty: data.stepQty || 1,
            };
          }),
        );
      },
      (err) => console.error("Firestore error (chaba_products):", err)
    );
    const unsubO = onSnapshot(
      query(collection(db, "chaba_orders")),
      (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => console.error("Firestore error (chaba_orders):", err)
    );
    return () => {
      unsubP();
      unsubO();
    };
  }, []);

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (loading) return;
    setLoading(true);

    // Check for duplicates
    const nameExists = products.some(p => p.name.toLowerCase() === form.name.trim().toLowerCase() && p.id !== form.id);
    if (nameExists) {
        showToast("Bidhaa yenye jina hili tayari inapatikana!", "error");
        return;
    }

    try {
      setLoading(true);
      const db = getFirebaseDb();

      const docId = form.id || `cp_${Date.now()}`;
      await setDoc(
        doc(db, "chaba_products", docId),
        {
          name: form.name.trim(),
          price: Number(form.price),
          base_price: Number(form.price),
          air_price: Number(form.airPrice) || 0,
          category: form.category,
          description: form.description,
          images: form.images || [],
          imageUrl: form.images?.[0] || "",
          estimatedDelivery: form.estimatedDelivery,
          bulk_prices: form.bulkPrices.map((b) => ({
            quantity: Number(b.quantity),
            price: Number(b.price),
          })),
          variants: form.variants || [],
          groupPrice: Number(form.groupPrice) || 0,
          groupMinQty: Number(form.groupMinQty) || 2,
          isFlashSale: !!form.isFlashSale,
          isTrending: !!form.isTrending,
          flashSaleEnd: form.flashSaleEnd || "",
          transportOptions: form.transportOptions,
          shipping_options: form.transportOptions,
          productType: form.productType,
          minQty: Number(form.minQty),
          stepQty: Number(form.stepQty),
          hasSafariOption: !!form.hasSafariOption,
          inStock: form.inStock === undefined ? true : !!form.inStock,
          updatedAt: Date.now(),
        },
        { merge: true },
      );

      setIsEditing(false);
      setForm({ ...initForm });
      showToast(form.id ? "Bidhaa imesasishwa!" : "Bidhaa imeongezwa!");
    } catch (err) {
      console.error(err);
      showToast("Imeshindikana: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (loading) return;
    if (!window.confirm("Je, unahakika unataka kufuta bidhaa hii?")) return;

    try {
      setLoading(true);
      await deleteDoc(doc(getFirebaseDb(), "chaba_products", id));
      showToast("Bidhaa imefutwa!");
    } catch (e) {
      console.error(e);
      showToast("Haikufanikiwa kufuta: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleTransport = (t) => {
    setForm((f) => ({
      ...f,
      transportOptions: f.transportOptions.includes(t)
        ? f.transportOptions.filter((x) => x !== t)
        : [...f.transportOptions, t],
    }));
  };

  const addBulkTier = () => {
    setForm((f) => ({
      ...f,
      bulkPrices: [...f.bulkPrices, { quantity: 0, price: 0 }],
    }));
  };

  const updateBulkTier = (idx, field, val) => {
    setForm((f) => {
      const newB = [...f.bulkPrices];
      newB[idx][field] = val;
      return { ...f, bulkPrices: newB };
    });
  };

  const removeBulkTier = (idx) => {
    setForm((f) => {
      const newB = [...f.bulkPrices];
      newB.splice(idx, 1);
      return { ...f, bulkPrices: newB };
    });
  };


  const ORDER_STATUSES = [
    { id: "pending", label: "Pending", color: "#666" },
    { id: "payment_verified", label: "Payment Verified", color: "#3498db" },
    { id: "processing", label: "Processing", color: "#9b59b6" },
    { id: "shipped_china", label: "Shipped from China", color: "#e67e22" },
    { id: "arrived_tz", label: "Arrived in TZ", color: "#F5A623" },
    { id: "delivered", label: "Delivered", color: "#22c55e" },
    { id: "payment_rejected", label: "Payment Rejected", color: "#ff4757" }
  ];

  const updateOrder = async (orderId, updates) => {
    if (loading) return;
    try {
      setLoading(true);
      const db = getFirebaseDb();
      await updateDoc(doc(db, "chaba_orders", orderId), {
        ...updates,
        // eslint-disable-next-line react-hooks/purity
        updatedAt: Date.now()
      });
      showToast("Oda imesasishwa!");
    } catch (e) {
      showToast("Imeshindwa kusasisha oda", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    await updateOrder(orderId, { status: newStatus });
  };

  const [productSearch, setProductSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const getEarnings = () => {
    const approvedOrders = orders.filter(o => o.status === 'approved');
    const total = approvedOrders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
    return total;
  };

  const filteredOrders = orders
    .filter(o => {
        const matchesSearch = 
            o.orderId?.toLowerCase().includes(orderSearch.toLowerCase()) || 
            o.userName?.toLowerCase().includes(orderSearch.toLowerCase()) ||
            o.transactionId?.toLowerCase().includes(orderSearch.toLowerCase());
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchesSearch && matchesStatus;
    })
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  return (
    <div style={{ padding: 16 }}>
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          padding: "13px 20px", borderRadius: 12, fontWeight: 700, fontSize: 13,
          background: toast.type === "error" ? "rgba(239,68,68,.95)" : "rgba(0,196,140,.95)",
          color: "#fff", boxShadow: "0 12px 32px rgba(0,0,0,.4)",
          animation: "slideUp .3s ease"
        }}>
          {toast.type === "error" ? "❌" : "✅"} {toast.msg}
        </div>
      )}
      <style>{`@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
      
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 24,
          borderBottom: `1px solid ${BORDER}`,
          paddingBottom: 16,
        }}
      >
        <button
          onClick={() => setActiveTab("products")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: activeTab === "products" ? G : "transparent",
            color: activeTab === "products" ? "#000" : "#fff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Products ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: activeTab === "orders" ? G : "transparent",
            color: activeTab === "orders" ? "#000" : "#fff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: activeTab === "payments" ? G : "transparent",
            color: activeTab === "payments" ? "#000" : "#fff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Payment Methods
        </button>
      </div>

      {activeTab === "payments" && (
        <PaymentManager showToast={showToast} />
      )}

      {activeTab === "orders" && (
        <div style={{ display: "grid", gap: 20 }}>
          {/* Earnings Stats */}
          <div style={{ 
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, 
              background: "rgba(255,166,35,.05)", padding: 20, borderRadius: 16, border: `1px solid ${G}20` 
          }}>
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginBottom: 4 }}>Total Earnings (Approved)</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: G }}>Tsh {getEarnings().toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginBottom: 4 }}>Pending Orders</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>{orders.filter(o => o.status === 'pending').length}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginBottom: 4 }}>Total Orders</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>{orders.length}</div>
              </div>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 12 }}>
            <input 
                placeholder="Search by Order ID, Name or TXID..."
                style={{ ...inputStyle, marginBottom: 0, flex: 3 }}
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
            />
            <select 
                style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
            >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved (Paid)</option>
                <option value="dispatched">Dispatched</option>
                <option value="delivered">Delivered</option>
                <option value="rejected">Rejected</option>
            </select>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {filteredOrders.map((o) => (
              <div key={o.id} style={{ 
                  padding: 20, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.02)",
                  display: "grid", gap: 16
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: G }}>#{o.orderId}</span>
                        <span style={{ 
                            fontSize: 10, padding: "2px 8px", borderRadius: 100, fontWeight: 800,
                            background: `${(ORDER_STATUSES.find(s => s.id === (o.status || 'pending')) || ORDER_STATUSES[0]).color}20`,
                            color: (ORDER_STATUSES.find(s => s.id === (o.status || 'pending')) || ORDER_STATUSES[0]).color
                        }}>
                            {(ORDER_STATUSES.find(s => s.id === (o.status || 'pending')) || ORDER_STATUSES[0]).label.toUpperCase()}
                        </span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{o.productName} (x{o.quantity})</div>
                    <div style={{ fontSize: 13, opacity: 0.5 }}>{o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString() : 'Just now'}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 900 }}>Tsh {Number(o.totalPrice || 0).toLocaleString()}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>Paid via {o.paymentMethod}</div>
                    {o.paymentVerified && <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 800 }}>✓ MALIPO YAMETHIBITISHWA</div>}
                  </div>
                </div>

                <div style={{ 
                    display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, padding: 12, borderRadius: 8, background: "rgba(255,255,255,.03)" 
                }}>
                    <div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 4 }}>CUSTOMER INFO</div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{o.userName || o.customerName}</div>
                        <div style={{ fontSize: 13 }}>📞 {o.userPhone || o.customerPhone}</div>
                        <div style={{ fontSize: 13 }}>💬 {o.userWhatsapp}</div>
                        <div style={{ fontSize: 13, marginTop: 4 }}>📍 {o.deliveryArea || o.region}</div>
                    </div>
                    <div style={{ borderLeft: isMobile ? "none" : `1px solid ${BORDER}`, paddingLeft: isMobile ? 0 : 16, borderTop: isMobile ? `1px solid ${BORDER}` : "none", paddingTop: isMobile ? 16 : 0 }}>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 4 }}>PAYMENT & LOGISTICS</div>
                        <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "monospace", color: G }}>TX: {o.transactionId || o.paymentId}</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>Usafiri: <span style={{ fontWeight: 700 }}>{o.transport === "sea" ? "Meli (30-45 Siku)" : "Ndege (7-14 Siku)"}</span></div>
                        
                        <div style={{ marginTop: 12 }}>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 4 }}>CHINA TRACKING / WAYBILL</div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <input 
                                    defaultValue={o.trackingNumber || ""}
                                    placeholder="Enter Waybill #"
                                    style={{ ...inputStyle, height: 32, fontSize: 12, marginBottom: 0, flex: 1 }}
                                    onBlur={(e) => updateOrder(o.id, { trackingNumber: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ flex: 1, minWidth: 140 }}>
                        <select 
                            value={ORDER_STATUSES.some(s => s.id === o.status) ? (o.status || "pending") : "pending"}
                            onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                            style={{ ...inputStyle, height: 40, marginBottom: 0, fontSize: 13, fontWeight: 700 }}
                        >
                            {ORDER_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                    </div>

                    {o.proofUrl && (
                      <a href={o.proofUrl} target="_blank" rel="noreferrer" title="Click to enlarge proof">
                        <img src={o.proofUrl} alt="Proof" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", border: `2px solid ${G}30` }} />
                      </a>
                    )}

                    {!o.paymentVerified && (
                        <>
                            <button 
                                onClick={() => updateOrder(o.id, { paymentVerified: true, status: "payment_verified" })}
                                style={{ 
                                    flex: 1, height: 40, borderRadius: 8, background: "#22c55e", border: "none", 
                                    color: "#fff", fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap"
                                }}
                            >
                                ✅ Thibitisha Malipo
                            </button>
                            <button 
                                onClick={() => updateOrder(o.id, { paymentVerified: false, status: "payment_rejected" })}
                                style={{ 
                                    height: 40, padding: "0 12px", borderRadius: 8, background: "rgba(255,71,87,.1)", border: "1px solid rgba(255,71,87,0.2)", 
                                    color: "#ff4757", fontWeight: 800, cursor: "pointer" 
                                }}
                            >
                                ❌ Kataa
                            </button>
                        </>
                    )}
                    
                    <button 
                        type="button"
                        onClick={() => {
                            const customerPhone = (o.userWhatsapp || o.customerPhone || o.userPhone || "").replace(/\+/g, '').replace(/^0/, '255');
                            const statusLabel = ORDER_STATUSES.find(s => s.id === (o.status || 'pending'))?.label || o.status || 'Pending';
                            const msg = `Habari ${o.userName || o.customerName},\n\nOda yako #${o.orderId} (${o.productName}) sasa ipo katika hali ya: *${statusLabel}*.\n\n${o.trackingNumber ? `Namba ya Tracking: ${o.trackingNumber}` : ""}\n\nAgiza China - Tuwasiliane kwa maswali zaidi.`;
                            window.open(`https://wa.me/${customerPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        style={{ 
                            height: 40, padding: "0 16px", borderRadius: 8, background: "rgba(37,211,102,.1)", border: "none", 
                            color: "#25d366", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 
                        }}
                    >
                        💬 WhatsApp Mteja
                    </button>
                    <button
                        type="button"
                        onClick={() => window.open(`/track-order?id=${encodeURIComponent(o.orderId || "")}`, "_blank", "noopener,noreferrer")}
                        style={{
                          height: 40, padding: "0 16px", borderRadius: 8, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)",
                          color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 12
                        }}
                    >
                        Angalia oda
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                          try {
                            orderService.downloadReceipt({
                              orderId: o.orderId,
                              customerName: o.customerName || o.userName,
                              customerPhone: o.customerPhone || o.userPhone,
                              location: o.region || o.deliveryArea || "",
                              productName: o.productName || o.items?.[0]?.name,
                              quantity: o.quantity || 1,
                              unitPrice: o.items?.[0]?.unitPrice || 0,
                              totalPrice: Number(o.totalPrice) || 0,
                              paymentMethod: o.paymentMethod,
                              items: o.items,
                            });
                          } catch (e) {
                            console.error(e);
                            showToast("Haiwezi kupakia risiti", "error");
                          }
                        }}
                        style={{
                          height: 40, padding: "0 12px", borderRadius: 8, background: G, border: "none",
                          color: "#000", fontWeight: 800, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6
                        }}
                    >
                        <FileDown size={14} /> Risiti
                    </button>
                    <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm("Delete this Chaba order? Record will be lost.")) {
                            try {
                              await deleteDoc(doc(db, "chaba_orders", o.id));
                              showToast("Oda imefutwa.");
                            } catch(e) { showToast(e.message, "error"); }
                          }
                        }}
                        style={{
                          height: 40, padding: "0 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                          color: "rgba(255,255,255,0.5)", fontWeight: 700, cursor: "pointer", fontSize: 11
                        }}
                    >
                        Delete Order
                    </button>
                    {(o.userId || o.uid) && (
                      <button 
                        onClick={async () => {
                          const uid = o.userId || o.uid;
                          if (window.confirm("CRITICAL: Hii itafuta akaunti ya mteja platform NZIMA. Je, unaendelea?")) {
                            try {
                              await deleteDoc(doc(db, "users", uid));
                              showToast("Akaunti ya mteja imefutwa.");
                            } catch(e) { showToast(e.message, "error"); }
                          }
                        }} 
                        style={{ height: 40, padding: "0 14px", borderRadius: 8, border: "1px solid rgba(239,68,68,.3)", background: "rgba(239,68,68,.1)", color: "#ff4757", fontWeight: 800, fontSize: 11, cursor: "pointer" }}
                      >
                        Delete Platform User
                      </button>
                    )}
                </div>
              </div>
            ))}
            {orders.length === 0 && <div style={{ textAlign: "center", padding: 40, opacity: 0.5 }}>No orders yet.</div>}
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <>
          {!isEditing ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 12 }}>
                <button
                  onClick={() => {
                    setForm({ ...initForm });
                    setIsEditing(true);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 20px",
                    borderRadius: 8,
                    background: G,
                    border: "none",
                    color: "#000",
                    fontWeight: 800,
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  <Plus size={18} /> Add Product
                </button>
                <input 
                  placeholder="Search products..."
                  style={{ ...inputStyle, marginBottom: 0, maxWidth: 300 }}
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                {products.length === 0 && <div style={{ color: "white", opacity: 0.5 }}>No products found.</div>}
                {products
                  .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                  .map((p) => (
                  <div
                    key={p.id}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      border: `1px solid ${BORDER}`,
                      background: "rgba(255,255,255,.02)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{ display: "flex", gap: 16, alignItems: "center" }}
                    >
                      <img
                        src={p.images?.[0] || p.imageUrl}
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 8,
                          objectFit: "cover",
                          background: "#000",
                        }}
                        alt=""
                      />
                      <div>
                        <h3
                          style={{
                            margin: "0 0 4px",
                            fontSize: 16,
                            fontWeight: 800,
                          }}
                        >
                          {p.name}
                        </h3>
                        <div
                          style={{
                            fontSize: 13,
                            color: "rgba(255,255,255,.5)",
                          }}
                        >
                          Tsh {Number(p.base_price || p.price).toLocaleString()} • {p.category}
                        </div>
                        {p.air_price > 0 && (
                          <div style={{ fontSize: 12, color: G, marginTop: 2, fontWeight: 700 }}>
                            Air Price: Tsh {Number(p.air_price).toLocaleString()}
                          </div>
                        )}
                        {p.inStock === false && (
                          <div style={{ fontSize: 11, color: "#ff4757", fontWeight: 800, marginTop: 4 }}>
                            OUT OF STOCK
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => {
                          setForm({
                            ...initForm,
                            ...p,
                            images: p.images || (p.imageUrl ? [p.imageUrl] : []),
                            bulkPrices: p.bulk_prices || [],
                          });
                          setIsEditing(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={{
                          background: "rgba(255,255,255,.05)",
                          border: "1px solid rgba(255,255,255,.1)",
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          color: "#fff",
                          cursor: "pointer",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleDelete(p.id)}
                        style={{
                          background: "rgba(255,71,87,.1)",
                          border: "1px solid rgba(255,71,87,0.2)",
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          color: "#ff4757",
                          cursor: "pointer",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSave}
              style={{ maxWidth: 800, display: "grid", gap: 20 }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{
                    background: "rgba(255,255,255,.05)",
                    border: "none",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 700
                  }}
                >
                  ← Back to List
                </button>
                <h3 style={{ margin: 0 }}>
                  {form.id ? "Edit Product" : "New Agiza China Product"}
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Product Name</label>
                  <input
                    required
                    style={inputStyle}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Price (Sea)</label>
                    <input
                      required
                      type="number"
                      style={inputStyle}
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Air Price (Opt)</label>
                    <input
                      type="number"
                      style={inputStyle}
                      value={form.airPrice || ""}
                      onChange={(e) => setForm({ ...form, airPrice: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 16,
                }}
              >
                <div>
                  <label style={labelStyle}>Product Type</label>
                  <select
                    style={inputStyle}
                    value={form.productType}
                    onChange={(e) =>
                      setForm({ ...form, productType: e.target.value })
                    }
                  >
                    <option value="single">Single (Unit)</option>
                    <option value="bulk">Bulk (Carton)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Min Quantity</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={form.minQty}
                    onChange={(e) =>
                      setForm({ ...form, minQty: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label style={labelStyle}>Step Quantity</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={form.stepQty}
                    onChange={(e) =>
                      setForm({ ...form, stepQty: e.target.value })
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div>
                  <label style={labelStyle}>Category</label>
                  <select
                    style={inputStyle}
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>
                    Estimated Delivery (e.g., Siku 15-20)
                  </label>
                  <input
                    style={inputStyle}
                    value={form.estimatedDelivery}
                    onChange={(e) =>
                      setForm({ ...form, estimatedDelivery: e.target.value })
                    }
                  />
                </div>
              </div>

              <ImagesField
                value={form.images}
                onChange={(val) => setForm((f) => ({ ...f, images: val }))}
              />

              <div>
                <label style={labelStyle}>Transport Options</label>
                <div style={{ display: "flex", gap: 16 }}>
                  <label
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <input
                      type="checkbox"
                      checked={form.transportOptions.includes("sea")}
                      onChange={() => toggleTransport("sea")}
                    />{" "}
                    Sea (Ship)
                  </label>
                  <label
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <input
                      type="checkbox"
                      checked={form.transportOptions.includes("air")}
                      onChange={() => toggleTransport("air")}
                    />{" "}
                    Air (Ndege)
                  </label>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Bulk Pricing Tiers</label>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  {form.bulkPrices.map((b, i) => (
                    <div
                      key={i}
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <input
                        type="number"
                        placeholder="Min Qty"
                        style={{ ...inputStyle, flex: 1 }}
                        value={b.quantity}
                        onChange={(e) =>
                          updateBulkTier(i, "quantity", e.target.value)
                        }
                      />
                      <input
                        type="number"
                        placeholder="Price/Unit (Tsh)"
                        style={{ ...inputStyle, flex: 2 }}
                        value={b.price}
                        onChange={(e) =>
                          updateBulkTier(i, "price", e.target.value)
                        }
                      />
                      <button
                        type="button"
                        onClick={() => removeBulkTier(i)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#ff4757",
                          cursor: "pointer",
                          padding: 8,
                        }}
                      >
                        <MinusCircle size={20} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addBulkTier}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(255,255,255,.05)",
                    border: `1px dashed ${BORDER}`,
                    color: "#fff",
                    padding: "8px 16px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  <PlusCircle size={16} /> Add Bulk Tier
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 16,
                  padding: 16,
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 12,
                  border: "1px solid rgba(255,166,35,0.1)"
                }}
              >
                <div>
                  <label style={labelStyle}>Group Buy Price</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={form.groupPrice}
                    onChange={(e) => setForm({ ...form, groupPrice: e.target.value })}
                    placeholder="Bei ya kikundi"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Group Min Qty</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={form.groupMinQty}
                    onChange={(e) => setForm({ ...form, groupMinQty: e.target.value })}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, justifyContent: "center" }}>
                   <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                      <input type="checkbox" checked={form.isFlashSale} onChange={e => setForm({...form, isFlashSale: e.target.checked})} />
                      Flash Sale ⚡
                   </label>
                   <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                      <input type="checkbox" checked={form.isTrending} onChange={e => setForm({...form, isTrending: e.target.checked})} />
                      Trending 🔥
                   </label>
                   <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: G }}>
                      <input type="checkbox" checked={form.inStock === undefined ? true : form.inStock} onChange={e => setForm({...form, inStock: e.target.checked})} />
                      In Stock ✅
                   </label>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Flash Sale End Time (Optional)</label>
                <input
                  type="datetime-local"
                  style={inputStyle}
                  value={form.flashSaleEnd}
                  onChange={(e) => setForm({ ...form, flashSaleEnd: e.target.value })}
                />
              </div>

              <div>
                <label style={labelStyle}>Product Variants (Colors, Sizes, etc.)</label>
                <div style={{ marginBottom: 16 }}>
                   <VariantEditor 
                      variants={form.variants || []} 
                      onChange={v => setForm({...form, variants: v})}
                   />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  required
                  style={{
                    ...inputStyle,
                    height: 100,
                    padding: 12,
                    resize: "none",
                  }}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <input
                  type="checkbox"
                  checked={form.hasSafariOption}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      hasSafariOption: e.target.checked,
                    }))
                  }
                  id="safari-option-chaba"
                />
                <label
                  htmlFor="safari-option-chaba"
                  style={{
                    fontSize: 14,
                    cursor: "pointer",
                    color: G,
                    fontWeight: 700,
                  }}
                >
                  Enable "Book Your Safari" Button
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  height: 48,
                  borderRadius: 8,
                  background: loading ? "rgba(255,255,255,0.1)" : G,
                  color: loading ? "rgba(255,255,255,0.3)" : "#000",
                  fontWeight: 800,
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  marginTop: 16,
                }}
              >
                {loading ? "Saving..." : "Save Product"}
              </button>
            </form>
          )}
        </>
      )}

    </div>
  );
}
