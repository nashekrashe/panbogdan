#!/usr/bin/env python3
"""Builds site/ for panbogdan.com (Cloudflare Pages) from dist/preview.html.
Fonts and the datepicker are served from the own domain, meta tags and icons added,
progress import from pasha.by/poland via #import=<base64url(JSON)>."""
import os, re, shutil, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST, SITE = os.path.join(ROOT, 'dist'), os.path.join(ROOT, 'site')
URL = 'https://panbogdan.com/'
TITLE = 'Pan Bogdan: Польша пошагово. ВНЖ, ПМЖ, паспорт, деньги'
DESC = 'Ироничный гайд для эмигрантов в Польше: ВНЖ, ПМЖ и паспорт по шагам, бабки и банки, авто и бесплатная помощь в твоём городе.'

html = open(os.path.join(DIST, 'preview.html'), encoding='utf-8').read()

# 1. drop Google Fonts, the old title and charset (re-added in the head below)
html = re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>\n?', '', html)
html = html.replace('<meta charset="utf-8">\n', '').replace('<title>pasha.by/poland</title>\n', '')
assert 'fonts.googleapis' not in html

# 2. datepicker from own domain (same file, same SRI)
html = html.replace('https://cdn.jsdelivr.net/npm/air-datepicker@3.6.0/air-datepicker.js', '/vendor/air-datepicker-3.6.0.js')
assert 'jsdelivr' not in html

FONTS = ''
NS = {'latin': 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
      'latin-ext': 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
      'cyrillic': 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116',
      'cyrillic-ext': 'U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F'}
for s in ('latin', 'latin-ext', 'cyrillic'):
    FONTS += "@font-face{font-family:'IBM Plex Sans';font-style:normal;font-weight:100 700;font-stretch:75%% 100%%;font-display:swap;src:url(/fonts/ibm-plex-sans-%s-standard-normal.woff2) format('woff2');unicode-range:%s}\n" % (s, NS[s])
FONTS += "@font-face{font-family:'Material Symbols Rounded';font-style:normal;font-weight:300 400;font-display:block;src:url(/fonts/ms-rounded-sub.woff2) format('woff2')}\n"

# progress from pasha.by/poland: #import=<base64url(JSON)>. Runs before the guide reads localStorage
IMPORT = r"""<script>
(function(){var K='pb-poland-v2',h=location.hash,m=h.match(/^#import=([A-Za-z0-9_-]+)/);if(!m)return;
function clean(){try{history.replaceState(null,'',location.pathname+location.search)}catch(e){location.hash=''}}
try{var b=m[1].replace(/-/g,'+').replace(/_/g,'/');while(b.length%4)b+='=';
var bin=atob(b),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
if(u.length>100000)return clean();
function ok(v,n){if(n>6)return false;var t=typeof v;if(v===null||t==='number'||t==='boolean')return true;if(t==='string')return v.length<500&&!/[<>"'`\\]/.test(v);
if(t!=='object')return false;for(var k in v)if(Object.prototype.hasOwnProperty.call(v,k)&&(k.length>60||/[^\w.-]/.test(k)||!ok(v[k],n+1)))return false;return true}
var txt=new TextDecoder().decode(u),d=JSON.parse(txt);if(!d||typeof d!=='object'||Array.isArray(d)||!ok(d,0))return clean();
txt=JSON.stringify(d);var own=null;try{own=localStorage.getItem(K)}catch(e){}
if(!own||own===txt||window.confirm('Перенести прогресс с pasha.by/poland? Текущий прогресс здесь заменится.'))localStorage.setItem(K,txt);
}catch(e){}clean();})();
</script>
"""

HEAD = '''<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>%(t)s</title>
<meta name="description" content="%(d)s">
<link rel="canonical" href="%(u)s">
<meta name="theme-color" content="#ffffff">
<meta name="color-scheme" content="light">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=2">
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png?v=2">
<link rel="apple-touch-icon" href="/apple-touch-icon-180.png?v=2">
<meta property="og:type" content="website">
<meta property="og:locale" content="ru_RU">
<meta property="og:site_name" content="Pan Bogdan">
<meta property="og:title" content="%(t)s">
<meta property="og:description" content="%(d)s">
<meta property="og:url" content="%(u)s">
<meta property="og:image" content="%(u)sog-share-1200x630.jpg?v=3">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Pan Bogdan, e-помогатор: легализация, новости, беларусам, бабки, дети, дом, хелп, банки">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="%(t)s">
<meta name="twitter:description" content="%(d)s">
<meta name="twitter:image" content="%(u)sog-share-1200x630.jpg?v=3">
<link rel="https://api.w.org/" href="https://pasha.by/wp-json/">
<link rel="preload" href="/fonts/ms-rounded-sub.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/ibm-plex-sans-cyrillic-standard-normal.woff2" as="font" type="font/woff2" crossorigin>
<meta name="pb-img" content="/img/">
<meta name="pb-paths" content="1">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"Pan Bogdan","alternateName":"Пан Богдан","url":"https://panbogdan.com/","inLanguage":"ru","description":"%(d)s"}</script>
<style>
%(f)s</style>
%(i)s</head>
<body>
''' % {'t': TITLE, 'd': DESC, 'u': URL, 'f': FONTS, 'i': IMPORT}

html = HEAD + html.rstrip() + '\n</body>\n</html>\n'

if os.path.isdir(SITE): shutil.rmtree(SITE)
os.makedirs(os.path.join(SITE, 'fonts')); os.makedirs(os.path.join(SITE, 'vendor'))
open(os.path.join(SITE, 'index.html'), 'w', encoding='utf-8').write(html)
for f in os.listdir(os.path.join(ROOT, 'site-src')):
    shutil.copy(os.path.join(ROOT, 'site-src', f), os.path.join(SITE, 'fonts', f))
shutil.copytree(os.path.join(ROOT, 'assets', 'ill'), os.path.join(SITE, 'img'))
shutil.copy(os.path.join(ROOT, 'vendor', 'air-datepicker.js'), os.path.join(SITE, 'vendor', 'air-datepicker-3.6.0.js'))
for f in ('og-share-1200x630.jpg', 'favicon-32.png', 'icon-192.png', 'apple-touch-icon-180.png'):
    shutil.copy(os.path.join(ROOT, 'assets', f), os.path.join(SITE, f))
shutil.copy(os.path.join(ROOT, 'assets', 'favicon.ico'), os.path.join(SITE, 'favicon.ico'))
# weekly payment-details check result (build/paycheck.mjs, GitHub Actions)
if os.path.isdir(os.path.join(ROOT, 'data')): shutil.copytree(os.path.join(ROOT, 'data'), os.path.join(SITE, 'data'))


# one page per section: own address, title and description; prerender.js then leaves only that section's text in it
PAGES = [
    ('legalizacja', 'Легализация в Польше: ВНЖ, ПМЖ и паспорт по шагам', 'Карта побыту, rezydent UE и гражданство: шаги, документы, сроки по воеводствам и таймер ожидания.'),
    ('aktualnosci', 'Что изменилось для иностранцев в Польше', 'Новые законы и правила для иностранцев в Польше с датами и источниками.'),
    ('bialorusini', 'Беларусам в Польше: документы, Karta Polaka и защита', 'Документ Подружи, Karta Polaka, международная защита, выплаты, банки, работа и дети беларусов в Польше. Проверенные источники.'),
    ('pieniadze', 'Зарплата, налоги и ZUS в Польше', 'Сколько на руки по umowa o pracę, zlecenie, dzieło и B2B, налоги, уровни ZUS и дедлайны 2026.'),
    ('banki', 'Банки для беларусов в Польше', 'Какие банки открывают счёт беларусам и как перевести деньги из Беларуси без заморозки.'),
    ('dzieci', 'Дети в Польше: беременность, NFZ, PESEL и ВНЖ ребёнка', 'Беременность по NFZ, регистрация рождения в USC, PESEL, легализация ребёнка иностранца, ясли, школа и выплаты. Документы и инструкции по городам.'),
    ('dom', 'Ипотека иностранцу в Польше: калькулятор', 'Сколько дадут на ипотеку по твоему доходу и договору, платёж, расходы на сделку и аренда.'),
    ('auto', 'Авто в Польше: топливо, права, номера', 'Цены топлива, сколько стоит доехать, обмен прав и авто на беларуских номерах.'),
    ('pomoc', 'Бесплатная помощь иностранцам в Польше', 'Бесплатная юрпомощь по городам, официальные сайты, первые 30 дней, врачи и польский.'),
    ('slownik', 'Словарь ужонда: польские слова', 'Польские слова из писем ужонда и быта с переводом.'),
]
for slug, t, d in PAGES:
    h = html.replace('<title>%s</title>' % TITLE, '<title>%s · Pan Bogdan</title>' % t)
    h = h.replace('<meta name="description" content="%s">' % DESC, '<meta name="description" content="%s">' % d)
    h = h.replace('<link rel="canonical" href="%s">' % URL, '<link rel="canonical" href="%s%s">' % (URL, slug))
    h = h.replace('<meta property="og:url" content="%s">' % URL, '<meta property="og:url" content="%s%s">' % (URL, slug))
    h = h.replace('<meta property="og:title" content="%s">' % TITLE, '<meta property="og:title" content="%s">' % t)
    h = h.replace('<meta name="twitter:title" content="%s">' % TITLE, '<meta name="twitter:title" content="%s">' % t)
    h = h.replace('<meta name="twitter:description" content="%s">' % DESC, '<meta name="twitter:description" content="%s">' % d)
    h = h.replace('<meta property="og:description" content="%s">' % DESC, '<meta property="og:description" content="%s">' % d)
    assert h.count(slug) >= 2, slug
    assert h.count(t) >= 3 and h.count(d) >= 3, slug
    open(os.path.join(SITE, slug + '.html'), 'w', encoding='utf-8').write(h)

# unknown addresses: a real 404 instead of the home page with code 200
open(os.path.join(SITE, '404.html'), 'w', encoding='utf-8').write('''<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>404 · Pan Bogdan</title><meta name="robots" content="noindex">
<link rel="icon" href="/favicon.ico" sizes="48x48"><style>body{margin:0;min-height:100vh;display:grid;place-content:center;gap:16px;text-align:center;font:16px/1.5 system-ui,sans-serif;color:#1F1919;padding:24px}b{font-size:96px;line-height:1;color:#D74B4E}a{color:inherit;font-weight:600}img{margin:0 auto}</style></head>
<body><img src="/img/legal.webp" alt="" width="160" height="160"><b>404</b><p>Brakuje jednego dokumentu. Такой страницы нет.</p><p><a href="/">На главную</a></p></body></html>
''')
open(os.path.join(SITE, 'robots.txt'), 'w').write('User-agent: *\nAllow: /\nSitemap: %ssitemap.xml\n' % URL)
open(os.path.join(SITE, 'sitemap.xml'), 'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join('<url><loc>%s%s</loc><lastmod>%s</lastmod></url>' % (URL, p, __import__('datetime').date.today().isoformat()) for p in [''] + [x[0] for x in PAGES]) + '</urlset>\n')
open(os.path.join(SITE, '_headers'), 'w').write('''/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(self)
/fonts/*
  Cache-Control: public, max-age=31536000, immutable
/img/*
  Cache-Control: public, max-age=86400
/vendor/*
  Cache-Control: public, max-age=31536000, immutable
''')
print('site/', sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(SITE) for f in fs), 'bytes')
