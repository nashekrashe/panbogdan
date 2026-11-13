// Prerender: runs site/index.html in jsdom and puts the rendered guide into #pl-root,
// so search bots and visitors without JS see the text. The script re-renders it on load.
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const file = process.argv[2];
const html = fs.readFileSync(file, 'utf8');
const vc = new VirtualConsole();
const errs = [];
vc.on('jsdomError', e => errs.push(e.message));
const dom = new JSDOM(html, {
  url: 'https://panbogdan.com/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(w) {
    w.matchMedia = q => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
    w.scrollTo = () => {}; w.HTMLElement.prototype.scrollTo = function () {}; w.HTMLElement.prototype.scrollIntoView = function () {};
    delete w.fetch;
  }
});
setTimeout(() => {
  const root = dom.window.document.getElementById('pl-root');
  const inner = root.innerHTML;
  const text = root.textContent.replace(/\s+/g, ' ').length;
  if (errs.length) { console.error('errors:', errs); process.exit(1); }
  if (text < 20000) { console.error('too little text', text); process.exit(1); }
  const marker = '<div class="pl" id="pl-root">';
  const i = html.indexOf(marker), j = html.indexOf('</div>', i);
  if (i < 0 || j < 0) { console.error('no root'); process.exit(1); }
  const out = html.slice(0, i + marker.length) + inner + html.slice(j);
  fs.writeFileSync(file, out);
  console.log('prerendered', text, 'chars of text,', out.length, 'bytes');
  process.exit(0);
}, 500);
