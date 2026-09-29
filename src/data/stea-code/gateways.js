import {
  Braces,
  Wrench,
  Server,
  Globe2,
  Palette,
  Sparkles,
  Laptop,
  FileText,
} from "lucide-react";

/**
 * STEA Code Gateway Objects
 *
 * Single source of truth for the 8 STEA Code destinations.
 * Replaces the old positional array to prevent destructuring bugs.
 *
 * Each gateway MUST match exactly the /code?view=* routes.
 */
export const GATEWAYS = [
  {
    id: "code",
    title: "Code Snippets",
    description: "Copy-ready UI patterns and components.",
    cta: "Browse Code",
    icon: Braces,
    href: "/code?view=code",
    eyebrow: "CODE LIBRARY",
    hero: ["Build it.", "Copy it.", "Make it yours."],
    subtitle: "Copy-ready UI patterns, components, and effects.",
  },
  {
    id: "tips",
    title: "Tech Tips",
    description: "Quick practical tips for developers.",
    cta: "View Tips",
    icon: Wrench,
    href: "/code?view=tips",
    eyebrow: "TECH TIPS",
    hero: ["Small lessons.", "Better builds."],
    subtitle: "Developer-focused lessons to level up daily.",
  },
  {
    id: "hosting",
    title: "Hosting",
    description: "Find the best place to host your projects.",
    cta: "Explore Hosting",
    icon: Server,
    href: "/code?view=hosting",
    eyebrow: "HOSTING",
    hero: ["Ship confidently.", "Scale when ready."],
    subtitle: "Platforms, free tiers, and deployment paths.",
  },
  {
    id: "domains",
    title: "Domains",
    description: "Find and configure domains correctly.",
    cta: "Explore Domains",
    icon: Globe2,
    href: "/code?view=domains",
    eyebrow: "DOMAINS",
    hero: ["Own your place", "on the web."],
    subtitle: "DNS, registrars, records, and propagation.",
  },
  {
    id: "inspiration",
    title: "Website Inspiration",
    description: "Beautiful websites and creative references.",
    cta: "Get Inspired",
    icon: Palette,
    href: "/code?view=inspiration",
    eyebrow: "INSPIRATION",
    hero: ["Study great work.", "Build your own."],
    subtitle: "Curated visual references and design direction.",
  },
  {
    id: "ui",
    title: "UI Libraries",
    description: "Ready-made UI kits and components.",
    cta: "Browse Libraries",
    icon: Sparkles,
    href: "/code?view=ui",
    eyebrow: "UI LIBRARIES",
    hero: ["Better building blocks.", "Faster interfaces."],
    subtitle: "Components, icons, primitives, and motion.",
  },
  {
    id: "essentials",
    title: "Developer Essentials",
    description: "Essential tools every developer needs.",
    cta: "Explore Tools",
    icon: Laptop,
    href: "/code?view=essentials",
    eyebrow: "DEVELOPER ESSENTIALS",
    hero: ["Everything you need.", "Nothing you don't."],
    subtitle: "High-value references, tools, and utilities.",
  },
  {
    id: "guides",
    title: "Full Guides",
    description: "Step-by-step developer guides.",
    cta: "Open Guides",
    icon: FileText,
    href: "/code?view=guides",
    eyebrow: "FULL GUIDES",
    hero: ["From idea", "to working product."],
    subtitle: "Deep dives and complete project walkthroughs.",
  },
];

export const VIEW_IDS = GATEWAYS.map((g) => g.id);

/** Lookup helper: returns the gateway object or null for unknown view ids. */
export function getGateway(viewId) {
  return GATEWAYS.find((g) => g.id === viewId) || null;
}

export default GATEWAYS;
