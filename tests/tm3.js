const { chromium } = require('playwright');
(async () => {
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://'+require('path').resolve(__dirname,'../dist/preview.html')+''); await pg.waitForTimeout(600);
  const O = ['mSrc','mLoan','mLoanD','mPrice','mPriceD','mPayK','mPay','mLifeP','mProp','mTot','mBridge','mStressK','mStress','mLive','mDsti','mDownK','mDown','mPccK','mPcc','mNot','mCourt','mVal','mNeed','mNote','mCon'];
  const rd = async (t) => { const r = await pg.evaluate(O => Object.fromEntries(O.map(n => [n, (document.querySelector('[data-o="' + n + '"]') || {}).textContent])), O); console.log('\n### ' + t); for (const k of O) console.log(k.padEnd(9), r[k]); };
  await rd('default'); await pg.fill('#pl-f-mOwn','100000'); await pg.waitForTimeout(80); console.log('own 100k priceD:', await pg.textContent('[data-o="mPriceD"]'), await pg.textContent('[data-o="mDownK"]')); await pg.fill('#pl-f-mOwn','150000');
  await pg.fill('#pl-f-mInc', '10000'); await pg.fill('#pl-f-mOwn', '200000'); await pg.waitForTimeout(100); await rd('10k own 200k');
  await pg.check('[data-f="mFirst"]'); await pg.selectOption('#pl-f-mLtv', '90'); await pg.waitForTimeout(100); await rd('first home, 10%');
  await pg.fill('#pl-f-mInc', ''); await pg.click('[data-mcon][data-contract="b2b"]'); await pg.waitForTimeout(150); await rd('b2b from Бабки (default rycz 12%)');
  console.log('babki tab selected:', await pg.getAttribute('#pl-ct-b2b', 'aria-selected'), '| mcon pressed:', await pg.getAttribute('[data-mcon][data-contract="b2b"]', 'aria-pressed'));
  // clearing inputs
  await pg.fill('#pl-f-mRate', ''); await pg.waitForTimeout(80);
  const during = await pg.evaluate(() => ({ v: document.querySelector('#pl-f-mRate').value, ph: document.querySelector('#pl-f-mRate').placeholder, k: document.querySelector('[data-o="mPayK"]').textContent }));
  await pg.locator('#pl-f-mRate').blur(); await pg.waitForTimeout(80);
  const after = await pg.evaluate(() => document.querySelector('#pl-f-mRate').value);
  await pg.fill('#pl-f-rev', ''); await pg.waitForTimeout(80); const revDuring = await pg.evaluate(() => [document.querySelector('#pl-f-rev').value, document.querySelector('[data-o="mSrc"]').textContent]); await pg.locator('#pl-f-rev').blur(); await pg.waitForTimeout(80); console.log('\nrev cleared, during:', JSON.stringify(revDuring), 'after blur:', await pg.inputValue('#pl-f-rev'));
  await pg.click('[data-mcon][data-contract="uop"]'); await pg.fill('#pl-f-brutto', ''); await pg.locator('#pl-f-brutto').blur(); await pg.waitForTimeout(80); console.log('brutto after clear+blur:', await pg.inputValue('#pl-f-brutto'));
  await pg.fill('#pl-f-mInc', '9000'); await pg.fill('#pl-f-mInc', ''); await pg.locator('#pl-f-mInc').blur(); await pg.waitForTimeout(80); console.log('mInc after clear:', JSON.stringify(await pg.inputValue('#pl-f-mInc')), 'placeholder', await pg.getAttribute('#pl-f-mInc','placeholder'), '| src', await pg.textContent('[data-o="mSrc"]'));
  await pg.fill('#pl-f-price', '7.10'); await pg.fill('#pl-f-price', ''); await pg.locator('#pl-f-price').blur(); await pg.waitForTimeout(80);
  const pr = await pg.evaluate(() => ({ v: document.querySelector('#pl-f-price').value, note: document.querySelector('[data-o="priceNote"]').textContent }));
  console.log('\nclear rate: during', JSON.stringify(during), '| after blur', after, '| price', JSON.stringify(pr));
  const st = await pg.evaluate(() => JSON.parse(localStorage.getItem('pb-poland-v2')).f);
  console.log('stored rate', st.mRate, 'price', st.price, 'priceManual', st.priceManual, 'mInc', JSON.stringify(st.mInc));
  console.log('errors', errs);
  await pg.locator('#pl-home .pl-tool').first().screenshot({ path: require('path').resolve(__dirname,'../dist/mort2_desk.png') });
  await br.close();
})();
