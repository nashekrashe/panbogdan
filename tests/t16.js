// Belarus section regression, 20.11.2026
const { JSDOM } = require('jsdom');
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '../src/block.js'), 'utf8');
const dom = new JSDOM('<!doctype html><body><div class="pl" id="pl-root"></div></body>', {
  url: 'https://panbogdan.com/bialorusini', runScripts: 'outside-only'
});
const w = dom.window, errs = [];
w.scrollTo = () => {};
w.HTMLElement.prototype.scrollTo = () => {};
w.matchMedia = q => ({ matches:false, media:q, addListener(){}, addEventListener(){} });
w.addEventListener('error', e => errs.push(e.message));
w.eval(src);
const $ = q => w.document.querySelector(q);
const $$ = q => [...w.document.querySelectorAll(q)];
const assert = (yes, msg) => {
  if (!yes) throw new Error('FAIL: ' + msg);
  console.log('ok  ' + msg);
};
assert(errs.length === 0, 'no runtime errors: ' + errs.join('; '));
assert($$('#pl-by .pb-by-group').length === 4, 'four topic groups');
assert($$('#pl-by .pb-col').length === 12, 'twelve source-backed Belarus cards');
assert($$('#pl-by .pb-by-heading h2').map(x => x.textContent).join('|') ===
  'Документы и статус|Karta Polaka|Деньги и работа|Жизнь и поездки', 'group headings');
assert($$('#pl-by .pb-col').every(c => /Проверено 20\.11\.2026/.test(c.textContent)), 'verification date per card');
assert($$('#pl-by .pb-col').every(c => c.querySelector('.pl-note a[href]')), 'source links per card');
assert($$('#pl-by .pb-col').every(c => c.querySelector('h3')), 'card titles');
assert($$('#pl-by .pb-by-more details').length >= 9, 'expandable practical advice');
assert($('[data-o="pdpcAll"]').querySelectorAll('li').length === 16, 'all 16 voivodeships shown');
assert(/не собрали/.test($('[data-o="pdpcUw"]').textContent), 'no guessed deadline for Pomorskie');
assert(/от начала постоянного или временного проживания/.test($('#pl-by').textContent), 'driver license time origin fixed');
assert(/не универсальное правило/.test($('#pl-by').textContent), 'bank rule scoped to PKO');
assert(/исполнение соглашения затруднено/.test($('#pl-by').textContent), 'pension caveat present');
assert(!$('#pl-by').textContent.includes('—'), 'no em dashes in section');
const bad = ['nashaniva','zerkalo','belsat','euroradio','mostmedia','dev.by','devby.io','reform.news','belarus-nau','charter97','svaboda'];
assert($$('#pl-by a[href]').every(a => !bad.some(d => a.hostname === d || a.hostname.endsWith('.'+d))), 'no prohibited sources');
console.log('Belarus t16 PASS');
