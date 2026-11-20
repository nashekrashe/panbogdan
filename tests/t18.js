// Regression: collapsible topic sections and saved disclosure state.
const { JSDOM } = require('jsdom');
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '../src/block.js'), 'utf8');
const make = saved => {
  const dom = new JSDOM('<!doctype html><body><div class="pl" id="pl-root"></div></body>', {
    url:'https://panbogdan.com/dzieci', runScripts:'outside-only'
  });
  const w=dom.window;
  w.scrollTo=()=>{};
  w.HTMLElement.prototype.scrollTo=()=>{};
  w.matchMedia=q=>({matches:false,media:q,addListener(){},addEventListener(){}});
  if(saved) w.localStorage.setItem('pb-poland-v2',saved);
  w.eval(src);
  return w;
};
const assert=(cond,msg)=>{if(!cond)throw Error('FAIL: '+msg);console.log('ok  '+msg);};
const nap=()=>new Promise(r=>setTimeout(r,40));
(async()=>{
  const w=make();
  const $=q=>w.document.querySelector(q);
  const $$=q=>[...w.document.querySelectorAll(q)];
  const kids=$$('#pl-kids > .pb-kid-section');
  assert(kids.length===4, 'all four children topic sections are collapsible');
  assert(kids.every(d=>d.open && d.querySelector(':scope > summary .pb-tog-e') && d.querySelector(':scope > summary .pb-tog-c')), 'children sections initially open with supplied icons');
  assert($$('#pl-by .pb-by-group').length===4, 'all Belarus topic groups are collapsible');
  assert($$('#pl-by .pb-by-group').every(d=>d.open && d.tagName==='DETAILS'), 'Belarus groups initially open');
  const first=$('#pb-fold-kid-pregnancy');
  first.querySelector(':scope > summary').click();
  await nap();
  assert(!first.open, 'section closes on click');
  const by=$('#pl-by .pb-by-group');
  by.querySelector(':scope > summary').click();
  await nap();
  assert(!by.open, 'other page section closes');
  const inner=$('#pl-kid-usc details');
  inner.querySelector('summary').click();
  await nap();
  assert(inner.open,'nested card expands');
  const key=JSON.parse(w.localStorage.getItem('pb-poland-v2'));
  assert(key.folds['pl-kids:pb-fold-kid-pregnancy']===false, 'closed child group saved in browser');
  assert(key.folds['pl-by:'+by.id]===false, 'closed Belarus group saved in browser');
  assert(key.folds['pl-kids:'+inner.id]===true, 'expanded card saved in browser');
  const before=w.localStorage.getItem('pb-poland-v2');
  const w2=make(before);
  const second=w2.document.querySelector('#pb-fold-kid-pregnancy');
  assert(!second.open,'closed group restored after reload');
  assert(!w2.document.querySelector('#pl-by .pb-by-group').open,'other page group restored after reload');
  assert(w2.document.querySelector('#pl-kid-usc details').open,'nested card state restored after reload');
  const selector=w2.document.querySelector('[data-city-sel]');
  selector.value='gdynia';
  selector.dispatchEvent(new w2.Event('change',{bubbles:true}));
  assert(!w2.document.querySelector('#pb-fold-kid-pregnancy').open,'state survives city rerender');
  assert(w2.document.querySelector('#pl-kid-usc details').open,'card state survives city rerender');
  const stored=JSON.parse(w2.localStorage.getItem('pb-poland-v2'));
  assert(stored.folds['pl-kids:pb-fold-kid-pregnancy']===false,'rerender does not overwrite saved preference');
  console.log('Collapse persistence t18 PASS');
  w.close();w2.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
