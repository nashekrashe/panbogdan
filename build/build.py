import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=os.path.join(ROOT,'src'); DIST=os.path.join(ROOT,'dist'); os.makedirs(DIST,exist_ok=True)
FONTS_ICONS="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,300..400,0..1,0&icon_names=account_balance,add,apartment,arrow_outward,badge,calculate,calendar_month,call,check,child_care,close,content_copy,description,directions_car,emoji_events,event,expand_more,fingerprint,flight_land,format_quote,forum,gavel,health_and_safety,history_edu,home,hourglass_top,id_card,language,lightbulb,local_gas_station,location_on,luggage,menu_book,my_location,newspaper,payments,percent,person,restart_alt,savings,school,shield,swap_horiz,task_alt,timer,translate,upload_file,verified,volunteer_activism,warning,work&display=block"
FONT_TEXT="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito+Sans:wght@200;400;700&display=swap"
css=open(os.path.join(SRC,'block.css')).read(); js=open(os.path.join(SRC,'block.js')).read()
links=f'<link rel="stylesheet" href="{FONT_TEXT}">\n<link rel="stylesheet" href="{FONTS_ICONS}">\n'
root='<div class="pl" id="pl-root"><noscript><p style="padding:24px">Включи JavaScript, чтобы увидеть гайд.</p></noscript></div>\n'
open(os.path.join(DIST,'poland-wp.dev.html'),'w').write(links+'<style>\n'+css+'\n</style>\n'+root+'<script>\n'+js+'\n</script>\n')
shell='''<style>
/* Preview shell: the site's own chrome, light only like pasha.by */
:root{--shell-ink:#141414;--shell-paper:#ffffff;--shell-line:#dddddd;color-scheme:light}
body{background:var(--shell-paper);color:var(--shell-ink);font-family:'Nunito Sans',system-ui,sans-serif}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:30;background:var(--shell-paper)}
.shell-h{display:flex;align-items:center;justify-content:flex-start;gap:12px;padding-block:clamp(20px,2.4vw,36px);padding-left:max(clamp(20px,4.45vw,112px),env(safe-area-inset-left,0px));padding-right:max(clamp(20px,4.45vw,112px),env(safe-area-inset-right,0px))}
.shell-h a{color:var(--shell-ink);text-decoration:none;font-weight:700;font-size:20px;letter-spacing:-.04em}
.shell-f{padding-block:40px;text-align:center;border-top:1px solid var(--shell-line)}
.shell-f a{color:var(--shell-ink);text-decoration:none;font-weight:700;letter-spacing:-.04em}
.pl{width:auto!important;max-width:none!important;margin-left:0!important;--pl-top:env(safe-area-inset-top,0px)}
</style>
<header class="shell-h"><a href="https://pasha.by/" data-pl-logo>pasha.by</a></header>
'''
open(os.path.join(DIST,'preview.html'),'w').write('<meta charset="utf-8">\n<title>pasha.by/poland</title>\n'+links+shell+'<style>\n'+css+'\n</style>\n'+root+'<footer class="shell-f"><a href="https://pasha.by/">pasha.by</a></footer>\n<script>\n'+js+'\n</script>\n')
print('dev', os.path.getsize(os.path.join(DIST,'poland-wp.dev.html')), 'preview', os.path.getsize(os.path.join(DIST,'preview.html')))
