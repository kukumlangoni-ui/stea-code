import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, Instagram, Facebook, MapPin, Package, ChevronLeft, ExternalLink } from "lucide-react";
import { getFirebaseDb, collection, doc, getDoc, query, where, onSnapshot, limit } from "../firebase.js";
import { ShopProductCard } from "../components/ShopProductCard.jsx";
import { useMobile } from "../hooks/useMobile.js";
import { ProductSkeleton } from "../components/Skeleton.jsx";

const G = "#F5A623";
const DARK = "#05060a";
const BORDER = "rgba(255,255,255,0.06)";

function SellerProfileSkeleton() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 24, width: "50%", background: "rgba(255,255,255,.06)", borderRadius: 8, marginBottom: 10 }} />
          <div style={{ height: 16, width: "35%", background: "rgba(255,255,255,.04)", borderRadius: 8 }} />
        </div>
      </div>
      <div className="market-products-grid">
        {[1,2,3,4].map(i => <div key={i}><ProductSkeleton /></div>)}
      </div>
    </div>
  );
}

export default function SellerProfilePage() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const isMobile = useMobile();

  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

  // Load seller profile
  useEffect(() => {
    if (!sellerId) { setLoading(false); return; }
    const db = getFirebaseDb();
    if (!db) { setLoading(false); return; }

    const load = async () => {
      try {
        // Try users collection first (seller account)
        const userSnap = await getDoc(doc(db, "users", sellerId));
        if (userSnap.exists()) {
          setSeller({ id: userSnap.id, ...userSnap.data() });
          setLoading(false);
          return;
        }
        // Fallback: check sellers collection
        const sellerSnap = await getDoc(doc(db, "sellers", sellerId));
        if (sellerSnap.exists()) {
          setSeller({ id: sellerSnap.id, ...sellerSnap.data() });
          setLoading(false);
          return;
        }
        setLoading(false);
      } catch (err) {
        console.error("Seller profile load error:", err);
        setLoading(false);
      }
    };
    load();
  }, [sellerId]);

  // Load seller's approved products
  useEffect(() => {
    if (!sellerId) { setProductsLoading(false); return; }
    const db = getFirebaseDb();
    if (!db) { setProductsLoading(false); return; }

    const q = query(
      collection(db, "products"),
      where("sector", "==", "marketplace"),
      where("sellerId", "==", sellerId),
      limit(24)
    );

    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(p => {
          if (p.visible === false) return false;
          if (p.published === false && p.isActive === false) return false;
          if (p.status && !["active", "published", "approved"].includes(p.status)) return false;
          return true;
        });
      setProducts(fetched);
      setProductsLoading(false);
    }, (err) => {
      console.error("Seller products error:", err);
      setProductsLoading(false);
    });

    return () => unsub();
  }, [sellerId]);

  if (loading) {
    return (
      <div style={{ paddingTop: 90, paddingBottom: 60, minHeight: "100vh", background: DARK }}>
        <SellerProfileSkeleton />
      </div>
    );
  }

  if (!seller && !loading) {
    return (
      <div style={{ paddingTop: 90, paddingBottom: 60, minHeight: "100vh", background: DARK, color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ fontSize: 64 }}>🏪</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Seller Not Found</h2>
        <p style={{ color: "rgba(255,255,255,.5)", margin: 0 }}>This seller profile doesn't exist or has been removed.</p>
        <button onClick={() => navigate("/duka/phones")} style={{ marginTop: 12, padding: "10px 22px", background: G, color: "#000", border: "none", borderRadius: 12, fontWeight: 800, cursor: "pointer" }}>
          Browse Marketplace
        </button>
      </div>
    );
  }

  const name = seller?.sellerBusinessName || seller?.displayName || seller?.name || "Seller";
  const avatar = seller?.sellerProfileImage || seller?.profileImage || seller?.photoURL || null;
  const whatsapp = seller?.sellerWhatsApp || seller?.whatsApp || seller?.phone || null;
  const instagram = seller?.sellerInstagram || seller?.instagram || null;
  const facebook = seller?.sellerFacebook || seller?.facebook || null;
  const tiktok = seller?.sellerTikTok || seller?.tiktok || null;
  const location = seller?.sellerLocation || seller?.location || null;
  const description = seller?.sellerDescription || seller?.description || null;

  return (
    <div style={{ paddingTop: 80, paddingBottom: 60, minHeight: "100vh", background: DARK, color: "#fff", fontFamily: "'Instrument Sans',system-ui,sans-serif" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: isMobile ? "0 16px" : "0 28px" }}>
        
        {/* Back button */}
        <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "rgba(255,255,255,.5)", cursor: "pointer", fontSize: 13, fontWeight: 700, padding: "16px 0", marginBottom: 8 }}>
          <ChevronLeft size={16} /> Rudi
        </button>

        {/* Seller Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: "rgba(255,255,255,.03)", border: `1px solid ${BORDER}`, borderRadius: 24, padding: isMobile ? 20 : 28, marginBottom: 32 }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: isMobile ? "wrap" : "nowrap" }}>
            {/* Avatar */}
            <div style={{ flexShrink: 0 }}>
              {avatar ? (
                <img src={avatar} alt={name} style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `3px solid ${G}30` }} referrerPolicy="no-referrer" />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: `${G}20`, border: `3px solid ${G}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
                  🏪
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, margin: "0 0 6px", letterSpacing: "-.02em" }}>{name}</h1>
              
              {location && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,.5)", fontSize: 13, marginBottom: 8 }}>
                  <MapPin size={13} /> {location}
                </div>
              )}

              {description && (
                <p style={{ fontSize: 14, color: "rgba(255,255,255,.65)", lineHeight: 1.6, margin: "0 0 16px", maxWidth: 560 }}>{description}</p>
              )}

              {/* Social/contact links */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Habari ${name}, nimeona bidhaa zako kwenye STEA Duka.`)}`}
                    target="_blank" rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", background: "#25d36618", border: "1px solid #25d36630", color: "#25d366", borderRadius: 10, fontWeight: 800, fontSize: 12, textDecoration: "none" }}
                  >
                    <MessageCircle size={13} /> WhatsApp
                  </a>
                )}
                {instagram && (
                  <a href={instagram.startsWith("http") ? instagram : `https://instagram.com/${instagram}`} target="_blank" rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", background: "rgba(225,48,108,.1)", border: "1px solid rgba(225,48,108,.2)", color: "#e1306c", borderRadius: 10, fontWeight: 800, fontSize: 12, textDecoration: "none" }}>
                    <Instagram size={13} /> Instagram
                  </a>
                )}
                {facebook && (
                  <a href={facebook.startsWith("http") ? facebook : `https://facebook.com/${facebook}`} target="_blank" rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", background: "rgba(24,119,242,.1)", border: "1px solid rgba(24,119,242,.2)", color: "#1877f2", borderRadius: 10, fontWeight: 800, fontSize: 12, textDecoration: "none" }}>
                    <Facebook size={13} /> Facebook
                  </a>
                )}
                {tiktok && (
                  <a href={tiktok.startsWith("http") ? tiktok : `https://tiktok.com/@${tiktok}`} target="_blank" rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", borderRadius: 10, fontWeight: 800, fontSize: 12, textDecoration: "none" }}>
                    🎵 TikTok
                  </a>
                )}
              </div>
            </div>

            {/* Products count */}
            <div style={{ flexShrink: 0, textAlign: "center", background: `${G}10`, border: `1px solid ${G}25`, borderRadius: 16, padding: "14px 20px" }}>
              <Package size={20} color={G} style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 22, fontWeight: 900, color: G }}>{products.length}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", fontWeight: 700 }}>Bidhaa</div>
            </div>
          </div>
        </motion.div>

        {/* Seller Products */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 20, letterSpacing: "-.02em" }}>
            Bidhaa za {name}
          </h2>

          {productsLoading ? (
            <div className="market-products-grid">
              {[1,2,3,4].map(i => <div key={i}><ProductSkeleton /></div>)}
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", background: "rgba(255,255,255,.02)", borderRadius: 20, border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
              <p style={{ color: "rgba(255,255,255,.5)", margin: 0 }}>Muuzaji huyu hana bidhaa za kuonyesha sasa hivi.</p>
            </div>
          ) : (
            <div className="market-products-grid">
              {products.map(p => (
                <ShopProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
