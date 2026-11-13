// cross-check costs and payments by hand for one case
const { chromium } = require('playwright');
(async () => {
  const br = await chromium.launch(); const pg = await br.newPage({ viewport: { width: 1200, height: 900 } });
  await pg.goto('file://'+require('path').resolve(__dirname,'../dist/preview.html')+''); await pg.waitForTimeout(500);
  await pg.fill('#pl-f-mInc', '12000'); await pg.fill('#pl-f-mOwn', '250000'); await pg.waitForTimeout(100);
  const g = n => pg.textContent('[data-o="' + n + '"]');
  const P = +(await g('mPrice')).replace(/\D/g, ''), L = +(await g('mPayK')).match(/Кредит ([\d\s ]+) zł/)[1].replace(/\D/g, '');
  const T = v => v <= 1e6 ? 1010 + (v - 60000) * 0.004 : 4770 + (v - 1e6) * 0.002;
  const exp = { pcc: P * 0.02, not: (T(P) / 2 + T(L) / 4) * 1.23, life: L * 0.00035, prop: P * 0.00085 / 12, pay: (() => { const r = 5.95 / 1200, n = 300; return L * r / (1 - Math.pow(1 + r, -n)); })() };
  console.log({ P, L, ltv: (L / P).toFixed(3), shown: { pcc: await g('mPcc'), not: await g('mNot'), life: await g('mLifeP'), prop: await g('mProp'), pay: await g('mPay'), need: await g('mNeed') }, exp: Object.fromEntries(Object.entries(exp).map(([k, v]) => [k, v.toFixed(2)])), sumNeed: (P - L + exp.pcc + exp.not + 400 + 700).toFixed(0) });
  await br.close();
})();
