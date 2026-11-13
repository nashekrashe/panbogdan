const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(require('path').resolve(__dirname,'../dist/poland-wp.html'),'utf8');
const adp=fs.readFileSync(require('path').resolve(__dirname,'../vendor/air-datepicker.js'),'utf8');
const vc=new VirtualConsole(); const errs=[]; vc.on('jsdomError',e=>errs.push(e.message)); vc.on('error',e=>errs.push(String(e)));
const dom=new JSDOM('<!doctype html><head><link data-adp><script>'+adp+'</script></head><body>'+html.replace(/<link[^>]*>/g,'')+'</body>',{runScripts:'dangerously',url:'https://pasha.by/poland/',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollTo=function(){};w.matchMedia=q=>({matches:false,media:q});}});
const w=dom.window,$=s=>w.document.querySelector(s);
setTimeout(()=>{
  console.log('sections', w.document.querySelectorAll('#pl-root section').length, 'date fields', w.document.querySelectorAll('[data-date]').length);
  $('[data-stage="pmzh"]').click(); console.log('level', $('[data-o="lvlName"]').textContent, $('[data-o="lvlPct"]').textContent);
  $('#pl-f-me-since').focus();
  setTimeout(()=>{ console.log('popup', !!w.document.querySelector('.air-datepicker.pashaby-adp.-active-'), 'sri in code', html.includes('NPBiBhnpeWwcn7ve8')); console.log('errors', errs); },50);
},100);
