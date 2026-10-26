// post.js — 后期：泛光（两层降采样模糊）、色差（只在重拍）、薄雾、闪白、镜头光环（比画面还大）、横向光条、暗角、颗粒
'use strict';
const GRAIN = [0, 1, 2].map(k => { const g = mk(256, 256), x = g.getContext('2d'), d = x.createImageData(256, 256); for (let i = 0; i < 256 * 256; i++) { const v = 128 + (rnd(i, 50 + k) + rnd(i, 80 + k) - 1) * 150; d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = clamp(v, 0, 255); d.data[i * 4 + 3] = 255; } x.putImageData(d, 0, 0); return g; });
function bloom(str1 = .62, str2 = .5) {
  b1.setTransform(1, 0, 0, 1, 0, 0); b1.globalCompositeOperation = 'copy'; b1.filter = 'contrast(1.9) blur(2px)'; b1.drawImage(S, 0, 0, B1.width, B1.height); b1.filter = 'none';
  b2.setTransform(1, 0, 0, 1, 0, 0); b2.globalCompositeOperation = 'copy'; b2.filter = 'blur(3px)'; b2.drawImage(B1, 0, 0, B2.width, B2.height); b2.filter = 'none';
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.drawImage(S, 0, 0);
  ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingQuality = 'high';
  ctx.globalAlpha = str1; ctx.drawImage(B1, 0, 0, W, H); ctx.globalAlpha = str2; ctx.drawImage(B2, 0, 0, W, H);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
function chroma(k) {   // 红往左、蓝往右各错开 k 像素
  if (k < .3) return;
  chx.globalCompositeOperation = 'copy'; chx.drawImage(cv, 0, 0);
  const one = (col, dx) => { tx.setTransform(1, 0, 0, 1, 0, 0); tx.globalAlpha = 1; tx.globalCompositeOperation = 'copy'; tx.drawImage(CH, 0, 0); tx.globalCompositeOperation = 'multiply'; tx.fillStyle = col; tx.fillRect(0, 0, W, H); tx.globalCompositeOperation = 'source-over'; ctx.drawImage(TMP, dx, 0); };
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'copy'; ctx.drawImage(CH, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#00ff00'; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter'; one('#ff0000', -k); one('#0000ff', k);
  ctx.globalCompositeOperation = 'source-over';
}
function haze(t, a = 1) {
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 3; i++) { const x = W * (.25 + .5 * rnd(i, 7)) + Math.sin(t * .05 + i * 2) * W * .12, y = H * (.3 + .4 * rnd(i, 8)) + Math.cos(t * .04 + i) * H * .08, r = Math.max(W, H) * (.45 + .2 * rnd(i, 9));
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(C.lamp, .035 * a)); g.addColorStop(1, rgba(C.lamp, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  ctx.globalCompositeOperation = 'source-over';
}
function flash(a, col = [255, 252, 246]) { if (a <= 0) return; ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rgba(col, a); ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
function lensRing(t, t0, x, y, col, big = true, dur = 1.25) {
  const u = pr(t, t0, t0 + dur); if (t < t0 || u >= 1) return;
  const D = Math.hypot(W, H), r = big ? lerp(D * .12, D * 1.15, eo(u)) : lerp(30, 360, eo(u)), a = (1 - u) * (1 - u) * (big ? .85 : .7);
  ctx.globalCompositeOperation = 'lighter';
  for (const [w, k] of [[big ? 46 : 18, .16], [big ? 14 : 6, .35], [big ? 3 : 2, .9]]) { ctx.strokeStyle = rgba(col, a * k); ctx.lineWidth = w; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }
  if (big) { ctx.strokeStyle = rgba(C.ice, a * .18); ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(x, y, r * .82, 0, Math.PI * 2); ctx.stroke(); }
  ctx.globalCompositeOperation = 'source-over';
}
function anam(t, t0, x, y, col, dur = .8, len = W * .9) {   // 横向光条（变形宽银幕镜头）
  const u = pr(t, t0, t0 + dur); if (t < t0 || u >= 1) return;
  const a = (1 - u) * (1 - u), L = len * (.35 + .65 * eo(u));
  ctx.globalCompositeOperation = 'lighter';
  for (const [h, k] of [[34, .12], [8, .35], [2.2, 1]]) { const g = ctx.createLinearGradient(x - L, 0, x + L, 0); g.addColorStop(0, rgba(col, 0)); g.addColorStop(.42, rgba(col, a * k * .8)); g.addColorStop(.5, rgba([255, 255, 255], a * k)); g.addColorStop(.58, rgba(col, a * k * .8)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - L, y - h / 2, L * 2, h); }
  const g = ctx.createRadialGradient(x, y, 0, x, y, 120); g.addColorStop(0, rgba([255, 255, 255], .7 * a)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - 120, y - 120, 240, 240);
  ctx.globalCompositeOperation = 'source-over';
}
function vignette() { const g = ctx.createRadialGradient(W / 2, H * .47, Math.min(W, H) * .3, W / 2, H * .47, Math.hypot(W, H) * .58); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.62)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
function grain(frame) {
  const g = GRAIN[frame % 3], ox = Math.floor(rnd(frame, 3) * 256), oy = Math.floor(rnd(frame, 4) * 256);
  ctx.save(); ctx.translate(-ox, -oy); ctx.fillStyle = ctx.createPattern(g, 'repeat');
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .2; ctx.fillRect(0, 0, W + 256, H + 256);
  ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .025; ctx.fillRect(0, 0, W + 256, H + 256);
  ctx.restore(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
