import axios from "axios";
import * as cheerio from "cheerio";

const YEARS = [2006, 2008, 2009, 2011, 2016, 2024];
const EXAMS = [
  { examType: "psle", label: "Primary / Standard 7", codeQuery: "P0101" },
  { examType: "sfna", label: "Standard 4", codeQuery: "P0101" },
  { examType: "ftna", label: "Form Two", codeQuery: "S0101" },
  { examType: "csee", label: "Form Four", codeQuery: "S0101" },
  { examType: "acsee", label: "Form Six / Advanced", codeQuery: "S0101" },
];
const QUERIES = ["azania", "sengerema", "mzumbe", "twiga", "ilboru", "kibaha", "tabora", "kilakala"];
const TIMEOUT_MS = Number(process.env.NECTA_MATRIX_TIMEOUT_MS || 5000);

function urlsFor(examType, year) {
  const t = examType.toLowerCase();
  const T = examType.toUpperCase();
  const y = String(year);
  return [
    `https://onlinesys.necta.go.tz/results/${y}/${t}/index.htm`,
    `https://onlinesys.necta.go.tz/results/${y}/${t}/index.html`,
    `https://onlinesys.necta.go.tz/results/${y}/${t}/indexfiles/index_t.htm`,
    `https://onlinesys.necta.go.tz/results/${y}/${t}/indexfiles/index_s.htm`,
    `https://onlinesys.necta.go.tz/results/${y}/${t}/indexfiles/school.htm`,
    `https://onlinesys.necta.go.tz/results/${y}/${t}_results/index.htm`,
    `https://onlinesys.necta.go.tz/results/${t}${y}/index.htm`,
    `https://onlinesys.necta.go.tz/results/${t}${y}/index.html`,
    `https://onlinesys.necta.go.tz/results/${t}${y}/indexfiles/index_t.htm`,
    `http://onlinesys.necta.go.tz/results/${y}/${t}/`,
    `http://onlinesys.necta.go.tz/results/${t}${y}/`,
    `http://results.necta.go.tz/${t}${y}/index.htm`,
    `http://results.necta.go.tz/${t}${y}/index.html`,
    `http://results.necta.go.tz/${t}${y}/indexfiles/index_t.htm`,
    `http://results.necta.go.tz/${t}${y}/`,
    `http://matokeo.necta.go.tz/${t}${y}/index.htm`,
    `http://matokeo.necta.go.tz/${t}${y}/index.html`,
    `http://matokeo.necta.go.tz/${y}/${t}/index.htm`,
    `https://maktaba.tetea.org/exam-results/${T}${y}/index.htm`,
    `https://maktaba.tetea.org/exam-results/${T}${y}/index.html`,
    `https://maktaba.tetea.org/exam-results/${T}-${y}/index.htm`,
    `https://maktaba.tetea.org/exam-results/${T}-${y}/index.html`,
    `https://necta.go.tz/results/${y}/${t}/index.htm`,
    `http://www.necta.go.tz/results/${y}/${t}/index.htm`,
  ];
}

function parseSchools(html, query = "") {
  const $ = cheerio.load(html);
  const schools = [];
  let parserStrategy = "link-code-name";
  const codeRegex = /([PS]\d{4})/i;
  const queryClean = String(query || "").replace(/\s+/g, "").toLowerCase();

  $("a").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    const href = $(el).attr("href") || "";
    const match = `${text} ${href}`.match(codeRegex);
    if (!match) return;
    const code = match[1].toUpperCase();
    const name = (text || code)
      .replace(new RegExp(code, "ig"), "")
      .replace(/[^\w\s']/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    const label = name || text || code;
    const nameClean = label.replace(/\s+/g, "").toLowerCase();
    if (!query || nameClean.includes(queryClean) || code.toLowerCase().includes(queryClean)) {
      schools.push({ code, name: label, href });
    }
  });

  if (schools.length === 0) {
    parserStrategy = "legacy-text-code-name";
    const text = $.text().replace(/\r/g, "\n");
    const lines = text.split(/\n|(?=[PS]\d{4})/i).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
    for (const line of lines) {
      const match = line.match(/\b([PS]\d{4})\b\s*[-.:)]?\s*(.{2,90})/i);
      if (!match) continue;
      const code = match[1].toUpperCase();
      const name = match[2].replace(/[^\w\s']/gi, " ").replace(/\s+/g, " ").trim() || code;
      const nameClean = name.replace(/\s+/g, "").toLowerCase();
      if (!query || nameClean.includes(queryClean) || code.toLowerCase().includes(queryClean)) {
        schools.push({ code, name, href: "" });
      }
    }
  }

  return {
    parserStrategy,
    schools: Array.from(new Map(schools.map((s) => [s.code, s])).values()),
  };
}

async function fetchIndex(examType, year) {
  const urls = urlsFor(examType, year);
  const attempts = await Promise.all(urls.map(async (url, index) => {
    try {
      const res = await axios.get(url, {
        timeout: TIMEOUT_MS,
        validateStatus: () => true,
        maxRedirects: 3,
        headers: {
          "User-Agent": "Mozilla/5.0 STEA NECTA matrix validator",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      const contentType = res.headers?.["content-type"] || "";
      const body = String(res.data || "");
      return {
        index,
        url,
        status: res.status,
        contentType,
        bodyLength: body.length,
        html: res.status >= 200 && res.status < 300 && /html|text|octet-stream/i.test(contentType) && body.length > 500 ? body : "",
      };
    } catch (error) {
      return {
        index,
        url,
        status: error.response?.status || "ERROR",
        contentType: error.response?.headers?.["content-type"] || "",
        errorCode: error.code || "FETCH_ERROR",
        html: "",
      };
    }
  }));
  attempts.sort((a, b) => a.index - b.index);
  const success = attempts.find((attempt) => attempt.html);
  if (success) return { html: success.html, attempts, sourceUrl: success.url };
  return { html: "", attempts, sourceUrl: "" };
}

function logRow(row) {
  console.log(JSON.stringify(row));
}

async function main() {
  const summary = {
    testedYears: YEARS,
    examTypes: EXAMS.map((e) => e.examType),
    working: [],
    unavailable: [],
  };

  for (const year of YEARS) {
    for (const exam of EXAMS) {
      const fetched = await fetchIndex(exam.examType, year);
      const sourceUrlsTried = fetched.attempts.map((a) => a.url);
      const lastAttempt = fetched.attempts[fetched.attempts.length - 1] || {};
      const allQueries = [...QUERIES, exam.codeQuery];

      if (!fetched.html) {
        for (const query of allQueries) {
          const row = {
            examType: exam.examType,
            examLabel: exam.label,
            year,
            query,
            sourceUrlsTried,
            httpStatus: lastAttempt.status || "NO_SOURCE",
            contentType: lastAttempt.contentType || "",
            parserStrategyUsed: "none",
            resultCount: 0,
            errorCode: "NECTA_SOURCE_UNAVAILABLE",
            message: `${exam.label} ${year} is unavailable from supported public NECTA sources.`,
          };
          logRow(row);
        }
        summary.unavailable.push(`${exam.examType}-${year}`);
        continue;
      }

      let comboHasResults = false;
      for (const query of allQueries) {
        const parsed = parseSchools(fetched.html, query);
        const row = {
          examType: exam.examType,
          examLabel: exam.label,
          year,
          query,
          sourceUrlsTried,
          httpStatus: 200,
          contentType: fetched.attempts.find((a) => a.url === fetched.sourceUrl)?.contentType || "",
          parserStrategyUsed: parsed.parserStrategy,
          resultCount: parsed.schools.length,
          errorCode: parsed.schools.length > 0 ? "" : "NO_MATCH_FOR_QUERY",
          sourceUrl: fetched.sourceUrl,
        };
        comboHasResults = comboHasResults || parsed.schools.length > 0;
        logRow(row);
      }
      (comboHasResults ? summary.working : summary.unavailable).push(`${exam.examType}-${year}`);
    }
  }

  console.log(JSON.stringify({ type: "summary", ...summary }));
}

main().catch((error) => {
  console.error(JSON.stringify({
    type: "fatal",
    errorCode: error.code || "MATRIX_FATAL",
    message: error.message,
  }));
  process.exit(1);
});
