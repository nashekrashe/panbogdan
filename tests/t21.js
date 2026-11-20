// Five-year rezydent UE countdown: overdue values must stay negative, with a numeric tooltip.
const {JSDOM}=require('jsdom');
const fs=require('fs'), path=require('path');
const js=fs.readFileSync(path.resolve(__dirname,'../src/block.js'),'utf8');
const assert=(yes,msg)=>{if(!yes)throw Error('FAIL: '+msg);console.log('ok  '+msg);};

function boot(since) {
  const dom=new JSDOM('<!doctype html><html><body><div class="pl" id="pl-root"></div></body></html>',
    {runScripts:'outside-only',url:'https://panbogdan.com/'});
  const w=dom.window, errs=[];
  w.scrollTo=()=>{};
  w.HTMLElement.prototype.scrollTo=function(){};
  w.HTMLElement.prototype.scrollIntoView=function(){};
  w.matchMedia=q=>({matches:false,media:q,addListener(){},addEventListener(){}});
  const NativeDate=w.Date;
  const fixed=new NativeDate(2026,10,20,12).getTime();
  w.Date=class extends NativeDate {
    constructor(...args){super(...(args.length?args:[fixed]));}
    static now(){return fixed;}
  };
  w.addEventListener('error',e=>errs.push(e.message));
  if(since)w.localStorage.setItem('pb-poland-v2',JSON.stringify({f:{since}}));
  w.eval(js);
  assert(!errs.length,'no runtime errors: '+errs.join('; '));
  const card=w.document.querySelector('.pb-mine .pl-me .pb-rd-count');
  return {w,dom,card};
}
let b=boot('2021-08-01');
assert(!!b.card,'rezydent 5-year counter rendered');
assert(b.card.querySelector('.pl-big').textContent==='-111','111 days overdue displays -111 instead of zero');
assert(b.card.querySelector('.pl-lab').textContent==='дней после 5 лет для rezydenta UE','overdue label describes elapsed days');
assert(!b.card.hasAttribute('title'),'native tooltip absent');
assert(b.card.querySelector('.pb-rd-tooltip').textContent==='уже 111 дней как должен податься, поднимай дупу!','custom popup shows exact overdue hint');
assert(b.card.getAttribute('aria-describedby')===b.card.querySelector('.pb-rd-tooltip').id && b.card.tabIndex===0,'tooltip available via aria-describedby and keyboard');
assert(b.card.querySelector('.pl-sub').textContent==='Срок уже есть, проверь выезды','caveat about eligibility and trips stays');
b.w.close();

b=boot('2021-11-20');
assert(b.card.querySelector('.pl-big').textContent==='0','five-year anniversary shows zero');
assert(b.card.querySelector('.pl-lab').textContent==='дней до 5 лет для rezydenta UE','anniversary keeps standard label');
assert(!b.card.querySelector('.pb-rd-tooltip') && !b.card.hasAttribute('aria-describedby'),'no overdue tooltip on exact anniversary');
b.w.close();

b=boot('2022-11-20');
assert(b.card.querySelector('.pl-big').textContent==='365','future five-year anniversary shows positive countdown');
assert(!b.card.querySelector('.pb-rd-tooltip') && !b.card.hasAttribute('aria-describedby'),'no overdue tooltip before five years');
assert(b.card.querySelector('.pl-sub').textContent.includes('2027'),'future date still shown');
b.w.close();

b=boot('');
assert(!b.card,'no fictitious overdue count before a start date is entered');
b.w.close();

console.log('Rezydent negative countdown t21 PASS');
