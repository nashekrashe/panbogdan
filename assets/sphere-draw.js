/* draws the share image and icons from a loaded sphere <img>; returns canvases */
window.__drawAll = async function (img) {
  await document.fonts.load('700 92px "Nunito Sans"', 'Польша'); await document.fonts.load('200 32px "Nunito Sans"', 'ВНЖ');
  const og = document.createElement('canvas'); og.width = 1200; og.height = 630;
  const c = og.getContext('2d');
  c.fillStyle = '#fff'; c.fillRect(0, 0, 1200, 630);
  c.imageSmoothingQuality = 'high'; c.drawImage(img, 674, 80, 470, 470);
  c.textBaseline = 'alphabetic'; c.fillStyle = '#fd2222';
  c.font = '700 22px "Nunito Sans"'; c.letterSpacing = '1.76px'; c.fillText('ГАЙД ДЛЯ ЭМИГРАНТОВ', 72, 170);
  c.fillStyle = '#141414'; c.font = '700 92px "Nunito Sans"'; c.letterSpacing = '-4.14px';
  c.fillText('Польша', 68, 262); c.fillText('по шагам', 68, 352);
  c.font = '200 32px "Nunito Sans"'; c.letterSpacing = '0px';
  c.fillText('ВНЖ, ПМЖ и паспорт, бабки, банки,', 72, 414); c.fillText('авто и помощь в твоём городе', 72, 452);
  c.font = '700 22px "Nunito Sans"'; c.letterSpacing = '-0.66px'; c.fillText('pasha.by/poland', 72, 584);
  /* icons: step the sphere down in halves for smooth small sizes */
  function icon(size, bg, pad) {
    let src = img, w = img.naturalWidth || img.width;
    const target = Math.round(size * (1 - 2 * (pad || 0)));
    while (w / 2 >= target) { const t = document.createElement('canvas'); t.width = t.height = Math.round(w / 2); const tc = t.getContext('2d'); tc.imageSmoothingQuality = 'high'; tc.drawImage(src, 0, 0, t.width, t.height); src = t; w = t.width; }
    const cv = document.createElement('canvas'); cv.width = cv.height = size; const x = cv.getContext('2d');
    if (bg) { x.fillStyle = bg; x.fillRect(0, 0, size, size); }
    x.imageSmoothingQuality = 'high'; const o = (size - target) / 2; x.drawImage(src, o, o, target, target);
    return cv;
  }
  return { og, i32: icon(32), i192: icon(192), apple: icon(180, '#fff', 0.08) };
};
