export const ADMIN_V2_ROLES = ["super_admin", "admin", "manager", "editor"];

export const ADMIN_V2_NAVIGATION = [
  { label: "Dashboard", path: "/admin", icon: "LayoutDashboard", permission: "dashboard.view" },
  { label: "Users", path: "/admin/users", icon: "Users", permission: "users.view" },
  { label: "Marketing", path: "/admin/marketing", icon: "Mail", permission: "marketing.view" },
  { label: "Education", path: "/admin/education", icon: "GraduationCap", permission: "education.view" },
  { label: "Classroom", path: "/admin/classroom", icon: "School", permission: "classroom.view" },
  { label: "Websites", path: "/admin/websites", icon: "Globe", permission: "websites.view" },
  { label: "Marketplace", path: "/admin/marketplace", icon: "ShoppingBag", permission: "marketplace.view" },
  { label: "Services", path: "/admin/services", icon: "BriefcaseBusiness", permission: "services.view" },
  { label: "Notifications", path: "/admin/notifications", icon: "Bell", permission: "notifications.view" },
  { label: "Feedback", path: "/admin/feedback", icon: "MessageSquare", permission: "feedback.view" },
  { label: "Analytics", path: "/admin/analytics", icon: "ChartNoAxesCombined", permission: "analytics.view" },
  { label: "Security", path: "/admin/security", icon: "ShieldCheck", permission: "security.view" },
  { label: "Settings", path: "/admin/settings", icon: "Settings", permission: "settings.view" },
  { label: "STEA Daily", path: "/admin/daily", icon: "Calendar", permission: "daily.view" },
  { label: "Digital Tools", path: "/admin/tools", icon: "Wrench", permission: "tools.view" },
  { label: "Community", path: "/admin/community", icon: "MessageCircle", permission: "community.view" },
  { label: "Backend Inspector", path: "/admin/backend-inspector", icon: "Database", permission: "inspector.view" },
  { label: "STEA Code", path: "/code-admin", icon: "Code", permission: "code.view" },
];

const ALL_READ = ADMIN_V2_NAVIGATION.map((item) => item.permission);

export const ADMIN_V2_PERMISSION_MATRIX = {
  super_admin: ["*"],
  admin: ALL_READ,
  manager: ["dashboard.view", "education.view", "classroom.view", "marketplace.view", "services.view", "notifications.view", "feedback.view", "analytics.view", "daily.view", "tools.view", "community.view", "marketing.view"],
  editor: ["dashboard.view", "education.view", "websites.view", "notifications.view", "feedback.view", "daily.view", "tools.view", "community.view"],
};

export function getAdminV2Role(user) {
  const role = String(user?.role || "").toLowerCase();
  return ADMIN_V2_ROLES.includes(role) ? role : null;
}

export function hasAdminV2Permission(user, permission) {
  const role = getAdminV2Role(user);
  if (!role) return false;
  const permissions = ADMIN_V2_PERMISSION_MATRIX[role] || [];
  return permissions.includes("*") || permissions.includes(permission);
}
