// Permanent deep links across screens, disclosures, dynamic child paths and copy buttons.
const { JSDOM } = require('jsdom');
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '../src/block.js'), 'utf8');
const assert = (v,m) => { if (!v) throw Error('FAIL: '+m); console.log('ok  '+m); };
function boot(url, state, paths=true) {
  const head = paths ? '<meta name="pb-paths" content="1">' : '';
  const dom = new JSDOM('<!doctype html><html><head>'+head+'</head><body><div class="pl" id="pl-root"></div></body></html>', {
    url,runScripts:'outside-only'
  });
  const w=dom.window,errors=[],copied=[],scrolled=[];
  w.scrollTo=()=>{};
  w.HTMLElement.prototype.scrollTo=function(){};
  w.HTMLElement.prototype.scrollIntoView=function(){scrolled.push(this.id||this.getAttribute('data-share')||'target');};
  w.matchMedia=q=>({matches:false,media:q,addListener(){},addEventListener(){}});
  Object.defineProperty(w.navigator,'clipboard',{configurable:true,value:{writeText:txt=>{copied.push(txt);return Promise.resolve();}}});
  w.addEventListener('error', e=>errors.push(e.message));
  if(state)w.localStorage.setItem('pb-poland-v2',JSON.stringify(state));
  w.eval(src);
  return {w,errors,copied,scrolled,$:s=>w.document.querySelector(s)};
}
(async()=>{
  let a=boot('https://panbogdan.com/banki#erste');
  assert(!a.$('#pl-bank').hidden && a.$('#erste'), 'Erste direct link opens Banks and permanent slug');
  assert(a.$('#erste').closest('.pb-bank-mort-row').textContent.includes('Erste'), 'Erste anchor belongs to correct mortgage row');
  assert(a.$('#pl-bank .pb-section-copy'), 'top-level section has separate copy control');
  assert(a.$('#pl-bank-h').textContent.includes('Банки')&&!a.$('#pl-bank-h').textContent.includes('#'), 'section H1 remains unchanged');
  a.$('#pl-bank [data-copy-anchor="erste"]').click();
  a.$('#pl-bank [data-copy-section="bank"]').click();
  await Promise.resolve();
  assert(a.copied[0]==='https://panbogdan.com/banki#erste','Erste copy produces canonical URL');
  assert(a.copied[1]==='https://panbogdan.com/banki','section copy produces short canonical path');
  const shares=[...a.w.document.querySelectorAll('[data-share-ready]')];
  assert(shares.length>=70,'major cards, tools, topics and dictionary entries have share anchors');
  const slugs=shares.map(el=>el.getAttribute('data-share'));
  assert(new Set(slugs).size===slugs.length,'friendly slugs are globally unique in the single-DOM app');
  assert(slugs.every(slug=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)), 'every friendly slug is URL-safe');
  assert(shares.every(host=>{let el=a.w.document.getElementById(host.getAttribute('data-share'));return el&&(el===host||host.contains(el));}), 'all slugs have a resolvable DOM target');
  assert(a.$('#pl-bank a.pb-bank-mort-home').getAttribute('href')==='/dom#kalkulator-hipoteki','Bank calculator links to anchored Home tool');
  assert(a.errors.length===0,'no JS errors in Banks: '+a.errors.join(';'));
  a.w.close();

  a=boot('https://panbogdan.com/bialorusini#dokument-podrozy',{folds:{'pl-by:pb-fold-by-docs':false}});
  assert(!a.$('#pl-by').hidden && a.$('#pb-fold-by-docs').open,'deep link reopens a saved-closed Belarus topic');
  assert(a.$('#dokument-podrozy').closest('#pl-d-by0'), 'Belarus card keeps legacy ID and adds friendly alias');
  const before=a.$('#pb-fold-by-docs').open;
  a.$('#pb-fold-by-docs .pb-by-heading [data-copy-anchor]').click();
  assert(a.$('#pb-fold-by-docs').open===before,'copy button inside a summary does not toggle accordion');
  assert(a.errors.length===0,'no errors on Belarus direct route');
  a.w.close();

  a=boot('https://panbogdan.com/dzieci#pobyt-czasowy',{kidPath:'pending',folds:{'pl-kids:pb-fold-kid-legal':false}});
  assert(!a.$('#pl-kids').hidden && a.$('#pb-fold-kid-legal').open,'child direct link reopens legalisation section');
  assert(a.$('#pl-kid-temporary') && a.$('#pobyt-czasowy') && !a.$('#pl-kid-pending'),'child URL selects only temporary pathway');
  assert(JSON.parse(a.w.localStorage.getItem('pb-poland-v2')).kidPath==='temporary','child URL choice saved');
  assert(a.$('#pl-kid-temporary [data-copy-anchor="pobyt-czasowy"]'),'selected pathway gets own copy button');
  assert(a.errors.length===0,'no errors in selected child pathway');
  a.w.close();

  a=boot('https://panbogdan.com/dzieci#pobyt-staly',{kidPath:'temporary'});
  assert(a.$('#pl-kid-permanent') && !a.$('#pl-kid-temporary'),'different deep link overrides saved child route');
  assert(a.$('#pl-kid-permanent .pb-kid-route-list input'),'chosen route retains document checklist');
  a.w.close();

  a=boot('https://panbogdan.com/dzieci#pl-kid-temporary',{kidPath:''});
  assert(a.$('#pl-kid-temporary'),'legacy child ID remains navigable');
  a.w.close();

  a=boot('https://panbogdan.com/legalizacja#wniosek-o-pobyt-staly',{legal:'vnzh'});
  assert(!a.$('#pl-legal').hidden && !a.$('#pl-panel-pmzh').hidden,'legalisation route auto-selects permanent-residence tab');
  assert(a.$('#wniosek-o-pobyt-staly').closest('details').open,'step disclosure opens');
  a.w.close();

  a=boot('https://panbogdan.com/pieniadze#podatek-liniowy',{contract:'uop'});
  assert(!a.$('#pl-money').hidden && JSON.parse(a.w.localStorage.getItem('pb-poland-v2')).contract==='b2b','hidden tax card selects eligible contract');
  assert(!a.$('#podatek-liniowy').closest('[data-w]').hidden,'requested tax card is visible after contract selection');
  a.w.close();

  a=boot('https://panbogdan.com/dom#kalkulator-hipoteki');
  assert(!a.$('#pl-home').hidden && a.$('#kalkulator-hipoteki').closest('.pl-tool'),'home calculator has a direct address');
  a.w.close();

  a=boot('https://panbogdan.com/aktualnosci#pit-2027');
  assert(!a.$('#pl-news').hidden && a.$('#pb-nwp').open,'existing news article hashes still open their dialog');
  a.w.close();

  a=boot('https://panbogdan.com/preview.html#erste',null,false);
  assert(!a.$('#pl-bank').hidden && a.$('#erste'),'preview hash-only routing still supports deep links');
  a.$('#pl-bank [data-copy-anchor="erste"]').click();
  assert(a.copied[0]==='https://panbogdan.com/preview.html#erste','preview copies its actual preview address');
  a.w.close();

  console.log('Friendly anchors t20 PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
