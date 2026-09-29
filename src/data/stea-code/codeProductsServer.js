export const STEA_CODE_SERVER_PRODUCTS = [
  {
    id: "magnetic-text-reveal",
    slug: "magnetic-text-reveal",
    titleEn: "Magnetic Text Reveal",
    titleZh: "磁吸文字揭示",
    productType: "React Component",
    pricingType: "premium",
    price: 4.99,
    currency: "USD",
    status: "published",
    homepageVisible: true,
    posterImageUrl: "",
    fileNames: ["MagneticTextReveal.jsx", "magnetic-text-reveal.css", "README.md", "LICENSE.txt"],
    protectedFiles: [
      {
        path: "MagneticTextReveal.jsx",
        language: "jsx",
        content: "export function MagneticTextReveal(){return <strong className=\"magnetic-text-reveal\">Code faster</strong>}",
      },
      {
        path: "magnetic-text-reveal.css",
        language: "css",
        content: ".magnetic-text-reveal{display:inline-block;color:#f5a623;transition:transform .18s ease}.magnetic-text-reveal:hover{transform:translateY(-2px)}",
      },
      {
        path: "README.md",
        language: "markdown",
        content: "# Magnetic Text Reveal\n\nInstall the component, import the CSS file, then customize the copy and motion values.",
      },
      {
        path: "LICENSE.txt",
        language: "text",
        content: "STEA Code personal license. Redistribution as a standalone product is not permitted.",
      },
    ],
    demoPreview: {
      mode: "full-html",
      fullDocument: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body{margin:0;height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 30% 20%,#1e293b,#0b0f17);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden;color:#fff}
  .stage{text-align:center}
  .magnetic{position:relative;display:inline-block;font-size:54px;font-weight:800;letter-spacing:-.02em;color:#f5a623;cursor:default;padding:8px 14px}
  .magnetic .glow{position:absolute;inset:-40%;background:radial-gradient(circle,rgba(245,166,35,.32),transparent 60%);opacity:0;transition:opacity .35s;pointer-events:none;z-index:-1;border-radius:50%}
  .magnetic:hover .glow{opacity:1}
  .magnetic span{display:inline-block;transition:transform .25s cubic-bezier(.2,.8,.2,1)}
  .badge{display:inline-block;margin-top:24px;padding:6px 14px;background:rgba(245,166,35,.12);color:#f5a623;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
</style></head>
<body>
<div class="stage">
  <div class="magnetic" id="m">
    <div class="glow"></div>
    <span>M</span><span>a</span><span>g</span><span>n</span><span>e</span><span>t</span><span>i</span><span>c</span>
  </div>
  <div class="badge">Hover &amp; move</div>
</div>
<script>
const m=document.getElementById('m');const spans=m.querySelectorAll('span');
m.addEventListener('mousemove',e=>{const r=m.getBoundingClientRect();const cx=(e.clientX-r.left-r.width/2)/(r.width/2);const cy=(e.clientY-r.top-r.height/2)/(r.height/2);spans.forEach((s,i)=>{const k=(i+1)*4;s.style.transform='translate('+(cx*k)+'px,'+(cy*k)+'px)'})});
m.addEventListener('mouseleave',()=>spans.forEach(s=>s.style.transform=''));
</script>
</body></html>`,
    },
  },
  {
    id: "order-success-animation",
    slug: "order-success-animation",
    titleEn: "Order Success Animation",
    titleZh: "订单成功动画",
    productType: "React Component",
    pricingType: "premium",
    price: 6.99,
    currency: "USD",
    status: "published",
    homepageVisible: true,
    posterImageUrl: "",
    fileNames: ["OrderSuccessAnimation.jsx", "order-success-animation.css", "README.md", "LICENSE.txt"],
    protectedFiles: [
      {
        path: "OrderSuccessAnimation.jsx",
        language: "jsx",
        content: "export function OrderSuccessAnimation(){return <section className=\"order-success\"><span>✓</span><strong>Order confirmed</strong></section>}",
      },
      {
        path: "order-success-animation.css",
        language: "css",
        content: ".order-success{display:grid;place-items:center;gap:10px;color:#d1fae5}.order-success span{display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:#16a34a}",
      },
      {
        path: "README.md",
        language: "markdown",
        content: "# Order Success Animation\n\nRender after your checkout provider confirms payment and pass your order labels as props.",
      },
      {
        path: "LICENSE.txt",
        language: "text",
        content: "STEA Code personal license. Redistribution as a standalone product is not permitted.",
      },
    ],
    demoPreview: {
      mode: "full-html",
      fullDocument: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body{margin:0;height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 50% 30%,#0b1f17,#050812);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden;color:#fff}
  .card{padding:34px 42px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:20px;text-align:center;animation:pop .55s cubic-bezier(.2,1.6,.4,1) both;backdrop-filter:blur(8px)}
  .circle{width:68px;height:68px;border-radius:50%;background:linear-gradient(135deg,#16a34a,#22c55e);margin:0 auto 16px;display:grid;place-items:center;box-shadow:0 14px 30px -8px rgba(34,197,94,.55);animation:scalein .55s .15s both}
  .check{width:26px;height:13px;border-left:4px solid #fff;border-bottom:4px solid #fff;transform:rotate(-45deg) scale(0);animation:check .4s .5s forwards}
  .ring{position:absolute;inset:-12px;border-radius:50%;border:2px solid rgba(34,197,94,.4);animation:ring 1s .25s both}
  .title{color:#fff;font-size:19px;font-weight:700;margin:0}
  .sub{color:#94a3b8;font-size:13px;margin:6px 0 0}
  @keyframes pop{0%{transform:scale(.85);opacity:0}100%{transform:scale(1);opacity:1}}
  @keyframes scalein{0%{transform:scale(0)}60%{transform:scale(1.08)}100%{transform:scale(1)}}
  @keyframes check{0%{transform:rotate(-45deg) scale(0)}100%{transform:rotate(-45deg) scale(1)}}
  @keyframes ring{0%{opacity:.9;transform:scale(.6)}100%{opacity:0;transform:scale(1.6)}}
</style></head>
<body>
<div class="card">
  <div style="position:relative;display:grid;place-items:center">
    <div class="ring"></div>
    <div class="circle"><div class="check"></div></div>
  </div>
  <p class="title">Order confirmed</p>
  <p class="sub">Thank you for your purchase</p>
</div>
</body></html>`,
    },
  },
  {
    id: "particles-background",
    slug: "particles-background",
    titleEn: "Particles Background",
    titleZh: "粒子背景",
    productType: "JavaScript Component",
    pricingType: "premium",
    price: 5.99,
    currency: "USD",
    status: "published",
    homepageVisible: true,
    posterImageUrl: "",
    fileNames: ["particles-background.js", "particles-background.css", "README.md", "LICENSE.txt"],
    protectedFiles: [
      {
        path: "particles-background.js",
        language: "javascript",
        content: "export function mountParticles(root){if(!root)return;root.classList.add('particles-background-ready')}",
      },
      {
        path: "particles-background.css",
        language: "css",
        content: ".particles-background-ready{background:radial-gradient(circle at 25% 30%,rgba(125,211,252,.28),transparent 32%),#050812}",
      },
      {
        path: "README.md",
        language: "markdown",
        content: "# Particles Background\n\nMount the background behind your hero and keep reduced-motion users on the static fallback.",
      },
      {
        path: "LICENSE.txt",
        language: "text",
        content: "STEA Code personal license. Redistribution as a standalone product is not permitted.",
      },
    ],
    demoPreview: {
      mode: "full-html",
      fullDocument: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body{margin:0;height:100vh;background:#050812;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,sans-serif}
  canvas{position:absolute;inset:0;width:100%;height:100%}
  .label{position:absolute;bottom:22px;left:24px;color:#7dd3fc;font-size:13px;letter-spacing:.06em;opacity:.72;text-transform:uppercase;font-weight:600}
</style></head>
<body>
<canvas id="c"></canvas>
<div class="label">Particles Background</div>
<script>
const cv=document.getElementById('c'),x=cv.getContext('2d');
function resize(){cv.width=innerWidth;cv.height=innerHeight}resize();addEventListener('resize',resize);
const N=90;const ps=Array.from({length:N},()=>({x:Math.random()*cv.width,y:Math.random()*cv.height,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4,r:Math.random()*1.6+.6,h:Math.random()*70+190}));
const mouse={x:cv.width/2,y:cv.height/2};
addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY});
function tick(){
  x.fillStyle='rgba(5,8,18,.22)';x.fillRect(0,0,cv.width,cv.height);
  ps.forEach(p=>{const dx=mouse.x-p.x,dy=mouse.y-p.y,d=Math.hypot(dx,dy);
    if(d<140){p.vx+=(dx/d)*.02;p.vy+=(dy/d)*.02}
    p.vx*=.98;p.vy*=.98;p.x+=p.vx;p.y+=p.vy;
    if(p.x<0)p.x=0,p.vx*=-1;if(p.x>cv.width)p.x=cv.width,p.vx*=-1;
    if(p.y<0)p.y=0,p.vy*=-1;if(p.y>cv.height)p.y=cv.height,p.vy*=-1;
    x.beginPath();x.arc(p.x,p.y,p.r,0,6.28);x.fillStyle='hsla('+p.h+',80%,65%,.85)';x.fill()});
  ps.forEach((a,i)=>ps.slice(i+1).forEach(b=>{const dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy);
    if(d<120){x.strokeStyle='hsla('+((a.h+b.h)/2)+',80%,65%,'+(.16*(1-d/120))+')';x.lineWidth=.5;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke()}}));
  requestAnimationFrame(tick)}tick();
</script>
</body></html>`,
    },
  },
  {
    id: "glow-button-effect",
    slug: "glow-button-effect",
    titleEn: "Glow Button Effect",
    titleZh: "发光按钮效果",
    productType: "CSS Component",
    pricingType: "free",
    price: 0,
    currency: "USD",
    status: "published",
    homepageVisible: true,
    posterImageUrl: "",
    fileNames: ["index.html", "styles.css", "README.md", "LICENSE.txt"],
    publicFiles: [
      {
        path: "index.html",
        language: "html",
        content: "<button class=\"glow-button\">Launch</button>",
      },
      {
        path: "styles.css",
        language: "css",
        content: ".glow-button{border:1px solid rgba(245,166,35,.45);background:#f5a623;color:#141000;border-radius:12px;padding:12px 18px;font-weight:800;box-shadow:0 18px 40px -22px rgba(245,166,35,.9);transition:transform .16s ease,box-shadow .16s ease}.glow-button:hover{transform:translateY(-2px);box-shadow:0 22px 48px -22px rgba(245,166,35,1)}",
      },
      {
        path: "README.md",
        language: "markdown",
        content: "# Glow Button Effect\n\nCopy the CSS class, add it to your button, then adjust the accent color.",
      },
      {
        path: "LICENSE.txt",
        language: "text",
        content: "STEA Code free license for use in your projects.",
      },
    ],
  },
  {
    id: "minimal-loader",
    slug: "minimal-loader",
    titleEn: "Minimal Loader",
    titleZh: "极简加载动画",
    productType: "CSS Component",
    pricingType: "free",
    price: 0,
    currency: "USD",
    status: "published",
    homepageVisible: true,
    posterImageUrl: "",
    fileNames: ["index.html", "styles.css", "README.md", "LICENSE.txt"],
    publicFiles: [
      {
        path: "index.html",
        language: "html",
        content: "<div class=\"loader\" role=\"status\" aria-label=\"Loading\"></div>",
      },
      {
        path: "styles.css",
        language: "css",
        content: ".loader{width:34px;height:34px;border-radius:50%;border:3px solid rgba(255,255,255,.16);border-top-color:#f5a623;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}",
      },
      {
        path: "README.md",
        language: "markdown",
        content: "# Minimal Loader\n\nAdd the loader while async data is loading and include an accessible label.",
      },
      {
        path: "LICENSE.txt",
        language: "text",
        content: "STEA Code free license for use in your projects.",
      },
    ],
  },
  {
    id: "product-card-hover",
    slug: "product-card-hover",
    titleEn: "Product Card Hover",
    titleZh: "商品卡片悬停效果",
    productType: "React Component",
    pricingType: "free",
    price: 0,
    currency: "USD",
    status: "published",
    homepageVisible: true,
    posterImageUrl: "",
    fileNames: ["ProductCard.jsx", "README.md", "LICENSE.txt"],
    publicFiles: [
      {
        path: "ProductCard.jsx",
        language: "jsx",
        content: "export function ProductCard({title,price}){return <article className=\"rounded-xl border border-white/10 bg-white/[.03] p-3 transition hover:-translate-y-1\"><div className=\"aspect-video rounded-lg bg-white/10\"/><h3>{title}</h3><strong>{price}</strong></article>}",
      },
      {
        path: "README.md",
        language: "markdown",
        content: "# Product Card Hover\n\nDrop the component into a product grid and pass title, price and media props.",
      },
      {
        path: "LICENSE.txt",
        language: "text",
        content: "STEA Code free license for use in your projects.",
      },
    ],
    demoPreview: {
      mode: "full-html",
      fullDocument: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0f17;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#fff;padding:24px}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;max-width:760px}
  .pc{position:relative;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.10);border-radius:14px;padding:12px;transition:transform .25s cubic-bezier(.2,.8,.2,1),border-color .25s,box-shadow .25s;cursor:pointer;overflow:hidden}
  .pc:hover{transform:translateY(-6px);border-color:rgba(245,166,35,.4);box-shadow:0 20px 40px -20px rgba(245,166,35,.35)}
  .pc::after{content:'';position:absolute;inset:0;background:linear-gradient(120deg,transparent 40%,rgba(245,166,35,.18) 50%,transparent 60%);transform:translateX(-100%);transition:transform .8s ease;pointer-events:none}
  .pc:hover::after{transform:translateX(100%)}
  .media{aspect-ratio:16/9;border-radius:10px;background:linear-gradient(135deg,#1e293b,#334155);margin-bottom:10px;display:grid;place-items:center;color:#64748b;font-size:24px}
  .pc h3{margin:0 0 4px;font-size:14px;font-weight:700;color:#fff}
  .pc strong{display:block;color:#f5a623;font-size:13px;font-weight:800}
  @media(max-width:540px){.grid{grid-template-columns:1fr}}
</style></head>
<body>
<div class="grid">
  <article class="pc"><div class="media">A</div><h3>Aurora</h3><strong>$4.99</strong></article>
  <article class="pc"><div class="media">N</div><h3>Nebula</h3><strong>$6.99</strong></article>
  <article class="pc"><div class="media">C</div><h3>Comet</h3><strong>$3.49</strong></article>
</div>
</body></html>`,
    },
  },
  {
    id: "slide-page-transition",
    slug: "slide-page-transition",
    titleEn: "Slide Page Transition",
    titleZh: "滑动页面转场",
    productType: "HTML/CSS/JS Component",
    pricingType: "premium",
    price: 4.99,
    currency: "USD",
    status: "published",
    homepageVisible: true,
    posterImageUrl: "",
    fileNames: ["SlidePageTransition.jsx", "slide-page-transition.css", "README.md", "LICENSE.txt"],
    protectedFiles: [
      {
        path: "SlidePageTransition.jsx",
        language: "jsx",
        content: "export function SlidePageTransition({children}){return <div className=\"slide-page-transition\">{children}</div>}",
      },
      {
        path: "slide-page-transition.css",
        language: "css",
        content: ".slide-page-transition{display:block;transition:transform .3s ease}",
      },
      {
        path: "README.md",
        language: "markdown",
        content: "# Slide Page Transition\n\nWrap your routing view stack with the transition container.",
      },
      {
        path: "LICENSE.txt",
        language: "text",
        content: "STEA Code personal license.",
      },
    ],
    demoPreview: {
      mode: "full-html",
      fullDocument: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body{margin:0;height:100vh;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0b0f17}
  .stage{position:relative;width:100%;height:100%;overflow:hidden}
  .panel{position:absolute;inset:0;display:grid;place-items:center;transition:transform .65s cubic-bezier(.7,0,.2,1)}
  .panel .inner{padding:40px;text-align:center;max-width:520px}
  .panel .label{color:#fff;font-size:34px;font-weight:800;letter-spacing:-.01em;margin:0}
  .panel .sub{color:#94a3b8;margin-top:10px;font-size:15px}
  .p1{background:linear-gradient(135deg,#0b0f17,#1e293b)}
  .p2{background:linear-gradient(135deg,#431407,#7c2d12);transform:translateX(100%)}
  .p3{background:linear-gradient(135deg,#0c4a6e,#0e7490);transform:translateX(100%)}
  .stage[data-ix="0"] .p1{transform:translateX(0)}.stage[data-ix="0"] .p2{transform:translateX(100%)}
  .stage[data-ix="1"] .p1{transform:translateX(-100%)}.stage[data-ix="1"] .p2{transform:translateX(0)}.stage[data-ix="1"] .p3{transform:translateX(100%)}
  .stage[data-ix="2"] .p2{transform:translateX(-100%)}.stage[data-ix="2"] .p3{transform:translateX(0)}
  .nav{position:absolute;bottom:28px;left:0;right:0;display:flex;gap:10px;justify-content:center;z-index:10}
  .nav button{padding:10px 18px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.45);color:#fff;border-radius:10px;cursor:pointer;font-size:13px;font-weight:600;backdrop-filter:blur(10px);transition:all .2s}
  .nav button:hover{background:rgba(245,166,35,.22);border-color:#f5a623}
  .nav button:disabled{opacity:.3;cursor:not-allowed}
  .dots{position:absolute;top:24px;left:0;right:0;display:flex;gap:8px;justify-content:center;z-index:10}
  .dots i{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.25);transition:all .25s}
  .dots i.on{background:#f5a623;width:24px;border-radius:4px}
</style></head>
<body>
<div class="stage" id="s" data-ix="0">
  <div class="panel p1"><div class="inner"><h2 class="label">Welcome</h2><p class="sub">A smooth slide-page transition feels instant.</p></div></div>
  <div class="panel p2"><div class="inner"><h2 class="label">Step Two</h2><p class="sub">Panels glide in on a single cubic-bezier curve.</p></div></div>
  <div class="panel p3"><div class="inner"><h2 class="label">Done</h2><p class="sub">No layout shift, no flicker, no jank.</p></div></div>
  <div class="dots" id="d"><i></i><i></i><i></i></div>
  <div class="nav"><button id="prev">Prev</button><button id="next">Next</button></div>
</div>
<script>
const s=document.getElementById('s'),prev=document.getElementById('prev'),next=document.getElementById('next'),dots=document.querySelectorAll('#d i');
let i=0;const max=2;function render(){s.dataset.ix=i;dots.forEach((d,k)=>d.classList.toggle('on',k===i));prev.disabled=i===0;next.disabled=i===max}
prev.onclick=()=>{if(i>0){i--;render()}};
next.onclick=()=>{if(i<max){i++;render()}};
render();
</script>
</body></html>`,
    },
  },
  {
    id: "aurora-glowing-buttons-pack",
    slug: "aurora-glowing-buttons-pack",
    titleEn: "Aurora Glowing Buttons Pack",
    titleZh: "极光发光按钮组件包",
    productType: "HTML/CSS/JS Component",
    category: "Buttons",
    pricingType: "premium",
    price: 4.99,
    currency: "USD",
    status: "published",
    homepageVisible: true,
    featured: true,
    tags: ["buttons", "aurora", "glow", "animation", "css", "interactive"],
    frameworks: ["HTML5", "CSS3", "JavaScript"],
    languages: ["HTML", "CSS", "JavaScript"],
    shortDescriptionEn: "A collection of high-performance glowing aurora buttons with smooth multi-layer ambient reflections and interactive hover dynamics.",
    shortDescriptionZh: "高性能极光发光按钮组件包，具备多层环境反射与平滑悬停动效。",
    posterImageUrl: "",
    previewVideoUrl: "",
    included: [
      "Complete source files (HTML, CSS, JS)",
      "Ready-to-use component",
      "Responsive design",
      "Installation instructions",
      "Commercial use according to license",
    ],
    fileNames: ["index.html", "styles.css", "script.js", "README.md", "LICENSE.txt"],
    protectedFiles: [
      {
        path: "index.html",
        language: "html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aurora Glowing Buttons</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="aurora-container">
    <button class="aurora-btn aurora-btn-gold">
      <span class="aurora-glow"></span>
      <span class="aurora-label">Get Started Free</span>
    </button>
    <button class="aurora-btn aurora-btn-cyan">
      <span class="aurora-glow"></span>
      <span class="aurora-label">Explore Code</span>
    </button>
    <button class="aurora-btn aurora-btn-purple">
      <span class="aurora-glow"></span>
      <span class="aurora-label">Launch Studio</span>
    </button>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
      },
      {
        path: "styles.css",
        language: "css",
        content: `:root {
  --aurora-gold: #f5a623;
  --aurora-gold-glow: rgba(245, 166, 35, 0.45);
  --aurora-cyan: #06b6d4;
  --aurora-cyan-glow: rgba(6, 182, 212, 0.45);
  --aurora-purple: #a855f7;
  --aurora-purple-glow: rgba(168, 85, 247, 0.45);
}

.aurora-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: #0b0f19;
  border-radius: 16px;
}

.aurora-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 28px;
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  backdrop-filter: blur(8px);
}

.aurora-btn .aurora-label {
  position: relative;
  z-index: 2;
  letter-spacing: 0.02em;
}

.aurora-btn .aurora-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 140%;
  height: 140%;
  transform: translate(-50%, -50%) scale(0.6);
  opacity: 0;
  filter: blur(20px);
  border-radius: 50%;
  transition: opacity 0.3s ease, transform 0.3s ease;
  pointer-events: none;
  z-index: 1;
}

.aurora-btn-gold {
  border-color: rgba(245, 166, 35, 0.3);
}
.aurora-btn-gold .aurora-glow {
  background: radial-gradient(circle, var(--aurora-gold) 0%, var(--aurora-gold-glow) 60%, transparent 80%);
}
.aurora-btn-gold:hover {
  border-color: var(--aurora-gold);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 10px 30px -10px var(--aurora-gold-glow);
}
.aurora-btn-gold:hover .aurora-glow {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.aurora-btn-cyan {
  border-color: rgba(6, 182, 212, 0.3);
}
.aurora-btn-cyan .aurora-glow {
  background: radial-gradient(circle, var(--aurora-cyan) 0%, var(--aurora-cyan-glow) 60%, transparent 80%);
}
.aurora-btn-cyan:hover {
  border-color: var(--aurora-cyan);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 10px 30px -10px var(--aurora-cyan-glow);
}
.aurora-btn-cyan:hover .aurora-glow {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.aurora-btn-purple {
  border-color: rgba(168, 85, 247, 0.3);
}
.aurora-btn-purple .aurora-glow {
  background: radial-gradient(circle, var(--aurora-purple) 0%, var(--aurora-purple-glow) 60%, transparent 80%);
}
.aurora-btn-purple:hover {
  border-color: var(--aurora-purple);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 10px 30px -10px var(--aurora-purple-glow);
}
.aurora-btn-purple:hover .aurora-glow {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.aurora-btn:active {
  transform: translateY(0px) scale(0.98);
}`,
      },
      {
        path: "script.js",
        language: "javascript",
        content: `document.querySelectorAll('.aurora-btn').forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const glow = btn.querySelector('.aurora-glow');
    if (glow) {
      glow.style.transform = \`translate(-50%, -50%) translate(\${(x - 50) * 0.4}px, \${(y - 50) * 0.4}px) scale(1.1)\`;
    }
  });

  btn.addEventListener('mouseleave', () => {
    const glow = btn.querySelector('.aurora-glow');
    if (glow) {
      glow.style.transform = 'translate(-50%, -50%) scale(0.6)';
    }
  });
});`,
      },
      {
        path: "README.md",
        language: "markdown",
        content: `# Aurora Glowing Buttons Pack\n\nA suite of interactive ambient glowing buttons engineered for modern web applications and SaaS landing pages.\n\n## Installation\n\n1. Copy \`styles.css\` into your stylesheet pipeline or link it in your HTML.\n2. Include the button HTML structure with \`aurora-btn\` and color modifier classes.\n3. Import \`script.js\` before the closing \`</body>\` tag for reactive magnetic cursor glow tracking.\n\n## Customization\n\nYou can change glowing accents by updating \`--aurora-gold\`, \`--aurora-cyan\`, and \`--aurora-purple\` in CSS root variables.`,
      },
      {
        path: "LICENSE.txt",
        language: "text",
        content: "STEA Code Commercial License. Permitted for use in unlimited commercial and personal projects.",
      },
    ],
    demoPreview: {
      mode: "full-html",
      // Same source files inlined into a single self-contained document so the
      // sandboxed iframe can render it without relative <link>/<script src>.
      fullDocument: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aurora Glowing Buttons</title>
  <style>
    :root {
      --aurora-gold: #f5a623;
      --aurora-gold-glow: rgba(245, 166, 35, 0.45);
      --aurora-cyan: #06b6d4;
      --aurora-cyan-glow: rgba(6, 182, 212, 0.45);
      --aurora-purple: #a855f7;
      --aurora-purple-glow: rgba(168, 85, 247, 0.45);
    }
    html,body{margin:0;height:100%}
    body{min-height:100vh;display:grid;place-items:center;background:#0b0f19}
    .aurora-container{display:flex;flex-wrap:wrap;gap:20px;align-items:center;justify-content:center;padding:40px;background:#0b0f19;border-radius:16px}
    .aurora-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;padding:14px 28px;font-size:15px;font-weight:700;color:#fff;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);border-radius:12px;cursor:pointer;overflow:hidden;transition:all 0.25s cubic-bezier(0.16,1,0.3,1);backdrop-filter:blur(8px)}
    .aurora-btn .aurora-label{position:relative;z-index:2;letter-spacing:0.02em}
    .aurora-btn .aurora-glow{position:absolute;top:50%;left:50%;width:140%;height:140%;transform:translate(-50%,-50%) scale(0.6);opacity:0;filter:blur(20px);border-radius:50%;transition:opacity 0.3s ease,transform 0.3s ease;pointer-events:none;z-index:1}
    .aurora-btn-gold{border-color:rgba(245,166,35,0.3)}
    .aurora-btn-gold .aurora-glow{background:radial-gradient(circle,var(--aurora-gold) 0%,var(--aurora-gold-glow) 60%,transparent 80%)}
    .aurora-btn-gold:hover{border-color:var(--aurora-gold);color:#fff;transform:translateY(-2px);box-shadow:0 10px 30px -10px var(--aurora-gold-glow)}
    .aurora-btn-gold:hover .aurora-glow{opacity:1;transform:translate(-50%,-50%) scale(1)}
    .aurora-btn-cyan{border-color:rgba(6,182,212,0.3)}
    .aurora-btn-cyan .aurora-glow{background:radial-gradient(circle,var(--aurora-cyan) 0%,var(--aurora-cyan-glow) 60%,transparent 80%)}
    .aurora-btn-cyan:hover{border-color:var(--aurora-cyan);color:#fff;transform:translateY(-2px);box-shadow:0 10px 30px -10px var(--aurora-cyan-glow)}
    .aurora-btn-cyan:hover .aurora-glow{opacity:1;transform:translate(-50%,-50%) scale(1)}
    .aurora-btn-purple{border-color:rgba(168,85,247,0.3)}
    .aurora-btn-purple .aurora-glow{background:radial-gradient(circle,var(--aurora-purple) 0%,var(--aurora-purple-glow) 60%,transparent 80%)}
    .aurora-btn-purple:hover{border-color:var(--aurora-purple);color:#fff;transform:translateY(-2px);box-shadow:0 10px 30px -10px var(--aurora-purple-glow)}
    .aurora-btn-purple:hover .aurora-glow{opacity:1;transform:translate(-50%,-50%) scale(1)}
    .aurora-btn:active{transform:translateY(0px) scale(0.98)}
  </style>
</head>
<body>
  <div class="aurora-container">
    <button class="aurora-btn aurora-btn-gold"><span class="aurora-glow"></span><span class="aurora-label">Get Started Free</span></button>
    <button class="aurora-btn aurora-btn-cyan"><span class="aurora-glow"></span><span class="aurora-label">Explore Code</span></button>
    <button class="aurora-btn aurora-btn-purple"><span class="aurora-glow"></span><span class="aurora-label">Launch Studio</span></button>
  </div>
  <script>
    document.querySelectorAll('.aurora-btn').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        const glow = btn.querySelector('.aurora-glow');
        if (glow) glow.style.transform = 'translate(-50%, -50%) translate(' + ((x - 50) * 0.4) + 'px, ' + ((y - 50) * 0.4) + 'px) scale(1.1)';
      });
      btn.addEventListener('mouseleave', () => {
        const glow = btn.querySelector('.aurora-glow');
        if (glow) glow.style.transform = 'translate(-50%, -50%) scale(0.6)';
      });
    });
  </script>
</body>
</html>`,
    },
  },
  {
    id: "glass-motion-car",
    slug: "glass-motion-car",
    titleEn: "Glass Motion Card",
    titleZh: "玻璃动效卡片",
    productType: "React Component",
    pricingType: "premium",
    price: 5.99,
    currency: "USD",
    status: "published",
    homepageVisible: true,
    posterImageUrl: "",
    fileNames: ["GlassMotionCard.jsx", "glass-motion-card.css", "README.md", "LICENSE.txt"],
    protectedFiles: [
      {
        path: "GlassMotionCard.jsx",
        language: "jsx",
        content: "export function GlassMotionCard({ children, title }){ return <div className=\"glass-motion-card\"><div className=\"glass-motion-shine\"/><h3>{title}</h3>{children}</div>; }",
      },
      {
        path: "glass-motion-card.css",
        language: "css",
        content: ".glass-motion-card{position:relative;background:rgba(255,255,255,0.05);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:24px;transition:all .25s ease}.glass-motion-card:hover{transform:translateY(-4px);border-color:rgba(255,255,255,0.25)}",
      },
      {
        path: "README.md",
        language: "markdown",
        content: "# Glass Motion Card\n\nHigh-performance 3D glassmorphic card component with reactive motion.",
      },
      {
        path: "LICENSE.txt",
        language: "text",
        content: "STEA Code Commercial License. Permitted for use in unlimited commercial and personal projects.",
      },
    ],
    demoPreview: {
      mode: "full-html",
      fullDocument: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body{margin:0;height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 30% 20%,#1e293b,#0b0f17);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden;color:#fff}
  .gmc{position:relative;width:300px;padding:30px;background:rgba(255,255,255,.05);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.12);border-radius:20px;transition:transform .3s ease,box-shadow .3s ease,border-color .3s ease;overflow:hidden}
  .gmc:hover{transform:translateY(-6px) rotateX(2deg) rotateY(-2deg);box-shadow:0 30px 60px -20px rgba(245,166,35,.32);border-color:rgba(255,255,255,.25)}
  .shine{position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:linear-gradient(120deg,transparent 40%,rgba(245,166,35,.22) 50%,transparent 60%);transform:translateX(-100%);transition:transform .85s ease;pointer-events:none}
  .gmc:hover .shine{transform:translateX(100%)}
  .badge{display:inline-block;padding:5px 12px;background:rgba(245,166,35,.18);color:#f5a623;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
  .gmc h3{margin:14px 0 6px;font-size:19px;font-weight:700;color:#fff}
  .gmc p{margin:0 0 16px;color:#94a3b8;font-size:13px;line-height:1.55}
  .meta{display:flex;justify-content:space-between;align-items:center}
  .price{color:#f5a623;font-weight:800;font-size:16px}
  .cta{padding:8px 16px;background:#f5a623;color:#141000;border-radius:8px;font-size:12px;font-weight:800;border:0;cursor:pointer;transition:transform .15s ease}
  .cta:hover{transform:translateY(-1px)}
</style></head>
<body>
<div class="gmc">
  <div class="shine"></div>
  <span class="badge">Premium</span>
  <h3>Glass Motion Card</h3>
  <p>High-performance glassmorphic card with shine sweep and reactive 3D tilt on hover.</p>
  <div class="meta"><span class="price">$5.99</span><button class="cta">Get it</button></div>
</div>
</body></html>`,
    },
  },
  {
    id: "gradient-border-card",
    slug: "gradient-border-card",
    titleEn: "Gradient Border Card",
    titleZh: "渐变边框卡片",
    productType: "CSS Component",
    pricingType: "free",
    price: 0,
    currency: "USD",
    status: "published",
    homepageVisible: true,
    posterImageUrl: "",
    fileNames: ["index.html", "styles.css", "README.md", "LICENSE.txt"],
    publicFiles: [
      {
        path: "index.html",
        language: "html",
        content: "<div class=\"gb-card\"><span class=\"gb-shine\"></span><h3>Premium Plan</h3><p>Everything you need to ship faster.</p><button>Get started</button></div>",
      },
      {
        path: "styles.css",
        language: "css",
        content: ".gb-card{position:relative;width:280px;padding:28px;border-radius:18px;background:#0f172a;color:#e2e8f0;font-family:system-ui,sans-serif;overflow:hidden}.gb-card::before{content:'';position:absolute;inset:-2px;border-radius:20px;background:conic-gradient(from 0deg,#f5a623,#ec4899,#8b5cf6,#3b82f6,#f5a623);animation:gb-spin 4s linear infinite;z-index:-1}.gb-card::after{content:'';position:absolute;inset:0;border-radius:18px;background:#0f172a;z-index:-1}.gb-shine{position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:linear-gradient(45deg,transparent 40%,rgba(255,255,255,.08) 50%,transparent 60%);animation:gb-sweep 3s ease-in-out infinite}.gb-card h3{margin:0 0 8px;font-size:20px;color:#f5a623}.gb-card p{margin:0 0 16px;color:#94a3b8;font-size:13px}.gb-card button{padding:10px 18px;border:0;border-radius:10px;background:#f5a623;color:#0a0a0a;font-weight:700;cursor:pointer}@keyframes gb-spin{to{transform:rotate(360deg)}}@keyframes gb-sweep{0%{transform:translate(-30%,-30%)}100%{transform:translate(30%,30%)}}",
      },
      {
        path: "README.md",
        language: "markdown",
        content: "# Gradient Border Card\n\nCopy the CSS, wrap your card in a container with the .gb-card class, and let the conic-gradient border animate.",
      },
      {
        path: "LICENSE.txt",
        language: "text",
        content: "STEA Code free license for use in your projects.",
      },
    ],
    demoPreview: {
      mode: "full-html",
      width: 1440,
      height: 900,
      scaleMode: "fit",
      viewportMode: "desktop",
      fullDocument: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  html,body{margin:0;height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 50% 30%,#1e293b,#050810);font-family:system-ui,-apple-system,sans-serif;color:#e2e8f0}
  .gb-card{position:relative;width:300px;padding:32px;border-radius:20px;background:#0f172a;overflow:hidden;box-shadow:0 30px 80px -20px rgba(0,0,0,.7)}
  .gb-card::before{content:'';position:absolute;inset:-2px;border-radius:22px;background:conic-gradient(from 0deg,#f5a623,#ec4899,#8b5cf6,#3b82f6,#f5a623);animation:gb-spin 4s linear infinite;z-index:0}
  .gb-card::after{content:'';position:absolute;inset:1px;border-radius:19px;background:#0f172a;z-index:1}
  .gb-card > *{position:relative;z-index:2}
  .gb-shine{position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:linear-gradient(45deg,transparent 40%,rgba(255,255,255,.08) 50%,transparent 60%);animation:gb-sweep 3s ease-in-out infinite;z-index:1!important;pointer-events:none}
  .gb-card h3{margin:0 0 10px;font-size:22px;font-weight:800;color:#f5a623}
  .gb-card p{margin:0 0 20px;color:#94a3b8;font-size:14px;line-height:1.5}
  .gb-card button{padding:12px 22px;border:0;border-radius:12px;background:#f5a623;color:#0a0a0a;font-weight:800;font-size:14px;cursor:pointer;transition:transform .15s ease}
  .gb-card button:hover{transform:translateY(-2px)}
  @keyframes gb-spin{to{transform:rotate(360deg)}}
  @keyframes gb-sweep{0%{transform:translate(-30%,-30%)}100%{transform:translate(30%,30%)}}
</style></head>
<body>
<div class="gb-card">
  <span class="gb-shine"></span>
  <h3>Premium Plan</h3>
  <p>Everything you need to ship faster. Unlimited projects, priority support, and lifetime updates.</p>
  <button>Get started</button>
</div>
</body></html>`,
    },
  },
  {
    id: "gold-particle-vortex",
    slug: "gold-particle-vortex",
    titleEn: "Gold Particle Vortex",
    titleZh: "金色粒子漩涡",
    productType: "JavaScript Component",
    pricingType: "premium",
    price: 7.99,
    currency: "USD",
    status: "published",
    homepageVisible: true,
    posterImageUrl: "",
    fileNames: ["index.html", "styles.css", "vortex.js", "README.md", "LICENSE.txt"],
    protectedFiles: [
      {
        path: "index.html",
        language: "html",
        content: "<canvas id=\"vortex\"></canvas>\n<div class=\"vortex-ui\">\n  <span class=\"vortex-label\">LOADING</span>\n  <span class=\"vortex-pct\" id=\"pct\">0%</span>\n</div>",
      },
      {
        path: "styles.css",
        language: "css",
        content: "*{margin:0;padding:0;box-sizing:border-box}html,body{height:100vh;overflow:hidden;background:#070912;font-family:-apple-system,system-ui,sans-serif}#vortex{display:block;width:100%;height:100%;cursor:crosshair}.vortex-ui{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;z-index:2}.vortex-label{display:block;font-size:11px;font-weight:800;letter-spacing:.35em;color:rgba(245,166,35,.55);text-transform:uppercase;margin-bottom:6px}.vortex-pct{display:block;font-size:42px;font-weight:900;color:#f5a623;letter-spacing:-.03em;text-shadow:0 0 30px rgba(245,166,35,.45)}",
      },
      {
        path: "vortex.js",
        language: "javascript",
        content: "const canvas=document.getElementById('vortex'),ctx=canvas.getContext('2d');let W,H,cx,cy;const mouse={x:0,y:0,active:false};const PARTICLE_COUNT=220;const particles=[];function resize(){W=canvas.width=innerWidth;H=canvas.height=innerHeight;cx=W/2;cy=H/2}resize();addEventListener('resize',resize);addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;mouse.active=true});addEventListener('mouseleave',()=>mouse.active=false);class Particle{constructor(){this.reset(true)}reset(init){const a=Math.random()*Math.PI*2;const r=init?Math.random()*300:Math.random()*40+180;this.angle=a;this.radius=r;this.targetRadius=180+Math.random()*120;this.x=cx+Math.cos(a)*r;this.y=cy+Math.sin(a)*r;this.vx=0;this.vy=0;this.size=Math.random()*2.5+1;this.life=init?Math.random():0;this.speed=.008+Math.random()*.012;this.hue=38+Math.random()*12}update(t){this.angle+=this.speed;const spiralR=this.radius+Math.sin(t*.001+this.angle*3)*8;let tx=cx+Math.cos(this.angle)*spiralR;let ty=cy+Math.sin(this.angle)*spiralR;if(mouse.active){const dx=mouse.x-this.x;const dy=mouse.y-this.y;const d=Math.hypot(dx,dy);if(d<180){const f=(1-d/180)*.5;tx+=dx/d*f*40;ty+=dy/d*f*40}}this.vx+=(tx-this.x)*.06;this.vy+=(ty-this.y)*.06;this.vx*=.88;this.vy*=.88;this.x+=this.vx;this.y+=this.vy;this.life+=.004;if(this.life>1)this.reset(false)}draw(ctx){const alpha=1-Math.abs(this.life-.5)*2;ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.fillStyle=`hsla(${this.hue},95%,62%,${alpha})`;ctx.shadowBlur=12;ctx.shadowColor=`hsla(${this.hue},95%,62%,${alpha*.8})`;ctx.fill()}}for(let i=0;i<PARTICLE_COUNT;i++)particles.push(new Particle());const pctEl=document.getElementById('pct');let progress=0;function updatePct(t){progress=Math.floor((t%4000)/4000*100);pctEl.textContent=progress+'%'}function drawCore(ctx,t){const pulse=1+Math.sin(t*.002)*.08;const r=38*pulse;const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,'rgba(255,217,102,1)');g.addColorStop(.4,'rgba(245,166,35,.85)');g.addColorStop(1,'rgba(196,134,26,0)');ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=g;ctx.shadowBlur=60;ctx.shadowColor='rgba(245,166,35,.6)';ctx.fill()}function loop(t){ctx.fillStyle='rgba(7,9,18,.18)';ctx.fillRect(0,0,W,H);ctx.shadowBlur=0;particles.forEach(p=>{p.update(t);p.draw(ctx)});drawCore(ctx,t);updatePct(t);requestAnimationFrame(loop)}requestAnimationFrame(loop);",
      },
      {
        path: "README.md",
        language: "markdown",
        content: "# Gold Particle Vortex\n\nA premium canvas-based loading animation. 220 gold particles spiral around a pulsing core, react to the cursor, and leave glowing trails.\n\n## Setup\n\nLink `styles.css`, add the HTML markup, then include `vortex.js`.\n\n## Customise\n\n- `PARTICLE_COUNT` — density of the vortex\n- `this.speed` — rotation velocity per particle\n- `this.hue` — colour range (38–50 = gold/amber)\n- Trail length: adjust the `rgba(7,9,18,.18)` fill alpha (lower = longer trails)",
      },
      {
        path: "LICENSE.txt",
        language: "text",
        content: "STEA Code personal license. Redistribution as a standalone product is not permitted.",
      },
    ],
    demoPreview: {
      mode: "full-html",
      width: 1440,
      height: 900,
      scaleMode: "fit",
      viewportMode: "desktop",
      fullDocument: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{height:100vh;overflow:hidden;background:#070912;font-family:-apple-system,system-ui,sans-serif}
  #vortex{display:block;width:100%;height:100%;cursor:crosshair}
  .vortex-ui{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;z-index:2}
  .vortex-label{display:block;font-size:11px;font-weight:800;letter-spacing:.35em;color:rgba(245,166,35,.55);text-transform:uppercase;margin-bottom:6px}
  .vortex-pct{display:block;font-size:42px;font-weight:900;color:#f5a623;letter-spacing:-.03em;text-shadow:0 0 30px rgba(245,166,35,.45)}
  .vortex-hint{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);font-size:10px;letter-spacing:.2em;color:rgba(255,255,255,.25);text-transform:uppercase;pointer-events:none}
</style></head>
<body>
<canvas id="vortex"></canvas>
<div class="vortex-ui">
  <span class="vortex-label">Loading</span>
  <span class="vortex-pct" id="pct">0%</span>
</div>
<div class="vortex-hint">Move cursor to interact</div>
<script>
(function(){
  var canvas=document.getElementById('vortex'),ctx=canvas.getContext('2d');
  var W,H,cx,cy;
  var mouse={x:0,y:0,active:false};
  var PC=240,particles=[];
  function resize(){W=canvas.width=innerWidth;H=canvas.height=innerHeight;cx=W/2;cy=H/2}
  resize();addEventListener('resize',resize);
  addEventListener('mousemove',function(e){mouse.x=e.clientX;mouse.y=e.clientY;mouse.active=true});
  addEventListener('mouseleave',function(){mouse.active=false});

  function Particle(){this.reset(true)}
  Particle.prototype.reset=function(init){
    var a=Math.random()*Math.PI*2;
    var r=init?Math.random()*320:Math.random()*40+200;
    this.angle=a;
    this.radius=r;
    this.x=cx+Math.cos(a)*r;
    this.y=cy+Math.sin(a)*r;
    this.vx=0;this.vy=0;
    this.size=Math.random()*2.5+1;
    this.life=init?Math.random():0;
    this.speed=.006+Math.random()*.014;
    this.hue=38+Math.random()*14;
    this.baseR=r;
  };
  Particle.prototype.update=function(t){
    this.angle+=this.speed;
    var spiralR=this.baseR+Math.sin(t*.0008+this.angle*3)*12;
    var tx=cx+Math.cos(this.angle)*spiralR;
    var ty=cy+Math.sin(this.angle)*spiralR;
    if(mouse.active){
      var dx=mouse.x-this.x,dy=mouse.y-this.y;
      var d=Math.sqrt(dx*dx+dy*dy);
      if(d<200){
        var f=(1-d/200)*.6;
        tx+=dx/(d||1)*f*50;
        ty+=dy/(d||1)*f*50;
      }
    }
    this.vx+=(tx-this.x)*.055;
    this.vy+=(ty-this.y)*.055;
    this.vx*=.87;this.vy*=.87;
    this.x+=this.vx;this.y+=this.vy;
    this.life+=.0035;
    if(this.life>1)this.reset(false);
  };
  Particle.prototype.draw=function(ctx){
    var alpha=1-Math.abs(this.life-.5)*2;
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.size,0,Math.PI*2);
    ctx.fillStyle='hsla('+this.hue+',95%,62%,'+alpha+')';
    ctx.shadowBlur=12;
    ctx.shadowColor='hsla('+this.hue+',95%,62%,'+(alpha*.8)+')';
    ctx.fill();
  };

  for(var i=0;i<PC;i++)particles.push(new Particle());

  var pctEl=document.getElementById('pct');
  function updatePct(t){
    var p=Math.floor((t%4500)/4500*100);
    pctEl.textContent=p+'%';
  }

  function drawCore(ctx,t){
    var pulse=1+Math.sin(t*.002)*.1;
    var r=42*pulse;
    var g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    g.addColorStop(0,'rgba(255,217,102,1)');
    g.addColorStop(.35,'rgba(245,166,35,.8)');
    g.addColorStop(1,'rgba(196,134,26,0)');
    ctx.beginPath();
    ctx.arc(cx,cy,r,0,Math.PI*2);
    ctx.fillStyle=g;
    ctx.shadowBlur=60;
    ctx.shadowColor='rgba(245,166,35,.55)';
    ctx.fill();
  }

  function loop(t){
    ctx.fillStyle='rgba(7,9,18,.16)';
    ctx.fillRect(0,0,W,H);
    ctx.shadowBlur=0;
    for(var i=0;i<PC;i++){particles[i].update(t);particles[i].draw(ctx)}
    drawCore(ctx,t);
    updatePct(t);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
</script>
</body></html>`,
    },
  },
  {
    id: "aurora-landing-page",
    slug: "aurora-landing-page",
    titleEn: "Aurora Landing Page",
    titleZh: "极光着陆页",
    productType: "HTML Template",
    pricingType: "premium",
    price: 9.99,
    currency: "USD",
    status: "published",
    homepageVisible: true,
    posterImageUrl: "",
    fileNames: ["index.html", "styles.css", "aurora.js", "README.md", "LICENSE.txt"],
    protectedFiles: [
      {
        path: "index.html",
        language: "html",
        content: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<link rel=\"stylesheet\" href=\"styles.css\">\n<title>Aurora — Animated Landing Page</title>\n</head>\n<body>\n<canvas id=\"aurora-canvas\"></canvas>\n<div class=\"aurora-overlay\"></div>\n<main class=\"aurora-content\">\n<section class=\"aurora-hero\">\n<div class=\"aurora-badge\">PREMIUM TEMPLATE</div>\n<h1 class=\"aurora-title\">Build the <span class=\"aurora-gold\">Future</span> of Africa</h1>\n<p class=\"aurora-subtitle\">A premium animated landing page with flowing aurora gradients, shimmer text effects, and glassmorphism cards. Zero dependencies — pure HTML, CSS, and Canvas.</p>\n<div class=\"aurora-cta-row\">\n<button class=\"aurora-btn-primary\">Get Started</button>\n<button class=\"aurora-btn-ghost\">Live Demo</button>\n</div>\n</section>\n<section class=\"aurora-features\">\n<div class=\"aurora-card\"><div class=\"aurora-card-icon\">01</div><h3>Canvas Aurora</h3><p>Flowing gradient bands rendered on a Canvas element with per-frame noise.</p></div>\n<div class=\"aurora-card\"><div class=\"aurora-card-icon\">02</div><h3>Shimmer Text</h3><p>Gold shimmer sweep across hero text using CSS gradient animation.</p></div>\n<div class=\"aurora-card\"><div class=\"aurora-card-icon\">03</div><h3>Glass Cards</h3><p>Backdrop-blur feature cards with subtle gold borders and hover lift.</p></div>\n</section>\n</main>\n<script src=\"aurora.js\"></script>\n</body>\n</html>",
      },
      {
        path: "styles.css",
        language: "css",
        content: "*{margin:0;padding:0;box-sizing:border-box}\n:root{--gold:#f5a623;--gold-light:#ffd966;--bg:#0a0b12;--surface:rgba(255,255,255,.04)}\nhtml,body{height:100%;background:var(--bg);color:#e8eaed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow-x:hidden}\n#aurora-canvas{position:fixed;inset:0;width:100%;height:100%;z-index:0}\n.aurora-overlay{position:fixed;inset:0;background:radial-gradient(ellipse at 50% 30%,transparent 0%,var(--bg) 80%);z-index:1}\n.aurora-content{position:relative;z-index:2;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 24px}\n.aurora-hero{text-align:center;max-width:680px}\n.aurora-badge{display:inline-block;padding:5px 14px;border:1px solid rgba(245,166,35,.3);border-radius:999px;background:rgba(245,166,35,.08);color:var(--gold);font-size:10px;font-weight:800;letter-spacing:.18em;margin-bottom:24px}\n.aurora-title{font-size:clamp(36px,6vw,64px);font-weight:900;letter-spacing:-.03em;line-height:1.05;margin-bottom:18px;background:linear-gradient(135deg,#fff 0%,#fff 60%,var(--gold-light) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}\n.aurora-gold{background:linear-gradient(90deg,var(--gold),var(--gold-light),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 3s linear infinite;background-size:200% auto}\n@keyframes shimmer{to{background-position:200% center}}\n.aurora-subtitle{color:#8b8f9b;font-size:16px;line-height:1.6;margin-bottom:32px;max-width:520px;margin-left:auto;margin-right:auto}\n.aurora-cta-row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}\n.aurora-btn-primary{padding:13px 28px;border:0;border-radius:8px;background:linear-gradient(135deg,var(--gold),#c4861a);color:#0a0b12;font-size:14px;font-weight:800;cursor:pointer;transition:transform .2s,box-shadow .2s}\n.aurora-btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(245,166,35,.3)}\n.aurora-btn-ghost{padding:13px 28px;border:1px solid rgba(255,255,255,.15);border-radius:8px;background:transparent;color:#e8eaed;font-size:14px;font-weight:700;cursor:pointer;transition:border-color .2s,background .2s}\n.aurora-btn-ghost:hover{border-color:rgba(245,166,35,.4);background:rgba(245,166,35,.05)}\n.aurora-features{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:64px;max-width:800px;width:100%}\n.aurora-card{background:var(--surface);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:24px;text-align:left;transition:border-color .25s,transform .25s}\n.aurora-card:hover{border-color:rgba(245,166,35,.2);transform:translateY(-4px)}\n.aurora-card-icon{font-size:22px;font-weight:900;color:var(--gold);margin-bottom:12px}\n.aurora-card h3{font-size:15px;font-weight:800;margin-bottom:6px;color:#fff}\n.aurora-card p{font-size:13px;color:#8b8f9b;line-height:1.5}\n@media(max-width:640px){.aurora-features{grid-template-columns:1fr}}",
      },
      {
        path: "aurora.js",
        language: "javascript",
        content: "(function(){\nvar canvas=document.getElementById('aurora-canvas');\nvar ctx=canvas.getContext('2d');\nvar W,H,cx,cy;\nfunction resize(){W=canvas.width=innerWidth;H=canvas.height=innerHeight;cx=W/2;cy=H/2}\nresize();addEventListener('resize',resize);\nvar t=0;\nvar colors=[[124,255,103],[180,151,207],[82,39,255],[245,166,35]];\nfunction noise(x,y,scale){return (Math.sin(x*0.7+scale)+Math.cos(y*0.5+scale*1.3))*0.5}\nfunction drawBand(bandT,offsetY,amplitude,colorIdx,speed){\nvar c=colors[colorIdx%colors.length];\nvar grad=ctx.createLinearGradient(0,offsetY-100,0,offsetY+100);\ngrad.addColorStop(0,'rgba('+c[0]+','+c[1]+','+c[2]+',0)');\ngrad.addColorStop(0.5,'rgba('+c[0]+','+c[1]+','+c[2]+',0.12)');\ngrad.addColorStop(1,'rgba('+c[0]+','+c[1]+','+c[2]+',0)');\nctx.fillStyle=grad;\nctx.beginPath();\nctx.moveTo(0,H);\nfor(var x=0;x<=W;x+=4){var n=noise(x*0.003,bandT*speed,bandT)*amplitude;var y=offsetY+Math.sin(x*0.005+bandT*speed)*n*40;ctx.lineTo(x,y)}\nctx.lineTo(W,H);\nctx.closePath();\nctx.fill()\n}\nfunction loop(){ctx.fillStyle='rgba(10,11,18,0.06)';ctx.fillRect(0,0,W,H);t+=0.005;drawBand(t,cy-80,1,0,0.3);drawBand(t*1.3,cy+20,0.8,1,0.4);drawBand(t*0.8,cy+120,0.6,2,0.25);drawBand(t*1.1,cy-160,0.5,3,0.35);requestAnimationFrame(loop)}\nloop()\n})();",
      },
      {
        path: "README.md",
        language: "markdown",
        content: "# Aurora Landing Page\n\nA premium animated landing page template with flowing aurora gradients, gold shimmer text, and glassmorphism cards.\n\n## Setup\n\n1. Open `index.html` in a browser, or serve the folder with any static server.\n2. All three files (`index.html`, `styles.css`, `aurora.js`) must be in the same directory.\n\n## Customization\n\n- **Colors**: Edit the CSS variables in `:root` at the top of `styles.css`.\n- **Aurora bands**: Edit the `colors` array and `drawBand()` calls in `aurora.js`.\n- **Text**: Edit the HTML in `index.html`.\n- **Speed**: Change the `t+=0.005` value in `aurora.js`.\n\n## License\n\nSTEA Code personal license. Not for resale as a standalone product.",
      },
      {
        path: "LICENSE.txt",
        language: "text",
        content: "STEA Code personal license. Redistribution as a standalone product is not permitted.",
      },
    ],
    demoPreview: {
      mode: "full-html",
      fullDocument: `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--gold:#f5a623;--gold-light:#ffd966;--bg:#0a0b12;--surface:rgba(255,255,255,.04)}
html,body{height:100vh;background:var(--bg);color:#e8eaed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden}
#c{position:fixed;inset:0;width:100%;height:100%;z-index:0}
.ov{position:fixed;inset:0;background:radial-gradient(ellipse at 50% 30%,transparent 0%,var(--bg) 80%);z-index:1}
.ct{position:relative;z-index:2;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px}
.h{text-align:center;max-width:600px}
.b{display:inline-block;padding:5px 14px;border:1px solid rgba(245,166,35,.3);border-radius:999px;background:rgba(245,166,35,.08);color:var(--gold);font-size:10px;font-weight:800;letter-spacing:.18em;margin-bottom:20px}
.t{font-size:clamp(32px,5vw,56px);font-weight:900;letter-spacing:-.03em;line-height:1.05;margin-bottom:16px;background:linear-gradient(135deg,#fff 0%,#fff 60%,var(--gold-light) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.g{background:linear-gradient(90deg,var(--gold),var(--gold-light),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:sh 3s linear infinite;background-size:200% auto}
@keyframes sh{to{background-position:200% center}}
.s{color:#8b8f9b;font-size:14px;line-height:1.6;margin-bottom:28px;max-width:460px;margin-left:auto;margin-right:auto}
.r{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.p{padding:12px 24px;border:0;border-radius:8px;background:linear-gradient(135deg,var(--gold),#c4861a);color:#0a0b12;font-size:13px;font-weight:800;cursor:pointer;transition:transform .2s,box-shadow .2s}
.p:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(245,166,35,.3)}
.q{padding:12px 24px;border:1px solid rgba(255,255,255,.15);border-radius:8px;background:transparent;color:#e8eaed;font-size:13px;font-weight:700;cursor:pointer}
.f{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:40px;max-width:700px;width:100%}
.d{background:var(--surface);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:18px;text-align:left;transition:border-color .25s,transform .25s}
.d:hover{border-color:rgba(245,166,35,.2);transform:translateY(-3px)}
.d i{font-style:normal;font-size:20px;font-weight:900;color:var(--gold);display:block;margin-bottom:8px}
.d h3{font-size:13px;font-weight:800;margin-bottom:4px;color:#fff}
.d p{font-size:11px;color:#8b8f9b;line-height:1.4}
@media(max-width:640px){.f{grid-template-columns:1fr}}
</style></head>
<body>
<canvas id="c"></canvas>
<div class="ov"></div>
<main class="ct">
<section class="h">
<div class="b">PREMIUM TEMPLATE</div>
<h1 class="t">Build the <span class="g">Future</span> of Africa</h1>
<p class="s">A premium animated landing page with flowing aurora gradients, shimmer text effects, and glassmorphism cards.</p>
<div class="r">
<button class="p">Get Started</button>
<button class="q">Live Demo</button>
</div>
</section>
<section class="f">
<div class="d"><i>01</i><h3>Canvas Aurora</h3><p>Flowing gradient bands with per-frame noise.</p></div>
<div class="d"><i>02</i><h3>Shimmer Text</h3><p>Gold sweep via CSS gradient animation.</p></div>
<div class="d"><i>03</i><h3>Glass Cards</h3><p>Backdrop-blur cards with gold borders.</p></div>
</section>
</main>
<script>
(function(){
var canvas=document.getElementById('c');
var ctx=canvas.getContext('2d');
var W,H,cx,cy;
function resize(){W=canvas.width=innerWidth;H=canvas.height=innerHeight;cx=W/2;cy=H/2}
resize();addEventListener('resize',resize);
var t=0;
var colors=[[124,255,103],[180,151,207],[82,39,255],[245,166,35]];
function noise(x,y,s){return(Math.sin(x*0.7+s)+Math.cos(y*0.5+s*1.3))*0.5}
function band(bt,oy,amp,ci,sp){
var c=colors[ci%colors.length];
var g=ctx.createLinearGradient(0,oy-100,0,oy+100);
g.addColorStop(0,'rgba('+c[0]+','+c[1]+','+c[2]+',0)');
g.addColorStop(0.5,'rgba('+c[0]+','+c[1]+','+c[2]+',0.12)');
g.addColorStop(1,'rgba('+c[0]+','+c[1]+','+c[2]+',0)');
ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,H);
for(var x=0;x<=W;x+=4){var n=noise(x*0.003,bt*sp,bt)*amp;var y=oy+Math.sin(x*0.005+bt*sp)*n*40;ctx.lineTo(x,y)}
ctx.lineTo(W,H);ctx.closePath();ctx.fill()
}
function loop(){ctx.fillStyle='rgba(10,11,18,0.06)';ctx.fillRect(0,0,W,H);t+=0.005;band(t,cy-80,1,0,0.3);band(t*1.3,cy+20,0.8,1,0.4);band(t*0.8,cy+120,0.6,2,0.25);band(t*1.1,cy-160,0.5,3,0.35);requestAnimationFrame(loop)}
loop()
})();
</script>
</body></html>`,
    },
  },
];

export function getSteaCodeServerProduct(productId) {
  const id = String(productId || "").trim();

  return (
    STEA_CODE_SERVER_PRODUCTS.find(
      (product) => product.id === id || product.slug === id
    ) || null
  );
}
