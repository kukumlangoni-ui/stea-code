/**
 * Shared preview-document builders for STEA Code.
 *
 * Used by:
 *   - Admin Product Studio (live preview iframe)
 *   - Public STEA Code card & detail previews
 *
 * All builders return a full HTML document string suitable for iframe
 * `srcDoc`. The corresponding iframe MUST use sandbox="allow-scripts"
 * (and NOT allow-same-origin) so the preview is isolated from the
 * parent app. Do NOT rely on this alone; keep preview rendering inside
 * a sandboxed iframe even if the builder already uses classic scripts.
 *
 * Authors use raw React/Three.js/GSAP/Canvas/CSS/raf APIs; we don't run
 * a bundler. To keep DX friendly we preload commonly-used deps and
 * rewrite familiar ESM imports for those packages into globals.
 */

function escapeAttr(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildHtmlCssJsDoc({ html, css, javascript, baseUrl }) {
  const baseTag = baseUrl
    ? `<base href="${escapeAttr(baseUrl)}">`
    : "";
  const safeJs = String(javascript || "").replace(/<\/script>/gi, "<\\/script>");
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${baseTag}
<style id="__sc_no_scroll__">
html,body{margin:0!important;padding:0!important;overflow:hidden!important;width:100%!important;height:100%!important;}
::-webkit-scrollbar{display:none!important;}
*{scrollbar-width:none!important;}
</style>
<style>
html,body{margin:0;padding:0;background:transparent;width:100%;height:100%;display:flex;align-items:center;justify-content:center;}
${css || ""}
</style>
</head>
<body>
${html || ""}
<script>
${safeJs}
<\/script>
</body>
</html>`;
}

export function buildFullHtmlDoc({ fullDocument, baseUrl }) {
  if (!fullDocument) return "";

  // Scrollbar-kill block injected as the FIRST style inside <head>.
  // This must be inside the iframe's own document — parent CSS cannot
  // suppress scrollbars that belong to the iframe's html/body.
  const noScrollStyle = `<style id="__sc_no_scroll__">html,body{margin:0!important;padding:0!important;overflow:hidden!important;width:100%!important;height:100%!important;}::-webkit-scrollbar{display:none!important;}*{scrollbar-width:none!important;}</style>`;

  // If the document already has a <base>, don't inject another.
  if (/<base\s/i.test(fullDocument)) {
    // Still inject scrollbar kill
    if (/<head[^>]*>/i.test(fullDocument)) {
      return fullDocument.replace(/<head[^>]*>/i, (m) => `${m}\n${noScrollStyle}`);
    }
    return fullDocument;
  }
  const baseTag = baseUrl
    ? `<base href="${escapeAttr(baseUrl)}">`
    : "";
  // Inject base tag + scrollbar kill right after <head> if present, else prepend.
  if (/<head[^>]*>/i.test(fullDocument)) {
    return fullDocument.replace(/<head[^>]*>/i, (m) => `${m}\n${noScrollStyle}\n${baseTag}`);
  }
  return `${noScrollStyle}\n${baseTag}\n${fullDocument}`;
}

const BABEL_VERSION = "7.25.6";
const REACT_VERSION = "18";
const THREE_VERSION = "0.160.0";
const GSAP_VERSION = "3.12.5";

const SHIMMED_MODULES_RE = "(react|react-dom|react-dom\\/client|three|gsap)";
const RE_IMPORT_DEFAULT = new RegExp(
  `import\\s+([A-Za-z0-9_$]+)\\s+from\\s+["']${SHIMMED_MODULES_RE}["'];`,
  "g"
);
const RE_IMPORT_NAMESPACE = new RegExp(
  `import\\s+\\*\\s+as\\s+([A-Za-z0-9_$]+)\\s+from\\s+["']${SHIMMED_MODULES_RE}["'];`,
  "g"
);
const RE_IMPORT_NAMED = new RegExp(
  `import\\s*\\{([^}]+)\\}\\s*from\\s+["']${SHIMMED_MODULES_RE}["'];`,
  "g"
);

/**
 * Build a sandboxed React/JSX preview document.
 *
 * @param {object} opts
 * @param {string} [opts.jsx]          JSX/TSX source (TS content accepted —
 *                                     Babel preset="typescript" strips types)
 * @param {string} [opts.css]          CSS source appended to the defaults
 * @param {string} [opts.baseUrl]      Optional <base href=…> for relative
 *                                     asset references
 */
export function buildReactDoc({ jsx, css, baseUrl }) {
  const baseTag = baseUrl
    ? `<base href="${escapeAttr(baseUrl)}">`
    : "";
  const safeCss = String(css || "");
  const safeJsxSrc = String(jsx || "");

  // Runtime module shim: maps package identifiers into globals already
  // loaded in the iframe head. This is paired with the ESM rewrites below.
  // Keep in sync with the <script> tags embedded in the doc.
  const moduleShim = `
window.__scShimRequire = function(moduleName) {
  switch (moduleName) {
    case "react": return window.React;
    case "react-dom": return window.ReactDOM;
    case "react-dom/client": return window.ReactDOM;
    case "three": return window.THREE || {};
    case "gsap": return (window.gsap && window.gsap.gsap) ? window.gsap.gsap : (window.gsap || {});
    default: throw new Error("[STEA Code Preview] Unavailable module: " + moduleName + ". Use an html-css-js preview to load additional scripts.");
  }
};
(function patchBabelGlobals(){
  if (!window.__scModules) {
    window.__scModules = {
      react: { default: window.React },
      "react-dom": { default: window.ReactDOM },
      "react-dom/client": { default: window.ReactDOM },
      three: { default: window.THREE || {} },
      gsap: { default: (window.gsap && window.gsap.gsap) ? window.gsap.gsap : (window.gsap || {}) }
    };
  }
  if (window.gsap && !window.__scModules.gsap.ScrollTrigger) {
    Object.assign(window.__scModules.gsap, window.gsap);
  }
})();
  `.trim();

  // Rewrite ESM imports we can handle + plain export prefixes so loose
  // Babel transpilation drops declarations into window / module.exports
  // where the render boot script can find them.
  const transformedJsx = (function rewrite(src) {
    let out = src;
    out = out.replace(
      RE_IMPORT_DEFAULT,
      (_m, local, mod) =>
        `const ${local} = (window.__scModules["${mod}"] && window.__scModules["${mod}"].default) ? window.__scModules["${mod}"].default : window.__scModules["${mod}"];`
    );
    out = out.replace(
      RE_IMPORT_NAMESPACE,
      (_m, local, mod) => `const ${local} = window.__scModules["${mod}"];`
    );
    out = out.replace(
      RE_IMPORT_NAMED,
      (_m, named, mod) =>
        `const { ${named} } = window.__scModules["${mod}"] || {};`
    );
    out = out.replace(/export\s+default\s+/g, "module.exports.default = ");
    out = out.replace(
      /(^|\n)\s*export\s+(?=function|class|const|let|var|async\s+function|function\*)/g,
      "$1"
    );
    return out;
  })(safeJsxSrc).replace(/<\/script>/gi, "<\\/script>");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${baseTag}
<style id="__sc_no_scroll__">
html,body{margin:0!important;padding:0!important;overflow:hidden!important;width:100%!important;height:100%!important;}
::-webkit-scrollbar{display:none!important;}
*{scrollbar-width:none!important;}
</style>
<script crossorigin src="https://unpkg.com/react@${REACT_VERSION}/umd/react.production.min.js"><\/script>
<script crossorigin src="https://unpkg.com/react-dom@${REACT_VERSION}/umd/react-dom.production.min.js"><\/script>
<script src="https://unpkg.com/three@${THREE_VERSION}/build/three.min.js"><\/script>
<script src="https://unpkg.com/gsap@${GSAP_VERSION}/dist/gsap.min.js"><\/script>
<script src="https://unpkg.com/@babel/standalone@${BABEL_VERSION}/babel.min.js"><\/script>
<style>
  html,body,#root{margin:0;padding:0;overflow:hidden;width:100%;height:100%;min-height:unset;background:transparent;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,sans-serif;display:flex;align-items:center;justify-content:center;}
  *,*::before,*::after{box-sizing:border-box;}
  canvas{display:block;}
  ${safeCss}
</style>
<style id="__sc_react_overlay__">
  .__sc_react_error__{position:fixed;inset:0;background:rgba(5,6,10,.92);color:#ffcdd2;padding:14px 16px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.55;white-space:pre-wrap;overflow:auto;z-index:999999;border-top:2px solid #ef5350;}
  .__sc_react_error__ strong{color:#f5a623;display:block;margin-bottom:6px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;}
</style>
<script>
  ${moduleShim}
<\/script>
</head>
<body>
<div id="root"></div>
<script>
  // Provide a loose module object for Babel's "export default X" rewrite.
  window.module = { exports: {} };
  window.exports = window.module.exports;
<\/script>
<script type="text/babel" data-presets="react,typescript">
(function(){
  "use strict";
  const React$ = window.React;
  const ReactDOM$ = window.ReactDOM;
  const container = document.getElementById("root");

  function showError(title, err) {
    const el = document.createElement("div");
    el.className = "__sc_react_error__";
    const msg = (err && (err.stack || err.message)) || String(err || "Unknown error");
    el.innerHTML = "<strong>" + String(title).replace(/</g,"&lt;") + "</strong>" + msg.replace(/</g,"&lt;");
    document.body.appendChild(el);
    console.error("[STEA Code React Preview]", title, err);
  }

  try {
    // --- Author JSX begins ---
${transformedJsx}
    // --- Author JSX ends ---
  } catch (parseErr) {
    showError("AUTHOR CODE ERROR", parseErr);
    return;
  }

  var Component = null;
  try {
    var hasDefault = (typeof module !== "undefined") && module && module.exports && module.exports.default;
    Component = hasDefault
      ? module.exports.default
      : (typeof window.__APP_DEFAULT__ !== "undefined" ? window.__APP_DEFAULT__ : null);
    if (!Component && (typeof exports !== "undefined") && exports && exports.default) Component = exports.default;
    if (!Component && window.App) Component = window.App;
    if (!Component && window.Root) Component = window.Root;
    if (!Component && (typeof window.default !== "undefined")) Component = window.default;
    if (!Component || typeof Component !== "function") {
      var found = Object.getOwnPropertyNames(window)
        .map(function (k) { try { return [k, window[k]]; } catch (_e) { return null; } })
        .filter(Boolean)
        .find(function (kv) { return typeof kv[1] === "function" && /^function\s+App\b/.test(String(kv[1])); });
      Component = found ? found[1] : null;
    }
  } catch (resolveErr) {
    showError("COMPONENT RESOLVE ERROR", resolveErr);
    return;
  }

  if (!Component || typeof Component !== "function") {
    showError("NO COMPONENT FOUND",
      "Expected the preview to export a React component.\\n\\n" +
      "Use one of these patterns in your JSX:\\n" +
      "  • export default function App() { return <div>Hi</div> }\\n" +
      "  • function App() { return <div>Hi</div> }\\n" +
      "  • window.App = () => <div>Hi</div>");
    return;
  }

  try {
    var root = ReactDOM$.createRoot(container);
    var Strict = React$ && React$.StrictMode ? React$.StrictMode : (React$ && React$.Fragment ? React$.Fragment : function Fragment(props){ return (props && props.children) || null; });
    root.render(
      React$.createElement(Strict, null, React$.createElement(Component))
    );
  } catch (renderErr) {
    showError("RENDER ERROR", renderErr);
  }
})();
<\/script>
<script>
  window.addEventListener("error", function (ev) {
    var msg = (ev && (ev.error && (ev.error.stack || ev.error.message))) || (ev && ev.message) || String(ev);
    var el = document.createElement("div");
    el.className = "__sc_react_error__";
    el.innerHTML = "<strong>IFRAME ERROR</strong>" + String(msg).replace(/</g,"&lt;");
    document.body.appendChild(el);
    console.error("[STEA Code React Preview] iframe onError:", ev);
  });
  window.addEventListener("unhandledrejection", function (ev) {
    var msg = (ev && (ev.reason && (ev.reason.stack || ev.reason.message))) || String(ev && ev.reason);
    var el = document.createElement("div");
    el.className = "__sc_react_error__";
    el.innerHTML = "<strong>UNHANDLED PROMISE REJECTION</strong>" + String(msg).replace(/</g,"&lt;");
    document.body.appendChild(el);
    console.error("[STEA Code React Preview] unhandledrejection:", ev);
  });
<\/script>
</body>
</html>`;
}

export function escapePreviewAttr(str) {
  return escapeAttr(str);
}
