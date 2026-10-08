// 最后的副歌 + 尾奏（159.2 秒–结束，全片最后一个高潮）
//  筛子上留下的那一小群金色的人，在灰色的人的宇宙里一起往前飞；
//  "一起往前走就好了"落下后，他们汇成一个旋转的金色星系（全片最亮的画面，对着歌的最高点）；
//  镜头一路拉远：在八千个灰点里，金色只是很小的一簇——"你永远都只能成为少部分人心中的高级"。最后：欢迎来到现实世界
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeInOut, easeOutExpo, glow, hash, noise1, mulberry32 } = K;
const A = require('../audio');
const U = require('../universe');
const T = require('../textfx');
const { you } = require('./common');

const T0 = A.beatT(368), TG = A.beatT(425), TP = A.beatT(450), TO = A.beatT(464), T1 = A.DUR + 1;
// 金色的人：随机选一部分"认同"的人
const GOLD = U.PTS.map((p, i) => i).filter(i => U.PTS[i].react === 1 || (U.PTS[i].react === 0 && U.PTS[i].ord < 0.07));
const GSET = new Map(GOLD.map((i, k) => [i, k]));
const OFF = (() => { const r = mulberry32(9); return GOLD.map(() => [U.gauss(r) * 260, U.gauss(r) * 160, U.gauss(r) * 260]); })();
const SPD = 150, Z0 = -2000;
const center = t => [0, 0, Z0 + Math.min(t, TG) * 0 + (Math.min(t, TG) - T0) * SPD];

function goldPos(k, t) {
  const c = center(t);
  const o = OFF[k], ph = k * 0.37;
  const fl = [o[0] + 60 * noise1(t * 0.4 + ph, 1), o[1] + 40 * noise1(t * 0.5 + ph, 2), o[2] + 60 * noise1(t * 0.45 + ph, 3)];
  const g = easeInOut(prog(t, TG, TG + 5));
  if (g <= 0) return [c[0] + fl[0], c[1] + fl[1], c[2] + fl[2]];
  // 金色星系：两条旋臂的盘
  const rr = 60 + Math.pow(hash(k * 3.1), 0.7) * 1100, arm = k % 2;
  const ang = rr * 0.005 + arm * Math.PI + (hash(k * 7.7) - 0.5) * 0.6 + (t - TG) * 0.22;
  const s = [Math.cos(ang) * rr, (hash(k * 5.3) - 0.5) * 70, Math.sin(ang) * rr];
  return [c[0] + lerp(fl[0], s[0], g), c[1] + lerp(fl[1], s[1], g), c[2] + lerp(fl[2], s[2], g)];
}

function cam(t) {
  const c = center(t);
  const g = easeInOut(prog(t, TG, TG + 6));
  const back = easeInOut(prog(t, TP, TO + 2));
  const dist = lerp(lerp(1500, 2600, g), 11000, back);
  const az = 0.3 + 0.08 * (t - T0) + 0.6 * g;
  const el = lerp(0.12, 0.62, g) - 0.25 * back;
  return U.orbit(dist, az, el, 900, c);
}

function draw(ctx, t) {
  const P = cam(t);
  const g = easeInOut(prog(t, TG, TG + 5));
  const out = smooth(prog(t, TO + 1.2, TO + 3.6));
  const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.75);
  bg.addColorStop(0, rgba(mix([12, 12, 18], [26, 20, 10], 0.6 * g))); bg.addColorStop(1, 'rgb(4,4,7)');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const back = easeInOut(prog(t, TP, TO + 2));
  const goldPts = [];
  U.draw(ctx, t, P, {
    fogFar: lerp(9000, 22000, easeInOut(prog(t, TP, TO + 2))), nebula: 0.8, focus: lerp(1500, 2600, g), aperture: 0.6 * (1 - smooth(prog(t, TP, TP + 3))), links: 0.6, alpha: 1 - out,
    map: (pt, i) => {
      const k = GSET.get(i);
      if (k === undefined) return { a: 0.55 + 0.6 * back };
      const p = goldPos(k, t);
      goldPts.push(p);
      return { p, col: C.gold, a: 1.4 - 1.05 * back, s: 1.15 - 0.4 * back };
    },
  });
  // 金色的人之间的连线
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 0.9;
  ctx.strokeStyle = rgba(C.gold, 0.16 * (1 - out) * (1 - 0.85 * back)); ctx.beginPath();
  const SP = goldPts.map(p => P(p));
  for (let k = 0; k < SP.length; k++) {
    const a = SP[k], b = SP[(k * 7 + 3) % SP.length], c = SP[(k + 1) % SP.length];
    if (!a) continue;
    for (const q of [b, c]) if (q && Math.hypot(a[0] - q[0], a[1] - q[1]) < 140) { ctx.moveTo(a[0], a[1]); ctx.lineTo(q[0], q[1]); }
  }
  ctx.stroke(); ctx.restore();
  // 星系中心的光
  const cc = P(center(t));
  if (cc) {
    glow(ctx, cc[0], cc[1], 500 * g * cc[2] * 2.5 + 40, C.gold, (0.15 + 0.35 * g) * (1 - out) * (1 - 0.7 * back));
    you(ctx, cc[0], cc[1], 1 - out, 5);
  }

  // —— 文案 ——
  const lines = [
    ['愿意跟你一起活在真实世界的，', A.beatT(370), { '真实世界': C.gold }],
    ['不抱怨的，不后悔的，', A.beatT(382), {}],
    ['直视真相、不当鸵鸟的，', A.beatT(392), { '直视真相': C.gold }],
    ['了解悲观之后，依旧乐观的人——', A.beatT(402), { '依旧乐观': C.gold }],
  ];
  lines.forEach(([s, t0, hl], i) => {
    const nx = i < 3 ? lines[i + 1][1] - 0.3 : A.beatT(420);
    T.decode(ctx, t, s, { t0, y: H - 170, size: 46, cps: 13, out: nx, hl });
  });
  T.particleText(ctx, t, '一起往前走就好了。', { t0: A.beatT(421), y: H / 2 - 260, size: 86, color: C.gold, dur: 1.5, out: TP + 1.5, from: (i, r) => { const q = SP[Math.floor(r() * SP.length)]; return q ? [q[0], q[1]] : [W / 2, H / 2]; }, en: 'Then just walk on, together.' });
  T.decode(ctx, t, '你永远都只能成为', { t0: TP + 2, y: 200, size: 46, cps: 10, out: TO + 0.6 });
  T.slam(ctx, t, '少部分人心中的高级。', { t0: TP + 3.4, y: 300, size: 64, hl: { '少部分人': C.gold }, out: TO + 0.6 });
  T.decode(ctx, t, '欢迎来到现实世界。', { t0: TO + 0.9, y: H / 2 + 20, size: 64, cps: 7, en: 'Welcome to the real world.' });
}
module.exports = { draw, t0: T0, t1: T1 };
