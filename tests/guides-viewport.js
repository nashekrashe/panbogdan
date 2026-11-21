// Smoke test for 4 staging sections, 320..1440, no horizontal overflow or JS errors.
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
const origin=process.argv[2]||'http://127.0.0.1:8765';
(async()=>{
  const browser=await chromium.launch({headless:true});
  try {
    const out=path.resolve(__dirname,'../dist/guides-screenshots');
    fs.mkdirSync(out,{recursive:true});
    for(const width of [320,375,768,1024,1440]){
      const page=await browser.newPage({viewport:{width,height:900}});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(()=>localStorage.setItem('pb-poland-v2',JSON.stringify({city:'gdansk',cityManual:true,stage:'wait',f:{filed:'2026-01-01'}})));
      await page.goto(origin+'/index.html',{waitUntil:'domcontentloaded'});
      const data=await page.evaluate(()=>({
        compare:!!document.querySelector('#pl-me .pb-voiv-sub') &&
          !document.querySelector('#pl-me .pb-voiv-compare') &&
          getComputedStyle(document.querySelector('#pl-me .pb-voiv-sub')).color==='rgb(215, 75, 78)',
        pkd:!!document.querySelector('#pl-money [data-share="pkd-2025"]'),
        rent:document.querySelector('#pl-home .pb-rent-number')?.textContent,
        permit:document.querySelectorAll('#pl-home [data-check^="home-permit-"]').length,
        permitDocs:document.querySelectorAll('#pl-home .pb-permit-docs .pl-doc-key').length,
        permitFolded:!document.querySelector('#pl-d-home-permit').open,
        eligCount:document.querySelectorAll('#pl-home .pb-permit-elig [data-check]').length,
        homeOrder:(()=>{const h=document.querySelector('#pl-home'), stats=h.querySelector(':scope > .pl-counts'), mort=h.querySelector('[data-share="kalkulator-hipoteki"]'), rent=h.querySelector('#pb-rent-guide');return !!(stats.compareDocumentPosition(mort)&4)&&!!(mort.compareDocumentPosition(rent)&4)})(),
        calculatorTitle:document.querySelector('#pl-home .pb-home-mort .pl-tool-h')?.textContent.includes('Калькулятор Ипотеки'),
        foreignerInside:!!document.querySelector('#pl-home .pb-home-mort [data-share="hipoteka-dla-cudzoziemca"]'),
        auto:!!document.querySelector('#pl-auto [data-share="zolte-tablice"]'),
        doc:document.documentElement.scrollWidth,win:innerWidth
      }));
      if(!data.compare||!data.pkd||!data.auto||data.permit!==12||data.permitDocs!==9||data.eligCount!==3||!data.permitFolded||!data.homeOrder||!data.calculatorTitle||!data.foreignerInside||Number(data.rent.replace(/\D/g,''))!==3000||data.doc>data.win+1)
        throw Error('guides content/overflow at '+width+': '+JSON.stringify(data));
      await page.locator('[data-city-sel]').selectOption('gdynia');
      const city=await page.evaluate(()=>({
        median:document.querySelector('#pl-home .pb-rent-number').textContent,
        doc:document.documentElement.scrollWidth,win:innerWidth
      }));
      if(Number(city.median.replace(/\D/g,''))!==2800||city.doc>city.win+1)
        throw Error('city change/overflow at '+width+': '+JSON.stringify(city));
      await page.goto(origin+'/dom.html#zezwolenie-na-zakup-nieruchomosci',{waitUntil:'domcontentloaded'});
      await page.locator('#pl-home').waitFor({state:'visible'});
      await page.locator('label.pl-check:has([data-check="home-permit-0"])').click();
      await page.locator('label.pl-check:has([data-check="home-permit-border"])').click();
      await page.locator('label.pl-check:has([data-check="home-permit-exempt"])').click();
      const eligibility=await page.evaluate(()=>({
        collapsed:!document.querySelector('#pb-permit-eligibility').open,
        status:document.querySelector('[data-o="permitEligibilityStatus"]')?.textContent,
        docs:document.querySelectorAll('.pb-permit-docs .pl-doc-key').length,
        persisted:Object.keys(JSON.parse(localStorage.getItem('pb-poland-v2')).checks).filter(k=>k.startsWith('home-permit-')||k.startsWith('home-elig')).length
      }));
      if(!eligibility.collapsed||!eligibility.status.includes('3/3')||eligibility.docs!==9||eligibility.persisted!==3)throw Error('eligibility not auto-collapsed at '+width+': '+JSON.stringify(eligibility));
      await page.locator('#pb-permit-eligibility > summary').click();
      await page.locator('label.pl-check:has([data-check="home-permit-exempt"])').click();
      const reopened=await page.evaluate(()=>({open:document.querySelector('#pb-permit-eligibility').open,status:document.querySelector('[data-o="permitEligibilityStatus"]').textContent}));
      if(!reopened.open||!reopened.status.includes('2/3'))throw Error('eligibility cannot be reopened at '+width+': '+JSON.stringify(reopened));
      await page.locator('label.pl-check:has([data-check="home-permit-1"])').click();
      const persisted=await page.evaluate(()=>!!JSON.parse(localStorage.getItem('pb-poland-v2')).checks['home-permit-1']);
      if(!persisted)throw Error('permit document checklist is not saved at '+width);
      const result=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,win:innerWidth}));
      if(result.doc>result.win+1)throw Error('home horizontal overflow at '+width);
      await page.screenshot({path:path.join(out,'guides-'+width+'.png'),fullPage:true});
      if(errors.length)throw Error('JS errors at '+width+': '+errors.join('; '));
      console.log('guides',width,'PASS');
      await page.close();
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
