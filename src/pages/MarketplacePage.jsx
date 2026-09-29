import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, ChevronLeft, ChevronRight,
  MapPin, MessageCircle,
  Filter, Shield, RefreshCw
} from "lucide-react";
import {
  getFirebaseDb, collection, onSnapshot, query,
  where, limit
} from "../firebase.js";
import { useMobile } from "../hooks/useMobile.js";
import { useSettings } from "../contexts/SettingsContext.jsx";
import { useCheckout } from "../contexts/CheckoutContext.jsx";
import { ProductSkeleton } from "../components/Skeleton.jsx";
import { ShopProductCard } from "../components/ShopProductCard.jsx";
import AdSlot from "../components/AdSlot.jsx";
import SEOHead from "../components/SEOHead.jsx";


import { MARKET_CATEGORIES } from "../constants/marketplace.js";
import { SteaExploreMore } from "../components/SteaEcosystem.jsx";
import SteaHero from "../components/ui/SteaHero.jsx";
import STEAHeader from "../components/shared/STEAHeader.jsx";
import { useAuth } from "../hooks/useAuth.js";

// ── Constants ────────────────────────────────────────
const G = "#F5A623";
const DARK = "#05060a";
const BORDER = "rgba(255,255,255,0.06)";

// ── Category Config ──────────────────────────────────
// (Moved to src/constants/marketplace.js)

const STEA_WA = "255757053354";
const CONDITIONS = ["New","Used","Refurbished"];

// ── Price Formatter ─────────────────────────────────
function fmtPrice(n) {
  if (!n && n !== 0) return "";
  return `Tsh ${Number(n).toLocaleString()}`;
}

// ── Shared Micro Components ──────────────────────────
const Badge = ({ children, color = G, bg }) => (
  <span style={{
    padding: "3px 9px", borderRadius: 999, fontSize: 10, fontWeight: 800,
    background: bg || `${color}18`, color, border: `1px solid ${color}30`,
    textTransform: "uppercase", letterSpacing: ".04em", whiteSpace: "nowrap",
  }}>{children}</span>
);

// ── Category Filters ─────────────────────────────────
function CategoryFilters({ catId, filters, onChange }) {
  const { t } = useSettings();
  const cat = MARKET_CATEGORIES[catId];
  if (!cat) return null;

  const hasSubcats = cat.subcategories?.length > 0;
  const hasBrands = cat.brands?.length > 0;
  const hasSubItems = cat.subItems && filters.subcategory;

  return (
       <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Row: Subcategories/Types */}
      {hasSubcats && (
        <div>
          <span className="stea-shop-category-header">Shop by type</span>
          <div className="stea-chip-group no-scrollbar">
            <button 
              className={`stea-chip glass ${!filters.subcategory ? 'stea-chip--active' : ''}`}
              onClick={() => onChange({ ...filters, subcategory: null, subItem: null })}
            >
              All items
            </button>
            {cat.subcategories.map(sub => (
              <button 
                key={sub} 
                className={`stea-chip glass ${filters.subcategory === sub ? 'stea-chip--active' : ''}`}
                onClick={() => onChange({ ...filters, subcategory: sub, subItem: null })}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Row: Brands / SubItems */}
      {(hasBrands || hasSubItems) && (
        <div className="glass-card" style={{ padding: 16, borderRadius: 18 }}>
          {hasBrands && (
            <>
              <span className="stea-shop-category-header">Filter by Brand</span>
              <div className="stea-chip-group no-scrollbar">
                <button 
                  className={`stea-chip glass ${!filters.brand ? 'stea-chip--active' : ''}`}
                  onClick={() => onChange({ ...filters, brand: null })}
                >
                  All Brands
                </button>
                {cat.brands.map(b => (
                  <button 
                    key={b} 
                    className={`stea-chip glass ${filters.brand === b ? 'stea-chip--active' : ''}`}
                    onClick={() => onChange({ ...filters, brand: filters.brand === b ? null : b })}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </>
          )}
          {hasSubItems && cat.subItems[filters.subcategory] && (
            <>
              <span className="stea-shop-category-header" style={{ marginTop: hasBrands ? 12 : 0 }}>Specific Models</span>
              <div className="stea-chip-group no-scrollbar">
                {cat.subItems[filters.subcategory].map(item => (
                  <button 
                    key={item} 
                    className={`stea-chip glass ${filters.subItem === item ? 'stea-chip--active' : ''}`}
                    onClick={() => onChange({ ...filters, subItem: filters.subItem === item ? null : item })}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Row: Conditions (Hide for Beauty) */}
      {catId !== 'beauty' && (
        <div>
          <span className="stea-shop-category-header">Condition</span>
          <div className="stea-chip-group no-scrollbar">
            {CONDITIONS.map(c => (
              <button 
                key={c} 
                className={`stea-chip glass ${filters.condition === c ? 'stea-chip--active' : ''}`}
                onClick={() => onChange({ ...filters, condition: filters.condition === c ? null : c })}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const FilterChip = ({ children, active, onClick }) => (
  <button onClick={onClick} style={{
    padding: "7px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700,
    border: `1px solid ${active ? G : "rgba(255,255,255,.1)"}`,
    background: active ? `${G}15` : "transparent",
    color: active ? G : "rgba(255,255,255,.55)",
    cursor: "pointer", whiteSpace: "nowrap", transition: "all .15s", flexShrink: 0,
  }}>{children}</button>
);

// ── Fallback Premium Products for Instant Load ──────────
const FALLBACK_PRODUCTS = [
  // PHONES
  {
    id: "fb-phone-1",
    name: "Apple iPhone 15 Pro Max 256GB",
    category: "phones",
    subcategory: "Smartphones",
    brand: "Apple",
    condition: "Refurbished",
    price: 3100000,
    oldPrice: 3400000,
    base_price: 3100000,
    inStock: true,
    visible: true,
    published: true,
    isActive: true,
    status: "active",
    imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=600&auto=format&fit=crop",
    location: "Kariakoo, Dar es Salaam",
    sellerBusinessName: "STEA Premium Partner",
    description: "iPhone 15 Pro Max, condition kama mpya kabisa (99% BH). Inakuja na kasha lake na accessories zote.",
  },
  {
    id: "fb-phone-2",
    name: "Samsung Galaxy S24 Ultra 256GB",
    category: "phones",
    subcategory: "Smartphones",
    brand: "Samsung",
    condition: "New",
    price: 2850000,
    oldPrice: 3100000,
    base_price: 2850000,
    inStock: true,
    visible: true,
    published: true,
    isActive: true,
    status: "active",
    imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600&auto=format&fit=crop",
    location: "Hapa Hapa, Dar es Salaam",
    sellerBusinessName: "STEA Mall Sales",
    description: "Samsung S24 Ultra ya Kimataifa, 12GB RAM, 256GB ROM. Mpya kabisa ndani ya box na warranty ya mwaka mmoja.",
  },
  {
    id: "fb-phone-3",
    name: "Apple iPhone 13 128GB",
    category: "phones",
    subcategory: "Smartphones",
    brand: "Apple",
    condition: "Used",
    price: 1550000,
    oldPrice: 1750000,
    base_price: 1550000,
    inStock: true,
    visible: true,
    published: true,
    isActive: true,
    status: "active",
    imageUrl: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=600&auto=format&fit=crop",
    location: "Kariakoo, Dar es Salaam",
    sellerBusinessName: "M-Phone Store",
    description: "Used safi sana, haijawahi kufunguliwa, Face ID na TrueTone zinafanya kazi safi. Afya ya betri 87%.",
  },
  // ACCESSORIES
  {
    id: "fb-acc-1",
    name: "Apple AirPods Pro (2nd Generation)",
    category: "accessories",
    subcategory: "Headphones",
    brand: "Apple",
    condition: "New",
    price: 550000,
    oldPrice: 650000,
    base_price: 550000,
    inStock: true,
    visible: true,
    published: true,
    isActive: true,
    status: "active",
    imageUrl: "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?q=80&w=600&auto=format&fit=crop",
    location: "Dar es Salaam",
    sellerBusinessName: "STEA Verification",
    description: "AirPods Pro 2 ORIGINAL zenye Active Noise Cancellation na USB-C charging port. Mpya kabisa.",
  },
  {
    id: "fb-acc-2",
    name: "Sony WH-1000XM4 Noise Canceling Headphones",
    category: "accessories",
    subcategory: "Headphones",
    brand: "Sony",
    condition: "New",
    price: 850000,
    oldPrice: 950000,
    base_price: 850000,
    inStock: true,
    visible: true,
    published: true,
    isActive: true,
    status: "active",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop",
    location: "Arusha City",
    sellerBusinessName: "Sony Authorized Partner",
    description: "Headphones bora zaidi za wireless zenye Active Noise Cancellation duniani. Betri inadumu hadi saa 30.",
  },
  {
    id: "fb-acc-3",
    name: "Smart Watch Series 9 GPS 45mm",
    category: "accessories",
    subcategory: "Smartwatches",
    brand: "Apple",
    condition: "New",
    price: 980000,
    oldPrice: 1150000,
    base_price: 980000,
    inStock: true,
    visible: true,
    published: true,
    isActive: true,
    status: "active",
    imageUrl: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=600&auto=format&fit=crop",
    location: "Mlimani City, Dar",
    sellerBusinessName: "STEA Premium Partner",
    description: "Apple Watch Series 9 original, Space Gray aluminum case. Mpya kabisa na risiti pamoja na warranty.",
  },
  // LAPTOPS
  {
    id: "fb-lap-1",
    name: "MacBook Air M1 8GB / 256GB SSD",
    category: "laptops",
    subcategory: "Student Laptops",
    brand: "Apple",
    condition: "Refurbished",
    price: 1950000,
    oldPrice: 2200000,
    base_price: 1950000,
    inStock: true,
    visible: true,
    published: true,
    isActive: true,
    status: "active",
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600&auto=format&fit=crop",
    location: "Kariakoo, Dar es Salaam",
    sellerBusinessName: "Apple Hub Tz",
    description: "MacBook Air M1 ina hali bora 95%, Battery Health 91%, chaji inadumu kwa masaa 15+ ya matumizi.",
  },
  {
    id: "fb-lap-2",
    name: "HP EliteBook 840 G8 Core i5",
    category: "laptops",
    subcategory: "Business Laptops",
    brand: "HP",
    condition: "Refurbished",
    price: 1100000,
    oldPrice: 1300000,
    base_price: 1100000,
    inStock: true,
    visible: true,
    published: true,
    isActive: true,
    status: "active",
    imageUrl: "https://images.unsplash.com/photo-1496181130204-755241524eab?q=80&w=600&auto=format&fit=crop",
    location: "Posta, Dar es Salaam",
    sellerBusinessName: "SmartOffice Laptops",
    description: "16GB RAM, 512GB SSD. Screen ya inchi 14, keyboard backlight na alama ya kidole (fingerprint). Nzuri sana kwa masomo au ofisi.",
  },
  // TABLETS
  {
    id: "fb-tab-1",
    name: "Apple iPad Air 5th Gen M1 64GB",
    category: "tablets",
    subcategory: "iPads",
    brand: "Apple",
    condition: "New",
    price: 1650000,
    oldPrice: 1850000,
    base_price: 1650000,
    inStock: true,
    visible: true,
    published: true,
    isActive: true,
    status: "active",
    imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=600&auto=format&fit=crop",
    location: "Dar es Salaam",
    sellerBusinessName: "STEA Verification",
    description: "M1 chip processor, inasupport Apple Pencil 2. Inashika chaji siku nzima, mpya kabisa.",
  },
  // BEAUTY
  {
    id: "fb-beauty-1",
    name: "Chanel Bleu De Chanel Eau De Parfum",
    category: "beauty",
    subcategory: "Perfumes",
    brand: "Chanel",
    condition: "New",
    price: 380000,
    oldPrice: 420000,
    base_price: 380000,
    inStock: true,
    visible: true,
    published: true,
    isActive: true,
    status: "active",
    imageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=600&auto=format&fit=crop",
    location: "Dar es Salaam",
    sellerBusinessName: "Luxury Scent Tz",
    description: "Bleu de Chanel Parfum ya kiume, ujazo wa 100ml. Original yenye harufu inayodumu zaidi ya masaa 24.",
  }
];

// Robust, language-agnostic category matching
function matchesCategory(pCategory, targetCatId) {
  if (!targetCatId || targetCatId === "zote" || targetCatId === "all") return true;
  
  const pCat = String(pCategory || "").toLowerCase().trim();
  const tCat = String(targetCatId).toLowerCase().trim();
  
  if (pCat === tCat) return true;
  if (pCat.includes(tCat) || tCat.includes(pCat)) return true;
  
  // Plural/singular mappings and common Swahili translations
  const phoneTerms = ["phone", "phones", "simu", "smartphone", "smartphones"];
  const laptopTerms = ["laptop", "laptops", "kompyuta", "macbook", "computer", "computers"];
  const tabletTerms = ["tablet", "tablets", "ipad", "ipads"];
  const accessoryTerms = ["accessory", "accessories", "vifaa", "kichwa", "charger", "earbuds", "headphones"];
  const beautyTerms = ["beauty", "rembo", "vipodozi", "perfume", "perfumes"];
  const electronicsTerms = ["electronics", "electronics", "umeme", "tv"];
  const chinaTerms = ["china", "agiza china", "chaba", "agiza-china"];
  
  if (phoneTerms.includes(tCat) && phoneTerms.some(term => pCat.includes(term))) return true;
  if (laptopTerms.includes(tCat) && laptopTerms.some(term => pCat.includes(term))) return true;
  if (tabletTerms.includes(tCat) && tabletTerms.some(term => pCat.includes(term))) return true;
  if (accessoryTerms.includes(tCat) && accessoryTerms.some(term => pCat.includes(term))) return true;
  if (beautyTerms.includes(tCat) && beautyTerms.some(term => pCat.includes(term))) return true;
  if (electronicsTerms.includes(tCat) && electronicsTerms.some(term => pCat.includes(term))) return true;
  if (chinaTerms.includes(tCat) && chinaTerms.some(term => pCat.includes(term))) return true;
  
  return false;
}

// ── Products Grid (Live Firebase) ────────────────────
function ProductsGrid({ catId, filters, searchQ, onRefresh, onResetAll }) {
  const isMobile = useMobile();
  const { t } = useSettings();
  const [products, setProducts] = useState(() => {
    try {
      const cached = localStorage.getItem(`stea_cache_products_${catId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    // Initial load: fallbacks for this category
    return FALLBACK_PRODUCTS.filter(fb => matchesCategory(fb.category, catId));
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) {
      setTimeout(() => setLoading(false), 0);
      return;
    }

    let q = query(
      collection(db, "products"),
      limit(200)
    );

    const unsub = onSnapshot(q, { includeMetadataChanges: true }, snap => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const processed = fetched
        .filter(p => {
          if (p.visible === false) return false;
          if (p.published === false && p.isActive === false) return false;
          if (p.status && !["active", "published", "approved"].includes(p.status)) return false;
          return true;
        })
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      // Merge Firestore items with Fallbacks so we always have a rich grid
      let merged = [...processed];
      const fallbackForCat = FALLBACK_PRODUCTS.filter(fb => matchesCategory(fb.category, catId));
      fallbackForCat.forEach(fb => {
        if (!merged.some(m => String(m.name).toLowerCase() === fb.name.toLowerCase())) {
          merged.push(fb);
        }
      });

      setProducts(merged);
      setLoading(false);

      try {
        localStorage.setItem(`stea_cache_products_${catId}`, JSON.stringify(merged));
      } catch (err) {
        console.warn("Storage error", err);
      }
    }, err => {
      console.error("Marketplace fetch error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [catId]);

  // Client-side filtering
  const filtered = products.filter(p => {
    // Basic category match handling case differences
    if (catId && catId !== "zote") {
       if (!matchesCategory(p.category, catId)) return false;
    }

    if (filters.subcategory && p.subcategory !== filters.subcategory) return false;
    if (filters.subItem && p.subItem !== filters.subItem && p.subcategory !== filters.subItem) return false;
    if (filters.brand && p.brand !== filters.brand) return false;
    if (filters.condition && p.condition !== filters.condition) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      return (p.name||"").toLowerCase().includes(q) ||
             (p.brand||"").toLowerCase().includes(q) ||
             (p.description||"").toLowerCase().includes(q) ||
             (p.location||"").toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="marketplace-product-grid">
        {[1,2,3,4,5,6].map(i => <div key={i} style={{ minHeight: 200 }}><ProductSkeleton /></div>)}
      </div>
    );
  }

  const SUGGESTED_CATS = [
    { id: "phones", label: "Simu", emoji: "📱" },
    { id: "laptops", label: "Laptops", emoji: "💻" },
    { id: "accessories", label: "Vifaa", emoji: "🎧" }
  ];

  return (
    <>
      {/* Product count + refresh */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: "var(--home-muted, #64748b)", fontWeight: 700 }}>
          {filtered.length > 0 ? `${filtered.length} bidhaa` : ""}
        </span>
        <button onClick={onRefresh} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--home-surface, #ffffff)", border: "1px solid var(--home-border, #e2e8f0)", borderRadius: 10, padding: "6px 12px", color: "var(--home-muted, #64748b)", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--home-surface, #ffffff)", borderRadius: 20, border: `1px solid var(--home-border, #e2e8f0)`, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📦</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: "#fff" }}>{t('duka_no_products')}</h3>
          <p style={{ color: "var(--home-muted, #64748b)", fontSize: 14, maxWidth: 380, margin: "0 auto 20px" }}>
            {searchQ ? `${t('duka_no_results')} "${searchQ}" kwa kichujio hiki.` : "Hakuna bidhaa kwenye kundi hili kwa sasa."}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 320, marginTop: 12 }}>
            <button onClick={onResetAll} style={{ width: "100%", height: 48, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 24px", background: G, color: "#000", border: "none", borderRadius: 12, fontWeight: 900, cursor: "pointer", fontSize: 14, boxShadow: "0 4px 14px rgba(245,166,35,0.25)" }}>
              Onyesha Bidhaa Zote
            </button>

            {/* Suggested Categories */}
            <div style={{ marginTop: 8, marginBottom: 4 }}>
              <p style={{ fontSize: 11, color: "var(--home-muted, #64748b)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", margin: "0 0 8px 0" }}>Mapendekezo ya Makundi</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                {SUGGESTED_CATS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (onResetAll) onResetAll();
                      setTimeout(() => {
                        window.location.hash = ""; 
                        window.location.pathname = `/duka/${s.id}`;
                      }, 50);
                    }}
                    style={{
                      padding: "6px 12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10,
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    <span>{s.emoji}</span> {s.label}
                  </button>
                ))}
              </div>
            </div>

            <a href={`https://wa.me/${STEA_WA}?text=${encodeURIComponent("Habari STEA, natafuta bidhaa ambayo siioni kwenye STEA Duka.")}`}
              target="_blank" rel="noreferrer"
              style={{ width: "100%", height: 48, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 20px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", borderRadius: 12, fontWeight: 700, textDecoration: "none", fontSize: 13, boxSizing: "border-box" }}>
              <MessageCircle size={16} /> {t('duka_request_product')}
            </a>
          </div>
        </div>
      ) : (
        <div className="marketplace-product-grid">
          {filtered.map(p => (
            <ShopProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </>
  );
}



// ── Main Marketplace Page ────────────────────────────
export default function MarketplacePage() {
  const { user } = useAuth();
  const isMobile = useMobile();
  const { t } = useSettings();
  const { category: urlCategory } = useParams();
  const navigate = useNavigate();

  // Redirect /duka to /duka/phones
  useEffect(() => {
    if (!urlCategory) {
      navigate("/duka/phones", { replace: true });
    }
  }, [urlCategory, navigate]);

  // Derive state from URL param (supporting both standard categories and 'zote')
  const activeCat = urlCategory && (MARKET_CATEGORIES[urlCategory] || urlCategory === "zote") ? urlCategory : "phones";

  const [filters, setFilters] = useState({});
  const [searchQ, setSearchQ] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [refreshKey, setRefreshKey] = useState(0);
  const topRef = useRef(null);

  // Reset filters when category changes
  const [prevUrlCategory, setPrevUrlCategory] = useState(urlCategory);
  if (urlCategory !== prevUrlCategory) {
    setPrevUrlCategory(urlCategory);
    setFilters({});
    setSearchQ("");
    setActiveSearch("");
  }

  const cat = activeCat === "zote" ? { id: "zote", label: "Bidhaa Zote", emoji: "📦" } : (activeCat ? MARKET_CATEGORIES[activeCat] : null);

  const handleSelectCategory = (catId) => {
    navigate(`/duka/${catId}`);
    setFilters({});
    setSearchQ("");
    setActiveSearch("");
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setActiveSearch(searchQ), 350);
    return () => clearTimeout(t);
  }, [searchQ]);

  // Robust formatting helper to normalize category labels and prevent ugly truncations
  const getCategoryDisplayName = (c) => {
    const rawLabel = t(c.labelKey) !== c.labelKey ? t(c.labelKey) : (c.label || c.id);
    if (!rawLabel) return "";
    
    const upperInput = String(rawLabel).toUpperCase().trim();
    
    if (upperInput === "TABLE" || upperInput === "TAB" || upperInput.startsWith("TABLE")) {
      return "TABLETS";
    }
    if (upperInput === "ELECTRO" || upperInput.startsWith("ELECTRO")) {
      return "ELECTRONICS";
    }
    if (upperInput.startsWith("BEAUTY &") || upperInput === "BEAUTY" || upperInput.includes("UREMBO")) {
      return "BEAUTY & HEALTH";
    }
    
    return rawLabel;
  };

  return (
      <div ref={topRef} style={{ position: "relative", paddingBottom: 60, minHeight: "100vh", background: "var(--home-bg, #ffffff)", color: "var(--home-text, #0f172a)", fontFamily: "'Instrument Sans',system-ui,sans-serif", overflow: "hidden" }}>
      <STEAHeader title="Marketplace" user={user} />
      
      <SEOHead 
        title="STEA Duka — Nunua Simu, Laptops na Bidhaa Tanzania"
        description="Sokoni la kidijitali la Tanzania. Nunua simu mpya, laptops, accessories kwa bei nafuu. Wauzaji waliothitishwa. Malipo salama."
        keywords={["duka la simu Tanzania", "nunua simu online Tanzania", "bei ya simu Tanzania", "Tanzania online shopping"]}
      />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: isMobile ? "16px 10px 0" : "28px 28px 0" }}>
        
        {/* MARKETPLACE SWITCHER (TZ vs China) */}
        <div style={{ marginTop: 12, marginBottom: 12, display: "flex", padding: "4px", background: "var(--home-alpha-04, #f1f5f9)", borderRadius: 999, width: isMobile ? "100%" : "360px", margin: isMobile ? "12px 0" : "12px auto 24px", position: "relative" }}>
          <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
            <button style={{ width: "100%", padding: "8px 16px", border: "none", background: "transparent", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
               🇹🇿 TZ Market
            </button>
            <div style={{ position: "absolute", inset: 0, background: G, borderRadius: 999, zIndex: -1, boxShadow: "0 4px 12px rgba(245,166,35,0.2)" }} />
          </div>
          <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
            <button onClick={() => navigate("/chaba")} style={{ width: "100%", padding: "8px 16px", border: "none", background: "transparent", color: "var(--home-muted, #64748b)", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "color .2s" }}>
               🇨🇳 Agiza China
            </button>
          </div>
        </div>

        <>
          {/* ── CATEGORY VIEW ── */}
          {cat && (
            <motion.div 
              key={`cat-${activeCat}`} 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              style={{ overflow: "visible" }}
            >

              {/* Marketplace Hero */}
              <div style={{
                textAlign: "center",
                padding: isMobile ? "24px 16px" : "48px 24px",
                background: "linear-gradient(135deg, rgba(245,166,35,0.08) 0%, rgba(245,166,35,0.02) 100%)",
                borderRadius: 24,
                marginBottom: 32,
                border: "1px solid rgba(245,166,35,0.15)",
                position: "relative",
                overflow: "hidden"
              }}>
                <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: isMobile ? 32 : 48, fontWeight: 900, color: "var(--home-text, #0f172a)", margin: "0 0 12px 0", letterSpacing: "-0.03em" }}>
                  STEA <span style={{ color: "#F5A623" }}>Marketplace</span>
                </h1>
                <p style={{ fontSize: isMobile ? 15 : 18, color: "var(--home-muted, #64748b)", maxWidth: 600, margin: "0 auto 24px", lineHeight: 1.5, fontWeight: 500 }}>
                  Buy trusted tech products, digital tools, and services safely in Tanzania.
                </p>
                
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginBottom: 24 }}>
                  <button onClick={() => { topRef.current?.scrollIntoView({ behavior: "smooth" }); }} style={{ background: "#F5A623", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 999, fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 14px rgba(245,166,35,0.25)" }}>
                    Browse Products
                  </button>
                  <button onClick={() => navigate("/chaba")} style={{ background: "var(--home-surface, #fff)", color: "var(--home-text, #0f172a)", border: "1px solid var(--home-border, #e2e8f0)", padding: "12px 24px", borderRadius: 999, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                    🇨🇳 Agiza China
                  </button>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
                  {["🔥 Ofa Mpya Kila Siku", "📱 Simu Za Kisasa", "🇨🇳 Agiza China", "🚚 Usafirishaji Salama", "💰 Bei Nafuu"].map(chip => (
                    <span key={chip} style={{ background: "var(--home-surface, #fff)", border: "1px solid var(--home-border, #e2e8f0)", borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 600, color: "var(--home-muted, #64748b)" }}>
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: "var(--home-text, #0f172a)" }}>Shop by Category</h3>
                <div className="marketplace-category-grid">
                  {Object.values(MARKET_CATEGORIES).map(c => {
                    const isActive = activeCat === c.id;
                    const displayName = getCategoryDisplayName(c);
                    return (
                      <motion.div 
                        key={c.id} 
                        onClick={() => handleSelectCategory(c.id)}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          background: "var(--home-surface, #fff)",
                          border: `1px solid ${isActive ? "#F5A623" : "var(--home-border, #e2e8f0)"}`,
                          borderRadius: 16,
                          padding: "16px 12px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 12,
                          cursor: "pointer",
                          boxShadow: isActive ? "0 4px 12px rgba(245,166,35,0.15)" : "0 2px 8px rgba(15,23,42,0.04)"
                        }}
                      >
                        <div style={{ fontSize: 32 }}>{c.emoji}</div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? "#F5A623" : "var(--home-text, #0f172a)", textAlign: "center" }}>
                          {displayName}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Active Category Title */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ height: 1, flex: 1, background: "linear-gradient(90deg, rgba(245,166,35,0.3), transparent)" }} />
                <span style={{ fontSize: 11, fontWeight: 900, color: G, textTransform: "uppercase", letterSpacing: ".1em" }}>
                  {cat.labelKey ? t(cat.labelKey) : (cat.label || cat.id)}
                </span>
                <div style={{ height: 1, flex: 1, background: "linear-gradient(-90deg, rgba(245,166,35,0.3), transparent)" }} />
              </div>


              {/* Search + filter toggle row */}
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--home-muted, #64748b)", pointerEvents: "none" }} />
                  <input
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    placeholder={`${t('action_search')} ${cat?.labelKey ? (t(cat.labelKey) || "").toLowerCase() : ""}...`}
                    className="glass"
                    style={{ width: "100%", height: 42, borderRadius: 12, color: "var(--home-text, #0f172a)", background: "var(--home-surface, #ffffff)", border: "1px solid var(--home-border, #e2e8f0)", paddingLeft: 38, paddingRight: searchQ ? 36 : 14, outline: "none", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = G}
                  />
                  {searchQ && (
                    <button onClick={() => setSearchQ("")}
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--home-muted, #64748b)", cursor: "pointer" }}>
                      <X size={13} />
                    </button>
                  )}
                </div>

                {isMobile && (
                  <button onClick={() => setShowFilters(v => !v)}
                    style={{ height: 42, padding: "0 14px", borderRadius: 12, border: `1px solid ${showFilters ? G : "var(--home-border, #e2e8f0)"}`, background: showFilters ? `${G}12` : "var(--home-surface, #ffffff)", color: showFilters ? G : "var(--home-text, #0f172a)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    <Filter size={13} /> {t('duka_filter_label')}
                    {Object.values(filters).filter(Boolean).length > 0 && (
                      <span style={{ width: 16, height: 16, borderRadius: "50%", background: G, color: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900 }}>
                        {Object.values(filters).filter(Boolean).length}
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Filters */}
              <AnimatePresence>
                {(showFilters || !isMobile) && (
                  <motion.div
                    initial={isMobile ? { height: 0, opacity: 0 } : false}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={isMobile ? { height: 0, opacity: 0 } : {}}
                    style={{ overflow: "hidden", marginBottom: 16 }}
                  >
                    <div style={{ overflowX: "auto", paddingBottom: 4 }} className="filter-scroll">
                      <CategoryFilters catId={activeCat} filters={filters} onChange={f => setFilters(f)} />
                    </div>

                    {/* Active filter badges */}
                    {Object.values(filters).some(Boolean) && (
                      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "var(--home-muted, #64748b)", fontWeight: 700 }}>Active:</span>
                        {Object.entries(filters).filter(([,v]) => v).map(([k, v]) => (
                          <button key={k} onClick={() => setFilters(f => ({ ...f, [k]: null }))}
                            style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: `${G}15`, color: G, border: `1px solid ${G}30`, cursor: "pointer" }}>
                            {v} <X size={9} />
                          </button>
                        ))}
                        <button onClick={() => setFilters({})}
                          style={{ fontSize: 11, fontWeight: 700, color: "var(--home-muted, #64748b)", background: "none", border: "none", cursor: "pointer" }}>
                          Futa Filters
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <AdSlot id="marketplace-before-products" />

              {/* Products */}
              <ProductsGrid
                catId={activeCat}
                filters={filters}
                searchQ={activeSearch}
                onRefresh={() => setRefreshKey(k => k + 1)}
                onResetAll={() => {
                  handleSelectCategory("zote");
                  setFilters({});
                  setSearchQ("");
                  setActiveSearch("");
                }}
              />
            </motion.div>
          )}
        </>
      </div>

      {/* Explore More STEA */}
      <SteaExploreMore exclude="duka" />
    </div>
  );
}
