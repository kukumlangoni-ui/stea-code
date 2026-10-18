export const TABS = {
  components: {
    id: "components",
    label: "Components",
    categories: [
      { id: "All", label: "All" },
      { id: "Text Animations", label: "Text Animations" },
      { id: "Animations", label: "Animations" },
      { id: "Buttons", label: "Buttons" },
      { id: "Backgrounds", label: "Backgrounds" },
      { id: "Cards", label: "Cards" },
      { id: "Heroes", label: "Heroes" },
      { id: "Navigation", label: "Navigation" },
      { id: "Forms", label: "Forms" },
      { id: "Loaders", label: "Loaders" },
      { id: "Commerce", label: "Commerce" },
      { id: "Page Transitions", label: "Page Transitions" },
      { id: "Portfolio", label: "Portfolio" },
      { id: "Components", label: "Components" },
      { id: "Toggle Switches", label: "Toggle Switches" },
      { id: "Inputs", label: "Inputs" },
      { id: "Layout", label: "Layout" },
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

// Subcategories per top-level category. Only Layout has entries — every
// other category falls through to `undefined` and shows no subcategory row.
export const SUBCATEGORIES = {
  Layout: [
    "Pricing Tables",
    "Hero Sections",
    "Feature Grids",
    "Testimonials",
    "FAQ Blocks",
    "Footers",
    "Dashboards",
  ],
};
