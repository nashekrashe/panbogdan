const fs=require('fs');const path=require('path');const R=p=>path.join(__dirname,'..',p);const {minify}=require('terser');const csso=require('csso');
(async()=>{
 const js=fs.readFileSync(R('src/block.js'),'utf8');
 const css=fs.readFileSync(R('src/block.css'),'utf8');
 const mj=(await minify(js,{compress:{passes:2},mangle:true,format:{ascii_only:false,comments:false}})).code;
 const mc=csso.minify(css).css;
 const b=fs.readFileSync(R('build/build.py'),'utf8');
 const icons=b.match(/FONTS_ICONS="([^"]+)"/)[1], text=b.match(/FONT_TEXT="([^"]+)"/)[1];
 const out='<link rel="stylesheet" href="'+text+'">\n<link rel="stylesheet" href="'+icons+'">\n<style>'+mc+'</style>\n<div class="pl" id="pl-root"><noscript><p style="padding:24px">Включи JavaScript, чтобы увидеть гайд.</p></noscript></div>\n<script>'+mj+'</script>\n';
 fs.writeFileSync(R('dist/poland-wp.min.html'),out);
 console.log(out.length, (out.match(/`/g)||[]).length, (out.match(/\$\{/g)||[]).length, (out.match(/\\/g)||[]).length);
})();
