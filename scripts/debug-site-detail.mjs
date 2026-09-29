import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

const server = spawn('npm', ['run', 'dev'], { stdio: 'pipe' });
let serverStarted = false;

server.stdout.on('data', (data) => {
  if (data.toString().includes('Local:')) {
    serverStarted = true;
  }
});

async function runTest() {
  // Wait for server to start
  while (!serverStarted) {
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log("Server started, launching puppeteer...");
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('pageerror', error => {
    console.error('PAGE ERROR CAUGHT:', error);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('CONSOLE ERROR CAUGHT:', msg.text());
    }
  });

  try {
    await page.goto('http://localhost:5173/site/internet-canva', { waitUntil: 'networkidle0' });
    console.log("Page loaded. Checking for error boundary...");
    
    // Check if there is an error boundary message
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes('Something went wrong')) {
      console.error("PAGE SHOWS ERROR BOUNDARY: Something went wrong");
    }
  } catch (e) {
    console.error("TEST SCRIPT EXCEPTION:", e);
  } finally {
    await browser.close();
    server.kill();
    process.exit(0);
  }
}

runTest();
