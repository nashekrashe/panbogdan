// Browser smoke test for Banks, 320–1440px, including a deterministic NBP reply.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const url = process.argv[2] || 'http://127.0.0.1:8765/banki.html';
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const folder = path.resolve(__dirname, '../dist/banks-screenshots');
    fs.mkdirSync(folder,{recursive:true});
    for (const width of [320,375,768,1024,1440]) {
      const page = await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
      const errors=[];
      page.on('pageerror', e => errors.push(e.message));
      await page.route('https://api.nbp.pl/**', route => route.fulfill({
        status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},
        body:JSON.stringify({table:'A',code:'USD',rates:[{effectiveDate:'2026-11-20',mid:3.9876}]})
      }));
      await page.goto(url,{waitUntil:'domcontentloaded'});
      await page.evaluate(() => {history.replaceState(null,'','/banki');window.dispatchEvent(new PopStateEvent('popstate'));});
      await page.waitForSelector('#pl-bank .pb-bank-extra',{state:'visible'});
      await page.waitForFunction(() => document.querySelector('#pl-bank [data-o="usdRate"]').textContent === '3,9876');
      const result=await page.evaluate(() => {
        const bank=document.querySelector('#pl-bank'), note=bank.querySelector('.pl-head .pl-small'),
          mortgage=bank.querySelector('.pb-bank-info a[href="/dom"]'),
          quote=bank.querySelector('[data-o="usdRate"]');
        return {win:innerWidth,doc:document.documentElement.scrollWidth,
          subtitlePx:parseFloat(getComputedStyle(note).fontSize),
          quote:quote.textContent, href: mortgage && mortgage.getAttribute('href'),
          visible:!bank.hidden};
      });
      await page.screenshot({path:path.join(folder,'banki-'+width+'.png'),fullPage:true});
      console.log(width,result,'errors:',errors);
      if (result.doc>result.win+1) throw Error('horizontal overflow at '+width);
      if (result.subtitlePx !== 12 || result.href !== '/dom' || result.quote !== '3,9876' || !result.visible) throw Error('bank content or styles at '+width);
      if (errors.length) throw Error('page JS errors at '+width+': '+errors.join('; '));
      await page.close();
    }
    console.log('Responsive Banks PASS');
  } finally {await browser.close();}
})().catch(err=>{console.error(err);process.exit(1);});
