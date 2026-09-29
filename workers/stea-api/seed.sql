-- STEA Code: Firestore → D1 migration
-- Generated: 2026-09-24T14:53:57.132Z
-- INSERT OR REPLACE for all migrated docs

INSERT OR REPLACE INTO previews (productId, runtime, html, css, javascript, jsx, tsx, fullDocument, baseUrl, externalUrl, updatedAt, updatedBy) VALUES ('b', 'html-css-js', '', '', '', '', '', '', '', '', '2026-09-23T16:28:27.102Z', 'c8LbLPMO5GYlgW5IxFSzXLq5bjz2');
INSERT OR REPLACE INTO previews (productId, runtime, html, css, javascript, jsx, tsx, fullDocument, baseUrl, externalUrl, updatedAt, updatedBy) VALUES ('glass-motion-car', 'full-html', '', '', '', '', '', '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Prism Glass Card</title>

  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      min-height: 100vh;
      display: grid;
      place-items: center;
      overflow: hidden;
      background:
        radial-gradient(circle at 20% 20%, rgba(34, 211, 238, 0.16), transparent 32%),
        radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.18), transparent 34%),
        #050816;
      font-family: Inter, Arial, sans-serif;
      color: white;
    }

    .scene {
      perspective: 1100px;
      width: min(92vw, 420px);
    }

    .card-shell {
      position: relative;
      border-radius: 30px;
      padding: 2px;
      background:
        conic-gradient(
          from var(--angle),
          #22d3ee,
          #3b82f6,
          #8b5cf6,
          #ec4899,
          #22d3ee
        );
      animation: borderSpin 5s linear infinite;
      box-shadow:
        0 30px 80px rgba(0, 0, 0, 0.45),
        0 0 50px rgba(99, 102, 241, 0.15);
    }

    .card {
      position: relative;
      min-height: 500px;
      border-radius: 28px;
      overflow: hidden;
      padding: 28px;
      background:
        linear-gradient(
          145deg,
          rgba(16, 24, 48, 0.92),
          rgba(7, 10, 24, 0.97)
        );
      backdrop-filter: blur(22px);
      transform-style: preserve-3d;
      transition:
        transform 0.18s ease,
        box-shadow 0.3s ease;
      will-change: transform;
    }

    .card::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(
          120deg,
          transparent 20%,
          rgba(255, 255, 255, 0.08) 40%,
          transparent 60%
        );
      transform: translateX(-120%);
      animation: sweep 4.5s ease-in-out infinite;
      pointer-events: none;
    }

    .glow-one,
    .glow-two {
      position: absolute;
      width: 190px;
      height: 190px;
      border-radius: 50%;
      filter: blur(48px);
      opacity: 0.45;
      pointer-events: none;
    }

    .glow-one {
      top: -55px;
      right: -40px;
      background: rgba(34, 211, 238, 0.65);
      animation: driftOne 6s ease-in-out infinite;
    }

    .glow-two {
      bottom: -65px;
      left: -45px;
      background: rgba(168, 85, 247, 0.65);
      animation: driftTwo 7s ease-in-out infinite;
    }

    .top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      position: relative;
      z-index: 2;
      transform: translateZ(30px);
    }

    .badge {
      padding: 8px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #c4f1ff;
    }

    .status-dot {
      width: 11px;
      height: 11px;
      border-radius: 50%;
      background: #67e8f9;
      box-shadow:
        0 0 8px #67e8f9,
        0 0 18px rgba(103, 232, 249, 0.8);
      animation: pulse 1.8s ease-in-out infinite;
    }

    .visual {
      margin-top: 30px;
      height: 210px;
      position: relative;
      display: grid;
      place-items: center;
      transform: translateZ(50px);
    }

    .orb {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background:
        radial-gradient(circle at 35% 30%, #ffffff 0 4%, transparent 5%),
        radial-gradient(
          circle at 40% 40%,
          #67e8f9,
          #6366f1 45%,
          #7c3aed 72%,
          #111827 100%
        );
      box-shadow:
        inset -22px -22px 45px rgba(0, 0, 0, 0.32),
        0 0 45px rgba(99, 102, 241, 0.45),
        0 0 85px rgba(34, 211, 238, 0.18);
      animation: orbFloat 4s ease-in-out infinite;
    }

    .ring {
      position: absolute;
      width: 205px;
      height: 82px;
      border: 2px solid rgba(125, 211, 252, 0.5);
      border-radius: 50%;
      transform: rotateX(68deg) rotateZ(-14deg);
      box-shadow: 0 0 20px rgba(34, 211, 238, 0.22);
      animation: ringRotate 6s linear infinite;
    }

    .copy {
      position: relative;
      z-index: 2;
      transform: translateZ(35px);
    }

    h1 {
      font-size: clamp(28px, 6vw, 42px);
      line-height: 1;
      letter-spacing: -0.04em;
      margin-bottom: 12px;
    }

    p {
      color: #aab4c8;
      line-height: 1.65;
      font-size: 14px;
    }

    .footer {
      position: relative;
      z-index: 2;
      margin-top: 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      transform: translateZ(40px);
    }

    .metric strong {
      display: block;
      font-size: 18px;
      margin-bottom: 3px;
    }

    .metric span {
      color: #778299;
      font-size: 12px;
    }

    .button {
      border: 0;
      border-radius: 16px;
      padding: 14px 18px;
      color: #07111f;
      background:
        linear-gradient(135deg, #67e8f9, #a78bfa);
      font-weight: 800;
      cursor: pointer;
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
      box-shadow: 0 10px 28px rgba(99, 102, 241, 0.25);
    }

    .button:hover {
      transform: translateY(-3px) scale(1.03);
      box-shadow: 0 16px 34px rgba(99, 102, 241, 0.35);
    }

    .button:active {
      transform: scale(0.97);
    }

    @property --angle {
      syntax: "<angle>";
      initial-value: 0deg;
      inherits: false;
    }

    @keyframes borderSpin {
      to {
        --angle: 360deg;
      }
    }

    @keyframes sweep {
      0% {
        transform: translateX(-120%);
      }

      45%,
      100% {
        transform: translateX(140%);
      }
    }

    @keyframes pulse {
      0%,
      100% {
        transform: scale(0.85);
        opacity: 0.6;
      }

      50% {
        transform: scale(1.25);
        opacity: 1;
      }
    }

    @keyframes orbFloat {
      0%,
      100% {
        transform: translateY(0) rotate(0deg);
      }

      50% {
        transform: translateY(-14px) rotate(8deg);
      }
    }

    @keyframes ringRotate {
      from {
        transform: rotateX(68deg) rotateZ(-14deg);
      }

      to {
        transform: rotateX(68deg) rotateZ(346deg);
      }
    }

    @keyframes driftOne {
      0%,
      100% {
        transform: translate(0, 0);
      }

      50% {
        transform: translate(-30px, 25px);
      }
    }

    @keyframes driftTwo {
      0%,
      100% {
        transform: translate(0, 0);
      }

      50% {
        transform: translate(28px, -20px);
      }
    }

    @media (max-width: 480px) {
      .card {
        min-height: 470px;
        padding: 22px;
      }

      .visual {
        height: 190px;
      }

      .orb {
        width: 130px;
        height: 130px;
      }

      .ring {
        width: 180px;
        height: 72px;
      }
    }
  </style>
</head>

<body>
  <div class="scene">
    <div class="card-shell">
      <article class="card" id="prismCard">
        <div class="glow-one"></div>
        <div class="glow-two"></div>

        <div class="top-row">
          <span class="badge">STEA Motion</span>
          <span class="status-dot"></span>
        </div>

        <div class="visual">
          <div class="ring"></div>
          <div class="orb"></div>
        </div>

        <div class="copy">
          <h1>Prism Glass</h1>

          <p>
            A responsive interactive card with 3D tilt, animated light,
            rotating gradients and layered depth.
          </p>
        </div>

        <div class="footer">
          <div class="metric">
            <strong>60 FPS</strong>
            <span>Interactive motion</span>
          </div>

          <button class="button" id="actionButton">
            Explore
          </button>
        </div>
      </article>
    </div>
  </div>

  <script>
    const card = document.getElementById("prismCard");
    const button = document.getElementById("actionButton");

    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateY = ((x - centerX) / centerX) * 8;
      const rotateX = ((centerY - y) / centerY) * 8;

      card.style.transform =
        `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform =
        "rotateX(0deg) rotateY(0deg)";
    });

    button.addEventListener("click", () => {
      const original = button.textContent;

      button.textContent = "Activated ✦";

      setTimeout(() => {
        button.textContent = original;
      }, 1000);
    });
  </script>
</body>
</html>', '', '', '2026-09-07T00:17:54.569Z', 'c8LbLPMO5GYlgW5IxFSzXLq5bjz2');
INSERT OR REPLACE INTO previews (productId, runtime, html, css, javascript, jsx, tsx, fullDocument, baseUrl, externalUrl, width, height, viewportMode, scaleMode, enabled, updatedAt, updatedBy) VALUES ('glow-button-effect', 'html-css-js', '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Premium Animated Button</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    width: 100%;
    height: 100%;
    background: transparent;
    display: grid;
    place-items: center;
    font-family: ''Inter'', system-ui, -apple-system, sans-serif;
    overflow: hidden;
  }

  .premium-btn-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 50px;
  }

  /* ── The button ──────────────────────────────────────────── */
  .premium-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 14px;
    padding: 20px 44px;
    border: 0;
    border-radius: 999px;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: #0a0a0f;
    cursor: pointer;
    background: linear-gradient(
      135deg,
      #ffe29a 0%,
      #ffd86b 25%,
      #f5a623 55%,
      #d98a12 100%
    );
    background-size: 200% 200%;
    isolation: isolate;
    overflow: hidden;
    transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
                box-shadow 0.28s ease;
    animation: gradientShift 5s ease infinite;
    box-shadow:
      0 0 50px -6px rgba(245, 166, 35, 0.75),
      0 0 24px -4px rgba(245, 166, 35, 0.55),
      0 8px 22px -6px rgba(0, 0, 0, 0.55);
  }

  @keyframes gradientShift {
    0%, 100% { background-position: 0% 50%; }
    50%      { background-position: 100% 50%; }
  }

  /* ── Shimmer sweeping across the surface ─────────────────── */
  .premium-btn::before {
    content: '''';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
      115deg,
      transparent 30%,
      rgba(255, 255, 255, 0.6) 50%,
      transparent 70%
    );
    transform: translateX(-150%);
    animation: shimmer 3.6s ease-in-out infinite;
    pointer-events: none;
    z-index: 2;
  }

  @keyframes shimmer {
    0%   { transform: translateX(-150%); }
    55%  { transform: translateX(150%); }
    100% { transform: translateX(150%); }
  }

  /* ── Inner top highlight for depth ───────────────────────── */
  .premium-btn__highlight {
    position: absolute;
    inset: 1px;
    border-radius: inherit;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.45) 0%,
      rgba(255, 255, 255, 0) 45%
    );
    pointer-events: none;
    z-index: 1;
  }

  /* ── Outer pulsing halo ──────────────────────────────────── */
  .premium-btn__halo {
    position: absolute;
    inset: -8px;
    border-radius: inherit;
    background: linear-gradient(135deg, #ffd86b, #f5a623, #d98a12);
    filter: blur(24px);
    opacity: 0.55;
    z-index: -1;
    animation: halo 2.6s ease-in-out infinite;
    pointer-events: none;
  }

  @keyframes halo {
    0%, 100% { opacity: 0.4; transform: scale(0.97); }
    50%      { opacity: 0.85; transform: scale(1.06); }
  }

  /* ── Floating spark particles ────────────────────────────── */
  .premium-btn__sparks {
    position: absolute;
    inset: -30px;
    pointer-events: none;
    z-index: 3;
  }

  .premium-btn__spark {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #fff5c9;
    box-shadow:
      0 0 8px 2px rgba(255, 233, 150, 0.9),
      0 0 14px 3px rgba(245, 166, 35, 0.5);
    opacity: 0;
    animation: spark 3.2s ease-out infinite;
  }

  .premium-btn__spark:nth-child(1) { animation-delay: 0s;   --angle: 0deg;   --dist: 110px; }
  .premium-btn__spark:nth-child(2) { animation-delay: 0.5s; --angle: 60deg;  --dist: 120px; }
  .premium-btn__spark:nth-child(3) { animation-delay: 1.0s; --angle: 120deg; --dist: 100px; }
  .premium-btn__spark:nth-child(4) { animation-delay: 1.5s; --angle: 180deg; --dist: 115px; }
  .premium-btn__spark:nth-child(5) { animation-delay: 2.0s; --angle: 240deg; --dist: 105px; }
  .premium-btn__spark:nth-child(6) { animation-delay: 2.5s; --angle: 300deg; --dist: 118px; }

  @keyframes spark {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0) scale(0.4);
    }
    15% { opacity: 1; }
    100% {
      opacity: 0;
      transform: translate(-50%, -50%) rotate(var(--angle)) translateX(var(--dist)) scale(0.2);
    }
  }

  /* ── Label + arrow ──────────────────────────────────────── */
  .premium-btn__label {
    position: relative;
    z-index: 4;
  }

  .premium-btn__icon {
    position: relative;
    z-index: 4;
    display: inline-flex;
    width: 18px;
    height: 18px;
    transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .premium-btn:hover .premium-btn__icon {
    transform: translateX(4px);
  }

  .premium-btn__icon svg {
    width: 100%;
    height: 100%;
  }

  /* ── Hover / active states ───────────────────────────────── */
  .premium-btn:hover {
    transform: translateY(-3px) scale(1.03);
    box-shadow:
      0 0 70px -6px rgba(245, 166, 35, 1),
      0 0 34px -4px rgba(245, 166, 35, 0.75),
      0 14px 30px -6px rgba(0, 0, 0, 0.6);
  }

  .premium-btn:active {
    transform: translateY(0) scale(0.98);
  }

  /* ── Click ripple ────────────────────────────────────────── */
  .premium-btn__ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.55);
    transform: translate(-50%, -50%) scale(0);
    animation: rippleAnim 0.7s ease-out forwards;
    pointer-events: none;
    z-index: 3;
  }

  @keyframes rippleAnim {
    to {
      transform: translate(-50%, -50%) scale(4);
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .premium-btn,
    .premium-btn::before,
    .premium-btn__halo,
    .premium-btn__spark {
      animation: none !important;
    }
    .premium-btn { transition: none; }
    .premium-btn:hover { transform: none; }
    .premium-btn:hover .premium-btn__icon { transform: none; }
  }
</style>
</head>
<body>

  <div class="premium-btn-wrap">
    <button class="premium-btn" type="button">
      <span class="premium-btn__halo" aria-hidden="true"></span>

      <span class="premium-btn__sparks" aria-hidden="true">
        <span class="premium-btn__spark"></span>
        <span class="premium-btn__spark"></span>
        <span class="premium-btn__spark"></span>
        <span class="premium-btn__spark"></span>
        <span class="premium-btn__spark"></span>
        <span class="premium-btn__spark"></span>
      </span>

      <span class="premium-btn__highlight" aria-hidden="true"></span>

      <span class="premium-btn__label">Get Started</span>
      <span class="premium-btn__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14M13 5l7 7-7 7"/>
        </svg>
      </span>
    </button>
  </div>

  <script>
    const btn = document.querySelector(''.premium-btn'');
    btn.addEventListener(''click'', (e) => {
      const rect = btn.getBoundingClientRect();
      const r = document.createElement(''span'');
      r.className = ''premium-btn__ripple'';
      const size = Math.max(rect.width, rect.height);
      r.style.width = r.style.height = size + ''px'';
      r.style.left = (e.clientX - rect.left) + ''px'';
      r.style.top = (e.clientY - rect.top) + ''px'';
      btn.appendChild(r);
      setTimeout(() => r.remove(), 750);
    });
  </script>

</body>
</html>', '', '', '', '', '', '', '', 1440, 900, 'desktop', 'fit', 1, '2026-09-24T01:20:01.423Z', 'c8LbLPMO5GYlgW5IxFSzXLq5bjz2');
INSERT OR REPLACE INTO previews (productId, runtime, html, css, javascript, jsx, tsx, fullDocument, width, height, viewportMode, scaleMode, enabled, updatedAt) VALUES ('magnetic-text-reveal', 'react', '', '.magnetic-text-reveal{display:inline-block;color:#f5a623;transition:transform .18s ease;cursor:pointer}.magnetic-text-reveal:hover{transform:translateY(-4px) scale(1.06)}', '', 'export default function App(){return <div style={{display:''grid'',placeItems:''center'',minHeight:''100vh'',background:''#090d16''}}><strong className="magnetic-text-reveal" style={{fontSize:''36px'',fontFamily:''sans-serif''}}>Code Faster</strong></div>}', '', '', 1440, 900, 'desktop', 'fit', 1, '2026-09-07T05:01:21.701Z');
INSERT OR REPLACE INTO previews (productId, runtime, html, css, javascript, jsx, tsx, fullDocument, width, height, viewportMode, scaleMode, enabled, updatedAt) VALUES ('minimal-loader', 'html-css-js', '<div style="display:grid;place-items:center;min-height:100vh;background:#090d16;"><div class="loader" role="status" aria-label="Loading"></div></div>', '.loader{width:42px;height:42px;border-radius:50%;border:4px solid rgba(255,255,255,.16);border-top-color:#f5a623;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}', '', '', '', '', 1440, 900, 'desktop', 'fit', 1, '2026-09-07T05:01:28.162Z');
INSERT OR REPLACE INTO previews (productId, runtime, html, css, javascript, jsx, tsx, fullDocument, width, height, viewportMode, scaleMode, enabled, updatedAt) VALUES ('order-success-animation', 'react', '', '.order-success{display:grid;place-items:center;gap:14px;color:#d1fae5;font-family:sans-serif}.order-success span{display:grid;place-items:center;width:64px;height:64px;border-radius:50%;background:#16a34a;font-size:32px;color:#fff}', '', 'export default function App(){return <div style={{display:''grid'',placeItems:''center'',minHeight:''100vh'',background:''#090d16''}}><section className="order-success"><span>✓</span><strong style={{fontSize:''22px''}}>Order Confirmed</strong></section></div>}', '', '', 1440, 900, 'desktop', 'fit', 1, '2026-09-07T05:01:35.194Z');
INSERT OR REPLACE INTO previews (productId, runtime, html, css, javascript, jsx, tsx, fullDocument, width, height, viewportMode, scaleMode, enabled, updatedAt) VALUES ('particles-background', 'html-css-js', '<div id="bg" class="particles-background-ready"><div style="display:grid;place-items:center;min-height:100vh;color:#f5a623;font-family:sans-serif;font-size:24px;font-weight:700">Particles Background</div></div>', '#bg{min-height:100vh;background:radial-gradient(circle at 50% 50%,rgba(245,166,35,.2),transparent 60%),#050812}', '', '', '', '', 1440, 900, 'desktop', 'fit', 1, '2026-09-07T05:01:40.175Z');
INSERT OR REPLACE INTO previews (productId, runtime, html, css, javascript, jsx, tsx, fullDocument, width, height, viewportMode, scaleMode, enabled, updatedAt) VALUES ('product-card-hover', 'react', '', '.card-hover:hover{transform:translateY(-6px);border-color:rgba(245,166,35,0.5)!important}', '', 'export default function App(){return <div style={{display:''grid'',placeItems:''center'',minHeight:''100vh'',background:''#090d16'',padding:''20px''}}><article style={{width:''280px'',borderRadius:''16px'',border:''1px solid rgba(255,255,255,0.12)'',background:''rgba(255,255,255,0.04)'',padding:''16px'',color:''#fff'',fontFamily:''sans-serif'',transition:''transform 0.2s ease, border-color 0.2s ease'',cursor:''pointer''}} className="card-hover"><div style={{height:''140px'',borderRadius:''10px'',background:''linear-gradient(135deg, rgba(245,166,35,0.2), rgba(245,166,35,0.05))'',marginBottom:''12px'',display:''grid'',placeItems:''center'',fontSize:''36px''}}>📦</div><h3 style={{margin:''0 0 6px 0'',fontSize:''16px''}}>Product Card Hover</h3><strong style={{color:''#f5a623'',fontSize:''18px''}}>Free Component</strong></article></div>}', '', '', 1440, 900, 'desktop', 'fit', 1, '2026-09-07T05:01:46.536Z');
INSERT OR REPLACE INTO previews (productId, runtime, html, css, javascript, jsx, tsx, fullDocument, width, height, viewportMode, scaleMode, enabled, updatedAt) VALUES ('slide-page-transition', 'react', '', '.slide-page-transition{transition:transform .3s ease}', '', 'export default function App(){const [page, setPage] = React.useState(1); return <div style={{display:''grid'',placeItems:''center'',minHeight:''100vh'',background:''#090d16'',color:''#fff'',fontFamily:''sans-serif''}}><div className="slide-page-transition" style={{textAlign:''center''}}><div style={{padding:''24px 32px'',borderRadius:''16px'',border:''1px solid rgba(245,166,35,0.3)'',background:''rgba(245,166,35,0.05)'',marginBottom:''16px''}}><h2 style={{margin:''0 0 8px 0'',color:''#f5a623''}}>Page {page} View</h2><p style={{margin:0,color:''#94a3b8''}}>Smooth page transition demo</p></div><button onClick={()=>setPage(p => p === 1 ? 2 : 1)} style={{padding:''10px 20px'',borderRadius:''8px'',background:''#f5a623'',color:''#000'',fontWeight:''bold'',border:''none'',cursor:''pointer''}}>Switch Page View</button></div></div>}', '', '', 1440, 900, 'desktop', 'fit', 1, '2026-09-07T05:01:48.913Z');
INSERT OR REPLACE INTO sources (productId, files, updatedAt) VALUES ('aurora-glowing-buttons-pack', '[{"path":"index.html","language":"html","order":0,"content":"<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n  <title>Aurora Glowing Buttons</title>\n  <link rel=\"stylesheet\" href=\"styles.css\" />\n</head>\n<body>\n  <div class=\"aurora-container\">\n    <button class=\"aurora-btn aurora-btn-gold\">\n      <span class=\"aurora-glow\"></span>\n      <span class=\"aurora-label\">Get Started Free</span>\n    </button>\n    <button class=\"aurora-btn aurora-btn-cyan\">\n      <span class=\"aurora-glow\"></span>\n      <span class=\"aurora-label\">Explore Code</span>\n    </button>\n    <button class=\"aurora-btn aurora-btn-purple\">\n      <span class=\"aurora-glow\"></span>\n      <span class=\"aurora-label\">Launch Studio</span>\n    </button>\n  </div>\n  <script src=\"script.js\"></script>\n</body>\n</html>"},{"order":1,"language":"css","path":"styles.css","content":":root {\n  --aurora-gold: #f5a623;\n  --aurora-gold-glow: rgba(245, 166, 35, 0.45);\n  --aurora-cyan: #06b6d4;\n  --aurora-cyan-glow: rgba(6, 182, 212, 0.45);\n  --aurora-purple: #a855f7;\n  --aurora-purple-glow: rgba(168, 85, 247, 0.45);\n}\n\n.aurora-container {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 20px;\n  align-items: center;\n  justify-content: center;\n  padding: 40px;\n  background: #0b0f19;\n  border-radius: 16px;\n}\n\n.aurora-btn {\n  position: relative;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  padding: 14px 28px;\n  font-size: 15px;\n  font-weight: 700;\n  color: #ffffff;\n  background: rgba(255, 255, 255, 0.05);\n  border: 1px solid rgba(255, 255, 255, 0.15);\n  border-radius: 12px;\n  cursor: pointer;\n  overflow: hidden;\n  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);\n  backdrop-filter: blur(8px);\n}\n\n.aurora-btn .aurora-label {\n  position: relative;\n  z-index: 2;\n  letter-spacing: 0.02em;\n}\n\n.aurora-btn .aurora-glow {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  width: 140%;\n  height: 140%;\n  transform: translate(-50%, -50%) scale(0.6);\n  opacity: 0;\n  filter: blur(20px);\n  border-radius: 50%;\n  transition: opacity 0.3s ease, transform 0.3s ease;\n  pointer-events: none;\n  z-index: 1;\n}\n\n.aurora-btn-gold {\n  border-color: rgba(245, 166, 35, 0.3);\n}\n.aurora-btn-gold .aurora-glow {\n  background: radial-gradient(circle, var(--aurora-gold) 0%, var(--aurora-gold-glow) 60%, transparent 80%);\n}\n.aurora-btn-gold:hover {\n  border-color: var(--aurora-gold);\n  color: #fff;\n  transform: translateY(-2px);\n  box-shadow: 0 10px 30px -10px var(--aurora-gold-glow);\n}\n.aurora-btn-gold:hover .aurora-glow {\n  opacity: 1;\n  transform: translate(-50%, -50%) scale(1);\n}\n\n.aurora-btn-cyan {\n  border-color: rgba(6, 182, 212, 0.3);\n}\n.aurora-btn-cyan .aurora-glow {\n  background: radial-gradient(circle, var(--aurora-cyan) 0%, var(--aurora-cyan-glow) 60%, transparent 80%);\n}\n.aurora-btn-cyan:hover {\n  border-color: var(--aurora-cyan);\n  color: #fff;\n  transform: translateY(-2px);\n  box-shadow: 0 10px 30px -10px var(--aurora-cyan-glow);\n}\n.aurora-btn-cyan:hover .aurora-glow {\n  opacity: 1;\n  transform: translate(-50%, -50%) scale(1);\n}\n\n.aurora-btn-purple {\n  border-color: rgba(168, 85, 247, 0.3);\n}\n.aurora-btn-purple .aurora-glow {\n  background: radial-gradient(circle, var(--aurora-purple) 0%, var(--aurora-purple-glow) 60%, transparent 80%);\n}\n.aurora-btn-purple:hover {\n  border-color: var(--aurora-purple);\n  color: #fff;\n  transform: translateY(-2px);\n  box-shadow: 0 10px 30px -10px var(--aurora-purple-glow);\n}\n.aurora-btn-purple:hover .aurora-glow {\n  opacity: 1;\n  transform: translate(-50%, -50%) scale(1);\n}\n\n.aurora-btn:active {\n  transform: translateY(0px) scale(0.98);\n}"},{"content":"document.querySelectorAll(''.aurora-btn'').forEach(btn => {\n  btn.addEventListener(''mousemove'', (e) => {\n    const rect = btn.getBoundingClientRect();\n    const x = ((e.clientX - rect.left) / rect.width) * 100;\n    const y = ((e.clientY - rect.top) / rect.height) * 100;\n    const glow = btn.querySelector(''.aurora-glow'');\n    if (glow) {\n      glow.style.transform = `translate(-50%, -50%) translate(${(x - 50) * 0.4}px, ${(y - 50) * 0.4}px) scale(1.1)`;\n    }\n  });\n\n  btn.addEventListener(''mouseleave'', () => {\n    const glow = btn.querySelector(''.aurora-glow'');\n    if (glow) {\n      glow.style.transform = ''translate(-50%, -50%) scale(0.6)'';\n    }\n  });\n});","order":2,"path":"script.js","language":"javascript"},{"path":"README.md","content":"# Aurora Glowing Buttons Pack\n\nA suite of interactive ambient glowing buttons engineered for modern web applications and SaaS landing pages.\n\n## Installation\n\n1. Copy `styles.css` into your stylesheet pipeline or link it in your HTML.\n2. Include the button HTML structure with `aurora-btn` and color modifier classes.\n3. Import `script.js` before the closing `</body>` tag for reactive magnetic cursor glow tracking.\n\n## Customization\n\nYou can change glowing accents by updating `--aurora-gold`, `--aurora-cyan`, and `--aurora-purple` in CSS root variables.","order":3,"language":"markdown"},{"content":"STEA Code Commercial License. Permitted for use in unlimited commercial and personal projects.","language":"text","order":4,"path":"LICENSE.txt"}]', '2026-09-14T15:57:37.635Z');
INSERT OR REPLACE INTO sources (productId, files, updatedAt, updatedBy) VALUES ('b', '[{"path":"index.html","content":"<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<title>Nebula Pulse Button — STEA Code</title>\n<style>\n  * { box-sizing: border-box; margin: 0; padding: 0; }\n  html, body {\n    width: 100%; height: 100%;\n    background: #07070b;\n    display: grid; place-items: center;\n    font-family: ''Inter'', system-ui, -apple-system, sans-serif;\n    overflow: hidden;\n  }\n\n  .nebula-wrap {\n    position: relative;\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    padding: 40px;\n  }\n\n  .nebula-btn {\n    position: relative;\n    display: inline-flex;\n    align-items: center;\n    gap: 12px;\n    padding: 18px 36px;\n    border: 0;\n    border-radius: 999px;\n    font-size: 16px;\n    font-weight: 600;\n    letter-spacing: -0.01em;\n    color: #fff;\n    background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);\n    background-size: 200% 200%;\n    cursor: pointer;\n    isolation: isolate;\n    overflow: hidden;\n    transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);\n    animation: gradientShift 6s ease infinite;\n    box-shadow:\n      0 10px 40px -10px rgba(168, 85, 247, 0.6),\n      0 4px 12px -2px rgba(99, 102, 241, 0.4);\n  }\n\n  @keyframes gradientShift {\n    0%, 100% { background-position: 0% 50%; }\n    50% { background-position: 100% 50%; }\n  }\n\n  .nebula-btn:hover {\n    transform: translateY(-2px) scale(1.02);\n    box-shadow:\n      0 20px 60px -10px rgba(168, 85, 247, 0.85),\n      0 8px 20px -4px rgba(99, 102, 241, 0.6);\n  }\n\n  .nebula-btn:active {\n    transform: translateY(0) scale(0.98);\n  }\n\n  .nebula-btn::before {\n    content: '''';\n    position: absolute;\n    inset: 0;\n    border-radius: inherit;\n    background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%);\n    transform: translateX(-100%);\n    animation: shine 3.2s ease-in-out infinite;\n    pointer-events: none;\n    z-index: 2;\n  }\n\n  @keyframes shine {\n    0%   { transform: translateX(-100%); }\n    55%  { transform: translateX(100%); }\n    100% { transform: translateX(100%); }\n  }\n\n  .nebula-btn::after {\n    content: '''';\n    position: absolute;\n    inset: -2px;\n    border-radius: inherit;\n    background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899);\n    filter: blur(14px);\n    opacity: 0.6;\n    z-index: -1;\n    animation: pulse 2.4s ease-in-out infinite;\n  }\n\n  @keyframes pulse {\n    0%, 100% { opacity: 0.45; transform: scale(0.98); }\n    50%      { opacity: 0.85; transform: scale(1.04); }\n  }\n\n  .nebula-btn__icon {\n    display: inline-flex;\n    width: 18px; height: 18px;\n    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);\n  }\n\n  .nebula-btn:hover .nebula-btn__icon {\n    transform: translateX(3px);\n  }\n\n  .nebula-btn__label {\n    position: relative;\n    z-index: 3;\n  }\n\n  .nebula-btn__icon svg {\n    width: 100%; height: 100%;\n    fill: none;\n    stroke: currentColor;\n    stroke-width: 2;\n    stroke-linecap: round;\n    stroke-linejoin: round;\n  }\n\n  .sparks {\n    position: absolute;\n    inset: 0;\n    pointer-events: none;\n    z-index: 5;\n  }\n\n  .spark {\n    position: absolute;\n    top: 50%; left: 50%;\n    width: 4px; height: 4px;\n    border-radius: 50%;\n    background: #fff;\n    box-shadow: 0 0 8px 2px rgba(255,255,255,0.8);\n    opacity: 0;\n    animation: spark 3s ease-out infinite;\n  }\n\n  .spark:nth-child(1) { animation-delay: 0s;   --angle: 0deg;   --dist: 90px; }\n  .spark:nth-child(2) { animation-delay: 0.4s; --angle: 60deg;  --dist: 100px; }\n  .spark:nth-child(3) { animation-delay: 0.8s; --angle: 120deg; --dist: 85px;  }\n  .spark:nth-child(4) { animation-delay: 1.2s; --angle: 180deg; --dist: 95px;  }\n  .spark:nth-child(5) { animation-delay: 1.6s; --angle: 240deg; --dist: 105px; }\n  .spark:nth-child(6) { animation-delay: 2.0s; --angle: 300deg; --dist: 88px;  }\n\n  @keyframes spark {\n    0% {\n      opacity: 0;\n      transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0) scale(0.5);\n    }\n    20% { opacity: 1; }\n    100% {\n      opacity: 0;\n      transform: translate(-50%, -50%) rotate(var(--angle)) translateX(var(--dist)) scale(0.2);\n    }\n  }\n\n  .ripple {\n    position: absolute;\n    border-radius: 50%;\n    background: rgba(255,255,255,0.5);\n    transform: translate(-50%, -50%) scale(0);\n    animation: rippleAnim 0.65s ease-out forwards;\n    pointer-events: none;\n    z-index: 4;\n  }\n\n  @keyframes rippleAnim {\n    to {\n      transform: translate(-50%, -50%) scale(4);\n      opacity: 0;\n    }\n  }\n\n  @media (prefers-reduced-motion: reduce) {\n    .nebula-btn,\n    .nebula-btn::before,\n    .nebula-btn::after,\n    .spark {\n      animation: none !important;\n    }\n    .nebula-btn { transition: none; }\n    .nebula-btn:hover { transform: none; }\n  }\n</style>\n</head>\n<body>\n\n<div class=\"nebula-wrap\">\n  <button class=\"nebula-btn\" type=\"button\" aria-label=\"Launch\">\n    <span class=\"nebula-btn__label\">Launch Project</span>\n    <span class=\"nebula-btn__icon\" aria-hidden=\"true\">\n      <svg viewBox=\"0 0 24 24\">\n        <path d=\"M5 12h14M13 5l7 7-7 7\"/>\n      </svg>\n    </span>\n  </button>\n\n  <span class=\"sparks\" aria-hidden=\"true\">\n    <span class=\"spark\"></span>\n    <span class=\"spark\"></span>\n    <span class=\"spark\"></span>\n    <span class=\"spark\"></span>\n    <span class=\"spark\"></span>\n    <span class=\"spark\"></span>\n  </span>\n</div>\n\n<script>\n  const btn = document.querySelector(''.nebula-btn'');\n  btn.addEventListener(''click'', (e) => {\n    const rect = btn.getBoundingClientRect();\n    const r = document.createElement(''span'');\n    r.className = ''ripple'';\n    const size = Math.max(rect.width, rect.height);\n    r.style.width = r.style.height = size + ''px'';\n    r.style.left = (e.clientX - rect.left) + ''px'';\n    r.style.top  = (e.clientY - rect.top)  + ''px'';\n    btn.appendChild(r);\n    setTimeout(() => r.remove(), 700);\n  });\n</script>\n\n</body>\n</html>","order":0,"language":"html"}]', '2026-09-23T10:44:40.376Z', 'c8LbLPMO5GYlgW5IxFSzXLq5bjz2');
INSERT OR REPLACE INTO sources (productId, files, updatedAt, updatedBy) VALUES ('glass-motion-car', '[{"content":"<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n  <title>Prism Glass Card</title>\n\n  <style>\n    * {\n      box-sizing: border-box;\n      margin: 0;\n      padding: 0;\n    }\n\n    body {\n      min-height: 100vh;\n      display: grid;\n      place-items: center;\n      overflow: hidden;\n      background:\n        radial-gradient(circle at 20% 20%, rgba(34, 211, 238, 0.16), transparent 32%),\n        radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.18), transparent 34%),\n        #050816;\n      font-family: Inter, Arial, sans-serif;\n      color: white;\n    }\n\n    .scene {\n      perspective: 1100px;\n      width: min(92vw, 420px);\n    }\n\n    .card-shell {\n      position: relative;\n      border-radius: 30px;\n      padding: 2px;\n      background:\n        conic-gradient(\n          from var(--angle),\n          #22d3ee,\n          #3b82f6,\n          #8b5cf6,\n          #ec4899,\n          #22d3ee\n        );\n      animation: borderSpin 5s linear infinite;\n      box-shadow:\n        0 30px 80px rgba(0, 0, 0, 0.45),\n        0 0 50px rgba(99, 102, 241, 0.15);\n    }\n\n    .card {\n      position: relative;\n      min-height: 500px;\n      border-radius: 28px;\n      overflow: hidden;\n      padding: 28px;\n      background:\n        linear-gradient(\n          145deg,\n          rgba(16, 24, 48, 0.92),\n          rgba(7, 10, 24, 0.97)\n        );\n      backdrop-filter: blur(22px);\n      transform-style: preserve-3d;\n      transition:\n        transform 0.18s ease,\n        box-shadow 0.3s ease;\n      will-change: transform;\n    }\n\n    .card::before {\n      content: \"\";\n      position: absolute;\n      inset: 0;\n      background:\n        linear-gradient(\n          120deg,\n          transparent 20%,\n          rgba(255, 255, 255, 0.08) 40%,\n          transparent 60%\n        );\n      transform: translateX(-120%);\n      animation: sweep 4.5s ease-in-out infinite;\n      pointer-events: none;\n    }\n\n    .glow-one,\n    .glow-two {\n      position: absolute;\n      width: 190px;\n      height: 190px;\n      border-radius: 50%;\n      filter: blur(48px);\n      opacity: 0.45;\n      pointer-events: none;\n    }\n\n    .glow-one {\n      top: -55px;\n      right: -40px;\n      background: rgba(34, 211, 238, 0.65);\n      animation: driftOne 6s ease-in-out infinite;\n    }\n\n    .glow-two {\n      bottom: -65px;\n      left: -45px;\n      background: rgba(168, 85, 247, 0.65);\n      animation: driftTwo 7s ease-in-out infinite;\n    }\n\n    .top-row {\n      display: flex;\n      align-items: center;\n      justify-content: space-between;\n      gap: 14px;\n      position: relative;\n      z-index: 2;\n      transform: translateZ(30px);\n    }\n\n    .badge {\n      padding: 8px 12px;\n      border-radius: 999px;\n      font-size: 12px;\n      font-weight: 700;\n      letter-spacing: 0.08em;\n      text-transform: uppercase;\n      background: rgba(255, 255, 255, 0.07);\n      border: 1px solid rgba(255, 255, 255, 0.1);\n      color: #c4f1ff;\n    }\n\n    .status-dot {\n      width: 11px;\n      height: 11px;\n      border-radius: 50%;\n      background: #67e8f9;\n      box-shadow:\n        0 0 8px #67e8f9,\n        0 0 18px rgba(103, 232, 249, 0.8);\n      animation: pulse 1.8s ease-in-out infinite;\n    }\n\n    .visual {\n      margin-top: 30px;\n      height: 210px;\n      position: relative;\n      display: grid;\n      place-items: center;\n      transform: translateZ(50px);\n    }\n\n    .orb {\n      width: 150px;\n      height: 150px;\n      border-radius: 50%;\n      background:\n        radial-gradient(circle at 35% 30%, #ffffff 0 4%, transparent 5%),\n        radial-gradient(\n          circle at 40% 40%,\n          #67e8f9,\n          #6366f1 45%,\n          #7c3aed 72%,\n          #111827 100%\n        );\n      box-shadow:\n        inset -22px -22px 45px rgba(0, 0, 0, 0.32),\n        0 0 45px rgba(99, 102, 241, 0.45),\n        0 0 85px rgba(34, 211, 238, 0.18);\n      animation: orbFloat 4s ease-in-out infinite;\n    }\n\n    .ring {\n      position: absolute;\n      width: 205px;\n      height: 82px;\n      border: 2px solid rgba(125, 211, 252, 0.5);\n      border-radius: 50%;\n      transform: rotateX(68deg) rotateZ(-14deg);\n      box-shadow: 0 0 20px rgba(34, 211, 238, 0.22);\n      animation: ringRotate 6s linear infinite;\n    }\n\n    .copy {\n      position: relative;\n      z-index: 2;\n      transform: translateZ(35px);\n    }\n\n    h1 {\n      font-size: clamp(28px, 6vw, 42px);\n      line-height: 1;\n      letter-spacing: -0.04em;\n      margin-bottom: 12px;\n    }\n\n    p {\n      color: #aab4c8;\n      line-height: 1.65;\n      font-size: 14px;\n    }\n\n    .footer {\n      position: relative;\n      z-index: 2;\n      margin-top: 28px;\n      display: flex;\n      align-items: center;\n      justify-content: space-between;\n      gap: 14px;\n      transform: translateZ(40px);\n    }\n\n    .metric strong {\n      display: block;\n      font-size: 18px;\n      margin-bottom: 3px;\n    }\n\n    .metric span {\n      color: #778299;\n      font-size: 12px;\n    }\n\n    .button {\n      border: 0;\n      border-radius: 16px;\n      padding: 14px 18px;\n      color: #07111f;\n      background:\n        linear-gradient(135deg, #67e8f9, #a78bfa);\n      font-weight: 800;\n      cursor: pointer;\n      transition:\n        transform 0.2s ease,\n        box-shadow 0.2s ease;\n      box-shadow: 0 10px 28px rgba(99, 102, 241, 0.25);\n    }\n\n    .button:hover {\n      transform: translateY(-3px) scale(1.03);\n      box-shadow: 0 16px 34px rgba(99, 102, 241, 0.35);\n    }\n\n    .button:active {\n      transform: scale(0.97);\n    }\n\n    @property --angle {\n      syntax: \"<angle>\";\n      initial-value: 0deg;\n      inherits: false;\n    }\n\n    @keyframes borderSpin {\n      to {\n        --angle: 360deg;\n      }\n    }\n\n    @keyframes sweep {\n      0% {\n        transform: translateX(-120%);\n      }\n\n      45%,\n      100% {\n        transform: translateX(140%);\n      }\n    }\n\n    @keyframes pulse {\n      0%,\n      100% {\n        transform: scale(0.85);\n        opacity: 0.6;\n      }\n\n      50% {\n        transform: scale(1.25);\n        opacity: 1;\n      }\n    }\n\n    @keyframes orbFloat {\n      0%,\n      100% {\n        transform: translateY(0) rotate(0deg);\n      }\n\n      50% {\n        transform: translateY(-14px) rotate(8deg);\n      }\n    }\n\n    @keyframes ringRotate {\n      from {\n        transform: rotateX(68deg) rotateZ(-14deg);\n      }\n\n      to {\n        transform: rotateX(68deg) rotateZ(346deg);\n      }\n    }\n\n    @keyframes driftOne {\n      0%,\n      100% {\n        transform: translate(0, 0);\n      }\n\n      50% {\n        transform: translate(-30px, 25px);\n      }\n    }\n\n    @keyframes driftTwo {\n      0%,\n      100% {\n        transform: translate(0, 0);\n      }\n\n      50% {\n        transform: translate(28px, -20px);\n      }\n    }\n\n    @media (max-width: 480px) {\n      .card {\n        min-height: 470px;\n        padding: 22px;\n      }\n\n      .visual {\n        height: 190px;\n      }\n\n      .orb {\n        width: 130px;\n        height: 130px;\n      }\n\n      .ring {\n        width: 180px;\n        height: 72px;\n      }\n    }\n  </style>\n</head>\n\n<body>\n  <div class=\"scene\">\n    <div class=\"card-shell\">\n      <article class=\"card\" id=\"prismCard\">\n        <div class=\"glow-one\"></div>\n        <div class=\"glow-two\"></div>\n\n        <div class=\"top-row\">\n          <span class=\"badge\">STEA Motion</span>\n          <span class=\"status-dot\"></span>\n        </div>\n\n        <div class=\"visual\">\n          <div class=\"ring\"></div>\n          <div class=\"orb\"></div>\n        </div>\n\n        <div class=\"copy\">\n          <h1>Prism Glass</h1>\n\n          <p>\n            A responsive interactive card with 3D tilt, animated light,\n            rotating gradients and layered depth.\n          </p>\n        </div>\n\n        <div class=\"footer\">\n          <div class=\"metric\">\n            <strong>60 FPS</strong>\n            <span>Interactive motion</span>\n          </div>\n\n          <button class=\"button\" id=\"actionButton\">\n            Explore\n          </button>\n        </div>\n      </article>\n    </div>\n  </div>\n\n  <script>\n    const card = document.getElementById(\"prismCard\");\n    const button = document.getElementById(\"actionButton\");\n\n    card.addEventListener(\"mousemove\", (event) => {\n      const rect = card.getBoundingClientRect();\n\n      const x = event.clientX - rect.left;\n      const y = event.clientY - rect.top;\n\n      const centerX = rect.width / 2;\n      const centerY = rect.height / 2;\n\n      const rotateY = ((x - centerX) / centerX) * 8;\n      const rotateX = ((centerY - y) / centerY) * 8;\n\n      card.style.transform =\n        `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;\n    });\n\n    card.addEventListener(\"mouseleave\", () => {\n      card.style.transform =\n        \"rotateX(0deg) rotateY(0deg)\";\n    });\n\n    button.addEventListener(\"click\", () => {\n      const original = button.textContent;\n\n      button.textContent = \"Activated ✦\";\n\n      setTimeout(() => {\n        button.textContent = original;\n      }, 1000);\n    });\n  </script>\n</body>\n</html>","path":"file-1.txt","order":0,"language":"text"}]', '2026-09-06T23:47:41.258Z', 'c8LbLPMO5GYlgW5IxFSzXLq5bjz2');
INSERT OR REPLACE INTO sources (productId, files, updatedAt, updatedBy) VALUES ('glow-button-effect', '[{"content":"<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<title>Premium Animated Button</title>\n<style>\n  * { box-sizing: border-box; margin: 0; padding: 0; }\n\n  html, body {\n    width: 100%;\n    height: 100%;\n    background: transparent;\n    display: grid;\n    place-items: center;\n    font-family: ''Inter'', system-ui, -apple-system, sans-serif;\n    overflow: hidden;\n  }\n\n  .premium-btn-wrap {\n    position: relative;\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    padding: 50px;\n  }\n\n  /* ── The button ──────────────────────────────────────────── */\n  .premium-btn {\n    position: relative;\n    display: inline-flex;\n    align-items: center;\n    gap: 14px;\n    padding: 20px 44px;\n    border: 0;\n    border-radius: 999px;\n    font-size: 18px;\n    font-weight: 700;\n    letter-spacing: -0.01em;\n    color: #0a0a0f;\n    cursor: pointer;\n    background: linear-gradient(\n      135deg,\n      #ffe29a 0%,\n      #ffd86b 25%,\n      #f5a623 55%,\n      #d98a12 100%\n    );\n    background-size: 200% 200%;\n    isolation: isolate;\n    overflow: hidden;\n    transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),\n                box-shadow 0.28s ease;\n    animation: gradientShift 5s ease infinite;\n    box-shadow:\n      0 0 50px -6px rgba(245, 166, 35, 0.75),\n      0 0 24px -4px rgba(245, 166, 35, 0.55),\n      0 8px 22px -6px rgba(0, 0, 0, 0.55);\n  }\n\n  @keyframes gradientShift {\n    0%, 100% { background-position: 0% 50%; }\n    50%      { background-position: 100% 50%; }\n  }\n\n  /* ── Shimmer sweeping across the surface ─────────────────── */\n  .premium-btn::before {\n    content: '''';\n    position: absolute;\n    inset: 0;\n    border-radius: inherit;\n    background: linear-gradient(\n      115deg,\n      transparent 30%,\n      rgba(255, 255, 255, 0.6) 50%,\n      transparent 70%\n    );\n    transform: translateX(-150%);\n    animation: shimmer 3.6s ease-in-out infinite;\n    pointer-events: none;\n    z-index: 2;\n  }\n\n  @keyframes shimmer {\n    0%   { transform: translateX(-150%); }\n    55%  { transform: translateX(150%); }\n    100% { transform: translateX(150%); }\n  }\n\n  /* ── Inner top highlight for depth ───────────────────────── */\n  .premium-btn__highlight {\n    position: absolute;\n    inset: 1px;\n    border-radius: inherit;\n    background: linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.45) 0%,\n      rgba(255, 255, 255, 0) 45%\n    );\n    pointer-events: none;\n    z-index: 1;\n  }\n\n  /* ── Outer pulsing halo ──────────────────────────────────── */\n  .premium-btn__halo {\n    position: absolute;\n    inset: -8px;\n    border-radius: inherit;\n    background: linear-gradient(135deg, #ffd86b, #f5a623, #d98a12);\n    filter: blur(24px);\n    opacity: 0.55;\n    z-index: -1;\n    animation: halo 2.6s ease-in-out infinite;\n    pointer-events: none;\n  }\n\n  @keyframes halo {\n    0%, 100% { opacity: 0.4; transform: scale(0.97); }\n    50%      { opacity: 0.85; transform: scale(1.06); }\n  }\n\n  /* ── Floating spark particles ────────────────────────────── */\n  .premium-btn__sparks {\n    position: absolute;\n    inset: -30px;\n    pointer-events: none;\n    z-index: 3;\n  }\n\n  .premium-btn__spark {\n    position: absolute;\n    top: 50%;\n    left: 50%;\n    width: 4px;\n    height: 4px;\n    border-radius: 50%;\n    background: #fff5c9;\n    box-shadow:\n      0 0 8px 2px rgba(255, 233, 150, 0.9),\n      0 0 14px 3px rgba(245, 166, 35, 0.5);\n    opacity: 0;\n    animation: spark 3.2s ease-out infinite;\n  }\n\n  .premium-btn__spark:nth-child(1) { animation-delay: 0s;   --angle: 0deg;   --dist: 110px; }\n  .premium-btn__spark:nth-child(2) { animation-delay: 0.5s; --angle: 60deg;  --dist: 120px; }\n  .premium-btn__spark:nth-child(3) { animation-delay: 1.0s; --angle: 120deg; --dist: 100px; }\n  .premium-btn__spark:nth-child(4) { animation-delay: 1.5s; --angle: 180deg; --dist: 115px; }\n  .premium-btn__spark:nth-child(5) { animation-delay: 2.0s; --angle: 240deg; --dist: 105px; }\n  .premium-btn__spark:nth-child(6) { animation-delay: 2.5s; --angle: 300deg; --dist: 118px; }\n\n  @keyframes spark {\n    0% {\n      opacity: 0;\n      transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0) scale(0.4);\n    }\n    15% { opacity: 1; }\n    100% {\n      opacity: 0;\n      transform: translate(-50%, -50%) rotate(var(--angle)) translateX(var(--dist)) scale(0.2);\n    }\n  }\n\n  /* ── Label + arrow ──────────────────────────────────────── */\n  .premium-btn__label {\n    position: relative;\n    z-index: 4;\n  }\n\n  .premium-btn__icon {\n    position: relative;\n    z-index: 4;\n    display: inline-flex;\n    width: 18px;\n    height: 18px;\n    transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);\n  }\n\n  .premium-btn:hover .premium-btn__icon {\n    transform: translateX(4px);\n  }\n\n  .premium-btn__icon svg {\n    width: 100%;\n    height: 100%;\n  }\n\n  /* ── Hover / active states ───────────────────────────────── */\n  .premium-btn:hover {\n    transform: translateY(-3px) scale(1.03);\n    box-shadow:\n      0 0 70px -6px rgba(245, 166, 35, 1),\n      0 0 34px -4px rgba(245, 166, 35, 0.75),\n      0 14px 30px -6px rgba(0, 0, 0, 0.6);\n  }\n\n  .premium-btn:active {\n    transform: translateY(0) scale(0.98);\n  }\n\n  /* ── Click ripple ────────────────────────────────────────── */\n  .premium-btn__ripple {\n    position: absolute;\n    border-radius: 50%;\n    background: rgba(255, 255, 255, 0.55);\n    transform: translate(-50%, -50%) scale(0);\n    animation: rippleAnim 0.7s ease-out forwards;\n    pointer-events: none;\n    z-index: 3;\n  }\n\n  @keyframes rippleAnim {\n    to {\n      transform: translate(-50%, -50%) scale(4);\n      opacity: 0;\n    }\n  }\n\n  @media (prefers-reduced-motion: reduce) {\n    .premium-btn,\n    .premium-btn::before,\n    .premium-btn__halo,\n    .premium-btn__spark {\n      animation: none !important;\n    }\n    .premium-btn { transition: none; }\n    .premium-btn:hover { transform: none; }\n    .premium-btn:hover .premium-btn__icon { transform: none; }\n  }\n</style>\n</head>\n<body>\n\n  <div class=\"premium-btn-wrap\">\n    <button class=\"premium-btn\" type=\"button\">\n      <span class=\"premium-btn__halo\" aria-hidden=\"true\"></span>\n\n      <span class=\"premium-btn__sparks\" aria-hidden=\"true\">\n        <span class=\"premium-btn__spark\"></span>\n        <span class=\"premium-btn__spark\"></span>\n        <span class=\"premium-btn__spark\"></span>\n        <span class=\"premium-btn__spark\"></span>\n        <span class=\"premium-btn__spark\"></span>\n        <span class=\"premium-btn__spark\"></span>\n      </span>\n\n      <span class=\"premium-btn__highlight\" aria-hidden=\"true\"></span>\n\n      <span class=\"premium-btn__label\">Get Started</span>\n      <span class=\"premium-btn__icon\" aria-hidden=\"true\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n          <path d=\"M5 12h14M13 5l7 7-7 7\"/>\n        </svg>\n      </span>\n    </button>\n  </div>\n\n  <script>\n    const btn = document.querySelector(''.premium-btn'');\n    btn.addEventListener(''click'', (e) => {\n      const rect = btn.getBoundingClientRect();\n      const r = document.createElement(''span'');\n      r.className = ''premium-btn__ripple'';\n      const size = Math.max(rect.width, rect.height);\n      r.style.width = r.style.height = size + ''px'';\n      r.style.left = (e.clientX - rect.left) + ''px'';\n      r.style.top = (e.clientY - rect.top) + ''px'';\n      btn.appendChild(r);\n      setTimeout(() => r.remove(), 750);\n    });\n  </script>\n\n</body>\n</html>","path":"index.html","order":0,"language":"html"}]', '2026-09-24T01:21:35.466Z', 'c8LbLPMO5GYlgW5IxFSzXLq5bjz2');
INSERT OR REPLACE INTO sources (productId, files, updatedAt) VALUES ('gold-particle-vortex', '[{"language":"html","path":"index.html","content":"<!DOCTYPE html>\n<html><head><meta charset=\"utf-8\"><style>\n*{margin:0;padding:0;box-sizing:border-box}\nhtml,body{height:100vh;overflow:hidden;background:#070912;font-family:-apple-system,system-ui,sans-serif}\n#vortex{display:block;width:100%;height:100%;cursor:crosshair}\n.vortex-ui{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;z-index:2}\n.vortex-label{display:block;font-size:11px;font-weight:800;letter-spacing:.35em;color:rgba(245,166,35,.55);text-transform:uppercase;margin-bottom:6px}\n.vortex-pct{display:block;font-size:42px;font-weight:900;color:#f5a623;letter-spacing:-.03em;text-shadow:0 0 30px rgba(245,166,35,.45)}\n.vortex-hint{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);font-size:10px;letter-spacing:.2em;color:rgba(255,255,255,.25);text-transform:uppercase;pointer-events:none}\n</style></head>\n<body>\n<canvas id=\"vortex\"></canvas>\n<div class=\"vortex-ui\"><span class=\"vortex-label\">Loading</span><span class=\"vortex-pct\" id=\"pct\">0%</span></div>\n<div class=\"vortex-hint\">Move cursor to interact</div>\n<script>\n(function(){\nvar canvas=document.getElementById(''vortex''),ctx=canvas.getContext(''2d'');\nvar W,H,cx,cy,mouse={x:0,y:0,active:false},PC=240,particles=[];\nfunction resize(){W=canvas.width=innerWidth;H=canvas.height=innerHeight;cx=W/2;cy=H/2}\nresize();addEventListener(''resize'',resize);\naddEventListener(''mousemove'',function(e){mouse.x=e.clientX;mouse.y=e.clientY;mouse.active=true});\naddEventListener(''mouseleave'',function(){mouse.active=false});\nfunction Particle(){this.reset(true)}\nParticle.prototype.reset=function(init){var a=Math.random()*Math.PI*2;var r=init?Math.random()*320:Math.random()*40+200;this.angle=a;this.baseR=r;this.x=cx+Math.cos(a)*r;this.y=cy+Math.sin(a)*r;this.vx=0;this.vy=0;this.size=Math.random()*2.5+1;this.life=init?Math.random():0;this.speed=.006+Math.random()*.014;this.hue=38+Math.random()*14};\nParticle.prototype.update=function(t){this.angle+=this.speed;var spiralR=this.baseR+Math.sin(t*.0008+this.angle*3)*12;var tx=cx+Math.cos(this.angle)*spiralR;var ty=cy+Math.sin(this.angle)*spiralR;if(mouse.active){var dx=mouse.x-this.x,dy=mouse.y-this.y;var d=Math.sqrt(dx*dx+dy*dy);if(d<200){var f=(1-d/200)*.6;tx+=dx/(d||1)*f*50;ty+=dy/(d||1)*f*50}}this.vx+=(tx-this.x)*.055;this.vy+=(ty-this.y)*.055;this.vx*=.87;this.vy*=.87;this.x+=this.vx;this.y+=this.vy;this.life+=.0035;if(this.life>1)this.reset(false)};\nParticle.prototype.draw=function(ctx){var alpha=1-Math.abs(this.life-.5)*2;ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.fillStyle=''hsla(''+this.hue+'',95%,62%,''+alpha+'')'';ctx.shadowBlur=12;ctx.shadowColor=''hsla(''+this.hue+'',95%,62%,''+(alpha*.8)+'')'';ctx.fill()};\nfor(var i=0;i<PC;i++)particles.push(new Particle());\nvar pctEl=document.getElementById(''pct'');\nfunction updatePct(t){var p=Math.floor((t%4500)/4500*100);if(pctEl)pctEl.textContent=p+''%''}\nfunction drawCore(ctx,t){var pulse=1+Math.sin(t*.002)*.1;var r=42*pulse;var g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,''rgba(255,217,102,1)'');g.addColorStop(.35,''rgba(245,166,35,.8)'');g.addColorStop(1,''rgba(196,134,26,0)'');ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=g;ctx.shadowBlur=60;ctx.shadowColor=''rgba(245,166,35,.55)'';ctx.fill()}\nfunction loop(t){ctx.fillStyle=''rgba(7,9,18,.16)'';ctx.fillRect(0,0,W,H);ctx.shadowBlur=0;for(var i=0;i<PC;i++){particles[i].update(t);particles[i].draw(ctx)}drawCore(ctx,t);updatePct(t);requestAnimationFrame(loop)}\nrequestAnimationFrame(loop);\n})();\n</script>\n</body></html>","order":0}]', '2026-09-22T17:02:05.657Z');
INSERT OR REPLACE INTO sources (productId, files, updatedAt) VALUES ('magnetic-text-reveal', '[{"path":"MagneticTextReveal.jsx","content":"export function MagneticTextReveal(){return <strong className=\"magnetic-text-reveal\">Code faster</strong>}","order":0,"language":"jsx"},{"language":"css","order":1,"content":".magnetic-text-reveal{display:inline-block;color:#f5a623;transition:transform .18s ease}.magnetic-text-reveal:hover{transform:translateY(-2px)}","path":"magnetic-text-reveal.css"},{"path":"README.md","language":"markdown","order":2,"content":"# Magnetic Text Reveal\n\nInstall the component, import the CSS file, then customize the copy and motion values."},{"path":"LICENSE.txt","order":3,"language":"text","content":"STEA Code personal license. Redistribution as a standalone product is not permitted."}]', '2026-09-14T15:57:00.196Z');
INSERT OR REPLACE INTO sources (productId, files, updatedAt) VALUES ('minimal-loader', '[{"path":"index.html","language":"html","order":0,"content":"<div class=\"loader\" role=\"status\" aria-label=\"Loading\"></div>"},{"language":"css","path":"styles.css","content":".loader{width:34px;height:34px;border-radius:50%;border:3px solid rgba(255,255,255,.16);border-top-color:#f5a623;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}","order":1},{"order":2,"path":"README.md","language":"markdown","content":"# Minimal Loader\n\nAdd the loader while async data is loading and include an accessible label."},{"content":"STEA Code free license for use in your projects.","language":"text","order":3,"path":"LICENSE.txt"}]', '2026-09-14T15:57:27.677Z');
INSERT OR REPLACE INTO sources (productId, files, updatedAt) VALUES ('order-success-animation', '[{"order":0,"language":"jsx","content":"export function OrderSuccessAnimation(){return <section className=\"order-success\"><span>✓</span><strong>Order confirmed</strong></section>}","path":"OrderSuccessAnimation.jsx"},{"content":".order-success{display:grid;place-items:center;gap:10px;color:#d1fae5}.order-success span{display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:#16a34a}","language":"css","path":"order-success-animation.css","order":1},{"language":"markdown","path":"README.md","order":2,"content":"# Order Success Animation\n\nRender after your checkout provider confirms payment and pass your order labels as props."},{"order":3,"path":"LICENSE.txt","language":"text","content":"STEA Code personal license. Redistribution as a standalone product is not permitted."}]', '2026-09-14T15:57:05.437Z');
INSERT OR REPLACE INTO sources (productId, files, updatedAt) VALUES ('particles-background', '[{"order":0,"path":"particles-background.js","language":"javascript","content":"export function mountParticles(root){if(!root)return;root.classList.add(''particles-background-ready'')}"},{"path":"particles-background.css","language":"css","order":1,"content":".particles-background-ready{background:radial-gradient(circle at 25% 30%,rgba(125,211,252,.28),transparent 32%),#050812}"},{"content":"# Particles Background\n\nMount the background behind your hero and keep reduced-motion users on the static fallback.","language":"markdown","path":"README.md","order":2},{"order":3,"path":"LICENSE.txt","language":"text","content":"STEA Code personal license. Redistribution as a standalone product is not permitted."}]', '2026-09-14T15:57:09.468Z');
INSERT OR REPLACE INTO sources (productId, files, updatedAt) VALUES ('product-card-hover', '[{"order":0,"language":"jsx","path":"ProductCard.jsx","content":"export function ProductCard({title,price}){return <article className=\"rounded-xl border border-white/10 bg-white/[.03] p-3 transition hover:-translate-y-1\"><div className=\"aspect-video rounded-lg bg-white/10\"/><h3>{title}</h3><strong>{price}</strong></article>}"},{"language":"markdown","content":"# Product Card Hover\n\nDrop the component into a product grid and pass title, price and media props.","path":"README.md","order":1},{"content":"STEA Code free license for use in your projects.","language":"text","path":"LICENSE.txt","order":2}]', '2026-09-14T15:57:29.489Z');
INSERT OR REPLACE INTO sources (productId, files, updatedAt) VALUES ('slide-page-transition', '[{"language":"jsx","order":0,"path":"SlidePageTransition.jsx","content":"export function SlidePageTransition({children}){return <div className=\"slide-page-transition\">{children}</div>}"},{"content":".slide-page-transition{display:block;transition:transform .3s ease}","path":"slide-page-transition.css","order":1,"language":"css"},{"order":2,"path":"README.md","language":"markdown","content":"# Slide Page Transition\n\nWrap your routing view stack with the transition container."},{"language":"text","order":3,"content":"STEA Code personal license.","path":"LICENSE.txt"}]', '2026-09-14T15:57:35.611Z');
INSERT OR REPLACE INTO sources (productId, files, updatedAt, updatedBy) VALUES ('stea-glow-motion-button', '[{"order":0,"language":"html","path":"index.html","content":"<!doctype html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n  <title>STEA Glow Motion Button</title>\n  <link rel=\"stylesheet\" href=\"style.css\" />\n</head>\n<body>\n  <main class=\"demo\">\n    <button class=\"stea-glow-btn\">\n      <span>Get Started</span>\n    </button>\n  </main>\n</body>\n</html>"},{"order":1,"path":"style.css","language":"css","content":"* {\n  box-sizing: border-box;\n}\n\nbody {\n  margin: 0;\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  background:\n    radial-gradient(circle at 50% 20%, rgba(255, 162, 0, 0.12), transparent 38%),\n    #070707;\n  font-family: Inter, Arial, sans-serif;\n}\n\n.demo {\n  display: grid;\n  place-items: center;\n  width: 100%;\n  min-height: 100vh;\n}\n\n.stea-glow-btn {\n  position: relative;\n  overflow: hidden;\n  border: 1px solid rgba(255, 177, 35, 0.45);\n  border-radius: 16px;\n  padding: 16px 30px;\n  background: linear-gradient(180deg, #17130c, #0e0d0a);\n  color: #ffd37a;\n  font-size: 17px;\n  font-weight: 700;\n  letter-spacing: 0.01em;\n  cursor: pointer;\n  box-shadow:\n    0 0 0 1px rgba(255, 166, 0, 0.05),\n    0 12px 45px rgba(255, 145, 0, 0.16);\n  transition:\n    transform 260ms cubic-bezier(.2,.8,.2,1),\n    border-color 260ms ease,\n    box-shadow 260ms ease;\n}\n\n.stea-glow-btn::before {\n  content: \"\";\n  position: absolute;\n  inset: -120%;\n  background:\n    linear-gradient(\n      115deg,\n      transparent 35%,\n      rgba(255,255,255,0.9) 49%,\n      transparent 63%\n    );\n  transform: translateX(-55%) rotate(8deg);\n  transition: transform 650ms cubic-bezier(.2,.8,.2,1);\n  opacity: 0.75;\n}\n\n.stea-glow-btn span {\n  position: relative;\n  z-index: 1;\n}\n\n.stea-glow-btn.is-hovered {\n  transform: translateY(-4px) scale(1.025);\n  border-color: rgba(255, 187, 60, 0.95);\n  box-shadow:\n    0 0 0 1px rgba(255, 175, 40, 0.22),\n    0 20px 65px rgba(255, 145, 0, 0.34),\n    0 0 35px rgba(255, 160, 0, 0.18);\n}\n\n.stea-glow-btn.is-hovered::before {\n  transform: translateX(55%) rotate(8deg);\n}\n"},{"order":2,"language":"markdown","content":"# STEA Glow Motion Button\n\nA lightweight animated CTA button built with HTML and CSS.\n\n## Usage\n\n1. Copy the button markup from index.html.\n2. Copy the styles from style.css.\n3. Change the text, colors, padding, and radius as needed.\n\nNo JavaScript or external dependency is required.\n","path":"README.md"}]', '2026-09-14T16:45:24.876Z', 'test-admin');
INSERT OR REPLACE INTO entitlements (id, userId, productId, source, orderId, licenseType) VALUES ('order_iXtB16GCXyZV5lC6qBuM', 'HZbc8KECM0PeDc2B84iLNL6PZeq2', 'order-success-animation', 'stripe_reconciliation', 'iXtB16GCXyZV5lC6qBuM', 'personal');
INSERT OR REPLACE INTO entitlements (id, userId, productId, source, orderId, licenseType) VALUES ('order_zFIQHUTUpRvXfWgLRE0t', 'HZbc8KECM0PeDc2B84iLNL6PZeq2', 'slide-page-transition', 'stripe_reconciliation', 'zFIQHUTUpRvXfWgLRE0t', 'personal');
INSERT OR REPLACE INTO entitlements (id, userId, productId, source, orderId, licenseType) VALUES ('reconciled_l8TrMPIUjuNmEl91zjGP', 'HZbc8KECM0PeDc2B84iLNL6PZeq2', 'particles-background', 'stripe_reconciliation', 'l8TrMPIUjuNmEl91zjGP', 'personal');
INSERT OR REPLACE INTO entitlements (id, userId, productId, source, orderId, licenseType) VALUES ('reconciled_zQ8JHK8pcCuvFA9kpqaY', 'HZbc8KECM0PeDc2B84iLNL6PZeq2', 'order-success-animation', 'stripe_reconciliation', 'zQ8JHK8pcCuvFA9kpqaY', 'personal');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('6KRoZ2ZWK7xSuJV9WWBv', 'HZbc8KECM0PeDc2B84iLNL6PZeq2', 'slide-page-transition', 'USD', 'pending', '2026-08-28T09:42:52.267Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('8jykXOFszLGTT8euzUPp', 'HZbc8KECM0PeDc2B84iLNL6PZeq2', 'magnetic-text-reveal', 'USD', 'pending', '2026-08-28T13:00:34.358Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('Aqu5P67OlHrzOhvyYV06', 'QaHIZ6J6lTU28YgzeNn33naHIVs2', 'order-success-animation', 'USD', 'pending', '2026-08-28T09:16:34.315Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('BOM98uewxK1i47EtunzB', 'HZbc8KECM0PeDc2B84iLNL6PZeq2', 'order-success-animation', 'USD', 'pending', '2026-08-28T09:42:29.191Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('BpwTD8fZksOzHlFXRv96', 'QaHIZ6J6lTU28YgzeNn33naHIVs2', 'order-success-animation', 'USD', 'pending', '2026-08-28T09:16:33.579Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('BxaBe6GFZsA9XqvjVg0V', 'QaHIZ6J6lTU28YgzeNn33naHIVs2', 'order-success-animation', 'USD', 'pending', '2026-08-28T09:16:34.345Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('CmAkYlKGspyeEcQ4uOw1', 'QaHIZ6J6lTU28YgzeNn33naHIVs2', 'order-success-animation', 'USD', 'pending', '2026-08-28T09:13:24.895Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('GPiEYBMhuZtorbgoX4JS', 'QaHIZ6J6lTU28YgzeNn33naHIVs2', 'order-success-animation', 'USD', 'pending', '2026-08-28T09:16:33.580Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('GzV5tRBzboYPzblTioPo', 'QaHIZ6J6lTU28YgzeNn33naHIVs2', 'order-success-animation', 'USD', 'pending', '2026-08-28T09:16:34.342Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('I3bIMccNm5riYj7G3WTZ', 'QaHIZ6J6lTU28YgzeNn33naHIVs2', 'order-success-animation', 'USD', 'pending', '2026-08-28T09:16:34.351Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('J0cQCeK82KAfuVGe01rs', 'QaHIZ6J6lTU28YgzeNn33naHIVs2', 'order-success-animation', 'USD', 'pending', '2026-08-28T09:13:28.717Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('KZUqwaAKr9no0vMECaXJ', 'HZbc8KECM0PeDc2B84iLNL6PZeq2', 'magnetic-text-reveal', 'USD', 'pending', '2026-08-28T13:00:33.654Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('PlveQ2RXRfpo885jJagn', 'HZbc8KECM0PeDc2B84iLNL6PZeq2', 'slide-page-transition', 'USD', 'pending', '2026-08-28T09:42:52.307Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('SqYyVFqjHDhXniKujBG2', 'HZbc8KECM0PeDc2B84iLNL6PZeq2', 'order-success-animation', 'USD', 'pending', '2026-08-28T09:42:29.194Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('YhQafU6yNE6xZv9LYglr', 'HZbc8KECM0PeDc2B84iLNL6PZeq2', 'slide-page-transition', 'USD', 'pending', '2026-08-28T13:08:08.808Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('aJv9jjvXCvglG0LwX2Dg', 'QaHIZ6J6lTU28YgzeNn33naHIVs2', 'order-success-animation', 'USD', 'pending', '2026-08-28T09:13:24.894Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('cEvMVbY9FqPPyxr3NPrP', 'QaHIZ6J6lTU28YgzeNn33naHIVs2', 'order-success-animation', 'USD', 'pending', '2026-08-28T19:53:17.178Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('dmYCf36py2EO8wqYrf14', 'HZbc8KECM0PeDc2B84iLNL6PZeq2', 'order-success-animation', 'USD', 'pending', '2026-08-28T09:33:14.092Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('eOC1YEP34UXLNBstsLUg', 'HZbc8KECM0PeDc2B84iLNL6PZeq2', 'particles-background', 'USD', 'pending', '2026-08-28T10:38:43.907Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('iXtB16GCXyZV5lC6qBuM', 'HZbc8KECM0PeDc2B84iLNL6PZeq2', 'order-success-animation', 'USD', 'paid', '2026-08-28T09:42:29.250Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('kQkJeJ1fltTxh1c5RUGE', 'HZbc8KECM0PeDc2B84iLNL6PZeq2', 'order-success-animation', 'USD', 'pending', '2026-08-28T09:33:17.932Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('l8TrMPIUjuNmEl91zjGP', 'HZbc8KECM0PeDc2B84iLNL6PZeq2', 'particles-background', 'USD', 'paid', '2026-08-28T10:38:44.097Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('lcs8RaAYUtr5EApmDM0d', 'QaHIZ6J6lTU28YgzeNn33naHIVs2', 'order-success-animation', 'USD', 'pending', '2026-08-28T09:16:34.352Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('noxuTOpjSb90hTRanNOW', 'QaHIZ6J6lTU28YgzeNn33naHIVs2', 'order-success-animation', 'USD', 'pending', '2026-08-28T09:16:34.343Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('nqB8SaNWvzdBvUTgdCHK', 'QaHIZ6J6lTU28YgzeNn33naHIVs2', 'order-success-animation', 'USD', 'pending', '2026-08-28T09:13:24.836Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('osZTdW3O1I1AB1KWKxPY', 'QaHIZ6J6lTU28YgzeNn33naHIVs2', 'order-success-animation', 'USD', 'pending', '2026-08-28T19:53:17.181Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('qiocpf9TvZ06e6fiqZM6', 'HZbc8KECM0PeDc2B84iLNL6PZeq2', 'order-success-animation', 'USD', 'pending', '2026-08-28T09:42:29.181Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('tzSpMPXYNFIJWwGItpiv', 'QaHIZ6J6lTU28YgzeNn33naHIVs2', 'order-success-animation', 'USD', 'pending', '2026-08-28T09:16:34.350Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('vC23RsBkSz28NgpmdQnc', 'HZbc8KECM0PeDc2B84iLNL6PZeq2', 'order-success-animation', 'USD', 'pending', '2026-08-28T09:42:29.221Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('wfdPrGtEcooijUMdpDRY', 'QaHIZ6J6lTU28YgzeNn33naHIVs2', 'order-success-animation', 'USD', 'pending', '2026-08-28T09:13:25.152Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('xuxMmIs9WQxUcxGrXBiw', 'HZbc8KECM0PeDc2B84iLNL6PZeq2', 'order-success-animation', 'USD', 'pending', '2026-08-28T09:33:14.296Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('zFIQHUTUpRvXfWgLRE0t', 'HZbc8KECM0PeDc2B84iLNL6PZeq2', 'slide-page-transition', 'USD', 'paid', '2026-08-28T13:08:09.720Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('zQ8JHK8pcCuvFA9kpqaY', 'HZbc8KECM0PeDc2B84iLNL6PZeq2', 'order-success-animation', 'USD', 'paid', '2026-08-28T09:42:29.552Z');
INSERT OR REPLACE INTO orders (id, userId, productId, currency, status, createdAt) VALUES ('zheVaA2TldXna65wXBOn', 'QaHIZ6J6lTU28YgzeNn33naHIVs2', 'order-success-animation', 'USD', 'pending', '2026-08-28T09:16:34.342Z');