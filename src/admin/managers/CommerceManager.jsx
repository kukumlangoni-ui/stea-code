import React, { useState, useEffect } from "react";
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc,
  query,
  orderBy,
  limit
} from "firebase/firestore";
import { getFirebaseDb } from "../../firebase";
import { Btn, Toast, G } from "../AdminUI";
import { MARKET_CATEGORIES } from "../../constants/marketplace.js";

export default function CommerceManager() {
  const [orders, setOrders] = useState([]);
  const [subs, setSubs] = useState([]);
  const [toast, setToast] = useState(null);
  const [filterCat, setFilterCat] = useState("all");
  const db = getFirebaseDb();
  
  const toast_ = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  useEffect(() => {
    if (!db) return;
    const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(500)), (snap) => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => console.error("Error loading orders:", err));
    const unsubSubs = onSnapshot(query(collection(db, "subscriptions"), orderBy("createdAt", "desc"), limit(500)), (snap) => setSubs(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => console.error("Error loading subs:", err));
    return () => { unsubOrders(); unsubSubs(); };
  }, [db]);

  const approveOrder = async (id) => {
    try {
      await updateDoc(doc(db, "orders", id), { status: "approved" });
      toast_("Order imeidhinishwa!");
    } catch (e) {
      console.error(e);
      toast_("Imeshindwa kuidhinisha!", "error");
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filterCat === "all") return true;
    return o.category === filterCat;
  });

  const fmtMoney = (n) => {
    const v = Number(n);
    return Number.isFinite(v) ? `TZS ${v.toLocaleString()}` : "—";
  };

  const fmtWhen = (o) => {
    const ts = o.createdAt;
    if (ts?.toDate) return ts.toDate().toLocaleString();
    if (typeof ts === "number") return new Date(ts).toLocaleString();
    if (ts?.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    return "—";
  };

  const payLabel = (id) => {
    const map = { mpesa: "M-Pesa", airtel: "Airtel Money", tigo: "Tigo Pesa", bank: "Bank", lipa: "Lipa Namba", cash: "COD" };
    return map[id] || id || "—";
  };

  return (
    <div style={{ color: "#fff" }}>
      {toast && <Toast msg={toast.msg} type={toast.type}/>}
      
      <div style={{ marginBottom: 24, display: "flex", gap: 10, overflowX: "auto", paddingBottom: 10 }}>
        <button 
          onClick={() => setFilterCat("all")}
          style={{ 
            padding: "8px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,.1)",
            background: filterCat === "all" ? G : "transparent",
            color: filterCat === "all" ? "#111" : "rgba(255,255,255,.5)",
            cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap"
          }}
        >
          All Orders
        </button>
        {Object.values(MARKET_CATEGORIES).map(c => (
          <button 
            key={c.id} 
            onClick={() => setFilterCat(c.id)}
            style={{ 
              padding: "8px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,.1)",
              background: filterCat === c.id ? G : "transparent",
              color: filterCat === c.id ? "#111" : "rgba(255,255,255,.5)",
              cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap"
            }}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <div style={{ borderRadius:20, border:"1px solid rgba(255,255,255,.08)", background:"#141823", padding:24, marginBottom:28 }}>
        <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, margin:"0 0 20px" }}>
          Orders ({filteredOrders.length})
        </h3>
        <div style={{ display: "grid", gap: 16 }}>
          {filteredOrders.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,.3)" }}>Hakuna oda kwa kategoria hii.</div>
          ) : (
            filteredOrders.map(o => (
              <div key={o.id} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", background: "#1a1d2e", padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>Oda #{o.orderId || (o.id ? String(o.id).substring(0, 8).toUpperCase() : "")}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, background: o.status === "approved" ? "rgba(34,197,94,.15)" : "rgba(251,191,36,.15)", color: o.status === "approved" ? "#22c55e" : "#fbbf24", padding: "4px 10px", borderRadius: 6, fontWeight: 800, textTransform: "uppercase" }}>
                      {o.status || "pending"}
                    </span>
                    <span style={{ color: G, fontWeight: 900, fontSize: 16 }}>{fmtMoney(o.totalPrice ?? o.price ?? o.amount)}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.35)", marginBottom: 12 }}>Tarehe: {fmtWhen(o)}</div>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Mteja</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{o.buyerName || o.customerName || o.userName || "—"}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>{o.buyerPhone || o.customerPhone || o.userPhone || "—"}</div>
                    {o.region && <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 2 }}>📍 {o.region}</div>}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Bidhaa</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{o.productName || o.items?.[0]?.name || "—"}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 2 }}>Kategoria: <span style={{ color: G }}>{o.category || "—"}</span></div>
                    {o.deliveryOption && <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>Delivery: {o.deliveryOption}</div>}
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,.02)", padding: 14, borderRadius: 12, display: "grid", gap: 8, fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "rgba(255,255,255,.5)" }}>Payment Method:</span>
                    <span style={{ fontWeight: 700 }}>{payLabel(o.paymentMethod) || o.paymentMethod || "—"}</span>
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
                  {o.message && (
                    <div style={{ marginTop: 8, padding: 10, background: "rgba(255,255,255,.03)", borderRadius: 8 }}>
                      <span style={{ color: "rgba(255,255,255,.5)", display: "block", marginBottom: 4, fontSize: 11, textTransform: "uppercase" }}>Ujumbe</span>
                      <span>{o.message}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 10 }}>
                    {o.proofUrl && (
                      <a href={o.proofUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(37, 211, 102, 0.1)", color: "#25d366", padding: "8px 12px", borderRadius: 8, textDecoration: "none", fontSize: 12, fontWeight: 700 }}>
                        📸 Payment Proof
                      </a>
                    )}
                    {o.devicePhotoUrl && (
                      <a href={o.devicePhotoUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(245, 166, 35, 0.1)", color: G, padding: "8px 12px", borderRadius: 8, textDecoration: "none", fontSize: 12, fontWeight: 700 }}>
                        🖼️ Device Photo
                      </a>
                    )}
                  </div>
                  {o.status === "pending" && <Btn onClick={() => approveOrder(o.id)} style={{ padding: "8px 24px" }}>Approve Order</Btn>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ borderRadius:20, border:"1px solid rgba(255,255,255,.08)", background:"#141823", padding:24 }}>
        <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, margin:"0 0 20px" }}>Subscriptions</h3>
        <div style={{ display: "grid", gap: 12 }}>
          {subs.map(s => (
            <div key={s.id} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", background: "#1a1d2e", padding: "14px 18px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Sub: {s.dealId || s.planName}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Status: {s.status} | End: {s.endDate}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
