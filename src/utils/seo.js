export function generateSlug(title, category = "") {
  if (!title) return "";
  let slug = `${title} ${category}`.toLowerCase();
  slug = slug.replace(/[^a-z0-9\s-]/g, ""); // remove special chars
  slug = slug.replace(/\s+/g, "-"); // replace spaces with hyphens
  slug = slug.replace(/-+/g, "-"); // remove multiple hyphens
  return slug.replace(/^-+|-+$/g, ""); // trim hyphens
}

export function generateProductSchema(product) {
  if (!product) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title || product.name,
    "description": product.description || `Buy ${product.title || product.name} at STEA.`,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "TZS",
      "price": product.price || 0,
      "availability": product.inStock !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": product.vendorName || "STEA Marketplace"
      }
    }
  };
}

export function generateCourseSchema(course) {
  if (!course) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.title || course.name,
    "description": course.description || `Learn ${course.title || course.name} with STEA.`,
    "provider": {
      "@type": "Organization",
      "name": course.instructor || "STEA Academy"
    }
  };
}

export function generateTags(title) {
  if (!title) return [];
  const words = title.split(/\s+/);
  return words.filter(word => word.length > 3).map(w => w.toLowerCase());
}
