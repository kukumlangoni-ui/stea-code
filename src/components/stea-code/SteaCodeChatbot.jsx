/* ======================================================================
 * steacode Chatbot — floating assistant widget.
 *
 * Behavior:
 *   - Uses the user's custom icon (blue bubble with two eyes).
 *   - Floats and gently "hangs around" the app: idle bobbing + occasional
 *     drift to a new spot near the screen edges (pure CSS transition).
 *   - Fully draggable with pointer events; drag vs click distinguished by
 *     a movement threshold.
 *   - Click → opens the chat panel; bot powered by steaChatbotBrain.
 *   - Honors prefers-reduced-motion (no bob, no wander).
 *   - Position persisted in localStorage.
 * =================================================================== */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useSteaCodeI18n } from "./useSteaCodeI18n.js";
import { answerQuery, getWelcome, getSuggestions } from "../../services/steaChatbotBrain.js";
import "./stea-chatbot.css";

const CHATBOT_ICON = "/stea-chatbot-icon.png?v=2";
const POS_KEY = "stea-code:chatbot-pos";
const TEASER_KEY = "stea-code:chatbot-teaser-seen";

const BUBBLE_SIZE = 62;
const MARGIN = 16;

function clampPos(x, y) {
  const w = typeof window !== "undefined" ? window.innerWidth : 1024;
  const h = typeof window !== "undefined" ? window.innerHeight : 768;
  const maxX = Math.max(MARGIN, w - BUBBLE_SIZE - MARGIN);
  const maxY = Math.max(MARGIN, h - BUBBLE_SIZE - MARGIN);
  return {
    x: Math.min(Math.max(MARGIN, x), maxX),
    y: Math.min(Math.max(MARGIN, y), maxY),
  };
}

function defaultPos() {
  if (typeof window === "undefined") return { x: 32, y: 32 };
  return clampPos(window.innerWidth - BUBBLE_SIZE - 24, window.innerHeight - BUBBLE_SIZE - 28);
}

function readStoredPos() {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (typeof p?.x === "number" && typeof p?.y === "number") return clampPos(p.x, p.y);
  } catch { /* ignore */ }
  return null;
}

/** Render **bold** and `code` markdown-lite into spans. */
function renderRich(text) {
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g;
  let last = 0;
  let m;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={key++}>{text.slice(last, m.index)}</span>);
    const tok = m[0];
    if (tok.startsWith("**")) parts.push(<strong key={key++}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) parts.push(<code key={key++}>{tok.slice(1, -1)}</code>);
    else parts.push(<em key={key++}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(<span key={key++}>{text.slice(last)}</span>);
  return parts;
}

function renderMultiline(text) {
  return String(text).split("\n").map((line, i) => (
    <React.Fragment key={i}>
      {i > 0 && <br />}
      {line.length ? renderRich(line) : null}
    </React.Fragment>
  ));
}

let msgUid = 0;

export default function SteaCodeChatbot({ onCommand, reduceMotion = false }) {
  const { uiLocale } = useSteaCodeI18n();
  const locale = uiLocale === "zhCN" ? "zhCN" : "en";
  const t = useMemo(() => (v) => (v && typeof v === "object" ? (v[locale] || v.en || "") : v), [locale]);

  /* ---------------- open state + messages ---------------- */
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [teaserVisible, setTeaserVisible] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const welcomeSentRef = useRef(false);

  /* ---------------- position + drag ---------------- */
  const [pos, setPos] = useState(() => readStoredPos() || defaultPos());
  const [dragging, setDragging] = useState(false);
  const dragState = useRef(null); // { startX, startY, origX, origY, moved }
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    try { localStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch { /* ignore */ }
  }, [pos]);

  // Clamp on resize (window could shrink, mobile rotate).
  useEffect(() => {
    const onResize = () => setPos((p) => clampPos(p.x, p.y));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ---------------- idle wander ("hanging around") ---------------- */
  useEffect(() => {
    if (reduceMotion) return undefined;
    const WANDER_MS = 11000;
    let paused = false;
    const onVis = () => { paused = document.hidden; };
    document.addEventListener("visibilitychange", onVis);
    const timer = window.setInterval(() => {
      if (paused || openRef.current || dragState.current) return;
      setPos((cur) => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const maxX = Math.max(MARGIN, w - BUBBLE_SIZE - MARGIN);
        const maxY = Math.max(MARGIN, h - BUBBLE_SIZE - MARGIN);
        // Pick a new spot near the edges, at least 140px away.
        let nx = 0;
        let ny = 0;
        for (let i = 0; i < 12; i++) {
          const edge = Math.floor(Math.random() * 4);
          if (edge === 0) { nx = MARGIN; ny = MARGIN + Math.random() * (maxY - MARGIN); }
          else if (edge === 1) { nx = maxX; ny = MARGIN + Math.random() * (maxY - MARGIN); }
          else if (edge === 2) { nx = MARGIN + Math.random() * (maxX - MARGIN); ny = MARGIN; }
          else { nx = MARGIN + Math.random() * (maxX - MARGIN); ny = maxY; }
          if (Math.hypot(nx - cur.x, ny - cur.y) > 140) break;
        }
        return clampPos(nx, ny);
      });
    }, WANDER_MS);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reduceMotion]);

  /* ---------------- teaser bubble ---------------- */
  useEffect(() => {
    let shown = false;
    try { shown = localStorage.getItem(TEASER_KEY) === "1"; } catch { /* ignore */ }
    if (shown) return undefined;
    const showTimer = window.setTimeout(() => setTeaserVisible(true), 4200);
    const hideTimer = window.setTimeout(() => setTeaserVisible(false), 11000);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  const dismissTeaser = () => {
    setTeaserVisible(false);
    try { localStorage.setItem(TEASER_KEY, "1"); } catch { /* ignore */ }
  };

  /* ---------------- drag handlers ---------------- */
  const onPointerDown = useCallback((e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      moved: false,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }, [pos.x, pos.y]);

  const onPointerMove = useCallback((e) => {
    const ds = dragState.current;
    if (!ds) return;
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;
    if (!ds.moved && Math.hypot(dx, dy) < 7) return;
    ds.moved = true;
    setDragging(true);
    setPos(clampPos(ds.origX + dx, ds.origY + dy));
  }, []);

  const onPointerUp = useCallback(() => {
    const ds = dragState.current;
    dragState.current = null;
    setDragging(false);
    if (ds && !ds.moved) {
      // Treated as a click → toggle the chat.
      dismissTeaser();
      setOpen((v) => !v);
    }
  }, []);

  /* ---------------- chat core ---------------- */
  const pushBot = useCallback((answer, delay = 480) => {
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [...prev, { id: ++msgUid, role: "bot", ...answer }]);
    }, delay + Math.min(500, String(answer.text || "").length * 4));
  }, []);

  // Welcome message when opened the first time.
  useEffect(() => {
    if (!open || welcomeSentRef.current) return;
    welcomeSentRef.current = true;
    setMessages([{ id: ++msgUid, role: "bot", text: getWelcome(locale), chips: getSuggestions(locale) }]);
  }, [open, locale]);

  // Scroll to bottom on new messages / typing.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing, open]);

  // Focus input when opened.
  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 180);
  }, [open]);

  const runAction = useCallback((action) => {
    if (!action) return;
    if (typeof onCommand === "function") onCommand(action);
  }, [onCommand]);

  const send = useCallback((raw) => {
    const q = String(raw || "").trim();
    if (!q) return;
    setInput("");
    setTeaserVisible(false);
    setMessages((prev) => [...prev, { id: ++msgUid, role: "user", text: q }]);
    // Reply in the language the user wrote: CJK input → Chinese, otherwise
    // follow the UI locale (sw falls back to en, matching the app).
    const answerLocale = /[\u4e00-\u9fff]/.test(q) ? "zhCN" : locale;
    const answer = answerQuery(q, answerLocale) || { text: getWelcome(answerLocale), chips: getSuggestions(answerLocale) };
    pushBot(answer);
  }, [locale, pushBot]);

  const onInputKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const suggestions = useMemo(() => getSuggestions(locale), [locale]);

  /* ---------------- panel placement ---------------- */
  // Panel flips left/side so it never leaves the viewport.
  const flipX = pos.x > (typeof window !== "undefined" ? window.innerWidth : 1024) / 2;
  const flipY = pos.y > (typeof window !== "undefined" ? window.innerHeight : 768) / 2;
  const panelStyle = flipX
    ? (flipY
      ? { right: (typeof window !== "undefined" ? window.innerWidth : 1024) - pos.x - BUBBLE_SIZE + 4, bottom: (typeof window !== "undefined" ? window.innerHeight : 768) - pos.y + 10 }
      : { right: (typeof window !== "undefined" ? window.innerWidth : 1024) - pos.x - BUBBLE_SIZE + 4, top: pos.y - 10 })
    : (flipY
      ? { left: pos.x - 4, bottom: (typeof window !== "undefined" ? window.innerHeight : 768) - pos.y + 10 }
      : { left: pos.x - 4, top: pos.y - 10 });

  return (
    <div className={"sc-chat-root" + (open ? " sc-chat-open" : "")}>
      {/* Chat panel */}
      {open && (
        <div
          className="sc-chat-panel"
          style={panelStyle}
          role="dialog"
          aria-label="steacode assistant"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="sc-chat-head">
            <img className="sc-chat-head-avatar" src={CHATBOT_ICON} alt="" />
            <div className="sc-chat-head-text">
              <div className="sc-chat-head-name">Stea</div>
              <div className="sc-chat-head-sub">{t({ en: "steacode assistant · online", zhCN: "steacode 助手 · 在线" })}</div>
            </div>
            <button
              className="sc-chat-head-close"
              onClick={() => setOpen(false)}
              aria-label={t({ en: "Close chat", zhCN: "关闭聊天" })}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="sc-chat-list" ref={listRef}>
            {messages.map((m) => (
              <div key={m.id} className={`sc-chat-msg sc-chat-msg-${m.role}`}>
                {m.role === "bot" && (
                  <img className="sc-chat-msg-avatar" src={CHATBOT_ICON} alt="" />
                )}
                <div className="sc-chat-msg-bubble">
                  <div className="sc-chat-msg-text">{renderMultiline(m.text)}</div>
                  {Array.isArray(m.actions) && m.actions.length > 0 && (
                    <div className="sc-chat-msg-actions">
                      {m.actions.map((a, i) => (
                        <button key={i} className="sc-chat-action-btn" onClick={() => runAction(a)}>
                          {a.label}
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                        </button>
                      ))}
                    </div>
                  )}
                  {Array.isArray(m.chips) && m.chips.length > 0 && (
                    <div className="sc-chat-msg-chips">
                      {m.chips.map((c, i) => (
                        <button key={i} className="sc-chat-chip" onClick={() => send(c)}>{c}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="sc-chat-msg sc-chat-msg-bot">
                <img className="sc-chat-msg-avatar" src={CHATBOT_ICON} alt="" />
                <div className="sc-chat-msg-bubble sc-chat-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
          </div>

          <div className="sc-chat-inputrow">
            <input
              ref={inputRef}
              className="sc-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onInputKey}
              placeholder={t({ en: "Ask me anything about steacode…", zhCN: "关于 steacode 随便问我…" })}
              maxLength={500}
            />
            <button
              className="sc-chat-send"
              onClick={() => send(input)}
              disabled={!input.trim()}
              aria-label={t({ en: "Send", zhCN: "发送" })}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4Z" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Teaser bubble */}
      {teaserVisible && !open && (
        <button
          className="sc-chat-teaser"
          style={{ left: pos.x + BUBBLE_SIZE - 8, top: pos.y - 6 }}
          onClick={() => { dismissTeaser(); setOpen(true); }}
        >
          {t({ en: "Hi! Need a hand? 👋", zhCN: "嗨！需要帮忙吗？👋" })}
        </button>
      )}

      {/* Floating bubble */}
      <button
        className={
          "sc-chat-bubble" +
          (dragging ? " sc-chat-dragging" : "") +
          (reduceMotion ? " sc-chat-nomotion" : "")
        }
        style={{ left: pos.x, top: pos.y, width: BUBBLE_SIZE, height: BUBBLE_SIZE }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((v) => !v); } }}
        aria-label="Open steacode assistant"
        title="Stea — steacode assistant"
      >
        <img src={CHATBOT_ICON} alt="" draggable={false} />
        <span className="sc-chat-dot" aria-hidden="true" />
      </button>
    </div>
  );
}
