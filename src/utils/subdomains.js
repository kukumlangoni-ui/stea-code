export const STEA_SUBDOMAIN_CONFIG = {
  classroom: {
    hostname: "classroom.stea.africa",
    path: "/classroom",
    title: "STEA Classroom",
    description: "Join classes, manage attendance, assignments, quizzes and student progress.",
    section: "classroom",
  },
  alpha: {
    hostname: "alpha.stea.africa",
    path: "/alpha",
    title: "Alpha Classroom",
    description: "Alpha Schools tenant classroom for Mikocheni and Kunduchi campuses.",
    section: "alpha-classroom",
  },
  sites: {
    hostname: "sites.stea.africa",
    path: "/websites",
    title: "STEA Sites",
    description: "Websites, systems and digital services for modern brands.",
    section: "services",
  },
  education: {
    hostname: "education.stea.africa",
    path: "/education",
    title: "STEA Education",
    description: "Notes, past papers, results, scholarships and learning resources.",
    section: "education",
  },
  daily: {
    hostname: "daily.stea.africa",
    path: "/daily",
    title: "STEA Daily",
    description: "Daily news, updates, guides and resources from STEA.",
    section: "daily",
  },
  tools: {
    hostname: "tools.stea.africa",
    path: "/digital-tools",
    title: "STEA Digital Tools",
    description: "AI tools, productivity apps and digital resources.",
    section: "digital-tools",
  },
  jobs: {
    hostname: "jobs.stea.africa",
    path: "/jobs",
    title: "STEA Jobs",
    description: "Jobs, gigs, internships and freelance opportunities.",
    section: "jobs",
  },
  community: {
    hostname: "community.stea.africa",
    path: "/community",
    title: "STEA Community",
    description: "Connect, learn and discuss with the STEA ecosystem.",
    section: "community",
  },
};

export const STEA_SUBDOMAIN_URLS = Object.fromEntries(
  Object.entries(STEA_SUBDOMAIN_CONFIG).map(([key, value]) => [key, `https://${value.hostname}`]),
);

export function getSteaSubdomainConfig(hostname) {
  if (!hostname) return null;
  const host = hostname.toLowerCase();

  for (const config of Object.values(STEA_SUBDOMAIN_CONFIG)) {
    if (host.includes(config.hostname)) return config;
  }

  if (host.endsWith(".localhost")) {
    const label = host.split(".")[0];
    return STEA_SUBDOMAIN_CONFIG[label] || null;
  }

  return null;
}

export function isSteaSubdomainRoot(hostname, pathname) {
  return Boolean(getSteaSubdomainConfig(hostname)) && (pathname === "/" || pathname === "/index.html");
}

export function isSteaCodeHost(hostname) {
  if (!hostname) return false;
  const host = hostname.toLowerCase();

  if (host === "code.stea.africa") return true;
  if (host === "code.localhost") return true;
  if (host.includes("code.stea.africa")) return true;
  if (host.startsWith("code.")) return true;

  // Cloudflare Pages preview URLs
  if (host === "stea-code.pages.dev") return true;
  if (host.endsWith(".stea-code.pages.dev")) return true;

  return false;
}

export function getSteaCodePublicUrl() {
  if (typeof window !== "undefined" && isSteaCodeHost(window.location.hostname)) {
    return "/";
  }
  return "/code";
}

