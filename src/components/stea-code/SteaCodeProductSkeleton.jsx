import React from "react";

export default function SteaCodeProductSkeleton() {
  return (
    <div className="sc-product-skeleton" aria-hidden="true">
      <div className="sc-product-skeleton-preview" />
      <div className="sc-product-skeleton-caption">
        <div className="sc-product-skeleton-line sc-product-skeleton-line--title" />
        <div className="sc-product-skeleton-line sc-product-skeleton-line--category" />
      </div>
    </div>
  );
}
