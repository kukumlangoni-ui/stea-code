/**
 * Lucide icon map for STEA categories + automatic heuristic fallback.
 *
 * Icon priority:
 *   1. Exact id match → LUCIDE_MAP[id]
 *   2. Keyword heuristic (category slug contains X → Icon)
 *   3. Final fallback: Globe2
 *
 * This module only imports the specific Lucide icons we actually use,
 * keeping bundle size small.
 */
import {
  Globe2,
  Film,
  Trophy,
  Bot,
  Music2,
  BookOpen,
  Wrench,
  Wallet,
  GraduationCap,
  Palette,
  Users,
  Newspaper,
  Zap,
  Grid3X3,
  Gamepad2,
  BookMarked,
  ShieldCheck,
  Settings2,
  PlaySquare,
  Languages,
  Briefcase,
  Code2,
  Youtube,
  Smartphone,
  Sparkles,
  GitBranch,
  Plug,
  Server,
  Database,
  Cloud,
  Rocket,
  Home,
  Layout,
  FlaskConical,
  Activity,
  MessageSquare,
  Boxes,
  FolderGit2,
  Terminal,
  Lightbulb,
} from "lucide-react";

export const LUCIDE_CATEGORY_MAP = {
  // 18 Canonical STEA main categories
  "live-sports": Trophy,
  sports: Trophy,
  "movies-tv-shows": Film,
  movies: Film,
  tv: Film,
  ebooks: BookOpen,
  books: BookOpen,
  "life-hack": Lightbulb,
  life: Lightbulb,
  "money-finance": Wallet,
  finance: Wallet,
  music: Music2,
  games: Gamepad2,
  "online-courses": GraduationCap,
  education: GraduationCap,
  learning: GraduationCap,
  comics: BookMarked,
  "graphics-design": Palette,
  design: Palette,
  "jobs-career": Briefcase,
  "asian-drama": Film,
  manga: BookMarked,
  adblockers: ShieldCheck,
  ai: Bot,
  "ai-tools": Bot,
  automation: Settings2,
  creativity: Sparkles,
  developers: Code2,
  "developer-resources": Code2,
  "developers-resources": Code2,
  programming: Code2,

  // 20 Developer Subcategories
  "vibe-coding-ai-dev": Sparkles,
  "code-editors-ides": Terminal,
  "version-control": GitBranch,
  "apis-services": Plug,
  "web-development": Globe2,
  "app-development": Smartphone,
  "backend-development": Server,
  databases: Database,
  "cloud-platforms": Cloud,
  "deployment-devops": Rocket,
  "hosting-domains": Home,
  "ui-ux-design": Layout,
  "testing-debugging": FlaskConical,
  "performance-monitoring": Activity,
  security: ShieldCheck,
  "documentation-learning": BookOpen,
  "community-qa": MessageSquare,
  "blocks-components": Boxes,
  "open-source": FolderGit2,
  "developer-news": Newspaper,

  // Secondary legacy keys
  tools: Wrench,
  utilities: Zap,
  social: Users,
  news: Newspaper,
  more: Grid3X3,
  streaming: PlaySquare,
  languages: Languages,
  videos: Youtube,
  apps: Smartphone,
};

export function getLucideCategoryIcon(slug, label) {
  const key = String(slug || label || "").trim().toLowerCase();
  if (!key) return Globe2;
  if (LUCIDE_CATEGORY_MAP[key]) return LUCIDE_CATEGORY_MAP[key];

  // Developer subcategories heuristics
  if (/vibe|copilot|ai.*dev|agent/i.test(key)) return Sparkles;
  if (/editor|ide|terminal|workspace/i.test(key)) return Terminal;
  if (/git|version|branch|repo/i.test(key)) return GitBranch;
  if (/api|endpoint|swagger|postman|rpc|graphql/i.test(key)) return Plug;
  if (/database|sql|nosql|postgres|mongo|redis/i.test(key)) return Database;
  if (/cloud|aws|gcp|azure/i.test(key)) return Cloud;
  if (/deploy|devops|docker|k8s|ci.*cd/i.test(key)) return Rocket;
  if (/host|domain|dns/i.test(key)) return Home;
  if (/ui.*ux|figma|framer|wireframe|layout/i.test(key)) return Layout;
  if (/test|debug|cypress|playwright|jest/i.test(key)) return FlaskConical;
  if (/perf|monitor|metric|sentry|uptime/i.test(key)) return Activity;
  if (/component|block|shadcn|ui.*kit/i.test(key)) return Boxes;
  if (/open.*source|oss/i.test(key)) return FolderGit2;

  // Main categories heuristics
  if (/sport|ball|game|premier|league/i.test(key)) return Trophy;
  if (/movie|tv|film|show|video|stream|series|drama/i.test(key)) return Film;
  if (/ai|tool.*ai|chatgpt|gemini|llm|artificial/i.test(key)) return Bot;
  if (/music|song|audio|radio/i.test(key)) return Music2;
  if (/book|read|ebook|manga|novel|comic/i.test(key)) return BookOpen;
  if (/tool|util|productivity|hack/i.test(key)) return Wrench;
  if (/money|finance|bank|pay|fintech|wallet|crypto/i.test(key)) return Wallet;
  if (/learn|educat|course|student|exam|teach|class/i.test(key)) return GraduationCap;
  if (/design|graphic|art|creative/i.test(key)) return Palette;
  if (/social|community|chat|forum|q.*a/i.test(key)) return MessageSquare;
  if (/news|newspaper|blog|magazine|media/i.test(key)) return Newspaper;
  if (/game|gaming|esport/i.test(key)) return Gamepad2;
  if (/vpn|ad.*block|secur|privacy|protect|shield/i.test(key)) return ShieldCheck;
  if (/program|code|develop|coding|dev/i.test(key)) return Code2;
  if (/job|work|gig|career|hustle|freelanc/i.test(key)) return Briefcase;
  if (/auto|workflow|auto.*mation/i.test(key)) return Settings2;
  if (/language|translat|learn.*lang/i.test(key)) return Languages;

  return Globe2;
}

export default LUCIDE_CATEGORY_MAP;

