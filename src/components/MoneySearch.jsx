/**
 * MoneySearch.jsx — STEA Africa
 * Working search component for Abroad Money Guide
 * Features: debounce, live filter, detail card, error/empty states
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, ChevronRight,
  CheckCircle, AlertTriangle, Loader2, MessageCircle,
} from "lucide-react";

import MONEY_METHODS_RAW from "../data/moneyMethods.json";

const G    = "#F5A623";
const CARD = "#0d0f1a";
const BORDER = "rgba(255,255,255,0.07)";

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce(value, ms) {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return dv;
}

// ── Fuzzy-like filter ──────────────────────────────────────────────────────────
function filterMethods(methods, query) {
  if (!query || query.trim().length < 1) return methods;
  const q = query.toLowerCase().trim();
  return (methods || []).filter(m => {
    if (!m) return false;
    const name    = (m.name        || "").toLowerCase();
    const desc    = (m.description || "").toLowerCase();
    const type    = (m.type        || "").toLowerCase();
    const bestFor = (m.bestFor     || []).join(" ").toLowerCase();
    const countries = (m.countries || []).join(" ").toLowerCase();
    const keywords  = (m.keywords  || []).join(" ").toLowerCase();
    return (
      name.includes(q)     ||
      desc.includes(q)     ||
      type.includes(q)     ||
      bestFor.includes(q)  ||
      countries.includes(q)||
      keywords.includes(q)
    );
  });
}

// ── Detail Card ───────────────────────────────────────────────────────────────
function MethodDetailCard({ method, onClose }) {
  if (!method) return null;
  const diffColor = {
    easy:   "#10b981",
    medium: "#f59e0b",
    hard:   "#ef4444",
  }[method.difficulty] || G;
  const diffLabel = { easy: "Rahisi", medium: "Ya Wastani", hard: "Ngumu" }[method.difficulty] || method.difficulty;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: 8 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: CARD,
        border: `1px solid ${method.color || G}40`,
        borderRadius: 20,
        overflow: "hidden",
        marginTop: 12,
        boxShadow: `0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px ${method.color || G}20`,
      }}
    >
      {/* Top accent */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${method.color || G}, transparent)` }} />

      <div style={{ padding: "20px 22px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 36, lineHeight: 1, flexShrink: 0 }}>{method.emoji || "💳"}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 4px", color: "#fff" }}>
              {method.name}
            </h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: `${method.color || G}18`, border: `1px solid ${method.color || G}30`, color: method.color || G, fontWeight: 700 }}>
                {method.type === "china" ? "🇨🇳 China" : method.type === "mobile" ? "📱 Mobile Money" : method.type === "manual" ? "🤝 Wakala" : "🌍 Platform"}
              </span>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: `${diffColor}15`, border: `1px solid ${diffColor}25`, color: diffColor, fontWeight: 700 }}>
                {diffLabel}
              </span>
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: BORDER, color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>

        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.65, marginBottom: 16 }}>
          {method.description}
        </p>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Muda", value: method.speed },
            { label: "Ada", value: method.fees },
          ].map(({ label, value }) => value ? (
            <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: BORDER, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{value}</div>
            </div>
          ) : null)}
        </div>

        {/* Strengths */}
        {(method.strengths || []).length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: "#10b981", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Faida</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(method.strengths || []).map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <CheckCircle size={13} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Limitations */}
        {(method.limitations || []).length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: "#f87171", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Tahadhari</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(method.limitations || []).map((l, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <AlertTriangle size={13} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {method.waLink && (
          <a href={method.waLink} target="_blank" rel="noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", padding: "12px 20px", background: `linear-gradient(135deg, ${G}, #FFD17C)`, color: "#111", fontWeight: 900, fontSize: 14, borderRadius: 12, textDecoration: "none", transition: "opacity .2s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            <MessageCircle size={16} /> Niambie Zaidi — WhatsApp
          </a>
        )}
      </div>
    </motion.div>
  );
}

// ── Result Item ───────────────────────────────────────────────────────────────
function ResultItem({ method, onClick, active }) {
  return (
    <div
      onClick={() => onClick(method)}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "11px 14px", borderRadius: 10, cursor: "pointer",
        background: active ? `${G}12` : "transparent",
        transition: "background 0.1s",
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{method.emoji || "💳"}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: active ? "#fff" : "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {method.name}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
          {(method.description || "").substring(0, 55)}{(method.description || "").length > 55 ? "…" : ""}
        </div>
      </div>
      <ChevronRight size={15} color={active ? G : "rgba(255,255,255,0.25)"} style={{ flexShrink: 0 }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function MoneySearch({ initialData = null, placeholder = "Tafuta njia ya kutuma pesa... (mf. PayPal, China, Alipay)" }) {
  const [query,    setQuery]    = useState("");
  const [methods,  setMethods]  = useState(initialData || []);
  const [loading,  setLoading]  = useState(!initialData);
  const [error,    setError]    = useState(null);
  const [results,  setResults]  = useState([]);
  const [selected, setSelected] = useState(null);
  const [showDrop, setShowDrop] = useState(false);
  const searchRef = useRef(null);
  const dq = useDebounce(query, 280);

  // Load data
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      console.log("[MoneySearch] Using provided data:", initialData.length, "methods");
      setMethods(initialData);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setTimeout(() => {
      if (cancelled) return;
      const data = Array.isArray(MONEY_METHODS_RAW) ? MONEY_METHODS_RAW : [];
      console.log("[MoneySearch] Loaded", data.length, "methods from JSON");
      setMethods(data);
      setLoading(false);
    }, 0);
    return () => { cancelled = true; };
  }, [initialData]);

  // Run search
  useEffect(() => {
    const q = dq.trim();
    if (!q || q.length < 1) {
      setResults([]);
      setShowDrop(false);
      return;
    }
    const filtered = filterMethods(methods, q);
    console.log("[MoneySearch] Query:", q, "→ Results:", filtered.length);
    setResults(filtered);
    setShowDrop(true);
    setSelected(null); // clear detail when query changes
  }, [dq, methods]);

  // Close dropdown on outside click
  useEffect(() => {
    const fn = e => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const handleSelect = useCallback(method => {
    console.log("[MoneySearch] Selected:", method?.name);
    setSelected(method);
    setShowDrop(false);
    setQuery(method?.name || "");
  }, []);

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setSelected(null);
    setShowDrop(false);
  };

  // Error state
  if (error) {
    return (
      <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: "20px 22px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <AlertTriangle size={20} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#f87171", marginBottom: 4 }}>Huduma hazipatikani kwa sasa</div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0 }}>Wasiliana nasi kupitia WhatsApp kwa msaada wa moja kwa moja.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={searchRef} style={{ position: "relative" }}>
      {/* Search input */}
      <div style={{
        display: "flex", alignItems: "center",
        background: "rgba(255,255,255,0.05)",
        border: `1px solid ${showDrop && results.length > 0 ? `${G}50` : "rgba(255,255,255,0.1)"}`,
        borderRadius: 16, overflow: "hidden",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: showDrop && results.length > 0 ? `0 0 0 3px ${G}15` : "none",
      }}>
        <span style={{ padding: "0 14px 0 18px", display: "flex", alignItems: "center", flexShrink: 0, color: query ? G : "rgba(255,255,255,0.3)", transition: "color 0.2s" }}>
          {loading
            ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}><Loader2 size={18} /></motion.div>
            : <Search size={18} />}
        </span>
        <input
          type="search"
          autoComplete="off"
          spellCheck="false"
          value={query}
          onChange={e => { setQuery(e.target.value); if (e.target.value.trim()) setShowDrop(true); }}
          onFocus={() => { if (results.length > 0) setShowDrop(true); }}
          placeholder={loading ? "Inapakia..." : placeholder}
          disabled={loading}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: "#fff", fontSize: 15, padding: "15px 0",
            fontFamily: "inherit", caretColor: G, minWidth: 0,
          }}
        />
        {query && (
          <button onClick={handleClear}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", padding: "0 14px", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Quick filters */}
      {!query && !loading && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {[
            { label: "🇨🇳 China", q: "china" },
            { label: "🌍 International", q: "global" },
            { label: "💳 PayPal", q: "paypal" },
            { label: "🤝 Wakala", q: "wakala" },
            { label: "📱 Mobile", q: "mobile" },
          ].map(({ label, q }) => (
            <button key={q} onClick={() => { setQuery(q); }}
              style={{ padding: "6px 14px", borderRadius: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = `${G}12`; e.currentTarget.style.borderColor = `${G}30`; e.currentTarget.style.color = G; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Dropdown results */}
      <AnimatePresence>
        {showDrop && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 400,
              background: "#0e101a", border: `1px solid ${G}30`,
              borderRadius: 16, padding: 6, maxHeight: 280, overflowY: "auto",
              boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 20px ${G}08`,
              scrollbarWidth: "thin",
            }}>
            {results.map((m, i) => (
              <ResultItem key={m?.id || i} method={m} onClick={handleSelect} active={selected?.id === m?.id} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* No results */}
      <AnimatePresence>
        {showDrop && dq.trim().length > 0 && results.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 400,
              background: "#0e101a", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14, padding: "20px", textAlign: "center",
              boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
              Hakuna matokeo ya &quot;{dq}&quot;
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              Jaribu: &quot;PayPal&quot;, &quot;China&quot;, &quot;bank&quot;, au &quot;wakala&quot;
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail card */}
      <AnimatePresence>
        {selected && (
          <MethodDetailCard method={selected} onClose={() => { setSelected(null); setQuery(""); }} />
        )}
      </AnimatePresence>
    </div>
  );
}
