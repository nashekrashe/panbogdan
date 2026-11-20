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
  assert(!!$('#pl-bank .pb-bank-quote'), 'exchange rate visible in banks');
  assert($('#pl-bank [data-o="usdRate"]').textContent === '—', 'no invented fallback exchange rate');
  await sleep(80);
  assert(urls.filter(x => x.includes('api.nbp.pl/api/exchangerates/rates/a/usd/')).length === 1, 'fetches NBP table A once');
  assert($('#pl-bank [data-o="usdRate"]').textContent === '3,9876', 'NBP USD rate rendered to four decimals');
  assert($('#pl-bank [data-o="usdDate"]').textContent.includes('20.11.2026'), 'NBP publication date displayed');
  assert($('#pl-bank .pb-bank-info a[href*="api.nbp.pl"]'), 'official NBP source linked');
  assert($('#pl-bank .pb-bank-info a[href="#dom"]'), 'mortgage links to Home in preview routing');
  const offers=[...w.document.querySelectorAll('#pl-bank .pb-bank-mort-row')];
  assert(offers.length===4, 'four bank mortgage offers with official representative examples');
  const expected=[
    ['ING Bank Śląski','6,07%','6,56%','от 20%','ing.pl'],
    ['Bank Pekao','6,29%','6,77%','30,18%','pekao.com.pl'],
    ['PKO Bank Polski','6,57%','7,93%','от 10%','pkobp.pl'],
    ['mBank','6,77%','7,41%','от 10%','mbank.pl']
  ];
  expected.forEach((x,i)=>{
    const row=offers[i];
    assert(row.querySelector('.pb-bank-mort-n').textContent.includes(x[0]), 'mortgage bank name '+x[0]);
    const nums=row.querySelectorAll('.pb-bank-mort-rate b');
    assert(nums.length===2 && nums[0].textContent===x[1] && nums[1].textContent===x[2], 'verified nominal + RRSO: '+x[0]);
    assert(row.querySelector('.pb-bank-mort-terms').textContent.includes(x[3]), 'down payment detail: '+x[0]);
    assert(row.querySelector('.pb-bank-mort-terms a').hostname.endsWith(x[4]), 'official bank URL: '+x[0]);
  });
  assert($('#pl-bank .pb-bank-mort-home[href="#dom"]'), 'mortgage comparison links to Home calculator');
  assert($('#pl-bank .pb-bank-mort-foot').textContent.includes('разных сумм'), 'rates labelled as non-comparable representative examples');
  assert($('#pl-bank .pb-bank-account-head').textContent.includes('Открытие счёта'), 'deposit-account rankings are separate from mortgage comparison');

  assert(!!$('#pl-home .pl-section-intro') && !!$('#pl-by .pl-section-intro'), 'page intros share consistent styles');
  const city = $('[data-city-sel]');
  city.value='gdynia';
  city.dispatchEvent(new w.Event('change',{bubbles:true}));
  assert($('#pl-bank [data-o="usdRate"]').textContent === '3,9876', 'rate survives a section rerender');
  assert(w.document.querySelectorAll('#pl-bank .pb-bank-mort-row').length===4, 'all mortgage offers survive city rerender');
  w.close();

  const invalid = page({table:'C',code:'USD',rates:[{effectiveDate:'2026-11-20',mid:3.9876}]});
  await sleep(70);
  assert(invalid.w.document.querySelector('#pl-bank [data-o="usdRate"]').textContent === '—', 'invalid API payload never shown as official rate');
  assert(invalid.w.document.querySelector('#pl-bank [data-o="usdDate"]').textContent.includes('недоступен'), 'failed rate shows unavailable message');
  invalid.w.close();
  console.log('Banks USD / mortgage t19 PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
