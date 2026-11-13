const { chromium } = require('playwright');
(async () => {
  const br = await chromium.launch();
  for (const w of [320, 390, 768, 1024, 1440]) {
    const pg = await br.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: w === 390 ? 2 : 1 }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
    await pg.goto('file://'+require('path').resolve(__dirname,'../dist/preview.html')+''); await pg.waitForTimeout(500);
    await pg.click('[data-mcon][data-contract="b2b"]'); await pg.selectOption('#pl-f-mAd', '2'); await pg.fill('#pl-f-mInc2', '6000'); await pg.fill('#pl-f-mOwn', '2500000'); await pg.waitForTimeout(150);
    const tool = pg.locator('#pl-bank .pl-tool').first(); await tool.scrollIntoViewIfNeeded(); await pg.waitForTimeout(300);
    const r = await pg.evaluate(() => { const W = innerWidth; return { doc: document.documentElement.scrollWidth, wide: [...document.querySelectorAll('#pl-bank .pl-tool *')].filter(e => e.getClientRects().length && e.getBoundingClientRect().right > W + 1).map(e => (e.className || e.tagName) + ':' + (e.textContent || '').slice(0, 20)).slice(0, 5), nums: [...document.querySelectorAll('#pl-bank .pl-out-wide .v')].map(v => v.textContent + '@' + getComputedStyle(v).fontSize), m2: !document.querySelector('[data-m2]').hidden }; });
    console.log(w, JSON.stringify(r), errs);
    if (w === 390) { await pg.evaluate(() => { const b = document.querySelector('.pl-bar'); if (b) b.style.position = 'static'; }); await tool.screenshot({ path: require('path').resolve(__dirname,'../dist/mort2_phone.png') }); }
    await pg.close();
  }
  await br.close();
})();
