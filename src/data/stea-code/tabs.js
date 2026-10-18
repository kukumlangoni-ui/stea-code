export const TABS = {
  components: {
    id: "components",
    label: "Components",
    categories: [
      { id: "All", label: "All" },
      { id: "Buttons", label: "Buttons" },
      { id: "Inputs", label: "Inputs" },
      { id: "Navigation", label: "Navigation" },
      { id: "Cards", label: "Cards" },
      { id: "Overlays", label: "Overlays" },
      { id: "Feedback", label: "Feedback" },
      { id: "Text", label: "Text" },
      { id: "Layout", label: "Layout" },
      { id: "Backgrounds", label: "Backgrounds" },
    ],
  },
  kits: {
    id: "kits",
    label: "Kits",
    categories: [
      { id: "All", label: "All" },
      { id: "Apps", label: "Apps" },
      { id: "Websites", label: "Websites" },
      { id: "Games", label: "Games" },
    ],
  },
};

export const DEFAULT_TAB = "components";
export const DEFAULT_CATEGORY = "All";

// Kits-only subcategories. Components have NO subcategories — the
// subcategory row / dropdown only appears for these Kits categories.
export const SUBCATEGORIES = {
  Apps: ["Mobile Apps", "Desktop Apps"],
  Websites: [
    "Dashboards",
    "Landing Pages",
    "Portfolios",
    "E-commerce",
    "Auth Flows",
  ],
  Games: ["Arcade", "Puzzle", "Interactive"],
};
