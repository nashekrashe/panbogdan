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
      await page.addInitScript(()=>{if(!localStorage.getItem('pb-poland-v2'))localStorage.setItem('pb-poland-v2',JSON.stringify({city:'gdansk',cityManual:true,stage:'wait',f:{filed:'2026-01-01'}}));});
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
      await page.goto(origin+'/auto.html#wymiana-prawa-jazdy',{waitUntil:'domcontentloaded'});
      await page.locator('#pl-auto').waitFor({state:'visible'});
      const guide=await page.evaluate(()=>{
        const x=document.querySelector('#pl-auto .pb-auto-license'), c=[...x.querySelectorAll('.pb-auto-license-choices label')],r=document.querySelector('#pl-auto [data-share="rejestracja-samochodu"]'), buy=document.querySelector('#pl-auto [data-share="kupno-sprzedaz-i-rejestracja-auta"]');
        return {choices:c.length,sameRow:c.length===2&&Math.abs(c[0].getBoundingClientRect().top-c[1].getBoundingClientRect().top)<3,
          headingClean:!x.querySelector('summary [data-auto-license]'),licenseSteps:x.querySelectorAll('[data-check^="auto-license-step-"]').length,
          licenseDocs:x.querySelectorAll('.pb-auto-docs [data-check^="auto-license-doc-"]').length,
          registration:r?.tagName,regSteps:r?.querySelectorAll('[data-check^="auto-reg-step-"]').length,regDocs:r?.querySelectorAll('[data-check^="auto-reg-doc-"]').length,
          tax:buy?.textContent.includes('23% VAT')&&buy?.textContent.includes('2% PCC')&&buy?.textContent.includes('VAT-marża')};});
      if(guide.choices!==2||!guide.sameRow||!guide.headingClean||guide.licenseSteps!==5||guide.licenseDocs!==8||guide.registration!=='DETAILS'||guide.regSteps!==5||guide.regDocs!==8||!guide.tax)
        throw Error('auto guide layout at '+width+': '+JSON.stringify(guide));
      const licenseBefore=await page.evaluate(()=>parseInt(document.querySelector('[data-o="lvlPct"]').textContent,10));
      const swapped=page.locator('#pl-auto [data-auto-license="swapped"]'), absent=page.locator('#pl-auto [data-auto-license="absent"]');
      if(!await swapped.isVisible()||!await absent.isVisible()||await swapped.isChecked()||await absent.isChecked())
        throw Error('license checkboxes missing or preselected at '+width);
      const licenseFold=page.locator('#pl-d-au0');
      if(!await licenseFold.evaluate(el=>el.open))await licenseFold.locator(':scope > summary').click();
      await page.locator('label.pl-check:has([data-check="auto-license-doc-0"])').click();
      await swapped.check();
      const licenseAfter=await page.evaluate(()=>parseInt(document.querySelector('[data-o="lvlPct"]').textContent,10));
      if(licenseAfter!==licenseBefore+2)throw Error('swapped licence bonus not +2 at '+width+': '+licenseBefore+' -> '+licenseAfter);
      await absent.check();
      const licenseAlternate=await page.evaluate(()=>parseInt(document.querySelector('[data-o="lvlPct"]').textContent,10));
      if(await swapped.isChecked()||!await absent.isChecked()||licenseAlternate!==licenseAfter)
        throw Error('licence options not exclusive, or duplicate XP at '+width);
      await page.goto(origin+'/auto.html#wymiana-prawa-jazdy',{waitUntil:'domcontentloaded'});
      await page.locator('#pl-auto').waitFor({state:'visible'});
      if(await swapped.isChecked()||!await absent.isChecked())throw Error('licence choice not persisted at '+width);
      const savedDoc=await page.evaluate(()=>JSON.parse(localStorage.getItem('pb-poland-v2')).checks['auto-license-doc-0']);
      if(!savedDoc)throw Error('licence documents not saved at '+width);
      await absent.uncheck();
      const licenseReset=await page.evaluate(()=>parseInt(document.querySelector('[data-o="lvlPct"]').textContent,10));
      if(licenseReset!==licenseBefore)throw Error('licence XP not reversible at '+width);
      await page.goto(origin+'/auto.html#rejestracja-samochodu',{waitUntil:'domcontentloaded'});
      await page.locator('#pl-auto').waitFor({state:'visible'});
      const regFold=page.locator('#pl-d-auto-reg');
      if(!await regFold.evaluate(el=>el.open))await regFold.locator(':scope > summary').click();
      await page.locator('label.pl-check:has([data-check="auto-reg-doc-0"])').click();
      await page.goto(origin+'/auto.html#rejestracja-samochodu',{waitUntil:'domcontentloaded'});
      await page.locator('#pl-auto').waitFor({state:'visible'});
      if(!await page.locator('[data-check="auto-reg-doc-0"]').isChecked())throw Error('registration documents not saved at '+width);
      const licenseOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
      if(licenseOverflow)throw Error('licence layout overflows at '+width);
      await page.screenshot({path:path.join(out,'guides-'+width+'.png'),fullPage:true});
      if(errors.length)throw Error('JS errors at '+width+': '+errors.join('; '));
      console.log('guides',width,'PASS');
      await page.close();
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
