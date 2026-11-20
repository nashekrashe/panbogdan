// CR 17.11.2026 «Беларусам»: «dokument podróży», full document list, timing per voivodeship, spelling «беларуский»
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');
const js=fs.readFileSync(path.resolve(__dirname,'../src/block.js'),'utf8');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
function boot(state){
  const dom=new JSDOM('<!doctype html><body><div class="pl" id="pl-root"></div></body>',{runScripts:'outside-only',url:'https://panbogdan.com/bialorusini'});
  const w=dom.window;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollTo=function(){};w.matchMedia=q=>({matches:false,media:q,addListener(){},addEventListener(){}});
  if(state)w.localStorage.setItem('pb-poland-v2',JSON.stringify(state));
  const errs=[];w.addEventListener('error',e=>errs.push(e.message));w.eval(js);
  return {w,errs,$:s=>w.document.querySelector(s)};
}
ok(!/еларусск/.test(js),'no «беларусск» left in the source');
let t=boot();const c=t.$('#pl-d-by0');
ok(t.errs.length===0,'no errors: '+t.errs.join('; '));
ok(c&&/dokument podróży/.test(c.querySelector('h3').textContent),'first card is «dokument podróży»');
ok(c.querySelectorAll('.pl-acc li').length>=9,'full document list plus timing rows');
ok(/meldunku/.test(c.textContent)&&/2 биометрические/.test(c.textContent),'list has meldunek and photos');
ok(/Pomorski/.test(c.textContent)&&/не собрали/.test(c.querySelector('[data-o="pdpcUw"]').textContent),'Gdańsk by default: honest «не собрали» for Pomorskie');
ok(/Mazowieckie:/.test(c.querySelector('[data-o="pdpcAll"]').textContent),'known voivodeships listed');
ok(/по-беларуски/.test(t.$('#pl-by').textContent),'«по-беларуски» spelled with one с');
t=boot({city:'warszawa'});
ok(/30 дней/.test(t.$('[data-o="pdpcUw"]').textContent),'Warsaw: 30 days from Mazowiecki');
ok(!/—/.test(t.$('#pl-by').textContent),'no long dashes in the section');
process.exit(fail?1:0);
