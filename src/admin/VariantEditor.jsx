/**
 * VariantEditor — Admin panel variant management for Tanzania products.
 * Create/edit/delete/reorder/enable variants with price, stock, image, SKU.
 */
import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StorageMediaField } from "./AdminUI.jsx";

const G      = "#F5A623";
const BORDER = "rgba(255,255,255,.08)";
const iSt    = {
  height: 40, borderRadius: 9, background: "rgba(255,255,255,.05)",
  border: `1px solid ${BORDER}`, color: "#fff", padding: "0 12px",
  fontFamily: "inherit", fontSize: 13, outline: "none",
  width: "100%", boxSizing: "border-box",
};
const lSt = {
  fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,.4)",
  textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, display: "block",
};

const EMPTY_VARIANT = {
  id: "", label: "", groupLabel: "Storage", price: "", oldPrice: "",
  stock: "", sku: "", imageUrl: "", active: true, order: 0,
};

function genId() {
  return `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

const COMMON_GROUPS = ["Storage", "RAM", "Color", "Size", "Condition", "Model", "Edition", "Custom"];

function VariantForm({ initial, onSave, onCancel, existingGroups }) {
  const [form, setForm] = useState({ ...EMPTY_VARIANT, ...initial });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const allGroups = Array.from(new Set([...COMMON_GROUPS, ...existingGroups]));

  return (
    <div style={{ background: "rgba(255,255,255,.04)", border: `1px solid ${G}30`, borderRadius: 12, padding: 16, display: "grid", gap: 10 }}>
      <div style={{ fontWeight: 800, fontSize: 13, color: G, marginBottom: 2 }}>
        {initial?.id ? "✏️ Edit Variant" : "➕ Add Variant"}
      </div>

      {/* Group + Label */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
        <div>
          <label style={lSt}>Group / Option Name *</label>
          <input
            value={form.groupLabel}
            onChange={e => set("groupLabel", e.target.value)}
            list="variant-groups"
            placeholder="e.g. Storage, Color"
            style={iSt}
          />
          <datalist id="variant-groups">
            {allGroups.map(g => <option key={g} value={g} />)}
          </datalist>
        </div>
        <div>
          <label style={lSt}>Variant Label *</label>
          <input
            value={form.label}
            onChange={e => set("label", e.target.value)}
            placeholder="e.g. 256GB, Black, New"
            style={iSt}
          />
        </div>
      </div>

      {/* Price + Old Price */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
        <div>
          <label style={lSt}>Price (TZS) *</label>
          <input
            type="number"
            value={form.price}
            onChange={e => set("price", e.target.value)}
            placeholder="e.g. 2800000"
            style={iSt}
          />
        </div>
        <div>
          <label style={lSt}>Old Price (optional)</label>
          <input
            type="number"
            value={form.oldPrice}
            onChange={e => set("oldPrice", e.target.value)}
            placeholder="Original price"
            style={iSt}
          />
        </div>
      </div>

      {/* Stock + SKU + Order */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 10 }}>
        <div>
          <label style={lSt}>Stock Qty</label>
          <input
            type="number"
            value={form.stock}
            onChange={e => set("stock", e.target.value)}
            placeholder="e.g. 10"
            style={iSt}
          />
        </div>
        <div>
          <label style={lSt}>SKU (optional)</label>
          <input value={form.sku} onChange={e => set("sku", e.target.value)} placeholder="e.g. IPH15-256-BLK" style={iSt} />
        </div>
        <div>
          <label style={lSt}>Order #</label>
          <input type="number" value={form.order} onChange={e => set("order", Number(e.target.value))} style={iSt} />
        </div>
      </div>

      {/* Image URL / upload */}
      <div>
        <StorageMediaField
          label="Variant Image (optional)"
          value={form.imageUrl}
          onChange={url => set("imageUrl", url)}
        />
      </div>

      {/* Active toggle */}
      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.7)" }}>
        <input
          type="checkbox"
          checked={!!form.active}
          onChange={e => set("active", e.target.checked)}
        />
        Active (visible to buyers)
      </label>

      {/* Save / Cancel */}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          onClick={() => {
            if (!form.groupLabel || !form.label || !form.price) return;
            onSave({ ...form, id: form.id || genId(), price: Number(form.price), oldPrice: form.oldPrice ? Number(form.oldPrice) : null, stock: form.stock !== "" ? Number(form.stock) : null, order: Number(form.order) || 0 });
          }}
          disabled={!form.groupLabel || !form.label || !form.price}
          style={{ flex: 1, height: 38, borderRadius: 9, border: "none", background: G, color: "#000", fontWeight: 800, cursor: "pointer", opacity: (!form.groupLabel || !form.label || !form.price) ? 0.5 : 1, fontSize: 13 }}
        >
          {initial?.id ? "Save Changes" : "Add Variant"}
        </button>
        <button
          onClick={onCancel}
          style={{ height: 38, padding: "0 14px", borderRadius: 9, border: `1px solid ${BORDER}`, background: "transparent", color: "rgba(255,255,255,.6)", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function VariantRow({ v, onEdit, onDelete, onToggle, onMoveUp, onMoveDown, isFirst, isLast }) {
  const hasStock = v.stock !== null && v.stock !== undefined;
  const outOfStock = hasStock && Number(v.stock) <= 0;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
      background: v.active ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.02)",
      border: `1px solid ${v.active ? BORDER : "rgba(255,255,255,.04)"}`,
      borderRadius: 10, opacity: v.active ? 1 : 0.5,
    }}>
      {/* Reorder buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
        <button onClick={onMoveUp} disabled={isFirst} style={{ background: "none", border: "none", color: isFirst ? "rgba(255,255,255,.15)" : "rgba(255,255,255,.5)", cursor: isFirst ? "default" : "pointer", fontSize: 11, padding: "1px 4px", lineHeight: 1 }}>▲</button>
        <button onClick={onMoveDown} disabled={isLast} style={{ background: "none", border: "none", color: isLast ? "rgba(255,255,255,.15)" : "rgba(255,255,255,.5)", cursor: isLast ? "default" : "pointer", fontSize: 11, padding: "1px 4px", lineHeight: 1 }}>▼</button>
      </div>

      {/* Variant image */}
      {v.imageUrl && (
        <img src={v.imageUrl} alt="" style={{ width: 36, height: 36, borderRadius: 7, objectFit: "cover", flexShrink: 0 }} referrerPolicy="no-referrer" onError={e => e.target.style.display = "none"} />
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".05em" }}>{v.groupLabel}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{v.label}</span>
          {v.sku && <span style={{ fontSize: 10, color: "rgba(255,255,255,.25)", fontFamily: "monospace" }}>{v.sku}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
          {v.price !== null && v.price !== "" && (
            <span style={{ fontSize: 12, fontWeight: 800, color: G }}>TZS {Number(v.price).toLocaleString()}</span>
          )}
          {v.oldPrice && <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)", textDecoration: "line-through" }}>TZS {Number(v.oldPrice).toLocaleString()}</span>}
          {hasStock && (
            <span style={{ fontSize: 11, fontWeight: 700, color: outOfStock ? "#f87171" : "#4ade80" }}>
              {outOfStock ? "Out of stock" : `Stock: ${v.stock}`}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button onClick={onToggle} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15 }} title={v.active ? "Disable" : "Enable"}>
          {v.active ? "🟢" : "🔴"}
        </button>
        <button onClick={onEdit} style={{ background: "none", border: "none", color: "#60a5fa", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>Edit</button>
        <button onClick={onDelete} style={{ background: "none", border: "none", color: "#ef4444", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>Del</button>
      </div>
    </div>
  );
}

/**
 * Main VariantEditor
 * @param {{ variants: Array, onChange: (variants: Array) => void }}
 */
export default function VariantEditor({ variants = [], onChange }) {
  const [showForm, setShowForm] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);

  const safeVariants = Array.isArray(variants) ? variants : [];
  const existingGroups = Array.from(new Set(safeVariants.map(v => v.groupLabel).filter(Boolean)));

  const openNew  = () => { setEditingIdx(null); setShowForm(true); };
  const openEdit = (i) => { setEditingIdx(i); setShowForm(true); };
  const cancel   = () => { setShowForm(false); setEditingIdx(null); };

  const handleSave = (v) => {
    const updated = [...safeVariants];
    if (editingIdx !== null) updated[editingIdx] = v;
    else updated.push(v);
    onChange(updated);
    cancel();
  };

  const handleDelete  = (i) => { onChange(safeVariants.filter((_, j) => j !== i)); };
  const handleToggle  = (i) => { const u = [...safeVariants]; u[i] = { ...u[i], active: !u[i].active }; onChange(u); };
  const handleMoveUp  = (i) => { if (i === 0) return; const u = [...safeVariants]; [u[i-1], u[i]] = [u[i], u[i-1]]; onChange(u); };
  const handleMoveDown= (i) => { if (i >= safeVariants.length - 1) return; const u = [...safeVariants]; [u[i], u[i+1]] = [u[i+1], u[i]]; onChange(u); };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Variants / Chaguzi</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginLeft: 8 }}>
            {safeVariants.length} total · {safeVariants.filter(v => v.active !== false).length} active
          </span>
        </div>
        <button
          onClick={openNew}
          style={{ background: `${G}18`, border: `1px solid ${G}30`, color: G, borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
        >
          + Add Variant
        </button>
      </div>

      {/* Hint */}
      {safeVariants.length === 0 && !showForm && (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,.3)", margin: "6px 0 10px" }}>
          No variants. Product will use base price. Add variants for Storage, Color, RAM etc.
        </p>
      )}

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div key="form" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} style={{ marginBottom: 12 }}>
            <VariantForm
              initial={editingIdx !== null ? safeVariants[editingIdx] : undefined}
              existingGroups={existingGroups}
              onSave={handleSave}
              onCancel={cancel}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div style={{ display: "grid", gap: 7 }}>
        {safeVariants.map((v, i) => (
          <VariantRow
            key={v.id || i}
            v={v}
            onEdit={() => openEdit(i)}
            onDelete={() => handleDelete(i)}
            onToggle={() => handleToggle(i)}
            onMoveUp={() => handleMoveUp(i)}
            onMoveDown={() => handleMoveDown(i)}
            isFirst={i === 0}
            isLast={i === safeVariants.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
