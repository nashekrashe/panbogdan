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
      await group.click();
      await page.waitForTimeout(80);
      const r=await page.evaluate(()=>({
        win:innerWidth,doc:document.documentElement.scrollWidth,
        cards:document.querySelectorAll('#pl-kids .pb-kid-card').length,
        expanded:!!document.querySelector('#pl-kids details[open]'),
        visible:!document.querySelector('#pl-kids').hidden
      }));
      await page.screenshot({path:path.resolve(__dirname,'../dist/kids-screenshots/kids-'+width+'.png'),fullPage:true});
      console.log(width,JSON.stringify(r),'JS errors:',errors);
      if(r.doc>r.win+1)throw new Error('horizontal overflow at '+width+' ('+r.doc+')');
      if(r.cards!==19||!r.expanded||!r.visible)throw new Error('children section missing cards or disclosure at '+width);
      if(errors.length)throw new Error('JS errors at '+width+': '+errors.join('; '));
      await page.close();
    }
    console.log('Responsive children PASS');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
