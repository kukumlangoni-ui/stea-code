import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Code2,
  Megaphone,
  MessageSquareMore,
  Sparkles,
  ShieldCheck,
  ShoppingBag,
  WandSparkles,
  Laptop,
  Globe,
  Users,
} from "lucide-react";
import { useMobile } from "../hooks/useMobile";
import STEAHeader from "../components/shared/STEAHeader.jsx";
import ServiceRequestForm from "../components/services/ServiceRequestForm";
import { useAuth } from "../hooks/useAuth.js";

const G = "#F5A623";

const SERVICES = [
  {
    title: "Website Design",
    desc: "Modern business, portfolio, school, and landing pages built for mobile first users.",
    icon: Globe,
    color: "#2563EB",
    type: "website",
    action: "Open",
  },
  {
    title: "App/System Development",
    desc: "Custom dashboards, internal tools, automations, and workflow systems for teams.",
    icon: Code2,
    color: "#7C3AED",
    type: "support",
    action: "Open",
  },
  {
    title: "Product Promotion",
    desc: "Boost visibility for products, launches, and offers across the STEA ecosystem.",
    icon: Megaphone,
    color: "#EC4899",
    type: "promotion",
    action: "Request",
  },
  {
    title: "Brand Partnerships",
    desc: "Long-term collaborations, sponsorships, and branded placements with STEA.",
    icon: Users,
    color: "#A855F7",
    type: "partnership",
    action: "Request",
  },
  {
    title: "Advertising",
    desc: "Homepage placements, banners, sponsored stories, and campaign support.",
    icon: ShoppingBag,
    color: "#F97316",
    type: "advertise",
    action: "Request",
  },
  {
    title: "Business Support",
    desc: "Digital guidance for operations, tools, page setup, and service planning.",
    icon: Briefcase,
    color: "#10B981",
    type: "support",
    action: "Request",
  },
  {
    title: "Tech Support",
    desc: "Help with websites, devices, troubleshooting, and technical setup.",
    icon: ShieldCheck,
    color: "#14B8A6",
    type: "support",
    action: "Request",
  },
  {
    title: "Content Support",
    desc: "Writing, visuals, content structure, and creator support for your project.",
    icon: WandSparkles,
    color: "#0EA5E9",
    type: "support",
    action: "Request",
  },
];

const TRUST = [
  { title: "Fast support", desc: "Quick response when you need help.", icon: BadgeCheck },
  { title: "Affordable digital help", desc: "Practical services that fit real budgets.", icon: Sparkles },
  { title: "Built for Africa", desc: "Made for mobile users, local workflows, and growth.", icon: Laptop },
  { title: "Student & creator friendly", desc: "Support designed for students, creators, and small teams.", icon: MessageSquareMore },
];

function ServiceCard({ item, onAction }) {
  const isMobile = useMobile();
  const Icon = item.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="services-card"
      style={{
        height: "100%",
        borderRadius: 20,
        border: "1px solid #E8EAF0",
        background: "#FFFFFF",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: isMobile ? 14 : 18, display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div
            style={{
              width: isMobile ? 42 : 48,
              height: isMobile ? 42 : 48,
              borderRadius: 14,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              background: `${item.color}12`,
              color: item.color,
              border: `1px solid ${item.color}22`,
            }}
          >
            <Icon size={isMobile ? 18 : 20} />
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: isMobile ? 14 : 16, lineHeight: 1.25, fontWeight: 900, color: "#111827" }}>
              {item.title}
            </h3>
            <p style={{ margin: "6px 0 0", fontSize: isMobile ? 12 : 13, lineHeight: 1.55, color: "#5B6472" }}>
              {item.desc}
            </p>
          </div>
        </div>

        <div style={{ marginTop: "auto", paddingTop: 14 }}>
          <button
            type="button"
            onClick={onAction}
            style={{
              width: "100%",
              height: 40,
              borderRadius: 12,
              border: `1px solid ${item.color}24`,
              background: item.action === "Open" ? "#F8FAFC" : `linear-gradient(135deg, ${G}, #FFD17C)`,
              color: item.action === "Open" ? "#111827" : "#111827",
              fontWeight: 900,
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: item.action === "Open" ? "none" : "0 10px 20px rgba(245, 166, 35, 0.16)",
            }}
          >
            {item.action}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function TrustCard({ item }) {
  const Icon = item.icon;
  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid #E8EAF0",
        background: "#fff",
        boxShadow: "0 8px 22px rgba(15,23,42,.04)",
        padding: 16,
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(135deg, rgba(245,166,35,.14), rgba(245,166,35,.08))",
          color: "#9A7700",
          flexShrink: 0,
        }}
      >
        <Icon size={17} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 900, color: "#111827", marginBottom: 4 }}>{item.title}</div>
        <div style={{ fontSize: 12, lineHeight: 1.5, color: "#5B6472" }}>{item.desc}</div>
      </div>
    </div>
  );
}

export default function HudumaPage() {
  const { user } = useAuth();
  const isMobile = useMobile();
  const [activeService, setActiveService] = useState(null);

  const openRequest = (type) => setActiveService(type);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", color: "#111827", fontFamily: "'Instrument Sans',system-ui,sans-serif" }}>
      <STEAHeader title="Services" user={user} />

      <main style={{ width: "min(1200px, 100%)", margin: "0 auto", padding: isMobile ? "16px 14px 52px" : "26px 20px 64px" }}>
        <section
          style={{
            borderRadius: 28,
            border: "1px solid #E8EAF0",
            background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
            boxShadow: "0 18px 50px rgba(15,23,42,.06)",
            padding: isMobile ? "20px 16px" : "30px 28px",
            marginBottom: 18,
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 999, border: "1px solid rgba(245,166,35,.24)", background: "rgba(245,166,35,.08)", color: "#9A7700", fontSize: 10, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" }}>
            <Sparkles size={12} />
            Services Hub
          </div>

          <div style={{ marginTop: 16, display: "grid", gap: 14, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.2fr) minmax(260px, .8fr)" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: isMobile ? "clamp(30px, 8vw, 42px)" : "clamp(42px, 5vw, 58px)", lineHeight: 1.02, letterSpacing: "-.05em", color: "#101828" }}>
                Digital services for your growth.
              </h1>
              <p style={{ margin: "12px 0 0", maxWidth: 640, color: "#4B5563", fontSize: isMobile ? 14 : 16, lineHeight: 1.65 }}>
                Get websites, branding, marketing, promotion and digital support from STEA.
              </p>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                <button
                  type="button"
                  onClick={() => openRequest("support")}
                  style={{
                    height: 44,
                    padding: "0 16px",
                    border: 0,
                    borderRadius: 14,
                    background: `linear-gradient(135deg, ${G}, #FFD17C)`,
                    color: "#111827",
                    fontWeight: 900,
                    cursor: "pointer",
                    boxShadow: "0 14px 24px rgba(245, 166, 35, 0.18)",
                  }}
                >
                  Request Service
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById("services-grid")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  style={{
                    height: 44,
                    padding: "0 16px",
                    borderRadius: 14,
                    border: "1px solid #E2E8F0",
                    background: "#fff",
                    color: "#111827",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Explore Services
                </button>
              </div>
            </div>

            <div
              style={{
                borderRadius: 22,
                border: "1px solid #E8EAF0",
                background: "linear-gradient(135deg, rgba(245,166,35,.08), rgba(255,255,255,.92))",
                padding: 18,
                display: "grid",
                gap: 10,
                alignContent: "start",
              }}
            >
              {[
                ["Websites", "Clean, mobile-first online presence."],
                ["Marketing", "Promotion that reaches real people."],
                ["Support", "Practical help for digital problems."],
              ].map(([label, desc]) => (
                <div key={label} style={{ display: "flex", gap: 10, alignItems: "center", borderRadius: 14, background: "#fff", border: "1px solid #EEF1F5", padding: "10px 12px" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(245,166,35,.12)", display: "grid", placeItems: "center", color: "#9A7700", flexShrink: 0 }}>
                    <BadgeCheck size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "#111827" }}>{label}</div>
                    <div style={{ fontSize: 11.5, color: "#667085", marginTop: 2 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="services-grid" style={{ marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase", color: "#9A7700" }}>Services</div>
              <h2 style={{ margin: "6px 0 0", fontSize: isMobile ? 20 : 24, color: "#111827", letterSpacing: "-.03em" }}>Choose the support you need.</h2>
            </div>
            <div style={{ fontSize: 13, color: "#6B7280" }}>White premium cards. Quick actions. Mobile friendly.</div>
          </div>

          <div className="services-grid" style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
            {SERVICES.map((item) => (
              <ServiceCard key={item.title} item={item} onAction={() => openRequest(item.type)} />
            ))}
          </div>
        </section>

        <section style={{ marginTop: 22 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase", color: "#9A7700" }}>
              Why choose STEA Services?
            </div>
            <h2 style={{ margin: "6px 0 0", fontSize: isMobile ? 20 : 24, color: "#111827", letterSpacing: "-.03em" }}>
              Built to feel fast, practical, and premium.
            </h2>
          </div>

          <div className="trust-grid" style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
            {TRUST.map((item) => (
              <TrustCard key={item.title} item={item} />
            ))}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {activeService && <ServiceRequestForm isOpen={!!activeService} onClose={() => setActiveService(null)} serviceType={activeService} />}
      </AnimatePresence>

      <style>{`
        @media (max-width: 1024px) {
          .services-grid, .trust-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 360px) {
          .services-grid, .trust-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
