import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Truck, Plane, FileDown, Search } from "lucide-react";
import { useMobile } from "../hooks/useMobile.js";
import { orderService } from "../services/orderService.js";
import { auth, getFirebaseDb, onSnapshot, collection, onAuthStateChanged } from "../firebase.js";

const G = "#F5A623";
const BORDER = "rgba(0,0,0,0.1)";

const PAYMENT_METHODS = [
  { id: "vodacom", label: "Vodacom M-Pesa" },
  { id: "airtel", label: "Airtel Money" },
  { id: "bank", label: "Benki" },
  { id: "lipanamba", label: "Lipa Namba" },
  { id: "cash", label: "Cash (Kama inaruhusiwa)" }
];

export function ChabaCheckoutModal({ product, onClose, qty = 1, shippingType = "sea", unitPrice = 0, totalPrice = 0, extraInfo = "" }) {
  const isMobile = useMobile();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // We skip step 1 (Usafiri) if it was already selected previously, or keep it for confirmations.
  // We'll keep it for confirmation.

  const minQty = Number(product.minQty) || 1;
  const stepQty = Number(product.stepQty) || 1;
  const productType = product.productType || "single";
  
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [errors, setErrors] = useState([]);
  const formRef = React.useRef(null);

  const [form, setForm] = useState({
    qty: qty || minQty,
    transport: shippingType,
    name: auth.currentUser?.displayName || "",
    phone: auth.currentUser?.phoneNumber || "",
    region: "",
    paymentMethod: "", paymentProofUrl: "", proofFile: null
  });

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    // Robust auth info sync
    const handleAuth = (user) => {
      if (user) {
        console.log(">>> [STEA] Auth Sync:", user.displayName, user.phoneNumber);
        setForm(prev => ({
          ...prev,
          name: prev.name || user.displayName || "",
          phone: prev.phone || user.phoneNumber || ""
        }));
      }
    };
    
    handleAuth(auth.currentUser);
    const unsubAuth = onAuthStateChanged(auth, handleAuth);

    const db = getFirebaseDb();
    const unsub = onSnapshot(collection(db, "chaba_payment_methods"), snap => {
        const methods = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPaymentMethods(methods);
        
        // Auto-select first active method if none selected
        if (methods.length > 0 && !form.paymentMethod) {
          const firstActive = methods.find(m => m.active);
          if (firstActive) {
            setF("paymentMethod", firstActive.name);
          }
        }
    }, err => {
        console.error("Firestore error (chaba_payment_methods):", err);
    });
    return () => {
      unsubAuth();
      unsub();
    };
  }, []);

  const STEA_WA = "255757053354";

  const handleQtyChange = (e) => {
    let newQty = parseInt(e.target.value) || minQty;
    if (productType === "bulk") {
       newQty = Math.max(minQty, Math.ceil(newQty / stepQty) * stepQty);
    } else {
       newQty = Math.max(1, newQty);
    }
    setF("qty", newQty);
  };

  const currentTotalPrice = (unitPrice || product.price || 0) * form.qty;

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [lastOrderId, setLastOrderId] = useState("");

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // reset errors
    setErrors([]);
    
    const missing = [];
    if (!form.name || !form.name.trim()) missing.push("Jina Kamili");
    
    // Improved Phone Validation (Tanzania format)
    const phoneClean = form.phone.replace(/[\s\-+]/g, "");
    const isTZ = /^(0[67]\d{8}|255[67]\d{8})$/.test(phoneClean);
    if (!form.phone || !form.phone.trim()) {
      missing.push("Namba ya WhatsApp");
    } else if (!isTZ) {
      missing.push("Namba ya Simu si sahihi (Tumia 07... au 06...)");
    }

    // Optional Email Validation (if we add email field, or just check if it's there)
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      missing.push("Email si sahihi");
    }

    if (!form.region || !form.region.trim()) missing.push("Mkoa/Anwani (e.g. Dar)");
    if (!form.paymentMethod) missing.push("Njia ya Malipo (Chagua hapa chini)");
    if (!form.paymentProofUrl || !form.paymentProofUrl.trim()) missing.push("Namba ya Muamala");

    if (missing.length > 0) {
      setErrors(missing);
      alert("⚠️ TAFADHALI KAMILISHA HAYA:\n\n" + missing.map(m => "• " + m).join("\n"));
      if (formRef.current) {
        formRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    setLoading(true);
    console.log(">>> [STEA] Start Submit:", form);
    
    try {
      const result = await orderService.processOrder({
        type: "chaba_china",
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        region: form.region.trim(),
        productName: product.name,
        quantity: form.qty,
        unitPrice: unitPrice || product.price || 0,
        totalPrice: currentTotalPrice,
        paymentMethod: form.paymentMethod,
        paymentId: form.paymentProofUrl.trim(),
        transport: form.transport,
        specialInstructions: extraInfo
      });
      
      console.log(">>> [STEA] Submit Success:", result);
      setLastOrderId(result.orderId);
      window._latestOrderData = result.order;
      setIsConfirmed(true);
      if ("vibrate" in navigator) navigator.vibrate(100);
    } catch (err) {
      console.error(">>> [STEA] Submit Error:", err);
      alert("❌ SAMAHANI: Oda haijatumwa.\nSababu: " + (err.message || "Tatizo la kiufundi"));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (window._latestOrderData) {
      orderService.downloadReceipt(window._latestOrderData);
    } else {
      // Fallback
      orderService.downloadReceipt({
        orderId: lastOrderId,
        customerName: form.name,
        customerPhone: form.phone,
        region: form.region,
        items: [{
          name: product.name,
          quantity: form.qty,
          unitPrice: Number(unitPrice || product.price || 0)
        }],
        totalPrice: Number(currentTotalPrice),
        paymentMethod: form.paymentMethod
      });
    }
  };

  useEffect(() => {
    // Lock scroll
    const oldBodyOverflow = document.body.style.overflow;
    const oldHtmlOverflow = document.documentElement.style.overflow;
    
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.classList.add("modal-open");

    return () => {
      document.body.style.overflow = oldBodyOverflow;
      document.documentElement.style.overflow = oldHtmlOverflow;
      document.body.classList.remove("modal-open");
    };
  }, []);

  if (isMobile) {
    return createPortal(
      <div className="chaba-checkout-page">
        <div className="chaba-checkout-header">
           <button onClick={onClose}>←</button>
           <h2>Kamilisha Malipo</h2>
           <button onClick={onClose}><X size={24} /></button>
        </div>
        <div className="chaba-checkout-body" ref={formRef}>
          <AnimatePresence mode="wait">
            {isConfirmed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: "center", padding: "20px 0" }}
              >
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(37, 211, 102, 0.1)", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
                  <CheckCircle size={40} color="#25d366" />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 10 }}>Agizo Limetumwa!</h2>
                <p style={{ color: "#666", fontSize: 14, lineHeight: 1.6, marginBottom: 30 }}>
                  Oda yako <b>#{lastOrderId}</b> imepokelewa na kuwekwa kwenye mifumo yetu. Unaweza kupakua risiti yako hapa chini.
                </p>
                
                <div style={{ display: "grid", gap: 12 }}>
                  <button
                    onClick={() => {
                      onClose();
                      window.location.href = "/track-order?id=" + lastOrderId;
                    }}
                    style={{
                      height: 52, borderRadius: 14, background: "#fdf8ee", color: G, fontWeight: 900, fontSize: 16, border: `1px solid ${G}30`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10
                    }}
                  >
                    <Search size={20} /> FUATILIA ODA YAKO →
                  </button>
                  <button
                    onClick={handleDownloadReceipt}
                    style={{
                      height: 52, borderRadius: 14, background: G, color: "#000", fontWeight: 900, fontSize: 16, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10
                    }}
                  >
                    <FileDown size={20} /> PAKUA RISITI (PDF)
                  </button>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <button
                          onClick={() => {
                              const rawMsg = [
                                  `*🛒 AGIZA CHINA ORDER*`,
                                  `*ID:* ${lastOrderId}`,
                                  `*Product:* ${product.name}`,
                                  `*Quantity:* ${form.qty}`,
                                  `*Total Price:* Tsh ${Number(currentTotalPrice).toLocaleString()}`,
                                  `*Buyer:* ${form.name}`
                              ].join("\n");
                              window.open(`https://wa.me/${STEA_WA}?text=${encodeURIComponent(rawMsg)}`, "_blank");
                          }}
                          style={{
                              height: 52, borderRadius: 12, background: "#e9fbf0", color: "#25d366", fontWeight: 800, fontSize: 14, border: "1px solid #25d36630", cursor: "pointer"
                          }}
                      >
                          WhatsApp
                      </button>
                      <button
                          onClick={onClose}
                          style={{
                              height: 52, borderRadius: 12, background: "#f5f5f5", color: "#111", fontWeight: 800, fontSize: 14, border: "1px solid #ddd", cursor: "pointer"
                          }}
                      >
                          Funga
                      </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.form
                onSubmit={handleSubmit}
                key="form-mobile"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                {errors.length > 0 && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", padding: 14, borderRadius: 12, color: "#ef4444", fontSize: 13, fontWeight: 700 }}>
                    Tafadhali kamilisha maelezo yote yaliyosalia.
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f9f9f9", padding: 16, borderRadius: 14, border: `1px solid #eee` }}>
                   <span style={{ fontWeight: 800, color: "#444" }}>Idadi (Quantity):</span>
                   <input 
                     type="number" 
                     value={form.qty} 
                     onChange={handleQtyChange} 
                     min={minQty}
                     step={stepQty}
                     style={{ width: 90, height: 44, borderRadius: 10, background: "#fff", border: `1px solid #ddd`, color: "#111", textAlign: "center", fontSize: 18, fontWeight: 900 }} 
                   />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em" }}>TAARIFA ZA MTEJA <span style={{ color: G }}>*</span></label>
                    <input 
                      placeholder="Jina lako kamili" 
                      value={form.name} 
                      onChange={e => setF("name", e.target.value)} 
                      style={{ 
                        width: "100%", height: 54, borderRadius: 12, 
                        border: `1px solid ${errors.some(e => e.includes("Jina")) ? "#ef4444" : "#ddd"}`, 
                        background: "#fdfdfd", color: "#111", padding: "0 16px", outline: "none", boxSizing: "border-box", fontSize: 16
                      }} 
                    />
                    <input 
                      type="tel" 
                      placeholder="Namba ya WhatsApp (07XXXXXXXX)" 
                      value={form.phone} 
                      onChange={e => setF("phone", e.target.value)} 
                      style={{ 
                        width: "100%", height: 54, borderRadius: 12, 
                        border: `1px solid ${errors.some(e => e.includes("Simu") || e.includes("WhatsApp")) ? "#ef4444" : "#ddd"}`, 
                        background: "#fdfdfd", color: "#111", padding: "0 16px", outline: "none", boxSizing: "border-box", fontSize: 16
                      }} 
                    />
                    <input 
                      placeholder="Mkoa au Anwani (e.g. Dar es Salaam)" 
                      value={form.region} 
                      onChange={e => setF("region", e.target.value)} 
                      style={{ 
                        width: "100%", height: 54, borderRadius: 12, 
                        border: `1px solid ${errors.some(e => e.includes("Mkoa")) ? "#ef4444" : "#ddd"}`, 
                        background: "#fdfdfd", color: "#111", padding: "0 16px", outline: "none", boxSizing: "border-box", fontSize: 16
                      }} 
                    />
                </div>

                <div style={{ background: "#fef9ec", border: `1px solid ${G}20`, borderRadius: 16, padding: 16 }}>
                  <div style={{ color: G, fontSize: 12, fontWeight: 900, textTransform: "uppercase", marginBottom: 8 }}>
                    ⚠️ Jinsi ya Kulipa
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#666", lineHeight: 1.6 }}>
                    <li>Chagua njia ya malipo hapa chini.</li>
                    <li>Tuma <b>Tsh {currentTotalPrice.toLocaleString()}</b>.</li>
                    <li>Weka <b>Transaction ID</b> hapa chini.</li>
                  </ul>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 900, color: "#999", textTransform: "uppercase" }}>CHAGUA NJIA YA MALIPO</label>
                  <div style={{ display: "grid", gap: 10 }}>
                     {paymentMethods.filter(m => m.active).map(m => {
                       const active = form.paymentMethod === m.name;
                       return (
                         <div 
                           key={m.id} 
                           onClick={() => setF("paymentMethod", m.name)} 
                           style={{ 
                              padding: "16px", borderRadius: 14, 
                              border: `1px solid ${active ? G : "#eee"}`, 
                              background: active ? `${G}08` : "#fff", 
                              transition: "all .2s" 
                           }}
                         >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                              <span style={{ fontWeight: 900, fontSize: 15, color: active ? G : "#111" }}>{m.name}</span>
                              <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${active ? G : "#ddd"}`, background: active ? G : "transparent", display: "grid", placeItems: "center" }}>
                                {active && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                              </div>
                            </div>
                            <div style={{ fontSize: 13, color: "#555" }}>
                              Namba: <b style={{ color: "#111", userSelect: "all" }}>{m.accountNumber}</b>
                            </div>
                         </div>
                       );
                     })}
                  </div>
                  <input 
                    placeholder="Weka Namba ya Muamala (Transaction ID)" 
                    value={form.paymentProofUrl} 
                    onChange={e => setF("paymentProofUrl", e.target.value)} 
                    style={{ 
                      width: "100%", height: 54, borderRadius: 12, 
                      border: `2px solid ${form.paymentProofUrl ? G : "#ddd"}`, 
                      background: "#fff", color: "#111", padding: "0 16px", outline: "none", boxSizing: "border-box", fontWeight: 700 
                    }} 
                  />
                </div>

                <div style={{ background: "#f5f5f5", padding: 18, borderRadius: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <span style={{ color: "#666", fontWeight: 700 }}>JUMLA KUU:</span>
                   <span style={{ color: G, fontWeight: 900, fontSize: 20 }}>Tsh {Number(currentTotalPrice).toLocaleString()}</span>
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  style={{ 
                    height: 58, borderRadius: 16, background: loading ? "#eee" : G, 
                    color: loading ? "#999" : "#000", fontWeight: 900, fontSize: 18, 
                    border: "none", cursor: loading ? "not-allowed" : "pointer", 
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    boxShadow: `0 10px 25px ${G}40`
                  }}
                >
                  {loading ? "INATUMA ODA..." : "TUMA ODA SASA"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="chaba-modal-root" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="chaba-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1 }} onClick={onClose} />
      <div
         className="chaba-modal-card"
         onClick={(e) => e.stopPropagation()}
         style={{ 
           position: 'relative',
           zIndex: 2,
           width: '100%',
           maxWidth: 500,
           background: '#fff',
           borderRadius: 20,
           display: "flex", 
           flexDirection: "column",
           padding: "24px 16px",
           maxHeight: '90vh',
           overflowY: 'auto'
         }}
         ref={formRef}
      >
        <AnimatePresence mode="wait">
          {isConfirmed ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: "center", padding: "20px 0" }}
            >
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(37, 211, 102, 0.1)", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
                <CheckCircle size={40} color="#25d366" />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 10 }}>Agizo Limetumwa!</h2>
              <p style={{ color: "rgba(0,0,0,0.6)", fontSize: 14, lineHeight: 1.6, marginBottom: 30 }}>
                Oda yako <b>#{lastOrderId}</b> imepokelewa na kuwekwa kwenye mifumo yetu. Unaweza kupakua risiti yako hapa chini.
              </p>
              
              <div style={{ display: "grid", gap: 12 }}>
                <button
                  onClick={() => {
                    onClose();
                    window.location.href = "/track-order?id=" + lastOrderId;
                  }}
                  style={{
                    height: 52, borderRadius: 14, background: "rgba(245,166,35,0.1)", color: G, fontWeight: 900, fontSize: 16, border: `1px solid ${G}30`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10
                  }}
                >
                  <Search size={20} /> FUATILIA ODA YAKU →
                </button>
                <button
                  onClick={handleDownloadReceipt}
                  style={{
                    height: 52, borderRadius: 14, background: G, color: "#000", fontWeight: 900, fontSize: 16, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10
                  }}
                >
                  <FileDown size={20} /> PAKUA RISITI (PDF)
                </button>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <button
                        onClick={() => {
                            const rawMsg = [
                                `*🛒 AGIZA CHINA ORDER*`,
                                `*ID:* ${lastOrderId}`,
                                `*Product:* ${product.name}`,
                                `*Quantity:* ${form.qty}`,
                                `*Total Price:* Tsh ${Number(currentTotalPrice).toLocaleString()}`,
                                `*Buyer:* ${form.name}`
                            ].join("\n");
                            window.open(`https://wa.me/${STEA_WA}?text=${encodeURIComponent(rawMsg)}`, "_blank");
                        }}
                        style={{
                            height: 52, borderRadius: 14, background: "rgba(37,211,102,0.1)", color: "#25d366", fontWeight: 800, fontSize: 14, border: "1px solid rgba(37,211,102,0.2)", cursor: "pointer"
                        }}
                    >
                        WhatsApp
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            height: 52, borderRadius: 14, background: "rgba(0,0,0,0.05)", color: "#111", fontWeight: 800, fontSize: 14, border: "1px solid rgba(0,0,0,0.1)", cursor: "pointer"
                        }}
                    >
                        Funga
                    </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={handleSubmit}
              key="form-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                 <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Kamilisha Oda Yako</h2>
                 <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(0,0,0,.5)", cursor: "pointer", padding: 4 }}><X size={20} /></button>
              </div>

              {errors.length > 0 && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", padding: 12, borderRadius: 12, color: "#ef4444", fontSize: 12, fontWeight: 700 }}>
                  Tafadhali kamilisha maelezo haya: {errors.join(", ")}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,.03)", padding: 16, borderRadius: 12, border: `1px solid ${BORDER}` }}>
                 <span style={{ fontWeight: 800, color: "rgba(0,0,0,.7)" }}>Idadi (Quantity):</span>
                 <input 
                   type="number" 
                   value={form.qty} 
                   onChange={handleQtyChange} 
                   min={minQty}
                   step={stepQty}
                   style={{ width: 80, height: 40, borderRadius: 8, background: "rgba(0,0,0,.05)", border: `1px solid ${BORDER}`, color: "#111", textAlign: "center", fontSize: 16, fontWeight: 800 }} 
                 />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "rgba(0,0,0,.4)", textTransform: "uppercase" }}>TAARIFA ZA MTEJA (CUSTOMER INFO) <span style={{ color: G }}>*</span></label>
                  <input 
                    placeholder="Jina lako kamili" 
                    value={form.name} 
                    onChange={e => setF("name", e.target.value)} 
                    style={{ 
                      width: "100%", height: 52, borderRadius: 12, 
                      border: `2px solid ${errors.some(e => e.includes("Jina")) ? "#ef4444" : BORDER}`, 
                      background: "rgba(0,0,0,.05)", color: "#111", padding: "0 16px", outline: "none", boxSizing: "border-box", fontSize: 15
                    }} 
                  />
                  <input 
                    type="tel" 
                    placeholder="Namba ya WhatsApp (e.g. 07XXXXXXXX)" 
                    value={form.phone} 
                    onChange={e => setF("phone", e.target.value)} 
                    style={{ 
                      width: "100%", height: 52, borderRadius: 12, 
                      border: `2px solid ${errors.some(e => e.includes("Simu") || e.includes("WhatsApp")) ? "#ef4444" : BORDER}`, 
                      background: "rgba(0,0,0,.05)", color: "#111", padding: "0 16px", outline: "none", boxSizing: "border-box", fontSize: 15
                    }} 
                  />
                  <input 
                    type="email" 
                    placeholder="Email yako (Sio lazima)" 
                    value={form.email || ""} 
                    onChange={e => setF("email", e.target.value)} 
                    style={{ 
                      width: "100%", height: 52, borderRadius: 12, 
                      border: `2px solid ${errors.some(e => e.includes("Email")) ? "#ef4444" : BORDER}`, 
                      background: "rgba(0,0,0,.05)", color: "#111", padding: "0 16px", outline: "none", boxSizing: "border-box", fontSize: 15
                    }} 
                  />
                  <input 
                    placeholder="Mkoa au Anwani (e.g. Dar es Salaam, Kimara)" 
                    value={form.region} 
                    onChange={e => setF("region", e.target.value)} 
                    style={{ 
                      width: "100%", height: 52, borderRadius: 12, 
                      border: `2px solid ${errors.some(e => e.includes("Mkoa")) ? "#ef4444" : BORDER}`, 
                      background: "rgba(0,0,0,.05)", color: "#111", padding: "0 16px", outline: "none", boxSizing: "border-box", fontSize: 15
                    }} 
                  />
              </div>

              {/* User Guidance */}
              <div style={{ background: "rgba(245,166,35,0.05)", border: `1px solid ${G}20`, borderRadius: 16, padding: 14 }}>
                <div style={{ color: G, fontSize: 11, fontWeight: 900, textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  ⚠️ Jinsi ya Kulipa
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: "rgba(0,0,0,0.5)", lineHeight: 1.5 }}>
                  <li>Chagua njia ya malipo hapa chini.</li>
                  <li>Tuma kiasi cha <b>Tsh {currentTotalPrice.toLocaleString()}</b>.</li>
                  <li>Copy na Paste <b>Transaction ID</b> yako.</li>
                </ul>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: "rgba(0,0,0,.4)", textTransform: "uppercase" }}>CHAGUA NJIA YA MALIPO</label>
                <div style={{ display: "grid", gap: 8 }}>
                   {paymentMethods.filter(m => m.active).map(m => {
                     const active = form.paymentMethod === m.name;
                     return (
                       <div 
                         key={m.id} 
                         onClick={() => setF("paymentMethod", m.name)} 
                         style={{ 
                            padding: "12px 16px", borderRadius: 12, 
                            border: `1px solid ${active ? G : BORDER}`, 
                            background: active ? `${G}10` : "rgba(0,0,0,.03)", 
                            cursor: "pointer", transition: "all .2s" 
                         }}
                       >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontWeight: 800, fontSize: 14, color: active ? G : "#111" }}>{m.name}</span>
                            {active && <div style={{ width: 14, height: 14, borderRadius: "50%", background: G }} />}
                          </div>
                          <div style={{ fontSize: 12, color: "rgba(0,0,0,.7)", marginBottom: 4 }}>
                            Namba: <b style={{ color: "#111", fontFamily: "monospace" }}>{m.accountNumber}</b>
                          </div>
                          {m.instructions && <div style={{ fontSize: 10, color: "rgba(0,0,0,0.4)", italic: "true" }}>{m.instructions}</div>}
                       </div>
                     );
                   })}
                </div>
                <input placeholder="Weka Namba ya Muamala Hapa..." value={form.paymentProofUrl} onChange={e => setF("paymentProofUrl", e.target.value)} style={{ width: "100%", height: 48, borderRadius: 12, border: `1px solid ${form.paymentProofUrl ? G : BORDER}`, background: "rgba(0,0,0,.03)", color: "#111", padding: "0 16px", outline: "none", boxSizing: "border-box", fontFamily: "monospace", textTransform: "uppercase" }} />
              </div>

              <div style={{ background: "rgba(0,0,0,.03)", padding: 16, borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${BORDER}` }}>
                 <span style={{ color: "rgba(0,0,0,.6)", fontWeight: 600 }}>Jumla (Total):</span>
                 <span style={{ color: G, fontWeight: 900, fontSize: 18 }}>Tsh {Number(currentTotalPrice).toLocaleString()}</span>
              </div>

              <button type="submit" disabled={loading} style={{ height: 52, borderRadius: 14, background: loading ? "rgba(0,0,0,.1)" : G, color: loading ? "rgba(0,0,0,.5)" : "#000", fontWeight: 900, fontSize: 16, border: "none", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Inatuma...
                  </>
                ) : "TUMA ODA"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>,
    document.body
  );
}
