import { useEffect } from "react";

const SITES_ICON = "/sites-icons/favicon-32x32.png";
const DEFAULT_ICON = "/sites-icons/favicon-32x32.png";

function ensureLink(rel) {
  let node = document.querySelector(`link[rel="${rel}"]`);
  if (!node) {
    node = document.createElement("link");
    node.setAttribute("rel", rel);
    document.head.appendChild(node);
  }
  return node;
}

export default function SitesFavicon() {
  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const icon = ensureLink("icon");
    const apple = ensureLink("apple-touch-icon");

    const previousIcon = icon.getAttribute("href");
    const previousIconType = icon.getAttribute("type");
    const previousApple = apple.getAttribute("href");

    icon.setAttribute("href", SITES_ICON);
    icon.setAttribute("type", "image/png");
    apple.setAttribute("href", SITES_ICON);

    return () => {
      icon.setAttribute("href", previousIcon || DEFAULT_ICON);

      if (previousIconType) {
        icon.setAttribute("type", previousIconType);
      } else {
        icon.setAttribute("type", "image/png");
      }

      apple.setAttribute("href", previousApple || DEFAULT_ICON);
    };
  }, []);

  return null;
}
