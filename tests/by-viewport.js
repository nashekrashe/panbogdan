// Responsive browser smoke checks for /bialorusini on 320–1440px.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const url = process.argv[2] || 'http://127.0.0.1:8765/bialorusini.html';
(async () => {
  const br = await chromium.launch({ headless:true });
  try {
    fs.mkdirSync(path.resolve(__dirname, '../dist/by-screenshots'), { recursive:true });
    for (const width of [320, 375, 768, 1024, 1440]) {
      const page = await br.newPage({ viewport:{width,height:900}, deviceScaleFactor:1 });
      const errors = [], consoleErrors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
      await page.goto(url, { waitUntil:'domcontentloaded' });
      // Local http.server serves /bialorusini.html; Pages rewrites /bialorusini to it.
      // Recreate the production pathname before asking the SPA to route.
      await page.evaluate(() => {
        history.replaceState(null, '', '/bialorusini');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await page.waitForSelector('#pl-by .pb-col', { state:'visible' });
      await page.waitForTimeout(250);
      const r = await page.evaluate(() => ({
        win:innerWidth, doc:document.documentElement.scrollWidth,
        count:document.querySelectorAll('#pl-by .pb-col').length,
        groups:document.querySelectorAll('#pl-by .pb-by-group').length,
        visible:!document.querySelector('#pl-by').hidden
      }));
      await page.screenshot({ path:path.resolve(__dirname, '../dist/by-screenshots/by-' + width + '.png'), fullPage:true });
      console.log(width, JSON.stringify(r), 'pageerrors:', errors, 'consoleErrors:', consoleErrors);
      if (r.doc > r.win + 1) throw new Error('horizontal overflow: ' + width + ' ('+r.doc+')');
      if (r.count !== 12 || r.groups !== 4 || !r.visible) throw new Error('wrong content at '+width);
      if (errors.length) throw new Error('JS errors at '+width+': '+errors.join('; '));
      await page.close();
    }
    console.log('Responsive Belarus PASS');
  } finally { await br.close(); }
})().catch(e => { console.error(e); process.exit(1); });
