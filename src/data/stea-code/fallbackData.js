/**
 * STEA Code — Fallback Data
 *
 * High-quality local data used only when Firestore is empty or unavailable.
 * Firestore data always wins (CMS data is source of truth).
 * Never render blank pages.
 */

/* ========================================================================
 * 1. CODE SNIPPETS FALLBACK
 * ====================================================================== */
export const FALLBACK_CODE_SNIPPETS = [
  {
    id: "fallback-gradient-text",
    title: "Animated Gradient Text",
    description: "A clean headline effect for hero sections and launch pages.",
    category: "Animated Text",
    framework: "HTML + CSS",
    language: "CSS",
    difficulty: "Beginner",
    tags: ["text", "animation", "hero"],
    preview: "Build better.",
    thumbnailUrl: "",
    codeCss: `.gradient-title {
  font-size: clamp(2.5rem, 8vw, 5rem);
  font-weight: 900;
  background: linear-gradient(90deg, #f5a623, #e0a043, #f5d089);
  background-size: 220% 100%;
  -webkit-background-clip: text;
  color: transparent;
  animation: shine 5s ease infinite;
}
@keyframes shine {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}`,
  },
  {
    id: "fallback-react-navbar",
    title: "Compact Responsive Navbar",
    description: "Small navigation with mobile menu state and no layout shift.",
    category: "Navigation",
    framework: "React",
    language: "JSX",
    difficulty: "Beginner",
    tags: ["navigation", "mobile", "header"],
    preview: "Logo | Code Tips Hosting",
    codeReact: `import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const links = ["Code", "Tips", "Hosting", "Domains"];

  return (
    <header className="nav">
      <a href="/" className="brand"><strong>STEA</strong></a>
      <nav className="nav-links">
        {links.map(l => (
          <a key={l} href={\`#\${l.toLowerCase()}\`}>{l}</a>
        ))}
      </nav>
      <button
        className="nav-toggle"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-label="Toggle menu"
      >
        {open ? "Close" : "Menu"}
      </button>
      {open && (
        <div className="nav-mobile">
          {links.map(l => <a key={l} href={\`#\${l.toLowerCase()}\`}>{l}</a>)}
        </div>
      )}
    </header>
  );
}`,
  },
  {
    id: "fallback-glass-card",
    title: "Subtle Dark Card Surface",
    description: "A restrained elevated surface for developer dashboards.",
    category: "Cards",
    framework: "CSS",
    language: "CSS",
    difficulty: "Beginner",
    tags: ["card", "surface", "ui"],
    preview: "Card with quiet border and soft shadow",
    codeCss: `.dev-card {
  background: color-mix(in srgb, #0d1117 86%, white 4%);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 16px;
  box-shadow: 0 18px 48px rgba(0,0,0,.22);
  padding: 20px;
  transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
}
.dev-card:hover {
  transform: translateY(-2px);
  border-color: rgba(245,166,35,.35);
  box-shadow: 0 22px 56px rgba(245,166,35,.08);
}`,
  },
  {
    id: "fallback-button-hover",
    title: "Premium Button Interaction",
    description: "Gold CTA that lifts on hover and presses on click.",
    category: "Buttons",
    framework: "HTML + CSS",
    language: "CSS",
    difficulty: "Beginner",
    tags: ["button", "cta", "interaction"],
    preview: "Hover me",
    codeCss: `.btn-primary {
  border: 1px solid rgba(245,166,35,.45);
  border-radius: 12px;
  background: #f5a623;
  color: #05070a;
  font-weight: 700;
  padding: 12px 18px;
  transition: transform .18s ease, filter .18s ease;
}
.btn-primary:hover {
  transform: translateY(-1px);
  filter: brightness(1.06);
}
.btn-primary:active {
  transform: scale(.98);
}`,
  },
  {
    id: "fallback-pulse-dot",
    title: "Live Status Pulse Dot",
    description: "A subtle pulsing indicator for status badges.",
    category: "Background Effects",
    framework: "HTML + CSS",
    language: "CSS",
    difficulty: "Beginner",
    tags: ["status", "indicator", "badge"],
    preview: "● Live",
    codeCss: `.live-dot {
  position: relative;
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
}
.live-dot::after {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: rgba(34,197,94,.35);
  animation: pulse 1.6s ease-out infinite;
}
@keyframes pulse {
  0%   { transform: scale(.6); opacity: .8; }
  100% { transform: scale(1.8); opacity: 0; }
}`,
  },
  {
    id: "fallback-tabs-component",
    title: "Accessible Tabs",
    description: "Keyboard-friendly tab switcher with active state.",
    category: "Tabs",
    framework: "React",
    language: "JSX",
    difficulty: "Intermediate",
    tags: ["tabs", "a11y", "component"],
    preview: "Overview | Code | Preview",
    codeReact: `import { useState, useId } from "react";

export default function Tabs({ items = [] }) {
  const [idx, setIdx] = useState(0);
  const id = useId();
  return (
    <div>
      <div role="tablist" className="tabs-list">
        {items.map((it, i) => (
          <button
            key={it.label}
            role="tab"
            id={\`\${id}-\${i}\`}
            aria-selected={i === idx}
            aria-controls={\`\${id}-panel-\${i}\`}
            className={i === idx ? "active" : ""}
            onClick={() => setIdx(i)}
          >
            {it.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={\`\${id}-panel-\${idx}\`}
        aria-labelledby={\`\${id}-\${idx}\`}
      >
        {items[idx]?.content}
      </div>
    </div>
  );
}`,
  },
];

export const CODE_FILTERS = [
  "All",
  "HTML/CSS",
  "JavaScript",
  "React",
  "Next.js",
  "Tailwind",
  "GSAP",
  "Motion",
  "Three.js",
];

export const CODE_CATEGORIES = [
  "Animated Text",
  "Hero Effects",
  "Buttons",
  "Navigation",
  "Cards",
  "Background Effects",
  "Loaders",
  "Scroll Animations",
  "Forms",
  "Modals",
  "Tabs",
  "Accordions",
  "Carousels",
  "Sidebars",
  "Pricing",
  "Authentication UI",
];

/* ========================================================================
 * 2. TECH TIPS FALLBACK
 * ====================================================================== */
export const FALLBACK_TECH_TIPS = [
  {
    id: "fallback-tip-useeffect-deps",
    title: "Keep useEffect dependencies honest",
    category: "React",
    benefit: "Avoid stale closures and infinite re-renders.",
    difficulty: "Intermediate",
    readTime: "3 min",
    problem: "Your component reads old state or re-runs effects on every render.",
    why:
      "Missing dependencies cause closures to capture stale values. Extra dependencies cause effects to fire too often.",
    fix: "List every reactive value referenced inside the effect. Use the ESLint exhaustive-deps rule. If you only want to run once, move calculations out of the effect or memoize helpers.",
    example: `// Wrong — count is stale inside the interval
useEffect(() => {
  setInterval(() => console.log(count), 1000);
}, []); // 👈 missing count

// Correct — include count, clear interval
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000);
  return () => clearInterval(id);
}, [count]);`,
    commonMistake: "Suppressing the linter with // eslint-disable-next-line react-hooks/exhaustive-deps without a real reason.",
    relatedTools: ["ESLint", "React DevTools"],
  },
  {
    id: "fallback-tip-css-clamp",
    title: "Fluid typography with clamp()",
    category: "CSS",
    benefit: "Titles that scale without media queries.",
    difficulty: "Beginner",
    readTime: "2 min",
    problem: "Your headlines are too big on mobile and too small on desktop, and you have too many breakpoints.",
    why: "Using fixed px sizes and a pile of media queries breaks at edge widths.",
    fix: "Use clamp(min, preferred-viewport-unit, max) for headline sizes.",
    example: `h1 {
  font-size: clamp(2rem, 5vw + 1rem, 4.5rem);
  line-height: 1.05;
}

p {
  font-size: clamp(1rem, 0.5vw + 0.9rem, 1.125rem);
}`,
    commonMistake: "Using vw without a minimum, making text unreadable on small screens.",
    relatedTools: ["MDN clamp()", "Utopia fluid type calculator"],
  },
  {
    id: "fallback-tip-git-reset",
    title: "Undo the last commit safely",
    category: "Git",
    benefit: "Fix mistakes without losing your work.",
    difficulty: "Beginner",
    readTime: "2 min",
    problem: "You committed too early or with the wrong message.",
    why: "Beginners often hard-reset and lose changes they wanted to keep.",
    fix: "Use git reset --soft HEAD~1 to keep your changes staged, then fix and re-commit.",
    example: `# Keep changes staged — most common safe undo
git reset --soft HEAD~1

# Keep changes but unstage them
git reset --mixed HEAD~1

# Destroy changes (only if you are sure!)
git reset --hard HEAD~1`,
    commonMistake: "Running git reset --hard without having a backup.",
    relatedTools: ["git reflog", "GitHub Desktop"],
  },
  {
    id: "fallback-tip-firebase-rules",
    title: "Never ship production with open Firestore rules",
    category: "Firebase",
    benefit: "Prevent anyone from reading or writing your whole database.",
    difficulty: "Intermediate",
    readTime: "4 min",
    problem: "Your test rules say allow read, write: if true; and you forgot to tighten them.",
    why: "Firebase default demo-mode rules expire after 30 days, but open rules allow any client to dump your entire database.",
    fix: "Write rules that check auth(), user IDs, and validate data shapes. Test in the Rules Playground before deploying.",
    example: `rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /public/{doc=**} {
      allow read;
      allow write: if request.auth.token.admin == true;
    }
  }
}`,
    commonMistake: "Using allow read, write: if true; in production because 'we will fix it later'.",
    relatedTools: ["Firebase Rules Playground", "Firebase Emulator Suite"],
  },
  {
    id: "fallback-tip-chrome-network",
    title: "Slow page? Start in the Network tab.",
    category: "Browser DevTools",
    benefit: "Find the real bottleneck in 30 seconds.",
    difficulty: "Beginner",
    readTime: "2 min",
    problem: "Your site feels slow but you don't know why.",
    why: "Most performance fixes are guesses without data. DevTools tells you exactly what costs time.",
    fix: "Open DevTools → Network → check 'Disable cache' → reload. Sort by Time descending. Look for the biggest resources and the longest waterfalls.",
    example: `Things to spot immediately:
• A 4MB image that should be compressed
• 20 blocking JS bundles instead of 3
• A font request waiting 2s on a slow domain
• A script loaded twice from different URLs`,
    commonMistake: "Only testing on fast Wi-Fi. Enable throttling to 'Slow 3G'.",
    relatedTools: ["Lighthouse", "PageSpeed Insights"],
  },
  {
    id: "fallback-tip-js-promises",
    title: "Promise.all vs Promise.allSettled",
    category: "JavaScript",
    benefit: "Know which to use before you have production errors.",
    difficulty: "Intermediate",
    readTime: "3 min",
    problem: "One failing API call crashes your whole dashboard.",
    why: "Promise.all rejects immediately if any promise rejects. Good for dependent calls, bad for independent widgets.",
    fix: "Use Promise.allSettled for independent requests so one failure does not take the page down.",
    example: `// Any single API fails → entire page shows error
const all = await Promise.all([fetchA(), fetchB(), fetchC()]);

// One failing API still lets you render the other two
const settled = await Promise.allSettled([fetchA(), fetchB(), fetchC()]);
settled.forEach(result => {
  if (result.status === "fulfilled") renderOk(result.value);
  else renderFallback();
});`,
    commonMistake: "Using Promise.all everywhere because it is the first one you learned.",
    relatedTools: ["Promise.race", "Promise.any"],
  },
];

export const TIPS_CATEGORIES = [
  "Frontend",
  "React",
  "JavaScript",
  "CSS",
  "TypeScript",
  "Git",
  "GitHub",
  "Terminal",
  "Debugging",
  "Performance",
  "Accessibility",
  "SEO",
  "Security",
  "APIs",
  "Firebase",
  "Databases",
  "Deployment",
  "PWA",
  "AI-assisted Development",
  "Browser DevTools",
];

/* ========================================================================
 * 3. HOSTING FALLBACK
 * ====================================================================== */
export const FALLBACK_HOSTING = [
  {
    id: "fallback-hosting-firebase",
    name: "Firebase Hosting",
    description: "Best for Firebase apps, SPAs, and fast static deploys with global CDN.",
    bestFor: "Firebase-backed apps, portfolios, marketing sites",
    difficulty: "Beginner",
    type: "Static / SPA",
    freeTier: "Yes — generous bandwidth and storage",
    logo: "🔥",
    url: "https://firebase.google.com/products/hosting",
    guideUrl: "/code?view=guides",
  },
  {
    id: "fallback-hosting-vercel",
    name: "Vercel",
    description: "Best for Next.js, React apps, and instant preview deployments per PR.",
    bestFor: "Next.js, full-stack React frameworks",
    difficulty: "Beginner",
    type: "Full-stack / Next.js",
    freeTier: "Yes — hobby plan for personal projects",
    logo: "▲",
    url: "https://vercel.com",
    guideUrl: "/code?view=guides",
  },
  {
    id: "fallback-hosting-netlify",
    name: "Netlify",
    description: "Best for static sites, built-in forms, and simple Git-based deploys.",
    bestFor: "Static sites, landing pages, docs",
    difficulty: "Beginner",
    type: "Static",
    freeTier: "Yes — 100GB bandwidth / month",
    logo: "◆",
    url: "https://www.netlify.com",
    guideUrl: "/code?view=guides",
  },
  {
    id: "fallback-hosting-cloudflare-pages",
    name: "Cloudflare Pages",
    description: "Best for fast global static sites with Workers integration and zero cold starts.",
    bestFor: "Static sites, docs, edge-rendered apps",
    difficulty: "Beginner",
    type: "Static / Edge",
    freeTier: "Yes — unlimited bandwidth for personal projects",
    logo: "⬡",
    url: "https://pages.cloudflare.com",
    guideUrl: "/code?view=guides",
  },
  {
    id: "fallback-hosting-github-pages",
    name: "GitHub Pages",
    description: "Best for free project pages, documentation, and open-source sites.",
    bestFor: "Docs, portfolios, project pages",
    difficulty: "Beginner",
    type: "Static",
    freeTier: "Yes — free for public repos",
    logo: "🐙",
    url: "https://pages.github.com",
    guideUrl: "/code?view=guides",
  },
];

export const HOSTING_FILTERS = [
  "All",
  "Static",
  "React SPA",
  "Next.js",
  "Full-stack",
  "Backend",
  "Firebase",
  "Portfolio",
  "Documentation",
];

export const HOSTING_COMPARISONS = [
  { label: "Best for beginners", winner: "Firebase Hosting", reason: "Simple CLI, generous free tier, no config for SPAs." },
  { label: "Best for Next.js", winner: "Vercel", reason: "Built by the Next.js team — all features ship day-one." },
  { label: "Best Firebase integration", winner: "Firebase Hosting", reason: "Connects natively to Firestore, Auth, Functions." },
  { label: "Best static hosting", winner: "Cloudflare Pages", reason: "Unlimited bandwidth + fastest global edge network." },
];

/* ========================================================================
 * 4. DOMAINS FALLBACK
 * ====================================================================== */
export const FALLBACK_DOMAINS_SECTIONS = [
  {
    id: "basics",
    title: "Domain Basics",
    items: [
      { term: "Domain name", meaning: "The human-readable address people type (e.g. stea.africa)." },
      { term: "Hosting", meaning: "The computer (server) that stores your website files." },
      { term: "Domain vs Hosting", meaning: "A domain is the address. Hosting is the house. You need both." },
      { term: "Root domain", meaning: "The base domain without www or subdomains — stea.africa, not www.stea.africa." },
      { term: "Subdomain", meaning: "A prefix like code.stea.africa — free, unlimited, and configured via DNS." },
      { term: "SSL / HTTPS", meaning: "The security layer that encrypts traffic between browser and server. Modern browsers require it." },
      { term: "Propagation", meaning: "The time it takes for DNS changes to spread across the internet — usually minutes to 48 hours." },
    ],
  },
  {
    id: "records",
    title: "DNS Records You Actually Use",
    items: [
      { term: "A record", meaning: "Maps a domain to an IPv4 address (e.g. 104.21.1.1)." },
      { term: "AAAA record", meaning: "Maps a domain to an IPv6 address." },
      { term: "CNAME", meaning: "Maps a domain to ANOTHER domain name (aliases). Example: www → stea.africa." },
      { term: "TXT record", meaning: "Stores text notes — used for domain ownership verification, SPF/DKIM email auth, ACME challenges." },
      { term: "MX record", meaning: "Tells email which server handles mail for the domain (e.g. Google Workspace, Outlook)." },
      { term: "Nameservers (NS)", meaning: "Which DNS provider's servers answer for your domain. Change these when you move registrars or use Cloudflare." },
    ],
  },
  {
    id: "registrars",
    title: "Recommended Registrars",
    items: [
      { term: "Cloudflare Registrar", meaning: "At-cost pricing, free WHOIS privacy, great if you use Cloudflare DNS." },
      { term: "Namecheap", meaning: "Simple interface, good prices, solid for beginners." },
      { term: "Google Domains → Squarespace Domains", meaning: "Clean UX, fair pricing; now operated by Squarespace." },
    ],
  },
  {
    id: "mistakes",
    title: "Common Mistakes",
    items: [
      { term: "Forgetting both www and root", meaning: "Set one with an A/AAAA and the other with a CNAME or redirect." },
      { term: "Using http in 2026", meaning: "Every host offers free SSL now. There is no excuse for http://." },
      { term: "Low TTL during setup", meaning: "Lower TTL (e.g. 300s) before changes, then raise it afterward." },
      { term: "Skipping WHOIS privacy", meaning: "Leave it on. Your home address should not be public registry data." },
      { term: "Buying hosting at the registrar only", meaning: "Shop around. Bundles are rarely the best long-term deal." },
    ],
  },
  {
    id: "tools",
    title: "Useful Tools",
    items: [
      { term: "ICANN Lookup", meaning: "https://lookup.icann.org — WHOIS history and registrar info." },
      { term: "Cloudflare DNS", meaning: "https://dash.cloudflare.com — free global DNS with fast propagation." },
      { term: "DNS Checker", meaning: "https://dnschecker.org — see propagation across regions." },
      { term: "SSL Labs", meaning: "https://www.ssllabs.com/ssltest — audit your HTTPS configuration." },
    ],
  },
];

/* ========================================================================
 * 5. INSPIRATION FALLBACK
 * ====================================================================== */
export const FALLBACK_INSPIRATION = [
  {
    id: "fallback-insp-awwwards",
    name: "Awwwards",
    category: "Landing Pages",
    whyUseful: "Industry-leading award gallery; the highest bar for interaction and visual craft.",
    screenshot: "",
    url: "https://www.awwwards.com",
  },
  {
    id: "fallback-insp-landbook",
    name: "Land-book",
    category: "Landing Pages",
    whyUseful: "Large library of landing pages filterable by industry and layout.",
    screenshot: "",
    url: "https://land-book.com",
  },
  {
    id: "fallback-insp-onepagelove",
    name: "One Page Love",
    category: "Portfolio",
    whyUseful: "Curated one-page sites, templates, and landing pages — a fast way to study layout.",
    screenshot: "",
    url: "https://onepagelove.com",
  },
  {
    id: "fallback-insp-siteinspire",
    name: "Siteinspire",
    category: "Typography",
    whyUseful: "Editorial and agency sites with excellent type hierarchy and whitespace.",
    screenshot: "",
    url: "https://www.siteinspire.com",
  },
  {
    id: "fallback-insp-godly",
    name: "Godly",
    category: "Animation",
    whyUseful: "Modern product and animation inspiration — great for WebGL and motion ideas.",
    screenshot: "",
    url: "https://godly.website",
  },
  {
    id: "fallback-insp-saaslp",
    name: "SaaS Landing Page",
    category: "SaaS",
    whyUseful: "Hundreds of SaaS hero sections, pricing tables, and feature blocks.",
    screenshot: "",
    url: "https://saaslandingpage.com",
  },
];

export const INSPIRATION_FILTERS = [
  "All",
  "Landing Pages",
  "Portfolio",
  "SaaS",
  "E-commerce",
  "Typography",
  "Animation",
  "Mobile",
  "Editorial",
  "Experimental",
];

/* ========================================================================
 * 6. UI LIBRARIES FALLBACK
 * ====================================================================== */
export const FALLBACK_UI_LIBRARIES = [
  {
    id: "fallback-ui-shadcn",
    name: "shadcn/ui",
    category: "Copy-paste Components",
    what: "Beautifully designed components that you copy and paste into your app. Not a dependency.",
    bestFor: "React + TypeScript + Tailwind projects that want premium polish without bloat.",
    stack: "React / TypeScript / Tailwind",
    difficulty: "Intermediate",
    url: "https://ui.shadcn.com",
  },
  {
    id: "fallback-ui-radix",
    name: "Radix UI",
    category: "Accessible Primitives",
    what: "Unstyled, accessible React primitives for dialogs, menus, dropdowns, tabs, and more.",
    bestFor: "Teams that care about accessibility and design their own look.",
    stack: "React / TypeScript",
    difficulty: "Intermediate",
    url: "https://www.radix-ui.com",
  },
  {
    id: "fallback-ui-lucide",
    name: "Lucide",
    category: "Icons",
    what: "A clean, open-source icon set with 1000+ beautifully consistent SVG icons.",
    bestFor: "Every web project — React, Vue, Svelte, plain SVG.",
    stack: "Universal",
    difficulty: "Beginner",
    url: "https://lucide.dev",
  },
  {
    id: "fallback-ui-heroicons",
    name: "Heroicons",
    category: "Icons",
    what: "Simple, well-balanced SVG icons made by the Tailwind CSS team.",
    bestFor: "Tailwind projects that want a matched icon weight.",
    stack: "Universal",
    difficulty: "Beginner",
    url: "https://heroicons.com",
  },
  {
    id: "fallback-ui-motion",
    name: "Motion (Framer Motion)",
    category: "Animation",
    what: "Declarative React animations, gestures, layouts, and exit states.",
    bestFor: "Production-ready page transitions and UI micro-interactions.",
    stack: "React",
    difficulty: "Intermediate",
    url: "https://www.framer.com/motion",
  },
  {
    id: "fallback-ui-gsap",
    name: "GSAP",
    category: "Animation",
    what: "Industry-standard JavaScript animation library — ScrollTrigger, timelines, SVG, 3D.",
    bestFor: "High-end marketing sites with scroll-driven animation and complex timelines.",
    stack: "Universal",
    difficulty: "Advanced",
    url: "https://gsap.com",
  },
  {
    id: "fallback-ui-google-fonts",
    name: "Google Fonts",
    category: "Typography",
    what: "Free, fast-hosted web fonts with easy embedding and variable-font support.",
    bestFor: "Every site — the fastest way to get off system fonts.",
    stack: "Universal",
    difficulty: "Beginner",
    url: "https://fonts.google.com",
  },
];

export const UI_CATEGORIES = [
  "All",
  "Component Systems",
  "Copy-paste Components",
  "Accessible Primitives",
  "Icons",
  "Typography",
  "Animation",
  "React",
  "Tailwind",
  "CSS",
];

/* ========================================================================
 * 7. DEVELOPER ESSENTIALS FALLBACK
 * ====================================================================== */
export const FALLBACK_ESSENTIALS = [
  // Documentation
  { id: "ess-mdn", name: "MDN", group: "Documentation", badge: "Reference", desc: "The real web platform docs. Every browser API, CSS property, and JS feature.", url: "https://developer.mozilla.org" },
  { id: "ess-webdev", name: "web.dev", group: "Documentation", badge: "Reference", desc: "Google's guides for performance, PWA, and Core Web Vitals.", url: "https://web.dev" },
  { id: "ess-caniuse", name: "Can I Use", group: "Documentation", badge: "Reference", desc: "Browser support tables for every modern web feature.", url: "https://caniuse.com" },
  { id: "ess-reactdocs", name: "React Docs", group: "Documentation", badge: "Framework", desc: "Official React docs, examples, and patterns.", url: "https://react.dev" },
  { id: "ess-tsdocs", name: "TypeScript Docs", group: "Documentation", badge: "Reference", desc: "Official TS handbook and language reference.", url: "https://www.typescriptlang.org/docs" },
  { id: "ess-nodedocs", name: "Node.js Docs", group: "Documentation", badge: "Runtime", desc: "Node standard library and APIs.", url: "https://nodejs.org/docs" },

  // Browser & Debugging
  { id: "ess-chromedev", name: "Chrome DevTools", group: "Browser & Debugging", badge: "Debug", desc: "Network, performance, console, sources, and device mode.", url: "https://developer.chrome.com/docs/devtools" },
  { id: "ess-firefoxdev", name: "Firefox DevTools", group: "Browser & Debugging", badge: "Debug", desc: "Excellent CSS inspector and grid/flex debugging.", url: "https://firefox-source-docs.mozilla.org/devtools-user" },

  // API & Network
  { id: "ess-postman", name: "Postman", group: "API & Network", badge: "API", desc: "Build, test, and document APIs.", url: "https://www.postman.com" },
  { id: "ess-hoppscotch", name: "Hoppscotch", group: "API & Network", badge: "API", desc: "Open-source, lightweight API client — runs in the browser.", url: "https://hoppscotch.io" },

  // Git & Packages
  { id: "ess-github", name: "GitHub", group: "Git & Packages", badge: "Host", desc: "Code hosting, pull requests, issues, and CI.", url: "https://github.com" },
  { id: "ess-gitdocs", name: "Git docs", group: "Git & Packages", badge: "Reference", desc: "Official Git reference and Pro Git book.", url: "https://git-scm.com/doc" },
  { id: "ess-npm", name: "npm", group: "Git & Packages", badge: "Registry", desc: "The default Node package manager.", url: "https://www.npmjs.com" },
  { id: "ess-pnpm", name: "pnpm", group: "Git & Packages", badge: "Package", desc: "Fast, disk-space-efficient package manager.", url: "https://pnpm.io" },

  // Testing
  { id: "ess-playwright", name: "Playwright", group: "Testing", badge: "E2E", desc: "Reliable end-to-end tests across browsers.", url: "https://playwright.dev" },
  { id: "ess-vitest", name: "Vitest", group: "Testing", badge: "Unit", desc: "Vite-native unit testing framework.", url: "https://vitest.dev" },
  { id: "ess-testinglib", name: "Testing Library", group: "Testing", badge: "Unit", desc: "Simple and complete testing utilities for UI components.", url: "https://testing-library.com" },

  // Performance
  { id: "ess-lighthouse", name: "Lighthouse", group: "Performance", badge: "Audit", desc: "Google's automated quality audit for performance, a11y, SEO.", url: "https://developer.chrome.com/docs/lighthouse/overview" },
  { id: "ess-pagespeed", name: "PageSpeed Insights", group: "Performance", badge: "Audit", desc: "Lighthouse data + CrUX real-user field data.", url: "https://pagespeed.web.dev" },
  { id: "ess-squoosh", name: "Squoosh", group: "Performance", badge: "Image", desc: "Client-side image compression to WebP, AVIF, and more.", url: "https://squoosh.app" },

  // Accessibility
  { id: "ess-wai", name: "WAI / WCAG", group: "Accessibility", badge: "Standard", desc: "The official W3C web accessibility standards.", url: "https://www.w3.org/WAI" },
  { id: "ess-wave", name: "WAVE", group: "Accessibility", badge: "Audit", desc: "Browser extension that visualizes a11y errors directly on the page.", url: "https://wave.webaim.org" },
  { id: "ess-axe", name: "axe", group: "Accessibility", badge: "Audit", desc: "Automated accessibility testing engine for dev pipelines.", url: "https://www.deque.com/axe" },

  // UI & Components
  { id: "ess-shadcn", name: "shadcn/ui", group: "UI & Components", badge: "Components", desc: "Copy-paste premium components for React + Tailwind.", url: "https://ui.shadcn.com" },
  { id: "ess-radix", name: "Radix UI", group: "UI & Components", badge: "Primitives", desc: "Unstyled, accessible React primitives.", url: "https://www.radix-ui.com" },
  { id: "ess-lucide2", name: "Lucide", group: "UI & Components", badge: "Icons", desc: "Clean, consistent open-source SVG icons.", url: "https://lucide.dev" },
  { id: "ess-fonts", name: "Google Fonts", group: "UI & Components", badge: "Type", desc: "Free hosted web fonts, easy variable font embedding.", url: "https://fonts.google.com" },
  { id: "ess-motion", name: "Motion", group: "UI & Components", badge: "Motion", desc: "Declarative React animations and page transitions.", url: "https://www.framer.com/motion" },

  // Design & Assets
  { id: "ess-unsplash", name: "Unsplash", group: "Design & Assets", badge: "Image", desc: "Free high-quality photography for mockups and sites.", url: "https://unsplash.com" },
  { id: "ess-coolors", name: "Coolors", group: "Design & Assets", badge: "Color", desc: "Fast color palette generator.", url: "https://coolors.co" },
  { id: "ess-svgomg", name: "SVGOMG", group: "Design & Assets", badge: "SVG", desc: "Optimize SVGs with a slider UI — never ship unoptimized icons.", url: "https://jakearchibald.github.io/svgomg" },

  // Database & Backend
  { id: "ess-firebase", name: "Firebase", group: "Database & Backend", badge: "BaaS", desc: "Auth, Firestore, Storage, Hosting, Functions.", url: "https://firebase.google.com" },
  { id: "ess-supabase", name: "Supabase", group: "Database & Backend", badge: "BaaS", desc: "Open-source Firebase alternative built on Postgres.", url: "https://supabase.com" },
  { id: "ess-neon", name: "Neon", group: "Database & Backend", badge: "DB", desc: "Serverless Postgres with branches and fast deploys.", url: "https://neon.tech" },

  // Deployment
  { id: "ess-vercel", name: "Vercel", group: "Deployment", badge: "Host", desc: "The best place for Next.js and preview-per-PR workflows.", url: "https://vercel.com" },
  { id: "ess-cloudflare", name: "Cloudflare", group: "Deployment", badge: "Host", desc: "Pages CDN, Workers edge runtime, zero cold starts.", url: "https://www.cloudflare.com" },
  { id: "ess-netlify", name: "Netlify", group: "Deployment", badge: "Host", desc: "Static sites, forms, serverless — simple Git deploys.", url: "https://www.netlify.com" },
  { id: "ess-ghpages", name: "GitHub Pages", group: "Deployment", badge: "Host", desc: "Free static hosting for repos and docs.", url: "https://pages.github.com" },

  // Security
  { id: "ess-owasp", name: "OWASP Top 10", group: "Security", badge: "Standard", desc: "The top 10 web application security risks — required reading.", url: "https://owasp.org/www-project-top-ten" },
  { id: "ess-secheaders", name: "Security Headers", group: "Security", badge: "Audit", desc: "Scan any URL for missing security headers.", url: "https://securityheaders.com" },

  // AI-assisted Development
  { id: "ess-chatgpt", name: "ChatGPT", group: "AI-assisted Development", badge: "AI", desc: "General-purpose assistant for planning, debugging, and learning.", url: "https://chatgpt.com" },
  { id: "ess-copilot", name: "GitHub Copilot", group: "AI-assisted Development", badge: "AI", desc: "Inline code completions and chat inside your editor.", url: "https://github.com/features/copilot" },
];

export const ESSENTIALS_GROUPS = [
  "All",
  "Documentation",
  "Browser & Debugging",
  "API & Network",
  "Git & Packages",
  "Testing",
  "Performance",
  "Accessibility",
  "UI & Components",
  "Design & Assets",
  "Database & Backend",
  "Deployment",
  "Security",
  "AI-assisted Development",
];

/* ========================================================================
 * 8. FULL GUIDES FALLBACK
 * ====================================================================== */
export const FALLBACK_GUIDES = [
  {
    id: "fallback-guide-first-site",
    title: "Ship your first production website",
    category: "Start Here",
    difficulty: "Beginner",
    readTime: "20 min",
    description:
      "Plan, build, deploy, and connect a custom domain for a real public website. Every step from zero to live URL.",
    sections: [
      { id: "plan", title: "1. Plan one page first", body: "Skip the giant idea. Ship one single page with a clear headline, 2–3 sections, and one CTA. The goal is learning the full loop end-to-end." },
      { id: "build", title: "2. Build in plain HTML/CSS first", body: "Use a single index.html and style.css file. Add semantic headings (h1, h2), navigation, a hero, content sections, and a footer. Do not add JavaScript yet." },
      { id: "test", title: "3. Test locally on mobile", body: "Open DevTools → device emulation at 375px wide. Fix any horizontal scroll, clipped text, or overflow before deploying." },
      { id: "deploy", title: "4. Deploy to Netlify / GitHub Pages", body: "Drag-drop your folder to Netlify Drop (https://app.netlify.com/drop) or push to a GitHub repo and enable Pages. You now have a public https URL." },
      { id: "domain", title: "5. Buy and connect a domain", body: "Buy a domain at Cloudflare Registrar or Namecheap. Point it at your host following their docs. Enable SSL/HTTPS." },
      { id: "lighthouse", title: "6. Run Lighthouse once", body: "Chrome DevTools → Lighthouse → Generate report. Fix the top 3 red items. Ship again." },
    ],
  },
  {
    id: "fallback-guide-react-firebase",
    title: "Build a React app with Firebase backend",
    category: "React",
    difficulty: "Intermediate",
    readTime: "40 min",
    description:
      "Set up Vite + React, add Firebase Auth + Firestore, secure rules, and deploy to Firebase Hosting.",
    sections: [
      { id: "scaffold", title: "1. Scaffold Vite + React", body: "Run: npm create vite@latest my-app -- --template react-ts. Then npm install and npm run dev." },
      { id: "firebase-init", title: "2. Install Firebase SDK", body: "npm install firebase. Create src/firebase.ts and paste the web app config from Firebase console settings. InitializeApp once." },
      { id: "auth", title: "3. Add Email/Password Auth", body: "Enable Email/Password in Firebase console → Auth. Build a simple <AuthForm /> using createUserWithEmailAndPassword and signInWithEmailAndPassword." },
      { id: "firestore", title: "4. Read and write Firestore", body: "Create a todos collection. Use addDoc() to create a todo, onSnapshot() to listen live. Always filter by the current user's uid." },
      { id: "rules", title: "5. Write security rules", body: "Match /todos/{id} and require request.auth.uid == resource.data.uid. Test in Rules Playground before deploying." },
      { id: "deploy", title: "6. Deploy to Firebase Hosting", body: "npm install -g firebase-tools, then firebase login, firebase init hosting (point to dist), npm run build, firebase deploy." },
    ],
  },
  {
    id: "fallback-guide-git-github",
    title: "Git and GitHub for solo developers",
    category: "Git/GitHub",
    difficulty: "Beginner",
    readTime: "15 min",
    description:
      "Stop losing work. Learn the 8 Git commands you actually use every day.",
    sections: [
      { id: "basics", title: "1. The core loop", body: "You edit files. git status sees them. git add stages them. git commit saves them. git push backs them up to GitHub." },
      { id: "init", title: "2. Create a new repo", body: "git init, add a .gitignore for node_modules, git add ., git commit -m 'Initial', then add the GitHub remote and push." },
      { id: "branches", title: "3. Branches for features", body: "git checkout -b feature/my-login. Work, commit, push, open a PR. Merge to main when done." },
      { id: "undo", title: "4. Undo things safely", body: "Undo last commit but keep files: git reset --soft HEAD~1. Discard one file: git checkout HEAD -- file.ts. Discard everything: git reset --hard HEAD." },
      { id: "history", title: "5. Read the log", body: "git log --oneline -10 shows recent commits. git diff shows what changed." },
    ],
  },
  {
    id: "fallback-guide-seo",
    title: "Practical SEO for new websites",
    category: "SEO",
    difficulty: "Beginner",
    readTime: "25 min",
    description:
      "The non-bullshit checklist that actually moves the needle for new sites.",
    sections: [
      { id: "titles", title: "1. Titles and descriptions", body: "Every page needs a unique <title> (50–60 chars) and meta description (120–160 chars). This is the search result. Write it like a human." },
      { id: "headings", title: "2. One H1, real headings hierarchy", body: "One <h1> per page. Real content in <h2>, <h3> order. No divs styled as headings — Google reads tags." },
      { id: "speed", title: "3. Pass Core Web Vitals", body: "Run PageSpeed Insights on the live URL. Fix LCP first (hero images, render-blocking CSS, unused JS)." },
      { id: "ssl", title: "4. HTTPS, www redirect, sitemap", body: "Serve https only, pick one canonical host (www or root), submit /sitemap.xml in Google Search Console." },
      { id: "links", title: "5. Get real inbound links", body: "This is still king. Be useful on forums, write guest posts for one real site, list yourself in 3 relevant directories." },
    ],
  },
  {
    id: "fallback-guide-performance",
    title: "Make your site fast in one afternoon",
    category: "Performance",
    difficulty: "Intermediate",
    readTime: "30 min",
    description:
      "A short priority-ordered checklist for real performance gains.",
    sections: [
      { id: "measure", title: "1. Measure first", body: "Run Lighthouse and note the current numbers. Don't optimize anything until you have a baseline." },
      { id: "images", title: "2. Images are 80% of the win", body: "Serve modern formats (WebP/AVIF), set explicit width/height to prevent CLS, lazy-load below-the-fold images, use srcset for responsive sizes." },
      { id: "js", title: "3. Cut JavaScript", body: "Split routes with dynamic import(), remove unused npm packages, defer non-critical third-party scripts." },
      { id: "css", title: "4. Trim CSS", body: "Aim under 50KB of CSS for the above-the-fold page. Inline critical CSS if you can. Stop adding Tailwind classes you don't need." },
      { id: "cache", title: "5. Good caching = fewer requests", body: "Set long cache TTLs with content hashes. Use HTTP caching, not only localStorage hacks." },
    ],
  },
];

export const GUIDE_CATEGORIES = [
  "All",
  "Start Here",
  "HTML/CSS",
  "JavaScript",
  "React",
  "Firebase",
  "Git/GitHub",
  "Deployment",
  "Domains",
  "APIs",
  "Authentication",
  "Databases",
  "Performance",
  "SEO",
  "Accessibility",
  "PWA",
  "AI Development",
];
