import React, { useState, useEffect, useLayoutEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  ShoppingCart,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileDown,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { useMobile } from "../hooks/useMobile.js";
import { getFirebaseDb, doc, getDoc } from "../firebase.js";
import { MARKET_CATEGORIES } from "../constants/marketplace.js";
import {
  OrderFormModal,
  buildOrderWaLink,
  submitMarketplaceOrderFromState,
  PAYMENT_METHODS,
} from "../components/OrderFormModal.jsx";
import { orderService } from "../services/orderService.js";
import { useSiteSettings } from "../contexts/SiteSettingsContext.jsx";
import { getSafariLink } from "../utils/safariUtils.js";
import { tzProductDetailImageStyle } from "../utils/tanzaniaProductImageDisplay.js";
import VariantSelector from "../components/VariantSelector.jsx";
import CheckoutSummary from "../components/CheckoutSummary.jsx";
import {
  useDeliverySettings,
  productHasVariants,
  getActiveVariants,
  resolveUnitPrice,
  getDeliveryFee,
  fmtTZS,
} from "../hooks/useDeliverySettings.js";

const G = "#F5A623";
const STEA_WA = "255757053354";

const stepVariants = {
  enter: { opacity: 0, x: 28 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

function fmtPriceDisplay(n) {
  if (!n && n !== 0) return "Piga Simu";
  const num = Number(String(n).replace(/\D/g, ""));
  if (isNaN(num) || num === 0) return String(n);
  return `${num.toLocaleString()} TZS`;
}

export default function TanzaniaMarketplaceCheckoutPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMobile();
  const { settings } = useSiteSettings();

  // Phase 2: Immediately show product from route state, then refresh from Firestore in background
  const routeProduct = location.state?.product || null;
  const [product, setProduct] = useState(routeProduct);
  const [loadingProduct, setLoadingProduct] = useState(!routeProduct);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  // Variant + delivery live state
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [variantError, setVariantError]       = useState("");
  const [liveDelivery, setLiveDelivery]       = useState(""); // "" | "pickup" | "local" | "region"
  // Delivery settings from Firestore (with defaults)
  const { settings: deliverySettings } = useDeliverySettings();
  /** 1 Bidhaa, 2 Taarifa, 3 Thibitisha, 4 Mafanikio */
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [reviewDraft, setReviewDraft] = useState(null);
  const [reviewMessage, setReviewMessage] = useState("");
  const [completionPayload, setCompletionPayload] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const showFormSession = checkoutStep === 2 || checkoutStep === 3;

  useEffect(() => {
    setCheckoutStep(1);
    setReviewDraft(null);
    setReviewMessage("");
    setCompletionPayload(null);
    // Reset to route state product for new productId
    if (location.state?.product?.id === productId) {
      setProduct(location.state.product);
      setLoadingProduct(false);
    } else {
      setProduct(null);
      setLoadingProduct(true);
    }
  }, [productId]);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [checkoutStep, productId]);

  useEffect(() => {
    const db = getFirebaseDb();
    const load = async () => {
      if (!db || !productId) {
        setProduct(null);
        setLoadingProduct(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "products", productId));
        if (!snap.exists()) {
          // Only clear if we don't already have the product from route state
          if (!product || product.id !== productId) {
            setProduct(null);
          }
          setLoadingProduct(false);
          return;
        }
        const data = snap.data();
        if (data.sector !== "marketplace" || data.visible === false) {
          if (!product || product.id !== productId) {
            setProduct(null);
          }
          setLoadingProduct(false);
          return;
        }
        setProduct({ id: snap.id, ...data });
      } catch (err) {
        console.error("TZ checkout load error:", err);
        // Don't null out product if we have route state data
        if (!product || product.id !== productId) {
          setProduct(null);
        }
      } finally {
        setLoadingProduct(false);
      }
    };
    load();
  }, [productId]);

  const safariLink = product ? getSafariLink(settings, product) : null;

  const images = product
    ? Array.isArray(product.images) && product.images.length > 0
      ? product.images.filter(Boolean)
      : [product.imageUrl || product.image].filter(Boolean)
    : [];

  const categoryLabel = product
    ? (product.category || "").replace(/-/g, " ") || "Bidhaa"
    : "";
  const name = product?.name || product?.title || "Bidhaa";

  // Variant-aware live pricing
  const unitPriceNum    = resolveUnitPrice(product, selectedVariant);
  const liveDeliveryFee = getDeliveryFee(liveDelivery, deliverySettings);
  const liveTotal       = unitPriceNum > 0 ? (unitPriceNum + liveDeliveryFee) * 1 : 0;

  // Legacy compat for old price display (step 1 header)
  const basePrice = selectedVariant?.price != null
    ? Number(selectedVariant.price)
    : Number(product?.discountPrice ?? product?.price ?? 0);
  const oldPrice = selectedVariant
    ? (selectedVariant.oldPrice ?? null)
    : product?.discountPrice && product?.price && product.discountPrice !== product.price
      ? product.price
      : product?.oldPrice || product?.originalPrice || null;

  const dukaBackPath = () => {
    const c =
      product?.category && MARKET_CATEGORIES[product.category] ? product.category : "phones";
    return `/duka/${c}`;
  };

  const handleWhatsApp = () => {
    const msg = `Habari STEA Marketplace, nahitaji msaada kuhusu bidhaa hii:\n\nBidhaa: ${name}\nBei: ${fmtPriceDisplay(basePrice)}`;
    window.open(`https://wa.me/${STEA_WA}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleBuyNow = () => {
    // Validate variant selection if product has variants
    if (product && productHasVariants(product) && !selectedVariant) {
      setVariantError("Tafadhali chagua chaguo (variant) kabla ya kuendelea.");
      window.scrollTo({ top: 400, behavior: "smooth" });
      return;
    }

    // Phase 6: Ensure delivery option is selected if not already
    if (!liveDelivery) {
      alert("Tafadhali chagua njia ya utoaji (delivery) kabla ya kuendelea.");
      return;
    }

    setVariantError("");
    setCheckoutStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReviewReady = (payload) => {
    setReviewDraft(payload);
    setReviewMessage(payload.order?.message || "");
    setCheckoutStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleConfirmOrder = async () => {
    if (!reviewDraft?.order || !product) return;
    setSubmitting(true);
    try {
      const mergedOrder = { ...reviewDraft.order, message: reviewMessage };
      const result = await submitMarketplaceOrderFromState({
        product,
        order: mergedOrder,
        deliverySettings: reviewDraft.deliverySettings,
      });
      window._latestOrderData = result.order;
      setCompletionPayload({
        orderId: result.orderId,
        order: result.order,
        formOrder: mergedOrder,
        deliverySettings: reviewDraft.deliverySettings,
      });
      setCheckoutStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      alert("Imeshindwa kutuma oda. Jaribu tena.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadReceipt = () => {
    const o = completionPayload?.order;
    if (o) orderService.downloadReceipt(o);
  };

  const deliveryFeeForSummary =
    reviewDraft?.order?.deliveryOption === "pickup"
      ? 0
      : reviewDraft?.order?.deliveryOption === "local"
        ? Number(reviewDraft.deliverySettings?.localFee || 0)
        : reviewDraft?.order?.deliveryOption === "region"
          ? Number(reviewDraft.deliverySettings?.regionFee || 0)
          : 0;

  const isElectronics =
    product &&
    ["phones", "laptops", "tablets", "electronics"].includes(product.category);
  const qtyMult = isElectronics ? Number(reviewDraft?.order?.quantity || 1) : 1;
  const lineTotal = (unitPriceNum + deliveryFeeForSummary) * qtyMult;

  if (loadingProduct) {
    return (
      <div className="checkout-page-root" style={{ background: "#05060A", paddingTop: 90, paddingBottom: 60 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px" }}>
          {/* Skeleton image */}
          <div style={{ width: "100%", height: 300, borderRadius: 20, background: "linear-gradient(90deg, rgba(255,255,255,.04) 25%, rgba(255,255,255,.08) 50%, rgba(255,255,255,.04) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", marginBottom: 24 }} />
          {/* Skeleton title */}
          <div style={{ height: 32, width: "65%", borderRadius: 10, background: "rgba(255,255,255,.06)", marginBottom: 12 }} />
          <div style={{ height: 24, width: "40%", borderRadius: 10, background: "rgba(255,255,255,.04)", marginBottom: 24 }} />
          {/* Skeleton description lines */}
          {[1,2,3].map(i => <div key={i} style={{ height: 14, borderRadius: 8, background: "rgba(255,255,255,.04)", marginBottom: 10, width: i === 3 ? "60%" : "100%" }} />)}
          <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div
        className="checkout-page-root"
        style={{
          background: "#05060A",
          color: "#fff",
          padding: 40,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 20 }}>📦</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Bidhaa Haijapatikana</h2>
        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 32 }}>
          Bidhaa haipo au haijasasishwa kwa STEA Duka.
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/duka/phones")}
          style={{
            padding: "14px 32px",
            borderRadius: 12,
            background: G,
            color: "#000",
            fontWeight: 900,
            border: "none",
            cursor: "pointer",
          }}
        >
          Rudi STEA Duka
        </motion.button>
      </div>
    );
  }

  const steps = [
    { n: 1, label: "Bidhaa" },
    { n: 2, label: "Taarifa" },
    { n: 3, label: "Thibitisha" },
    { n: 4, label: "Mafanikio" },
  ];

  const cardShell = {
    background: "linear-gradient(145deg, rgba(20,22,35,0.98), rgba(10,12,20,0.98))",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 22,
    boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
  };

  const stockOk = product.inStock !== false;

  return (
    <div className="checkout-page-root" style={{ background: "#05060A", color: "#fff", paddingBottom: 88 }}>
      <div
        className="checkout-page-subnav"
        style={{
          background: "rgba(5,6,10,0.92)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "14px 16px",
          backdropFilter: "blur(12px)",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: isMobile ? 15 : 17,
            fontWeight: 900,
            textAlign: "center",
          }}
        >
          STEA Duka — Checkout
        </h2>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
            gap: 6,
          }}
        >
          {steps.map((s, i) => {
            const active = checkoutStep === s.n;
            const done = checkoutStep > s.n;
            return (
              <React.Fragment key={s.n}>
                <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      margin: "0 auto 6px",
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 12,
                      fontWeight: 900,
                      background: done ? "#22c55e" : active ? G : "rgba(255,255,255,0.08)",
                      color: done || active ? "#000" : "rgba(255,255,255,0.45)",
                      border: active && !done ? `2px solid ${G}` : "2px solid transparent",
                      transition: "background 0.25s ease, color 0.25s ease",
                    }}
                  >
                    {done ? "✓" : s.n}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: active ? G : "rgba(255,255,255,0.35)",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                      lineHeight: 1.25,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div
                    style={{
                      flex: 0.25,
                      height: 2,
                      background: checkoutStep > s.n ? G : "rgba(255,255,255,0.08)",
                      borderRadius: 2,
                      marginBottom: 22,
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {checkoutStep === 4 && completionPayload ? (
            <motion.div
              key="success"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{ ...cardShell, padding: "32px 22px", textAlign: "center" }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "rgba(37,211,102,0.1)",
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 20px",
                }}
              >
                <CheckCircle size={40} color="#25d366" />
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 10 }}>Oda Imefanikiwa!</h1>
              <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 28, fontSize: 15 }}>
                Oda yako <span style={{ color: G, fontWeight: 900 }}>#{completionPayload.orderId}</span>{" "}
                imepokelewa na kutumwa kwa muuzaji.
              </p>
              <div style={{ display: "grid", gap: 12 }}>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownloadReceipt}
                  style={{
                    height: 52,
                    borderRadius: 14,
                    background: G,
                    color: "#000",
                    fontWeight: 900,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 15,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  <FileDown size={20} /> PAKUA RISITI (PDF)
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    window.open(
                      buildOrderWaLink(
                        product,
                        { ...completionPayload.formOrder, orderId: completionPayload.orderId },
                        undefined,
                        completionPayload.deliverySettings,
                      ),
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                  style={{
                    height: 52,
                    borderRadius: 14,
                    background: "rgba(37,211,102,0.12)",
                    color: "#25d366",
                    fontWeight: 900,
                    border: "1px solid rgba(37,211,102,0.25)",
                    cursor: "pointer",
                    fontSize: 15,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  <MessageCircle size={20} /> WhatsApp Muuzaji
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(dukaBackPath())}
                  style={{
                    height: 52,
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.05)",
                    color: "#fff",
                    fontWeight: 800,
                    border: "1px solid rgba(255,255,255,0.1)",
                    cursor: "pointer",
                  }}
                >
                  Rudi Sokoni
                </motion.button>
              </div>
            </motion.div>
          ) : checkoutStep === 1 ? (
            <motion.div
              key="product-step"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div style={{ ...cardShell, overflow: "hidden", marginBottom: 14 }}>
                <div className="tanzania-detail-image-wrap">
                  {images.length > 0 ? (
                    <>
                      {categoryLabel ? (
                        <div
                          title={categoryLabel}
                          style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            zIndex: 8,
                            maxWidth: "42%",
                            padding: "4px 10px",
                            borderRadius: 8,
                            fontSize: 10,
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            color: "rgba(255,255,255,0.95)",
                            background: "rgba(0,0,0,0.45)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            backdropFilter: "blur(6px)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {categoryLabel}
                        </div>
                      ) : null}
                      <div className="tanzania-detail-image-frame">
                        <motion.img
                          key={activeImgIdx}
                          className="tanzania-detail-image"
                          src={images[activeImgIdx]}
                          alt={name}
                          referrerPolicy="no-referrer"
                          style={tzProductDetailImageStyle(product)}
                          initial={{ opacity: 0.88 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="tanzania-detail-image-frame">
                      <div
                        className="tanzania-detail-image-empty"
                        style={{ position: "absolute", inset: 0, minHeight: 0 }}
                        aria-hidden
                      >
                        📦
                      </div>
                    </div>
                  )}
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveImgIdx((i) => Math.max(0, i - 1))}
                        disabled={activeImgIdx === 0}
                        style={{
                          position: "absolute",
                          left: 14,
                          top: "50%",
                          zIndex: 9,
                          transform: "translateY(-50%)",
                          background: "rgba(0,0,0,0.55)",
                          border: "none",
                          borderRadius: "50%",
                          width: 38,
                          height: 38,
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                          opacity: activeImgIdx === 0 ? 0.35 : 1,
                        }}
                      >
                        <ChevronLeft size={18} color="#fff" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveImgIdx((i) => Math.min(images.length - 1, i + 1))
                        }
                        disabled={activeImgIdx === images.length - 1}
                        style={{
                          position: "absolute",
                          right: 14,
                          top: "50%",
                          zIndex: 9,
                          transform: "translateY(-50%)",
                          background: "rgba(0,0,0,0.55)",
                          border: "none",
                          borderRadius: "50%",
                          width: 38,
                          height: 38,
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                          opacity: activeImgIdx === images.length - 1 ? 0.35 : 1,
                        }}
                      >
                        <ChevronRight size={18} color="#fff" />
                      </button>
                    </>
                  )}
                </div>
                <div style={{ padding: "14px 16px 16px" }}>
                  <h1
                    style={{
                      fontSize: isMobile ? 19 : 22,
                      fontWeight: 900,
                      margin: "0 0 10px",
                      lineHeight: 1.25,
                    }}
                  >
                    {name}
                  </h1>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 10,
                      marginBottom: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: isMobile ? 24 : 26,
                        fontWeight: 900,
                        color: G,
                        fontFamily: "'Bricolage Grotesque',sans-serif",
                      }}
                    >
                      {fmtPriceDisplay(basePrice)}
                    </span>
                    {oldPrice != null && (
                      <span
                        style={{
                          fontSize: 14,
                          color: "rgba(255,255,255,0.28)",
                          textDecoration: "line-through",
                          fontWeight: 700,
                        }}
                      >
                        {fmtPriceDisplay(oldPrice)}
                      </span>
                    )}
                  </div>
                  {(product.description || product.summary) ? (
                    <p style={{ color: "rgba(255,255,255,0.52)", lineHeight: 1.55, marginBottom: 0, fontSize: 13 }}>
                      {product.description || product.summary}
                    </p>
                  ) : null}

                  {/* ── Variant Selector ── */}
                  <VariantSelector
                    product={product}
                    selectedVariant={selectedVariant}
                    onSelect={v => { setSelectedVariant(v); setVariantError(""); }}
                    error={variantError}
                  />

                  {/* ── Live Delivery Picker ── */}
                  <div style={{ marginTop: 18 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
                      Chagua Utoaji
                    </div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {[
                        { key: "pickup", icon: "🏪", title: "Shop Pickup",        fee: 0,                                                          sub: deliverySettings?.pickupLabel || "Mwenge / Arusha" },
                        { key: "local",  icon: "🏙️", title: "Dar es Salaam",     fee: Number(deliverySettings?.localFee  ?? 5000),               sub: deliverySettings?.localLabel  || "1-2 siku" },
                        { key: "region", icon: "🗺️", title: "Mkoa Mwingine",     fee: Number(deliverySettings?.regionFee ?? 15000),              sub: deliverySettings?.regionLabel || "2-5 siku" },
                      ].map(opt => {
                        const sel = liveDelivery === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setLiveDelivery(opt.key)}
                            style={{
                              display: "flex", alignItems: "center", gap: 12,
                              padding: "12px 14px",
                              borderRadius: 12,
                              border: sel ? `2px solid ${G}` : "1.5px solid rgba(255,255,255,.09)",
                              background: sel ? `${G}10` : "rgba(255,255,255,.04)",
                              cursor: "pointer", textAlign: "left", width: "100%",
                              transition: "border-color .15s, background .15s",
                            }}
                          >
                            <span style={{ fontSize: 20, flexShrink: 0 }}>{opt.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 800, fontSize: 13, color: sel ? G : "#fff" }}>{opt.title}</div>
                              <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{opt.sub}</div>
                            </div>
                            <div style={{ fontWeight: 900, fontSize: 14, color: sel ? G : "rgba(255,255,255,.6)", flexShrink: 0 }}>
                              {opt.fee === 0 ? "Bure" : fmtTZS(opt.fee)}
                            </div>
                            {sel && (
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: G, flexShrink: 0 }} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Live Total ── */}
                  {(unitPriceNum > 0 || liveDelivery) && (
                    <div style={{
                      marginTop: 14, padding: "14px 16px",
                      background: "rgba(245,166,35,.06)",
                      border: "1px solid rgba(245,166,35,.18)",
                      borderRadius: 12,
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.45)", textTransform: "uppercase", letterSpacing: ".06em" }}>Jumla ya Kulipa</div>
                        {liveDelivery && <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginTop: 2 }}>Bei + Utoaji ({liveDelivery === "pickup" ? "Bure" : fmtTZS(liveDeliveryFee)})</div>}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: G }}>
                        {unitPriceNum > 0 ? fmtTZS(unitPriceNum + liveDeliveryFee) : "—"}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {safariLink && (
                <a
                  href={safariLink.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    width: "100%",
                    height: 52,
                    marginBottom: 12,
                    borderRadius: 16,
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "#fff",
                    fontWeight: 900,
                    fontSize: 15,
                    textDecoration: "none",
                  }}
                >
                  🌍 {safariLink.type === "whatsapp" ? "Book via WhatsApp" : "Book Your Safari"}{" "}
                  <ArrowRight size={18} />
                </a>
              )}

              {stockOk ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={handleWhatsApp}
                    style={{
                      height: 54,
                      borderRadius: 16,
                      background: "rgba(37,211,102,0.1)",
                      color: "#25d366",
                      fontWeight: 800,
                      border: "1px solid rgba(37,211,102,0.22)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontSize: 14,
                    }}
                  >
                    <MessageCircle size={18} /> Msaada / WhatsApp
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={handleBuyNow}
                    style={{
                      height: 54,
                      borderRadius: 16,
                      background: productHasVariants(product) && !selectedVariant ? "rgba(255,255,255,.15)" : G,
                      color: productHasVariants(product) && !selectedVariant ? "rgba(255,255,255,.5)" : "#000",
                      fontWeight: 900,
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontSize: 14,
                      boxShadow: productHasVariants(product) && !selectedVariant ? "none" : "0 10px 30px rgba(245,166,35,0.28)",
                      transition: "all .2s",
                    }}
                  >
                    <ShoppingCart size={18} />
                    {productHasVariants(product) && !selectedVariant ? "Chagua Kwanza" : "Buy Now"}
                  </motion.button>
                </div>
              ) : (
                <div
                  style={{
                    background: "rgba(255,77,79,0.08)",
                    border: "1px solid rgba(255,77,79,0.2)",
                    borderRadius: 16,
                    padding: "18px 16px",
                    textAlign: "center",
                  }}
                >
                  <p style={{ color: "#ff4d4f", fontWeight: 800, margin: 0 }}>Bidhaa hii haipatikani kwa sasa.</p>
                </div>
              )}
              {/* Phase 6: Seller profile snippet — always shown below Buy Now */}
              {product.sellerId && product.sellerId !== "admin" && (
                <div style={{ marginTop: 12, padding: "14px 16px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, display: "flex", alignItems: "center", gap: 12 }}>
                  {product.sellerProfileImage ? (
                    <img src={product.sellerProfileImage} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} referrerPolicy="no-referrer" />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${G}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🏪</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>Muuzaji</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {product.sellerBusinessName || product.sellerName || "STEA Seller"}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/seller/${product.sellerId}`)}
                    style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 10, background: `${G}15`, border: `1px solid ${G}30`, color: G, fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                  >
                    Angalia
                  </button>
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {showFormSession && (
          <div style={{ position: "relative", minHeight: 320 }}>
            <motion.div
              animate={{
                opacity: checkoutStep === 2 ? 1 : 0,
                x: checkoutStep === 2 ? 0 : -16,
              }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: checkoutStep === 2 ? "relative" : "absolute",
                inset: 0,
                pointerEvents: checkoutStep === 2 ? "auto" : "none",
              }}
            >
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Taarifa za Oda</h3>
                  <button
                    type="button"
                    onClick={() => setCheckoutStep(1)}
                    style={{
                      background: "none",
                      border: "none",
                      color: G,
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    ← Bidhaa
                  </button>
                </div>
              </div>

              {/* Live Order Summary — step 2 */}
              <CheckoutSummary
                product={product}
                selectedVariant={selectedVariant}
                quantity={1}
                deliveryOption={liveDelivery}
                deliverySettings={deliverySettings}
                step={2}
              />

              <OrderFormModal
                product={{ ...product, ...(selectedVariant ? { discountPrice: selectedVariant.price, price: selectedVariant.price, selectedVariant } : {}) }}
                embedInPage
                deferReviewToParent
                onReviewReady={handleReviewReady}
                onClose={() => navigate(dukaBackPath())}
                initialOrder={{ deliveryOption: liveDelivery }}
                skipDeliveryStep={!!liveDelivery}
              />
            </motion.div>

            <motion.div
              animate={{
                opacity: checkoutStep === 3 ? 1 : 0,
                x: checkoutStep === 3 ? 0 : 16,
              }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: checkoutStep === 3 ? "relative" : "absolute",
                inset: 0,
                top: 0,
                pointerEvents: checkoutStep === 3 ? "auto" : "none",
              }}
            >
              {reviewDraft?.order && (
                <motion.div
                  style={{ ...cardShell, padding: "22px 18px 26px" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Thibitisha Oda</h3>
                    <button
                      type="button"
                      onClick={() => setCheckoutStep(2)}
                      style={{
                        background: "none",
                        border: "none",
                        color: G,
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      ← Rudisha fomu
                    </button>
                  </div>

                  <div
                    style={{
                      padding: 16,
                      borderRadius: 14,
                      background: "rgba(255,255,255,.03)",
                      border: "1px solid rgba(255,255,255,.06)",
                      display: "grid",
                      gap: 10,
                      fontSize: 13,
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <span style={{ color: "rgba(255,255,255,.5)" }}>Bidhaa</span>
                      <span style={{ fontWeight: 700, textAlign: "right" }}>{name}</span>
                    </div>
                    {isElectronics && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "rgba(255,255,255,.5)" }}>Idadi</span>
                        <span style={{ fontWeight: 700 }}>{reviewDraft.order.quantity}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "rgba(255,255,255,.5)" }}>Mkoa / Anwani</span>
                      <span style={{ fontWeight: 700, textAlign: "right" }}>
                        {reviewDraft.order.region || "—"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "rgba(255,255,255,.5)" }}>Njia ya malipo</span>
                      <span style={{ fontWeight: 700 }}>
                        {PAYMENT_METHODS.find((m) => m.id === reviewDraft.order.paymentMethod)?.label ||
                          reviewDraft.order.paymentMethod}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "rgba(255,255,255,.5)" }}>Muamala</span>
                      <span style={{ fontWeight: 700 }}>{reviewDraft.order.paymentId}</span>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 16,
                      borderRadius: 14,
                      background: "rgba(255,255,255,.03)",
                      border: "1px solid rgba(255,255,255,.06)",
                      marginBottom: 16,
                      fontSize: 13,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ color: "rgba(255,255,255,.5)" }}>Nenosiri la mteja</span>
                      <span style={{ fontWeight: 700 }}>{reviewDraft.order.fullName}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "rgba(255,255,255,.5)" }}>Simu</span>
                      <span style={{ fontWeight: 700 }}>{reviewDraft.order.phone}</span>
                    </div>
                  </div>

                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 800,
                      color: "rgba(255,255,255,.4)",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: ".08em",
                    }}
                  >
                    Maelezo ya ziada (si lazima)
                  </label>
                  <textarea
                    value={reviewMessage}
                    onChange={(e) => setReviewMessage(e.target.value)}
                    placeholder="Maelezo ya ziada kuhusu oda..."
                    style={{
                      width: "100%",
                      minHeight: 72,
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.04)",
                      color: "#fff",
                      padding: "12px 14px",
                      fontSize: 14,
                      marginBottom: 16,
                      resize: "vertical",
                      boxSizing: "border-box",
                    }}
                  />

                  <div
                    style={{
                      padding: "14px 18px",
                      borderRadius: 14,
                      background: "rgba(245,166,35,0.08)",
                      border: "1px solid rgba(245,166,35,0.2)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 18,
                    }}
                  >
                    <span style={{ fontWeight: 800, color: "rgba(255,255,255,0.75)" }}>JUMLA</span>
                    <span style={{ fontSize: 22, fontWeight: 900, color: G }}>
                      {lineTotal.toLocaleString()} TZS
                    </span>
                  </div>

                  <motion.button
                    type="button"
                    whileTap={submitting ? {} : { scale: 0.98 }}
                    disabled={submitting}
                    onClick={handleConfirmOrder}
                    style={{
                      width: "100%",
                      height: 54,
                      borderRadius: 14,
                      border: "none",
                      background: submitting ? "rgba(255,255,255,0.12)" : G,
                      color: submitting ? "rgba(255,255,255,0.35)" : "#000",
                      fontWeight: 900,
                      fontSize: 16,
                      cursor: submitting ? "wait" : "pointer",
                      boxShadow: submitting ? "none" : "0 8px 28px rgba(245,166,35,0.25)",
                    }}
                  >
                    {submitting ? "Inatuma..." : "Thibitisha na Tuma Oda"}
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
