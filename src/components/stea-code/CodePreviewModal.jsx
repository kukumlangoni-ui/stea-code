import React, { useEffect, useRef, useState } from "react";
import { X, Copy, Check, Download, ExternalLink } from "lucide-react";

/* Apply or remove the sc-locked-scroll body class (page behind stops scrolling). */
function useBodyLock(active) {
  useEffect(() => {
    if (!active) return;
    const doc = typeof document !== "undefined" ? document : null;
    if (!doc) return;
    const htmlEl = doc.documentElement;
    const { classList } = doc.body;
    classList.add("sc-locked-scroll");
    htmlEl.classList.add("sc-locked-scroll");
    const prevOverflow = [doc.body.style.overflow, htmlEl.style.overflow];
    doc.body.style.overflow = "hidden";
    htmlEl.style.overflow = "hidden";
    return () => {
      classList.remove("sc-locked-scroll");
      htmlEl.classList.remove("sc-locked-scroll");
      [doc.body.style.overflow, htmlEl.style.overflow] = prevOverflow;
    };
  }, [active]);
}

/* Trap focus inside a container. Escape = onClose. */
function useModalA11y(containerRef, onClose) {
  useEffect(() => {
    if (!containerRef?.current) return;
    const root = containerRef.current;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = root.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey, true);
    // autofocus first reasonable target
    const initialFocus =
      root.querySelector('button:not([disabled])[aria-label="Close"]') ||
      root.querySelector('button:not([disabled])') ||
      root;
    setTimeout(() => initialFocus?.focus?.(), 8);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [containerRef, onClose]);
}

function codeText(item) {
  return (
    item.copyableCode ||
    item.codeReact ||
    item.codeJs ||
    item.codeCss ||
    item.codeHtml ||
    item.codeOther ||
    item.code ||
    ""
  );
}

/**
 * CodePreviewModal — large premium code preview modal.
 *
 * Tabs: Preview | HTML | CSS | JS | React | Other | Install | Usage
 * Only tabs with content are rendered.
 */
export default function CodePreviewModal({ item, onClose }) {
  const [tab, setTab] = useState("Preview");
  const [copied, setCopied] = useState(false);
  const containerRef = useRef(null);
  useBodyLock(Boolean(item));
  useModalA11y(containerRef, onClose);

  if (!item) return null;

  const tabs = [
    { name: "Preview", key: "Preview", content: null },
    { name: "HTML", key: "HTML", content: item.codeHtml },
    { name: "CSS", key: "CSS", content: item.codeCss },
    { name: "JS", key: "JS", content: item.codeJs },
    { name: "React", key: "React", content: item.codeReact },
    { name: "Other", key: "Other", content: item.codeOther },
  ].filter((t) => t.name === "Preview" || (t.content && String(t.content).trim()));

  const installBlock = [item.dependencies, item.installationInstructions]
    .filter(Boolean)
    .join("\n\n");
  if (installBlock.trim()) tabs.push({ name: "Install", key: "Install", content: installBlock });

  if (item.usageInstructions)
    tabs.push({ name: "Usage", key: "Usage", content: item.usageInstructions });

  const fallbackCode = !item.codeHtml && !item.codeCss && !item.codeJs && !item.codeReact && !item.codeOther && item.code;
  if (fallbackCode) tabs.push({ name: "Code", key: "Code", content: item.code });

  const copyBlock = async () => {
    let text = "";
    if (tab === "Preview") {
      text = codeText(item);
    } else {
      const found = tabs.find((t) => t.key === tab);
      text = found ? found.content || "" : "";
    }
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      console.warn("Copy failed", e);
    }
  };

  return (
    <div className="sc-modal-shell" role="dialog" aria-modal="true" aria-labelledby="sc-modal-title">
      <button
        type="button"
        className="sc-modal-backdrop"
        onClick={onClose}
        aria-label="Close preview"
      />
      <section className="sc-modal sc-modal-large" ref={containerRef}>
        <header className="sc-modal-head">
          <div>
            <span className="sc-modal-framework">{item.framework || item.category || "Code"}</span>
            <h2 id="sc-modal-title">{item.title}</h2>
            <p>{item.description}</p>
          </div>
          <button type="button" className="sc-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="sc-tabs" role="tablist">
          {tabs.map((t) => (
            <button
              role="tab"
              type="button"
              key={t.key}
              className={tab === t.key ? "active" : ""}
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className="sc-modal-body">
          {tab === "Preview" ? (
            <div className="sc-live-preview">
              <div className="sc-preview-chip" aria-hidden="true">
                {item.category}
              </div>
              {item.previewImageUrl || item.thumbnailUrl ? (
                <img
                  src={item.previewImageUrl || item.thumbnailUrl}
                  alt=""
                  loading="lazy"
                />
              ) : (
                <strong className="sc-preview-placeholder">{item.preview || item.title}</strong>
              )}
              <p className="sc-preview-desc">{item.fullDescription || item.description}</p>
              {(item.tags?.length > 0) && (
                <div className="sc-preview-tags">
                  {item.tags.slice(0, 10).map((tag) => (
                    <span key={tag} className="sc-tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="sc-code-block-wrap">
              <pre className="sc-code-block">
                <code>{tabs.find((t) => t.key === tab)?.content}</code>
              </pre>
              <button type="button" className="sc-code-copy-btn" onClick={copyBlock} aria-label="Copy code">
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          )}
        </div>

        <footer className="sc-modal-actions">
          {item.demoUrl && (
            <a className="sc-secondary-action" href={item.demoUrl} target="_blank" rel="noopener noreferrer">
              Live Demo <ExternalLink size={14} />
            </a>
          )}
          {item.sourceUrl && (
            <a className="sc-secondary-action" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
              Source <ExternalLink size={14} />
            </a>
          )}
          {item.downloadUrl && (
            <a className="sc-secondary-action" href={item.downloadUrl} target="_blank" rel="noopener noreferrer">
              Download <Download size={14} />
            </a>
          )}
          <button type="button" className="sc-primary" onClick={copyBlock}>
            {copied ? <Check size={16} /> : <Copy size={16} />} Copy Code
          </button>
        </footer>
      </section>
    </div>
  );
}
