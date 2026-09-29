import { useState, useEffect, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Globe, Send, Loader2 } from "lucide-react";
import { TOKENS } from "./tokens.js";
import { useAuth } from "../../hooks/useAuth.js";
import {
  normalizeWebsiteCategorySlug,
  normalizeDeveloperSubcategorySlug,
} from "../../constants/categoryOrder.js";

export const MAIN_SUGGESTION_CATEGORIES = [
  { id: "live-sports", label: "Live Sports" },
  { id: "movies-tv-shows", label: "Movies & TV Shows" },
  { id: "ebooks", label: "eBooks" },
  { id: "life-hack", label: "Life Hack" },
  { id: "money-finance", label: "Money & Finance" },
  { id: "music", label: "Music" },
  { id: "games", label: "Games" },
  { id: "online-courses", label: "Online Courses" },
  { id: "comics", label: "Comics" },
  { id: "graphics-design", label: "Graphics Design" },
  { id: "jobs-career", label: "Jobs & Career" },
  { id: "asian-drama", label: "Asian Drama" },
  { id: "manga", label: "Manga" },
  { id: "adblockers", label: "AdBlockers" },
  { id: "ai", label: "AI" },
  { id: "automation", label: "Automation" },
  { id: "creativity", label: "Creativity" },
  { id: "developers", label: "Developers Resources" },
];

export const DEVELOPER_SUGGESTION_SUBCATEGORIES = [
  { id: "vibe-coding-ai-dev", label: "Vibe Coding & AI Dev" },
  { id: "code-editors-ides", label: "Code Editors & IDEs" },
  { id: "version-control", label: "Version Control" },
  { id: "apis-services", label: "APIs & Services" },
  { id: "web-development", label: "Web Development" },
  { id: "app-development", label: "App Development" },
  { id: "backend-development", label: "Backend Development" },
  { id: "databases", label: "Databases" },
  { id: "cloud-platforms", label: "Cloud Platforms" },
  { id: "hosting-domains", label: "Hosting & Domains" },
  { id: "ui-ux-design", label: "UI/UX Design" },
  { id: "testing-debugging", label: "Testing & Debugging" },
  { id: "deployment-devops", label: "Deployment & DevOps" },
  { id: "performance-monitoring", label: "Performance & Monitoring" },
  { id: "security", label: "Security" },
  { id: "documentation-learning", label: "Documentation & Learning" },
  { id: "community-qa", label: "Community & Q&A" },
  { id: "blocks-components", label: "Blocks & Components" },
  { id: "open-source", label: "Open Source" },
  { id: "developer-news", label: "Developer News" },
];

const NSFW_TERMS = [
  "porn", "xxx", "hentai", "xvideos", "xnxx", "pornhub", "redtube", "youporn",
  "brazzers", "chaturbate", "stripchat", "onlyfans", "cam4", "livejasmin",
  "beeg", "spankbang", "eporner", "xhamster", "bangbros", "naughtyamerica",
  "fapello", "hqporner", "rule34", "hentaihaven", "nhentai", "erotic",
  "fetish", "blowjob", "handjob", "masturbat", "orgasm", "dildo", "incest",
  "escort", "nude", "nudity", "tits", "pussy", "vagina", "penis", "camsoda",
  "bongacams", "cams.com", "flirt4free", "imlive", "streamate"
];

const NSFW_TLDS = [".xxx", ".porn", ".adult", ".sex", ".sexy", ".cam"];

function checkIsNsfw(urlStr, nameStr, descStr) {
  const combined = `${urlStr || ""} ${nameStr || ""} ${descStr || ""}`.toLowerCase();
  for (const tld of NSFW_TLDS) {
    if (urlStr.toLowerCase().includes(tld)) return true;
  }
  for (const term of NSFW_TERMS) {
    if (combined.includes(term)) {
      return true;
    }
  }
  return false;
}

export default function SuggestWebsiteModal({ open = true, onClose, initialCategory = "", user: propUser }) {
  const { user: authUser, loading: authLoading } = useAuth();
  const user = propUser || authUser || (typeof window !== "undefined" && window._steaAuthUser);

  const [mounted, setMounted] = useState(Boolean(open));
  const [visible, setVisible] = useState(false);

  // Form State
  const [websiteName, setWebsiteName] = useState("");
  const [url, setUrl] = useState("");
  const [categoryValue, setCategoryValue] = useState(() => {
    if (!initialCategory) return "";
    const matchedMain = MAIN_SUGGESTION_CATEGORIES.find(
      (c) => c.id === initialCategory || c.label.toLowerCase() === initialCategory.toLowerCase()
    );
    if (matchedMain) return `cat:${matchedMain.id}:${matchedMain.label}`;
    const matchedDev = DEVELOPER_SUGGESTION_SUBCATEGORIES.find(
      (s) => s.id === initialCategory || s.label.toLowerCase() === initialCategory.toLowerCase()
    );
    if (matchedDev) return `dev:${matchedDev.id}:${matchedDev.label}`;
    return "";
  });
  const [description, setDescription] = useState("");
  const [userNote, setUserNote] = useState("");

  // Optional app download links
  const [showAppDownloads, setShowAppDownloads] = useState(false);
  const [playStoreUrl, setPlayStoreUrl] = useState("");
  const [appStoreUrl, setAppStoreUrl] = useState("");
  const [windowsUrl, setWindowsUrl] = useState("");
  const [macUrl, setMacUrl] = useState("");
  const [linuxUrl, setLinuxUrl] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 180);
      return () => clearTimeout(timer);
    }
    // If auth is still loading and user is not yet known, wait for auth to finish
    if (authLoading && !user) {
      return;
    }
    // Access restriction: guests cannot open or use the suggest form
    if (!user) {
      setVisible(false);
      setMounted(false);
      onClose && onClose();
      window.dispatchEvent(new CustomEvent("open-auth"));
      return;
    }

    setMounted(true);
    setError("");
    setSuccess(false);
    const r = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(r);
  }, [open, user, authLoading, onClose]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setMounted(false);
      onClose && onClose();
    }, 180);
  }, [onClose]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !submitting) handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, submitting, handleClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError("");

    // Access restriction check
    const activeUser = user || (typeof window !== "undefined" && window._steaAuthUser);
    if (!activeUser) {
      setError("You must be signed in as a member to suggest a website.");
      window.dispatchEvent(new CustomEvent("open-auth"));
      return;
    }

    // Field 1: Name validation
    const trimmedName = websiteName.trim();
    if (!trimmedName) {
      setError("Please enter the App or Website Name.");
      return;
    }

    // Field 2: URL validation (format & must check for https://)
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError("Please enter the full Website URL.");
      return;
    }

    if (!trimmedUrl.startsWith("https://")) {
      setError("Website URL must start with https:// (e.g. https://example.com)");
      return;
    }

    try {
      const parsed = new URL(trimmedUrl);
      if (!parsed.hostname || !parsed.hostname.includes(".")) {
        setError("Please enter a valid website address with a domain name.");
        return;
      }
    } catch {
      setError("Please enter a valid website URL starting with https://");
      return;
    }

    // Field 3: Category validation
    if (!categoryValue) {
      setError("Please select a category from the dropdown.");
      return;
    }

    // Field 4: Description validation
    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      setError("Please provide a short one-line description of what this website does.");
      return;
    }

    // Safety / NSFW Filter Check
    if (checkIsNsfw(trimmedUrl, trimmedName, trimmedDesc)) {
      setError("Submissions containing adult or inappropriate content are not allowed.");
      return;
    }

    // Resolve category and subcategory
    let resolvedCategory = "";
    let resolvedCategorySlug = "";
    let resolvedSubcategory = "";
    let resolvedSubcategorySlug = "";

    if (categoryValue.startsWith("dev:")) {
      const [, devId, devLabel] = categoryValue.split(":");
      resolvedCategory = "Developers Resources";
      resolvedCategorySlug = "developers";
      resolvedSubcategory = devLabel;
      resolvedSubcategorySlug = devId;
    } else if (categoryValue.startsWith("cat:")) {
      const [, catId, catLabel] = categoryValue.split(":");
      resolvedCategory = catLabel;
      resolvedCategorySlug = catId;
    } else {
      resolvedCategory = categoryValue;
      resolvedCategorySlug = normalizeWebsiteCategorySlug(categoryValue);
    }

    setSubmitting(true);

    try {
      const { getFirebaseDb, collection, addDoc, serverTimestamp } = await import("../../firebase.js");
      const db = getFirebaseDb();
      if (!db) {
        throw new Error("Unable to connect to database. Please check your connection.");
      }

      const submissionRecord = {
        websiteName: trimmedName,
        name: trimmedName,
        url: trimmedUrl,
        category: resolvedCategory,
        suggestedCategory: resolvedCategory,
        categorySlug: resolvedCategorySlug,
        subcategory: resolvedSubcategory,
        subcategorySlug: resolvedSubcategorySlug,
        description: trimmedDesc,
        note: userNote.trim(),
        userNote: userNote.trim(),
        appDownloads: {
          playStore: playStoreUrl.trim(),
          appStore: appStoreUrl.trim(),
          windows: windowsUrl.trim(),
          mac: macUrl.trim(),
          linux: linuxUrl.trim(),
        },
        status: "pending",
        source: "public_suggest_modal",
        submittedAt: serverTimestamp(),
        submittedBy: activeUser?.uid || "",
        submitterEmail: activeUser?.email || "",
      };

      await Promise.all([
        addDoc(collection(db, "websiteSubmissions"), submissionRecord),
        addDoc(collection(db, "suggestions"), submissionRecord).catch(() => {}),
      ]);

      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error("Suggestion submission error:", err);
      const code = err?.code || "";
      const msg = err?.message || "";
      if (
        code === "permission-denied" ||
        msg.includes("insufficient permissions") ||
        msg.includes("Missing or insufficient permissions") ||
        msg.includes("permission")
      ) {
        setError("You need to log in as a member to submit suggestions.");
      } else if (msg.includes("network")) {
        setError("Network error. Please check your internet connection and try again.");
      } else {
        setError(msg || "Failed to submit website. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div
      className={`sites-suggest-overlay ${visible ? "is-visible" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sites-suggest-title"
    >
      <div className="sites-suggest-card">
        {/* Header */}
        <div className="sites-suggest-head">
          <div className="sites-suggest-head-left">
            <div className="sites-suggest-badge-icon" aria-hidden>
              <Globe size={18} strokeWidth={2.4} />
            </div>
            <div>
              <h2 id="sites-suggest-title" className="sites-suggest-title">
                Suggest a Website / App
              </h2>
              <p className="sites-suggest-sub">
                Recommend useful tools &amp; resources for STEA directory.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="sites-suggest-close"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="sites-suggest-success-box" role="status">
            <CheckCircle size={42} className="sites-suggest-success-icon" />
            <h3 className="sites-suggest-success-title">Thank you!</h3>
            <p className="sites-suggest-success-text">
              Your suggestion has been sent for admin review.
            </p>
            <span className="sites-suggest-success-hint">Closing window…</span>
          </div>
        ) : (
          /* Form */
          <form className="sites-suggest-form" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="sites-suggest-error-banner" role="alert">
                <AlertCircle size={16} className="sites-suggest-error-icon" />
                <span>{error}</span>
              </div>
            )}

            {/* Field 1: App / Website Name */}
            <div className="sites-suggest-field">
              <label htmlFor="suggest-name" className="sites-suggest-label">
                App / Website Name <span className="sites-suggest-required">*</span>
              </label>
              <input
                id="suggest-name"
                type="text"
                required
                value={websiteName}
                onChange={(e) => setWebsiteName(e.target.value)}
                placeholder="e.g. Canva, Postman, Scribe…"
                className="sites-suggest-input"
                disabled={submitting}
                autoFocus
              />
            </div>

            {/* Field 2: Full Website URL */}
            <div className="sites-suggest-field">
              <label htmlFor="suggest-url" className="sites-suggest-label">
                Full Website URL <span className="sites-suggest-required">*</span>
                <span className="sites-suggest-label-hint">Must start with https://</span>
              </label>
              <input
                id="suggest-url"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="sites-suggest-input"
                disabled={submitting}
              />
            </div>

            {/* Field 3: Select Category */}
            <div className="sites-suggest-field">
              <label htmlFor="suggest-category" className="sites-suggest-label">
                Select Category <span className="sites-suggest-required">*</span>
              </label>
              <select
                id="suggest-category"
                required
                value={categoryValue}
                onChange={(e) => setCategoryValue(e.target.value)}
                className="sites-suggest-input sites-suggest-select"
                disabled={submitting}
              >
                <option value="">-- Choose a category --</option>
                <optgroup label="Main Categories">
                  {MAIN_SUGGESTION_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={`cat:${cat.id}:${cat.label}`}>
                      {cat.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Developers Sub-Categories">
                  {DEVELOPER_SUGGESTION_SUBCATEGORIES.map((sub) => (
                    <option key={sub.id} value={`dev:${sub.id}:${sub.label}`}>
                      Developers: {sub.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Field 4: Short one-line description */}
            <div className="sites-suggest-field">
              <label htmlFor="suggest-desc" className="sites-suggest-label">
                Short Description <span className="sites-suggest-required">*</span>
                <span className="sites-suggest-label-hint">One clear sentence</span>
              </label>
              <input
                id="suggest-desc"
                type="text"
                required
                maxLength={180}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this website/tool do?"
                className="sites-suggest-input"
                disabled={submitting}
              />
            </div>

            {/* Field 5: Optional extra note */}
            <div className="sites-suggest-field">
              <label htmlFor="suggest-note" className="sites-suggest-label">
                Optional Extra Note
                <span className="sites-suggest-label-hint">Why you recommend it, free plan info, etc.</span>
              </label>
              <textarea
                id="suggest-note"
                rows={3}
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder="Any additional details for the admin review team…"
                className="sites-suggest-textarea"
                disabled={submitting}
              />
            </div>

            {/* Optional Application Download Links */}
            <div className="sites-suggest-app-section">
              <button
                type="button"
                className="sites-suggest-toggle-btn"
                onClick={() => setShowAppDownloads(!showAppDownloads)}
              >
                <span>📦 App Download Links (Optional)</span>
                <span className="sites-suggest-toggle-indicator">
                  {showAppDownloads ? "▲ Hide" : "▼ Add App Links"}
                </span>
              </button>

              {showAppDownloads && (
                <div className="sites-suggest-downloads-grid">
                  <div className="sites-suggest-field">
                    <label className="sites-suggest-sublabel">🤖 Play Store URL (Android)</label>
                    <input
                      type="url"
                      value={playStoreUrl}
                      onChange={(e) => setPlayStoreUrl(e.target.value)}
                      placeholder="https://play.google.com/store/apps/details?id=..."
                      className="sites-suggest-input"
                      disabled={submitting}
                    />
                  </div>

                  <div className="sites-suggest-field">
                    <label className="sites-suggest-sublabel">🍎 App Store URL (iOS / iPhone)</label>
                    <input
                      type="url"
                      value={appStoreUrl}
                      onChange={(e) => setAppStoreUrl(e.target.value)}
                      placeholder="https://apps.apple.com/app/..."
                      className="sites-suggest-input"
                      disabled={submitting}
                    />
                  </div>

                  <div className="sites-suggest-field">
                    <label className="sites-suggest-sublabel">🪟 Windows Download URL</label>
                    <input
                      type="url"
                      value={windowsUrl}
                      onChange={(e) => setWindowsUrl(e.target.value)}
                      placeholder="https://example.com/download/windows.exe"
                      className="sites-suggest-input"
                      disabled={submitting}
                    />
                  </div>

                  <div className="sites-suggest-field">
                    <label className="sites-suggest-sublabel">🍏 Mac Download URL</label>
                    <input
                      type="url"
                      value={macUrl}
                      onChange={(e) => setMacUrl(e.target.value)}
                      placeholder="https://example.com/download/mac.dmg"
                      className="sites-suggest-input"
                      disabled={submitting}
                    />
                  </div>

                  <div className="sites-suggest-field">
                    <label className="sites-suggest-sublabel">🐧 Linux Download URL</label>
                    <input
                      type="url"
                      value={linuxUrl}
                      onChange={(e) => setLinuxUrl(e.target.value)}
                      placeholder="https://example.com/download/linux.AppImage"
                      className="sites-suggest-input"
                      disabled={submitting}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button & Actions */}
            <div className="sites-suggest-actions">
              <button
                type="button"
                className="sites-suggest-cancel-btn"
                onClick={handleClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="sites-suggest-submit-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="sites-suggest-spin" />
                    <span>Submitting…</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Submit Suggestion</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .sites-suggest-overlay {
          position: fixed;
          inset: 0;
          z-index: var(--stea-z-modal, 100);
          background: rgba(4, 7, 15, 0.82);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          opacity: 0;
          transition: opacity 180ms ease;
        }
        .sites-suggest-overlay.is-visible {
          opacity: 1;
        }
        .sites-suggest-card {
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          background: #0d121f;
          border: 1px solid rgba(245, 166, 35, 0.28);
          border-radius: 16px;
          padding: 24px 22px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.05);
          color: #F0F2F5;
          position: relative;
          transform: translateY(8px) scale(0.98);
          transition: transform 180ms ease;
        }
        .sites-suggest-overlay.is-visible .sites-suggest-card {
          transform: translateY(0) scale(1);
        }
        .sites-suggest-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .sites-suggest-head-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sites-suggest-badge-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(245, 166, 35, 0.12);
          border: 1px solid rgba(245, 166, 35, 0.3);
          color: #F5A623;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sites-suggest-title {
          margin: 0 0 3px;
          font-size: 18px;
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: -0.01em;
        }
        .sites-suggest-sub {
          margin: 0;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }
        .sites-suggest-close {
          background: transparent;
          border: 0;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 140ms ease, background 140ms ease;
        }
        .sites-suggest-close:hover {
          color: #FFF;
          background: rgba(255, 255, 255, 0.08);
        }
        .sites-suggest-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .sites-suggest-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .sites-suggest-label {
          font-size: 12.5px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.88);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 4px;
        }
        .sites-suggest-required {
          color: #F5A623;
          margin-left: 2px;
        }
        .sites-suggest-label-hint {
          font-size: 11px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.45);
        }
        .sites-suggest-input,
        .sites-suggest-textarea {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 10px 12px;
          color: #FFFFFF;
          font: inherit;
          font-size: 13.5px;
          box-sizing: border-box;
          transition: border-color 150ms ease, box-shadow 150ms ease, background 150ms ease;
          outline: none;
        }
        .sites-suggest-input:focus,
        .sites-suggest-textarea:focus {
          border-color: #F5A623;
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.18);
        }
        .sites-suggest-select {
          cursor: pointer;
        }
        .sites-suggest-select option,
        .sites-suggest-select optgroup {
          background: #111528;
          color: #FFF;
        }
        .sites-suggest-textarea {
          resize: vertical;
          min-height: 68px;
          line-height: 1.4;
        }
        .sites-suggest-app-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 12px;
        }
        .sites-suggest-toggle-btn {
          width: 100%;
          background: transparent;
          border: 0;
          color: #F5A623;
          font: inherit;
          font-size: 12.5px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          padding: 2px 0;
        }
        .sites-suggest-toggle-indicator {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          background: rgba(255, 255, 255, 0.06);
          padding: 2px 8px;
          border-radius: 6px;
        }
        .sites-suggest-downloads-grid {
          display: grid;
          gap: 10px;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          animation: feedbackFade 140ms ease-out;
        }
        .sites-suggest-sublabel {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 4px;
        }
        .sites-suggest-error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(220, 53, 69, 0.15);
          border: 1px solid rgba(220, 53, 69, 0.35);
          color: #FF8F9C;
          border-radius: 9px;
          padding: 9px 12px;
          font-size: 12.5px;
          font-weight: 600;
        }
        .sites-suggest-error-icon {
          flex-shrink: 0;
        }
        .sites-suggest-actions {
          display: flex;
          gap: 10px;
          margin-top: 8px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .sites-suggest-cancel-btn {
          flex: 1;
          padding: 11px 16px;
          border-radius: 10px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.8);
          font: inherit;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
          transition: background 140ms ease, color 140ms ease;
        }
        .sites-suggest-cancel-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #FFF;
        }
        .sites-suggest-submit-btn {
          flex: 2;
          padding: 11px 18px;
          border-radius: 10px;
          background: linear-gradient(180deg, #F9B645, #F5A623);
          border: 0;
          color: #1A1105;
          font: inherit;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          box-shadow: 0 4px 14px rgba(245, 166, 35, 0.25);
          transition: filter 140ms ease, transform 140ms ease;
        }
        .sites-suggest-submit-btn:hover:not(:disabled) {
          filter: brightness(1.06);
          transform: translateY(-0.5px);
        }
        .sites-suggest-submit-btn:disabled,
        .sites-suggest-cancel-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .sites-suggest-spin {
          animation: suggestSpin 900ms linear infinite;
        }
        @keyframes suggestSpin {
          to { transform: rotate(360deg); }
        }
        .sites-suggest-success-box {
          text-align: center;
          padding: 30px 10px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .sites-suggest-success-icon {
          color: #4ADE80;
          filter: drop-shadow(0 0 12px rgba(74, 222, 128, 0.3));
        }
        .sites-suggest-success-title {
          font-size: 20px;
          font-weight: 800;
          color: #FFFFFF;
          margin: 0;
        }
        .sites-suggest-success-text {
          font-size: 14px;
          color: #4ADE80;
          margin: 0;
          max-width: 360px;
          line-height: 1.5;
        }
        .sites-suggest-success-hint {
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 6px;
        }

        @media (max-width: 480px) {
          .sites-suggest-card {
            padding: 18px 16px;
          }
          .sites-suggest-title {
            font-size: 16px;
          }
          .sites-suggest-actions {
            flex-direction: column-reverse;
          }
          .sites-suggest-cancel-btn,
          .sites-suggest-submit-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
