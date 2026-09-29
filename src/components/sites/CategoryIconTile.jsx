import { memo } from "react";

const ICONS = {
  "live-sports": {
    color: "#F5A623",
    paths: [
      "M12 3.2a8.8 8.8 0 1 0 0 17.6 8.8 8.8 0 0 0 0-17.6Z",
      "M9.2 8.8 12 6.8l2.8 2-1 3.2h-3.6l-1-3.2Zm-2.9 4.3 2.8-.6 1.8 2.8-1.9 2.4a6.3 6.3 0 0 1-2.7-4.6Zm8.6 2.2 1.8-2.8 2.8.6a6.3 6.3 0 0 1-2.7 4.6l-1.9-2.4Z"
    ]
  },

  "movies-tv-shows": {
    color: "#FFB52E",
    paths: [
      "M4 5.5h16v13H4v-13Z",
      "M4 9h16M8 5.5l2 3.5m2-3.5 2 3.5m2-3.5 2 3.5"
    ]
  },

  ebooks: {
    color: "#FFD05A",
    paths: [
      "M4.5 5.5c2.5-.6 4.8-.2 7.5 1.3v12c-2.7-1.5-5-1.9-7.5-1.3v-12Zm15 0c-2.5-.6-4.8-.2-7.5 1.3v12c2.7-1.5 5-1.9 7.5-1.3v-12Z"
    ]
  },

  "life-hack": {
    color: "#FFD86A",
    paths: [
      "M9.2 17h5.6m-4.8 2h4m-2-16a6 6 0 0 0-3.5 10.9c.8.6 1.2 1.4 1.3 2.1h4.4c.1-.7.5-1.5 1.3-2.1A6 6 0 0 0 12 3Z"
    ]
  },

  "money-finance": {
    color: "#F7B734",
    paths: [
      "M5 7h14v11H5V7Zm3-3h8v3H8V4Z",
      "M12 9v7m2-5.5c-.5-.7-1.1-1-2-1-1.1 0-2 .6-2 1.5 0 2.4 4 .9 4 3 0 .9-.9 1.5-2 1.5-1 0-1.8-.4-2.3-1.1"
    ]
  },

  music: {
    color: "#F5A623",
    paths: [
      "M10 6v10.2a2.8 2.8 0 1 1-2-2.7V7l9-2v8.2a2.8 2.8 0 1 1-2-2.7V3.5L10 4.6"
    ]
  },

  games: {
    color: "#FFB02E",
    paths: [
      "M7.5 8h9c2.2 0 3.7 1.5 4.3 4.1l.5 2.2c.5 2.2-2 3.5-3.4 1.8l-1.6-1.9H7.7l-1.6 1.9c-1.4 1.7-3.9.4-3.4-1.8l.5-2.2C3.8 9.5 5.3 8 7.5 8Z",
      "M7 10v4m-2-2h4m7-1h.01m2 2h.01"
    ]
  },

  "online-courses": {
    color: "#F5B33C",
    paths: [
      "M3 9 12 5l9 4-9 4-9-4Z",
      "M7 11.5v4.2c2.9 1.9 7.1 1.9 10 0v-4.2M21 9v5"
    ]
  },

  comics: {
    color: "#FF9E38",
    paths: [
      "M5 4h14v16H5V4Z",
      "M8 7h3v4H8V7Zm5 0h3v4h-3V7Zm-5 7h8"
    ]
  },

  tools: {
    color: "#F6B73C",
    paths: [
      "M14.5 5.2a4 4 0 0 0-5 5L4 15.7 8.3 20l5.5-5.5a4 4 0 0 0 5-5l-2.6 2.6-2.3-2.3 2.6-2.6Z"
    ]
  },

  "graphics-design": {
    color: "#FFAD42",
    paths: [
      "M12 3a9 9 0 1 0 0 18h1.2c1.2 0 1.8-1.5.9-2.3-.8-.8-.4-2.1.8-2.1h1.4A4.7 4.7 0 0 0 21 12 9 9 0 0 0 12 3Z",
      "M7.2 11h.01M9.8 7.5h.01M14.2 7.3h.01M17 10.5h.01"
    ]
  },

  "jobs-career": {
    color: "#F4AE36",
    paths: [
      "M4 8h16v11H4V8Zm5-3h6v3H9V5Z",
      "M4 12h16M10 12v2h4v-2"
    ]
  },

  manga: {
    color: "#FF9650",
    paths: [
      "M5 4h14v16H5V4Z",
      "M8 8c1.2-1.4 2.4-2 4-2s2.8.6 4 2M8.5 12h.01m7 0h.01M9 16c1.8 1 4.2 1 6 0"
    ]
  },

  "asian-drama": {
    color: "#FF9B61",
    paths: [
      "M6 5h12v14H6V5Z",
      "M9 9c.7-.8 1.7-1.2 3-1.2s2.3.4 3 1.2M9.5 13h.01m5 0h.01M10 16c1.2.7 2.8.7 4 0"
    ]
  },

  adblockers: {
    color: "#F6B53B",
    paths: [
      "M12 3 19 6v5c0 4.8-2.8 8-7 10-4.2-2-7-5.2-7-10V6l7-3Z",
      "M8.7 8.7l6.6 6.6m0-6.6-6.6 6.6"
    ]
  },

  ai: {
    color: "#F8C044",
    paths: [
      "M8 8V5m8 3V5M5 11H3m18 0h-2M7 8h10a2 2 0 0 1 2 2v7H5v-7a2 2 0 0 1 2-2Z",
      "M9 12h.01m6 0h.01M9 15h6"
    ]
  },

  automation: {
    color: "#F7B93E",
    paths: [
      "M5 7h8m3 0h3M5 12h3m3 0h8M5 17h8m3 0h3",
      "M13 5v4m-5 1v4m5 1v4"
    ]
  },

  programming: {
    color: "#FFC34E",
    paths: [
      "m9 8-4 4 4 4m6-8 4 4-4 4m-2-10-2 12"
    ]
  },

  "ai-tools": {
    color: "#F7C34A",
    paths: [
      "M12 3v3m0 12v3M3 12h3m12 0h3m-4.6-5.6-2.1 2.1M9.7 14.3l-2.1 2.1m8.8 0-2.1-2.1M9.7 9.7 7.6 7.6",
      "M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z"
    ]
  },

  sports: {
    color: "#F5A623",
    paths: [
      "M8 4h8v3a4 4 0 0 1-8 0V4Zm2 9h4v4h-4v-4Zm-3 7h10M5 5H3v2a4 4 0 0 0 4 4m12-6h2v2a4 4 0 0 1-4 4"
    ]
  },

  books: {
    color: "#F8C04A",
    paths: [
      "M4.5 5.5c2.5-.6 4.8-.2 7.5 1.3v12c-2.7-1.5-5-1.9-7.5-1.3v-12Zm15 0c-2.5-.6-4.8-.2-7.5 1.3v12c2.7-1.5 5-1.9 7.5-1.3v-12Z"
    ]
  },

  learning: {
    color: "#F6B940",
    paths: [
      "M3 9 12 5l9 4-9 4-9-4Z",
      "M7 11.5v4.2c2.9 1.9 7.1 1.9 10 0v-4.2"
    ]
  },

  social: {
    color: "#FFB43C",
    paths: [
      "M8 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-1a2.5 2.5 0 1 0 0-5",
      "M3 19c.5-3.2 2.2-5 5-5s4.5 1.8 5 5m1-5c2.4.2 3.8 1.7 4 4"
    ]
  },

  news: {
    color: "#F5B437",
    paths: [
      "M5 4h12v16H5V4Zm12 3h2v11a2 2 0 0 1-2 2",
      "M8 8h6M8 11h6M8 14h4"
    ]
  },

  utilities: {
    color: "#FFD14F",
    paths: [
      "m13 2-8 11h6l-1 9 8-12h-6l1-8Z"
    ]
  },

  more: {
    color: "#F5B33C",
    paths: [
      "M5 5h4v4H5V5Zm10 0h4v4h-4V5ZM5 15h4v4H5v-4Zm10 0h4v4h-4v-4Z"
    ]
  }
};

function CategoryIconTile({
  slug = "",
  size = 40,
}) {
  const icon = ICONS[String(slug || "").toLowerCase()] || ICONS.more;

  return (
    <span
      className="sites-category-icon-shell"
      style={{
        width: size,
        height: size,
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        width={Math.round(size * 0.56)}
        height={Math.round(size * 0.56)}
        fill="none"
        stroke={icon.color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
      >
        {(icon.paths || []).map((path, index) => (
          <path key={index} d={path} />
        ))}
      </svg>
    </span>
  );
}

export default memo(CategoryIconTile);
