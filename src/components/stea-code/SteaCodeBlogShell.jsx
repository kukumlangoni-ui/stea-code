import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import SteaCodeFooter from "./SteaCodeFooter.jsx";
import NewsletterModal from "./NewsletterModal.jsx";
import "../../pages/stea-code/stea-code-v2.css";

/**
 * SteaCodeBlogShell — wraps /blog and /blog/:slug in the same sticky top
 * navigation and footer as the rest of SteaCode, so blog visitors are never
 * stranded on an orphaned page. Nav tab links deep-link into the home page's
 * tab state (`/?tab=…`), keeping everything in one SPA.
 */
const BLOG_NAV = [
  { label: "Components", to: "/components" },
  { label: "Templates", to: "/templates" },
  { label: "Kits", to: "/kits" },
  { label: "Library", to: "/library" },
  { label: "Icons", to: "/icons" },
  { label: "Blog", to: "/blog" },
];

export default function SteaCodeBlogShell() {
  const location = useLocation();
  const onBlog = location.pathname.startsWith("/blog");
  const [newsletterOpen, setNewsletterOpen] = useState(false);

  return (
    <div className="stea-code-app sc-v2">
      <header className="sc-topbar">
        <Link className="sc-topbar-logo" to="/" aria-label="steacode home">
          <img
            src="/stea-code-logo.png"
            alt="steacode"
            className="sc-topbar-logo-img"
            width={36}
            height={36}
          />
          <span>steacode</span>
        </Link>

        <nav className="sc-topbar-nav" aria-label="Marketplace navigation">
          {BLOG_NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={item.label === "Blog" && onBlog ? "is-active" : ""}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sc-topbar-actions">
          <button
            type="button"
            className="sc-blog-signin"
            data-newsletter-trigger
            onClick={() => setNewsletterOpen(true)}
          >
            Get Updates
          </button>
        </div>
      </header>

      <Outlet />

      <SteaCodeFooter />
      <NewsletterModal open={newsletterOpen} onClose={() => setNewsletterOpen(false)} />
    </div>
  );
}
