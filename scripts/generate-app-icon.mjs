import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A0B10"/>
      <stop offset="100%" stop-color="#1a1a20"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="48%" r="55%">
      <stop offset="0%" stop-color="rgba(212,175,55,0.20)"/>
      <stop offset="100%" stop-color="rgba(212,175,55,0)"/>
    </radialGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F5D76E"/>
      <stop offset="50%" stop-color="#D4AF37"/>
      <stop offset="100%" stop-color="#B8860B"/>
    </linearGradient>
  </defs>

  <rect width="1024" height="1024" rx="230" fill="url(#bg)"/>
  <rect width="1024" height="1024" rx="230" fill="url(#glow)"/>

  <g transform="translate(102, 102)">
    <svg width="820" height="820" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="92" stroke="url(#goldGrad)" stroke-width="4" fill="none"/>
      <ellipse cx="100" cy="100" rx="60" ry="92" stroke="url(#goldGrad)" stroke-width="2.6" fill="none" opacity="0.9"/>
      <ellipse cx="100" cy="100" rx="30" ry="92" stroke="url(#goldGrad)" stroke-width="2.4" fill="none" opacity="0.85"/>
      <line x1="8" y1="100" x2="192" y2="100" stroke="url(#goldGrad)" stroke-width="2.6"/>
      <path d="M 30 60 Q 100 50 170 60" stroke="url(#goldGrad)" stroke-width="2.4" fill="none" opacity="0.85"/>
      <path d="M 30 140 Q 100 150 170 140" stroke="url(#goldGrad)" stroke-width="2.4" fill="none" opacity="0.85"/>
      <path d="M 20 80 Q 100 72 180 80" stroke="url(#goldGrad)" stroke-width="2" fill="none" opacity="0.7"/>
      <path d="M 20 120 Q 100 128 180 120" stroke="url(#goldGrad)" stroke-width="2" fill="none" opacity="0.7"/>
      <rect x="24" y="88" width="118" height="24" rx="12" fill="#0A0B10" stroke="url(#goldGrad)" stroke-width="2"/>
      <text x="83" y="105" text-anchor="middle" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="14" font-weight="900" fill="#FFFFFF" letter-spacing="1.5">WWW</text>
      <circle cx="148" cy="100" r="17" fill="#0A0B10" stroke="url(#goldGrad)" stroke-width="3"/>
      <circle cx="148" cy="100" r="9" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.95"/>
      <circle cx="144" cy="95" r="2.5" fill="#FFFFFF" opacity="0.9"/>
      <line x1="160" y1="112" x2="174" y2="126" stroke="url(#goldGrad)" stroke-width="4.5" stroke-linecap="round"/>
    </svg>
  </g>
</svg>`;

async function run() {
  const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 1024, deviceScaleFactor: 1 });
  
  const html = `<!DOCTYPE html>
  <html>
  <head>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: transparent; overflow: hidden; width: 1024px; height: 1024px; }
    </style>
  </head>
  <body>
    ${svgContent}
  </body>
  </html>`;

  await page.setContent(html);
  const outputPath = path.resolve(__dirname, '../public/stea-app-icon-final.png');
  await page.screenshot({ path: outputPath, omitBackground: true, clip: { x: 0, y: 0, width: 1024, height: 1024 } });

  console.log('Saved master icon to:', outputPath);
  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
