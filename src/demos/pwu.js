'use strict';
// 《INFP》v3 画面小工具（只给 PW* 用）
const K = require('../core');
const { W, H, clamp, lerp, glow, rgba, mix, mulberry32 } = K;

const DUMMY = new K.Canvas(8, 8).getContext('2d');
let BL = null;
// 把一组东西画到离屏层再虚焦贴回来（保留当前变换）
function blurLayer(ctx, px, fn) {
  if (px < 0.6) { fn(ctx); return; }
  if (!BL) BL = new K.Canvas(W, H);
  const c = BL.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
  c.setTransform(ctx.getTransform()); fn(c);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = `blur(${px.toFixed(1)}px)`; ctx.drawImage(BL, 0, 0); ctx.filter = 'none'; ctx.restore();
}
function vgrad(ctx, stops, y0 = 0, y1 = H, x0 = -400, x1 = W + 400) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([p, c]) => g.addColorStop(p, rgba(c)));
  ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
}
// 体积光束：从 (x0,y0) 宽 w0 到 (x1,y1) 宽 w1，沿长度渐隐
function beam(ctx, x0, y0, w0, x1, y1, w1, c, a) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, rgba(c, a)); g.addColorStop(0.6, rgba(c, a * 0.35)); g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g; ctx.beginPath();
  ctx.moveTo(x0 - w0 / 2, y0); ctx.lineTo(x0 + w0 / 2, y0); ctx.lineTo(x1 + w1 / 2, y1); ctx.lineTo(x1 - w1 / 2, y1); ctx.closePath();
  ctx.filter = 'blur(18px)'; ctx.fill(); ctx.filter = 'none';
  ctx.restore();
}
// 地上一块椭圆光池
function pool(ctx, x, y, r, c, a, sy = 0.2) { if (a <= 0.003) return; ctx.save(); ctx.translate(x, y); ctx.scale(1, sy); glow(ctx, 0, 0, r, c, a); ctx.restore(); }
function shadow(ctx, x, y, r, a = 0.5) { ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.16); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(-r, -r, 2 * r, 2 * r); ctx.restore(); }
// 虚焦光斑（有亮边的圆，前景用）
function bokeh(ctx, x, y, r, c, a) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(c, a * 0.3)); g.addColorStop(0.8, rgba(c, a * 0.45)); g.addColorStop(0.93, rgba(c, a * 0.3)); g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); ctx.restore();
}
const mkB = (seed, n, box, rr, cols) => { const r = mulberry32(seed); return Array.from({ length: n }, () => ({ x: box[0] + r() * (box[2] - box[0]), y: box[1] + r() * (box[3] - box[1]), r: rr[0] + r() * (rr[1] - rr[0]), c: cols[(r() * cols.length) | 0], a: 0.4 + r() * 0.6, ph: r() * 6.28 })); };
function bokehs(ctx, t, list, a, drift = 14) { for (const b of list) bokeh(ctx, b.x + Math.sin(t * 0.3 + b.ph) * drift, b.y + Math.cos(t * 0.25 + b.ph) * drift * 0.6, b.r, b.c, a * b.a * (0.75 + 0.25 * Math.sin(t * 0.8 + b.ph))); }
// 光里浮尘
const mkDust = (seed, n, box) => { const r = mulberry32(seed); return Array.from({ length: n }, () => ({ x: box[0] + r() * (box[2] - box[0]), y: box[1] + r() * (box[3] - box[1]), r: 1.5 + r() * 4, ph: r() * 6.28, sp: 0.2 + r() * 0.7 })); };
function dust(ctx, t, list, c, a, rise = 10) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const d of list) glow(ctx, d.x + Math.sin(t * d.sp + d.ph) * 22, d.y - ((t * rise * d.sp + d.ph * 40) % 160) + 80, d.r * 2.6, c, a * (0.3 + 0.7 * Math.sin(t * d.sp * 1.7 + d.ph) ** 2)); ctx.restore(); }
// 有体积的发光球
function orb(ctx, x, y, r, c, a = 1) {
  if (a <= 0.003) return;
  glow(ctx, x, y, r * 3.2, c, 0.28 * a);
  ctx.save(); ctx.globalAlpha *= a;
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, 0, x, y, r);
  g.addColorStop(0, rgba(mix(c, [255, 255, 255], 0.75))); g.addColorStop(0.5, rgba(c, 0.9)); g.addColorStop(1, rgba(mix(c, [0, 0, 0], 0.4), 0.7));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); ctx.restore();
}
// 纸：有厚度和投影，上面几条柔和字行
function paper(ctx, x, y, w, h, rot, a, o = {}) {
  if (a <= 0.003) return;
  const { lines = true, glowA = 0.25, tint = [250, 240, 222] } = o;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= a;
  if (glowA > 0) glow(ctx, 0, 0, Math.max(w, h) * 0.9, [255, 214, 160], glowA);
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 12;
  ctx.fillStyle = rgba(mix(tint, [0, 0, 0], 0.15)); ctx.fillRect(-w / 2 + 4, -h / 2 + 5, w, h);
  ctx.shadowColor = 'transparent';
  const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, rgba(tint)); g.addColorStop(1, rgba(mix(tint, [120, 100, 80], 0.18)));
  ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
  if (lines) { ctx.fillStyle = 'rgba(90,80,70,0.26)'; const n = Math.max(3, Math.floor(h / (w * 0.13))); for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.roundRect(-w / 2 + w * 0.12, -h / 2 + h * 0.15 + i * (h * 0.7 / n), w * (i === n - 1 ? 0.45 : 0.74), Math.max(5, w * 0.035), 3); ctx.fill(); } }
  ctx.restore();
}
// 一团慢慢翻滚的雾（情绪、迷雾）
function fog(ctx, x, y, r, t, a, c = [80, 90, 130], seed = 0) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a;
  for (let i = 0; i < 8; i++) {
    const ax = x + Math.sin(t * 0.6 + i * 1.9 + seed) * r * 0.45, ay = y + Math.cos(t * 0.5 + i * 2.3 + seed) * r * 0.3, rr = r * (0.5 + 0.12 * (i % 3));
    const g = ctx.createRadialGradient(ax, ay, 0, ax, ay, rr); g.addColorStop(0, rgba(c, 0.32)); g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ax, ay, rr, 0, 6.283); ctx.fill();
  }
  ctx.restore();
}
// 粒子流：一束有宽度的光点流（二次贝塞尔）
function bz(A, B, C, s) { const u = 1 - s; return [u * u * A[0] + 2 * u * s * C[0] + s * s * B[0], u * u * A[1] + 2 * u * s * C[1] + s * s * B[1]]; }
function stream(ctx, A, B, C, t, c, a, o = {}) {
  if (a <= 0.003) return;
  const { n = 40, w = 30, sp = 0.45, cut = 1 } = o;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  ctx.beginPath(); for (let i = 0; i <= 30; i++) { const p = bz(A, B, C, (i / 30) * cut); i ? ctx.lineTo(...p) : ctx.moveTo(...p); }
  ctx.filter = 'blur(10px)'; for (const [lw, la] of [[w * 2, 0.06], [w, 0.1]]) { ctx.strokeStyle = rgba(c, la * a); ctx.lineWidth = lw; ctx.stroke(); } ctx.filter = 'none';
  for (let i = 0; i < n; i++) { const s = (i / n + t * sp) % 1; if (s > cut) continue; const p = bz(A, B, C, s); glow(ctx, p[0] + Math.sin(i * 12.9 + t * 2) * w * 0.35, p[1] + Math.cos(i * 7.1 + t * 1.6) * w * 0.3, 9 + (i % 4) * 4, c, a * (0.35 + 0.65 * Math.sin(Math.PI * s))); }
  ctx.restore();
}
// 透视地板（木地板/教室地砖）：从地平线 hy 往下，n 条接缝收向消失点
function floor(ctx, hy, c0, c1, o = {}) {
  const { vx = W / 2, n = 14, seam = 0.16, cross = 0 } = o;
  vgrad(ctx, [[0, c0], [1, c1]], hy, H + 200);
  ctx.save(); ctx.beginPath(); ctx.rect(-400, hy, W + 800, H); ctx.clip();
  ctx.fillStyle = `rgba(0,0,0,${seam})`;
  for (let i = -n; i <= n; i++) { const xb = vx + i * 220, xa = vx + (xb - vx) * 0.08; ctx.beginPath(); ctx.moveTo(xa - 1, hy); ctx.lineTo(xa + 1, hy); ctx.lineTo(xb + 5, H + 200); ctx.lineTo(xb - 5, H + 200); ctx.closePath(); ctx.fill(); }
  for (let k = 1; k <= cross; k++) { const y = hy + Math.pow(k / cross, 2) * (H - hy + 200); ctx.fillRect(-400, y, W + 800, 2 + 4 * k / cross); }
  ctx.restore();
  vgrad(ctx, [[0, [0, 0, 0]], [1, [0, 0, 0]]], hy, hy + 1);
  const g = ctx.createLinearGradient(0, hy - 40, 0, hy + 40); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.6, 'rgba(0,0,0,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(-400, hy - 40, W + 800, 80);
}
// 窗：厚窗框 + 窗外（fn 画窗外内容）+ 窗台
function windowFrame(ctx, x, y, w, h, fn, o = {}) {
  const { frame = [22, 22, 30], bars = true } = o;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); fn(ctx); ctx.restore();
  ctx.fillStyle = rgba(frame);
  ctx.fillRect(x - 24, y - 24, w + 48, 24); ctx.fillRect(x - 24, y + h, w + 48, 30); ctx.fillRect(x - 24, y, 24, h); ctx.fillRect(x + w, y, 24, h);
  if (bars) { ctx.fillRect(x + w / 2 - 8, y, 16, h); ctx.fillRect(x, y + h * 0.45 - 8, w, 16); }
  ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(x - 24, y + h, w + 48, 5);
}
// 雨：一层斜着的半透明雨丝（短而粗的柔光条，不是细线）
const RAIN = (() => { const r = mulberry32(77); return Array.from({ length: 120 }, () => ({ x: r(), y: r(), l: 30 + r() * 50, sp: 0.7 + r() * 0.6, a: 0.1 + r() * 0.2 })); })();
function rain(ctx, t, box, a, c = [170, 190, 230]) {
  if (a <= 0.003) return;
  const [x0, y0, x1, y1] = box;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (const d of RAIN) {
    const x = x0 + d.x * (x1 - x0), y = y0 + ((d.y + t * d.sp) % 1) * (y1 - y0);
    const g = ctx.createLinearGradient(x, y, x - d.l * 0.25, y + d.l); g.addColorStop(0, rgba(c, 0)); g.addColorStop(1, rgba(c, d.a * a));
    ctx.strokeStyle = g; ctx.lineWidth = 6; ctx.filter = 'blur(1.5px)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - d.l * 0.25, y + d.l); ctx.stroke();
  }
  ctx.restore();
}
// 有体积的问号（迷雾里的那个人用）
function bigQ(ctx, x, y, s, c, a) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a;
  glow(ctx, x, y, 160 * s, c, 0.35);
  K.text(ctx, '?', x, y + 60 * s, { size: 220 * s, family: 'Latin', weight: 600, color: mix(c, [255, 255, 255], 0.4) });
  ctx.restore();
}
module.exports = { DUMMY, blurLayer, vgrad, beam, pool, shadow, bokeh, mkB, bokehs, mkDust, dust, orb, paper, fog, stream, bz, floor, windowFrame, rain, bigQ };
