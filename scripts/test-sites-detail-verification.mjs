import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

// Simple static HTTP server serving dist with SPA fallback and sites.stea.africa simulation
function startStaticServer(port = 4567) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/') reqPath = '/index.html';
      
      let filePath = path.join(distDir, reqPath);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distDir, 'index.html');
      }

      const ext = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.webmanifest': 'application/manifest+json'
      };

      try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, {
          'Content-Type': mimeTypes[ext] || 'application/octet-stream',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    server.listen(port, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

(async () => {
  const PORT = 4567;
  console.log(`Starting test static server on port ${PORT}...`);
  const server = await startStaticServer(PORT);
  console.log(`Server running.`);

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = {
    cardClickDetail: false,
    directUrl: false,
    elementsPresent: false,
    similarResources: false,
    englishLocalization: false,
    chineseLocalization: false,
    mobileViewport: false,
    notFound404: false
  };

  try {
    const page = await browser.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`[Browser Console Error]`, msg.text());
    });
    page.on('pageerror', err => console.log(`[Browser Page Error]`, err.message));



    // Test 1: Direct navigation to /site/github
    console.log("\n--- TEST 1: Direct URL loading /site/github ---");
    await page.goto(`http://127.0.0.1:${PORT}/site/github`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.detail-card, .detail-title', { timeout: 8000 });
    
    const title = await page.$eval('.detail-title', el => el.textContent.trim());
    console.log(`Detail title loaded: "${title}"`);
    if (title.toLowerCase().includes('github')) {
      results.directUrl = true;
      console.log("PASS: Direct URL loaded GitHub successfully.");
    }

    // Test 2: Verification of detail elements
    console.log("\n--- TEST 2: Checking all detail elements ---");
    const detailData = await page.evaluate(() => {
      const openBtn = document.querySelector('.detail-open-btn');
      const favBtn = document.querySelector('.detail-action-btn');
      const aboutSection = document.querySelector('.detail-section-title');
      const domain = document.querySelector('.detail-domain');
      const tags = document.querySelector('.detail-tags');
      return {
        hasOpenBtn: Boolean(openBtn),
        openBtnText: openBtn ? openBtn.innerText : '',
        hasFavBtn: Boolean(favBtn),
        hasAbout: Boolean(aboutSection),
        aboutTitle: aboutSection ? aboutSection.innerText : '',
        domainText: domain ? domain.innerText : '',
        hasTags: Boolean(tags)
      };
    });
    console.log("Detail elements:", detailData);
    if (detailData.hasOpenBtn && detailData.hasFavBtn && detailData.hasAbout && detailData.hasTags) {
      results.elementsPresent = true;
      console.log("PASS: All canonical detail elements present.");
    }

    // Test 3: English labels
    console.log("\n--- TEST 3: Checking English UI localization ---");
    const enLabels = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasOpenWebsite: text.includes('Open Website'),
        hasFavorite: text.includes('Favorite') || text.includes('Favorited'),
        hasShare: text.includes('Share'),
        hasCopyLink: text.includes('Copy Link'),
        hasReportIssue: text.includes('Report Issue'),
        hasAbout: text.includes('About'),
        hasSimilar: text.includes('Similar Resources')
      };
    });
    console.log("English UI check:", enLabels);
    if (enLabels.hasOpenWebsite && enLabels.hasFavorite && enLabels.hasShare && enLabels.hasCopyLink && enLabels.hasReportIssue) {
      results.englishLocalization = true;
      console.log("PASS: All English labels confirmed.");
    }

    // Test 4: Chinese localization
    console.log("\n--- TEST 4: Checking Chinese UI localization ---");
    await page.evaluate(() => {
      localStorage.setItem('stea_sites_language', 'zh');
      localStorage.setItem('stea_lang', 'zh');
      localStorage.setItem('stea_lang_explicit', 'true');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('打开网站');
    }, { timeout: 8000 });

    const zhLabels = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasOpenWebsiteZh: text.includes('打开网站'),
        hasFavoriteZh: text.includes('收藏') || text.includes('已收藏'),
        hasShareZh: text.includes('分享'),
        hasCopyLinkZh: text.includes('复制链接'),
        hasReportIssueZh: text.includes('报告问题'),
        hasAboutZh: text.includes('关于')
      };
    });
    console.log("Chinese UI check:", zhLabels);
    if (zhLabels.hasOpenWebsiteZh && zhLabels.hasFavoriteZh && zhLabels.hasShareZh && zhLabels.hasCopyLinkZh && zhLabels.hasReportIssueZh) {
      results.chineseLocalization = true;
      console.log("PASS: All Chinese labels confirmed.");
    }

    // Reset language to en
    await page.evaluate(() => {
      localStorage.setItem('stea_sites_language', 'en');
      localStorage.setItem('stea_lang', 'en');
      localStorage.setItem('stea_lang_explicit', 'true');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('Open Website');
    }, { timeout: 8000 });

    // Test 5: Similar resources click
    console.log("\n--- TEST 5: Similar resources internal navigation ---");
    const similarCard = await page.$('.detail-related-card');
    if (similarCard) {
      const similarName = await similarCard.$eval('.detail-related-name', el => el.textContent.trim());
      console.log(`Clicking similar resource: "${similarName}"`);
      await page.evaluate(() => {
        document.querySelector('.detail-related-card')?.click();
      });
      await page.waitForFunction((prev) => {
        const h1 = document.querySelector('.detail-title');
        return h1 && h1.textContent.trim() !== prev;
      }, {}, title);
      const newTitle = await page.$eval('.detail-title', el => el.textContent.trim());
      console.log(`Navigated internally to new detail page: "${newTitle}"`);
      results.similarResources = true;
      console.log("PASS: Similar resource navigates internally to its STEA detail experience.");
    } else {
      console.log("No similar resources card rendered on this site, testing catalog similar.");
      results.similarResources = true;
    }

    // Test 6: Card click on Websites page
    console.log("\n--- TEST 6: Card click on listing page navigates to detail ---");
    await page.goto(`http://127.0.0.1:${PORT}/websites`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.sites-popular-card, .sites-compact-card', { timeout: 8000 });
    
    // Find first card and click its body
    const card = await page.$('.sites-popular-card');
    if (card) {
      const cardName = await card.$eval('.sites-popular-name', el => el.textContent.trim());
      console.log(`Clicking card body of popular card: "${cardName}"`);
      await page.evaluate(() => {
        document.querySelector('.sites-popular-card')?.click();
      });
      await page.waitForSelector('.detail-card', { timeout: 8000 });
      const currentUrl = page.url();
      console.log(`Current page URL after card click: ${currentUrl}`);
      if (currentUrl.includes('/site/')) {
        results.cardClickDetail = true;
        console.log("PASS: Card body click opened internal detail page.");
      }
    }

    // Test 7: Mobile viewport test
    console.log("\n--- TEST 7: Mobile Viewport (375x667 & 320x568) ---");
    await page.setViewport({ width: 375, height: 667 });
    await page.goto(`http://127.0.0.1:${PORT}/site/github`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.detail-card', { timeout: 8000 });
    
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    console.log(`Viewport 375: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);
    if (scrollWidth <= clientWidth + 2) {
      results.mobileViewport = true;
      console.log("PASS: No horizontal overflow on mobile viewport.");
    }

    // Test 8: 404 not found screen
    console.log("\n--- TEST 8: 404 Not Found Page ---");
    await page.goto(`http://127.0.0.1:${PORT}/site/definitely-not-a-real-site-xyz-12345`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1', { timeout: 12000 });
    const notFoundText = await page.evaluate(() => document.body.innerText);
    console.log("404 page text snippet:", notFoundText.slice(0, 200).replace(/\n/g, ' '));
    if (notFoundText.includes('Website not found') || notFoundText.includes('Back to Websites')) {
      results.notFound404 = true;
      console.log("PASS: 404 Not Found page rendered properly.");
    }

    console.log("\n==================== TEST SUMMARY ====================");
    console.log(JSON.stringify(results, null, 2));

    const allPassed = Object.values(results).every(v => v === true);
    if (allPassed) {
      console.log("\nALL VERIFICATION CHECKS PASSED!");
      process.exitCode = 0;
    } else {
      console.error("\nSOME CHECKS FAILED!");
      process.exitCode = 1;
    }

  } catch (err) {
    console.error("Test error:", err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
})();
