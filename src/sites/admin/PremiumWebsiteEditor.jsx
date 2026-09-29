import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getFirebaseDb, collection, doc, getDoc, setDoc, addDoc,
  serverTimestamp,
} from "../../firebase.js";
import { normalizeWebsiteCategorySlug } from "../../constants/categoryOrder.js";
import WebsiteSolutionCard from "../../components/WebsiteSolutionCard.jsx";

const PRICING_OPTIONS = [
  { value: "paid", label: "Paid" },
  { value: "free", label: "Free" },
  { value: "freemium", label: "Freemium" },
  { value: "ad-supported", label: "Ad-Supported" },
  { value: "rental-purchase", label: "Rental / Purchase" },
  { value: "unknown", label: "Unknown" },
];

const STATUS_OPTIONS = [
  { value: "official", label: "Official" },
  { value: "verified", label: "Verified" },
  { value: "unverified", label: "Unverified" },
  { value: "unofficial", label: "Unofficial" },
];

const CONTENT_TYPES = [
  "Movies & TV", "Movies", "TV Shows", "Series",
  "Discovery", "Reviews", "Database", "Entertainment",
];

const EMPTY_FORM = {
  name: "",
  url: "",
  description: "",
  logoUrl: "",
  category: "Movies & TV Shows",
  subcategory: "",
  pricingType: "paid",
  sourceStatus: "official",
  contentType: "Movies & TV",
  country: "",
  language: "",
  tags: "",
  featured: false,
  popular: false,
  trending: false,
  published: true,
};

function extractDomain(url) {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`)
      .hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

export default function PremiumWebsiteEditor() {
  const navigate = useNavigate();
  const { siteId } = useParams();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(Boolean(siteId));

  // Load existing record if editing
  useEffect(() => {
    if (!siteId) return;
    (async () => {
      try {
        const db = getFirebaseDb();
        const snap = await getDoc(doc(db, "websites", siteId));
        if (snap.exists()) {
          const d = snap.data();
          setForm({
            name: d.name || d.title || "",
            url: d.url || d.link || d.websiteUrl || "",
            description: d.description || d.summary || "",
            logoUrl: d.logo || d.logoUrl || d.icon || "",
            category: d.category || d.categoryName || "Movies & TV Shows",
            subcategory: d.subcategory || d.subCategory || "",
            pricingType: d.pricingType || "unknown",
            sourceStatus: d.sourceStatus || "unverified",
            contentType: d.contentType || "Movies & TV",
            country: d.country || "",
            language: d.language || "",
            tags: Array.isArray(d.tags) ? d.tags.join(", ") : (d.tags || ""),
            featured: Boolean(d.featured),
            popular: Boolean(d.popular || d.isPopular),
            trending: Boolean(d.trending),
            published: d.published !== false,
          });
        }
      } catch (e) {
        setMessage("Failed to load website: " + e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [siteId]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // Build a live preview site object from the form
  const previewSite = useMemo(() => {
    const domain = extractDomain(form.url) || "example.com";
    return {
      id: "preview",
      name: form.name || "Website Name",
      title: form.name || "Website Name",
      url: form.url || "https://example.com",
      domain,
      hostname: domain,
      category: form.category,
      categoryName: form.category,
      categorySlug: normalizeWebsiteCategorySlug(form.category),
      description: form.description,
      summary: form.description,
      pricing: form.pricingType === "paid" ? "Premium" : form.pricingType === "free" || form.pricingType === "ad-supported" ? "Free" : "Freemium",
      pricingType: form.pricingType,
      sourceStatus: form.sourceStatus,
      logo: form.logoUrl || undefined,
      logoUrl: form.logoUrl || undefined,
      tags: typeof form.tags === "string" ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      featured: form.featured,
    };
  }, [form]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) {
      setMessage("Name and URL are required.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const db = getFirebaseDb();
      const domain = extractDomain(form.url);
      const categorySlug = normalizeWebsiteCategorySlug(form.category);
      const parsedTags = typeof form.tags === "string"
        ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      const payload = {
        name: form.name.trim(),
        title: form.name.trim(),
        url: form.url.trim(),
        normalizedUrl: form.url.trim(),
        link: form.url.trim(),
        websiteUrl: form.url.trim(),
        mainUrl: form.url.trim(),
        domain,
        hostname: domain,
        category: form.category,
        categoryName: form.category,
        categorySlug,
        subcategory: form.subcategory,
        subCategory: form.subcategory,
        subcategorySlug: "",
        subCategorySlug: "",
        description: form.description.trim(),
        summary: form.description.trim(),
        status: form.published ? "published" : "draft",
        published: form.published,
        active: form.published,
        isAdult: false,
        is_adult: false,
        safetyRating: "Unknown",
        pricing: form.pricingType === "paid" ? "Premium" : form.pricingType === "free" || form.pricingType === "ad-supported" ? "Free" : "Freemium",
        pricingType: form.pricingType,
        sourceStatus: form.sourceStatus,
        contentType: form.contentType,
        country: form.country,
        language: form.language,
        mobileFriendly: true,
        mirrorUrl: "",
        tags: parsedTags,
        appDownloads: { playStore: "", appStore: "", windows: "", mac: "", linux: "" },
        platforms: [],
        downloadLinks: [],
        featured: form.featured,
        popular: form.popular,
        trending: form.trending,
        updatedAt: serverTimestamp(),
      };

      if (siteId) {
        await setDoc(doc(db, "websites", siteId), payload, { merge: true });
        setMessage("Website updated successfully!");
      } else {
        payload.createdAt = serverTimestamp();
        payload.visits = 0;
        payload.favoritesCount = 0;
        payload.clicks = 0;
        await addDoc(collection(db, "websites"), payload);
        setMessage("Website created successfully!");
      }
    } catch (err) {
      setMessage("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={styles.page}><div style={styles.loading}>Loading…</div></div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
        <h1 style={styles.title}>{siteId ? "Edit Website" : "Add Website"}</h1>
        <div style={{ flex: 1 }} />
        <button onClick={handleSave} disabled={saving} style={{ ...styles.saveBtn, opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving…" : "Save Website"}
        </button>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      <div style={styles.layout}>
        {/* LEFT: Form */}
        <form onSubmit={handleSave} style={styles.form}>
          {/* Section 1: Identity */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Website Identity</h2>
            <div style={styles.field}>
              <label style={styles.label}>Website Name</label>
              <input style={styles.input} value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. Netflix" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Domain / URL</label>
              <input style={styles.input} value={form.url} onChange={(e) => setField("url", e.target.value)} placeholder="https://netflix.com" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Short Description</label>
              <textarea style={{ ...styles.input, minHeight: 70, resize: "vertical" }} value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="What is this website?" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Logo URL (optional)</label>
              <input style={styles.input} value={form.logoUrl} onChange={(e) => setField("logoUrl", e.target.value)} placeholder="https://.../logo.png" />
            </div>
            <div style={styles.fieldRow}>
              <div style={styles.field}>
                <label style={styles.label}>Category</label>
                <input style={styles.input} value={form.category} onChange={(e) => setField("category", e.target.value)} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Subcategory</label>
                <input style={styles.input} value={form.subcategory} onChange={(e) => setField("subcategory", e.target.value)} />
              </div>
            </div>
          </section>

          {/* Section 2: Classification */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Classification</h2>
            <div style={styles.field}>
              <label style={styles.label}>Pricing Model</label>
              <div style={styles.pillGroup}>
                {PRICING_OPTIONS.map((o) => (
                  <button
                    type="button"
                    key={o.value}
                    onClick={() => setField("pricingType", o.value)}
                    style={{ ...styles.pill, ...(form.pricingType === o.value ? styles.pillActive : {}) }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Source Status</label>
              <div style={styles.pillGroup}>
                {STATUS_OPTIONS.map((o) => (
                  <button
                    type="button"
                    key={o.value}
                    onClick={() => setField("sourceStatus", o.value)}
                    style={{ ...styles.pill, ...(form.sourceStatus === o.value ? styles.pillActive : {}) }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Content Type</label>
              <select style={styles.input} value={form.contentType} onChange={(e) => setField("contentType", e.target.value)}>
                {CONTENT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </section>

          {/* Section 3: Discovery */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Discovery Metadata</h2>
            <div style={styles.fieldRow}>
              <div style={styles.field}>
                <label style={styles.label}>Country / Region</label>
                <input style={styles.input} value={form.country} onChange={(e) => setField("country", e.target.value)} placeholder="e.g. Global" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Language</label>
                <input style={styles.input} value={form.language} onChange={(e) => setField("language", e.target.value)} placeholder="e.g. English" />
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Tags (comma separated)</label>
              <input style={styles.input} value={form.tags} onChange={(e) => setField("tags", e.target.value)} placeholder="streaming, movies, free" />
            </div>
            <div style={styles.toggleRow}>
              {[
                { key: "featured", label: "Featured" },
                { key: "popular", label: "Popular" },
                { key: "trending", label: "Trending" },
              ].map((t) => (
                <label key={t.key} style={styles.toggleLabel}>
                  <input type="checkbox" checked={form[t.key]} onChange={(e) => setField(t.key, e.target.checked)} style={styles.checkbox} />
                  {t.label}
                </label>
              ))}
            </div>
          </section>

          {/* Section 4: Publishing */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Publishing</h2>
            <label style={styles.toggleLabel}>
              <input type="checkbox" checked={form.published} onChange={(e) => setField("published", e.target.checked)} style={styles.checkbox} />
              Published (visible publicly)
            </label>
          </section>
        </form>

        {/* RIGHT: Live Card Preview */}
        <div style={styles.previewCol}>
          <div style={styles.previewSticky}>
            <h2 style={styles.sectionTitle}>Live Card Preview</h2>
            <p style={styles.previewHint}>This is exactly how the website will appear on STEA.</p>
            <div style={styles.previewCard}>
              <WebsiteSolutionCard site={previewSite} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "24px 28px",
    color: "#fff",
    fontFamily: "'Instrument Sans', system-ui, sans-serif",
    background: "#0a0b10",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  backBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
    padding: "8px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
  },
  title: { fontSize: 22, margin: 0, fontWeight: 700 },
  saveBtn: {
    background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
    border: "none",
    color: "#fff",
    padding: "10px 22px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  message: {
    background: "rgba(124,58,237,0.12)",
    border: "1px solid rgba(124,58,237,0.3)",
    padding: "10px 14px",
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 380px",
    gap: 24,
    alignItems: "start",
  },
  form: { display: "flex", flexDirection: "column", gap: 18 },
  section: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14,
    padding: 20,
  },
  sectionTitle: { fontSize: 14, fontWeight: 700, margin: "0 0 14px", color: "#E5E7EB", textTransform: "uppercase", letterSpacing: "0.05em" },
  field: { marginBottom: 12, flex: 1 },
  fieldRow: { display: "flex", gap: 12 },
  label: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#D1D5DB" },
  input: {
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
  },
  pillGroup: { display: "flex", flexWrap: "wrap", gap: 8 },
  pill: {
    padding: "7px 14px",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#D1D5DB",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 500,
  },
  pillActive: {
    background: "rgba(124,58,237,0.25)",
    borderColor: "rgba(124,58,237,0.6)",
    color: "#fff",
  },
  toggleRow: { display: "flex", gap: 20, flexWrap: "wrap" },
  toggleLabel: { display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer", color: "#D1D5DB" },
  checkbox: { width: 16, height: 16, accentColor: "#7C3AED" },
  previewCol: { position: "sticky", top: 20 },
  previewSticky: {
    position: "sticky",
    top: 20,
  },
  previewHint: { fontSize: 12, color: "#9CA3AF", margin: "0 0 14px" },
  previewCard: {
    background: "rgba(0,0,0,0.2)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 16,
  },
  loading: { padding: 40, textAlign: "center", color: "#9CA3AF" },
};
