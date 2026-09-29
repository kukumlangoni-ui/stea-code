export function detectUserPlatform() {
  if (typeof window === "undefined") return "unknown";
  
  // Try navigator.userAgentData first (modern Chromium)
  const nav = navigator;
  if (nav.userAgentData && nav.userAgentData.platform) {
    const plat = nav.userAgentData.platform.toLowerCase();
    if (plat.includes("android")) return "android";
    if (plat.includes("ios") || plat.includes("iphone") || plat.includes("ipad")) return "ios";
    if (plat.includes("windows")) return "windows";
    if (plat.includes("mac")) return "macos";
    if (plat.includes("linux")) return "linux";
  }

  // Fallback to userAgent
  const ua = nav.userAgent.toLowerCase();
  if (ua.includes("android")) return "android";
  if (ua.includes("ipad") || ua.includes("iphone") || ua.includes("ipod")) return "ios";
  if (ua.includes("windows") || ua.includes("win32")) return "windows";
  if (ua.includes("macintosh") || ua.includes("mac os x") || ua.includes("macintel")) return "macos";
  if (ua.includes("linux")) return "linux";

  return "unknown";
}
