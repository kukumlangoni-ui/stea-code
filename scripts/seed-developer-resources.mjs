import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const PROJECT_ID = "swahilitecheliteacademy";

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error("");
  console.error("REFUSING TO RUN.");
  console.error("FIRESTORE_EMULATOR_HOST is not set.");
  console.error("This seed is intentionally emulator-first.");
  console.error("");
  process.exit(1);
}

initializeApp({ projectId: PROJECT_ID });

const db = getFirestore();

const CATEGORY_ID = "developer-resources";
const CATEGORY_NAME = "Developer Resources";

const sites = [
  {
    name: "STEA Code",
    url: "https://code.stea.africa",
    subcategory: "STEA Code",
    description: "STEA components, source code and developer resources for modern builders."
  },

  {
    name: "Cursor",
    url: "https://cursor.com",
    subcategory: "Vibe Coding",
    description: "AI-powered code editor for building and editing software with AI assistance."
  },
  {
    name: "Lovable",
    url: "https://lovable.dev",
    subcategory: "Vibe Coding",
    description: "AI application builder for creating web products from natural-language instructions."
  },
  {
    name: "Bolt",
    url: "https://bolt.new",
    subcategory: "Vibe Coding",
    description: "Browser-based AI development environment for building and running web applications."
  },
  {
    name: "Replit",
    url: "https://replit.com",
    subcategory: "Vibe Coding",
    description: "Cloud development platform with AI-assisted application building and deployment."
  },
  {
    name: "v0",
    url: "https://v0.dev",
    subcategory: "Vibe Coding",
    description: "AI interface generation and application prototyping platform."
  },

  {
    name: "Vercel",
    url: "https://vercel.com",
    subcategory: "Hosting & Deployment",
    description: "Cloud platform for deploying modern web applications and frontend projects."
  },
  {
    name: "Netlify",
    url: "https://netlify.com",
    subcategory: "Hosting & Deployment",
    description: "Web hosting and deployment platform for modern frontend applications."
  },
  {
    name: "Cloudflare",
    url: "https://cloudflare.com",
    subcategory: "Hosting & Domains",
    description: "DNS, security, CDN, domain and developer infrastructure services."
  },
  {
    name: "Hostinger",
    url: "https://hostinger.com",
    subcategory: "Hosting & Domains",
    description: "Website hosting, domains, VPS and related web infrastructure."
  },
  {
    name: "Namecheap",
    url: "https://namecheap.com",
    subcategory: "Hosting & Domains",
    description: "Domain registration, hosting and online infrastructure services."
  },
  {
    name: "Porkbun",
    url: "https://porkbun.com",
    subcategory: "Hosting & Domains",
    description: "Domain registrar offering domains, DNS and related services."
  },
  {
    name: "DigitalOcean",
    url: "https://digitalocean.com",
    subcategory: "Hosting & Deployment",
    description: "Cloud servers, application hosting, databases and developer infrastructure."
  },
  {
    name: "Render",
    url: "https://render.com",
    subcategory: "Hosting & Deployment",
    description: "Cloud hosting platform for web services, static sites, databases and applications."
  },
  {
    name: "Railway",
    url: "https://railway.com",
    subcategory: "Hosting & Deployment",
    description: "Developer platform for deploying applications, services and databases."
  },

  {
    name: "GitHub",
    url: "https://github.com",
    subcategory: "Developer Platforms",
    description: "Source-code hosting, collaboration, version control and developer tooling."
  },
  {
    name: "GitLab",
    url: "https://gitlab.com",
    subcategory: "Developer Platforms",
    description: "Source-code collaboration and software development lifecycle platform."
  },

  {
    name: "Firebase",
    url: "https://firebase.google.com",
    subcategory: "Backend & Databases",
    description: "Google platform for authentication, databases, hosting, storage and application services."
  },
  {
    name: "Supabase",
    url: "https://supabase.com",
    subcategory: "Backend & Databases",
    description: "Postgres-based backend platform with database, authentication, storage and APIs."
  },

  {
    name: "Figma",
    url: "https://figma.com",
    subcategory: "Design & UI",
    description: "Collaborative interface design, prototyping and product design platform."
  },
  {
    name: "Framer",
    url: "https://framer.com",
    subcategory: "Design & UI",
    description: "Visual website design and publishing platform for modern websites."
  },

  {
    name: "MDN Web Docs",
    url: "https://developer.mozilla.org",
    subcategory: "Documentation & Learning",
    description: "Reference documentation and learning resources for web technologies."
  },
  {
    name: "Stack Overflow",
    url: "https://stackoverflow.com",
    subcategory: "Documentation & Learning",
    description: "Developer question-and-answer community covering programming and software development."
  },
  {
    name: "npm",
    url: "https://npmjs.com",
    subcategory: "Packages & Libraries",
    description: "JavaScript package registry for reusable libraries and developer packages."
  },
  {
    name: "React",
    url: "https://react.dev",
    subcategory: "Documentation & Learning",
    description: "Official React documentation and learning resources."
  }
];

function normalizeUrl(value) {
  const u = new URL(value);
  u.hash = "";
  u.search = "";

  if (u.pathname === "/") {
    u.pathname = "";
  }

  return u.toString().replace(/\/$/, "");
}

function hostname(value) {
  return new URL(value).hostname.replace(/^www\./i, "").toLowerCase();
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

console.log("Using emulator:", process.env.FIRESTORE_EMULATOR_HOST);
console.log("Project:", PROJECT_ID);

await db.collection("website_solution_categories").doc(CATEGORY_ID).set({
  name: CATEGORY_NAME,
  slug: CATEGORY_ID,
  icon: "🧑‍💻",
  description: "Vibe coding, hosting, domains, deployment, developer platforms, backend tools, UI resources and documentation.",
  status: "active",
  isVisible: true,
  updatedAt: FieldValue.serverTimestamp()
}, { merge: true });

const existingSnapshot = await db.collection("websites").get();

const existingDomains = new Set();

for (const doc of existingSnapshot.docs) {
  const data = doc.data();
  const raw = data.url || data.websiteUrl || data.link;

  if (!raw) continue;

  try {
    existingDomains.add(hostname(raw));
  } catch {}
}

let created = 0;
let skipped = 0;

for (let index = 0; index < sites.length; index += 1) {
  const site = sites[index];

  const url = normalizeUrl(site.url);
  const domain = hostname(url);

  if (existingDomains.has(domain)) {
    console.log("SKIP existing:", site.name, domain);
    skipped += 1;
    continue;
  }

  const id = `devres-${slugify(site.name)}`;

  await db.collection("websites").doc(id).set({
    name: site.name,
    title: site.name,
    slug: slugify(site.name),

    url,
    normalizedUrl: url,
    hostname: domain,
    domain,

    category: CATEGORY_NAME,
    categoryName: CATEGORY_NAME,
    categoryId: CATEGORY_ID,
    categorySlug: CATEGORY_ID,

    subcategory: site.subcategory,
    subCategory: site.subcategory,
    subCategoryName: site.subcategory,
    subCategorySlug: slugify(site.subcategory),

    description: site.description,

    status: "published",
    published: true,
    active: true,

    featured: false,
    editorChoice: false,
    homepageFeature: false,

    visits: 0,
    favoritesCount: 0,
    trendingScore: 0,

    source: "stea_curated_developer_resources",

    sortOrder: index + 1,
    sort_order: index + 1,
    displayOrder: index + 1,

    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  existingDomains.add(domain);
  created += 1;

  console.log("ADD:", site.name, "→", site.subcategory);
}

console.log("");
console.log("Developer Resources seed complete.");
console.log("Created:", created);
console.log("Skipped existing domains:", skipped);
console.log("Total curated definitions:", sites.length);
