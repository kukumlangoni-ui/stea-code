import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, FileDown, CheckCircle } from "lucide-react";
import { MARKET_CATEGORIES } from "../constants/marketplace.js";
import {
  getExactStorageErrorMessage,
  getFirebaseDb,
  logFirebaseStorageError,
  logStorageUpload,
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
  handleFirestoreError,
  OperationType,
  uploadToStorage,
} from "../firebase.js";
import { useMobile } from "../hooks/useMobile.js";
import { doc, getDoc } from "firebase/firestore";
import { useMarketplaceExtra } from "../hooks/useMarketplaceExtra.js";
import { orderService } from "../services/orderService.js";

const G = "#F5A623";

export const PAYMENT_METHODS = [
  { id:"mpesa",   label:"Vodacom M-Pesa" },
  { id:"airtel",  label:"Airtel Money" },
  { id:"tigo",    label:"Tigo Pesa" },
  { id:"bank",    label:"Bank Transfer" },
  { id:"lipa",    label:"Lipa Namba" },
  { id:"cash",    label:"Cash on Delivery / Pickup" },
];

const STEA_WA = "255757053354";

// FIX 3: WhatsApp priority: sellerWhatsApp → customWhatsAppNumber → whatsappNumber → STEA default
const DEFAULT_STEA_WA = "8619715852043";

export function buildOrderWaLink(product, order, defaultWA, deliverySettings) {
  const number =
    product.sellerWhatsApp ||
    product.customWhatsAppNumber ||
    product.whatsappNumber ||
    defaultWA ||
    DEFAULT_STEA_WA;
  const safeNum = number.replace(/\D/g, "");

  const ds = deliverySettings || {};
  const deliveryLabels = {
    pickup: "Shop Pickup (Free)",
    local: `Local Delivery (Dar es Salaam) - ${Number(ds.localFee || 5000).toLocaleString()} TZS`,
    region: `Region Delivery / Mkoani - ${Number(ds.regionFee || 15000).toLocaleString()} TZS`
  };
  const deliveryFee = order.deliveryOption === "pickup" ? 0
    : order.deliveryOption === "local" ? Number(ds.localFee || 5000)
    : order.deliveryOption === "region" ? Number(ds.regionFee || 15000)
    : 0;

  const qty = Number(order.quantity || 1);
  const unitPrice = Number(product.discountPrice || product.price || 0);
  const totalAmount = (unitPrice + deliveryFee) * qty;
  const orderId = order.orderId || `STEA-${Date.now().toString().slice(-6)}`;

  const paymentMethod = PAYMENT_METHODS.find(m => m.id === order.paymentMethod);
  const paymentMethodLabel = paymentMethod?.label || order.paymentMethod || "";
  const sellerPaymentInfo = product[`payment_${order.paymentMethod}`] || "";

  const msg = [
    "🛒 *ODA MPYA - STEA DUKA*",
    "----------------------------------",
    `*Oda ID:* ${orderId}`,
    `*Bidhaa:* ${product.name || product.title}`,
    `*Idadi (Qty):* ${qty}`,
    `*Bei ya Bidhaa:* ${unitPrice.toLocaleString()} TZS`,
    "",
    ["phones", "laptops", "tablets", "electronics"].includes(product.category) ? [
      order.color ? `*Rangi / Color:* ${order.color}` : null,
      order.warranty ? `*Warranty:* ${order.warranty}` : null,
    ].filter(Boolean).join("\n") : null,
    product.category === "spare_parts" ? [
      order.deviceType ? `*Device:* ${order.deviceType} (${order.deviceModel || ""})` : null,
      order.partType ? `*Part:* ${order.partType}` : null,
      order.serialNumber ? `*Serial:* ${order.serialNumber}` : null,
      order.issueDescription ? `*Issue:* ${order.issueDescription}` : null,
    ].filter(Boolean).join("\n") : null,
    "",
    "*MTEJA (BUYER)*",
    `*Jina:* ${order.fullName}`,
    `*Simu:* ${order.phone}`,
    "",
    "*UTOAJI (DELIVERY)*",
    `*Aina:* ${deliveryLabels[order.deliveryOption] || order.deliveryOption}`,
    order.region ? `*Eneo / Address:* ${order.region}` : null,
    `*Ada ya Utoaji:* ${deliveryFee.toLocaleString()} TZS`,
    "",
    "*MALIPO (PAYMENT)*",
    paymentMethodLabel ? `*Njia:* ${paymentMethodLabel}` : null,
    sellerPaymentInfo ? `*Info:* ${sellerPaymentInfo}` : null,
    order.paymentId ? `*Transaction ID:* ${order.paymentId}` : null,
    order.message ? `*Maelezo:* ${order.message}` : null,
    "",
    `*JUMLA: ${totalAmount.toLocaleString()} TZS*`,
    "----------------------------------",
    `Ref: ${orderId}`,
  ].filter(l => l !== null).join("\n");

  return `https://wa.me/${safeNum}?text=${encodeURIComponent(msg)}`;
}

const OptionCard = ({ selected, onClick, title, desc, priceStr }) => (
  <div onClick={onClick} style={{ padding: 14, borderRadius: 14, border: `2px solid ${selected ? G : "rgba(255,255,255,.05)"}`, background: selected ? `${G}15` : "rgba(255,255,255,.02)", cursor: "pointer", transition: "all .2s ease", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
    <div>
      <div style={{ fontSize: 15, fontWeight: 800, color: selected ? G : "#fff" }}>{title}</div>
      {desc && <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 2 }}>{desc}</div>}
    </div>
    {priceStr && <div style={{ fontSize: 14, fontWeight: 900, color: selected ? G : "rgba(255,255,255,.7)" }}>{priceStr}</div>}
  </div>
);

export function OrderFormModal({
  product,
  defaultWA,
  onClose,
  embedInPage = false,
  onOrderComplete,
  deferReviewToParent = false,
  onReviewReady,
  initialOrder = {},
  skipDeliveryStep = false,
}) {
  const isMobile = useMobile();
  const { extraSubcategories } = useMarketplaceExtra();

  const isSpecial = ["phones", "laptops", "tablets", "electronics", "spare_parts"].includes(product.category);
  const isElectronics = ["phones", "laptops", "tablets", "electronics"].includes(product.category);
  const isChaba = !!product.isChabaData;
  const DYNAMIC_STEPS = [
    { id: 1, title: "Delivery Option" },
    ...(isSpecial ? [{ id: 1.5, title: "Product Details", field: "special" }] : []),
    ...(isChaba ? [{ id: 1.6, title: "China Transport", field: "chaba_special" }] : []),
    { id: 2, title: "Buyer Details" },
    { id: 3, title: "Payment Method" },
    { id: 4, title: "Payment Proof" },
    { id: 5, title: "Review Order" },
  ];

  const deferReview =
    !!(embedInPage && deferReviewToParent && typeof onReviewReady === "function");
  let stepsForFlow = deferReview ? DYNAMIC_STEPS.filter((s) => s.id !== 5) : DYNAMIC_STEPS;

  if (skipDeliveryStep) {
    stepsForFlow = stepsForFlow.filter((s) => s.id !== 1);
  }

  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = stepsForFlow[stepIndex];
  const [order, setOrder] = useState({ 
    fullName:"", phone:"", deliveryOption:"", region:"", paymentMethod:"", paymentId:"", message:"", proofUrl: "",
    // Special fields
    quantity: 1, color: "", warranty: "Standard",
    deviceType: "", deviceModel: "", partType: "", serialNumber: "", issueDescription: "", devicePhoto: null, devicePhotoUrl: "",
    // Chaba fields
    transport: "sea",
    ...initialOrder
  });
  const [errors, setErrors] = useState({});
  const [deliverySettings, setDeliverySettings] = useState({ localFee: "5000", regionFee: "15000" });
  
  useEffect(() => {
    const fetchData = async () => {
      const db = getFirebaseDb();
      if (!db) return;
      try {
        const snap = await getDoc(doc(db, "site_settings", "delivery"));
        if (snap.exists() && snap.data().data) {
          setDeliverySettings(prev => ({ ...prev, ...snap.data().data }));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, "site_settings/delivery");
      }
    };
    fetchData();
  }, []);

  const setF = (k,v) => setOrder(o=>({...o,[k]:v}));

  const name = product.name || product.title || "Product";
  const price = product.discountPrice || product.price || 0;
  const priceStr = price ? `${Number(price).toLocaleString()} TZS` : "Contact for price";

  const REGIONS = ["Arusha", "Dodoma", "Geita", "Iringa", "Kagera", "Katavi", "Kigoma", "Kilimanjaro", "Lindi", "Manyara", "Mara", "Mbeya", "Morogoro", "Mtwara", "Mwanza", "Njombe", "Rukwa", "Ruvuma", "Shinyanga", "Simiyu", "Singida", "Songwe", "Tabora", "Tanga"];

  const handleNext = () => {
    const e = {};
    if (currentStep.id === 1) {
      if (!order.deliveryOption) e.deliveryOption = "Please select a delivery option";
    } else if (currentStep.field === "special") {
      if (product.category === "spare_parts") {
        if (!order.deviceType) e.deviceType = "Device type is required";
        if (!order.deviceModel.trim()) e.deviceModel = "Model is required";
        if (!order.partType.trim()) e.partType = "Part type is required";
        if (!order.issueDescription.trim()) e.issueDescription = "Description is required";
      }
      // Phase 5: Only validate color if product has color options
      const productColors = product.colors || product.variants || product.colorOptions || [];
      const colorList = Array.isArray(productColors) ? productColors.filter(Boolean) : [];
      if (colorList.length > 1 && !order.color) {
        e.color = "Please select a color";
      }
    } else if (currentStep.id === 2) {
      if (!order.fullName.trim()) e.fullName = "Full name is required";
      if (!order.phone.trim()) e.phone = "Phone number is required";
      if (order.phone.trim().length < 9) e.phone = "Enter a valid phone number";
      if (order.deliveryOption === "region" && !order.region.trim()) e.region = "Region is required";
      if (order.deliveryOption === "local" && !order.region.trim()) e.region = "Delivery area is required";
    } else if (currentStep.id === 3) {
      if (!order.paymentMethod) e.paymentMethod = "Please select a payment method";
    } else if (currentStep.id === 4) {
      if (!order.paymentId.trim() && !order.proofFile) e.paymentId = "Transaction ID au Screenshot inahitajika";
    }
    
    setErrors(e);
    if (Object.keys(e).length === 0) {
      if (deferReview && currentStep.id === 4) {
        onReviewReady({
          order: { ...order },
          deliverySettings: { ...deliverySettings },
        });
        return;
      }
      setStepIndex((s) => s + 1);
    }
  };

  const handlePrev = () => {
    setStepIndex(s => s - 1);
  };

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [lastOrderId, setLastOrderId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const url = await uploadToStorage(file, `order_proofs/${fileName}`);
      if (url) {
        setF("proofUrl", url);
        setF("proofFile", null); 
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Picha imeshindwa kupakia: " + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setUploading(true);
      const db = getFirebaseDb();
      if (!db) return;

      // devicePhoto upload to Storage for better reliability
      let deviceUploadUrl = "";
      if (order.devicePhoto) {
        try {
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
          deviceUploadUrl = await uploadToStorage(order.devicePhoto, `device_photos/${fileName}`);
        } catch (uploadErr) {
          console.error("Device photo upload failed:", uploadErr);
        }
      }
      
      const result = await orderService.processOrder({
        customerName: order.fullName,
        customerPhone: order.phone,
        region: order.region,
        deliveryOption: order.deliveryOption,
        paymentMethod: order.paymentMethod,
        paymentId: order.paymentId,
        message: order.message,
        proofUrl: proofUploadUrl,
        devicePhotoUrl: deviceUploadUrl,
        // Special fields
        category: product.category,
        quantity: order.quantity,
        color: order.color,
        warranty: order.warranty,
        deviceType: order.deviceType,
        deviceModel: order.deviceModel,
        partType: order.partType,
        serialNumber: order.serialNumber,
        issueDescription: order.issueDescription,
        // Variant
        selectedVariant: product.selectedVariant || null,
        variantLabel: product.selectedVariant?.label || "",
        variantPrice: product.selectedVariant?.price ?? null,

        productId: product.id || "unknown",
        productName: name,
        price: totalPrice * (isElectronics ? Number(order.quantity) : 1),
        unitPrice: Number(price),
        sellerId: product.sellerId || "admin",
        sellerName: product.sellerName || "STEA Merchant",
        type: "marketplace"
      });

      setLastOrderId(result.orderId);
      window._latestOrderData = result.order;

      if (onOrderComplete) {
        onOrderComplete({
          orderId: result.orderId,
          order: result.order,
          formOrder: { ...order },
          deliverySettings: { ...deliverySettings },
        });
        return;
      }
      // Show success screen instead of closing (WhatsApp / PDF only after success)
      setIsConfirmed(true);
    } catch (err) {
      console.error("Failed to save order", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (window._latestOrderData) {
      orderService.downloadReceipt(window._latestOrderData);
    } else {
      orderService.downloadReceipt({
        orderId: lastOrderId,
        customerName: order.fullName,
        customerPhone: order.phone,
        region: order.region || "Shop Pickup",
        productName: name,
        quantity: isElectronics ? order.quantity : 1,
        unitPrice: Number(price),
        totalPrice: Number(totalPrice * (isElectronics ? Number(order.quantity) : 1)),
        deliveryMethod: order.deliveryOption,
        sellerName: product.sellerName || "STEA Merchant",
        paymentMethod: PAYMENT_METHODS.find(m => m.id === order.paymentMethod)?.label || "Other"
      });
    }
  };

  const iSt = { width:"100%", height:46, borderRadius:12, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", color:"#fff", padding:"0 14px", outline:"none", fontSize:14, fontFamily:"inherit", boxSizing:"border-box", transition: "border-color .2s" };
  const lSt = { display:"block", fontSize:11, fontWeight:800, color:"rgba(255,255,255,.4)", marginBottom:6, textTransform:"uppercase", letterSpacing:".08em" };
  const errSt = { color:"#ef4444", fontSize:11, marginTop:4, fontWeight:700 };
  const thumb = Array.isArray(product.images) ? product.images[0] : (product.imageUrl||product.image||null);

  const deliveryFee = order.deliveryOption === 'pickup' ? 0 : 
                     order.deliveryOption === 'local' ? Number(deliverySettings.localFee) : 
                     order.deliveryOption === 'region' ? Number(deliverySettings.regionFee) : 0;
  const totalPrice = Number(price) + deliveryFee;



  const [activeImg, setActiveImg] = useState(0);
  const imgs = Array.isArray(product.images) ? product.images : [product.images].filter(Boolean);
  const displayImgs = imgs.length > 0 ? imgs.slice(0, 10) : [ thumb ].filter(Boolean);

  const cardMotionProps = embedInPage
    ? { initial: false, animate: { opacity: 1 } }
    : {
        initial: isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 },
        animate: isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 },
        exit: isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 },
        transition: { type: "spring", damping: 25, stiffness: 300 },
      };

  const cardStyle = embedInPage
    ? {
        position: "relative",
        width: "100%",
        maxWidth: "100%",
        background: "#0a0b10",
        borderRadius: 22,
        border: "1px solid rgba(255,255,255,0.08)",
        padding: 0,
        boxShadow: "none",
        maxHeight: "none",
        overflowY: "visible",
        display: "flex",
        flexDirection: "column",
        opacity: 1,
      }
    : {
        position: "relative",
        width: "100%",
        maxWidth: 500,
        background: "#000000",
        borderRadius: isMobile ? "24px 24px 0 0" : "24px",
        border: "1px solid rgba(255,255,255,0.15)",
        padding: "0",
        boxShadow: "0 20px 40px rgba(0,0,0,1)",
        maxHeight: "90vh",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        opacity: 1,
      };

  const checkoutCard = (
      <motion.div 
        {...cardMotionProps}
         className={embedInPage ? undefined : "checkout-container"}
         style={cardStyle}
       >
         {!embedInPage && (
           <>
         {/* Header (Floating on top of image carousel) */}
         <div style={{ position:"absolute", top: 16, left: 16, right: 16, zIndex: 10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
           <div style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)", padding: "4px 12px", borderRadius: 20, border: "1px solid rgba(255,255,255,.1)" }}>
              <div style={{ fontSize:15, fontWeight:900, color: "#fff" }}>Checkout</div>
           </div>
           <button onClick={onClose} style={{ background:"rgba(0,0,0,.6)", backdropFilter: "blur(4px)", border:"1px solid rgba(255,255,255,.1)", color:"#fff", borderRadius:"50%", width:36, height:36, cursor:"pointer", display:"grid", placeItems:"center" }}><X size={20} /></button>
         </div>

         {/* Image Carousel (Top Section) */}
         <div className="perfect-img-container" style={{ height: isMobile ? 300 : 380 }}>
          <AnimatePresence initial={false} mode="wait">
            {displayImgs.map((img, idx) => (
              activeImg === idx && (
                <div key={idx} style={{ width: "100%", height: "100%", position: "relative" }}>
                   {/* Blurred background for "fill" effect */}
                   <div className="perfect-img-blur" style={{ backgroundImage: `url(${img})`, opacity: 0.5 }} />
                   
                   <motion.img
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 1.1 }}
                     transition={{ duration: 0.4, ease: "easeOut" }}
                     src={img}
                     alt={`${name} image ${idx + 1}`}
                     style={{ position: "relative", zIndex: 2 }}
                     className="perfect-img-main"
                     referrerPolicy="no-referrer"
                   />
                </div>
              )
            ))}
          </AnimatePresence>

          {/* Dots Indicator */}
          {displayImgs.length > 1 && (
            <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5, zIndex: 5 }}>
              {displayImgs.map((_, i) => (
                <div key={i} onClick={() => setActiveImg(i)} style={{ width: i === activeImg ? 12 : 6, height: 6, borderRadius: 3, background: i === activeImg ? G : "rgba(255,255,255,.2)", transition: "all .3s ease", cursor: "pointer" }} />
              ))}
            </div>
          )}
          
          {/* Nav arrows only if > 1 img */}
          {displayImgs.length > 1 && (
            <>
               <button onClick={() => setActiveImg(a => (a - 1 + displayImgs.length) % displayImgs.length)} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.3)", border: "none", color: "#fff", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", zIndex: 5 }}>‹</button>
               <button onClick={() => setActiveImg(a => (a + 1) % displayImgs.length)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.3)", border: "none", color: "#fff", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", zIndex: 5 }}>›</button>
            </>
          )}
        </div>
           </>
         )}

        <div style={{ padding: 20, flex: 1 }}>
          <AnimatePresence mode="wait">
            {isConfirmed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: "center", padding: "40px 0" }}
              >
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(37, 211, 102, 0.1)", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
                  <CheckCircle size={40} color="#25d366" />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 10 }}>Oda Imetumwa!</h2>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.6, marginBottom: 30 }}>
                  Order yako <b>#{lastOrderId}</b> imepokelewa na kutumwa kwa muuzaji. Unaweza kupakua risiti yako hapa chini.
                </p>
                
                <div style={{ display: "grid", gap: 12 }}>
                  <button
                    onClick={handleDownloadReceipt}
                    style={{
                      height: 52, borderRadius: 14, background: G, color: "#000", fontWeight: 900, fontSize: 16, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10
                    }}
                  >
                    <FileDown size={20} /> PAKUA RISITI (PDF)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      window.open(
                        buildOrderWaLink(product, order, defaultWA, deliverySettings),
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                    style={{
                      height: 52, borderRadius: 14, background: "rgba(37,211,102,0.12)", color: "#25d366", fontWeight: 900, fontSize: 15, border: "1px solid rgba(37,211,102,0.25)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10
                    }}
                  >
                    <MessageCircle size={20} /> WhatsApp Muuzaji
                  </button>
                  <button
                    onClick={onClose}
                    style={{
                      height: 52, borderRadius: 14, background: "rgba(255,255,255,0.05)", color: "#fff", fontWeight: 800, fontSize: 14, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer"
                    }}
                  >
                    Funga Dirisha
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="steps"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</h3>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 2, fontWeight: 700 }}>Step {stepIndex + 1} of {stepsForFlow.length}: {currentStep.title}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: G, marginLeft: 16 }}>{priceStr}</div>
                </div>

                <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                  {stepsForFlow.map((s, idx) => (
                    <div key={s.id} style={{ height: 4, flex: 1, borderRadius: 2, background: idx <= stepIndex ? G : "rgba(255,255,255,.1)", transition: "background .3s" }} />
                  ))}
                </div>

                <div style={{ flex: 1 }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={stepIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      {currentStep.id === 1 && (
                        <div>
                          <label style={lSt}>How do you want to receive it?</label>
                          <OptionCard selected={order.deliveryOption === "pickup"} onClick={() => setF("deliveryOption", "pickup")} title="Shop Pickup" desc="Pick up from the seller's shop" priceStr="Free" />
                          <OptionCard selected={order.deliveryOption === "local"} onClick={() => setF("deliveryOption", "local")} title="Normal Delivery" desc="Dar es Salaam (24-48 hrs)" priceStr={`TZS ${Number(deliverySettings.localFee).toLocaleString()}`} />
                          <OptionCard selected={order.deliveryOption === "region"} onClick={() => setF("deliveryOption", "region")} title="Region Delivery" desc="Other Regions (2-5 days)" priceStr={`TZS ${Number(deliverySettings.regionFee).toLocaleString()}`} />
                          {errors.deliveryOption && <div style={errSt}>{errors.deliveryOption}</div>}
                        </div>
                      )}

                      {currentStep.field === "special" && isElectronics && (
                        <div style={{ display: "grid", gap: 14 }}>
                          <div>
                            <label style={lSt}>Quantity</label>
                            <input type="number" value={order.quantity} onChange={e=>setF("quantity", e.target.value)} style={iSt} min="1" />
                          </div>
                          {/* Phase 5: Only show color selector if product has colors/variants */}
                          {(() => {
                            const productColors = product.colors || product.variants || product.colorOptions || [];
                            const colorList = Array.isArray(productColors) ? productColors.filter(Boolean) : [];
                            if (colorList.length === 0) return null;
                            // Auto-select if only one color
                            if (colorList.length === 1 && !order.color) {
                              setTimeout(() => setF("color", colorList[0]), 0);
                            }
                            return (
                              <div>
                                <label style={lSt}>Chagua Rangi / Color *</label>
                                <select value={order.color} onChange={e=>setF("color", e.target.value)} style={iSt}>
                                  <option value="">Chagua rangi...</option>
                                  {colorList.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                {errors.color && <div style={errSt}>{errors.color}</div>}
                              </div>
                            );
                          })()}
                          {/* Fallback text input only if product has freeform color field */}
                          {!product.colors && !product.variants && !product.colorOptions && product.hasColorInput && (
                            <div>
                              <label style={lSt}>Color Preference</label>
                              <input value={order.color} onChange={e=>setF("color", e.target.value)} placeholder="e.g. Black, Silver" style={iSt} />
                            </div>
                          )}
                          <div>
                            <label style={lSt}>Warranty</label>
                            <select value={order.warranty} onChange={e=>setF("warranty", e.target.value)} style={iSt}>
                              <option value="Standard">Standard Warranty (6 Months)</option>
                              <option value="Extended">Extended Warranty (1 Year) + 10%</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {currentStep.field === "special" && product.category === "spare_parts" && (
                        <div style={{ display: "grid", gap: 14 }}>
                          <div>
                            <label style={lSt}>Device Type *</label>
                            <select value={order.deviceType} onChange={e=>setF("deviceType", e.target.value)} style={iSt}>
                              <option value="">Select Device...</option>
                              {MARKET_CATEGORIES.spare_parts.subcategories.map(s => <option key={s} value={s}>{s}</option>)}
                              {extraSubcategories.spare_parts?.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            {errors.deviceType && <div style={errSt}>{errors.deviceType}</div>}
                          </div>
                          <div>
                            <label style={lSt}>Device Model *</label>
                            <input value={order.deviceModel} onChange={e=>setF("deviceModel", e.target.value)} placeholder="e.g. iPhone 13 Pro, HP EliteBook 840" style={iSt} />
                            {errors.deviceModel && <div style={errSt}>{errors.deviceModel}</div>}
                          </div>
                          <div>
                            <label style={lSt}>Part Needed *</label>
                            <input value={order.partType} onChange={e=>setF("partType", e.target.value)} placeholder="e.g. Screen, Battery, Keyboard" style={iSt} />
                            {errors.partType && <div style={errSt}>{errors.partType}</div>}
                          </div>
                          <div>
                            <label style={lSt}>Serial Number (Optional)</label>
                            <input value={order.serialNumber} onChange={e=>setF("serialNumber", e.target.value)} placeholder="S/N" style={iSt} />
                          </div>
                          <div>
                            <label style={lSt}>Issue Description *</label>
                            <textarea value={order.issueDescription} onChange={e=>setF("issueDescription", e.target.value)} placeholder="Describe the problem..." style={{...iSt, height: 80, resize: "none", paddingTop: 10}} />
                            {errors.issueDescription && <div style={errSt}>{errors.issueDescription}</div>}
                          </div>
                          <div>
                            <label style={lSt}>Device Photo (Optional)</label>
                            <div style={{ border: "2px dashed rgba(255,255,255,.1)", borderRadius: 12, padding: 20, textAlign: "center", position: "relative", overflow: "hidden" }}>
                              {order.devicePhotoUrl ? (
                                 <div>
                                   <img src={order.devicePhotoUrl} alt="Device" style={{ maxHeight: 100, borderRadius: 8, maxWidth: "100%", objectFit: "contain" }} />
                                   <button onClick={(e) => { e.preventDefault(); setF("devicePhotoUrl", ""); setF("devicePhoto", null); }} style={{ color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer", marginTop: 8, background: "none", border: "none" }}>Remove</button>
                                 </div>
                              ) : (
                                <>
                                  <div style={{ fontSize: 20, marginBottom: 4 }}>📷</div>
                                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>Upload photo of the device/part</div>
                                  <input type="file" accept="image/*" onChange={(e) => {
                                    if(e.target.files && e.target.files[0]) {
                                      setF("devicePhoto", e.target.files[0]);
                                      setF("devicePhotoUrl", URL.createObjectURL(e.target.files[0]));
                                    }
                                  }} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStep.field === "chaba_special" && (
                        <div style={{ display: "grid", gap: 14 }}>
                          <label style={lSt}>Njia ya Usafiri (China Transport)</label>
                          <OptionCard 
                            selected={order.transport === "sea"} 
                            onClick={() => setF("transport", "sea")} 
                            title="Sea Shipping (Meli)" 
                            desc="30-45 Siku, Bei nafuu" 
                            priceStr="Standard"
                          />
                          <OptionCard 
                            selected={order.transport === "air"} 
                            onClick={() => setF("transport", "air")} 
                            title="Air Shipping (Ndege)" 
                            desc="7-14 Siku, Haraka" 
                            priceStr={product.air_price ? `Tsh ${Number(product.air_price).toLocaleString()}` : "N/A"}
                          />
                        </div>
                      )}

                      {currentStep.id === 2 && (
                        <div style={{ display: "grid", gap: 14 }}>
                          <div>
                            <label style={lSt}>Full Name *</label>
                            <input value={order.fullName} onChange={e=>setF("fullName",e.target.value)} placeholder="Your full name" style={{...iSt, borderColor:errors.fullName?"#ef4444":"rgba(255,255,255,.1)"}} />
                            {errors.fullName && <div style={errSt}>{errors.fullName}</div>}
                          </div>
                          <div>
                            <label style={lSt}>Phone Number *</label>
                            <input value={order.phone} onChange={e=>setF("phone",e.target.value)} placeholder="07XX XXX XXX" type="tel" style={{...iSt, borderColor:errors.phone?"#ef4444":"rgba(255,255,255,.1)"}} />
                            {errors.phone && <div style={errSt}>{errors.phone}</div>}
                          </div>
                          {order.deliveryOption === "region" && (
                            <div>
                              <label style={lSt}>Region *</label>
                              <select value={order.region} onChange={e=>setF("region",e.target.value)} style={{...iSt, borderColor:errors.region?"#ef4444":"rgba(255,255,255,.1)", appearance:"none", cursor:"pointer"}}>
                                <option value="">Select Region...</option>
                                {REGIONS.map(r=><option key={r} value={r}>{r}</option>)}
                              </select>
                              {errors.region && <div style={errSt}>{errors.region}</div>}
                            </div>
                          )}
                          {order.deliveryOption === "local" && (
                            <div>
                              <label style={lSt}>Delivery Area (Dar es Salaam) *</label>
                              <input value={order.region} onChange={e=>setF("region",e.target.value)} placeholder="e.g. Kinondoni, Mbezi, Posta" style={{...iSt, borderColor:errors.region?"#ef4444":"rgba(255,255,255,.1)"}} />
                              {errors.region && <div style={errSt}>{errors.region}</div>}
                            </div>
                          )}
                        </div>
                      )}

                      {currentStep.id === 3 && (
                        <div>
                          <label style={lSt}>Select Payment Method</label>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                            {PAYMENT_METHODS.map(m => {
                              const sellerInfo = product[`payment_${m.id}`];
                              const isAvailable = !!sellerInfo;

                              return (
                                <div 
                                  key={m.id} 
                                  onClick={() => isAvailable && setF("paymentMethod", m.id)} 
                                  style={{ 
                                    padding: "14px 16px", 
                                    borderRadius: 14, 
                                    border: `2px solid ${order.paymentMethod === m.id ? G : "rgba(255,255,255,.05)"}`, 
                                    background: order.paymentMethod === m.id ? `${G}15` : "rgba(255,255,255,.02)", 
                                    cursor: isAvailable ? "pointer" : "not-allowed", 
                                    display: "flex", 
                                    flexDirection: "column",
                                    gap: 4,
                                    transition: "all .2s",
                                    opacity: isAvailable ? 1 : 0.4
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: 14, fontWeight: 800, color: order.paymentMethod === m.id ? G : "#fff" }}>{m.label}</span>
                                    {!isAvailable && <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 700 }}>NOT AVAILABLE</span>}
                                  </div>
                                  {isAvailable && (
                                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", fontWeight: 600 }}>
                                       Seller Info: <span style={{ color: "#fff" }}>{sellerInfo}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {errors.paymentMethod && <div style={{...errSt, marginTop: 12}}>{errors.paymentMethod}</div>}
                        </div>
                      )}

                      {currentStep.id === 4 && (
                        <div style={{ display: "grid", gap: 16 }}>
                          <div style={{ padding: 14, borderRadius: 12, background: "rgba(37, 211, 102, 0.05)", border: "1px solid rgba(37, 211, 102, 0.2)", color: "#25d366", fontSize: 13, fontWeight: 700, lineHeight: 1.5, textAlign: "center" }}>
                            Lipa kisha weka Muamala (Transaction ID) au Pakia Screenshot ya Malipo.
                            <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 600, marginTop: 4 }}>Malipo yako yatahakikiwa papo hapo.</div>
                          </div>
                          
                          <div>
                            <label style={lSt}>Transaction ID / Receipt Number</label>
                            <input 
                              value={order.paymentId} 
                              onChange={e=>setF("paymentId",e.target.value)} 
                              placeholder="Mfn: 5H4X9J2..." 
                              style={{...iSt, borderColor: errors.paymentId && !order.proofFile ? "#ef4444" : (order.paymentId ? G : "rgba(255,255,255,0.1)"), background: order.paymentId ? "rgba(245,166,35,0.05)" : "rgba(255,255,255,0.06)"}} 
                          />
                          </div>

                          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700 }}>
                            --- AU (OR) ---
                          </div>

                          <div>
                            <label style={lSt}>Upload Payment Screenshot</label>
                            <div style={{ border: `2px dashed ${errors.paymentId && !order.paymentId && !order.proofFile && !order.proofUrl ? "#ef4444" : "rgba(255,255,255,.1)"}`, borderRadius: 12, padding: 20, textAlign: "center", position: "relative", overflow: "hidden", background: "rgba(255,255,255,0.02)" }}>
                              {order.proofUrl ? (
                                 <div>
                                   <img src={order.proofUrl} alt="Screenshot" style={{ maxHeight: 100, borderRadius: 8, maxWidth: "100%", objectFit: "contain" }} />
                                   <button onClick={(e) => { e.preventDefault(); setF("proofUrl", ""); setF("proofFile", null); }} style={{ color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer", marginTop: 8, background: "none", border: "none" }}>Remove</button>
                                 </div>
                              ) : uploadingImage ? (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                                  <div className="animate-spin" style={{ width: 24, height: 24, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: G, borderRadius: "50%" }}></div>
                                  <div style={{ fontSize: 11, color: G, fontWeight: 700 }}>Inapakia picha...</div>
                                </div>
                              ) : (
                                <>
                                  <div style={{ fontSize: 20, marginBottom: 4 }}>📷</div>
                                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>Pakia picha ya muamala hapa</div>
                                  <input type="file" accept="image/*" disabled={uploadingImage} onChange={(e) => {
                                    if(e.target.files && e.target.files[0]) {
                                      handleImageUpload(e.target.files[0]);
                                    }
                                  }} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                                </>
                              )}
                            </div>
                            {errors.paymentId && !order.paymentId && !order.proofFile && !order.proofUrl && <div style={{...errSt, marginTop: 8, textAlign: 'center'}}>{errors.paymentId}</div>}
                          </div>
                        </div>
                      )}

                      {!deferReview && currentStep.id === 5 && (
                        <div>
                          <div style={{ padding: 16, borderRadius: 14, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.05)", display: "grid", gap: 12, fontSize: 13 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 20 }}>
                              <span style={{ color: "rgba(255,255,255,.5)", flexShrink: 0 }}>Product:</span>
                              <span style={{ fontWeight: 700, textAlign: "right" }}>{name}</span>
                            </div>

                            {isSpecial && (
                              <div style={{ padding: "8px 0", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "grid", gap: 8 }}>
                                 {isElectronics ? (
                                   <>
                                     <div style={{ display: "flex", justifyContent: "space-between" }}>
                                       <span style={{ color: "rgba(255,255,255,.5)" }}>Quantity:</span>
                                       <span>{order.quantity}</span>
                                     </div>
                                     <div style={{ display: "flex", justifyContent: "space-between" }}>
                                       <span style={{ color: "rgba(255,255,255,.5)" }}>Color:</span>
                                       <span>{order.color || "Default"}</span>
                                     </div>
                                     <div style={{ display: "flex", justifyContent: "space-between" }}>
                                       <span style={{ color: "rgba(255,255,255,.5)" }}>Warranty:</span>
                                       <span>{order.warranty}</span>
                                     </div>
                                   </>
                                 ) : (
                                   <>
                                     <div style={{ display: "flex", justifyContent: "space-between" }}>
                                       <span style={{ color: "rgba(255,255,255,.5)" }}>Device:</span>
                                       <span>{order.deviceType} ({order.deviceModel})</span>
                                     </div>
                                     <div style={{ display: "flex", justifyContent: "space-between" }}>
                                       <span style={{ color: "rgba(255,255,255,.5)" }}>Part:</span>
                                       <span>{order.partType}</span>
                                     </div>
                                   </>
                                 )}
                              </div>
                            )}

                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "rgba(255,255,255,.5)" }}>Subtotal:</span>
                              <span style={{ fontWeight: 700 }}>{priceStr}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "rgba(255,255,255,.5)" }}>Delivery ({order.deliveryOption}):</span>
                              <span style={{ fontWeight: 700 }}>{deliveryFee === 0 ? "Free" : `TZS ${deliveryFee.toLocaleString()}`}</span>
                            </div>
                            <hr style={{ border: "none", borderTop: "1px dashed rgba(255,255,255,.1)", margin: "4px 0" }} />
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, color: G }}>
                              <span style={{ fontWeight: 900 }}>Total:</span>
                              <span style={{ fontWeight: 900 }}>TZS {(totalPrice * (isElectronics ? Number(order.quantity) : 1)).toLocaleString()}</span>
                            </div>
                          </div>

                          <div style={{ marginTop: 16, padding: 16, borderRadius: 14, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.05)", display: "grid", gap: 12, fontSize: 13 }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "rgba(255,255,255,.5)" }}>Full Name:</span>
                              <span style={{ fontWeight: 700 }}>{order.fullName}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "rgba(255,255,255,.5)" }}>Phone:</span>
                              <span style={{ fontWeight: 700 }}>{order.phone}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "rgba(255,255,255,.5)", flexShrink: 0 }}>Payment:</span>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontWeight: 700 }}>{PAYMENT_METHODS.find(m=>m.id===order.paymentMethod)?.label}</div>
                                <div style={{ fontSize: 11, color: G, fontWeight: 700 }}>{product[`payment_${order.paymentMethod}`]}</div>
                                {order.paymentId && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Ref: {order.paymentId}</div>}
                              </div>
                            </div>
                          </div>
                          
                          <div style={{ marginTop: 14 }}>
                            <label style={lSt}>Special Instructions (Optional)</label>
                            <textarea value={order.message} onChange={e=>setF("message",e.target.value)} placeholder="Any specific requirements..." style={{...iSt, height:60, resize:"none", paddingTop: 10}} />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ padding: "0 20px 24px" }}>
          <div style={{ display: "flex", gap: 12, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.05)" }}>
          {stepIndex > 0 && (
            <button onClick={handlePrev} style={{ flex: 1, height: 46, borderRadius: 12, border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "rgba(255,255,255,.7)", fontWeight: 800, fontSize: 14, cursor: "pointer", transition: "all .2s" }}>
              Back
            </button>
          )}
          {stepIndex < stepsForFlow.length - 1 ? (
            <button onClick={handleNext} style={{ flex: stepIndex === 0 ? 1 : 2, height: 46, borderRadius: 12, border: "none", background: G, color: "#000", fontWeight: 800, fontSize: 14, cursor: "pointer", transition: "transform .15s" }}>
              Continue
            </button>
          ) : deferReview ? (
            <button
              type="button"
              onClick={handleNext}
              style={{
                flex: 2,
                height: 46,
                borderRadius: 12,
                border: "none",
                background: G,
                color: "#111",
                fontWeight: 900,
                fontSize: 14,
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(245,166,35,0.25)",
              }}
            >
              Endelea kwenye Muhtasari
            </button>
          ) : (
            <button 
              type="button"
              onClick={handleSubmit} 
              disabled={uploading} 
              style={{ 
                flex: 2, height: 46, borderRadius: 12, border: "none", background: G, color: "#111", 
                fontWeight: 900, fontSize: 14, cursor: uploading ? "wait" : "pointer", 
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, 
                transition: "transform .12s ease, opacity .2s", opacity: uploading ? 0.75 : 1,
                boxShadow: uploading ? "none" : "0 4px 20px rgba(245,166,35,0.25)",
              }}
              onMouseDown={(e) => { if (!uploading) e.currentTarget.style.transform = "scale(0.98)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = ""; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
            >
               {uploading ? (
                 <>
                   <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                   Inatuma oda...
                 </>
               ) : (
                 <>Tuma Oda</>
               )}
            </button>
          )}
        </div>
        </div>
      </motion.div>
  );

  if (embedInPage) return checkoutCard;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:10000, display:"flex", alignItems:isMobile?"flex-end":"center", justifyContent:"center" }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.85)" }} onClick={onClose} />
      {checkoutCard}
    </div>
  );
}

/** Tanzania marketplace — saves to marketplace_orders + orders, includes all required fields. */
export async function submitMarketplaceOrderFromState({ product, order, deliverySettings }) {
  const isElectronics = ["phones", "laptops", "tablets", "electronics"].includes(product.category);
  const name = product.name || product.title || "Product";
  const price = Number(product.discountPrice || product.price || 0);
  const deliveryFee =
    order.deliveryOption === "pickup"
      ? 0
      : order.deliveryOption === "local"
        ? Number(deliverySettings?.localFee || 5000)
        : order.deliveryOption === "region"
          ? Number(deliverySettings?.regionFee || 15000)
          : 0;
  const qty = isElectronics ? Number(order.quantity || 1) : 1;
  const totalPrice = (price + deliveryFee) * qty;

  const db = getFirebaseDb();
  if (!db) throw new Error("Database not initialized");

  let deviceUploadUrl = "";
  if (order.devicePhoto) {
    const ext = order.devicePhoto.name.split(".").pop() || "jpg";
    const uploadPath = `order_attachments/${Date.now()}_device.${ext}`;
    logStorageUpload(uploadPath);
    const fileRef = ref(storage, uploadPath);
    try {
      await uploadBytes(fileRef, order.devicePhoto);
      deviceUploadUrl = await getDownloadURL(fileRef);
    } catch (error) {
      logFirebaseStorageError(error);
      throw new Error(getExactStorageErrorMessage(error), { cause: error });
    }
  }

  // Pick product image
  const productImage =
    product.thumbnail ||
    (Array.isArray(product.images) && product.images[0]) ||
    product.imageUrl ||
    product.image ||
    "";

  return orderService.processOrder({
    customerName: order.fullName,
    customerPhone: order.phone,
    customerEmail: order.email || "",
    region: order.region,
    address: order.region || "",
    deliveryOption: order.deliveryOption,
    deliveryPrice: deliveryFee,
    paymentMethod: order.paymentMethod,
    paymentId: order.paymentId,
    paymentNumber: order.paymentId || "",
    message: order.message,
    notes: order.message || "",
    proofUrl: order.proofUrl || "",
    devicePhotoUrl: deviceUploadUrl,
    category: product.category,
    quantity: qty,
    selectedColor: order.color || "",
    color: order.color || "",
    warranty: order.warranty || "Standard",
    deviceType: order.deviceType || "",
    deviceModel: order.deviceModel || "",
    partType: order.partType || "",
    serialNumber: order.serialNumber || "",
    issueDescription: order.issueDescription || "",
    productId: product.id || "unknown",
    productName: name,
    productImage,
    sellerId: product.sellerId || "admin",
    sellerBusinessName: product.sellerBusinessName || product.sellerName || "STEA Merchant",
    sellerName: product.sellerName || product.sellerBusinessName || "STEA Merchant",
    price: totalPrice,
    totalAmount: totalPrice,
    unitPrice: Number(price),
    type: "marketplace",
    status: "pending",
  });
}
