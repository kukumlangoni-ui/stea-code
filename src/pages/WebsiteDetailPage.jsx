import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Copy, Download, ExternalLink, Flag, Heart, MessageSquare, Share2, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { addDoc, arrayUnion, collection, doc, getDocs, getFirebaseDb, increment, limit, query, serverTimestamp, updateDoc, where } from "../firebase.js";
import SEOHead from "../components/SEOHead.jsx";
import WebsitesHeader from "../components/WebsitesHeader.jsx";
import { getWebsiteCategoryLabel, normalizeCategory, isPublishedWebsite } from "../data/websiteCategories.js";
import { useSitesLanguage } from "../i18n/index.js";
import { useWebsitesData } from "../context/WebsitesDataContext.jsx";
import { getThumbnailImageStyle } from "../utils/thumbnailDisplay.js";
import STEADataFallback from "../components/shared/STEADataFallback.jsx";

const G = "#F5A623";
const WEBSITES_OG_IMAGE = "https://sites.stea.africa/seo/stea-websites-og-v2.png";
const slugify = value => normalizeCategory(value);
const button = { minHeight:48, borderRadius:13, padding:"10px 14px", fontWeight:800, cursor:"pointer", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:7, fontFamily:"inherit" };

function getSiteTitle(site) {
  return site?.name || site?.title || "Untitled Website";
}

function toStoredWebsite(site) {
  if (!site?.id) return null;
  return {
    websiteId: site.id,
    title: getSiteTitle(site),
    image: site.thumbnailUrl || site.bannerUrl || site.imageUrl || site.image || site.coverUrl || site.logoUrl || "",
    url: site.url || site.link || site.websiteUrl || "",
    category: site.category || "",
    savedAt: Date.now(),
  };
}

function readStoredList(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeStoredList(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {}
}

function formatTrustDate(value) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : "";
}

function toggleGuestFavorite(site) {
  const stored = toStoredWebsite(site);
  if (!stored) return { isAdding: false };
  const existing = readStoredList("stea_guest_favorites");
  const isAdding = !existing.some((item) => item.websiteId === stored.websiteId);
  const next = isAdding
    ? [stored, ...existing].slice(0, 100)
    : existing.filter((item) => item.websiteId !== stored.websiteId);
  writeStoredList("stea_guest_favorites", next);
  return { isAdding };
}

function rememberWebsite(site) {
  const stored = toStoredWebsite(site);
  if (!stored) return;
  const next = [stored, ...readStoredList("stea_recent_websites").filter((item) => item.websiteId !== stored.websiteId)].slice(0, 12);
  writeStoredList("stea_recent_websites", next);
}

function DetailImage({ site, title }) {
  const [failed, setFailed] = useState(false);
  const image = site.thumbnailUrl || site.bannerUrl || site.imageUrl || site.image || site.coverUrl;
  const thumbnailStyle = getThumbnailImageStyle(site);
  let favicon = site.faviconUrl || "";
  if (!favicon) { try { favicon = `https://www.google.com/s2/favicons?domain=${new URL(site.url || site.link).hostname}&sz=128`; } catch {} }
  if (image && !failed) return (
    <div style={{ width:"100%", height:"100%", overflow:"hidden", background: thumbnailStyle.wrapper.background }}>
      <img src={image} alt={title} loading="eager" decoding="async" onError={() => setFailed(true)} style={{ width:"100%", height:"100%", objectFit: thumbnailStyle.image.objectFit, objectPosition: thumbnailStyle.image.objectPosition, transform: thumbnailStyle.image.transform, transformOrigin: thumbnailStyle.image.transformOrigin, display:"block" }} />
    </div>
  );
  return <div style={{ width:"100%", height:"100%", display:"grid", placeItems:"center", background: thumbnailStyle.wrapper.background || "linear-gradient(135deg,#FFF8E1,#EEF2FF)" }}>
    <div style={{ textAlign:"center", color:"#8F6D00", fontWeight:900 }}>
      {favicon ? <img src={favicon} alt="" onError={e => e.currentTarget.style.display="none"} style={{ width:64, height:64, objectFit:"contain", borderRadius:16, background:"#fff", padding:8, display:"block", margin:"0 auto 10px" }} /> : <div style={{ width:64, height:64, borderRadius:16, background:G, color:"#fff", display:"grid", placeItems:"center", margin:"0 auto 10px", fontSize:26 }}>{title.charAt(0)}</div>}
      {title}
    </div>
  </div>;
}

function matchesWebsiteSlug(site, slug) {
  return Boolean(site) && (
    site.id === slug ||
    site.slug === slug ||
    slugify(site.name || site.title) === slug
  );
}

function DetailLoadingState({ slug, header }) {
  return (
    <div style={{ minHeight:"100vh", background:"#F8FAFC" }}>
      <SEOHead title="Loading Website — STEA Websites" description="Loading website details from STEA Websites." canonical={`https://sites.stea.africa/site/${slug}`} ogUrl={`https://sites.stea.africa/site/${slug}`} ogImage={WEBSITES_OG_IMAGE} siteName="STEA Websites" />
      {header}
      <main style={{ maxWidth:920, margin:"0 auto", padding:"22px clamp(16px,4vw,36px) 72px" }}>
        <style>{`@keyframes detailPulse{0%,100%{opacity:.62}50%{opacity:1}}`}</style>
        <article style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, overflow:"hidden" }}>
          <div style={{ width:"100%", aspectRatio:"16/9", maxHeight:360, background:"#E2E8F0", animation:"detailPulse 1.4s ease-in-out infinite" }} />
          <div style={{ padding:"clamp(20px,4vw,32px)" }}>
            <p style={{ margin:"0 0 18px", color:"#64748B", fontWeight:800 }}>Loading website details...</p>
            <div style={{ width:"68%", height:30, borderRadius:8, background:"#E2E8F0", marginBottom:18, animation:"detailPulse 1.4s ease-in-out infinite" }} />
            <div style={{ width:"42%", height:14, borderRadius:999, background:"#E2E8F0", marginBottom:18, animation:"detailPulse 1.4s ease-in-out infinite" }} />
            <div style={{ display:"grid", gap:10 }}>
              <div style={{ height:54, borderRadius:13, background:"#E2E8F0", animation:"detailPulse 1.4s ease-in-out infinite" }} />
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:10 }}>
                <div style={{ height:48, borderRadius:13, background:"#EEF2F7", animation:"detailPulse 1.4s ease-in-out infinite" }} />
                <div style={{ height:48, borderRadius:13, background:"#EEF2F7", animation:"detailPulse 1.4s ease-in-out infinite" }} />
              </div>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}

export default function WebsiteDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useSitesLanguage();
  const { user } = useAuth();
  const { websites, loading, initialLoadDone, error, cacheWebsite, triggerFetch } = useWebsitesData();
  useEffect(() => {
    if (triggerFetch) triggerFetch();
  }, [triggerFetch]);
  const [message, setMessage] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadGuideTab, setDownloadGuideTab] = useState("android");
  const [experienceOpen, setExperienceOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedbackType, setFeedbackType] = useState("helpful");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [headerSearch, setHeaderSearch] = useState("");
  const [fetchedSite, setFetchedSite] = useState(null);
  const [singleFetchDone, setSingleFetchDone] = useState(false);
  const routeWebsite = location.state?.website && isPublishedWebsite(location.state.website) ? location.state.website : null;
  const cachedSite = useMemo(() => (websites || []).find(item => isPublishedWebsite(item) && matchesWebsiteSlug(item, slug)), [websites, slug]);
  const routeSiteMatches = routeWebsite && matchesWebsiteSlug(routeWebsite, slug);
  const initialSite = routeSiteMatches ? routeWebsite : cachedSite;
  const site = fetchedSite || initialSite;
  const title = site?.name || site?.title || "";
  const detailUrl = typeof window === "undefined" ? "" : window.location.href;
  const tell = text => { setMessage(text); setTimeout(() => setMessage(""), 3200); };
  const header = (
    <WebsitesHeader
      user={user}
      searchValue={headerSearch}
      onSearchChange={setHeaderSearch}
      onClearSearch={() => setHeaderSearch("")}
      onSearchSubmit={(query) => {
        if (query) navigate(`/websites?q=${encodeURIComponent(query)}`);
      }}
      onFavorites={() => navigate("/favorites")}
      onNotify={() => tell(t("notificationsComingSoon", "Notifications coming soon"))}
      searchPlaceholder={t("searchPlaceholder", "Search websites...")}
    />
  );

  useEffect(() => {
    if (site?.id) rememberWebsite(site);
  }, [site?.id]);

  useEffect(() => {
    if (routeSiteMatches && routeWebsite?.id) cacheWebsite(routeWebsite);
  }, [routeSiteMatches, routeWebsite, cacheWebsite]);

  useEffect(() => {
    setFetchedSite(null);
    setSingleFetchDone(false);
  }, [slug]);

  useEffect(() => {
    if (singleFetchDone) return undefined;
    let isMounted = true;
    const db = getFirebaseDb();
    if (!db) {
      setSingleFetchDone(true);
      return undefined;
    }

    (async () => {
      try {
        let found = null;
        const slugSnap = await getDocs(query(collection(db, "websites"), where("slug", "==", slug), limit(1)));
        found = slugSnap.docs.map((item) => ({ id: item.id, ...item.data() })).find(isPublishedWebsite) || null;
        if (!found) {
          const idSnap = await getDocs(query(collection(db, "websites"), limit(800)));
          found = idSnap.docs
            .map((item) => ({ id: item.id, ...item.data() }))
            .find((item) => isPublishedWebsite(item) && matchesWebsiteSlug(item, slug)) || null;
        }
        if (!isMounted) return;
        if (found) {
          setFetchedSite(found);
          cacheWebsite(found);
        }
      } catch (fetchError) {
        console.warn("Website detail fallback fetch failed:", fetchError?.message || fetchError);
      } finally {
        if (isMounted) setSingleFetchDone(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [singleFetchDone, slug, cacheWebsite]);

  const openSite = () => {
    if (!site?.url) return;
    rememberWebsite(site);
    window.open(site.url, "_blank", "noopener,noreferrer");
    const db = getFirebaseDb();
    if (db) updateDoc(doc(db, "websites", site.id), { clicks: increment(1), views: increment(1), lastClickedAt: serverTimestamp() }).catch(() => {});
  };
  const saveFavorite = async () => {
    if (!user) {
      const { isAdding } = toggleGuestFavorite(site);
      tell(isAdding ? t("savedOnDevice", "Saved on this device") : t("removedFromFavorites", "Removed from favorites"));
      return;
    }
    const db = getFirebaseDb();
    if (!db) {
      const { isAdding } = toggleGuestFavorite(site);
      tell(isAdding ? t("savedOnDevice", "Saved on this device") : t("removedFromFavorites", "Removed from favorites"));
      return;
    }
    try { await updateDoc(doc(db, "users", user.uid), { favoriteWebsites: arrayUnion(site.id), updatedAt: serverTimestamp() }); tell(t("savedOnDevice", "Saved on this device")); }
    catch {
      const { isAdding } = toggleGuestFavorite(site);
      tell(isAdding ? t("savedOnDevice", "Saved on this device") : t("removedFromFavorites", "Removed from favorites"));
    }
  };
  const copyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(detailUrl);
      else {
        const field = document.createElement("textarea");
        field.value = detailUrl; field.style.position = "fixed"; field.style.opacity = "0";
        document.body.appendChild(field); field.select();
        if (!document.execCommand("copy")) throw new Error("Copy failed");
        field.remove();
      }
      setCopied(true); tell(t("websiteLinkCopied", "Website link copied.")); setTimeout(() => setCopied(false), 1500);
    } catch { tell("Could not copy. Try again."); }
  };
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title, text: site.description || "", url: detailUrl }); return; } catch {} }
    copyLink();
  };
  const reportBroken = async () => {
    if (sessionStorage.getItem(`stea_reported_${site.id}`)) return tell("You already reported this link in this session.");
    try { await addDoc(collection(getFirebaseDb(), "websiteReports"), { websiteId:site.id, websiteTitle:title, websiteUrl:site.url || "", reason:"broken_link", status:"pending", createdAt:serverTimestamp(), userId:user?.uid || null }); sessionStorage.setItem(`stea_reported_${site.id}`, "1"); tell("Thanks. STEA will review this link."); }
    catch { tell("Could not submit the report. Please try again."); }
  };
  const sendFeedback = async () => {
    try { await addDoc(collection(getFirebaseDb(), "websiteFeedback"), { websiteId:site.id, websiteTitle:title, websiteUrl:site.url || "", feedbackType, message:feedbackMessage.trim(), createdAt:serverTimestamp(), userId:user?.uid || null, status:"pending" }); setFeedbackOpen(false); setFeedbackMessage(""); tell(t("thanksFeedback", "Thanks for your feedback.")); }
    catch { tell("Could not send feedback. Please try again."); }
  };

  if (!site && (!initialLoadDone || loading || !singleFetchDone)) return <DetailLoadingState slug={slug} header={header} />;
  if (!site) {
    const isOffline = !navigator.onLine;
    const isError = error || isOffline;
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
        <SEOHead
          title={isError ? "Connection Issue — STEA Websites" : "Website Not Found — STEA Websites"}
          description="STEA Websites detail page."
          canonical={`https://sites.stea.africa/site/${slug}`}
          ogUrl={`https://sites.stea.africa/site/${slug}`}
          ogImage={WEBSITES_OG_IMAGE}
          robots="noindex,nofollow"
          siteName="STEA Websites"
        />
        {header}
        <main style={{ maxWidth: 700, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
          {isError ? (
            <STEADataFallback onRetry={() => {
              try {
                window.dispatchEvent(new Event("stea-data-sync"));
              } catch (e) {}
              setSingleFetchDone(false);
            }} />
          ) : (
            <>
              <AlertTriangle size={42} color="#94A3B8" style={{ margin: "0 auto 16px" }} />
              <h1>Website not found</h1>
              <p>This website may have been removed or is not available right now.</p>
              <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
                <button onClick={() => navigate("/websites")} style={{ ...button, border: 0, background: G, color: "#111" }}>Back to Websites</button>
                <button onClick={() => navigate("/websites")} style={{ ...button, border: "1px solid #CBD5E1", background: "#fff", color: "#334155" }}>Browse Categories</button>
              </div>
            </>
          )}
        </main>
      </div>
    );
  }

  const description = String(site.description || site.summary || "").trim();
  const categoryLabel = getWebsiteCategoryLabel(site.category) || "useful";
  const seoDescription = description || `Discover ${categoryLabel} resources on ${title}, curated by STEA.`;
  const canonicalUrl = `https://sites.stea.africa/site/${slug}`;
  const seoImage = site.imageUrl || site.image || site.thumbnailUrl || WEBSITES_OG_IMAGE;
  const domain = (() => { try { return new URL(site.url || site.link).hostname.replace(/^www\./, ""); } catch { return site.url || ""; } })();
  return <div style={{ minHeight:"100vh", background:"#F8FAFC", color:"#111827" }}>
    <style>{`.action-button{transition:transform .15s ease,box-shadow .15s ease,background .15s ease}.action-button:active{transform:scale(.98)}.success-pulse{animation:successPulse .45s ease}@keyframes successPulse{0%{transform:scale(1)}50%{transform:scale(1.03)}100%{transform:scale(1)}}@media(max-width:340px){.detail-action-pair{grid-template-columns:1fr!important}}`}</style>
    <SEOHead
      title={`${title} — STEA Websites`}
      description={seoDescription}
      canonical={canonicalUrl}
      ogUrl={canonicalUrl}
      ogImage={seoImage}
      siteName="STEA Websites"
      structuredData={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": title,
        "description": seoDescription,
        "url": canonicalUrl,
        "isPartOf": {
          "@type": "WebSite",
          "name": "STEA Websites",
          "url": "https://sites.stea.africa/websites"
        }
      }}
    />
    {header}
    <main style={{ maxWidth:920, margin:"0 auto", padding:"22px clamp(16px,4vw,36px) 72px" }}>
      <button onClick={() => navigate(-1)} style={{ border:0, background:"none", display:"inline-flex", gap:7, alignItems:"center", fontWeight:800, color:"#475569", cursor:"pointer", marginBottom:16 }}><ArrowLeft size={17}/> Back</button>
      <article style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, overflow:"hidden" }}>
        <div style={{ width:"100%", aspectRatio:"16/9", maxHeight:420, background:"#F1F5F9" }}><DetailImage site={site} title={title}/></div>
        <div style={{ padding:"clamp(20px,4vw,32px)" }}>
          <h1 style={{ fontSize:"clamp(28px,6vw,42px)", margin:"0 0 20px", letterSpacing:"-.04em" }}>{title}</h1>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:16, color:"#64748B", fontSize:13, fontWeight:700 }}>
            {domain ? <span>{domain}</span> : null}
            <span>{t("curatedByStea", "Curated by STEA")}</span>
          </div>

          {/* Trust & Info metadata section */}
          {(site.lastCheckedAt || site.requiresVpn || site.vpnRecommended || site.adBlockRecommended || site.worksOnMobile) && (
            <div style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 14,
              padding: 16,
              marginBottom: 20,
              fontSize: 13,
              color: "#475569",
              display: "grid",
              gap: 10
            }}>
              {site.lastCheckedAt && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🛡️</span>
                  <span>
                    Last checked by STEA: <strong>{formatTrustDate(site.lastCheckedAt)}</strong>
                  </span>
                </div>
              )}
              {site.worksOnMobile && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>📱</span>
                  <span>Works on mobile</span>
                </div>
              )}
              {site.adBlockRecommended && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🛡️</span>
                  <span>AdBlock recommended: <strong>Yes</strong></span>
                </div>
              )}
              {(site.requiresVpn || site.vpnRecommended) && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🌐</span>
                  <span>May require VPN: <strong>Yes</strong></span>
                </div>
              )}
            </div>
          )}

          <div style={{ display:"grid", gap:10 }}>
            <button className="action-button" onClick={openSite} style={{ ...button, width:"100%", border:0, background:G, color:"#111", minHeight:54 }}>{t("openWebsite", "Open Website")} <ExternalLink size={16}/></button>
            <div className="detail-action-pair" style={{ display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:10 }}>
              <button className="action-button" onClick={saveFavorite} style={{ ...button, border:"1px solid #CBD5E1", background:"#fff", color:"#334155" }}><Heart size={16}/> {t("saveToFavorites", "Save to Favorites")}</button>
              <button className="action-button" onClick={() => { setDownloadGuideTab("android"); setDownloadOpen(true); }} style={{ ...button, border:"1px solid #CBD5E1", background:"#fff", color:"#334155" }}><Download size={16}/> {t("downloadWebsite", "Download Website")}</button>
            </div>
            <div className="detail-action-pair" style={{ display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:10 }}>
              <button className="action-button" onClick={share} style={{ ...button, border:"1px solid #CBD5E1", background:"#fff", color:"#334155" }}><Share2 size={16}/> {t("share", "Share")}</button>
              <button className={`action-button ${copied ? "success-pulse" : ""}`} onClick={copyLink} style={{ ...button, border:"1px solid #CBD5E1", background:copied ? "#DCFCE7" : "#fff", color:copied ? "#15803D" : "#334155" }}>{copied ? `✓ ${t("copied", "Copied!")}` : <><Copy size={16}/> {t("copyLink", "Copy Link")}</>}</button>
            </div>
            <div className="detail-action-pair" style={{ display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:10 }}>
              <button className="action-button" onClick={() => setFeedbackOpen(true)} style={{ ...button, border:"1px solid #CBD5E1", background:"#fff", color:"#334155" }}><MessageSquare size={16}/> {t("feedback", "Feedback")}</button>
              <button className="action-button" onClick={reportBroken} style={{ ...button, border:"1px solid #FECACA", background:"#fff", color:"#B91C1C" }}><Flag size={16}/> {t("reportBrokenLink", "Report broken link")}</button>
            </div>
            <button className="action-button" onClick={() => setExperienceOpen(true)} style={{ ...button, width:"100%", border:"1px solid #FECACA", background:"#FFF1F2", color:"#B91C1C", minHeight:40, fontSize:13 }}><AlertTriangle size={15}/> {t("importantInfo", "Important Info")}</button>
          </div>
          {message && <p style={{ margin:"14px 0 0", color:"#15803D", fontWeight:700 }}>{message}</p>}
        </div>
      </article>
    </main>
    {downloadOpen && (() => {
      const directDownloadUrl = site.appDownloadUrl || site.downloadUrl || site.websiteUrl || site.url || site.link || "";
      const guides = {
        android: {
          title: t("android", "Android"),
          steps: [
            t("downloadAndroid1", "Open this website in Chrome."),
            t("downloadAndroid2", "Tap the three dots menu."),
            t("downloadAndroid3", "Tap Add to Home screen or Install app."),
            t("downloadAndroid4", "Open it from your phone screen anytime."),
          ],
        },
        iphone: {
          title: t("iphone", "iPhone"),
          steps: [
            t("downloadIphone1", "Open this website in Safari."),
            t("downloadIphone2", "Tap the Share button."),
            t("downloadIphone3", "Tap Add to Home Screen."),
            t("downloadIphone4", "Tap Add."),
          ],
        },
        computer: {
          title: t("computer", "Computer"),
          steps: [
            t("downloadComputer1", "Open the website in Chrome or Edge."),
            t("downloadComputer2", "Click the install icon if available."),
            t("downloadComputer3", "Or press Ctrl + D / Command + D to bookmark it."),
          ],
        },
      };
      const activeGuide = guides[downloadGuideTab] || guides.android;
      return (
        <div style={{ position:"fixed", inset:0, zIndex:10001, display:"flex", alignItems:"flex-end", justifyContent:"center", background:"rgba(15,23,42,.42)" }} onClick={() => setDownloadOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:560, background:"#fff", borderRadius:"22px 22px 0 0", padding:22, boxShadow:"0 -18px 50px rgba(15,23,42,.18)" }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:14, marginBottom:14 }}>
              <div>
                <h2 style={{ margin:"0 0 6px", fontSize:20, fontWeight:900 }}>{t("downloadGuideTitle", "How to download this website")}</h2>
                <p style={{ margin:0, color:"#64748B", fontSize:13, lineHeight:1.5 }}>{t("downloadGuideSubtitle", "Follow these steps to save or install this website on your device.")}</p>
              </div>
              <button type="button" onClick={() => setDownloadOpen(false)} aria-label="Close download guide" style={{ width:36, height:36, borderRadius:10, border:"1px solid #E2E8F0", background:"#fff", display:"grid", placeItems:"center", cursor:"pointer", flexShrink:0 }}><X size={16}/></button>
            </div>
            {directDownloadUrl && (
              <button className="action-button" onClick={() => window.open(directDownloadUrl, "_blank", "noopener,noreferrer")} style={{ ...button, width:"100%", border:0, background:G, color:"#111", marginBottom:10 }}>
                {t("downloadApp", "Download App")} <ExternalLink size={15}/>
              </button>
            )}
            <button className="action-button" onClick={openSite} style={{ ...button, width:"100%", border:"1px solid #CBD5E1", background:"#fff", color:"#334155", marginBottom:14 }}>
              {t("openWebsiteFirst", "Open Website First")} <ExternalLink size={15}/>
            </button>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:8, marginBottom:14 }}>
              {Object.entries(guides).map(([key, guide]) => (
                <button key={key} type="button" onClick={() => setDownloadGuideTab(key)} style={{ minHeight:40, borderRadius:10, border:`1px solid ${downloadGuideTab === key ? G : "#E2E8F0"}`, background:downloadGuideTab === key ? "#FFFBEB" : "#fff", color:downloadGuideTab === key ? "#8F6D00" : "#334155", fontWeight:900, cursor:"pointer" }}>
                  {guide.title}
                </button>
              ))}
            </div>
            <section style={{ border:"1px solid #E2E8F0", borderRadius:14, background:"#F8FAFC", padding:16 }}>
              <h3 style={{ margin:"0 0 10px", fontSize:16, fontWeight:900 }}>{activeGuide.title}</h3>
              <ol style={{ margin:0, paddingLeft:20, display:"grid", gap:8, color:"#334155", fontSize:13, lineHeight:1.5 }}>
                {activeGuide.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </section>
          </div>
        </div>
      );
    })()}
    {feedbackOpen && <div style={{ position:"fixed", inset:0, zIndex:10001, display:"flex", alignItems:"flex-end", justifyContent:"center", background:"rgba(15,23,42,.35)" }} onClick={() => setFeedbackOpen(false)}><div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:520, background:"#fff", padding:20, borderRadius:"12px 12px 0 0" }}><strong>{t("sendFeedback", "Send feedback")}</strong><textarea value={feedbackMessage} onChange={e => setFeedbackMessage(e.target.value)} placeholder={t("feedbackPlaceholder", "Write your message...")} style={{ width:"100%", minHeight:72, margin:"12px 0", padding:10, border:"1px solid #CBD5E1", borderRadius:8, boxSizing:"border-box" }}/><div style={{ display:"flex", gap:8 }}><button onClick={sendFeedback} style={{ ...button, flex:1, border:0, background:G, color:"#111" }}>{t("submit", "Submit")}</button><button onClick={() => setFeedbackOpen(false)} style={{ ...button, border:"1px solid #CBD5E1", background:"#fff" }}>{t("cancel", "Cancel")}</button></div></div></div>}
    {experienceOpen && <div style={{ position:"fixed", inset:0, zIndex:10001, display:"flex", alignItems:"flex-end", justifyContent:"center", background:"rgba(15,23,42,.45)" }} onClick={() => setExperienceOpen(false)}><div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:560, background:"#fff", borderRadius:"22px 22px 0 0", padding:24 }}><h2 style={{ margin:"0 0 10px", fontSize:20 }}>{t("importantInfoTitle", "Better browsing experience")}</h2><p style={{ margin:"0 0 18px", color:"#475569", lineHeight:1.6 }}>{t("importantInfoMessage", "For a smoother and safer experience, STEA recommends using an AdBlocker and VPN when needed. Some websites may not work on every network.")}</p><div style={{ display:"grid", gap:10 }}><button className="action-button" onClick={() => navigate("/websites/adblockers")} style={{ ...button, border:0, background:G, color:"#111" }}>{t("adBlockerWebsites", "AdBlocker Websites")}</button><button className="action-button" onClick={() => window.open("https://steavpn.stea.africa", "_blank", "noopener,noreferrer")} style={{ ...button, border:"1px solid #CBD5E1", background:"#fff" }}>{t("steaVpn", "STEA VPN")}</button><button className="action-button" onClick={() => setExperienceOpen(false)} style={{ ...button, border:"1px solid #CBD5E1", background:"#fff" }}>{t("close", "Close")}</button></div></div></div>}
  </div>;
}
