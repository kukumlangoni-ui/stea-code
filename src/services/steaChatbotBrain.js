/* ======================================================================
 * steacode Chatbot Brain — the assistant's single source of knowledge.
 *
 * Trained on the REAL live app structure (steacode.com):
 *   - Tabs: Components / Templates / Kits / Library / Icons / Blog
 *     (URLs: /?tab=components | layouts | kits | library | icons | blog)
 *   - Categories per tab (Buttons, Cards, Hero Sections, Ebooks, Games…)
 *   - Hero search, views/likes/bookmarks, product detail with Get Code
 *   - Email sign-in gate; everything is free — copy full source after login
 *   - My Purchases library (/?view=purchases or /library)
 *   - Pages: /about /contact /licensing /terms /privacy /cookies /blog
 *   - Languages: English / 中文 / Kiswahili; PWA installable
 *
 * Answer = { text, chips?, actions? }
 *   text    — markdown-lite string (**bold**, `code`) rendered by the widget
 *   chips   — suggested follow-up questions
 *   actions — executable buttons handled by the widget:
 *             { type:"tab", tab, category?, sub?, label }
 *             { type:"url", url, label }
 *             { type:"search", query, label }
 *
 * Bilingual: en + zhCN (sw falls back to en, matching the app's own behavior).
 * =================================================================== */

/* ------------------------- tab facts (real taxonomy) ---------------- */

const TABS = [
  {
    id: "components",
    urlTab: "components",
    label: "Components",
    kw: ["component", "components", "button", "buttons", "input", "form", "forms", "toggle", "switch", "loader", "spinner", "toast", "text effect", "card", "cards", "navbar", "navigation", "modal", "drawer", "tooltip", "overlay", "background", "particle", "animation", "gradient", "组件", "按钮", "表单", "卡片", "弹窗", "动画", "背景", "导航"],
    what: "Copy-paste UI pieces: buttons, inputs, forms, toggle switches, loaders & toasts, animated text, cards, navbars, modals, tooltips and animated backgrounds.",
    answer: {
      en: "**Components** is the copy-paste library: buttons, inputs, forms, toggle switches, feedback (loaders, spinners, toasts), animated text, cards, navigation, modals/drawers and animated backgrounds — all ready to drop into your project.\n\nWhich type do you need?",
      zhCN: "**Components（组件）**是复制即用的组件库：按钮、输入框、表单、开关、反馈（加载器、旋转器、Toast）、文字动效、卡片、导航、弹窗/抽屉和动画背景——全部可以直接放进项目里。\n\n你需要哪一类？",
    },
    chips: { en: ["Show me buttons", "Show me cards", "Show me modals"], zhCN: ["看看按钮", "看看卡片", "看看弹窗"] },
  },
  {
    id: "templates",
    urlTab: "layouts",
    label: "Templates",
    kw: ["template", "templates", "layout", "layouts", "hero", "hero section", "pricing table", "feature grid", "testimonial", "faq block", "footer", "dashboard", "landing page", "landing", "e-commerce", "shop", "portfolio", "onboarding", "illustration", "mobile app", "模板", "布局", "着陆页", "定价表", "仪表盘", "作品集", "页脚"],
    what: "Full-page sections: hero sections, pricing tables, feature grids, testimonials, FAQ blocks, footers, dashboards, landing pages, e-commerce, portfolios and more.",
    answer: {
      en: "**Templates** has full-page sections: hero sections, pricing tables, feature grids, testimonials, FAQ blocks, footers, dashboards, landing pages, e-commerce layouts, portfolios and onboarding flows — production-grade and ready to customize.\n\nWant me to open it?",
      zhCN: "**Templates（模板）**提供整页区块：Hero 区、定价表、特性网格、客户评价、FAQ 区块、页脚、仪表盘、着陆页、电商布局、作品集和引导流程——生产级品质，可直接定制。\n\n要我帮你打开吗？",
    },
    chips: { en: ["Show me hero sections", "Show me landing pages"], zhCN: ["看看 Hero 区", "看看着陆页"] },
  },
  {
    id: "kits",
    urlTab: "kits",
    label: "Kits",
    kw: ["kit", "kits", "full app", "starter", "website kit", "game", "games", "app kit", "组合包", "套件", "游戏", "完整应用"],
    what: "Full working products: complete apps (mobile & desktop), websites (dashboards, landing pages, portfolios, e-commerce, auth flows) and games (arcade, puzzle, interactive).",
    answer: {
      en: "**Kits** are full working products you can ship as-is or remix: complete apps (mobile & desktop), websites (dashboards, landing pages, portfolios, e-commerce, auth flows) and games (arcade, puzzle, interactive).\n\nShall I open the Kits tab?",
      zhCN: "**Kits（组合包）**是完整可运行的产品，可以直接上线或自由改造：完整应用（移动 & 桌面）、网站（仪表盘、着陆页、作品集、电商、登录流程）和游戏（街机、解谜、互动）。\n\n要我打开 Kits 页吗？",
    },
    chips: { en: ["Show me games", "Show me app kits"], zhCN: ["看看游戏", "看看应用套件"] },
  },
  {
    id: "library",
    urlTab: "library",
    label: "Library",
    kw: ["library", "ebook", "ebooks", "book", "books", "course", "courses", "cheat sheet", "cheatsheet", "notes", "learning", "study", "masterclass", "学习", "电子书", "课程", "速查表", "笔记"],
    what: "eBooks & learning: free eBooks and masterclasses, guided courses and quick-reference cheat sheets & notes.",
    answer: {
      en: "**Library** is the learning section: free eBooks & masterclasses, guided courses and quick-reference cheat sheets & notes.\n\nWant to browse it?",
      zhCN: "**Library（资源库）**是学习板块：免费电子书和大师课、系统课程、以及快速参考的速查表和笔记。\n\n要我帮你打开吗？",
    },
    chips: { en: ["Show me ebooks", "Show me cheat sheets"], zhCN: ["看看电子书", "看看速查表"] },
  },
  {
    id: "icons",
    urlTab: "icons",
    label: "Icons",
    kw: ["icon", "icons", "svg", "icon set", "图标", "svg 图标"],
    what: "A free SVG icon gallery — browse and grab icons for any project.",
    answer: {
      en: "**Icons** is a free SVG icon gallery — browse by style and grab any icon for your project, right from the Icons tab.",
      zhCN: "**Icons（图标）**是免费 SVG 图标库——在 Icons 页按风格浏览，随手取用任何图标。",
    },
  },
  {
    id: "blog",
    urlTab: "blog",
    label: "Blog",
    kw: ["blog", "article", "articles", "post", "guide article", "read", "博客", "文章", "博文"],
    what: "Guides & articles from the steacode blog feed.",
    answer: {
      en: "**Blog** has guides and articles — deep dives and practical reads for developers. You can open it in the Blog tab, or on the standalone blog page.",
      zhCN: "**Blog（博客）**收录指南和文章——为开发者准备的深度内容。可以在 Blog 页打开，也可以访问独立博客页面。",
    },
    actions: [{ label: { en: "Open Blog tab", zhCN: "打开博客页" }, type: "tab", tab: "blog" }],
  },
];

/* ------------------------- FAQ (real flows) ------------------------- */

const FAQ = [
  {
    id: "what-is",
    kw: ["what is steacode", "what is this app", "what is this site", "about this app", "about this site", "who made", "what does this app do", "steacode 是什么", "这是什么", "这是哪个网站", "关于"],
    answer: {
      en: "**steacode** is a free developer marketplace — one place to grab everything you need to build:\n\n• **Components** — copy-paste buttons, cards, modals, forms…\n• **Templates** — hero sections, landing pages, dashboards\n• **Kits** — full working apps, websites and games\n• **Library** — free ebooks, courses and cheat sheets\n• **Icons** — a free SVG icon gallery\n• Plus a **blog** with guides, and a personal **My Purchases** library\n\nEverything is free — just sign in with your email to copy the full source. What would you like to explore first?",
      zhCN: "**steacode** 是一个免费的开发者市场——一站式获取构建所需的一切：\n\n• **Components（组件）** — 复制即用的按钮、卡片、弹窗、表单……\n• **Templates（模板）** — Hero 区、着陆页、仪表盘\n• **Kits（组合包）** — 完整可运行的应用、网站和游戏\n• **Library（资源库）** — 免费电子书、课程和速查表\n• **Icons（图标）** — 免费 SVG 图标库\n• 还有**博客**指南和个人**我的购买**库\n\n全部免费——登录邮箱即可复制完整源码。想先看看什么？",
    },
    chips: { en: ["What are the tabs?", "How do I get code?", "Show me components"], zhCN: ["有哪些板块？", "怎么获取代码？", "看看组件"] },
  },
  {
    id: "get-code",
    kw: ["get code", "get the code", "how do i get", "how to get code", "copy code", "copy the source", "download code", "unlock full code", "获取代码", "复制代码", "下载代码", "解锁"],
    answer: {
      en: "Getting code takes under a minute:\n\n1. Open any product (click its card to see the live preview, What's Included and How to Use)\n2. Hit **Get Code** — free products copy instantly\n3. If you're not signed in yet, a quick **email sign-in** pops up — that's the key to the full source\n4. Copy the source and ship it 🚀\n\nEverything on steacode is **free**, so no payment steps — just sign in and copy.",
      zhCN: "获取代码一分钟内搞定：\n\n1. 打开任意产品（点卡片可看实时预览、包含内容和用法说明）\n2. 点击 **获取代码（Get Code）**——免费产品立即复制\n3. 如果还没登录，会弹出快速的**邮箱登录**——这是获取完整源码的钥匙\n4. 复制源码，直接开写 🚀\n\nsteacode 上的一切都**免费**，没有支付环节——登录后直接复制。",
    },
    chips: { en: ["Where are my purchases?", "How do likes work?", "Show me components"], zhCN: ["我的购买在哪？", "点赞怎么用？", "看看组件"] },
    actions: [{ label: { en: "Browse Components", zhCN: "浏览组件" }, type: "tab", tab: "components" }],
  },
  {
    id: "free",
    kw: ["is it free", "free products", "anything free", "cost", "price", "pricing", "pay", "payment", "buy", "purchase", "checkout", "order", "免费的", "免费吗", "价格", "付费", "购买", "付款", "结账"],
    answer: {
      en: "Yes — **everything on steacode is free**. There's no payment step: open a product, sign in with your email if you haven't, and copy the full source. (You may still see a “Premium” badge on some older items, but the unlock flow is the same free email sign-in.)",
      zhCN: "是的——**steacode 上的一切都免费**。没有支付环节：打开产品，用邮箱登录（如果还没登录），复制完整源码即可。（部分旧产品可能还带“Premium”标记，但解锁方式同样是免费的邮箱登录。）",
    },
    chips: { en: ["How do I get code?", "Where are my purchases?"], zhCN: ["怎么获取代码？", "我的购买在哪？"] },
  },
  {
    id: "purchases",
    kw: ["my purchases", "my purchase", "purchases", "order history", "saved items", "library of mine", "我的购买", "订单", "买过的", "我的库"],
    answer: {
      en: "**My Purchases** is your personal library — every product you've unlocked lives there with its source, ready to copy again anytime. Find it under the **Library** area, or ask me and I'll take you straight there.",
      zhCN: "**我的购买**是你的个人库——你解锁过的每个产品都保存在那里，随时可以再次复制源码。在 **Library** 区域可以找到，或者直接让我带你过去。",
    },
    actions: [{ label: { en: "Open My Purchases", zhCN: "打开我的购买" }, type: "url", url: "/?view=purchases" }],
  },
  {
    id: "like",
    kw: ["like", "heart", "like a product", "like twice", "unlike", "点赞", "喜欢", "红心", "爱心"],
    answer: {
      en: "Every product card and preview has a **heart ❤** next to the eye (views) and bookmark (save) icons.\n\n• Tap the heart to **like** a product — the count updates instantly\n• You can like each product **once** (the heart locks, so double-liking isn't possible)\n• Counts persist after refresh\n\nWant to head back to the homepage to try it?",
      zhCN: "每个产品卡片和预览里都有**红心 ❤**（旁边是浏览数 👁 和收藏 🔖 图标）。\n\n• 点红心即可**点赞**——数字会立刻更新\n• 每个产品只能点赞**一次**（红心会锁定，不能重复点赞）\n• 刷新后数字也不会丢失\n\n要回首页试试吗？",
    },
    actions: [{ label: { en: "Go to homepage", zhCN: "回首页" }, type: "url", url: "/" }],
  },
  {
    id: "bookmark",
    kw: ["bookmark", "save", "favorite", "collect", "收藏", "保存", "书签"],
    answer: {
      en: "The **bookmark icon 🔖** on each card saves that product for quick access later — it lives next to the views (eye) and likes (heart) counters.\n\nTip: use the hero search to find any product by name in seconds.",
      zhCN: "每个卡片上的**书签图标 🔖**会把产品保存起来方便以后快速找到——它就在浏览数（👁）和点赞（❤）旁边。\n\n小提示：用首页搜索框几秒钟就能按名字找到任何产品。",
    },
  },
  {
    id: "views",
    kw: ["view count", "views", "how many people", "popularity", "trending", "浏览", "观看数", "访问量", "人气", "热门"],
    answer: {
      en: "The **eye icon 👁** shows how many people viewed a product. Views and likes update in real time — you'll see the numbers climb as people explore, and they stay accurate after refresh. The **Trending this week** section on the homepage highlights popular resources.",
      zhCN: "**眼睛图标 👁**显示产品的浏览人数。浏览数和点赞数会实时更新——随着大家浏览数字会上涨，刷新后也保持准确。首页的**本周趋势**板块会展示热门资源。",
    },
  },
  {
    id: "search",
    kw: ["search", "find a product", "find me", "look for", "how do i find", "cmd+k", "ctrl+k", "shortcut", "搜索", "查找", "搜索框", "快捷键"],
    answer: {
      en: "The **search box** sits right in the hero on the homepage — type a name, category or keyword and the grid filters live as you type.\n\nYou can also just tell me what you're looking for — I'll take you to the right tab or run the search for you!",
      zhCN: "**搜索框**就在首页 Hero 区域——输入名字、分类或关键词，网格会随着输入实时过滤。\n\n你也可以直接告诉我你在找什么——我帮你跳到对应板块，或者直接帮你搜！",
    },
    actions: [{ label: { en: "Try the search box", zhCN: "试试搜索框" }, type: "search", query: "" }],
  },
  {
    id: "login",
    kw: ["login", "log in", "sign in", "signin", "sign up", "account", "register", "email", "password", "登录", "注册", "账号", "账户", "邮箱"],
    answer: {
      en: "steacode uses a lightweight **email sign-in gate**: when you try to copy full source or open My Purchases, a login window appears — enter your email and you're in. No long forms.\n\nAnything you were doing (like copying a product) is automatically resumed right after you sign in.",
      zhCN: "steacode 使用轻量的**邮箱登录**：当你复制完整源码或打开我的购买时，会出现登录窗口——输入邮箱即可。不用填长表单。\n\n你之前的操作（比如复制产品）会在登录后**自动继续**。",
    },
  },
  {
    id: "license",
    kw: ["license", "licensing", "commercial use", "attribution", "can i use in my project", "usage rights", "copyright", "许可", "商用", "版权", "授权"],
    answer: {
      en: "Licensing details for every product type (personal vs commercial use, attribution, redistribution) live on the **Licensing** page. In short: get it free → use it in your projects; don't resell the files themselves. Check the page for your specific product type.",
      zhCN: "每种产品类型的许可详情（个人 vs 商用、署名、再分发）都在**许可（Licensing）**页面。简单说：免费获取后可在你的项目中使用；但不要转售文件本身。具体请查看对应产品类型的许可页面。",
    },
    actions: [{ label: { en: "Open Licensing", zhCN: "打开许可页" }, type: "url", url: "/licensing" }],
  },
  {
    id: "terms",
    kw: ["terms", "privacy", "cookies", "cookie policy", "refund", "policy", "条款", "隐私", "退款", "政策", "cookie"],
    answer: {
      en: "Legal pages: **Terms**, **Privacy**, **Cookies** — and the **Licensing** page covers usage rights. If anything went wrong, contact support and they'll sort it out with you.",
      zhCN: "法律页面：**条款**、**隐私**、**Cookies**——**许可**页面覆盖使用权利。如有任何问题，联系客服，他们会帮你解决。",
    },
    actions: [{ label: { en: "Open Terms", zhCN: "打开条款" }, type: "url", url: "/terms" }],
  },
  {
    id: "support",
    kw: ["support", "help me", "contact", "bug", "error", "broken", "not working", "issue", "report", "book a call", "hire", "客服", "联系", "报错", "坏了", "问题", "反馈"],
    answer: {
      en: "For anything I can't solve, the **Contact** page is the direct line to the team — bug reports, questions, feedback and partnership ideas. There's also **Book a Call** for 1:1 sessions.\n\nMeanwhile, try a **refresh** — most hiccups (like a stuck count) fix themselves. 🙂",
      zhCN: "如果我解决不了的问题，**联系（Contact）**页面是直达团队的通道——bug 报告、咨询、反馈和合作都可以发。还有 **Book a Call** 可以预约一对一交流。\n\n同时可以先试试**刷新页面**——多数小问题刷新就好了。🙂",
    },
    actions: [{ label: { en: "Go to Contact", zhCN: "打开联系页" }, type: "url", url: "/contact" }],
  },
  {
    id: "language",
    kw: ["language", "中文", "chinese", "swahili", "translate", "change language", "语言", "切换语言", "翻译"],
    answer: {
      en: "steacode speaks **English**, **中文 (Chinese)** and **Kiswahili** — switch from the language selector in the app. And I can chat in any of them; just write to me in your language!",
      zhCN: "steacode 支持**英文**、**中文**和**斯瓦希里语**——在应用里的语言选择器切换。我也可以用这些语言和你聊天，直接用你的语言写给我就行！",
    },
  },
  {
    id: "newsletter",
    kw: ["newsletter", "subscribe", "email updates", "notifications", "订阅", "邮件", "通知"],
    answer: {
      en: "You can **subscribe to the newsletter** to get new products, guides and resources in your inbox — look for the subscribe box in the app.",
      zhCN: "你可以**订阅邮件通知**，第一时间收到新产品和新资源——应用里有订阅框。",
    },
  },
  {
    id: "about",
    kw: ["about", "team", "story", "mission", "关于我们", "团队", "使命"],
    answer: {
      en: "steacode was built to give every developer — anywhere in the world — one place with free, production-grade code, templates, kits and learning resources. Read the full story on the **About** page.",
      zhCN: "steacode 的目标是让全球每个开发者都能在一个地方免费获得生产级代码、模板、套件和学习资源。完整的故事在**关于**页面。",
    },
    actions: [{ label: { en: "Open About", zhCN: "打开关于页" }, type: "url", url: "/about" }],
  },
  {
    id: "mobile",
    kw: ["mobile", "phone", "app store", "install", "pwa", "手机", "安装", "手机版"],
    answer: {
      en: "steacode works great on phones — fully responsive and installable as an **app (PWA)**: on iPhone use Safari → Share → *Add to Home Screen*; on Android use Chrome → *Install app*. It then behaves like a native app.",
      zhCN: "steacode 在手机上体验很好——完全响应式，还可以**安装成应用（PWA）**：iPhone 用 Safari → 分享 → *添加到主屏幕*；Android 用 Chrome → *安装应用*。之后就像原生 App 一样使用。",
    },
  },
  {
    id: "greet",
    kw: ["hello", "hi", "hey", "good morning", "good evening", "yo", "你好", "您好", "嗨", "哈喽", "在吗"],
    answer: {
      en: "Hey there! 👋 I'm **Stea**, your steacode assistant. I know every corner of this app — components, templates, kits, the library, icons, search, you name it.\n\nWhat are you building today?",
      zhCN: "嗨！👋 我是 **Stea**，你的 steacode 助手。这个应用的每个角落我都了解——组件、模板、套件、资源库、图标、搜索，什么都知道。\n\n今天想做什么？",
    },
    chips: { en: ["What is steacode?", "How do I get code?", "Find me a card component"], zhCN: ["steacode 是什么？", "怎么获取代码？", "帮我找卡片组件"] },
  },
  {
    id: "thanks",
    kw: ["thank", "thanks", "great", "awesome", "nice bot", "谢谢", "感谢", "太棒了", "不错"],
    answer: {
      en: "Anytime! 😊 If you need anything else — finding code, copying a product, or just exploring — I'm right here.",
      zhCN: "不客气！😊 如果还需要什么——找代码、复制产品、或者随便逛逛——我都在。",
    },
  },
  {
    id: "bye",
    kw: ["bye", "goodbye", "see you", "晚安", "再见", "拜拜"],
    answer: {
      en: "See you around! 👋 Just tap my bubble anytime you need a hand.",
      zhCN: "回头见！👋 需要帮忙随时点我这个气泡。",
    },
  },
  {
    id: "who-are-you",
    kw: ["who are you", "are you ai", "are you a bot", "your name", "你是谁", "你是机器人吗", "你叫什么"],
    answer: {
      en: "I'm **Stea** — the steacode assistant. I live right here in the app and I'm trained on *everything* in it: all tabs, every category, the get-code flow, purchases, licensing, search… Ask me anything about steacode, or tell me what you want and I'll take you there.",
      zhCN: "我是 **Stea**——steacode 的助手。我就住在这个应用里，并且了解它的*一切*：所有板块、每个分类、获取代码流程、购买库、许可、搜索……关于 steacode 的问题都可以问我，或者告诉我你想要什么，我带你去。",
    },
  },
  {
    id: "can-do",
    kw: ["what can you do", "help me with", "how can you help", "what do you know", "你能做什么", "你会什么", "怎么帮我"],
    answer: {
      en: "Here's what I can do:\n\n• **Explain** any part of steacode — tabs, products, likes, get-code, licensing\n• **Take you anywhere** — \"show me cards\", \"open kits\", \"go to my purchases\"\n• **Run a search** for you in the hero search box\n• **Answer** how-to questions (copying, signing in, downloads, support)\n\nTry: *\"find me a hero section\"* or *\"how do likes work?\"*",
      zhCN: "我能做的事：\n\n• **讲解** steacode 的任何部分——板块、产品、点赞、获取代码、许可\n• **带你去任何地方**——“看看卡片”、“打开套件”、“去我的购买”\n• **帮你搜索**——直接在首页搜索框执行\n• **回答**各种使用问题（复制、登录、下载、支持）\n\n试试：*“帮我找 hero 区”* 或 *“点赞怎么用？”*",
    },
    chips: { en: ["What is steacode?", "How do I get code?", "Where are my purchases?"], zhCN: ["steacode 是什么？", "怎么获取代码？", "我的购买在哪？"] },
  },
  {
    id: "tabs-overview",
    kw: ["tabs", "sections", "categories", "what does the app have", "features", "what can i find", "板块", "分类", "有什么", "功能"],
    answer: {
      en: "steacode is organized into **6 tabs**:\n\n1. **Components** — copy-paste buttons, cards, modals, forms…\n2. **Templates** — heroes, landing pages, dashboards, e-commerce\n3. **Kits** — full apps, websites and games\n4. **Library** — ebooks, courses, cheat sheets\n5. **Icons** — free SVG icon gallery\n6. **Blog** — guides & articles\n\nPlus **My Purchases** for everything you've unlocked. Which one shall I open?",
      zhCN: "steacode 分为 **6 个板块**：\n\n1. **Components（组件）** — 复制即用的按钮、卡片、弹窗、表单……\n2. **Templates（模板）** — Hero 区、着陆页、仪表盘、电商\n3. **Kits（组合包）** — 完整应用、网站和游戏\n4. **Library（资源库）** — 电子书、课程、速查表\n5. **Icons（图标）** — 免费 SVG 图标库\n6. **Blog（博客）** — 指南与文章\n\n另外还有存放你已解锁内容的**我的购买**。要我打开哪一个？",
    },
    chips: { en: ["Open Components", "Open Templates", "Open Kits"], zhCN: ["打开组件", "打开模板", "打开套件"] },
  },
];

/* ------------------------- navigation intents ----------------------- */

const NAV_INTENTS = [
  ...TABS.map((tab) => ({
    type: "tab",
    tab: tab.urlTab,
    kw: [
      `open ${tab.label.toLowerCase()}`, `go to ${tab.label.toLowerCase()}`, `show ${tab.label.toLowerCase()}`,
      `take me to ${tab.label.toLowerCase()}`, `show me ${tab.label.toLowerCase()}`,
      `open ${tab.id}`, `go to ${tab.id}`,
      `打开${tab.label}`, `去${tab.label}`, `看看${tab.label}`,
    ],
  })),
  { type: "tab", tab: "components", kw: ["open components", "go to components", "show me components", "打开组件", "去组件", "看看组件"] },
  { type: "tab", tab: "layouts", kw: ["open templates", "go to templates", "show me templates", "打开模板", "去模板", "看看模板"] },
  { type: "tab", tab: "kits", kw: ["open kits", "go to kits", "show me kits", "打开套件", "去套件", "看看套件"] },
  { type: "tab", tab: "library", kw: ["open library", "go to library", "show me library", "打开资源库", "去资源库"] },
  { type: "tab", tab: "icons", kw: ["open icons", "go to icons", "show me icons", "打开图标", "去图标", "看看图标"] },
  { type: "tab", tab: "blog", kw: ["open blog", "go to blog", "show me blog", "打开博客", "去博客"] },
  { type: "url", url: "/", kw: ["open homepage", "go to homepage", "go home", "take me home", "back to home", "回首页", "打开首页", "去首页"] },
  { type: "url", url: "/?view=purchases", kw: ["open purchases", "go to purchases", "my purchases", "打开我的购买", "去我的购买"] },
  { type: "url", url: "/contact", kw: ["open contact", "go to contact", "打开联系", "去联系"] },
  { type: "url", url: "/about", kw: ["open about", "go to about", "打开关于", "去关于"] },
  { type: "url", url: "/licensing", kw: ["open licensing", "go to licensing", "打开许可", "去许可"] },
  { type: "url", url: "/terms", kw: ["open terms", "go to terms", "打开条款", "去条款"] },
  { type: "url", url: "/blog", kw: ["open blog page", "go to blog page", "打开博客页面"] },
  { type: "url", url: "/store", kw: ["open store", "go to store", "ebook store", "打开商店", "去商店"] },
  { type: "url", url: "/book-a-call", kw: ["book a call", "open book a call", "预约通话", "预约咨询"] },
];

/* ------------------------- topic routing ---------------------------- */
/* "find me X" style questions → the right tab. */

const TOPIC_ROUTES = [
  { tab: "components", category: "Cards", kw: ["card", "cards", "profile card", "product card", "hover card", "卡片"] },
  { tab: "components", category: "Buttons", kw: ["button", "buttons", "按钮"] },
  { tab: "components", category: "Forms", kw: ["form", "forms", "login form", "signup form", "subscribe", "表单", "登录表单"] },
  { tab: "components", category: "Overlays", kw: ["modal", "drawer", "tooltip", "popup", "dialog", "弹窗", "抽屉"] },
  { tab: "components", category: "Navigation", kw: ["navbar", "navigation", "tabs", "breadcrumb", "menu", "导航", "菜单"] },
  { tab: "components", category: "Backgrounds", kw: ["background", "particles", "waves", "animated background", "背景", "粒子"] },
  { tab: "components", category: "Feedback", kw: ["loader", "spinner", "toast", "skeleton", "加载", "加载器"] },
  { tab: "components", category: "Text", kw: ["text effect", "typography", "animated text", "文字", "文字动效"] },
  { tab: "components", category: "Inputs", kw: ["input", "text field", "select", "输入框"] },
  { tab: "components", category: "Toggle Switches", kw: ["toggle", "switch", "开关"] },
  { tab: "layouts", category: "Hero Sections", kw: ["hero", "hero section", "banner", "hero 区", "横幅"] },
  { tab: "layouts", category: "Pricing Tables", kw: ["pricing", "pricing table", "定价", "价格表"] },
  { tab: "layouts", category: "Landing Pages", kw: ["landing page", "landing", "着陆页"] },
  { tab: "layouts", category: "Dashboards", kw: ["dashboard", "admin panel", "仪表盘", "后台"] },
  { tab: "layouts", category: "E-commerce", kw: ["e-commerce", "ecommerce", "shop page", "store layout", "电商"] },
  { tab: "layouts", category: "Portfolios", kw: ["portfolio", "作品集"] },
  { tab: "layouts", category: "Testimonials", kw: ["testimonial", "review section", "评价"] },
  { tab: "layouts", category: "FAQ Blocks", kw: ["faq", "问题区块"] },
  { tab: "layouts", category: "Footers", kw: ["footer", "页脚"] },
  { tab: "kits", category: "Games", kw: ["game", "games", "arcade", "puzzle", "游戏"] },
  { tab: "kits", category: "Apps", kw: ["app kit", "full app", "starter app", "完整应用"] },
  { tab: "kits", category: "Websites", kw: ["website kit", "full website", "网站套件"] },
  { tab: "library", category: "Ebooks", kw: ["ebook", "ebooks", "book", "masterclass", "电子书"] },
  { tab: "library", category: "Courses", kw: ["course", "courses", "课程"] },
  { tab: "library", category: "Cheat Sheets", kw: ["cheat sheet", "cheatsheet", "notes", "速查表", "笔记"] },
  { tab: "icons", kw: ["icon", "icons", "svg", "图标"] },
];

/* ------------------------- small helpers ---------------------------- */

const norm = (s) => (s || "").toLowerCase().trim();

function scoreKeywords(text, kws) {
  const t = norm(text);
  let score = 0;
  for (const kw of kws) {
    const k = norm(kw);
    if (!k) continue;
    if (t === k) score += 6;
    else if (t.includes(k)) score += k.length >= 4 ? 3 : 2;
  }
  return score;
}

function pick(locale) {
  return (value) => {
    if (value == null) return "";
    if (typeof value === "string") return value;
    return value[locale] || value.en || Object.values(value)[0] || "";
  };
}

/* ------------------------- public brain API ------------------------- */

const WELCOME = {
  en: "Hi! 👋 I'm **Stea**, your steacode assistant. I know everything in this app — components, templates, kits, the library, icons, the get-code flow, purchases…\n\nAsk me anything, or pick a topic below:",
  zhCN: "嗨！👋 我是 **Stea**，你的 steacode 助手。这个应用里的一切我都知道——组件、模板、套件、资源库、图标、获取代码流程、我的购买……\n\n随便问我，或在下面选一个话题：",
};

const SUGGESTIONS = {
  en: [
    "What is steacode?",
    "How do I get code?",
    "Is everything free?",
    "Find me a card component",
    "Find me a hero section",
    "Where are my purchases?",
    "How do likes work?",
  ],
  zhCN: [
    "steacode 是什么？",
    "怎么获取代码？",
    "都免费吗？",
    "帮我找卡片组件",
    "帮我找 Hero 区",
    "我的购买在哪？",
    "点赞怎么用？",
  ],
};

const FALLBACK = {
  en: {
    text: "Hmm, I'm not sure I caught that — but I know *everything* about steacode, so try rephrasing! For example:\n\n• \"How do I get code?\"\n• \"Find me a card component\"\n• \"Open kits\"\n• \"Where are my purchases?\"",
    chips: { en: ["What can you do?", "What is steacode?", "How do I get code?"], zhCN: ["你能做什么？", "steacode 是什么？", "怎么获取代码？"] },
  },
  zhCN: {
    text: "嗯，我没太听懂——但我了解 steacode 的*一切*，换个说法试试？比如：\n\n• “怎么获取代码？”\n• “帮我找卡片组件”\n• “打开套件”\n• “我的购买在哪？”",
    chips: { en: ["What can you do?", "What is steacode?", "How do I get code?"], zhCN: ["你能做什么？", "steacode 是什么？", "怎么获取代码？"] },
  },
};

/**
 * Main entry: query the brain.
 * @param {string} raw user message
 * @param {string} locale "en" | "zhCN" | "sw"
 * @returns {{ text: string, chips?: string[], actions?: Array } | null}
 */
export function answerQuery(raw, locale = "en") {
  const t = pick(locale);
  const text = norm(raw);
  if (!text) return null;

  /* 1. Explicit navigation commands ("open kits", 帮我打开图标) */
  let bestNav = null;
  let bestNavScore = 0;
  for (const nav of NAV_INTENTS) {
    const s = scoreKeywords(raw, nav.kw);
    if (s >= 3 && s > bestNavScore) {
      bestNav = nav;
      bestNavScore = s;
    }
  }
  const wantsNav = /open|go to|show|take me|打开|去|带我去|看看/.test(text);
  if (bestNav && (wantsNav || bestNavScore >= 6)) {
    const tabDef = bestNav.tab ? TABS.find((w) => w.urlTab === bestNav.tab) : null;
    return {
      text: tabDef
        ? { en: `Opening **${tabDef.label}** now. ${tabDef.what}\n\nAnything else — just ask!`, zhCN: `正在为你打开 **${tabDef.label}**。${tabDef.what}\n\n还有别的需要——尽管问！` }
        : { en: "Opening it for you now — one tap away! 👇", zhCN: "马上为你打开——就在下面！👇" },
      actions: [{ label: t({ en: "Go", zhCN: "前往" }), type: bestNav.type, tab: bestNav.tab, url: bestNav.url }],
    };
  }

  /* 2. FAQ intents */
  let best = null;
  let bestScore = 0;
  for (const faq of FAQ) {
    const s = scoreKeywords(raw, faq.kw);
    if (s > bestScore) {
      best = faq;
      bestScore = s;
    }
  }
  if (best && bestScore >= 3) {
    const out = { text: t(best.answer) };
    if (best.chips) out.chips = (best.chips[locale] || best.chips.en).map(t);
    if (best.actions) out.actions = best.actions.map((a) => ({ ...a, label: t(a.label) }));
    return out;
  }

  /* 3. Topic routing ("find me a card component") */
  let topic = null;
  let topicScore = 0;
  for (const route of TOPIC_ROUTES) {
    const s = scoreKeywords(raw, route.kw);
    if (s > topicScore) {
      topic = route;
      topicScore = s;
    }
  }
  if (topic && topicScore >= 3) {
    const tabDef = TABS.find((w) => w.urlTab === topic.tab);
    const catText = topic.category ? ` **${topic.category}** inside` : "";
    return {
      text: {
        en: `Great — that lives in the **${tabDef.label}** tab${catText}. I'll open it for you; the grid filters as you browse.`,
        zhCN: `好嘞——这在 **${tabDef.label}** 板块里${topic.category ? `的 **${topic.category}** 分类` : ""}。我马上帮你打开，进去就能直接浏览。`,
      },
      actions: [{
        label: t(topic.category
          ? { en: `Open ${tabDef.label} → ${topic.category}`, zhCN: `打开${tabDef.label} → ${topic.category}` }
          : { en: `Open ${tabDef.label}`, zhCN: `打开${tabDef.label}` }),
        type: "tab",
        tab: topic.tab,
        category: topic.category || undefined,
      }],
    };
  }

  /* 4. Fallback */
  const fb = FALLBACK[locale] || FALLBACK.en;
  return {
    text: t(fb.text),
    chips: fb.chips ? (fb.chips[locale] || fb.chips.en).map(t) : undefined,
  };
}

export function getWelcome(locale = "en") {
  return pick(locale)(WELCOME);
}

export function getSuggestions(locale = "en") {
  const list = SUGGESTIONS[locale] || SUGGESTIONS.en;
  return list.map(pick(locale));
}
