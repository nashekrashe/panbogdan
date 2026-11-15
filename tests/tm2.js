const { chromium } = require('playwright');
(async () => {
  const br = await chromium.launch();
  for (const w of [320, 390, 768, 1024]) {
    const pg = await br.newPage({ viewport: { width: w, height: 800 } });
    await pg.goto('file://'+require('path').resolve(__dirname,'../dist/preview.html')+''); await pg.waitForTimeout(400);
    await pg.fill('#pl-f-mInc', '25000'); await pg.fill('#pl-f-mOwn', '1500000'); await pg.waitForTimeout(150);
    await pg.locator('#pl-home .pl-tool').first().scrollIntoViewIfNeeded(); await pg.waitForTimeout(300);
    const r = await pg.evaluate(() => [...document.querySelectorAll('#pl-home .pl-out-wide .v')].map(v => { const c = v.parentNode.getBoundingClientRect(), b = v.getBoundingClientRect(); return v.textContent + ' fs ' + getComputedStyle(v).fontSize + ' fits ' + (b.right <= c.right + 1); }));
    console.log(w, r.join(' | '), '| doc', await pg.evaluate(() => document.documentElement.scrollWidth));
    if (w === 390) await pg.locator('#pl-home .pl-out-wide').screenshot({ path: require('path').resolve(__dirname,'../dist/mort_out390.png') });
    await pg.close();
  }
  await br.close();
})();
