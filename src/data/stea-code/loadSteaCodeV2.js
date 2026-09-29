/* ======================================================================
 * Pure adapt function + snapshot helpers.
 *
 * V2 shell loads data via the existing `useMultiCollection` hook (which
 * handles Firestore offline cache safely) and feeds the raw
 * `cmsDocs` + `legacyDocs` into `adaptIntoV2Snapshot`, which:
 *   - tags every doc with _collection for CMS adapter
 *   - merges normalized legacy for Learn world filtering
 *   - injects curated V2 fallbacks for categories still empty after CMS
 *   - returns a v2IdleSnapshot-shaped result with status + meta.
 *
 * Also exports convenience `v2IdleSnapshot()`.
 * =================================================================== */

import { adaptCMSCollections, adaptLegacyToKnowledge } from "./adaptersV2.js";
import {
  FALLBACK_PATTERNS,
  FALLBACK_RESOURCES,
  FALLBACK_KNOWLEDGE,
  FALLBACK_INSPIRATION,
} from "./v2Fallbacks.js";

export function v2IdleSnapshot() {
  return snapshot("idle");
}

export function v2LoadingSnapshot() {
  return snapshot("loading");
}

function snapshot(status, rest = {}) {
  return {
    status,
    patterns: [],
    resources: [],
    knowledge: [],
    inspiration: [],
    buildCategories: [],
    planCategories: [],
    toolsCategories: [],
    shipSections: [],
    monetizeCategories: [],
    learnTopics: [],
    learnTypes: [],
    inspireGroups: [],
    error: null,
    meta: {
      cmsPatterns: 0,
      cmsResources: 0,
      cmsInspiration: 0,
      legacyKnowledge: 0,
      fallbackPatterns: 0,
      fallbackResources: 0,
      fallbackKnowledge: 0,
      fallbackInspiration: 0,
    },
    loadedAt: 0,
    ...rest,
  };
}

function normalizeLegacyDoc(doc) {
  const type = String(doc.type || doc.fileType || doc.category || "").toLowerCase();
  const url = doc.link || doc.url || doc.mediaUrl || doc.downloadUrl || doc.fileUrl || doc.pdfUrl || "";
  return {
    ...doc,
    title: doc.title || doc.name || "Untitled resource",
    description: doc.description || doc.body || "",
    category: doc.categoryName || doc.category || doc.type || "",
    url,
    type: doc.type || "",
  };
}

/**
 * @param {Array} cmsDocs raw docs from CODE_COLLECTIONS useMultiCollection
 * @param {Array} legacyDocs raw docs from LEGACY_COLLECTIONS useMultiCollection
 * @param {"loading"|"ready"|"error"} status
 * @param {any} [error] optional error payload
 */
export function adaptIntoV2Snapshot(cmsDocs = [], legacyDocs = [], status = "ready", error = null) {
  try {
    const cms = adaptCMSCollections(cmsDocs);
    const legacyNormalized = (legacyDocs || []).map(normalizeLegacyDoc);
    const legacyKnowledge = adaptLegacyToKnowledge(legacyNormalized);

    const existingP = new Set(cms.patterns.map((p) => String(p.id)));
    const existingR = new Set(cms.resources.map((r) => String(r.id)));
    const existingK = new Set(legacyKnowledge.map((k) => String(k.id)));
    const existingI = new Set(cms.inspiration.map((i) => String(i.id)));

    const patterns = [
      ...cms.patterns,
      ...FALLBACK_PATTERNS.filter((p) => !existingP.has(String(p.id))),
    ];
    const resources = [
      ...cms.resources,
      ...FALLBACK_RESOURCES.filter((r) => !existingR.has(String(r.id))),
    ];
    const knowledge = [
      ...legacyKnowledge,
      ...FALLBACK_KNOWLEDGE.filter((k) => !existingK.has(String(k.id))),
    ];
    const inspiration = [
      ...cms.inspiration,
      ...FALLBACK_INSPIRATION.filter((i) => !existingI.has(String(i.id))),
    ];

    const buildCategories = Array.from(new Set(patterns.map((p) => p.category))).filter(Boolean);
    const planCategories = Array.from(
      new Set(resources.filter((r) => r.buckets.includes("plan")).flatMap((r) => r.categories))
    ).filter(Boolean);
    const toolsCategories = Array.from(
      new Set(
        resources
          .filter((r) => r.buckets.includes("tools"))
          .flatMap((r) => r.categories)
      )
    ).filter(Boolean);
    const shipSections = Array.from(
      new Set(
        resources.filter((r) => r.buckets.includes("ship")).flatMap((r) => r.shipSections)
      )
    ).filter(Boolean);
    const monetizeCategories = Array.from(
      new Set(resources.filter((r) => r.buckets.includes("monetize")).flatMap((r) => r.categories))
    ).filter(Boolean);
    const learnTopics = Array.from(new Set(knowledge.flatMap((k) => k.topics))).filter(Boolean);
    const learnTypes = Array.from(new Set(knowledge.map((k) => k.type))).filter(Boolean);
    const inspireGroups = Array.from(new Set(inspiration.map((i) => i.group))).filter(Boolean);

    return snapshot(status, {
      patterns,
      resources,
      knowledge,
      inspiration,
      buildCategories,
      planCategories,
      toolsCategories,
      shipSections,
      monetizeCategories,
      learnTopics,
      learnTypes,
      inspireGroups,
      error,
      meta: {
        cmsPatterns: cms.patterns.length,
        cmsResources: cms.resources.length,
        cmsInspiration: cms.inspiration.length,
        legacyKnowledge: legacyKnowledge.length,
        fallbackPatterns: patterns.length - cms.patterns.length,
        fallbackResources: resources.length - cms.resources.length,
        fallbackKnowledge: knowledge.length - legacyKnowledge.length,
        fallbackInspiration: inspiration.length - cms.inspiration.length,
      },
      loadedAt: Date.now(),
    });
  } catch (err) {
    console.error("[STEA Code V2] adaptIntoV2Snapshot error:", err);
    // Fallback-only safety: still render usable content.
    try {
      const existingK = new Set();
      const patterns = [...FALLBACK_PATTERNS];
      const resources = [...FALLBACK_RESOURCES];
      const knowledge = [...FALLBACK_KNOWLEDGE.filter((k) => !existingK.has(String(k.id)))];
      const inspiration = [...FALLBACK_INSPIRATION];
      const buildCategories = Array.from(new Set(patterns.map((p) => p.category))).filter(Boolean);
      const planCategories = Array.from(
        new Set(resources.filter((r) => r.buckets.includes("plan")).flatMap((r) => r.categories))
      ).filter(Boolean);
      const toolsCategories = Array.from(
        new Set(
          resources
            .filter((r) => r.buckets.includes("tools"))
            .flatMap((r) => r.categories)
        )
      ).filter(Boolean);
      const shipSections = Array.from(
        new Set(
          resources.filter((r) => r.buckets.includes("ship")).flatMap((r) => r.shipSections)
        )
      ).filter(Boolean);
      const monetizeCategories = Array.from(
        new Set(resources.filter((r) => r.buckets.includes("monetize")).flatMap((r) => r.categories))
      ).filter(Boolean);
      const learnTopics = Array.from(new Set(knowledge.flatMap((k) => k.topics))).filter(Boolean);
      const learnTypes = Array.from(new Set(knowledge.map((k) => k.type))).filter(Boolean);
      const inspireGroups = Array.from(new Set(inspiration.map((i) => i.group))).filter(Boolean);
      return snapshot("error", {
        error: String(err?.message || err || error || "Adapt failure"),
        patterns,
        resources,
        knowledge,
        inspiration,
        buildCategories,
        planCategories,
        toolsCategories,
        shipSections,
        monetizeCategories,
        learnTopics,
        learnTypes,
        inspireGroups,
        meta: {
          cmsPatterns: 0,
          cmsResources: 0,
          cmsInspiration: 0,
          legacyKnowledge: 0,
          fallbackPatterns: patterns.length,
          fallbackResources: resources.length,
          fallbackKnowledge: knowledge.length,
          fallbackInspiration: inspiration.length,
        },
        loadedAt: Date.now(),
      });
    } catch (fatal) {
      return snapshot("error", { error: String(fatal?.message || fatal || err) });
    }
  }
}
