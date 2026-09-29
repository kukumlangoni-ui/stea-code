import React, { useState, useEffect } from "react";
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import { getFirebaseDb, handleFirestoreError, OperationType } from "../../firebase";
import { Btn, Toast, Field, Input, G } from "../AdminUI";

export default function DeliveryManager() {
  const [deliveries, setDeliveries] = useState([]);
  const [settings, setSettings] = useState({ localFee: "5000", regionFee: "15000" });
  const [savingSettings, setSavingSettings] = useState(false);
  const [toast, setToast] = useState(null);
  const db = getFirebaseDb();
  const toast_ = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  useEffect(() => {
    if (!db) return;
    const unsubDel = onSnapshot(collection(db, "deliveries"), (snap) => setDeliveries(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => console.error("Error loading deliveries:", err));
    const unsubSet = onSnapshot(doc(db, "site_settings", "delivery"), (snap) => {
      if (snap.exists() && snap.data().data) {
        setSettings(prev => ({ ...prev, ...snap.data().data }));
      }
    });

    return () => {
      unsubDel();
      unsubSet();
    };
  }, [db]);

  const markDelivered = async (id) => {
    try {
      await updateDoc(doc(db, "deliveries", id), { deliveryStatus: "delivered", deliveredAt: serverTimestamp() });
      toast_("Imewekwa kama Delivered!");
    } catch (e) {
      console.error(e);
      toast_("Imeshindwa kusasisha", "error");
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, "site_settings", "delivery"), { data: settings, updatedAt: serverTimestamp() });
      toast_("Settings zimehifadhiwa!");
    } catch (err) {
      console.error(err);
      if (err.message?.includes("insufficient permissions")) {
        handleFirestoreError(err, OperationType.WRITE, `site_settings/delivery`);
      }
      toast_(err.message, "error");
    }
    setSavingSettings(false);
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type}/>}
      <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, margin:"0 0 20px" }}>Delivery Manager</h3>
      
      {/* Settings Section */}
      <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", background: "#1a1d2e", padding: "20px", marginBottom: 24 }}>
        <h4 style={{ margin: "0 0 16px", fontSize: 16, color: G }}>Delivery Prices (TZS)</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Local Delivery (Dar es Salaam)">
            <Input type="number" value={settings.localFee} onChange={e => setSettings({ ...settings, localFee: e.target.value })} />
          </Field>
          <Field label="Region Delivery (Outside DSM)">
            <Input type="number" value={settings.regionFee} onChange={e => setSettings({ ...settings, regionFee: e.target.value })} />
          </Field>
        </div>
        <div style={{ marginTop: 16 }}>
          <Btn onClick={saveSettings} disabled={savingSettings}>{savingSettings ? "Saving..." : "Save Settings"}</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {deliveries.map(d => (
          <div key={d.id} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", background: "#1a1d2e", padding: "14px 18px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Order: {d.orderId}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Status: {d.deliveryStatus}</div>
            </div>
            {d.deliveryStatus !== "delivered" && (
              <Btn onClick={() => markDelivered(d.id)} color={G} textColor="#111" style={{ padding: "8px 14px" }}>Mark Delivered</Btn>
            )}
          </div>
        ))}
        {deliveries.length === 0 && (
          <div style={{ color: "rgba(255,255,255,.4)", textAlign: "center", padding: "20px 0" }}>No pending deliveries found.</div>
        )}
      </div>
    </div>
  );
}
