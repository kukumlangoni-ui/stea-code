const EXAMS = Object.freeze({
  ftna: Object.freeze({ examName: "Form Two National Assessment", shortName: "FTNA", levelName: "Form Two", schoolLevel: "O-Level" }),
  csee: Object.freeze({ examName: "Certificate of Secondary Education Examination", shortName: "CSEE", levelName: "Form Four", schoolLevel: "O-Level" }),
  acsee: Object.freeze({ examName: "Advanced Certificate of Secondary Education Examination", shortName: "ACSEE", levelName: "Form Six", schoolLevel: "A-Level" }),
});

const SCHOOLS = Object.freeze({
  S2549: Object.freeze({ schoolName: "Alpha High School", campusName: "Alpha Schools · Centre S2549" }),
  S5889: Object.freeze({ schoolName: "Alpha Girls High School", campusName: "Alpha Schools · Centre S5889" }),
});

function result(examType, year, schoolCode, officialSourceUrl, latest = false) {
  return Object.freeze({ id: `${examType}-${year}-${schoolCode.toLowerCase()}`, examType, year, schoolCode, officialSourceUrl, enabled: true, latest, ...EXAMS[examType], ...SCHOOLS[schoolCode] });
}

// Every entry below was verified against an official NECTA result page.
export const alphaNectaResults = Object.freeze([
  result("ftna", 2022, "S2549", "https://onlinesys.necta.go.tz/results/2022/ftna/results/S2549.htm"),
  result("ftna", 2022, "S5889", "https://onlinesys.necta.go.tz/results/2022/ftna/results/S5889.htm"),
  result("ftna", 2023, "S2549", "https://onlinesys.necta.go.tz/results/2023/ftna/results/S2549.htm"),
  result("ftna", 2023, "S5889", "https://onlinesys.necta.go.tz/results/2023/ftna/results/S5889.htm"),
  result("ftna", 2024, "S2549", "https://onlinesys.necta.go.tz/results/2024/ftna/results/S2549.htm"),
  result("ftna", 2024, "S5889", "https://onlinesys.necta.go.tz/results/2024/ftna/results/S5889.htm"),
  result("ftna", 2025, "S2549", "https://onlinesys.necta.go.tz/results/2025/ftna/results/S2549.htm", true),
  result("ftna", 2025, "S5889", "https://onlinesys.necta.go.tz/results/2025/ftna/results/S5889.htm", true),
  result("csee", 2022, "S2549", "https://onlinesys.necta.go.tz/results/2022/csee/results/s2549.htm"),
  result("csee", 2023, "S2549", "https://onlinesys.necta.go.tz/results/2023/csee/results/s2549.htm"),
  result("csee", 2023, "S5889", "https://onlinesys.necta.go.tz/results/2023/csee/results/s5889.htm"),
  result("csee", 2024, "S2549", "https://onlinesys.necta.go.tz/results/2024/csee/results/s2549.htm"),
  result("csee", 2024, "S5889", "https://onlinesys.necta.go.tz/results/2024/csee/results/s5889.htm"),
  result("csee", 2025, "S2549", "https://onlinesys.necta.go.tz/results/2025/csee/results/s2549.htm", true),
  result("csee", 2025, "S5889", "https://onlinesys.necta.go.tz/results/2025/csee/results/s5889.htm", true),
  result("acsee", 2023, "S2549", "https://onlinesys.necta.go.tz/results/2023/acsee/results/s2549.htm"),
  result("acsee", 2023, "S5889", "https://onlinesys.necta.go.tz/results/2023/acsee/results/s5889.htm"),
  result("acsee", 2024, "S2549", "https://onlinesys.necta.go.tz/results/2024/acsee/results/s2549.htm"),
  result("acsee", 2024, "S5889", "https://onlinesys.necta.go.tz/results/2024/acsee/results/s5889.htm"),
  result("acsee", 2025, "S2549", "https://onlinesys.necta.go.tz/results/2025/acsee/results/s2549.htm"),
  result("acsee", 2025, "S5889", "https://onlinesys.necta.go.tz/results/2025/acsee/results/s5889.htm"),
  result("acsee", 2026, "S2549", "https://matokeo.necta.go.tz/results/2026/acsee/results/s2549.htm", true),
  result("acsee", 2026, "S5889", "https://matokeo.necta.go.tz/results/2026/acsee/results/s5889.htm", true),
]);

export function enabledNectaResults() {
  return alphaNectaResults.filter((item) => item.enabled).sort((a, b) => b.year - a.year || a.examType.localeCompare(b.examType) || a.schoolCode.localeCompare(b.schoolCode));
}

export function findNectaResult(examType, year, schoolCode) {
  return enabledNectaResults().find((item) => item.examType === String(examType || "").toLowerCase() && String(item.year) === String(year) && item.schoolCode === String(schoolCode || "").toUpperCase()) || null;
}

export function availableNectaYears(examType, schoolCode) {
  return [...new Set(enabledNectaResults().filter((item) => item.examType === examType && (!schoolCode || item.schoolCode === schoolCode)).map((item) => item.year))].sort((a, b) => b - a);
}

export function candidateSchoolCode(value) {
  return (decodeURIComponent(String(value || "")).trim().toUpperCase().replace(/\s+/g, "").match(/^(S\d{4})[\/-]\d{4}$/) || [])[1] || "";
}

export function normalizeCandidateNumber(value, schoolCode) {
  const cleaned = decodeURIComponent(String(value || "")).trim().toUpperCase().replace(/\s+/g, "");
  if (!cleaned) return "";
  if (/^\d{4}$/.test(cleaned)) return `${schoolCode}/${cleaned}`;
  const hyphen = cleaned.match(/^([A-Z]\d{4})-(\d{4})$/);
  return hyphen ? `${hyphen[1]}/${hyphen[2]}` : cleaned;
}

export function candidateFacts(candidate) {
  const grades = {};
  for (const subject of candidate?.subjects || []) grades[subject.grade] = (grades[subject.grade] || 0) + 1;
  const passedSubjects = (candidate?.subjects || []).filter((item) => !["F", "S", "X"].includes(item.grade)).length;
  const gradeOrder = ["A", "B", "C", "D", "E", "F", "S", "X"];
  return { grades, totalSubjects: candidate?.subjects?.length || 0, passedSubjects, improvementSubjects: (candidate?.subjects?.length || 0) - passedSubjects, highestGrade: gradeOrder.find((grade) => grades[grade]) || "—" };
}
