import React, { useState, useMemo, useRef, useEffect } from 'react';
import { extractHostname } from '../../components/sites/favicon.js';
import { useAdminSitesCatalog } from './useAdminSitesCatalog.js';
import { useAuth } from '../../hooks/useAuth.js';
import { logAdminActivity } from '../../utils/siteAnalytics.js';
import {
  normalizeWebsiteCategorySlug,
  normalizeDeveloperSubcategorySlug,
} from '../../constants/categoryOrder.js';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Smartphone,
  Monitor,
  Apple,
  Bot,
  Terminal,
  Zap,
  Check,
  X,
  Layers,
  ArrowRight,
  Shield,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';

import {
  AFTER_DARK_CATEGORIES,
  AFTER_DARK_SUBCATEGORIES_BY_PARENT,
  INITIAL_AFTER_DARK_SITES,
} from '../../data/afterDarkCatalog.js';
import seedMovieSites from '../../data/seedMovieSites.js';

const STANDARD_CATEGORIES = [
  "Live Sports",
  "Movies & TV Shows",
  "eBooks",
  "Life Hack",
  "Money & Finance",
  "Music",
  "Games",
  "Online Courses",
  "Comics",
  "Graphics Design",
  "Jobs & Career",
  "Asian Drama",
  "Manga",
  "AdBlockers",
  "AI",
  "Automation",
  "Creativity",
  "Developers Resources",
  // After Dark Parent Categories
  "AI & Virtual",
  "Free Porn Tubes",
  "Live Cams",
  "OnlyFans & Creators",
  "Pictures & Galleries",
  "GIFs & Shorts",
  "Hentai & Anime",
  "Rare & Niche",
  "After Dark",
];

const DEVELOPER_SUBCATEGORIES_LIST = [
  "Vibe Coding & AI Dev",
  "Code Editors & IDEs",
  "Version Control",
  "APIs & Services",
  "Web Development",
  "App Development",
  "Backend Development",
  "Databases",
  "Cloud Platforms",
  "Hosting & Domains",
  "UI/UX Design",
  "Testing & Debugging",
  "Deployment & DevOps",
  "Performance & Monitoring",
  "Security",
  "Documentation & Learning",
  "Community & Q&A",
  "Blocks & Components",
  "Open Source",
  "Developer News",
];

const INITIAL_FORM = {
  id: null,
  name: "",
  url: "",
  category: "", // Mandatory
  subcategory: "",
  description: "",
  status: "published", // 'published' | 'draft'
  isAdult: false,
  safetyRating: "Unknown", // 'Verified' | 'Moderate' | 'Risky' | 'Unknown'
  pricing: "Free", // 'Free' | 'Freemium' | 'Paid'
  mobileFriendly: true,
  mirrorUrl: "",
  tags: "",
  customIconUrl: "",
  appDownloads: {
    playStore: "",
    appStore: "",
    windows: "",
    mac: "",
    linux: "",
  },
};

function detectBestCategory(site) {
  const combined = `${site.name || ""} ${site.title || ""} ${site.url || ""} ${site.domain || ""} ${site.description || ""} ${site.summary || ""}`.toLowerCase();
  
  if (/\b(ai|gpt|claude|openai|midjourney|gemini|deepseek|llm|copilot|perplexity|bot|replicate|elevenlabs)\b/i.test(combined)) {
    return "AI Tools";
  }
  if (/\b(github|gitlab|code|dev|api|docker|server|npm|deploy|linux|database|react|python|css|html|ide|editor|stack|hosting|cloud|hosting|domain|terminal|programming|backend|frontend)\b/i.test(combined)) {
    return "Developers Resources";
  }
  if (/\b(movie|cinema|netflix|stream|anime|drama|film|series|tv|watch|video|show)\b/i.test(combined)) {
    return "Movies & TV Shows";
  }
  if (/\b(sport|football|soccer|nba|score|match|espn|livescore|fifa|basketball|tennis|cricket)\b/i.test(combined)) {
    return "Live Sports";
  }
  if (/\b(music|audio|song|beats|spotify|soundcloud|radio|mp3|podcast|track|tune)\b/i.test(combined)) {
    return "Music & Audio";
  }
  if (/\b(crypto|bank|finance|money|invest|trading|wallet|binance|coin|payment|forex|stock|budget)\b/i.test(combined)) {
    return "Money & Finance";
  }
  if (/\b(design|figma|canva|vector|icon|dribbble|behance|photo|unsplash|font|graphic|illustrat|3d|render|mockup)\b/i.test(combined)) {
    return "Graphics & Design";
  }
  if (/\b(course|learn|academy|udemy|coursera|edx|tutorial|study|education|school|class|lecture)\b/i.test(combined)) {
    return "Online Courses & Learning";
  }
  if (/\b(book|ebook|comic|manga|novel|read|pdf|author|library|publish|chapter)\b/i.test(combined)) {
    return "eBooks & Comics";
  }
  if (/\b(game|arcade|steam|itch\.io|play|puzzle|rpg|action|gamers|unity|unreal)\b/i.test(combined)) {
    return "Games & Fun";
  }
  return "Developers Resources";
}

export default function SitesAdminWebsites() {
  const { websites, loading, initialLoadDone } = useAdminSitesCatalog();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // '' | 'published' | 'draft'

  // Modal states
  const [editorOpen, setEditorOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Custom icon live preview state
  const [iconPreviewState, setIconPreviewState] = useState("idle"); // idle | loading | loaded | error
  // Original (auto-discovered) icon — separate from customIconUrl
  const [originalIconUrl, setOriginalIconUrl] = useState("");
  const [originalIconState, setOriginalIconState] = useState("idle"); // idle | loading | loaded | error
  // Race-condition tokens — latest user action wins
  const customIconTokenRef = useRef(0);
  const currentCustomUrlRef = useRef("");
  const originalIconTokenRef = useRef(0);
  const [feedback, setFeedback] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // ---------------------------------------------------------------------------
  // CUSTOM ICON PREVIEW — direct <img>, no favicon API, no fetch().
  // The <img> is always mounted when a URL exists so onLoad/onError can fire.
  // Race-safe: only the latest token's result updates state.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const url = (formData.customIconUrl || "").trim();
    currentCustomUrlRef.current = url;
    if (!url) {
      setIconPreviewState("idle");
      return;
    }
    customIconTokenRef.current++;
    setIconPreviewState("loading");
  }, [formData.customIconUrl]);

  const handleCustomIconImgLoad = (e) => {
    // Only accept if this load corresponds to the URL currently in the field.
    if (e.currentTarget.getAttribute("src") === currentCustomUrlRef.current) {
      setIconPreviewState("loaded");
    }
  };
  const handleCustomIconImgError = (e) => {
    if (e.currentTarget.getAttribute("src") === currentCustomUrlRef.current) {
      setIconPreviewState("error");
    }
  };

  // ---------------------------------------------------------------------------
  // ORIGINAL ICON DISCOVERY — lightweight, fast-fail, never blocks the form.
  // Uses <img> probes (CORS-safe), NOT fetch(). Hard 2.5s per probe.
  // Result goes to originalIconUrl (separate from customIconUrl).
  // ---------------------------------------------------------------------------
  const probeImage = (url, timeoutMs = 2500) =>
    new Promise((resolve) => {
      if (!url) return resolve(false);
      const img = new Image();
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(false);
        }
      }, timeoutMs);
      img.onload = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(true);
        }
      };
      img.onerror = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(false);
        }
      };
      img.src = url;
    });

  const handleFetchOriginalIcon = async () => {
    const token = ++originalIconTokenRef.current;
    setOriginalIconState("loading");
    setOriginalIconUrl("");

    const domain = extractHostname(formData.url || formData.link || "");
    // Build candidate list in priority order.
    const candidates = [];
    // 1. Any already-stored explicit icon.
    const stored =
      formData.faviconUrl ||
      formData.logo ||
      formData.icon ||
      formData.iconUrl ||
      formData.logoUrl ||
      formData.verifiedIcon;
    if (stored) candidates.push(stored);
    if (domain) {
      // 2. Site's own /favicon.ico
      candidates.push(`https://${domain}/favicon.ico`);
      // 3. Google s2 (usually returns a real logo, not just 16px favicon)
      candidates.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
      // 4. DuckDuckGo
      candidates.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
    }

    if (!candidates.length) {
      setOriginalIconState("error");
      return;
    }

    for (const src of candidates) {
      // If user triggered a newer discovery (or pasted a custom icon), stop.
      if (token !== originalIconTokenRef.current) return;
      const ok = await probeImage(src, 2500);
      if (token !== originalIconTokenRef.current) return;
      if (ok) {
        setOriginalIconUrl(src);
        setOriginalIconState("loaded");
        return;
      }
    }
    // All failed.
    if (token === originalIconTokenRef.current) {
      setOriginalIconState("error");
    }
  };

  // AI Bulk Staging Modal
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiRawInput, setAiRawInput] = useState("");
  const [aiProcessing, setAiProcessing] = useState(false);

  // Bulk Broken Category Scanner Modal
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [brokenEntries, setBrokenEntries] = useState([]);
  const [scanApplying, setScanApplying] = useState(false);

  // Movies & TV Catalog Import
  const [importMoviesOpen, setImportMoviesOpen] = useState(false);
  const [importingMovies, setImportingMovies] = useState(false);
  const [importMoviesLog, setImportMoviesLog] = useState([]);

  // Flash message helper
  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 4000);
  };

  const isAdultSite = (w) => Boolean(
    w.isAdult === true ||
    w.is_adult === true ||
    w.category === "After Dark" ||
    w.category === "Mature (18+)" ||
    AFTER_DARK_SUBCATEGORIES_BY_PARENT[w.category]
  );

  const counts = useMemo(() => {
    const published = websites.filter((w) => w.status === "published").length;
    const draft = websites.filter((w) => (w.status || "draft") === "draft").length;
    const adult = websites.filter(isAdultSite).length;
    const adultDraft = websites.filter((w) => isAdultSite(w) && (w.status || "draft") !== "published").length;
    const adultPublished = adult - adultDraft;
    return { all: websites.length, published, draft, adult, adultDraft, adultPublished };
  }, [websites]);

  const filtered = useMemo(() => {
    return websites
      .filter((w) => {
        if (
          search &&
          !w.name?.toLowerCase().includes(search.toLowerCase()) &&
          !w.url?.toLowerCase().includes(search.toLowerCase()) &&
          !w.domain?.toLowerCase().includes(search.toLowerCase())
        ) {
          return false;
        }
        if (categoryFilter && w.category !== categoryFilter) return false;
        if (statusFilter === "adult") {
          if (!isAdultSite(w)) return false;
        } else if (statusFilter && (w.status || "draft") !== statusFilter) {
          return false;
        }
        return true;
      });
  }, [websites, search, categoryFilter, statusFilter]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page]);

  // Open Editor for new or existing website
  const handleOpenNew = () => {
    setFormData(INITIAL_FORM);
    setError("");
    setIconPreviewState("idle");
    setOriginalIconUrl("");
    setOriginalIconState("idle");
    originalIconTokenRef.current++;
    setEditorOpen(true);
  };

  // Import the prepared Movies & TV catalog as DRAFTS (unpublished).
  // Reuses the exact same Firestore write path as Admin → Add Website.
  const handleImportMovies = async () => {
    if (importingMovies) return;
    setImportingMovies(true);
    setImportMoviesLog([]);
    const log = [];

    try {
      const {
        getFirebaseDb,
        collection,
        addDoc,
        query,
        where,
        getDocs,
        serverTimestamp,
      } = await import("../../firebase.js");
      const db = getFirebaseDb();

      // Build set of existing domains (normalized) from the already-loaded catalog
      const existingDomains = new Set();
      websites.forEach((w) => {
        const d = (w.domain || w.hostname || "")
          .toLowerCase()
          .replace(/^www\./i, "");
        if (d) existingDomains.add(d);
      });

      // Also re-fetch from Firestore for safety (in case catalog is stale)
      try {
        const q = query(collection(db, "websites"), where("categorySlug", "==", "movies-tv-shows"));
        const snap = await getDocs(q);
        snap.forEach((doc) => {
          const d = (doc.data().domain || doc.data().hostname || "")
            .toLowerCase()
            .replace(/^www\./i, "");
          if (d) existingDomains.add(d);
        });
      } catch (e) {
        log.push(`ℹ Could not re-fetch existing domains (using loaded catalog): ${e.message}`);
      }

      let added = 0;
      let skipped = 0;
      let failed = 0;

      for (const site of seedMovieSites) {
        let domain = "";
        try {
          const u = site.url.startsWith("http") ? site.url : `https://${site.url}`;
          domain = new URL(u).hostname.replace(/^www\./i, "").toLowerCase();
        } catch {
          domain = site.url.replace(/^https?:\/\//i, "").split("/")[0].toLowerCase();
        }

        if (existingDomains.has(domain)) {
          // Existing record: merge only the `paid` flag so the PAID mark appears
          // without overwriting any admin-edited fields.
          try {
            const q = query(collection(db, "websites"), where("domain", "==", domain));
            const snap = await getDocs(q);
            snap.forEach(async (d) => {
              const { doc: docFn, setDoc } = await import("../../firebase.js");
              await setDoc(docFn(db, "websites", d.id), { paid: site.paid === true }, { merge: true });
            });
            skipped++;
            log.push(`⏭ Updated paid flag (exists): ${site.name} (${domain})`);
          } catch (e) {
            skipped++;
            log.push(`⏭ Skip (exists, paid update failed): ${site.name} — ${e.message}`);
          }
          continue;
        }

        const pricingType = site.pricingType || "unknown";
        const sourceStatus = site.sourceStatus || "unverified";

        const payload = {
          name: site.name,
          title: site.name,
          url: site.url,
          normalizedUrl: site.url,
          link: site.url,
          websiteUrl: site.url,
          mainUrl: site.url,
          domain,
          hostname: domain,
          category: "Movies & TV Shows",
          categoryName: "Movies & TV Shows",
          categorySlug: "movies-tv-shows",
          subcategory: "",
          subCategory: "",
          subcategorySlug: "",
          subCategorySlug: "",
          description: site.description || "",
          summary: site.description || "",
          status: "draft",
          published: false,
          active: false,
          isAdult: false,
          is_adult: false,
          safetyRating: "Unknown",
          pricing: site.pricing || "Free",
          pricingType,
          paid: site.paid === true,
          sourceStatus,
          contentType: "movies-tv",
          mobileFriendly: true,
          mirrorUrl: "",
          tags: site.tags && site.tags.length ? site.tags : ["movies", "tv shows", "streaming"],
          appDownloads: { playStore: "", appStore: "", windows: "", mac: "", linux: "" },
          platforms: ["web"],
          downloadLinks: {},
          visits: 0,
          favoritesCount: 0,
          clicks: 0,
          source: "seed_movies_import",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        try {
          const ref = await addDoc(collection(db, "websites"), payload);
          existingDomains.add(domain);
          added++;
          log.push(`✅ Added (draft): ${site.name} (${domain}) — ${ref.id}`);
        } catch (e) {
          failed++;
          const code = e?.code || "unknown";
          log.push(`❌ Failed: ${site.name} (${domain}) — ${code}: ${e.message}`);
        }
      }

      log.push(``);
      log.push(`Done. Added: ${added} | Skipped: ${skipped} | Failed: ${failed}`);
      await logAdminActivity(user, "movies_tv_import", "website", null, { added, skipped, failed });
      showFeedback(`Movies & TV import complete: ${added} added, ${skipped} skipped, ${failed} failed.`);
    } catch (e) {
      log.push(`❌ Import error: ${e.message}`);
    }

    setImportMoviesLog(log);
    setImportingMovies(false);
  };

  const handleOpenEdit = (site) => {
    const downloads = site.appDownloads || {};
    const legacy = site.downloadLinks || {};
    setFormData({
      id: site.id,
      name: site.name || site.title || "",
      url: site.url || site.link || "",
      category: site.category || site.categoryName || "",
      subcategory: site.subcategory || site.subCategory || "",
      description: site.description || site.summary || "",
      status: site.status || "published",
      isAdult: Boolean(site.isAdult || site.is_adult || site.category === "After Dark" || site.category === "Mature (18+)" || AFTER_DARK_SUBCATEGORIES_BY_PARENT[site.category]),
      safetyRating: site.safetyRating || "Unknown",
      pricing: site.pricing || "Free",
      mobileFriendly: site.mobileFriendly !== false,
      mirrorUrl: site.mirrorUrl || "",
      tags: Array.isArray(site.tags) ? site.tags.join(", ") : (site.tags || ""),
      customIconUrl: site.customIconUrl || site.customLogoUrl || "",
      appDownloads: {
        playStore: downloads.playStore || downloads.android || legacy.android || "",
        appStore: downloads.appStore || downloads.ios || legacy.ios || "",
        windows: downloads.windows || legacy.windows || "",
        mac: downloads.mac || downloads.macos || legacy.macos || "",
        linux: downloads.linux || legacy.linux || "",
      },
    });
    setError("");
    setIconPreviewState("idle");
    setOriginalIconUrl(site.customIconUrl || site.faviconUrl || site.logo || "");
    setOriginalIconState("idle");
    originalIconTokenRef.current++;
    setEditorOpen(true);
  };

  // Toggle single site status between published and draft using setDoc with merge: true
  const toggleStatus = async (site) => {
    const newStatus = site.status === "published" ? "draft" : "published";
    try {
      const { getFirebaseDb, doc, setDoc, serverTimestamp } = await import(
        "../../firebase.js"
      );
      const db = getFirebaseDb();
      await setDoc(doc(db, "websites", site.id), {
        status: newStatus,
        published: newStatus === "published",
        active: newStatus === "published",
        updatedAt: serverTimestamp(),
      }, { merge: true });
      await logAdminActivity(user, "website_status_updated", "website", site.id, {
        newStatus,
      });
      window.dispatchEvent(new CustomEvent("stea-data-sync"));
      showFeedback(`Updated status of "${site.name}" to ${newStatus}.`);
    } catch (e) {
      alert("Failed to update status: " + e.message);
    }
  };

  // Delete site
  const handleDeleteSite = async (site) => {
    if (!window.confirm(`Are you sure you want to delete "${site.name}"?`)) return;
    try {
      const { getFirebaseDb, doc, deleteDoc } = await import("../../firebase.js");
      const db = getFirebaseDb();
      await deleteDoc(doc(db, "websites", site.id));
      await logAdminActivity(user, "website_deleted", "website", site.id, {
        name: site.name,
      });
      window.dispatchEvent(new CustomEvent("stea-data-sync"));
      showFeedback(`"${site.name}" was deleted.`);
    } catch (e) {
      alert("Failed to delete site: " + e.message);
    }
  };

  // Publish all 18+ websites currently in draft status to live
  const handlePublishAllAdultDrafts = async () => {
    const draftAdults = websites.filter(
      (w) =>
        (w.isAdult || w.is_adult || w.category === "After Dark" || w.category === "Mature (18+)") &&
        (w.status || "draft") !== "published"
    );
    if (draftAdults.length === 0) {
      alert("All 18+ restricted websites are already published live!");
      return;
    }
    if (!window.confirm(`Publish all ${draftAdults.length} draft 18+ websites to live?`)) return;

    try {
      const { getFirebaseDb, doc, setDoc, serverTimestamp } = await import(
        "../../firebase.js"
      );
      const db = getFirebaseDb();
      for (const site of draftAdults) {
        await setDoc(
          doc(db, "websites", site.id),
          {
            status: "published",
            published: true,
            active: true,
            isAdult: true,
            is_adult: true,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
      window.dispatchEvent(new CustomEvent("stea-data-sync"));
      showFeedback(`Successfully published ${draftAdults.length} 18+ website(s) to live!`);
    } catch (e) {
      alert("Failed to publish all: " + e.message);
    }
  };

  // Seed / Sync all 24 Starter 18+ sites directly to Firestore
  const handleSeedAllStarterAdultSites = async () => {
    if (!window.confirm(`Sync and write all ${INITIAL_AFTER_DARK_SITES.length} starter 18+ websites directly to Firestore?`)) return;

    try {
      const { getFirebaseDb, doc, setDoc, serverTimestamp } = await import(
        "../../firebase.js"
      );
      const db = getFirebaseDb();
      let seeded = 0;
      for (const site of INITIAL_AFTER_DARK_SITES) {
        await setDoc(
          doc(db, "websites", site.id),
          {
            ...site,
            status: "published",
            published: true,
            active: true,
            isAdult: true,
            is_adult: true,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
        seeded++;
      }
      window.dispatchEvent(new CustomEvent("stea-data-sync"));
      showFeedback(`Successfully synced ${seeded} 18+ websites to database!`);
    } catch (e) {
      alert("Failed to seed 18+ sites: " + e.message);
    }
  };

  // Save manual Add or Edit form
  const handleSaveForm = async (e) => {
    e.preventDefault();
    setError("");

    const name = formData.name.trim();
    const rawUrl = formData.url.trim();
    const category = (formData.category || "").trim();

    if (!name || !rawUrl) {
      setError("Website Name and URL are required.");
      return;
    }

    if (!category) {
      setError("Category is MANDATORY. Please select a valid category from the list.");
      return;
    }

    setSaving(true);
    try {
      const {
        getFirebaseDb,
        doc,
        setDoc,
        addDoc,
        collection,
        serverTimestamp,
      } = await import("../../firebase.js");
      const db = getFirebaseDb();

      let domain = "";
      try {
        const u = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
        domain = new URL(u).hostname.replace(/^www\./i, "").toLowerCase();
      } catch {
        domain = rawUrl.replace(/^https?:\/\//i, "").split("/")[0].toLowerCase();
      }

      const categorySlug = normalizeWebsiteCategorySlug(formData.category);
      const subcategorySlug = formData.subcategory
        ? normalizeDeveloperSubcategorySlug(formData.subcategory)
        : "";

      // Derive platforms and legacy downloadLinks for backward compatibility
      const platforms = ["web"];
      const downloadLinks = {};
      const { playStore, appStore, windows, mac, linux } = formData.appDownloads;

      if (playStore) {
        platforms.push("android");
        downloadLinks.android = playStore.trim();
      }
      if (appStore) {
        platforms.push("ios");
        downloadLinks.ios = appStore.trim();
      }
      if (windows) {
        platforms.push("windows");
        downloadLinks.windows = windows.trim();
      }
      if (mac) {
        platforms.push("macos");
        downloadLinks.macos = mac.trim();
      }
      if (linux) {
        platforms.push("linux");
        downloadLinks.linux = linux.trim();
      }

      const isAdultCat = Boolean(
        AFTER_DARK_SUBCATEGORIES_BY_PARENT[formData.category] ||
        formData.category === "After Dark" ||
        formData.category === "Mature (18+)"
      );
      const isAdult = Boolean(formData.isAdult || isAdultCat);

      const parsedTags = typeof formData.tags === "string"
        ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : (Array.isArray(formData.tags) ? formData.tags : []);

      const payload = {
        name,
        title: name,
        url: rawUrl,
        normalizedUrl: rawUrl,
        link: rawUrl,
        websiteUrl: rawUrl,
        mainUrl: rawUrl,
        domain,
        hostname: domain,
        category: formData.category,
        categoryName: formData.category,
        categorySlug,
        subcategory: formData.subcategory,
        subCategory: formData.subcategory,
        subcategorySlug,
        subCategorySlug: subcategorySlug,
        description: formData.description.trim(),
        summary: formData.description.trim(),
        status: formData.status || "published",
        published: (formData.status || "published") === "published",
        active: (formData.status || "published") === "published",
        isAdult,
        is_adult: isAdult,
        safetyRating: formData.safetyRating || "Unknown",
        pricing: formData.pricing || "Free",
        mobileFriendly: formData.mobileFriendly !== false,
        mirrorUrl: formData.mirrorUrl ? formData.mirrorUrl.trim() : "",
        tags: parsedTags,
        customIconUrl: formData.customIconUrl ? formData.customIconUrl.trim() : "",
        appDownloads: {
          playStore: playStore.trim(),
          appStore: appStore.trim(),
          windows: windows.trim(),
          mac: mac.trim(),
          linux: linux.trim(),
        },
        platforms,
        downloadLinks,
        updatedAt: serverTimestamp(),
      };

      console.log("Saving website payload:", payload);

      if (formData.id) {
        // Edit existing site using setDoc with merge: true to avoid "No document to update" error
        await setDoc(doc(db, "websites", formData.id), payload, { merge: true });
        await logAdminActivity(user, "website_updated", "website", formData.id, {
          name,
        });
        if (payload.status === "draft") {
          showFeedback(`"${name}" saved to drafts. (Publish to make it live)`);
        } else {
          showFeedback(`"${name}" saved successfully!`);
        }
      } else {
        // Add new site
        payload.createdAt = serverTimestamp();
        payload.visits = 0;
        payload.favoritesCount = 0;
        payload.clicks = 0;
        const ref = await addDoc(collection(db, "websites"), payload);
        await logAdminActivity(user, "website_created", "website", ref.id, {
          name,
        });
        if (payload.status === "draft") {
          showFeedback(`"${name}" created in drafts. (Publish to make it live)`);
        } else {
          showFeedback(`"${name}" created successfully!`);
        }
      }

      window.dispatchEvent(new CustomEvent("stea-data-sync"));
      setEditorOpen(false);
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Bulk scan for broken entries missing category or appDownloads
  const handleRunBulkScan = () => {
    const broken = [];
    websites.forEach((w) => {
      const cat = (w.category || w.categoryName || "").trim();
      const hasMissingCat = !cat || cat.toLowerCase() === "uncategorized" || cat.toLowerCase() === "undefined";
      const hasMissingDownloads = !w.appDownloads;
      
      if (hasMissingCat || hasMissingDownloads) {
        const proposedCat = hasMissingCat ? detectBestCategory(w) : cat;
        broken.push({
          id: w.id,
          name: w.name || w.title || "Untitled",
          url: w.url || w.link || "",
          currentCategory: cat || "(Missing / Blank)",
          proposedCategory: proposedCat,
          hasMissingCat,
          hasMissingDownloads,
          rawItem: w,
        });
      }
    });

    setBrokenEntries(broken);
    setScanModalOpen(true);
  };

  // Apply repair to broken entries: saves ALL modified items into DRAFTS for admin review
  const handleApplyFixesToDrafts = async () => {
    if (brokenEntries.length === 0) return;
    setScanApplying(true);
    try {
      const { getFirebaseDb, doc, setDoc, serverTimestamp } = await import(
        "../../firebase.js"
      );
      const db = getFirebaseDb();

      let fixedCount = 0;
      for (const item of brokenEntries) {
        const raw = item.rawItem;
        const downloads = raw.appDownloads || {
          playStore: "",
          appStore: "",
          windows: "",
          mac: "",
          linux: "",
        };

        const categorySlug = normalizeWebsiteCategorySlug(item.proposedCategory);

        // SAFETY HARD RULE: All bulk-repaired entries save as 'draft' for review!
        const payload = {
          category: item.proposedCategory,
          categoryName: item.proposedCategory,
          categorySlug,
          appDownloads: downloads,
          status: "draft", // Staged in drafts
          published: false,
          active: false,
          needsReview: true,
          repairSource: "bulk_category_scanner_staged",
          updatedAt: serverTimestamp(),
        };

        await setDoc(doc(db, "websites", item.id), payload, { merge: true });
        fixedCount++;
      }

      await logAdminActivity(user, "bulk_categories_repaired_to_drafts", "websites", null, {
        repairedCount: fixedCount,
      });

      window.dispatchEvent(new CustomEvent("stea-data-sync"));
      setScanModalOpen(false);
      setStatusFilter("draft");
      showFeedback(`Successfully repaired ${fixedCount} entries and staged them in DRAFTS for your review.`);
    } catch (err) {
      alert("Bulk repair failed: " + err.message);
    } finally {
      setScanApplying(false);
    }
  };

  // AI Bulk Staging Handler (Enforces SAFETY RULE: status is always 'draft')
  const handleAiBulkStage = async () => {
    if (!aiRawInput.trim()) return;
    setAiProcessing(true);

    try {
      const { getFirebaseDb, collection, addDoc, serverTimestamp } = await import(
        "../../firebase.js"
      );
      const db = getFirebaseDb();

      // Parse input lines or JSON
      const lines = aiRawInput
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      let stagedCount = 0;

      for (const line of lines) {
        let entry = null;
        if (line.startsWith("{") && line.endsWith("}")) {
          try {
            entry = JSON.parse(line);
          } catch {}
        }

        let name = "";
        let url = "";
        let category = "Developers Resources";
        let subcategory = "";
        let description = "";
        let appDownloads = { playStore: "", appStore: "", windows: "", mac: "", linux: "" };

        if (entry) {
          name = entry.name || "";
          url = entry.url || entry.link || "";
          category = entry.category || "Developers Resources";
          subcategory = entry.subcategory || "";
          description = entry.description || "";
          if (entry.appDownloads) {
            appDownloads = {
              playStore: entry.appDownloads.playStore || entry.appDownloads.android || "",
              appStore: entry.appDownloads.appStore || entry.appDownloads.ios || "",
              windows: entry.appDownloads.windows || "",
              mac: entry.appDownloads.mac || entry.appDownloads.macos || "",
              linux: entry.appDownloads.linux || "",
            };
          }
        } else {
          // Plain URL line
          url = line.startsWith("http") ? line : `https://${line}`;
          try {
            const parsed = new URL(url);
            const hostParts = parsed.hostname.replace(/^www\./i, "").split(".");
            name = hostParts[0].charAt(0).toUpperCase() + hostParts[0].slice(1);
          } catch {
            name = "Staged Website";
          }
        }

        if (!url) continue;

        let domain = "";
        try {
          domain = new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
        } catch {
          domain = url;
        }

        const categorySlug = normalizeWebsiteCategorySlug(category);
        const subcategorySlug = subcategory ? normalizeDeveloperSubcategorySlug(subcategory) : "";

        // SAFETY RULE: AI entries always saved with status: 'draft' for review
        const payload = {
          name,
          title: name,
          url,
          normalizedUrl: url,
          domain,
          hostname: domain,
          category,
          categoryName: category,
          categorySlug,
          subcategory,
          subCategory: subcategory,
          subcategorySlug,
          subCategorySlug: subcategorySlug,
          description,
          summary: description,
          appDownloads,
          status: "draft", // Staged safety rule
          published: false,
          active: false,
          source: "ai_bulk_import_staged",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await addDoc(collection(db, "websites"), payload);
        stagedCount++;
      }

      await logAdminActivity(user, "ai_bulk_staged", "websites", null, {
        stagedCount,
      });

      window.dispatchEvent(new CustomEvent("stea-data-sync"));
      setAiModalOpen(false);
      setAiRawInput("");
      setStatusFilter("draft");
      showFeedback(`Successfully staged ${stagedCount} entry(ies) as DRAFTS for your review.`);
    } catch (e) {
      alert("AI bulk import failed: " + e.message);
    } finally {
      setAiProcessing(false);
    }
  };

  const isBooting = !initialLoadDone && websites.length === 0;

  return (
    <div className="sites-admin-catalog">
      {/* Top Header */}
      <div className="sites-admin-cat-head">
        <div>
          <div className="sites-admin-cat-title-row">
            <h1 className="sites-admin-cat-title">Unified Websites Catalog</h1>
            <span className="sites-admin-status-indicator">
              <span
                className="status-dot"
                style={{ background: initialLoadDone ? "#4ADE80" : "#F5A623" }}
              />
              {initialLoadDone ? "Live Sync Active" : "Connecting…"}
            </span>
          </div>
          <p className="sites-admin-cat-desc">
            Manage live websites and app downloads. AI bulk-imports land as safe drafts in the review queue.
          </p>
        </div>

        <div className="sites-admin-top-actions">
          <button
            type="button"
            className="sites-admin-btn"
            style={{
              background: "rgba(245,166,35,0.15)",
              border: "1px solid rgba(245,166,35,0.4)",
              color: "#F5A623",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 700,
            }}
            onClick={handleRunBulkScan}
            title="Scan all websites for missing/broken categories and stage fixes to drafts"
          >
            <span>🔍</span>
            <span>Scan Broken Categories</span>
          </button>
          <button
            type="button"
            className="sites-admin-btn is-ai"
            onClick={() => setAiModalOpen(true)}
            title="Import or stage websites as drafts using AI bulk tool"
          >
            <Zap size={14} />
            <span>AI Bulk Staging</span>
          </button>
          <button
            type="button"
            className="sites-admin-btn is-primary"
            onClick={handleOpenNew}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Add Website</span>
          </button>
          <button
            type="button"
            className="sites-admin-btn is-ai"
            onClick={() => {
              setImportMoviesLog([]);
              setImportMoviesOpen(true);
            }}
            title="Import the prepared Movies & TV catalog as unpublished drafts"
          >
            <Layers size={14} />
            <span>Import Movies &amp; TV</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="sites-admin-toast">
          <CheckCircle2 size={16} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filters & Tabs */}
      <div className="sites-admin-controls-bar">
        {/* Status Filter Tabs */}
        <div className="sites-status-tabs">
          <button
            type="button"
            className={`sites-status-tab ${statusFilter === "" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("")}
          >
            All Sites <span className="tab-pill">{counts.all}</span>
          </button>
          <button
            type="button"
            className={`sites-status-tab ${statusFilter === "published" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("published")}
          >
            Live Published <span className="tab-pill is-green">{counts.published}</span>
          </button>
          <button
            type="button"
            className={`sites-status-tab ${statusFilter === "draft" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("draft")}
          >
            Drafts & Staged <span className="tab-pill is-gold">{counts.draft}</span>
          </button>
          <button
            type="button"
            className={`sites-status-tab ${statusFilter === "adult" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("adult")}
          >
            🔞 18+ After Dark <span className="tab-pill" style={{ background: "rgba(239,68,68,0.2)", color: "#F87171" }}>{counts.adult}</span>
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="sites-search-row">
          <div className="sites-admin-search-wrap">
            <Search size={14} className="sites-search-icon" />
            <input
              type="text"
              placeholder="Search by name, URL, or domain…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sites-admin-search-input"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="sites-admin-cat-select"
          >
            <option value="">All Categories</option>
            {STANDARD_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table Content */}
      {isBooting ? (
        <div className="sites-admin-loading">
          <div className="sites-admin-spinner" />
          <span>Loading catalog catalog…</span>
        </div>
      ) : (
        <>
          {statusFilter === "adult" && (
            <div
              style={{
                marginBottom: 16,
                padding: "14px 18px",
                borderRadius: 10,
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <strong style={{ color: "#FCA5A5", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>🔞</span> After Dark (18+) Restricted Sites Hub
                </strong>
                <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                  Showing {filtered.length} mature site(s). Live on /after-dark: {counts.adultPublished || 0} | Staged Drafts: {counts.adultDraft || 0}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {counts.adultDraft > 0 && (
                  <button
                    type="button"
                    onClick={handlePublishAllAdultDrafts}
                    style={{
                      background: "#EF4444",
                      color: "#fff",
                      border: 0,
                      padding: "7px 14px",
                      borderRadius: 7,
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: "0 2px 8px rgba(239,68,68,0.4)",
                    }}
                  >
                    <span>🚀</span>
                    <span>Publish All {counts.adultDraft} 18+ Drafts to Live</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSeedAllStarterAdultSites}
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#FFFFFF",
                    padding: "7px 14px",
                    borderRadius: 7,
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                  title="Write all 24 curated After Dark starter sites into Firestore database"
                >
                  <span>⚡</span>
                  <span>Sync 24 Starter Sites</span>
                </button>
              </div>
            </div>
          )}

          <div className="sites-admin-table-shell">
          <table className="sites-admin-table">
            <thead>
              <tr>
                <th>Website / App</th>
                <th>Category</th>
                <th>App Downloads (`appDownloads`)</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="sites-empty-cell">
                    No websites match your current filter.
                  </td>
                </tr>
              ) : (
                paginated.map((site) => {
                  const isPublished = site.status === "published";
                  const d = site.appDownloads || {};
                  const legacy = site.downloadLinks || {};
                  const hasPlay = Boolean(d.playStore || d.android || legacy.android);
                  const hasApple = Boolean(d.appStore || d.ios || legacy.ios);
                  const hasWin = Boolean(d.windows || legacy.windows);
                  const hasMac = Boolean(d.mac || d.macos || legacy.macos);
                  const hasLinux = Boolean(d.linux || legacy.linux);
                  const hasAnyDownload = hasPlay || hasApple || hasWin || hasMac || hasLinux;

                  return (
                    <tr
                      key={site.id}
                      className={!isPublished ? "is-draft-row" : ""}
                    >
                      <td>
                        <div className="site-name-cell">
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <strong>{site.name || "Untitled"}</strong>
                            {(site.isAdult || site.is_adult || site.category === "After Dark" || site.category === "Mature (18+)") && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  background: "rgba(239, 68, 68, 0.15)",
                                  border: "1px solid rgba(239, 68, 68, 0.35)",
                                  color: "#F87171",
                                  fontSize: 10,
                                  fontWeight: 800,
                                  letterSpacing: "0.03em",
                                }}
                              >
                                🔞 18+
                              </span>
                            )}
                          </div>
                          <a
                            href={site.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="site-url-link"
                          >
                            <span>{site.domain || site.url}</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      </td>
                      <td>
                        <span className="site-cat-pill">{site.category || "—"}</span>
                        {site.subcategory && (
                          <span className="site-subcat-text">{site.subcategory}</span>
                        )}
                      </td>
                      <td>
                        {hasAnyDownload ? (
                          <div className="site-downloads-badges">
                            {hasPlay && <span className="dl-badge is-android" title="Play Store">Play</span>}
                            {hasApple && <span className="dl-badge is-apple" title="App Store">iOS</span>}
                            {hasWin && <span className="dl-badge is-win" title="Windows">Win</span>}
                            {hasMac && <span className="dl-badge is-mac" title="Mac">Mac</span>}
                            {hasLinux && <span className="dl-badge is-linux" title="Linux">Linux</span>}
                          </div>
                        ) : (
                          <span className="site-no-downloads">Web Only</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`site-status-badge ${
                            isPublished ? "is-published" : "is-draft"
                          }`}
                        >
                          {isPublished ? "Live" : "Draft"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="site-actions-cell">
                          <button
                            type="button"
                            onClick={() => toggleStatus(site)}
                            className={`site-toggle-btn ${
                              isPublished ? "is-unpub" : "is-pub"
                            }`}
                            title={isPublished ? "Set to Draft" : "Publish Live"}
                          >
                            {isPublished ? "Unpublish" : "Publish Live"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(site)}
                            className="site-edit-btn"
                            title="Edit website & download links"
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSite(site)}
                            className="site-delete-btn"
                            title="Delete website"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20 }}>
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="sites-admin-btn"
              style={{ padding: '6px 12px', fontSize: 13, background: 'rgba(255,255,255,0.05)', color: page === 1 ? 'rgba(255,255,255,0.3)' : '#fff' }}
            >
              Previous
            </button>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              Page {page} of {totalPages}
            </span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="sites-admin-btn"
              style={{ padding: '6px 12px', fontSize: 13, background: 'rgba(255,255,255,0.05)', color: page === totalPages ? 'rgba(255,255,255,0.3)' : '#fff' }}
            >
              Next
            </button>
          </div>
        )}
      </>
    )}

      {/* Manual Add / Edit Modal */}
      {editorOpen && (
        <div className="sites-modal-overlay" onClick={() => setEditorOpen(false)}>
          <div
            className="sites-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 580 }}
          >
            <div className="sites-modal-head">
              <div>
                <h2 className="sites-modal-title">
                  {formData.id ? `Edit: ${formData.name}` : "Add New Website / Resource"}
                </h2>
                <p className="sites-modal-sub">
                  Configure website information and platform download links.
                </p>
              </div>
              <button
                type="button"
                className="sites-modal-close"
                onClick={() => setEditorOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {error && <div className="sites-modal-err">{error}</div>}

            <form onSubmit={handleSaveForm} className="sites-modal-form">
              <div className="form-group-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Website / App Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g. Cursor, Linear, Replit"
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ width: 140 }}>
                  <label className="form-label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="form-input"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Main Website URL *</label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://example.com"
                  className="form-input"
                />
              </div>

              <div className="form-group-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" style={{ color: !formData.category ? "#F87171" : undefined, fontWeight: 700 }}>
                    Category <span style={{ color: "#F87171" }}>* (Mandatory)</span>
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      const isAdultCat = Boolean(
                        AFTER_DARK_SUBCATEGORIES_BY_PARENT[cat] ||
                        cat === "After Dark" ||
                        cat === "Mature (18+)"
                      );
                      setFormData({
                        ...formData,
                        category: cat,
                        subcategory: "",
                        isAdult: isAdultCat ? true : formData.isAdult,
                      });
                    }}
                    className="form-input"
                    style={{ borderColor: !formData.category ? "rgba(248,113,113,0.7)" : undefined }}
                  >
                    <option value="">-- Select Valid Category (Required) --</option>
                    {STANDARD_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {!formData.category && (
                    <span style={{ fontSize: 11, color: "#F87171", marginTop: 4, display: "block" }}>
                      * Category is required. You cannot save without selecting a category.
                    </span>
                  )}
                </div>

                {formData.category === "Developers Resources" && (
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Developer Subcategory</label>
                    <select
                      value={formData.subcategory}
                      onChange={(e) =>
                        setFormData({ ...formData, subcategory: e.target.value })
                      }
                      className="form-input"
                    >
                      <option value="">-- None --</option>
                      {DEVELOPER_SUBCATEGORIES_LIST.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {AFTER_DARK_SUBCATEGORIES_BY_PARENT[formData.category] && (
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" style={{ color: "#F87171", fontWeight: 700 }}>
                      🔞 {formData.category} Subcategory
                    </label>
                    <select
                      value={formData.subcategory}
                      onChange={(e) =>
                        setFormData({ ...formData, subcategory: e.target.value })
                      }
                      className="form-input"
                      style={{ borderColor: "rgba(239, 68, 68, 0.4)" }}
                    >
                      <option value="">-- General / None --</option>
                      {AFTER_DARK_SUBCATEGORIES_BY_PARENT[formData.category].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Short Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="One sentence explaining value proposition"
                  className="form-input"
                />
              </div>

              {/* 4 Brand / Main Icon — customIconUrl (authoritative) + Original Icon discovery */}
              <div className="form-downloads-box" style={{ marginTop: 4 }}>
                <div className="downloads-box-head">
                  <ImageIcon size={16} className="downloads-head-icon" />
                  <div>
                    <h3 className="downloads-title">Brand / Main Icon</h3>
                    <p className="downloads-sub">
                      Primary website identity used throughout STEA. If provided, the custom image is always used — automatic icon detection is ignored.
                    </p>
                  </div>
                </div>

                {/* Original Icon — lightweight, fast-fail discovery of the site's own icon */}
                <div style={{ marginBottom: 14, padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={handleFetchOriginalIcon}
                      disabled={originalIconState === "loading" || !(formData.url || formData.link)}
                      style={{
                        padding: "7px 14px",
                        borderRadius: 8,
                        border: "1px solid rgba(139,92,246,0.5)",
                        background: originalIconState === "loading" ? "rgba(139,92,246,0.15)" : "rgba(139,92,246,0.12)",
                        color: "#c4b5fd",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: originalIconState === "loading" ? "wait" : "pointer",
                        opacity: !(formData.url || formData.link) ? 0.5 : 1,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {originalIconState === "loading" ? (
                        <><Clock size={14} /> Searching…</>
                      ) : (
                        <><Zap size={14} /> Original Icon</>
                      )}
                    </button>

                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                      Tries the site's own icon sources. Fast fallback only — never blocks this form.
                    </span>
                  </div>

                  {/* Original icon result preview */}
                  {originalIconState === "loaded" && originalIconUrl && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                      <div style={{
                        width: 56, height: 56, borderRadius: 12,
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                        display: "grid", placeItems: "center", flexShrink: 0, overflow: "hidden",
                      }}>
                        <img src={originalIconUrl} alt="original icon" style={{ maxWidth: "80%", maxHeight: "80%", objectFit: "contain" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontSize: 12, color: "#34D399", display: "flex", alignItems: "center", gap: 6 }}>
                          <CheckCircle2 size={14} /> Original icon found
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", wordBreak: "break-all", marginTop: 2 }}>
                          {originalIconUrl}
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
                          This is used when no custom icon is set. Paste a custom URL above to override it.
                        </div>
                      </div>
                    </div>
                  )}
                  {originalIconState === "error" && (
                    <div style={{ marginTop: 10, fontSize: 12, color: "#F87171" }}>
                      Could not find the original icon automatically. You can provide a custom image URL below.
                    </div>
                  )}
                </div>

                <div className="dl-field" style={{ marginBottom: 0 }}>
                  <label className="dl-label" htmlFor="custom-icon-url">Custom Icon / Logo URL</label>
                  <input
                    id="custom-icon-url"
                    type="url"
                    value={formData.customIconUrl}
                    onChange={(e) => {
                      setFormData({ ...formData, customIconUrl: e.target.value });
                    }}
                    placeholder="https://cdn.example.com/logo.png"
                    className="form-input dl-input"
                    autoComplete="off"
                  />
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
                    {/* Live preview — <img> is ALWAYS mounted so onLoad/onError fire (CORS-safe, no fetch) */}
                    <div
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: 16,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      {/* The probe image — always rendered when a URL exists, even while loading/error,
                          so the browser can fire onLoad/onError. Visibility toggled via state. */}
                      {formData.customIconUrl && (
                        <img
                          src={formData.customIconUrl}
                          alt={`${formData.name || "website"} logo preview`}
                          onLoad={handleCustomIconImgLoad}
                          onError={handleCustomIconImgError}
                          style={{
                            maxWidth: "88%",
                            maxHeight: "88%",
                            objectFit: "contain",
                            display: iconPreviewState === "loaded" ? "block" : "none",
                          }}
                        />
                      )}
                      {formData.customIconUrl && iconPreviewState === "loading" && (
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Loading preview…</span>
                      )}
                      {formData.customIconUrl && iconPreviewState === "error" && (
                        <span style={{ fontSize: 11, color: "#F87171", textAlign: "center", padding: 8 }}>Image could not be loaded.</span>
                      )}
                      {!formData.customIconUrl && (
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textAlign: "center", padding: 8 }}>Paste an image URL to preview</span>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 10 }}>
                      {formData.customIconUrl && iconPreviewState === "loaded" && (
                        <div style={{ fontSize: 13, color: "#34D399", display: "flex", alignItems: "center", gap: 6 }}>
                          <CheckCircle2 size={15} /> Custom icon will be used as the primary icon across STEA.
                        </div>
                      )}
                      {formData.customIconUrl && iconPreviewState === "error" && (
                        <div style={{ fontSize: 13, color: "#F87171" }}>
                          Unable to load this image. Check that the URL points directly to an accessible image (PNG, WebP, SVG, JPG).
                        </div>
                      )}
                      {formData.customIconUrl && iconPreviewState === "loading" && (
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                          Loading preview from the image URL…
                        </div>
                      )}
                      {!formData.customIconUrl && (
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                          If this field is empty, STEA uses the original icon or automatic favicon detection.
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                        For the cleanest result, use a transparent PNG or WebP logo. The image is loaded directly by your browser — no favicon API, no scraping.
                      </div>
                      {formData.customIconUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, customIconUrl: "" });
                            setIconPreviewState("idle");
                          }}
                          style={{
                            alignSelf: "flex-start",
                            padding: "6px 14px",
                            borderRadius: 8,
                            border: "1px solid rgba(255,255,255,0.18)",
                            background: "transparent",
                            color: "rgba(255,255,255,0.85)",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 5 Application Downloads Inputs */}
              <div className="form-downloads-box">
                <div className="downloads-box-head">
                  <Smartphone size={16} className="downloads-head-icon" />
                  <div>
                    <h3 className="downloads-title">Application Downloads (`appDownloads`)</h3>
                    <p className="downloads-sub">
                      Leave blank if this is a web-only resource. Filling links activates device-aware download buttons.
                    </p>
                  </div>
                </div>

                <div className="downloads-grid">
                  <div className="dl-field">
                    <label className="dl-label">1. Play Store URL (Android)</label>
                    <input
                      type="url"
                      value={formData.appDownloads.playStore}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          appDownloads: {
                            ...formData.appDownloads,
                            playStore: e.target.value,
                          },
                        })
                      }
                      placeholder="https://play.google.com/store/apps/details?id=..."
                      className="form-input dl-input"
                    />
                  </div>

                  <div className="dl-field">
                    <label className="dl-label">2. App Store URL (iOS / iPhone)</label>
                    <input
                      type="url"
                      value={formData.appDownloads.appStore}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          appDownloads: {
                            ...formData.appDownloads,
                            appStore: e.target.value,
                          },
                        })
                      }
                      placeholder="https://apps.apple.com/app/..."
                      className="form-input dl-input"
                    />
                  </div>

                  <div className="dl-field">
                    <label className="dl-label">3. Windows Download URL</label>
                    <input
                      type="url"
                      value={formData.appDownloads.windows}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          appDownloads: {
                            ...formData.appDownloads,
                            windows: e.target.value,
                          },
                        })
                      }
                      placeholder="https://example.com/download/windows.exe"
                      className="form-input dl-input"
                    />
                  </div>

                  <div className="dl-field">
                    <label className="dl-label">4. Mac Download URL</label>
                    <input
                      type="url"
                      value={formData.appDownloads.mac}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          appDownloads: {
                            ...formData.appDownloads,
                            mac: e.target.value,
                          },
                        })
                      }
                      placeholder="https://example.com/download/mac.dmg"
                      className="form-input dl-input"
                    />
                  </div>

                  <div className="dl-field">
                    <label className="dl-label">5. Linux Download URL</label>
                    <input
                      type="url"
                      value={formData.appDownloads.linux}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          appDownloads: {
                            ...formData.appDownloads,
                            linux: e.target.value,
                          },
                        })
                      }
                      placeholder="https://example.com/download/linux.AppImage"
                      className="form-input dl-input"
                    />
                  </div>
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Safety Rating</label>
                  <select
                    value={formData.safetyRating || "Unknown"}
                    onChange={(e) =>
                      setFormData({ ...formData, safetyRating: e.target.value })
                    }
                    className="form-input"
                  >
                    <option value="Unknown">Unknown</option>
                    <option value="Verified">Verified Safe</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Risky">Risky / Use Caution</option>
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Pricing (Free vs Paid)</label>
                  <select
                    value={formData.pricing || "Free"}
                    onChange={(e) =>
                      setFormData({ ...formData, pricing: e.target.value })
                    }
                    className="form-input"
                  >
                    <option value="Free">100% Free</option>
                    <option value="Freemium">Freemium</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>

                <div className="form-group" style={{ width: 140, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, paddingBottom: 10 }}>
                    <input
                      type="checkbox"
                      checked={formData.mobileFriendly !== false}
                      onChange={(e) =>
                        setFormData({ ...formData, mobileFriendly: e.target.checked })
                      }
                      style={{ width: 16, height: 16, accentColor: "#F5A623" }}
                    />
                    <span>Mobile Friendly</span>
                  </label>
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Mirror URL (Alternative / Backup)</label>
                  <input
                    type="url"
                    value={formData.mirrorUrl || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, mirrorUrl: e.target.value })
                    }
                    placeholder="https://mirror.example.com"
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    placeholder="e.g. streaming, HD, anime, creators"
                    className="form-input"
                  />
                </div>
              </div>

              {/* 18+ Mature / After Dark Toggle */}
              <div
                style={{
                  marginTop: 14,
                  marginBottom: 14,
                  padding: "12px 14px",
                  borderRadius: 8,
                  background: formData.isAdult ? "rgba(239, 68, 68, 0.12)" : "rgba(255, 255, 255, 0.03)",
                  border: formData.isAdult ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
                  transition: "all 0.2s ease",
                }}
              >
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", color: formData.isAdult ? "#FCA5A5" : "inherit", fontWeight: 600, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={formData.isAdult || false}
                    onChange={(e) =>
                      setFormData({ ...formData, isAdult: e.target.checked })
                    }
                    style={{ width: 16, height: 16, accentColor: "#EF4444", cursor: "pointer" }}
                  />
                  <span>🔞 Mark as 18+ (Restricted / After Dark)</span>
                </label>
                <p style={{ margin: "4px 0 0 26px", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                  When enabled, this site will be strictly hidden from public listings and standard search, accessible only via the After Dark Easter Egg.
                </p>
              </div>

              <div className="sites-modal-actions">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="sites-modal-btn is-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="sites-modal-btn is-submit"
                >
                  {saving ? "Saving…" : formData.id ? "Save Changes" : "Create Website"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Bulk Staging Modal (Safety Rule: Drafts Only) */}
      {aiModalOpen && (
        <div className="sites-modal-overlay" onClick={() => setAiModalOpen(false)}>
          <div
            className="sites-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 640 }}
          >
            <div className="sites-modal-head">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Zap size={18} color="#F5A623" />
                  <h2 className="sites-modal-title">AI Bulk Staging Assistant</h2>
                </div>
                <p className="sites-modal-sub">
                  Paste raw URLs or JSON. Enforces SAFETY RULE: all entries land as DRAFTS for your review.
                </p>
              </div>
              <button
                type="button"
                className="sites-modal-close"
                onClick={() => setAiModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="ai-safety-banner">
              <Shield size={16} className="safety-icon" />
              <span>
                <strong>Safety Rule Active:</strong> AI will never publish directly to live sites. All entries will be created as <em>Drafts</em> in your review queue.
              </span>
            </div>

            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">
                Paste Raw URLs or Structured JSON (One per line)
              </label>
              <textarea
                rows={8}
                value={aiRawInput}
                onChange={(e) => setAiRawInput(e.target.value)}
                placeholder={"https://cursor.com\nhttps://linear.app\n{\"name\": \"V0 by Vercel\", \"url\": \"https://v0.dev\", \"category\": \"Developers Resources\", \"subcategory\": \"Vibe Coding & AI Dev\"}"}
                className="form-input"
                style={{ fontFamily: "monospace", fontSize: 12.5 }}
              />
            </div>

            <div className="sites-modal-actions">
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className="sites-modal-btn is-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAiBulkStage}
                disabled={aiProcessing || !aiRawInput.trim()}
                className="sites-modal-btn is-submit"
              >
                {aiProcessing ? "Staging Drafts…" : "Stage as Drafts for Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Movies & TV Catalog Import Modal (Safety Rule: Drafts Only) */}
      {importMoviesOpen && (
        <div className="sites-modal-overlay" onClick={() => !importingMovies && setImportMoviesOpen(false)}>
          <div
            className="sites-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 760 }}
          >
            <div className="sites-modal-head">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Layers size={18} color="#7C3AED" />
                  <h2 className="sites-modal-title">Import Movies &amp; TV Catalog</h2>
                </div>
                <p className="sites-modal-sub">
                  All {seedMovieSites.length} prepared websites will be imported as <strong>unpublished drafts</strong> for your review. Existing domains are skipped — never overwritten.
                </p>
              </div>
              <button
                type="button"
                className="sites-modal-close"
                onClick={() => !importingMovies && setImportMoviesOpen(false)}
                disabled={importingMovies}
              >
                <X size={18} />
              </button>
            </div>

            <div className="ai-safety-banner">
              <Shield size={16} className="safety-icon" />
              <span>
                <strong>Safety Rule Active:</strong> Every imported record is created with <code>published: false</code> (<em>Draft</em>). Nothing goes live until you publish it from this panel.
              </span>
            </div>

            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#7C3AED" }}>{seedMovieSites.length}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Prepared sites</div>
              </div>
              <div style={{ background: "rgba(72,187,120,0.08)", border: "1px solid rgba(72,187,120,0.25)", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#48bb78" }}>draft</div>
                <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Initial status</div>
              </div>
              <div style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#F5A623" }}>0</div>
                <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Will be published</div>
              </div>
            </div>

            {importMoviesLog.length > 0 && (
              <pre style={{
                marginTop: 14,
                background: "#11131b",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: 12,
                fontSize: 12,
                maxHeight: 320,
                overflowY: "auto",
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
              }}>
{importMoviesLog.join("\n")}
              </pre>
            )}

            <div className="sites-modal-actions">
              <button
                type="button"
                onClick={() => setImportMoviesOpen(false)}
                disabled={importingMovies}
                className="sites-modal-btn is-cancel"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleImportMovies}
                disabled={importingMovies}
                className="sites-modal-btn is-submit"
                style={{ background: importingMovies ? "#999" : "linear-gradient(135deg, #7C3AED, #6D28D9)" }}
              >
                {importingMovies ? "Importing…" : `Import ${seedMovieSites.length} Sites as Drafts`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Broken Category Scanner Modal (Safety Rule: Drafts Only) */}
      {scanModalOpen && (
        <div className="sites-modal-overlay" onClick={() => setScanModalOpen(false)}>
          <div
            className="sites-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 720 }}
          >
            <div className="sites-modal-head">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20 }}>🔍</span>
                  <h2 className="sites-modal-title">Bulk Category Scanner & Repair</h2>
                </div>
                <p className="sites-modal-sub">
                  Scan all catalog entries for missing, blank, or broken categories.
                </p>
              </div>
              <button
                type="button"
                className="sites-modal-close"
                onClick={() => setScanModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="ai-safety-banner">
              <Shield size={16} className="safety-icon" />
              <span>
                <strong>Admin Drafts Safety Rule:</strong> Repaired entries will be safely placed into <em>Drafts</em> with mandatory categories assigned. No live data is overwritten without your review.
              </span>
            </div>

            <div style={{ margin: "16px 0" }}>
              {brokenEntries.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 12, color: "#4ADE80" }}>
                  <CheckCircle2 size={24} style={{ marginBottom: 8 }} />
                  <div style={{ fontWeight: 700, fontSize: 15 }}>All Websites Have Valid Categories!</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
                    Every document in your websites collection has a valid category assigned and proper appDownloads object.
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: "#F5A623" }}>
                      Found {brokenEntries.length} entries needing category repair / appDownloads retro-fill:
                    </span>
                  </div>

                  <div style={{ maxHeight: 280, overflowY: "auto", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, background: "rgba(0,0,0,0.3)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", textAlign: "left" }}>
                          <th style={{ padding: "8px 12px" }}>Website</th>
                          <th style={{ padding: "8px 12px" }}>Current Category</th>
                          <th style={{ padding: "8px 12px" }}>Assigned Fix</th>
                        </tr>
                      </thead>
                      <tbody>
                        {brokenEntries.map((b) => (
                          <tr key={b.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <td style={{ padding: "8px 12px" }}>
                              <strong style={{ color: "#F0F2F5" }}>{b.name}</strong>
                              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{b.url}</div>
                            </td>
                            <td style={{ padding: "8px 12px", color: "#F87171" }}>
                              {b.currentCategory}
                            </td>
                            <td style={{ padding: "8px 12px", color: "#4ADE80", fontWeight: 600 }}>
                              → {b.proposedCategory}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="sites-modal-actions">
              <button
                type="button"
                onClick={() => setScanModalOpen(false)}
                className="sites-modal-btn is-cancel"
              >
                Close
              </button>
              {brokenEntries.length > 0 && (
                <button
                  type="button"
                  onClick={handleApplyFixesToDrafts}
                  disabled={scanApplying}
                  className="sites-modal-btn is-submit"
                  style={{ background: "#F5A623", color: "#000", fontWeight: 800 }}
                >
                  {scanApplying ? "Staging Fixes to Drafts…" : `Repair & Stage ${brokenEntries.length} Entries to Drafts`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .sites-admin-catalog {
          color: #F0F2F5;
          padding-bottom: 40px;
        }
        .sites-admin-cat-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 22px;
        }
        .sites-admin-cat-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 6px;
        }
        .sites-admin-cat-title {
          font-size: 24px;
          font-weight: 850;
          letter-spacing: -0.02em;
          margin: 0;
          color: #FFF;
        }
        .sites-admin-status-indicator {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.6);
          background: rgba(255, 255, 255, 0.05);
          padding: 3px 8px;
          border-radius: 999px;
        }
        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }
        .sites-admin-cat-desc {
          font-size: 13.5px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
          max-width: 650px;
        }
        .sites-admin-top-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sites-admin-btn {
          appearance: none;
          border: 0;
          padding: 8px 14px;
          border-radius: 9px;
          font: inherit;
          font-size: 12.5px;
          font-weight: 750;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 140ms ease;
        }
        .sites-admin-btn.is-primary {
          background: #F5A623;
          color: #000;
        }
        .sites-admin-btn.is-primary:hover {
          filter: brightness(1.1);
        }
        .sites-admin-btn.is-ai {
          background: rgba(245, 166, 35, 0.15);
          border: 1px solid rgba(245, 166, 35, 0.35);
          color: #F5A623;
        }
        .sites-admin-btn.is-ai:hover {
          background: rgba(245, 166, 35, 0.25);
        }

        /* Toast */
        .sites-admin-toast {
          background: rgba(74, 222, 128, 0.18);
          border: 1px solid rgba(74, 222, 128, 0.35);
          color: #4ADE80;
          padding: 10px 14px;
          border-radius: 10px;
          margin-bottom: 18px;
          font-size: 13px;
          font-weight: 650;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Controls bar */
        .sites-admin-controls-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 20px;
        }
        .sites-status-tabs {
          display: flex;
          gap: 6px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 4px;
          border-radius: 12px;
        }
        .sites-status-tab {
          appearance: none;
          background: transparent;
          border: 0;
          color: rgba(255, 255, 255, 0.65);
          padding: 6px 12px;
          border-radius: 8px;
          font: inherit;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .sites-status-tab.is-active {
          background: rgba(245, 166, 35, 0.15);
          color: #F5A623;
          border: 1px solid rgba(245, 166, 35, 0.3);
        }
        .tab-pill {
          font-size: 10.5px;
          padding: 1px 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
        }
        .tab-pill.is-green {
          background: rgba(74, 222, 128, 0.2);
          color: #4ADE80;
        }
        .tab-pill.is-gold {
          background: rgba(245, 166, 35, 0.2);
          color: #F5A623;
        }

        .sites-search-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          max-width: 500px;
          justify-content: flex-end;
        }
        .sites-admin-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
        }
        .sites-search-icon {
          position: absolute;
          left: 10px;
          color: rgba(255, 255, 255, 0.4);
          pointer-events: none;
        }
        .sites-admin-search-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 9px;
          padding: 7px 12px 7px 30px;
          color: #FFF;
          font: inherit;
          font-size: 12.5px;
          outline: none;
        }
        .sites-admin-search-input:focus {
          border-color: #F5A623;
        }
        .sites-admin-cat-select {
          appearance: none;
          background: #101625;
          color: #FFF;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 9px;
          padding: 7px 14px;
          font: inherit;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          outline: none;
        }

        /* Table */
        .sites-admin-table-shell {
          background: #0d121f;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          overflow-x: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        .sites-admin-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .sites-admin-table th {
          padding: 12px 14px;
          text-align: left;
          color: rgba(255, 255, 255, 0.55);
          font-size: 11px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.02);
        }
        .sites-admin-table td {
          padding: 12px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          vertical-align: middle;
        }
        .sites-admin-table tr:hover td {
          background: rgba(255, 255, 255, 0.02);
        }
        .is-draft-row td {
          background: rgba(245, 166, 35, 0.02);
        }

        .site-name-cell strong {
          color: #FFF;
          font-size: 13.5px;
          display: block;
        }
        .site-url-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #F5A623;
          font-size: 11px;
          text-decoration: none;
          margin-top: 2px;
        }
        .site-url-link:hover {
          text-decoration: underline;
        }
        .site-cat-pill {
          display: inline-block;
          font-size: 11px;
          font-weight: 650;
          color: #E2E8F0;
          background: rgba(255, 255, 255, 0.06);
          padding: 2px 7px;
          border-radius: 5px;
        }
        .site-subcat-text {
          display: block;
          font-size: 11px;
          color: rgba(245, 166, 35, 0.8);
          margin-top: 3px;
        }

        /* Downloads badges */
        .site-downloads-badges {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
        }
        .dl-badge {
          font-size: 10px;
          font-weight: 750;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .dl-badge.is-android { background: rgba(52, 211, 153, 0.18); color: #34D399; }
        .dl-badge.is-apple { background: rgba(255, 255, 255, 0.15); color: #FFF; }
        .dl-badge.is-win { background: rgba(56, 189, 248, 0.18); color: #38BDF8; }
        .dl-badge.is-mac { background: rgba(245, 166, 35, 0.18); color: #F5A623; }
        .dl-badge.is-linux { background: rgba(244, 114, 182, 0.18); color: #F472B6; }
        .site-no-downloads {
          color: rgba(255, 255, 255, 0.3);
          font-size: 11.5px;
        }

        .site-status-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 750;
          padding: 3px 8px;
          border-radius: 999px;
        }
        .site-status-badge.is-published {
          background: rgba(74, 222, 128, 0.18);
          color: #4ADE80;
        }
        .site-status-badge.is-draft {
          background: rgba(245, 166, 35, 0.18);
          color: #F5A623;
        }

        .site-actions-cell {
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
        }
        .site-toggle-btn {
          appearance: none;
          border: 0;
          font: inherit;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
          cursor: pointer;
        }
        .site-toggle-btn.is-pub {
          background: rgba(74, 222, 128, 0.2);
          color: #4ADE80;
        }
        .site-toggle-btn.is-unpub {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.7);
        }
        .site-edit-btn {
          appearance: none;
          background: rgba(245, 166, 35, 0.15);
          border: 1px solid rgba(245, 166, 35, 0.3);
          color: #F5A623;
          font: inherit;
          font-size: 11.5px;
          font-weight: 700;
          padding: 4px 9px;
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .site-delete-btn {
          appearance: none;
          background: rgba(220, 53, 69, 0.15);
          border: 0;
          color: #FF6B6B;
          padding: 5px;
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        /* Modal */
        .sites-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .sites-modal-card {
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          background: #0d121f;
          border: 1px solid rgba(245, 166, 35, 0.35);
          border-radius: 16px;
          padding: 22px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
        }
        .sites-modal-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 18px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .sites-modal-title {
          font-size: 18px;
          font-weight: 850;
          color: #FFF;
          margin: 0 0 4px;
        }
        .sites-modal-sub {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.55);
          margin: 0;
        }
        .sites-modal-close {
          appearance: none;
          background: transparent;
          border: 0;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
        }
        .sites-modal-err {
          background: rgba(220, 53, 69, 0.2);
          border: 1px solid rgba(220, 53, 69, 0.4);
          color: #FF6B6B;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 600;
          margin-bottom: 14px;
        }

        /* Form elements */
        .sites-modal-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .form-group-row {
          display: flex;
          gap: 12px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-label {
          font-size: 12px;
          font-weight: 750;
          color: rgba(255, 255, 255, 0.75);
        }
        .form-input {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          padding: 8px 12px;
          color: #FFF;
          font: inherit;
          font-size: 13px;
          outline: none;
        }
        .form-input:focus {
          border-color: #F5A623;
        }

        /* Downloads box */
        .form-downloads-box {
          background: rgba(245, 166, 35, 0.03);
          border: 1px dashed rgba(245, 166, 35, 0.25);
          border-radius: 12px;
          padding: 14px;
          margin-top: 4px;
        }
        .downloads-box-head {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 12px;
        }
        .downloads-head-icon {
          color: #F5A623;
          margin-top: 2px;
        }
        .downloads-title {
          font-size: 13.5px;
          font-weight: 800;
          color: #FFF;
          margin: 0;
        }
        .downloads-sub {
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.55);
          margin: 2px 0 0;
        }
        .downloads-grid {
          display: grid;
          gap: 8px;
        }
        .dl-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .dl-label {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.65);
        }
        .dl-input {
          padding: 6px 10px;
          font-size: 12px;
        }

        .sites-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 10px;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .sites-modal-btn {
          appearance: none;
          border: 0;
          padding: 8px 16px;
          border-radius: 8px;
          font: inherit;
          font-size: 12.5px;
          font-weight: 750;
          cursor: pointer;
        }
        .sites-modal-btn.is-cancel {
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
        }
        .sites-modal-btn.is-submit {
          background: #F5A623;
          color: #000;
        }

        /* AI Safety banner */
        .ai-safety-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(245, 166, 35, 0.1);
          border: 1px solid rgba(245, 166, 35, 0.3);
          border-radius: 9px;
          padding: 10px 12px;
          font-size: 12.5px;
          color: #E2E8F0;
        }
        .safety-icon {
          color: #F5A623;
          flex-shrink: 0;
        }

        /* Loading / Empty */
        .sites-admin-loading {
          padding: 60px 20px;
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .sites-admin-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(245, 166, 35, 0.2);
          border-top-color: #F5A623;
          border-radius: 50%;
          animation: adminSpin 800ms linear infinite;
        }
        @keyframes adminSpin {
          to { transform: rotate(360deg); }
        }
        .sites-empty-cell {
          padding: 40px !important;
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </div>
  );
}
