import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import http from 'http';

// Wait for a URL to be reachable
function waitForURL(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      http.get(url, (res) => {
        if (res.statusCode === 200) {
          clearInterval(interval);
          resolve();
        }
      }).on('error', () => {
        if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject(new Error(`Timeout waiting for ${url}`));
        }
      });
    }, 500);
  });
}

(async () => {
  console.log("Starting dev server...");
  const server = spawn('npm', ['run', 'dev'], { stdio: 'pipe' });
  
  try {
    await waitForURL('http://localhost:5173');
    console.log("Server is up. Launching browser...");
    const browser = await puppeteer.launch({ headless: 'new' });
    
    async function testRoute(slug) {
      console.log(`\nTesting /site/${slug}...`);
      const page = await browser.newPage();
      
      let errorFired = false;
      page.on('pageerror', err => {
        console.error(`Page error on ${slug}:`, err);
        errorFired = true;
      });
      
      await page.goto(`http://localhost:5173/site/${slug}`, { waitUntil: 'networkidle2' });
      const text = await page.evaluate(() => document.body.innerText);
      
      if (text.includes('Something went wrong')) {
        console.error(`FAIL: ${slug} hit Error Boundary.`);
        errorFired = true;
      }
      
      if (!errorFired) {
        console.log(`PASS: ${slug} rendered successfully without crashing.`);
      }
      await page.close();
    }
    
    await testRoute('internet-canva');
    await testRoute('internet-instagram');
    await testRoute('github');
    await testRoute('vercel');
    
    await browser.close();
  } catch (e) {
    console.error("Test failed:", e);
  } finally {
    server.kill();
    process.exit(0);
  }
})();
