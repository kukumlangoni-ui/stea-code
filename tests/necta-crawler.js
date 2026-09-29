import axios from "axios";

async function testUrls() {
  const years = Array.from({ length: 2024 - 2005 + 1 }, (_, i) => 2005 + i);
  const school = "s0101";
  const schoolUpper = "S0101";
  
  for (const year of years) {
    const urls = [
      `https://maktaba.tetea.org/exam-results/CSEE${year}/${school}.htm`,
      `https://maktaba.tetea.org/exam-results/CSEE${year}/${schoolUpper}.htm`,
      `https://maktaba.tetea.org/exam-results/CSEE${year}/results/${school}.htm`,
      `https://maktaba.tetea.org/exam-results/CSEE${year}/results/${schoolUpper}.htm`,
      `https://maktaba.tetea.org/exam-results/CSEE2013/results/${schoolUpper}.htm`,
      `https://maktaba.tetea.org/exam-results/CSEE2013/results/${school}.htm`,
      `https://maktaba.tetea.org/exam-results/CSEE${year}/S0101.htm`,
      `https://maktaba.tetea.org/exam-results/CSEE${year}/s0101.htm`
    ];
    
    let found = false;
    for (const url of urls) {
      try {
        const res = await axios.get(url, { timeout: 5000 });
        if (res.status === 200) {
          console.log(`[${year}] SUCCESS: ${url}`);
          found = true;
          break;
        }
      } catch {
        // ignore
      }
    }
    if (!found) {
      console.log(`[${year}] FAILED all URLs`);
    }
  }
}

testUrls();
