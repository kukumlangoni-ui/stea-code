export const getSafariLink = (settings, product) => {
  const rawCta = settings?.contact_info?.safariCta || "";
  if (!rawCta || !product?.hasSafariOption) return null;

  if (rawCta.startsWith("http://") || rawCta.startsWith("https://")) {
    return { type: "url", link: rawCta };
  }

  // Assume phone number if it contains numbers and not starting with http
  const phone = rawCta.replace(/\D/g, "");
  if (phone.length >= 7) {
    const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(`Hello, I would like to book the safari: ${product.name || product.title || "Safari package"}`)}`;
    return { type: "whatsapp", link: waLink };
  }

  return null;
};
