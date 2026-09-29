import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        
        page.on('console', msg => {
            if (msg.type() === 'error') console.log('ERROR LOG:', msg.text());
        });
        page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
        
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        
        const overlayText = await page.evaluate(() => {
            const overlay = document.querySelector('vite-error-overlay');
            if (overlay && overlay.shadowRoot) {
                return overlay.shadowRoot.innerHTML;
            }
            return 'No overlay';
        });
        
        console.log("OVERLAY HTML:", overlayText.substring(0, 500));
        
        const bodyHtml = await page.evaluate(() => document.body.innerText);
        console.log("BODY HTML:", bodyHtml.substring(0, 500));
        
        await browser.close();
    } catch (err) {
        console.error('Puppeteer Script Error:', err);
    }
})();
