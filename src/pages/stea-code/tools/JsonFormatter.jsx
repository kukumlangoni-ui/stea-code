import React, { useState } from "react";
import { AlertCircle, Check, CheckCircle2, Copy, FileCode2, Minimize2, Trash2 } from "lucide-react";

const SAMPLE_JSON = `{
  "product": "steacode",
  "version": "1.0.0",
  "features": [
    "Components",
    "Animations",
    "Tools",
    "Prebuilt Kits"
  ],
  "author": {
    "organization": "STEA Africa",
    "country": "Tanzania"
  },
  "isLive": true
}`;

export default function JsonFormatter() {
  const [input, setInput] = useState(SAMPLE_JSON);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);

  const formatJson = () => {
    setError("");
    setStatus("");
    if (!input.trim()) {
      setError("Please paste or type JSON data first.");
      return;
    }
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, 2);
      setInput(formatted);
      setStatus("Formatted successfully ✓");
    } catch (err) {
      setError(err.message || "Invalid JSON syntax");
    }
  };

  const minifyJson = () => {
    setError("");
    setStatus("");
    if (!input.trim()) {
      setError("Please paste or type JSON data first.");
      return;
    }
    try {
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setInput(minified);
      setStatus("Minified successfully ✓");
    } catch (err) {
      setError(err.message || "Invalid JSON syntax");
    }
  };

  const validateJson = () => {
    setError("");
    setStatus("");
    if (!input.trim()) {
      setError("Please paste or type JSON data first.");
      return;
    }
    try {
      JSON.parse(input);
      setStatus("Valid JSON syntax ✓");
    } catch (err) {
      setError(err.message || "Invalid JSON syntax");
    }
  };

  const copyResult = () => {
    if (!input.trim()) return;
    navigator.clipboard.writeText(input).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const clearAll = () => {
    setInput("");
    setError("");
    setStatus("");
  };

  return (
    <div className="sc-tool-container">
      <div className="sc-tool-header">
        <span className="sc-tool-badge">Data Tool</span>
        <h1 className="sc-tool-title">JSON Formatter & Validator</h1>
        <p className="sc-tool-sub">
          Format, validate, minify, and inspect JSON payloads cleanly right in your browser with zero latency.
        </p>
      </div>

      <div className="sc-tool-workspace is-single-col">
        {/* Toolbar */}
        <div className="sc-tool-actions-bar">
          <div className="sc-tool-actions-left">
            <button
              type="button"
              className="sc-tool-action-btn is-primary"
              onClick={formatJson}
            >
              <FileCode2 size={14} /> Format (2 Spaces)
            </button>
            <button
              type="button"
              className="sc-tool-action-btn"
              onClick={minifyJson}
            >
              <Minimize2 size={14} /> Minify
            </button>
            <button
              type="button"
              className="sc-tool-action-btn"
              onClick={validateJson}
            >
              <CheckCircle2 size={14} /> Validate
            </button>
          </div>

          <div className="sc-tool-actions-right">
            <button
              type="button"
              className={`sc-tool-copy-btn ${copied ? "is-copied" : ""}`}
              onClick={copyResult}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? "Copied!" : "Copy JSON"}</span>
            </button>
            <button
              type="button"
              className="sc-tool-clear-btn"
              onClick={clearAll}
              title="Clear editor"
            >
              <Trash2 size={14} /> Clear
            </button>
          </div>
        </div>

        {/* Status / Error feedback */}
        {error ? (
          <div className="sc-tool-feedback is-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        ) : status ? (
          <div className="sc-tool-feedback is-success">
            <CheckCircle2 size={16} />
            <span>{status}</span>
          </div>
        ) : null}

        {/* Textarea */}
        <div className="sc-tool-editor-wrap">
          <textarea
            className="sc-tool-textarea"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError("");
              setStatus("");
            }}
            placeholder="Paste raw JSON here…"
            rows={18}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
