/**
 * websiteIconHelper — Real website icon & favicon URL resolver
 */
import { extractCleanDomain } from "../../hooks/useSearch.js";

export const BRAND_SVGS = {
  instagram: {
    color: "#E4405F",
    bg: "rgba(228, 64, 95, 0.12)",
    path: "M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.8-3.8V7.8A3.8 3.8 0 0 0 16.2 4H7.8Zm8.9 1.5a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  },
  tiktok: {
    color: "#FFFFFF",
    bg: "rgba(255, 255, 255, 0.1)",
    path: "M14 2h3c.2 1.6 1.2 3 2.6 3.8.8.5 1.6.7 2.4.8v3a8.3 8.3 0 0 1-5-1.7v7.2a6.3 6.3 0 1 1-6.3-6.3c.5 0 1 .1 1.5.2v3.1a3.2 3.2 0 1 0 2.2 3V2Z",
  },
  whatsapp: {
    color: "#25D366",
    bg: "rgba(37, 211, 102, 0.12)",
    path: "M12 2a10 10 0 0 0-8.5 15.3L2 22l4.9-1.4A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 20Zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.3-.6.8-.8 1-.1.2-.3.2-.5.1-1.4-.7-2.4-1.3-3.3-2.6-.2-.3 0-.5.2-.7l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6-.1-.2-.6-1.5-.9-2-.2-.5-.5-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.2.3-1 1-1 2.4s1 2.8 1.2 3c.2.2 2 3.1 4.9 4.3.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.5-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z",
  },
  youtube: {
    color: "#FF0033",
    bg: "rgba(255, 0, 51, 0.12)",
    path: "M23 12s0-3.5-.4-5.2a3 3 0 0 0-2.1-2.1C18.8 4.2 12 4.2 12 4.2s-6.8 0-8.5.5a3 3 0 0 0-2.1 2.1C1 8.5 1 12 1 12s0 3.5.4 5.2a3 3 0 0 0 2.1 2.1c1.7.5 8.5.5 8.5.5s6.8 0 8.5-.5a3 3 0 0 0 2.1-2.1C23 15.5 23 12 23 12Zm-13.2 4V8l6.2 4-6.2 4Z",
  },
  chatgpt: {
    color: "#10A37F",
    bg: "rgba(16, 163, 127, 0.12)",
    path: "M12 2a4.5 4.5 0 0 1 4.4 3.5 4.5 4.5 0 0 1 3.8 6.7 4.5 4.5 0 0 1-3.1 6.5A4.5 4.5 0 0 1 10.8 22a4.5 4.5 0 0 1-4.4-3.5 4.5 4.5 0 0 1-3.8-6.7 4.5 4.5 0 0 1 3.1-6.5A4.5 4.5 0 0 1 12 2Zm0 3.1-3.1 1.8v3.5l3.1 1.8 3.1-1.8V6.9L12 5.1Zm-5.7 3.3-1.5.9v3.6l3.1 1.8 3.1-1.8-3.1-1.8V7.5l-1.6.9Zm11.4 0-1.6-.9v3.6l-3.1 1.8 3.1 1.8 3.1-1.8V9.3l-1.5-.9Zm-5.7 5.1-3.1 1.8v3.5l3.1 1.8 3.1-1.8v-3.5L12 13.5Z",
  },
  netflix: {
    color: "#E50914",
    bg: "rgba(229, 9, 20, 0.12)",
    path: "M6 2h4l8 20h-4L6 2Zm0 0h4v20H6V2Zm8 0h4v20h-4V2Z",
  },
  canva: {
    color: "#00C4CC",
    bg: "rgba(0, 196, 204, 0.12)",
    path: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c4 0 7.4-2.3 9-5.6l-3.2-1.5A6.4 6.4 0 1 1 18.4 9l3.3-1.3A10 10 0 0 0 12 2Z",
  },
  spotify: {
    color: "#1ED760",
    bg: "rgba(30, 215, 96, 0.12)",
    path: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.6 14.5a.8.8 0 0 1-1.1.3c-3-1.8-6.8-2.2-11.3-1.2a.8.8 0 1 1-.4-1.5c4.9-1.1 9.2-.6 12.5 1.4.4.2.5.7.3 1Zm1.5-3a1 1 0 0 1-1.4.3c-3.4-2.1-8.6-2.7-12.6-1.5a1 1 0 1 1-.6-1.9c4.6-1.4 10.4-.7 14.3 1.7.5.3.7.9.3 1.4Zm.1-3.2C14.1 7.9 7.4 7.6 3.5 8.8a1.2 1.2 0 1 1-.7-2.3c4.6-1.4 12-1.1 16.6 1.7a1.2 1.2 0 0 1-1.2 2.1Z",
  },
  github: {
    color: "#FFFFFF",
    bg: "rgba(255, 255, 255, 0.1)",
    path: "M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-2c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 0 1.6 1 1.6 1 .9 1.5 2.4 1.1 3 .8.1-.7.4-1.1.7-1.4-2.3-.3-4.7-1.1-4.7-5A3.9 3.9 0 0 1 6.8 8c-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.8 1.1a9.5 9.5 0 0 1 5.1 0c2-1.4 2.8-1.1 2.8-1.1.6 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1.1 3c0 3.9-2.4 4.7-4.7 5 .4.3.7.9.7 1.8V21c0 .3.2.6.7.5A10 10 0 0 0 12 2Z",
  },
  gmail: {
    color: "#EA4335",
    bg: "rgba(234, 67, 53, 0.12)",
    path: "M3 5h18v14H3V5Zm2 2v9h2V9l5 4 5-4v7h2V7l-7 5-7-5Z",
  },
  "google maps": {
    color: "#4285F4",
    bg: "rgba(66, 133, 244, 0.12)",
    path: "M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z",
  },
  x: {
    color: "#FFFFFF",
    bg: "rgba(255, 255, 255, 0.1)",
    path: "M4 3h4.6l4.3 5.8L17.9 3H20l-6.1 7.1L21 21h-4.6l-4.8-6.4L6.1 21H4l6.6-7.7L4 3Zm3.5 2 10 14h1L8.5 5h-1Z",
  },
  twitter: {
    color: "#1DA1F2",
    bg: "rgba(29, 161, 242, 0.12)",
    path: "M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z",
  },
  reddit: {
    color: "#FF4500",
    bg: "rgba(255, 69, 0, 0.12)",
    path: "M20.5 12.1c.9 0 1.5-.7 1.5-1.5S21.3 9 20.5 9c-.4 0-.8.2-1.1.5-1.7-1.2-4-2-6.6-2.1l1-3 2.6.6a1.8 1.8 0 1 0 .3-1.2l-3.3-.8a.7.7 0 0 0-.8.5l-1.3 3.9c-2.7.1-5.1.9-6.8 2.2A1.5 1.5 0 1 0 3.6 12c-.1.3-.1.6-.1.9 0 3 3.8 5.5 8.5 5.5s8.5-2.5 8.5-5.5c0-.3 0-.5-.1-.8ZM7.5 12a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6Zm8.9 4c-1.2 1-2.7 1.4-4.4 1.4s-3.2-.5-4.4-1.4a.6.6 0 1 1 .8-.9c1 .8 2.2 1.2 3.6 1.2s2.7-.4 3.6-1.2a.6.6 0 1 1 .8.9Zm.1-1.4a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Z",
  },
  linkedin: {
    color: "#0A66C2",
    bg: "rgba(10, 102, 194, 0.12)",
    path: "M4.5 3A2.5 2.5 0 1 1 4.5 8a2.5 2.5 0 0 1 0-5ZM2.5 9.5h4V22h-4V9.5Zm6.5 0h3.8v1.7h.1c.5-1 1.8-2.1 3.8-2.1 4 0 4.8 2.7 4.8 6.1V22h-4v-6c0-1.4 0-3.3-2-3.3s-2.3 1.6-2.3 3.2V22H9V9.5Z",
  },
  telegram: {
    color: "#26A5E4",
    bg: "rgba(38, 165, 228, 0.12)",
    path: "M22 3 2.7 10.4c-1.3.5-1.3 1.3-.2 1.6l5 1.6 2 6.1c.2.6.1.8.7.8.5 0 .7-.2 1-.5l2.4-2.3 5 3.7c.9.5 1.6.2 1.8-.8L23.8 4c.3-1.1-.4-1.6-1.8-1Zm-12.3 10 9.8-6.2c.5-.3.9-.1.6.2l-8.1 7.3-.3 3.5-2-4.8Z",
  },
  discord: {
    color: "#5865F2",
    bg: "rgba(88, 101, 242, 0.12)",
    path: "M19.5 5.3A16 16 0 0 0 15.4 4l-.5 1.1a15 15 0 0 0-5.8 0L8.6 4a16 16 0 0 0-4.1 1.3C1.9 9.2 1.2 13 1.5 16.8a16.4 16.4 0 0 0 5 2.6l1.2-1.7c-.7-.3-1.4-.7-2-1.2l.5-.4c3.8 1.7 7.9 1.7 11.6 0l.5.4c-.6.5-1.3.9-2 1.2l1.2 1.7a16.4 16.4 0 0 0 5-2.6c.4-4.4-.7-8.1-3-11.5ZM8.5 14.8c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.1 1.1 2.1 2.4-.9 2.4-2.1 2.4Zm7 0c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.1 1.1 2.1 2.4-.9 2.4-2.1 2.4Z",
  },
  vercel: {
    color: "#FFFFFF",
    bg: "rgba(255, 255, 255, 0.1)",
    path: "M12 2 2 20h20L12 2Z",
  },
  supabase: {
    color: "#3ECF8E",
    bg: "rgba(62, 207, 142, 0.12)",
    path: "M12 2 4 13h7l-2 9 10-12h-7l3-8h-3Z",
  },
  firebase: {
    color: "#FFCA28",
    bg: "rgba(255, 202, 40, 0.12)",
    path: "M4.5 18.5 7.8 2.2a.8.8 0 0 1 1.5-.1l2.4 4.5L14 3.2a.8.8 0 0 1 1.5.2l4 15.1-7.5 4.5-7.5-4.5Z",
  },
};

/**
 * Canonical primary icon URL for a website.
 *
 * Priority (CUSTOM ALWAYS WINS):
 *   1. customIconUrl       — manually supplied by admin (authoritative)
 *   2. stored explicit icon — logo / icon / faviconUrl / favicon / imageUrl
 *   3. null                — caller falls back to auto-fetch / letter avatar
 *
 * Returns a URL string or null.
 */
export function getWebsitePrimaryIcon(website = {}) {
  if (!website || typeof website !== "object") return null;

  // 1. Custom admin-supplied icon — ALWAYS wins, never overridden by auto-fetch.
  const custom = website.customIconUrl || website.customLogoUrl;
  if (custom && typeof custom === "string" && custom.trim()) {
    return custom.trim();
  }

  // 2. Existing stored/verified explicit icon.
  const explicit =
    website.verifiedIcon ||
    website.logo ||
    website.logoUrl ||
    website.icon ||
    website.iconUrl ||
    website.faviconUrl ||
    website.favicon ||
    website.imageUrl;
  if (explicit && typeof explicit === "string" && explicit.startsWith("http")) {
    return explicit;
  }

  return null;
}

export function getWebsiteIcon(website = {}) {
  const name = String(website.name || website.title || "").trim();
  const domain = extractCleanDomain(website);
  const key = name.toLowerCase();

  // 1. Custom admin icon always wins.
  const custom = getWebsitePrimaryIcon(website);
  if (custom) {
    return { type: "img", url: custom, isCustom: true };
  }

  // 2. Vector brand
  if (BRAND_SVGS[key]) {
    return { type: "svg", ...BRAND_SVGS[key] };
  }

  // 3. Explicit favicon
  const explicit = website.faviconUrl || website.favicon || website.logo || website.icon;
  if (explicit && typeof explicit === "string" && explicit.startsWith("http")) {
    return { type: "img", url: explicit };
  }

  // 4. Domain favicon
  if (domain) {
    return {
      type: "img",
      url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      fallbackUrl: `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    };
  }

  return { type: "letter", letter: name.charAt(0).toUpperCase() || "?" };
}
