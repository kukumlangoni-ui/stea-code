import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  if (getApps().length) return getApps()[0];

  return initializeApp({
    credential: applicationDefault(),
    projectId:
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GCLOUD_PROJECT ||
      "swahilitecheliteacademy",
  });
}

const PREVIEWS_CONFIG = {
  "glow-button-effect": {
    runtime: "html-css-js",
    enabled: true,
    interactive: true,
    html: `<div style="display:grid;place-items:center;min-height:100vh;background:#090d16;"><button class="glow-button">Launch Effect</button></div>`,
    css: `.glow-button{border:1px solid rgba(245,166,35,.45);background:#f5a623;color:#141000;border-radius:12px;padding:14px 24px;font-size:16px;font-weight:800;font-family:sans-serif;box-shadow:0 18px 40px -22px rgba(245,166,35,.9);transition:transform .16s ease,box-shadow .16s ease;cursor:pointer}.glow-button:hover{transform:translateY(-2px);box-shadow:0 22px 48px -22px rgba(245,166,35,1)}`,
    javascript: "",
  },
  "magnetic-text-reveal": {
    runtime: "react",
    enabled: true,
    interactive: true,
    jsx: `export default function App(){return <div style={{display:'grid',placeItems:'center',minHeight:'100vh',background:'#090d16'}}><strong className="magnetic-text-reveal" style={{fontSize:'36px',fontFamily:'sans-serif'}}>Code Faster</strong></div>}`,
    css: `.magnetic-text-reveal{display:inline-block;color:#f5a623;transition:transform .18s ease;cursor:pointer}.magnetic-text-reveal:hover{transform:translateY(-4px) scale(1.06)}`,
  },
  "minimal-loader": {
    runtime: "html-css-js",
    enabled: true,
    interactive: true,
    html: `<div style="display:grid;place-items:center;min-height:100vh;background:#090d16;"><div class="loader" role="status" aria-label="Loading"></div></div>`,
    css: `.loader{width:42px;height:42px;border-radius:50%;border:4px solid rgba(255,255,255,.16);border-top-color:#f5a623;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`,
    javascript: "",
  },
  "order-success-animation": {
    runtime: "react",
    enabled: true,
    interactive: true,
    jsx: `export default function App(){return <div style={{display:'grid',placeItems:'center',minHeight:'100vh',background:'#090d16'}}><section className="order-success"><span>✓</span><strong style={{fontSize:'22px'}}>Order Confirmed</strong></section></div>}`,
    css: `.order-success{display:grid;place-items:center;gap:14px;color:#d1fae5;font-family:sans-serif}.order-success span{display:grid;place-items:center;width:64px;height:64px;border-radius:50%;background:#16a34a;font-size:32px;color:#fff}`,
  },
  "particles-background": {
    runtime: "html-css-js",
    enabled: true,
    interactive: true,
    html: `<div id="bg" class="particles-background-ready"><div style="display:grid;place-items:center;min-height:100vh;color:#f5a623;font-family:sans-serif;font-size:24px;font-weight:700">Particles Background</div></div>`,
    css: `#bg{min-height:100vh;background:radial-gradient(circle at 50% 50%,rgba(245,166,35,.2),transparent 60%),#050812}`,
    javascript: "",
  },
  "product-card-hover": {
    runtime: "react",
    enabled: true,
    interactive: true,
    jsx: `export default function App(){return <div style={{display:'grid',placeItems:'center',minHeight:'100vh',background:'#090d16',padding:'20px'}}><article style={{width:'280px',borderRadius:'16px',border:'1px solid rgba(255,255,255,0.12)',background:'rgba(255,255,255,0.04)',padding:'16px',color:'#fff',fontFamily:'sans-serif',transition:'transform 0.2s ease, border-color 0.2s ease',cursor:'pointer'}} className="card-hover"><div style={{height:'140px',borderRadius:'10px',background:'linear-gradient(135deg, rgba(245,166,35,0.2), rgba(245,166,35,0.05))',marginBottom:'12px',display:'grid',placeItems:'center',fontSize:'36px'}}>📦</div><h3 style={{margin:'0 0 6px 0',fontSize:'16px'}}>Product Card Hover</h3><strong style={{color:'#f5a623',fontSize:'18px'}}>Free Component</strong></article></div>}`,
    css: `.card-hover:hover{transform:translateY(-6px);border-color:rgba(245,166,35,0.5)!important}`,
  },
  "slide-page-transition": {
    runtime: "react",
    enabled: true,
    interactive: true,
    jsx: `export default function App(){const [page, setPage] = React.useState(1); return <div style={{display:'grid',placeItems:'center',minHeight:'100vh',background:'#090d16',color:'#fff',fontFamily:'sans-serif'}}><div className="slide-page-transition" style={{textAlign:'center'}}><div style={{padding:'24px 32px',borderRadius:'16px',border:'1px solid rgba(245,166,35,0.3)',background:'rgba(245,166,35,0.05)',marginBottom:'16px'}}><h2 style={{margin:'0 0 8px 0',color:'#f5a623'}}>Page {page} View</h2><p style={{margin:0,color:'#94a3b8'}}>Smooth page transition demo</p></div><button onClick={()=>setPage(p => p === 1 ? 2 : 1)} style={{padding:'10px 20px',borderRadius:'8px',background:'#f5a623',color:'#000',fontWeight:'bold',border:'none',cursor:'pointer'}}>Switch Page View</button></div></div>}`,
    css: `.slide-page-transition{transition:transform .3s ease}`,
  },
};

async function main() {
  const app = getAdminApp();
  const db = getFirestore(app);

  console.log("=== Populating Product Previews in Firestore ===");

  for (const [productId, cfg] of Object.entries(PREVIEWS_CONFIG)) {
    const previewRef = db.collection("stea_code_product_previews").doc(productId);
    const productRef = db.collection("stea_code_products").doc(productId);

    const payload = {
      productId,
      runtime: cfg.runtime,
      enabled: true,
      interactive: true,
      width: 1440,
      height: 900,
      scaleMode: "fit",
      viewportMode: "desktop",
      html: cfg.html || "",
      css: cfg.css || "",
      javascript: cfg.javascript || "",
      jsx: cfg.jsx || "",
      tsx: cfg.tsx || "",
      fullDocument: cfg.fullDocument || "",
      updatedAt: new Date().toISOString(),
    };

    await previewRef.set(payload, { merge: true });

    // Also set preview metadata field in product doc
    await productRef.set(
      {
        preview: {
          enabled: true,
          runtime: cfg.runtime,
          interactive: true,
          autoRun: true,
          viewportMode: "desktop",
          width: 1440,
          height: 900,
          scaleMode: "fit",
        },
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log(`✓ Saved live preview for ${productId} (runtime: ${cfg.runtime})`);
  }

  // Ensure glass-motion-car product metadata also has preview.enabled = true
  const glassRef = db.collection("stea_code_products").doc("glass-motion-car");
  await glassRef.set(
    {
      preview: {
        enabled: true,
        runtime: "full-html",
        interactive: true,
        autoRun: true,
        viewportMode: "desktop",
        width: 1440,
        height: 900,
        scaleMode: "fit",
      },
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  console.log(`✓ Updated glass-motion-car product metadata preview.enabled = true`);

  console.log("\nSUCCESS: All 8 products now have live previews configured!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Preview population failed:", err);
  process.exit(1);
});
