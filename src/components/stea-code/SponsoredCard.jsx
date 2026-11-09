import React from "react";

/**
 * Native in-feed ad disguised as a product card (clearly labeled
 * "Sponsored"). Uses the same .sc-product-card shell as CodeProductCard so
 * it inherits the grid's rounded corners, shadow and height. The empty
 * #ad-slot-in-feed div is where the Adsterra Native Ad script will render
 * once its tags are installed.
 */
export default function SponsoredCard() {
  return (
    <div className="sc-product-card sc-sponsored-card" aria-label="Sponsored content">
      <div className="sc-sponsored-card__badge-row">
        <span className="sc-sponsored-card__badge">Sponsored</span>
      </div>
      <div id="ad-slot-in-feed" style={{ width: "100%", height: "100%", minHeight: "180px" }} />
      <div className="sc-sponsored-card__footer">Recommended Tool</div>
    </div>
  );
}
