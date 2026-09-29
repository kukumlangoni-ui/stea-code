/**
 * TipsResourceDetailPage — /r/:slug
 * Shows full detail of a single Tips Resource
 */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Share2, ExternalLink, CheckCircle } from "lucide-react";
import { getFirebaseDb, collection, query, where, onSnapshot } from "../firebase.js";
import { useMobile } from "../hooks/useMobile.js";

const G = "#F5A623";

export default function TipsResourceDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isMobile = useMobile();

  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) { setLoading(false); return; }
    // Query by slug + published
    const q = query(
      collection(db, "tips_resources"),
      where("slug", "==", slug),
      where("status", "==", "published")
    );
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setResource({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        setResource(null);
      }
      setLoading(false);
    }, (err) => { console.error(err); setLoading(false); });
    return () => unsub();
  }, [slug]);

  const handleShare = async () => {
    const url = window.location.href;
    const title = resource?.title || "STEA Tips Resource";
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0b0f", display: "grid", placeItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, border: `3px solid rgba(245,166,35,0.2)`, borderTopColor: G, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <p style={{ color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>Inapakia...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────
  if (!resource) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0b0f", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 60, marginBottom: 20 }}>📋</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Resource Haijapatikana</h2>
        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 28 }}>Resource unayotafuta haipo au bado haijachapishwa.</p>
        <button onClick={() => navigate("/tech/tips-resources")} style={{ padding: "12px 28px", borderRadius: 12, background: G, color: "#000", fontWeight: 900, border: "none", cursor: "pointer", fontSize: 14 }}>
          Rudi Tips Resources
        </button>
      </div>
    );
  }

  const steps = resource.steps || [];
  const links = resource.links || [];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0f", color: "#fff", paddingBottom: 80 }}>
      {/* Sticky nav */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(10,11,15,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(10px)" }}>
        <button
          onClick={() => navigate("/tech/tips-resources")}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "rgba(255,255,255,.65)", cursor: "pointer", fontWeight: 700, fontSize: 14 }}
        >
          <ArrowLeft size={16} /> Tips Resources
        </button>
        <button
          onClick={handleShare}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, padding: "8px 14px", color: copied ? G : "rgba(255,255,255,.65)", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
        >
          {copied ? <CheckCircle size={14} /> : <Share2 size={14} />}
          {copied ? "Copied!" : "Share"}
        </button>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: isMobile ? "24px 16px" : "40px 20px" }}>

        {/* Category + Featured */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {resource.category && (
            <span style={{ background: "rgba(245,166,35,0.1)", color: G, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800, textTransform: "uppercase", border: "1px solid rgba(245,166,35,0.2)" }}>
              {resource.category}
            </span>
          )}
          {resource.featured && (
            <span style={{ background: "rgba(59,130,246,0.1)", color: "#93c5fd", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800, textTransform: "uppercase", border: "1px solid rgba(59,130,246,0.2)" }}>
              ⭐ Featured
            </span>
          )}
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: isMobile ? "clamp(22px,5vw,32px)" : "clamp(24px,3vw,36px)", fontWeight: 900, lineHeight: 1.25, marginBottom: 16 }}>
          {resource.title}
        </h1>

        {/* Short description */}
        {resource.shortDescription && (
          <p style={{ fontSize: "clamp(15px,2vw,17px)", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 28 }}>
            {resource.shortDescription}
          </p>
        )}

        {/* Cover thumbnail */}
        {resource.thumbnailUrl && (
          <div style={{ width: "100%", borderRadius: 20, overflow: "hidden", marginBottom: 32 }}>
            <img
              src={resource.thumbnailUrl}
              alt={resource.title}
              style={{ width: "100%", display: "block", objectFit: "cover", maxHeight: 420 }}
              onError={e => { e.target.parentElement.style.display = "none"; }}
            />
          </div>
        )}

        {/* PDF Download */}
        {resource.pdfUrl && (
          <a
            href={resource.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 16, textDecoration: "none", marginBottom: 32 }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: G, display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Download size={20} color="#000" />
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>Pakua PDF</div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 }}>Bonyeza kupakua mwongozo kamili</div>
            </div>
            <ExternalLink size={16} color="rgba(255,255,255,0.3)" style={{ marginLeft: "auto" }} />
          </a>
        )}

        {/* Steps */}
        {steps.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 22, fontWeight: 900, marginBottom: 20 }}>
              📋 Hatua kwa Hatua
            </h2>
            <div style={{ display: "grid", gap: 16 }}>
              {steps.map((step, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 18,
                    padding: isMobile ? "16px" : "20px 24px",
                    display: "flex",
                    gap: 16,
                  }}
                >
                  {/* Step number */}
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${G}18`, border: `1px solid ${G}30`, color: G, fontWeight: 900, fontSize: 16, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    {step.title && (
                      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: step.body ? 8 : 0, color: "#fff" }}>
                        {step.title}
                      </div>
                    )}
                    {step.body && (
                      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-line" }}>
                        {step.body}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Useful links */}
        {links.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 22, fontWeight: 900, marginBottom: 16 }}>
              🔗 Viungo vya Ziada
            </h2>
            <div style={{ display: "grid", gap: 10 }}>
              {links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, textDecoration: "none" }}
                >
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{link.label || link.url}</span>
                  <ExternalLink size={14} color="rgba(255,255,255,0.35)" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Share again at bottom */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={handleShare}
            style={{ flex: 1, minWidth: 140, height: 50, borderRadius: 14, background: "rgba(255,255,255,0.05)", color: "#fff", fontWeight: 800, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14 }}
          >
            <Share2 size={16} /> Shiriki
          </button>
          <button
            onClick={() => navigate("/tech/tips-resources")}
            style={{ flex: 1, minWidth: 140, height: 50, borderRadius: 14, background: G, color: "#000", fontWeight: 900, border: "none", cursor: "pointer", fontSize: 14 }}
          >
            Rasilimali Zaidi →
          </button>
        </div>
      </div>
    </div>
  );
}
