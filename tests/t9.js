const {JSDOM}=require('jsdom');const fs=require('fs');
const js=fs.readFileSync(require('path').resolve(__dirname,'../src/block.js'),'utf8');
const dom=new JSDOM('<!doctype html><body><div class="pl" id="pl-root"></div></body>',{runScripts:'outside-only',url:'https://pasha.by/poland/'});
const w=dom.window; w.scrollTo=()=>{}; w.HTMLElement.prototype.scrollTo=function(){}; w.matchMedia=q=>({matches:false,media:q});
const errs=[]; w.addEventListener('error',e=>errs.push(e.message)); w.eval(js);
const $=s=>w.document.querySelector(s), $$=s=>[...w.document.querySelectorAll(s)];
const view=()=>['vnzh','pmzh','paszport'].map(k=>k+':'+[0,1,2,3,4,5].map(i=>{const r=$('[data-step="'+k+i+'"]');return r.classList.contains('pl-past')?'x':(r.classList.contains('done')?'d':'.')}).join('')+' '+$('[data-o="tc-'+k+'"]').textContent).join('  ');
const tg=$('[data-mypath]'); console.log('toggle default checked:', tg.checked, '| label:', tg.closest('label').textContent);
console.log('no stage   ', view());
for (const st of ['arrive','wait','vnzh','pmzh','pass','citizen']) { (s=>{const e=$('[data-stage-sel]');e.value=s;e.dispatchEvent(new w.Event('change',{bubbles:true}))})(st); console.log(st.padEnd(11), view()); }
const r=$('[data-step="vnzh0"]'); console.log('past row inert:', r.hasAttribute('inert'), 'btn disabled:', r.querySelector('[data-cycle]').disabled, 'label:', r.querySelector('.pl-st').textContent);
tg.checked=false; tg.dispatchEvent(new w.Event('change',{bubbles:true})); console.log('toggle off ', view(), '| inert:', r.hasAttribute('inert'));
tg.checked=true; tg.dispatchEvent(new w.Event('change',{bubbles:true}));
(s=>{const e=$('[data-stage-sel]');e.value=s;e.dispatchEvent(new w.Event('change',{bubbles:true}))})('vnzh');
const type=(el,v)=>{el.value=v; el.dispatchEvent(new w.InputEvent('input',{bubbles:true,inputType:'insertText'}));};
type($('#pl-f-me-pmzhFiled'),'01092026'); console.log('pmzh filed ', view());
// manual status on a non-past step still works
$('[data-cycle="pmzh5"]').click(); $('[data-cycle="pmzh5"]').click(); console.log('pmzh5 done ', view());
// re-render keeps it
const se=$('#pl-city'); se.value='krakow'; se.dispatchEvent(new w.Event('change',{bubbles:true})); console.log('after rerender', view(), '| toggle:', $('[data-mypath]').checked);
console.log('stored myPath:', JSON.parse(w.localStorage.getItem('pb-poland-v2')).myPath, 'errors', errs);
