export const SUBDOMAIN_ROUTES = {
  "classroom.stea.africa": "/classroom",
  "alpha.stea.africa": "/alpha",
  "sites.stea.africa": "/websites",
  "education.stea.africa": "/education",
  "daily.stea.africa": "/daily",
  "code.stea.africa": "/",
  "tools.stea.africa": "/digital-tools",
  "jobs.stea.africa": "/jobs",
  "community.stea.africa": "/community"
};

export function getSubdomainRoute(hostname = window.location.hostname) {
  for (const [key, route] of Object.entries(SUBDOMAIN_ROUTES)) {
    if (hostname.includes(key)) {
      return route;
    }
  }

  // Cloudflare Pages preview URLs for STEA Code
  const host = String(hostname || "").toLowerCase();
  if (host === "stea-code.pages.dev" || host.endsWith(".stea-code.pages.dev")) {
    return "/";
  }

  return null;
}
