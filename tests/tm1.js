const { chromium, devices } = require('playwright');
(async () => {
  const br = await chromium.launch();
  for (const [name, opt] of [['desk', { viewport: { width: 1440, height: 900 } }], ['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true }]]) {
    const pg = await br.newPage(opt); const errs = []; pg.on('pageerror', e => errs.push(e.message));
    await pg.goto('file://'+require('path').resolve(__dirname,'../dist/preview.html')+''); await pg.waitForTimeout(600);
    const rd = () => pg.evaluate(() => { const o = n => (document.querySelector('[data-o="' + n + '"]') || {}).textContent; return { loan: o('mLoan'), loanD: o('mLoanD'), price: o('mPrice'), priceD: o('mPriceD'), payK: o('mPayK'), pay: o('mPay'), sK: o('mStressK'), s: o('mStress'), live: o('mLive'), dsti: o('mDsti'), note: o('mNote'), ph: document.querySelector('#pl-f-mInc').placeholder, net: o('net') }; });
    console.log(name, 'default (Бабки fallback):', JSON.stringify(await rd()));
    await pg.fill('#pl-f-mInc', '10000'); await pg.fill('#pl-f-mOwn', '200000'); await pg.waitForTimeout(100);
    console.log(name, '10k, own 200k:', JSON.stringify(await rd()));
    await pg.selectOption('#pl-f-mYears', '35'); await pg.fill('#pl-f-mLim', '10000'); await pg.selectOption('#pl-f-mKids', '1'); await pg.waitForTimeout(100);
    console.log(name, '35y, lim 10k, 1 kid:', JSON.stringify(await rd()));
    await pg.fill('#pl-f-mOwn', '0'); await pg.waitForTimeout(100); console.log(name, 'own 0:', JSON.stringify(await rd()));
    await pg.fill('#pl-f-mOwn', '200000'); await pg.selectOption('#pl-f-mYears', '25'); await pg.fill('#pl-f-mLim', '0'); await pg.selectOption('#pl-f-mKids', '0');
    const tool = pg.locator('#pl-home .pl-tool').first(); await tool.scrollIntoViewIfNeeded(); await pg.waitForTimeout(900);
    const ov = await pg.evaluate(() => ({ docW: document.documentElement.scrollWidth, winW: innerWidth, wide: [...document.querySelectorAll('#pl-home .pl-tool *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).map(e => e.className || e.tagName).slice(0, 5) }));
    console.log(name, 'overflow', JSON.stringify(ov), 'errors', errs);
    await tool.screenshot({ path: '../mort_' + name + '.png' });
    // persistence
    await pg.reload(); await pg.waitForTimeout(500); console.log(name, 'after reload income field:', await pg.inputValue('#pl-f-mInc'));
    await pg.close();
  }
  await br.close();
})();
