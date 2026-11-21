// Staging 2026-11: regional comparisons, PKD 2025, rent, home permit and vehicle formalities.
const {JSDOM} = require('jsdom');
const fs = require('fs'), path = require('path');
const source = fs.readFileSync(path.resolve(__dirname, '../src/block.js'), 'utf8');
function check(value, message) { if (!value) throw Error('FAIL: ' + message); console.log('ok  ' + message); }
function boot(city, fields) {
  const dom = new JSDOM('<!doctype html><html><head><meta name="pb-paths" content="1"></head><body><div id="pl-root" class="pl"></div></body></html>',
    {runScripts:'outside-only', url:'https://panbogdan.com/'});
  const w=dom.window, errors=[];
  w.matchMedia=q=>({matches:false,media:q,addListener(){},addEventListener(){}});
  w.scrollTo=()=>{}; w.HTMLElement.prototype.scrollTo=function(){};
  w.HTMLElement.prototype.scrollIntoView=function(){};
  const NativeDate=w.Date, fixed=new NativeDate(2026,10,20,12).getTime();
  w.Date=class extends NativeDate { constructor(...args) { super(...(args.length?args:[fixed])); } static now() { return fixed; } };
  w.localStorage.setItem('pb-poland-v2', JSON.stringify({city:city,cityManual:true,stage:'wait',f:fields||{}}));
  w.addEventListener('error',e=>errors.push(e.message));
  w.eval(source);
  check(!errors.length, 'no runtime error in '+city+': '+errors.join(', '));
  return {w,$:s=>w.document.querySelector(s),all:s=>[...w.document.querySelectorAll(s)]};
}
let a=boot('gdansk', {filed:'2026-01-01'});
check(!a.$('#pl-me .pb-voiv-compare'), 'no duplicated regional comparison cards');
check(a.all('#pl-me .pb-voiv-sub').length===1, 'regional comparison emphasized in the existing waiting-time subtitle');
check(a.$('#pl-me .pb-voiv-sub').textContent.includes('598'), 'Pomorskie average remains in the subtitle');
check(a.$('#pl-money [data-share="pkd-2025"]'), 'PKD 2025 guide is in Money');
check(a.$('#pl-money [data-share="pkd-2025"]').textContent.includes('31 декабря 2026'), 'PKD transition date correct');
check(a.$('#pl-money [data-share="pkd-2025"]').textContent.includes('74.12.Z'), 'design PKD present');
check(a.$('#pb-rent-guide .pb-rent-number').textContent.replace(/\D/g,'')==='3000', 'Gdansk rent median from dated consistent sample');
check(a.all('#pl-home .pb-guide-card').length>=3, 'rental contracts and permits rendered');
const home=a.$('#pl-home'), stats=home.querySelector(':scope > .pl-counts'), mort=home.querySelector('[data-share="kalkulator-hipoteki"]'), rent=home.querySelector('[data-share="mediana-najmu"]'), permit=home.querySelector('[data-share="zezwolenie-na-zakup-nieruchomosci"]');
check(!!stats && !!mort && !!rent && !!permit, 'mortgage, rental and permit modules exist');
check(!!(stats.compareDocumentPosition(mort) & 4) && !!(mort.compareDocumentPosition(rent) & 4) && !!(rent.compareDocumentPosition(permit) & 4), 'mortgage calculator directly follows statistics, then rent and permit');
check(mort.querySelector('.pl-tool-h').textContent.includes('Калькулятор Ипотеки'), 'mortgage calculator has requested title');
check(mort.querySelector('[data-share="hipoteka-dla-cudzoziemca"]') && a.all('#pl-home [data-share="hipoteka-dla-cudzoziemca"]').length===1, 'short foreigner conditions moved into calculator, old deep link preserved');
check(permit.tagName==='DETAILS' && permit.classList.contains('pb-fold') && !permit.open, 'MSWiA uses the standard collapsed card');
check(permit.querySelectorAll('.pb-permit-docs .pl-doc-key').length===9, 'nine documented groups keep the existing document keys');
check(permit.querySelectorAll('.pb-permit-elig [data-check]').length===3, 'eligibility has three separately checkable verification points');
check(permit.querySelector('#pb-permit-eligibility').open, 'eligibility verification initially expanded');
check(permit.querySelector('[data-o="permitEligibilityStatus"]').textContent.includes('0/3'), 'eligibility status starts empty');
check(a.$('#pl-home [data-share="zezwolenie-na-zakup-nieruchomosci"]').textContent.includes('1 570 zł'), 'MSWiA fee is not falsely claimed to be zero');
check(a.$('#pl-auto [data-share="zolte-tablice"]') && a.$('#pl-auto [data-share="rejestracja-samochodu"]'), 'vehicle and historic plates sections present');
a.$('[data-check="home-permit-0"]').click();
a.$('[data-check="home-permit-border"]').click();
check(permit.querySelector('#pb-permit-eligibility').open, 'eligibility remains open while any point is unchecked');
a.$('[data-check="home-permit-exempt"]').click();
check(!permit.querySelector('#pb-permit-eligibility').open, 'eligibility automatically collapses when all points are checked');
check(permit.querySelector('[data-o="permitEligibilityStatus"]').textContent.includes('3/3'), 'eligibility summary updates after completion');
check(permit.querySelector('.pb-permit-docs .pl-doc-key') && !permit.querySelector('.pb-permit-docs').hidden, 'documents remain accessible after eligibility collapses');
a.$('[data-check="home-permit-1"]').click();
check(permit.querySelector('[data-o="permitDocsStatus"]').textContent.includes('1/9'), 'document count updates independently of eligibility');
check(JSON.parse(a.w.localStorage.getItem('pb-poland-v2')).checks['home-permit-1']===true, 'document checklist persists locally');
check(JSON.parse(a.w.localStorage.getItem('pb-poland-v2')).folds['pl-home:pb-permit-eligibility']===false, 'eligibility collapsed state persists');
check(a.$('#pl-home [data-share="mediana-najmu"] [data-copy-anchor]')!==null, 'rental median gets permanent anchor');
a.w.close();

a=boot('gdynia', {});
check(a.$('#pb-rent-guide .pb-rent-number').textContent.replace(/\D/g,'')==='2800','Gdynia mediana is 2800 in Seeki sample');
a.w.close();

a=boot('opole',{});
check(a.$('#pb-rent-guide .pb-rent-number').textContent==='Нет данных','missing city median shows no invented number');
a.w.close();

a=boot('warszawa',{pmzhFiled:'2026-01-01'});
check(!a.$('#pl-me .pb-voiv-compare'), 'no regional comparison card for permanent residence');
check(a.all('#pl-me .pb-voiv-sub').length===1, 'subtitle emphasis only on PMZh with a verified regional mean');
check(a.$('#pl-me .pb-voiv-sub').textContent.includes('239'), 'Mazowieckie PMZh average appears in subtitle');
a.w.close();
console.log('New guides t22 PASS');
