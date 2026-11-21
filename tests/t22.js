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
check(a.all('#pl-home [data-share="zezwolenie-na-zakup-nieruchomosci"] [data-check]').length===10, 'permit has 10 preparation groups');
check(a.$('#pl-home [data-share="zezwolenie-na-zakup-nieruchomosci"]').textContent.includes('1 570 zł'), 'MSWiA fee is not falsely claimed to be zero');
check(a.$('#pl-auto [data-share="zolte-tablice"]') && a.$('#pl-auto [data-share="rejestracja-samochodu"]'), 'vehicle and historic plates sections present');
a.$('[data-check="home-permit-0"]').click();
check(JSON.parse(a.w.localStorage.getItem('pb-poland-v2')).checks['home-permit-0']===true, 'permit checklist persists locally');
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
