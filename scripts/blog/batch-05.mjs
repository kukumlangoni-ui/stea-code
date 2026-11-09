/**
 * blog batch-05 — 20 SEO articles (2027-01-11 → 2027-01-30)
 *
 * Run instructions (same as the other batches):
 *   1. node scripts/build-blog-sql.cjs          → regenerates workers/stea-api/migrations/013_blog.sql
 *   2. cd workers/stea-api
 *      npx wrangler d1 execute stea-code-db --remote --file=migrations/013_blog.sql
 *
 * Do not hand-edit 013_blog.sql; it is generated from every batch-*.mjs file.
 */
export default [
  {
    slug: "react-accessible-modal-dialog",
    title: "How to Build an Accessible Modal Dialog in React",
    category: "React",
    date: "2027-01-11",
    excerpt: "Use the native dialog element with showModal(): focus trapping, Escape handling and an inert background come free. Add a ref, aria-labelledby and a labelled close button — skip the hand-rolled focus trap.",
    content: `<p>Most hand-built React modals are one accessibility bug wearing three costumes: focus never enters the dialog, Tab walks out of it into the page behind, and Escape does nothing because nobody wired a keydown listener. All three come free if you stop rebuilding what the browser already ships.</p><h2>Direct Answer</h2><p>Render a native <code>&lt;dialog&gt;</code> element and open it with <code>showModal()</code>. That single call puts the dialog in the top layer, makes the rest of the page inert, traps focus inside, and wires Escape to close it. Your job shrinks to three things: hold a ref, label the dialog with <code>aria-labelledby</code>, and give the close button a real accessible name.</p><h2>Full Code Example</h2><pre><code>function Modal({ open, title, onClose, children }) {
  const ref = useRef(null);

  useEffect(() =&gt; {
    const el = ref.current;
    if (!el) return;
    if (open &amp;&amp; !el.open) el.showModal();
    if (!open &amp;&amp; el.open) el.close();
  }, [open]);

  return (
    &lt;dialog
      ref={ref}
      aria-labelledby="modal-title"
      onClose={onClose}
      onClick={(e) =&gt; {
        // Click on the backdrop targets the dialog itself, not its content
        if (e.target === ref.current) onClose();
      }}
    &gt;
      &lt;h2 id="modal-title"&gt;{title}&lt;/h2&gt;
      {children}
      &lt;button type="button" aria-label="Close dialog" onClick={onClose}&gt;
        ×
      &lt;/button&gt;
    &lt;/dialog&gt;
  );
}</code></pre><h2>Why This Works</h2><p><code>showModal()</code> is the difference between a dialog and a decorated div. In the top layer, the element paints above every z-index in the document, so no stacking-context fight is needed. Inertness is handled by the browser: elements behind the dialog stop receiving clicks and are removed from the accessibility tree, which is why the classic "focus escapes the modal" bug simply does not occur. Escape is a native cancel event, so you get keyboard dismissal without a listener.</p><h3>Focus return</h3><p>The browser stores the element that had focus before <code>showModal()</code> and restores it on close. That is the "return focus to the trigger" rule that every accessibility checklist asks for, already implemented. Do not steal focus on close yourself or you will fight it.</p><h3>Why aria-labelledby and not aria-label</h3><p>A screen reader announces the dialog's name on open. Pointing at the visible heading keeps the announced name and the on-screen name in sync, so they cannot drift apart during edits.</p><h2>Packaging It as a Reusable Hook</h2><p>Once the pattern works, the next step is to stop repeating the effect. Pull the ref, the showModal and close calls, and the backdrop click into a small hook that returns the ref and the props the dialog needs. Every modal in the app then shares one behaviour, and there is a single place to add scroll locking.</p><h3>Scroll locking, the missing piece</h3><p>The top layer makes the page inert but does not stop it from scrolling. Set <code>overflow: hidden</code> on <code>document.documentElement</code> while the dialog is open, and restore the previous value on close. Store the old value rather than clearing it, because the page may already have a deliberate overflow rule.</p><h3>Testing checklist</h3><ul><li>Tab past the last focusable element: focus cycles to the first, never to the page behind.</li><li>Press Escape: the dialog closes and focus returns to the trigger.</li><li>Click the backdrop: it closes, but a click inside the panel does not.</li><li>Open with a screen reader: the dialog name is announced from the visible heading.</li><li>Zoom to 200 percent: the panel scrolls internally instead of pushing the page.</li></ul><h3>When not to use a modal</h3><p>A dialog interrupts. If the task can happen inline — expanding a row, revealing a form under a button — do that instead. Reserve modals for decisions that genuinely block the next step: confirming a destructive action, completing a checkout, or presenting a focused editor.</p><h3>Sizing and scrolling</h3><p>Give the dialog <code>max-width: min(92vw, 560px)</code> and <code>max-height: 85vh</code> with <code>overflow: auto</code> on the panel. Without a height cap a long form pushes the dialog past the viewport, and the close button becomes unreachable on a laptop with a short screen.</p><h2>Common Mistakes</h2><ul><li>Rendering a div with <code>role="dialog"</code> and calling it accessible. Without inertness and a focus trap it is a visual lie.</li><li>Using <code>display: none</code> toggling instead of <code>showModal()</code>. The dialog renders, but nothing else changes.</li><li>Mounting the dialog inside an ancestor with <code>overflow: hidden</code> and assuming it will clip. The top layer ignores that — but only with <code>showModal()</code>, not with the <code>open</code> attribute.</li><li>Forgetting to return focus when closing programmatically, so keyboard users land back at the top of the document.</li></ul><h2>Browser Support / Caveats</h2><p><code>&lt;dialog&gt;</code> is supported in Chrome 37+, Firefox 98+ and Safari 15.4+, which covers essentially all production traffic. On older Safari the element exists but <code>showModal()</code> is missing; feature-detect it and fall back to rendering the dialog inline with a manual focus trap. One styling note: the backdrop is a <code>::backdrop</code> pseudo-element, not a sibling div, so target it there rather than adding an overlay element.</p><h2>Related Resources</h2><p>For a real modal in production, open the <a href="/products/payment-checkout-modal">checkout modal component</a>. The keyboard-focus half of this problem is covered in <a href="/blog/css-focus-visible-hover-states">this article on focus states</a>, and the element's full behaviour is documented on <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog" rel="nofollow noopener" target="_blank">MDN</a>.</p><p><strong>Try it on SteaCode:</strong> a production-ready checkout dialog with focus handling is free to copy in the <a href="/products/payment-checkout-modal">component library</a>.</p>`
  },
  {
    slug: "react-toast-notification-component",
    title: "How to Build a React Toast Notification Component",
    category: "React",
    date: "2027-01-12",
    excerpt: "Keep a queue in a provider, render each toast in a portal on body, announce with role=status, and clear every timer on unmount. Toasts belong outside the component tree that triggered them.",
    content: `<p>Toasts look trivial until the first one renders behind a sticky header, gets clipped by an overflow container, or never disappears because its timer was orphaned on unmount. The fix is architecture, not styling: a queue that lives above the app, rendered through a portal.</p><h2>Direct Answer</h2><p>Create a provider that owns an array of toasts. A <code>useToast()</code> hook pushes new entries into it. Render the stack through <code>createPortal</code> into <code>document.body</code>, give the container <code>role="status"</code> with <code>aria-live="polite"</code>, and run one auto-dismiss timer per toast with cleanup. Every toast needs a stable id — a counter, not an index.</p><h2>Full Code Example</h2><pre><code>let nextId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) =&gt; {
    setToasts((list) =&gt; list.filter((t) =&gt; t.id !== id));
  }, []);

  const push = useCallback((message, duration = 4000) =&gt; {
    const id = nextId++;
    setToasts((list) =&gt; [...list, { id, message }]);
    setTimeout(() =&gt; dismiss(id), duration);
    return id;
  }, [dismiss]);

  return (
    &lt;ToastContext.Provider value={{ push, dismiss }}&gt;
      {children}
      {createPortal(
        &lt;div className="toast-stack" role="status" aria-live="polite"&gt;
          {toasts.map((t) =&gt; (
            &lt;div key={t.id} className="toast"&gt;
              {t.message}
              &lt;button type="button" aria-label="Dismiss" onClick={() =&gt; dismiss(t.id)}&gt;×&lt;/button&gt;
            &lt;/div&gt;
          ))}
        &lt;/div&gt;,
        document.body
      )}
    &lt;/ToastContext.Provider&gt;
  );
}</code></pre><h2>Why This Works</h2><p>The portal is what makes toasts behave. Rendering into <code>body</code> means no ancestor can clip them with <code>overflow: hidden</code>, and no transform-created stacking context can bury them — the two bugs that account for most "my toast is invisible" reports. The queue lives in a provider so any component can raise a toast without prop drilling or a global variable.</p><h3>Live regions and timing</h3><p><code>role="status"</code> implies <code>aria-live="polite"</code>, so screen readers announce the message without interrupting the user's current task. Reserve <code>assertive</code> for genuine errors. Announcements only fire when content changes inside an existing live region, so the container must be present in the DOM from the start — which this pattern guarantees, since it renders empty.</p><h3>Timers</h3><p>One timer per toast, keyed by id, means dismissing a toast manually cannot cancel somebody else's timer. The classic alternative — a single interval comparing timestamps — desynchronises the moment a user closes one early.</p><h2>Queue Discipline: Duplicates, Stacking and Durations</h2><p>A working toast system is mostly policy. Without rules, an error loop fills the screen with forty identical messages and the user cannot see the page underneath. Decide four things before the first toast ships.</p><h3>Deduplicate by content</h3><p>If a toast with the same message is already visible, reset its timer instead of appending a second copy. Use the message as the key rather than the id, because the id exists only to satisfy React.</p><h3>Cap the stack</h3><p>Three visible toasts is the practical maximum. Push the oldest out when a fourth arrives, and keep the array bounded so a runaway loop cannot grow memory without limit.</p><h3>Durations by severity</h3><ul><li>Success: 3000 to 4000 milliseconds. Nothing needs action.</li><li>Informational: 5000 milliseconds. Longer to read, still dismisses itself.</li><li>Error: requires dismissal. Auto-dismissing an error hides the only explanation of what went wrong.</li></ul><h3>Position and safe areas</h3><p>Fix the stack to a corner with a high z-index, and add <code>env(safe-area-inset-bottom)</code> padding on mobile so the last toast is not under the home indicator. On a layout with a sticky footer, the stack must sit above the footer, not behind it.</p><h3>Errors should not auto-dismiss</h3><p>A success message can disappear because the user already knows what happened. An error cannot: it is the only record of the failure, and dismissing it after four seconds guarantees the user loses the reason. Errors stay until dismissed, and a retry action belongs inside the toast rather than in a console. If errors can repeat, deduplicate by message so a failed poll does not bury the page in identical red boxes. Pair the retry with the same id so the whole group clears in one click.</p><h2>Common Mistakes</h2><ul><li>Rendering the toast next to the triggering button. It inherits every clipping and stacking rule of that subtree.</li><li><code>aria-live="assertive"</code> on a success message; it interrupts whatever the user was reading.</li><li>Storing timers in state, so clearing them on unmount becomes guesswork and streams of orphaned callbacks fire into a dead component.</li><li>Using the array index as the React key. Dismissing toast one re-keys the rest and restarts their transitions.</li></ul><h2>Browser Support / Caveats</h2><p>Portals and live regions are universally supported; nothing here is version-sensitive. Do respect <code>prefers-reduced-motion</code> — a slide-in toast is decorative, and the message is the point. Keep simultaneous toasts to three or fewer; beyond that the stack becomes a wall the user cannot dismiss fast enough.</p><h2>Related Resources</h2><p>An alert component using the same announcement pattern is free in the library: <a href="/products/dark-error-alert">dark error alert</a>. The timer-cleanup discipline is the same one in <a href="/blog/react-async-setstate-after-unmount">avoiding setState after unmount</a>, and portals are documented at <a href="https://react.dev/reference/react-dom/createPortal" rel="nofollow noopener" target="_blank">react.dev</a>.</p><p><strong>Try it on SteaCode:</strong> copy a ready-made alert surface at <a href="/products/dark-error-alert">dark error alert</a> and drop the provider around your app.</p>`
  },
  {
    slug: "accessible-react-tabs-with-aria",
    title: "Building an Accessible Tabs Component in React with ARIA",
    category: "React",
    date: "2027-01-13",
    excerpt: "One tab in the tab order, arrow keys move between tabs, role=tablist/tab/tabpanel, aria-selected plus aria-controls. A div with onClick gives keyboard users nothing.",
    content: `<p>Tabs are the most commonly broken interactive pattern on the web. Sighted mouse users see working tabs; keyboard users see a row of text that does nothing, and screen reader users hear three unlabelled buttons with no relationship to the panel underneath. The ARIA tabs pattern fixes all of it with about twenty lines.</p><h2>Direct Answer</h2><p>Give the list <code>role="tablist"</code>, each button <code>role="tab"</code>, and each panel <code>role="tabpanel"</code>. Only the selected tab carries <code>tabIndex={0}</code> — every other tab is <code>-1</code>, the roving tabindex pattern. Arrow keys move both selection and focus; Home and End jump to the ends. Each tab sets <code>aria-selected</code> and points at its panel with <code>aria-controls</code>, and each panel is labelled by its tab with <code>aria-labelledby</code>.</p><h2>Full Code Example</h2><pre><code>function Tabs({ items }) {
  const [active, setActive] = useState(0);
  const refs = useRef([]);

  function onKeyDown(e, index) {
    const last = items.length - 1;
    let next = null;
    if (e.key === "ArrowRight") next = index === last ? 0 : index + 1;
    if (e.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    refs.current[next].focus();
  }

  return (
    &lt;&gt;
      &lt;div role="tablist" aria-label="Sections"&gt;
        {items.map((item, i) =&gt; (
          &lt;button
            key={item.id}
            ref={(el) =&gt; (refs.current[i] = el)}
            role="tab"
            id={"tab-" + item.id}
            aria-selected={active === i}
            aria-controls={"panel-" + item.id}
            tabIndex={active === i ? 0 : -1}
            onClick={() =&gt; setActive(i)}
            onKeyDown={(e) =&gt; onKeyDown(e, i)}
          &gt;
            {item.label}
          &lt;/button&gt;
        ))}
      &lt;/div&gt;
      {items.map((item, i) =&gt; (
        &lt;div
          key={item.id}
          role="tabpanel"
          id={"panel-" + item.id}
          aria-labelledby={"tab-" + item.id}
          hidden={active !== i}
        &gt;
          {item.content}
        &lt;/div&gt;
      ))}
    &lt;/&gt;
  );
}</code></pre><h2>Why This Works</h2><p>The roving tabindex is the key idea. With every tab focusable, Tab walks through all of them and a keyboard user must press it four times to leave a tab strip — and the strip competes for tab stops with real content. With one focusable tab, Tab enters the strip once, arrow keys move within it, and Tab exits to the panel. That is the interaction every native tab widget has had for decades.</p><h3>Wiring with ids, not proximity</h3><p><code>aria-controls</code> and <code>aria-labelledby</code> create the tab-panel relationship explicitly, so screen readers announce the panel as belonging to the selected tab. Ordering alone is not a relationship and is not announced.</p><h3>Hiding panels correctly</h3><p>The <code>hidden</code> attribute removes inactive panels from both the layout and the accessibility tree in one step. CSS-only hiding that leaves the panel technically rendered keeps it announceable, which confuses screen reader users navigating by region.</p><h2>Vertical Tabs, Disabled Tabs and Dynamic Panels</h2><p>The horizontal example covers most cases. Three variations need explicit treatment, and each has one rule that is easy to miss.</p><h3>Vertical orientation</h3><p>Add <code>aria-orientation="vertical"</code> to the tablist and map ArrowUp and ArrowDown instead of Left and Right. Without the attribute, screen readers describe the widget as horizontal and announce the wrong keys.</p><h3>Disabled tabs</h3><p>Use <code>aria-disabled="true"</code> and keep the tab focusable rather than the <code>disabled</code> attribute. A disabled element leaves the tab order, so keyboard users cannot discover why the section is unavailable. Announce the reason through an inline note, and skip disabled tabs when moving with arrows.</p><h3>Dynamic panel content</h3><p>Panels that load data should stay mounted with a loading state, not unmount on every switch. Remounting cancels in-flight requests and resets scroll position, which reads as a bug. If a panel is genuinely expensive, mount it on first activation and keep it afterwards.</p><h3>A quick visual check</h3><ul><li>Selection follows arrow keys and focus moves with it.</li><li>Tab leaves the strip in a single press.</li><li>The active panel is the only one exposed to assistive technology.</li></ul><h3>Styling the selected tab without breaking semantics</h3><p>Style from <code>aria-selected</code>, not from a separate <code>is-active</code> class. One state, one attribute, and the visual and the announced state cannot disagree. The underline can be a pseudo-element that scales on the same attribute.</p><h2>Common Mistakes</h2><ul><li>Starting from divs with <code>onClick</code>: not focusable, not announced, no keyboard path.</li><li>Leaving every tab tabbable, so navigating past the strip costs one Tab press per tab.</li><li>Selection without focus. Arrow keys must move focus and selection together, or screen reader users lose their place.</li><li>Missing ids, leaving <code>aria-controls</code> pointing at nothing — silently broken, never reported.</li></ul><h2>Browser Support / Caveats</h2><p>ARIA roles and roving tabindex work everywhere. Use buttons for tabs rather than links, since these change state rather than navigate. If a tab triggers a network fetch, remember it is a state change — keep the panel mounted with a loading state instead of remounting on every switch.</p><h2>Related Resources</h2><p>The segmented-control look is already available as a component: <a href="/products/light-dark-theme-switch">light / dark theme switch</a>. Focus styling is covered in <a href="/blog/css-focus-visible-hover-states">this article</a>, and the full pattern is specified in the <a href="https://www.w3.org/WAI/ARIA/apg/patterns/tabs/" rel="nofollow noopener" target="_blank">WAI-ARIA Authoring Practices</a>.</p><p><strong>Try it on SteaCode:</strong> a segmented toggle built on the same keyboard model is free at <a href="/products/light-dark-theme-switch">light / dark theme switch</a>.</p>`
  },
  {
    slug: "react-usememo-vs-usecallback",
    title: "useMemo vs useCallback: Which One Do You Actually Need?",
    category: "React",
    date: "2027-01-14",
    excerpt: "useMemo caches a computed value; useCallback caches a function's identity. They are the same primitive — useCallback(fn, deps) equals useMemo(() => fn, deps) — and neither makes rendering faster on its own.",
    content: `<p>These two hooks get wrapped around everything in codebases that have been told "memoization is performance", then the app is still slow. They solve a narrower problem than their names suggest, and knowing exactly which problem saves you from sprinkling them everywhere.</p><h2>Direct Answer</h2><p>Use <code>useMemo</code> when you want to avoid re-running an expensive computation and keep the same result object when the inputs have not changed. Use <code>useCallback</code> when you want the same function reference across renders, usually because a child is memoized with <code>React.memo</code> or a function is an effect dependency. They are the same mechanism: <code>useCallback(fn, deps)</code> is exactly <code>useMemo(() =&gt; fn, deps)</code>. If neither referential stability nor computation cost applies, you need neither.</p><h2>Full Code Example</h2><pre><code>// useMemo: skip an expensive derivation
const sorted = useMemo(
  () =&gt; rows.slice().sort((a, b) =&gt; a.price - b.price),
  [rows]
);

// useCallback: stable handler for a memoized child
const onSelect = useCallback((id) =&gt; setSelected(id), []);

const RowList = React.memo(function RowList({ rows, onSelect }) {
  return rows.map((r) =&gt; (
    &lt;button key={r.id} onClick={() =&gt; onSelect(r.id)}&gt;{r.name}&lt;/button&gt;
  ));
});

// Not every handler needs this. A plain inline arrow is fine:
&lt;button onClick={() =&gt; setOpen(true)}&gt;Open&lt;/button&gt;</code></pre><h2>Why This Works</h2><p>React compares values with <code>Object.is</code>. An inline arrow function is a new object every render, so a <code>React.memo</code> child receives a "changed" prop and re-renders even when nothing meaningful changed. Wrapping the handler in <code>useCallback</code> preserves the reference across renders, and the memo boundary finally does its job. <code>useMemo</code> plays the same trick for objects and arrays, which are also compared by reference.</p><h3>What memoization actually costs</h3><p>Every memo hook allocates a dependency array, compares entries on each render, and keeps a cached value alive. On a cheap computation — summing eight numbers, building a string — that overhead can exceed the work saved. Memoize when the work is measurable or when identity is load-bearing.</p><h3>The dependency trap</h3><p>Memoization is only as stable as its dependencies. Pass <code>[{ id }]</code> as a dep and the cached value is thrown away every render, because a fresh object literal is a new reference. Depend on primitives (<code>[id]</code>) or hoist the object out of the component.</p><h2>Measure Before You Memoise</h2><p>Memoisation is an optimisation, and optimisations need a number. A three-step workflow keeps the codebase honest, and skipping the first step is why teams end up with a maze of hooks that changed nothing.</p><h3>Step one: find the slow render</h3><p>The React DevTools profiler ranks components by self time. If the component you are about to memoise is not near the top, the hook is cosmetic. Open the flame graph, sort by time, and confirm the work is real.</p><h3>Step two: check what re-renders</h3><p>Take a render that should not have happened. If the child renders because its parent does, <code>React.memo</code> on the child is the fix. If it renders because a prop object is new, stabilise that object. Only then consider <code>useCallback</code> on the handler the child receives.</p><h3>Step three: verify the improvement</h3><p>Measure the same interaction again. A memo that shaves two milliseconds is noise; one that removes a 30 millisecond sort from every keystroke is worth the indirection. Record the before and after in the pull request so the next reader knows why the hook exists.</p><h3>Where memoisation genuinely pays</h3><ul><li>Sorting or filtering lists of a few hundred rows on every render.</li><li>Chart data transformed into series objects.</li><li>Handlers passed into a virtualised list that re-renders per scroll frame.</li><li>Context values that would otherwise force every consumer to update.</li></ul><h3>The one-line rule</h3><p>If you cannot name what the memo avoids — a sort, a map, a new object identity — do not add it. A hook whose purpose cannot be stated in one sentence is dead weight that every future reader has to reason about. Delete it and measure again; usually nothing changes. Memoisation that survives refactors is the one with a comment explaining the measurement that justified it.</p><h2>Common Mistakes</h2><ul><li>Wrapping every function in <code>useCallback</code> with no memoized consumer. The reference is stable, but nothing is watching it.</li><li>Memoizing cheap work and calling it an optimisation.</li><li>Inline object or array dependencies, defeating the cache invisibly.</li><li>Using <code>useMemo</code> to avoid a re-render. It caches a value; it does not stop renders.</li></ul><h2>Browser Support / Caveats</h2><p>Pure React, no compatibility concerns. Since React 19 the compiler can insert memoization automatically, which changes the calculus: write the straightforward code and let the compiler do it, keeping manual <code>useMemo</code> only for genuinely expensive work. Until you are on that version, the rule of thumb holds — measure first, then memoize.</p><h2>Related Resources</h2><p>A component where per-frame computation genuinely matters: <a href="/products/countup-animated-number">animated count-up</a>. The freshness problem behind most stale memo values is explained in <a href="/blog/react-usestate-not-updating-immediately">useState not updating immediately</a>, and the API is specified at <a href="https://react.dev/reference/react/useMemo" rel="nofollow noopener" target="_blank">react.dev</a>.</p><p><strong>Try it on SteaCode:</strong> the <a href="/products/countup-animated-number">animated count-up component</a> memoises its frame work — free to copy.</p>`
  },
  {
    slug: "tailwind-dark-mode-class-strategy",
    title: "Tailwind Dark Mode: The Class Strategy Done Right",
    category: "Tailwind",
    date: "2027-01-15",
    excerpt: "Set darkMode: 'class', toggle the class on html with an inline script before paint, and pair it with color-scheme. Without the config change, dark: variants follow the OS and users cannot override them.",
    content: `<p>Tailwind dark mode fails in one of two ways: the <code>dark:</code> variants ignore the toggle entirely, or they work but the page flashes white for a frame on every load. Both are config problems, and both are fixed in under ten lines.</p><h2>Direct Answer</h2><p>Set <code>darkMode: "class"</code> in the Tailwind config. Toggle a <code>dark</code> class on <code>html</code>, not on a wrapper div, so it applies to portals and the document background alike. Add a small inline script in the document head that reads the stored preference and applies the class before the first paint. Also set <code>color-scheme</code> so form controls, scrollbars and the canvas match the theme.</p><h2>Full Code Example</h2><pre><code>// tailwind.config.js
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
};

// index.html — runs before paint, so no flash
&lt;script&gt;
  (function () {
    var stored = localStorage.getItem("theme");
    var dark = stored ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (dark) document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  })();
&lt;/script&gt;

// A component using the variant
&lt;section class="bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100"&gt;
  &lt;h2 class="text-lg font-semibold"&gt;Dashboard&lt;/h2&gt;
&lt;/section&gt;</code></pre><h2>Why This Works</h2><p>The <code>class</code> strategy compiles <code>dark:*</code> utilities into <code>.dark &amp; { ... }</code>, so a single class on the root element flips every variant at once. The default <code>media</code> strategy compiles to <code>@media (prefers-color-scheme: dark)</code>, which follows the operating system and leaves the user no in-page control — that is why "my dark mode toggle does nothing" is almost always a missing config line.</p><h3>Why the inline script, not a React effect</h3><p>A React effect runs after hydration, which is after the first paint. On a slow connection the user sees a white page, then a dark one. The inline script runs synchronously in the head, before any content is painted, so the correct theme exists from frame one. It is also the only place that can read <code>localStorage</code> safely before React mounts.</p><h3>color-scheme, the finishing touch</h3><p>Setting <code>color-scheme</code> instructs the browser to render native UI in the matching theme: scrollbars, default form controls, the overscroll background. Without it you get a dark page with a bright white scrollbar and glaring autofill fields.</p><h2>A Three-State Toggle That Survives Navigation</h2><p>Two states, light and dark, sound simpler than they are, because they drop the user's actual preference: following the operating system. The durable model has three values, and the difference shows up the moment the OS changes at sunset.</p><h3>Storing system as a first-class value</h3><p>Store <code>light</code>, <code>dark</code> or <code>system</code> under one key. When the stored value is <code>system</code>, read <code>prefers-color-scheme</code> each time the theme is applied instead of freezing the answer at the moment of selection. A user who chose system expects the page to follow the OS later.</p><h3>Reacting to an OS change live</h3><p>Subscribe to the media query with <code>matchMedia</code> and re-apply the theme when it flips. This is rare in practice but jarring when missing: the page stays light at night until a reload.</p><h3>Multi-tab consistency</h3><p>Two tabs, two toggles, one stored value. Listen for the <code>storage</code> event and re-read the preference so a change in one tab updates the others. Without it the second tab silently reverts on the next navigation.</p><h3>Keeping portals in sync</h3><p>Because the class lives on <code>html</code>, a dialog or toast rendered into <code>body</code> inherits the theme with no extra wiring. That is the practical reason for the root-element rule, beyond the simpler one: the document background must change too.</p><h3>Route changes and the flash</h3><p>In a single-page app the theme survives navigation because the class lives on <code>html</code>. The flash only returns if a route remounts the document, which it should not. On a full reload the inline script runs again, so the stored value must be readable synchronously and never behind an async call.</p><h2>Common Mistakes</h2><ul><li>Forgetting <code>darkMode: "class"</code>, then blaming the markup when variants track the OS.</li><li>Putting the class on <code>&lt;body&gt;</code> or a wrapper: portals rendered into body escape it and stay light.</li><li>Toggling from a React effect, producing a one-frame flash on every navigation.</li><li>Hard-coding greys in both themes instead of one semantic pair per surface, so every new component needs two more classes.</li></ul><h2>Browser Support / Caveats</h2><p><code>prefers-color-scheme</code> and <code>color-scheme</code> are broadly available; Safari needed 13+ for the media feature and 16.4+ for full <code>color-scheme</code> behaviour. In Tailwind 4 the config moves into CSS with <code>@custom-variant dark</code>, but the class-on-html mechanics are unchanged. Store the preference as <code>"dark" | "light" | "system"</code> and let <code>"system"</code> fall back to the media query.</p><h2>Related Resources</h2><p>A themed surface built this way is free at <a href="/products/dark-login-form">dark login form</a>. The three-state toggle mechanics live in <a href="/blog/dark-mode-triple-state-toggle">light / dark / system toggle</a>, and the config option is documented at <a href="https://tailwindcss.com/docs/dark-mode" rel="nofollow noopener" target="_blank">tailwindcss.com</a>.</p><p><strong>Try it on SteaCode:</strong> a dark-first form that pairs cleanly with the class strategy is free at <a href="/products/dark-login-form">dark login form</a>.</p>`
  },
  {
    slug: "tailwind-group-and-peer-modifiers",
    title: "How to Use Tailwind group and peer Modifiers",
    category: "Tailwind",
    date: "2027-01-16",
    excerpt: "group styles a child from an ancestor's state; peer styles a later sibling from an earlier sibling's state. Peer must come first in the DOM — that ordering rule catches everyone once.",
    content: `<p>Hovering a card and lighting up its title, or checking a checkbox and revealing a panel, normally means writing custom CSS for a parent-child or sibling relationship. Tailwind ships both relationships as modifiers, and the only real trap is a DOM-ordering rule that fails silently.</p><h2>Direct Answer</h2><p><code>group</code> goes on an ancestor; children use <code>group-hover:</code>, <code>group-focus:</code>, <code>group-data-*:</code> and friends to react to that ancestor's state. <code>peer</code> goes on an earlier sibling; later siblings style themselves with <code>peer-checked:</code>, <code>peer-focus:</code>, <code>peer-invalid:</code> or <code>peer-placeholder-shown:</code>. Both use plain CSS combinators under the hood — descendant for group, general sibling for peer — so no JavaScript is involved.</p><h2>Full Code Example</h2><pre><code>&lt;!-- group: the whole card responds to hover --&gt;
&lt;a class="group block rounded-xl border p-5 hover:border-amber-400"&gt;
  &lt;h3 class="font-semibold text-gray-900 group-hover:text-amber-600"&gt;Docs&lt;/h3&gt;
  &lt;span class="text-gray-500 group-hover:translate-x-1 transition"&gt;→&lt;/span&gt;
&lt;/a&gt;

&lt;!-- peer: sibling-based toggle. Input MUST come first. --&gt;
&lt;div class="space-y-2"&gt;
  &lt;input id="terms" type="checkbox" class="peer sr-only" /&gt;
  &lt;label for="terms"
    class="inline-flex rounded-lg border px-4 py-2 peer-checked:bg-amber-500 peer-checked:text-white"
  &gt;
    Accept terms
  &lt;/label&gt;
  &lt;p class="hidden peer-checked:block text-sm text-gray-600"&gt;
    Thanks — you can continue.
  &lt;/p&gt;
&lt;/div&gt;

&lt;!-- Named groups when several nest --&gt;
&lt;div class="group/card ..."&gt;
  &lt;div class="group/row ..."&gt;
    &lt;span class="group-hover/row:underline group-hover/card:opacity-100"&gt;·&lt;/span&gt;
  &lt;/div&gt;
&lt;/div&gt;</code></pre><h2>Why This Works</h2><p>The <code>group</code> variant compiles to <code>.group:hover &amp; .child</code>, a descendant selector, so any depth below the group matches. The <code>peer</code> variant compiles to <code>.peer:checked ~ &amp;.sibling</code>, the general sibling combinator, which only matches elements later in the same parent. That single character of CSS is why a checkbox has to precede the thing it styles.</p><h3>Named groups</h3><p><code>group/card</code> plus <code>group-hover/card:</code> scopes the state to a specific ancestor. Without names, nested groups all match the nearest unnamed group, and an outer hover accidentally triggers inner styles. Names are the fix for nested interactive surfaces.</p><h3>Why not JavaScript</h3><p>Because these are state selectors the browser already tracks: hover, focus, checked, disabled, invalid, placeholder visibility. A React state flag re-implements the same information one render later and costs a re-render.</p><h2>Compound States and Accessibility-Driven Variants</h2><p>These modifiers get more useful once you combine them with state that comes from ARIA rather than CSS pseudo-classes. Tailwind supports both, and mixing them produces patterns plain hover utilities cannot express.</p><h3>Stacking variants</h3><p>A single class can chain conditions: <code>md:group-hover:text-amber-600</code> restricts the effect to a breakpoint. Tailwind composes them into one media query wrapping one state selector, so the output stays small.</p><h3>ARIA and data variants</h3><p><code>aria-expanded:</code> and <code>data-open:</code> let the CSS follow the same attribute the accessibility tree exposes. An accordion that sets <code>aria-expanded</code> on its trigger can style the chevron with <code>aria-expanded:rotate-180</code> — one source of truth for screen readers and sighted users.</p><h3>Group with a form field</h3><p>A labelled input wrapper can react to its child's focus and validity: <code>group</code> on the wrapper, then <code>group-focus-within:border-amber-400</code> or <code>group-has-[input:invalid]:ring-red-300</code>. The <code>:has()</code> selector is broadly available now and removes the need for a focus handler in React.</p><h3>The one ordering rule to remember</h3><p>Peer selectors only look forward. If a checkbox controls content above it in the DOM, no Tailwind class will reach it. Restructure the markup, or use React state. That constraint is the whole reason the pattern is documented with input first.</p><h3>Debugging a modifier that does nothing</h3><p>Four causes cover it. The <code>group</code> class is on a descendant instead of an ancestor. The peer element comes after its target. The variant is applied to something outside the same parent. Or a framework serialises your class into a wrapper you did not expect. Inspect the generated selector in DevTools: if it is not <code>.group:hover .child</code> or <code>.peer:checked ~ .sibling</code>, the markup is wrong, not the utility. Check also that the base class exists in the output CSS, because a class assembled from a string at runtime is invisible to the scanner and silently missing.</p><p>One last gotcha: groups cannot be nested without names, and a named group is invisible unless the child spells out the same name. Audit nested cards by hovering the outer one and confirming the inner styles stay untouched.</p><h2>Common Mistakes</h2><ul><li>Putting <code>peer</code> on the element after the one it should style. The sibling combinator only looks forward.</li><li>Applying <code>peer-*</code> to a descendant. Peers are siblings only — use a group for descendants.</li><li>Nesting unnamed groups, so hovering anything lights up everything.</li><li>Using <code>group-hover</code> on touch devices, where hover is either absent or sticky. Pair it with a focus state.</li></ul><h2>Browser Support / Caveats</h2><p>Both modifiers ship as ordinary selectors and need nothing beyond CSS support. The one requirement is that <code>:focus-visible</code>, <code>:placeholder-shown</code> and <code>:checked</code> are supported — universal in current browsers. On touch devices prefer <code>group-active:</code> or an <code>aria-checked</code>-driven <code>data-*</code> attribute, which survives both mouse and keyboard activation.</p><h2>Related Resources</h2><p>A switch built entirely on <code>peer-checked</code> is free at <a href="/products/animated-toggle-switch">animated toggle switch</a>. The keyboard-focus side of interactive states is covered in <a href="/blog/css-focus-visible-hover-states">this article</a>, and the modifier list lives at <a href="https://tailwindcss.com/docs/hover-focus-and-other-states" rel="nofollow noopener" target="_blank">tailwindcss.com</a>.</p><p><strong>Try it on SteaCode:</strong> copy the <a href="/products/animated-toggle-switch">animated toggle switch</a> — it is a peer-checked pattern with no JavaScript.</p>`
  },
  {
    slug: "tailwind-arbitrary-values",
    title: "Tailwind Arbitrary Values: When to Use Them and When Not To",
    category: "Tailwind",
    date: "2027-01-17",
    excerpt: "Square brackets inject any value: w-[317px], bg-[#1a1a1a], grid-cols-[160px_1fr_300px]. Underscores replace spaces. They are an escape hatch, not a design system — overuse is how a codebase loses consistency.",
    content: `<p>Tailwind's scale is the product. The moment you need a value that is not on the scale — a grid template from a design mock, an exact hex from a brand guide — the bracket syntax gets you there without writing custom CSS. The skill is knowing how often to reach for it.</p><h2>Direct Answer</h2><p>Wrap the value in square brackets: <code>w-[317px]</code>, <code>bg-[#1a1a1a]</code>, <code>grid-cols-[160px_1fr_300px]</code>, <code>top-[calc(100%-8px)]</code>. Replace spaces with underscores, because spaces terminate the class name. Prefix with a type hint when the value is ambiguous, as in <code>text-[length:15px]</code> or <code>bg-[image:url(...)]</code>. If a value repeats across three or more components, it belongs in the theme, not in brackets.</p><h2>Full Code Example</h2><pre><code>&lt;!-- Exact track widths from a layout spec --&gt;
&lt;div class="grid grid-cols-[160px_1fr_300px] gap-8"&gt;...&lt;/div&gt;

&lt;!-- Brand colour that is not in the palette --&gt;
&lt;a class="bg-[#0b1020] text-[#f5b400] hover:bg-[#161c33]"&gt;Link&lt;/a&gt;

&lt;!-- Values Tailwind has no utility for --&gt;
&lt;div class="max-h-[calc(100vh-4rem)] overflow-y-auto"&gt;...&lt;/div&gt;
&lt;div class="[mask-image:linear-gradient(to_bottom,black,transparent)]"&gt;...&lt;/div&gt;

&lt;!-- Type hint: an arbitrary property that is ambiguous --&gt;
&lt;span class="text-[length:clamp(1rem,2.5vw,1.5rem)]"&gt;Fluid&lt;/span&gt;</code></pre><h2>Why This Works</h2><p>Tailwind parses a class containing brackets as literal CSS, generating exactly what you typed — no scale lookup, no guessing. That is why <code>grid-cols-[160px_1fr_300px]</code> works even though the numeric scale stops at twelve: the generator emits <code>grid-template-columns: 160px 1fr 300px</code> directly. Underscores exist because whitespace cannot survive in a class name, so Tailwind converts them back to spaces before emitting the declaration.</p><h3>The hidden cost</h3><p>Every arbitrary value is a one-off utility. Twenty <code>bg-[#...]</code> values across a codebase is a palette that only exists in text search. Tailwind's scale is what makes an interface feel like one product; arbitrary values are what makes it feel assembled. Use them for structural specs and genuine edge cases, and promote anything repeated into <code>@theme</code> or the config.</p><h3>Arbitrary properties</h3><p>Bracket syntax works for properties too: <code>[mask-image:...]</code>, <code>[scrollbar-width:none]</code>. This is the answer for CSS features Tailwind does not wrap, and it keeps the value in the class list where a designer will find it.</p><h2>Promoting a Value Into the Theme</h2><p>The healthy lifecycle of an arbitrary value is short: it appears in one component, gets copied into a second, and by the third occurrence it should be a token. Promoting deliberately is what keeps a Tailwind codebase from turning into a pile of hex codes.</p><h3>Tailwind 4: @theme</h3><p>Declare the value once in CSS and every utility built on that scale picks it up: <code>@theme { --color-ink: #0b1020; --spacing-brutal: 13px; }</code> produces <code>bg-ink</code> and <code>p-brutal</code>. The classes stay short, the value has one definition, and a redesign becomes a single edit.</p><h3>Tailwind 3: the config</h3><p>Extend the relevant scale in the config instead — <code>colors</code>, <code>spacing</code>, <code>gridTemplateColumns</code>. The effect is the same: one named value, used everywhere, changeable in one place.</p><h3>A quick audit</h3><ul><li>Search the codebase for <code>bg-[#</code>: every hit is a colour that exists only in markup.</li><li>Search for <code>px-[</code> and <code>py-[</code>: repeated pixel values reveal a spacing scale nobody documented.</li><li>Any hit appearing three or more times is a promotion candidate, not a style choice.</li></ul><h3>When brackets are genuinely right</h3><p>Layout specs from a design file — a three-column shell with a 300px sidebar — rarely belong in the theme, because they are used once. The test is reuse, not taste: one-off structure stays in brackets, repeated decisions become tokens.</p><h3>Type hints in practice</h3><p>Most bracket values infer their property from the utility prefix: <code>w-[...]</code> is a width, <code>bg-[...]</code> is a colour or an image. Ambiguity appears when one prefix maps to several properties, which is where <code>text-[length:...]</code> or <code>text-[color:...]</code> earns its keep. The hint costs nothing and removes a class of silent misparse. If a value refuses to compile, check the hint before rewriting the value.</p><h2>Common Mistakes</h2><ul><li>Using spaces instead of underscores inside the brackets; the class split happens at whitespace and half the value is dropped.</li><li>Arbitrary values for the whole spacing scale — <code>p-[13px]</code> repeated forty times is a scale nobody agreed on.</li><li>Missing type hints on ambiguous values, producing wrong property types in some contexts.</li><li>Using brackets to bypass a token you dislike instead of fixing the token.</li></ul><h2>Browser Support / Caveats</h2><p>Arbitrary values compile to plain CSS, so support is whatever the underlying property supports — for <code>mask-image</code>, check the prefix situation in Safari. Tailwind's scanner must be able to see the literal string, so never build these dynamically by concatenating variables; write the full class or map from a finite set of complete strings.</p><h2>Related Resources</h2><p>An input that uses bracketed values for its brutalist borders is free at <a href="/products/3d-brutalist-username-field">3D brutalist username field</a>. Fluid sizing with <code>clamp()</code> is covered in <a href="/blog/css-clamp-fluid-type">this article</a>, and the syntax is documented at <a href="https://tailwindcss.com/docs/adding-custom-styles" rel="nofollow noopener" target="_blank">tailwindcss.com</a>.</p><p><strong>Try it on SteaCode:</strong> see arbitrary values in a real component at <a href="/products/3d-brutalist-username-field">3D brutalist username field</a>.</p>`
  },
  {
    slug: "tailwind-responsive-card-grid",
    title: "Build a Responsive Card Grid in Tailwind CSS",
    category: "Tailwind",
    date: "2027-01-18",
    excerpt: "Either step columns at breakpoints (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3) or use auto-fit with a minmax floor and let the grid wrap itself. Always ship a gap.",
    content: `<p>A card grid is the single most reused layout on any marketplace, dashboard or blog. Tailwind has two genuinely good answers and one cliché — fixed pixel widths with media queries — that breaks the moment a card grows a longer title.</p><h2>Direct Answer</h2><p>Stepped approach: <code>grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6</code>. Self-wrapping approach: <code>grid gap-6 grid-cols-[repeat(auto-fit,minmax(260px,1fr))]</code>, which fills the row with as many 260px-or-wider columns as fit and stretches them evenly — no breakpoints at all. Use the stepped version when the design must have exactly two columns at tablet width; use auto-fit when content volume varies.</p><h2>Full Code Example</h2><pre><code>&lt;!-- Stepped: precise control per breakpoint --&gt;
&lt;div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"&gt;
  &lt;article class="rounded-2xl border bg-white p-5 shadow-sm"&gt;Card&lt;/article&gt;
&lt;/div&gt;

&lt;!-- Self-wrapping: no breakpoints, cards never narrower than 260px --&gt;
&lt;div class="grid gap-6 grid-cols-[repeat(auto-fit,minmax(260px,1fr))]"&gt;
  &lt;article class="rounded-2xl border bg-white p-5 shadow-sm"&gt;Card&lt;/article&gt;
&lt;/div&gt;

&lt;!-- Equal heights without flex hacks: grid items stretch by default --&gt;
&lt;div class="grid grid-cols-1 gap-6 sm:grid-cols-2 items-stretch"&gt;
  &lt;article class="flex h-full flex-col justify-between rounded-2xl border p-5"&gt;
    &lt;h3 class="font-semibold"&gt;Title&lt;/h3&gt;
    &lt;button class="mt-4 self-start rounded-lg bg-gray-900 px-4 py-2 text-white"&gt;Open&lt;/button&gt;
  &lt;/article&gt;
&lt;/div&gt;</code></pre><h2>Why This Works</h2><p>Grid items stretch to fill their row by default, which is why equal-height cards need no flex hacks per row — every card in a row is as tall as the tallest, and the footer aligns because each card is a flex column with a bottom-aligned action. <code>auto-fit</code> collapses empty tracks, while <code>auto-fill</code> keeps them, leaving a grid that fits the container; pair <code>auto-fit</code> with <code>minmax(260px,1fr)</code> and the browser does the responsive maths the media queries would have done.</p><h3>Why gap, not margins</h3><p><code>gap</code> only appears between tracks, so there is no outer margin to cancel and no last-child exception. Margin-based gutters need negative margins on the container and produce 1px seams at fractional zoom levels — <code>gap</code> has neither problem.</p><h3>Why the min width matters</h3><p>260px is not arbitrary: below roughly 240px a title wraps to three lines and every card becomes a different height. Pick the floor from the content's real minimum width, not from a nice round number.</p><h2>Container Queries and Card Content Discipline</h2><p>A breakpoint grid answers how wide the browser is, but a card in a sidebar and the same card in a hero need different layouts at the same viewport width. Container queries move the decision to the slot, and Tailwind exposes them directly.</p><h3>The same card, two slots</h3><p>Mark the wrapper <code>@container</code>, then style the card with <code>@md:grid-cols-[120px_1fr]</code>. In a 280px sidebar the card stays stacked; in a 700px hero it becomes horizontal. No media query and no duplicated component.</p><h3>Content that scales with the slot</h3><p>Let the title wrap to two lines and cap it with <code>line-clamp-2</code>. Cards in a grid look ragged when one has a paragraph and the next has a sentence, so clamp the body copy instead of letting content define the row height and then complaining about alignment.</p><h3>Images that behave</h3><p>Give every card image an <code>aspect-ratio</code> and <code>object-fit: cover</code> so the grid keeps its rhythm while files load. Without a reserved box, the first paint is a stack of empty cards that jump when the images arrive. CLS in a grid is almost always this.</p><h3>Choosing the approach</h3><ul><li>Fixed number of columns per breakpoint: stepped media queries.</li><li>Cards that should fill the row evenly: <code>auto-fit</code> with a <code>minmax</code> floor.</li><li>One component used in slots of different widths: container queries.</li></ul><h3>Card density at ultra-wide widths</h3><p>A stepped grid that stops at four columns leaves a 2560px monitor with four very wide cards, which looks broken rather than generous. Add one more step at 2xl, or switch the track definition to <code>auto-fit</code> so the row keeps filling as space appears. Set a maximum width on the container as well: a card grid stretched to the full window is rarely the design anyone signed off. A max-width around 1280px with centred margins keeps card proportions stable on large screens.</p><p>Test the grid at 320px, 768px and 1440px with real copy. Placeholder text hides the two failures that matter: a title wrapping to three lines, and an action button pushed out of the card.</p><h2>Common Mistakes</h2><ul><li>Grid without <code>gap</code>, producing cards fused into a wall.</li><li>Fixed <code>w-[300px]</code> cards, which overflow a 320px phone.</li><li><code>grid-cols-3</code> at all widths, which is unreadable on mobile.</li><li><code>items-start</code> on a grid that needs equal-height cards, leaving ragged bottoms.</li></ul><h2>Browser Support / Caveats</h2><p>CSS Grid is universal. The arbitrary <code>repeat(auto-fit, minmax(...))</code> form compiles to native CSS and needs no polyfill. One Tailwind 4 note: the same utilities exist, but arbitrary grid templates must be written as complete strings so the scanner can see them.</p><h2>Related Resources</h2><p>A full bento layout built on these patterns is free at <a href="/products/bento-grid-designer-portfolio">bento grid portfolio</a>. Choosing between the two layout models is covered in <a href="/blog/css-grid-vs-flexbox">Grid vs Flexbox</a>, and the utility list is at <a href="https://tailwindcss.com/docs/grid-template-columns" rel="nofollow noopener" target="_blank">tailwindcss.com</a>.</p><p><strong>Try it on SteaCode:</strong> the <a href="/products/bento-grid-designer-portfolio">bento grid portfolio</a> ships this exact self-wrapping maths.</p>`
  },
  {
    slug: "tailwind-animate-on-scroll",
    title: "How to Animate Elements on Scroll in Tailwind CSS",
    category: "Tailwind",
    date: "2027-01-19",
    excerpt: "Tailwind has no scroll animation utility. Combine an IntersectionObserver with transition and translate classes: toggle one class per element, let CSS do the animation, and respect reduced motion.",
    content: `<p>Every landing page wants the fade-up-on-scroll effect and almost every implementation listens to <code>scroll</code>, reads layout, and janks. The correct version does no work during scrolling at all — it observes, flips a class, and lets the compositor run the animation.</p><h2>Direct Answer</h2><p>Use an <code>IntersectionObserver</code> per element, or one shared observer, with a threshold around 0.15. When an element intersects, add a class that swaps <code>opacity-0 translate-y-6</code> for <code>opacity-100 translate-y-0</code>, and put <code>transition-all duration-500 ease-out</code> on the element. Unobserve after the first reveal so the animation never replays. Under <code>motion-reduce:</code>, skip the transform entirely.</p><h2>Full Code Example</h2><pre><code>function useReveal() {
  const ref = useRef(null);
  useEffect(() =&gt; {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) { el.dataset.reveal = "in"; return; }
    const io = new IntersectionObserver(
      ([entry]) =&gt; {
        if (entry.isIntersecting) {
          el.dataset.reveal = "in";
          io.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () =&gt; io.disconnect();
  }, []);
  return ref;
}

&lt;!-- Tailwind handles the animation; data-reveal is the switch --&gt;
&lt;div
  ref={ref}
  class="opacity-0 translate-y-6 transition-all duration-500 ease-out
         data-[reveal=in]:opacity-100 data-[reveal=in]:translate-y-0
         motion-reduce:translate-y-0 motion-reduce:opacity-100"
&gt;
  Content
&lt;/div&gt;</code></pre><h2>Why This Works</h2><p>The observer reports intersection changes off the main thread's scroll path — the browser computes visibility internally and hands you a boolean, so there is no <code>getBoundingClientRect</code> and no layout read per frame. The animation itself is <code>opacity</code> and <code>transform</code>, both compositor properties, so mid-animation frames never trigger layout or paint.</p><h3>Why data attributes instead of a className swap</h3><p>A data attribute keeps the state machine in HTML and lets Tailwind's <code>data-[...]</code> variant handle the styles. There is no string concatenation of class names, which is where half of these implementations lose their base classes.</p><h3>The rootMargin trick</h3><p>A negative bottom margin delays the trigger until the element is a little way into the viewport, so the animation fires when the user is actually looking at it rather than the instant a pixel appears at the edge.</p><h2>One Observer for Many Elements and Staggered Reveals</h2><p>Creating an observer per element works, but a page with forty reveal targets creates forty observers and forty callbacks. A single shared observer that looks up the target by data attribute is cheaper and easier to reason about.</p><h3>The shared observer</h3><p>Observe every <code>[data-reveal]</code> element from one instance, and inside the callback read the entry's target to flip its attribute. Unobserve per element as it reveals, so the observer shrinks as the user scrolls and nothing replays on the way back up.</p><h3>Staggering children</h3><p>Reveal the parent once and let children transition with an index-based delay. Cap the delay: ten items at 60 milliseconds each is half a second, and beyond that the last item feels late rather than choreographed.</p><h3>Content that must never hide</h3><p>Never start text at zero opacity unless the observer is guaranteed to run. If JavaScript fails, a blocked observer or a hydration error leaves a blank page. The safe pattern applies the hidden state from JavaScript itself, so a no-JS render is fully visible.</p><h3>Checking the result</h3><ul><li>Scroll slowly: each element animates once, and scrolling back up does not replay it.</li><li>Enable reduced motion: content is visible immediately with no transform.</li><li>Throttle the network: the page is readable before scripts finish.</li><li>Check the Performance panel: no long tasks during scroll.</li></ul><h3>Reveal animations and search engines</h3><p>Content hidden at zero opacity is still in the HTML, so crawlers see it, but a reader with JavaScript disabled sees nothing. The script-applied hidden state avoids both problems: the markup is visible by default and only becomes hidden once the observer is ready. Keep the reveal under 600 milliseconds, and never delay the first section of the page, because the fold should be visible immediately. Reveal effects are polish; shipping them on every section makes scrolling feel like work.</p><p>Finally, verify the reveal with JavaScript disabled. If any section is blank, the hidden state is in the markup rather than applied by script.</p><h2>Common Mistakes</h2><ul><li>Animating <code>height</code>, <code>top</code> or <code>margin</code>: every frame costs layout.</li><li>Re-observing so elements re-hide when scrolled back up — a page that strobes.</li><li>Starting visible and animating in, which causes a flash of content before the observer fires.</li><li>Ignoring <code>motion-reduce:</code>, which some users set for vestibular safety, not taste.</li></ul><h2>Browser Support / Caveats</h2><p><code>IntersectionObserver</code> is supported everywhere and degrades cleanly — the snippet above reveals immediately when it is missing. Set the initial hidden state in CSS, not in an effect, so the content is never painted in its final position first. For lists, observe one container and stagger children with <code>transition-delay</code> rather than creating hundreds of observers.</p><h2>Related Resources</h2><p>A production reveal animation is free at <a href="/products/splittext-character-stagger-reveal">split-text stagger reveal</a>. The accessibility side of animation is covered in <a href="/blog/prefers-reduced-motion-css">prefers-reduced-motion</a>, and the observer API is documented at <a href="https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver" rel="nofollow noopener" target="_blank">MDN</a>.</p><p><strong>Try it on SteaCode:</strong> copy the <a href="/products/splittext-character-stagger-reveal">split-text stagger reveal</a> for a scroll-triggered headline.</p>`
  },
  {
    slug: "tailwind-custom-plugin",
    title: "Writing a Custom Tailwind CSS Plugin",
    category: "Tailwind",
    date: "2027-01-20",
    excerpt: "A plugin is the right home for utilities you use on every project: declare them once, get every variant for free, and keep the markup readable. Use theme() inside, never hard-coded colours.",
    content: `<p>The moment three projects need the same <code>text-balance</code> utility or the same card shell, copy-pasted arbitrary values stop being acceptable. A Tailwind plugin turns that snippet into a first-class utility with hover, focus, responsive and dark variants generated automatically.</p><h2>Direct Answer</h2><p>Write a plugin with <code>plugin(({ addUtilities, addComponents, addBase, matchUtilities, theme }) =&gt; { ... })</code> and register it in the config's <code>plugins</code> array. Use <code>addUtilities</code> for single-property helpers, <code>addComponents</code> for multi-property class shells, <code>matchUtilities</code> for utilities that take a value, and <code>addBase</code> for element defaults. Read design tokens through <code>theme()</code> so the plugin follows the palette instead of forking it.</p><h2>Full Code Example</h2><pre><code>const plugin = require("tailwindcss/plugin");

module.exports = {
  plugins: [
    plugin(function ({ addUtilities, addComponents, matchUtilities, theme }) {
      // 1. Single-purpose utilities
      addUtilities({
        ".text-balance": { textWrap: "balance" },
        ".content-auto": { contentVisibility: "auto" },
      });

      // 2. A component shell, styled from the theme
      addComponents({
        ".card-shell": {
          borderRadius: theme("borderRadius.2xl"),
          backgroundColor: theme("colors.white"),
          border: "1px solid " + theme("colors.gray.200"),
          padding: theme("spacing.5"),
          boxShadow: theme("boxShadow.sm"),
        },
      });

      // 3. Value-taking utility: inset-[...] style helpers
      matchUtilities(
        { "avoid-": (value) =&gt; ({ overflowAnchor: value }) },
        { values: { none: "none", auto: "auto" } }
      );
    }),
  ],
};</code></pre><h2>Why This Works</h2><p>Plugins run inside Tailwind's own generation pass, which means every class you emit goes through the same variant engine. <code>addUtilities</code> produces classes that answer to <code>hover:</code>, <code>md:</code>, <code>dark:</code> and <code>group-hover:</code> without you registering any of them. That is the payoff over a plain CSS file where each state is hand-written.</p><h3>Why theme() and not hex codes</h3><p><code>theme("colors.gray.200")</code> resolves at build time to the current palette. Change the palette and the plugin follows; hard-code <code>#e5e7eb</code> and the component drifts out of the design system on the next rebrand.</p><h3>Utilities vs components</h3><p>Utilities describe one decision and compose. Components bundle several. Reach for <code>addComponents</code> only when the bundle is genuinely atomic — a card shell, a prose block — and keep the escape hatch of overriding with utilities afterwards.</p><h2>Packaging, Testing and the Tailwind 4 Migration</h2><p>A plugin that only works inside one repository is a snippet with extra steps. Treat it as a package from the start and it can be shared across projects without a rewrite.</p><h3>Structure and options</h3><p>A plugin is a function that receives the API; options arrive through <code>plugin.withOptions</code>. Keep the default export a factory so consumers can pass a prefix or a list of extra values without forking the code.</p><h3>Testing what it emits</h3><p>The reliable test is a build fixture: a tiny HTML file containing every class the plugin should generate, compiled with the plugin, then asserted against the output CSS. Snapshot the emitted declarations rather than the class names, because the classes are the contract and the declarations are the result.</p><h3>Tailwind 4 and @utility</h3><p>Version 4 moves configuration into CSS. Single-property helpers become <code>@utility</code> blocks, which is simpler and still gives you the variant engine. Multi-property component shells read better as a JS plugin registered through <code>@plugin</code>, so a mixed approach is normal during the transition.</p><h3>Release checklist</h3><ul><li>Peer-depend on the Tailwind version range you actually tested.</li><li>Export the plugin as both ESM and CJS, since configs still load both.</li><li>Document every class the plugin emits in the README.</li><li>Keep the emitted CSS small: a plugin that doubles the stylesheet is a bug report waiting to happen.</li></ul><h3>When a plugin is the wrong tool</h3><p>If the class is used once, write the utilities inline instead of formalising a plugin. If the bundle of styles varies per instance, a component is the better home. A plugin earns its place when the same atomic decision appears across projects and must answer to every variant, which is the specific thing it does better than a stylesheet.</p><p>Finally, version the plugin against the Tailwind version it targets. A plugin pinned to an old major silently stops generating classes after an upgrade, which is a broken build disguised as a dependency bump.</p><h2>Common Mistakes</h2><ul><li>Using <code>addComponents</code> for things that should compose as utilities, producing classes users cannot extend.</li><li>Hard-coding colours instead of reading the theme, so the plugin ignores dark mode tokens.</li><li>Dumping raw <code>@layer</code> CSS into a plugin body — if you are not emitting classes, a stylesheet is the better tool.</li><li>Forgetting Tailwind 4: plugins move to <code>@plugin</code> in CSS, but the same JS API works via a compatibility path.</li></ul><h2>Browser Support / Caveats</h2><p>The plugin API is build-time; runtime support depends on the CSS you emit. <code>text-wrap: balance</code> needs Chrome 114+, Safari 17.5+, Firefox 121+ and is harmless where absent. In Tailwind 4, prefer <code>@utility</code> for simple single-property helpers and keep a JS plugin for component bundles.</p><h2>Related Resources</h2><p>A layered gradient surface built from tokens is free at <a href="/products/gradientwaves-layered-horizon">gradient waves horizon</a>. Token architecture is explained in <a href="/blog/design-tokens-two-layer-architecture">design tokens, two layers</a>, and the plugin API is documented at <a href="https://tailwindcss.com/docs/plugins" rel="nofollow noopener" target="_blank">tailwindcss.com</a>.</p><p><strong>Try it on SteaCode:</strong> the <a href="/products/gradientwaves-layered-horizon">gradient waves horizon</a> component is styled entirely through theme tokens.</p>`
  },
  {
    slug: "tailwind-gradient-text",
    title: "Gradient Text in Tailwind CSS",
    category: "Tailwind",
    date: "2027-01-21",
    excerpt: "bg-clip-text text-transparent plus a gradient: paint the gradient on the element, then clip it to the glyphs. Forget text-transparent and you just get a gradient box.",
    content: `<p>Gradient headlines are the cheapest way to make a hero feel designed, and they fail in a predictable way: you add the gradient classes and the text disappears behind a coloured rectangle. Two of the three required classes are missing, and the third is easy to forget.</p><h2>Direct Answer</h2><p>Three decisions together: a gradient background (<code>bg-gradient-to-r from-amber-400 to-orange-600</code>), <code>bg-clip-text</code> to clip that background to the glyph shapes, and <code>text-transparent</code> to make the glyph fill let the background show through. Omit any one and you get either normal text or a gradient block. Add <code>bg-clip-text</code> only to inline or inline-block elements with a bounded width.</p><h2>Full Code Example</h2><pre><code>&lt;!-- The working trio --&gt;
&lt;h1 class="bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-600
           bg-clip-text text-transparent"&gt;
  Ship faster on SteaCode
&lt;/h1&gt;

&lt;!-- Multi-line headlines: constrain the width so the gradient spans lines --&gt;
&lt;p class="max-w-[18ch] bg-gradient-to-br from-sky-400 to-indigo-600
          bg-clip-text text-transparent text-4xl font-extrabold"&gt;
  Copy-paste UI, honestly free
&lt;/p&gt;

&lt;!-- Animated sweep: the gradient moves, the text is still clipped --&gt;
&lt;span class="bg-[length:200%_100%] bg-gradient-to-r from-gray-900 via-gray-400 to-gray-900
             bg-clip-text text-transparent animate-[shine_3s_linear_infinite]"&gt;
  Loading headline
&lt;/span&gt;</code></pre><h2>Why This Works</h2><p>The text colour must be transparent because the browser paints a gradient background behind the text, then clips it to the glyph outlines. If the text is opaque, its fill covers the clipped gradient. If clipping is missing, the full element rectangle shows the gradient. All three properties describe one paint: background → clip → see through the letters.</p><h3>Contrast and selection</h3><p>Gradient text is the easiest way to fail a contrast audit: the WCAG ratio is measured against the lightest point of the gradient, not the average. Keep the two stops within a similar luminance range, or use a solid colour for any text under 24px. Selection highlighting also looks muddy behind transparent text; set a solid <code>::selection</code> colour.</p><h3>Where it breaks</h3><p><code>bg-clip-text</code> needs a box to clip against. On a purely inline element whose gradient is defined relative to its own width, an inline box that wraps inherits the gradient per line fragment in some engines. Use <code>inline-block</code> or a constrained block, and the gradient spans the sentence properly.</p><h2>Fallbacks, Selection and Performance</h2><p>Gradient text touches three things that break quietly: browsers without clipping support, users selecting the headline, and the paint cost of an animated background. Each has a cheap fix.</p><h3>A fallback that is not invisible</h3><p>Never rely on an inline style that makes text transparent. Keep the transparency in Tailwind's class so a browser without <code>background-clip: text</code> simply paints normal text — the design degrades to a solid headline rather than an empty gap. If you must support very old engines, wrap the transparent rule in an <code>@supports</code> guard.</p><h3>Selection and caret</h3><p>Transparent text makes the native selection highlight look like a coloured block with no letters. Set a solid <code>::selection</code> background and a normal text colour inside it, so copying the headline is legible. The same applies to a caret if the gradient is ever applied to editable text, which it should not be.</p><h3>Animated gradients cost paint</h3><p>Moving <code>background-position</code> across a large headline repaints the glyphs every frame. Keep the element small, use a two-stop gradient, and pause the animation when the tab is hidden. On a hero that is always visible, a slow sweep still looks smooth, but the battery cost is real on mobile.</p><h3>Where gradient text should stop</h3><ul><li>Headlines and wordmarks: yes, provided contrast is checked at the lightest stop.</li><li>Buttons: risky, since the label must stay readable in every state.</li><li>Body copy: no. Gradient text below 24px fails both contrast and legibility.</li></ul><h3>Testing contrast programmatically</h3><p>Sample both gradient stops, compute the ratio against the background behind the text, then take the worst result. A tool that checks only the first colour passes a headline that is unreadable at its lightest end. When the lightest stop falls below 4.5 to 1, darken it rather than adding a text shadow, because shadows on clipped text are invisible.</p><h2>Common Mistakes</h2><ul><li>Missing <code>text-transparent</code>, leaving a gradient rectangle where the headline should be.</li><li>Reverse order thinking: adding <code>text-transparent</code> without a gradient leaves invisible text — a genuine outage, not a styling bug.</li><li>Using gradient text for body copy, which is unreadable at 16px and fails contrast.</li><li>Animating <code>background-position</code> on huge elements, causing a full repaint each frame.</li></ul><h2>Browser Support / Caveats</h2><p><code>background-clip: text</code> is supported in current Chrome, Safari, Firefox and Edge; Tailwind emits the <code>-webkit-</code> prefix automatically. Where support is missing the text renders in its normal colour — a graceful fallback, provided you did not also make it transparent via a fallback-less inline style. Add <code>motion-reduce:animate-none</code> to the animated variant.</p><h2>Related Resources</h2><p>A gradient wordmark component is free at <a href="/products/warptext-glass-refraction-headline">glass refraction headline</a>. The glass treatment it pairs with is covered in <a href="/blog/glassmorphism-button">glassmorphism buttons</a>, and the property is documented at <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/background-clip" rel="nofollow noopener" target="_blank">MDN</a>.</p><p><strong>Try it on SteaCode:</strong> copy the <a href="/products/warptext-glass-refraction-headline">glass refraction headline</a> for a gradient hero that ships with its contrast checked.</p>`
  },
  {
    slug: "reduce-cumulative-layout-shift",
    title: "How to Reduce Cumulative Layout Shift (CLS)",
    category: "Performance",
    date: "2027-01-22",
    excerpt: "CLS is unexpected movement after paint. Reserve space for every media element, ad slot and late-loading font — with dimensions, aspect-ratio or min-height — and nothing shifts when it arrives.",
    content: `<p>CLS is the metric that measures how much the page moves under the user's cursor after it has already been painted. It is not about how fast something loads; it is about whether an element that was already rendered relocates. That distinction is why a 300ms image load scores well and a 30ms banner insertion scores terribly.</p><h2>Direct Answer</h2><p>Reserve space before the content exists. Give every <code>&lt;img&gt;</code> a width and height (or an <code>aspect-ratio</code> box) so the browser allocates the right area on first layout. Give ad slots a <code>min-height</code> matched to the creative size. Give text containers a fallback font with matched metrics, or accept a <code>size-adjust</code> override. Never insert a banner, cookie bar or notification above content that is already painted — that is the single largest CLS source in the wild.</p><h2>Full Code Example</h2><pre><code>/* 1. Media: reserve the exact box before the file arrives */
.hero-image {
  aspect-ratio: 16 / 9;
  width: 100%;
  height: auto;
  object-fit: cover;
  background: #e5e7eb; /* visible placeholder while loading */
}

/* 2. Ad slot: fixed reservation, not min-height that grows */
.ad-slot {
  width: 100%;
  height: 250px;        /* matches the creative, so arrival shifts nothing */
  contain: layout size; /* isolates the slot from the rest of the page */
  overflow: hidden;
}

/* 3. Fonts: match the fallback's metrics to the web font */
@font-face {
  font-family: "Inter Fallback";
  src: local("Arial");
  size-adjust: 107%;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}
body { font-family: Inter, "Inter Fallback", sans-serif; }</code></pre><h2>Why This Works</h2><p>The browser lays out once with the information it has. If an image has no dimensions, it gets zero height, and every sibling below starts too high; when the image arrives, everything jumps. Declaring <code>aspect-ratio</code> gives the layout engine the final box up front, so the arrival is a paint change, not a layout change.</p><h3>What never counts toward CLS</h3><p>Shifts caused by user interaction within 500ms do not count — opening a menu is not the page's fault. Animations using <code>transform</code> do not count, because the element's layout position is unchanged; this is why entrances should always be transform/opacity, never height or margin.</p><h3>The font problem</h3><p>A web font with different metrics re-flows every line when it swaps in. <code>size-adjust</code> and the ascent/descent overrides reshape the fallback to occupy the same space, so the swap happens with no line reflow at all. It is the only reliable fix for text-driven CLS.</p><h2>Finding CLS Sources in the Field</h2><p>Laboratory tools show a single synthetic load; field data shows what real users experienced on real connections. The two disagree often, and the field number is the one that counts.</p><h3>Read the attribution, not just the score</h3><p>CrUX and the Web Vitals extension report which element moved and how far. Start there rather than guessing: the largest shift is almost always an image without dimensions, an injected banner, or a late-loading font. Fixing the second-largest first wastes a release.</p><h3>A triage order that works</h3><ul><li>Inventory every above-the-fold media element and confirm each has dimensions or an <code>aspect-ratio</code> box.</li><li>Audit third-party insertions: ads, consent bars, chat widgets, promo strips. Any inserted above painted content is a shift.</li><li>Check the font swap path: a fallback with mismatched metrics reflows every line on swap.</li><li>Look for accordions or tabs animating <code>height</code>, which shift everything below on each frame.</li></ul><h3>Why the score differs between tools</h3><p>Lighthouse simulates a fast connection and a single viewport, so a shift that only appears on a slow phone is invisible. Field data aggregates the 75th percentile, where the slowest quarter of sessions live. When the lab score is green and the field score is not, trust the field and instrument the slow path.</p><h3>Reserving space for ads specifically</h3><p>Ad slots are the hardest case because the creative size is decided by a network, not by you. Reserve the largest size the slot may serve, centre the creative inside it, and never let the slot grow after fill. A fixed <code>min-height</code> is not enough: the container must be a hard box with <code>contain: layout size</code> so its contents cannot resize its ancestors.</p><h2>Common Mistakes</h2><ul><li>Images without dimensions, the most common single cause.</li><li>Ad slots with <code>min-height</code> that grow when the creative loads — the slot must be a fixed, reserved size.</li><li>Injecting a consent banner or promo above the fold after paint.</li><li>Animating <code>height: auto</code> for accordions, which shifts everything below on every frame.</li></ul><h2>Browser Support / Caveats</h2><p><code>aspect-ratio</code> is universal in current browsers; older Safari needs the padding-top fallback. <code>size-adjust</code> requires Chrome 92+, Firefox 91+ and Safari 17+. CLS is measured in the field, so verify with the CrUX dashboard rather than a single Lighthouse run — one slow third-party script can dominate the 75th percentile.</p><h2>Related Resources</h2><p>A hero section that reserves its media box is free at <a href="/products/premium-website-hero">premium website hero</a>. Font-loading strategy is covered in <a href="/blog/font-display-swap-preload">font-display and preload</a>, and the metric is defined on <a href="https://web.dev/articles/cls" rel="nofollow noopener" target="_blank">web.dev</a>.</p>`
  },
  {
    slug: "interaction-to-next-paint-inp",
    title: "Improving Interaction to Next Paint (INP)",
    category: "Performance",
    date: "2027-01-23",
    excerpt: "INP is the time from a tap or keypress to the next painted frame. Most bad INP is one long task blocking the main thread — split the work, defer the heavy part, and keep handlers off the critical path.",
    content: `<p>INP replaced First Input Delay as a Core Web Vital because FID only measured the queue delay before a handler started. INP measures the whole thing: input arrives, the main thread is busy, the handler runs, the browser paints the result. A page that feels laggy on a mid-range Android is failing INP even if every individual task looks short.</p><h2>Direct Answer</h2><p>Keep the main thread free at the moment of interaction. Break long tasks into chunks under 50ms, defer non-visual work with <code>scheduler.postTask</code> or <code>setTimeout</code>, and keep event handlers to state changes plus a paint. If a handler must do heavy computation, compute after the paint with <code>requestAnimationFrame</code> then a deferred callback, or move it to a worker.</p><h2>Full Code Example</h2><pre><code>// Bad: one 300ms task inside the click handler
function onClick() {
  const rows = buildRows(data);   // 300ms of work before the user sees anything
  setRows(rows);
}

// Better: paint the acknowledgement first, then do the work
function onClick() {
  setBusy(true);                                    // immediate visual feedback
  requestAnimationFrame(() =&gt; {
    setTimeout(() =&gt; {
      const rows = buildRows(data);
      setRows(rows);
      setBusy(false);
    }, 0);
  });
}

// Best when available: prioritised scheduling
async function onClick() {
  setBusy(true);
  await scheduler.postTask(() =&gt; buildRows(data), { priority: "background" })
    .then((rows) =&gt; { setRows(rows); setBusy(false); });
}

// Chunk a long loop so the browser can paint between slices
async function processItems(items) {
  for (let i = 0; i &lt; items.length; i += 50) {
    doWork(items.slice(i, i + 50));
    await new Promise((r) =&gt; setTimeout(r, 0)); // yield to the event loop
  }
}</code></pre><h2>Why This Works</h2><p>A long task blocks everything: input events queue behind it, and the browser cannot paint until it ends. Yielding returns control to the event loop, letting input handling and paint interleave with your work. The visible result is that the first frame after a tap reflects the tap immediately, even if the expensive result arrives a moment later.</p><h3>Three parts of INP</h3><p>Input delay (waiting for the main thread), processing time (your handlers and React work), and presentation delay (style, layout, paint). Optimising only processing gets you partway; shipping a 200KB script that runs on load delays every later interaction too.</p><h3>What to look for in the field</h3><p>INP is measured at the 75th percentile of interactions, so a single pathological case — a heavy chart re-render on every keystroke — defines the score. Look at the interaction with the worst value, not the average, and fix that one.</p><h2>Diagnosing INP with the Performance Panel</h2><p>INP is easy to state and hard to locate, because the slow interaction is usually not the one you are testing. The Performance panel turns the metric into a timeline you can read.</p><h3>Record the real interaction</h3><p>Start a recording, then perform the interaction slowly and deliberately: type into the search field, open the menu, change a filter. The panel marks the input, the task it triggered, and the frame that finally painted. That gap is the number you are optimising.</p><h3>Read the three segments</h3><ul><li><strong>Input delay</strong>: a long task was already running when the input arrived. Fix the work that runs before the interaction, not the handler itself.</li><li><strong>Processing</strong>: your handler and the React render. Fix by narrowing state updates so one keystroke does not re-render the tree.</li><li><strong>Presentation</strong>: style, layout and paint. Fix by avoiding layout reads in handlers and keeping the visual change small.</li></ul><h3>A common React pattern that fails</h3><p>A controlled input whose <code>onChange</code> filters a thousand rows synchronously will fail INP on mid-range hardware even though the code looks ordinary. Debounce the filter, or move it into a transition so the keystroke paints immediately and the list updates behind it.</p><h3>Measure after every fix</h3><p>INP moves in small increments. Re-record the same interaction and compare the three segments; a change that improves processing but worsens presentation has simply moved the cost.</p><h3>The interaction budget</h3><p>Aim for the frame after a tap to arrive within 100 milliseconds. Anything above that is perceptible as lag; above 300 milliseconds it feels broken. Budget the main thread per interaction rather than per page load, and treat every third-party script as a competitor for that budget.</p><h2>Common Mistakes</h2><ul><li>Huge synchronous state updates in <code>onChange</code>, making every keystroke a long task.</li><li>Third-party scripts executing on the main thread at the moment of interaction.</li><li>Reading layout in a loop (<code>offsetHeight</code> then write, repeatedly), causing forced reflow.</li><li>Hydrating a large tree while the user is already tapping, so early interactions queue behind hydration.</li></ul><h2>Browser Support / Caveats</h2><p><code>scheduler.postTask</code> is Chromium-only; feature-detect it and fall back to <code>setTimeout</code>, as above. INP is available in the field through CrUX and locally via the <code>PerformanceObserver</code> <code>event</code> entry type — the same observer shape used for LCP.</p><h2>Related Resources</h2><p>A pointer-driven component where frame cost matters is free at <a href="/products/glow-cursor">glow cursor</a>. Measuring in the browser is covered in <a href="/blog/measure-lcp-performanceobserver">PerformanceObserver for LCP</a>, and the metric is defined on <a href="https://web.dev/articles/inp" rel="nofollow noopener" target="_blank">web.dev</a>.</p>`
  },
  {
    slug: "css-3d-tilt-card-perspective",
    title: "Build a 3D Tilt Card Effect with CSS perspective",
    category: "CSS",
    date: "2027-01-24",
    excerpt: "Perspective goes on the parent, rotation on the child. Feed pointer position into rotateX and rotateY, keep transitions on transform only, and reset the card on pointer leave.",
    content: `<p>The tilt card is the effect everyone associates with premium product pages: the surface leans toward the cursor as if it had depth. It is about forty lines, and the one mistake that ruins it — putting <code>perspective</code> on the element that rotates — is invisible until you compare against a reference.</p><h2>Direct Answer</h2><p>Put <code>perspective</code> on the parent wrapper, and <code>transform: rotateX() rotateY()</code> on the card. Track <code>pointermove</code> over the card, map the cursor's position to a small angle range (about ±10 degrees), and write the rotation into a CSS custom property. On <code>pointerleave</code>, reset both angles to zero so the card settles. Use <code>transform-style: preserve-3d</code> only if children should pop out in depth.</p><h2>Full Code Example</h2><pre><code>.tilt-scene {
  perspective: 900px;      /* depth of field — belongs on the parent */
}

.tilt-card {
  transform:
    rotateX(var(--rx, 0deg))
    rotateY(var(--ry, 0deg));
  transition: transform 200ms ease-out;
  will-change: transform;
  transform-style: preserve-3d;
}

.tilt-card:hover { transition-duration: 60ms; } /* tighter follow while tracking */

/* script */
const card = document.querySelector(".tilt-card");
card.addEventListener("pointermove", (e) =&gt; {
  const r = card.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width;   // 0 → 1
  const py = (e.clientY - r.top) / r.height;   // 0 → 1
  card.style.setProperty("--ry", \`\${(px - 0.5) * 20}deg\`);
  card.style.setProperty("--rx", \`\${(0.5 - py) * 20}deg\`);
});
card.addEventListener("pointerleave", () =&gt; {
  card.style.setProperty("--rx", "0deg");
  card.style.setProperty("--ry", "0deg");
});</code></pre><h2>Why This Works</h2><p><code>perspective</code> establishes the vanishing point for the children's 3D transforms. On the rotating element itself it applies to that element's own children, not to its rotation, so the card looks flat and slightly skewed instead of receding. One level up, the rotation reads as genuine depth.</p><h3>Why custom properties rather than inline transforms</h3><p>Writing a whole <code>transform</code> string on every pointer event overwrites anything else that uses transform on the card — a hover lift, an entrance animation. Two custom properties let the base transform stay in CSS and the animation engine interpolate the angles.</p><h3>Performance and restraint</h3><p>Only <code>transform</code> changes, so this runs on the compositor. Ten degrees is enough; twenty looks broken. And on touch devices there is no hover, so gate the effect behind <code>@media (hover: hover)</code> or it will never fire.</p><h2>Touch, Keyboard and Reduced Motion</h2><p>The pointer version is the easy half. A tilt shipped without fallbacks is a card that is broken on a phone, unusable from a keyboard, and uncomfortable for anyone who has asked their system for less motion.</p><h3>Touch devices</h3><p>There is no hover on touch, and pointer events fire during a scroll gesture, producing a card that jumps while the user is trying to scroll. Gate the listener behind <code>@media (hover: hover) and (pointer: fine)</code>, or check <code>matchMedia</code> before attaching. A tap should do whatever the card does; tilt is not an interaction on its own.</p><h3>Keyboard parity</h3><p>If the card is focusable, give it a static lift on <code>:focus-visible</code> so keyboard users get equivalent feedback. Do not simulate tilt with arrow keys; that is an interaction cost paid for a decoration.</p><h3>Reduced motion</h3><p>Wrap the transition in <code>@media (prefers-reduced-motion: reduce)</code> and set the transform to none. This is not optional polish: a surface that moves with the cursor can cause genuine discomfort for people with vestibular disorders.</p><h3>Cost control</h3><ul><li>Listen with <code>pointermove</code>, not <code>mousemove</code> plus touch handlers.</li><li>Write custom properties only, never a full transform string.</li><li>Cache the rect on <code>pointerenter</code> instead of calling <code>getBoundingClientRect</code> inside the move handler.</li><li>Remove the listener entirely when the card leaves the viewport.</li></ul><h3>A cheaper alternative</h3><p>If the tilt is decorative, a static layered shadow and a two-pixel hover lift read almost as well and cost nothing at runtime. Reserve the pointer-driven version for a hero card the user is meant to inspect, not for every card in a grid. On a page with thirty cards, thirty pointer listeners is a measurable scroll cost on a low-end phone.</p><p>Finally, test with a trackpad and with a mouse. Trackpads fire many more pointer events per second, and an effect that looks smooth with a mouse can feel jittery when the pointer moves in small increments.</p><h2>Common Mistakes</h2><ul><li><code>perspective</code> on the card instead of its parent.</li><li>Moving the card with <code>top</code>/<code>left</code> for the tilt, causing layout on every frame.</li><li>No reset on <code>pointerleave</code>, leaving the card permanently skewed.</li><li>No <code>motion-reduce</code> guard — for some users, a moving surface is nausea, not delight.</li></ul><h2>Browser Support / Caveats</h2><p>3D transforms are universal. <code>transform-style: preserve-3d</code> combined with <code>overflow: hidden</code> and <code>filter</code> on ancestors creates a flattening bug in some engines — keep the card's ancestors free of filters. On iOS, pointer events fire for touch, but the effect is pointless without a persistent cursor, so restrict it to hover-capable devices.</p><h2>Related Resources</h2><p>A full 3D flip built on these same transforms is free at <a href="/products/3d-flip-login-sign-up">3D flip login</a>. The stacking-context side effect of transforms is covered in <a href="/blog/transform-creates-containing-block">transform creates a containing block</a>, and the property is documented at <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/perspective" rel="nofollow noopener" target="_blank">MDN</a>.</p>`
  },
  {
    slug: "css-animated-gradient-border",
    title: "Animated Gradient Border in CSS",
    category: "CSS",
    date: "2027-01-25",
    excerpt: "border-image cannot animate smoothly. Use a pseudo-element with a gradient background and background-clip, or register an angle with @property so conic gradients interpolate.",
    content: `<p>An animated gradient border looks like a one-line CSS trick and is actually two separate techniques: a cheap one that works everywhere and an elegant one that needs <code>@property</code>. Knowing which is which saves you from an animation that runs at four frames a second.</p><h2>Direct Answer</h2><p>Cheapest reliable method: give the element a gradient background and a transparent border, then place a pseudo-element with the element's own background colour inset by the border width — the gradient shows only through the gap. Smoothly rotating version: register a custom property with <code>@property</code> as a <code>&lt;angle&gt;</code> and animate a <code>conic-gradient</code> from it. Do not try to animate <code>border-image</code>; it does not interpolate.</p><h2>Full Code Example</h2><pre><code>/* A. Pseudo-element border — works everywhere */
.gradient-border {
  position: relative;
  border-radius: 16px;
  padding: 2px;                       /* border thickness */
  background: linear-gradient(135deg, #f5b400, #d97706);
}
.gradient-border::before {
  content: "";
  position: absolute;
  inset: 2px;
  border-radius: 14px;
  background: #fffdf7;                 /* inner surface */
}

/* B. Rotating conic border — Chromium + Safari 16.4 + Firefox 128 */
@property --angle {
  syntax: "&lt;angle&gt;";
  initial-value: 0deg;
  inherits: false;
}
.spin-border {
  border-radius: 16px;
  padding: 2px;
  background: conic-gradient(from var(--angle), #f5b400, #d97706, #f5b400);
  animation: spin 4s linear infinite;
}
@keyframes spin {
  to { --angle: 360deg; }
}
@media (prefers-reduced-motion: reduce) {
  .spin-border { animation: none; }
}</code></pre><h2>Why This Works</h2><p>The padding trick is a geometry hack: the outer box paints a gradient, the inner pseudo-element paints the surface, and the two-pixel difference between them reads as a border. Because both layers are plain backgrounds, the whole thing composites cheaply and animating the gradient's position costs one repaint of a small area.</p><h3>Why @property is required for smooth rotation</h3><p>Unregistered custom properties are strings, and strings do not interpolate — the browser jumps from <code>0deg</code> to <code>360deg</code> at the end of the animation. <code>@property</code> declares the type as <code>&lt;angle&gt;</code>, which makes it animatable, so the conic gradient sweeps smoothly.</p><h3>Why not border-image</h3><p><code>border-image</code> accepts a gradient but treats it as a static slice; changing the angle requires changing the image, which is not an interpolatable value. Every attempt to animate it either snaps or forces a full re-decode.</p><h2>Choosing Between the Techniques</h2><p>Three plausible implementations exist and they differ by what animates, not by how they look. Picking the wrong one is why some gradient borders stutter on a mid-range phone while an identical-looking neighbour is smooth.</p><h3>Static gradient border</h3><p>The padding and pseudo-element method paints two backgrounds. It is the cheapest and works everywhere, but nothing moves. Use it when the border is a brand accent rather than a motion piece.</p><h3>Rotating conic gradient</h3><p>Registering an angle with <code>@property</code> and animating the conic gradient is smooth on current Chromium and Safari, and degrades to a static ring elsewhere. Keep the element small: repainting a full-width panel at 60 frames per second is visible on low-end hardware.</p><h3>Rotating a pseudo-element instead</h3><p>The alternative that needs no <code>@property</code>: paint a large pseudo-element with a static conic gradient and rotate it with a <code>transform</code>. Because transform is compositor-only, this holds frame rate even on old devices, at the cost of a little more markup and an <code>overflow: hidden</code> wrapper. For big surfaces, this is usually the better trade.</p><h3>Decision summary</h3><ul><li>Static accent: pseudo-element background.</li><li>Small element, modern browsers: <code>@property</code> angle.</li><li>Large surface or older hardware: rotating pseudo-element.</li></ul><h3>The mask technique</h3><p>A fourth option uses <code>mask-composite</code> to punch a hole in a gradient layer, producing a border of any radius without a second pseudo-element. It is elegant and needs care: <code>mask-composite: exclude</code> is prefixed in Safari, and the mask must match the element's border radius. For a one-off hero panel it is the cleanest implementation; for a reusable component the padding trick is more portable.</p><p>Finally, decide the fallback before shipping: without <code>@property</code> support the ring should be a plainly visible static gradient, never an invisible border. Test by disabling the animation and confirming the border still reads as a border. A ring that disappears silently looks like a layout bug, not a graceful degradation.</p><h2>Common Mistakes</h2><ul><li>Animating <code>border-image</code> and concluding CSS can't do it.</li><li>Forgetting that the pseudo-element needs the same radius, less the border width, or corners bulge.</li><li>Animating <code>background-position</code> over a viewport-sized gradient, repainting megabytes each frame.</li><li>Shipping the conic version with no static fallback, so unsupported browsers show a solid block.</li></ul><h2>Browser Support / Caveats</h2><p>The pseudo-element method is universal. <code>@property</code> needs Chrome 85+, Safari 16.4+ and Firefox 128+; below that, the border renders as a static gradient, which is an acceptable fallback if the gradient itself is the design. Keep the animated element small — a 40px button, not a full-width panel.</p><h2>Related Resources</h2><p>A gradient-ringed pill button is free at <a href="/products/gradient-glow-pill-button-join-on-github">gradient glow pill button</a>. Transition safety is covered in <a href="/blog/css-transition-properties-list">never transition all</a>, and <code>@property</code> is documented at <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/@property" rel="nofollow noopener" target="_blank">MDN</a>.</p>`
  },
  {
    slug: "css-skeleton-shimmer-loading",
    title: "CSS Skeleton Screens with a Shimmer Effect",
    category: "CSS",
    date: "2027-01-26",
    excerpt: "A skeleton is a reservation, not decoration: match the real content's dimensions exactly, then animate a gradient's background-position. Mismatched sizes cause the layout shift the skeleton was meant to prevent.",
    content: `<p>Skeletons exist for two reasons — perceived speed and a reserved layout — and most implementations achieve only the first. If the skeleton is 120px tall and the loaded card is 180px, you have built an animation that guarantees the very jump you were trying to avoid.</p><h2>Direct Answer</h2><p>Build grey blocks with the exact height, radius and spacing of the real content. Animate a diagonal gradient across them with <code>background-position</code>, or better, move a pseudo-element with <code>transform</code>. Cap the count at what actually fits, and stop the animation under <code>prefers-reduced-motion</code> — a pulsing page is genuinely unpleasant for some users.</p><h2>Full Code Example</h2><pre><code>.skeleton {
  background: #eef0f3;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

/* Sweep via transform: compositor-friendly, no repaint */
.skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.6),
    transparent
  );
  animation: shimmer 1.4s ease-in-out infinite;
}
@keyframes shimmer {
  to { transform: translateX(100%); }
}

/* Match the real components' dimensions exactly */
.skeleton--card { height: 220px; border-radius: 16px; }
.skeleton--title { height: 18px; width: 60%; margin: 16px 0 10px; }
.skeleton--line  { height: 12px; width: 90%; margin-bottom: 8px; }

@media (prefers-reduced-motion: reduce) {
  .skeleton::after { animation: none; }
}</code></pre><h2>Why This Works</h2><p>Translating a pseudo-element is a compositor operation: no layout, no paint, just a texture movement. The alternative — animating <code>background-position</code> on the skeleton itself — repaints the whole block every frame, which on a grid of twelve cards is measurable on low-end hardware.</p><h3>The reservation rule</h3><p>A skeleton that exactly matches the loaded component's box means the swap causes zero shift, which is the entire point. Derive the skeleton's dimensions from the component's CSS, not from an eyeballed screenshot, and the two stay in sync through refactors.</p><h3>When not to show a skeleton</h3><p>Under roughly 200ms, a skeleton flashes and feels slower than nothing. Prefer a static placeholder or nothing at all for fast responses, and reserve skeletons for genuine waits.</p><h2>Deriving Skeletons From the Real Component</h2><p>The skeleton's job is to be dimensionally identical to the content that replaces it. That is a design constraint, not a styling preference, and it is easiest to satisfy when the skeleton comes from the same component rather than being drawn by eye.</p><h3>One layout, two fillings</h3><p>Render the real card component with placeholder children: same padding, same border, same grid, same image box. Only the inner text nodes become grey bars. The swap then changes colour, not geometry, and the shift is exactly zero.</p><h3>Bars that mimic line lengths</h3><p>A title bar at sixty percent width and two body lines at ninety and seventy percent read as text, while uniform full-width bars read as a table. Vary the widths in a fixed pattern so loading and loaded states feel like the same layout.</p><h3>Counting what fits</h3><p>Render only what the viewport can show: the first screenful plus one row. Drawing twenty skeleton cards that never enter view is work for nothing and inflates first paint with elements the user will never see.</p><h3>Timing thresholds</h3><ul><li>Under 200 milliseconds: show nothing. A flash is worse than a pause.</li><li>200 milliseconds to 1 second: static grey placeholder, no shimmer.</li><li>Over 1 second: shimmer, because the wait is now perceptible.</li><li>Over 10 seconds: add copy and a retry path, since a skeleton alone stops communicating progress.</li></ul><h3>Loading states and assistive technology</h3><p>A skeleton is visual only. Screen readers announce nothing, so every loading region needs a live status: a visually hidden element with <code>role="status"</code> reading "Loading products", removed when the content arrives. Do not mark the skeleton <code>aria-hidden</code> and forget the status, because that leaves the region silent for the entire wait.</p><p>Keep the transition calm as well. A grid of twelve shimmering cards is a lot of simultaneous motion, so stagger the animation start slightly or animate only the first row. Under reduced motion, render a static placeholder with the text status, which communicates the same thing without movement.</p><p>Finally, put the skeleton behind a test that asserts its measured height equals the loaded card's height. That single assertion is the difference between a skeleton that prevents shift and one that causes it.</p><h2>Common Mistakes</h2><ul><li>Skeleton dimensions that differ from the real content, guaranteeing the shift.</li><li>Animating <code>background-position</code> on large blocks — full repaint per frame.</li><li>Infinite shimmer with no reduced-motion guard.</li><li>One skeleton per row when the request returns twenty; you have drawn a fake grid.</li></ul><h2>Browser Support / Caveats</h2><p>Everything here is widely supported. <code>prefers-reduced-motion</code> is honoured on all current platforms. Keep each skeleton's animation count low — dozens of simultaneous infinite animations cost battery on mobile even when they are compositor-only.</p><h2>Related Resources</h2><p>A loader built on the same shimmer idea is free at <a href="/products/spectrum-loader-animated-loading-text">spectrum animated loader</a>. Motion accessibility is covered in <a href="/blog/prefers-reduced-motion-css">prefers-reduced-motion</a>, and the animation approach is documented at <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/background-position" rel="nofollow noopener" target="_blank">MDN</a>.</p>`
  },
  {
    slug: "best-free-react-ui-component-libraries",
    title: "The Best Free React UI Component Libraries in 2026",
    category: "Design Systems",
    date: "2027-01-27",
    excerpt: "Choose by how much you intend to restyle: headless primitives for full control, unstyled-plus-copy libraries for speed, and styled kits for internal tools. Licence and bundle size decide the rest.",
    content: `<p>There are three genuinely different things called "a UI library", and comparing them is the reason teams end up with a 400KB dependency for six buttons. The useful question is not which library is best — it is how much of the design you intend to own.</p><h2>Direct Answer</h2><p>Headless primitives (behaviour and accessibility, zero styling) suit products with a real design system. Copy-in component collections (source code you own, unstyled by default) suit teams that want speed without lock-in. Styled kits with a full theme suit internal tools where brand differentiation is irrelevant. Check the licence first: MIT is safe, and anything with a revenue or seat clause needs a legal read.</p><h2>Full Code Example</h2><pre><code>/* A decision matrix you can commit to a repo */

Headless primitives
  owns: behaviour, focus management, ARIA
  you own: every visual decision
  cost: wiring CSS yourself
  best for: design-system-led products

Copy-in components
  owns: component source, sensible defaults
  you own: the fork, and all upgrades
  cost: maintenance of vendored code
  best for: teams shipping fast on Tailwind

Styled kits
  owns: visuals, layout primitives, theming
  you own: theme overrides only
  cost: bundle size, opinionated markup
  best for: admin panels and internal tools</code></pre><h2>Why This Works</h2><p>The trade is always the same: control against speed. Headless libraries give you the hard part — focus traps, keyboard navigation, screen reader semantics — while leaving the easy-to-differentiate part to you. Styled kits invert this: you get a coherent look immediately and inherit its opinions forever.</p><h3>Licence and exit cost</h3><p>A library you cannot fork is a dependency with a cliff. MIT-licensed source means the worst case is maintaining a fork. Copy-in libraries make that the default, which is freedom and obligation at once: you own every security fix.</p><h3>Bundle reality</h3><p>Tree-shaking only helps if you import leaf modules. A single barrel import can pull an entire design system into the bundle. Measure with a bundle analyser before adopting, not after the Lighthouse score drops.</p><h2>Evaluating a Library in an Afternoon</h2><p>Marketing pages list components; a real evaluation answers five questions in about four hours. Skipping them is how a team discovers a licensing problem three months into a build.</p><h3>One: boot a two-page prototype</h3><p>Install it in a throwaway Vite app and build a list with search, a modal and a form. Twelve minutes of real use exposes the shape of the API better than any documentation page. If the prototype fights you, production will be worse.</p><h3>Two: count the bytes</h3><p>Build the prototype and open the bundle analyser. Compare the cost of importing three components to the cost of the whole package. A library that cannot be tree-shaken is a permanent tax on every page.</p><h3>Three: test the accessibility surface</h3><ul><li>Keyboard: can you complete every interaction without a mouse?</li><li>Focus: does the modal restore focus when it closes?</li><li>Screen reader: are names announced, or is everything a generic button?</li><li>Zoom: does the layout survive 200 percent?</li></ul><h3>Four: read the licence clause</h3><p>MIT and Apache are safe. Anything with a revenue threshold, a seat count or a commercial-use carve-out needs a legal read before adoption, not after a launch.</p><h3>Five: check the exit path</h3><p>Can you fork it? Is the source readable? How often do breaking changes ship? A library is a relationship, and the question is what leaving costs, not whether you will leave.</p><h3>Mixing two systems</h3><p>It is tempting to take primitives from one library and visuals from another, and the result usually has two focus rings, two spacing scales and two ideas of what a disabled state looks like. If you must mix, pick one owner of interaction behaviour and one owner of colour, and write the boundary down. Teams that skip that sentence end up debugging a focus outline that belongs to the other system.</p><p>Finally, write the decision down. One paragraph in the repository explaining which library owns behaviour, which owns colour, and what would trigger a migration saves every future contributor an afternoon of archaeology. The paragraph is cheap; the archaeology is not.</p><h2>Common Mistakes</h2><ul><li>Mixing two systems in one app, producing two focus styles, two spacing scales and inconsistent radii.</li><li>Adopting a 300-component kit to use four of them.</li><li>Ignoring bundle cost because "it's tree-shakeable" without verifying the import path.</li><li>Choosing on screenshots rather than on accessibility behaviour, which is the part you cannot easily rebuild.</li></ul><h2>Browser Support / Caveats</h2><p>All credible libraries target current evergreen browsers. The differentiators are React version support (some still assume React 17), styling system coupling (Tailwind vs CSS-in-JS vs plain CSS), and whether components render into portals — which matters if you have transforms on ancestors.</p><h2>Related Resources</h2><p>A navigation bar that demonstrates a complete design-system surface is free at <a href="/products/premium-glassmorphic-navigation-bar">premium glassmorphic navigation</a>. Component composition rules are discussed in <a href="/blog/react-error-boundaries">error boundaries</a>, and the ecosystem is listed at <a href="https://react.dev/community" rel="nofollow noopener" target="_blank">react.dev</a>.</p>`
  },
  {
    slug: "svg-sprite-vs-inline-icons",
    title: "SVG Sprites vs Inline Icons: Which Should You Ship?",
    category: "SVG",
    date: "2027-01-28",
    excerpt: "A sprite is one cached request referenced by use href; inline icons cost zero requests but bloat the HTML and lose caching. Choose by count and reuse, not by preference.",
    content: `<p>Two icons: inline them and move on. Two hundred: inlining is megabytes of HTML that cannot be cached separately from your page. The decision is arithmetic, and the implementation has two traps that make icons render as invisible nothing.</p><h2>Direct Answer</h2><p>Use a sprite when you ship many icons and repeat them across pages: one file, one cached request, and <code>&lt;use href="#id"&gt;</code> per usage. Inline the SVG when the icon is used once, needs per-instance styling of internal paths, or must paint immediately in the critical path. Both inherit <code>currentColor</code>, so colour theming works either way.</p><h2>Full Code Example</h2><pre><code>&lt;!-- The sprite: symbols, loaded once and cached --&gt;
&lt;svg aria-hidden="true" style="display:none"&gt;
  &lt;symbol id="i-arrow" viewBox="0 0 24 24"&gt;
    &lt;path d="M5 12h14M13 6l6 6-6 6" /&gt;
  &lt;/symbol&gt;
&lt;/svg&gt;

&lt;!-- Usage: the viewBox lives on the symbol, not on the instance --&gt;
&lt;svg class="h-5 w-5 text-gray-700"&gt;
  &lt;use href="#i-arrow" /&gt;
&lt;/svg&gt;

&lt;!-- External sprite (separate file, independently cacheable) --&gt;
&lt;svg class="h-5 w-5"&gt;
  &lt;use href="/icons/sprite.svg#i-arrow" /&gt;
&lt;/svg&gt;

&lt;!-- Inline: one-off icon that needs paint-critical timing --&gt;
&lt;svg viewBox="0 0 24 24" class="h-5 w-5" role="img" aria-label="Search"&gt;
  &lt;path d="M11 4a7 7 0 100 14 7 7 0 000-14z" fill="currentColor"/&gt;
&lt;/svg&gt;</code></pre><h2>Why This Works</h2><p><code>&lt;use&gt;</code> instantiates the referenced symbol in place, giving you the full benefit of one definition and many instances. Because the sprite file is a static asset, the browser caches it across pages — the second page costs a cache hit instead of kilobytes of HTML. Inline SVGs live inside the document, so they ship with every navigation and cannot be cached on their own.</p><h3>The viewBox trap</h3><p>Put <code>viewBox</code> on the <code>symbol</code>, and leave it off the instance. A <code>&lt;use&gt;</code> with no viewBox on its target renders at intrinsic size inside the instance's box — usually invisible. This is the number one reason sprites "don't work".</p><h3>Styling reach</h3><p>With a sprite you cannot target individual paths from page CSS — the shadow tree is isolated. If a design needs two different path colours inside one icon, inline it. Inheriting via <code>currentColor</code> is the supported path for everything else.</p><h2>Building the Sprite in Your Pipeline</h2><p>Hand-maintaining a sprite is a chore that stops happening in month two. The durable approach generates it from individual icon files during the build, so adding an icon means adding a file.</p><h3>One file per icon</h3><p>Keep a directory of SVGs named for their ids: <code>arrow-right.svg</code> becomes <code>#i-arrow-right</code>. Stripping the outer <code>svg</code> wrapper and normalising the <code>viewBox</code> is the whole transformation, and it is scriptable in a dozen lines.</p><h3>Emitting the sprite</h3><p>Write the concatenated <code>symbol</code> set into a static file at build time, then reference it with <code>&lt;use href="/sprite.svg#id"&gt;</code>. The file gets a content hash in its name, so it caches forever and updates only when an icon changes.</p><h3>Keeping ids stable</h3><p>The id is the public API of the sprite. Renaming <code>arrow</code> to <code>arrow-right</code> silently breaks every usage, and nothing fails loudly: the icon simply disappears. Generate a manifest alongside the sprite, and let the build fail when a referenced id is missing.</p><h3>Inline alternatives</h3><ul><li>Critical above-the-fold icons: inline, to avoid a request.</li><li>Everything repeated across pages: sprite.</li><li>Icons that need per-path theming: inline, or a dedicated component.</li><li>Icons that appear on one page only: inline, since the sprite would not be cached anyway.</li></ul><h3>Symbols versus separate files</h3><p>A sprite is not the only caching strategy. Individual SVG files with hashed names cache just as well and let the browser fetch only the icons a page uses. The sprite wins when a page uses twenty icons; separate files win when it uses two. Measure actual usage per page before committing to one file, because sprites solve a problem small sites do not have. React icon packages that ship every icon as a module are a third path, letting the bundler drop unused icons with no runtime request at all.</p><p>Finally, check the sprite under a strict content security policy. External <code>use</code> references are blocked when the asset is served from a disallowed origin, and the icons fail without an obvious error.</p><h2>Common Mistakes</h2><ul><li>Missing <code>viewBox</code> on the symbol, producing zero-size icons.</li><li>External <code>&lt;use href&gt;</code> to another origin, which browsers block for security.</li><li>Inlining two hundred icons into a component tree, inflating the HTML and the render time.</li><li>Hard-coding <code>fill</code> on paths, which defeats <code>currentColor</code> theming in both approaches.</li></ul><h2>Browser Support / Caveats</h2><p><code>&lt;use&gt;</code> with same-origin external references works in all current browsers; older Safari had regressions with external sprites and needed the inline-sprite variant. Keep the sprite under a few hundred kilobytes and preload it only if icons are above the fold — otherwise let it load lazily.</p><h2>Related Resources</h2><p>Browse the full icon set at <a href="/icons">the SteaCode icon gallery</a>. The loading-priority side of this decision is covered in <a href="/blog/fetchpriority-hero-image">fetchpriority for hero images</a>, and <code>&lt;use&gt;</code> is documented at <a href="https://developer.mozilla.org/en-US/docs/Web/SVG/Element/use" rel="nofollow noopener" target="_blank">MDN</a>.</p>`
  },
  {
    slug: "accessible-svg-icons-aria-label",
    title: "Making SVG Icons Accessible",
    category: "SVG",
    date: "2027-01-29",
    excerpt: "Decorative icons take aria-hidden and focusable=false. Meaningful icons need role=img plus a real name — usually from the button they sit in. Never let a bare path be the only label.",
    content: `<p>An icon-only button is the most common accessibility failure in modern interfaces: sighted users see a floppy disk, screen reader users hear "button". The fix is one attribute, chosen by whether the icon carries information or decorates something that already has text.</p><h2>Direct Answer</h2><p>If the icon repeats text next to it, hide it: <code>aria-hidden="true"</code> and <code>focusable="false"</code>. If the icon is the only content — an icon button, a status glyph — give the interactive element an accessible name with <code>aria-label</code>, and mark the SVG itself <code>aria-hidden</code> so it is not announced twice. Only give the SVG <code>role="img"</code> plus <code>aria-label</code> when the icon stands alone as an image.</p><h2>Full Code Example</h2><pre><code>&lt;!-- 1. Decorative: the label is already in text --&gt;
&lt;a href="/docs"&gt;
  &lt;svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" class="h-4 w-4"&gt;
    &lt;path d="M5 12h14M13 6l6 6-6 6" /&gt;
  &lt;/svg&gt;
  Read the docs
&lt;/a&gt;

&lt;!-- 2. Icon-only button: the NAME goes on the button --&gt;
&lt;button type="button" aria-label="Save changes"&gt;
  &lt;svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" class="h-5 w-5"&gt;
    &lt;path d="M5 5h11l3 3v11H5z" /&gt;
  &lt;/svg&gt;
&lt;/button&gt;

&lt;!-- 3. Standalone meaningful image --&gt;
&lt;svg role="img" aria-label="Warning: expiring soon" viewBox="0 0 24 24"&gt;
  &lt;path d="M12 3l9 16H3z" fill="currentColor" /&gt;
&lt;/svg&gt;

&lt;!-- 4. Visible tooltip that must ALSO be announced --&gt;
&lt;button aria-describedby="tip-1"&gt;
  &lt;svg aria-hidden="true" viewBox="0 0 24 24"&gt;...&lt;/svg&gt;
&lt;/button&gt;
&lt;span id="tip-1" class="sr-only"&gt;Deletes the selected draft&lt;/span&gt;</code></pre><h2>Why This Works</h2><p>SVG participates in the accessibility tree. Without <code>aria-hidden</code>, a decorative icon is still a node that may be announced as "graphic" — noise between two words of a link. With <code>aria-hidden</code> it disappears from the tree entirely while remaining visible on screen.</p><h3>One name, not two</h3><p>The accessible name belongs on the interactive element. Labelling both the button and the SVG produces "Save changes, Save changes" — a double announcement, and a common over-correction. Pick one owner.</p><h3>Why focusable="false"</h3><p>Legacy Edge and some embedded browsers put SVG in the tab order, so an icon inside a link could become an extra tab stop. The attribute costs nothing and removes that class of bug.</p><h2>A Five-Minute Screen Reader Test</h2><p>Accessibility claims are easy to make and cheap to verify. Three checks cover almost every icon bug, and none of them require a formal audit.</p><h3>One: walk the tab order</h3><p>Load the page and press Tab repeatedly. Every interactive element should announce a name, and decorative icons should not appear as stops at all. If you hear a graphic announced between two words of a link, an <code>aria-hidden</code> is missing.</p><h3>Two: confirm one name per control</h3><p>On an icon-only button the accessible name should be the action, not the glyph. Labelling both the button and the SVG produces a doubled announcement, while labelling only the SVG produces a nameless button in some reading modes. One owner, always the interactive element.</p><h3>Three: test with images disabled</h3><p>An icon that carries meaning with no text fallback becomes nothing when assets are blocked. That is exactly what a screen reader experiences. Status indicators need an <code>aria-label</code> or adjacent text, not just a coloured shape.</p><h3>Common repairs ranked by impact</h3><ul><li>Add a name to every icon-only button: the highest-value fix by far.</li><li>Remove <code>aria-label</code> from decorative icons beside text.</li><li>Replace colour-only meaning with text or a shape difference.</li><li>Add <code>focusable="false"</code> to legacy-proof the tab order.</li></ul><h3>Tooling that actually helps</h3><p>axe DevTools catches missing names and invalid ARIA in seconds, but it cannot tell you whether the name makes sense. Run it, fix the mechanical findings, then read the page with a screen reader for a minute. NVDA on Windows and VoiceOver on macOS are free, and one pass on the primary flow finds more than a hundred automated checks. Add a lint rule that forbids <code>&lt;svg&gt;</code> without either <code>aria-hidden</code> or a name, so the next component cannot reintroduce the bug. Rules in CI outlast intentions in a style guide.</p><p>Finally, add the check to the pull request template. A one-line question — does every icon-only control have a name? — catches the regression before it ships.</p><h2>Common Mistakes</h2><ul><li>Icon-only buttons with no <code>aria-label</code>, announced as nothing meaningful.</li><li>Relying on the SVG <code>&lt;title&gt;</code> element as the only label — support is inconsistent, and it does not name the button.</li><li><code>aria-label</code> on a decorative icon next to visible text, causing duplication.</li><li>Meaning encoded only by colour — a red dot with no text — which no attribute can repair.</li></ul><h2>Browser Support / Caveats</h2><p>ARIA on SVG is well supported. <code>focusable="false"</code> is legacy-defensive rather than required today. Remember that <code>aria-hidden</code> on a focusable element is invalid, so never hide an icon that is the actual interactive target — hide it, and label its parent instead.</p><h2>Related Resources</h2><p>The complete icon set is browsable at <a href="/icons">the SteaCode icon gallery</a>. Focus visibility is covered in <a href="/blog/css-focus-visible-hover-states">focus-visible states</a>, and ARIA usage is documented at <a href="https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-hidden" rel="nofollow noopener" target="_blank">MDN</a>.</p>`
  },
  {
    slug: "svg-icon-recolor-currentcolor",
    title: "Recolor SVG Icons with currentColor",
    category: "SVG",
    date: "2027-01-30",
    excerpt: "Set fill and stroke to currentColor and the icon inherits its parent's text colour. One asset, every theme, hover state included — no duplicate coloured copies.",
    content: `<p>The moment you ship four coloured copies of the same icon, the palette has four sources of truth and a dark theme doubles them. <code>currentColor</code> collapses all of that: one icon, coloured by whatever text colour surrounds it.</p><h2>Direct Answer</h2><p>Write <code>fill="currentColor"</code> on shapes (or <code>stroke="currentColor"</code> for line icons), and set the colour with a normal text utility on the icon or its parent — <code>text-gray-700</code>, <code>hover:text-amber-600</code>, <code>dark:text-gray-100</code>. Never hard-code hex values in path fills. If a specific path must differ, set <code>fill="currentColor"</code> as the default and override that path with a class.</p><h2>Full Code Example</h2><pre><code>&lt;!-- One icon, themed by its surroundings --&gt;
&lt;button class="text-gray-700 hover:text-amber-600 dark:text-gray-100"&gt;
  &lt;svg viewBox="0 0 24 24" class="h-5 w-5" aria-hidden="true"&gt;
    &lt;path d="M5 12h14M13 6l6 6-6 6" fill="currentColor" /&gt;
  &lt;/svg&gt;
  Next
&lt;/button&gt;

&lt;!-- Line icons: currentColor on the stroke --&gt;
&lt;svg viewBox="0 0 24 24" class="h-5 w-5 text-sky-600"&gt;
  &lt;circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" /&gt;
&lt;/svg&gt;

&lt;!-- Per-path override when one element must stand out --&gt;
&lt;svg viewBox="0 0 24 24" class="h-5 w-5 text-gray-600"&gt;
  &lt;path d="M4 6h16v12H4z" fill="currentColor" /&gt;
  &lt;circle cx="18" cy="6" r="3" fill="#ef4444" /&gt;
&lt;/svg&gt;</code></pre><h2>Why This Works</h2><p><code>currentColor</code> is a keyword that resolves to the computed <code>color</code> of the element it is applied to. Since <code>color</code> inherits, an icon placed inside any element picks up that element's text colour automatically — including colours set by hover, dark mode, disabled states and user-agent defaults.</p><h3>Why it beats CSS fill rules</h3><p>A rule like <code>.icon path { fill: #374151 }</code> beats the presentation attribute, so hover states must override with equal specificity, then <code>!important</code> appears, then the whole thing becomes unmaintainable. <code>currentColor</code> has no such arms race: colour changes happen on the text colour, one property, one place.</p><h3>The gradient limit</h3><p><code>currentColor</code> is a single colour and cannot feed a gradient stop. An icon that genuinely needs a gradient must use an explicit <code>&lt;linearGradient&gt;</code>, and it will not follow the theme — accept that as a deliberate exception rather than the default.</p><h2>Theming a Whole Icon Set With One Token</h2><p>The payoff of <code>currentColor</code> is not one icon; it is an entire set that follows the theme without a second asset. Design it that way from the first icon and the system stays cheap.</p><h3>One semantic colour per context</h3><p>Set the colour on the container, not the icon: a nav item sets <code>text-gray-700</code>, a toolbar sets <code>text-gray-500</code>, an active state sets <code>text-amber-600</code>. Every icon inside follows, so a new icon needs no colour decision at all.</p><h3>Dark mode for free</h3><p>Because the icon reads the computed text colour, a semantic token swap in the theme recolours every icon with zero icon-specific rules. That is the practical argument for putting colour on contexts rather than on assets.</p><h3>Opacity instead of new hexes</h3><p>For quieter icons use <code>text-gray-700/60</code> rather than inventing a lighter grey. Opacity keeps one palette entry and stays consistent across light and dark surfaces, while a new hex value multiplies the palette.</p><h3>Exceptions, handled deliberately</h3><ul><li>Multi-colour logos: keep explicit fills and treat them as brand assets, not themeable icons.</li><li>Status semantics: green, amber and red need accessible names in text, because colour alone is not meaning.</li><li>Gradient glyphs: an explicit gradient, documented as a deliberate exception.</li></ul><p>Everything else — arrows, chevrons, play buttons, social marks — should be <code>currentColor</code> with no colour of its own.</p><h3>Forced colours and print</h3><p>Windows high-contrast mode and print stylesheets override author colours, and <code>currentColor</code> follows the override because it resolves to the computed colour rather than a fixed hex. That is another argument for it over hard-coded fills: an icon set built on <code>currentColor</code> stays legible in forced-colours mode with no extra rules, while an icon painted with explicit hex values can vanish against the forced background. Check once with forced-colours emulation enabled; it takes a minute and catches icons that disappear.</p><p>Finally, apply the token on the icon component itself, not at every call site. One default colour on the component, overridable per instance, keeps the set consistent and the markup short.</p><h2>Common Mistakes</h2><ul><li>Hard-coded <code>fill="#111827"</code> in the path, which silently ignores every theme.</li><li>Setting <code>fill</code> on the <code>&lt;svg&gt;</code> and then also on a path — the path wins and the parent looks broken.</li><li>Using CSS <code>fill</code> with <code>!important</code> to force colours, which breaks all future overrides.</li><li>Forgetting <code>stroke</code> on line icons, so only the first path recolours and the rest stay invisible or black.</li></ul><h2>Browser Support / Caveats</h2><p><code>currentColor</code> has been supported since SVG 1.1 in every browser. It works through <code>&lt;use&gt;</code> sprites and through React-rendered SVG alike. In a sprite, the instance's inherited colour reaches the symbol's shapes, which is exactly why sprites can serve every theme from one file.</p><h2>Related Resources</h2><p>An SVG-driven decorative component is free at <a href="/products/pulsing-neon-heart-particle-animation-2">pulsing neon heart</a>. Themed colour architecture is covered in <a href="/blog/dark-mode-semantic-tokens">semantic colour tokens</a>, and the keyword is documented at <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/color_value" rel="nofollow noopener" target="_blank">MDN</a>.</p>`
  }
];
