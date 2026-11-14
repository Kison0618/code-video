'use strict';
// PWG2 第一幕「山崖看城」：B01–B04
//   B01 镜头从她的近景拉开，露出月下的山崖和脚下整座城市的灯海；说到「理想主义」，夜空里亮起一颗星，她抬头看的是星，不是城
//   B02 一阵大风横着刮过（叶子全往一个方向飞），她胸口那团光纹丝不动 —— 忠于自己的价值观
//   B03 从崖边一级一级长出发光的台阶，通向那颗星；她踏上去 —— 自己真正认同的生活（不走山下那条车流的大路）
//   B04 她翻开书，羽毛笔、画、音符、星座从书页里升起来，沿着台阶飞上去，在星星周围一笔笔「画」出一座发光的精神之城（神殿=哲学、尖塔=文学、穹顶=艺术、竖琴桥=音乐）
//       说到「精神的力量」时现实的城市暗下去，天上的城亮起来，光落在她身上
const X = require('./pwk');
const { infp } = require('./pf');
const S = require('./PWS_kit');
const CL = require('./PWS_cliff');
const { K, GOLD, LIME, PINK, BLUE, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, rgba, mix, hash } = K;
const glow = S.glow;

const STAR = [560, 196], GOLDW = [255, 226, 160];
const T = {
  open: vs('B01') - 0.9, ideal: at('B01', '理想'), b02: vs('B02'), b03: vs('B03'), b04: vs('B04'), hum: at('B04', '人文'), spirit: at('B04', '精神'), end: ve('B04'),
};
// ---- 相机 ----
const CAM = [
  [T.open, { x: -116, y: 460, z: 1.7 }], [T.open + 1.0, { x: -116, y: -40, z: 1.7 }, K.easeOut], [T.open + 1.3, { x: -116, y: -40, z: 1.7 }], [T.ideal - 0.5, { x: 0, y: 0, z: 1 }], [T.b02 - 0.3, { x: 0, y: -6, z: 1.03 }],
  [T.b02 + 0.5, { x: -70, y: 10, z: 1.36 }], [T.b03 - 0.1, { x: -64, y: 10, z: 1.4 }], [T.b03 + 1.3, { x: 10, y: -10, z: 1 }], [T.b04, { x: 14, y: -16, z: 1 }], [T.end - 0.2, { x: 20, y: -30, z: 1.04 }],
];
// ---- 台阶 ----
const NS = 13;
const SLAB = Array.from({ length: NS }, (_, i) => { const s = i / (NS - 1); return { x: lerp(830, 572, Math.pow(s, 1.1)) + 70 * Math.sin(s * 3.1), y: lerp(1268, 676, Math.pow(s, 0.8)), w: lerp(230, 50, Math.pow(s, 0.75)) }; });
function slab(ctx, q, u, lit = 0) {       // u：0→1 长出来
  if (u <= 0.003) return;
  const e = easeOut(u), y = q.y + (1 - e) * 46, w = q.w * (0.6 + 0.4 * e), d = w * 0.2, sk = -w * 0.14, th = w * 0.085, x = q.x;
  const top = [[x - w / 2, y], [x + w / 2, y], [x + w / 2 + sk, y - d], [x - w / 2 + sk, y - d]];
  S.add(ctx, () => { S.rgrad(ctx, x, y + th * 2, w * 1.1, [[0, GOLDW, 0.5 * e], [1, GOLDW, 0]], 0.3); glow(ctx, x, y - d / 2, w * (0.9 + 1.4 * (1 - u)), [255, 240, 200], (0.25 + 0.6 * (1 - u)) * e + lit * 0.25); });
  ctx.save(); ctx.globalAlpha *= e;
  S.poly(ctx, [[x - w / 2, y], [x + w / 2, y], [x + w / 2, y + th], [x - w / 2, y + th]]); const g1 = ctx.createLinearGradient(0, y, 0, y + th); g1.addColorStop(0, 'rgba(232,170,90,0.95)'); g1.addColorStop(1, 'rgba(150,90,60,0.85)'); ctx.fillStyle = g1; ctx.fill();
  S.poly(ctx, top); const g = ctx.createLinearGradient(x - w / 2, y, x + w / 2 + sk, y - d); g.addColorStop(0, 'rgba(255,236,180,0.96)'); g.addColorStop(0.5, 'rgba(255,250,226,0.98)'); g.addColorStop(1, 'rgba(255,214,140,0.92)'); ctx.fillStyle = g; ctx.fill();
  ctx.restore();
}
// ---- 天上的精神之城 ----
const arc = (cx, cy, r, a0, a1, n = 24, ry = r) => Array.from({ length: n + 1 }, (_, k) => { const a = lerp(a0, a1, k / n); return [cx + r * Math.cos(a), cy + ry * Math.sin(a)]; });
const BASE = 656;
const CITY = [
  { key: 'tower', t0: 0.95, c: [255, 208, 120], fill: [[486, BASE], [486, 410], [520, 366], [560, 176], [600, 366], [634, 410], [634, BASE]],
    lines: [[[486, BASE], [486, 410], [520, 366], [560, 176], [600, 366], [634, 410], [634, BASE]], [[486, 410], [634, 410]], arc(560, 476, 34, 0, 6.2832, 28), [[530, BASE], [530, 590], ...arc(560, 590, 30, Math.PI, 0, 12), [590, BASE]]],
    win: [[560, 476, 30], [520, 540, 12], [600, 540, 12], [560, 300, 12], [560, 610, 20]] },
  { key: 'dome', t0: 1.45, c: [255, 190, 170], fill: [[656, BASE], [656, 548], ...arc(730, 548, 74, Math.PI, 0, 20), [804, BASE]],
    lines: [[[656, BASE], [656, 548], ...arc(730, 548, 74, Math.PI, 0, 20), [804, BASE]], [[640, 548], [820, 548]], [[730, 474], [730, 430]], arc(730, 600, 26, Math.PI, 0, 10).concat([[756, BASE]]), [[704, BASE], [704, 600]]],
    win: [[730, 520, 20], [686, 606, 10], [776, 606, 10], [730, 430, 12]] },
  { key: 'harp', t0: 1.95, c: [170, 230, 255], fill: [[826, BASE], ...Array.from({ length: 21 }, (_, k) => { const s = k / 20; return [826 + s * 190, BASE - 250 * Math.sin(s * 1.5) - 10 * Math.sin(s * 9)]; }), [1016, BASE]],
    lines: [[[826, BASE], ...Array.from({ length: 21 }, (_, k) => { const s = k / 20; return [826 + s * 190, BASE - 250 * Math.sin(s * 1.5) - 10 * Math.sin(s * 9)]; }), [1040, 430]],
      ...[0, 1, 2, 3, 4, 5, 6].map(k => { const s = (k + 1) / 8, x = 826 + s * 190; return [[x, BASE - 250 * Math.sin(s * 1.5) - 10 * Math.sin(s * 9)], [x, BASE]]; }), [[820, BASE], [1040, BASE]]],
    win: [[1016, 420, 16]] },
  { key: 'temple', t0: 2.45, c: [214, 200, 255], fill: [[156, BASE], [156, 636], [172, 636], [172, 524], [276, 464], [380, 524], [380, 636], [396, 636], [396, BASE]],
    lines: [[[150, BASE], [150, 636], [402, 636], [402, BASE]], [[160, 524], [276, 462], [392, 524], [160, 524]], ...[186, 231, 276, 321, 366].map(x => [[x, 528], [x, 634]])],
    win: [[276, 500, 16], [208, 590, 9], [254, 590, 9], [298, 590, 9], [344, 590, 9]] },
];
const CONST = [[196, 356], [236, 300], [300, 268], [344, 322], [318, 392], [258, 404], [300, 268], [362, 232]];   // 星座（沉思的人形）
function skyCity(ctx, t, pw) {
  const t0 = T.hum - 0.35, age = t - t0; if (age < 0.6) return;
  // 云基：城下面一片发光的云
  const cb = smooth(prog(age, 0.9, 2.6));
  S.add(ctx, () => { S.rgrad(ctx, 590, BASE + 14, 620, [[0, GOLDW, 0.42 * cb + 0.2 * pw], [1, GOLDW, 0]], 0.13); for (let i = 0; i < 6; i++) S.rgrad(ctx, 170 + i * 170 + Math.sin(t * 0.3 + i) * 24, BASE + 22 + (i % 2) * 16, 190, [[0, [255, 236, 214], 0.2 * cb], [1, [255, 236, 214], 0]], 0.3); });
  for (const b of CITY) {
    const u = prog(age, b.t0, b.t0 + 1.0); if (u <= 0) continue;
    const f = smooth(prog(u, 0.55, 1)) * (0.75 + 0.25 * pw);
    if (b.fill) { ctx.save(); S.poly(ctx, b.fill); const g = ctx.createLinearGradient(0, 170, 0, BASE); g.addColorStop(0, rgba(mix(b.c, [255, 255, 255], 0.2), 0.62 * f)); g.addColorStop(1, rgba(b.c, 0.26 * f)); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fill(); ctx.restore(); }
    b.lines.forEach((ln, i) => S.neon(ctx, ln, easeInOut(prog(u, i * 0.08, 0.6 + i * 0.08)), b.c, 0.95, i === 0 ? 8 : 5.5, false, 0.22));
    S.add(ctx, () => b.win.forEach(([x, y, r], i) => { const w = smooth(prog(u, 0.6 + i * 0.06, 1)); glow(ctx, x, y, r * 3.4, mix(b.c, [255, 240, 200], 0.5), 0.7 * w * (0.8 + 0.2 * pw)); glow(ctx, x, y, r * 1.3, [255, 252, 240], 0.85 * w); }));
  }
  // 星座：星星先亮，再连起来
  const cu = prog(age, 2.45, 3.6);
  if (cu > 0) { S.add(ctx, () => CONST.forEach(([x, y], i) => { const s = easeOut(prog(cu, i * 0.07, i * 0.07 + 0.3)); glow(ctx, x, y, 44 * s, [200, 220, 255], 0.6 * s); glow(ctx, x, y, 14 * s, [255, 255, 255], 0.95 * s); })); S.neon(ctx, CONST, easeInOut(prog(cu, 0.3, 1)), [190, 212, 255], 0.6, 2.6); }
}
// ---- 小道具 ----
function star4(ctx, x, y, r, c, a, rot = 0) {
  if (a <= 0.003) return;
  S.add(ctx, () => { glow(ctx, x, y, r * 6, c, 0.4 * a); glow(ctx, x, y, r * 2.2, [255, 255, 255], 0.8 * a);
    for (const [sx, sy] of [[7, 0.5], [0.5, 9]]) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sx, sy); glow(ctx, 0, 0, r, mix(c, [255, 255, 255], 0.5), 0.8 * a); ctx.restore(); } });
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = rgba([255, 252, 236], a); ctx.beginPath();
  for (let k = 0; k < 8; k++) { const ang = k * Math.PI / 4, rr = k % 2 ? r * 0.26 : r; ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); } ctx.closePath(); ctx.fill(); ctx.restore();
}
function book(ctx, x, y, s, open, gl) {
  if (open <= 0.003) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (0.4 + 0.6 * open), s * (0.4 + 0.6 * open)); ctx.rotate(-0.12);
  S.add(ctx, () => { glow(ctx, 0, -20, 190 * gl, GOLDW, 0.55 * gl); });
  S.poly(ctx, [[-78, 8], [78, 8], [72, 24], [-72, 24]], 'rgb(116,60,52)');
  for (const sd of [-1, 1]) {
    const g = ctx.createLinearGradient(0, 0, sd * 78, 0); g.addColorStop(0, 'rgb(200,176,140)'); g.addColorStop(0.22, 'rgb(255,246,222)'); g.addColorStop(1, 'rgb(236,214,176)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -4); ctx.quadraticCurveTo(sd * 38, -26 * open, sd * 78, -14 * open); ctx.lineTo(sd * 78, 10); ctx.quadraticCurveTo(sd * 38, 0, 0, 12); ctx.closePath(); ctx.fill();
  }
  S.add(ctx, () => glow(ctx, 0, -10, 70, [255, 250, 230], 0.8 * gl));
  ctx.restore();
}
// 四样东西：羽毛笔 / 画 / 音符 / 星
function emblem(ctx, kind, x, y, s, rot, a) {
  if (a <= 0.003) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= a;
  S.add(ctx, () => glow(ctx, 0, 0, 130, kind === 'note' ? [170, 230, 255] : kind === 'paint' ? [255, 190, 170] : GOLDW, 0.6));
  if (kind === 'quill') {
    const g = ctx.createLinearGradient(-20, 60, 30, -70); g.addColorStop(0, 'rgb(255,214,140)'); g.addColorStop(1, 'rgb(255,255,246)'); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-26, 70); ctx.quadraticCurveTo(-34, -10, 22, -74); ctx.quadraticCurveTo(44, -20, -8, 54); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgb(214,160,90)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-34, 92); ctx.quadraticCurveTo(-16, 30, 18, -60); ctx.stroke();
  } else if (kind === 'paint') {
    ctx.fillStyle = 'rgb(214,160,84)'; ctx.beginPath(); ctx.roundRect(-58, -46, 116, 92, 8); ctx.fill();
    const g = ctx.createLinearGradient(0, -36, 0, 36); g.addColorStop(0, 'rgb(255,170,150)'); g.addColorStop(0.55, 'rgb(255,226,170)'); g.addColorStop(0.56, 'rgb(90,140,170)'); g.addColorStop(1, 'rgb(50,80,130)');
    ctx.fillStyle = g; ctx.fillRect(-48, -36, 96, 72); ctx.fillStyle = 'rgb(255,246,220)'; ctx.beginPath(); ctx.arc(14, -8, 13, 0, 6.2832); ctx.fill();
  } else if (kind === 'note') {
    ctx.fillStyle = 'rgb(226,246,255)'; for (const dx of [-30, 34]) { ctx.beginPath(); ctx.ellipse(dx, 40 - (dx > 0 ? 14 : 0), 24, 17, -0.4, 0, 6.2832); ctx.fill(); }
    ctx.fillRect(-12, -52, 10, 94); ctx.fillRect(52, -66, 10, 94); S.poly(ctx, [[-12, -52], [62, -66], [62, -40], [-12, -26]], 'rgb(226,246,255)');
  } else { ctx.restore(); star4(ctx, x, y, 22 * s, [200, 220, 255], a, rot); return; }
  ctx.restore();
}
const EMB = [
  { kind: 'quill', to: [560, 420], dl: 0, c: GOLDW, bend: -260 }, { kind: 'paint', to: [730, 520], dl: 0.5, c: [255, 190, 170], bend: 230 },
  { kind: 'note', to: [930, 520], dl: 1.0, c: [170, 230, 255], bend: 300 }, { kind: 'star', to: [276, 380], dl: 1.5, c: [200, 220, 255], bend: -240 },
];
const bz = (A, B, Cc, s) => { const u = 1 - s; return [u * u * A[0] + 2 * u * s * Cc[0] + s * s * B[0], u * u * A[1] + 2 * u * s * Cc[1] + s * s * B[1]]; };

function draw(ctx, t, fx = {}) {
  const C = S.camKF(t, CAM);
  if (fx.dive > 0) { const z = 1 + 7 * easeIn(fx.dive); C.z *= z; C.x += (760 - 540) * (1 - 1 / z); C.y += (1170 - 1000) * (1 - 1 / z); }
  const pw = smooth(prog(t, T.spirit - 0.15, T.spirit + 0.7));           // 「精神的力量」
  const gust = smooth(prog(t, T.b02 - 0.5, T.b02 + 0.2)) * (1 - smooth(prog(t, T.b03 - 0.1, T.b03 + 0.8)));
  CL.world(ctx, t, C, { city: 1 - 0.66 * pw, wave: 0.25 + gust * 0.5 });
  ctx.save(); S.cam(ctx, C, 0.2);
  // 那颗星（理想）：点亮有个预备（先一小点）、爆亮、然后稳定
  const su = prog(t, T.ideal - 0.25, T.ideal + 0.9), sA = su <= 0 ? 0 : (0.35 + 0.65 * easeOut(su)) * (1 - 0.75 * smooth(prog(t, T.hum + 0.4, T.hum + 1.4)));
  if (su > 0) { S.add(ctx, () => glow(ctx, STAR[0], STAR[1], 520 * easeOut(su), [150, 170, 255], 0.2 * sA)); star4(ctx, STAR[0], STAR[1] - 130 * 0, 24 + 22 * Math.exp(-su * 4) + 1.5 * Math.sin(t * 0.9), [255, 236, 190], sA, 0.02 * Math.sin(t * 0.4)); }
  ctx.restore();
  ctx.save(); S.cam(ctx, C, 1);
  // 天上的城（画在台阶和人后面）
  skyCity(ctx, t, pw);
  // 精神之城的光落下来
  if (pw > 0.01) S.add(ctx, () => { const g = ctx.createLinearGradient(0, BASE, 0, 1300); g.addColorStop(0, rgba(GOLDW, 0.34 * pw)); g.addColorStop(1, rgba(GOLDW, 0)); ctx.fillStyle = g; ctx.filter = 'blur(30px)'; S.poly(ctx, [[420, BASE], [760, BASE], [800, 1300], [240, 1300]]); ctx.fill(); ctx.filter = 'none'; });
  // 台阶：一级一级长出来
  const sb = t - (T.b03 + 0.15);
  for (let i = NS - 1; i >= 0; i--) slab(ctx, SLAB[i], prog(sb, i * 0.17, i * 0.17 + 0.5), pw);
  // 她
  const walk = easeInOut(prog(t, T.b03 + 0.5, T.b03 + 2.0)), hx = lerp(400, 500, walk), bob = Math.abs(Math.sin(walk * Math.PI * 4)) * 10 * (walk > 0 && walk < 1 ? 1 : 0), hy = CL.cliffTop(hx) + 6 - bob;
  const up = smooth(prog(t, T.ideal - 0.4, T.ideal + 0.4)), bk = smooth(prog(t, T.b04 - 0.25, T.b04 + 0.35));
  const o = { t, spin: t * (2.2 + gust * 9), tilt: -0.5 * up, look: [1.2 * up, -1.6 * up], lean: -0.035 * gust + 0.02 * Math.sin(t * 0.8), eyes: pw > 0.5 ? 'happy' : 'open', la: -0.5 * bk, ra: -0.12 * gust };
  S.add(ctx, () => S.rgrad(ctx, hx, hy + 4, 220, [[0, [190, 210, 255], 0.2], [1, [190, 210, 255], 0]], 0.16));
  const R = S.lit(ctx, c => infp(c, hx, hy, 0.9, o), { light: pw > 0.3 ? [560, 500] : CL.MOON, at: [hx, hy - 260], r: 320, warm: pw > 0.3 ? [255, 226, 170] : [226, 232, 255], k: 0.9 });
  // B02：胸口那团光（价值观）—— 风越大它越稳
  const vu = smooth(prog(t, T.b02 - 0.2, T.b02 + 0.5)) * (1 - 0.6 * smooth(prog(t, T.b04, T.b04 + 1)));
  if (vu > 0.01) { const [cx, cy] = R.chest; S.add(ctx, () => { glow(ctx, cx, cy, 170 * vu, [255, 200, 120], 0.34 * vu); S.ring(ctx, cx, cy, 60 + 130 * ((t * 0.5) % 1), 26, [255, 220, 150], 0.3 * vu * (1 - (t * 0.5) % 1)); }); star4(ctx, cx, cy, 17 * vu, [255, 214, 140], 0.85 * vu, 0); }
  // B04：书和从书里升起来的四样东西
  if (bk > 0.01) {
    const B = [R.lh[0] - 14, R.lh[1] - 26]; book(ctx, B[0], B[1], 1.15, bk, 0.6 + 0.4 * pw);
    for (const e of EMB) {
      const u = prog(t, T.hum - 0.35 + e.dl, T.hum - 0.35 + e.dl + 1.0); if (u <= 0 || u >= 1.25) continue;
      const Cc = [lerp(B[0], e.to[0], 0.5) + e.bend, lerp(B[1], e.to[1], 0.45)], s = easeInOut(clamp(u)), p = bz(B, e.to, Cc, s);
      const trail = Array.from({ length: 16 }, (_, k) => bz(B, e.to, Cc, Math.max(0, s - 0.34 * (1 - k / 15))));
      S.ribbon(ctx, trail, q => 6 + 34 * q, e.c, 0.7 * (1 - smooth(prog(u, 0.9, 1.2))));
      emblem(ctx, e.kind, p[0], p[1], lerp(0.5, 1.15, Math.sin(Math.PI * clamp(u))) * (0.8 + 0.2 * s), Math.sin(u * 5) * 0.3 - 0.3, smooth(prog(u, 0, 0.15)) * (1 - smooth(prog(u, 0.88, 1.05))));
    }
  }
  ctx.restore();
  // 大风：叶子横着刮过去（都往左），只有她不动
  S.petals(ctx, t, { n: 60, seed: 3, dir: [-1, 0.12], speed: 1000, a: gust, c: [120, 200, 150], c2: [220, 240, 170], size: 26, box: [-100, 300, W + 100, 1400] });
  S.petals(ctx, t, { n: 10, seed: 9, dir: [-1, 0.2], speed: 120, a: 0.5 * (1 - gust), c: [150, 200, 190], c2: [220, 240, 200], size: 13, box: [-100, 500, W + 100, 1300] });
  CL.front(ctx, t, C, 1 - 0.5 * pw);
  return { C };
}
function over(ctx, t, a) {
  // 「理想主义」：星星下面一行大字（只这一处）
  const ta = K.vis(t, T.ideal - 0.05, T.b02 + 0.2, 0.5, 0.5);
  if (ta > 0.003) { const dy = (1 - easeOut(prog(t, T.ideal - 0.05, T.ideal + 0.7))) * 24; S.title(ctx, '理想主义', 560, 470 + dy, { size: 118, c: GOLD, a: ta * a, spacing: 0.2 }); }
}
module.exports = { draw, over, T };
