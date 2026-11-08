/**
 * SteaCode Organization schema — injected into every page so search engines
 * and AI crawlers have a single, verifiable "source of truth".
 *
 * Matches Google's Organization + Person recommendations for Knowledge Panels.
 */
export const STEA_CODE_ORGANIZATION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://steacode.com/#organization",
  name: "SteaCode",
  alternateName: "STEA Code",
  url: "https://steacode.com",
  logo: {
    "@type": "ImageObject",
    url: "https://steacode.com/stea-code-logo.png",
    width: 28,
    height: 28,
  },
  image: "https://steacode.com/stea-code-logo.png",
  description:
    "A free developer library of code components, UI kits, and interactive ebooks.",
  founder: {
    "@type": "Person",
    name: "Isaya Masika",
    "@id": "https://steacode.com/#founder",
    sameAs: [
      "https://x.com/isayamasika",
      "https://github.com/isayamasika",
      "https://www.linkedin.com/in/isayamasika",
    ],
  },
  foundDate: "2025",
  keywords: [
    "SteaCode",
    "UI components",
    "developer marketplace",
    "code marketplace",
    "free React components",
    "interactive ebooks",
    "developer tools",
  ],
  email: "support@steacode.com",
  contactPoint: {
    "@type": "ContactPoint",
    email: "support@steacode.com",
    contactType: "customer support",
    availableLanguage: ["English"],
  },
  sameAs: [
    "https://x.com/steacode",
    "https://github.com/steacode",
    "https://www.linkedin.com/company/steacode",
    "https://www.youtube.com/@steacode",
    "https://t.me/steacode",
    "https://discord.gg/steacode",
    "https://www.instagram.com/steacode",
  ],
};

export const STEA_CODE_FOUNDER = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://steacode.com/#founder",
  name: "Isaya Masika",
  jobTitle: "Founder",
  worksFor: {
    "@id": "https://steacode.com/#organization",
  },
  url: "https://steacode.com/about",
  sameAs: [
    "https://x.com/isayamasika",
    "https://github.com/isayamasika",
    "https://www.linkedin.com/in/isayamasika",
  ],
};

/**
 * Build a JSON-LD `@graph` for a SteaCode content page — Organization + Person
 * are always included, Product/SoftwareApplication/etc. can be merged in.
 */
export function steaCodeGraph(...additionalNodes) {
  return {
    "@context": "https://schema.org",
    "@graph": [STEA_CODE_ORGANIZATION, STEA_CODE_FOUNDER, ...additionalNodes],
  };
}
