(function () {
  'use strict';
  var root = document.getElementById('pl-root');
  if (!root) return;

  /* ---------- state ---------- */
  var KEY = 'pb-poland-v2';
  var DEF = { city: 'gdansk', geo: null, cityManual: false, stage: 'arrive', legal: 'vnzh', contract: 'uop', status: {}, checks: {}, f: { brutto: '7000', pit2: true, rev: '15000', cost: '500', taxf: 'rycz', rate: '12', zusl: 'auto', mInc: '', mInc2: '0', mAd: '1', mKids: '0', mDebt: '0', mLim: '0', mOwn: '150000', mRate: '5.95', mYears: '25', mLtv: '80', mMkt: 'wt', mFirst: false, mLife: true, cons: '7', dist: '340', price: '6.00', cpath: 'std', invMonths: '1', invDeps: '0', invGuests: '1', invTrip: 'near', invRel: false }, trips: [] };
  function load() { try { var s = JSON.parse(localStorage.getItem(KEY)); return s && typeof s === 'object' ? s : null; } catch (e) { return null; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  var S = Object.assign({}, DEF, load() || {});
  S.f = Object.assign({}, DEF.f, S.f || {});
  Object.keys(DEF.f).forEach(function (k) { if (S.f[k] === '' && typeof DEF.f[k] === 'string' && DEF.f[k] !== '') S.f[k] = DEF.f[k]; });
  if (['uop', 'zlec', 'dzielo', 'b2b'].indexOf(S.contract) < 0) S.contract = 'uop';
  S.status = S.status || {}; S.checks = S.checks || {}; S.trips = Array.isArray(S.trips) ? S.trips : [];

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ms(name, cls) { return '<span class="ms' + (cls ? ' ' + cls : '') + '" aria-hidden="true">' + name + '</span>'; }
  function today() { var d = new Date(); d.setHours(12, 0, 0, 0); return d; }
  function parseD(v) { if (!v) return null; var p = String(v).split('-'); if (p.length !== 3) return null; var d = new Date(+p[0], +p[1] - 1, +p[2], 12); return isNaN(d) ? null : d; }
  function days(a, b) { return Math.round((b - a) / 864e5); }
  function addM(d, m) { var x = new Date(d); x.setMonth(x.getMonth() + m); return x; }
  function addY(d, y) { var x = new Date(d); x.setFullYear(x.getFullYear() + y); return x; }
  function addD(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function fmtD(d) { return d ? d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'; }
  function n0(v) { return Math.round(v).toLocaleString('ru-RU'); }
  function z2(v) { return v.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function num(v) { var x = parseFloat(String(v || '').replace(',', '.').replace(/\s/g, '')); return isFinite(x) ? x : 0; }
  function plural(n, a, b, c) { n = Math.abs(n) % 100; var m = n % 10; if (n > 10 && n < 20) return c; if (m > 1 && m < 5) return b; if (m === 1) return a; return c; }
  function dWord(n) { return plural(n, 'день', 'дня', 'дней'); }
  function dGen(n) { n = Math.abs(n); return n % 10 === 1 && n % 100 !== 11 ? 'дня' : 'дней'; }
  function $(sel) { return root.querySelector(sel); }
  function $$(sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  function out(name, html) { $$('[data-o="' + name + '"]').forEach(function (el) { el.innerHTML = html; }); }
  function bar(name, pct, cls) { $$('[data-o="' + name + '"]').forEach(function (el) { el.className = 'pl-prog' + (cls ? ' ' + cls : ''); el.firstChild.style.width = Math.max(0, Math.min(100, pct)) + '%'; }); }
  function link(u, t) { return '<a href="' + u + '" target="_blank" rel="noopener">' + t + '</a>'; }
  function src(u, t) { return '<a class="src" href="' + u + '" target="_blank" rel="noopener">' + esc(t) + ms('arrow_outward') + '</a>'; }

  /* ---------- data ---------- */
  /* ---------- cities and voivodeships: update the numbers here ----------
     wait  average days to a temporary residence decision, by voivode. MSWiA reply to interpellation 18089 (27.07.2026), data on 6.07.2026
     pmzh  same for permanent residence, published only for Mazowieckie
     by    approx. thousands of Belarusians living in the voivodeship, UdSC report on 1.02.2026 (null: not published)
     apps  residence applications filed by Belarusians in 2025 at this voivode, same UdSC report
     u     foreigners department, per the UdSC list of voivodeship offices
     help  local help from the official Krajowa Sieć Integracji address base (gov.pl) */
  var DATA_AS_OF = '6.07.2026';
  var KSI = ', из базы Krajowa Sieć Integracji';
  var VOIV = {
    dolnoslaskie: { v: 'Dolnośląskie', uw: 'Dolnośląski', u: 'https://www.gov.pl/web/dolnoslaski-uw/cudzoziemcy-info', wait: 303, by: 12, apps: 4843,
      help: [{ n: 'NOMADA', d: 'Интеграция и консультации для иностранцев', u: 'https://nomada.info.pl', h: 'nomada.info.pl' }] },
    kujawsko: { v: 'Kujawsko-pomorskie', uw: 'Kujawsko-Pomorski', u: 'https://www.gov.pl/web/uw-kujawsko-pomorski/cudzoziemcy2', wait: 541, by: null, apps: 719,
      help: [{ n: 'Fundacja EMIC', d: 'Помощь иностранцам' + KSI, u: 'https://emic.com.pl', h: 'emic.com.pl' }] },
    lubelskie: { v: 'Lubelskie', uw: 'Lubelski', u: 'https://wsoic.lublin.uw.gov.pl/', wait: 386, by: null, apps: 2125,
      help: [{ n: 'Instytut na Rzecz Państwa Prawa', d: 'Юридическая помощь иностранцам' + KSI, u: 'https://panstwoprawa.org', h: 'panstwoprawa.org' },
        { n: 'Stowarzyszenie Homo Faber', d: 'Интеграция и консультации' + KSI, u: 'https://hf.org.pl', h: 'hf.org.pl' }] },
    lubuskie: { v: 'Lubuskie', uw: 'Lubuski', u: 'https://bip.lubuskie.uw.gov.pl/sprawy_obywatelskie/index.html', wait: 555, by: null, apps: 717,
      help: [{ n: 'Centrum Integracji Cudzoziemców, Gorzów', d: 'Центр интеграции иностранцев' + KSI, u: 'https://cicgorzow.pl', h: 'cicgorzow.pl' }] },
    lodzkie: { v: 'Łódzkie', uw: 'Łódzki', u: 'https://www.lodzkie.eu/page/75,wydzial-spraw-obywatelskich-i-cudzoziemcow.html', wait: 386, by: 10, apps: 1767, help: [] },
    malopolskie: { v: 'Małopolskie', uw: 'Małopolski', u: 'https://malopolska.uw.gov.pl/default.aspx?page=WSC', wait: 242, by: 10, apps: 3794,
      help: [{ n: 'Centrum Pomocy Prawnej im. Haliny Nieć', d: 'Бесплатная юридическая помощь иностранцам', u: 'https://www.pomocprawna.org', h: 'pomocprawna.org' },
        { n: 'Information Point for Foreigners', d: 'Городской пункт информации для иностранцев', u: 'https://otwarty.krakow.pl/247022,artykul,information-point-for-foreigners.html', h: 'otwarty.krakow.pl' }] },
    mazowieckie: { v: 'Mazowieckie', uw: 'Mazowiecki', u: 'https://www.gov.pl/web/uw-mazowiecki', wait: 394, pmzh: 239, by: 53, apps: 18927,
      help: [{ n: 'Warszawskie Centrum Wielokulturowe', d: 'Городской центр для иностранцев', u: 'https://warszawa19115.pl/-/warszawskie-centrum-wielokulturowe', h: 'warszawa19115.pl' },
        { n: 'Stowarzyszenie Interwencji Prawnej', d: 'Бесплатная юридическая помощь иностранцам', u: 'https://interwencjaprawna.pl', h: 'interwencjaprawna.pl' },
        { n: 'Fundacja Ocalenie', d: 'Помощь мигрантам: консультации, интеграция', u: 'https://ocalenie.org.pl', h: 'ocalenie.org.pl' },
        { n: 'Informator dla Białorusinów', d: 'Городской гид Варшавы для беларусов, PDF', u: 'https://warszawa19115.pl/documents/20184/1901712/Informator_Bia%C5%82oru%C5%9B_PL', h: 'warszawa19115.pl' }] },
    opolskie: { v: 'Opolskie', uw: 'Opolski', u: 'https://www.gov.pl/web/uw-opolski', wait: 510, by: null, apps: 196,
      help: [{ n: 'Centrum Integracji Cudzoziemców, WUP Opole', d: 'Центр интеграции иностранцев' + KSI, u: 'https://wupopole.praca.gov.pl/centrum-integracji-cudzoziemcow', h: 'wupopole.praca.gov.pl' }] },
    podkarpackie: { v: 'Podkarpackie', uw: 'Podkarpacki', u: 'https://rzeszow.uw.gov.pl/urzad/wydzialy/wydzial-spraw-obywatelskich-i-cudzoziemcow', wait: 302, by: null, apps: 208, help: [] },
    podlaskie: { v: 'Podlaskie', uw: 'Podlaski', u: 'https://www.gov.pl/web/uw-podlaski/sprawy-obywatelskie-i-cudzoziemcow', wait: 447, by: 13, apps: 4486,
      help: [{ n: 'Fundacja Dialog', d: 'Помощь иностранцам в Белостоке' + KSI, u: 'https://fundacjadialog.pl', h: 'fundacjadialog.pl' }] },
    pomorskie: { v: 'Pomorskie', uw: 'Pomorski', u: 'https://www.gov.pl/web/uw-pomorski', wait: 598, by: 11, apps: 4994,
      help: [{ n: 'Centrum Wsparcia Imigrantów i Imigrantek', d: 'Консультации для иностранцев, в том числе юридические', u: 'https://cwii.pl', h: 'cwii.pl' },
        { n: 'Pomorskie Welcome Centre', d: 'Центры интеграции в Гданьске и Слупске: юристы, психологи, курсы польского', u: 'https://migracje.pomorskie.eu/welcome-center/', h: 'migracje.pomorskie.eu' }] },
    slaskie: { v: 'Śląskie', uw: 'Śląski', u: 'https://www.katowice.uw.gov.pl/usluga/cudzoziemcy', wait: 658, by: null, apps: 940,
      help: [{ n: 'Centrum Integracji Cudzoziemców w Katowicach', d: 'Центр интеграции иностранцев' + KSI, u: 'https://www.cic-slaskie.eu/cic-katowice/', h: 'cic-slaskie.eu' },
        { n: 'Stowarzyszenie MOST', d: 'Помощь иностранцам в Катовице' + KSI, u: 'https://mostkatowice.pl', h: 'mostkatowice.pl' }] },
    swietokrzyskie: { v: 'Świętokrzyskie', uw: 'Świętokrzyski', u: 'https://www.gov.pl/web/uw-swietokrzyski/oddzial-ds-cudzoziemcow', wait: 325, by: null, apps: 547, help: [] },
    warminsko: { v: 'Warmińsko-mazurskie', uw: 'Warmińsko-Mazurski', u: 'https://www.gov.pl/web/uw-warminsko-mazurski/obsluga-cudzoziemcow-i-zaproszenia', wait: 273, by: null, apps: 617, help: [] },
    wielkopolskie: { v: 'Wielkopolskie', uw: 'Wielkopolski', u: 'https://migrant.poznan.uw.gov.pl/', wait: 339, by: 11, apps: 6238,
      help: [{ n: 'Migrant Info Point', d: 'Пункт помощи иностранцам в Познани' + KSI, u: 'https://migrant.poznan.pl', h: 'migrant.poznan.pl' }] },
    zachodniopomorskie: { v: 'Zachodniopomorskie', uw: 'Zachodniopomorski', u: 'https://www.gov.pl/web/uw-zachodniopomorski', wait: 465, by: null, apps: 1432,
      help: [{ n: 'Biuro Informacji i Wsparcia Kulturowego', d: 'Информация и поддержка иностранцев в Щецине' + KSI, u: 'https://cus.szczecin.eu/biuro-informacji-i-wsparcia-kulturowego/', h: 'cus.szczecin.eu' }] }
  };
  /* payment details per voivodeship: tax = opłata skarbowa (city of the voivode's seat), card = karta pobytu and documents (the voivode's office).
     [recipient, account, proof page]. Copied from each office's page on 16.11.2026, linked from the MOS list (list). Strict JSON: build/paycheck.mjs reads it
     and checks weekly that every account is still on its proof page; the result lands in data/pay-check.json */
  var PAY = /*PAY*/{"verified":"16.11.2026","list":"https://www.mos.cudzoziemcy.gov.pl/artyku-y/informacje-o-oplatach-oplacie-skarbowej-za-udzielenie-zezwolenia-na-pobyt-oraz-oplacie-za-wydanie-karty-pobytu/","v":{"dolnoslaskie":{"tax":["Gmina Wrocław","82 1020 5226 0000 6102 0417 7895","https://www.gov.pl/web/dolnoslaski-uw/numery-rachunkow-bankowych"],"card":["Dolnośląski Urząd Wojewódzki we Wrocławiu","41 1010 1674 0005 9222 3100 0000","https://www.gov.pl/web/dolnoslaski-uw/numery-rachunkow-bankowych"]},"kujawsko":{"tax":["Urząd Miasta Bydgoszczy","52 1240 6960 3892 1000 0000 0000","https://cudzoziemiec.bydgoszcz.pl/oplaty/"],"card":["Kujawsko-Pomorski Urząd Wojewódzki w Bydgoszczy","56 1010 1078 0000 4222 3100 0000","https://cudzoziemiec.bydgoszcz.pl/oplaty/"]},"lubelskie":{"tax":["Urząd Miasta Lublin, Wydział Podatków","95 1240 2092 9329 9200 0620 0000","https://cudzoziemcy.lublin.uw.gov.pl/pl/oplaty"],"card":["Lubelski Urząd Wojewódzki w Lublinie","67 1010 1339 0055 0022 3100 0000","https://cudzoziemcy.lublin.uw.gov.pl/pl/oplaty"],"info":"https://cudzoziemcy.lublin.uw.gov.pl/kontakt"},"lubuskie":{"tax":["Urząd Miasta Gorzowa Wielkopolskiego","44 1020 5402 0000 0302 0325 6575","https://bip.lubuskie.uw.gov.pl/sprawy_obywatelskie/oplaty-za-zalatwienie-sprawy-oraz-dane-do-przelewu"],"card":["Lubuski Urząd Wojewódzki","72 1010 1704 0023 5222 3100 0000","https://bip.lubuskie.uw.gov.pl/sprawy_obywatelskie/oplaty-za-zalatwienie-sprawy-oraz-dane-do-przelewu"]},"lodzkie":{"tax":["Urząd Miasta Łodzi","50 1240 1037 1111 0011 0925 0073","https://www.gov.pl/web/uw-lodzki/tabela-oplat"],"card":["Łódzki Urząd Wojewódzki w Łodzi","88 1010 1371 0097 0022 3100 0000","https://www.gov.pl/web/uw-lodzki/tabela-oplat"]},"malopolskie":{"tax":["Urząd Miasta Krakowa, Wydział Podatków i Opłat","49 1020 2892 2276 3005 0000 0000","https://infoopt.pl/oplaty/"],"card":["Małopolski Urząd Wojewódzki","08 1010 1270 0051 2222 3100 0000","https://infoopt.pl/oplaty/"],"info":"https://infoopt.pl/kontakt/"},"mazowieckie":{"tax":["Centrum Obsługi Podatnika Urzędu m.st. Warszawy","21 1030 1508 0000 0005 5000 0070","https://migrant.wsc.mazowieckie.pl/pl/wskazowki/oplaty"],"card":["Mazowiecki Urząd Wojewódzki","83 1010 1010 0137 1022 3100 0000","https://migrant.wsc.mazowieckie.pl/pl/wskazowki/oplaty"],"addr":[["Варшава","ul. Marszałkowska 3/5"]],"info":"https://migrant.wsc.mazowieckie.pl/dane-kontaktowe"},"opolskie":{"tax":["Urząd Miasta Opola","03 1160 2202 0000 0002 1515 3249","https://cudzoziemcy.e-wojewoda.pl/wskazowki/oplaty"],"card":["Opolski Urząd Wojewódzki","22 1010 1401 0006 9322 3100 0000","https://cudzoziemcy.e-wojewoda.pl/wskazowki/oplaty"],"addr":[["Ополе","ul. Piastowska 14"]],"info":"https://cudzoziemcy.e-wojewoda.pl/dane-kontaktowe","cit":1},"podkarpackie":{"tax":["Urząd Miasta Rzeszowa","90 1240 6960 3851 0062 0000 0423","https://rzeszow.uw.gov.pl/dla-klienta/cudzoziemcy/aktualnosci"],"card":["Podkarpacki Urząd Wojewódzki w Rzeszowie","74 1010 1528 0012 1222 3100 0000","https://rzeszow.uw.gov.pl/dla-klienta/cudzoziemcy/aktualnosci"],"cit":1},"podlaskie":{"tax":["Urząd Miejski w Białymstoku","26 1240 5211 1111 0010 3553 3132","https://www.gov.pl/web/uw-podlaski/tabela-oplat"],"card":["Podlaski Urząd Wojewódzki w Białymstoku","94 1010 1049 0000 3922 3100 0000","https://www.gov.pl/web/uw-podlaski/tabela-oplat"]},"pomorskie":{"tax":["Urząd Miejski w Gdańsku","31 1240 1268 1111 0010 3877 3935","https://wsc.gdansk.uw.gov.pl/pl/wskazowki/oplaty"],"card":["Pomorski Urząd Wojewódzki w Gdańsku","07 1010 1140 0169 1322 3100 0000","https://wsc.gdansk.uw.gov.pl/pl/wskazowki/oplaty"],"addr":[["Гданьск","ul. Chmielna 74/76, пн 8:00-17:30, вт-пт 8:00-15:15"],["Слупск, отдел","ul. Jana Pawła II 1, IV этаж"]],"book":"https://kolejka.gdansk.uw.gov.pl/","info":"https://wsc.gdansk.uw.gov.pl/kontakt"},"slaskie":{"tax":["Urząd Miasta Katowice","52 1020 2313 2672 0211 1111 1111","https://www.katowice.uw.gov.pl/usluga/cudzoziemcy/zezwolenie-na-pobyt"],"card":["Śląski Urząd Wojewódzki","67 1010 1212 0053 4022 3100 0000","https://www.katowice.uw.gov.pl/usluga/cudzoziemcy/karty-pobytu"]},"swietokrzyskie":{"tax":["Urząd Miasta Kielce","38 1050 0099 6450 9000 0000 0000","https://www.gov.pl/web/uw-swietokrzyski/oplaty3"],"card":["Świętokrzyski Urząd Wojewódzki w Kielcach","67 1010 1238 0853 4222 3100 0000","https://www.gov.pl/web/uw-swietokrzyski/oplaty3"]},"warminsko":{"tax":["Urząd Miasta Olsztyna","09 1030 1508 0000 0008 2310 0003","https://www.gov.pl/web/uw-warminsko-mazurski/oplaty"],"card":["Warmińsko-Mazurski Urząd Wojewódzki","31 1010 1397 0032 9022 3100 0000","https://www.gov.pl/web/uw-warminsko-mazurski/oplaty"]},"wielkopolskie":{"tax":["Urząd Miasta Poznania","94 1020 4027 0000 1602 1262 0763","https://migrant.poznan.uw.gov.pl/wskazowki/oplaty"],"card":["Wielkopolski Urząd Wojewódzki","70 1010 1469 0000 3922 3100 0000","https://migrant.poznan.uw.gov.pl/wskazowki/oplaty"],"addr":[["Познань","pl. Wolności 17"]],"info":"https://migrant.poznan.uw.gov.pl/dane-kontaktowe"},"zachodniopomorskie":{"tax":["Urząd Miasta Szczecin","20 1020 4795 0000 9302 0277 9429","https://www.gov.pl/web/uw-zachodniopomorski/oplaty-skarbowe"],"card":["Zachodniopomorski Urząd Wojewódzki","66 1010 1599 0055 9722 3100 0000","https://www.gov.pl/web/uw-zachodniopomorski/oplaty-skarbowe"]}}}/*/PAY*/;
  /* g: city coordinates for geolocation and distances; note: city-specific remark */
  var CITIES = {
    warszawa: { n: 'Варшава', loc: 'в Варшаве', vo: 'mazowieckie', g: [52.2297, 21.0122] },
    gdansk: { n: 'Гданьск', loc: 'в Гданьске', vo: 'pomorskie', g: [54.352, 18.6466] },
    gdynia: { n: 'Гдыня', loc: 'в Гдыне', vo: 'pomorskie', g: [54.5189, 18.5305] },
    wroclaw: { n: 'Вроцлав', loc: 'во Вроцлаве', vo: 'dolnoslaskie', g: [51.1079, 17.0385], note: 'Во Вроцлаве карту выдают по записи на kartypobytu.duw.pl. Запись на визиты через wizyta.duw.pl с 27.04.2026 приостановлена.' },
    krakow: { n: 'Краков', loc: 'в Кракове', vo: 'malopolskie', g: [50.0647, 19.945] },
    bialystok: { n: 'Белосток', loc: 'в Белостоке', vo: 'podlaskie', g: [53.1325, 23.1688] },
    poznan: { n: 'Познань', loc: 'в Познани', vo: 'wielkopolskie', g: [52.4064, 16.9252] },
    lodz: { n: 'Лодзь', loc: 'в Лодзи', vo: 'lodzkie', g: [51.7592, 19.456] },
    lublin: { n: 'Люблин', loc: 'в Люблине', vo: 'lubelskie', g: [51.2465, 22.5684] },
    katowice: { n: 'Катовице', loc: 'в Катовице', vo: 'slaskie', g: [50.2649, 19.0238] },
    szczecin: { n: 'Щецин', loc: 'в Щецине', vo: 'zachodniopomorskie', g: [53.4285, 14.5528] },
    bydgoszcz: { n: 'Быдгощ', loc: 'в Быдгоще', vo: 'kujawsko', g: [53.1235, 18.0084] },
    torun: { n: 'Торунь', loc: 'в Торуни', vo: 'kujawsko', g: [53.0138, 18.5984] },
    olsztyn: { n: 'Ольштын', loc: 'в Ольштыне', vo: 'warminsko', g: [53.7784, 20.4801] },
    rzeszow: { n: 'Жешув', loc: 'в Жешуве', vo: 'podkarpackie', g: [50.0412, 21.9991] },
    opole: { n: 'Ополе', loc: 'в Ополе', vo: 'opolskie', g: [50.6751, 17.9213] },
    kielce: { n: 'Кельце', loc: 'в Кельце', vo: 'swietokrzyskie', g: [50.8661, 20.6286] },
    zielonagora: { n: 'Зелёна-Гура', loc: 'в Зелёна-Гуре', vo: 'lubuskie', g: [51.9356, 15.5062] },
    gorzow: { n: 'Гожув-Велькопольски', loc: 'в Гожуве-Велькопольском', vo: 'lubuskie', g: [52.7368, 15.2288] }
  };
  var CITY_ORDER = Object.keys(CITIES).sort(function (a, b) { return CITIES[a].n.localeCompare(CITIES[b].n, 'ru'); });
  var HUBS = ['warszawa', 'gdansk', 'krakow', 'wroclaw', 'poznan', 'bialystok'];
  var geoBusy = false, geoErr = '';
  var DIST = { 'gdansk-warszawa': 340, 'gdansk-wroclaw': 480, 'gdansk-krakow': 590, 'warszawa-wroclaw': 345, 'warszawa-krakow': 295, 'wroclaw-krakow': 270 };

  /* stroke icons from the brand set (24px grid, 1.5 stroke); colour follows the text */
  var ICONS = {
    "mine": "<path d=\"M12 13C14.7614 13 17 10.7614 17 8C17 5.23858 14.7614 3 12 3C9.23858 3 7 5.23858 7 8C7 10.7614 9.23858 13 12 13ZM12 13C14.1217 13 16.1566 13.8429 17.6569 15.3431C19.1571 16.8434 20 18.8783 20 21M12 13C9.87827 13 7.84344 13.8429 6.34315 15.3431C4.84285 16.8434 4 18.8783 4 21\" />",
    "leg": "<path d=\"M12 3V21M19 8L22 16C21.1345 16.6491 20.0819 17 19 17C17.9181 17 16.8655 16.6491 16 16L19 8ZM19 8V7M3 7H4C6.79039 7 9.53789 6.31313 12 5C14.4621 6.31313 17.2096 7 20 7H21M5 8L8 16C7.13452 16.6491 6.08185 17 5 17C3.91815 17 2.86548 16.6491 2 16L5 8ZM5 8V7M7 21H17\" />",
    "news": "<path d=\"M15 18H10M18 14H10M4 22H20C20.5304 22 21.0391 21.7893 21.4142 21.4142C21.7893 21.0391 22 20.5304 22 20V4C22 3.46957 21.7893 2.96086 21.4142 2.58579C21.0391 2.21071 20.5304 2 20 2H8C7.46957 2 6.96086 2.21071 6.58579 2.58579C6.21071 2.96086 6 3.46957 6 4V9M4 22C4.53043 22 5.03914 21.7893 5.41421 21.4142C5.78929 21.0391 6 20.5304 6 20V9M4 22C3.46957 22 2.96086 21.7893 2.58579 21.4142C2.21071 21.0391 2 20.5304 2 20V11C2 10.4696 2.21071 9.96086 2.58579 9.58579C2.96086 9.21071 3.46957 9 4 9H6M11 6H17C17.5523 6 18 6.44772 18 7V9C18 9.55228 17.5523 10 17 10H11C10.4477 10 10 9.55228 10 9V7C10 6.44772 10.4477 6 11 6Z\" />",
    "bel": "<g> <path d=\"M1.99998 6.99999L6.99999 12M6.99999 12L12 17M6.99999 12L12 6.99999M6.99999 12L2 17M12 17L17 22M12 17L17 12M12 17L7.00001 22M17 1.99998L12 6.99999M12 6.99999L6.99999 1.99998M12 6.99999L17 12M17 12L22 17M17 12L22 6.99999\" /> <rect stroke=\"none\" x=\"12.1213\" width=\"2\" height=\"2\" rx=\"0.2\" transform=\"rotate(45 12.1213 0)\" fill=\"currentColor\"/> <rect stroke=\"none\" x=\"24.2426\" y=\"12.1213\" width=\"2\" height=\"2\" rx=\"0.2\" transform=\"rotate(135 24.2426 12.1213)\" fill=\"currentColor\"/> <rect stroke=\"none\" x=\"12.1213\" y=\"21.4142\" width=\"2\" height=\"2\" rx=\"0.2\" transform=\"rotate(45 12.1213 21.4142)\" fill=\"currentColor\"/> <rect stroke=\"none\" x=\"2.82843\" y=\"12.1213\" width=\"2\" height=\"2\" rx=\"0.2\" transform=\"rotate(135 2.82843 12.1213)\" fill=\"currentColor\"/> </g>",
    "money": "<path d=\"M19 7V4C19 3.73478 18.8946 3.48043 18.7071 3.29289C18.5196 3.10536 18.2652 3 18 3H5C4.46957 3 3.96086 3.21071 3.58579 3.58579C3.21071 3.96086 3 4.46957 3 5M19 7H5C4.46957 7 3.96086 6.78929 3.58579 6.41421C3.21071 6.03914 3 5.53043 3 5M19 7H20C20.2652 7 20.5196 7.10536 20.7071 7.29289C20.8946 7.48043 21 7.73478 21 8V12M3 5V19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H20C20.2652 21 20.5196 20.8946 20.7071 20.7071C20.8946 20.5196 21 20.2652 21 20V16M21 12H18C17.4696 12 16.9609 12.2107 16.5858 12.5858C16.2107 12.9609 16 13.4696 16 14C16 14.5304 16.2107 15.0391 16.5858 15.4142C16.9609 15.7893 17.4696 16 18 16H21M21 12C21.2652 12 21.5196 12.1054 21.7071 12.2929C21.8946 12.4804 22 12.7348 22 13V15C22 15.2652 21.8946 15.5196 21.7071 15.7071C21.5196 15.8946 21.2652 16 21 16\" />",
    "bank": "<path d=\"M10 18V11M14 18V11M18 18V11M3 22H21M6 18V11M11.119 2.205C11.3932 2.07046 11.6946 2.0005 12 2.0005C12.3054 2.0005 12.6068 2.07046 12.881 2.205L20.721 6.051C20.8225 6.10075 20.9042 6.18344 20.9527 6.28558C21.0012 6.38772 21.0136 6.50328 20.988 6.6134C20.9623 6.72352 20.9001 6.8217 20.8115 6.89191C20.7229 6.96212 20.6131 7.00023 20.5 7H3.5C3.38702 7 3.27737 6.96174 3.18892 6.89144C3.10047 6.82115 3.03843 6.72298 3.01292 6.61292C2.9874 6.50285 2.99992 6.3874 3.04842 6.28536C3.09692 6.18332 3.17855 6.10071 3.28 6.051L11.119 2.205Z\" />",
    "car": "<path d=\"M19 17H21C21.6 17 22 16.6 22 16V13C22 12.1 21.3 11.3 20.5 11.1C18.7 10.6 16 10 16 10C16 10 14.7 8.6 13.8 7.7C13.3 7.3 12.7 7 12 7H5C4.4 7 3.9 7.4 3.6 7.9L2.2 10.8C2.06758 11.1862 2 11.5917 2 12V16C2 16.6 2.4 17 3 17H5M19 17C19 18.1046 18.1046 19 17 19C15.8954 19 15 18.1046 15 17M19 17C19 15.8954 18.1046 15 17 15C15.8954 15 15 15.8954 15 17M5 17C5 18.1046 5.89543 19 7 19C8.10457 19 9 18.1046 9 17M5 17C5 15.8954 5.89543 15 7 15C8.10457 15 9 15.8954 9 17M9 17H15\" />",
    "baby": "<path d=\"M10 16C10.5 16.3 11.2 16.5 12 16.5C12.8 16.5 13.5 16.3 14 16M15 12H15.01M19.38 6.813C20.0811 7.8324 20.5645 8.9854 20.8 10.2C21.1381 10.3638 21.4233 10.6195 21.6229 10.9378C21.8224 11.2562 21.9282 11.6243 21.9282 12C21.9282 12.3757 21.8224 12.7438 21.6229 13.0622C21.4233 13.3805 21.1381 13.6362 20.8 13.8C20.3683 15.8135 19.2592 17.618 17.6577 18.9125C16.0562 20.207 14.0592 20.9132 12 20.9132C9.94076 20.9132 7.94379 20.207 6.34231 18.9125C4.74083 17.618 3.63171 15.8135 3.2 13.8C2.86186 13.6362 2.57668 13.3805 2.37714 13.0622C2.17761 12.7438 2.07178 12.3757 2.07178 12C2.07178 11.6243 2.17761 11.2562 2.37714 10.9378C2.57668 10.6195 2.86186 10.3638 3.2 10.2C3.61426 8.1705 4.71589 6.34602 6.31902 5.03437C7.92216 3.72271 9.92866 3.00418 12 3C14 3 15.5 4.1 15.5 5.5C15.5 6.9 14.6 8 13.5 8C12.7 8 12 7.6 12 7M9 12H9.01\" />",
    "house": "<path d=\"M12.681 4.23999L13.515 3.52499C13.7773 3.30167 14.1105 3.17903 14.455 3.17903C14.7995 3.17903 15.1327 3.30167 15.395 3.52499L20.485 7.88899C20.6467 8.0254 20.7766 8.19554 20.8655 8.38746C20.9545 8.57938 21.0004 8.78845 21 8.99999V15.546C21.0006 15.8523 20.9041 16.1509 20.7244 16.399C20.5448 16.6471 20.2912 16.8319 20 16.927M7.41001 20.546V16.546C7.41001 16.2808 7.51536 16.0264 7.7029 15.8389C7.89044 15.6513 8.14479 15.546 8.41001 15.546H10.41C10.6752 15.546 10.9296 15.6513 11.1171 15.8389C11.3046 16.0264 11.41 16.2808 11.41 16.546V20.546M15.485 11.889C15.6467 12.0254 15.7766 12.1955 15.8655 12.3875C15.9545 12.5794 16.0004 12.7885 16 13V19.546C16 19.9316 15.8468 20.3014 15.5741 20.5741C15.3015 20.8468 14.9316 21 14.546 21H4.36401C3.97838 21 3.60855 20.8468 3.33587 20.5741C3.06319 20.3014 2.91001 19.9316 2.91001 19.546V13C2.90961 12.7885 2.9555 12.5794 3.04447 12.3875C3.13344 12.1955 3.26332 12.0254 3.42501 11.889L8.51501 7.52499C8.7773 7.30167 9.11052 7.17903 9.45501 7.17903C9.79949 7.17903 10.1327 7.30167 10.395 7.52499L15.485 11.889Z\" />",
    "help": "<path d=\"M12.409 5.82401L9.586 8.58601C9.21106 8.96106 9.00043 9.46968 9.00043 10C9.00043 10.5303 9.21106 11.039 9.586 11.414C9.96106 11.7889 10.4697 11.9996 11 11.9996C11.5303 11.9996 12.0389 11.7889 12.414 11.414L14.124 9.70401C14.3478 9.48011 14.6135 9.30249 14.906 9.18131C15.1985 9.06013 15.5119 8.99776 15.8285 8.99776C16.1451 8.99776 16.4585 9.06013 16.751 9.18131C17.0435 9.30249 17.3092 9.48011 17.533 9.70401L19.414 11.586C19.7889 11.9611 19.9996 12.4697 19.9996 13C19.9996 13.5303 19.7889 14.039 19.414 14.414C21 12.828 22 11.5 22 9.50001C22 8.38721 21.6624 7.30059 21.0319 6.38367C20.4013 5.46675 19.5075 4.76266 18.4684 4.36441C17.4293 3.96615 16.2938 3.89245 15.212 4.15305C14.1301 4.41365 13.1528 4.99629 12.409 5.82401ZM19.414 14.414C19.2168 14.6113 18.9826 14.7677 18.7249 14.8745C18.4672 14.9813 18.191 15.0362 17.912 15.0362C17.633 15.0362 17.3568 14.9813 17.0991 14.8745C16.8743 14.7814 16.6675 14.6505 16.4874 14.4876M12.409 5.82401C12.2981 5.92761 12.152 5.98532 12.0002 5.98551C11.8484 5.98569 11.7022 5.92834 11.591 5.82501C10.8473 4.99735 9.87002 4.41474 8.78826 4.15411C7.7065 3.89348 6.57112 3.96709 5.53208 4.36523C4.49303 4.76336 3.59917 5.46729 2.96856 6.38405C2.33794 7.30082 2.00022 8.38729 2 9.50001C2 11.8 3.5 13.5 5 15L10.535 20.362C10.718 20.5588 10.9389 20.7167 11.1843 20.8263C11.4297 20.9359 11.6947 20.9948 11.9635 20.9997C12.2322 21.0045 12.4991 20.9552 12.7484 20.8545C12.9976 20.7539 13.224 20.6041 13.414 20.414C13.6109 20.2169 13.767 19.9828 13.8733 19.7253C13.9797 19.4678 14.0342 19.1918 14.0339 18.9132C14.0335 18.6346 13.9782 18.3587 13.8712 18.1015C13.7783 17.8784 13.6481 17.673 13.4864 17.4942M13.4864 17.4942C13.4617 17.4668 13.4362 17.4401 13.41 17.414C13.4348 17.4414 13.4603 17.4682 13.4864 17.4942ZM13.4864 17.4942C13.6638 17.6709 13.8712 17.815 14.0993 17.9197C14.3609 18.0399 14.6443 18.1055 14.9321 18.1128C15.2199 18.12 15.5062 18.0686 15.7735 17.9618C16.0409 17.855 16.2837 17.6949 16.4873 17.4913C16.6909 17.2877 16.851 17.0449 16.9578 16.7775C17.0646 16.5102 17.116 16.2239 17.1087 15.9361C17.1015 15.6483 17.0358 15.3649 16.9157 15.1033C16.8105 14.874 16.6654 14.6656 16.4874 14.4876M16.4874 14.4876C16.4623 14.4625 16.4365 14.4379 16.41 14.414C16.4352 14.4392 16.461 14.4638 16.4874 14.4876Z\" />",
    "voc": "<path d=\"M4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2H19C19.2652 2 19.5196 2.10536 19.7071 2.29289C19.8946 2.48043 20 2.73478 20 3V17M4 19.5C4 20.163 4.26339 20.7989 4.73223 21.2678C5.20107 21.7366 5.83696 22 6.5 22H19C19.2652 22 19.5196 21.8946 19.7071 21.7071C19.8946 21.5196 20 21.2652 20 21V17M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20M8 13L12 6L16 13M9.1 11H14.8\" />",
    "cal": "<path d=\"M8 2V5M16 2V5M3 9H21M5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3Z\" />",
    "loc": "<path d=\"M20 10C20 14.993 14.461 20.193 12.601 21.799C12.4277 21.9293 12.2168 21.9998 12 21.9998C11.7832 21.9998 11.5723 21.9293 11.399 21.799C9.539 20.193 4 14.993 4 10C4 7.87827 4.84285 5.84344 6.34315 4.34315C7.84344 2.84285 9.87827 2 12 2C14.1217 2 16.1566 2.84285 17.6569 4.34315C19.1571 5.84344 20 7.87827 20 10ZM15 10C15 11.6569 13.6569 13 12 13C10.3431 13 9 11.6569 9 10C9 8.34315 10.3431 7 12 7C13.6569 7 15 8.34315 15 10Z\" />"
  };
  /* 18px service icons (1.125 stroke): passport, expand, collapse */
  var ICONS18 = {
    pass: '<path d="M9.75 14.25C9.75 13.4544 9.43393 12.6913 8.87132 12.1287C8.30871 11.5661 7.54565 11.25 6.75 11.25M6.75 11.25C5.95435 11.25 5.19129 11.5661 4.62868 12.1287C4.06607 12.6913 3.75 13.4544 3.75 14.25M6.75 11.25C7.99264 11.25 9 10.2426 9 9C9 7.75736 7.99264 6.75 6.75 6.75C5.50736 6.75 4.5 7.75736 4.5 9C4.5 10.2426 5.50736 11.25 6.75 11.25ZM12 7.5H13.5M12 10.5H13.5M3 3.75H15C15.8284 3.75 16.5 4.42157 16.5 5.25V12.75C16.5 13.5784 15.8284 14.25 15 14.25H3C2.17157 14.25 1.5 13.5784 1.5 12.75V5.25C1.5 4.42157 2.17157 3.75 3 3.75Z"/>',
    expand: '<path d="M5.25 11.25L9 15L12.75 11.25M5.25 6.75L9 3L12.75 6.75"/>',
    collapse: '<path d="M5.25 15L9 11.25L12.75 15M5.25 3L9 6.75L12.75 3"/>'
  };
  function svg18(k, sz, cls) { return '<svg class="pb-i' + (cls ? ' ' + cls : '') + '" width="' + (sz || 18) + '" height="' + (sz || 18) + '" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS18[k] + '</svg>'; }
  function svgi(k, sz) { return '<svg class="pb-i" width="' + (sz || 24) + '" height="' + (sz || 24) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[k] + '</svg>'; }
  /* screens: one per menu item; k is the short address (#legal), id the section element */
  var SECTIONS = [
    { k: 'me', p: '', id: 'pl-me', n: 'Своё', ic: 'mine' },
    { k: 'legal', p: 'legalizacja', id: 'pl-legal', n: 'Легализация', ic: 'leg' },
    { k: 'news', p: 'aktualnosci', id: 'pl-news', n: 'Новости', ic: 'news' },
    { k: 'by', p: 'bialorusini', id: 'pl-by', n: 'Беларусам', ic: 'bel' },
    { k: 'money', p: 'pieniadze', id: 'pl-money', n: 'Бабки', ic: 'money' },
    { k: 'bank', p: 'banki', id: 'pl-bank', n: 'Банки', ic: 'bank' },
    { k: 'kids', p: 'dzieci', id: 'pl-kids', n: 'Дети', ic: 'baby' },
    { k: 'home', p: 'dom', id: 'pl-home', n: 'Дом', ic: 'house' },
    { k: 'auto', p: 'auto', id: 'pl-auto', n: 'Авто', ic: 'car' },
    { k: 'help', p: 'pomoc', id: 'pl-help', n: 'Хелп', ic: 'help' },
    { k: 'dict', p: 'slownik', id: 'pl-dict', n: 'Словарь', ic: 'voc' }
  ];
  /* old addresses from links and bookmarks */
  var SCREEN_ALIAS = { 'pl-svoi': 'help', 'pl-life': 'help', 'pl-lyrics': 'me', 'pl-avg': 'me', 'pl-top': 'me', svoi: 'help', life: 'help' };
  /* a short line above the picture in the menu column; for sections these are placeholders until real descriptions are written */
  var SDESC = { me: 'Стараюсь дать максимально много информации, но без гарантий (как любой помогатор)', legal: 'ВНЖ, ПМЖ и паспорт по шагам', news: 'Что изменилось в законах и правилах, свежее сверху', by: 'То, чего нет в общих гайдах',
    money: 'Цифры на 2026. Каждый январь всё дорожает, кроме тебя', bank: 'Кто как относится к беларусам', kids: 'PESEL, сад, школа, 800+', home: 'Ипотека в цифрах, сколько дадут и аренда', auto: 'Топливо, поездки, права и номера', help: 'Бесплатная помощь, официальные сайты и быт без паники', dict: 'Слова, без которых ни одно письмо не читается' };

  var STAGES = [
    { id: 'arrive', n: 'Только приехал', next: [['Сделай PESEL и profil zaufany: без них не подписать заявление в MOS', '#pl-d-d30', 'c:d30_pesel,d30_pz'], ['Выбери основание для ВНЖ и подай, пока виза или безвиз действуют', '#pl-legal', 's:vnzh2'], ['Найди бесплатную юрпомощь своего города в разделе «Хелп»', '#help', 'c:d30_tg']] },
    { id: 'wait', n: 'Подал, жду', next: [['Сохрани UPO и следи за письмами: вызов на отпечатки придёт сам', '#pl-legal', 's:vnzh2'], ['Посчитай, сколько ты уже ждёшь, в таймере ожидания', '#pl-legal', 'f:filed'], ['Не уезжай из Польши без действующей карты или визы', '#pl-legal']] },
    { id: 'vnzh', n: 'Есть ВНЖ', next: [['Поставь в календарь дату окончания карты и подай заранее', '#pl-legal', 'f:cardExp'], ['Начни считать выезды: для ПМЖ важен каждый день', '#pl-legal', 't'], ['Обменяй права: беларусские действуют 6 месяцев после ВНЖ', '#pl-auto']] },
    { id: 'pmzhw', n: 'Подал на ПМЖ', next: [['Сохрани UPO и zaświadczenie из MOS: с ними ты легален до решения', '#pl-legal', 's:pmzh4'], ['Посчитай, сколько ждёшь ПМЖ, в «Своё»', '#', 'f:pmzhFiled'], ['Проверь срок паспорта. Истёк: беларусам дают polski dokument podróży', '#pl-legal', 'f:passExp']] },
    { id: 'pmzh', n: 'Есть ПМЖ', next: [['Посчитай дату, с которой можно на гражданство', '#pl-legal', 'f:staly'], ['Готовь доход и жильё на бумаге: их проверят', '#pl-legal', 's:paszport3'], ['Следи за законом о гражданстве: сроки хотят увеличить', '#pl-news']] },
    { id: 'pass', n: 'Иду на паспорт', next: [['Uznanie у воеводы: 1000 zł, решение по закону за 6 месяцев', '#pl-legal', 's:paszport4'], ['Проверь, что выездов дольше 6 месяцев не было', '#pl-legal', 't'], ['Расскажи своим, когда получишь: это праздник', '#help']] },
    { id: 'citizen', n: 'Есть паспорт', next: [['Сделай dowód osobisty: очередь та же, но теперь ты в ней как гражданин', '#pl-legal', 's:paszport5'], ['Сходи на выборы: теперь в твоих проблемах можно винить и себя', '#pl-news'], ['Помоги новеньким: теперь ты тот самый знакомый, который всё знает', '#help']] }
  ];

  var NEWS = [
    { d: '24.08.2026', t: 'Протест иностранцев у Мазовецкого ужонда. Средний срок по ВНЖ на Мазовше вырос до 394 дней, в 2023 году было 153.', tag: 'Сроки', u: 'https://warszawa.naszemiasto.pl/mieli-czekac-60-dni-a-czekaja-nawet-2-lata-tlum-obcokrajowcow-wyszedl-na-ulice-warszawy-urzad-milczy-moge-stracic-prace/ar/c1p2-29291631', s: 'naszemiasto.pl' },
    { d: '27.07.2026', t: 'MSWiA ответило на интерпелляцию 18089: на 6.07.2026 ВНЖ быстрее всего в Małopolskie, 242 дня, дольше всего в Śląskie, 658. На Мазовше ПМЖ ждут в среднем 239 дней, rezydenta UE 423.', tag: 'Сроки', u: 'https://api.sejm.gov.pl/sejm/term10/interpellations/18089/reply/DWDJHZ/body', s: 'sejm.gov.pl' },
    { d: '06.07.2026', t: 'MSWiA: в Pomorskie на временный ВНЖ в среднем уходит 598 дней. Дольше только в Śląskie, 658.', tag: 'Сроки', u: 'https://dziennikbaltycki.pl/cudzoziemcy-czekaja-miesiacami-na-legalizacje-pobytu-a-nadchodzi-kolejna-fala-wnioskow-wojewodztwo-pomorskie-ma-problem/ar/c1p2-29401689', s: 'dziennikbaltycki.pl' },
    { d: '01.06.2026', t: '800+ для иностранцев только при работе или другой активности. Ребёнок должен учиться в Польше, кроме детей до 6 лет.', tag: 'Деньги', u: 'https://finanse.wp.pl/zmiany-dla-cudzoziemcow-od-1-czerwca-zus-wyjasnia-7292105621981504a', s: 'wp.pl' },
    { d: '13.05.2026', t: 'MSWiA готовит новые правила гражданства: минимум 8 лет в Польше, тест, высокий уровень польского.', tag: 'Проект', u: 'https://forsal.pl/kraj/aktualnosci/artykuly/11246150,dla-kogo-polskie-obywatelstwo-mswia-przygotowuje-zmiany-w-prawie.html', s: 'forsal.pl' },
    { d: '12.05.2026', t: 'Проект UD408: временный ВНЖ «молчаливым согласием» через 60 дней. Только для граждан стран с безвизом в ЕС, Беларусь в их число не входит. Правительство планирует принять проект в III квартале 2026.', tag: 'Проект', u: 'https://www.gov.pl/web/premier/projekt-ustawy-o-zmianie-ustawy-o-cudzoziemcach', s: 'gov.pl' },
    { d: '27.04.2026', t: 'MOS 2: заявления на ВНЖ, ПМЖ и rezydenta UE только онлайн. Красный штамп заменило zaświadczenie. Старый портал закрыли 17.04.2026 вместе с аккаунтами.', tag: 'Закон', red: 1, u: 'https://zielonalinia.gov.pl/mos-czyli-elektroniczne-skladanie-niektorych-wnioskow-pobytowych/', s: 'zielonalinia.gov.pl' },
    { d: '05.03.2026', t: 'При отказе или прекращении дела пошлину больше не возвращают.', tag: 'Закон', u: 'https://www.gov.pl/web/uw-warminsko-mazurski/oplaty', s: 'gov.pl' },
    { d: '01.02.2026', t: 'UdSC: 142 737 беларусов с действующими документами на пребывание. Из них 87 219 с временным ВНЖ, 41 721 с ПМЖ, 10 044 с дополнительной защитой.', tag: 'Цифры', u: 'https://www.gov.pl/attachment/4738d4ca-beae-459f-b0bb-2db8f2da7ac2', s: 'gov.pl' },
    { d: '09.01.2026', t: 'Сейм отклонил проект о 10 годах на ПМЖ перед гражданством. Пока действуют старые правила.', tag: 'Закон', u: 'https://grantthornton.pl/publikacja/zatrudnianie-cudzoziemcow-2026-sejm-odrzucil-zmiany-w-obywatelstwie/', s: 'grantthornton.pl' },
    { d: '04.12.2025', t: 'PKO: беларусы без карты побыту, открывшие счёт после 24.10.2025, теряют онлайн-банкинг, BLIK и карту. Основание: санкционный регламент ЕС 2025/2041.', tag: 'Банки', u: 'https://www.pkobp.pl/aktualnosci/informacja-dla-obywateli-bialorusi-i-rosji-ktorzy-otworzyli-konta-w-pko-banku-polskim-po-24102025-r-bez-karty-pobytu', s: 'pkobp.pl' },
    { d: '01.08.2025', t: 'Новые пошлины за гражданство: 1000 zł за uznanie, 1669 zł за nadanie.', tag: 'Закон', u: 'https://www.gov.pl/web/uw-lubelski/obywatelstwo-i-repatriacja', s: 'gov.pl' },
    { d: '01.07.2024', t: 'Авто на беларусских номерах нельзя ввозить в ЕС. Исключение: личная машина, владелец за рулём или в салоне, у него виза или ВНЖ.', tag: 'Авто', u: 'https://www.gov.pl/web/kas/nowe-zasady-przywozu-samochodow-osobowych-zarejestrowanych-na-bialorusi', s: 'gov.pl/web/kas' }
  ].sort(function (a, b) { var p = function (s) { var x = s.split('.'); return x[2] + x[1] + x[0]; }; return p(b.d) < p(a.d) ? -1 : 1; });

  var LEGAL = {
    vnzh: { tab: 'ВНЖ', code: '01 · Karta pobytu czasowego', title: 'Временный вид на жительство', sub: 'До 3 лет. Продлевается, пока не надоест.', irony: 'Самый длинный квест игры. Сохраняйся чаще.',
      fees: [['Работа', '440 zł'], ['Другое', '340 zł'], ['Карта', '100 zł']],
      steps: [
        { t: 'Выбрать основание', s: 'От него зависит всё остальное', b: ['Работа (jednolite zezwolenie na pobyt i pracę), бизнес (JDG или sp. z o.o.), учёба, семья или Karta Polaka. Основание должно быть реальным на момент подачи и дожить до решения.'], docs: ['Договор с работодателем или документы бизнеса', 'Справка из вуза, если учёба', 'Документы о браке или родстве, если семья'], warn: 'Потерял работу: письменно сообщи воеводе в течение 15 рабочих дней. Тогда у тебя есть 30 дней на новую работу, и ВНЖ не отзовут.', src: [['https://zielonalinia.gov.pl/zezwolenie-jednolite-wazny-obowiazek-cudzoziemca/', 'zielonalinia.gov.pl']] },
        { t: 'PESEL и profil zaufany', s: 'Без подписи MOS не пустит', b: ['С 27.04.2026 заявление подаётся только онлайн через MOS 2. Подписать его можно профилем zaufany, квалифицированной подписью или podpisem osobistym, но он есть только в польском e-dowodzie. Иностранцу обычно остаётся profil zaufany.', 'PESEL при визе или временном ВНЖ дают только по заявлению, где указано, зачем он нужен. Это бесплатно, подаётся в urzędzie gminy, работодатель за тебя подать не может. Дальше profil zaufany проще всего сделать через свой банк.'], docs: ['PESEL', 'Profil zaufany', 'Почта, которую ты правда читаешь'], src: [['https://www.gov.pl/web/udsc/mos-qa', 'gov.pl/web/udsc'], ['https://zielonalinia.gov.pl/kiedy-cudzoziemiec-moze-uzyskac-numer-pesel/', 'zielonalinia.gov.pl']] },
        { t: 'Заполнить и отправить в MOS', s: 'UPO храни как паспорт', b: ['Работодатель подписывает Załącznik nr 1 по ссылке из письма, ссылка живёт 30 дней. Черновик хранится 45 дней с последней правки. После отправки скачай UPO: письма на почту не будет.'], docs: ['Скан всех страниц паспорта', 'Фото', 'Пошлина 440 zł (работа) или 340 zł (другое)', 'Страховка: ZUS или частная', 'Подтверждение жилья', 'Załącznik nr 1 от работодателя'], warn: 'Подать нужно, пока ты легален. Если MOS лежит в твой последний день, есть 3 рабочих дня после восстановления. С 5.03.2026 при отказе пошлину не возвращают.' },
        { t: 'Вызов на отпечатки', s: 'Записаться нельзя, жди письмо', b: ['Воевода сам назначит дату. На месте: отпечатки, образец подписи, оригинал паспорта и, возможно, braki formalne. После проверки в MOS появится zaświadczenie, оно заменило старый красный штамп.'], docs: ['Оригинал паспорта', 'Wezwanie', 'Оригиналы приложенных документов'], tip: 'Zaświadczenie подтверждает легальное пребывание, но по Шенгену с ним не ездят.' },
        { t: 'Ждать', s: 'Таймер ниже', b: ['По закону решение за 60 дней. На деле сроки приостановлены до 4.03.2027 (art. 100d), а в среднем ждут <b data-bind="wait"></b> <span data-bind="dayword"></span> <span data-bind="loc"></span>.'], docs: ['UPO и zaświadczenie', 'Вся переписка с ужондом', 'Ответы на braki в срок из письма'], warn: 'Выезд из Польши без действующей карты или визы: обратно могут не пустить.' },
        { t: 'Децизия и карта', s: 'Пластик отдельно и позже', b: ['Сначала decyzja, потом карта. За карту 100 zł. Карта временного пребывания выдаётся на срок до 3 лет.', '<span data-bind="cityNote"></span>'], docs: ['Оплатить 100 zł за карту', 'Паспорт', 'Decyzja'] }
      ] },
    pmzh: { tab: 'ПМЖ', code: '02 · Stały pobyt / Rezydent UE', title: 'Постоянный вид на жительство', sub: 'Бессрочно. Пластик меняется, статус остаётся.', irony: 'Ачивка: больше не надо продлевать каждые три года.',
      fees: [['Rezydent UE / stały', '640 zł'], ['Karta Polaka', '0 zł'], ['Карта', '100 zł']],
      /* steps follow the chosen ground (PM_PATHS); p._ is the text for every ground not listed */
      steps: [
        { t: 'Выбрать основание', p: {
          rd: { s: 'Rezydent długoterminowy UE', b: ['5 лет легально и без перерывов прямо перед подачей, стабильный доход за последние 3 года, медстраховка, жильё и польский B1.'] },
          kp: { s: 'Stały pobyt по Karcie Polaka', b: ['Нужны действующая Karta Polaka и намерение жить в Польше постоянно. Стаж в Польше не нужен, пошлины за заявление нет.'] },
          orig: { s: 'Stały pobyt по происхождению', b: ['Родитель, дед или бабушка либо двое прадедов польской национальности, ты сохраняешь польскость и собираешься жить в Польше постоянно.'] },
          mar: { s: 'Stały pobyt по браку', b: ['Брак с гражданином Польши не меньше 3 лет, и прямо перед подачей не меньше 2 лет непрерывно в Польше на ВНЖ по браку или со статусом защиты.'] },
          prot: { s: 'Stały pobyt после защиты', b: ['5 лет непрерывно в Польше со статусом беженца, ochroną uzupełniającą или zgodą na pobyt humanitarny прямо перед подачей.'] },
          kid: { s: 'Stały pobyt для ребёнка', b: ['Ребёнок гражданина Польши под его родительской властью. Или ребёнок иностранца с ПМЖ, родившийся после того, как родитель получил ПМЖ, или во время его ВНЖ.'] }
        }, src: [['https://lexlege.pl/ustawa-o-cudzoziemcach/art-195/', 'art. 195'], ['https://lexlege.pl/ustawa-o-cudzoziemcach/art-211/', 'art. 211']] },
        { t: 'Проверить срок', p: {
          rd: { s: '5 лет, выезды 6 и 10 месяцев', b: ['Один выезд не дольше 6 месяцев, все вместе не больше 10 месяцев за 5 лет. Учёба засчитывается наполовину, делегирование и некоторые визы не засчитываются. Посчитай в калькуляторе ниже.'], docs: ['Список выездов с датами', 'Прежние решения, карты и визы за 5 лет'], tip: 'Командировки от польского работодателя в лимит не входят, но их надо подтвердить.', src: [['https://zielonalinia.gov.pl/zezwolenie-na-pobyt-rezydenta-dlugoterminowego-ue-a-piecioletni-pobyt/', 'zielonalinia.gov.pl']] },
          mar: { s: '3 года брака, 2 года здесь', b: ['Считаются 2 года непрерывно прямо перед подачей. Перерывы те же: один выезд до 6 месяцев, все вместе до 10.'], docs: ['Решения о ВНЖ по браку за 2 года', 'Список выездов с датами'] },
          prot: { s: '5 лет со статусом', b: ['Считаются 5 лет непрерывно прямо перед подачей, время процедуры о защите тоже. Перерывы: один выезд до 6 месяцев, все вместе до 10. Посчитай в калькуляторе ниже.'], docs: ['Список выездов с датами'] },
          _: { s: 'Срок не нужен', b: ['Для этого основания стаж в Польше не требуется. Главное подать, пока ты здесь легально.'] }
        } },
        { t: 'Польский', p: {
          rd: { s: 'B1 или польский диплом', b: ['Подходит государственный сертификат B1 или выше, świadectwo польской школы в Польше, диплом вуза с обучением на польском или школа за границей с польским языком обучения. Policealna не подходит. С детей до 16 лет не требуют.'], docs: ['Сертификат B1 (certyfikatpolski.pl) или польский аттестат либо диплом'] },
          _: { s: 'Сертификат не нужен', b: ['Для stały pobyt сертификат польского не требуют. В ужонде, правда, всё равно говорят по-польски.'] }
        } },
        { t: 'Собрать документы', p: {
          rd: { s: 'Доход, жильё, страховка', b: ['Доход за 3 года и сейчас: выше 1 010 zł netto в месяц на одного или выше 823 zł на каждого члена семьи. Документы на других языках нужны с переводом присяжного переводчика.'],
            docs: ['Паспорт: скан всех страниц', 'Фото в цифровом виде', 'PIT-11 от всех работодателей и годовые PIT с UPO за 3 года', 'ZUS RMUA или справка из ZUS', 'Договоры, аннексы и świadectwa pracy', 'Свежая справка от работодателя', 'Для JDG: документы о доходах фирмы', 'Страховка: ZUS (NFZ) или частный полис на лечение в Польше', 'Договор аренды или акт нотариальный. Umowę użyczenia обычно не принимают, кроме как от семьи', 'Свидетельства о браке и рождении, если в деле есть семья'],
            src: [['https://bip.lubuskie.uw.gov.pl/sprawy_obywatelskie/Zezw_na_pobyt_rezydenta_dlugoterm_UE', 'bip.lubuskie.uw.gov.pl'], ['https://www.gov.pl/web/uw-podlaski/zezwolenie-na-pobyt-rezydenta-dlugoterminowego-ue', 'gov.pl/web/uw-podlaski']] },
          kp: { s: 'Karta Polaka и бумаги', b: ['Список Любуского ужонда, в других воеводствах может отличаться. Документы на других языках нужны с переводом присяжного переводчика.'],
            docs: ['Паспорт: скан всех страниц', 'Фото в цифровом виде', 'Karta Polaka: оригинал покажешь на отпечатках', 'Oświadczenie o pochodzeniu (бланк на сайте ужонда)', 'Документы о намерении жить в Польше постоянно', 'Справка из urzędu skarbowego, что нет долгов по налогам'],
            src: [['https://bip.lubuskie.uw.gov.pl/sprawy_obywatelskie/zezwolenie_na_pobyt_staly_-_Karta_Polaka', 'bip.lubuskie.uw.gov.pl']] },
          orig: { s: 'Документы о предках', b: ['Документы на других языках нужны с переводом присяжного переводчика.'],
            docs: ['Паспорт: скан всех страниц', 'Фото в цифровом виде', 'Документы о польской национальности родителя, деда или бабушки либо двух прадедов', 'Подтверждения, что ты сохраняешь польскость', 'Документы о намерении жить в Польше постоянно'],
            src: [['https://www.gov.pl/web/uw-zachodniopomorski/pobyt-staly-na-terytorium-rp', 'gov.pl/web/uw-zachodniopomorski']] },
          mar: { s: 'Брак на бумаге', b: ['Документы на других языках нужны с переводом присяжного переводчика.'],
            docs: ['Паспорт: скан всех страниц', 'Фото в цифровом виде', 'Актуальный польский odpis aktu małżeństwa', 'Документ о гражданстве супруга'],
            src: [['https://www.gov.pl/web/uw-zachodniopomorski/pobyt-staly-na-terytorium-rp', 'gov.pl/web/uw-zachodniopomorski']] },
          prot: { s: 'Решения о статусе', b: ['Если паспорта нет и получить его нельзя, в обоснованных случаях принимают другой документ личности.'],
            docs: ['Паспорт или другой документ личности', 'Фото в цифровом виде', 'Решения о статусе защиты'],
            src: [['https://www.gov.pl/web/uw-zachodniopomorski/pobyt-staly-na-terytorium-rp', 'gov.pl/web/uw-zachodniopomorski']] },
          kid: { s: 'Бумаги ребёнка и родителя', b: ['Заявление за ребёнка заполняет и подписывает родитель.'],
            docs: ['Паспорт ребёнка: скан всех страниц', 'Фото в цифровом виде', 'Свидетельство о рождении', 'Документ о гражданстве или ПМЖ родителя', 'Паспорт родителя'],
            src: [['https://www.gov.pl/web/uw-zachodniopomorski/pobyt-staly-na-terytorium-rp', 'gov.pl/web/uw-zachodniopomorski']] }
        } },
        { t: 'Подать в MOS', p: {
          kp: { s: 'Без пошлины, и снова тот же ужонд', docs: ['Оплата карты 100 zł', 'UPO', 'Zaświadczenie после проверки'] },
          _: { s: '640 zł и снова тот же ужонд', docs: ['Пошлина 640 zł', 'Оплата карты 100 zł', 'UPO', 'Zaświadczenie после проверки'], warn: 'С 5.03.2026 при отказе пошлину не возвращают.' }
        }, b: ['Только онлайн через MOS 2. Нужны PESEL и profil zaufany, аккаунт заводится заново: старые закрыли 27.04.2026. Подписать заявление можешь только ты сам, pełnomocnik не может.', 'Подай не позже последнего дня легального пребывания. Если в заявлении нет недостатков или ты исправил их в срок, ты здесь легально до решения.', 'После отправки скачай UPO. Когда ужонд проверит заявление, в MOS появится zaświadczenie вместо штампа. Отправленное заявление в MOS не исправить, только бумажной корректой.'],
          src: [['https://bip.lubuskie.uw.gov.pl/sprawy_obywatelskie/Zezw_na_pobyt_rezydenta_dlugoterm_UE', 'bip.lubuskie.uw.gov.pl'], ['https://migrant.poznan.uw.gov.pl/pl/procedury/zezwolenie-na-pobyt-rezydenta-dlugoterminowego-ue', 'migrant.poznan.uw.gov.pl']] },
        { t: 'Отпечатки и карта', s: 'Больше не продлевать каждые 3 года', b: ['Вызов придёт сам: отпечатки в <span data-bind="uw"></span>, образец подписи, оригинал паспорта и оригиналы документов. Да, опять.', 'По закону решение за 6 месяцев. На деле дольше: на Мазовше ПМЖ ждут в среднем 239 дней, rezydenta UE 423.', 'Статус бессрочный, меняется только пластик.'], docs: ['Wezwanie', 'Оригинал паспорта', 'Оригиналы приложенных документов', 'Decyzja'] }
      ] },
    paszport: { tab: 'Паспорт', code: '03 · Obywatelstwo', title: 'Гражданство', sub: 'Финальный босс. Обычно около восьми лет с приезда.', irony: 'Правила игры могут поменять прямо во время игры.',
      fees: [['Uznanie', '1000 zł'], ['Nadanie', '1669 zł']],
      steps: [
        { t: 'Выбрать путь', s: 'Воевода или президент', b: ['Uznanie: решает воевода по закону, срок 6 месяцев с подачи, отказ можно обжаловать.', 'Nadanie: решает президент, без условий по стажу и без срока рассмотрения, обжаловать нельзя.'], src: [['https://www.gov.pl/web/uw-zachodniopomorski/uznanie-za-obywatela-polskiego2', 'gov.pl']] },
        { t: 'Отсидеть срок', s: '3 года, 2 или 1', b: ['На ПМЖ или rezydencie UE: 3 года при доходе и жилье; 2 года, если ты не меньше 3 лет в браке с гражданином; 1 год, если ПМЖ получен по Karcie Polaka или польскому происхождению. Есть и путь через 10 лет легального пребывания.', 'Пребывание должно быть непрерывным: длинные выезды могут обнулить счётчик.'], src: [['https://www.gov.pl/web/uw-zachodniopomorski/uznanie-za-obywatela-polskiego2', 'gov.pl']], docs: ['Карта stały pobyt или rezydent UE', 'Нет выездов дольше 6 месяцев'] },
        { t: 'B1', s: 'Тот же сертификат', b: ['Нужен официальный сертификат B1 или школьный аттестат из Польши или польской школы за границей. Если уже сдавал для ПМЖ, второй раз не нужно.'], docs: ['Państwowy certyfikat B1 или польский аттестат'] },
        { t: 'Доход и жильё', s: 'Романтика закончилась', b: ['Стабильный доход и законное жильё на бумаге.'], docs: ['Договор, справка или PIT', 'Umowa najmu или akt własności'] },
        { t: 'Подать заявление', s: '1000 zł или 1669 zł', b: ['С 1.08.2025: uznanie 1000 zł, nadanie 1669 zł. Заявление на uznanie подаётся воеводе: <span data-bind="uw"></span>.', 'Пошлину платят переводом. Счёт смотри на странице оплат своего ужонда, ссылка «пруф» в карточке «Твой ужонд» вверху раздела.'], docs: ['Wniosek', 'Пошлина', 'Биография, если nadanie'] },
        { t: 'Паспорт и dowód', s: 'Финальный босс', b: ['Дальше dowód osobisty и паспорт. Добро пожаловать в очередь, на этот раз гражданскую.'], docs: ['Решение', 'Фото', 'Заявление на dowód'] }
      ] }
  };
  var L_ORDER = ['vnzh', 'pmzh', 'paszport'];
  var PM_PATHS = [['rd', 'Rezydent UE: 5 лет в Польше'], ['kp', 'Karta Polaka'], ['orig', 'Польское происхождение'], ['mar', 'Брак с гражданином Польши'], ['prot', 'Беженец, ochrona uzupełniająca, zgoda humanitarna'], ['kid', 'Ребёнок гражданина или владельца ПМЖ']];
  function pmPath() { return PM_PATHS.some(function (x) { return x[0] === S.pmzhPath; }) ? S.pmzhPath : 'rd'; }
  /* a step as shown for the chosen PMZh ground; dk keeps document ticks separate per ground */
  function stepOf(k, i) {
    var s = LEGAL[k].steps[i]; if (!s.p) return s;
    var path = pmPath(), dk = s.p[path] ? path : '_', o = s.p[dk] || {}, r = { dk: dk };
    Object.keys(s).forEach(function (x) { if (x !== 'p') r[x] = s[x]; });
    Object.keys(o).forEach(function (x) { r[x] = o[x]; });
    return r;
  }
  function docKey(k, i, s, j) { return k + i + (s.dk || '') + 'd' + j; }
  var NEXT = { todo: 'prog', prog: 'done', done: 'todo' };
  var LBL = { todo: 'to-do', prog: 'в процессе', done: 'готово' };
  var CHECK = 'M3.75 9L7.25 12.375L14.25 5.625', DASH = 'M4.13859 8.91161L13.8613 9.08839';

  var BELARUS = [
    { ic: 'luggage', t: 'Паспорт истёк, в посольство нельзя', s: 'Polski dokument podróży dla cudzoziemca', b: ['Упрощённо для беларусов с ВНЖ на любом основании, ПМЖ, rezydentem UE, гуманитаркой или дополнительной защитой. Заявления принимают до 31.12.2026. Бесплатно, документ выдаётся на 1 год. Нужен meldunek и две биометрические фотографии.'], src: [['https://bip.lubuskie.uw.gov.pl/sprawy_obywatelskie/polski-dokument-podrozy-dla-obywateli-bialorusi', 'bip.lubuskie.uw.gov.pl']] },
    { ic: 'account_balance', t: 'Банки и санкции', s: 'Счета, карты, происхождение денег', b: ['Санкции ЕС (регламент 2025/2041): если у тебя нет карты побыту и счёт открыт после 24.10.2025, банк отключает онлайн-банкинг, BLIK и карту. Счётом можно пользоваться только в отделении. Решение: показать в банке карту побыту или другой документ на пребывание.', 'Держи документы о происхождении денег: банки обязаны проверять крупные поступления, и без бумаг перевод могут остановить.'], src: [['https://www.pkobp.pl/aktualnosci/informacja-dla-obywateli-bialorusi-i-rosji-ktorzy-otworzyli-konta-w-pko-banku-polskim-po-24102025-r-bez-karty-pobytu', 'pkobp.pl']] },
    { ic: 'verified', t: 'Karta Polaka', s: 'Короткий путь', b: ['Даёт ПМЖ, а через 1 год на ПМЖ по Karcie Polaka можно подавать на uznanie. B1 всё равно нужен.'], src: [['https://www.gov.pl/web/uw-zachodniopomorski/uznanie-za-obywatela-polskiego2', 'gov.pl']] },
    { ic: 'directions_car', t: 'Права и авто', s: '6 месяцев после ВНЖ', b: ['Беларусские права действуют 6 месяцев после получения ВНЖ или ПМЖ, дальше обмен: 100 zł, перевод присяжного, starostwo по месту жительства.', 'С 1.07.2024 авто на беларусских номерах нельзя ввозить в ЕС. Исключение: личная машина, владелец сам за рулём или в салоне, у него виза или ВНЖ.'], src: [['https://powroty.gov.pl/prawo-jazdy-5285/', 'powroty.gov.pl'], ['https://www.gov.pl/web/kas/nowe-zasady-przywozu-samochodow-osobowych-zarejestrowanych-na-bialorusi', 'gov.pl/web/kas']] },
    { ic: 'language', t: 'Официально по-беларусски', s: 'gov.pl/web/by', b: ['У правительства есть раздел на беларусском языке. Начни со страницы «Першыя крокі» о том, как легально находиться в Польше.'], src: [['https://www.gov.pl/web/by/piersyja-kroki', 'gov.pl/web/by']] }
  ];

  /* Banks: loyalty to Belarusians. Only what a bank page or the press states, with the date of that statement */
  var RP22 = 'https://pieniadze.rp.pl/konta-bankowe/art36052361-rachunek-dla-rosjan-w-polskich-bankach-czasem-ze-specjalna-zgoda';
  var BANKS = [
    { n: 'mBank', s: 3, t: 'Счёт по паспорту. Карту побыту могут попросить в отдельных случаях. Если в паспорте нет PESEL и адреса, нужен документ с ними.', d: '2026', u: 'https://www.mbank.pl/indywidualny/konta/pytania-i-odpowiedzi/dokumenty-potwierdzajace-tozsamosc/', src: 'mbank.pl' },
    { n: 'Pekao', s: 3, t: 'Беларусам счёт открывают. Подходит паспорт, карта побыту или TZTC.', d: '2022', u: RP22, src: 'rp.pl' },
    { n: 'Credit Agricole', s: 2, t: 'Открывали беларусам и до войны. Нужен документ и подтверждение легального пребывания.', d: '2022', u: RP22, src: 'rp.pl' },
    { n: 'BNP Paribas', s: 2, t: 'Только если не живёшь и не платишь налоги в Беларуси. Нужна карта побыту или паспорт с Картой поляка или гуманитарной визой.', d: '2022', u: RP22, src: 'rp.pl' },
    { n: 'Erste', s: 2, t: 'Бывший Santander. Счёт иностранцу открывают в отделении: паспорт и подтверждение легального пребывания (карта побыту с PESEL, справка с работы, студенческий или документ о собственности). Могут спросить налоговый номер своей страны.', d: '9.01.2026', u: 'https://www.erste.pl/bank-porad/konta/jak-zalozyc-konto-bankowe-dla-obcokrajowca', src: 'erste.pl' },
    { n: 'Alior', s: 1, t: 'Беларусь в списке стран высокого риска. На каждый счёт нужно отдельное согласие банка.', d: '2022', u: RP22, src: 'rp.pl' },
    { n: 'PKO BP', s: 1, t: 'Счёт открывают, но если он открыт после 24.10.2025 без карты побыту, нет приложения, BLIK и карты, пока не покажешь в отделении документ на пребывание.', d: '4.12.2025', u: 'https://www.pkobp.pl/aktualnosci/informacja-dla-obywateli-bialorusi-i-rosji-ktorzy-otworzyli-konta-w-pko-banku-polskim-po-24102025-r-bez-karty-pobytu', src: 'pkobp.pl' }
  ];
  var BANK_LBL = { 3: 'Свой', 2: 'С анкетой', 1: 'Строгий' };
  /* Mortgage capacity. KNF Rekomendacja S: the bank tests the payment at the rate + a buffer (variable: max(5 p.p. − NBP rate; 2.5 p.p.), NBP 3.75% → 2.5;
     periodically fixed for 5 years: 2.5) and over at most 25 years. Payment limit = min(DSTI × income, income − living costs) − other debts.
     Living costs and DSTI are fitted to bank calculations of Aug and Sept 2026 (12–13 banks, umowa o pracę): typ = the middle bank, max = the most generous one.
     Card and overdraft limits count as 5% (typ) or 2.6% (max) of the limit per month. */
  var MORT = { typ: { a: 2100, b: 2000, c: 1000, c0: 0.5, c1: 0.6, lim: 0.05 }, max: { a: 2000, b: 1700, c: 600, c0: 0.6, c1: 0.74, lim: 0.026 } };
  var MORT_BUF = 2.5, MORT_LTV = 0.8;

  /* Money: one filter by contract type; everything below it (calculator, tax, ZUS, deadlines) follows the chosen contract */
  var C_ORDER = ['uop', 'zlec', 'dzielo', 'b2b'];
  var CONTRACTS = {
    uop: { tab: 'Umowa o pracę', code: 'UoP · Umowa o pracę', t: 'Трудовой договор', s: 'Полный ZUS, отпуск, больничный.', i: 'Работодатель плачет, ты нет.',
      fees: [['Минималка brutto', '4 806 zł'], ['На руки', '≈3 606 zł'], ['Отпуск', '20 или 26 дней']],
      more: ['Отпуск 20 дней, после 10 лет стажа 26 (учёба засчитывается)', 'Больничный L4 оплачивается', 'Лучший вариант для ВНЖ и кредита'] },
    zlec: { tab: 'Zlecenie', code: 'Umowa zlecenie', t: 'Договор поручения', s: 'ZUS обычно есть, отпуска и больничных по закону нет.', i: 'Свобода, но без выходных.',
      fees: [['Минимум в час', '31,40 zł'], ['Студент до 26', 'без ZUS']],
      more: ['Студенты до 26 лет без ZUS', 'Подходит как основание для ВНЖ', 'Больничный только при добровольном chorobowe'] },
    dzielo: { tab: 'Dzieło', code: 'Umowa o dzieło', t: 'Договор подряда', s: 'За конкретный результат, а не за процесс. Без страховки и гарантий.', i: 'Сделал, сдал, забыли друг друга.',
      fees: [['ZUS', '0'], ['PIT', '12%']],
      more: ['Нет страховки NFZ от этого договора', 'Слабое основание для ВНЖ', 'Налог 12% после KUP'] },
    b2b: { tab: 'B2B', code: 'B2B · JDG', t: 'Своя фирма', s: 'Своя działalność, счета клиентам, налоги и ZUS платишь сам.', i: 'Ты сам себе отдел кадров и бухгалтерия.',
      fees: [['ZUS', 'от 0 до 1 927 zł'], ['Налог', 'шкала, 19% или ryczałt']],
      more: ['ZUS растёт по уровням, смотри ниже', 'Форму налога выбирают раз в год', 'Нужен бухгалтер или хороший сервис'] }
  };
  var TAXES = [
    { id: 'skala', w: 'uop zlec dzielo b2b', ic: 'percent', tag: 'Skala', t: 'Шкала', big: '12 / 32%', x: '12% до 120 000 zł в год, 32% сверх. Kwota wolna 30 000 zł. Składka zdrowotna 9%.', i: 'По умолчанию, если ничего не выбрал.', more: ['Для UoP и zlecenie всегда шкала', 'До 26 лет ulga dla młodych: PIT 0 до 85 528 zł в год', 'Можно совместное с супругом'] },
    { id: 'kwota', w: 'uop zlec dzielo', ic: 'savings', tag: 'Kwota wolna', t: 'Без налога', big: '30 000', x: 'zł дохода в год без PIT. С PIT-2 работодатель учитывает её сразу, по 300 zł в месяц.', i: 'Единственные бесплатные деньги в Польше.', more: ['Без PIT-2 разницу вернут в годовом PIT', 'На dzieło в месяц не учитывается, только в годовом PIT'] },
    { id: 'ulga', w: 'uop zlec', ic: 'school', tag: 'Ulga dla młodych', t: 'До 26 лет', big: '85 528', x: 'zł в год без PIT на umowie o pracę и zlecenie. ZUS и zdrowotna остаются.', i: 'Молодость, которая окупается.', more: ['Действует до дня 26-летия', 'На dzieło и B2B не действует', 'Сверх лимита обычная шкала'] },
    { id: 'kup', w: 'dzielo', ic: 'description', tag: 'KUP', t: 'Расходы без чеков', big: '20 / 50%', x: 'Из суммы договора без налога вычитают 20%. За авторские права 50%, но не больше 120 000 zł в год.', i: 'Творчество выгодно хотя бы для налога.', more: ['50% только если договор передаёт авторские права', 'До 200 zł: 12% с суммы, без KUP'] },
    { id: 'lin', w: 'b2b', ic: 'percent', tag: 'Liniowy', t: 'Линейный', big: '19%', x: 'Только для JDG, без kwoty wolnej. Zdrowotna 4,9% от дохода.', i: 'Для тех, кому 32% это слишком.', more: ['Выгоден примерно с дохода выше 120 000 zł', 'Без совместного с супругом', 'Расходы вычитаются'] },
    { id: 'rycz', w: 'b2b', ic: 'percent', tag: 'Ryczałt', t: 'Ryczałt', big: '2–17%', x: 'С выручки, расходы не вычитаются. Ставка по виду деятельности, в IT часто 12% или 8,5%.', i: 'Чеки собирать не надо. Радость.', more: ['Zdrowotna фиксированная, по порогам выручки', 'Ставку проверяй по своему PKD', 'Выгоден при малых расходах'] }
  ];
  /* B2B, 2026: social ZUS per month [without, chorobowe], health minimum (9% of 4 806 zł), ryczałt health by yearly revenue, liniowy health deduction limit */
  var ZUS_SOC = { start: [0, 0], pref: [420.86, 35.32], full: [1788.29, 138.47] };
  var HEA_MIN = 432.54, RYCZ_HEA = [[60000, 498.35], [300000, 830.58], [Infinity, 1495.04]], LIN_HEA_YEAR = 14100;
  var ZUS_LV = [
    { id: 0, tag: 'Lvl 1 · 6 мес', t: 'Ulga na start', big: '0', x: 'zł социальных. Платишь только składka zdrowotna, минимум 432,54 zł.', i: 'Туториал.' },
    { id: 1, tag: 'Lvl 2 · 24 мес', t: 'Preferencyjny ZUS', big: '≈421', x: 'zł в месяц, с chorobowe 456,18. База 1 441,80 zł, плюс zdrowotna.', i: 'Ещё можно дышать.' },
    { id: 2, tag: 'Lvl 3 · бонус', t: 'Mały ZUS Plus', big: 'от дохода', x: 'Если выручка за прошлый год до 120 000 zł. 36 месяцев за 60, заявка до 31 января.', i: 'Бонусный уровень для скромных.' },
    { id: 3, tag: 'Lvl 4 · навсегда', t: 'Pełny ZUS', big: '1 927', x: 'zł в месяц с chorobowe (1 788,29 без). База 5 652 zł. Плюс zdrowotna.', i: 'Добро пожаловать во взрослую жизнь.' }
  ];

  var LIFE = [
    { id: 'd30', ic: 'task_alt', t: 'Первые 30 дней', s: 'Чеклист, по которому живут все новенькие', checks: [
      ['d30_pesel', 'PESEL: в urzędzie gminy, по заявлению с основанием, бесплатно'], ['d30_bank', 'Счёт в банке (с ВНЖ или картой побыту меньше вопросов)'], ['d30_pz', 'Profil zaufany: через банк, когда есть PESEL'], ['d30_phone', 'Польский номер: prepaid регистрируют по документу'], ['d30_meld', 'Meldunek (zameldowanie): нужен для прав, travel doc и многого другого'], ['d30_nfz', 'Страховка NFZ: через работодателя или свой ZUS'], ['d30_poz', 'Deklaracja POZ: выбрать семейного врача'], ['d30_tg', 'Найти бесплатную юрпомощь своего города в разделе «Хелп»']] },
    { id: 'home', ic: 'apartment', t: 'Жильё', s: 'Аренда, залог, meldunek', list: ['Договор аренды только письменно, с адресом и сроком: он же подтверждение жилья для ужонда', 'Kaucja по закону не больше 12 месячных плат, при najmie okazjonalnym не больше 6. Вернуть её обязаны в течение месяца после выезда', 'Najem okazjonalny: нотариус и адрес, куда съедешь. Хозяева любят, ты подписываешь', 'Без договора нет meldunku, без meldunku сложнее с правами и документами'], u: 'https://www.infor.pl/prawo/umowy/najem-i-dzierzawy/5591797,wynajem-mieszkania-kaucja-limity-zasady-waloryzacja.html', s2: 'infor.pl' },
    { id: 'health', ic: 'health_and_safety', t: 'Здоровье', s: 'NFZ, врач, экстренные номера', list: ['Страховка NFZ появляется вместе с ZUS: работа, zlecenie или своя JDG', 'Сначала семейный врач POZ, к специалисту по направлению', 'Экстренный номер 112, работает и по-английски', 'Частная медицина часто идёт бонусом от работодателя'] },
    { id: 'kids', ic: 'child_care', t: 'Дети', s: 'PESEL, сад, школа, 800+', list: ['PESEL ребёнку делают в gmina', 'Żłobek и przedszkole: запись обычно весной, мест меньше, чем желающих', 'С 1.06.2026 800+ для иностранцев только при работе родителя, ребёнок должен учиться в Польше (кроме детей до 6 лет)'], u: 'https://finanse.wp.pl/zmiany-dla-cudzoziemcow-od-1-czerwca-zus-wyjasnia-7292105621981504a', s2: 'wp.pl' },
    { id: 'lang', ic: 'school', t: 'Польский', s: 'B1 нужен для ПМЖ и паспорта', list: ['Państwowy certyfikat B1: расписание и запись на certyfikatpolski.pl', 'Бесплатные курсы бывают в центрах интеграции, см. «Хелп»', 'Kurwa не уровень B1, проверено'] },
    { id: 'money', ic: 'savings', t: 'Деньги из Беларуси', s: 'Чтобы банк не заморозил', list: ['Сохраняй документы о продаже имущества и переводах', 'Перед крупным переводом (квартира, машина) собери бумаги заранее и предупреди банк', 'Без ВНЖ в ЕС возможны ограничения карт и онлайн-банкинга'] }
  ];

  var OFFICIAL = [
    { n: 'MOS 2', d: 'Подача заявлений на ВНЖ, ПМЖ и rezydenta UE', u: 'https://mos.cudzoziemcy.gov.pl', h: 'mos.cudzoziemcy.gov.pl', ic: 'upload_file' },
    { n: 'gov.pl для беларусов', d: 'Официальный раздел на беларусском', u: 'https://www.gov.pl/web/by/piersyja-kroki', h: 'gov.pl/web/by', ic: 'language' },
    { n: 'Urząd do Spraw Cudzoziemców', d: 'Правила, статистика, MOS Q&A', u: 'https://www.gov.pl/web/udsc', h: 'gov.pl/web/udsc', ic: 'gavel' },
    { n: 'Zielona Linia', d: 'Консультации по работе и пребыванию', u: 'https://zielonalinia.gov.pl', h: '19 524', ic: 'call' },
    { n: 'Krajowa Sieć Integracji', d: 'Официальная база центров помощи иностранцам по воеводствам', u: 'https://www.gov.pl/web/krajowa-siec-integracji/krajowe-biura-integracji-baza-adresowa', h: 'gov.pl/web/krajowa-siec-integracji', ic: 'volunteer_activism' }
  ];

  var DICT = [
    ['Urząd Wojewódzki', 'ужонд', 'Место, где решается твоя судьба. Медленно.'],
    ['Wojewoda', 'воевода', 'Подписывает твою decyzję. Лично вы не знакомы.'],
    ['Decyzja', 'решение', 'Бумага, ради которой всё. Бывает положительной.'],
    ['Wezwanie', 'вызов', 'Письмо с датой визита или списком того, чего не хватает.'],
    ['Braki formalne', 'недостатки', 'Чего-то не хватает. Срок на исправление в письме, не пропусти.'],
    ['UPO', 'квитанция MOS', 'Urzędowe Poświadczenie Odbioru. Доказательство, что ты подал.'],
    ['Zaświadczenie', 'справка', 'После проверки заявления заменяет старый штамп в паспорте.'],
    ['MOS', 'портал', 'Moduł Obsługi Spraw. С 27.04.2026 подача только через него.'],
    ['Załącznik nr 1', 'приложение 1', 'Часть заявления, которую подписывает работодатель.'],
    ['Karta pobytu', 'карта побыту', 'Пластик с твоим лицом и правом здесь жить.'],
    ['Pobyt czasowy', 'временный', 'ВНЖ до 3 лет.'],
    ['Pobyt stały', 'постоянный', 'ПМЖ. Бессрочно.'],
    ['Rezydent długoterminowy UE', 'резидент ЕС', 'ПМЖ после 5 лет, с B1 и доходом.'],
    ['PESEL', 'номер', 'Твой идентификатор почти везде.'],
    ['NIP', 'налоговый номер', 'Нужен для JDG, у физлиц обычно хватает PESEL.'],
    ['Profil zaufany', 'профиль доверия', 'Электронная подпись для госуслуг. Делается через банк.'],
    ['Zameldowanie', 'мельдунек', 'Регистрация по адресу.'],
    ['ZUS', 'соцстрах', 'Пенсия, больничный, страховка. И ежемесячная боль JDG.'],
    ['NFZ', 'медстрах', 'Государственная медицина.'],
    ['JDG', 'ИП', 'Jednoosobowa działalność gospodarcza.'],
    ['Odwołanie', 'апелляция', 'Обжалование decyzji, обычно 14 дней.'],
    ['Tłumacz przysięgły', 'присяжный переводчик', 'Без его печати перевод не перевод.'],
    ['Starostwo', 'староство', 'Права, авто, регистрация. В больших городах это urząd miasta.'],
    ['Gmina', 'гмина', 'Местная администрация: PESEL, meldunek.'],
    ['Pełnomocnik', 'представитель', 'Тот, кто ходит в ужонд вместо тебя. Пошлина 17 zł.'],
    ['Opłata skarbowa', 'госпошлина', 'Платится в gmina по месту ужонда. С 5.03.2026 при отказе не возвращается.'],
    ['Umowa najmu', 'договор аренды', 'Главный документ о жилье для ужонда, банка и мельдунка.'],
    ['Kwota wolna', 'необлагаемый минимум', '30 000 zł в год без налога, если ты на шкале.']
  ];

  var POSTS = [
    { t: 'Białorusin w Gdansku', u: 'https://pasha.by/bialorusin-w-gdansku/' },
    { t: 'Duży ZUS', u: 'https://pasha.by/duzy-zus/' },
    { t: 'Minsk-Gdańsk SKM', u: 'https://pasha.by/minsk-gdansk-skm/' },
    { t: 'Эмигрант ты', u: 'https://pasha.by/emigrant-ty/' },
    { t: 'Polski kot', u: 'https://pasha.by/polski-kot/' }
  ];

  var SOURCES = [
    ['Цены на топливо: Weekly Oil Bulletin (Еврокомиссия)', 'https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en'], ['Курс евро NBP (таблица A)', 'https://api.nbp.pl/'],
    ['Ипотеки в сентябре 2026 (BIK)', 'https://mojebankowanie.pl/informacje-prasowe/informacje-prasowe-bankowosc/bik-dane-o-rynku-kredytowym-we-wrzesniu-2026-r'], ['Процент по новым ипотекам, сентябрь 2026 (NBP)', 'https://finwire.pl/artykuly/nowe-kredyty-mieszkaniowe-wrzesien-2026-nbp'],
    ['PKO BP: счета беларусов без карты побыту', 'https://www.pkobp.pl/aktualnosci/informacja-dla-obywateli-bialorusi-i-rosji-ktorzy-otworzyli-konta-w-pko-banku-polskim-po-24102025-r-bez-karty-pobytu'], ['Санкции ЕС против Беларуси, регламент 2025/2041', 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R2041'],
    ['MOS 2: подача онлайн с 27.04.2026', 'https://www.gov.pl/web/udsc/mos-qa'], ['MOS: старый портал закрыт 17.04.2026', 'https://zielonalinia.gov.pl/mos-czyli-elektroniczne-skladanie-niektorych-wnioskow-pobytowych/'],
    ['Пошлины за ВНЖ и ПМЖ, невозврат с 5.03.2026', 'https://www.gov.pl/web/uw-warminsko-mazurski/oplaty'], ['Пошлины за гражданство с 1.08.2025', 'https://www.gov.pl/web/uw-lubelski/obywatelstwo-i-repatriacja'],
    ['Пути к гражданству (uznanie)', 'https://www.gov.pl/web/uw-zachodniopomorski/uznanie-za-obywatela-polskiego2'], ['Проект UD408, молчаливое согласие', 'https://www.gov.pl/web/premier/projekt-ustawy-o-zmianie-ustawy-o-cudzoziemcach'],
    ['Беларусы в Польше на 1.02.2026 (UdSC)', 'https://www.gov.pl/attachment/4738d4ca-beae-459f-b0bb-2db8f2da7ac2'], ['Сроки по всем воеводствам на 6.07.2026 (ответ MSWiA, интерпелляция 18089)', 'https://api.sejm.gov.pl/sejm/term10/interpellations/18089/reply/DWDJHZ/body'],
    ['598 дней в Pomorskie (MSWiA, 6.07.2026)', 'https://dziennikbaltycki.pl/cudzoziemcy-czekaja-miesiacami-na-legalizacje-pobytu-a-nadchodzi-kolejna-fala-wnioskow-wojewodztwo-pomorskie-ma-problem/ar/c1p2-29401689'], ['394 дня на Мазовше, протест 24.08.2026', 'https://warszawa.naszemiasto.pl/mieli-czekac-60-dni-a-czekaja-nawet-2-lata-tlum-obcokrajowcow-wyszedl-na-ulice-warszawy-urzad-milczy-moge-stracic-prace/ar/c1p2-29291631'],
    ['Потеря работы: 15 рабочих дней', 'https://zielonalinia.gov.pl/zezwolenie-jednolite-wazny-obowiazek-cudzoziemca/'], ['PESEL для иностранца', 'https://zielonalinia.gov.pl/kiedy-cudzoziemiec-moze-uzyskac-numer-pesel/'],
    ['Выезды для rezydenta UE', 'https://zielonalinia.gov.pl/zezwolenie-na-pobyt-rezydenta-dlugoterminowego-ue-a-nieprzerwany-pobyt/'], ['Travel doc для беларусов до 31.12.2026', 'https://bip.lubuskie.uw.gov.pl/sprawy_obywatelskie/polski-dokument-podrozy-dla-obywateli-bialorusi'],
    ['Санкции: счета беларусов без карты побыту', 'https://www.pkobp.pl/aktualnosci/informacja-dla-obywateli-bialorusi-i-rosji-ktorzy-otworzyli-konta-w-pko-banku-polskim-po-24102025-r-bez-karty-pobytu'], ['Авто на беларусских номерах (KAS)', 'https://www.gov.pl/web/kas/nowe-zasady-przywozu-samochodow-osobowych-zarejestrowanych-na-bialorusi'],
    ['Обмен прав', 'https://powroty.gov.pl/prawo-jazdy-5285/'], ['Техосмотр, art. 81 PoRD', 'https://lexlege.pl/prawo-o-ruchu-drogowym/art-81/'],
    ['Kaucja: лимиты и возврат', 'https://www.infor.pl/prawo/umowy/najem-i-dzierzawy/5591797,wynajem-mieszkania-kaucja-limity-zasady-waloryzacja.html'], ['800+ для иностранцев с 1.06.2026', 'https://finanse.wp.pl/zmiany-dla-cudzoziemcow-od-1-czerwca-zus-wyjasnia-7292105621981504a'],
    ['Минималка 2026', 'https://ksiegowosc.infor.pl/zus-kadry/wynagrodzenia/7490561,placa-minimalna-w-2026-r-ile-netto-do-wyplaty-i-jakie-brutto-w-umowie-w-ktorych-umowach-trzeba-stosowac-minimalna-stawke-godzinowa.html'], ['ZUS для JDG в 2026', 'https://norman.finance/pl/pomoc/zus-dla-jdg'], ['Składka zdrowotna 2026: минимум, ryczałt, лимит для линейного', 'https://www.infakt.pl/blog/?p=81462'], ['Erste: счёт для иностранца', 'https://www.erste.pl/bank-porad/konta/jak-zalozyc-konto-bankowe-dla-obcokrajowca'],
    ['Mały ZUS Plus 2026', 'https://www.ifirma.pl/blog/maly-zus-plus-2026-kto-moze-skorzystac-i-jak-dlugo/'], ['Новые правила гражданства (проект MSWiA)', 'https://forsal.pl/kraj/aktualnosci/artykuly/11246150,dla-kogo-polskie-obywatelstwo-mswia-przygotowuje-zmiany-w-prawie.html'],
    ['Сейм отклонил 10 лет', 'https://grantthornton.pl/publikacja/zatrudnianie-cudzoziemcow-2026-sejm-odrzucil-zmiany-w-obywatelstwie/'], ['Организации помощи иностранцам (UdSC)', 'https://www.gov.pl/web/udsc/organizacje-zajmujace-sie-udzielaniem-pomocy-cudzoziemcom'], ['Ужонды по воеводствам (UdSC)', 'https://www.gov.pl/web/udsc/instytucje-rzadowe'],
    ['Центры помощи по воеводствам (Krajowa Sieć Integracji)', 'https://www.gov.pl/web/krajowa-siec-integracji/krajowe-biura-integracji-baza-adresowa'], ['ПМЖ: решение за 6 месяцев, art. 210', 'https://lexlege.pl/ustawa-o-cudzoziemcach/art-210/'],
    ['Вроцлав: MOS 2 и запись на карты', 'https://www.gov.pl/web/dolnoslaski-uw/od-27-kwietnia-tylko-online--start-systemu-mos-2-i-zmiany-w-obsludze-cudzoziemcow'],
    ['Ипотека: буфер ставки и срок оценки, Rekomendacja S (KNF)', 'https://bip.knf.gov.pl/knf/pl/komponenty/img/Rekomendacja_S_nowelizacja_czerwiec_2023_82872.pdf'], ['Кредитоспособность в 12 банках, сентябрь 2026 (ANG)', 'https://rutkowskihome.pl/pl/finansy/kreditosposobnost-v-polshe-v-sentyabre-2026-goda-skolko-mozhno-poluchit-na-ipoteku-i-pochemu-banki-snova-uzhestochayut-raschyoty/'],
    ['Ранкинг кредитоспособности, август 2026', 'https://blogdariuszkaczorowski.pl/ranking-zdolnosci-kredytowej/'], ['Лимит кредитки в оценке ипотеки (rankomat.pl)', 'https://rankomat.pl/finanse/poradniki/karta-kredytowa-a-kredyt-hipoteczny/'],
    ['Лучшие ипотеки и страховки, август 2026', 'https://marciniwuc.com/wp-content/uploads/2026/08/Najlepsze-oferty-500k-80LTV-zmienne-30lat-2026-08-03.pdf'], ['Банки и доход на ryczałcie', 'https://hipoteczny.pl/blog/kredyt-hipoteczny-na-ryczalcie/'],
    ['Такса нотариуса (rozporządzenie MS)', 'https://api.sejm.gov.pl/eli/acts/DU/2020/1473/text.html'], ['PCC: первое жильё без налога', 'https://www.infor.pl/twoje-pieniadze/podatki/7627213,0-pcc-przy-zakupie-nieruchomosci-z-rynku-wtornego-te-przepisy-juz-obowiazuja-i-jest-tylko-jeden-warunek.html'],
    ['Покупка жилья иностранцем без разрешения', 'https://powroty.gov.pl/nieruchomosci-nie-wymagajace-zezwolenia-9953/']
  ];

  var BADGES = [
    { id: 'pesel', ic: 'badge', t: 'PESEL' }, { id: 'upo', ic: 'task_alt', t: 'UPO на руках' }, { id: 'finger', ic: 'fingerprint', t: 'Отпечатки' },
    { id: 'zhdun', ic: 'hourglass_top', t: 'Ждун со стажем' }, { id: 'card', ic: 'id_card', t: 'Карта!' }, { id: 'pmzh', ic: 'verified', t: 'Постоянный' }, { id: 'own', ic: 'emoji_events', t: 'Свой' }
  ];
  var LEVELS = [[0, 'Турист'], [10, 'Ждун'], [30, 'Коплю жабсы'], [55, 'Резидент'], [80, 'Кандидат'], [100, 'Поляк (или нет)']];
  /* each stage puts you at least at its level; ticked steps move you further */
  var STAGE_IDX = { arrive: 0, wait: 1, vnzh: 2, pmzhw: 3, pmzh: 4, pass: 5, citizen: 6 };
  /* the share of the level scale a stage covers and the track whose steps fill it: every step or document moves the percent */
  var STAGE_BAND = { arrive: [0, 10, 'vnzh'], wait: [10, 30, 'vnzh'], vnzh: [30, 45, 'pmzh'], pmzhw: [45, 55, 'pmzh'], pmzh: [55, 80, 'paszport'], pass: [80, 100, 'paszport'], citizen: [100, 100, 'paszport'] };

  /* ---------- render pieces ---------- */
  function city() {
    var c = CITIES[S.city] || CITIES.gdansk, v = VOIV[c.vo];
    return { n: c.n, loc: c.loc, voiv: v.v, uw: v.uw + ' Urząd Wojewódzki', uwUrl: v.u, wait: v.wait, pmzh: v.pmzh || 0, by: v.by, apps: v.apps, waitDate: DATA_AS_OF, note: c.note || '', help: v.help };
  }
  function roadKm(a, b) { return DIST[a + '-' + b] || DIST[b + '-' + a] || Math.round(km(CITIES[a].g, CITIES[b].g) * 1.25 / 5) * 5; }
  function sico(ic, c, fg) { return '<span class="pl-sico" style="background:' + c + ';color:' + (fg || '#fff') + '">' + ms(ic) + '</span>'; }
  function head(id, title, ic, c, fg, note) {
    return '<div class="pl-head"><h1 class="pl-h2" id="' + id + '-h">' + title + '</h1>' + (note ? '<p class="pl-small pl-muted">' + note + '</p>' : '') + '</div>';
  }
  function box(st) {
    if (st === 'todo') return '<span class="pl-box" aria-hidden="true"></span>';
    return '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x=".5" y=".5" width="17" height="17" rx="2.5" fill="#1F1919" stroke="#1F1919"/><path d="' + (st === 'done' ? CHECK : DASH) + '" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function checks(list) {
    return '<div class="pl-checks">' + list.map(function (c) {
      return '<label class="pl-check"><input type="checkbox" data-check="' + c[0] + '"' + (S.checks[c[0]] ? ' checked' : '') + '><span>' + c[1] + '</span></label>';
    }).join('') + '</div>';
  }
  function srcLine(list) { return list && list.length ? '<p class="pl-note">' + (list.length > 1 ? 'Источники: ' : 'Источник: ') + list.map(function (x) { return link(x[0], x[1]); }).join(', ') + '</p>' : ''; }
  function tipHtml(t, red) { return '<div class="pl-tip' + (red ? ' red' : '') + '">' + ms(red ? 'warning' : 'lightbulb') + '<span>' + t + '</span></div>'; }
  function isoToDmy(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : ''; }
  function dmyToIso(v) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v || ''); if (!m) return '';
    var d = +m[1], mo = +m[2], y = +m[3], t = new Date(y, mo - 1, d, 12);
    if (y < 1950 || y > 2100 || t.getFullYear() !== y || t.getMonth() !== mo - 1 || t.getDate() !== d) return '';
    return m[3] + '-' + m[2] + '-' + m[1];
  }
  function maskDmy(v) { var g = String(v || '').replace(/\D/g, '').slice(0, 8), o = g.slice(0, 2); if (g.length > 2) o += '/' + g.slice(2, 4); if (g.length > 4) o += '/' + g.slice(4); return o; }
  function dateCtl(fid, iso, attrs) {
    return '<span class="pl-date"><input class="pl-input" type="text" inputmode="numeric" autocomplete="off" maxlength="10" placeholder="ДД/ММ/ГГГГ" id="' + fid + '" data-date ' + attrs + ' value="' + esc(isoToDmy(iso)) + '" aria-haspopup="dialog" aria-expanded="false"' + (mobileCal() ? ' readonly' : '') + '>' +
      '<span class="pl-date-ico" aria-hidden="true">' + svgi('cal', 20) + '</span></span>';
  }
  function field(id, label, type, extra, uid) {
    var v = S.f[id] != null ? S.f[id] : '', fid = 'pl-f-' + (uid || id), fb = fallbackOf(id);
    if (type !== 'date' && fb !== '' && !/placeholder=/.test(extra || '')) extra = (extra || '') + ' placeholder="' + esc(String(fb)) + '"';
    if (type === 'date') return '<div class="pl-field"><label class="pl-eyebrow" for="' + fid + '">' + label + '</label>' + dateCtl(fid, v, 'data-f="' + id + '"') + '</div>';
    return '<div class="pl-field"><label class="pl-eyebrow" for="' + fid + '">' + label + '</label><input class="pl-input" id="' + fid + '" type="' + type + '" data-f="' + id + '" value="' + esc(v) + '"' + (extra || '') + '></div>';
  }

  /* what an emptied field falls back to */
  function fallbackOf(k) {
    if (k === 'price') { var fu = FUEL || FUEL_FALLBACK; return fu.pb95 ? fu.pb95.toFixed(2) : DEF.f.price; }
    var d = DEF.f[k]; return typeof d === 'string' ? d : '';
  }
  function setField(el, keep) {
    var k = el.getAttribute('data-f'), v = el.value, fb = fallbackOf(k);
    if (v.trim() === '' && fb !== '') {
      S.f[k] = fb; if (k === 'price') { S.f.priceManual = false; updateFuel(); }
      if (!keep) el.value = fb;
    } else { S.f[k] = v; if (k === 'price') { S.f.priceManual = true; out('priceNote', 'Цена твоя. Средняя по Польше выше, в блоке топлива.'); } }
    save();
    $$('[data-f="' + k + '"]').forEach(function (x) { if (x !== el) x.value = S.f[k]; });
  }
  /* ---------- shell: sidebar, top bar, phone tab bar, footer ---------- */
  var STAGE_LBL = { arrive: ['Только', 'приехал'], wait: ['Подался на', 'ВНЖ'], vnzh: ['Есть', 'ВНЖ'], pmzhw: ['Подался на', 'ПМЖ'], pmzh: ['Есть', 'ПМЖ'], pass: ['Подался на', 'паспорт'], citizen: ['Есть', 'паспорт'] };
  function chev() { return '<svg class="pb-chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'; }
  function navLink(s, cls) { return '<a class="' + cls + '" href="' + hrefOf(s) + '" data-nav="' + s.k + '">' + svgi(s.ic) + '<span>' + s.n + '</span></a>'; }
  function rSide() {
    return '<aside class="pb-side"><div class="pb-side-in"><nav class="pb-nav" aria-label="Разделы">' + SECTIONS.map(function (s) { return navLink(s, 'pb-nav-a'); }).join('') + '</nav>' +
      '<p class="pb-side-d" data-o="secDesc"></p><div class="pb-ill" aria-hidden="true">' + rIll() + '</div></div></aside>';
  }
  function rTop() {
    var st = STAGE_LBL[S.stage] || STAGE_LBL.arrive, set = meOpen();
    return '<div class="pb-top">' +
      '<div class="pb-pills">' +
        '<span class="pb-dd"><label class="pb-pill">' + svgi('loc', 20) + '<span data-o="cityName">' + esc(city().n) + '</span>' + chev() +
          '<select data-city-sel id="pl-city" aria-label="Твой город" aria-describedby="pl-geo-msg"><option value="__geo">Определить по геолокации</option>' + CITY_ORDER.map(function (id) {
            return '<option value="' + id + '"' + (id === S.city ? ' selected' : '') + '>' + CITIES[id].n + '</option>';
          }).join('') + '</select></label></span>' +
        '<span class="pb-dd"><label class="pb-pill">' + (set ? '<span>' + st[0] + '</span><b class="pb-tag">' + st[1] + '</b>' : '<span>Где ты сейчас?</span>') + chev() +
          '<select data-stage-sel aria-label="Где ты сейчас">' + (set ? '' : '<option value="" selected disabled>Где ты сейчас?</option>') + STAGES.map(function (s) {
            return '<option value="' + s.id + '"' + (set && s.id === S.stage ? ' selected' : '') + '>' + s.n + '</option>';
          }).join('') + '</select></label></span>' +
      '</div>' +
      '<button type="button" class="pashaby-phrase" data-phrase title="Ещё фраза"><span class="pashaby-q" aria-hidden="true">format_quote</span><span class="pashaby-t" aria-live="polite">' + esc(phraseNow < 0 ? nextPhrase() : PHRASES[phraseNow]) + '</span></button>' +
      '<div class="pb-langs" role="group" aria-label="Язык"><button type="button" aria-pressed="true">РУС</button><button type="button" disabled title="Скоро">БЕЛ</button><button type="button" disabled title="Скоро">УКР</button></div>' +
      '<div class="pl-lvl"><span class="pl-lvl-t">Уровень: <b data-o="lvlName"></b></span>' +
        '<ol class="pl-lvl-s" aria-label="Уровни">' + LEVELS.map(function (l, i) { return '<li data-lvl="' + i + '" title="' + l[1] + '"><i><b></b></i></li>'; }).join('') + '</ol>' +
        '<b class="pl-lvl-p" data-o="lvlPct"></b></div>' +
      '<p class="pb-geo-msg" id="pl-geo-msg" data-o="geoMsg" aria-live="polite"></p>' +
    '</div>';
  }
  function rTabs() {
    return '<div class="pb-more" id="pb-more" hidden><nav aria-label="Разделы">' + SECTIONS.map(function (s) { return navLink(s, 'pb-nav-a'); }).join('') + '</nav></div>';
  }

  function rFoot() {
    return '<footer class="pb-foot">' +
      '<p class="pb-disc">' + SDESC.me + '</p>' +
      '<div class="pb-foot-c"><div class="pl-acc pl-sources"><details id="pl-d-src"><summary><span class="t">Источники и даты<small>' + SOURCES.length + ' ссылок, проверено 30.10.2026</small></span>' + ms('expand_more', 'chev') + '</summary><div class="body wide"><ul class="pl-list">' +
          SOURCES.map(function (s) { return '<li>' + link(s[1], s[0]) + '</li>'; }).join('') + '</ul></div></details></div>' +
        '<div class="pb-foot-row"><span class="pl-small pl-muted">Законы меняются быстрее, чем очередь в ужонде. Нашёл ошибку, напиши.</span><button type="button" class="pl-btn" data-reset>' + ms('restart_alt') + '<span>Сбросить мой прогресс</span></button></div></div>' +
    '</footer>';
  }
  /* phone: the logo on top, it shrinks to an icon on scroll; the section picture sits next to it */
  function rMHead() {
    return '<header class="pb-mhead"><a class="pb-mlogo" href="' + hrefOf(SECTIONS[0]) + '"><img src="' + ILL_BASE + 'me.webp" alt="Pan Bogdan, e-помогатор" width="200" height="189" decoding="async"></a>' +
      '<b class="pb-mname" data-o="secName"></b>' +
      '<div class="pb-mill" aria-hidden="true">' + rIll(1) + '</div>' +
      '<button type="button" class="pb-burger" data-more aria-expanded="false" aria-controls="pb-more" aria-label="Разделы"><i></i><i></i><i></i></button></header>';
  }



  /* «Своё»: the home screen. Dates live only in this browser */
  var ME_KEYS = ['since', 'filed', 'vnzhGot', 'pmzhFiled', 'staly', 'passFiled', 'passGot'];
  function meOpen() { return !!S.stageSet || ME_KEYS.some(function (k) { return !!S.f[k]; }); }
  /* personal dates: arrival for everyone, the rest appears with the stage (or when filled) */
  var ME_ROWS = [
    { k: 'vnzh', t: 'ВНЖ', ic: 'id_card', min: 1, f: 'filed', g: 'vnzhGot' },
    { k: 'pmzh', t: 'ПМЖ', ic: 'verified', min: 2, f: 'pmzhFiled', g: 'staly' },
    { k: 'pass', t: 'Паспорт', ic: 'emoji_events', min: 4, f: 'passFiled', g: 'passGot' }
  ];
  /* a home stat with a link to its section */
  function secLink(k) { var x = secBy(k); return x ? '<a class="pb-seclink" href="' + hrefOf(x) + '">' + x.n + ms('arrow_outward') + '</a>' : ''; }
  function stat(big, lab, sub, k) { return '<div class="pb-stat"><div class="pl-big">' + big + '</div><div class="pl-lab">' + lab + '</div><div class="pl-sub">' + sub + '</div>' + secLink(k) + '</div>'; }
  function rMe() {
    var c = city(), n = NEWS[0];
    var stat0 = c.by ? 'Из них около ' + c.by + ' тыс. живут в ' + c.voiv + '. ' : '';
    return '<section class="pl-band pb-screen" id="pl-me" aria-labelledby="pl-h1">' +
      '<h1 class="sr" id="pl-h1">Pan Bogdan: Польша пошагово</h1>' +
      '<div class="pb-home">' +
        '<div class="pb-hero" data-fitcells="300"><div class="pl-big" style="color:var(--red)" data-bind="waitFmt"></div><div class="pl-lab">дней в среднем ждут решения по ВНЖ ' + c.loc + '</div><div class="pl-sub">По закону 60. ' + c.uw + ', ' + link('https://api.sejm.gov.pl/sejm/term10/interpellations/18089/reply/DWDJHZ/body', 'данные MSWiA') + ' на ' + c.waitDate + '</div></div>' +
        '<div class="pb-card pb-mine">' +
          '<div class="pb-mine-h"><h2 class="pb-mine-logo" id="pl-me-h">Своё</h2><p class="pb-mine-d" data-o="meIntro">Укажи даты: появятся твои счётчики и сравнение со средним по воеводству.</p><p class="pb-mine-p">Хранится только в этом браузере. <br>Даже ужонд не узнает.</p></div>' +
          '<div class="pl-mine">' +
            '<div class="pl-mine-row"><div class="pl-mine-t">' + ms('flight_land') + 'Приехал</div><div class="pl-fields">' + field('since', 'В Польше с', 'date', '', 'me-since') + '</div></div>' +
            ME_ROWS.map(function (r) {
              return '<div class="pl-mine-row" data-mrow="' + r.k + '"><div class="pl-mine-t">' + ms(r.ic) + r.t + '</div><div class="pl-fields">' + field(r.f, 'Подал', 'date', '', 'me-' + r.f) + field(r.g, 'Решение', 'date', '', 'me-' + r.g) + '</div></div>';
            }).join('') +
          '</div>' +
          '<p class="pl-note pb-mine-hint" data-o="meHint"></p>' +
          '<div class="pl-me" data-o="me" data-fitcells="300" data-fitmin="40" data-fitref=".pb-counts .pl-counts" aria-live="polite"></div>' +
        '</div>' +
        '<div class="pb-about"><p class="pb-about-p">' + svgi('mine', 18) + '<span>Всё, что ты вводишь, хранится только в этом браузере. Сервера и аккаунтов нет, даже ужонд не узнает. Сбросить можно внизу страницы.</span></p>' +
          '<div class="pl-eyebrow">Что где</div><ul class="pb-about-l">' + SECTIONS.filter(function (x) { return x.k !== 'me'; }).map(function (x) {
            return '<li><a href="' + hrefOf(x) + '">' + svgi(x.ic, 20) + '<span><b>' + x.n + '</b><small>' + SDESC[x.k] + '</small></span></a></li>';
          }).join('') + '</ul></div>' +
        '<div class="pl-next pb-next" aria-live="polite"><div class="pl-eyebrow">Твои следующие шаги</div><ul data-o="next"></ul></div>' +
      '</div>' +
      '<div class="pb-counts">' +
        '<div class="pl-counts" data-fitcells="150">' +
          (c.pmzh ? stat(n0(c.pmzh), 'дней в среднем ждут ПМЖ ' + c.loc, 'По закону 6 месяцев. MSWiA', 'legal') : '') +
          stat('142 737', 'беларусов с документами на пребывание в Польше', link('https://www.gov.pl/attachment/4738d4ca-beae-459f-b0bb-2db8f2da7ac2', 'UdSC') + ', 1.02.2026. ' + stat0 + 'В 2025 подали ' + n0(c.apps) + ' ' + plural(c.apps, 'заявление', 'заявления', 'заявлений') + ' в ' + c.voiv, 'by') +
          stat('2 922', 'дня до паспорта обычным путём', '8 лет: 5 на временном и 3 на ПМЖ. Пока', 'legal') +
          stat('4 806', 'zł brutto: минималка 2026', 'На руки около 3 606 zł. ' + link('https://ksiegowosc.infor.pl/zus-kadry/wynagrodzenia/7490561,placa-minimalna-w-2026-r-ile-netto-do-wyplaty-i-jakie-brutto-w-umowie-w-ktorych-umowach-trzeba-stosowac-minimalna-stawke-godzinowa.html', 'infor.pl'), 'money') +
          stat('486 500', 'zł: средняя ипотека', link('https://mojebankowanie.pl/informacje-prasowe/informacje-prasowe-bankowosc/bik-dane-o-rynku-kredytowym-we-wrzesniu-2026-r', 'BIK') + ', сентябрь 2026. На 8,3% больше, чем год назад', 'home') +
          stat('5,95%', 'средний процент по новым ипотекам', link('https://finwire.pl/artykuly/nowe-kredyty-mieszkaniowe-wrzesien-2026-nbp', 'NBP') + ', сентябрь 2026', 'home') +
          '<div class="pb-stat"><div class="pl-big" data-o="fuelPb">—</div><div class="pl-lab">zł за литр PB 95 (наш АИ-95), средняя по Польше</div><div class="pl-sub">' + link('https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en', 'Weekly Oil Bulletin') + ', <span data-o="fuelDate"></span></div>' + secLink('auto') + '</div>' +
        '</div>' +
        '<div class="pb-newscol"><div class="pl-eyebrow">Новости</div>' + NEWS.slice(0, 3).map(function (x) {
          return '<a class="pb-newscard" href="' + hrefOf(secBy('news')) + '"><span class="pb-nc-h"><b>' + x.d + '</b><span class="pl-tag' + (x.red ? ' red' : '') + '">' + x.tag + '</span></span><span class="pb-nc-t">' + x.t + '</span></a>';
        }).join('') + '<a class="pb-seclink" href="' + hrefOf(secBy('news')) + '">Все новости, ' + NEWS.length + ms('arrow_outward') + '</a></div>' +
      '</div>' +
      '<div class="pl-badges" aria-label="Ачивки">' + BADGES.map(function (b) {
        return '<div class="pl-badge" data-badge="' + b.id + '"><span class="c">' + ms(b.ic) + '</span><small>' + b.t + '</small></div>';
      }).join('') + '</div>' +
    '</section>';
  }

  function rNews() {
    var first = NEWS.slice(0, 5), rest = NEWS.slice(5);
    function li(n) { return '<li><time>' + n.d + '</time><p><span class="pl-tag' + (n.red ? ' red' : '') + '">' + n.tag + '</span>' + n.t + ' ' + src(n.u, n.s) + '</p></li>'; }
    return '<section class="pl-band pb-screen" id="pl-news" aria-labelledby="pl-news-h">' + head('pl-news', 'Что изменилось', 'newspaper', '#141414', '#fff', 'Свежее сверху · проверено 23.10.2026') +
      '<ul class="pl-news">' + first.map(li).join('') + '</ul>' +
      '<div class="pl-acc" style="border-top:0"><details id="pl-d-news"><summary><span class="t" style="font-size:15px">Ещё ' + rest.length + ' ' + plural(rest.length, 'новость', 'новости', 'новостей') + '</span>' + ms('expand_more', 'chev') + '</summary><ul class="pl-news" style="margin-top:0">' + rest.map(li).join('') + '</ul></details></div>' +
    '</section>';
  }

  /* «Мой путь»: steps already behind you (by «Где ты сейчас» and the dates in «Своё») are shown as passed and locked */
  function myPath() { return S.myPath !== false; }
  function passedUpTo(k) {
    if (!myPath()) return 0;
    var si = S.stageSet ? (STAGE_IDX[S.stage] || 0) : 0, f = S.f, n = LEGAL[k].steps.length;
    if (k === 'vnzh') return si >= 2 || f.vnzhGot ? n : (si === 1 || f.filed ? 3 : 0);
    if (k === 'pmzh') return si >= 4 || f.staly ? n : (si === 3 || f.pmzhFiled ? 5 : 0);
    return si >= 6 || f.passGot ? n : (f.passFiled ? 5 : si === 5 ? 2 : 0);
  }
  function stepState(k, i) { var past = i < passedUpTo(k); return { past: past, v: past ? 'done' : (S.status[k + i] || 'todo') }; }
  function updatePath() {
    L_ORDER.forEach(function (k) {
      LEGAL[k].steps.forEach(function (s, i) {
        var key = k + i, row = $('[data-step="' + key + '"]'); if (!row) return;
        var st = stepState(k, i), btn = row.querySelector('[data-cycle]');
        row.className = 'pl-step ' + st.v + (st.past ? ' pl-past' : '');
        if (st.past) { row.setAttribute('inert', ''); var d = row.querySelector('details'); if (d) d.open = false; } else row.removeAttribute('inert');
        btn.innerHTML = box(st.v); btn.disabled = st.past;
        btn.setAttribute('aria-label', s.t + ': ' + (st.past ? 'пройдено' : LBL[st.v] + '. Сменить статус'));
        row.querySelector('.pl-st').textContent = st.past ? 'Пройдено' : LBL[st.v];
      });
    });
    var t = $('[data-mypath]'); if (t) t.checked = myPath();
  }

  function rStep(tab, s, i) {
    var key = tab + i, st = stepState(tab, i), v = st.v;
    var docs = (s.docs || []).map(function (d, j) { return [docKey(tab, i, s, j), d]; });
    return '<div class="pl-step ' + v + (st.past ? ' pl-past" inert' : '"') + ' data-step="' + key + '">' +
      '<button type="button" class="pl-chk" data-cycle="' + key + '"' + (st.past ? ' disabled' : '') + ' aria-label="' + esc(s.t) + ': ' + (st.past ? 'пройдено' : LBL[v] + '. Сменить статус') + '">' + box(v) + '</button>' +
      '<details id="pl-d-' + key + '"><summary><span class="t"><span class="n">0' + (i + 1) + '</span>' + s.t + '<small>' + s.s + '</small></span><span class="pl-st">' + (st.past ? 'Пройдено' : LBL[v]) + '</span><span class="pl-gain" data-gain="' + key + '"></span>' + (docs.length ? '<span class="pl-cnt" data-o="dc-' + key + '"></span>' : '') + ms('expand_more', 'chev') + '</summary>' +
      '<div class="body">' + s.b.map(function (p) { return '<p>' + p + '</p>'; }).join('') +
        (docs.length ? '<div><div class="pl-eyebrow" style="margin-bottom:4px">Документы</div>' + checks(docs) + '</div>' : '') +
        (s.tip ? tipHtml(s.tip) : '') + (s.warn ? tipHtml(s.warn, 1) : '') + srcLine(s.src) +
      '</div></details></div>';
  }

  function rToolVnzh() {
    return '<div class="pl-tool" aria-live="polite"><div class="pl-tool-h">' + ms('timer') + 'Таймер ожидания</div>' +
      '<div class="pl-fields">' + field('filed', 'Подал заявление', 'date') + field('cardExp', 'Карта или виза до', 'date') + '</div>' +
      '<div class="pl-out" data-fitcells="150"><div><div class="v" data-o="waitDays">0</div><div class="k">' + 'дней жду' + '</div><div class="d">среднее <span data-bind="loc"></span>: <span data-bind="wait"></span></div></div>' +
        '<div><div class="v" data-o="cardLeft">—</div><div class="k">дней до конца карты или визы</div><div class="d" data-o="cardMsg">Укажи дату</div></div></div>' +
      '<div class="pl-prog" data-o="waitBar"><i></i></div><div class="pl-msg" data-o="waitMsg"></div><p class="pl-note" data-o="lawMsg"></p></div>';
  }
  function rToolPmzh() {
    return '<div class="pl-tool" aria-live="polite"><div class="pl-tool-h">' + ms('luggage') + 'Стаж и выезды для rezydenta UE</div>' +
      '<div class="pl-fields">' + field('since', 'Легально в Польше с', 'date', '', 'since2') + '</div>' +
      '<div class="pl-out" data-fitcells="150"><div><div class="v" data-o="stY">0</div><div class="k" data-o="stK">дней из 1 826</div><div class="d" data-o="stDate">Укажи дату</div></div>' +
        '<div><div class="v" data-o="trTot">0</div><div class="k">дней за границей из ~304</div><div class="d">лимит 10 месяцев за 5 лет</div></div>' +
        '<div><div class="v" data-o="trMax">0</div><div class="k">самый длинный выезд из ~183</div><div class="d">лимит 6 месяцев за раз</div></div></div>' +
      '<div class="pl-prog" data-o="stBar"><i></i></div>' +
      '<div><div class="pl-row" style="justify-content:space-between;margin-bottom:10px"><span class="pl-eyebrow">Выезды</span><span data-o="trStatus"></span></div><div class="pl-trips" data-o="trips"></div>' +
      '<button type="button" class="pl-btn" data-trip-add style="margin-top:10px">' + ms('add') + 'Добавить выезд</button></div></div>';
  }
  function rToolPass() {
    var p = S.f.cpath || 'std';
    return '<div class="pl-tool" aria-live="polite"><div class="pl-tool-h">' + ms('event') + 'Когда можно на гражданство</div>' +
      '<div class="pl-fields"><div class="pl-field"><label class="pl-eyebrow" for="pl-f-cpath">Мой путь</label><select class="pl-input pl-sel" id="pl-f-cpath" data-f="cpath">' +
        [['std', 'Обычный: 3 года на ПМЖ'], ['mar', 'Брак с гражданином: 2 года'], ['kp', 'Karta Polaka: 1 год']].map(function (o) { return '<option value="' + o[0] + '"' + (p === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') +
      '</select></div>' + field('staly', 'ПМЖ или rezydent UE с', 'date') + '</div>' +
      '<div class="pl-out" data-fitcells="150"><div><div class="v" data-o="cLeft">—</div><div class="k">дней до заявления</div><div class="d" data-o="cDate">Укажи дату</div></div></div>' +
      '<div class="pl-prog" data-o="cBar"><i></i></div>' + tipHtml('9.01.2026 Сейм отклонил 10 лет на ПМЖ. MSWiA готовит минимум 8 лет, тест и высокий польский. Если правила поменяют, калькулятор тоже поменяем.') + '</div>';
  }


  /* «Твой ужонд»: one office per voivodeship, where and how to file, payment details with proof links; redrawn when the city changes */
  var payCheck = null;
  function accHtml(kind, what, a) {
    var digits = a[1].replace(/\s/g, '');
    return '<div class="pb-acc"><div class="pl-eyebrow">' + kind + '</div><div class="pb-acc-w">' + what + '</div>' +
      '<div class="pb-acc-n"><b>' + esc(a[0]) + '</b><code>' + a[1] + '</code></div>' +
      '<div class="pl-row" style="gap:8px;flex-wrap:wrap"><button type="button" class="pl-btn pl-btn-s" data-copy="' + digits + '">' + ms('content_copy') + '<span>Копировать</span></button>' +
      '<a class="pl-small" href="' + a[2] + '" target="_blank" rel="noopener">пруф на сайте ужонда</a></div></div>';
  }
  function rUzhond() {
    var c = city(), vk = CITIES[S.city] ? CITIES[S.city].vo : 'pomorskie', P0 = PAY.v[vk], V = VOIV[vk];
    var others = CITY_ORDER.filter(function (id) { return CITIES[id].vo === vk && id !== S.city; }).map(function (id) { return CITIES[id].loc; });
    var addr = (P0.addr || []).map(function (x) { return '<li><b>' + x[0] + ':</b> ' + x[1] + '</li>'; }).join('');
    var chk = payCheck && payCheck.v && payCheck.v[vk], bad = chk && (chk.tax === false || chk.card === false);
    var checked = payCheck && payCheck.checked ? 'робот проверил их ' + payCheck.checked : 'робот проверяет их раз в неделю';
    return '<p>Один на всё воеводство ' + c.voiv + ': решает дела иностранцев ' + [c.loc].concat(others).join(', ').replace(/, ([^,]*)$/, ' и $1') + (others.length ? '' : ' и по всему региону') + '. ' +
        (vk === 'pomorskie' ? 'Своего отдела для иностранцев в Гдыне и Сопоте нет: в Гдыне только паспортный отдел для поляков. Принимают в Гданьске и в отделе в Слупске.' : 'Отдельного ужонда в другом городе воеводства нет, бывают только его отделы (delegatury).') + '</p>' +
      '<ol class="pb-uz-how">' +
        '<li><b>Подать.</b> ВНЖ, ПМЖ и rezydent UE только онлайн в ' + link('https://mos.cudzoziemcy.gov.pl/', 'MOS') + ', с PESEL и profilem zaufanym. К заявлению приложи подтверждения оплат ниже.</li>' +
        '<li><b>Прийти.</b> На отпечатки ужонд вызовет письмом сам.' + (P0.book ? ' Остальные визиты (карта, dokument podróży, braki) по записи: ' + link(P0.book, 'запись онлайн') + '.' : '') + '</li>' +
        (addr ? '<li><b>Куда.</b><ul>' + addr + '</ul></li>' : '<li><b>Куда.</b> Адрес и часы на ' + link(P0.info || V.u, 'странице отдела') + '.</li>') +
      '</ol>' +
      '<div class="pb-accs">' +
        accHtml('Opłata skarbowa, город', 'ВНЖ 340 zł, ВНЖ и работа 440 zł, ПМЖ и rezydent UE 640 zł (по Karcie Polaka 0 zł)' + (P0.cit ? '. Uznanie obywatelstwa 1000 zł сюда же' : ''), P0.tax) +
        accHtml('Карта и документы, ужонд', 'Karta pobytu 100 zł, dokument podróży 350 zł (беларусам бесплатно)', P0.card) +
      '</div>' +
      '<p class="pl-note">В заголовке перевода: за что платишь и имя с фамилией, например «opłata za zezwolenie na pobyt czasowy, Ivan Ivanov». ' +
        'MOS просит приложить к заявлению подтверждения обеих оплат, карты тоже (' + link(PAY.list, 'mos.cudzoziemcy.gov.pl') + ', 30.04.2026).' + (vk === 'pomorskie' ? ' Поморский ужонд при этом пишет, что за карту можно платить после решения.' : '') + '</p>' +
      (bad ? tipHtml('При последней проверке номер не нашёлся на странице ужонда. Возможно, его сменили: сверь по ссылке «пруф» перед оплатой.', 1) : '') +
      '<p class="pl-note">Номера сверены с сайтами ужондов ' + PAY.verified + ', ' + checked + '. Платить в MOS нельзя, только переводом или в кассе.</p>';
  }
  /* passport: expiry countdown; for Belarusians the simplified Polish travel document until 31.12.2026 */
  var PDPC_END = '2026-12-31';
  function rPassport() {
    return '<div class="pl-fields">' + field('passExp', 'Паспорт действует до', 'date') + '</div>' +
      '<div class="pl-out" data-fitcells="150" data-pe-out hidden><div><div class="v" data-o="peLeft">0</div><div class="k" data-o="peK">дней до конца паспорта</div><div class="d" data-o="peD">Укажи дату</div></div></div>' +
      '<div data-o="peMsg"></div>' +
      '<div class="pl-acc"><details id="pl-d-pdpc"><summary><span class="t">Polski dokument podróży для беларусов<small>Если паспорт истёк, а в посольство нельзя</small></span>' + ms('expand_more', 'chev') + '</summary><div class="body">' +
        '<p>Упрощённо дают беларусам с ВНЖ на любом основании, ПМЖ, rezydentem UE, ochroną uzupełniającą или гуманитарным статусом. Условие: паспорт истёк, утерян, испорчен или его никогда не было. Пока паспорт действует, не дадут.</p>' +
        '<p>Заявления по упрощённым правилам принимают до 31.12.2026 (<span data-o="pdpcLeft"></span>). Для беларусов бесплатно, обычная цена 350 zł. Документ на 1 год, по нему можно много раз пересекать границу.</p>' +
        '<p>Как: бланк в MOS, подать лично в ужонде или по почте. Приложи фото, копию истёкшего паспорта и копию карты побыту. Забирать лично. Выдаёт <span data-bind="uw"></span>.</p>' +
        tipHtml('Это не паспорт Польши и не гражданство. Для ВНЖ и ПМЖ нужен действующий паспорт, а для ПМЖ без него и без шанса его получить в обоснованных случаях принимают другой документ личности.') +
        srcLine([['https://www.mos.cudzoziemcy.gov.pl/kategorie-informacji/dokumenty/dokumenty-op3/pdpc/', 'mos.cudzoziemcy.gov.pl'], ['https://www.gov.pl/web/udsc/ulatwienia-dla-obywateli-bialorusi-dotyczace-wydawania-polskich-dokumentow-podrozy-dla-cudzoziemca---przedluzenie-do-31-grudnia-2026-r', 'gov.pl/web/udsc'], ['https://www.mos.cudzoziemcy.gov.pl/kategorie-informacji/mozliwosci-legalizacji/spoza-ue-kontynuacja-pobytu/zezwolenie-na-pobyt-staly/', 'MOS, pobyt stały']]) +
        '<p class="pl-note">Проверено 16.11.2026.</p>' +
      '</div></details></div>';
  }
  function updatePassport() {
    var t = today(), e = parseD(S.f.passExp), end = parseD(PDPC_END), dl = days(t, end), msg = '';
    out('pdpcLeft', dl >= 0 ? 'осталось ' + n0(dl) + ' ' + dWord(dl) : 'срок прошёл, следи за продлением');
    var box = $('[data-pe-out]'); if (box) box.hidden = !e;
    if (!e) { out('peLeft', '0'); out('peK', 'дней до конца паспорта'); out('peD', 'Укажи дату'); out('peMsg', ''); return; }
    var d = days(t, e);
    out('peLeft', n0(Math.abs(d))); out('peK', d >= 0 ? dWord(d) + ' до конца паспорта' : dWord(-d) + ' как истёк'); out('peD', 'До ' + fmtD(e));
    if (d < 0) msg = tipHtml('Паспорт истёк. Беларусам с ВНЖ, ПМЖ или защитой можно подать на polski dokument podróży' + (dl >= 0 ? ', упрощённо ещё ' + n0(dl) + ' ' + dWord(dl) : '') + '. Подробности ниже.', 1);
    else if (d < 183) msg = tipHtml('Меньше полугода. Если продлить в посольстве нельзя, после окончания срока сможешь подать на polski dokument podróży (для беларусов упрощённо до 31.12.2026).');
    out('peMsg', msg);
  }
  var lastPct = null;
  function bumpPct(p) {
    if (lastPct != null && p > lastPct) $$('.pl-lvl').forEach(function (el) { var b = document.createElement('span'); b.className = 'pl-lvl-up'; b.setAttribute('aria-hidden', 'true'); b.textContent = '+' + (p - lastPct) + '%'; el.appendChild(b); setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 1500); });
    lastPct = p;
  }
  function updateGains() {
    $$('[data-gain]').forEach(function (el) {
      var key = el.getAttribute('data-gain'), k = key.replace(/\d+$/, ''), i = +key.match(/\d+$/)[0], g = stepGain(k), st = stepState(k, i);
      el.textContent = g && st.v !== 'done' ? '+' + String(Math.round(g * 10) / 10).replace('.', ',') + '%' : '';
    });
  }
  function loadPayCheck() {
    if (!window.fetch || !/^https?:/.test(location.protocol) || !PATHS) return;
    fetch('/data/pay-check.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (j && j.v) { payCheck = j; out('uzhond', rUzhond()); } }).catch(function () {});
  }

  /* a card that starts folded: the summary keeps the title and a one-line status */
  function card(id, icon, title, sumKey, body, cls) {
    return '<details class="pl-tool pb-card' + (cls ? ' ' + cls : '') + '" id="' + id + '"><summary class="pb-card-h">' + icon +
      '<span class="t">' + title + '<small data-o="' + sumKey + '"></small></span>' +
      '<span class="pb-tog" aria-hidden="true">' + svg18('expand', 18, 'pb-tog-e') + svg18('collapse', 18, 'pb-tog-c') + '</span></summary>' +
      '<div class="pb-card-b">' + body + '</div></details>';
  }
  /* invitation (zaproszenie): an inviting foreigner needs 5 years of legal, unbroken stay right before filing, or stały pobyt / rezydent UE */
  function invOpen() {
    var since = parseD(S.f.since), t = today(), si = STAGE_IDX[S.stage] || 0;
    if (si >= 4 || S.f.staly) return { ok: true, why: 'у тебя ПМЖ или rezydent UE' };
    if (!since || since > t) return { ok: false, none: true };
    var at = addY(since, 5), d = days(t, at);
    return d <= 0 ? { ok: true, why: 'ты легально в Польше больше 5 лет' } : { ok: false, at: at, d: d };
  }
  var OWNER_OK = 'Gdańsk, dnia ..........\n\nOświadczenie właściciela lokalu\n\nJa, niżej podpisany/a [imię i nazwisko właściciela], PESEL [numer], właściciel/ka lokalu mieszkalnego przy ul. [ulica, numer domu/mieszkania], [kod pocztowy] [miejscowość], wyrażam zgodę na zakwaterowanie w tym lokalu cudzoziemca [imię i nazwisko], urodzonego/ej [data urodzenia], obywatela/ki [państwo], w okresie od [data] do [data], na zaproszenie [imię i nazwisko zapraszającego], który/a wynajmuje ten lokal.\n\n..........................\n(czytelny podpis właściciela)';
  function rInvite() {
    var rows = [
      ['Osoba fizyczna / prawna', 'Osoba fizyczna'],
      ['A.5 Obywatelstwo', 'białoruskie (или твоё)'],
      ['A.II Rodzaj dokumentu, seria, numer', 'karta pobytu или paszport'],
      ['A.II Numer REGON', 'пусто, это для фирм'],
      ['A.III Liczba osób na utrzymaniu', 'сколько человек ты содержишь: дети, неработающий супруг'],
      ['A.IV.1 Tytuł prawny do lokalu', '«umowa najmu» или «własność»'],
      ['A.IV.2 Powierzchnia użytkowa', 'метры из договора или акта'],
      ['A.IV.3 Osoby zameldowane', 'сколько прописано, на stałe или czasowo'],
      ['A.V Zaproszeni w ciągu roku', 'скольких иностранцев приглашал за год, часто 0'],
      ['B.10 Stopień pokrewieństwa', 'matka, ojciec, syn, córka, brat, siostra, teść, teściowa; не родня: «brak» или «znajomy»'],
      ['B.11 Dokument podróży', 'серия и номер паспорта гостя'],
      ['B.II Adres zakwaterowania', 'где гость будет жить в Польше'],
      ['B.III Cel pobytu', '«odwiedziny rodziny», «odwiedziny» или «turystyka»'],
      ['Okres', 'od … do …, не дольше года']
    ];
    return '<p data-o="invMsg"></p>' +
      '<p>Приглашение (zaproszenie) это бумага от воеводы: ты обещаешь оплатить гостю жильё, еду и дорогу домой. С ней родственник или друг идёт в консульство за визой: в гости, туристом, к семье. Работать по нему нельзя. Действует на период, который ты указал, но не дольше года. Ужонд вписывает его в течение месяца.</p>' +
      '<p><b>Кто может.</b> Иностранец, который прямо перед подачей живёт в Польше легально и без перерыва минимум 5 лет, или у кого есть ПМЖ или rezydent UE. Перерывы считают как для ПМЖ. Приглашай только тех, кого хорошо знаешь: если гость не уедет, расходы на его выдворение тоже на тебе.</p>' +
      '<div class="pl-tool-h" style="font-size:16px">' + ms('calculate') + 'Сколько денег показать</div>' +
      '<div class="pl-fields">' + field('invMonths', 'Месяцев гостит', 'number', ' min="0" step="0.5" inputmode="decimal"') + field('invDeps', 'Ты содержишь, человек', 'number', ' min="0" step="1" inputmode="numeric"') + field('invGuests', 'Гостей', 'number', ' min="1" step="1" inputmode="numeric"') +
        selField('invTrip', 'Гость едет домой', [['near', 'Беларусь, сосед: 200 zł'], ['eu', 'Европа: 500 zł'], ['far', 'Не Европа: 2500 zł']]) + '</div>' +
      '<label class="pl-toggle"><input type="checkbox" data-f="invRel"' + (S.f.invRel ? ' checked' : '') + '>Гость близкий родственник: родитель, ребёнок, супруг, брат или сестра, родитель или ребёнок супруга</label>' +
      '<div class="pl-out" data-fitcells="150"><div><div class="v" data-o="invSum">0</div><div class="k">zł на счёте или в доходе</div><div class="d" data-o="invHow"></div></div></div>' +
      '<p class="pl-note">Правило: 515 zł в месяц на тебя, на каждого, кого ты содержишь, и на каждого гостя. За близкого родственника 200 zł в месяц. Плюс дорога домой каждому гостю, или его обратный билет. Меньше месяца считается пропорционально. Деньги показывают выпиской со счёта сразу на весь срок или справкой о доходе на каждый месяц.</p>' +
      '<div class="pl-tool-h" style="font-size:16px">' + ms('description') + 'Что писать в бланке</div>' +
      '<p>Бланк «Wniosek o wpisanie zaproszenia do ewidencji zaproszeń» есть на странице твоего ужонда. Пиши печатными буквами по-польски, заполни все поля в частях A и B, часть C для ужонда. Пустой адрес = заявление не рассмотрят.</p>' +
      '<div class="pl-rows pb-inv-rows">' + rows.map(function (r) { return '<div><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join('') + '</div>' +
      '<div class="pl-tool-h" style="font-size:16px">' + ms('upload_file') + 'Что приложить</div>' +
      '<ul class="pl-list"><li>Подтверждение оплаты 27 zł (opłata skarbowa, счёт города из карточки «Твой ужонд»)</li><li>Выписку со счёта на всю сумму или справку о доходах</li><li>Договор аренды или акт собственности. Если гость живёт не у тебя, бронь или договор на другое жильё: в брони видно, кто бронирует, для кого и на какие даты</li><li>Снимаешь: согласие владельца, что гость поживёт в квартире. Пример ниже</li><li>Свой документ: karta pobytu или паспорт</li></ul>' +
      '<div class="pb-acc"><div class="pl-eyebrow">Пример: согласие владельца квартиры</div><pre class="pb-tpl">' + esc(OWNER_OK) + '</pre>' +
        '<div class="pl-row"><button type="button" class="pl-btn pl-btn-s" data-copy="' + esc(OWNER_OK) + '">' + ms('content_copy') + '<span>Копировать</span></button><span class="pl-small pl-muted">Единого образца нет, это пример. Подставь свои данные вместо скобок.</span></div></div>' +
      '<p><b>Куда.</b> В ужонд своего воеводства (<span data-bind="uw"></span>), лично или почтой, если он так принимает: смотри страницу отдела. В Слупске Поморский принимает заявления на приглашение по записи. Забираешь лично или по доверенности (17 zł). Готовое приглашение отдай гостю для консульства.</p>' +
      srcLine([['https://bip.lubuskie.uw.gov.pl/sprawy_obywatelskie/Wpis_do_ewidencji_zaproszen', 'bip.lubuskie.uw.gov.pl'], ['https://www.gov.pl/web/uw-zachodniopomorski/zaproszenia', 'gov.pl/web/uw-zachodniopomorski'], ['https://migrant.poznan.uw.gov.pl/pl/procedury/wpis-zaproszenia-do-ewidencji-zaproszen', 'migrant.poznan.uw.gov.pl'], ['https://migrant.poznan.uw.gov.pl/en/system/files/pliki/formularz_zaproszenia.pdf', 'бланк, Познань'], ['https://www.gov.pl/attachment/872c2503-946e-4534-adf9-ea66044632e4', 'karta informacyjna, gov.pl']]) +
      '<p class="pl-note">Проверено 16.11.2026.</p>';
  }
  function updateInvite() {
    var o = invOpen(), num = function (k, d) { var v = parseFloat(String(S.f[k] == null || S.f[k] === '' ? d : S.f[k]).replace(',', '.')); return isNaN(v) || v < 0 ? +d : v; };
    var m = num('invMonths', 1), deps = Math.round(num('invDeps', 0)), g = Math.max(1, Math.round(num('invGuests', 1)));
    var trip = { near: 200, eu: 500, far: 2500 }[S.f.invTrip] || 200, rel = !!S.f.invRel;
    var stay = rel ? g * 200 * m : (1 + deps + g) * 515 * m, sum = Math.round(stay + g * trip);
    out('invSum', n0(sum));
    out('invHow', (rel ? g + ' × 200 zł × ' + m : (1 + deps + g) + ' × 515 zł × ' + m) + ' мес. + дорога ' + g + ' × ' + trip + ' zł');
    var st = o.ok ? 'Доступно: ' + o.why : o.none ? 'Укажи в «Своё», с какого дня ты легально в Польше' : 'Через ' + n0(o.d) + ' ' + dWord(o.d) + ', с ' + fmtD(o.at);
    out('invSum2', st);
    out('invMsg', o.ok ? '' : tipHtml(o.none ? 'Приглашать можно после 5 лет легальной жизни в Польше без перерыва или с ПМЖ. Укажи дату в «Своё», и тут появится, когда станет можно.' : 'Пока рано: 5 лет наберётся ' + fmtD(o.at) + '. С ПМЖ или rezydentem UE можно сразу.'));
    var c = $('#pl-d-inv'); if (c) c.classList.toggle('is-off', !o.ok);
  }
  function updateCardSums() {
    out('uzSum', 'Куда и как подавать, реквизиты');
    var e = parseD(S.f.passExp), d = e ? days(today(), e) : null;
    out('peSum', e ? (d >= 0 ? n0(d) + ' ' + dWord(d) + ' до конца' : 'Истёк ' + n0(-d) + ' ' + dWord(-d) + ' назад') : 'Срок и dokument podróży для беларусов');
  }
  function rLegal() {
    var tabs = '<div class="pl-seg" role="tablist" aria-label="Этапы легализации">' + L_ORDER.map(function (k) {
      return '<button type="button" role="tab" id="pl-tab-' + k + '" aria-controls="pl-panel-' + k + '" data-legal="' + k + '" aria-selected="' + (k === S.legal) + '">' + LEGAL[k].tab + '<span class="pl-cnt" data-o="tc-' + k + '"></span></button>';
    }).join('') + '</div>';
    var panels = L_ORDER.map(function (k) {
      var L = LEGAL[k];
      return '<div role="tabpanel" id="pl-panel-' + k + '" aria-labelledby="pl-tab-' + k + '"' + (k === S.legal ? '' : ' hidden') + '><div class="pl-split">' +
        '<div class="pl-side"><div class="pl-eyebrow">' + L.code + '</div><div class="t">' + L.title + '</div><div class="s">' + L.sub + '</div><div class="i">' + L.irony + '</div>' +
          '<div class="pl-fees">' + L.fees.map(function (f) { return '<span class="pl-fee"><span>' + f[0] + '</span>' + f[1] + '</span>'; }).join('') + '</div>' +
          (k === 'pmzh' ? '<div class="pl-field" style="margin-top:8px"><label class="pl-eyebrow" for="pl-pmzh-path">Моё основание</label><select class="pl-input pl-sel" id="pl-pmzh-path" data-pmzh-path>' + PM_PATHS.map(function (o) { return '<option value="' + o[0] + '"' + (pmPath() === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' : '') + '</div>' +
        '<div class="pl-main"><div class="pl-acc">' + L.steps.map(function (s, i) { return rStep(k, stepOf(k, i), i); }).join('') + '</div>' +
          (k === 'vnzh' ? rToolVnzh() : k === 'pmzh' ? (pmPath() === 'rd' || pmPath() === 'prot' ? rToolPmzh() : '') : rToolPass()) + '</div>' +
      '</div></div>';
    }).join('');
    return '<section class="pl-band pb-screen" id="pl-legal" aria-labelledby="pl-legal-h"><h1 class="sr" id="pl-legal-h">Легализация в Польше: ВНЖ, ПМЖ и паспорт по шагам</h1>' +
      '<div class="pb-legal-cards">' +
        card('pl-d-uz', svgi('bank', 24), 'Твой ужонд: <span data-bind="uw"></span>', 'uzSum', '<div class="pb-uz" data-o="uzhond"></div>') +
        card('pl-d-pass', svg18('pass', 24), 'Паспорт', 'peSum', '<div class="pb-pass" aria-live="polite">' + rPassport() + '</div>') +
        card('pl-d-inv', ms('flight_land'), 'Пригласить гостя', 'invSum2', '<div class="pb-inv" aria-live="polite">' + rInvite() + '</div>') +
      '</div>' +
      '<p class="pl-small pl-muted pb-uw">Квадрат слева меняет статус шага, каждый шаг добавляет проценты к уровню. Всё сохраняется только в браузере.</p>' +
      '<div class="pl-legal-bar">' + tabs + '<label class="pl-toggle pl-mypath"><input type="checkbox" data-mypath' + (myPath() ? ' checked' : '') + '><span>Мой путь<small class="pl-xs pl-muted">пройденное по «Где ты сейчас» и датам в «Своё»</small></span></label></div>' +
      panels + '</section>';
  }
  function rBy() {
    return '<section class="pl-band pb-screen" id="pl-by" aria-labelledby="pl-by-h">' + head('pl-by', 'Беларусам отдельно', '', '', '', 'То, чего нет в общих гайдах') +
      '<div class="pb-cols">' + BELARUS.map(function (b, i) {
        return '<article class="pb-col" id="pl-d-by' + i + '"><div class="pb-col-h">' + ms(b.ic, 'lead-ico') + '<h3>' + b.t + '<small>' + b.s + '</small></h3></div>' +
          b.b.map(function (p) { return '<p>' + p + '</p>'; }).join('') + srcLine(b.src) + '</article>';
      }).join('') + '</div></section>';
  }

  function cards(list, color, fg) {
    return '<div class="pl-cards" data-fitcells="120">' + list.map(function (c) {
      return '<article class="pl-card"><div class="top"><span class="cico" style="background:' + color + ';color:' + fg + '">' + ms(c.ic) + '</span><span class="tag">' + c.tag + '</span></div>' +
        '<div class="t">' + c.t + '</div><div class="big' + (/[а-яё]/i.test(c.big) ? ' txt' : '') + '">' + c.big + '</div><div class="x">' + c.x + '</div><div class="i">' + c.i + '</div>' +
        (c.more ? '<details><summary>Подробнее' + ms('expand_more') + '</summary><ul class="pl-list" style="--dotc:' + color + '">' + c.more.map(function (m) { return '<li>' + m + '</li>'; }).join('') + '</ul></details>' : '') + '</article>';
    }).join('') + '</div>';
  }

  /* data-w: the contracts a block is shown for */
  function only(w, html) { return html.replace(/^<(\w+)/, '<$1 data-w="' + w + '"'); }
  function selField(id, label, opts) {
    var v = S.f[id] != null ? String(S.f[id]) : opts[0][0];
    return '<div class="pl-field"><label class="pl-eyebrow" for="pl-f-' + id + '">' + label + '</label><select class="pl-input pl-sel" id="pl-f-' + id + '" data-f="' + id + '">' +
      opts.map(function (o) { return '<option value="' + o[0] + '"' + (v === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>';
  }
  function tog(w, id, label) { return '<label class="pl-toggle" data-w="' + w + '"><input type="checkbox" data-f="' + id + '"' + (S.f[id] ? ' checked' : '') + '>' + label + '</label>'; }
  /* mortgage capacity: contract shared with «Бабки», bank income rules, the real monthly payment and the cash needed up front */
  function rMort() {
    var seg = '<div class="pl-seg" role="group" aria-label="Твой договор">' + C_ORDER.map(function (k) {
      return '<button type="button" data-contract="' + k + '" data-mcon aria-pressed="' + (k === S.contract) + '">' + CONTRACTS[k].tab + '</button>';
    }).join('') + '</div>';
    var row = function (k, o, cls) { return '<div' + (cls ? ' class="' + cls + '"' : '') + ' data-mr="' + o + '"><span data-o="' + o + 'K">' + k + '</span><b data-o="' + o + '"></b></div>'; };
    var chk = function (id, label) { return '<label class="pl-toggle" data-mt="' + id + '"><input type="checkbox" data-f="' + id + '"' + (S.f[id] ? ' checked' : '') + '>' + label + '</label>'; };
    return '<div class="pl-tool" aria-live="polite" style="margin-top:40px"><div class="pl-tool-h">' + ms('calculate') + 'Сколько дадут на ипотеку</div>' +
      '<div class="pl-field"><span class="pl-eyebrow">Твой договор, общий с «Бабками»</span>' + seg + '<p class="pl-note" data-o="mSrc" style="margin-top:10px"></p></div>' +
      '<div class="pl-fields">' + field('mInc', 'Твой доход на руки, zł', 'number', ' inputmode="decimal" min="0" step="500"') +
        field('mInc2', 'Доход второго заёмщика, zł', 'number', ' inputmode="decimal" min="0" step="500"').replace('<div class="pl-field"', '<div class="pl-field" data-m2') +
        selField('mAd', 'Взрослых в семье', [['1', '1'], ['2', '2']]) + selField('mKids', 'Детей', [['0', '0'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']]) + '</div>' +
      '<div class="pl-fields">' + field('mDebt', 'Другие кредиты, zł в месяц', 'number', ' inputmode="decimal" min="0" step="100"') +
        field('mLim', 'Лимиты кредиток и овердрафтов, zł', 'number', ' inputmode="decimal" min="0" step="1000"') +
        field('mRate', 'Ставка, %', 'number', ' inputmode="decimal" min="0" step="0.05"') +
        selField('mYears', 'Срок', [['15', '15 лет'], ['20', '20 лет'], ['25', '25 лет'], ['30', '30 лет'], ['35', '35 лет']]) + '</div>' +
      '<div class="pl-fields">' + field('mOwn', 'Свои деньги, zł', 'number', ' inputmode="decimal" min="0" step="10000"') +
        selField('mLtv', 'Первый взнос', [['80', 'От 20%: все банки'], ['90', 'От 10%: 8 банков']]) + selField('mMkt', 'Рынок', [['wt', 'Вторичка'], ['pier', 'Новостройка']]) + '</div>' +
      '<div class="pl-fields">' + chk('mFirst', 'Первое жильё: без PCC 2%') + chk('mLife', 'Беру страховку жизни ради ставки') + '</div>' +
      '<div class="pl-out pl-out-wide" data-fitcells="150" data-fitmin="30"><div><div class="v" data-o="mLoan">0</div><div class="k">zł кредита в среднем банке</div><div class="d" data-o="mLoanD"></div></div>' +
        '<div><div class="v pl-muted" data-o="mPrice">0</div><div class="k">zł: квартира до</div><div class="d" data-o="mPriceD"></div></div></div>' +
      '<div class="pl-cols"><div><div class="pl-eyebrow">Каждый месяц</div><div class="pl-rows">' + row('Кредит', 'mPay') + row('Страховка жизни, обычно первые 3–5 лет', 'mLifeP') + row('Страховка квартиры, обязательная', 'mProp') +
          row('Итого в месяц', 'mTot', 'tot') + row('Пока суд не впишет ипотеку, от 2 до 12 месяцев', 'mBridge') + row('Тот же кредит в проверке банка', 'mStress') +
          row('Банк закладывает семье на жизнь', 'mLive') + row('Все кредиты к доходу в проверке', 'mDsti') + '</div></div>' +
        '<div><div class="pl-eyebrow">Сразу из своих денег</div><div class="pl-rows">' + row('Первый взнос', 'mDown') + row('PCC 2%', 'mPcc') + row('Нотариус по максимальной таксе, с VAT', 'mNot') +
          row('Суд: запись собственности и ипотеки', 'mCourt') + row('Оценка квартиры для банка, примерно', 'mVal') + row('Всего своих', 'mNeed', 'tot') + '</div></div></div>' +
      '<p class="pl-note" data-o="mNote"></p>' +
      '<div class="pl-tip">' + ms('lightbulb') + '<span data-o="mCon"></span></div>' +
      tipHtml('Квартиру иностранец покупает без разрешения MSWiA, если она не в приграничной зоне. На дом или участок разрешение нужно, пока не прожил 5 лет с ПМЖ или резидентом ЕС. С картой временного побыту часть банков ипотеку не даёт или хочет, чтобы карта действовала ещё 6–12 месяцев.') +
      '<p class="pl-note">Как считаем: по правилам KNF банк проверяет платёж при ставке выше на 2,5 п.п. и максимум на 25 лет, даже если берёшь на 30 или 35. Запас на жизнь и долю платежа в доходе мы подобрали по расчётам 12–13 банков за август и сентябрь 2026 (umowa o pracę, без других кредитов): на этих данных ошибка в среднем 2–7%. ' +
        'Страховки взяли как середину восьми лучших предложений августа 2026: жизнь 0,035% от кредита в месяц, квартира 0,085% от цены в год. Комиссия в них 0%, у семи из восьми ставка 5,47–5,67%, но со счётом для зарплаты, картой и почти везде страховкой жизни. Нотариус по максимальной таксе: за квартиру половина ставки, за ипотеку четверть. ' +
        'Между банками разница бывает в 2–3 раза, так что считай это ориентиром, а точную сумму спроси у брокера. 800+ в доход не вписывай: часть банков его учитывает, это уже усреднено.</p>' +
      srcLine([['https://bip.knf.gov.pl/knf/pl/komponenty/img/Rekomendacja_S_nowelizacja_czerwiec_2023_82872.pdf', 'Rekomendacja S, KNF'], ['https://rutkowskihome.pl/pl/finansy/kreditosposobnost-v-polshe-v-sentyabre-2026-goda-skolko-mozhno-poluchit-na-ipoteku-i-pochemu-banki-snova-uzhestochayut-raschyoty/', 'отчёт ANG, сентябрь 2026'], ['https://blogdariuszkaczorowski.pl/ranking-zdolnosci-kredytowej/', 'ранкинг банков, август 2026'],
        ['https://marciniwuc.com/wp-content/uploads/2026/08/Najlepsze-oferty-500k-80LTV-zmienne-30lat-2026-08-03.pdf', 'лучшие предложения, август 2026'], ['https://hipoteczny.pl/blog/kredyt-hipoteczny-na-ryczalcie/', 'банки и ryczałt'], ['https://bankoweabc.pl/jak-banki-licza-zdolnosc-kredytowa-na-ryczalcie/', 'доля выручки на ryczałcie'],
        ['https://marciniwuc.com/?p=50832', 'стаж и договоры'], ['https://rankomat.pl/finanse/poradniki/minimalny-okres-zatrudnienia-a-kredyt-hipoteczny/', 'минимальный стаж'], ['https://rankomat.pl/finanse/poradniki/kredyt-hipoteczny-z-10-wkladem-wlasnym/', 'взнос 10%'],
        ['https://direct.money.pl/artykuly/porady/ubezpieczenie-pomostowe-co-to-jest-ubezpieczenie-pomostowe-kredytu-i-ile-kosztuje', 'страховка до записи ипотеки'], ['https://www.infor.pl/twoje-pieniadze/podatki/7627213,0-pcc-przy-zakupie-nieruchomosci-z-rynku-wtornego-te-przepisy-juz-obowiazuja-i-jest-tylko-jeden-warunek.html', 'PCC и первое жильё'],
        ['https://api.sejm.gov.pl/eli/acts/DU/2020/1473/text.html', 'такса нотариуса'], ['https://powroty.gov.pl/nieruchomosci-nie-wymagajace-zezwolenia-9953/', 'покупка без разрешения'], ['https://rankomat.pl/finanse/poradniki/kredyt-dla-obcokrajowca-z-karta-czasowego-pobytu/', 'кредит с картой побыту'],
        ['https://freenance.io/kredyty/ukryte-koszty-kredytu-hipotecznego-2026-prowizje-ubezpieczenia-notariusz-realny-RRSO/', 'расходы на ипотеку'], ['https://rankomat.pl/finanse/poradniki/karta-kredytowa-a-kredyt-hipoteczny/', 'лимиты карт']]) + '</div>';
  }
  function rMoney() {
    var tabs = '<div class="pl-seg" role="tablist" aria-label="Вид договора">' + C_ORDER.map(function (k) {
      return '<button type="button" role="tab" id="pl-ct-' + k + '" aria-controls="pl-cp" data-contract="' + k + '" aria-selected="' + (k === S.contract) + '">' + CONTRACTS[k].tab + '</button>';
    }).join('') + '</div>';
    var side = C_ORDER.map(function (k) {
      var c = CONTRACTS[k];
      return '<div class="pl-side" data-w="' + k + '"><div class="pl-eyebrow">' + c.code + '</div><div class="t">' + c.t + '</div><div class="s">' + c.s + '</div><div class="i">' + c.i + '</div>' +
        '<div class="pl-fees">' + c.fees.map(function (f) { return '<span class="pl-fee"><span>' + f[0] + '</span>' + f[1] + '</span>'; }).join('') + '</div>' +
        '<ul class="pl-list" style="--dotc:var(--c-money);margin-top:8px">' + c.more.map(function (m) { return '<li>' + m + '</li>'; }).join('') + '</ul></div>';
    }).join('');
    var calc = '<div class="pl-tool" aria-live="polite"><div class="pl-tool-h">' + ms('calculate') + '<span data-w="uop zlec dzielo">Brutto → на руки</span><span data-w="b2b">Выручка → на руки</span></div>' +
      '<div class="pl-fields">' +
        only('uop zlec dzielo', field('brutto', 'Brutto в месяц, zł', 'number', ' inputmode="decimal" min="0" step="100"')) +
        only('b2b', field('rev', 'Выручка в месяц без VAT, zł', 'number', ' inputmode="decimal" min="0" step="500"')) +
        only('b2b', field('cost', 'Расходы фирмы в месяц, zł', 'number', ' inputmode="decimal" min="0" step="100"')) +
        only('b2b', selField('taxf', 'Форма налога', [['skala', 'Шкала 12/32%'], ['lin', 'Линейный 19%'], ['rycz', 'Ryczałt']])) +
        only('b2b', selField('rate', 'Ставка ryczałtu', [['12', '12%: IT'], ['8.5', '8,5%: услуги'], ['14', '14%'], ['15', '15%'], ['17', '17%'], ['5.5', '5,5%: производство'], ['3', '3%: торговля']])).replace('data-w="b2b"', 'data-w="b2b" data-tax="rycz"') +
        only('b2b', selField('zusl', 'ZUS', [['auto', 'По дате открытия JDG'], ['start', 'Ulga na start: 0 zł'], ['pref', 'Preferencyjny'], ['full', 'Pełny']])) +
      '</div><div class="pl-fields">' +
        tog('uop zlec', 'u26', 'Мне меньше 26') + tog('zlec', 'stud', 'Студент до 26') + tog('uop', 'kup300', 'Работаю не в городе, где живу') +
        tog('uop zlec', 'pit2', 'Подал PIT-2') + tog('zlec b2b', 'chor', 'Добровольное chorobowe') + tog('dzielo', 'aut', 'Авторские права: KUP 50%') +
      '</div>' +
      '<div class="pl-out" data-fitcells="150"><div><div class="v" data-o="net">0</div><div class="k" data-o="netK">zł на руки</div></div><div><div class="v pl-muted" data-o="emp">0</div><div class="k" data-o="empK"></div></div></div>' +
      '<div class="pl-rows"><div data-r="cost"><span>Расходы фирмы</span><b data-o="rCost"></b></div><div data-r="soc"><span data-o="rSocK"></span><b data-o="soc"></b></div><div data-r="hea"><span data-o="rHeaK"></span><b data-o="hea"></b></div><div data-r="pit"><span data-o="rPitK"></span><b data-o="pit"></b></div><div class="tot"><span>На руки</span><b data-o="net2"></b></div></div>' +
      '<p class="pl-note" data-o="calcNote"></p>' +
      only('b2b', srcLine([['https://www.infakt.pl/blog/?p=81462', 'infakt.pl: składka zdrowotna 2026'], ['https://norman.finance/pl/pomoc/zus-dla-jdg', 'norman.finance: ZUS 2026']])) + '</div>';
    var taxes = '<h3 class="pl-h3" style="margin-top:56px">Налог</h3>' +
      '<p class="pl-lead" style="margin-top:8px" data-w="uop zlec dzielo">Здесь всегда шкала. Аванс PIT каждый месяц удерживает работодатель или заказчик, итог в годовом PIT.</p>' +
      '<p class="pl-lead" style="margin-top:8px" data-w="b2b">PIT в 2026. Форму налога выбирают раз в год, передумать можно в следующем январе-феврале.</p>' +
      '<div class="pl-cards" data-fitcells="120">' + TAXES.map(function (c) {
        return '<article class="pl-card pl-lvlcard" data-w="' + c.w + '" data-taxcard="' + c.id + '"><span class="pl-here" hidden>в расчёте</span><div class="top"><span class="cico" style="background:var(--c-money);color:#141414">' + ms(c.ic) + '</span><span class="tag">' + c.tag + '</span></div>' +
          '<div class="t">' + c.t + '</div><div class="big' + (/[а-яё]/i.test(c.big) ? ' txt' : '') + '">' + c.big + '</div><div class="x">' + c.x + '</div><div class="i">' + c.i + '</div>' +
          '<details><summary>Подробнее' + ms('expand_more') + '</summary><ul class="pl-list" style="--dotc:var(--c-money)">' + c.more.map(function (m) { return '<li>' + m + '</li>'; }).join('') + '</ul></details></article>';
      }).join('') + '</div>';
    var zus = '<div data-w="b2b"><h3 class="pl-h3" style="margin-top:56px">ZUS</h3><p class="pl-lead" style="margin-top:8px">Взносы владельца JDG растут по уровням, как в игре. Только награды нет.</p>' +
      '<div class="pl-tool" aria-live="polite"><div class="pl-tool-h">' + ms('emoji_events') + 'Мой уровень ZUS</div><div class="pl-fields">' + field('jdg', 'Открыл JDG', 'date') + '</div>' +
      '<div class="pl-out" data-fitcells="150"><div><div class="v" data-o="zLv" data-nofit style="font-size:clamp(36px,3.4vw,72px)">—</div><div class="k">сейчас</div></div><div><div class="v" data-o="zLeft">—</div><div class="k" data-o="zNext">дней до следующего уровня</div></div></div><div class="pl-prog" data-o="zBar"><i></i></div></div>' +
      '<div class="pl-cards" data-fitcells="120">' + ZUS_LV.map(function (c) {
        return '<article class="pl-card pl-lvlcard" data-zlv="' + c.id + '"><span class="pl-here" hidden>ты здесь</span><div class="top"><span class="cico" style="background:var(--c-money);color:#141414">' + ms('shield') + '</span><span class="tag">' + c.tag + '</span></div><div class="t">' + c.t + '</div><div class="big' + (/[а-яё]/i.test(c.big) ? ' txt' : '') + '">' + c.big + '</div><div class="x">' + c.x + '</div><div class="i">' + c.i + '</div></article>';
      }).join('') + '</div><p class="pl-note" style="margin-top:16px">Источники: ' + link('https://norman.finance/pl/pomoc/zus-dla-jdg', 'norman.finance') + ', ' + link('https://www.ifirma.pl/blog/maly-zus-plus-2026-kto-moze-skorzystac-i-jak-dlugo/', 'ifirma.pl') + '</p></div>';
    var dl = '<h3 class="pl-h3" style="margin-top:56px">Дедлайны</h3><p class="pl-lead" style="margin-top:8px">Дни, которые лучше не пропускать. Считаются от сегодняшней даты.</p><div class="pl-dl" data-fitcells="150">' +
      '<div data-w="uop zlec dzielo"><span class="v" data-o="dlEpit"></span><span class="k">дней до 15 февраля: Twój e-PIT появится в e-Urzędzie Skarbowym</span></div>' +
      '<div data-w="uop zlec dzielo"><span class="v" data-o="dlP11"></span><span class="k">дней до конца февраля: PIT-11 от работодателя или заказчика</span></div>' +
      '<div data-w="b2b"><span class="v" data-o="dl20"></span><span class="k">дней до 20-го: ZUS и аванс PIT</span></div>' +
      '<div data-w="b2b"><span class="v" data-o="dlMzp"></span><span class="k">дней до 31 января: заявка на Mały ZUS Plus</span></div>' +
      '<div data-w="b2b"><span class="v" data-o="dlForm"></span><span class="k">дней до 20 февраля: сменить форму налога на год</span></div>' +
      '<div><span class="v" data-o="dlPit"></span><span class="k">дней до 30 апреля: годовой PIT</span></div></div>';
    return '<section class="pl-band pb-screen" id="pl-money" aria-labelledby="pl-money-h">' + head('pl-money', 'Бабки', 'payments', 'var(--c-money)', '#141414', 'Цифры на 2026. Каждый январь всё дорожает, кроме тебя.') + tabs +
      '<div role="tabpanel" id="pl-cp" aria-labelledby="pl-ct-' + S.contract + '"><div class="pl-split">' + side + '<div class="pl-main">' + calc + '</div></div>' + taxes + zus + dl + '</div></section>';
  }

  function lifeAcc(ids) {
    return '<div class="pl-acc" style="margin-top:36px">' + LIFE.filter(function (l) { return ids.indexOf(l.id) > -1; }).map(function (l) {
      var body = l.checks ? checks(l.checks) : '<ul class="pl-list">' + l.list.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
      return '<details id="pl-d-' + l.id + '"' + (l.id === 'd30' || ids.length === 1 ? ' open' : '') + '><summary>' + ms(l.ic, 'lead-ico') + '<span class="t">' + l.t + '<small>' + l.s + '</small></span>' + (l.checks ? '<span class="pl-cnt" data-o="lc-' + l.id + '"></span>' : '') + ms('expand_more', 'chev') + '</summary><div class="body">' + body +
        (l.u ? '<p class="pl-note">Источник: ' + link(l.u, l.s2) + '</p>' : '') + '</div></details>';
    }).join('') + '</div>';
  }
  /* «Банки»: who is friendly to Belarusians, and money from Belarus */
  function rBank() {
    return '<section class="pl-band pb-screen" id="pl-bank" aria-labelledby="pl-bank-h">' + head('pl-bank', 'Банки', '', '', '', 'Кто как относится к беларусам') +
            '<p class="pl-lead" style="margin-top:8px">Насколько легко открыть счёт и пользоваться им без карты побыту. С картой побыту проще почти везде.</p>' +
      '<ol class="pl-banks">' + BANKS.map(function (b, i) {
        return '<li><span class="pl-bank-n"><span class="pl-xs pl-muted">' + (i + 1) + '</span>' + b.n + '</span>' +
          '<span class="pl-bank-s" aria-label="Лояльность ' + b.s + ' из 3: ' + BANK_LBL[b.s] + '"><span class="pl-dots">' + [1, 2, 3].map(function (k) { return '<i' + (k <= b.s ? ' class="on"' : '') + '></i>'; }).join('') + '</span>' + BANK_LBL[b.s] + '</span>' +
          '<span class="pl-bank-t">' + b.t + ' <span class="pl-muted pl-xs">' + link(b.u, b.src) + ', ' + b.d + '</span></span></li>';
      }).join('') + '</ol>' +
      '<p class="pl-note" style="margin-top:16px">Данные 2022 года собраны до санкций 2025-го, перед походом в банк уточни. По ING и Millennium проверенных правил нет: знаешь, как там сейчас, напиши нам.</p>' +
      tipHtml('С 24.10.2025 санкции ЕС (' + link('https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R2041', 'регламент 2025/2041') + ') заставляют банки строже проверять беларусов без карты побыту. С отказами по TZTC в 2026 году разбираются ' + link('https://bip.brpo.gov.pl/pl/content/rpo-bialorusini-ochrona-miedzynarodowa-konta-bankowe-knf-odpowiedz-kolejne', 'омбудсмен и KNF') + '.', 1) +
      lifeAcc(['money']) + '</section>';
  }
  /* «Дом»: mortgage numbers, the calculator, renting */
  function rHome() {
    return '<section class="pl-band pb-screen" id="pl-home" aria-labelledby="pl-home-h">' + head('pl-home', 'Дом', '', '', '', 'Ипотека в цифрах, сколько дадут и аренда') +
      '<p class="pl-lead">Средние по всей Польше, по городам официальных данных нет.</p>' +
      '<div class="pl-counts" data-fitcells="200">' +
        '<div><div class="pl-big">486 500</div><div class="pl-lab">zł: средняя ипотека</div><div class="pl-sub">BIK, сентябрь 2026. На 8,3% больше, чем год назад</div></div>' +
        '<div><div class="pl-big" style="color:var(--red)">5,95%</div><div class="pl-lab">средний процент по новым ипотекам в злотых</div><div class="pl-sub">NBP, сентябрь 2026</div></div>' +
        '<div><div class="pl-big">3 120</div><div class="pl-lab">zł в месяц за такую ипотеку на 25 лет</div><div class="pl-sub">Наш расчёт: равные платежи, без страховки и комиссий</div></div>' +
        '<div><div class="pl-big">116,4</div><div class="pl-lab">млрд zł ипотек за 9 месяцев 2026</div><div class="pl-sub">BIK. Почти треть: рефинансирование</div></div>' +
      '</div>' +
      '<p class="pl-note" style="margin-top:20px">Источники: ' + link('https://mojebankowanie.pl/informacje-prasowe/informacje-prasowe-bankowosc/bik-dane-o-rynku-kredytowym-we-wrzesniu-2026-r', 'BIK о рынке в сентябре 2026') + ', ' + link('https://finwire.pl/artykuly/nowe-kredyty-mieszkaniowe-wrzesien-2026-nbp', 'данные NBP за сентябрь 2026') + '</p>' +
      rMort() +
      '<h3 class="pl-h3" style="margin-top:56px">Ипотека иностранцу</h3>' +
      '<ul class="pl-list" style="margin-top:12px">' +
        '<li>Без карты побыту ипотеку почти не дают. Временную карту принимают не все банки, и она часто должна действовать ещё 6–12 месяцев после заявки.</li>' +
        '<li>Собственный взнос обычно от 20%.</li>' +
        '<li>Дом или участок иностранцу из-за пределов ЕС покупать только с разрешением MSWiA.</li>' +
      '</ul>' + srcLine([['https://rankomat.pl/finanse/poradniki/kredyt-dla-obcokrajowca-z-karta-czasowego-pobytu/', 'rankomat.pl'], ['https://pawelpietras.pl/blog/kredyt-hipoteczny-dla-obcokrajowca-z-karta-czasowego-pobytu', 'pawelpietras.pl']]) + lifeAcc(['home']) + '</section>';
  }
  function rKids() {
    return '<section class="pl-band pb-screen" id="pl-kids" aria-labelledby="pl-kids-h">' + head('pl-kids', 'Дети', '', '', '', 'PESEL, сад, школа, 800+') + lifeAcc(['kids']) + '</section>';
  }

  function rAuto() {
    var c = CITIES[S.city] ? S.city : 'gdansk';
    var routes = HUBS.filter(function (x) { return x !== c; }).slice(0, 4).map(function (x) {
      var k = roadKm(c, x);
      return '<button type="button" class="pl-chip" data-dist="' + k + '">' + CITIES[c].n + ' → ' + CITIES[x].n + ' <span class="pl-muted" style="font-weight:400">≈' + k + ' км</span></button>';
    }).join('');
    return '<section class="pl-band pb-screen" id="pl-auto" aria-labelledby="pl-auto-h">' + head('pl-auto', 'Авто', 'directions_car', 'var(--c-auto)', '#141414', 'Топливо: средние цены по Польше, раз в неделю') +
      '<div class="pl-counts" data-fitcells="200" style="margin-top:40px">' + [['PB 95', 'fuelPb', 'Зарплата обновляется реже.'], ['ON · дизель', 'fuelOn', 'Дизель снова дороже бензина. Или нет. Смотри цифру.'], ['LPG', 'fuelLpg', 'Газовики смотрят на всех свысока.']].map(function (f) {
        return '<div><div class="pl-lab" style="margin:0 0 12px">' + f[0] + '</div><div class="pl-big" data-o="' + f[1] + '">—</div><div class="pl-lab">zł за литр, в среднем по Польше</div><div class="pl-sub">' + f[2] + '</div></div>';
      }).join('') + '</div>' +
      '<p class="pl-note" style="margin-top:20px"><span data-o="fuelNote"></span> Где дешевле ' + CITIES[c].loc + ': ' + link('https://www.e-petrol.pl', 'e-petrol.pl') + '</p>' +
      '<div class="pl-tool" aria-live="polite"><div class="pl-tool-h">' + ms('local_gas_station') + 'Сколько стоит доехать</div><div class="pl-row">' + routes + '</div>' +
      '<div class="pl-fields">' + field('dist', 'Расстояние, км', 'number', ' inputmode="decimal" min="0"') + field('cons', 'Расход, л/100 км', 'number', ' inputmode="decimal" min="0" step="0.1"') + field('price', 'Цена литра, zł', 'number', ' inputmode="decimal" min="0" step="0.01"') + '</div>' +
      '<div class="pl-out" data-fitcells="150"><div><div class="v" data-o="tripCost">0</div><div class="k">zł в одну сторону</div><div class="d" data-o="tripL"></div></div><div><div class="v" data-o="tripBack">0</div><div class="k">zł туда и обратно</div></div></div>' +
      '<p class="pl-note" data-o="priceNote">Цена в поле для примера. Подставь сегодняшнюю.</p></div>' +
      '<div class="pl-acc" style="margin-top:36px">' + [
        ['badge', 'Обмен прав', '6 месяцев после ВНЖ', ['Иностранные права перестают действовать через 6 месяцев после получения ВНЖ или ПМЖ. Обмен: 100 zł, заявление, фото, медсправка при необходимости, перевод прав у присяжного переводчика.', 'Подают в starostwo, в городе на правах повята в urząd miasta, в Варшаве в urząd dzielnicy. Готово примерно за 9 рабочих дней после подтверждения данных, статус на info-car.pl.'], 'https://powroty.gov.pl/prawo-jazdy-5285/', 'powroty.gov.pl'],
        ['swap_horiz', 'Авто на беларусских номерах', 'Санкции ЕС с 1.07.2024', ['Легковые авто на беларусских номерах нельзя ввозить в ЕС (регламент 2024/1865). Исключение: машина для личного пользования, владелец сам за рулём или в салоне, у него виза или ВНЖ. Возить в ней товары нельзя.', 'Литва, Латвия и Эстония применяют запрет жёстче, проверь маршрут заранее.'], 'https://www.gov.pl/web/kas/nowe-zasady-przywozu-samochodow-osobowych-zarejestrowanych-na-bialorusi', 'gov.pl/web/kas'],
        ['shield', 'Przegląd и OC', 'Обязательное', ['OC обязательно с первого дня. Без него штрафы неприятно круглые.', 'Техосмотр легковой машины: у новой первый до 3 лет с первой регистрации, второй до 5 лет, дальше каждый год.'], 'https://lexlege.pl/prawo-o-ruchu-drogowym/art-81/', 'art. 81 PoRD']
      ].map(function (a, i) {
        return '<details id="pl-d-au' + i + '"><summary>' + ms(a[0], 'lead-ico') + '<span class="t">' + a[1] + '<small>' + a[2] + '</small></span>' + ms('expand_more', 'chev') + '</summary><div class="body">' + a[3].map(function (p) { return '<p>' + p + '</p>'; }).join('') + (a[4] ? '<p class="pl-note">Источник: ' + link(a[4], a[5]) + '</p>' : '') + '</div></details>';
      }).join('') + '</div></section>';
  }

  function linkCard(x, ic) {
    var inner = '<span class="li">' + ms(ic || x.ic || 'arrow_outward') + '</span><span class="c"><b>' + x.n + '</b><span>' + x.d + '</span><em>' + x.h + '</em></span>';
    return x.u ? '<a class="pl-link" href="' + x.u + '" target="_blank" rel="noopener">' + inner + '</a>' : '<div class="pl-link">' + inner + '</div>';
  }
  function rHelp() {
    var c = city();
    var help = (c.uwUrl ? [{ n: c.uw, d: 'Официальный сайт твоего ужонда: объявления, запись, контакты', u: c.uwUrl, h: c.uwUrl.replace('https://www.', ''), ic: 'gavel' }] : []).concat(c.help);
    return '<section class="pl-band pb-screen" id="pl-help" aria-labelledby="pl-help-h">' + head('pl-help', 'Хелп', '', '', '', 'Бесплатная помощь, официальные сайты и быт без паники') +
      '<h3 class="pl-eyebrow" style="margin-top:40px">Бесплатная помощь ' + c.loc + '</h3><div class="pl-links">' + help.map(function (h) { return linkCard(h, h.ic || 'volunteer_activism'); }).join('') + '</div>' +
      (c.help.length ? '' : '<p class="pl-note" style="margin-top:12px">Местных организаций по ' + c.voiv + ' в официальной базе пока нет. Контакты ниже работают по всей Польше.</p>') +
      '<h3 class="pl-eyebrow" style="margin-top:40px">Официально</h3><div class="pl-links">' + OFFICIAL.map(function (o) { return linkCard(o); }).join('') + '</div>' +
      '<p class="pl-note" style="margin-top:16px">Zielona Linia: <b class="pl-num" style="color:var(--ink)">19 524</b> <button type="button" class="pl-btn" data-copy="19 524" style="height:28px;padding:0 8px;margin-left:6px">' + ms('content_copy') + '<span>Копировать</span></button></p>' +
    
      '<h3 class="pl-eyebrow" style="margin-top:56px">Быт без паники</h3>' + lifeAcc(['d30', 'health', 'lang']).replace('margin-top:36px', 'margin-top:12px') +
      '</section>';
  }

  function rDict() {
    return '<section class="pl-band pb-screen" id="pl-dict" aria-labelledby="pl-dict-h">' + head('pl-dict', 'Словарь ужонда', 'translate', '#141414', '#fff', DICT.length + ' слов, без которых ни одно письмо не читается') +
      '<div class="pl-dict-tools"><label class="sr" for="pl-dict-q">Поиск по словарю</label><input class="pl-input" id="pl-dict-q" type="search" placeholder="Найти: wezwanie, PESEL, мельдунек" autocomplete="off"><span class="pl-small pl-muted" data-o="dictN"></span></div>' +
      '<dl class="pl-dict">' + DICT.map(function (d) { return '<div data-dict="' + esc((d[0] + ' ' + d[1] + ' ' + d[2]).toLowerCase()) + '"><dt>' + d[0] + ' <span>· ' + d[1] + '</span></dt><dd>' + d[2] + '</dd></div>'; }).join('') + '</dl></section>';
  }

  /* ---------- compute & update ---------- */
  function r2(x) { return Math.round(x * 100) / 100; }
  function annPV(pay, rate, months) { var r = rate / 1200; return r ? pay * (1 - Math.pow(1 + r, -months)) / r : pay * months; }
  function annPay(loan, rate, months) { var r = rate / 1200; return r ? loan * r / (1 - Math.pow(1 + r, -months)) : loan / months; }
  function mortCap(inc, adults, kids, debt, lim, rate, years, m) {
    var t = Math.min(1, Math.max(0, (inc - 5000) / 2000)), cap = m.c0 + (m.c1 - m.c0) * t;
    var live = m.a + m.b * (adults - 1) + m.c * kids;
    var pay = Math.max(0, Math.min(cap * inc, inc - live) - debt - lim * m.lim);
    return { pay: pay, live: live, cap: cap, loan: Math.floor(annPV(pay, rate + MORT_BUF, Math.min(years, 25) * 12) / 1000) * 1000 };
  }
  var YOUNG_MAX = 85528;
  /* umowa o pracę: ZUS 13,71%, health 9%, KUP 250 or 300 zł, PIT 12% minus 300 zł with PIT-2 */
  function netto(b, u26, k300, pit2) {
    var soc = r2(b * 0.0976) + r2(b * 0.015) + r2(b * 0.0245);
    var hea = r2((b - soc) * 0.09);
    var base = Math.round(b - soc - (k300 ? 300 : 250));
    var pit = u26 && b * 12 <= YOUNG_MAX ? 0 : Math.max(0, Math.round(base * 0.12 - (pit2 ? 300 : 0)));
    return { soc: soc, hea: hea, pit: pit, net: r2(b - soc - hea - pit), emp: r2(b * 1.2048) };
  }
  /* umowa zlecenie with a company: ZUS 11,26% (+2,45% voluntary chorobowe), health 9%, KUP 20%; a student under 26 pays no ZUS */
  function zlecenie(b, u26, stud, chor, pit2) {
    var soc = stud ? 0 : r2(b * 0.0976) + r2(b * 0.015) + (chor ? r2(b * 0.0245) : 0);
    var hea = stud ? 0 : r2((b - soc) * 0.09);
    var base = Math.round(b - soc - r2((b - soc) * 0.2));
    var pit = (u26 || stud) && b * 12 <= YOUNG_MAX ? 0 : Math.max(0, Math.round(base * 0.12 - (pit2 ? 300 : 0)));
    var emp = stud ? b : r2(b + r2(b * 0.0976) + r2(b * 0.065) + r2(b * 0.0167) + (b >= 4806 ? r2(b * 0.0245) : 0) + r2(b * 0.001));
    return { soc: soc, hea: hea, pit: pit, net: r2(b - soc - hea - pit), emp: emp };
  }
  /* umowa o dzieło: no ZUS, KUP 20% or 50% for copyright, PIT 12%; up to 200 zł a flat 12% */
  function dzielo(b, aut) {
    var pit = b <= 200 ? Math.round(b * 0.12) : Math.round(Math.round(b - r2(b * (aut ? 0.5 : 0.2))) * 0.12);
    return { soc: null, hea: null, pit: pit, net: r2(b - pit), emp: b };
  }
  /* B2B, an average month: social ZUS by level, health by tax form, tax per year divided by 12 */
  function b2b(rev, cost, taxf, rate, zl, chor) {
    var soc = r2(ZUS_SOC[zl][0] + (chor && zl !== 'start' ? ZUS_SOC[zl][1] : 0));
    var inc = Math.max(0, rev - cost - soc), hea, tax;
    if (taxf === 'rycz') {
      hea = RYCZ_HEA.filter(function (x) { return rev * 12 <= x[0]; })[0][1];
      tax = Math.max(0, Math.round((rev - soc - hea / 2) * rate / 100));
    } else if (taxf === 'lin') {
      hea = Math.max(HEA_MIN, r2(inc * 0.049));
      tax = Math.max(0, Math.round((inc - Math.min(hea, LIN_HEA_YEAR / 12)) * 0.19));
    } else {
      hea = Math.max(HEA_MIN, r2(inc * 0.09));
      var y = inc * 12;
      tax = Math.max(0, Math.round((y <= 120000 ? y * 0.12 - 3600 : 10800 + (y - 120000) * 0.32) / 12));
    }
    return { soc: soc, hea: hea, pit: tax, net: r2(rev - cost - soc - hea - tax), emp: r2(soc + hea + tax) };
  }
  /* JDG ZUS level from the opening date: 6 months ulga na start from the next month, then 24 months preferencyjny */
  function zusLevel() {
    var jdg = parseD(S.f.jdg), t = today();
    if (!jdg || jdg > t) return null;
    var first = jdg.getDate() === 1 ? new Date(jdg.getFullYear(), jdg.getMonth(), 1, 12) : new Date(jdg.getFullYear(), jdg.getMonth() + 1, 1, 12);
    var uEnd = addM(first, 6), pEnd = addM(uEnd, 24);
    return t < uEnd ? { lv: 0, from: jdg, to: uEnd } : t < pEnd ? { lv: 1, from: uEnd, to: pEnd } : { lv: 3 };
  }

  /* weights: a step 10 (in progress 4), a document 2; steps behind you by «Мой путь» count as done */
  function trackXp(k) {
    var tot = 0, got = 0;
    LEGAL[k].steps.forEach(function (s0, i) { var s = stepOf(k, i), st = stepState(k, i); tot += 10; if (st.v === 'done') got += 10; else if (st.v === 'prog') got += 4; (s.docs || []).forEach(function (d, j) { tot += 2; if (st.past || S.checks[docKey(k, i, s, j)]) got += 2; }); });
    if (k === 'vnzh' && (STAGE_IDX[S.stage] || 0) === 0) LIFE[0].checks.forEach(function (c) { tot += 3; if (S.checks[c[0]]) got += 3; });
    return { tot: tot, got: got };
  }
  function band() { return STAGE_BAND[S.stage] || STAGE_BAND.arrive; }
  function xp() { var b = band(), t = trackXp(b[2]); return b[0] + (b[1] - b[0]) * t.got / t.tot; }
  /* how many level percent one step of a track gives right now (only the track of your stage moves the level) */
  function stepGain(k) { var b = band(); if (b[2] !== k || b[1] === b[0]) return 0; return (b[1] - b[0]) * 10 / trackXp(k).tot; }
  function allDone(k) { return LEGAL[k].steps.every(function (s, i) { return S.status[k + i] === 'done'; }); }

  function updateBinds() {
    var c = city();
    out('uzhond', rUzhond());
    var map = { wait: n0(c.wait), waitFmt: n0(c.wait), dayword: dWord(c.wait), loc: c.loc, uw: c.uw, waitMonths: Math.round(c.wait / 30.4) + ' ' + plural(Math.round(c.wait / 30.4), 'месяц', 'месяца', 'месяцев'), cityNote: c.note };
    $$('[data-bind]').forEach(function (el) { var k = el.getAttribute('data-bind'); if (k in map) { el.textContent = map[k]; if (k === 'cityNote' && el.parentNode) el.parentNode.hidden = !map[k]; } });
  }

  function updateProgress() {
    var si = STAGE_IDX[S.stage] || 0, citizen = si === 6 || allDone('paszport');
    var p = citizen ? 100 : Math.min(99, Math.floor(xp())), lv = LEVELS[0][1];
    var li = 0; LEVELS.forEach(function (l, i) { if (p >= l[0]) { lv = l[1]; li = i; } });
    out('lvlName', lv); out('lvlPct', p + '%'); bumpPct(p);
    /* six segments, one per level: passed ones full, the current one by progress inside it */
    $$('[data-lvl]').forEach(function (el) {
      var i = +el.getAttribute('data-lvl'), a = LEVELS[i][0], b = (LEVELS[i + 1] || LEVELS[i])[0];
      var f = i < li || citizen ? 100 : i > li ? 0 : (b > a ? Math.round((p - a) / (b - a) * 100) : 100);
      el.querySelector('b').style.width = f + '%';
      el.className = i < li || (citizen && i === li) ? 'done' : i === li ? 'cur' : '';
      if (i === li) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
    });
    updateNext(); updateGains();
    var nextT = citizen ? 'Уровней больше нет. Дальше только выборы.' : 'Дальше: «' + LEVELS[li + 1][1] + '». Уровень растёт со статусом «Где ты сейчас» и отмеченными шагами.';
    $$('.pl-lvl').forEach(function (el) { el.title = lv + ', ' + p + '%. ' + nextT; });
    L_ORDER.forEach(function (k) { var d = LEGAL[k].steps.filter(function (s, i) { return stepState(k, i).v === 'done'; }).length; out('tc-' + k, d + '/' + LEGAL[k].steps.length); });
    L_ORDER.forEach(function (k) { LEGAL[k].steps.forEach(function (s0, i) { var s = stepOf(k, i); if (!s.docs) return; var n = s.docs.filter(function (d, j) { return S.checks[docKey(k, i, s, j)]; }).length; out('dc-' + k + i, n + '/' + s.docs.length); }); });
    LIFE.forEach(function (l) { if (!l.checks) return; var n = l.checks.filter(function (c) { return S.checks[c[0]]; }).length; out('lc-' + l.id, n + '/' + l.checks.length); });
    var filed = parseD(S.f.filed), waited = filed ? days(filed, today()) : 0;
    var on = { pesel: !!S.checks.d30_pesel || si >= 2, upo: S.status.vnzh2 === 'done' || si >= 1, finger: S.status.vnzh3 === 'done' || si >= 2, zhdun: waited >= city().wait || si >= 4, card: S.status.vnzh5 === 'done' || si >= 2, pmzh: allDone('pmzh') || si >= 4, own: citizen };
    $$('[data-badge]').forEach(function (el) { var id = el.getAttribute('data-badge'); el.classList.toggle('on', !!on[id]); var bt = BADGES.filter(function (x) { return x.id === id; })[0]; el.setAttribute('aria-label', bt.t + (on[id] ? ': получено' : ': ещё нет')); });
  }

  function updateStage() {
    var st = STAGES.filter(function (s) { return s.id === S.stage; })[0] || STAGES[0];
    updateNext();
    /* no stage yet: the stage pill pulses, it is where the date fields come from */
    var pill = $('[data-stage-sel]'); if (pill) pill.parentNode.classList.toggle('pb-pulse', !S.stageSet);
  }

  /* a next step is done when its mark in the section is done: c: checklist items, s: legal step, f: a date filled in, t: trips logged */
  function stepDone(w) {
    if (!w) return false;
    var t = w.charAt(0), v = w.slice(2);
    if (t === 'c') return v.split(',').every(function (k) { return !!S.checks[k]; });
    if (t === 's') { var m = /^([a-z]+)(\d+)$/.exec(v); return !!m && stepState(m[1], +m[2]).v === 'done'; }
    if (t === 'f') return !!S.f[v];
    if (t === 't') return S.trips.some(function (x) { return x.from && x.to; });
    return false;
  }
  function updateNext() {
    var st = STAGES.filter(function (s) { return s.id === S.stage; })[0] || STAGES[0];
    var left = st.next.filter(function (n) { return !stepDone(n[2]); });
    out('next', left.length ? left.map(function (n) { return '<li>' + ms('arrow_outward') + '<span>' + n[0] + ' · <a href="' + linkOf(n[1]) + '">к разделу</a></span></li>'; }).join('')
      : '<li>' + ms('check') + '<span>На этом этапе всё сделано. Сменишь этап сверху, будут новые шаги.</span></li>');
  }

  /* one waiting counter: days from filing to decision (or to today), compared with the regional average or the legal term */
  function waitCard(what, f, g, avg, ref) {
    var a = parseD(S.f[f]), b = parseD(S.f[g]), t = today();
    if (!a || a > t || (b && b < a)) return '';
    var done = !!b, n = days(a, done ? b : t), d = n - avg, sub;
    if (done) sub = Math.abs(d) <= 7 ? 'Ровно ' + ref + '. Статистически идеален.' : d < 0 ? 'На ' + n0(-d) + ' ' + dWord(-d) + ' быстрее, чем ' + ref + '. Везунчик.' : 'На ' + n0(d) + ' ' + dWord(d) + ' дольше, чем ' + ref + '. Закалка.';
    else sub = d < 0 ? ref.charAt(0).toUpperCase() + ref.slice(1) + '. Осталось около ' + n0(-d) + ' ' + dGen(-d) + '.' : 'Уже на ' + n0(d) + ' ' + dWord(d) + ' дольше, чем ' + ref + '. Это ачивка.';
    return '<div><div class="pl-big"' + (done ? '' : ' style="color:var(--red)"') + '>' + n0(n) + '</div><div class="pl-lab">' + plural(n, 'день', 'дня', 'дней') + (done ? ' ждал ' : ' ждёшь ') + what + '</div><div class="pl-sub">' + sub + '</div></div>';
  }
  function updateMe() {
    var since = parseD(S.f.since), t = today(), c = city(), html = '';
    var passGot = parseD(S.f.passGot), citizen = (STAGE_IDX[S.stage] || 0) === 6 || (passGot && passGot <= t);
    if (since && since <= t) {
      var d = days(since, t);
      html += '<div><div class="pl-big">' + n0(d) + '</div><div class="pl-lab">' + dWord(d) + ' в Польше</div><div class="pl-sub">С ' + fmtD(since) + '</div></div>';
    }
    var vAvg = 'в среднем по ' + c.voiv + ' (' + n0(c.wait) + ')';
    html += waitCard('ВНЖ', 'filed', 'vnzhGot', c.wait, vAvg);
    html += waitCard('ПМЖ', 'pmzhFiled', 'staly', c.pmzh || 183, c.pmzh ? 'в среднем по ' + c.voiv + ' (' + n0(c.pmzh) + ')' : 'по закону (6 месяцев)');
    html += waitCard('паспорт', 'passFiled', 'passGot', 183, 'по закону (6 месяцев)');
    if (citizen && passGot && passGot <= t) {
      var pd = days(passGot, t);
      html += '<div><div class="pl-big">' + n0(pd) + '</div><div class="pl-lab">' + plural(pd, 'день', 'дня', 'дней') + ' ты поляк по паспорту</div><div class="pl-sub">По акценту пока нет. С ' + fmtD(passGot) + '</div></div>';
    } else if (!citizen && since && since <= t) {
      var toRd = days(t, addY(since, 5)), toPass = days(t, addY(since, 8));
      html += '<div><div class="pl-big">' + (toRd > 0 ? n0(toRd) : '0') + '</div><div class="pl-lab">' + dWord(Math.max(0, toRd)) + ' до 5 лет для rezydenta UE</div><div class="pl-sub">' + (toRd > 0 ? fmtD(addY(since, 5)) : 'Срок уже есть, проверь выезды') + '</div></div>' +
        '<div><div class="pl-big" style="color:var(--red)">' + (toPass > 0 ? n0(toPass) : '0') + '</div><div class="pl-lab">' + dWord(Math.max(0, toPass)) + ' до паспорта обычным путём</div><div class="pl-sub">Если всё пойдёт по плану. Ха</div></div>';
    }
    out('me', html);
    var intro = $('[data-o="meIntro"]'); if (intro) intro.hidden = !!html;
    var home = $('.pb-home'); if (home) home.classList.toggle('is-filled', !!html);
  }
  function updateMine() {
    var si = STAGE_IDX[S.stage] || 0, hidden = 0;
    ME_ROWS.forEach(function (r) {
      var el = $('[data-mrow="' + r.k + '"]'); if (!el) return;
      var show = si >= r.min || !!S.f[r.f] || !!S.f[r.g];
      el.hidden = !show; if (!show) hidden++;
    });
    out('meHint', hidden && !S.stageSet ? 'Поля для ВНЖ, ПМЖ и паспорта появятся, когда выберешь этап сверху.' : '');
  }

  function updateTools() {
    updateNext(); updatePassport(); updateInvite(); updateCardSums();
    var t = today(), c = city();
    // waiting timer
    var filed = parseD(S.f.filed);
    if (filed && filed <= t) {
      var w = days(filed, t), pct = w / c.wait * 100;
      out('waitDays', n0(w));
      bar('waitBar', pct, pct >= 100 ? '' : 'ok');
      out('waitMsg', pct < 25 ? 'Разминка. Ужонд только узнал о тебе.' : pct < 60 ? 'Уверенная середина. Наверное.' : pct < 100 ? 'Финишная прямая. Теоретически.' : 'Ты ждёшь дольше среднего ' + c.loc + '. Это ачивка.');
      out('lawMsg', 'По закону решение было бы до ' + fmtD(addD(filed, 60)) + ', но сроки приостановлены до 4.03.2027.');
    } else { out('waitDays', '0'); bar('waitBar', 0, 'ok'); out('waitMsg', 'Укажи дату подачи, и таймер пойдёт.'); out('lawMsg', ''); }
    var exp = parseD(S.f.cardExp);
    if (exp) {
      var left = days(t, exp);
      out('cardLeft', left < 0 ? '0' : n0(left));
      out('cardMsg', left < 0 ? 'Срок прошёл. Если заявление не подано, это срочно к юристу.' : left <= 90 ? 'Пора подавать. Крайний срок: последний день легального пребывания.' : 'Запас есть. Поставь напоминание за 3 месяца.');
    } else { out('cardLeft', '—'); out('cardMsg', 'Укажи дату'); }
    // stazh + trips
    var since = parseD(S.f.since);
    if (since && since <= t) {
      var yrs = days(since, t) / 365.25;
      var stD = days(since, t), stAll = days(since, addY(since, 5));
      out('stY', n0(stD)); out('stK', dWord(stD) + ' из ' + n0(stAll));
      out('stDate', yrs >= 5 ? '5 лет уже есть' : '5 лет будет ' + fmtD(addY(since, 5)));
      bar('stBar', yrs / 5 * 100, yrs >= 5 ? 'ok' : '');
    } else { out('stY', '0'); out('stK', 'дней из 1 826'); out('stDate', 'Укажи дату'); bar('stBar', 0); }
    var tot = 0, mx = 0;
    S.trips.forEach(function (tr) { var a = parseD(tr.from), b = parseD(tr.to); if (a && b && b >= a) { var n = days(a, b); tot += n; mx = Math.max(mx, n); } });
    out('trTot', n0(tot)); out('trMax', n0(mx));
    var st = tot > 304 || mx > 183 ? ['bad', 'error', 'Лимит превышен'] : tot > 240 || mx > 150 ? ['warn', 'warning', 'Близко к лимиту'] : ['ok', 'check', 'В пределах лимита'];
    out('trStatus', '<span class="pl-status ' + st[0] + '">' + ms(st[1] === 'error' ? 'warning' : st[1]) + st[2] + '</span>');
    $$('[data-trip-len]').forEach(function (el) { var tr = S.trips[+el.getAttribute('data-trip-len')]; var a = tr && parseD(tr.from), b = tr && parseD(tr.to); el.textContent = a && b && b >= a ? days(a, b) + ' ' + dWord(days(a, b)) : ''; });
    // citizenship
    var staly = parseD(S.f.staly), yrsNeed = S.f.cpath === 'kp' ? 1 : S.f.cpath === 'mar' ? 2 : 3;
    if (staly && staly <= t) {
      var el = addY(staly, yrsNeed), lft = days(t, el);
      out('cLeft', lft > 0 ? n0(lft) : '0'); out('cDate', lft > 0 ? 'Можно подавать с ' + fmtD(el) : 'Срок есть. Дальше B1, доход и жильё');
      bar('cBar', (days(staly, t) / days(staly, el)) * 100, lft <= 0 ? 'ok' : '');
    } else { out('cLeft', '—'); out('cDate', 'Укажи дату'); bar('cBar', 0); }
    // zus level
    var zl = zusLevel(), lv = zl ? zl.lv : -1;
    if (zl) {
      out('zLv', ZUS_LV[lv].t);
      if (lv < 3) { out('zLeft', n0(days(t, zl.to))); out('zNext', 'дней до уровня «' + ZUS_LV[lv + 1 === 2 ? 3 : lv + 1].t + '» · ' + fmtD(zl.to)); bar('zBar', days(zl.from, t) / days(zl.from, zl.to) * 100); }
      else { out('zLeft', '∞'); out('zNext', 'Максимальный уровень. Проверь Mały ZUS Plus'); bar('zBar', 100, 'warn'); }
    } else { out('zLv', '—'); out('zLeft', '—'); out('zNext', 'Укажи дату открытия'); bar('zBar', 0); }
    $$('[data-zlv]').forEach(function (el) { var on = +el.getAttribute('data-zlv') === lv; el.classList.toggle('cur', on); el.querySelector('.pl-here').hidden = !on; });
    // money: the calculator for the chosen contract, then the mortgage capacity that may use its result
    updateMoney(zl);
    updateMort();
    // deadlines
    var y = t.getFullYear(), m = t.getMonth();
    var d20 = new Date(y, m, 20, 12); if (t > d20) d20 = new Date(y, m + 1, 20, 12);
    function nextDate(mo, da) { var x = new Date(y, mo, da, 12); if (t > x) x = new Date(y + 1, mo, da, 12); return x; }
    var feb = new Date(y, 2, 0, 12); if (t > feb) feb = new Date(y + 1, 2, 0, 12);
    out('dl20', n0(days(t, d20))); out('dlPit', n0(days(t, nextDate(3, 30)))); out('dlForm', n0(days(t, nextDate(1, 20)))); out('dlMzp', n0(days(t, nextDate(0, 31))));
    out('dlEpit', n0(days(t, nextDate(1, 15)))); out('dlP11', n0(days(t, feb)));
    // trip cost
    var dist = num(S.f.dist), cons = num(S.f.cons), price = num(S.f.price), liters = dist * cons / 100;
    out('tripCost', z2(liters * price)); out('tripBack', z2(liters * price * 2)); out('tripL', (Math.round(liters * 10) / 10).toLocaleString('ru-RU') + ' л топлива');
    fitCounts();
  }

  var ZUS_NAME = { start: 'Ulga na start', pref: 'Preferencyjny', full: 'Pełny' };
  var moneyNet = 0;
  function k0(v) { return n0(Math.round(v / 1000) * 1000); }
  /* mortgage capacity in «Банки»: an empty income field takes «на руки» from «Бабки» */
  /* bank income for ryczałt: the bank does not see costs and counts a share of revenue by the rate (bankoweabc ranges); middle bank: the middle of the range, generous: the top */
  var M_WR = { 17: [60, 80], 15: [60, 80], 14: [60, 80], 12: [50, 70], 8.5: [30, 50], 5.5: [10, 20], 3: [10, 20] };
  /* medians of the 8 best offers, Aug 2026: life 0,035% of the loan a month, flat 0,085% of the price a year; 10% down: +0,2 p.p. (rankomat example) */
  var M_LIFE = 0.00035, M_PROP = 0.00085, M_COURT = 200, M_VAL = 700, M_LTV10 = 0.2;
  /* maximum notary fee, § 3 of the regulation; a flat is half, a mortgage for a housing loan a quarter */
  function taksa(v) { return v <= 0 ? 0 : v <= 3000 ? 100 : v <= 10000 ? 100 + (v - 3000) * 0.03 : v <= 30000 ? 310 + (v - 10000) * 0.02 : v <= 60000 ? 710 + (v - 30000) * 0.01 : v <= 1e6 ? 1010 + (v - 60000) * 0.004 : v <= 2e6 ? 4770 + (v - 1e6) * 0.002 : Math.min(10000, 6770 + (v - 2e6) * 0.0025); }
  function mortCosts(P, L, sec, first) {
    var pcc = sec && !first ? r2(P * 0.02) : 0, nt = r2((taksa(P) / 2 + (L > 0 ? taksa(L) / 4 : 0)) * 1.23), court = M_COURT + (L > 0 ? M_COURT : 0), val = L > 0 ? M_VAL : 0;
    return { pcc: pcc, nt: nt, court: court, val: val, all: pcc + nt + court + val };
  }
  /* the most expensive flat the own money and the loan cover together, costs paid from own money first */
  function mortPrice(A, cap, lam, sec, first) {
    var P = 0, c = mortCosts(0, 0, sec, first), byLoan = false;
    for (var i = 0; i < 50; i++) {
      c = mortCosts(P, Math.min(cap, lam * P), sec, first);
      byLoan = cap + A - c.all < (A - c.all) / (1 - lam);
      var P2 = Math.max(0, byLoan ? cap + A - c.all : (A - c.all) / (1 - lam));
      if (Math.abs(P2 - P) < 0.5) { P = P2; break; } P = P2;
    }
    P = Math.floor(P / 1000) * 1000;
    var L = Math.max(0, Math.min(cap, lam * P, P - (A - c.all)));
    L = Math.ceil(L / 100) * 100; if (L > cap) L = cap;
    c = mortCosts(P, L, sec, first);
    return { P: P, L: L, c: c, down: Math.max(0, P - L), byLoan: byLoan };
  }
  var M_CON = {
    uop: 'Umowa o pracę: банки обычно хотят 3–6 месяцев у работодателя, PKO BP и Pekao при непрерывном стаже от 12 месяцев берут и с первого. Срочный договор должен ещё продлиться, mBank хочет минимум 6 месяцев. Испытательного срока обычно мало.',
    zlec: 'Zlecenie: обычно нужны 12 месяцев истории, mBank, Erste (бывший Santander) и VeloBank берут от 6. ING и Alior засчитывают его только как дополнительный доход, ING хочет 12 месяцев от одного заказчика.',
    dzielo: 'Dzieło: ING и BNP Paribas его не берут. Остальные смотрят историю, усредняют доход и любят повторяющиеся заказы от одних клиентов и PIT за прошлый год.',
    lin: 'B2B на шкале или линейном: банк берёт доход из PIT и книги расходов минус налог и ZUS, часто за несколько лет. Обычно нужен год фирмы, некоторым банкам два. Если перешёл на B2B у того же работодателя, бывает достаточно 3–6 месяцев.',
    rycz: 'Ryczałt: банк не видит расходов и засчитывает только часть выручки, потом вычитает налог и ZUS. Год фирмы хватит в PKO BP, Pekao (до 700 000 zł), BOŚ и Millennium, в mBank для IT и медицины. Alior, ING, BNP Paribas и VeloBank хотят два года. Если перешёл на B2B у того же работодателя, бывает достаточно 3–6 месяцев.'
  };
  var moneyInfo = null;
  function updateMort() {
    var f = S.f, mi = moneyInfo, net = mi ? mi.r.net : 0, k = S.contract, ryc = mi && mi.k === 'b2b' && mi.taxf === 'rycz';
    var wr = ryc ? (M_WR[mi.rate] || M_WR[12]) : null, w = wr ? [(wr[0] + wr[1]) / 200, wr[1] / 100] : null;
    var bankT = ryc ? Math.max(0, mi.rev * w[0] - mi.r.soc - mi.r.hea - mi.r.pit) : net, bankM = ryc ? Math.max(0, mi.rev * w[1] - mi.r.soc - mi.r.hea - mi.r.pit) : net;
    var kT = ryc && net > 0 ? bankT / net : 1, kM = ryc && net > 0 ? bankM / net : 1;
    var fi = $('#pl-f-mInc'); if (fi) fi.placeholder = net ? n0(net) + ' из «Бабок»' : '';
    var ad = +f.mAd || 1, kids = +f.mKids || 0, debt = num(f.mDebt), lim = num(f.mLim), yrs = +f.mYears || 25, own = num(f.mOwn);
    var mine = num(f.mInc) || Math.round(net), inc2 = ad > 1 ? num(f.mInc2) : 0;
    $$('[data-m2]').forEach(function (el) { el.hidden = ad < 2; });
    var incT = mine * kT + inc2, incM = mine * kM + inc2, inc = mine + inc2;
    var lam = f.mLtv === '90' ? 0.9 : 0.8, rate = (num(f.mRate) || num(DEF.f.mRate)) + (lam > 0.8 ? M_LTV10 : 0), sec = (f.mMkt || 'wt') === 'wt', first = !!f.mFirst;
    $$('[data-mt="mFirst"]').forEach(function (el) { el.hidden = !sec; });
    var t = mortCap(incT, ad, kids, debt, lim, rate, yrs, MORT.typ), m = mortCap(incM, ad, kids, debt, lim, rate, yrs, MORT.max);
    var pr = mortPrice(own, t.loan, lam, sec, first), L = pr.L, months = yrs * 12, rs = String(r2(rate)).replace('.', ',');
    // where the income comes from
    var src = num(f.mInc) ? 'Свой доход: ' + n0(mine) + ' zł на руки.' : !mi ? '' : 'Из «Бабок»: ' + CONTRACTS[k].tab + (k === 'b2b' ? ', ' + (mi.taxf === 'rycz' ? 'ryczałt ' + String(mi.rate).replace('.', ',') + '%' : mi.taxf === 'lin' ? 'линейный' : 'шкала') + ', выручка ' + n0(mi.rev) + ' zł' : ', ' + n0(num(f.brutto)) + ' brutto') + ' → ' + n0(net) + ' zł на руки.';
    if (ryc) src += ' Банк засчитает примерно ' + n0(Math.round(mine * kT / 100) * 100) + '–' + n0(Math.round(mine * kM / 100) * 100) + ' zł: при ryczałcie ' + String(mi.rate).replace('.', ',') + '% доходом считают ' + wr[0] + '–' + wr[1] + '% выручки, минус налог и ZUS.';
    out('mSrc', src);
    out('mCon', M_CON[k === 'b2b' ? (ryc ? 'rycz' : 'lin') : k] || '');
    out('mLoan', n0(t.loan)); out('mLoanD', 'в самом щедром банке до ' + n0(m.loan) + ' zł');
    out('mPrice', n0(pr.P));
    var downK = Math.round((1 - lam) * 100);
    out('mPriceD', own < pr.c.all + 1 || !pr.P ? 'Своих денег не хватит: банки хотят от ' + downK + '% цены плюс расходы на сделку' : pr.byLoan ? 'Упираешься в кредит: свои ' + n0(own) + ' zł уходят на взнос и расходы' : 'Упираешься во взнос: ' + n0(pr.down) + ' zł это ' + downK + '% цены');
    var pay = L ? annPay(L, rate, months) : 0, life = L && f.mLife ? L * M_LIFE : 0, prop = pr.P * M_PROP / 12;
    out('mPayK', L ? 'Кредит ' + n0(L) + ' zł на ' + yrs + ' лет под ' + rs + '%' : 'Кредит'); out('mPay', L ? z2(pay) + ' zł' : '—');
    out('mLifeP', life ? z2(life) + ' zł' : f.mLife ? '—' : 'не берёшь'); out('mProp', pr.P ? z2(prop) + ' zł' : '—'); out('mTot', L ? z2(pay + life + prop) + ' zł' : '—');
    out('mBridge', L ? '+' + n0(annPay(L, rate + 1, months) - pay) + '–' + n0(annPay(L, rate + 2, months) - pay) + ' zł' : '—');
    var stress = L ? annPay(L, rate + MORT_BUF, Math.min(yrs, 25) * 12) : 0;
    out('mStressK', 'Тот же кредит в проверке банка: ' + String(r2(rate + MORT_BUF)).replace('.', ',') + '% и ' + Math.min(yrs, 25) + ' лет'); out('mStress', L ? z2(stress) + ' zł' : '—');
    out('mLive', n0(t.live) + ' zł'); out('mDsti', incT && L ? Math.round((stress + debt + lim * MORT.typ.lim) / incT * 100) + '%, предел ' + Math.round(t.cap * 100) + '%' : '—');
    out('mDownK', 'Первый взнос, ' + (pr.P ? Math.round(pr.down / pr.P * 100) : downK) + '%'); out('mDown', n0(pr.down) + ' zł');
    out('mPccK', !sec ? 'PCC: у новостройки нет, НДС уже в цене' : first ? 'PCC: первое жильё, не платишь' : 'PCC 2%'); out('mPcc', n0(pr.c.pcc) + ' zł');
    out('mNot', n0(pr.c.nt) + ' zł'); out('mCourt', n0(pr.c.court) + ' zł'); out('mVal', pr.c.val ? n0(pr.c.val) + ' zł' : '—'); out('mNeed', n0(pr.down + pr.c.all) + ' zł');
    var notes = [];
    if (!inc) notes.push('Укажи доход или посчитай «на руки» в «Бабках».');
    else if (!t.loan) notes.push('Средний банк не увидит запаса: доход ниже того, что он закладывает на жизнь семьи, плюс другие кредиты.');
    if (yrs > 25) notes.push('Срок больше 25 лет снижает платёж, но не увеличивает сумму: банк всё равно считает на 25.');
    if (lam > 0.8) notes.push('Со взносом от 10% дают PKO BP, Pekao, mBank, Alior, Erste, VeloBank, Credit Agricole и BOŚ, но дороже: выше маржа или страховка низкого взноса, пока долг не упадёт до 80% цены. Мы добавили 0,2 п.п., как в примере rankomat. Millennium, ING, BNP Paribas и Pocztowy хотят 20%.');
    if (sec && first) notes.push('Без PCC, только если у тебя раньше не было квартиры, дома или доли в них (кроме доли до 50% по наследству). Если есть или было жильё за границей, уточни у нотариуса.');
    if (!f.mLife) notes.push('Лучшие предложения почти все посчитаны со страховкой жизни. Без неё маржа обычно выше на 0,2–0,5 п.п., мы её не добавляли.');
    out('mNote', notes.join(' '));
  }
  function updateMoney(zl) {
    var k = S.contract, f = S.f, r, lab = {};
    if (k === 'b2b') {
      var lvl = f.zusl && f.zusl !== 'auto' ? f.zusl : !zl ? 'full' : zl.lv === 0 ? 'start' : zl.lv === 1 ? 'pref' : 'full';
      var rate = num(f.rate) || 12, taxf = f.taxf || 'rycz';
      r = b2b(num(f.rev), num(f.cost), taxf, rate, lvl, !!f.chor);
      r.cost = num(f.cost);
      lab = { net: 'zł на руки в месяц', emp: 'zł налоги и ZUS в месяц', soc: 'ZUS: ' + ZUS_NAME[lvl] + (f.zusl === 'auto' || !f.zusl ? (zl ? ', по дате открытия' : ', укажи дату ниже') : '') + (f.chor && lvl !== 'start' ? ', с chorobowe' : ''),
        hea: 'Składka zdrowotna' + (taxf === 'rycz' ? ', фиксированная по выручке' : taxf === 'lin' ? ' (4,9%, минимум 432,54 zł)' : ' (9%, минимум 432,54 zł)'),
        pit: taxf === 'rycz' ? 'Ryczałt ' + String(rate).replace('.', ',') + '%' : taxf === 'lin' ? 'PIT 19%' : 'PIT по шкале',
        note: 'Упрощённо: средний месяц, без VAT, Małego ZUS Plus и ulg. Ryczałt считается с выручки минус ZUS и половина zdrowotnej. На линейном zdrowotną вычитаем до 14 100 zł в год.' };
      $$('[data-taxcard]').forEach(function (el) { var on = el.getAttribute('data-taxcard') === taxf; el.classList.toggle('cur', on); el.querySelector('.pl-here').hidden = !on; });
    } else {
      var b = num(f.brutto);
      $$('[data-taxcard]').forEach(function (el) { el.classList.remove('cur'); el.querySelector('.pl-here').hidden = true; });
      if (k === 'zlec') {
        r = zlecenie(b, !!f.u26, !!f.stud, !!f.chor, !!f.pit2);
        lab = { net: 'zł на руки', emp: 'zł стоишь заказчику', soc: f.stud ? 'ZUS: студент до 26 не платит' : 'ZUS: пенсия и рента' + (f.chor ? ', больничный (13,71%)' : ' (11,26%)'), hea: f.stud ? 'Składka zdrowotna: нет' : 'Składka zdrowotna (9%)',
          pit: (f.u26 || f.stud) && b * 12 <= YOUNG_MAX ? 'PIT: ulga dla młodych' : 'Аванс PIT (12% после KUP 20%' + (f.pit2 ? ', минус 300 zł)' : ')'),
          note: 'Упрощённо: zlecenie с фирмой, без PPK. Без chorobowe нет оплачиваемого больничного.' };
      } else if (k === 'dzielo') {
        r = dzielo(b, !!f.aut);
        lab = { net: 'zł на руки', emp: 'zł стоишь заказчику', pit: b <= 200 ? 'PIT 12% с суммы до 200 zł' : 'PIT (12% после KUP ' + (f.aut ? '50%' : '20%') + ')',
          note: 'Ulga dla młodych на dzieło не действует. KUP 50% только за авторские права и не больше 120 000 zł в год. ZUS нет, но и NFZ от этого договора тоже нет.' };
      } else {
        r = netto(b, !!f.u26, !!f.kup300, !!f.pit2);
        lab = { net: 'zł на руки', emp: 'zł стоишь работодателю', soc: 'ZUS: пенсия, рента, больничный (13,71%)', hea: 'Składka zdrowotna (9%)',
          pit: f.u26 && b * 12 <= YOUNG_MAX ? 'PIT: ulga dla młodych' : 'Аванс PIT (12%' + (f.pit2 ? ' минус 300 zł)' : ')'),
          note: 'Упрощённо: без PPK и бонусов. Если за год выйдешь за 120 000 zł, с превышения ставка станет 32%.' };
      }
    }
    var neg = function (v) { return (v ? '−' : '') + z2(v) + ' zł'; };
    moneyNet = r.net; moneyInfo = { k: k, taxf: k === 'b2b' ? (f.taxf || 'rycz') : '', rate: num(f.rate) || 12, rev: num(f.rev), r: r };
    out('net', z2(r.net)); out('net2', z2(r.net) + ' zł'); out('emp', z2(r.emp)); out('netK', lab.net); out('empK', lab.emp);
    out('soc', neg(r.soc || 0)); out('hea', neg(r.hea || 0)); out('pit', neg(r.pit)); out('rCost', neg(r.cost || 0));
    out('rSocK', lab.soc || ''); out('rHeaK', lab.hea || ''); out('rPitK', lab.pit); out('calcNote', lab.note);
    $$('[data-r]').forEach(function (el) { var x = el.getAttribute('data-r'); el.hidden = x === 'cost' ? k !== 'b2b' : r[x] == null; });
    showFor();
  }
  /* blocks of the money section follow the chosen contract; the ryczałt rate only for ryczałt */
  function showFor() {
    var k = S.contract, taxf = S.f.taxf || 'rycz';
    $$('#pl-money [data-w]').forEach(function (el) { el.hidden = el.getAttribute('data-w').split(' ').indexOf(k) < 0 || (el.hasAttribute('data-tax') && el.getAttribute('data-tax') !== taxf); });
  }

  function renderTrips() {
    if (calFor.indexOf('pl-tr-') === 0) closeCal();
    var html = S.trips.map(function (tr, i) {
      return '<div class="pl-trip"><label class="sr" for="pl-tr-f' + i + '">Выезд ' + (i + 1) + ', с</label>' + dateCtl('pl-tr-f' + i, tr.from, 'data-trip="' + i + '" data-k="from"') +
        '<span class="pl-muted" aria-hidden="true">→</span><label class="sr" for="pl-tr-t' + i + '">по</label>' + dateCtl('pl-tr-t' + i, tr.to, 'data-trip="' + i + '" data-k="to"') +
        '<span class="len" data-trip-len="' + i + '"></span><button type="button" class="pl-ib" data-trip-del="' + i + '" aria-label="Удалить выезд ' + (i + 1) + '">' + ms('close') + '</button></div>';
    }).join('');
    out('trips', html || '<p class="pl-note">Пока ни одного выезда. Отпуск тоже считается.</p>');
  }

  function applyTabs() {
    setTimeout(fitCounts, 0);
    $$('[data-legal]').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-legal') === S.legal)); });
    L_ORDER.forEach(function (k) { var p = $('#pl-panel-' + k); if (p) p.hidden = k !== S.legal; });
    $$('[data-contract]').forEach(function (b) { b.setAttribute(b.hasAttribute('data-mcon') ? 'aria-pressed' : 'aria-selected', String(b.getAttribute('data-contract') === S.contract)); });
    var cp = $('#pl-cp'); if (cp) cp.setAttribute('aria-labelledby', 'pl-ct-' + S.contract);
    showFor();
  }

  /* ---------- geolocation: nearest of our cities; coordinates are never stored ---------- */
  function km(a, b) {
    var R = 6371, r = Math.PI / 180, dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r;
    var h = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function nearest(lat, lon) {
    var best = null;
    CITY_ORDER.forEach(function (id) { var d = km([lat, lon], CITIES[id].g); if (!best || d < best.km) best = { city: id, km: Math.round(d) }; });
    return best;
  }
  function updateGeo() {
    var msg = '';
    out('cityName', geoBusy ? 'Ищу…' : esc(city().n));
    if (geoErr) msg = geoErr;
    else if (S.geo && S.geo.city === S.city) {
      var c = CITIES[S.geo.city];
      msg = S.geo.km <= 60 ? 'Определено по геолокации: ' + c.n + (S.geo.km >= 5 ? ', ' + S.geo.km + ' км' : '') + '.'
        : 'Твоего города пока нет в гайде. Ближе всего ' + c.n + ', ' + n0(S.geo.km) + ' км, показываем его данные. Если ты в другом воеводстве, ужонд и сроки у тебя свои.';
    }
    out('geoMsg', esc(msg));
  }
  function locate(silent) {
    if (geoBusy) return;
    if (!navigator.geolocation) { if (!silent) { geoErr = 'Браузер не умеет определять местоположение. Выбери город вручную.'; updateGeo(); } return; }
    geoBusy = true; geoErr = ''; updateGeo();
    navigator.geolocation.getCurrentPosition(function (pos) {
      geoBusy = false;
      var n = nearest(pos.coords.latitude, pos.coords.longitude);
      var changed = n.city !== S.city;
      S.city = n.city; S.geo = n; S.cityManual = false; save();
      if (changed) render(); else { updateGeo(); out('cityIco', ms('my_location')); }
    }, function (err) {
      geoBusy = false;
      if (!silent) geoErr = err && err.code === 1 ? 'Доступ к местоположению закрыт. Выбери город вручную или разреши доступ в настройках браузера.' : 'Не получилось определить местоположение. Выбери город вручную.';
      updateGeo();
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 3600000 });
  }

  var rendered = 0;
  /* life-counter fit: one row fills the page width (desktop), each number fits its cell (phone) */
  function fitCounts() {
    /* groups capped by another group go last */
    $$('[data-fitcells]').sort(function (a, b) { return a.hasAttribute('data-fitref') - b.hasAttribute('data-fitref'); }).forEach(function (g) {
      var nums = Array.prototype.slice.call(g.querySelectorAll('.pl-big, .v:not([data-nofit]), .big:not(.txt)')).filter(function (n) { return n.getClientRects().length; }); if (!nums.length || !g.offsetParent) return;
      var best = +g.getAttribute('data-fitcells') || 240;
      /* an empty value («—») does not set the size and stays small and pale */
      var nil = function (n) { return /^[—–-]?$/.test(n.textContent.trim()); };
      nums.forEach(function (n) { n.classList.toggle('pl-nil', nil(n)); if (nil(n)) return; n.style.fontSize = '100px'; var pc = getComputedStyle(n.parentNode), cw = n.parentNode.clientWidth - parseFloat(pc.paddingLeft) - parseFloat(pc.paddingRight), w = n.getBoundingClientRect().width || 1; best = Math.min(best, Math.floor(90 * cw / w)); });
      best = Math.max(+g.getAttribute('data-fitmin') || 44, best);
      var ref = g.getAttribute('data-fitref') && document.querySelector(g.getAttribute('data-fitref') + ' .pl-big');
      if (ref && ref.style.fontSize) best = Math.min(best, parseFloat(ref.style.fontSize));
      Array.prototype.forEach.call(g.querySelectorAll('[data-nofit]'), function (n) { n.classList.toggle('pl-nil', nil(n)); });
      nums.forEach(function (n) { n.style.fontSize = (nil(n) ? Math.min(best, 64) : best) + 'px'; n.parentNode.style.setProperty('--nw', Math.ceil(n.getBoundingClientRect().width) + 'px'); });
    });
  }
  var fitT; window.addEventListener('resize', function () { clearTimeout(fitT); fitT = setTimeout(fitCounts, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitCounts);

  function render() {
    closeCal();
    var open = $$('details[open]').map(function (d) { return d.id; }).filter(Boolean);
    var y = window.scrollY;
    root.innerHTML = rMHead() + '<div class="pb-app">' + rSide() + '<div class="pb-main">' + rTop() + '<main class="pb-screens" id="pb-main">' +
      rMe() + rLegal() + rNews() + rBy() + rMoney() + rBank() + rKids() + rHome() + rAuto() + rHelp() + rDict() + '</main>' + rFoot() + '</div></div>' + rTabs();
    if (open.length) $$('details').forEach(function (d) { if (d.id && open.indexOf(d.id) > -1) d.open = true; });
    renderTrips(); updateBinds(); updateGeo(); updateStage(); updatePath(); updateProgress(); updateMine(); updateMe(); updateFuel(); spy(); fitPhrases(); loadPayCheck();
    if (rendered) { show({ k: activeNow || 'me' }, false); window.scrollTo(0, y); } else { route(false); if (activeNow === 'me') countUp(); }
    rendered = 1;
  }

  /* ---------- screens: one per menu item. On panbogdan.com each has its own address (/legalizacja),
     elsewhere (preview, tests) the address after # picks it. Old #pl-… links and inner ids (#pl-d-by0) still work ---------- */
  var PATHS = !!document.querySelector('meta[name="pb-paths"]');
  function hrefOf(s) { return PATHS ? '/' + s.p : '#' + (s.p || 'start'); }
  var activeNow = '';
  function secBy(k) { return SECTIONS.filter(function (x) { return x.k === k; })[0]; }
  function keyOf(h) {
    if (h == null) return null;
    h = String(h).replace(/^[#/]+|\/+$/g, '');
    if (!h || h === 'start' || h === 'me') return { k: 'me' };
    for (var i = 0; i < SECTIONS.length; i++) { var x = SECTIONS[i]; if (x.p === h || x.k === h || x.id === h) return { k: x.k }; }
    if (SCREEN_ALIAS[h]) return { k: SCREEN_ALIAS[h] };
    var el = document.getElementById(h), sec = el && el.closest && el.closest('.pb-screen');
    if (sec) { var hit = SECTIONS.filter(function (x) { return x.id === sec.id; })[0]; if (hit) return { k: hit.k, el: el }; }
    return null;
  }
  function show(r, scroll) {
    var sec = secBy(r.k), changed = r.k !== activeNow;
    SECTIONS.forEach(function (x) { var el = document.getElementById(x.id); if (el) el.hidden = x.k !== r.k; });
    var ft = $('.pb-foot'); if (ft) ft.hidden = r.k !== 'me';
    if (changed && rendered) { var scn = document.getElementById(sec.id); if (scn) { scn.classList.remove('pb-enter'); void scn.offsetWidth; scn.classList.add('pb-enter'); } }
    setActive(r.k);
    if (scroll) document.title = (r.k === 'me' ? '' : sec.n + ' · ') + 'Pan Bogdan: Польша пошагово';
    setTimeout(fitCounts, 0);
    if (r.el) {
      var d = r.el.tagName === 'DETAILS' ? r.el : r.el.closest('details'); if (d) d.open = true;
      setTimeout(function () { r.el.scrollIntoView({ block: 'start' }); }, 0);
    } else if (scroll && changed) window.scrollTo(0, 0);
  }
  /* what the current address points at */
  function here() {
    var h = ''; try { h = decodeURIComponent(location.hash.slice(1)); } catch (e) {}
    if (/^import=/.test(h)) h = '';
    var byHash = h ? keyOf(h) : null;
    if (PATHS) {
      var byPath = keyOf(location.pathname) || { k: 'me' };
      if (byHash && (byHash.el || byHash.k !== 'me')) {
        /* an old #pl-legal link: move to /legalizacja, keep an inner anchor */
        try { history.replaceState(null, '', hrefOf(secBy(byHash.k)) + (byHash.el ? '#' + byHash.el.id : '')); } catch (e) {}
        return byHash;
      }
      return byPath;
    }
    return byHash || { k: 'me' };
  }
  function route(scroll) { show(here(), scroll); }
  /* an inner link (#pl-legal, #pl-d-d30) as a real address: /legalizacja, /pomoc#pl-d-d30 */
  function linkOf(h) { var r = keyOf(String(h).replace(/^#/, '')); if (!r) return h; return r.el ? (PATHS ? hrefOf(secBy(r.k)) : '') + '#' + r.el.id : hrefOf(secBy(r.k)); }
  function setActive(k) {
    activeNow = k;
    $$('[data-nav]').forEach(function (a) { if (a.getAttribute('data-nav') === k) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    out('secName', secBy(k) ? secBy(k).n : ''); out('secDesc', SDESC[k] || '');
    var src = ILL[k] || '';
    $$('.pb-ill img, .pb-mill img').forEach(function (im) { im.classList.toggle('on', im.getAttribute('data-ill') === src); });
  }
  function closeMore() { var m = $('#pb-more'), b = $('[data-more]'); if (m) m.hidden = true; if (b) b.setAttribute('aria-expanded', 'false'); }
  window.addEventListener('hashchange', function () { route(true); });
  window.addEventListener('popstate', function () { route(true); });
  root.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]'); if (!a || !root.contains(a) || a.target) return;
    var href = a.getAttribute('href'), r = null;
    if (href.charAt(0) === '#') r = keyOf(href.slice(1));
    else if (PATHS && href.charAt(0) === '/' && href.charAt(1) !== '/') { var hp = href.split('#'); r = (hp[1] && keyOf(hp[1])) || keyOf(hp[0]); }
    if (!r) return;
    e.preventDefault(); closeMore();
    var url = r.el ? (PATHS ? hrefOf(secBy(r.k)) : '') + '#' + r.el.id : hrefOf(secBy(r.k));
    try { history.pushState(null, '', url); } catch (err) {}
    show(r, true);
  });
  /* section pictures, pinned to the bottom of the menu column; hidden while the footer logo is in view. «Банки» borrows «Бабки» */
  var ILL_BASE = (document.querySelector('meta[name="pb-img"]') || { content: 'img/' }).content;
  var ILL = { me: 'me', legal: 'legal', news: 'news', by: 'by', money: 'money', bank: 'money', kids: 'kids', home: 'home', auto: 'auto', help: 'help', dict: 'dict' };
  function rIll(noLogo) {
    var seen = noLogo ? { me: 1 } : {};
    return Object.keys(ILL).map(function (k) { var f = ILL[k]; if (!f || seen[f]) return ''; seen[f] = 1; return '<img data-ill="' + f + '" src="' + ILL_BASE + f + '.webp" alt="" width="240" height="240" decoding="async"' + (f === 'me' ? '' : ' loading="lazy"') + '>'; }).join('');
  }
  function setStage(id) {
    S.stage = id; S.stageSet = true; S.legal = { arrive: 'vnzh', wait: 'vnzh', vnzh: 'pmzh', pmzhw: 'pmzh', pmzh: 'paszport', pass: 'paszport', citizen: 'paszport' }[id] || S.legal; save();
    var st = STAGE_LBL[id], sel = $('[data-stage-sel]'), pill = sel && sel.parentNode;
    if (pill) { var first = pill.firstChild; while (first && first !== sel && first.tagName !== 'svg') { var nx = first.nextSibling; pill.removeChild(first); first = nx; } pill.insertAdjacentHTML('afterbegin', '<span>' + st[0] + '</span><b class="pb-tag">' + st[1] + '</b>'); var ph = sel.querySelector('option[disabled]'); if (ph) sel.removeChild(ph); }
    updateStage(); applyTabs(); updatePath(); updateProgress(); updateMine(); updateMe(); updateInvite(); fitCounts();
  }

  function setStatus(key) {
    var v = NEXT[S.status[key] || 'todo']; S.status[key] = v; save();
    var row = $('[data-step="' + key + '"]'); if (!row) return;
    row.className = 'pl-step ' + v;
    var btn = row.querySelector('[data-cycle]'); btn.innerHTML = box(v);
    var tab = key.replace(/\d+$/, ''), i = +key.match(/\d+$/)[0];
    btn.setAttribute('aria-label', LEGAL[tab].steps[i].t + ': ' + LBL[v] + '. Сменить статус');
    row.querySelector('.pl-st').textContent = LBL[v];
    updateProgress();
  }

  /* ---------- calendar: Air Datepicker 3.6.0 (MIT). Script from jsDelivr with SRI, styles are inlined in the block CSS ---------- */
  var ADP = 'https://cdn.jsdelivr.net/npm/air-datepicker@3.6.0/air-datepicker.js';
  var ADP_SRI = 'sha384-NPBiBhnpeWwcn7ve8/Uqp2u57dxXh3QdvTfHqkBgLk238FpkrjF7S7iCdBCU07dc';
  var adpP = null, cal = null, calFor = '', calTok = 0, calWait = '', calQuiet = '';
  function loadAdp() {
    if (window.AirDatepicker) return Promise.resolve(window.AirDatepicker);
    if (adpP) return adpP;
    adpP = new Promise(function (ok, no) {
      var s = document.createElement('script'); s.src = ADP; s.integrity = ADP_SRI; s.crossOrigin = 'anonymous'; s.async = true;
      s.onload = function () { if (window.AirDatepicker) ok(window.AirDatepicker); else { adpP = null; no(); } };
      s.onerror = function () { s.remove(); adpP = null; no(); };
      document.head.appendChild(s);
    });
    return adpP;
  }
  function isoOf(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function calDate(v) { var iso = dmyToIso(v); return iso ? new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10), 12) : null; }
  function mobileCal() { return !!(window.matchMedia && window.matchMedia('(max-width: 767px), (pointer: coarse)').matches); }
  function closeCal() {
    calTok++; calWait = '';
    if (cal) { var c = cal; cal = null; calFor = ''; try { c.destroy(); } catch (e) {} }
  }
  /* the date field itself opens the calendar: click or focus. On desktop you can still type DD/MM/YYYY */
  function openCal(fid) {
    var tx = document.getElementById(fid); if (!tx) return;
    if (cal && calFor === fid) { if (!cal.visible) cal.show(); return; }
    if (calWait === fid) return;
    closeCal();
    var tok = ++calTok; calWait = fid;
    loadAdp().then(function (AD) {
      if (tok !== calTok || !tx.isConnected) return;
      calWait = '';
      var mob = mobileCal();
      if (!mob && document.activeElement !== tx) return;
      var keep = tx.value, d = calDate(keep);
      var me = new AD(tx, {
        classes: 'pashaby-adp', isMobile: mob, autoClose: true, toggleSelected: false,
        position: 'bottom left', offset: 6, dateFormat: 'dd/MM/yyyy', navTitles: { days: 'MMMM <i>yyyy</i>' },
        selectedDates: d ? [d] : false, startDate: d || new Date(),
        onSelect: function (o) {
          if (!o.date || o.date instanceof Array) return;
          tx.value = isoToDmy(isoOf(o.date)); onDate(tx, false, true); me.plBack = true;
        },
        onShow: function () { tx.setAttribute('aria-expanded', 'true'); },
        onHide: function (done) {
          tx.setAttribute('aria-expanded', 'false');
          if (done) gone(); else setTimeout(gone, 800); /* if the closing transition never ends */
        }
      });
      /* after the calendar closes: drop the instance; after a pick or Esc on desktop, put focus back in the field without reopening */
      function gone() {
        if (me.isDestroyed || me.visible) return;
        if (cal === me) { cal = null; calFor = ''; }
        var back = me.plBack; try { me.destroy(); } catch (e) {}
        if (!tx.isConnected) return;
        if (mob) { tx.readOnly = true; return; }
        var ae = document.activeElement;
        if (back && (!ae || ae === document.body)) { calQuiet = fid; tx.focus({ preventScroll: true }); }
      }
      if (tx.value !== keep) tx.value = keep;
      cal = me; calFor = fid;
      me.show();
    }, function () { if (tok !== calTok) return; calWait = ''; tx.readOnly = false; tx.focus(); });
  }
  root.addEventListener('focusin', function (e) { var t = e.target; if (!t.matches || !t.matches('[data-date]')) return; if (calQuiet === t.id) { calQuiet = ''; return; } openCal(t.id); });
  root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && cal && cal.visible && e.target.id === calFor) cal.plBack = true; }, true);
  root.addEventListener('click', function (e) { var t = e.target; if (t.matches && t.matches('[data-date]')) openCal(t.id); });
  /* fetch the library early: when the page is idle or when the pointer gets near a date field */
  root.addEventListener('pointerover', function (e) { if (e.target.closest && e.target.closest('.pl-date')) loadAdp().catch(function () {}); });
  if (window.requestIdleCallback) window.requestIdleCallback(function () { loadAdp().catch(function () {}); }, { timeout: 5000 });
  else setTimeout(function () { loadAdp().catch(function () {}); }, 2500);

  /* ---------- events ---------- */
  var resetArmed = 0;
  root.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || !root.contains(b)) return;
    var d = b.dataset;
    if (b.hasAttribute('data-geo')) { locate(false); }
    else if (d.stage) { setStage(d.stage); }
    else if (d.opt != null) { var os = b.closest('.pb-dd').querySelector('select'); closeMenu(); os.value = d.opt; os.dispatchEvent(new Event('change', { bubbles: true })); }
    else if (b.hasAttribute('data-more')) { var m = $('#pb-more'), o = m.hidden; var mh = $('.pb-mhead'); if (mh) m.style.setProperty('--mh', Math.round(mh.getBoundingClientRect().bottom) + 'px'); m.hidden = !o; b.setAttribute('aria-expanded', String(o)); }
    else if (b.hasAttribute('data-phrase')) { var t = b.querySelector('.pashaby-t'); t.classList.add('out'); setTimeout(function () { t.textContent = nextPhrase(); fitPhrase(t); t.classList.remove('out'); }, 160); }
    else if (d.legal) { S.legal = d.legal; save(); applyTabs(); }
    else if (d.contract) { S.contract = CONTRACTS[d.contract] ? d.contract : 'uop'; save(); updateTools(); applyTabs(); }
    else if (d.cycle) { setStatus(d.cycle); }
    else if (d.dist) { S.f.dist = d.dist; save(); var f = $('#pl-f-dist'); if (f) f.value = d.dist; updateTools(); }
    else if (b.hasAttribute('data-trip-add')) { S.trips.push({ from: '', to: '' }); save(); renderTrips(); updateTools(); var last = $('#pl-tr-f' + (S.trips.length - 1)); if (last) last.focus(); }
    else if (d.tripDel != null) { S.trips.splice(+d.tripDel, 1); save(); renderTrips(); updateTools(); }
    else if (d.copy) {
      var lbl = b.querySelector('span:last-child');
      var done = function () { if (lbl) { lbl.textContent = 'Скопировано'; setTimeout(function () { lbl.textContent = 'Копировать'; }, 1600); } };
      try { navigator.clipboard.writeText(d.copy).then(done, function () {}); } catch (err) {}
    }
    else if (b.hasAttribute('data-reset')) {
      var sp = b.querySelector('span:last-child');
      if (!resetArmed) { resetArmed = 1; sp.textContent = 'Точно? Нажми ещё раз'; setTimeout(function () { resetArmed = 0; if (sp.isConnected) sp.textContent = 'Сбросить мой прогресс'; }, 3000); }
      else { resetArmed = 0; S = JSON.parse(JSON.stringify(DEF)); save(); render(); }
    }
  });
  function onDate(el, deleting, fromCal) {
    if (!deleting) { var f = maskDmy(el.value); if (f !== el.value) el.value = f; }
    var iso = dmyToIso(el.value);
    el.setAttribute('aria-invalid', String(el.value.length === 10 && !iso));
    if (el.hasAttribute('data-f')) {
      var k = el.getAttribute('data-f'); S.f[k] = iso; save();
      $$('[data-f="' + k + '"]').forEach(function (x) { if (x !== el) { x.value = el.value; x.setAttribute('aria-invalid', el.getAttribute('aria-invalid')); } });
      updateMe(); updatePath(); updateTools(); updateProgress();
    } else if (el.hasAttribute('data-trip')) {
      var tr = S.trips[+el.getAttribute('data-trip')]; if (tr) { tr[el.getAttribute('data-k')] = iso; save(); updateTools(); }
    }
    if (!fromCal && cal && calFor === el.id && !cal.isDestroyed && cal.visible) {
      /* typing: show the typed date in the open calendar, keep it open */
      var dd = calDate(el.value), ac = cal.opts.autoClose;
      try { cal.opts.autoClose = false; if (dd) { cal.selectDate(dd, { silent: true }); cal.setViewDate(dd); } else if (!el.value) cal.clear({ silent: true }); } catch (e) {}
      cal.opts.autoClose = ac;
    }
  }
  root.addEventListener('input', function (e) {
    var el = e.target;
    if (el.matches('[data-date]')) { onDate(el, /^delete/.test(e.inputType || '')); return; }
    if (el.matches('[data-f]') && el.type !== 'checkbox' && el.tagName !== 'SELECT') { setField(el, true); updateTools(); updateProgress(); }
    else if (el.matches('[data-trip]')) { var tr = S.trips[+el.getAttribute('data-trip')]; if (tr) { tr[el.getAttribute('data-k')] = el.value; save(); updateTools(); } }
    else if (el.id === 'pl-dict-q') {
      var q = el.value.trim().toLowerCase(), n = 0;
      $$('[data-dict]').forEach(function (it) { var hit = !q || it.getAttribute('data-dict').indexOf(q) > -1; it.hidden = !hit; if (hit) n++; });
      out('dictN', q ? n + ' из ' + DICT.length : '');
    }
  });
  root.addEventListener('change', function (e) {
    var el = e.target;
    if (el.matches('[data-stage-sel]')) { if (STAGE_LBL[el.value]) setStage(el.value); return; }
    if (el.matches('[data-city-sel]')) { if (el.value === '__geo') { el.value = S.city; locate(false); return; } if (!CITIES[el.value]) return; S.city = el.value; S.geo = null; S.cityManual = true; geoErr = ''; save(); render(); var ns = $('#pl-city'); if (ns) ns.focus({ preventScroll: true }); return; }
    if (el.matches('[data-pmzh-path]')) { S.pmzhPath = el.value; save(); render(); var ps = $('#pl-pmzh-path'); if (ps) ps.focus({ preventScroll: true }); return; }
    if (el.matches('[data-mypath]')) { S.myPath = el.checked; save(); updatePath(); updateProgress(); return; }
    if (el.matches('[data-check]')) { S.checks[el.getAttribute('data-check')] = el.checked; save(); updateProgress(); }
    else if (el.matches('[data-f]:not([data-date])')) { var k = el.getAttribute('data-f'); if (el.type === 'checkbox' || el.tagName === 'SELECT') { S.f[k] = el.type === 'checkbox' ? el.checked : el.value; save(); } else setField(el, false); updateTools(); updateProgress(); }
  });

  /* scrollspy */
  var io;
  function spy() {}
  /* small life: numbers on the home screen count up once, the header gets compact after a little scrolling */
  var REDUCE = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches), counted = 0;
  function countUp() {
    if (counted || REDUCE || !window.requestAnimationFrame || /jsdom/i.test(navigator.userAgent)) return; counted = 1;
    $$('#pl-me .pb-hero .pl-big, #pl-me .pb-counts .pl-big').forEach(function (el) {
      var txt = el.textContent, v = parseInt(txt.replace(/\D/g, ''), 10); if (!v || /[^\d\s  ]/.test(txt)) return;
      var from = Math.max(Math.round(v * .6), Math.pow(10, String(v).length - 1)), t0 = 0, last = n0(from);
      function step(t) {
        if (!t0) t0 = t; if (el.textContent !== last) return;
        var p = Math.min(1, (t - t0) / 1000), e = 1 - Math.pow(1 - p, 3);
        last = p === 1 ? txt : n0(from + (v - from) * e); el.textContent = last;
        if (p < 1) requestAnimationFrame(step);
      }
      el.textContent = last; requestAnimationFrame(step);
    });
  }
  window.addEventListener('scroll', function () { var y = window.scrollY; if (y > 48) root.classList.add('pb-scrolled'); else if (y < 8) root.classList.remove('pb-scrolled'); }, { passive: true });

  /* desktop: own menu for the two pills in the top bar; touch screens keep the native picker */
  var FINE = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  function closeMenu() { var m = $('.pb-menu'); if (!m) return; var l = m.parentNode.querySelector('.pb-pill'); if (l) l.classList.remove('open'); m.parentNode.removeChild(m); }
  function openMenu(sel) {
    var wrap = sel.closest('.pb-dd'), was = wrap && wrap.querySelector('.pb-menu'); closeMenu(); if (!wrap || was) return;
    var m = document.createElement('div'); m.className = 'pb-menu'; m.setAttribute('role', 'listbox'); m.setAttribute('aria-label', sel.getAttribute('aria-label') || '');
    m.innerHTML = Array.prototype.map.call(sel.options, function (o) {
      if (o.disabled) return ''; var on = o.selected && o.value !== '__geo';
      return '<button type="button" role="option" data-opt="' + esc(o.value) + '" aria-selected="' + on + '"' + (o.value === '__geo' ? ' class="geo"' : '') + '>' + (o.value === '__geo' ? svgi('loc', 18) : '') + '<span>' + esc(o.textContent) + '</span>' +
        (on ? '<svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + CHECK + '"/></svg>' : '') + '</button>';
    }).join('');
    wrap.appendChild(m); wrap.querySelector('.pb-pill').classList.add('open');
    var cur = m.querySelector('[aria-selected=true]') || m.firstChild; if (cur) { m.scrollTop = Math.max(0, cur.offsetTop - 96); cur.focus({ preventScroll: true }); }
  }
  if (FINE) {
    root.addEventListener('mousedown', function (e) { var t = e.target; if (t.tagName === 'SELECT' && t.closest('.pb-dd')) { e.preventDefault(); openMenu(t); } });
    root.addEventListener('keydown', function (e) {
      var t = e.target;
      if (t.tagName === 'SELECT' && t.closest('.pb-dd') && /^(Enter| |ArrowDown|ArrowUp)$/.test(e.key)) { e.preventDefault(); openMenu(t); return; }
      var m = t.closest && t.closest('.pb-menu'); if (!m) return;
      if (e.key === 'Escape' || e.key === 'Tab') { var sel = m.parentNode.querySelector('select'); closeMenu(); if (e.key === 'Escape') sel.focus(); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); var n = e.key === 'ArrowDown' ? t.nextElementSibling : t.previousElementSibling; if (n) n.focus(); }
    });
    document.addEventListener('mousedown', function (e) { if (!e.target.closest || !e.target.closest('.pb-dd')) closeMenu(); });
  }
  document.addEventListener('click', function (e) { var t = e.target; if (t.closest && !t.closest('#pb-more') && !t.closest('[data-more]')) closeMore(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMore(); });



  /* icon font guard: hide ligature text if the font cannot load */
  if (document.fonts && document.fonts.load) {
    document.fonts.load('20px "Material Symbols Rounded"', 'check').then(function (f) { if (!f || !f.length) root.classList.add('pl-noicons'); }, function () { root.classList.add('pl-noicons'); });
  }

  /* the site logo on this page: a random line instead of pasha.by */
  var PHRASES = ['Дом там, где жабка', 'Из Минска в ZUS', 'Утром PESEL, вечером стулья', 'PESEL есть, счастья нет', 'Уровень польского: Żabka B2', 'Wszystko rozumiem ale nic nie mogę powiedzieć', 'Польша дала мне второй ZUS', 'Интегрировался. Ненавижу соседей.',
    'Promocja, paragon, przepraszam', 'Польский B2, пока не надо звонить', 'Rozumiem wszystko, говорю едва. Мой уровень жабка B2', 'Brakuje jednego dokumentu', 'Хот-дог за жабсы, чайник на раты',
    'В дымном плену, в угаре пьяном. Жизнь моя пошла по Касторамам', 'Стою в очереди в Хлеб и Вино', 'Umieść artykuł w strefie pakowania', 'Polski 50cent: fifty groszy. Butelkę kaucyjną, poproszę',
    'Znalazłem puszki, оказалось не те. Бутылочку не выбрасывай-те', 'Свобода есть. Парковки нет.', 'У меня всё есть. Na raty'];
  var phraseNow = -1;
  function nextPhrase() { var i; do { i = Math.floor(Math.random() * PHRASES.length); } while (PHRASES.length > 1 && i === phraseNow); phraseNow = i; return PHRASES[i]; }
  /* the site logo on this page becomes a phrase about emigrant life in Poland; a click shows another one */
  /* one line always: a long phrase gets a smaller font instead of a second line, so the header never changes height */
  function fitPhrase(t) {
    t.classList.remove('two'); t.style.fontSize = '';
    if (!t.clientWidth) return;
    var one = [22, 20, 18], two = [17, 16, 15, 14, 13, 12], i;
    for (i = 0; i < one.length; i++) { t.style.fontSize = one[i] + 'px'; if (t.scrollWidth <= t.clientWidth + 1) return; }
    t.classList.add('two');
    for (i = 0; i < two.length; i++) { t.style.fontSize = two[i] + 'px'; if (t.scrollHeight <= t.clientHeight + 1 && t.scrollWidth <= t.clientWidth + 1) return; }
  }

  function fitPhrases() { Array.prototype.forEach.call(document.querySelectorAll('.pashaby-t'), fitPhrase); }
  try {
    var fitRaf = 0;
    window.addEventListener('resize', function () { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(fitPhrases); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitPhrases);
  } catch (e) {}

  /* Fuel: EU Weekly Oil Bulletin for Poland through the site's own endpoint (a WordPress snippet fetches it weekly and converts EUR to PLN at the NBP rate).
     Until the endpoint answers, or where it does not exist (preview), the last bulletin checked by hand is shown with its date */
  var FUEL_FALLBACK = { date: '2026-10-26', pb95: 6.46, on: 7.84, lpg: 3.58, rate: 4.4026 };
  var FUEL = null;
  function fuelApi() { var l = document.querySelector('link[rel="https://api.w.org/"]'); return l && l.href ? l.href.replace(/\/?$/, '/') + 'pashaby/v1/fuel' : ''; }
  function updateFuel() {
    var f = FUEL || FUEL_FALLBACK, d = String(f.date || '').split('-').reverse().join('.');
    if (f.pb95) $$('[data-f="price"]').forEach(function (x) { x.placeholder = f.pb95.toFixed(2); });
    out('fuelPb', f.pb95 ? z2(f.pb95) : '—'); out('fuelDate', d); setTimeout(fitCounts, 0); out('fuelOn', f.on ? z2(f.on) : '—'); out('fuelLpg', f.lpg ? z2(f.lpg) : '—');
    out('fuelNote', 'Еврокомиссия, ' + link('https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en', 'Weekly Oil Bulletin') + ', цены на ' + d + '. Из евро в злотые по курсу NBP ' + String(f.rate).replace('.', ',') + '.');
    if (!S.f.priceManual && f.pb95) {
      var v = f.pb95.toFixed(2);
      if (S.f.price !== v) { S.f.price = v; save(); $$('[data-f="price"]').forEach(function (x) { if (x !== document.activeElement || x.value !== '') x.value = v; }); }
      out('priceNote', 'В поле средняя цена PB 95 по Польше на ' + d + '. Поменяй на свою.');
    } else if (S.f.priceManual) out('priceNote', 'Цена твоя. Средняя по Польше выше, в блоке топлива.');
    updateTools();
  }
  function loadFuel() {
    var u = fuelApi(); if (!u || !window.fetch) return;
    fetch(u, { credentials: 'omit' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (d && d.pb95 > 0 && /^\d{4}-\d{2}-\d{2}$/.test(d.date || '') && d.rate > 0) { FUEL = d; updateFuel(); }
    }).catch(function () {});
  }

  render();
  loadFuel();

  /* auto: if the visitor already allowed location for this site and never picked a city by hand */
  if (!S.cityManual && navigator.permissions && navigator.permissions.query) {
    try {
      navigator.permissions.query({ name: 'geolocation' }).then(function (st) { if (st && st.state === 'granted') locate(true); }, function () {});
    } catch (e) {}
  }
})();
