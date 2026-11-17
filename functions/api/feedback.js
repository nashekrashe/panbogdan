/* Cloudflare Pages Function: POST /api/feedback → запись в KV.
   Привязка в панели Pages (Settings → Bindings): KV namespace с именем переменной FEEDBACK, для Production и Preview.
   Читать: Storage & Databases → KV → panbogdan-feedback. Ключ msg:<время>:<случайное>, значение JSON. Хранится 365 дней. */
const J = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const clip = (v, n) => String(v == null ? '' : v).replace(/\r/g, '').trim().slice(0, n);

export async function onRequestPost({ request, env }) {
  let b;
  try { b = await request.json(); } catch (e) { return J({ ok: false, err: 'bad' }, 400); }
  if (b.hp) return J({ ok: true }); // ловушка для ботов: поле, которое человек не видит
  const msg = clip(b.msg, 4000), anon = !!b.anon, name = anon ? '' : clip(b.name, 120), email = anon ? '' : clip(b.email, 200), page = clip(b.page, 300);
  if (msg.length < 3) return J({ ok: false, err: 'short' }, 400);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return J({ ok: false, err: 'email' }, 400);
  if (!env.FEEDBACK) return J({ ok: false, err: 'off' }, 503);
  const at = new Date().toISOString();
  const key = 'msg:' + at + ':' + crypto.randomUUID().slice(0, 8);
  const rec = { at, msg, name, email, page, host: new URL(request.url).host };
  await env.FEEDBACK.put(key, JSON.stringify(rec), { expirationTtl: 60 * 60 * 24 * 365, metadata: { at, who: name || email || 'аноним', page, preview: msg.slice(0, 80) } });
  return J({ ok: true });
}
export const onRequest = () => J({ ok: false, err: 'method' }, 405);
