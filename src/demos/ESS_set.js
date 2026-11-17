'use strict';
// 《ESFJ》v9 室内构件：墙、透视木地板、窗（窗外 + 斜进来的光柱 + 浮尘）、踢脚线、吊灯、搁板、挂画、绿植
//   都按「世界坐标 = 1080 宽画面、地平线 FY」来画，外面用 S.cam 包相机
const K = require('../core');
const S = require('./ESS_kit');
const { W, H, clamp, lerp, mix, rgba, hash, mulberry32 } = K;
const glow = S.glow;
const PAD = 300;
// 墙 + 地板（预渲用）
function walls(c, o = {}) {
  const { FY = 1060, wall = [150, 110, 96], wall2 = [96, 66, 64], floor = [150, 100, 72], floor2 = [60, 38, 34], stripe = 0.025, base = [70, 46, 44], x0 = -PAD, x1 = W + PAD, top = -PAD } = o;
  S.vgrad(c, [[0, wall2], [1, wall]], top, FY, x0, x1);
  if (stripe) for (let x = x0; x < x1; x += 60) { c.fillStyle = `rgba(255,240,220,${stripe})`; c.fillRect(x, top, 30, FY - top); }
  c.fillStyle = rgba(base); c.fillRect(x0, FY - 24, x1 - x0, 24);
  S.vgrad(c, [[0, floor], [0.45, mix(floor, floor2, 0.5)], [1, floor2]], FY, H + PAD, x0, x1);
  for (let i = -10; i <= 22; i++) { const xb = i * 140, xa = 540 + (xb - 540) * 0.45; S.poly(c, [[xa - 1.5, FY], [xa + 1.5, FY], [xb + 5, H + PAD], [xb - 5, H + PAD]], 'rgba(30,10,10,0.18)'); }
  for (let k = 1; k < 7; k++) { const y = FY + Math.pow(k / 7, 1.8) * (H + PAD - FY); c.fillStyle = 'rgba(30,10,10,0.08)'; c.fillRect(x0, y, x1 - x0, 3); }
}
// 窗：o.sky(c, x, y, w, h) 画窗外；带窗框、十字窗棂、窗台
function window(c, x, y, w, h, o = {}) {
  const { frame = [236, 226, 214], sky = null, sill = true, curtain = [214, 130, 120] } = o;
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); if (sky) sky(c, x, y, w, h); c.restore();
  c.fillStyle = rgba(frame); c.fillRect(x - 18, y - 18, w + 36, 18); c.fillRect(x - 18, y, 18, h); c.fillRect(x + w, y, 18, h); c.fillRect(x + w / 2 - 6, y, 12, h); c.fillRect(x, y + h * 0.42, w, 10);
  if (sill) { c.fillRect(x - 34, y + h, w + 68, 22); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x - 34, y + h + 22, w + 68, 10); }
  if (curtain) for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) { const fx = (sd < 0 ? x - 76 : x + w - 12) + k * 22, g = c.createLinearGradient(fx, 0, fx + 23, 0); g.addColorStop(0, rgba(mix(curtain, [40, 20, 30], 0.3))); g.addColorStop(0.5, rgba(curtain)); g.addColorStop(1, rgba(mix(curtain, [40, 20, 30], 0.4))); c.fillStyle = g; c.fillRect(fx, y - 50, 23, h + 170); }
}
// 斜进来的光柱（预渲一张，按需贴）
function beamImg(w, h, c0 = [255, 220, 160], a = 0.5) { return S.bake(w, h, c => { c.filter = 'blur(26px)'; const g = c.createLinearGradient(0, 0, w * 0.7, h); g.addColorStop(0, rgba(c0, a)); g.addColorStop(1, rgba(c0, 0)); c.fillStyle = g; S.poly(c, [[w * 0.08, 30], [w * 0.36, 30], [w * 0.96, h - 30], [w * 0.4, h - 30]]); c.fill(); }); }
// 光里的浮尘（确定性，不闪）
function motes(ctx, t, box, c = [255, 226, 170], a = 0.6, n = 18, seed = 1) {
  S.add(ctx, () => { for (let k = 0; k < n; k++) { const h1 = hash(k * 3.1 + seed), h2 = hash(k * 7.7 + seed), x = box[0] + h1 * (box[2] - box[0]) + Math.sin(t * 0.3 + k) * 30, y = box[1] + ((h2 + t * 0.012 * (0.5 + h1)) % 1) * (box[3] - box[1]); glow(ctx, x, y, 7 + h2 * 8, c, 0.5 * a * (0.4 + 0.6 * h1)); } });
}
// 吊灯：灯罩 + 光晕（缓慢呼吸，k 亮度）
function pendant(ctx, x, y, t, o = {}) {
  const { k = 1, c = [255, 200, 130], shade = [60, 110, 110], len = 400, w = 90 } = o;
  ctx.fillStyle = 'rgb(40,30,36)'; ctx.fillRect(x - 2.5, y - len, 5, len);
  S.poly(ctx, [[x - w * 0.3, y - w * 0.32], [x + w * 0.3, y - w * 0.32], [x + w, y + w * 0.36], [x - w, y + w * 0.36]], rgba(shade));
  const br = 1 + 0.03 * Math.sin(t * 0.8);
  S.add(ctx, () => { glow(ctx, x, y + w * 0.5, 820 * br, c, 0.22 * k); glow(ctx, x, y + w * 0.4, w * 1.3, mix(c, [255, 255, 255], 0.3), 0.32 * k); });
  // 灯罩下沿的灯口（暖色，不是一团白）
  ctx.fillStyle = rgba(mix([90, 70, 60], [255, 226, 180], k)); ctx.beginPath(); ctx.ellipse(x, y + w * 0.36, w * 0.92, w * 0.12, 0, 0, 6.2832); ctx.fill();
}
// 搁板 + 书/罐子
function shelf(c, x, y, w, seed = 3, o = {}) {
  const r = mulberry32(seed), { jars = false } = o;
  c.fillStyle = 'rgb(110,74,60)'; c.fillRect(x, y, w, 14); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x, y + 14, w, 10);
  let bx = x + 10; while (bx < x + w - 30) {
    if (jars) { const jw = 34 + r() * 20, jh = 50 + r() * 40; const g = c.createLinearGradient(bx, 0, bx + jw, 0); g.addColorStop(0, 'rgba(230,240,240,0.5)'); g.addColorStop(0.4, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(200,210,210,0.5)'); c.fillStyle = g; c.beginPath(); c.roundRect(bx, y - jh, jw, jh, 8); c.fill(); c.fillStyle = rgba([[230, 160, 80], [200, 90, 60], [240, 220, 150], [150, 110, 80]][(r() * 4) | 0]); c.fillRect(bx + 4, y - jh * 0.6, jw - 8, jh * 0.6 - 3); c.fillStyle = 'rgb(120,80,60)'; c.fillRect(bx - 2, y - jh - 8, jw + 4, 10); bx += jw + 10; }
    else { const bw = 18 + r() * 16, bh = 64 + r() * 46, col = [[184, 96, 84], [90, 126, 166], [206, 170, 110], [100, 146, 120], [140, 96, 140], [220, 210, 190]][(r() * 6) | 0], lean = r() < 0.12 ? 0.18 : 0;
      c.save(); c.translate(bx, y); c.rotate(lean); const bg = c.createLinearGradient(0, 0, bw, 0); bg.addColorStop(0, rgba(mix(col, [255, 255, 255], 0.18))); bg.addColorStop(0.6, rgba(col)); bg.addColorStop(1, rgba(mix(col, [0, 0, 0], 0.35))); c.fillStyle = bg; c.beginPath(); c.roundRect(0, -bh, bw, bh, [4, 4, 0, 0]); c.fill();
      c.fillStyle = 'rgba(255,236,190,0.55)'; c.fillRect(2, -bh + 10, bw - 4, 3); c.fillRect(2, -16, bw - 4, 3); c.fillStyle = 'rgba(255,236,190,0.35)'; c.fillRect(bw * 0.3, -bh * 0.62, bw * 0.4, bh * 0.22); c.restore(); bx += bw + (lean ? 12 : 2); if (r() < 0.12) { plantPot(c, bx + 26, y, r); bx += 64; } }
  }
}
function plant(c, x, y, s = 1, seed = 5) {
  const r = mulberry32(seed); c.save(); c.translate(x, y); c.scale(s, s);
  S.poly(c, [[-60, -110], [60, -110], [46, 0], [-46, 0]]); const g = c.createLinearGradient(-60, 0, 60, 0); g.addColorStop(0, 'rgb(230,170,130)'); g.addColorStop(1, 'rgb(150,90,80)'); c.fillStyle = g; c.fill();
  for (let k = 0; k < 11; k++) { const a = -2.7 + k * 0.4 + (r() - 0.5) * 0.2, L = 140 + r() * 150; c.save(); c.translate(0, -110); c.rotate(a + 1.57); const lg = c.createLinearGradient(-40, 0, 40, 0); lg.addColorStop(0, 'rgb(40,110,90)'); lg.addColorStop(0.5, 'rgb(100,180,120)'); lg.addColorStop(1, 'rgb(36,90,84)'); c.fillStyle = lg; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-46, -L * 0.5, 0, -L); c.quadraticCurveTo(46, -L * 0.5, 0, 0); c.fill(); c.restore(); }
  c.restore();
}
function plantPot(c, x, y, r) { c.fillStyle = 'rgb(190,120,90)'; c.beginPath(); c.moveTo(x - 20, y - 40); c.lineTo(x + 20, y - 40); c.lineTo(x + 15, y); c.lineTo(x - 15, y); c.fill(); for (let k = 0; k < 6; k++) { c.save(); c.translate(x, y - 40); c.rotate(-1.2 + k * 0.48); c.fillStyle = k % 2 ? 'rgb(70,140,100)' : 'rgb(100,170,120)'; c.beginPath(); c.ellipse(0, -26, 9, 26, 0, 0, 6.2832); c.fill(); c.restore(); } }
// 墙上的画：金色画框 + 白卡纸 + 一幅小风景（天色渐变、远山、太阳），不再是纯色块
function frame(c, x, y, w, h, seed = 1) {
  const r = mulberry32(seed), pal = [[[250, 206, 160], [236, 140, 120], [150, 90, 110]], [[170, 210, 236], [120, 170, 200], [70, 110, 140]], [[236, 206, 230], [190, 150, 200], [110, 80, 130]]][seed % 3];
  c.save(); c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = 14; c.shadowOffsetY = 6;
  const fg = c.createLinearGradient(x - 12, y - 12, x + w + 12, y + h + 12); fg.addColorStop(0, 'rgb(220,180,110)'); fg.addColorStop(0.5, 'rgb(150,104,56)'); fg.addColorStop(1, 'rgb(200,160,96)'); c.fillStyle = fg; c.fillRect(x - 12, y - 12, w + 24, h + 24); c.restore();
  c.fillStyle = 'rgb(244,236,220)'; c.fillRect(x, y, w, h); const m = Math.min(w, h) * 0.12, ix = x + m, iy = y + m, iw = w - 2 * m, ih = h - 2 * m;
  const g = c.createLinearGradient(0, iy, 0, iy + ih); g.addColorStop(0, rgba(pal[0])); g.addColorStop(1, rgba(pal[1])); c.fillStyle = g; c.fillRect(ix, iy, iw, ih);
  c.save(); c.beginPath(); c.rect(ix, iy, iw, ih); c.clip(); c.fillStyle = 'rgba(255,250,230,0.85)'; c.beginPath(); c.arc(ix + iw * (0.3 + r() * 0.4), iy + ih * 0.38, iw * 0.11, 0, 6.2832); c.fill();
  for (let L = 0; L < 2; L++) { c.fillStyle = rgba(mix(pal[2], pal[1], L ? 0 : 0.45)); c.beginPath(); c.moveTo(ix, iy + ih); for (let k = 0; k <= 6; k++) c.lineTo(ix + k * iw / 6, iy + ih * (L ? 0.72 : 0.58) + Math.sin(k * 1.7 + seed + L) * ih * 0.08); c.lineTo(ix + iw, iy + ih); c.fill(); }
  c.restore(); c.strokeStyle = 'rgba(120,90,60,0.35)'; c.lineWidth = 2; c.strokeRect(ix, iy, iw, ih);
}
// 前景虚化的叶子 / 椅背（预渲）
const FGLEAF = S.lazy(() => S.bake(700, 800, c => { const r = mulberry32(9); c.filter = 'blur(10px)'; for (let i = 0; i < 9; i++) { const a = -1.9 + i * 0.3, L = 380 + r() * 260; c.fillStyle = rgba(mix([14, 10, 18], [40, 60, 60], r() * 0.6)); c.save(); c.translate(120, 800); c.rotate(a); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(L * 0.5, -90, L, 0); c.quadraticCurveTo(L * 0.5, 90, 0, 0); c.fill(); c.restore(); } }));
module.exports = { PAD, walls, window, beamImg, motes, pendant, shelf, plant, frame, FGLEAF };
