import React from "react";
import { ArrowRight, Clock } from "lucide-react";

const G = "#F5A623";

function getImage(item) {
  return item?.thumbnailUrl || item?.imageUrl || item?.image || item?.coverImage || null;
}

export default function ContentCard({ item, onClick, compact = false }) {
  const title = item?.title || item?.name || "STEA guide";
  const summary = item?.shortDescription || item?.summary || item?.description || "Practical guide from STEA.";
  const image = getImage(item);
  const category = item?.category || item?.badge || item?._collection || "Guide";
  const readTime = item?.readTime || item?.readingTime || "4 min";

  return (
    <button
      type="button"
      onClick={() => onClick?.(item)}
      className="stea-content-card stea-btn"
      style={{ minHeight: compact ? 132 : undefined }}
    >
      <div className="stea-content-card__media">
        {image ? (
          <img src={image} alt={title} loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <div className="stea-content-card__fallback">{String(category).slice(0, 2).toUpperCase()}</div>
        )}
        <span className="stea-content-card__badge">{category}</span>
      </div>
      <div className="stea-content-card__body">
        <div className="stea-content-card__meta">
          <Clock size={12} /> {readTime}
        </div>
        <h3>{title}</h3>
        <p>{summary}</p>
        <span className="stea-content-card__cta">
          Read guide <ArrowRight size={13} />
        </span>
      </div>
    </button>
  );
}

