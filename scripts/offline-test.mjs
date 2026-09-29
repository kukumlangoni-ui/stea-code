// End-to-end offline test for STEA service worker.
// Proves: ONLINE visit → NETWORK OFF → refresh → cached /index.html (not /offline.html)
import puppeteer from 'puppeteer';
import { setTimeout as sleep } from 'timers/promises';

const URL = 'http://127.0.0.1:4321/';

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();

console.log('1. ONLINE first visit…');
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await sleep(3000);

await page.evaluate(async () => {
  if ('serviceWorker' in navigator) {
    await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
  }
});

console.log('2. Waiting for SW to activate…');
await page.waitForFunction(async () => {
  const reg = await navigator.serviceWorker.ready;
  return reg && reg.active;
}, { timeout: 15000 });

await page.evaluate(() => new Promise(resolve => {
  if (navigator.serviceWorker.controller) return resolve();
  navigator.serviceWorker.addEventListener('controllerchange', () => resolve());
}));

await sleep(1500);
console.log('   SW active:', await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL));

console.log('3. Online reload to populate cache…');
await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
await sleep(2000);

const shellCached = await page.evaluate(async () => {
  const cacheNames = await caches.keys();
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const match = await cache.match('/index.html');
    if (match) return { name, ok: true };
  }
  return { ok: false };
});
console.log('   /index.html in cache:', JSON.stringify(shellCached));

const client = await page.target().createCDPSession();
await client.send('Network.enable');
await client.send('Network.emulateNetworkConditions', {
  offline: true,
  latency: 0,
  downloadThroughput: 0,
  uploadThroughput: 0,
});
console.log('4. Network set OFFLINE');

console.log('5. Offline refresh…');
await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('   reload error:', e.message));
await sleep(2500);

const result = await page.evaluate(() => {
  const root = document.getElementById('root');
  const hasReactContent = root && root.hasChildNodes() && root.children.length > 0;
  const title = document.title;
  const bodyText = document.body.innerText.slice(0, 200);
  const isOfflinePage = bodyText.includes("You're offline") || bodyText.includes("You are offline");
  const isReactApp = hasReactContent && !isOfflinePage;
  return { title, isOfflinePage, isReactApp, hasReactContent, bodyPreview: bodyText };
});
console.log('   Result:', JSON.stringify(result, null, 2));

console.log('7. Offline SPA navigation to /websites…');
await page.goto(URL + 'websites', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('   goto error:', e.message));
await sleep(1500);
const websitesResult = await page.evaluate(() => {
  const root = document.getElementById('root');
  const hasReactContent = root && root.hasChildNodes() && root.children.length > 0;
  const bodyText = document.body.innerText.slice(0, 200);
  const isOfflinePage = bodyText.includes("You're offline");
  return { hasReactContent, isOfflinePage, bodyPreview: bodyText };
});
console.log('   /websites result:', JSON.stringify(websitesResult, null, 2));

await client.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
await browser.close();

console.log('');
console.log('=== TEST SUMMARY ===');
const passRoot = result.isReactApp && !result.isOfflinePage;
const passWebsites = websitesResult.hasReactContent && !websitesResult.isOfflinePage;
console.log('Root offline served cached React shell (not /offline.html):', passRoot ? 'PASS' : 'FAIL');
console.log('/websites offline served cached React shell:', passWebsites ? 'PASS' : 'FAIL');
console.log('Shell cached at install (PRECACHE /index.html):', shellCached.ok ? 'PASS' : 'FAIL');
