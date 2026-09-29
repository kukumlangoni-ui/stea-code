// Centralized search index for STEA platform
// Contains searchable items with keywords, categories, and direct routes
// Handles both English and Kiswahili, common misspellings, and abbreviations.

export const searchIndex = [
  // --- TECH HUB / AI LAB ---
  {
    title: "STEA Tech Hub",
    category: "Tech Hub",
    route: "/tech",
    description: "Technology hub featuring digital tools, AI assistance, custom prompts, and solutions.",
    keywords: ["tech", "technology", "tech hub", "hub", "digital", "solutions", "huduma za kiteknolojia", "sayansi", "teknolojia"]
  },
  {
    title: "Prompt Lab",
    category: "AI & Tech",
    route: "/prompt-lab",
    description: "Write perfect AI prompts in Swahili and English for ChatGPT, Gemini, and Midjourney.",
    keywords: ["prompt", "prompts", "ai prompt", "chatgpt prompts", "gemini prompts", "prompt lab", "midjourney", "kiswahili prompt", "kuandika", "miongozo"]
  },
  {
    title: "AI Lab",
    category: "AI & Tech",
    route: "/ai-lab",
    description: "Explore advanced AI tools, ChatGPT models, Gemini integrations, and automation resources.",
    keywords: ["ai", "artificial intelligence", "ai lab", "chatgpt", "gemini", "ai tools", "automation", "akili mnemba", "roboti", "mtambo"]
  },
  {
    title: "Website Solutions",
    category: "Web & Digital",
    route: "/websites",
    description: "Professional website design and development packages for business, schools, and portfolios.",
    keywords: ["website", "websites", "web design", "web development", "web site", "design website", "hosting", "domain", "tengeneza website", "kutengeneza tovuti", "tovuti", "business website"]
  },
  {
    title: "Digital Tools",
    category: "Web & Digital",
    route: "/digital-tools",
    description: "Get premium utility applications, SEO software, design templates, and subscription deals.",
    keywords: ["digital tools", "tools", "subscriptions", "premium apps", "software", "seo tools", "zana", "vifaa vya kidijitali", "programu"]
  },

  // --- DUKA MARKETPLACE ---
  {
    title: "STEA Duka Marketplace",
    category: "Duka Marketplace",
    route: "/duka",
    description: "Sokoni kwa bidhaa mbalimbali, simu, laptop, vifaa vya kielektroniki na kuagiza kutoka China.",
    keywords: ["duka", "marketplace", "shop", "buy", "sell", "soko", "nunua", "uza", "bidhaa", "tanzania shop"]
  },
  {
    title: "Smartphones & Tablets",
    category: "Duka Marketplace",
    route: "/duka/phones",
    description: "Shop late models of iPhones, Samsung, Xiaomi, and other brand smartphones with secure warranty.",
    keywords: ["phone", "iphone", "simu", "smartphone", "smart phone", "samsung", "xiaomi", "redmi", "tecno", "infinix", "itel", "tablets", "ipad", "android", "ios"]
  },
  {
    title: "Laptops & Computers",
    category: "Duka Marketplace",
    route: "/duka/laptops",
    description: "High-performance laptops, MacBooks, business laptops, and computer accessories.",
    keywords: ["laptop", "laptops", "computer", "macbook", "hp", "dell", "lenovo", "asus", "kompyuta", "keyboard", "mouse"]
  },
  {
    title: "Order from China",
    category: "Duka Marketplace",
    route: "/duka/china",
    description: "Agiza bidhaa moja kwa moja kutoka viwanda vya China kwa bei nafuu sana na usafirishaji salama.",
    keywords: ["china", "agiza china", "order china", "agiza bidhaa", "china shipping", "imported", "viwandani", "alibaba", "taobao"]
  },
  {
    title: "Accessories & Gadgets",
    category: "Duka Marketplace",
    route: "/duka/accessories",
    description: "Chargers, powerbanks, earphones, smart watches, and awesome gadgets at STEA Duka.",
    keywords: ["accessory", "accessories", "powerbank", "earphone", "headphones", "smart watch", "charger", "gadget", "vifaa", "chaja"]
  },

  // --- STUDENT CENTRE ---
  {
    title: "STEA Education",
    category: "Student Centre",
    route: "/education",
    description: "Exams materials, study notes, NECTA results hub, scholarships guidelines, and university points calculator.",
    keywords: ["shule", "student", "exams", "mitihani", "results", "education", "masomo", "mwanafunzi", "school", "university", "chuo"]
  },
  {
    title: "NECTA Results Center",
    category: "Student Centre",
    route: "/results",
    description: "Matafuta matokeo rasmi ya NECTA ya Form 2, Form 4, na Form 6 kwa mwaka wowote na kwa takwimu za shule.",
    keywords: ["necta", "results", "matokeo", "nekta", "csee", "acsee", "ftna", "psle", "matokeo ya mitihani", "form four", "form two", "form six", "nne", "sita", "pili"]
  },
  {
    title: "Past Papers Hub",
    category: "Student Centre",
    route: "/past-papers",
    description: "Download past paper exams from primary, secondary, and high school with official marking schemes.",
    keywords: ["past paper", "past papers", "papers", "mitihani ya nyuma", "pastpapers", "exams past papers", "marking scheme", "mitihani iliyopita"]
  },
  {
    title: "Study Notes",
    category: "Student Centre",
    route: "/notes",
    description: "Comprehensive simplified study notes for O-Level, A-Level, and basic primary school subjects.",
    keywords: ["notes", "study notes", "nukuu", "nukuu za masomo", "notes masomo", "revision notes", "summaries"]
  },
  {
    title: "Scholarships Guide",
    category: "Student Centre",
    route: "/scholarships",
    description: "HESLB loan dashboard, TCU scholarships, inside and overseas university sponsorship guidelines.",
    keywords: ["scholarship", "scholarships", "fees", "funding", "heslb", "tcu", "fursa ya masomo", "mkopo", "mikopo", "ufadhili", "vipaji"]
  },

  // --- COURSES ---
  {
    title: "Online Courses & Classes",
    category: "Courses",
    route: "/courses",
    description: "Learn tech, digital design, programming, video editing, business skills, or language courses.",
    keywords: ["courses", "video lessons", "kujifunza", "course", "lessons", "tutorials", "programming", "video editing", "darasa", "kozi", "masomo ya mtandaoni"]
  },

  // --- GIGS & JOBS ---
  {
    title: "STEA Gigs & Kazi Lounge",
    category: "Opportunities",
    route: "/kazi",
    description: "Connect with freelance gigs, remote work, local job openings, and internships inside Tanzania.",
    keywords: ["gigs", "jobs", "kazi", "ajira", "freelance", "remote job", "internships", "tafuta kazi", "matangazo ya kazi"]
  },

  // --- GENERAL SERVICES ---
  {
    title: "STEA Professional Services",
    category: "Services",
    route: "/services",
    description: "Request custom services like brand partnership, product promotion, web development, and digital marketing support.",
    keywords: ["services", "support", "design", "promotion", "advertising", "tangaza", "matangazo", "huduma", "misaada"]
  },
  {
    title: "STEA VPN",
    category: "Services",
    route: "/vpn",
    description: "Secure internet access powered by STEA.",
    keywords: ["vpn", "stea vpn", "security", "privacy", "secure", "internet"]
  },

  // --- GAMES AREA ---
  {
    title: "STEA Games & Gaming Zone",
    category: "Entertainment",
    route: "/games",
    description: "Play cognitive games, puzzles, trivia quizzes, and Swahili educational matches on STEA.",
    keywords: ["games", "game", "gaming", "michezo", "play", "puzzle", "quiz", "trivia", "mchezo", "karata"]
  }
];

// Performs smart routing check based on query text
// Returns the exact matching route string if a strong direct keyword match is found
export function getSmartDirectRoute(query) {
  const norm = String(query || "").trim().toLowerCase();
  if (!norm) return null;

  // Games matcher
  if (/\b(game(s)?|gaming|michezo|mchezo|puzle|trivia)\b/.test(norm)) {
    return "/games";
  }

  // Phones matcher
  if (/\b(phone(s)?|simu|iphone|samsung|redmi|xiaomi|tecno|infinix|pixel|touch)\b/.test(norm)) {
    return "/duka/phones";
  }

  // Laptops matcher
  if (/\b(laptop(s)?|computer(s)?|pc|macbook|dell|hps|lenovo)\b/.test(norm)) {
    return "/duka/laptops";
  }

  // China matcher
  if (/\b(china|agiza\s*china|order\s*china|alibaba|import)\b/.test(norm)) {
    return "/duka/china";
  }

  // Accessories matcher
  if (/\b(charger(s)?|chaja|powerbank(s)?|earphone(s)?|watch|headphone(s)?|accessories)\b/.test(norm)) {
    return "/duka/accessories";
  }

  // Results matcher
  if (/\b(result(s)?|matokeo|necta|nekta|csee|acsee|ftna|psle)\b/.test(norm)) {
    return "/results";
  }

  // Shule / Notes matcher
  if (/\b(note(s)?|nukuu|past\s*paper(s)?|pastpapers|mitihani|shule|student(s)?|education|study|reading)\b/.test(norm)) {
    return "/education";
  }

  // Prompts matcher
  if (/\b(prompt(s)?|ai\s*prompt|promptlab|midjourney\s*prompt)\b/.test(norm)) {
    return "/prompt-lab";
  }

  // AI matcher
  if (/\b(chatgpt|gemini|ai\s*tools|ai\s*lab|artificial\s*intelligence)\b/.test(norm)) {
    return "/ai-lab";
  }

  // Web design matcher
  if (/\b(website(s)?|web\s*design|web\s*site|tovuti|hosting)\b/.test(norm)) {
    return "/websites";
  }

  // Kazi / Gigs matcher
  if (/\b(job(s)?|kazi|ajira|gig(s)?|freelance|remote|opportunities)\b/.test(norm)) {
    return "/kazi";
  }

  // Courses matcher
  if (/\b(course(s)?|lessons|video\s*lessons|kujifunza|masomo)\b/.test(norm)) {
    return "/courses";
  }

  // Services matcher
  if (/\b(service(s)?|support|design|advertising|huduma)\b/.test(norm)) {
    return "/services";
  }

  // VPN matcher
  if (/\b(vpn|stea\s*vpn|security|privacy)\b/.test(norm)) {
    return "/vpn";
  }

  // Search by keyword intersection in searchIndex for possible exact title matching
  for (const item of searchIndex) {
    if (item.keywords.some(k => k === norm || norm.includes(k))) {
      return item.route;
    }
  }

  return null;
}
