// Weekly check of payment details: every account from PAY in src/block.js must still be on its proof page.
// Writes data/pay-check.json and site/data/pay-check.json ({checked, v:{voiv:{tax:true|false|null, card:...}}, fails:[...]}); the site shows the date and a warning per voivodeship.
// null = the page did not load (network, block), false = page loaded but the number is gone. Exit code 2 when something is false.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const js = fs.readFileSync(path.join(root, 'src/block.js'), 'utf8');
const PAY = JSON.parse(js.match(/\/\*PAY\*\/([\s\S]*?)\/\*\/PAY\*\//)[1]);
const UA = 'Mozilla/5.0 (compatible; PanBogdanPayCheck/1.0; +https://panbogdan.com)';

const cache = new Map();
async function page(url) {
  if (!cache.has(url)) cache.set(url, (async () => {
    for (let i = 0; i < 3; i++) {
      try {
        const r = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'pl' }, signal: AbortSignal.timeout(30000) });
        if (r.ok) return await r.text();
      } catch (e) { /* retry */ }
      await new Promise(res => setTimeout(res, (process.env.FAST?1:3000) * (i + 1)));
    }
    return null;
  })());
  return cache.get(url);
}
// only digits survive: spaces, &nbsp; and tags between the groups do not matter
const digits = html => html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\D+/g, '');

const out = { checked: '', v: {}, fails: [] };
for (const [vk, p] of Object.entries(PAY.v)) {
  out.v[vk] = {};
  for (const kind of ['tax', 'card']) {
    const [name, acc, url] = p[kind];
    const html = await page(url);
    const found = html == null ? null : digits(html).includes(acc.replace(/\s/g, ''));
    out.v[vk][kind] = found;
    if (found !== true) out.fails.push({ voiv: vk, kind, name, acc, url, reason: found === null ? 'page did not load' : 'account not found on page' });
    console.log((found === true ? 'ok  ' : found === null ? 'NET ' : 'GONE') + ' ' + vk + ' ' + kind + ' ' + acc);
  }
}
const d = new Date();
out.checked = d.getUTCDate() + '.' + String(d.getUTCMonth() + 1).padStart(2, '0') + '.' + d.getUTCFullYear();
// data/ is the source (mksite.py copies it into site/ on every build), site/data/ is what Cloudflare serves
for (const dir of [path.join(root, 'data'), path.join(root, 'site/data')]) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'pay-check.json'), JSON.stringify(out, null, 1) + '\n');
}
console.log('checked', out.checked, 'fails', out.fails.length);
process.exit(out.fails.some(f => f.reason !== 'page did not load') ? 2 : 0);
