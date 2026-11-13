function patch(h) {
  var s = h.indexOf('<style>') + 7, e = h.indexOf('</style>');
  var css = h.slice(s, e)
    .replace(/(^|[{},])\.pl-/g, '$1#pl-root .pl-')
    .replace(/(^|[{},])\.pl(?=[\s.{:\[,>+~])/g, '$1#pl-root')
    .replace('scroll-margin-top:64px', 'scroll-margin-top:calc(var(--pl-top,0px) + 64px)');
  var top = '<script>(function(){var r=document.getElementById("pl-root");if(!r)return;var k=0;function s(){k=0;var t=0,a=document.getElementById("wpadminbar"),h=document.querySelector(".cs-header");if(a)t=Math.max(t,getComputedStyle(a).position=="fixed"?a.getBoundingClientRect().bottom:0);if(h)t=Math.max(t,h.getBoundingClientRect().bottom);r.style.setProperty("--pl-top",Math.max(0,Math.round(t))+"px")}function q(){if(!k){k=1;requestAnimationFrame(s)}}addEventListener("scroll",function(){q();setTimeout(q,300)},{passive:!0});addEventListener("resize",q);s()})()</script>';
  var i = h.lastIndexOf('</script>') + 9;
  return h.slice(0, s) + css + h.slice(e, i) + top + h.slice(i);
}
