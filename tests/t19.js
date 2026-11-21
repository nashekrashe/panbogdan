// Regression: banks, official USD/PLN quote and mortgage navigation.
const { JSDOM } = require('jsdom');
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '../src/block.js'), 'utf8');
const assert = (ok, msg) => { if (!ok) throw Error('FAIL: ' + msg); console.log('ok  ' + msg); };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function page(rate) {
  const dom = new JSDOM('<!doctype html><body><div class="pl" id="pl-root"></div></body>', {
    url: 'https://panbogdan.com/#banki', runScripts: 'outside-only'
  });
  const w = dom.window;
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollTo = () => {};
  w.matchMedia = q => ({ matches: false, media: q, addListener() {}, addEventListener() {} });
  const urls = [];
  w.fetch = url => {
    urls.push(String(url));
    if (String(url).includes('/exchangerates/rates/a/usd/')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(rate) });
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve(null) });
  };
  w.eval(src);
  return {w,urls};
}

(async () => {
  const {w,urls} = page({table:'A',code:'USD',rates:[{effectiveDate:'2026-11-20',mid:3.9876}]});
  const $ = q => w.document.querySelector(q);
  assert(!!$('#pl-bank .pl-section-intro'), 'bank intro uses compact shared text style');
  assert(!$('#pl-bank .pb-bank-extra') && !$('#pl-bank [data-o="usdRate"]'), 'no redundant currency or mortgage cards in Banks');
  assert(!!$('#pl-money .pb-money-fx') && $('#pl-money .pb-money-fx').getAttribute('data-share')==='kurs-usd-pln', 'exchange rate moved to Money, slug unchanged');
  assert($('#pl-money [data-o="usdRate"]').textContent === '—', 'no invented fallback exchange rate');
  await sleep(80);
  assert(urls.filter(x => x.includes('api.nbp.pl/api/exchangerates/rates/a/usd/')).length === 1, 'fetches NBP table A once');
  assert($('#pl-money [data-o="usdRate"]').textContent === '3,9876', 'NBP USD rate rendered to four decimals in Money');
  const bigPrice=$('#pl-home .pl-counts .pl-big');
  assert(bigPrice.classList.contains('pb-usd-price') && bigPrice.getAttribute('data-pln')==='486500', 'large PLN statistic hoverable');
  const inline=[...w.document.querySelectorAll('#pl-auto .pb-usd-price')].find(x=>x.textContent.includes('zł'));
  assert(!!inline, 'static inline PLN prices hoverable');
  bigPrice.dispatchEvent(new w.MouseEvent('mouseover',{bubbles:true}));
  const tip=w.document.querySelector('#pb-usd-tooltip');
  assert(tip && !tip.hidden && tip.querySelector('.pb-usd-tooltip-label').textContent==='примерно в долларах', 'hover displays a single USD card');
  const expectedUsd='$'+(486500/3.9876).toLocaleString('ru-RU',{minimumFractionDigits:1,maximumFractionDigits:1});
  assert(tip.querySelector('strong').textContent===expectedUsd, 'USD conversion rounded to one decimal at NBP rate');
  bigPrice.dispatchEvent(new w.MouseEvent('mouseout',{bubbles:true}));
  assert(tip.hidden, 'tooltip hidden on pointer leave');
  const net=$('#pl-money [data-o="net"]');
  assert(net.classList.contains('pb-usd-price') && isFinite(+net.getAttribute('data-pln')), 'calculated net income is a PLN tooltip');
  net.textContent='4000';
  await sleep(20);
  assert(net.getAttribute('data-pln')==='4000', 'dynamic price mutation refreshes tooltip');
  assert($('#pl-money [data-o="usdDate"]').textContent.includes('20.11.2026'), 'NBP publication date displayed');
  assert($('#pl-money .pb-money-fx a[href*="api.nbp.pl"]'), 'official NBP source linked in Money');
  const offers=[...w.document.querySelectorAll('#pl-bank .pb-bank-mort-row')];
  assert(offers.length===11, 'eleven bank mortgage examples including Erste');
  const expected=[
    ['ING Bank Śląski','6,07%','6,56%','от 20%','ing.pl'],
    ['Bank Pekao','6,29%','6,77%','30,18%','pekao.com.pl'],
    ['PKO Bank Polski','6,57%','7,93%','от 10%','pkobp.pl'],
    ['mBank','6,77%','7,41%','от 10%','mbank.pl'],
    ['Erste Bank Polska','6,97%','7,69%','от 10%','erste.pl'],
    ['BNP Paribas','5,95%','6,93%','43,5%','bnpparibas.pl'],
    ['Alior Bank','6,58%','7,15%','23,89%','aliorbank.pl'],
    ['Bank Millennium','5,65%','6,49%','37,30%','bankmillennium.pl'],
    ['Credit Agricole','6,29%','6,79%','46%','credit-agricole.pl'],
    ['VeloBank','6,92%','7,31%','25,28%','velobank.pl'],
    ['BOŚ Bank','6,15%','7,08%','уточнить','bosbank.pl']
  ];
  expected.forEach((x,i)=>{
    const row=offers[i];
    assert(row.querySelector('.pb-bank-mort-n').textContent.includes(x[0]), 'mortgage bank name '+x[0]);
    const nums=row.querySelectorAll('.pb-bank-mort-rate b');
    assert(nums.length===2 && nums[0].textContent===x[1] && nums[1].textContent===x[2], 'verified nominal + RRSO: '+x[0]);
    assert(row.querySelector('.pb-bank-mort-terms').textContent.includes(x[3]), 'down payment detail: '+x[0]);
    assert(row.querySelector('.pb-bank-mort-terms a').hostname.endsWith(x[4]), 'official bank URL: '+x[0]);
  });
  const calc = $('#pl-bank a.pb-bank-calc-card.pb-bank-mort-home[href="#kalkulator-hipoteki"]');
  assert(calc && calc.querySelector('strong').textContent==='Калькулятор ипотеки', 'one compact calculator link to Home');
  assert(calc.getAttribute('data-share')==='hipoteka-link' && w.document.querySelectorAll('#pl-bank a[href="#kalkulator-hipoteki"]').length===1, 'old mortgage-link anchor preserved without duplicate blocks');
  assert(calc.closest('.pb-bank-mort') && !$('#pl-bank .pb-bank-info'), 'calculator link is below mortgage rates, not a separate info card');
  assert(calc.textContent.includes('платёж'), 'calculator tile explains its purpose');
  assert(offers.every(row => !!row.querySelector('.pb-bank-mort-by')), 'every bank has a section about Belarusian eligibility');
  const first = offers.find(x=>x.querySelector('.pb-bank-mort-n').textContent.includes('mBank'));
  const alior = offers.find(x=>x.querySelector('.pb-bank-mort-n').textContent.includes('Alior'));
  const erste = offers.find(x=>x.querySelector('.pb-bank-mort-n').textContent.includes('Erste'));
  assert(first.querySelector('.pb-bank-mort-by').textContent.includes('PESEL') && first.querySelector('.pb-bank-mort-by a[href*="regulamin"]'), 'mBank explicit immigration criteria from mortgage regulation');
  assert(alior.querySelector('.pb-bank-mort-by').textContent.includes('meldunek') && alior.querySelector('.pb-bank-mort-by a[href*="03112026"]'), 'Alior accepts foreign clients with Polish income and meldunek');
  assert(erste.querySelector('.pb-bank-mort-by').textContent.includes('нет') && !erste.querySelector('.pb-bank-mort-by').textContent.includes('гарантирует'), 'Erste has no fabricated Belarus-specific eligibility');
  assert(offers.filter(row=>row.querySelector('.pb-bank-mort-by>b').textContent.includes('правило банка')).length===2, 'only two banks have officially verified foreigner eligibility');
  assert(offers.find(x=>x.querySelector('.pb-bank-mort-n').textContent.includes('Credit Agricole')).querySelector('.pb-bank-mort-rate small').textContent.includes('7 лет'), 'Credit Agricole seven-year fixed period');
  assert($('#pl-bank .pb-bank-by-note').textContent.includes('PESEL'), 'cross-bank Belarusian preparation notice');
  assert($('#pl-bank .pb-bank-mort-foot').textContent.includes('Суммы, сроки и взносы различаются'), 'rates labelled as non-comparable representative examples');
  const account=$('#pl-bank .pb-bank-account-head'), mort=$('#pl-bank .pb-bank-mort');
  assert(account.textContent.includes('Открытие счёта') && !!(account.compareDocumentPosition(mort)&w.Node.DOCUMENT_POSITION_FOLLOWING), 'opening an account is before mortgage offers');

  assert(!!$('#pl-home .pl-section-intro') && !!$('#pl-by .pl-section-intro'), 'page intros share consistent styles');
  const city = $('[data-city-sel]');
  city.value='gdynia';
  city.dispatchEvent(new w.Event('change',{bubbles:true}));
  assert($('#pl-money [data-o="usdRate"]').textContent === '3,9876', 'Money rate survives a section rerender');
  assert(w.document.querySelectorAll('#pl-bank .pb-bank-mort-row').length===11, 'all mortgage offers survive city rerender');
  w.close();

  const invalid = page({table:'C',code:'USD',rates:[{effectiveDate:'2026-11-20',mid:3.9876}]});
  await sleep(70);
  assert(invalid.w.document.querySelector('#pl-money [data-o="usdRate"]').textContent === '—', 'invalid API payload never shown as official rate');
  assert(invalid.w.document.querySelector('#pl-money [data-o="usdDate"]').textContent.includes('недоступен'), 'failed rate shows unavailable message');
  const badPrice=invalid.w.document.querySelector('#pl-home .pl-counts .pl-big');
  badPrice.dispatchEvent(new invalid.w.MouseEvent('mouseover',{bubbles:true}));
  assert(invalid.w.document.querySelector('#pb-usd-tooltip strong').textContent.includes('недоступен'), 'unavailable NBP rate does not yield fabricated dollars');
  invalid.w.close();
  console.log('Banks USD / mortgage t19 PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
