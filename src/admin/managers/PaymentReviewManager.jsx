import React, { useState, useEffect } from "react";
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { getFirebaseDb } from "../../firebase";
import { Btn, Toast, G } from "../AdminUI";

export default function PaymentReviewManager() {
  const [payments, setPayments] = useState([]);
  const [toast, setToast] = useState(null);
  const db = getFirebaseDb();
  const toast_ = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "payments"), orderBy("submittedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => console.error("Error loading payments:", err));
    return () => unsub();
  }, [db]);

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "payments", id), { reviewStatus: status, reviewedAt: serverTimestamp() });
      toast_(`Imewekwa kama ${status}!`);
    } catch (e) {
      console.error(e);
      toast_("Imeshindwa kusasisha!", "error");
    }
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type}/>}
      <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, margin:"0 0 20px" }}>Payment Review</h3>
      <div style={{ display: "grid", gap: 12 }}>
        {payments.map(p => (
          <div key={p.id} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", background: "#1a1d2e", padding: "14px 18px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.customerName} - {p.amountPaid}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Status: {p.reviewStatus} | Ref: {p.paymentReference}</div>
            </div>
            {p.reviewStatus === "pending" && (
              <>
                <Btn onClick={() => updateStatus(p.id, "approved")} color={G} textColor="#111" style={{ padding: "8px 14px" }}>Approve</Btn>
                <Btn onClick={() => updateStatus(p.id, "rejected")} color="rgba(239,68,68,.12)" textColor="#fca5a5" style={{ padding: "8px 14px" }}>Reject</Btn>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
