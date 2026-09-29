/**
 * Premium digital tool detail route.
 * Supports legacy digital_tools plus requested digitalTools data shape.
 */
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { collection, getDocs, getFirebaseDb, limit, query, where } from "../firebase.js";
import DigitalCheckoutModal from "../components/DigitalCheckoutModal.jsx";
import { useMobile } from "../hooks/useMobile.js";

const G = "#F5A623";
const G2 = "#FFD17C";
const DARK = "#05060a";
const PANEL = "#0d0f16";
const BORDER = "rgba(255,255,255,.09)";
const CURRENCIES = ["TZS", "USD", "CNY"];

const CHATGPT_DEFAULT = {
  shortDescription:
    "Premium AI assistant access for faster answers, smarter productivity, study help, coding, writing, and business support.",
  fullDescription:
    "ChatGPT Plus helps students, creators, developers, and professionals work faster with advanced AI support. Use it for study assistance, coding help, writing, business planning, research, content creation, and daily productivity.",
  features: [
    "Faster AI responses",
    "Advanced reasoning support",
    "Study and homework assistance",
    "Coding and debugging help",
    "Business and content creation support",
    "Priority productivity workflow",
    "Suitable for students, creators, and professionals",
    "Powered by TRINOVA AI",
  ],
  plans: [
    {
      id: "starter-access",
      name: "Starter Access",
      durationDays: 30,
      description: "Entry access for focused study and productivity.",
      prices: { TZS: 10000, USD: 4, CNY: 29 },
      badge: "Limited Offer",
      isActive: true,
      sortOrder: 1,
    },
    {
      id: "pro-access",
      name: "Pro Access",
      durationDays: 30,
      description: "Balanced plan for students, creators, and business support.",
      prices: { TZS: 20000, USD: 8, CNY: 58 },
      badge: "Popular",
      isPopular: true,
      isActive: true,
      sortOrder: 2,
    },
    {
      id: "premium-access",
      name: "Premium Access",
      durationDays: 90,
      description: "Longer access with the best value for committed users.",
      prices: { TZS: 50000, USD: 20, CNY: 145 },
      badge: "Best Value",
      isActive: true,
      sortOrder: 3,
    },
  ],
};

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(currency, value) {
  const n = toNumber(value);
  if (!n) {
    if (currency === "USD") return "USD -";
    if (currency === "CNY") return "CNY ¥-";
    return "TZS -";
  }
  if (currency === "USD") return `USD $${n.toLocaleString()}`;
  if (currency === "CNY") return `CNY ¥${n.toLocaleString()}`;
  return `TZS ${n.toLocaleString()}`;
}

function splitLines(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value || "")
    .split(/\n|,/)
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter(Boolean);
}

function planPrices(plan, tool) {
  const prices = plan?.prices || {};
  return {
    TZS: toNumber(prices.TZS ?? prices.tzs ?? plan?.priceTZS ?? plan?.price ?? tool?.salePriceTZS ?? tool?.salePrice ?? tool?.newPrice ?? tool?.price),
    USD: toNumber(prices.USD ?? prices.usd ?? plan?.priceUSD ?? tool?.salePriceUSD),
    CNY: toNumber(prices.CNY ?? prices.cny ?? plan?.priceCNY ?? tool?.salePriceCNY),
  };
}

function normalizePlan(plan, index, tool) {
  const durationDays = Number(plan?.durationDays || plan?.days || (plan?.durationMonths ? Number(plan.durationMonths) * 30 : 30)) || 30;
  return {
    id: plan?.id || plan?.planId || `plan_${index}`,
    name: plan?.name || plan?.title || `Plan ${index + 1}`,
    description: plan?.description || "",
    durationDays,
    features: splitLines(plan?.features),
    prices: planPrices(plan, tool),
    badge: plan?.badge || plan?.badgeLabel || (plan?.isPopular ? "Popular" : plan?.isDefault ? "Best Value" : ""),
    isPopular: !!(plan?.isPopular || plan?.isDefault),
    isActive: plan?.isActive !== false && plan?.enabled !== false,
    sortOrder: Number(plan?.sortOrder ?? index),
  };
}

function normalizeTool(raw) {
  if (!raw) return null;
  const isChatGpt = /chatgpt\s*plus/i.test(raw.title || raw.name || "");
  const baseFeatures = splitLines(raw.features || raw.includedFeatures || raw.fullDescription);
  const rawPlans = Array.isArray(raw.plans) ? raw.plans : [];
  const fallbackPlans = isChatGpt && rawPlans.length === 0 ? CHATGPT_DEFAULT.plans : rawPlans;
  const normalizedPlans = fallbackPlans
    .map((plan, index) => normalizePlan(plan, index, raw))
    .filter((plan) => plan.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    ...raw,
    title: raw.title || raw.name || "Digital Tool",
    slug: raw.slug || "",
    category: raw.category || "Digital Tool",
    brandName: raw.brandName || (isChatGpt ? "TRINOVA AI" : raw.provider || "STEA"),
    poweredBy: raw.poweredBy || (isChatGpt ? "TRINOVA AI" : "STEA"),
    shortDescription: raw.shortDescription || raw.description || (isChatGpt ? CHATGPT_DEFAULT.shortDescription : ""),
    fullDescription: raw.fullDescription || (isChatGpt ? CHATGPT_DEFAULT.fullDescription : raw.description || ""),
    thumbnailUrl: raw.thumbnailUrl || raw.imageUrl || raw.image || "",
    galleryImages: Array.isArray(raw.galleryImages) ? raw.galleryImages : [],
    rating: raw.rating || "4.8",
    members: raw.members || raw.membersJoined || raw.joinedCount || "",
    badgeLabel: raw.badgeLabel || raw.badge || "",
    plans: normalizedPlans,
    features: baseFeatures.length ? baseFeatures : isChatGpt ? CHATGPT_DEFAULT.features : [],
    paymentInstructions:
      raw.paymentInstructions ||
      "Tuma TZS {amount} kupitia Lipa Namba 555999 (STEA). Kisha weka namba ya uthibitisho.",
    whatsappSupport: raw.whatsappSupport || "255757053354",
  };
}

function ToolSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: DARK, color: "#fff", padding: "110px 18px 60px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <style>{`@keyframes pulseBlock{0%,100%{opacity:.42}50%{opacity:.75}}`}</style>
        <div style={{ height: 330, borderRadius: 24, background: "rgba(255,255,255,.06)", animation: "pulseBlock 1.3s infinite", marginBottom: 24 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
          {[1, 2, 3].map((item) => (
            <div key={item} style={{ height: 260, borderRadius: 18, background: "rgba(255,255,255,.045)", animation: "pulseBlock 1.3s infinite" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, onChoose }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      style={{
        minHeight: 390,
        display: "flex",
        flexDirection: "column",
        borderRadius: 20,
        border: `1px solid ${plan.isPopular ? "rgba(245,166,35,.5)" : BORDER}`,
        background: plan.isPopular
          ? "linear-gradient(180deg,rgba(245,166,35,.12),rgba(255,255,255,.035))"
          : "linear-gradient(180deg,rgba(255,255,255,.052),rgba(255,255,255,.024))",
        boxShadow: plan.isPopular ? "0 18px 50px rgba(245,166,35,.13)" : "0 18px 46px rgba(0,0,0,.28)",
        padding: 22,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {plan.badge && (
        <div style={{ alignSelf: "flex-start", borderRadius: 999, background: `${G}22`, color: G, padding: "6px 10px", fontSize: 11, fontWeight: 950, marginBottom: 14 }}>
          {plan.badge}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 22, letterSpacing: "-.02em", lineHeight: 1.15 }}>{plan.name}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,.54)", fontSize: 12, fontWeight: 800 }}>
          <Clock size={14} /> {plan.durationDays}d
        </div>
      </div>
      {plan.description && <p style={{ margin: "0 0 18px", color: "rgba(255,255,255,.56)", lineHeight: 1.55, fontSize: 13 }}>{plan.description}</p>}

      <div style={{ display: "grid", gap: 8, marginBottom: 20 }}>
        {CURRENCIES.map((currency) => (
          <div key={currency} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, borderRadius: 12, border: "1px solid rgba(255,255,255,.075)", background: "rgba(255,255,255,.035)", padding: "10px 12px" }}>
            <span style={{ color: "rgba(255,255,255,.5)", fontWeight: 850, fontSize: 12 }}>{currency}</span>
            <strong style={{ color: currency === "TZS" ? G : "#fff", fontSize: currency === "TZS" ? 17 : 15 }}>{money(currency, plan.prices[currency])}</strong>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: 9, flex: 1, marginBottom: 20 }}>
        {(plan.features.length ? plan.features : ["Manual payment confirmation", "Admin activated access", "WhatsApp support"]).slice(0, 6).map((feature) => (
          <div key={feature} style={{ display: "flex", gap: 9, alignItems: "flex-start", color: "rgba(255,255,255,.72)", lineHeight: 1.45, fontSize: 13 }}>
            <Check size={16} color="#22c55e" style={{ marginTop: 1, flexShrink: 0 }} />
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => onChoose(plan)}
        style={{
          width: "100%",
          height: 50,
          borderRadius: 14,
          border: "none",
          background: `linear-gradient(135deg,${G},${G2})`,
          color: "#111",
          fontWeight: 950,
          cursor: "pointer",
          boxShadow: "0 12px 30px rgba(245,166,35,.2)",
        }}
      >
        Choose Plan
      </button>
    </motion.div>
  );
}

export default function DigitalToolDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMobile();
  const [tool, setTool] = useState(normalizeTool(location.state?.tool || null));
  const [loading, setLoading] = useState(!tool);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const db = getFirebaseDb();
    if (!slug || !db) {
      setLoading(false);
      return;
    }
    if (tool?.slug === slug) {
      setLoading(false);
      return;
    }

    const fetchTool = async () => {
      setLoading(true);
      try {
        for (const collectionName of ["digital_tools", "digitalTools"]) {
          const snap = await getDocs(query(collection(db, collectionName), where("slug", "==", slug), limit(1)));
          if (!snap.empty) {
            setTool(normalizeTool({ id: snap.docs[0].id, _collection: collectionName, ...snap.docs[0].data() }));
            setLoading(false);
            return;
          }
        }
        setTool(null);
      } catch (error) {
        console.error("digital tool detail fetch failed:", error);
        setTool(null);
      } finally {
        setLoading(false);
      }
    };
    fetchTool();
  }, [slug]);

  const images = useMemo(() => [tool?.thumbnailUrl, ...(tool?.galleryImages || [])].filter(Boolean), [tool]);
  const featuredPlan = tool?.plans?.find((plan) => plan.isPopular) || tool?.plans?.[0] || null;

  if (loading) return <ToolSkeleton />;

  if (!tool) {
    return (
      <div style={{ minHeight: "100vh", background: DARK, color: "#fff", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
        <div>
          <h2 style={{ margin: "0 0 8px", fontSize: 26 }}>Tool Not Found</h2>
          <p style={{ margin: "0 0 20px", color: "rgba(255,255,255,.54)" }}>This digital tool does not exist or is not available.</p>
          <button onClick={() => navigate("/digital-tools")} style={{ border: "none", borderRadius: 12, background: G, color: "#111", height: 44, padding: "0 18px", fontWeight: 900, cursor: "pointer" }}>
            Browse Digital Tools
          </button>
        </div>
      </div>
    );
  }

  const openCheckout = (plan) => {
    setSelectedPlan(plan);
    setCheckoutOpen(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: DARK, color: "#fff", paddingTop: 86, paddingBottom: 70, fontFamily: "'Instrument Sans',system-ui,sans-serif" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 clamp(16px,5vw,32px)" }}>
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/digital-tools"))}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.045)", color: "rgba(255,255,255,.72)", borderRadius: 12, padding: "9px 13px", fontWeight: 850, cursor: "pointer", marginBottom: 22 }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <section style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1.08fr) minmax(320px,.92fr)", gap: isMobile ? 24 : 38, alignItems: "center", marginBottom: 44 }}>
          <div>
            <div style={{ borderRadius: 24, overflow: "hidden", border: `1px solid ${BORDER}`, background: "#0b0d13", boxShadow: "0 24px 70px rgba(0,0,0,.45)" }}>
              <div style={{ aspectRatio: "16/10", display: "grid", placeItems: "center", background: "rgba(255,255,255,.025)" }}>
                {images[imageIndex] ? (
                  <img src={images[imageIndex]} alt={tool.title} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                ) : (
                  <div style={{ color: G, fontSize: 46, fontWeight: 950 }}>STEA</div>
                )}
              </div>
              {images.length > 1 && (
                <div style={{ display: "flex", gap: 8, padding: 12, overflowX: "auto" }}>
                  {images.map((image, index) => (
                    <button key={image} onClick={() => setImageIndex(index)} style={{ width: 72, height: 46, borderRadius: 10, border: `1px solid ${index === imageIndex ? G : BORDER}`, padding: 0, background: "rgba(255,255,255,.04)", overflow: "hidden", cursor: "pointer", flexShrink: 0 }}>
                      <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
              {tool.badgeLabel && <span style={{ borderRadius: 999, background: `${G}22`, color: G, padding: "6px 10px", fontSize: 11, fontWeight: 950 }}>{tool.badgeLabel}</span>}
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,.68)", fontSize: 12, fontWeight: 850 }}>
                <Sparkles size={14} color={G} /> Powered by {tool.poweredBy || "TRINOVA AI"}
              </span>
            </div>
            <h1 style={{ margin: "0 0 10px", fontSize: "clamp(34px,7vw,64px)", lineHeight: 0.98, letterSpacing: "-.05em", fontWeight: 950 }}>
              {tool.title}
            </h1>
            <div style={{ color: "rgba(255,255,255,.6)", fontWeight: 850, marginBottom: 16 }}>
              {tool.title} <span style={{ color: G }}>·</span> {tool.category}
            </div>
            <p style={{ margin: "0 0 22px", color: "rgba(255,255,255,.68)", fontSize: "clamp(15px,2vw,18px)", lineHeight: 1.65, maxWidth: 640 }}>
              {tool.shortDescription}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
              <span style={{ display: "inline-flex", gap: 7, alignItems: "center", border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.04)", borderRadius: 999, padding: "8px 11px", color: "rgba(255,255,255,.74)", fontSize: 13, fontWeight: 850 }}>
                <Star size={15} color={G} fill={G} /> {tool.rating}
              </span>
              {tool.members && (
                <span style={{ display: "inline-flex", gap: 7, alignItems: "center", border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.04)", borderRadius: 999, padding: "8px 11px", color: "rgba(255,255,255,.74)", fontSize: 13, fontWeight: 850 }}>
                  <Users size={15} /> {tool.members} members
                </span>
              )}
              <span style={{ display: "inline-flex", gap: 7, alignItems: "center", border: "1px solid rgba(34,197,94,.22)", background: "rgba(34,197,94,.08)", borderRadius: 999, padding: "8px 11px", color: "#86efac", fontSize: 13, fontWeight: 850 }}>
                <ShieldCheck size={15} /> Admin confirmed
              </span>
            </div>

            <div style={{ height: 1 }} />
          </div>
        </section>

        <section style={{ marginBottom: 44 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 18, flexWrap: "wrap", marginBottom: 18 }}>
            <div>
              <div style={{ color: G, fontSize: 12, fontWeight: 950, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>Subscription Plans</div>
              <h2 style={{ margin: 0, fontSize: "clamp(26px,4vw,40px)", letterSpacing: "-.04em" }}>Choose the access that fits your work</h2>
            </div>
            <span style={{ color: "rgba(255,255,255,.5)", fontSize: 13 }}>All prices shown in TZS, USD, and CNY ¥.</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: 18 }}>
            {tool.plans.map((plan) => <PlanCard key={plan.id} plan={plan} onChoose={openCheckout} />)}
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1.1fr) minmax(320px,.9fr)", gap: 20, alignItems: "start" }}>
          <div style={{ border: `1px solid ${BORDER}`, background: PANEL, borderRadius: 20, padding: isMobile ? 18 : 24 }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 22 }}>What You Get</h2>
            {tool.fullDescription && <p style={{ margin: "0 0 18px", color: "rgba(255,255,255,.6)", lineHeight: 1.7 }}>{tool.fullDescription}</p>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
              {tool.features.map((feature) => (
                <div key={feature} style={{ display: "flex", gap: 10, alignItems: "flex-start", borderRadius: 12, border: "1px solid rgba(255,255,255,.07)", background: "rgba(255,255,255,.03)", padding: 12, color: "rgba(255,255,255,.76)", lineHeight: 1.45 }}>
                  <Check size={17} color="#22c55e" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ border: `1px solid ${BORDER}`, background: PANEL, borderRadius: 20, padding: isMobile ? 18 : 24 }}>
            <h2 style={{ margin: "0 0 14px", fontSize: 22 }}>Plan Comparison</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {tool.plans.map((plan) => (
                <button key={plan.id} onClick={() => openCheckout(plan)} style={{ border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.03)", color: "#fff", borderRadius: 14, padding: 14, cursor: "pointer", textAlign: "left" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div>
                      <strong>{plan.name}</strong>
                      <div style={{ color: "rgba(255,255,255,.46)", fontSize: 12, marginTop: 3 }}>{plan.durationDays} days</div>
                    </div>
                    <ChevronRight size={18} color={G} />
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
                    {CURRENCIES.map((currency) => (
                      <span key={currency} style={{ borderRadius: 999, background: "rgba(255,255,255,.055)", padding: "5px 8px", fontSize: 12, color: currency === "TZS" ? G : "rgba(255,255,255,.72)", fontWeight: 850 }}>
                        {money(currency, plan.prices[currency])}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      <DigitalCheckoutModal
        isOpen={checkoutOpen}
        item={tool}
        type="tool"
        initialPlan={selectedPlan}
        onClose={() => setCheckoutOpen(false)}
      />
    </div>
  );
}
