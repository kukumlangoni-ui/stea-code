import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.resolve(projectRoot, 'public');
const iconsDir = path.resolve(publicDir, 'icons');
const sitesIconsDir = path.resolve(publicDir, 'sites-icons');
const brandingDir = path.resolve(publicDir, 'branding');

// Ensure directories exist
fs.mkdirSync(iconsDir, { recursive: true });
fs.mkdirSync(sitesIconsDir, { recursive: true });
fs.mkdirSync(brandingDir, { recursive: true });

// Canonical SVG sources — single source of truth for the Master STEA PWA identity.
// Edit the artwork in these files, then re-run this script to regenerate all PNGs.
const masterSvgPath = path.resolve(brandingDir, 'stea-master-icon.svg');
const maskableSvgPath = path.resolve(brandingDir, 'stea-master-icon-maskable.svg');

const masterSvg = fs.readFileSync(masterSvgPath, 'utf8');
const maskableSvg = fs.readFileSync(maskableSvgPath, 'utf8');

async function generate() {
  console.log('🚀 Starting STEA Apple-Grade PWA Icon Generator...');
  const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 1024, deviceScaleFactor: 1 });

  // 1. Render Master Standard Icon
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;">${masterSvg}</body></html>`);
  const masterPath = path.resolve(publicDir, 'stea-app-icon-final.png');
  await page.screenshot({ path: masterPath, omitBackground: true });
  console.log('✓ Master 1024x1024 generated at:', masterPath);

  // 2. Render Master Maskable Icon
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;">${maskableSvg}</body></html>`);
  const maskableMasterPath = path.resolve(publicDir, 'stea-maskable-master.png');
  await page.screenshot({ path: maskableMasterPath, omitBackground: false });
  console.log('✓ Maskable Master 1024x1024 generated at:', maskableMasterPath);

  await browser.close();

  // 3. Generate all required PWA icon sizes via macOS sips
  const standardSizes = [512, 384, 256, 192, 180, 152, 144, 128, 96, 72, 48, 32, 16];
  
  console.log('Generating standard sizes from master...');
  for (const size of standardSizes) {
    // Save to public/icons/
    const outIcon = path.resolve(iconsDir, `icon-${size}x${size}.png`);
    execSync(`sips -Z ${size} "${masterPath}" --out "${outIcon}" 2>/dev/null`);

    // Standard naming in public/icons/ and public/sites-icons/
    if (size === 180) {
      execSync(`sips -Z 180 "${masterPath}" --out "${path.resolve(publicDir, 'apple-touch-icon.png')}" 2>/dev/null`);
      execSync(`sips -Z 180 "${masterPath}" --out "${path.resolve(sitesIconsDir, 'apple-touch-icon.png')}" 2>/dev/null`);
    }
    if (size === 192) {
      // Canonical PWA 192 + sites-icons copy (used by SitesAdminLayout/Login).
      execSync(`sips -Z 192 "${masterPath}" --out "${path.resolve(sitesIconsDir, 'pwa-192x192.png')}" 2>/dev/null`);
      execSync(`sips -Z 192 "${maskableMasterPath}" --out "${path.resolve(iconsDir, 'maskable-192x192.png')}" 2>/dev/null`);
    }
    if (size === 512) {
      // Canonical PWA 512 + sites-icons copy + page-logo source.
      execSync(`sips -Z 512 "${masterPath}" --out "${path.resolve(sitesIconsDir, 'pwa-512x512.png')}" 2>/dev/null`);
      execSync(`sips -Z 512 "${maskableMasterPath}" --out "${path.resolve(iconsDir, 'maskable-512x512.png')}" 2>/dev/null`);
      execSync(`sips -Z 512 "${masterPath}" --out "${path.resolve(publicDir, 'stea-www-globe.png')}" 2>/dev/null`);
    }
    if (size === 32) {
      execSync(`sips -Z 32 "${masterPath}" --out "${path.resolve(publicDir, 'favicon-32x32.png')}" 2>/dev/null`);
      execSync(`sips -Z 32 "${masterPath}" --out "${path.resolve(sitesIconsDir, 'favicon-32x32.png')}" 2>/dev/null`);
    }
    if (size === 16) {
      execSync(`sips -Z 16 "${masterPath}" --out "${path.resolve(publicDir, 'favicon-16x16.png')}" 2>/dev/null`);
      execSync(`sips -Z 16 "${masterPath}" --out "${path.resolve(sitesIconsDir, 'favicon-16x16.png')}" 2>/dev/null`);
    }
  }

  // Favicon.ico
  execSync(`sips -Z 48 "${masterPath}" --out "${path.resolve(publicDir, 'favicon.ico')}" 2>/dev/null`);

  // Vector SVG Favicon
  fs.writeFileSync(path.resolve(publicDir, 'favicon.svg'), masterSvg);
  fs.writeFileSync(path.resolve(iconsDir, 'icon.svg'), masterSvg);

  console.log('✅ All PWA and Favicon assets generated successfully!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
