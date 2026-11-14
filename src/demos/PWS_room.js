'use strict';
// 场景「她的房间」（PWG3 开头的独处、结尾的雨夜共用）：
//   后墙 + 大窗（窗外夜色城市 / 雨夜）+ 窗帘 + 墙上搁板和画 + 书桌台灯（主光源）+ 床 + 地毯 + 前景虚化的叶子
//   room(ctx, t, C, o)：o.lamp 台灯亮度 0-1、o.rain 雨夜 0-1、o.curtain 窗帘合上 0-1、o.cold 手机冷光漫出来 0-1
const K = require('../core');
const S = require('./PWS_kit');
const { W, H, clamp, lerp, prog, smooth, glow, rgba, mix, mulberry32, hash } = K;
const FY = 1090, WIN = [560, 300, 420, 560], LAMP = [196, 742], HER = [520, 1268];
const PAD = 240;
const SKYLINE = S.lazy(() => S.bake(700, 700, c => {
  const r = mulberry32(12);
  S.vgrad(c, [[0, [10, 14, 44]], [0.55, [40, 44, 104]], [0.85, [120, 90, 140]], [1, [170, 120, 140]]], 0, 700, 0, 700);
  S.stars(c, 3, [0, 0, 700, 380], 40, 0.9);
  for (let L = 0; L < 2; L++) for (let i = 0; i < 16; i++) { const w = 30 + r() * 50, h = (L ? 90 : 170) + r() * (L ? 150 : 200), x = i * 46 + r() * 20 - 20; c.fillStyle = rgba(L ? [22, 24, 60] : [44, 42, 96]); c.fillRect(x, 700 - h, w, h);
    S.add(c, () => { for (let yy = 700 - h + 8; yy < 694; yy += 13) for (let xx = x + 5; xx < x + w - 6; xx += 10) if (r() < 0.32) { c.fillStyle = rgba([255, 206, 140], 0.4 + r() * 0.5); c.fillRect(xx, yy, 5, 6); } }); }
}));
const WALL = S.lazy(() => S.bake(W + PAD * 2, H + PAD, c => {
  c.translate(PAD, PAD / 2); const r = mulberry32(4);
  S.vgrad(c, [[0, [30, 36, 78]], [1, [52, 56, 104]]], -PAD, FY, -PAD, W + PAD);
  // 墙纸：淡淡的竖条
  for (let x = -PAD; x < W + PAD; x += 54) { c.fillStyle = 'rgba(255,255,255,0.018)'; c.fillRect(x, -PAD, 27, FY + PAD); }
  // 踢脚线 + 木地板
  c.fillStyle = 'rgb(26,28,60)'; c.fillRect(-PAD, FY - 26, W + PAD * 2, 26);
  S.vgrad(c, [[0, [86, 66, 84]], [0.4, [60, 46, 70]], [1, [26, 22, 44]]], FY, H + PAD, -PAD, W + PAD);
  for (let i = -8; i <= 20; i++) { const xb = i * 150, xa = 540 + (xb - 540) * 0.55; S.poly(c, [[xa - 1.5, FY], [xa + 1.5, FY], [xb + 5, H + PAD], [xb - 5, H + PAD]], 'rgba(0,0,0,0.2)'); }
  // 地毯
  c.save(); c.translate(520, 1296); c.scale(1, 0.22); const rg = c.createRadialGradient(0, 0, 40, 0, 0, 430); rg.addColorStop(0, 'rgb(150,110,130)'); rg.addColorStop(0.7, 'rgb(104,80,116)'); rg.addColorStop(0.72, 'rgb(190,160,150)'); rg.addColorStop(0.8, 'rgb(104,80,116)'); rg.addColorStop(1, 'rgb(84,64,100)'); c.fillStyle = rg; c.beginPath(); c.arc(0, 0, 430, 0, 6.2832); c.fill(); c.restore();
  // 墙上的画
  for (const [x, y, w, h, c0, c1] of [[120, 196, 150, 190, [240, 180, 150], [90, 120, 170]], [300, 240, 110, 130, [170, 210, 160], [240, 220, 170]]]) { c.fillStyle = 'rgb(28,26,50)'; c.fillRect(x - 8, y - 8, w + 16, h + 16); const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, rgba(c0)); g.addColorStop(1, rgba(c1)); c.fillStyle = g; c.fillRect(x, y, w, h); c.fillStyle = 'rgba(255,250,230,0.8)'; c.beginPath(); c.arc(x + w * 0.62, y + h * 0.36, w * 0.13, 0, 6.2832); c.fill(); }
  // 搁板 + 书 + 垂下来的绿萝
  c.fillStyle = 'rgb(104,76,80)'; c.fillRect(60, 520, 380, 16); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(60, 536, 380, 10);
  let bx = 76; for (let i = 0; i < 11; i++) { const bw = 16 + r() * 16, bh = 70 + r() * 50; c.fillStyle = rgba([[190, 110, 100], [110, 140, 180], [220, 190, 130], [120, 160, 130], [150, 110, 160]][i % 5]); c.fillRect(bx, 520 - bh, bw, bh); c.fillStyle = 'rgba(0,0,0,0.15)'; c.fillRect(bx + bw - 4, 520 - bh, 4, bh); bx += bw + 2; }
  c.fillStyle = 'rgb(190,130,100)'; c.fillRect(360, 476, 56, 44);
  for (let k = 0; k < 16; k++) { const s = k / 15, lx = 388 + Math.sin(k * 1.3) * 26 + s * 20, ly = 470 + s * 200; c.fillStyle = rgba(mix([70, 140, 100], [130, 200, 130], r())); c.beginPath(); c.ellipse(lx, ly, 17, 9, k, 0, 6.2832); c.fill(); }
}));
// 家具（在人后面的那些）：书桌、床
const FURN = S.lazy(() => S.bake(W + PAD * 2, H + PAD, c => {
  c.translate(PAD, PAD / 2);
  // 书桌
  const dg = c.createLinearGradient(0, 900, 0, 940); dg.addColorStop(0, 'rgb(170,124,104)'); dg.addColorStop(1, 'rgb(110,76,76)'); c.fillStyle = dg; c.fillRect(-60, 900, 500, 34);
  c.fillStyle = 'rgb(70,50,64)'; c.fillRect(-40, 934, 26, 250); c.fillRect(396, 934, 26, 250); c.fillStyle = 'rgb(90,64,76)'; c.fillRect(-40, 934, 462, 60);
  // 桌上：一摞书、杯子、笔记本电脑
  [[250, [200, 120, 110]], [262, [120, 150, 190]], [246, [220, 196, 140]]].forEach(([x, col], i) => { c.fillStyle = rgba(col); c.fillRect(x, 876 - i * 24, 150, 24); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(x + 6, 884 - i * 24, 138, 8); });
  c.fillStyle = 'rgb(236,226,214)'; c.beginPath(); c.roundRect(60, 852, 46, 48, 6); c.fill(); c.strokeStyle = 'rgb(236,226,214)'; c.lineWidth = 8; c.beginPath(); c.arc(108, 876, 14, -1.2, 1.2); c.stroke();
  // 台灯：底座、弯臂、灯罩
  c.fillStyle = 'rgb(60,56,84)'; c.beginPath(); c.ellipse(150, 896, 52, 12, 0, 0, 6.2832); c.fill();
  c.strokeStyle = 'rgb(84,80,116)'; c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.moveTo(150, 890); c.quadraticCurveTo(110, 760, 180, 700); c.stroke();
  S.poly(c, [[150, 690], [236, 700], [262, 780], [128, 762]]); const lg = c.createLinearGradient(130, 690, 250, 780); lg.addColorStop(0, 'rgb(110,150,140)'); lg.addColorStop(1, 'rgb(60,96,100)'); c.fillStyle = lg; c.fill();
  // 床
  const bg = c.createLinearGradient(0, 1010, 0, 1330); bg.addColorStop(0, 'rgb(96,150,130)'); bg.addColorStop(1, 'rgb(44,84,90)'); c.fillStyle = bg; c.beginPath(); c.roundRect(700, 1040, 640, 360, 40); c.fill();
  c.fillStyle = 'rgb(232,226,236)'; c.beginPath(); c.roundRect(900, 990, 300, 110, 46); c.fill(); c.fillStyle = 'rgba(0,0,40,0.14)'; c.beginPath(); c.roundRect(900, 1050, 300, 50, 30); c.fill();
  c.fillStyle = 'rgb(84,60,84)'; c.beginPath(); c.roundRect(1040, 820, 300, 300, 30); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.07)'; for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(820 + k * 90, 1120 + k * 30, 120, 26, 0.3, 0, 6.2832); c.fill(); }
}));
const LEAF = S.lazy(() => S.bake(700, 800, c => { const r = mulberry32(9); c.filter = 'blur(9px)'; for (let i = 0; i < 9; i++) { const a = -1.9 + i * 0.3, L = 380 + r() * 260; c.fillStyle = rgba(mix([8, 14, 30], [30, 70, 70], r() * 0.6)); c.save(); c.translate(120, 800); c.rotate(a); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(L * 0.5, -90, L, 0); c.quadraticCurveTo(L * 0.5, 90, 0, 0); c.fill(); c.restore(); } }));
// 玻璃上往下滑的雨滴
function glassRain(ctx, t, x, y, w, h, a) {
  S.add(ctx, () => { for (let i = 0; i < 46; i++) { const sp = 0.05 + hash(i * 3.1) * 0.12, ph = (t * sp + hash(i * 7.7)) % 1, dx = x + hash(i * 1.9) * w + Math.sin(ph * 20 + i) * 3, dy = y + ph * (h + 60) - 30, L = 20 + hash(i * 5.3) * 60;
    const g = ctx.createLinearGradient(0, dy - L, 0, dy); g.addColorStop(0, 'rgba(200,214,255,0)'); g.addColorStop(1, `rgba(200,214,255,${0.5 * a})`); ctx.fillStyle = g; ctx.fillRect(dx - 2, dy - L, 4, L); glow(ctx, dx, dy, 8, [226, 236, 255], 0.9 * a); } });
}
function room(ctx, t, C, o = {}) {
  const { lamp = 1, rain = 0, curtain = 0, cold = 0, moon = 1 } = o;
  ctx.fillStyle = 'rgb(20,22,50)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); S.cam(ctx, C, 1);
  ctx.drawImage(WALL(), -PAD, -PAD / 2);
  // 窗：窗外（视差更远一点）
  const [wx, wy, ww, wh] = WIN;
  ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
  const px = (C.x || 0) * 0.35;
  ctx.drawImage(SKYLINE(), wx - 140 + px, wy - 100, 700, 700);
  if (moon > 0.01) S.moon(ctx, wx + 300 + px, wy + 130, 44, t, [246, 240, 222], moon * (1 - 0.8 * rain));
  if (rain > 0.01) { ctx.fillStyle = `rgba(16,22,52,${0.55 * rain})`; ctx.fillRect(wx, wy, ww, wh); S.add(ctx, () => { for (let k = 0; k < 7; k++) glow(ctx, wx + 40 + k * 60 + Math.sin(k * 2.2) * 20, wy + 380 + (k % 3) * 50, 70, k % 2 ? [255, 190, 120] : [150, 190, 255], 0.3 * rain); });
    ctx.save(); ctx.translate(wx, wy); S.rain(ctx, t, { box: [-40, -60, ww + 40, wh + 60], a: 0.8 * rain, n: 60, seed: 3 }); ctx.restore(); glassRain(ctx, t, wx, wy, ww, wh, rain); }
  ctx.restore();
  // 窗框
  ctx.fillStyle = 'rgb(200,196,214)'; ctx.fillRect(wx - 18, wy - 18, ww + 36, 18); ctx.fillRect(wx - 18, wy, 18, wh); ctx.fillRect(wx + ww, wy, 18, wh); ctx.fillRect(wx + ww / 2 - 7, wy, 14, wh); ctx.fillRect(wx, wy + wh * 0.42, ww, 12);
  ctx.fillStyle = 'rgb(222,218,232)'; ctx.fillRect(wx - 34, wy + wh, ww + 68, 26); ctx.fillStyle = 'rgba(0,0,30,0.3)'; ctx.fillRect(wx - 34, wy + wh + 26, ww + 68, 12);
  // 窗帘：两幅，curtain=1 时合上
  for (const sd of [-1, 1]) { const cw = lerp(96, ww / 2 + 30, curtain), x0 = sd < 0 ? wx - 50 : wx + ww + 50 - cw; const n = 6;
    for (let k = 0; k < n; k++) { const fx = x0 + (k / n) * cw, fw = cw / n + 1, g = ctx.createLinearGradient(fx, 0, fx + fw, 0); g.addColorStop(0, 'rgb(150,96,130)'); g.addColorStop(0.5, 'rgb(196,140,160)'); g.addColorStop(1, 'rgb(116,70,110)'); ctx.fillStyle = g; ctx.fillRect(fx, wy - 40, fw, wh + 150 + Math.sin(k * 2 + t * 0.6) * 4); } }
  ctx.fillStyle = 'rgb(110,84,90)'; ctx.fillRect(wx - 80, wy - 56, ww + 160, 18);
  // 月光从窗里斜着落到地上（不下雨时）
  if (moon * (1 - rain) * (1 - curtain) > 0.02) S.add(ctx, () => { const a = 0.16 * moon * (1 - rain) * (1 - curtain); const g = ctx.createLinearGradient(wx, wy + wh, wx - 200, 1400); g.addColorStop(0, `rgba(170,190,255,${a})`); g.addColorStop(1, 'rgba(170,190,255,0)'); ctx.fillStyle = g; ctx.filter = 'blur(16px)'; S.poly(ctx, [[wx, wy + wh], [wx + ww, wy + wh], [wx + ww - 260, 1420], [wx - 330, 1420]]); ctx.fill(); ctx.filter = 'none'; });
  ctx.drawImage(FURN(), -PAD, -PAD / 2);
  // 台灯的光：灯罩下的亮口、墙上的光晕、桌面的光池（缓慢呼吸）
  const lk = lamp * (1 + 0.03 * Math.sin(t * 0.9));
  S.add(ctx, () => { glow(ctx, LAMP[0], LAMP[1] + 30, 620, [255, 190, 110], 0.3 * lk); glow(ctx, LAMP[0], LAMP[1] + 40, 170, [255, 220, 160], 0.3 * lk); S.rgrad(ctx, 200, 900, 330, [[0, [255, 214, 150], 0.5 * lk], [1, [255, 214, 150], 0]], 0.18); S.rgrad(ctx, 420, 1280, 560, [[0, [255, 196, 130], 0.2 * lk], [1, [255, 196, 130], 0]], 0.22); });
  // 整体压暗（灯暗 / 雨夜）+ 冷光
  const dk = (1 - lamp) * 0.5 + rain * 0.12;
  if (dk > 0.01) { ctx.fillStyle = `rgba(8,10,34,${dk})`; ctx.fillRect(-PAD, -PAD, W + PAD * 2, H + PAD * 2); }
  ctx.restore();
}
function front(ctx, t, C, a = 1) { if (a <= 0.003) return; ctx.save(); S.cam(ctx, C, 1.5); ctx.globalAlpha = a; ctx.translate(-260, 1040); ctx.rotate(Math.sin(t * 0.5) * 0.02); ctx.drawImage(LEAF(), 0, 0); ctx.restore(); }
module.exports = { room, front, FY, WIN, LAMP, HER, PAD };
