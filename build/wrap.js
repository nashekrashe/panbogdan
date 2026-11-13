const fs=require('fs');const path=require('path');const R=p=>path.join(__dirname,'..',p);const crypto=require('crypto');
function wrap(html){
  const a=html.lastIndexOf('<script>'), b=html.lastIndexOf('</script>');
  const js=html.slice(a+8,b);
  const enc=JSON.stringify(js).replace(/&/g,'\\u0026').replace(/</g,'\\u003c').replace(/>/g,'\\u003e');
  return html.slice(0,a)+'<script>(function(){var c=document.currentScript,s=document.createElement("script");s.textContent='+enc+';c.parentNode.insertBefore(s,c.nextSibling)})()</script>'+html.slice(b+9);
}
const src=fs.readFileSync(R('dist/poland-wp.min.html'),'utf8');
const out=wrap(src);
fs.writeFileSync(R('dist/poland-wp.min.html'),out);
const sc=out.slice(out.lastIndexOf('<script>'));
const css=out.slice(out.indexOf('<style>'),out.indexOf('</style>'));
console.log(out.length, crypto.createHash('sha256').update(out).digest('hex').slice(0,16), 'amp in script:',(sc.match(/&/g)||[]).length,'lt in script body:',(sc.slice(8,-10).match(/</g)||[]).length,'amp in css:',(css.match(/&/g)||[]).length);

