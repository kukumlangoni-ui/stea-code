import React from 'react';
import { Btn, Input } from '../AdminUI.jsx';

export const VariantsEditor = ({ variants, onChange }) => {
  const addVariant = () => onChange([...(variants || []), { label: '', price: 0, oldPrice: 0, stock: 0, image: '', sku: '', active: true }]);
  const updateVariant = (idx, field, val) => {
    const newVariants = [...variants];
    newVariants[idx] = { ...newVariants[idx], [field]: field === 'price' || field === 'oldPrice' || field === 'stock' ? Number(val) : val };
    onChange(newVariants);
  };
  const removeVariant = (idx) => onChange(variants.filter((_, i) => i !== idx));

  return (
    <div style={{ padding: 16, borderRadius: 12, background: "rgba(255,255,255,.02)", border: `1px solid rgba(255,255,255,.1)` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h4 style={{ margin: 0, fontSize: 13, color: "#F5A623" }}>PRODUCT VARIANTS</h4>
        <Btn onClick={addVariant} style={{ padding: "4px 10px", fontSize: 11 }}>+ Add Variant</Btn>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {(variants || []).map((v, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", padding: 8, background: "rgba(255,255,255,.05)", borderRadius: 8 }}>
            <Input placeholder="Label (e.g. 256GB)" value={v.label} onChange={e => updateVariant(i, 'label', e.target.value)} style={{ flex: 1, minWidth: 100 }} />
            <Input type="number" placeholder="Price" value={v.price} onChange={e => updateVariant(i, 'price', e.target.value)} style={{ width: 80 }} />
            <Input type="number" placeholder="Stock" value={v.stock} onChange={e => updateVariant(i, 'stock', e.target.value)} style={{ width: 60 }} />
            <button onClick={() => removeVariant(i)} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
};
