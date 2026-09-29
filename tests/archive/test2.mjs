import puppeteer from 'puppeteer';

(async () => {
    try {
        console.log("Starting Chrome...");
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        
        page.on('console', msg => {
            console.log('LOG TYPE:', msg.type());
            console.log('LOG TEXT:', msg.text());
            msg.args().forEach(arg => console.log('  arg:', arg.toString()));
        });
        page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
        
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        
        // Let's also check if there's an ErrorBoundary div
        const bodyHtml = await page.evaluate(() => document.body.innerHTML);
        console.log("BODY HTML:", bodyHtml.substring(0, 500));
        
        await browser.close();
    } catch (err) {
        console.error('Puppeteer Script Error:', err);
    }
})();
