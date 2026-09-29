import { normalizeCategory } from "../data/websiteCategories.js";

export function getResourceDetailPath(resource) {
  if (!resource) return "/websites";
  const slug = resource.id || resource.slug || normalizeCategory(resource.name || resource.title);
  return `/site/${slug}`;
}
