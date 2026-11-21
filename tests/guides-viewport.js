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
        auto:!!document.querySelector('#pl-auto [data-share="zolte-tablice"]'),
        doc:document.documentElement.scrollWidth,win:innerWidth
      }));
      if(!data.compare||!data.pkd||!data.auto||data.permit!==10||Number(data.rent.replace(/\D/g,''))!==3000||data.doc>data.win+1)
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
      const persisted=await page.evaluate(()=>!!JSON.parse(localStorage.getItem('pb-poland-v2')).checks['home-permit-0']);
      if(!persisted)throw Error('permit checklist is not saved at '+width);
      const result=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,win:innerWidth}));
      if(result.doc>result.win+1)throw Error('home horizontal overflow at '+width);
      await page.screenshot({path:path.join(out,'guides-'+width+'.png'),fullPage:true});
      if(errors.length)throw Error('JS errors at '+width+': '+errors.join('; '));
      console.log('guides',width,'PASS');
      await page.close();
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
