import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ShoppingCart, CheckCircle, ChevronLeft, ChevronRight, Truck, Plane } from "lucide-react";
import { useMobile } from "../hooks/useMobile.js";
import { orderService } from "../services/orderService.js";
import { auth, getFirebaseDb, onAuthStateChanged, doc, getDoc, storage, ref, uploadBytes, getDownloadURL, uploadToStorage } from "../firebase.js";

const G = "#F5A623";
const WHATSAPP_NUMBER = "255757053354";

const stepVariants = {
  enter: { opacity: 0, x: 28 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export default function ChabaCheckoutPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMobile();
  const formRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  /** 1 = Bidhaa, 2 = Taarifa (form), 3 = Thibitisha (success) */
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [lastOrderId, setLastOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    region: "",
    address: "",
    quantity: location.state?.qty || 1,
    selectedColor: "",
    notes: location.state?.extraInfo || "",
    paymentId: "",
    proofFile: null,
    proofUrl: "",
  });
  const [errors, setErrors] = useState({});

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const db = getFirebaseDb();
    const load = async () => {
      if (!db || !productId) {
        setProduct(null);
        setLoadingProduct(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "chaba_products", productId));
        if (snap.exists()) {
          const data = snap.data();
          setProduct({ id: snap.id, ...data });
          setForm(prev => ({
            ...prev,
            quantity: prev.quantity || Number(data.minQty) || 1,
          }));
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error("Error loading product:", err);
        setProduct(null);
      } finally {
        setLoadingProduct(false);
      }
    };
    load();
  }, [productId]);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [checkoutStep, productId]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (user) {
        setForm(prev => ({
          ...prev,
          customerName: prev.customerName || user.displayName || "",
          customerPhone: prev.customerPhone || user.phoneNumber || "",
        }));
      }
    });
    return () => unsub();
  }, []);

  const images = product
    ? product.images?.length > 0
      ? product.images
      : product.imageUrl
      ? [product.imageUrl]
      : product.image
      ? [product.image]
      : []
    : [];

  const basePrice = product ? product.base_price || product.price || 0 : 0;
  const airPrice = product ? product.air_price || 0 : 0;
  const rawColors = product?.colors || product?.variants || [];
  const colorList = (Array.isArray(rawColors) ? rawColors : [])
    .map((c) => (typeof c === "string" ? c : c?.name || c?.label || String(c?.value ?? "")))
    .filter(Boolean);

  const validate = () => {
    const e = {};
    if (!form.customerName.trim()) e.customerName = "Jina linahitajika";
    if (!form.customerPhone.trim()) {
      e.customerPhone = "Namba ya simu inahitajika";
    } else {
      const clean = form.customerPhone.replace(/[\s\-+]/g, "");
      if (!/^(0[67]\d{8}|255[67]\d{8})$/.test(clean)) {
        e.customerPhone = "Namba si sahihi (lazima iwe ya Tanzania, mfano: 0712345678)";
      }
    }
    if (form.customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail.trim())) {
      e.customerEmail = "Barua pepe si sahihi";
    }
    if (!form.region.trim()) e.region = "Mkoa/Jiji linahitajika";
    const qtyNum = Number(form.quantity);
    if (!qtyNum || qtyNum < 1 || !Number.isFinite(qtyNum))
      e.quantity = "Idadi lazima iwe angalau 1";
    if (!product) e.product = "Bidhaa haijapatikana";
    if (!form.paymentId.trim() && !form.proofFile) e.paymentId = "Transaction ID au Screenshot inahitajika";
    return e;
  };

  const handleWhatsApp = () => {
    const name = product?.name || "bidhaa";
    const msg = `Nataka kuuliza kuhusu bidhaa hii: ${name}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const url = await uploadToStorage(file, `chaba_proofs/${fileName}`);
      if (url) {
        setForm(prev => ({ ...prev, proofUrl: url, proofFile: null }));
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Picha imeshindwa kupakia: " + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleWekaOda = () => {
    setCheckoutStep(2);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 180);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const productImage = images[0] || "";
      const result = await orderService.processOrder({
        type: "chaba_china",
        productId: product.id,
        productName: product.name,
        productImage,
        productPrice: basePrice,
        selectedColor: form.selectedColor,
        quantity: Number(form.quantity) || 1,
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        customerEmail: form.customerEmail.trim(),
        region: form.region.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
        paymentId: form.paymentId.trim(),
        proofUrl: form.proofUrl,
        unitPrice: basePrice,
        totalPrice: basePrice * (Number(form.quantity) || 1),
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      setLastOrderId(result.orderId);
      window._latestOrderData = result.order;
      setCheckoutStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      alert("Tatizo la kutuma oda: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="checkout-page-root" style={{ background: "#05060A", display: "grid", placeItems: "center" }}>
        <motion.div
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.85, ease: "linear" }}
            style={{ width: 44, height: 44, border: "3px solid rgba(245,166,35,0.2)", borderTopColor: G, borderRadius: "50%" }}
          />
          <p style={{ color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>Inapakia bidhaa...</p>
        </motion.div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="checkout-page-root" style={{ background: "#05060A", color: "#fff", padding: 40, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>📦</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Bidhaa Haijapatikana</h2>
        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 32 }}>Samahani, bidhaa unayotafuta haipo au imeondolewa.</p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/chaba")}
          style={{ padding: "14px 32px", borderRadius: 12, background: G, color: "#000", fontWeight: 900, border: "none", cursor: "pointer" }}
        >
          Rudi Agiza China
        </motion.button>
      </div>
    );
  }

  const metaBadge = { padding: "4px 12px", borderRadius: 20, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 700 };
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 6 };
  const inputStyle = { width: "100%", height: 50, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#fff", padding: "0 16px", fontSize: 15, outline: "none", boxSizing: "border-box" };
  const errStyle = { color: "#ff4d4f", fontSize: 12, marginTop: 4, marginBottom: 0, fontWeight: 600 };

  const steps = [
    { n: 1, label: "Bidhaa" },
    { n: 2, label: "Taarifa" },
    { n: 3, label: "Thibitisha" },
  ];

  const cardShell = {
    background: "linear-gradient(145deg, rgba(20,22,35,0.98), rgba(10,12,20,0.98))",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 22,
    boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
  };

  return (
    <div className="checkout-page-root" style={{ background: "#05060A", color: "#fff", paddingBottom: 80 }}>
      <div className="checkout-page-subnav" style={{ background: "rgba(5,6,10,0.92)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 16px 14px 56px", backdropFilter: "blur(12px)" }}>
        <h2 style={{ margin: 0, fontSize: isMobile ? 15 : 17, fontWeight: 900, textAlign: "center" }}>
          Agiza China
        </h2>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 24px" }}>
        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, gap: 8 }}>
          {steps.map((s, i) => {
            const active = checkoutStep === s.n;
            const done = checkoutStep > s.n;
            return (
              <React.Fragment key={s.n}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      margin: "0 auto 6px",
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 13,
                      fontWeight: 900,
                      background: done ? "#22c55e" : active ? G : "rgba(255,255,255,0.08)",
                      color: done || active ? "#000" : "rgba(255,255,255,0.45)",
                      border: active && !done ? `2px solid ${G}` : "2px solid transparent",
                      transition: "background 0.25s ease, color 0.25s ease",
                    }}
                  >
                    {done ? "✓" : s.n}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: active ? G : "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {s.label}
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ flex: 0.35, height: 2, background: checkoutStep > s.n ? G : "rgba(255,255,255,0.08)", borderRadius: 2, marginBottom: 22 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {checkoutStep === 3 ? (
            <motion.div
              key="success"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{ ...cardShell, padding: "32px 22px", textAlign: "center" }}
            >
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(37,211,102,0.1)", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
                <CheckCircle size={40} color="#25d366" />
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 10 }}>Oda Imepokelewa!</h1>
              <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 28, fontSize: 15 }}>
                Oda yako <span style={{ color: G, fontWeight: 900 }}>#{lastOrderId}</span> imehifadhiwa.<br />
                Timu yetu itakusaidia kuhusu malipo na usafiri.
              </p>
              <div style={{ display: "grid", gap: 12 }}>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/track-order?id=" + encodeURIComponent(lastOrderId))}
                  style={{ height: 52, borderRadius: 14, background: "rgba(245,166,35,0.12)", color: G, fontWeight: 900, border: "1px solid rgba(245,166,35,0.35)", cursor: "pointer", fontSize: 15 }}
                >
                  Fuatilia Oda Yako
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/chaba")}
                  style={{ height: 52, borderRadius: 14, background: "rgba(255,255,255,0.05)", color: "#fff", fontWeight: 800, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}
                >
                  Rudi Sokoni
                </motion.button>
              </div>
            </motion.div>
          ) : checkoutStep === 2 ? (
            <motion.div
              key="form-step"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              ref={formRef}
              style={{ ...cardShell, padding: "22px 18px 26px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Jaza Taarifa za Oda</h3>
                <button
                  type="button"
                  onClick={() => setCheckoutStep(1)}
                  style={{ background: "none", border: "none", color: G, fontWeight: 800, fontSize: 13, cursor: "pointer" }}
                >
                  ← Bidhaa
                </button>
              </div>

              <div style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.12)", borderRadius: 14, padding: "12px 14px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                {images[0] && <img src={images[0]} alt="" style={{ width: 56, height: 56, objectFit: "contain", borderRadius: 10, background: "#05060A", flexShrink: 0 }} />}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.35 }}>{product.name}</div>
                  <div style={{ color: G, fontWeight: 900, fontSize: 15, marginTop: 4 }}>
                    {(basePrice * (Number(form.quantity) || 1)).toLocaleString()} TZS
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Jina Kamili *</label>
                  <input placeholder="Andika jina lako kamili" value={form.customerName} onChange={e => setF("customerName", e.target.value)} style={{ ...inputStyle, borderColor: errors.customerName ? "#ff4d4f" : "rgba(255,255,255,0.1)" }} />
                  {errors.customerName && <p style={errStyle}>{errors.customerName}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Simu / WhatsApp *</label>
                  <input type="tel" placeholder="07XXXXXXXX au 255XXXXXXXXX" value={form.customerPhone} onChange={e => setF("customerPhone", e.target.value)} style={{ ...inputStyle, borderColor: errors.customerPhone ? "#ff4d4f" : "rgba(255,255,255,0.1)" }} />
                  {errors.customerPhone && <p style={errStyle}>{errors.customerPhone}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Barua Pepe (si lazima)</label>
                  <input type="email" placeholder="mfano@email.com" value={form.customerEmail} onChange={e => setF("customerEmail", e.target.value)} style={{ ...inputStyle, borderColor: errors.customerEmail ? "#ff4d4f" : "rgba(255,255,255,0.1)" }} />
                  {errors.customerEmail && <p style={errStyle}>{errors.customerEmail}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Mkoa / Jiji *</label>
                  <input placeholder="Mfano: Dar es Salaam, Mwanza..." value={form.region} onChange={e => setF("region", e.target.value)} style={{ ...inputStyle, borderColor: errors.region ? "#ff4d4f" : "rgba(255,255,255,0.1)" }} />
                  {errors.region && <p style={errStyle}>{errors.region}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Anwani / Maelezo ya Uwasilishaji</label>
                  <input placeholder="Mitaa, nambari ya nyumba au alama..." value={form.address} onChange={e => setF("address", e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Idadi *</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setF("quantity", Math.max(1, Number(form.quantity) - 1))}
                      style={{ width: 42, height: 42, borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 20, cursor: "pointer", display: "grid", placeItems: "center" }}
                    >
                      −
                    </motion.button>
                    <span style={{ fontSize: 20, fontWeight: 900, minWidth: 32, textAlign: "center" }}>{form.quantity}</span>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setF("quantity", (Number(form.quantity) || 1) + 1)}
                      style={{ width: 42, height: 42, borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 20, cursor: "pointer", display: "grid", placeItems: "center" }}
                    >
                      +
                    </motion.button>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                      = <b style={{ color: G }}>{(basePrice * (Number(form.quantity) || 1)).toLocaleString()} TZS</b>
                    </span>
                  </div>
                  {errors.quantity && <p style={errStyle}>{errors.quantity}</p>}
                </div>
                {colorList.length > 0 && (
                  <div>
                    <label style={labelStyle}>Rangi / Aina</label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {colorList.map((c) => (
                        <button type="button" key={c} onClick={() => setF("selectedColor", c)} style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${form.selectedColor === c ? G : "rgba(255,255,255,0.15)"}`, background: form.selectedColor === c ? "rgba(245,166,35,0.1)" : "rgba(255,255,255,0.03)", color: form.selectedColor === c ? G : "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label style={labelStyle}>Maelezo ya Ziada</label>
                  <textarea placeholder="Rangi, size, model..." value={form.notes} onChange={e => setF("notes", e.target.value)} style={{ ...inputStyle, height: 88, padding: "12px 16px", resize: "none" }} />
                </div>
                <div style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.15)", borderRadius: 14, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>JUMLA YA KULIPA</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: G }}>{(basePrice * (Number(form.quantity) || 1)).toLocaleString()} TZS</span>
                </div>

                <div style={{ display: "grid", gap: 16, marginTop: 8 }}>
                  <div style={{ padding: 14, borderRadius: 12, background: "rgba(37, 211, 102, 0.05)", border: "1px solid rgba(37, 211, 102, 0.2)", color: "#25d366", fontSize: 13, fontWeight: 700, lineHeight: 1.5, textAlign: "center" }}>
                    Tafadhali fanya malipo kisha weka Muamala (Transaction ID) au Pakia Screenshot hapa chini.
                  </div>
                  
                  <div>
                    <label style={labelStyle}>Transaction ID / Receipt Number</label>
                    <input 
                      value={form.paymentId} 
                      onChange={e=>setF("paymentId",e.target.value)} 
                      placeholder="Mfn: 5H4X9J2..." 
                      style={{...inputStyle, borderColor: errors.paymentId && !form.proofFile ? "#ef4444" : (form.paymentId ? G : "rgba(255,255,255,0.1)"), background: form.paymentId ? "rgba(245,166,35,0.05)" : "rgba(255,255,255,0.04)"}} 
                  />
                  </div>

                  <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700 }}>
                    --- AU (OR) ---
                  </div>

                  <div>
                    <label style={labelStyle}>Upload Payment Screenshot</label>
                    <div style={{ border: `2px dashed ${errors.paymentId && !form.paymentId && !form.proofFile && !form.proofUrl ? "#ef4444" : "rgba(255,255,255,.1)"}`, borderRadius: 12, padding: 20, textAlign: "center", position: "relative", overflow: "hidden", background: "rgba(255,255,255,0.02)" }}>
                      {form.proofUrl ? (
                         <div>
                           <img src={form.proofUrl} alt="Screenshot" style={{ maxHeight: 100, borderRadius: 8, maxWidth: "100%", objectFit: "contain" }} />
                           <button onClick={(e) => { e.preventDefault(); setF("proofUrl", ""); setF("proofFile", null); }} style={{ color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer", marginTop: 8, background: "none", border: "none" }}>Remove</button>
                         </div>
                      ) : uploadingImage ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                          <div className="animate-spin" style={{ width: 24, height: 24, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: G, borderRadius: "50%" }}></div>
                          <div style={{ fontSize: 11, color: G, fontWeight: 700 }}>Inapakia picha...</div>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize: 20, marginBottom: 4 }}>📷</div>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>Pakia picha ya muamala hapa</div>
                          <input type="file" accept="image/*" disabled={uploadingImage} onChange={(e) => {
                            if(e.target.files && e.target.files[0]) {
                              handleImageUpload(e.target.files[0]);
                            }
                          }} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                        </>
                      )}
                    </div>
                    {errors.paymentId && !form.paymentId && !form.proofFile && !form.proofUrl && <div style={{...errStyle, marginTop: 8, textAlign: 'center'}}>{errors.paymentId}</div>}
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={loading ? {} : { scale: 0.98 }}
                  style={{
                    height: 56,
                    borderRadius: 16,
                    background: loading ? "rgba(255,255,255,0.1)" : G,
                    color: loading ? "rgba(255,255,255,0.35)" : "#000",
                    fontWeight: 900,
                    fontSize: 16,
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    marginTop: 6,
                    boxShadow: loading ? "none" : "0 8px 28px rgba(245,166,35,0.25)",
                  }}
                >
                  {loading ? "Inatuma..." : "Thibitisha na Tuma Oda"}
                </motion.button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="product-step"
              variants={stepVariants}
              initial={false}
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                layout
                style={{ ...cardShell, overflow: "hidden", marginBottom: 20 }}
                whileHover={{ y: -2, boxShadow: "0 22px 55px rgba(0,0,0,0.55)" }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              >
                <div style={{ position: "relative", height: isMobile ? 300 : 360, display: "grid", placeItems: "center", padding: 18, background: "radial-gradient(circle at 50% 30%, rgba(245,166,35,0.08), transparent 55%)" }}>
                  {images.length > 0 ? (
                    <img src={images[activeImgIdx]} alt={product.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", borderRadius: 14 }} onError={e => { e.target.style.display = "none"; }} />
                  ) : (
                    <div style={{ fontSize: 80, opacity: 0.4 }}>📦</div>
                  )}
                  {images.length > 1 && (
                    <>
                      <button type="button" onClick={() => setActiveImgIdx(i => Math.max(0, i - 1))} disabled={activeImgIdx === 0} style={{ position: "absolute", left: 20, top: "42%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "grid", placeItems: "center", cursor: "pointer", opacity: activeImgIdx === 0 ? 0.35 : 1 }}>
                        <ChevronLeft size={18} color="#fff" />
                      </button>
                      <button type="button" onClick={() => setActiveImgIdx(i => Math.min(images.length - 1, i + 1))} disabled={activeImgIdx === images.length - 1} style={{ position: "absolute", right: 20, top: "42%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "grid", placeItems: "center", cursor: "pointer", opacity: activeImgIdx === images.length - 1 ? 0.35 : 1 }}>
                        <ChevronRight size={18} color="#fff" />
                      </button>
                    </>
                  )}
                </div>
                <div style={{ padding: "20px 20px 22px" }}>
                  {product.category && (
                    <div style={{ display: "inline-block", background: "rgba(245,166,35,0.12)", color: G, padding: "5px 14px", borderRadius: 999, fontSize: 11, fontWeight: 900, textTransform: "uppercase", marginBottom: 12, border: "1px solid rgba(245,166,35,0.25)" }}>
                      {product.category}
                    </div>
                  )}
                  <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 900, margin: "0 0 14px", lineHeight: 1.25 }}>{product.name || "Bidhaa"}</h1>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginBottom: 14, flexWrap: "wrap" }}>
                    <div>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: 2 }}>Bei ya Meli</span>
                      <span style={{ fontSize: 30, fontWeight: 900, color: G, fontFamily: "'Bricolage Grotesque',sans-serif" }}>{basePrice.toLocaleString()} TZS</span>
                    </div>
                    {airPrice > 0 && (
                      <div>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: 2 }}>Bei ya Ndege</span>
                        <span style={{ fontSize: 18, fontWeight: 800, color: "rgba(255,255,255,0.75)" }}>{airPrice.toLocaleString()} TZS</span>
                      </div>
                    )}
                  </div>
                  {product.description && (
                    <p style={{ color: "rgba(255,255,255,0.62)", lineHeight: 1.65, marginBottom: 14, fontSize: 14 }}>{product.description}</p>
                  )}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                    {product.condition && <span style={metaBadge}>{product.condition}</span>}
                    {product.brand && <span style={metaBadge}>{product.brand}</span>}
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "12px 14px", marginBottom: 8 }}>
                    {(product.estimatedDelivery || product.deliveryEstimate) && (
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.78)", fontWeight: 700, marginBottom: 8 }}>
                        Makadirio: {String(product.estimatedDelivery || product.deliveryEstimate)}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Truck size={16} color={G} /><b style={{ color: "#fff" }}>Meli</b> 30–45 siku</span>
                      {airPrice > 0 && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Plane size={16} color={G} /><b style={{ color: "#fff" }}>Ndege</b> 7–14 siku</span>}
                    </div>
                  </div>
                  {colorList.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", marginBottom: 8 }}>Rangi / Aina</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {colorList.map((c) => (
                          <span key={c} style={{ padding: "5px 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {product.inStock !== false ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={handleWhatsApp}
                    style={{ height: 54, borderRadius: 16, background: "rgba(37,211,102,0.1)", color: "#25d366", fontWeight: 800, border: "1px solid rgba(37,211,102,0.22)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14 }}
                  >
                    <MessageCircle size={18} /> Uliza WhatsApp
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={handleWekaOda}
                    style={{ height: 54, borderRadius: 16, background: G, color: "#000", fontWeight: 900, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14, boxShadow: "0 10px 30px rgba(245,166,35,0.28)" }}
                  >
                    <ShoppingCart size={18} /> Weka Oda Sasa
                  </motion.button>
                </div>
              ) : (
                <div style={{ background: "rgba(255,77,79,0.08)", border: "1px solid rgba(255,77,79,0.2)", borderRadius: 16, padding: "18px 16px", textAlign: "center" }}>
                  <p style={{ color: "#ff4d4f", fontWeight: 800, margin: 0 }}>Bidhaa hii haipatikani kwa sasa.</p>
                  <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={handleWhatsApp} style={{ marginTop: 14, height: 46, borderRadius: 12, background: "rgba(37,211,102,0.1)", color: "#25d366", fontWeight: 800, border: "1px solid rgba(37,211,102,0.2)", cursor: "pointer", padding: "0 20px" }}>
                    <MessageCircle size={16} style={{ verticalAlign: "middle", marginRight: 6 }} /> Uliza WhatsApp
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
