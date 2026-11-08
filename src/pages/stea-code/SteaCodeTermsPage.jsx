import React from "react";
import { Link } from "react-router-dom";
import SEO from "../../components/SEO.jsx";
import "./stea-code-about.css";

export default function SteaCodeTermsPage() {
  const year = new Date().getFullYear();
  return (
    <>
      <SEO title="SteaCode — Terms of Service" description="SteaCode Terms of Service." canonical="https://steacode.com/terms" type="webpage" />
      <div className="sc-about">
        <section className="sc-about-section sc-about-legal">
          <h1>Terms of Service</h1>
          <p className="sc-about-legal-date">Last updated: Nov 9, {year}</p>
          <p>
            These terms govern access to <a href="https://steacode.com">steacode.com</a> and
            the products delivered through it. By using SteaCode content you agree to these
            terms. All components, icons, kits, and e-books on SteaCode are free to access
            and use in personal and commercial projects, under the license stated on each
            product — see <Link to="/licensing">Licensing</Link> for the default terms.
            You may not redistribute or resell SteaCode content as a competing library or
            marketplace.
          </p>
          <p>
            All content is provided "as is", without warranty of any kind, express or implied,
            including but not limited to the warranties of merchantability or fitness for a
            particular purpose. SteaCode is supported by advertising (Google AdSense) — by
            using the site you acknowledge that ads may be served by third-party vendors as
            described in our <Link to="/privacy">Privacy Policy</Link>. Questions are handled
            at <a href="mailto:support@steacode.com">support@steacode.com</a>.
          </p>
        </section>
      </div>
    </>
  );
}
