export default [
  {
    slug: "container-queries-inline-size",
    title: "Container Queries: Style a Component by Its Slot, Not the Viewport",
    category: "CSS",
    date: "2026-11-16",
    excerpt: "A card in a 280px sidebar and the same card on a 1440px hero need different layouts. Container queries let one component answer that.",
    content: `<p>Media queries ask "how wide is the browser?". That is the wrong question for a component. A product card in a 280px sidebar and the same card in a 900px hero should not share a breakpoint.</p><h2>Declare a query container</h2><pre><code>.card-slot { container-type: inline-size; container-name: card; }</code></pre><p><code>inline-size</code> makes the element a query container measured on its inline axis. That is the whole setup.</p><h2>Query the container, not the screen</h2><pre><code>@container card (min-width: 420px) { .card { display: grid; grid-template-columns: 160px 1fr; gap: 20px; } } @container card (max-width: 419px) { .card { display: block; } }</code></pre><p>Now the layout follows the slot. Resize the sidebar and the card reflows without a resize listener.</p><h2>Units that make typography honest</h2><pre><code>.card__title { font-size: clamp(13px, 8.6cqi, 22px); }</code></pre><p><code>cqi</code> is one percent of the container's inline size. This is exactly how the 3D book cards keep their covers readable at 390px.</p>`
  },
  {
    slug: "css-aspect-ratio",
    title: "Replace the Padding-Top Hack With aspect-ratio",
    category: "CSS",
    date: "2026-11-17",
    excerpt: "The 56.25% padding trick has a successor that is one property, works with flex, and does not break when you add a border.",
    content: `<p>For a decade the answer to "how do I make a box a 16:9 rectangle" was <code>padding-top: 56.25%</code> plus an absolutely positioned child. It works, and it is awful.</p><h2>The replacement</h2><pre><code>.thumb { aspect-ratio: 16 / 9; width: 100%; }</code></pre><p>One property. The height is derived from the width, content flows normally, and <code>border</code> is included in the box.</p><h2>With images, use the attributes too</h2><pre><code>&lt;img src="/cover.webp" width="800" height="1200" alt=""&gt;</code></pre><p>Always ship <code>width</code> and <code>height</code> attributes: the browser derives the ratio and reserves the box before the bytes arrive.</p><h2>Where it silently fails</h2><ul><li>Flex children with <code>align-items: stretch</code> — add <code>align-self: start</code>.</li><li>Grid tracks with a fixed height — use <code>auto</code> rows.</li><li>Parent <code>min-height</code> overrides the ratio.</li></ul>`
  },
  {
    slug: "css-clamp-fluid-type",
    title: "Fluid Type with clamp(): A Scale That Does Not Break at 200% Zoom",
    category: "CSS",
    date: "2026-11-18",
    excerpt: "One clamp() per heading replaces five media queries — if the min and max are in rem and the middle term only moves the middle.",
    content: `<p>Fluid typography is one line of <code>clamp()</code> per step. Done wrong it is an accessibility problem: text that only responds to viewport width ignores the user's zoom setting.</p><h2>The safe formula</h2><pre><code>h1 { font-size: clamp(2rem, 5vw + 1rem, 3.5rem); }</code></pre><ul><li><strong>Minimum in <code>rem</code>.</strong> Respects browser base font size.</li><li><strong>Maximum in <code>rem</code>.</strong> Same reason at the other end.</li><li><strong>Only the middle term uses <code>vw</code>.</strong></li></ul><h2>The zoom trap</h2><p>At 200 percent zoom on a 1440px screen the effective viewport is 720px, so <code>vw</code> shrinks and the type with it. This is why the floor must be in <code>rem</code>.</p><pre><code>html { font-size: 100%; } h1 { font-size: clamp(1.75rem, 4vw + 0.6rem, 3.5rem); }</code></pre>`
  },
  {
    slug: "position-sticky-anatomy",
    title: "Why position: sticky Quietly Does Nothing",
    category: "CSS",
    date: "2026-11-19",
    excerpt: "Sticky headers fail for exactly four reasons: a clipped ancestor, a missing offset, a self-scrolling parent, or a transform creating a new containing block.",
    content: `<p><code>position: sticky</code> is the only CSS feature that fails silently. Four causes cover almost every case.</p><h2>1. An ancestor clips overflow</h2><p>Any ancestor with <code>overflow: hidden</code>, <code>auto</code> or <code>scroll</code> becomes that scrollport. Fix the overflow on the ancestor instead of adding <code>position: sticky</code> to more elements.</p><h2>2. Missing or wrong offset</h2><pre><code>.topbar { position: sticky; top: 0; z-index: 40; }</code></pre><p>Without <code>top</code>, sticky has no threshold and does nothing.</p><h2>3. The parent is taller than the scroll container</h2><p>Sticky is constrained to its parent. Put the sticky element in a container that spans the section it should accompany.</p><h2>4. transform / filter / will-change create a containing block</h2><p>Any of those on an ancestor makes <code>position: fixed</code> behave like absolute and breaks sticky in subtle ways.</p>`
  },
  {
    slug: "dark-mode-semantic-tokens",
    title: "Dark Mode Without Inverting: Semantic Tokens First",
    category: "Design Systems",
    date: "2026-11-20",
    excerpt: "filter: invert(1) is a party trick that ruins images and brand colour. The durable approach is two layers: raw palette tokens, then semantic tokens.",
    content: `<p>Every dark mode attempt that starts with inverting the light theme ends in the same place: photographs turn negative, the gold accent becomes muddy purple.</p><h2>Two layers</h2><pre><code>:root { --grey-0: #ffffff; --grey-900: #111827; --gold-500: #f5b400; --surface: var(--grey-0); --text: var(--grey-900); --accent: var(--gold-500); } [data-theme="dark"] { --surface: #0b0f14; --text: #e5e7eb; --accent: #ffc43d; }</code></pre><p>Components only ever use the second layer: <code>background: var(--surface)</code>, <code>color: var(--text)</code>.</p><h2>Do not use pure black</h2><p><code>#000</code> next to <code>#fff</code> text produces halation. <code>#0b0f14</code> with <code>#e5e7eb</code> text reads calmer and keeps contrast above 12:1.</p><h2>Respect the OS, do not obey it blindly</h2><p>Three states: unset follows the OS, <code>light</code> and <code>dark</code> are explicit choices. Store the choice in <code>localStorage</code> and apply it before first paint.</p>`
  },
  {
    slug: "react-controlled-vs-uncontrolled",
    title: "Controlled vs Uncontrolled Inputs: The Bug Is Usually a Missing onChange",
    category: "React",
    date: "2026-11-21",
    excerpt: "value without onChange produces an input that cannot be typed into. defaultValue produces one React cannot read. Pick by who owns the state.",
    content: `<p>The most common React bug report reads "the input is frozen". Nine times out of ten the JSX is <code>&lt;input value={email} /&gt;</code> with no <code>onChange</code>.</p><h2>The two modes</h2><pre><code>// controlled: React owns the value &lt;input value={q} onChange={(e) =&gt; setQ(e.target.value)} /&gt; // uncontrolled: the DOM owns it &lt;input defaultValue="" ref={inputRef} /&gt;</code></pre><h2>When controlled is correct</h2><ul><li>Validation per keystroke.</li><li>Derived UI — a character counter, a preview.</li><li>Programmatic value rewriting.</li></ul><h2>When uncontrolled is correct</h2><ul><li>Large forms you only read on submit.</li><li>File inputs (cannot be controlled).</li><li>Third-party widget integration.</li></ul>`
  },
  {
    slug: "useeffect-dependencies",
    title: "useEffect Dependencies: Stale Closures, Extra Runs, and the Ref Escape Hatch",
    category: "React",
    date: "2026-11-22",
    excerpt: "A missing dependency gives you yesterday's props. An extra one gives you an infinite loop. Both come from the same mistake.",
    content: `<p><code>useEffect</code> is hard because the dependency array compares by identity, and React hands you a new function or object on almost every render.</p><h2>Failure mode 1 — the missing dependency</h2><pre><code>useEffect(() =&gt; { fetch('/api/blog?limit=' + limit); }, []); // limit is frozen forever</code></pre><h2>Failure mode 2 — the extra dependency</h2><pre><code>const options = { limit: 20 }; // new object each render useEffect(() =&gt; { fetchList(options); }, [options]); // infinite loop</code></pre><h2>The ref escape hatch</h2><pre><code>const cb = useRef(onAuthenticated); useEffect(() =&gt; { cb.current = onAuthenticated; }, [onAuthenticated]); useEffect(() =&gt; { fetchSession().then((email) =&gt; email &amp;&amp; cb.current({ email })); }, [open]);</code></pre>`
  },
  {
    slug: "custom-fetch-hook",
    title: "A useFetch Hook That Handles Races, Aborts and Errors",
    category: "React",
    date: "2026-11-23",
    excerpt: "The naive useEffect fetch breaks in three ways: two requests resolving out of order, a stale write after unmount, and an error swallowed into silence.",
    content: `<p>Copy-pasting <code>fetch(...).then(setData)</code> works until the user changes a filter twice quickly, then the older response lands second and wins.</p><h2>The hook</h2><pre><code>export function useFetch(url) { const [state, setState] = useState({ data: null, error: null, loading: !!url }); useEffect(() =&gt; { if (!url) return; const ctrl = new AbortController(); fetch(url, { signal: ctrl.signal }).then(async (res) =&gt; { const body = await res.json().catch(() =&gt; null); if (!res.ok) throw new Error(body?.error || 'Failed'); return body; }).then((data) =&gt; setState({ data, error: null, loading: false })).catch((err) =&gt; { if (err.name === 'AbortError') return; setState({ data: null, error: err.message, loading: false }); }); return () =&gt; ctrl.abort(); }, [url]); return state; }</code></pre><p><code>AbortController</code> removes both the race and the write-after-unmount warning without a <code>dead</code> flag.</p>`
  },
  {
    slug: "react-error-boundaries",
    title: "Error Boundaries: What They Catch and What Silently Slips Through",
    category: "React",
    date: "2026-11-24",
    excerpt: "An error boundary catches render errors, not rejected promises, not event handlers, not failed lazy imports at the boundary.",
    content: `<p>A single thrown error inside a component unmounts the whole tree and leaves a white screen. An error boundary turns that into a message and keeps the rest alive.</p><h2>Catch</h2><ul><li>Errors during render.</li><li>Lifecycle methods.</li><li>setState callbacks during render.</li></ul><h2>Slipped through</h2><ul><li>Rejected promises.</li><li>Event handlers.</li><li>Async callbacks and timers.</li></ul><h2>Minimal implementation</h2><pre><code>class Boundary extends React.Component { state = { error: null }; static getDerivedStateFromError(error) { return { error }; } render() { if (this.state.error) return &lt;div&gt;Something broke&lt;button onClick={() =&gt; this.setState({ error: null })}&gt;Try again&lt;/button&gt;&lt;/div&gt;; return this.props.children; } }</code></pre>`
  },
  {
    slug: "react-list-keys-reconciliation",
    title: "List Keys Are Identity, Not an Index",
    category: "React",
    date: "2026-11-25",
    excerpt: "Using the array index as key works until something is removed — then every input below the deleted row loses its value.",
    content: `<p>The key warning in the console gets dismissed as pedantry. Then a row is deleted and the text the user typed two rows down disappears.</p><h2>What the key means</h2><p>React reconciles lists by key, not position. A matching key means "same element, update props". A different key means "unmount this, mount that".</p><pre><code>// index as key {rows.map((row, i) =&gt; &lt;Row key={i} data={row} /&gt;)}</code></pre><p>Delete row 2 and every subsequent row keeps its old key with new data. The row component does not remount, so its internal state stays attached to the wrong record.</p><pre><code>{rows.map((row) =&gt; &lt;Row key={row.id} data={row} /&gt;)}</code></pre><h2>The duplicate-key failure</h2><p>Duplicate keys do not throw; React silently reuses the first element, and later items update the wrong card.</p>`
  }
];
