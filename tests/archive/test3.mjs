import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        
        await page.goto('http://localhost:3000', { waitUntil: 'load' });
        
        const overlayText = await page.evaluate(() => {
            const overlay = document.querySelector('vite-error-overlay');
            if (overlay && overlay.shadowRoot) {
                return overlay.shadowRoot.innerHTML;
            }
            return 'No overlay or no shadow root';
        });
        
        console.log("OVERLAY HTML:", overlayText);
        
        await browser.close();
    } catch (err) {
        console.error('Puppeteer Script Error:', err);
    }
})();
