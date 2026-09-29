import React, { useState } from "react";
import { getFirebaseDb, collection, query, where, getDocs, or } from "../firebase";
import { Search, Package, Truck, CheckCircle2, Clock, MapPin, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const G = "#F5A623";
const BORDER = "rgba(255,255,255,0.06)";

const STEPS = [
  { id: "pending", label: "Imepokelewa", icon: Clock },
  { id: "payment_verified", label: "Malipo Yamethibitishwa", icon: CheckCircle2 },
  { id: "processing", label: "Inanunuliwa China 🇨🇳", icon: Package },
  { id: "shipped_china", label: "Imesafirishwa ✈️/🚢", icon: Truck },
  { id: "arrived_tz", label: "Imefika Tanzania 🇹🇿", icon: MapPin },
  { id: "delivered", label: "Imetolewa ✅", icon: CheckCircle2 },
];

export default function OrderTrackingPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  const handleTrack = async (e, manualId = null) => {
    if (e) e.preventDefault();
    const searchValue = manualId || input.trim();
    if (!searchValue) return;

    setLoading(true);
    setOrder(null);
    setError("");

    try {
      const db = getFirebaseDb();
      // Search in both chaba_orders and regular orders
      const collections = ["chaba_orders", "orders"];
      let foundOrder = null;

      for (const collName of collections) {
        const q = query(
          collection(db, collName),
          or(
            where("orderId", "==", searchValue),
            where("customerPhone", "==", searchValue),
            where("userPhone", "==", searchValue)
          )
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          // Get the most recent one if multiple (though ID should be unique)
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          foundOrder = docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))[0];
          break;
        }
      }

      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        setError("Samahani, hatujaweza kupata oda yako. Tafadhali hakiki namba ya simu au Order ID.");
      }
    } catch (err) {
      console.error(err);
      setError("Tatizo limetokea wakati wa kutafuta oda. Jaribu tena baadae.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
       setInput(id);
       handleTrack(null, id);
    }
  }, []);

  const rawIdx = order ? STEPS.findIndex(s => s.id === order.status) : -1;
  const currentStepIndex = rawIdx >= 0 ? rawIdx : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#fff", padding: "80px 20px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12 }}>Fuatilia Oda Yako</h1>
          <p style={{ color: "rgba(255,255,255,.5)", fontSize: 15 }}>Weka Order ID au Namba ya Simu uliyotumia kuagiza</p>
        </header>

        <form onSubmit={handleTrack} style={{ display: "flex", gap: 8, marginBottom: 40 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.3)" }} />
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g. STEA-123456 au 07XXXXXXXX"
              style={{ 
                width: "100%", height: 56, borderRadius: 16, border: `1px solid ${BORDER}`, 
                background: "rgba(255,255,255,.03)", color: "#fff", padding: "0 16px 0 48px", 
                outline: "none", fontSize: 16, fontWeight: 500
              }}
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            style={{ 
              height: 56, padding: "0 24px", borderRadius: 16, background: G, border: "none", 
              color: "#000", fontWeight: 800, cursor: "pointer", transition: "all .2s"
            }}
          >
            {loading ? "Inatafuta..." : "Tafuta"}
          </button>
        </form>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ p: 20, textAlign: "center", color: "#ff4757", background: "rgba(255,71,87,.1)", borderRadius: 16, border: "1px solid rgba(255,71,87,.2)" }}
            >
              {error}
            </motion.div>
          )}

          {order && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: "rgba(255,255,255,.02)", border: `1px solid ${BORDER}`, borderRadius: 24, padding: 24 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, borderBottom: `1px solid ${BORDER}`, paddingBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 12, color: G, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>ORDER ID</div>
                  <div style={{ fontSize: 24, fontWeight: 900 }}>#{order.orderId}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>ESTIMATED DELIVERY</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>
                    {order.transport === "sea" ? "30-45 Siku (Meli)" : "7-14 Siku (Ndege)"}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gap: 24, position: "relative" }}>
                 {/* Line */}
                 <div style={{ position: "absolute", left: 19, top: 20, bottom: 20, width: 2, background: "rgba(255,255,255,.1)" }} />
                 
                 {STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;
                    const Icon = step.icon;

                    return (
                      <div key={step.id} style={{ display: "flex", gap: 20, alignItems: "center", position: "relative" }}>
                        <div style={{ 
                          width: 40, height: 40, borderRadius: 12, display: "grid", placeItems: "center", zIndex: 2,
                          background: isCurrent ? G : isCompleted ? "#22c55e" : "rgba(255,255,255,.1)",
                          color: isCurrent || isCompleted ? "#000" : "rgba(255,255,255,.3)",
                          transition: "all .3s"
                        }}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: isCompleted ? "#fff" : "rgba(255,255,255,.3)" }}>
                            {step.label}
                          </div>
                          {isCurrent && (
                            <div style={{ fontSize: 13, color: G, marginTop: 2, fontWeight: 700 }}>
                               Hali ya sasa ya oda yako.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                 })}
              </div>

              {order.trackingNumber && (
                <div style={{ marginTop: 40, padding: 20, background: "rgba(255,255,255,.03)", borderRadius: 16, border: `1px solid ${G}20` }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", fontWeight: 800, marginBottom: 8 }}>CHINA TRACKING NUMBER (WAYBILL)</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "monospace", color: G }}>{order.trackingNumber}</div>
                    <Truck size={24} style={{ opacity: 0.5 }} />
                  </div>
                </div>
              )}

              <div style={{ marginTop: 40, borderTop: `1px solid ${BORDER}`, paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                 <div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", fontWeight: 700 }}>Product</div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{order.productName || order.items?.[0]?.name}</div>
                 </div>
                 <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", fontWeight: 700 }}>Total Price</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: G }}>Tsh {Number(order.totalPrice || 0).toLocaleString()}</div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ marginTop: 40, textAlign: "center" }}>
           <p style={{ fontSize: 14, color: "rgba(255,255,255,.4)" }}>Una tatizo? Wasiliana nasi kupitia WhatsApp</p>
           <button 
             onClick={() => window.open(`https://wa.me/255757053354?text=Habari, Nahitaji msaada kufuatilia oda yangu`, "_blank")}
             style={{ background: "none", border: "none", color: G, fontWeight: 800, marginTop: 8, cursor: "pointer", fontSize: 15 }}
           >
             Msaada wa Haraka →
           </button>
        </div>
      </div>
    </div>
  );
}
