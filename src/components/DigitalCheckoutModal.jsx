/**
 * Premium digital tools checkout.
 * Creates pending records in toolSubscriptions and keeps legacy field support.
 */
import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  CheckCircle2,
  CreditCard,
  MessageCircle,
  QrCode,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import {
  addDoc,
  collection,
  getDownloadURL,
  getExactStorageErrorMessage,
  getFirebaseAuth,
  getFirebaseDb,
  logFirebaseStorageError,
  logStorageUpload,
  onSnapshot,
  query,
  ref,
  serverTimestamp,
  storage,
  uploadBytes,
  where,
} from "../firebase.js";
import { cleanData } from "../utils/cleanData.js";

const G = "#F5A623";
const G2 = "#FFD17C";
const DARK = "#08090e";
const PANEL = "#0f1118";
const BORDER = "rgba(255,255,255,.09)";
const CURRENCIES = ["TZS", "USD", "CNY"];
const WHATSAPP_PAYMENT_NUMBER = "8619715852043";

const DEFAULT_METHODS = [
  {
    id: "mpesa",
    name: "M-Pesa",
    type: "mobile_money",
    currency: "TZS",
    country: "Tanzania",
    accountNumber: "555999",
    accountName: "STEA",
    instructions: "Send TZS {amount} through Lipa Namba 555999 (STEA), then enter the confirmation number.",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "airtel",
    name: "Airtel Money",
    type: "mobile_money",
    currency: "TZS",
    country: "Tanzania",
    instructions: "Send TZS {amount} through Airtel Money, then enter the confirmation number.",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "tigo",
    name: "Tigo Pesa",
    type: "mobile_money",
    currency: "TZS",
    country: "Tanzania",
    instructions: "Send TZS {amount} through Tigo Pesa, then enter the confirmation number.",
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "paypal",
    name: "PayPal",
    type: "paypal",
    currency: "USD,CNY",
    country: "Global",
    instructions: "Pay {amount} using PayPal, then upload your payment proof and reference.",
    isActive: true,
    sortOrder: 4,
  },
  {
    id: "stripe",
    name: "Stripe/Card",
    type: "card",
    currency: "USD,CNY,TZS",
    country: "Global",
    instructions: "Card checkout is a manual placeholder for now. Contact support, then upload your proof.",
    isActive: true,
    sortOrder: 5,
  },
  {
    id: "wechat",
    name: "WeChat Pay QR",
    type: "qr",
    currency: "CNY",
    country: "China",
    instructions: "Scan the WeChat Pay QR code, pay {amount}, then upload your screenshot and transaction number.",
    isActive: true,
    sortOrder: 6,
  },
  {
    id: "alipay",
    name: "Alipay QR",
    type: "qr",
    currency: "CNY",
    country: "China",
    instructions: "Scan the Alipay QR code, pay {amount}, then upload your screenshot and transaction number.",
    isActive: true,
    sortOrder: 7,
  },
  {
    id: "bank",
    name: "Bank Transfer",
    type: "bank",
    currency: "TZS,USD,CNY",
    country: "Global",
    instructions: "Send {amount} by bank transfer, then enter the reference number and upload proof if available.",
    isActive: true,
    sortOrder: 8,
  },
  {
    id: "other",
    name: "Other",
    type: "other",
    currency: "TZS,USD,CNY",
    country: "Global",
    instructions: "Contact support for this method, then submit your reference after payment.",
    isActive: true,
    sortOrder: 9,
  },
];

const inputStyle = {
  width: "100%",
  height: 48,
  borderRadius: 12,
  border: `1px solid ${BORDER}`,
  background: "rgba(255,255,255,.045)",
  color: "#fff",
  padding: "0 14px",
  outline: "none",
  fontFamily: "inherit",
  fontSize: 14,
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 900,
  color: "rgba(255,255,255,.48)",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: ".06em",
};

const errorStyle = { fontSize: 12, color: "#fca5a5", marginTop: 5 };

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(currency, value) {
  const n = toNumber(value);
  if (!n) return currency === "CNY" ? "CNY ¥0" : currency === "USD" ? "USD $0" : "TZS 0";
  if (currency === "USD") return `USD $${n.toLocaleString()}`;
  if (currency === "CNY") return `CNY ¥${n.toLocaleString()}`;
  return `TZS ${n.toLocaleString()}`;
}

function splitLines(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value || "")
    .split(/\n|,/)
    .map((x) => x.replace(/^-\s*/, "").trim())
    .filter(Boolean);
}

function planPrices(plan, item) {
  const prices = plan?.prices || {};
  return {
    TZS: toNumber(prices.TZS ?? prices.tzs ?? plan?.priceTZS ?? plan?.price ?? item?.salePriceTZS ?? item?.salePrice ?? item?.newPrice ?? item?.price),
    USD: toNumber(prices.USD ?? prices.usd ?? plan?.priceUSD ?? item?.salePriceUSD),
    CNY: toNumber(prices.CNY ?? prices.cny ?? plan?.priceCNY ?? item?.salePriceCNY),
  };
}

function normalizePlan(plan, index, item) {
  const durationDays = Number(plan?.durationDays || plan?.days || (plan?.durationMonths ? Number(plan.durationMonths) * 30 : 30)) || 30;
  return {
    id: plan?.id || plan?.planId || `plan_${index}`,
    name: plan?.name || plan?.title || `Plan ${index + 1}`,
    description: plan?.description || "",
    durationDays,
    features: splitLines(plan?.features),
    prices: planPrices(plan, item),
    badge: plan?.badge || plan?.badgeLabel || (plan?.isPopular ? "Popular" : plan?.isDefault ? "Best Value" : ""),
    isPopular: !!(plan?.isPopular || plan?.isDefault),
    isActive: plan?.isActive !== false && plan?.enabled !== false,
    sortOrder: Number(plan?.sortOrder ?? index),
  };
}

function normalizePlans(item) {
  const raw = Array.isArray(item?.plans) ? item.plans : [];
  const active = raw.map((plan, index) => normalizePlan(plan, index, item)).filter((plan) => plan.isActive);
  if (active.length) return active.sort((a, b) => a.sortOrder - b.sortOrder);
  return [
    normalizePlan(
      {
        id: "fallback",
        name: item?.title || item?.name || "Digital Tool Access",
        durationDays: 30,
        price: item?.salePriceTZS ?? item?.salePrice ?? item?.newPrice ?? item?.price ?? 0,
        features: splitLines(item?.includedFeatures || item?.fullDescription),
      },
      0,
      item
    ),
  ];
}

function methodSupportsCurrency(method, currency) {
  const value = method?.currency || method?.currencies || "TZS";
  if (Array.isArray(value)) return value.includes(currency) || value.includes("ALL");
  return String(value).split(",").map((x) => x.trim().toUpperCase()).includes(currency) || String(value).toUpperCase() === "ALL";
}

function methodMatchesTool(method, item) {
  const linked = method?.linkedToolId || method?.toolId || method?.linkedToolSlug || method?.toolSlug || "";
  if (!linked || String(linked).toLowerCase() === "all") return true;
  return [item?.id, item?.slug, item?.title, item?.name].filter(Boolean).map(String).includes(String(linked));
}

function methodInstruction(method, amount, currency, item) {
  const fallback =
    currency === "TZS"
      ? item?.paymentInstructions || DEFAULT_METHODS[0].instructions
      : "For USD/CNY payments, choose PayPal, WeChat Pay, or Alipay and upload your payment proof.";
  return String(method?.instructions || fallback)
    .replaceAll("{amount}", money(currency, amount))
    .replaceAll("{currency}", currency)
    .replaceAll("{accountNumber}", method?.accountNumber || "");
}

function buildWhatsAppMessage({ title, selectedPlan, amount, currency, selectedMethod, form, subscriptionId }) {
  return [
    "Hello STEA/TRINOVA AI, I have submitted payment for digital tool subscription.",
    `Tool name: ${title}`,
    `Plan name: ${selectedPlan?.name || "-"}`,
    `Amount: ${money(currency, amount)}`,
    `Currency: ${currency}`,
    `Payment method: ${selectedMethod?.name || "-"}`,
    `Full name: ${form.fullName || "-"}`,
    `Email: ${form.email || "-"}`,
    `User WhatsApp: ${form.whatsapp || "-"}`,
    `Country: ${form.country || "-"}`,
    `Transaction/reference: ${form.paymentReference || "-"}`,
    `Firestore request ID: ${subscriptionId || "-"}`,
  ].join("\n");
}

export default function DigitalCheckoutModal({ item, type = "tool", isOpen, onClose, initialPlan = null }) {
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  const [step, setStep] = useState(1);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [currency, setCurrency] = useState("TZS");
  const [methods, setMethods] = useState(DEFAULT_METHODS);
  const [selectedMethodId, setSelectedMethodId] = useState("mpesa");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    whatsapp: "",
    country: "Tanzania",
    paymentReference: "",
    notes: "",
    proofFile: null,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState("");

  const plans = useMemo(() => normalizePlans(item), [item]);
  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) || plans[0],
    [plans, selectedPlanId]
  );
  const availableMethods = useMemo(() => {
    const active = methods
      .filter((method) => method.isActive !== false)
      .filter((method) => methodSupportsCurrency(method, currency))
      .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
    return active.length ? active : DEFAULT_METHODS.filter((method) => methodSupportsCurrency(method, currency));
  }, [methods, currency]);
  const selectedMethod = useMemo(
    () => availableMethods.find((method) => method.id === selectedMethodId) || availableMethods[0],
    [availableMethods, selectedMethodId]
  );

  const title = item?.title || item?.name || "Digital Tool";
  const amount = selectedPlan?.prices?.[currency] || 0;
  const instructions = methodInstruction(selectedMethod, amount, currency, item);

  useEffect(() => {
    if (!isOpen || !db) return undefined;
    // Query the new unified collection
    const unsub = onSnapshot(collection(db, "servicePaymentMethods"), (snap) => {
      const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filter for global or specific tool
      const relevant = loaded.filter(m => 
        m.serviceId === "global" || 
        m.serviceId === item?.id || 
        m.serviceId === item?.slug
      );
      setMethods(relevant.length ? relevant : DEFAULT_METHODS);
    });
    return () => unsub();
  }, [db, isOpen, item?.id, item?.slug]);

  useEffect(() => {
    if (!isOpen || !item) return;
    const currentUser = auth?.currentUser;
    const preferred = initialPlan?.id || item?.selectedPlan?.id || plans.find((p) => p.isPopular)?.id || plans[0]?.id || "";
    setSelectedPlanId(preferred);
    setCurrency("TZS");
    setSelectedMethodId("mpesa");
    setStep(1);
    setSubscriptionId("");
    setErrors({});
    setForm({
      fullName: currentUser?.displayName || "",
      email: currentUser?.email || "",
      whatsapp: "",
      country: "Tanzania",
      paymentReference: "",
      notes: "",
      proofFile: null,
    });
  }, [isOpen, item?.id, initialPlan?.id, plans.length]);

  useEffect(() => {
    if (!availableMethods.some((method) => method.id === selectedMethodId)) {
      setSelectedMethodId(availableMethods[0]?.id || "");
    }
  }, [availableMethods, selectedMethodId]);

  if (!isOpen || !item) return null;

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = "Full name is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email.";
    if (!form.whatsapp.trim()) next.whatsapp = "WhatsApp number is required.";
    if (!form.country.trim()) next.country = "Country is required.";
    if (!selectedPlan) next.plan = "Choose a plan.";
    if (!amount) next.currency = "This plan does not have a price for the selected currency.";
    if (!selectedMethod) next.paymentMethod = "Choose a payment method.";
    if (!form.paymentReference.trim()) next.paymentReference = "Payment reference or transaction number is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const uploadProof = async (uid = "guest") => {
    if (!form.proofFile) return "";
    const safeName = form.proofFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `toolSubscriptions/paymentProofs/${uid}/${Date.now()}_${safeName}`;
    logStorageUpload(path);
    const fileRef = ref(storage, path);
    try {
      await uploadBytes(fileRef, form.proofFile);
      return getDownloadURL(fileRef);
    } catch (error) {
      logFirebaseStorageError(error);
      throw new Error(getExactStorageErrorMessage(error), { cause: error });
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const currentUser = auth?.currentUser || null;
      const proofUrl = await uploadProof(currentUser?.uid || "guest");
      const payload = cleanData({
        toolId: item.id || "",
        toolTitle: title,
        selectedTool: title,
        toolSlug: item.slug || "",
        toolImage: item.thumbnailUrl || item.imageUrl || item.image || "",
        brandName: item.brandName || "TRINOVA AI",
        poweredBy: item.poweredBy || "TRINOVA AI",
        userId: currentUser?.uid || null,
        fullName: form.fullName.trim(),
        email: form.email.trim() || currentUser?.email || "",
        userName: form.fullName.trim(),
        userEmail: form.email.trim() || currentUser?.email || "",
        whatsapp: form.whatsapp.trim(),
        country: form.country.trim(),
        currency,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        durationDays: selectedPlan.durationDays || 30,
        amount,
        prices: selectedPlan.prices || {},
        paymentMethod: selectedMethod.name,
        paymentMethodId: selectedMethod.id,
        paymentMethodType: selectedMethod.type || "",
        paymentReference: form.paymentReference.trim(),
        paymentProofUrl: proofUrl,
        status: "pending",
        startsAt: null,
        expiresAt: null,
        approvedAt: null,
        approvedBy: "",
        notes: form.notes.trim(),
        source: "digital_tools",
        checkoutType: type === "subscription" ? "subscription_plan" : "digital_tool",
        whatsappRedirected: true,
        whatsappRedirectNumber: WHATSAPP_PAYMENT_NUMBER,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const docRef = await addDoc(collection(db, "serviceSubscriptions"), payload);
      setSubscriptionId(docRef.id);
      const whatsappMessage = buildWhatsAppMessage({
        title,
        selectedPlan,
        amount,
        currency,
        selectedMethod,
        form,
        subscriptionId: docRef.id,
      });
      const whatsappUrl = `https://wa.me/${WHATSAPP_PAYMENT_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;
      const opened = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      if (!opened) window.location.href = whatsappUrl;
      setStep(2);
    } catch (error) {
      console.error(error);
      setErrors((prev) => ({
        ...prev,
        submit: error?.code === "storage/unauthorized"
          ? "Upload permission failed. Check Firebase Storage rules for payment proofs."
          : error.message || "Failed to submit payment.",
      }));
    } finally {
      setSaving(false);
    }
  };

  const selectedMethodQrUrl = selectedMethod?.qrCodeUrl || selectedMethod?.qrImage || selectedMethod?.qrImageUrl || "";
  const waText = encodeURIComponent(buildWhatsAppMessage({
    title,
    selectedPlan,
    amount,
    currency,
    selectedMethod,
    form,
    subscriptionId,
  }));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(3,4,8,.88)",
          backdropFilter: "blur(16px)",
          display: "grid",
          placeItems: "center",
          padding: 14,
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ y: 26, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 16, opacity: 0, scale: 0.97 }}
          style={{
            width: "100%",
            maxWidth: 860,
            maxHeight: "94vh",
            overflowY: "auto",
            background: DARK,
            color: "#fff",
            border: `1px solid ${BORDER}`,
            borderRadius: 24,
            boxShadow: "0 30px 90px rgba(0,0,0,.65)",
            position: "relative",
          }}
        >
          <button
            onClick={onClose}
            aria-label="Close checkout"
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 2,
              width: 38,
              height: 38,
              borderRadius: 12,
              border: `1px solid ${BORDER}`,
              background: "rgba(255,255,255,.07)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <X size={17} />
          </button>

          {step === 1 ? (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(280px,340px)", gap: 0 }}>
              <style>{`
                @media (max-width: 780px) {
                  .digital-checkout-grid { display:block !important; }
                  .digital-checkout-side { border-left:0 !important; border-top:1px solid ${BORDER}; }
                }
              `}</style>
              <div className="digital-checkout-grid" style={{ display: "contents" }}>
                <div style={{ padding: "28px clamp(18px,4vw,32px)" }}>
                  <div style={{ marginBottom: 22, paddingRight: 44 }}>
                    <div style={{ color: G, fontSize: 12, fontWeight: 950, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>
                      Powered by TRINOVA AI
                    </div>
                    <h2 style={{ margin: 0, fontSize: "clamp(24px,4vw,34px)", lineHeight: 1.08, letterSpacing: "-.03em" }}>
                      Complete Your Subscription
                    </h2>
                    <p style={{ margin: "10px 0 0", color: "rgba(255,255,255,.56)", lineHeight: 1.6, fontSize: 14 }}>
                      After payment, submit your details and we will confirm your access through WhatsApp.
                    </p>
                  </div>

                  {errors.auth && (
                    <div style={{ border: "1px solid rgba(239,68,68,.28)", background: "rgba(239,68,68,.1)", color: "#fca5a5", padding: 12, borderRadius: 12, marginBottom: 16, fontSize: 13 }}>
                      {errors.auth}
                    </div>
                  )}

                  <div style={{ display: "grid", gap: 18 }}>
                    <section style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 16 }}>
                      <label style={labelStyle}>Choose Plan</label>
                      {errors.plan && <div style={errorStyle}>{errors.plan}</div>}
                      <div style={{ display: "grid", gap: 10 }}>
                        {plans.map((plan) => {
                          const active = plan.id === selectedPlan?.id;
                          return (
                            <button
                              key={plan.id}
                              onClick={() => setSelectedPlanId(plan.id)}
                              style={{
                                textAlign: "left",
                                borderRadius: 14,
                                border: `1.5px solid ${active ? G : BORDER}`,
                                background: active ? "rgba(245,166,35,.1)" : "rgba(255,255,255,.025)",
                                color: "#fff",
                                padding: 14,
                                cursor: "pointer",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    <strong style={{ fontSize: 15 }}>{plan.name}</strong>
                                    {plan.badge && <span style={{ background: `${G}22`, color: G, borderRadius: 999, padding: "3px 8px", fontSize: 10, fontWeight: 950 }}>{plan.badge}</span>}
                                  </div>
                                  <div style={{ marginTop: 4, color: "rgba(255,255,255,.48)", fontSize: 12 }}>{plan.durationDays} days</div>
                                </div>
                                <div style={{ width: 22, height: 22, borderRadius: 999, border: `2px solid ${active ? G : "rgba(255,255,255,.22)"}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                                  {active && <Check size={13} color={G} />}
                                </div>
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                                {CURRENCIES.map((cur) => (
                                  <span key={cur} style={{ border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.04)", borderRadius: 999, padding: "5px 9px", fontSize: 12, fontWeight: 850, color: cur === currency ? G : "rgba(255,255,255,.74)" }}>
                                    {money(cur, plan.prices[cur])}
                                  </span>
                                ))}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Full Name</label>
                        <input value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} placeholder="Your full name" style={{ ...inputStyle, borderColor: errors.fullName ? "#ef4444" : BORDER }} />
                        {errors.fullName && <div style={errorStyle}>{errors.fullName}</div>}
                      </div>
                      <div>
                        <label style={labelStyle}>Email</label>
                        <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="you@example.com" style={{ ...inputStyle, borderColor: errors.email ? "#ef4444" : BORDER }} />
                        {errors.email && <div style={errorStyle}>{errors.email}</div>}
                      </div>
                      <div>
                        <label style={labelStyle}>WhatsApp Number</label>
                        <input value={form.whatsapp} onChange={(e) => setField("whatsapp", e.target.value)} placeholder="+255..." style={{ ...inputStyle, borderColor: errors.whatsapp ? "#ef4444" : BORDER }} />
                        {errors.whatsapp && <div style={errorStyle}>{errors.whatsapp}</div>}
                      </div>
                      <div>
                        <label style={labelStyle}>Country</label>
                        <input value={form.country} onChange={(e) => setField("country", e.target.value)} placeholder="Country" style={{ ...inputStyle, borderColor: errors.country ? "#ef4444" : BORDER }} />
                        {errors.country && <div style={errorStyle}>{errors.country}</div>}
                      </div>
                    </section>

                    <section style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 16 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 14 }}>
                        <div>
                          <label style={labelStyle}>Currency</label>
                          <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ ...inputStyle, cursor: "pointer", borderColor: errors.currency ? "#ef4444" : BORDER }}>
                            {CURRENCIES.map((cur) => <option key={cur} value={cur}>{cur}</option>)}
                          </select>
                          {errors.currency && <div style={errorStyle}>{errors.currency}</div>}
                        </div>
                        <div>
                          <label style={labelStyle}>Payment Method</label>
                          {errors.paymentMethod && <div style={{...errorStyle, marginBottom: 8}}>{errors.paymentMethod}</div>}
                          <div style={{ display: "grid", gap: 10 }}>
                            {availableMethods.map((method) => {
                              const active = method.id === selectedMethod?.id;
                              return (
                                <button
                                  key={method.id}
                                  onClick={() => setSelectedMethodId(method.id)}
                                  style={{
                                    textAlign: "left",
                                    borderRadius: 12,
                                    border: `1.5px solid ${active ? G : BORDER}`,
                                    background: active ? "rgba(245,166,35,.1)" : "rgba(255,255,255,.025)",
                                    color: "#fff",
                                    padding: 12,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <span style={{ fontWeight: 700 }}>{method.name}</span>
                                  {active && <Check size={16} color={G} />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div style={{ borderRadius: 14, border: `1px solid ${G}2a`, background: "rgba(245,166,35,.07)", padding: 14, display: "grid", gap: 10 }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          {selectedMethod?.type === "qr" ? <QrCode size={18} color={G} /> : <CreditCard size={18} color={G} />}
                          <strong style={{ fontSize: 14 }}>{selectedMethod?.name || "Payment Instructions"}</strong>
                        </div>
                        <p style={{ margin: 0, color: "rgba(255,255,255,.76)", lineHeight: 1.65, fontSize: 13 }}>{instructions}</p>
                        {(selectedMethod?.accountNumber || selectedMethod?.accountName) && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {selectedMethod.accountNumber && <span style={{ fontSize: 12, color: "#fff", background: "rgba(255,255,255,.06)", borderRadius: 8, padding: "6px 9px" }}>Account: {selectedMethod.accountNumber}</span>}
                            {selectedMethod.accountName && <span style={{ fontSize: 12, color: "#fff", background: "rgba(255,255,255,.06)", borderRadius: 8, padding: "6px 9px" }}>Name: {selectedMethod.accountName}</span>}
                          </div>
                        )}
                        {selectedMethodQrUrl && (
                          <div style={{ width: 160, maxWidth: "100%", borderRadius: 14, padding: 8, background: "#fff" }}>
                            <img src={selectedMethodQrUrl} alt={`${selectedMethod.name} QR`} style={{ width: "100%", display: "block", borderRadius: 10 }} />
                          </div>
                        )}
                      </div>
                    </section>

                    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Transaction / Reference Number</label>
                        <input value={form.paymentReference} onChange={(e) => setField("paymentReference", e.target.value)} placeholder="e.g. SIB7XY12345" style={{ ...inputStyle, borderColor: errors.paymentReference ? "#ef4444" : BORDER }} />
                        {errors.paymentReference && <div style={errorStyle}>{errors.paymentReference}</div>}
                      </div>
                      <div>
                        <label style={labelStyle}>Payment Screenshot Optional</label>
                        <label style={{ ...inputStyle, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", color: form.proofFile ? "#fff" : "rgba(255,255,255,.42)", borderColor: errors.proofFile ? "#ef4444" : BORDER }}>
                          <UploadCloud size={17} color={G} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{form.proofFile?.name || "Upload screenshot"}</span>
                          <input type="file" accept="image/*,.pdf" onChange={(e) => setField("proofFile", e.target.files?.[0] || null)} style={{ display: "none" }} />
                        </label>
                        {errors.proofFile && <div style={errorStyle}>{errors.proofFile}</div>}
                      </div>
                    </section>

                    <div>
                      <label style={labelStyle}>Admin Notes</label>
                      <textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Optional note for the admin team" style={{ ...inputStyle, minHeight: 76, resize: "vertical", paddingTop: 12 }} />
                    </div>

                    {errors.submit && (
                      <div style={{ border: "1px solid rgba(239,68,68,.28)", background: "rgba(239,68,68,.1)", color: "#fca5a5", padding: 12, borderRadius: 12, fontSize: 13 }}>
                        {errors.submit}
                      </div>
                    )}

                    <button
                      onClick={handleSubmit}
                      disabled={saving}
                      style={{
                        height: 54,
                        borderRadius: 14,
                        border: "none",
                        background: `linear-gradient(135deg,${G},${G2})`,
                        color: "#111",
                        fontWeight: 950,
                        fontSize: 15,
                        cursor: saving ? "not-allowed" : "pointer",
                        opacity: saving ? 0.68 : 1,
                        boxShadow: "0 14px 34px rgba(245,166,35,.25)",
                      }}
                    >
                      {saving ? "Submitting..." : "Submit Payment"}
                    </button>
                  </div>
                </div>

                <aside className="digital-checkout-side" style={{ borderLeft: `1px solid ${BORDER}`, padding: "28px 22px", background: "rgba(255,255,255,.022)" }}>
                  <div style={{ position: "sticky", top: 16, display: "grid", gap: 14 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      {(item.thumbnailUrl || item.imageUrl || item.image) ? (
                        <img src={item.thumbnailUrl || item.imageUrl || item.image} alt={title} style={{ width: 62, height: 62, borderRadius: 14, objectFit: "cover", border: `1px solid ${BORDER}` }} />
                      ) : (
                        <div style={{ width: 62, height: 62, borderRadius: 14, display: "grid", placeItems: "center", background: `${G}18`, color: G, fontWeight: 950 }}>STEA</div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 950, fontSize: 16, lineHeight: 1.25 }}>{title}</div>
                        <div style={{ color: "rgba(255,255,255,.45)", fontSize: 12, marginTop: 3 }}>{item.category || "Digital Tool"}</div>
                      </div>
                    </div>

                    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 16, padding: 16, background: "rgba(255,255,255,.03)" }}>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)", fontWeight: 850, marginBottom: 6 }}>Selected Plan</div>
                      <div style={{ fontWeight: 950, fontSize: 18 }}>{selectedPlan?.name}</div>
                      <div style={{ marginTop: 4, color: "rgba(255,255,255,.48)", fontSize: 13 }}>{selectedPlan?.durationDays} days access</div>
                      <div style={{ height: 1, background: "rgba(255,255,255,.08)", margin: "14px 0" }} />
                      <div style={{ fontSize: 30, fontWeight: 950, color: G, letterSpacing: "-.02em" }}>{money(currency, amount)}</div>
                      <div style={{ display: "grid", gap: 7, marginTop: 14 }}>
                        {CURRENCIES.map((cur) => (
                          <div key={cur} style={{ display: "flex", justifyContent: "space-between", color: cur === currency ? "#fff" : "rgba(255,255,255,.52)", fontSize: 13 }}>
                            <span>{cur}</span>
                            <strong>{money(cur, selectedPlan?.prices?.[cur])}</strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 16, padding: 14, display: "grid", gap: 10, color: "rgba(255,255,255,.66)", fontSize: 13 }}>
                      <div style={{ display: "flex", gap: 9, alignItems: "center" }}><ShieldCheck size={16} color="#22c55e" /> Manual review before activation</div>
                      <div style={{ display: "flex", gap: 9, alignItems: "center" }}><Check size={16} color={G} /> Pending record saved securely</div>
                      <div style={{ display: "flex", gap: 9, alignItems: "center" }}><Check size={16} color={G} /> WhatsApp support available</div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          ) : (
            <div style={{ padding: "44px clamp(22px,5vw,52px)", textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
              <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <CheckCircle2 size={76} color="#22c55e" style={{ marginBottom: 16 }} />
              </motion.div>
              <h2 style={{ margin: "0 0 10px", fontSize: "clamp(24px,4vw,34px)", lineHeight: 1.1 }}>Payment Submitted</h2>
              <p style={{ color: "rgba(255,255,255,.62)", lineHeight: 1.7, margin: "0 0 20px" }}>
                Payment submitted. Your subscription will be activated after confirmation.
              </p>
              <div style={{ textAlign: "left", border: `1px solid ${BORDER}`, borderRadius: 16, padding: 16, background: "rgba(255,255,255,.03)", marginBottom: 18, display: "grid", gap: 8, fontSize: 13 }}>
                {[
                  ["Tool", title],
                  ["Plan", selectedPlan?.name || "-"],
                  ["Amount", money(currency, amount)],
                  ["Reference", form.paymentReference],
                  ["Subscription", subscriptionId || "-"],
                ].map(([key, value]) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ color: "rgba(255,255,255,.42)" }}>{key}</span>
                    <strong style={{ color: "#fff", textAlign: "right" }}>{value}</strong>
                  </div>
                ))}
              </div>
              <a
                href={`https://wa.me/${WHATSAPP_PAYMENT_NUMBER}?text=${waText}`}
                target="_blank"
                rel="noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 50, borderRadius: 14, background: "#25d366", color: "#fff", fontWeight: 950, textDecoration: "none", marginBottom: 10 }}
              >
                <MessageCircle size={18} /> Contact Support
              </a>
              <button onClick={onClose} style={{ width: "100%", height: 48, borderRadius: 14, border: `1px solid ${BORDER}`, background: "transparent", color: "rgba(255,255,255,.68)", fontWeight: 850, cursor: "pointer" }}>
                Close
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
