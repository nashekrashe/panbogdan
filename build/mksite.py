#!/usr/bin/env python3
"""Builds site/ for panbogdan.com (Cloudflare Pages) from dist/preview.html.
Fonts and the datepicker are served from the own domain, meta tags and icons added,
progress import from pasha.by/poland via #import=<base64url(JSON)>."""
import os, re, shutil, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST, SITE = os.path.join(ROOT, 'dist'), os.path.join(ROOT, 'site')
URL = 'https://panbogdan.com/'
TITLE = 'Pan Bogdan: Польша пошагово'
DESC = 'Ироничный гайд для эмигрантов в Польше: ВНЖ, ПМЖ и паспорт по шагам, бабки и банки, авто и бесплатная помощь в твоём городе.'

html = open(os.path.join(DIST, 'preview.html'), encoding='utf-8').read()

# 1. drop Google Fonts, the old title and charset (re-added in the head below)
html = re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>\n?', '', html)
html = html.replace('<meta charset="utf-8">\n', '').replace('<title>pasha.by/poland</title>\n', '')
assert 'fonts.googleapis' not in html

# 2. datepicker from own domain (same file, same SRI)
html = html.replace('https://cdn.jsdelivr.net/npm/air-datepicker@3.6.0/air-datepicker.js', '/vendor/air-datepicker-3.6.0.js')
assert 'jsdelivr' not in html

# 3. brand in header and footer
html = html.replace('<header class="shell-h"><a href="https://pasha.by/" data-pl-logo>pasha.by</a></header>',
                    '<header class="shell-h"><a href="/" data-pl-logo>Pan Bogdan</a></header>')
html = html.replace('<footer class="shell-f"><a href="https://pasha.by/">pasha.by</a></footer>',
                    '<footer class="shell-f"><a href="/">Pan Bogdan</a><p class="shell-by">Придумал и собрал <a href="https://pasha.by/">pasha.by</a></p></footer>')
assert 'data-pl-logo>Pan Bogdan' in html and 'shell-by' in html

FONTS = ''
NS = {'latin': 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
      'latin-ext': 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
      'cyrillic': 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116',
      'cyrillic-ext': 'U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F'}
for w in (200, 400, 700):
    for s, r in NS.items():
        FONTS += "@font-face{font-family:'Nunito Sans';font-style:normal;font-weight:%d;font-display:swap;src:url(/fonts/nunito-sans-%s-%d-normal.woff2) format('woff2');unicode-range:%s}\n" % (w, s, w, r)
for s in ('latin', 'latin-ext'):
    FONTS += "@font-face{font-family:'Bebas Neue';font-style:normal;font-weight:400;font-display:swap;src:url(/fonts/bebas-neue-%s-400-normal.woff2) format('woff2');unicode-range:%s}\n" % (s, NS[s])
FONTS += "@font-face{font-family:'Material Symbols Rounded';font-style:normal;font-weight:300 400;font-display:block;src:url(/fonts/ms-rounded-sub.woff2) format('woff2')}\n"
FONTS += ".shell-by{margin-top:8px;font-size:14px;color:#6b6f76}.shell-by a{font-weight:700;color:#141414}\n"

# progress from pasha.by/poland: #import=<base64url(JSON)>. Runs before the guide reads localStorage
IMPORT = r"""<script>
(function(){var K='pb-poland-v2',h=location.hash,m=h.match(/^#import=([A-Za-z0-9_-]+)/);if(!m)return;
function clean(){try{history.replaceState(null,'',location.pathname+location.search)}catch(e){location.hash=''}}
try{var b=m[1].replace(/-/g,'+').replace(/_/g,'/');while(b.length%4)b+='=';
var bin=atob(b),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
var txt=new TextDecoder().decode(u),d=JSON.parse(txt);if(!d||typeof d!=='object')return clean();
var own=null;try{own=localStorage.getItem(K)}catch(e){}
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
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
<link rel="apple-touch-icon" href="/apple-touch-icon-180.png">
<meta property="og:type" content="website">
<meta property="og:locale" content="ru_RU">
<meta property="og:site_name" content="Pan Bogdan">
<meta property="og:title" content="Польша пошагово">
<meta property="og:description" content="%(d)s">
<meta property="og:url" content="%(u)s">
<meta property="og:image" content="%(u)sog-share-1200x630.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Польша пошагово">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Польша пошагово">
<meta name="twitter:description" content="%(d)s">
<meta name="twitter:image" content="%(u)sog-share-1200x630.jpg">
<link rel="https://api.w.org/" href="https://pasha.by/wp-json/">
<link rel="preload" href="/fonts/ms-rounded-sub.woff2" as="font" type="font/woff2" crossorigin>
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
shutil.copy(os.path.join(ROOT, 'vendor', 'air-datepicker.js'), os.path.join(SITE, 'vendor', 'air-datepicker-3.6.0.js'))
for f in ('og-share-1200x630.jpg', 'favicon-32.png', 'icon-192.png', 'apple-touch-icon-180.png'):
    shutil.copy(os.path.join(ROOT, 'assets', f), os.path.join(SITE, f))
shutil.copy(os.path.join(SITE, 'favicon-32.png'), os.path.join(SITE, 'favicon.ico'))  # browsers sniff PNG

open(os.path.join(SITE, 'robots.txt'), 'w').write('User-agent: *\nAllow: /\nSitemap: %ssitemap.xml\n' % URL)
open(os.path.join(SITE, 'sitemap.xml'), 'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>%s</loc></url></urlset>\n' % URL)
open(os.path.join(SITE, '_headers'), 'w').write('''/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(self)
/fonts/*
  Cache-Control: public, max-age=31536000, immutable
/vendor/*
  Cache-Control: public, max-age=31536000, immutable
''')
print('site/', sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(SITE) for f in fs), 'bytes')
