import React, { useState, useMemo } from 'react';
import { useAdminSitesCatalog } from './useAdminSitesCatalog.js';
import { useWebsiteCategories } from '../../hooks/useWebsiteCategories.js';
import { useAuth } from '../../hooks/useAuth.js';
import { logAdminActivity } from '../../utils/siteAnalytics.js';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function SitesAdminCategories() {
  const { websites, initialLoadDone } = useAdminSitesCatalog();
  const { categories } = useWebsiteCategories(websites);
  const { user } = useAuth();

  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formIcon, setFormIcon] = useState("");
  const [formOrder, setFormOrder] = useState(99);
  const [saving, setSaving] = useState(false);

  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 4000);
  };

  // Sort categories by order
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => (a.order || 99) - (b.order || 99));
  }, [categories]);

  const handleOpenAdd = () => {
    setFormName("");
    setFormSlug("");
    setFormDesc("");
    setFormIcon("📁");
    setFormOrder((categories.length + 1) * 10);
    setError("");
    setAddModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setSelectedCat(cat);
    setFormName(cat.name || "");
    setFormSlug(cat.slug || cat.id || "");
    setFormDesc(cat.description || "");
    setFormIcon(cat.icon || "📁");
    setFormOrder(cat.order ?? 99);
    setError("");
    setEditModalOpen(true);
  };

  const handleSaveNew = async (e) => {
    e.preventDefault();
    const name = formName.trim();
    const slug = formSlug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!name) {
      setError("Category name is required.");
      return;
    }

    setSaving(true);
    try {
      const { getFirebaseDb, doc, setDoc } = await import('../../firebase.js');
      const db = getFirebaseDb();
      await setDoc(doc(db, "website_solution_categories", slug), {
        name,
        slug,
        description: formDesc.trim(),
        icon: formIcon.trim() || "📁",
        order: Number(formOrder) || 99,
        enabled: true,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      await logAdminActivity(user, 'category_created', 'category', slug, { name });
      window.dispatchEvent(new CustomEvent("stea-data-sync"));
      setAddModalOpen(false);
      showFeedback(`Category "${name}" created successfully!`);
    } catch (err) {
      setError("Failed to create category: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedCat) return;
    const name = formName.trim();
    const id = selectedCat.id || selectedCat.slug;
    if (!name) {
      setError("Category name is required.");
      return;
    }

    setSaving(true);
    try {
      const { getFirebaseDb, doc, setDoc } = await import('../../firebase.js');
      const db = getFirebaseDb();
      await setDoc(doc(db, "website_solution_categories", id), {
        name,
        description: formDesc.trim(),
        icon: formIcon.trim() || "📁",
        order: Number(formOrder) || 99,
        enabled: true,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      await logAdminActivity(user, 'category_renamed', 'category', id, { oldName: selectedCat.name, newName: name });
      window.dispatchEvent(new CustomEvent("stea-data-sync"));
      setEditModalOpen(false);
      showFeedback(`Category "${name}" updated successfully!`);
    } catch (err) {
      setError("Failed to update category: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    const id = cat.id || cat.slug;
    const count = cat.count || 0;
    const msg = count > 0
      ? `Are you sure? Category "${cat.name}" has ${count} website(s) assigned. Deleting this category will leave those entries uncategorized until reassigned.`
      : `Are you sure you want to delete category "${cat.name}"?`;

    if (!window.confirm(msg)) return;

    try {
      const { getFirebaseDb, doc, deleteDoc } = await import('../../firebase.js');
      const db = getFirebaseDb();
      await deleteDoc(doc(db, "website_solution_categories", id));
      await logAdminActivity(user, 'category_deleted', 'category', id, { name: cat.name });
      window.dispatchEvent(new CustomEvent("stea-data-sync"));
      showFeedback(`Category "${cat.name}" was deleted.`);
    } catch (err) {
      alert("Failed to delete category: " + err.message);
    }
  };

  const handleMove = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sortedCategories.length) return;

    const currentCat = sortedCategories[index];
    const targetCat = sortedCategories[targetIndex];

    try {
      const { getFirebaseDb, doc, setDoc } = await import('../../firebase.js');
      const db = getFirebaseDb();

      const currentOrder = targetCat.order ?? (targetIndex * 10);
      const targetOrder = currentCat.order ?? (index * 10);

      await Promise.all([
        setDoc(doc(db, "website_solution_categories", currentCat.id || currentCat.slug), {
          order: currentOrder === targetOrder ? currentOrder + direction : currentOrder,
        }, { merge: true }),
        setDoc(doc(db, "website_solution_categories", targetCat.id || targetCat.slug), {
          order: targetOrder,
        }, { merge: true }),
      ]);

      window.dispatchEvent(new CustomEvent("stea-data-sync"));
      showFeedback("Category order updated.");
    } catch (err) {
      alert("Failed to reorder: " + err.message);
    }
  };

  const isBooting = !initialLoadDone && categories.length === 0;

  return (
    <div style={{ color: '#F0F2F5', maxWidth: 960, paddingBottom: 40 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px', color: '#F0F2F5' }}>
            Category Manager
          </h1>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 13.5 }}>
            Add, rename, re-order, and manage navigation categories for STEA Websites.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 10,
            background: 'linear-gradient(135deg, #F5A623 0%, #D4AF37 100%)',
            color: '#000', border: 'none', fontWeight: 800, fontSize: 13,
            cursor: 'pointer', boxShadow: '0 4px 12px rgba(245,166,35,0.25)',
          }}
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
          background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.35)',
          borderRadius: 10, color: '#4ADE80', fontSize: 13, fontWeight: 600, marginBottom: 16,
        }}>
          <CheckCircle2 size={16} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Categories List Table */}
      {isBooting ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
          Loading category taxonomy…
        </div>
      ) : (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                <th style={{ padding: '12px 16px', width: 60 }}>Order</th>
                <th style={{ padding: '12px 16px' }}>Category Name</th>
                <th style={{ padding: '12px 16px' }}>Slug / ID</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Sites</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedCategories.map((cat, index) => {
                const count = cat.count || 0;
                return (
                  <tr
                    key={cat.id || cat.slug || index}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          type="button"
                          onClick={() => handleMove(index, -1)}
                          disabled={index === 0}
                          style={{ background: 'none', border: 'none', color: index === 0 ? 'rgba(255,255,255,0.1)' : '#F5A623', cursor: index === 0 ? 'default' : 'pointer', padding: 2 }}
                          title="Move Up"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(index, 1)}
                          disabled={index === sortedCategories.length - 1}
                          style={{ background: 'none', border: 'none', color: index === sortedCategories.length - 1 ? 'rgba(255,255,255,0.1)' : '#F5A623', cursor: index === sortedCategories.length - 1 ? 'default' : 'pointer', padding: 2 }}
                          title="Move Down"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <span style={{ marginLeft: 4 }}>{cat.order ?? (index + 1) * 10}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{cat.icon || '📁'}</span>
                        <strong style={{ color: '#F0F2F5' }}>{cat.name}</strong>
                      </div>
                      {cat.description && (
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                          {cat.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace', fontSize: 12 }}>
                      {cat.slug || cat.id}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 999,
                        background: count > 0 ? 'rgba(245,166,35,0.15)' : 'rgba(255,255,255,0.06)',
                        color: count > 0 ? '#F5A623' : 'rgba(255,255,255,0.4)',
                        fontSize: 12, fontWeight: 700,
                      }}>
                        {count}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cat)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '6px 12px', borderRadius: 8,
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#F0F2F5', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          }}
                          title="Rename or edit category"
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat)}
                          style={{
                            display: 'inline-flex', alignItems: 'center',
                            padding: '6px 8px', borderRadius: 8,
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                            color: '#EF4444', fontSize: 12, cursor: 'pointer',
                          }}
                          title="Delete category"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Category Modal */}
      {addModalOpen && (
        <div style={modalOverlayStyle} onClick={() => setAddModalOpen(false)}>
          <div style={modalCardStyle} onClick={e => e.stopPropagation()}>
            <div style={modalHeadStyle}>
              <h2 style={{ margin: 0, fontSize: 18, color: '#F0F2F5' }}>Add New Category</h2>
              <button type="button" onClick={() => setAddModalOpen(false)} style={modalCloseStyle}><X size={18} /></button>
            </div>
            {error && <div style={errorBannerStyle}>{error}</div>}
            <form onSubmit={handleSaveNew} style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={labelStyle}>Category Name *</label>
                <input required value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. AI Prompt Tools" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Slug (Optional)</label>
                  <input value={formSlug} onChange={e => setFormSlug(e.target.value)} placeholder="e.g. ai-prompt-tools" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Icon / Emoji</label>
                  <input value={formIcon} onChange={e => setFormIcon(e.target.value)} placeholder="📁" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Brief summary of resources in this category" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Display Order</label>
                <input type="number" value={formOrder} onChange={e => setFormOrder(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setAddModalOpen(false)} style={btnCancelStyle}>Cancel</button>
                <button type="submit" disabled={saving} style={btnSubmitStyle}>{saving ? "Saving…" : "Create Category"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editModalOpen && (
        <div style={modalOverlayStyle} onClick={() => setEditModalOpen(false)}>
          <div style={modalCardStyle} onClick={e => e.stopPropagation()}>
            <div style={modalHeadStyle}>
              <h2 style={{ margin: 0, fontSize: 18, color: '#F0F2F5' }}>Edit Category: {selectedCat?.name}</h2>
              <button type="button" onClick={() => setEditModalOpen(false)} style={modalCloseStyle}><X size={18} /></button>
            </div>
            {error && <div style={errorBannerStyle}>{error}</div>}
            <form onSubmit={handleSaveEdit} style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={labelStyle}>Category Name *</label>
                <input required value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Developer Resources" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Icon / Emoji</label>
                  <input value={formIcon} onChange={e => setFormIcon(e.target.value)} placeholder="📁" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Display Order</label>
                  <input type="number" value={formOrder} onChange={e => setFormOrder(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Brief summary of resources" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setEditModalOpen(false)} style={btnCancelStyle}>Cancel</button>
                <button type="submit" disabled={saving} style={btnSubmitStyle}>{saving ? "Saving…" : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const modalOverlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999, padding: 16,
};
const modalCardStyle = {
  background: '#111522', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 16, width: '100%', maxWidth: 520, padding: 24,
  boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
};
const modalHeadStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  marginBottom: 16,
};
const modalCloseStyle = {
  background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
};
const labelStyle = {
  display: 'block', fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.7)',
  marginBottom: 6,
};
const inputStyle = {
  width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
  color: '#F0F2F5', fontSize: 13.5, boxSizing: 'border-box',
};
const errorBannerStyle = {
  padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.15)',
  border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 12.5,
  marginBottom: 12,
};
const btnCancelStyle = {
  padding: '9px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)', color: '#F0F2F5', fontSize: 13,
  fontWeight: 600, cursor: 'pointer',
};
const btnSubmitStyle = {
  padding: '9px 18px', borderRadius: 8, background: '#F5A623',
  border: 'none', color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer',
};
