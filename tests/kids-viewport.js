// Browser smoke test for /dzieci at 320-1440 px.
const { chromium } = require('playwright');
const path=require('path'), fs=require('fs');
const url=process.argv[2]||'http://127.0.0.1:8765/dzieci.html';
(async()=>{
  const browser=await chromium.launch({headless:true});
  try {
    fs.mkdirSync(path.resolve(__dirname,'../dist/kids-screenshots'),{recursive:true});
    for(const width of [320,375,768,1024,1440]){
      const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto(url,{waitUntil:'domcontentloaded'});
      await page.evaluate(()=>{
        history.replaceState(null,'','/dzieci');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await page.waitForSelector('#pl-kids .pb-kid-card',{state:'visible'});
      await page.locator('#pl-kids .pb-kid-card details summary').first().click();
      // Select one legal pathway; its steps and document checks must persist.
      await page.locator('#pb-fold-kid-legal [data-kid-path="temporary"]').click();
      await page.locator('#pl-kid-temporary [data-check^="kid-legal-temporary-doc-"]').first().check();
      const selected = await page.evaluate(() => JSON.parse(localStorage.getItem('pb-poland-v2')||'{}'));
      if (selected.kidPath !== 'temporary' || !selected.checks['kid-legal-temporary-doc-0']) throw Error('path/checkbox not saved at '+width);
      await page.waitForTimeout(200);
      // Topic groups and individual cards must remember the user's choice across navigations.
      const group=page.locator('#pb-fold-kid-pregnancy > summary');
      await group.click();
      await page.waitForTimeout(80);
      const saved=await page.evaluate(()=>{
        const state=JSON.parse(localStorage.getItem('pb-poland-v2')||'{}');
        return state.folds && state.folds['pl-kids:pb-fold-kid-pregnancy'];
      });
      if(saved!==false)throw new Error('closed topic state not saved at '+width);
      await page.goto(url,{waitUntil:'domcontentloaded'});
      await page.evaluate(()=>{history.replaceState(null,'','/dzieci');window.dispatchEvent(new PopStateEvent('popstate'));});
      await page.waitForSelector('#pl-kids .pb-kid-card',{state:'attached'});
      if(await page.locator('#pb-fold-kid-pregnancy').getAttribute('open')!==null)throw new Error('saved topic state not restored at '+width);
      if (await page.locator('#pl-kid-temporary').count()!==1 || await page.locator('#pl-kid-permanent').count()!==0) throw Error('wrong legal route restored at '+width);
      if (!await page.locator('#pl-kid-temporary [data-check="kid-legal-temporary-doc-0"]').isChecked()) throw Error('document state not restored at '+width);
      await group.click();
      await page.waitForTimeout(80);
      const r=await page.evaluate(()=>({
        win:innerWidth,doc:document.documentElement.scrollWidth,
        cards:document.querySelectorAll('#pl-kids .pb-kid-card').length,
        paths:document.querySelectorAll('#pb-fold-kid-legal .pb-kid-choice').length,
        active:document.querySelectorAll('#pb-fold-kid-legal .pb-kid-route').length,
        expanded:!!document.querySelector('#pl-kids details[open]'),
        visible:!document.querySelector('#pl-kids').hidden
      }));
      await page.screenshot({path:path.resolve(__dirname,'../dist/kids-screenshots/kids-'+width+'.png'),fullPage:true});
      console.log(width,JSON.stringify(r),'JS errors:',errors);
      if(r.doc>r.win+1)throw new Error('horizontal overflow at '+width+' ('+r.doc+')');
      if(r.cards!==15||r.paths!==4||r.active!==1||!r.expanded||!r.visible)throw new Error('children section missing route or disclosure at '+width);
      if(errors.length)throw new Error('JS errors at '+width+': '+errors.join('; '));
      await page.close();
    }
    console.log('Responsive children PASS');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
