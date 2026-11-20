// Children guide regression, 20.11.2026
const { JSDOM } = require('jsdom');
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '../src/block.js'), 'utf8');
const css = fs.readFileSync(path.resolve(__dirname, '../src/block.css'), 'utf8');
const dom = new JSDOM('<!doctype html><html><body><div class="pl" id="pl-root"></div></body></html>', {
  url: 'https://panbogdan.com/dzieci', runScripts: 'outside-only'
});
const w = dom.window, errs = [];
w.scrollTo = () => {};
w.HTMLElement.prototype.scrollTo = () => {};
w.matchMedia = q => ({ matches:false, media:q, addListener(){}, addEventListener(){} });
w.addEventListener('error', e => errs.push(e.message));
w.eval(src);
const $ = q => w.document.querySelector(q);
const $$ = q => [...w.document.querySelectorAll(q)];
function assert(yes, msg) { if (!yes) throw new Error('FAIL: ' + msg); console.log('ok  ' + msg); }
assert(errs.length === 0, 'no runtime errors: ' + errs.join('; '));
assert($('#pl-kids'), '/dzieci is rendered');
assert($('#pl-kids-h').textContent.trim() === 'Дети', 'short primary header');
assert(!$('#pl-kids').textContent.includes('Деньги на детей'), 'obsolete heading removed');
assert(css.includes('.pb-kids-head .pl-head .pl-small{font-size:12px'), 'compact right-aligned subtitle');
const cards = $$('#pl-kids .pb-kid-card');
assert(cards.length === 19, 'nineteen practical cards');
assert(cards.every(c => c.querySelector('details summary')), 'each card has a disclosure');
assert(cards.every(c => c.querySelector('.pb-kid-body .pl-list li')), 'every disclosure lists documents');
assert(cards.every(c => c.querySelector('.pb-kid-body .pb-kid-steps li')), 'every disclosure gives steps');
assert(cards.every(c => c.querySelector('.pl-note a[href]')), 'every card cites official source');
assert(cards.every(c => /Проверено 20\.11\.2026/.test(c.textContent)), 'verification date per card');
assert(['pregnancy','afterbirth','usc','nfz','passport'].every(id => $('#pl-kid-'+id)), 'full birth timeline');
assert(['citizen','temporary','permanent','pending'].every(id => $('#pl-kid-'+id)), 'parent document pathways');
assert(['800','work','nurseryPay','home','dobry','pit','becik','rodz'].every(id => $('#pl-kid-'+id)), 'benefits');
assert($('#pl-kids').textContent.includes('Partyzantów 74'), 'local Gdańsk USC');
assert($('#pl-kid-temporary').textContent.includes('день решения'), 'parent status at immigration decision');
assert(!$('#pl-kids').textContent.includes('—'), 'no long em dash in content');
const bad = ['nashaniva','zerkalo','belsat','euroradio','mostmedia','dev.by','devby.io','reform.news','belarus-nau','charter97','svaboda'];
assert($$('#pl-kids a[href]').every(a => !bad.some(d => a.hostname === d || a.hostname.endsWith('.'+d))), 'safe links for Belarus');
function city(id) {
  const sel=$('[data-city-sel]');
  assert(!!sel, 'city selector present');
  sel.value=id;
  sel.dispatchEvent(new w.Event('change', {bubbles:true}));
}
city('gdynia');
assert($('#pl-kids').textContent.includes('Piłsudskiego 52/54'), 'Gdynia USC switches with city');
assert($('#pl-kids').textContent.includes('Gdynia Nullo'), 'Gdynia nursery selection link');
city('krakow');
assert($('#pl-kids').textContent.includes('В твоём городе'), 'generic city fallback grammatical');
assert(errs.length === 0, 'city changes have no JS exceptions: '+errs.join('; '));
console.log('Children t17 PASS');
