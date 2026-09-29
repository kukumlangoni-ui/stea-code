import puppeteer from 'puppeteer';

(async () => {
    try {
        console.log("Starting Chrome...");
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
        
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        
        const errorHtml = await page.evaluate(() => {
          const bb = document.body;
          return bb.innerText;
        });
        console.log('TEXT CONTENT:', errorHtml);
        
        await browser.close();
    } catch (err) {
        console.error('Puppeteer Script Error:', err);
    }
})();
