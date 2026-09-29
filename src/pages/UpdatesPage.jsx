/**
 * UpdatesPage — Tech News & Updates from Firestore "updates" collection
 * Route: /news or /updates
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Calendar, Tag, ChevronRight } from "lucide-react";
import { useCollection } from "../hooks/useFirestore.js";
import { useMobile } from "../hooks/useMobile.js";

const G  = "#F5A623";
const BG = "#06080f";

const CATS = ["All","Tech","AI","Business","Education","Gaming","Social Media","Announcement","General"];

function timeAgo(ts) {
  if (!ts) return "";
  const sec = Math.floor((Date.now() - (ts.seconds ? ts.seconds * 1000 : new Date(ts).getTime())) / 1000);
  if (sec < 60)  return "Just now";
  if (sec < 3600) return `${Math.floor(sec/60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec/3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec/86400)}d ago`;
  return new Date(ts.seconds ? ts.seconds * 1000 : ts).toLocaleDateString("en-US",{month:"short",day:"numeric"});
}

function UpdateCard({ item, index }) {
  const isMobile = useMobile();
  const [imgErr, setImgErr] = useState(false);
  const thumb = item.imageUrl || item.image || item.thumbnail || "";
  const hasImg = thumb && !imgErr;
  const title = item.title || item.titleEn || "Untitled";
  const desc  = item.description || item.summary || item.content || item.descriptionEn || "";
  const cat   = item.category || item.badge || item.type || "General";
  const ts    = item.createdAt || item.publishDate;
  const link  = item.link || item.ctaUrl || item.url || "";

  const handleClick = () => {
    if (link) window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      initial={{ opacity:0, y:20 }}
      whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true }}
      transition={{ delay: index * 0.04, duration:0.42, ease:[0.16,1,0.3,1] }}
      onClick={handleClick}
      style={{
        borderRadius:20, overflow:"hidden",
        background:"rgba(255,255,255,.04)",
        border:"1px solid rgba(255,255,255,.07)",
        cursor: link ? "pointer" : "default",
        transition:"all .22s ease",
        display:"flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems:"stretch",
      }}
      onMouseEnter={e => { if (link) { e.currentTarget.style.borderColor="rgba(255,255,255,.14)"; e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 12px 36px rgba(0,0,0,.4)"; }}}
      onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,.07)"; e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="none"; }}
    >
      {/* Thumbnail */}
      {(hasImg || isMobile) && (
        <div style={{
          width: isMobile ? "100%" : 220,
          height: isMobile ? 180 : "auto",
          minHeight: isMobile ? undefined : 140,
          background:"rgba(255,255,255,.06)",
          flexShrink:0, position:"relative", overflow:"hidden",
        }}>
          {hasImg
            ? <img src={thumb} alt={title} style={{ width:"100%", height:"100%", objectFit:"cover" }} referrerPolicy="no-referrer" onError={() => setImgErr(true)} />
            : <div style={{ width:"100%", height:"100%", display:"grid", placeItems:"center", fontSize:32, opacity:.1 }}>📰</div>
          }
          {/* Category badge */}
          <div style={{ position:"absolute", top:10, left:12, padding:"3px 10px", borderRadius:6, background:"rgba(0,0,0,.65)", backdropFilter:"blur(8px)", color:"#fff", fontSize:10, fontWeight:900, textTransform:"uppercase", letterSpacing:".07em" }}>
            {cat}
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: isMobile ? "16px 18px" : "20px 22px", flex:1, display:"flex", flexDirection:"column", justifyContent:"space-between", minWidth:0 }}>
        <div>
          {/* Category badge for desktop (no image side panel) */}
          {!isMobile && !hasImg && (
            <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:6, background:`${G}12`, border:`1px solid ${G}20`, color:G, fontSize:10, fontWeight:900, textTransform:"uppercase", letterSpacing:".07em", marginBottom:10 }}>
              <Tag size={9} /> {cat}
            </div>
          )}
          <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize: isMobile ? 15.5 : 17, fontWeight:900, margin:"0 0 8px", lineHeight:1.32, letterSpacing:"-.02em", overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
            {title}
          </h3>
          {desc && (
            <p style={{ color:"rgba(255,255,255,.48)", fontSize: isMobile ? 13 : 14, lineHeight:1.68, margin:"0 0 12px", overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
              {desc}
            </p>
          )}
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, color:"rgba(255,255,255,.3)", fontSize:12 }}>
            {ts && <><Calendar size={11} /> <span>{timeAgo(ts)}</span></>}
            {item.source && <><span style={{opacity:.4}}>·</span><span>{item.source}</span></>}
          </div>
          {link && (
            <span style={{ display:"flex", alignItems:"center", gap:5, color:G, fontWeight:800, fontSize:12 }}>
              Read more <ExternalLink size={11} />
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function UpdatesPage() {
  const isMobile = useMobile();
  const navigate = useNavigate();
  const { docs: updatesDocs, loading } = useCollection("updates", "createdAt", 60);
  const { docs: postsDocs }            = useCollection("posts",   "createdAt", 30);
  const [activeCat, setActiveCat]      = useState("All");
  const [search, setSearch]            = useState("");

  // Merge updates + posts, dedupe, sort newest first
  const all = [...updatesDocs, ...postsDocs]
    .filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i)
    .filter(d => d.status !== "draft" && d.published !== false)
    .sort((a, b) => {
      const ts = d => d.createdAt?.seconds || (d.publishDate?.seconds||0);
      return ts(b) - ts(a);
    });

  const filtered = all.filter(item => {
    const cat = item.category || item.badge || item.type || "General";
    const matchCat = activeCat === "All" || cat.toLowerCase().includes(activeCat.toLowerCase());
    const matchSearch = !search || (item.title||"").toLowerCase().includes(search.toLowerCase()) || (item.description||"").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ minHeight:"100vh", background:BG, color:"#fff", paddingTop: isMobile?72:100, paddingBottom:80 }}>
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 clamp(16px,4vw,40px)" }}>

        {/* Back */}
        <button onClick={() => navigate(-1)} style={{ display:"flex", alignItems:"center", gap:8, color:"rgba(255,255,255,.45)", background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", borderRadius:12, padding:"8px 16px", cursor:"pointer", marginBottom:28, fontSize:13, fontWeight:700, transition:"all .18s" }}
          onMouseEnter={e => { e.currentTarget.style.color="#fff"; e.currentTarget.style.borderColor="rgba(255,255,255,.2)"; }}
          onMouseLeave={e => { e.currentTarget.style.color="rgba(255,255,255,.45)"; e.currentTarget.style.borderColor="rgba(255,255,255,.1)"; }}>
          <ArrowLeft size={15} /> Back
        </button>

        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"5px 14px", borderRadius:999, background:`${G}12`, border:`1px solid ${G}22`, color:G, fontSize:11, fontWeight:900, textTransform:"uppercase", letterSpacing:".1em", marginBottom:14 }}>
            📰 Tech News & Updates
          </div>
          <h1 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize: isMobile?"clamp(24px,8vw,36px)":"clamp(28px,4vw,42px)", fontWeight:900, letterSpacing:"-.04em", margin:"0 0 10px", lineHeight:1.12 }}>
            Latest News & Updates
          </h1>
          <p style={{ color:"rgba(255,255,255,.45)", fontSize: isMobile?14:16, margin:0, lineHeight:1.65 }}>
            Tech news, announcements, and platform updates from STEA.
          </p>
        </div>

        {/* Search */}
        <div style={{ position:"relative", marginBottom:18 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search updates…"
            style={{ width:"100%", height:44, borderRadius:13, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", color:"#fff", padding:"0 14px 0 40px", outline:"none", fontSize:14, fontFamily:"inherit", boxSizing:"border-box" }} />
          <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", opacity:.4, fontSize:16 }}>🔍</span>
        </div>

        {/* Category chips */}
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:8, scrollbarWidth:"none", marginBottom:24 }}>
          {CATS.map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)}
              style={{ padding:"7px 16px", borderRadius:999, fontSize:isMobile?12:13, fontWeight:700, whiteSpace:"nowrap", cursor:"pointer", border:"1px solid",
                borderColor: activeCat===cat ? G : "rgba(255,255,255,.1)",
                background: activeCat===cat ? `${G}14` : "transparent",
                color: activeCat===cat ? G : "rgba(255,255,255,.5)",
                transition:"all .15s",
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div style={{ fontSize:12, color:"rgba(255,255,255,.3)", fontWeight:700, marginBottom:16 }}>
          {loading ? "Loading…" : `${filtered.length} update${filtered.length !== 1 ? "s" : ""}`}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display:"grid", gap:14 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ height:140, borderRadius:20, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.06)", animation:"shimmer 1.8s infinite" }} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div style={{ display:"grid", gap:14 }}>
            {filtered.map((item, i) => <UpdateCard key={item.id||i} item={item} index={i} />)}
          </div>
        ) : (
          <div style={{ textAlign:"center", padding:"56px 20px", borderRadius:20, border:"1px solid rgba(255,255,255,.07)", background:"rgba(255,255,255,.02)" }}>
            <div style={{ fontSize:40, marginBottom:14 }}>📭</div>
            <h3 style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>No Updates Found</h3>
            <p style={{ color:"rgba(255,255,255,.4)", fontSize:14 }}>
              {search ? `No results for "${search}"` : "No updates in this category yet."}
            </p>
            {(search || activeCat !== "All") && (
              <button onClick={() => { setSearch(""); setActiveCat("All"); }} style={{ marginTop:16, padding:"8px 20px", borderRadius:10, background:`${G}14`, border:`1px solid ${G}22`, color:G, fontWeight:800, fontSize:13, cursor:"pointer" }}>
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
