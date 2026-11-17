/* panbogdan-mail: шлёт сообщения формы связи на почту Павла.
   Вызывается только из Pages-функции panbogdan через service binding MAILER (снаружи адреса у воркера нет: workers_dev = false).
   Письмо: от bogdan@panbogdan.com на TO, «Ответить» = почта человека, если он её оставил. */
const TO = '1559559@gmail.com';
const FROM = { email: 'bogdan@panbogdan.com', name: 'Pan Bogdan' };

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('method', { status: 405 });
    let m;
    try { m = await request.json(); } catch (e) { return new Response('bad', { status: 400 }); }
    const who = m.name || m.email ? [m.name, m.email].filter(Boolean).join(', ') : 'аноним';
    const text = m.msg + '\n\n—\nОт: ' + who + '\nСтраница: ' + (m.host || '') + (m.page || '') + '\nКогда: ' + m.at + '\nКопия в KV: ' + (m.key || '');
    try {
      const r = await env.EMAIL.send({
        from: FROM,
        to: TO,
        replyTo: m.email || undefined,
        subject: 'Pan Bogdan: ' + String(m.msg).split('\n')[0].slice(0, 60),
        text
      });
      return Response.json({ ok: true, id: r.messageId });
    } catch (e) {
      return Response.json({ ok: false, code: e.code || 'type', message: e.message }, { status: 502 });
    }
  }
};
