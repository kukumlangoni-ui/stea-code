export const TABS = {
  components: {
    id: "components",
    label: "Components",
    description: "Copy-paste pieces",
    categories: [
      { id: "All", label: "All", tooltip: null },
      { id: "Buttons", label: "Buttons", tooltip: null },
      { id: "Inputs", label: "Inputs", tooltip: null },
      { id: "Toggle Switches", label: "Toggle Switches", tooltip: null },
      { id: "Feedback", label: "Feedback", tooltip: "Loaders, spinners, toasts" },
      { id: "Text", label: "Text", tooltip: "Animated text, gradients" },
      { id: "Cards", label: "Cards", tooltip: "Hover cards, profile cards, product cards" },
      { id: "Navigation", label: "Navigation", tooltip: "Navbars, tabs, breadcrumbs" },
      { id: "Overlays", label: "Overlays", tooltip: "Modals, drawers, tooltips" },
      { id: "Backgrounds", label: "Backgrounds", tooltip: "Animated gradients, particles, waves" },
    ],
  },
  layouts: {
    id: "layouts",
    label: "Layouts",
    description: "Full-page sections",
    categories: [
      { id: "All", label: "All", tooltip: null },
      { id: "Pricing Tables", label: "Pricing Tables", tooltip: null },
      { id: "Hero Sections", label: "Hero Sections", tooltip: null },
      { id: "Feature Grids", label: "Feature Grids", tooltip: null },
      { id: "Testimonials", label: "Testimonials", tooltip: null },
      { id: "FAQ Blocks", label: "FAQ Blocks", tooltip: null },
      { id: "Footers", label: "Footers", tooltip: null },
      { id: "Dashboards", label: "Dashboards", tooltip: null },
      { id: "Landing Pages", label: "Landing Pages", tooltip: null },
      { id: "E-commerce", label: "E-commerce", tooltip: null },
      { id: "Portfolios", label: "Portfolios", tooltip: null },
      { id: "Onboarding", label: "Onboarding", tooltip: null },
      { id: "Illustrations", label: "Illustrations", tooltip: null },
      { id: "Animations", label: "Animations", tooltip: null },
      { id: "Mobile Apps", label: "Mobile Apps", tooltip: null },
    ],
  },
  kits: {
    id: "kits",
    label: "Kits",
    description: "Full working products",
    categories: [
      { id: "All", label: "All", tooltip: null },
      { id: "Apps", label: "Apps", tooltip: null },
      { id: "Websites", label: "Websites", tooltip: null },
      { id: "Games", label: "Games", tooltip: null },
    ],
  },
};

export const SUBCATEGORIES = {
  // Kits only
  Apps: ["Mobile", "Desktop"],
  Websites: ["Dashboards", "Landing Pages", "Portfolios", "E-commerce", "Auth Flows"],
  Games: ["Arcade", "Puzzle", "Interactive"],
};

export const DEFAULT_TAB = "components";
export const DEFAULT_CATEGORY = "All";
