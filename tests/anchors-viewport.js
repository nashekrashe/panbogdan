// Share-link browser smoke test: path/hash routing, saved folds, mobile overflow, sticky-header offset.
const { chromium } = require('playwright');
const fs=require('fs'),path=require('path');
const origin=process.argv[2]||'http://127.0.0.1:8765';
(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const output=path.resolve(__dirname,'../dist/anchors-screenshots');
    fs.mkdirSync(output,{recursive:true});
    for(const width of [320,375,768,1024,1440]){
      const page=await browser.newPage({viewport:{width,height:900}});
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(()=>{
        Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copiedAnchor=text;}}});
      });
      await page.goto(origin+'/banki.html#erste',{waitUntil:'domcontentloaded'});
      await page.waitForSelector('#pl-bank .pb-bank-mort-row [data-copy-anchor="erste"]',{state:'visible'});
      await page.waitForTimeout(90);
      let info=await page.evaluate(()=>({
        path:location.pathname+location.hash,sectionHidden:document.querySelector('#pl-bank').hidden,
        anchor:document.querySelector('#erste').closest('.pb-bank-mort-row').getBoundingClientRect().top,
        win:innerWidth,doc:document.documentElement.scrollWidth
      }));
      if(info.sectionHidden || info.path!=='/banki#erste'||info.win+1<info.doc||info.anchor<0||info.anchor>180)throw Error('bank direct route/scroll/width at '+width+': '+JSON.stringify(info));
      await page.locator('#pl-bank [data-copy-anchor="erste"]').click();
      const copied=await page.evaluate(()=>window.__copiedAnchor);
      if(copied!==origin+'/banki#erste')throw Error('copy broken at '+width+': '+copied);

      await page.goto(origin+'/bialorusini.html#dokument-podrozy',{waitUntil:'domcontentloaded'});
      await page.waitForSelector('#pl-by #dokument-podrozy',{state:'attached'});
      await page.waitForTimeout(80);
      const before=await page.locator('#pb-fold-by-docs').evaluate(d=>d.open);
      await page.locator('#pb-fold-by-docs [data-copy-anchor="dokumenty-i-status"]').click();
      const after=await page.locator('#pb-fold-by-docs').evaluate(d=>d.open);
      if(!before||!after)throw Error('nested Belarus topic collapsed from copy at '+width);

      await page.goto(origin+'/dzieci.html#pobyt-czasowy',{waitUntil:'domcontentloaded'});
      await page.waitForSelector('#pl-kid-temporary .pb-kid-route-list',{state:'visible'});
      const kid=await page.evaluate(()=>({
        open:document.querySelector('#pb-fold-kid-legal').open,
        route:!!document.querySelector('#pobyt-czasowy'),
        other:!!document.querySelector('#pl-kid-pending'),
        saved:JSON.parse(localStorage.getItem('pb-poland-v2')||'{}').kidPath,
        win:innerWidth,doc:document.documentElement.scrollWidth
      }));
      if(!kid.open||!kid.route||kid.other||kid.saved!=='temporary'||kid.doc>kid.win+1)throw Error('kids route/layout at '+width+': '+JSON.stringify(kid));

      await page.goto(origin+'/dom.html#kalkulator-hipoteki',{waitUntil:'domcontentloaded'});
      await page.waitForSelector('#pl-home #kalkulator-hipoteki',{state:'attached'});
      await page.waitForTimeout(70);
      const home=await page.evaluate(()=>({
        hidden:document.querySelector('#pl-home').hidden,top:document.querySelector('[data-share="kalkulator-hipoteki"]').getBoundingClientRect().top,
        win:innerWidth,doc:document.documentElement.scrollWidth
      }));
      if(home.hidden||home.top<0||home.top>180||home.doc>home.win+1)throw Error('mortgage calculator route at '+width+': '+JSON.stringify(home));

      await page.screenshot({path:path.join(output,'anchors-'+width+'.png'),fullPage:true});
      if(errors.length)throw Error('JS errors at '+width+': '+errors.join('; '));
      console.log('anchors',width,'PASS');
      await page.close();
    }
  }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exit(1);});
