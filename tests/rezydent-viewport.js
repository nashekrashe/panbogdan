// Browser smoke test: overdue rezydent UE counter and accessible hover tip, 320..1440.
const {chromium}=require('playwright');
const path=require('path'), fs=require('fs');
const origin=process.argv[2]||'http://127.0.0.1:8765';
(async()=>{
  const browser=await chromium.launch({headless:true});
  try {
    fs.mkdirSync(path.resolve(__dirname,'../dist/rezydent-screenshots'),{recursive:true});
    for(const width of [320,375,768,1024,1440]){
      const page=await browser.newPage({viewport:{width,height:900}});
      const errors=[];
      page.on('pageerror',err=>errors.push(err.message));
      await page.addInitScript(()=>{
        const now=new Date();now.setHours(12,0,0,0);
        const since=new Date(now);since.setFullYear(since.getFullYear()-5);since.setDate(since.getDate()-111);
        const pad=n=>String(n).padStart(2,'0');
        const date=since.getFullYear()+'-'+pad(since.getMonth()+1)+'-'+pad(since.getDate());
        localStorage.setItem('pb-poland-v2',JSON.stringify({f:{since:date}}));
      });
      await page.goto(origin+'/index.html',{waitUntil:'domcontentloaded'});
      const card=page.locator('.pb-mine .pl-me .pb-rd-count');
      await card.waitFor({state:'visible'});
      const result=await card.evaluate(node=>({
        value:node.querySelector('.pl-big').textContent,
        label:node.querySelector('.pl-lab').textContent,
        hint:node.querySelector('.pb-rd-tooltip')?.textContent,
        aria:node.getAttribute('aria-describedby'),
        nativeTitle:node.hasAttribute('title'),
        tabIndex:node.tabIndex,
        countColor:getComputedStyle(node.querySelector('.pl-big')).color,
        labelColor:getComputedStyle(node.querySelector('.pl-lab')).color,
        tipFont:parseFloat(getComputedStyle(node.querySelector('.pb-rd-tooltip')).fontSize),
        tipPadding:parseFloat(getComputedStyle(node.querySelector('.pb-rd-tooltip')).paddingLeft),
        win:innerWidth,doc:document.documentElement.scrollWidth
      }));
      if(result.value!=='-111'||result.label!=='дней после 5 лет для rezydenta UE'||
        result.hint!=='уже 111 дней как должен податься, поднимай дупу!'||
        result.aria!=='pb-rd-tooltip'||result.nativeTitle||result.tabIndex!==0||
        result.countColor!=='rgb(215, 75, 78)'||result.labelColor!=='rgb(215, 75, 78)'||
        result.tipFont<(width<=480?19:22)||result.tipPadding<(width<=480?20:24)||result.doc>result.win+1){
        throw Error('rezydent negative count / tooltip / viewport at '+width+': '+JSON.stringify(result));
      }
      const tip=card.locator('.pb-rd-tooltip');
      if(await tip.evaluate(el=>getComputedStyle(el).visibility)!=='hidden')throw Error('tooltip not initially hidden at '+width);
      await card.hover();
      await page.waitForTimeout(220);
      if(await tip.evaluate(el=>getComputedStyle(el).visibility)!=='visible') {
        const dbg=await tip.evaluate(el=>({visibility:getComputedStyle(el).visibility,opacity:getComputedStyle(el).opacity,hover:el.parentElement.matches(':hover'),focus:el.parentElement===document.activeElement,css:document.querySelector('style')?.textContent.includes('.pb-rd-tooltip')}));
        throw Error('custom popup missing on hover at '+width+': '+JSON.stringify(dbg));
      }
      if(!await tip.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1;}))throw Error('custom popup overflow at '+width);
      await card.focus();
      if(await tip.evaluate(el=>getComputedStyle(el).visibility)!=='visible')throw Error('custom popup missing on focus at '+width);
      if(!await card.evaluate(node=>document.activeElement===node))throw Error('rezydent hint not keyboard focusable at '+width);
      await page.screenshot({path:path.resolve(__dirname,'../dist/rezydent-screenshots/rezydent-'+width+'.png'),fullPage:true});
      if(errors.length)throw Error('page errors at '+width+': '+errors.join('; '));
      console.log('rezydent',width,'PASS',result.value);
      await page.close();
    }
  } finally {await browser.close();}
})().catch(err=>{console.error(err);process.exit(1);});
