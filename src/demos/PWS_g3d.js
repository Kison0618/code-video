'use strict';
// PWG3 第四幕「雨夜的房间」：C211–C214（全片情绪最重的一段，节奏放慢，留静场）
//   还是她的房间：C211 说到「灰暗的灯光」台灯暗下去一大半，说到「小雨」窗外下起雨，雨滴顺着玻璃往下滑，窗外的城市灯火糊成一片
//   C212 她低头看手机：前景一只大手机，微信列表里只有「订阅号消息」「文件传输助手」，中间一行「没有新消息」；屏幕的冷光打在她脸上
//   C213 溢出屏幕的孤独：冷蓝的光真的从屏幕里漫出来，像水一样从地板往上涨，把暖色的房间一点点淹成蓝的；
//        「离世感」—— 镜头一直往后退，整个房间缩成黑夜大雨里漂着的一只小小的亮盒子
//   C214 内耗个把小时：亮盒子后面是一轮巨大的钟，指针转过一个多小时；那些念头纸又飘了出来，绕着盒子转
const X = require('./pwk');
const { infp } = require('./pf');
const S = require('./PWS_kit');
const RM = require('./PWS_room');
const { K, GOLD, LIME, PINK, BLUE, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, rgba, mix, hash, mulberry32 } = K;
const glow = S.glow;

const T = { in: vs('C211') - 1.0, c211: vs('C211'), dim: at('C211', '灰暗'), rain: at('C211', '小雨'), c212: vs('C212'), empty: at('C212', '空无'), c213: vs('C213'), spill: at('C213', '溢出'), away: at('C213', '离世'), c214: vs('C214'), hour: at('C214', '个把'), end: ve('C214') + 0.6 };
const CAM = [[T.in, { x: 0, y: 0, z: 1.0, ax: 540, ay: 1000 }], [T.c212 - 0.2, { x: 30, y: -10, z: 1.12 }], [T.c212 + 0.8, { x: -70, y: 30, z: 1.3 }], [T.spill, { x: -70, y: 30, z: 1.36 }], [T.away - 0.2, { x: -40, y: 20, z: 1.2 }], [T.away + 1.5, { x: 0, y: -70, z: 0.42 }], [T.end, { x: 0, y: -70, z: 0.38 }]];
const BOX = [-70, 150, 1220, 1360];
const COLD = [110, 190, 255];
function phone(ctx, x, y, s, rot, a, t, spill) {
  if (a <= 0.003) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= a;
  S.add(ctx, () => glow(ctx, 0, 0, 620, COLD, 0.3 + 0.3 * spill));
  ctx.shadowColor = 'rgba(0,0,20,0.6)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20;
  const bg = ctx.createLinearGradient(-190, 0, 190, 0); bg.addColorStop(0, 'rgb(50,54,80)'); bg.addColorStop(1, 'rgb(16,18,36)'); ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(-190, -390, 380, 780, 54); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); ctx.beginPath(); ctx.roundRect(-172, -372, 344, 744, 40); ctx.clip();
  const sg = ctx.createLinearGradient(0, -372, 0, 372); sg.addColorStop(0, 'rgb(236,242,250)'); sg.addColorStop(1, 'rgb(206,220,240)'); ctx.fillStyle = sg; ctx.fillRect(-172, -372, 344, 744);
  ctx.fillStyle = 'rgb(226,232,242)'; ctx.fillRect(-172, -372, 344, 104); K.text(ctx, '微信', 0, -296, { size: 36, weight: 500, color: [40, 44, 60] });
  [['订阅号消息', '周一', [110, 150, 220]], ['文件传输助手', '上周', [90, 190, 130]]].forEach(([n, d, c], i) => { const yy = -230 + i * 104; ctx.fillStyle = rgba(c, 0.55); ctx.beginPath(); ctx.roundRect(-150, yy, 64, 64, 12); ctx.fill(); K.text(ctx, n, -70, yy + 30, { size: 27, weight: 500, color: [110, 116, 130], align: 'left' }); K.text(ctx, d, 152, yy + 26, { size: 20, color: [160, 166, 180], align: 'right' }); ctx.fillStyle = 'rgba(0,0,30,0.07)'; ctx.fillRect(-150, yy + 84, 300, 2); });
  // 空的地方：一个灰色的空气泡 + 「没有新消息」
  ctx.fillStyle = 'rgba(150,160,184,0.5)'; ctx.beginPath(); ctx.roundRect(-56, 60, 112, 78, 22); ctx.fill(); S.poly(ctx, [[-20, 136], [6, 136], [-26, 166]], 'rgba(150,160,184,0.5)');
  K.text(ctx, '没有新消息', 0, 220, { size: 32, weight: 500, color: [130, 138, 160], spacing: 0.08 });
  ctx.restore();
  ctx.restore();
}
const NOTES = ['他是不是生气了？', '是我说错了吗', '要不要先开口', '算了', '如果当时……', '他会不会不理我了'];
function note(ctx, x, y, s, rot, a, txt) {
  if (a <= 0.003) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= a;
  ctx.shadowColor = 'rgba(0,0,20,0.5)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8; const g = ctx.createLinearGradient(-130, -80, 130, 80); g.addColorStop(0, 'rgb(240,246,255)'); g.addColorStop(1, 'rgb(190,204,230)'); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-130, -70, 260, 140, 8); ctx.fill(); ctx.shadowColor = 'transparent';
  K.text(ctx, txt, 0, 14, { size: 32, weight: 500, color: [56, 62, 90] }); ctx.restore();
}
function draw(ctx, t) {
  const C = S.camKF(t, CAM);
  const lampK = lerp(0.95, 0.3, smooth(prog(t, T.dim - 0.3, T.dim + 0.9))), rain = smooth(prog(t, T.rain - 0.4, T.rain + 0.9)), ph = smooth(prog(t, T.c212 - 0.3, T.c212 + 0.5)), spill = smooth(prog(t, T.spill - 1.2, T.away + 0.3)), away = smooth(prog(t, T.away - 0.1, T.away + 1.5));
  // 外面：黑夜、大雨、一轮巨大的钟
  S.vgrad(ctx, [[0, [3, 5, 16]], [0.6, [8, 14, 36]], [1, [4, 6, 18]]], 0, H, 0, W);
  if (away > 0.01) {
    const cu = smooth(prog(t, T.away + 0.5, T.c214)), cx = 540, cy = 850, R0 = 500, tm = easeInOut(prog(t, T.c214 - 0.2, T.end - 0.3)) * 1.35;
    S.add(ctx, () => { glow(ctx, cx, cy, 1100, [70, 100, 180], 0.22 * cu); S.ring(ctx, cx, cy, R0, 30, [150, 180, 240], 0.3 * cu); });
    ctx.save(); ctx.globalAlpha = 0.5 * cu; ctx.translate(cx, cy);
    for (let k = 0; k < 12; k++) { ctx.save(); ctx.rotate(k * Math.PI / 6); ctx.fillStyle = 'rgb(150,180,240)'; ctx.beginPath(); ctx.roundRect(-9, -R0 + 40, 18, k % 3 ? 44 : 84, 9); ctx.fill(); ctx.restore(); }
    const hand = (ang, len, w, c) => { ctx.save(); ctx.rotate(ang); ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(-w / 2, -len, w, len + 40, w / 2); ctx.fill(); ctx.restore(); };
    hand((11 + tm) / 12 * 6.2832, R0 * 0.5, 30, 'rgb(170,196,250)'); hand(tm * 6.2832, R0 * 0.8, 18, 'rgb(214,228,255)');
    ctx.restore();
    S.rain(ctx, t, { a: 0.6 * away, n: 80, seed: 9 });
  }
  // 房间（退远以后裁成一只盒子）
  ctx.save();
  if (away > 0.01) { ctx.save(); S.cam(ctx, C, 1); S.add(ctx, () => glow(ctx, 575, 760, 1500, [255, 190, 120], 0.16 * away)); ctx.fillStyle = 'rgb(30,34,66)'; ctx.beginPath(); ctx.roundRect(BOX[0] - 26, BOX[1] - 26, BOX[2] - BOX[0] + 52, BOX[3] - BOX[1] + 52, 40); ctx.fill(); ctx.beginPath(); ctx.roundRect(BOX[0], BOX[1], BOX[2] - BOX[0], BOX[3] - BOX[1], 26); ctx.restore();
    const m = new (require('skia-canvas').Path2D)(); const p0 = S.w2s(C, BOX[0], BOX[1]), p1 = S.w2s(C, BOX[2], BOX[3]); m.roundRect(p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1], 26 * C.z); ctx.clip(m); }
  RM.room(ctx, t, C, { lamp: lampK * (1 - 0.5 * spill), rain, curtain: 0, moon: 1 });
  ctx.save(); S.cam(ctx, C, 1);
  const hx = 430, hy = RM.HER[1];
  const o = { t, wind: false, eyes: ph > 0.5 ? 'sad' : 'open', mouth: 'flat', tilt: 0.5 * ph + 0.2 * spill, look: ph > 0.3 ? [1, 1.6] : [1.5, -0.6], la: -0.5 * ph, ra: -0.3 * ph, dim: 0.3 * spill, lean: 0.03 * spill };
  ctx.save(); ctx.globalAlpha = 0.4; S.rgrad(ctx, hx + 50, hy + 6, 210, [[0, [10, 8, 30], 0.9], [1, [10, 8, 30], 0]], 0.16); ctx.restore();
  const R = S.lit(ctx, c => infp(c, hx, hy, 1.0, o), ph > 0.4 ? { light: [hx + 300, hy - 200], at: [hx, hy - 290], r: 340, warm: [150, 214, 255], cool: [10, 10, 40], k: 1.2 } : { light: RM.LAMP, at: [hx, hy - 290], r: 340, warm: [255, 214, 150], cool: [14, 16, 50], k: 1.1 });
  // 她手里的小手机（屏幕的冷光）
  if (ph > 0.01) { const px = R.rh[0] + 20, py = R.rh[1] - 20; ctx.save(); ctx.translate(px, py); ctx.rotate(0.3); ctx.fillStyle = 'rgb(30,34,56)'; ctx.beginPath(); ctx.roundRect(-22, -40, 44, 80, 8); ctx.fill(); ctx.fillStyle = `rgba(214,236,255,${ph})`; ctx.beginPath(); ctx.roundRect(-18, -36, 36, 72, 6); ctx.fill(); ctx.restore(); S.add(ctx, () => { glow(ctx, px, py, 260 + 300 * spill, COLD, 0.4 * ph); }); }
  // 冷光漫出来：从地板往上涨的蓝
  if (spill > 0.01) { const lv = lerp(1500, 420, spill);
    const g = ctx.createLinearGradient(0, lv - 420, 0, lv + 300); g.addColorStop(0, rgba(COLD, 0)); g.addColorStop(1, rgba([40, 110, 220], 0.5 * spill)); ctx.fillStyle = g; ctx.fillRect(-300, lv - 420, 1700, 2100);
    S.add(ctx, () => { for (let k = 0; k < 9; k++) S.rgrad(ctx, -100 + k * 170 + Math.sin(t * 0.5 + k * 1.7) * 60, lv + Math.sin(t * 0.8 + k) * 20, 300, [[0, COLD, 0.07 * spill], [1, COLD, 0]], 0.5); }); }
  ctx.restore();
  RM.front(ctx, t, C, 1 - away);
  ctx.restore();
  // 念头纸又飘出来，绕着盒子转
  const nu = prog(t, T.c214 - 0.5, T.end); if (nu > 0) NOTES.forEach((s, i) => { const u = prog(nu, i * 0.1, i * 0.1 + 0.35), a = t * 0.35 + i * 1.05, e = easeOut(u); note(ctx, 540 + Math.cos(a) * 400 * e, 900 + Math.sin(a) * 430 * e - 60, 0.5 + 0.55 * e, Math.sin(a * 2) * 0.2, smooth(u) * 0.95, s); });
  // 前景的大手机：从下面滑上来；光溢出来以后往下退
  const pa = ph * (1 - smooth(prog(t, T.away - 0.4, T.away + 0.3)));
  if (pa > 0.01) phone(ctx, 780 + (1 - easeOut(ph)) * 60, 820 + (1 - easeOut(ph)) * 700 + smooth(prog(t, T.away - 0.4, T.away + 0.3)) * 500, 1.02, -0.07 + Math.sin(t * 0.7) * 0.01, pa, t, spill);
  return { C };
}
function over() {}
module.exports = { draw, over, T };
