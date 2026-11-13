// Re-runs the Python validation against the functions actually shipped in block.js
const fs = require('fs'), src = fs.readFileSync(require('path').resolve(__dirname,'../src/block.js'), 'utf8');
const grab = re => { const m = src.match(re); if (!m) throw new Error('missing ' + re); return m[0]; };
const code = [grab(/var MORT = \{[^\n]+\n\s*var MORT_BUF[^\n]+/), grab(/function annPV[^\n]+/), grab(/function annPay[^\n]+/), grab(/function mortCap\([\s\S]+?\n  \}/)].join('\n');
const M = new Function(code + '\nreturn {MORT, mortCap, annPay, annPV, MORT_BUF};')();
const med = a => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const ANG = { '1,0,10000': [736,659,632,906,751,657,841,780,682,687,757,749], '2,0,11000': [800,726,697,831,827,753,925,858,637,717,832,824], '2,0,15000': [1045,998,956,1359,1130,1027,1261,1170,1092,1000,1135,1124], '2,0,20000': [1393,1337,1280,1812,1510,1315,1681,1559,1460,1333,1513,1499], '2,1,11000': [648,653,697,819,763,753,760,681,667,636,802,771], '2,2,11000': [498,478,588,754,667,714,689,542,574,492,749,712] };
const RANGE = { '1,0,5000': [241,372], '1,0,7000': [438,612], '1,0,13000': [606,1178], '2,1,15000': [956,1304], '2,1,20000': [1280,1880], '2,2,15000': [926,1239], '2,2,20000': [1280,1846] };
const TM = { '1,0,4000': [254.74,243.686,242.622,236.355,234.993,233.926,233.1,229.093,228.916,216.686,205.274], '2,1,6400': [263.545,234.343,203.228,172.6,158.81,157.656,156.104,133.213,126.822,126.75,121.981,91.435], '2,2,8000': [393.669,368.09,314.804,280.279,252.6,237.425,224.299,197.957,184.178,155.3,148.376,138.892], '2,0,10000': [827.907,826.434,819.575,811.8,806.204,750.467,722.55,717.114,635.425,609.216,584.946,426.053], '2,2,12000': [882.219,840.509,792.368,754.794,752.1,745.601,733.78,711.797,698.508,650.652,641.05,588.334] };
let fail = 0;
for (const kind of ['typ', 'max']) {
  const sets = { 'ANG wrzesień': Object.assign({}, ...Object.entries(ANG).map(([k, v]) => ({ [k]: kind === 'typ' ? med(v) : Math.max(...v) })), ...Object.entries(RANGE).map(([k, [lo, hi]]) => ({ [k]: kind === 'typ' ? (lo + hi) / 2 : hi }))), 'TM sierpień': Object.assign({}, ...Object.entries(TM).map(([k, v]) => ({ [k]: kind === 'typ' ? med(v) : Math.max(...v) }))) };
  for (const [name, T] of Object.entries(sets)) {
    const errs = Object.entries(T).map(([k, v]) => { const [ad, kids, inc] = k.split(',').map(Number); const r = M.mortCap(inc, ad, kids, 0, 0, 5.95, 25, M.MORT[kind]); return { k, v, m: r.loan / 1000, e: r.loan / 1000 / v - 1 }; });
    const mae = errs.reduce((s, x) => s + Math.abs(x.e), 0) / errs.length * 100, worst = errs.reduce((a, b) => Math.abs(b.e) > Math.abs(a.e) ? b : a);
    console.log(kind, name, 'MAE ' + mae.toFixed(1) + '%', 'worst ' + worst.k + ' ' + (worst.e * 100).toFixed(1) + '%');
    if (mae > 4 || Math.abs(worst.e) > 0.12) fail++;
  }
}
// sanity rules
const T = M.MORT.typ;
const a = M.mortCap(10000, 2, 0, 0, 0, 5.95, 30, T), b = M.mortCap(10000, 2, 0, 0, 0, 5.95, 25, T);
if (a.loan !== b.loan) { console.log('FAIL: >25y must not raise the loan'); fail++; }
const c = M.mortCap(10000, 2, 0, 500, 0, 5.95, 25, T); if (!(c.loan < b.loan)) { console.log('FAIL: debts must lower the loan'); fail++; }
const d = M.mortCap(10000, 2, 0, 0, 10000, 5.95, 25, T); if (Math.abs((b.pay - d.pay) - 500) > 0.01) { console.log('FAIL: 10k limit must cost 500/month (5%)'); fail++; }
const e = M.mortCap(3000, 2, 2, 0, 0, 5.95, 25, T); if (e.loan !== 0) { console.log('FAIL: below living costs must give 0'); fail++; }
// annuity check vs a known value: 400k, 6%, 25y = 2577.21
const p = M.annPay(400000, 6, 300); if (Math.abs(p - 2577.21) > 0.01) { console.log('FAIL annuity', p); fail++; }
console.log('sanity: 10k net 2 adults 25y typ', b.loan, 'max', M.mortCap(10000, 2, 0, 0, 0, 5.95, 25, M.MORT.max).loan, '| stress pay', b.pay.toFixed(2));
console.log(fail ? 'FAILED ' + fail : 'ALL OK');
process.exit(fail ? 1 : 0);
