import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { logAdminActivity } from "../../utils/siteAnalytics.js";
import {
  normalizeWebsiteCategorySlug,
  normalizeDeveloperSubcategorySlug,
} from "../../constants/categoryOrder.js";
import {
  Check,
  X,
  ExternalLink,
  Search,
  Filter,
  Inbox,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
} from "lucide-react";

export default function SitesAdminSubmissions() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState({ message: "", type: "" });

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState("pending"); // 'pending' | 'approved' | 'rejected' | 'all'
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Fetch submissions from Firestore
  useEffect(() => {
    let isMounted = true;
    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const { getFirebaseDb, collection, getDocs, query, orderBy } = await import(
          "../../firebase.js"
        );
        const db = getFirebaseDb();
        if (!db) throw new Error("Firestore not initialized.");

        const snap = await getDocs(
          query(collection(db, "websiteSubmissions"), orderBy("submittedAt", "desc"))
        );
        if (!isMounted) return;

        const list = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });

        setSubmissions(list);
      } catch (err) {
        console.error("Failed to fetch submissions:", err);
        if (isMounted) setError("Failed to load suggestions. Please check connection.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSubmissions();
    return () => {
      isMounted = false;
    };
  }, []);

  // Flash feedback toast
  const showFeedback = (message, type = "success") => {
    setFeedback({ message, type });
    setTimeout(() => {
      setFeedback({ message: "", type: "" });
    }, 4000);
  };

  // Helper to format date & time
  const formatDateTime = (timestamp) => {
    if (!timestamp) return "—";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      if (Number.isNaN(date.getTime())) return "—";
      return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  // Extract cleaned domain
  const extractDomain = (url) => {
    if (!url) return "";
    try {
      const u = url.startsWith("http") ? url : `https://${url}`;
      return new URL(u).hostname.replace(/^www\./i, "").toLowerCase();
    } catch {
      return url.replace(/^https?:\/\//i, "").split("/")[0].toLowerCase();
    }
  };

  // Counts for tabs
  const counts = useMemo(() => {
    const p = submissions.filter((s) => (s.status || "pending") === "pending").length;
    const a = submissions.filter((s) => s.status === "approved").length;
    const r = submissions.filter((s) => s.status === "rejected").length;
    return { pending: p, approved: a, rejected: r, all: submissions.length };
  }, [submissions]);

  // Filtered submissions list
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const status = sub.status || "pending";
      if (statusFilter !== "all" && status !== statusFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = String(sub.websiteName || sub.name || "").toLowerCase();
        const url = String(sub.url || "").toLowerCase();
        const cat = String(sub.category || sub.suggestedCategory || "").toLowerCase();
        const subcat = String(sub.subcategory || "").toLowerCase();
        const desc = String(sub.description || "").toLowerCase();
        const note = String(sub.note || sub.userNote || "").toLowerCase();

        if (
          !name.includes(q) &&
          !url.includes(q) &&
          !cat.includes(q) &&
          !subcat.includes(q) &&
          !desc.includes(q) &&
          !note.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [submissions, statusFilter, searchQuery]);

  // Critical Approve Logic:
  // 1. Injects into 'websites' collection in published state using exact existing schema.
  // 2. Marks submission status as 'approved'.
  // 3. Dispatches local sync event so live homepage updates immediately.
  const handleApprove = async (sub) => {
    if (!user) {
      alert("Admin authorization required.");
      return;
    }

    const websiteName = String(sub.websiteName || sub.name || "").trim();
    const rawUrl = String(sub.url || "").trim();
    if (!rawUrl || !websiteName) {
      alert("Submission is missing required website name or URL.");
      return;
    }

    setActionLoadingId(sub.id);

    try {
      const {
        getFirebaseDb,
        doc,
        updateDoc,
        collection,
        addDoc,
        getDocs,
        query,
        where,
        serverTimestamp,
      } = await import("../../firebase.js");
      const db = getFirebaseDb();
      if (!db) throw new Error("Firestore not available");

      const domain = extractDomain(rawUrl);
      const category = sub.category || sub.suggestedCategory || "Uncategorized";
      const categorySlug =
        sub.categorySlug || normalizeWebsiteCategorySlug(category);
      const subcategory = sub.subcategory || "";
      const subcategorySlug =
        sub.subcategorySlug ||
        (subcategory ? normalizeDeveloperSubcategorySlug(subcategory) : "");

      // Check if duplicate website exists in websites catalog
      const dupQuery = await getDocs(
        query(collection(db, "websites"), where("url", "==", rawUrl))
      );

      let websiteDocId = null;

      const appDownloads = {
        playStore: sub.appDownloads?.playStore || "",
        appStore: sub.appDownloads?.appStore || "",
        windows: sub.appDownloads?.windows || "",
        mac: sub.appDownloads?.mac || "",
        linux: sub.appDownloads?.linux || "",
      };

      if (!dupQuery.empty) {
        // Website already exists in database; update it to published
        const existingDoc = dupQuery.docs[0];
        websiteDocId = existingDoc.id;
        const updatePayload = {
          status: "published",
          published: true,
          active: true,
          category,
          categoryName: category,
          categorySlug,
          subcategory,
          subCategory: subcategory,
          subcategorySlug,
          subCategorySlug: subcategorySlug,
          updatedAt: serverTimestamp(),
        };
        if (sub.appDownloads) {
          updatePayload.appDownloads = appDownloads;
        }
        await updateDoc(doc(db, "websites", websiteDocId), updatePayload);
      } else {
        // Create brand new website entry matching existing website record format exactly
        const res = await createCanonicalWebsite({
          url: rawUrl,
          title: title,
          description: description,
          category: category,
          status: "published",
        }, "user_suggestion", sub.submittedBy || "");
        websiteDocId = res.id;
      }

      // Mark submission as approved
      await updateDoc(doc(db, "websiteSubmissions", sub.id), {
        status: "approved",
        approvedWebsiteId: websiteDocId,
        reviewedAt: serverTimestamp(),
        reviewedBy: user.uid,
        reviewerEmail: user.email || "",
      });

      // Log admin activity audit
      await logAdminActivity(
        user,
        "submission_approved",
        "website_submission",
        sub.id,
        {
          websiteName,
          url: rawUrl,
          category,
          websiteId: websiteDocId,
        }
      );

      // Trigger local runtime sync
      window.dispatchEvent(new CustomEvent("stea-data-sync"));

      // Update local state
      setSubmissions((prev) =>
        prev.map((item) =>
          item.id === sub.id
            ? { ...item, status: "approved", approvedWebsiteId: websiteDocId }
            : item
        )
      );

      showFeedback(`"${websiteName}" approved and published to ${category}!`, "success");
    } catch (err) {
      console.error("Approve failed:", err);
      showFeedback(`Approval failed: ${err.message}`, "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject Logic:
  // Marks submission status as 'rejected', removes from pending list, keeps for admin record.
  const handleReject = async (sub) => {
    if (!user) return;
    const websiteName = sub.websiteName || sub.name || "Suggestion";

    setActionLoadingId(sub.id);

    try {
      const { getFirebaseDb, doc, updateDoc, serverTimestamp } = await import(
        "../../firebase.js"
      );
      const db = getFirebaseDb();
      if (!db) throw new Error("Firestore not available");

      await updateDoc(doc(db, "websiteSubmissions", sub.id), {
        status: "rejected",
        reviewedAt: serverTimestamp(),
        reviewedBy: user.uid,
        reviewerEmail: user.email || "",
      });

      await logAdminActivity(
        user,
        "submission_rejected",
        "website_submission",
        sub.id,
        {
          websiteName,
          url: sub.url,
        }
      );

      setSubmissions((prev) =>
        prev.map((item) =>
          item.id === sub.id ? { ...item, status: "rejected" } : item
        )
      );

      showFeedback(`"${websiteName}" marked as rejected.`, "info");
    } catch (err) {
      console.error("Reject failed:", err);
      showFeedback(`Reject failed: ${err.message}`, "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Selection handlers
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSubmissions.length && filteredSubmissions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSubmissions.map((s) => s.id)));
    }
  };

  // Bulk Approve
  const handleBulkApprove = async () => {
    if (!user || selectedIds.size === 0) return;
    const itemsToApprove = submissions.filter((s) => selectedIds.has(s.id));
    if (itemsToApprove.length === 0) return;

    if (!window.confirm(`Approve and publish ${itemsToApprove.length} selected website(s)?`)) {
      return;
    }

    setBulkLoading(true);
    let successCount = 0;
    const updatedMap = {};

    try {
      const {
        getFirebaseDb,
        doc,
        updateDoc,
        collection,
        addDoc,
        getDocs,
        query,
        where,
        serverTimestamp,
      } = await import("../../firebase.js");
      const db = getFirebaseDb();
      if (!db) throw new Error("Firestore not available");

      for (const sub of itemsToApprove) {
        try {
          const websiteName = String(sub.websiteName || sub.name || "").trim();
          const rawUrl = String(sub.url || "").trim();
          if (!rawUrl || !websiteName) continue;

          const domain = extractDomain(rawUrl);
          const category = sub.category || sub.suggestedCategory || "Uncategorized";
          const categorySlug =
            sub.categorySlug || normalizeWebsiteCategorySlug(category);
          const subcategory = sub.subcategory || "";
          const subcategorySlug =
            sub.subcategorySlug ||
            (subcategory ? normalizeDeveloperSubcategorySlug(subcategory) : "");

          const dupQuery = await getDocs(
            query(collection(db, "websites"), where("url", "==", rawUrl))
          );

          let websiteDocId = null;

          const appDownloads = {
            playStore: sub.appDownloads?.playStore || "",
            appStore: sub.appDownloads?.appStore || "",
            windows: sub.appDownloads?.windows || "",
            mac: sub.appDownloads?.mac || "",
            linux: sub.appDownloads?.linux || "",
          };

          if (!dupQuery.empty) {
            const existingDoc = dupQuery.docs[0];
            websiteDocId = existingDoc.id;
            const updatePayload = {
              status: "published",
              published: true,
              active: true,
              category,
              categoryName: category,
              categorySlug,
              subcategory,
              subCategory: subcategory,
              subcategorySlug,
              subCategorySlug: subcategorySlug,
              updatedAt: serverTimestamp(),
            };
            if (sub.appDownloads) {
              updatePayload.appDownloads = appDownloads;
            }
            await updateDoc(doc(db, "websites", websiteDocId), updatePayload);
          } else {
            const res = await createCanonicalWebsite({
          url: rawUrl,
          title: title,
          description: description,
          category: category,
          status: "published",
        }, "user_suggestion", sub.submittedBy || "");
        websiteDocId = res.id;
          }

          await updateDoc(doc(db, "websiteSubmissions", sub.id), {
            status: "approved",
            approvedWebsiteId: websiteDocId,
            reviewedAt: serverTimestamp(),
            reviewedBy: user.uid,
            reviewerEmail: user.email || "",
          });

          await logAdminActivity(
            user,
            "submission_approved",
            "website_submission",
            sub.id,
            { websiteName, url: rawUrl, category, websiteId: websiteDocId }
          );

          updatedMap[sub.id] = websiteDocId;
          successCount += 1;
        } catch (e) {
          console.error(`Error approving submission ${sub.id}:`, e);
        }
      }

      window.dispatchEvent(new CustomEvent("stea-data-sync"));

      setSubmissions((prev) =>
        prev.map((item) =>
          updatedMap[item.id]
            ? { ...item, status: "approved", approvedWebsiteId: updatedMap[item.id] }
            : item
        )
      );

      setSelectedIds(new Set());
      showFeedback(`Successfully approved and published ${successCount} website(s)!`, "success");
    } catch (err) {
      console.error("Bulk approve failed:", err);
      showFeedback(`Bulk approval failed: ${err.message}`, "error");
    } finally {
      setBulkLoading(false);
    }
  };

  // Bulk Reject
  const handleBulkReject = async () => {
    if (!user || selectedIds.size === 0) return;
    const itemsToReject = submissions.filter((s) => selectedIds.has(s.id));
    if (itemsToReject.length === 0) return;

    if (!window.confirm(`Reject ${itemsToReject.length} selected submission(s)?`)) {
      return;
    }

    setBulkLoading(true);
    let count = 0;
    const rejectedIds = new Set();

    try {
      const { getFirebaseDb, doc, updateDoc, serverTimestamp } = await import(
        "../../firebase.js"
      );
      const db = getFirebaseDb();
      if (!db) throw new Error("Firestore not available");

      for (const sub of itemsToReject) {
        try {
          await updateDoc(doc(db, "websiteSubmissions", sub.id), {
            status: "rejected",
            reviewedAt: serverTimestamp(),
            reviewedBy: user.uid,
            reviewerEmail: user.email || "",
          });

          await logAdminActivity(
            user,
            "submission_rejected",
            "website_submission",
            sub.id,
            { websiteName: sub.websiteName || sub.name, url: sub.url }
          );

          rejectedIds.add(sub.id);
          count += 1;
        } catch (e) {
          console.error(`Error rejecting submission ${sub.id}:`, e);
        }
      }

      setSubmissions((prev) =>
        prev.map((item) =>
          rejectedIds.has(item.id) ? { ...item, status: "rejected" } : item
        )
      );

      setSelectedIds(new Set());
      showFeedback(`Marked ${count} submission(s) as rejected.`, "info");
    } catch (err) {
      console.error("Bulk reject failed:", err);
      showFeedback(`Bulk reject failed: ${err.message}`, "error");
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="sites-admin-submissions-page">
      {/* Page Header */}
      <div className="sites-submissions-header">
        <div>
          <div className="sites-submissions-title-row">
            <h1 className="sites-submissions-title">Submitted Suggestions</h1>
            <span className="sites-submissions-badge">Community Pipeline</span>
          </div>
          <p className="sites-submissions-desc">
            Review community website submissions. Approved entries are published
            instantly to live category cards on STEA.
          </p>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback.message && (
        <div
          className={`sites-feedback-banner ${
            feedback.type === "error"
              ? "is-error"
              : feedback.type === "info"
              ? "is-info"
              : "is-success"
          }`}
          role="status"
        >
          {feedback.type === "error" ? (
            <AlertCircle size={16} />
          ) : feedback.type === "info" ? (
            <AlertCircle size={16} />
          ) : (
            <CheckCircle2 size={16} />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Controls: Tabs & Search */}
      <div className="sites-submissions-controls">
        <div className="sites-submissions-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === "pending"}
            className={`sites-tab-btn ${statusFilter === "pending" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("pending")}
          >
            <Clock size={14} />
            <span>Pending</span>
            <span className="sites-tab-count is-pending">{counts.pending}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === "approved"}
            className={`sites-tab-btn ${statusFilter === "approved" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("approved")}
          >
            <CheckCircle2 size={14} />
            <span>Approved</span>
            <span className="sites-tab-count is-approved">{counts.approved}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === "rejected"}
            className={`sites-tab-btn ${statusFilter === "rejected" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("rejected")}
          >
            <XCircle size={14} />
            <span>Rejected</span>
            <span className="sites-tab-count is-rejected">{counts.rejected}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === "all"}
            className={`sites-tab-btn ${statusFilter === "all" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            <Filter size={14} />
            <span>All</span>
            <span className="sites-tab-count">{counts.all}</span>
          </button>
        </div>

        {/* Search input */}
        <div className="sites-submissions-search-wrap">
          <Search size={15} className="sites-submissions-search-icon" />
          <input
            type="text"
            placeholder="Search suggestions by name, url, category, notes…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sites-submissions-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="sites-submissions-search-clear"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <div className="sites-submissions-loading">
          <div className="sites-submissions-spinner" />
          <span>Loading submissions catalog…</span>
        </div>
      ) : error ? (
        <div className="sites-submissions-error-box">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="sites-submissions-empty">
          <Inbox size={36} className="sites-empty-icon" />
          <h3>No suggestions found</h3>
          <p>
            {searchQuery
              ? `No results match "${searchQuery}".`
              : statusFilter === "pending"
              ? "All caught up! There are no pending community suggestions."
              : `No ${statusFilter} suggestions on record.`}
          </p>
        </div>
      ) : (
        <>
          {/* Bulk Actions Floating Bar */}
          {selectedIds.size > 0 && (
            <div className="sites-bulk-bar">
              <div className="sites-bulk-count">
                <span className="sites-bulk-badge">{selectedIds.size}</span>
                <span>suggestion{selectedIds.size > 1 ? "s" : ""} selected</span>
              </div>
              <div className="sites-bulk-actions">
                <button
                  type="button"
                  className="sites-bulk-btn is-approve"
                  onClick={handleBulkApprove}
                  disabled={bulkLoading}
                >
                  <Check size={14} strokeWidth={2.5} />
                  <span>{bulkLoading ? "Approving…" : `Approve (${selectedIds.size})`}</span>
                </button>
                <button
                  type="button"
                  className="sites-bulk-btn is-reject"
                  onClick={handleBulkReject}
                  disabled={bulkLoading}
                >
                  <X size={14} strokeWidth={2.5} />
                  <span>{bulkLoading ? "Rejecting…" : `Reject (${selectedIds.size})`}</span>
                </button>
                <button
                  type="button"
                  className="sites-bulk-btn is-clear"
                  onClick={() => setSelectedIds(new Set())}
                  disabled={bulkLoading}
                >
                  Deselect All
                </button>
              </div>
            </div>
          )}

          <div className="sites-submissions-table-wrap">
            <table className="sites-submissions-table">
              <thead>
                <tr>
                  <th style={{ width: 44, textAlign: "center" }}>
                    <input
                      type="checkbox"
                      className="sites-sub-checkbox"
                      checked={
                        filteredSubmissions.length > 0 &&
                        filteredSubmissions.every((s) => selectedIds.has(s.id))
                      }
                      onChange={toggleSelectAll}
                      title="Select or deselect all visible suggestions"
                      aria-label="Select all suggestions"
                    />
                  </th>
                  <th>Website / App</th>
                  <th>Selected Category</th>
                  <th>Description</th>
                  <th>User Note</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((sub) => {
                  const isPending = (sub.status || "pending") === "pending";
                  const isApproved = sub.status === "approved";
                  const isRejected = sub.status === "rejected";
                  const isActionBusy = actionLoadingId === sub.id;
                  const isSelected = selectedIds.has(sub.id);

                  return (
                    <tr
                      key={sub.id}
                      className={`tr-status-${sub.status || "pending"} ${
                        isSelected ? "is-selected-row" : ""
                      }`}
                    >
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          className="sites-sub-checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(sub.id)}
                          aria-label={`Select ${sub.websiteName || sub.name || "suggestion"}`}
                        />
                      </td>
                      {/* Website / App Name & URL */}
                      <td className="td-name">
                      <div className="sub-title-row">
                        <strong className="sub-site-name">
                          {sub.websiteName || sub.name || "Untitled"}
                        </strong>
                      </div>
                      <a
                        href={sub.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sub-site-url"
                        title={sub.url}
                      >
                        <span>{sub.url}</span>
                        <ExternalLink size={12} />
                      </a>
                    </td>

                    {/* Selected Category */}
                    <td className="td-category">
                      <span className="sub-cat-badge">
                        {sub.category || sub.suggestedCategory || "—"}
                      </span>
                      {sub.subcategory && (
                        <span className="sub-subcat-badge">
                          {sub.subcategory}
                        </span>
                      )}
                    </td>

                    {/* Short Description */}
                    <td className="td-desc">
                      <p className="sub-desc-text">
                        {sub.description || "—"}
                      </p>
                    </td>

                    {/* User Optional Note */}
                    <td className="td-note">
                      {sub.note || sub.userNote ? (
                        <div className="sub-note-box">
                          <MessageSquare size={12} className="sub-note-icon" />
                          <span>{sub.note || sub.userNote}</span>
                        </div>
                      ) : (
                        <span className="sub-empty-dash">—</span>
                      )}
                    </td>

                    {/* Submission Date & Time */}
                    <td className="td-date">
                      <span className="sub-date-text">
                        {formatDateTime(sub.submittedAt || sub.createdAt)}
                      </span>
                      {sub.submitterEmail && (
                        <span className="sub-submitter-email">
                          {sub.submitterEmail}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="td-status">
                      <span className={`sub-status-pill is-${sub.status || "pending"}`}>
                        {sub.status || "pending"}
                      </span>
                    </td>

                    {/* Actions: Approve & Reject */}
                    <td className="td-actions">
                      {isPending ? (
                        <div className="sub-action-group">
                          <button
                            type="button"
                            className="sub-btn-approve"
                            disabled={isActionBusy}
                            onClick={() => handleApprove(sub)}
                            title="Approve and publish to live website categories"
                          >
                            <Check size={14} strokeWidth={2.5} />
                            <span>{isActionBusy ? "Approving…" : "Approve"}</span>
                          </button>
                          <button
                            type="button"
                            className="sub-btn-reject"
                            disabled={isActionBusy}
                            onClick={() => handleReject(sub)}
                            title="Reject this submission"
                          >
                            <X size={14} strokeWidth={2.5} />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : isApproved ? (
                        <div className="sub-completed-badge is-approved">
                          <CheckCircle2 size={14} />
                          <span>Published</span>
                        </div>
                      ) : isRejected ? (
                        <div className="sub-action-group">
                          <span className="sub-completed-badge is-rejected">
                            <XCircle size={14} />
                            <span>Rejected</span>
                          </span>
                          <button
                            type="button"
                            className="sub-btn-reapprove"
                            disabled={isActionBusy}
                            onClick={() => handleApprove(sub)}
                            title="Re-approve and publish"
                          >
                            Approve
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}

      <style>{`
        .sites-admin-submissions-page {
          color: #F0F2F5;
          padding-bottom: 40px;
        }
        .sites-submissions-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
        }
        .sites-submissions-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 6px;
        }
        .sites-submissions-title {
          font-size: 24px;
          font-weight: 850;
          letter-spacing: -0.02em;
          margin: 0;
          color: #FFF;
        }
        .sites-submissions-badge {
          background: rgba(245, 166, 35, 0.12);
          border: 1px solid rgba(245, 166, 35, 0.3);
          color: #F5A623;
          font-size: 11px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 3px 8px;
          border-radius: 999px;
        }
        .sites-submissions-desc {
          font-size: 13.5px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
          max-width: 680px;
        }

        /* Feedback banner */
        .sites-feedback-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 16px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 650;
          margin-bottom: 18px;
          animation: feedbackFade 180ms ease-out;
        }
        @keyframes feedbackFade {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .sites-feedback-banner.is-success {
          background: rgba(46, 125, 50, 0.2);
          border: 1px solid rgba(74, 222, 128, 0.35);
          color: #4ADE80;
        }
        .sites-feedback-banner.is-error {
          background: rgba(220, 53, 69, 0.2);
          border: 1px solid rgba(255, 107, 107, 0.35);
          color: #FF6B6B;
        }
        .sites-feedback-banner.is-info {
          background: rgba(14, 165, 233, 0.18);
          border: 1px solid rgba(14, 165, 233, 0.35);
          color: #38BDF8;
        }

        /* Controls */
        .sites-submissions-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 20px;
        }
        .sites-submissions-tabs {
          display: flex;
          gap: 6px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 4px;
          border-radius: 12px;
        }
        .sites-tab-btn {
          appearance: none;
          background: transparent;
          border: 0;
          color: rgba(255, 255, 255, 0.65);
          padding: 7px 13px;
          border-radius: 8px;
          font: inherit;
          font-size: 12.5px;
          font-weight: 650;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          transition: all 140ms ease;
        }
        .sites-tab-btn:hover {
          color: #FFF;
          background: rgba(255, 255, 255, 0.06);
        }
        .sites-tab-btn.is-active {
          background: rgba(245, 166, 35, 0.15);
          color: #F5A623;
          border: 1px solid rgba(245, 166, 35, 0.3);
        }
        .sites-tab-count {
          font-size: 10.5px;
          font-weight: 750;
          padding: 1px 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          color: inherit;
        }
        .sites-tab-count.is-pending {
          background: rgba(245, 166, 35, 0.25);
          color: #F5A623;
        }
        .sites-tab-count.is-approved {
          background: rgba(74, 222, 128, 0.25);
          color: #4ADE80;
        }
        .sites-tab-count.is-rejected {
          background: rgba(255, 107, 107, 0.25);
          color: #FF6B6B;
        }

        /* Search input */
        .sites-submissions-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
          min-width: 280px;
          flex: 1;
          max-width: 440px;
        }
        .sites-submissions-search-icon {
          position: absolute;
          left: 12px;
          color: rgba(255, 255, 255, 0.4);
          pointer-events: none;
        }
        .sites-submissions-search-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 8px 32px 8px 34px;
          color: #FFF;
          font: inherit;
          font-size: 12.5px;
          outline: none;
          transition: border-color 140ms ease, background 140ms ease;
        }
        .sites-submissions-search-input:focus {
          border-color: #F5A623;
          background: rgba(255, 255, 255, 0.07);
        }
        .sites-submissions-search-clear {
          position: absolute;
          right: 8px;
          background: transparent;
          border: 0;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
        }
        .sites-submissions-search-clear:hover {
          color: #FFF;
        }

        /* Loading & Empty */
        .sites-submissions-loading {
          padding: 60px 20px;
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .sites-submissions-spinner {
          width: 26px;
          height: 26px;
          border: 2px solid rgba(245, 166, 35, 0.2);
          border-top-color: #F5A623;
          border-radius: 50%;
          animation: adminSpin 800ms linear infinite;
        }
        @keyframes adminSpin {
          to { transform: rotate(360deg); }
        }
        .sites-submissions-empty {
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 48px 24px;
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
        }
        .sites-empty-icon {
          color: rgba(245, 166, 35, 0.5);
          margin-bottom: 8px;
        }
        .sites-submissions-empty h3 {
          color: #FFF;
          margin: 0 0 6px;
          font-size: 16px;
        }
        .sites-submissions-empty p {
          margin: 0;
          font-size: 13px;
        }
        .sites-submissions-error-box {
          background: rgba(220, 53, 69, 0.15);
          border: 1px solid rgba(220, 53, 69, 0.3);
          color: #FF6B6B;
          padding: 16px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Table */
        .sites-submissions-table-wrap {
          background: #0d121f;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          overflow-x: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        .sites-submissions-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }
        .sites-submissions-table thead tr {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.02);
        }
        .sites-submissions-table th {
          padding: 12px 14px;
          color: rgba(255, 255, 255, 0.55);
          font-size: 11px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }
        .sites-submissions-table th.th-actions {
          text-align: right;
          padding-right: 20px;
        }
        .sites-submissions-table tbody tr {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: background 120ms ease;
        }
        .sites-submissions-table tbody tr:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .sites-submissions-table td {
          padding: 14px;
          vertical-align: middle;
        }

        /* Cells */
        .td-name {
          min-width: 190px;
        }
        .sub-title-row {
          margin-bottom: 3px;
        }
        .sub-site-name {
          color: #FFF;
          font-size: 14px;
          font-weight: 800;
        }
        .sub-site-url {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #F5A623;
          text-decoration: none;
          font-size: 11.5px;
          word-break: break-all;
          max-width: 220px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sub-site-url:hover {
          text-decoration: underline;
        }

        .td-category {
          min-width: 160px;
        }
        .sub-cat-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.06);
          color: #E2E8F0;
          font-size: 12px;
          font-weight: 650;
        }
        .sub-subcat-badge {
          display: block;
          margin-top: 4px;
          color: rgba(245, 166, 35, 0.9);
          font-size: 11px;
          font-weight: 600;
        }

        .td-desc {
          min-width: 200px;
          max-width: 280px;
        }
        .sub-desc-text {
          margin: 0;
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .td-note {
          min-width: 170px;
          max-width: 240px;
        }
        .sub-note-box {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.65);
          font-style: italic;
          background: rgba(255, 255, 255, 0.03);
          border-left: 2px solid #F5A623;
          padding: 4px 8px;
          border-radius: 4px;
          line-height: 1.35;
        }
        .sub-note-icon {
          flex-shrink: 0;
          color: #F5A623;
          margin-top: 2px;
        }
        .sub-empty-dash {
          color: rgba(255, 255, 255, 0.25);
        }

        .td-date {
          min-width: 140px;
          white-space: nowrap;
        }
        .sub-date-text {
          display: block;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
        }
        .sub-submitter-email {
          display: block;
          font-size: 10.5px;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 2px;
        }

        .td-status {
          min-width: 100px;
        }
        .sub-status-pill {
          display: inline-block;
          padding: 3px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 750;
          text-transform: capitalize;
          letter-spacing: 0.02em;
        }
        .sub-status-pill.is-pending {
          background: rgba(245, 166, 35, 0.15);
          color: #F5A623;
          border: 1px solid rgba(245, 166, 35, 0.3);
        }
        .sub-status-pill.is-approved {
          background: rgba(46, 125, 50, 0.2);
          color: #4ADE80;
          border: 1px solid rgba(74, 222, 128, 0.3);
        }
        .sub-status-pill.is-rejected {
          background: rgba(220, 53, 69, 0.2);
          color: #FF6B6B;
          border: 1px solid rgba(255, 107, 107, 0.3);
        }

        .td-actions {
          text-align: right;
          padding-right: 20px;
          min-width: 170px;
        }
        .sub-action-group {
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }
        .sub-btn-approve {
          appearance: none;
          background: linear-gradient(180deg, #10B981, #059669);
          border: 0;
          color: #FFF;
          padding: 6px 12px;
          border-radius: 7px;
          font: inherit;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
          transition: filter 140ms ease, transform 140ms ease;
        }
        .sub-btn-approve:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-0.5px);
        }
        .sub-btn-reject {
          appearance: none;
          background: rgba(220, 53, 69, 0.15);
          border: 1px solid rgba(220, 53, 69, 0.35);
          color: #FF6B6B;
          padding: 6px 11px;
          border-radius: 7px;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: background 140ms ease, color 140ms ease;
        }
        .sub-btn-reject:hover:not(:disabled) {
          background: rgba(220, 53, 69, 0.28);
          color: #FFF;
        }
        .sub-btn-reapprove {
          appearance: none;
          background: transparent;
          border: 1px solid rgba(74, 222, 128, 0.4);
          color: #4ADE80;
          padding: 4px 8px;
          border-radius: 6px;
          font: inherit;
          font-size: 11px;
          font-weight: 650;
          cursor: pointer;
        }
        .sub-btn-reapprove:hover:not(:disabled) {
          background: rgba(74, 222, 128, 0.15);
        }
        .sub-btn-approve:disabled,
        .sub-btn-reject:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .sub-completed-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 700;
        }
        .sub-completed-badge.is-approved {
          color: #4ADE80;
        }
        .sub-completed-badge.is-rejected {
          color: #FF6B6B;
        }

        /* Bulk Action Bar */
        .sites-bulk-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, rgba(245, 166, 35, 0.16), rgba(13, 18, 31, 0.95));
          border: 1px solid rgba(245, 166, 35, 0.4);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 16px rgba(245, 166, 35, 0.15);
          padding: 10px 16px;
          border-radius: 12px;
          margin-bottom: 14px;
          animation: feedbackFade 180ms ease-out;
        }
        .sites-bulk-count {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: #FFF;
        }
        .sites-bulk-badge {
          background: #F5A623;
          color: #000;
          font-size: 11px;
          font-weight: 850;
          padding: 2px 7px;
          border-radius: 999px;
        }
        .sites-bulk-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sites-bulk-btn {
          appearance: none;
          border: 0;
          padding: 6px 12px;
          border-radius: 7px;
          font: inherit;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 140ms ease;
        }
        .sites-bulk-btn.is-approve {
          background: linear-gradient(180deg, #10B981, #059669);
          color: #FFF;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }
        .sites-bulk-btn.is-approve:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-0.5px);
        }
        .sites-bulk-btn.is-reject {
          background: rgba(220, 53, 69, 0.2);
          border: 1px solid rgba(220, 53, 69, 0.4);
          color: #FF6B6B;
        }
        .sites-bulk-btn.is-reject:hover:not(:disabled) {
          background: rgba(220, 53, 69, 0.35);
          color: #FFF;
        }
        .sites-bulk-btn.is-clear {
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 600;
        }
        .sites-bulk-btn.is-clear:hover:not(:disabled) {
          color: #FFF;
        }
        .sites-bulk-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Checkbox styling */
        .sites-sub-checkbox {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: #F5A623;
          border-radius: 4px;
        }
        .is-selected-row {
          background: rgba(245, 166, 35, 0.08) !important;
        }

        @media (max-width: 768px) {
          .sites-submissions-controls {
            flex-direction: column;
            align-items: stretch;
          }
          .sites-submissions-search-wrap {
            max-width: 100%;
          }
          .sites-submissions-tabs {
            overflow-x: auto;
            scrollbar-width: none;
          }
        }
      `}</style>
    </div>
  );
}
