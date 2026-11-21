// Banks and Money responsive smoke test, 320–1440px, deterministic NBP quote.
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
const url=process.argv[2]||'http://127.0.0.1:8765/banki.html';
(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const folder=path.resolve(__dirname,'../dist/banks-screenshots');
    fs.mkdirSync(folder,{recursive:true});
    for(const width of [320,375,768,1024,1440]){
      const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.route('https://api.nbp.pl/**',route=>route.fulfill({
        status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},
        body:JSON.stringify({table:'A',code:'USD',rates:[{effectiveDate:'2026-11-20',mid:3.9876}]})
      }));
      await page.goto(url,{waitUntil:'domcontentloaded'});
      await page.evaluate(()=>{history.replaceState(null,'','/banki');window.dispatchEvent(new PopStateEvent('popstate'));});
      await page.locator('#pl-bank .pb-bank-account-head').waitFor({state:'visible'});
      await page.waitForFunction(()=>document.querySelector('#pl-money [data-o="usdRate"]')?.textContent==='3,9876');
      const result=await page.evaluate(()=>{
        const bank=document.querySelector('#pl-bank'),money=document.querySelector('#pl-money'),
          account=bank.querySelector('.pb-bank-account-head'),
          mortgage=bank.querySelector('.pb-bank-mort'),
          mortgageHome=mortgage.querySelector('.pb-bank-mort-home'),
          quote=money.querySelector('[data-o="usdRate"]'),
          rows=[...bank.querySelectorAll('.pb-bank-mort-row')],
          fx=money.querySelector('[data-share="kurs-usd-pln"]');
        return {win:innerWidth,doc:document.documentElement.scrollWidth,
          subtitlePx:parseFloat(getComputedStyle(bank.querySelector('.pl-head .pl-small')).fontSize),
          accountFirst:!!(account.compareDocumentPosition(mortgage)&Node.DOCUMENT_POSITION_FOLLOWING),
          quote:quote?.textContent,date:money.querySelector('[data-o="usdDate"]')?.textContent,
          rateRows:rows.length,
          mortgageHref:mortgageHome?.getAttribute('href'),
          calculatorTile:mortgageHome?.classList.contains('pb-bank-calc-card'),
          duplicateCalculator:bank.querySelectorAll('a[href="/dom#kalkulator-hipoteki"]').length,
          noExtraCards:!bank.querySelector('.pb-bank-extra')&&!bank.querySelector('[data-o="usdRate"]'),
          fxInMoney:!!fx&&fx.compareDocumentPosition(money.querySelector('.pl-seg'))&Node.DOCUMENT_POSITION_FOLLOWING,
          fxSource:!!fx.querySelector('a[href*="api.nbp.pl"]'),
          foreignerRules:rows.filter(row=>row.querySelector('.pb-bank-mort-by')).length,
          erste:rows.some(row=>row.querySelector('.pb-bank-mort-n').textContent.includes('Erste Bank Polska')),
          visible:!bank.hidden};
      });
      console.log(width,result,'errors:',errors);
      if(result.doc>result.win+1||result.subtitlePx!==12||!result.accountFirst||result.quote!=='3,9876'||!result.date?.includes('20.11.2026')||
        result.rateRows!==11||!result.erste||result.foreignerRules!==11||!result.calculatorTile||result.duplicateCalculator!==1||
        result.mortgageHref!=='/dom#kalkulator-hipoteki'||!result.noExtraCards||!result.fxInMoney||!result.fxSource||!result.visible)
        throw Error('bank or money layout/content '+width+': '+JSON.stringify(result));
      await page.screenshot({path:path.join(folder,'banki-'+width+'.png'),fullPage:true});
      if(width===375){
        await page.locator('a.pb-bank-mort-home').click();
        await page.waitForSelector('#pl-home',{state:'visible'});
        const route=await page.evaluate(()=>location.pathname+location.hash);
        if(route!=='/dom#kalkulator-hipoteki')throw Error('calculator link route: '+route);
        await page.goto(url.replace(/banki\.html(?:.*)?$/,'pieniadze.html')+'#kurs-usd-pln',{waitUntil:'domcontentloaded'});
        await page.locator('#pl-money .pb-money-fx').waitFor({state:'visible'});
        const source=await page.evaluate(()=>({route:location.pathname+location.hash,overflow:document.documentElement.scrollWidth>innerWidth+1}));
        if(source.route!=='/pieniadze#kurs-usd-pln'||source.overflow)throw Error('Money rate deep link '+JSON.stringify(source));
      }
      if(errors.length)throw Error('page errors at '+width+': '+errors.join('; '));
      await page.close();
    }
    console.log('Responsive Banks/Money PASS');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
