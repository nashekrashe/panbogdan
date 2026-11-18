// Weekly check of the news: every source link (u, u2, u3) of NEWS in src/block.js must still open.
// Writes data/news-check.json and site/data/news-check.json ({checked, n, dead:[url], fails:[{url, h, reason}]}); the site shows the date and marks dead links.
// A page that answers 401/403/429 (anti-bot) counts as alive: the link exists, the robot is just not welcome. Exit code 2 when a link is dead.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const js = fs.readFileSync(path.join(root, 'src/block.js'), 'utf8');
const block = js.match(/\/\*NEWS\*\/([\s\S]*?)\/\*\/NEWS\*\//)[1];
const items = [...block.matchAll(/\{ (?:id: '[^']+', )?d: '([^']+)'[^\n]*?h: '((?:[^'\\]|\\.)*)'[^\n]*?\n/g)].map(m => {
  const line = m[0];
  return { d: m[1], h: m[2], urls: [...line.matchAll(/\bu[23]?: '([^']+)'/g)].map(x => x[1]) };
});
const UA = 'Mozilla/5.0 (compatible; PanBogdanNewsCheck/1.0; +https://panbogdan.com)';
const ALIVE = new Set([401, 403, 405, 429]);

async function status(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'pl' }, redirect: 'follow', signal: AbortSignal.timeout(30000) });
      if (r.ok || ALIVE.has(r.status)) return { ok: true, code: r.status };
      if (r.status === 404 || r.status === 410) return { ok: false, code: r.status };
    } catch (e) { /* retry */ }
    await new Promise(res => setTimeout(res, (process.env.FAST ? 1 : 3000) * (i + 1)));
  }
  return { ok: null, code: 0 };
}

const out = { checked: '', n: 0, dead: [], fails: [] };
for (const it of items) for (const url of it.urls) {
  out.n++;
  const st = await status(url);
  console.log((st.ok === true ? 'ok  ' : st.ok === false ? 'DEAD' : 'NET ') + ' ' + st.code + ' ' + it.d + ' ' + url);
  if (st.ok === false) out.dead.push(url);
  if (st.ok !== true) out.fails.push({ url, h: it.h, d: it.d, reason: st.ok === false ? 'HTTP ' + st.code : 'page did not load' });
}
const d = new Date();
out.checked = d.getUTCDate() + '.' + String(d.getUTCMonth() + 1).padStart(2, '0') + '.' + d.getUTCFullYear();
for (const dir of [path.join(root, 'data'), path.join(root, 'site/data')]) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'news-check.json'), JSON.stringify(out, null, 1) + '\n');
}
console.log('checked', out.checked, 'links', out.n, 'dead', out.dead.length);
process.exit(out.dead.length ? 2 : 0);
