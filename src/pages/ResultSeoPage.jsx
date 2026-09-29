import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bell, Bookmark, Check, Copy, Share2, TrendingUp } from "lucide-react";
import SEOHead from "../components/SEOHead.jsx";
import AdSlot from "../components/AdSlot.jsx";

const G = "#F5A623";
const SITE = "https://stea.africa";

function titleCase(value = "") {
  return String(value)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function shareUrl(path) {
  return `${SITE}${path || window.location.pathname}`;
}

function ActionButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 44,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,.1)",
        background: "rgba(255,255,255,.045)",
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "0 14px",
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export default function ResultSeoPage({ type = "school" }) {
  const navigate = useNavigate();
  const params = useParams();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const year = params.year || "2024";
  const school = titleCase(params.school || "school results");
  const region = titleCase(params.region || "Tanzania");

  const page = useMemo(() => {
    if (type === "region") {
      return {
        path: `/results/region/${params.region}`,
        title: `${region} NECTA Results, Schools and Trends | STEA`,
        heading: `${region} Results Hub`,
        desc: `Explore NECTA result searches, related schools, and student updates for ${region}.`,
        cta: "Search schools in this region",
      };
    }
    if (type === "top") {
      return {
        path: "/results/top-schools",
        title: "Top NECTA Schools in Tanzania | STEA Results",
        heading: "Top Schools",
        desc: "Discover trending NECTA school searches, high-interest result pages, and related student resources.",
        cta: "Check top school results",
      };
    }
    if (type === "statistics") {
      return {
        path: "/results/statistics",
        title: "NECTA Results Statistics and Trends | STEA",
        heading: "Results Statistics",
        desc: "Track result trends, popular searches, and student discovery paths across STEA.",
        cta: "Explore result trends",
      };
    }
    return {
      path: `/results/${year}/${params.school}`,
      title: `${school} ${year} NECTA Results | STEA`,
      heading: `${school} ${year} Results`,
      desc: `View ${school} ${year} NECTA result links, related schools, share tools, and student learning resources on STEA.`,
      cta: "Open result checker",
    };
  }, [type, params.school, params.region, year, school, region]);

  const canonicalUrl = shareUrl(page.path);
  const related = ["Azania Secondary", "Ilboru Secondary", "Mzumbe Secondary", "Tabora Boys", "Kibasila Secondary"];
  const trending = ["CSEE 2024", "ACSEE 2024", "FTNA 2024", "PSLE 2024", "Top schools"];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(canonicalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const saveResult = () => {
    try {
      const current = JSON.parse(localStorage.getItem("stea_saved_results") || "[]");
      localStorage.setItem("stea_saved_results", JSON.stringify([{ title: page.heading, url: canonicalUrl }, ...current].slice(0, 20)));
      setSaved(true);
    } catch {
      setSaved(true);
    }
  };

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${page.heading} - ${canonicalUrl}`)}`;

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#fff", padding: "96px 18px 70px" }}>
      <SEOHead
        title={page.title}
        description={page.desc}
        canonicalUrl={canonicalUrl}
        keywords={["NECTA results", page.heading, "Tanzania schools", "STEA results"]}
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": page.heading,
            "url": canonicalUrl,
            "description": page.desc,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE },
              { "@type": "ListItem", "position": 2, "name": "Results", "item": `${SITE}/exams/results` },
              { "@type": "ListItem", "position": 3, "name": page.heading, "item": canonicalUrl },
            ],
          },
        ]}
      />
      <main style={{ maxWidth: 1080, margin: "0 auto" }}>
        <button onClick={() => navigate(-1)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,.6)", display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 22, cursor: "pointer" }}>
          <ArrowLeft size={16} /> Back
        </button>

        <section style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", alignItems: "center" }}>
          <div>
            <div className="stea-label" style={{ background:`${G}14`, border:`1px solid ${G}28`, color:G }}>
              <TrendingUp size={11}/> STEA Results
            </div>
            <h1 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(32px,7vw,62px)", lineHeight: 1.03, letterSpacing: "-.04em", margin: "0 0 16px" }}>
              {page.heading}
            </h1>
            <p style={{ color: "rgba(255,255,255,.62)", lineHeight: 1.7, fontSize: 16, maxWidth: 620 }}>{page.desc}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
              <ActionButton onClick={() => navigate("/exams/results")}>{page.cta}</ActionButton>
              <ActionButton onClick={saveResult}>{saved ? <Check size={16}/> : <Bookmark size={16}/>} {saved ? "Saved" : "Save"}</ActionButton>
              <ActionButton onClick={copyLink}>{copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? "Copied" : "Copy link"}</ActionButton>
              <ActionButton onClick={() => window.open(whatsapp, "_blank", "noopener,noreferrer")}><Share2 size={16}/> WhatsApp</ActionButton>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 22, padding: 20 }}>
            <AdSlot id={`results-${type}-top`} type="in-feed" label="Result sponsor" style={{ margin: 0 }} />
          </div>
        </section>

        <section style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", marginTop: 28 }}>
          <div className="stea-panel">
            <h2 className="stea-shead__title">Related schools</h2>
            <div className="stea-trending-list" style={{ marginTop: 14 }}>
              {related.map((item) => (
                <button key={item} className="stea-trending-row stea-btn" onClick={() => navigate(`/results/${year}/${item.toLowerCase().replace(/\s+/g, "-")}`)}>
                  <div><strong>{item}</strong><span>View result page</span></div>
                </button>
              ))}
            </div>
          </div>
          <div className="stea-panel">
            <h2 className="stea-shead__title">Trending searches</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
              {trending.map((item) => (
                <button key={item} onClick={() => navigate("/exams/results")} className="stea-cat-btn stea-btn">{item}</button>
              ))}
            </div>
            <div style={{ marginTop: 22, padding: 16, borderRadius: 16, border: "1px solid rgba(245,166,35,.16)", background: "rgba(245,166,35,.07)" }}>
              <Bell size={16} color={G} />
              <h3 style={{ margin: "8px 0 6px", fontSize: 16 }}>Get updates</h3>
              <p style={{ margin: 0, color: "rgba(255,255,255,.55)", fontSize: 13, lineHeight: 1.6 }}>Save this page and check STEA for result updates, student guides and opportunities.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

