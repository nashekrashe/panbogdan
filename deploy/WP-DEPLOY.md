# Заливка в WordPress (пока гайд живёт на pasha.by/poland)

Нужно только до переезда на panbogdan.com. Страница 5595 на проде, 5442 на стейджинге `/enterprise/`.
Контент страницы это один блок `<!-- wp:html -->` с содержимым `dist/poland-wp.html`.

## 1. Собрать и сделать патч

```bash
cd build && ./build.sh                          # печатает sha256 первых 16 знаков нового dist/poland-wp.html
cd .. && python3 deploy/mkpatch.py deploy/live-base.html   # пишет dist/patch.b64 (gzip+base64 JSON [[start,end,text],...])
```

`deploy/live-base.html` это то, что сейчас на проде (sha256 `6b8bef8d0b6d223b`, 4.11.2026).
После успешной заливки скопируй новый `dist/poland-wp.html` в `deploy/live-base.html`.

## 2. Передать патч в браузер

Пользователь сам логинится в wp-admin во встроенном браузере (пароли Claude не вводит).
Патч передаётся кусками по 2500 знаков, у каждого проверяется sha256. Если хэш не сошёлся, кусок режется на 500 знаков, чтобы найти опечатку.

```js
// для каждого куска i: c = '...'; ожидаемый хэш h12
const h = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(c)))).map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,12);
if (h === h12) sessionStorage.setItem('pbC'+i, c);
// после последнего куска собрать pbP и сверить sha256 всего патча
```

## 3. Применить и сохранить

```js
const sha = async s => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))).map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,16);
const bin = Uint8Array.from(atob(sessionStorage.getItem('pbP')), ch => ch.charCodeAt(0));
const ops = JSON.parse(await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))).text());
const nonce = await fetch('/wp-admin/admin-ajax.php?action=rest-nonce').then(r=>r.text());
const pg = await fetch('/wp-json/wp/v2/pages/5595?context=edit&_fields=content', {headers:{'X-WP-Nonce':nonce}}).then(r=>r.json());
const raw = pg.content.raw; let x = raw.slice(17, raw.length-18)+'\n';   // без обёртки wp:html, с \n в конце
if (await sha(x) !== BASE16) throw new Error('base mismatch');
for (let i = ops.length-1; i >= 0; i--) { const [s,e,n] = ops[i]; x = x.slice(0,s) + n + x.slice(e); }
if (await sha(x) !== NEW16) throw new Error('new mismatch');
await fetch('/wp-json/wp/v2/pages/5595', {method:'POST', headers:{'X-WP-Nonce':nonce,'Content-Type':'application/json'},
  body: JSON.stringify({content: '<!-- wp:html -->\n'+x.replace(/\n$/,'')+'\n<!-- /wp:html -->'})});
```

Стейджинг: `/enterprise/index.php?rest_route=/wp/v2/pages/5442` (там версия v19, база другая).

## 4. Проверить

Открыть `https://pasha.by/poland/?v=<что-угодно>#pl-bank`, через JS проверить выводы калькуляторов и что нет ошибок.
Тестовые значения после проверки вернуть в localStorage (`pb-poland-v2`) как были.

## WordPress-части, которых нет в гайде

- `wp/shell-snippet.php`: Code Snippets №8. На /poland выводит свои иконки (медиа 5603 32px, 5604 192px, 5605 apple 180px) и убирает `wp_site_icon`.
- `wp/fuel-snippet.php`: REST `GET /wp-json/pashaby/v1/fuel`, цены топлива из EU Weekly Oil Bulletin, перевод в PLN по курсу NBP, кеш 12 часов.
- Превью для соцсетей: featured image 5607 (pashaby-poland-share.jpg, это `assets/og-share-1200x630.jpg`) и excerpt страницы.
