const {JSDOM}=require('jsdom');const fs=require('fs');
const js=fs.readFileSync(require('path').resolve(__dirname,'../src/block.js'),'utf8');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const dom=new JSDOM('<!doctype html><body><header class="pl-shell-h"><a href="https://pasha.by/" data-pl-logo>pasha.by</a></header><div class="pl" id="pl-root"></div></body>',{runScripts:'outside-only',url:'https://pasha.by/poland/'});
  const w=dom.window; w.scrollTo=()=>{}; w.HTMLElement.prototype.scrollTo=function(){}; w.matchMedia=q=>({matches:false,media:q});
  const errs=[]; w.addEventListener('error',e=>errs.push(e.message)); w.eval(js);
  const $=s=>w.document.querySelector(s);
  const b=$('.pashaby-phrase'), t=$('.pashaby-t');
  console.log('anchor gone:', !$('[data-pl-logo]'), '| button:', b && b.tagName, b.type, '| icon:', $('.pashaby-q').textContent, $('.pashaby-q').getAttribute('aria-hidden'));
  const seen=new Set([t.textContent]); let same=0, prev=t.textContent;
  for(let i=0;i<40;i++){ b.click(); await sleep(170); if(t.textContent===prev) same++; prev=t.textContent; seen.add(t.textContent); }
  console.log('40 clicks: distinct phrases', seen.size, '| repeats in a row', same, '| has new one:', [...seen].some(s=>/Kasторам|Касторам/.test(s))||'maybe');
  const P=eval('('+js.match(/var PHRASES = (\[[\s\S]*?\]);/)[1]+')'); console.log('phrases total', P.length, '| last:', P[P.length-1]);
  console.log('errors', errs);
})();
