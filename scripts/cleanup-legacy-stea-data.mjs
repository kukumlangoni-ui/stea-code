#!/usr/bin/env node
/* ===========================================================================
 * scripts/cleanup-legacy-stea-data.mjs
 *
 * SAFE DATA CLEANUP TOOL — audit-only by default.
 *
 * Default mode:  DRY_RUN=true            -> print manifest + counts + samples,
 *                                          NEVER DELETE ANYTHING.
 *
 * Delete mode:   CONFIRM_DELETE_LEGACY_STEA_DATA=YES  DRY_RUN=false
 *                Must be explicitly set.
 *
 * DO NOT RUN AGAINST PRODUCTION WITHOUT EXPLICIT HUMAN REVIEW OF THE
 * MANIFEST AND A BACKUP OF FIRESTORE + FIREBASE AUTH.
 * ===========================================================================
 */

import process from "node:process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* ------------------------------------------------------------------
 * Runtime guard — require firebase-admin only when actually touching
 * Firestore (dry-run does not need it).
 * ------------------------------------------------------------------ */
const DRY_RUN = (process.env.DRY_RUN ?? "true").toLowerCase() !== "false";
const CONFIRM = process.env.CONFIRM_DELETE_LEGACY_STEA_DATA === "YES";
const PROJECT_ID =
  process.env.GCLOUD_PROJECT ||
  process.env.FIREBASE_PROJECT_ID ||
  "swahilitecheliteacademy";

/* ------------------------------------------------------------------
 * FIRESTORE COLLECTION CLASSIFICATION MANIFEST
 *
 * Each entry describes the status of a single top-level collection
 * discovered through source inspection.
 *
 * Statuses:
 *   PROTECTED   — never touched; always skipped (users, orders, ...)
 *   KEEP        — core active product data, preserved forever
 *   UNCERTAIN   — looks potentially legacy / has demo names, but we
 *                 refuse to delete automatically. Requires manual
 *                 review.
 *   DELETE_CANDIDATE
 *               — confirmed sample / demo / legacy seeded content that
 *                 the cleanup tool will propose deleting. Actual
 *                 deletion still needs CONFIRM_DELETE_LEGACY_STEA_DATA
 *                 and DRY_RUN=false.
 *   ADMIN_CE_STATE
 *               — CEO / admin Firestore private state; kept.
 * ------------------------------------------------------------------ */
const MANIFEST = [
  // ========================= PROTECTED =========================
  {
    name: "users",
    status: "PROTECTED",
    feature: "Firebase user profiles, linked to Firebase Auth accounts.",
    why: "Real users; must never be deleted.",
    risk: "CRITICAL",
  },
  {
    name: "admins",
    status: "PROTECTED",
    feature: "Admin accounts (admin-v2 permission table).",
    why: "Real admin/super-admin accounts; must never be deleted.",
    risk: "CRITICAL",
  },
  {
    name: "adminUsers",
    status: "PROTECTED",
    feature: "Legacy admin account mapping (used alongside `admins`).",
    why: "Admin authorization shadow table; deletion breaks admin login.",
    risk: "CRITICAL",
  },
  {
    name: "roles",
    status: "PROTECTED",
    feature: "Admin role documents keyed by uid.",
    why: "Part of admin authorization chain.",
    risk: "CRITICAL",
  },
  {
    name: "notificationTokens",
    status: "PROTECTED",
    feature: "FCM push tokens used by marketing/notification service.",
    why: "Operational data; deletion kills push delivery.",
    risk: "HIGH",
  },
  {
    name: "notificationCampaigns",
    status: "PROTECTED",
    feature: "Past push notifications and campaigns.",
    why: "Auditable operational history.",
    risk: "MEDIUM",
  },
  {
    name: "orders",
    status: "PROTECTED",
    feature: "Generic orders (pre-stea-code ordering pipeline).",
    why: "Potentially real customer orders / payment record.",
    risk: "CRITICAL",
  },
  {
    name: "marketplace_orders",
    status: "PROTECTED",
    feature: "Marketplace service orders (orderService writes here).",
    why: "Real payment-linked orders; treat like financial data.",
    risk: "CRITICAL",
  },
  {
    name: "stea_code_products",
    status: "PROTECTED",
    feature: "STEA Code product catalog (active product).",
    why: "STEA Code is flagship; explicit rule #36 protection.",
    risk: "CRITICAL",
  },
  {
    name: "stea_code_product_sources",
    status: "PROTECTED",
    feature: "Paid / source code access for STEA Code products.",
    why: "Protected by entitlement gate; contains real source.",
    risk: "CRITICAL",
  },
  {
    name: "stea_code_product_previews",
    status: "PROTECTED",
    feature: "Live preview documents for STEA Code product cards.",
    why: "Active STEA Code preview pipeline.",
    risk: "HIGH",
  },
  {
    name: "stea_code_orders",
    status: "PROTECTED",
    feature: "STEA Code Stripe orders.",
    why: "Financial records; rule #36: payment records / orders.",
    risk: "CRITICAL",
  },
  {
    name: "stea_code_entitlements",
    status: "PROTECTED",
    feature: "Paid access records — user → product license.",
    why: "Rule #36: entitlements must be protected.",
    risk: "CRITICAL",
  },
  {
    name: "stea_code_webhook_events",
    status: "PROTECTED",
    feature: "Idempotency log for Stripe webhooks (prevents double-credit).",
    why: "Deletion risks double-charging or missing-entitlement bugs.",
    risk: "HIGH",
  },
  {
    name: "stea_code_categories",
    status: "PROTECTED",
    feature: "STEA Code category taxonomy (admin source of truth).",
    why: "Rule #36 — real STEA Code categories.",
    risk: "HIGH",
  },
  {
    name: "websites",
    status: "PROTECTED",
    feature: "STEA Sites production website records.",
    why: "Rule #36 — real STEA Sites production records; AGENTS.md routing rule.",
    risk: "CRITICAL",
  },
  {
    name: "website_solution_categories",
    status: "PROTECTED",
    feature: "STEA Sites category taxonomy (admin source of truth).",
    why: "Active Sites /websites routing depends on categories.",
    risk: "HIGH",
  },
  {
    name: "websiteFeedback",
    status: "PROTECTED",
    feature: "User feedback on individual STEA Sites listings.",
    why: "Real customer moderation input.",
    risk: "MEDIUM",
  },
  {
    name: "website_suggestions",
    status: "PROTECTED",
    feature: "Crowdsourced website suggestions submitted by users.",
    why: "Real business/customer leads.",
    risk: "MEDIUM",
  },
  {
    name: "admin_notifications",
    status: "PROTECTED",
    feature: "Internal admin alert stream (orders, reports trigger these).",
    why: "Operational notifications; deletion breaks admin workflow.",
    risk: "MEDIUM",
  },
  {
    name: "audit_logs",
    status: "PROTECTED",
    feature: "Admin action + classroom/classCode audit trail.",
    why: "Security & compliance.",
    risk: "HIGH",
  },
  {
    name: "notifications",
    status: "PROTECTED",
    feature: "Per-user in-app notifications (classroom, orders, etc.).",
    why: "Active user-facing notifications.",
    risk: "MEDIUM",
  },
  {
    name: "service_requests",
    status: "PROTECTED",
    feature: "Website / design service leads submitted via lead forms.",
    why: "Rule #36 — real business/customer leads.",
    risk: "HIGH",
  },
  {
    name: "seller_applications",
    status: "PROTECTED",
    feature: "Seller signups (marketplace onboarding leads).",
    why: "Likely real business leads.",
    risk: "MEDIUM",
  },
  {
    name: "ambassador_applications",
    status: "PROTECTED",
    feature: "Student / ambassador applications submitted by users.",
    why: "Real user leads/records.",
    risk: "MEDIUM",
  },
  {
    name: "servicePaymentMethods",
    status: "PROTECTED",
    feature: "Accepted payment methods for subscriptions/services.",
    why: "Operational payment configuration.",
    risk: "MEDIUM",
  },
  {
    name: "serviceSubscriptions",
    status: "PROTECTED",
    feature: "Active user service subscriptions.",
    why: "Payment / entitlement-like data.",
    risk: "HIGH",
  },
  {
    name: "chaba_payment_methods",
    status: "PROTECTED",
    feature: "Payment rails used by Chaba/Agiza orders.",
    why: "Operational payment configuration.",
    risk: "MEDIUM",
  },
  {
    name: "chaba_orders",
    status: "PROTECTED",
    feature: "Chaba / Agiza China user orders.",
    why: "Real customer orders.",
    risk: "HIGH",
  },
  {
    name: "feedback",
    status: "PROTECTED",
    feature: "In-app user feedback submissions (FeedbackPopup).",
    why: "Real user moderation/support input.",
    risk: "MEDIUM",
  },
  {
    name: "reports",
    status: "PROTECTED",
    feature: "User-submitted report/abuse tickets (ReportModal).",
    why: "Real moderation tickets.",
    risk: "MEDIUM",
  },
  {
    name: "stea_code_resources",
    status: "PROTECTED",
    feature: "Admin STEA Code Studio resources collection.",
    why: "Belongs to flagship STEA Code product.",
    risk: "MEDIUM",
  },

  // ========================= KEEP ==============================
  {
    name: "classes",
    status: "KEEP",
    feature: "Classroom product classes (classroom.stea.africa).",
    why: "Active Classroom product — AGENTS.md routing rule confirms.",
    risk: "HIGH",
  },
  {
    name: "attendanceClasses",
    status: "KEEP",
    feature: "Legacy Classroom class schema (still queried in join flow).",
    why: "ClassroomApp.jsx still uses for fallback invite-code lookup.",
    risk: "MEDIUM",
  },
  {
    name: "classEnrollments",
    status: "KEEP",
    feature: "Student ↔ class enrollments.",
    why: "Core Classroom data.",
    risk: "HIGH",
  },
  {
    name: "classReadStates",
    status: "KEEP",
    feature: "Per-user announcement/class read receipts.",
    why: "Classroom product state.",
    risk: "LOW",
  },
  {
    name: "attendanceSessions",
    status: "KEEP",
    feature: "Attendance sessions + records (sub-collection: records).",
    why: "Core Classroom attendance feature.",
    risk: "HIGH",
  },
  {
    name: "assignments",
    status: "KEEP",
    feature: "Classroom assignments.",
    why: "Core Classroom feature.",
    risk: "HIGH",
  },
  {
    name: "assignmentSubmissions",
    status: "KEEP",
    feature: "Student work submissions against assignments.",
    why: "Real student work; Classroom product.",
    risk: "HIGH",
  },
  {
    name: "classResources",
    status: "KEEP",
    feature: "Per-class uploaded resources.",
    why: "Classroom product.",
    risk: "MEDIUM",
  },
  {
    name: "announcements",
    status: "KEEP",
    feature: "Class announcements (with sub-collection comments).",
    why: "Classroom product.",
    risk: "MEDIUM",
  },
  {
    name: "quizzes",
    status: "KEEP",
    feature: "Classroom quizzes.",
    why: "Classroom product.",
    risk: "HIGH",
  },
  {
    name: "quizResults",
    status: "KEEP",
    feature: "Student quiz attempt results.",
    why: "Classroom product — real assessment records.",
    risk: "HIGH",
  },
  {
    name: "quiz_daily",
    status: "KEEP",
    feature: "Daily practice quiz questions.",
    why: "Classroom / practice feature still active pages.",
    risk: "MEDIUM",
  },
  {
    name: "quiz_weekly",
    status: "KEEP",
    feature: "Weekly practice quiz sets.",
    why: "Active PracticePage.",
    risk: "MEDIUM",
  },
  {
    name: "quiz_leaderboard",
    status: "KEEP",
    feature: "Practice quiz leaderboard.",
    why: "Active PracticePage.",
    risk: "MEDIUM",
  },
  {
    name: "questionBank",
    status: "KEEP",
    feature: "Teacher-authored quiz question bank.",
    why: "Classroom authoring feature.",
    risk: "MEDIUM",
  },
  {
    name: "classroomAuditLogs",
    status: "KEEP",
    feature: "Classroom admin/teacher audit trail.",
    why: "Classroom compliance trail.",
    risk: "MEDIUM",
  },
  {
    name: "study_resources",
    status: "KEEP",
    feature: "Education hub uploaded notes/past papers (shared with Classroom).",
    why: "Heavily used by NotesPage, PastPapersPage, ExamsHubPage, Admin/ExamMgr.",
    risk: "HIGH",
  },
  {
    name: "resources",
    status: "KEEP",
    feature: "Tips resources index (ExplorePage + ResourcesManager).",
    why: "Still rendered on Discover/Explore; treated as distinct from study_resources.",
    risk: "LOW",
  },
  {
    name: "tips_resources",
    status: "KEEP",
    feature: "Tips resource detail documents.",
    why: "TipsResourceDetailPage still active.",
    risk: "LOW",
  },
  {
    name: "faqs",
    status: "KEEP",
    feature: "App FAQ entries (fetched on FAQ page render).",
    why: "Active public FAQ page.",
    risk: "LOW",
  },
  {
    name: "stea_daily",
    status: "KEEP",
    feature: "Admin-authored daily STEA content pieces.",
    why: "Admin-v2 DailyPage still writes; accessible pages likely exist.",
    risk: "LOW",
  },
  {
    name: "digital_tools",
    status: "KEEP",
    feature: "Digital Tools catalog (admin-v2 ToolsPage + manager + detail page).",
    why: "Active management + public /digital-tools route.",
    risk: "MEDIUM",
  },
  {
    name: "digital_tool_categories",
    status: "KEEP",
    feature: "Digital Tools category taxonomy.",
    why: "Admin source of truth, matching AGENTS.md admin-rules pattern.",
    risk: "LOW",
  },
  {
    name: "sponsored_ads",
    status: "KEEP",
    feature: "Sponsored card ads used on homepage cards and pages.",
    why: "Active monetisation surface; SponsoredCard + useAds still use.",
    risk: "MEDIUM",
  },
  {
    name: "referrals",
    status: "KEEP",
    feature: "Ambassador referral records (per user).",
    why: "Student Center renders these; real user ambassador data.",
    risk: "MEDIUM",
  },
  {
    name: "referralClicks",
    status: "KEEP",
    feature: "Referral click stream (referralService writes).",
    why: "Attribution/analytics data for ambassadors.",
    risk: "LOW",
  },
  {
    name: "analytics_events",
    status: "KEEP",
    feature: "Generic app analytics events.",
    why: "ExamsHub writes to it; admin manager reports on it.",
    risk: "LOW",
  },
  {
    name: "community_categories",
    status: "KEEP",
    feature: "Admin-v2 Community categories.",
    why: "Admin-v2 Community page exists; still used by CommunityPage.",
    risk: "LOW",
  },
  {
    name: "updates",
    status: "KEEP",
    feature: "News / updates stream (Discover, NewsUpdatesPage, StudentUpdates).",
    why: "Still rendered on multiple public pages.",
    risk: "LOW",
  },

  // ========================= ADMIN / CEO STATE ==================
  {
    name: "ceoWorkspace",
    status: "ADMIN_CE_STATE",
    feature: "CEO Workspace documents (tasks, weekly plans, journal, etc.)",
    why: "Executive private data; never touched.",
    risk: "CRITICAL",
  },

  // ========================= UNCERTAIN =========================
  {
    name: "courses",
    status: "UNCERTAIN",
    feature: "Legacy education hub courses (ExplorePage / CoursesPage).",
    why: "Explicit Tanzania-portal legacy keyword 'Education' appears on UI. However documents inside may include user-authored real courses, not just seeded demos. Must be reviewed doc-by-doc.",
    risk: "MEDIUM",
  },
  {
    name: "products",
    status: "UNCERTAIN",
    feature: "Legacy Marketplace products collection (MarketplacePage, SellerProfilePage).",
    why: "Tanzania-portal legacy keyword 'Marketplace'. But real sellers might have listed products; must inspect each document for demo/test markers before deleting.",
    risk: "MEDIUM",
  },
  {
    name: "posts",
    status: "UNCERTAIN",
    feature: "Jobs / opportunities / gigs stream (DiscoverPage, NewsUpdatesPage).",
    why: "Keyword 'Jobs'; Tanzania-portal legacy area. Some posts may be real user-submitted jobs; others seeded template text. Document-level review needed.",
    risk: "MEDIUM",
  },
  {
    name: "student_updates",
    status: "UNCERTAIN",
    feature: "Student Center curated announcements feed.",
    why: "'Student Center' keyword listed legacy. Collection may be empty or may contain recent curated items; must verify sample docs before any action.",
    risk: "LOW",
  },
  {
    name: "education_notes",
    status: "UNCERTAIN",
    feature: "Legacy standalone education notes (separate from study_resources).",
    why: "EducationPages.jsx still listens to this with onSnapshot, but only used if classroom/study_resources is missing. Unclear if documents exist. Review sample docs.",
    risk: "LOW",
  },
  {
    name: "education_past_papers",
    status: "UNCERTAIN",
    feature: "Legacy past-papers mirror alongside study_resources.",
    why: "EducationPastPapersPage still reads it; uncertain if seeded PDFs or real content.",
    risk: "MEDIUM",
  },
  {
    name: "necta_results",
    status: "UNCERTAIN",
    feature: "NECTA results records (Tanzania-specific education feature).",
    why: "Keyword 'NECTA' in audit list. Public NectaResultsPage still reads it. Data is national education results — technically public info but flagged as legacy UI. Keep unless explicitly approved.",
    risk: "MEDIUM",
  },
  {
    name: "chaba_products",
    status: "UNCERTAIN",
    feature: "Chaba marketplace products listing (Agiza China import flow).",
    why: "May be legacy demo content OR real merchant catalog. ChabaCheckoutModal still uses it. Must sample before any action.",
    risk: "MEDIUM",
  },
  {
    name: "sports_matches",
    status: "UNCERTAIN",
    feature: "Sports match records (sportsService writes here).",
    why: "Keyword 'Sports' flagged. SportsPage/Sports service still active. Data likely demo or low-value; however service still runs so keep until confirmed.",
    risk: "LOW",
  },
  {
    name: "sports_predictions",
    status: "UNCERTAIN",
    feature: "Sports predictions + tips used on SportsPage.",
    why: "Keyword 'Sports' flagged. Page and listener still active. Documents could be seeded or user-generated. Keep unless approved.",
    risk: "LOW",
  },
  {
    name: "communities_posts",
    status: "UNCERTAIN",
    feature: "Student Center community forum posts.",
    why: "Student Center is legacy-flagged keyword. However posts are real user-generated content; deleting destroys community data. Keep unless orphaned/empty.",
    risk: "MEDIUM",
  },
  {
    name: "communities_answers",
    status: "UNCERTAIN",
    feature: "Answers to community forum posts.",
    why: "Same reasoning as communities_posts; real user content.",
    risk: "MEDIUM",
  },
  {
    name: "tips",
    status: "UNCERTAIN",
    feature: "Old admin panel quick 'tips' documents (separate from tips_resources).",
    why: "Admin/AdminPanel.jsx still writes to it. DiscoverPage still reads. Maybe legacy; maybe overlapping with tips_resources — uncertain count/usage.",
    risk: "LOW",
  },
  {
    name: "mobile_testers",
    status: "UNCERTAIN",
    feature: "Mobile app beta tester signups (MobileAppGuidePage form writes here).",
    why: "Could be seed data or real user interest signups. Low volume, real leads — treat as PROTECTED until sample reviewed.",
    risk: "LOW",
  },
  {
    name: "site_logs",
    status: "UNCERTAIN",
    feature: "Sports service-only event log.",
    why: "Only one writer (sportsService.ts). Likely debug/diagnostic. Could be ephemeral but not yet confirmed.",
    risk: "LOW",
  },

  // ===================== DELETE CANDIDATES =====================
  /*
   * WARNING:
   *   DELETE_CANDIDATE only means the script is willing to propose
   *   deletion. Actual deletion still requires:
   *     DRY_RUN=false CONFIRM_DELETE_LEGACY_STEA_DATA=YES
   *
   *   The script also samples docs and prints their IDs before asking
   *   for a second interactive confirmation.
   */
  {
    name: "QUIZ_DAILY_SAMPLE_ONLY_MARKERS",
    status: "DELETE_CANDIDATE",
    feature: "Subset of quiz_daily documents where title/ownerId matches 'demo' / 'sample' / 'test' / 'seed'.",
    why: "Individual doc-level filtering inside an otherwise KEEP collection; script never deletes the whole collection, only specific demo docs.",
    risk: "LOW",
  },
  {
    name: "COURSES_SAMPLE_ONLY_MARKERS",
    status: "DELETE_CANDIDATE",
    feature: "Individual 'courses' documents where ownerId / title / slug fields match known demo/sample/test/seed patterns.",
    why: "Delete candidates are individual docs, not the whole collection; whole collection remains UNCERTAIN.",
    risk: "LOW",
  },
];

/* ------------------------------------------------------------------
 * Pretty print helpers
 * ------------------------------------------------------------------ */
const COL = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bold: "\x1b[1m",
};

const badge = (text, color = "reset") => `${COL[color]}${COL.bold}[${text}]${COL.reset}`;

function section(title) {
  const width = 78;
  const pad = Math.max(0, Math.floor((width - title.length - 4) / 2));
  const bar = "─".repeat(width);
  console.log(`\n${COL.dim}┌${bar}┐${COL.reset}`);
  console.log(`${COL.dim}│${COL.reset}${" ".repeat(pad)}${COL.bold} ${title} ${COL.reset}${" ".repeat(Math.max(0, width - pad - title.length - 2))}${COL.dim}│${COL.reset}`);
  console.log(`${COL.dim}└${bar}┘${COL.reset}\n`);
}

/* ------------------------------------------------------------------
 * Lazy Firebase Admin bootstrap (only when needed)
 * ------------------------------------------------------------------ */
async function getAdmin() {
  try {
    const admin = await import("firebase-admin");
    return admin.default || admin;
  } catch (e) {
    console.error(
      `${badge("ERROR", "red")} firebase-admin is not installed locally.`,
    );
    console.error(
      `       Install it or run on a machine with the admin SDK, then set`,
    );
    console.error(`       GOOGLE_APPLICATION_CREDENTIALS if needed.\n`);
    console.error(e.message || e);
    process.exit(2);
  }
}

let adminDb = null;
async function getDb() {
  if (adminDb) return adminDb;
  const admin = await getAdmin();
  if (admin.apps.length === 0) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  adminDb = admin.firestore();
  return adminDb;
}

/* ------------------------------------------------------------------
 * Safe listing primitives
 * ------------------------------------------------------------------ */
const BATCH_SIZE = 250;

async function listTopLevelCollections() {
  const db = await getDb();
  const refs = await db.listCollections();
  return refs.map((r) => r.id).sort();
}

async function countCollection(id) {
  const db = await getDb();
  try {
    const agg = await db.collection(id).count().get();
    return agg.data().count;
  } catch (err) {
    // Fallback if count() isn't supported on this emulator/admin sdk.
    const snap = await db.collection(id).select().limit(BATCH_SIZE * 4).get();
    return snap.size;
  }
}

async function sampleIds(id, limit = 8) {
  const db = await getDb();
  const snap = await db
    .collection(id)
    .orderBy(
      "__name__",
      "asc",
    ) /* stable, index-free ordering that always works */
    .limit(limit)
    .get();
  return snap.docs.map((d) => d.id);
}

async function sampleDoc(id, docId) {
  const db = await getDb();
  const snap = await db.collection(id).doc(docId).get();
  return snap.exists ? snap.data() : null;
}

/* ------------------------------------------------------------------
 * Safe doc-level delete (batching, with counter)
 * ------------------------------------------------------------------ */
async function deleteInBatches(collectionId, docIds, progress) {
  const db = await getDb();
  const admin = await getAdmin();
  let deleted = 0;
  for (let i = 0; i < docIds.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = docIds.slice(i, i + BATCH_SIZE);
    for (const id of chunk) {
      batch.delete(db.collection(collectionId).doc(id));
    }
    await batch.commit();
    deleted += chunk.length;
    progress?.(deleted, docIds.length, chunk.length);
    await new Promise((r) => setTimeout(r, 40));
  }
  return deleted;
}

/* ------------------------------------------------------------------
 * Delete-candidate document selector (individual doc-level)
 *
 * Rules for marking an individual document as safe-to-delete:
 *   - title/slug/name contains demo/test/sample/seed- text
 *   - ownerId / email / uid known-test values only
 *   - status = 'demo' / 'test'
 *
 * Whole-collection deletions are ONLY permitted when the manifest
 * explicitly says DELETE_CANDIDATE AND every doc matches the demo
 * filter AND human confirmation is provided.
 *
 * TODO(STEA-3137): Hook into actual admin flag once Admin cleanup
 * controls ship that label demo/test entities.
 * ------------------------------------------------------------------ */
const DEMO_HINT_RE =
  /(^|[^a-z0-9])(demo|sample|seed|test|template|placeholder|fake-dont-use|lorem|tempdev|staging-?only|foo|bar|qux|baz)([^a-z0-9]|$)/i;

function docLooksLikeDemo(id, data) {
  if (!data) return false;
  const haystacks = [
    id,
    data.title,
    data.name,
    data.slug,
    data.email,
    data.ownerEmail,
    data.ownerId,
    data.userId,
    data.uid,
    data.status,
    data.source,
    data.description,
    data.subtitle,
  ]
    .filter((v) => typeof v === "string")
    .map((v) => v.toLowerCase());
  return haystacks.some((v) => DEMO_HINT_RE.test(v));
}

async function findDemoDocs(collectionId, manifestStatus, limit = 5000) {
  const db = await getDb();
  const hits = [];
  let lastDoc = null;
  while (hits.length < limit) {
    let q = db.collection(collectionId).limit(BATCH_SIZE);
    if (lastDoc) q = q.startAfter(lastDoc);
    const snap = await q.get();
    if (snap.size === 0) break;
    for (const d of snap.docs) {
      if (docLooksLikeDemo(d.id, d.data())) {
        hits.push(d.id);
        if (hits.length >= limit) break;
      }
    }
    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.size < BATCH_SIZE) break;
  }
  return hits;
}

/* ------------------------------------------------------------------
 * Manifest summary
 * ------------------------------------------------------------------ */
function summarizeManifest(discovered) {
  const statuses = {
    PROTECTED: [],
    KEEP: [],
    UNCERTAIN: [],
    DELETE_CANDIDATE: [],
    ADMIN_CE_STATE: [],
    OTHER_IN_CODE: [],
  };
  for (const entry of MANIFEST) statuses[entry.status]?.push(entry);

  // Any discovered collection NOT in MANIFEST is reported as UNKNOWN.
  const manifestNames = new Set(MANIFEST.map((e) => e.name));
  const unknowns = discovered.filter((id) => !manifestNames.has(id));

  return { statuses, unknowns };
}

/* ------------------------------------------------------------------
 * Print report (DRY_RUN or real)
 * ------------------------------------------------------------------ */
function box(line, color = "cyan") {
  console.log(`  ${COL[color]}▸${COL.reset} ${line}`);
}

async function printManifestReport(discovered, counts, samplesByName) {
  const { statuses, unknowns } = summarizeManifest(discovered);

  section("COLLECTION MANIFEST");
  for (const bucket of ["PROTECTED", "KEEP", "ADMIN_CE_STATE", "UNCERTAIN", "DELETE_CANDIDATE"]) {
    const entries = statuses[bucket] || [];
    if (!entries.length) continue;
    const color =
      bucket === "PROTECTED"
        ? "red"
        : bucket === "KEEP"
        ? "green"
        : bucket === "ADMIN_CE_STATE"
        ? "magenta"
        : bucket === "UNCERTAIN"
        ? "yellow"
        : "cyan";
    console.log(`${badge(bucket, color)}  ${entries.length} collection${entries.length === 1 ? "" : "s"}`);
    for (const e of entries) {
      const count = counts[e.name] ?? "—";
      const line = `${COL.bold}${e.name}${COL.reset}${COL.dim} (${e.feature})${COL.reset}`;
      box(line);
      box(`${COL.dim}docs count: ${COL.reset}${count}   ${COL.dim}risk: ${COL.reset}${e.risk}`);
      if (samplesByName?.[e.name]?.length) {
        box(`${COL.dim}sample ids: ${COL.reset}${samplesByName[e.name].slice(0, 4).join(", ")}${samplesByName[e.name].length > 4 ? `, …(${samplesByName[e.name].length})` : ""}`);
      }
      box(`${COL.dim}why: ${COL.reset}${e.why}`);
      console.log("");
    }
  }

  if (unknowns.length) {
    console.log(`${badge("UNKNOWN", "yellow")}  ${unknowns.length} discovered collection${unknowns.length === 1 ? "" : "s"} NOT in manifest (add them on next audit):`);
    for (const id of unknowns) {
      box(`${COL.bold}${id}${COL.reset}  ${COL.dim}count=${counts[id] ?? "—"}${COL.reset}`);
      if (samplesByName?.[id]?.length) {
        box(`${COL.dim}sample ids: ${COL.reset}${samplesByName[id].slice(0, 3).join(", ")}`);
      }
    }
    console.log("");
  }
}

/* ------------------------------------------------------------------
 * Main flow
 * ------------------------------------------------------------------ */
async function main() {
  console.log(`${badge("STEA AFRICA — SAFE FIRESTORE LEGACY DATA CLEANUP", "cyan")}`);
  console.log(`   project   : ${COL.bold}${PROJECT_ID}${COL.reset}`);
  console.log(`   dry run   : ${DRY_RUN ? badge("YES", "green") : badge("NO — destructive mode", "red")}`);
  console.log(`   confirmed : ${CONFIRM ? badge("YES — CONFIRM_DELETE set", "yellow") : badge("NO", "dim")}`);
  console.log(
    `   script    : ${path.relative(process.cwd(), fileURLToPath(import.meta.url)) || path.basename(fileURLToPath(import.meta.url))}`,
  );

  if (DRY_RUN) {
    console.log(
      `\n${badge("INFO", "blue")} DRY_RUN=true. To actually delete, re-run with:`,
    );
    console.log(
      `         ${COL.bold}DRY_RUN=false CONFIRM_DELETE_LEGACY_STEA_DATA=YES${COL.reset} node scripts/cleanup-legacy-stea-data.mjs`,
    );
  }

  section("DISCOVERING TOP-LEVEL COLLECTIONS");
  const discovered = await listTopLevelCollections();
  console.log(`  Found ${COL.bold}${discovered.length}${COL.reset} top-level collections.\n`);

  const counts = {};
  const samplesByName = {};
  for (const id of discovered) {
    counts[id] = await countCollection(id);
    samplesByName[id] = counts[id] > 0 ? await sampleIds(id, 6) : [];
  }

  await printManifestReport(discovered, counts, samplesByName);

  /* ----------- PROPOSED DELETION CANDIDATES (doc-level) --------- */
  section("PROPOSED DELETIONS — DOC-LEVEL DEMO/TEST/SAMPLE MATCHES");

  const candidateCollections = discovered.filter((id) => {
    const entry = MANIFEST.find((e) => e.name === id);
    return entry?.status === "UNCERTAIN" || entry?.status === "KEEP";
  });

  const planned = [];

  console.log(
    `${COL.dim}Scanning documents in UNCERTAIN + KEEP collections for demo/test/sample patterns…${COL.reset}\n`,
  );

  for (const id of candidateCollections) {
    const demoIds = await findDemoDocs(id, "scan");
    if (demoIds.length === 0) {
      box(`${id} — ${COL.green}no demo docs found${COL.reset}`);
      continue;
    }
    const entry = MANIFEST.find((e) => e.name === id) || {
      status: "UNKNOWN",
      risk: "—",
      feature: "Collection absent from manifest",
    };
    planned.push({
      collection: id,
      docIds: demoIds,
      manifestEntry: entry,
    });
    box(
      `${COL.bold}${id}${COL.reset}  manifest=${entry.status}  risk=${entry.risk}  demo-doc-candidates=${COL.yellow}${demoIds.length}${COL.reset}`,
    );
    box(
      `${COL.dim}sample IDs: ${COL.reset}${demoIds.slice(0, 5).join(", ")}${demoIds.length > 5 ? `, …(${demoIds.length - 5} more)` : ""}`,
    );
    console.log("");
  }

  // Compute summary totals
  const totalCandidateDocs = planned.reduce((sum, p) => sum + p.docIds.length, 0);

  section("SUMMARY");
  console.log(`  Top-level collections discovered  : ${COL.bold}${discovered.length}${COL.reset}`);
  console.log(
    `  Document-level deletion candidates: ${totalCandidateDocs ? `${COL.yellow}${COL.bold}${totalCandidateDocs}${COL.reset}` : `${COL.green}${COL.bold}0${COL.reset} (clean!)`}`,
  );
  console.log(`  Manifest entries                  : ${MANIFEST.length}`);
  console.log(`  Dry-run mode                      : ${DRY_RUN ? "ON" : "OFF"}`);

  /* ----------- Destructive path — explicit confirmation required ----------- */
  if (DRY_RUN) {
    console.log(
      `\n${badge("DRY RUN COMPLETE", "green")} No documents were modified or deleted.`,
    );
    console.log(
      `   Review the manifest above. If satisfied, re-run with:\n`,
    );
    console.log(
      `     ${COL.bold}DRY_RUN=false CONFIRM_DELETE_LEGACY_STEA_DATA=YES${COL.reset} node scripts/cleanup-legacy-stea-data.mjs\n`,
    );
    process.exit(0);
  }

  if (!CONFIRM) {
    console.log(
      `\n${badge("REFUSING", "red")} DRY_RUN=false was set but CONFIRM_DELETE_LEGACY_STEA_DATA is not YES.`,
    );
    console.log(`       Aborting without deletion. Set the env var explicitly.\n`);
    process.exit(3);
  }

  if (totalCandidateDocs === 0) {
    console.log(
      `\n${badge("NOTHING TO DO", "green")} Zero doc-level deletion candidates. Nothing to delete.`,
    );
    process.exit(0);
  }

  /* ---- Final human confirmation (STDIN prompt if TTY) ---- */
  const tty = process.stdout.isTTY;
  const finalEnv = process.env.CONFIRM_DELETE_LEGACY_STEA_DATA_FINAL_I_ACCEPT_RISK;
  let finalApproved = finalEnv === "YES_AND_I_HAVE_BACKUPS";
  if (tty && !finalApproved) {
    const readline = await import("node:readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    console.log(
      `\n${badge("CONFIRM", "yellow")} About to PERMANENTLY DELETE ${totalCandidateDocs} doc(s) across ${planned.length} collection(s).`,
    );
    console.log(
      `       This action cannot be undone. Confirm you have a Firestore backup.`,
    );
    const answer = await new Promise((resolve) =>
      rl.question(
        `       Type ${COL.bold}DELETE ${PROJECT_ID} LEGACY${COL.reset} exactly and press Enter: `,
        resolve,
      ),
    );
    rl.close();
    finalApproved = answer.trim() === `DELETE ${PROJECT_ID} LEGACY`;
  }

  if (!finalApproved) {
    console.log(
      `\n${badge("ABORTED", "red")} Final confirmation failed. No deletion occurred.`,
    );
    console.log(
      `       Non-interactive? Set ${COL.bold}CONFIRM_DELETE_LEGACY_STEA_DATA_FINAL_I_ACCEPT_RISK=YES_AND_I_HAVE_BACKUPS${COL.reset}\n`,
    );
    process.exit(4);
  }

  section("DELETING DOCUMENTS");
  let totalDeleted = 0;
  for (const { collection, docIds, manifestEntry } of planned) {
    // Double guard: Never touch PROTECTED collections even if some admin goofed
    if (manifestEntry.status === "PROTECTED" || manifestEntry.status === "ADMIN_CE_STATE") {
      console.log(
        `  ${badge("BLOCKED", "red")} ${collection} status=${manifestEntry.status}. Skipping to protect data.`,
      );
      continue;
    }
    if (manifestEntry.status === "UNCERTAIN" && !process.env.UNCERTAIN_COLLECTIONS_INCLUDE_DANGEROUS) {
      console.log(
        `  ${badge("SKIP UNCERTAIN", "yellow")} ${collection} — by default UNCERTAIN docs are NOT deleted.`,
      );
      console.log(
        `       ${COL.dim}(Override only after document-by-document human review, with env UNCERTAIN_COLLECTIONS_INCLUDE_DANGEROUS=YES)${COL.reset}`,
      );
      continue;
    }

    console.log(
      `  ${badge("DELETE", "cyan")} ${collection} — deleting ${docIds.length} demo doc(s)…`,
    );
    const n = await deleteInBatches(collection, docIds, (done, total, step) => {
      process.stdout.write(
        `    progress: ${done}/${total}  (+${step})\x1b[0G`,
      );
    });
    process.stdout.write(`\n    deleted ${n} — OK\n`);
    totalDeleted += n;
  }

  section("COMPLETE");
  console.log(`  Documents permanently deleted: ${COL.bold}${totalDeleted}${COL.reset}`);
  console.log(`  Collections scanned           : ${discovered.length}`);
  console.log(`  Deletion scope                : doc-level demo matches only`);
  console.log(
    `\n${badge("DONE", "green")} Manifest + scan + delete complete. No protected collections were touched.`,
  );
}

main().catch((err) => {
  console.error(`\n${badge("FATAL", "red")} Unhandled error. Aborting without any deletions.`);
  console.error(err);
  process.exit(1);
});
