import { getSmartDirectRoute, searchIndex } from "../data/searchIndex.js";
import { SECRET_AFTER_DARK_KEYWORDS } from "../components/sites/AgeGateModal.jsx";

export function routeSearchQuery(query, fallback = "search") {
  const norm = String(query || "").trim();
  if (!norm) return fallback;

  // Secret After Dark keywords → route to /after-dark where the Age Gate protects content.
  const clean = norm.toLowerCase().trim();
  if (SECRET_AFTER_DARK_KEYWORDS.includes(clean)) {
    return "after-dark";
  }

  // Check if our smart direct router finds a matching route
  const targetRoute = getSmartDirectRoute(norm);
  if (targetRoute) {
    // Strip leading sash if caller expects it, but keeping standard structure
    return targetRoute.startsWith("/") ? targetRoute.substring(1) : targetRoute;
  }

  // If no exact redirect is found, route to the search page itself with query parameter
  return `search?q=${encodeURIComponent(norm)}`;
}

export function searchRouteLabel(route) {
  const normalizedRoute = route.startsWith("/") ? route : `/${route}`;
  const found = searchIndex.find(item => item.route === normalizedRoute);
  if (found) return found.title;

  const labels = {
    "/results": "NECTA Results Center",
    "/education": "STEA Education",
    "/courses": "Courses & Learn",
    "/kazi": "Gigs & Opportunities",
    "/duka": "STEA Marketplace",
    "/websites": "Website Solutions",
    "/ai-lab": "AI Lab",
    "/prompt-lab": "Prompt Lab",
    "/services": "Professional Services",
    "/games": "Games & Gaming Zone"
  };
  return labels[normalizedRoute] || route;
}
