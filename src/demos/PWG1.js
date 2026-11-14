'use strict';
// 《INFP》v3 第 1 组（Kiro）：A01–A09 开头
//   S1 黑暗里一群人的剪影站成几排（虚焦），一双冰蓝发光的眼睛在画面上方慢慢睁开（「六眼」梗，只有光做的眼，不画脸）；
//      目光扫过去，被扫到的人身上亮起各自的情绪色（共情、感知情绪）；问句后停 2 秒，只剩眼睛在呼吸、人群的光在轻轻闪
//   S2 一群小蝴蝶从左下涌上来铺满画面，散开时露出夜草地上的她
//   S3 中景：她站在夜草地上，一个个性格词从她身边的光尘里聚出来（一次一个），她的表情和姿势跟着变
//   S4 暖光从她脚下升起把她包住（值得喜爱）
//   S5 低机位大远景：风车吹起旋风，聚成巨大的「INFP」立在地平线上，她站在字前逆光
const X = require('./pwk');
const { infp } = require('./pf');
const MB = require('./mb');
const U = require('./pwu');
const { C, K, L, LIME, GOLD, IVORY, PINK, BLUE, RED, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, glow, vis, mix, rgba, mulberry32, hash } = K;
const R0 = mulberry32(101);
const ICE = [140, 210, 255];

// 光做的眼睛：外圈柔光 + 半透明眼白形状 + 冰蓝虹膜（径向渐变 + 一圈亮环）+ 高光
function lightEye(ctx, x, y, s, open, look, t) {
  if (open <= 0.01) return;
  const w = 150 * s, h = 70 * s * open;
  glow(ctx, x, y, w * 2.2, ICE, 0.35 * open);
  ctx.save();
  ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x, y - h * 1.6, x + w, y); ctx.quadraticCurveTo(x, y + h * 1.6, x - w, y); ctx.closePath();
  ctx.fillStyle = 'rgba(200,230,255,0.10)'; ctx.fill(); ctx.clip();
  const ix = x + look * w * 0.35, ir = 58 * s;
  let g = ctx.createRadialGradient(ix, y, 0, ix, y, ir);
  g.addColorStop(0, 'rgb(10,20,40)'); g.addColorStop(0.3, 'rgb(40,120,220)'); g.addColorStop(0.75, 'rgb(140,220,255)'); g.addColorStop(0.92, 'rgb(230,250,255)'); g.addColorStop(1, 'rgba(140,210,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ix, y, ir, 0, 6.283); ctx.fill();
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 18; i++) { const an = i / 18 * 6.283 + t * 0.2; glow(ctx, ix + Math.cos(an) * ir * 0.62, y + Math.sin(an) * ir * 0.62, 10 * s, [200, 240, 255], 0.35); }
  glow(ctx, ix - ir * 0.3, y - ir * 0.3, 16 * s, [255, 255, 255], 0.9);
  ctx.restore();
  ctx.restore();
}
// 小蝴蝶（低多边形，青绿-柠檬）
function fly(ctx, x, y, S, t, a, rot = 0) {
  if (a <= 0.003) return;
  const f = 0.25 + 0.75 * Math.abs(Math.cos(t * 9));
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= a;
  for (const sd of [-1, 1]) {
    ctx.save(); ctx.scale(sd * f, 1);
    let g = ctx.createLinearGradient(0, 0, S * 1.3, -S); g.addColorStop(0, 'rgb(52,150,124)'); g.addColorStop(0.55, 'rgb(120,206,150)'); g.addColorStop(1, 'rgb(226,234,112)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -S * 0.06); ctx.lineTo(S * 0.45, -S * 1.05); ctx.lineTo(S * 1.3, -S); ctx.lineTo(S * 1.22, -S * 0.38); ctx.lineTo(S * 0.28, S * 0.04); ctx.closePath(); ctx.fill();
    g = ctx.createLinearGradient(0, 0, S * 0.9, S); g.addColorStop(0, 'rgb(46,128,112)'); g.addColorStop(1, 'rgb(96,196,164)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, S * 0.04); ctx.lineTo(S * 0.92, S * 0.2); ctx.lineTo(S * 0.86, S * 0.86); ctx.lineTo(S * 0.36, S); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = 'rgb(34,46,44)'; ctx.beginPath(); ctx.ellipse(0, S * 0.1, S * 0.08, S * 0.5, 0, 0, 6.283); ctx.fill();
  ctx.restore();
}
const SWARM = Array.from({ length: 70 }, () => ({ x0: -200 + R0() * 700, y0: H + 100 + R0() * 500, x1: 400 + R0() * 1000, y1: -300 - R0() * 600, s: 22 + R0() * 40, dl: R0() * 0.9, ph: R0() * 6, sw: 60 + R0() * 120 }));
const CROWD = [['estj-female', 140, 1260, 2.0], ['enfp-male', 400, 1230, 2.0], ['isfj-female', 660, 1250, 2.0], ['entj-male', 930, 1240, 2.0], ['esfp-male', 270, 1520, 2.5], ['istp-female', 560, 1540, 2.5], ['enfj-male', 860, 1520, 2.5]];
const EMO = [[255, 140, 120], [255, 210, 120], [150, 190, 255], [200, 150, 255], [255, 170, 200], [140, 230, 190], [255, 200, 150]];
const DUST = U.mkDust(12, 70, [0, 300, W, 1500]);

module.exports = function make(G) {
  const S = []; const add = (a, b, draw, over) => S.push({ a, b, draw, over });
  const a1 = vs('A01'), a2 = vs('A02'), a3 = vs('A03'), a4 = vs('A04'), a5 = vs('A05'), a6 = vs('A06'), a7 = vs('A07'), a8 = vs('A08'), a9 = vs('A09');
  // ===== S1：眼睛 + 人群 =====
  add(0, a4 + 0.6, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    ctx.save(); ctx.globalAlpha *= a;
    U.vgrad(ctx, [[0, [6, 10, 22]], [0.6, [14, 20, 40]], [1, [8, 10, 18]]], -200, H + 200);
    for (let i = 0; i < 60; i++) glow(ctx, (i * 191) % W, 60 + (i * 83) % 900, 4, [200, 220, 255], 0.25 * (0.5 + 0.5 * Math.sin(t * 0.8 + i)));
    U.fog(ctx, 540, 1200, 700, t * 0.3, 0.6, [40, 60, 110]);
    const open = easeOut(prog(t, a1 + 0.3, a1 + 2.0)) * (1 - 0.9 * Math.exp(-((t - a2 - 1.2) ** 2) / 0.006)) ;   // 中间眨一下
    const look = Math.sin(prog(t, a2, a3 + 1.5) * Math.PI * 2) * 0.9;
    const breathe = 1 + 0.03 * Math.sin(t * 1.6);
    lightEye(ctx, 330, 470, 1.0 * breathe, open, look, t); lightEye(ctx, 750, 470, 1.0 * breathe, open, look, t);
    // 目光扫过人群：一道冰蓝光带随视线横扫
    const sx = 540 + look * 420, scan = smooth(prog(t, a2 - 0.3, a2 + 0.4));
    U.beam(ctx, 540, 520, 300, sx, 1500, 360, ICE, 0.12 * scan * open);
    U.blurLayer(ctx, 3, c => {
      CROWD.forEach(([k, x, y, s], i) => {
        const o = MB.person(c, k, x, y, s, { a: 0.85, flip: i % 2 === 1, dim: 0.75 });
        const seen = smooth(prog(t, a2 + 0.2 + i * 0.25, a2 + 0.7 + i * 0.25));
        const ch = o && o.chest ? o.chest : [x, y - 120 * s];
        if (seen > 0.01) { glow(c, ch[0], ch[1] - 40, 190 * s / 2, EMO[i], 0.5 * seen * (0.8 + 0.2 * Math.sin(t * 2 + i))); U.pool(c, x, y + 4, 140 * s / 2, EMO[i], 0.35 * seen); }
      });
    });
    ctx.restore();
  });
  // 蝴蝶群（转场，单独一层压在两镜上面）
  add(a4 - 0.9, a4 + 2.4, () => {}, (ctx, t, a) => {
    SWARM.forEach(b => { const u = prog(t, a4 - 0.8 + b.dl * 0.6, a4 + 1.3 + b.dl * 0.6); if (u <= 0 || u >= 1) return; const e = easeInOut(u); fly(ctx, lerp(b.x0, b.x1, e) + Math.sin(u * 6 + b.ph) * b.sw, lerp(b.y0, b.y1, e), b.s * 1.3, t + b.ph, 1, 0.4 + Math.sin(u * 4 + b.ph) * 0.3); });
  });
  // ===== S2–S4：夜草地上的她 =====
  const WORDS = [['敏感', 'A06', { eyes: 'wide', look: [0.5, 0] }], ['感性', 'A06', { eyes: 'happy', tilt: 0.6 }], ['社恐', 'A06', { lean: -0.08, look: [-1, 0.4], la: 0.4, ra: 0.4, nod: 0.3 }], ['矛盾', 'A06', { look: [1, 0], tilt: -0.4 }],
    ['内耗', 'A07', { eyes: 'sad', nod: 0.5, mouth: 'flat' }], ['傲娇', 'A07', { eyes: 'closed', tilt: -0.6, nod: -0.5 }], ['拧巴', 'A07', { mouth: 'flat', nod: 0.4, la: 0.6, ra: 0.6, look: [-0.6, 0.6] }]];
  const WT = WORDS.map(([w, id]) => at(id, w));
  add(a4 + 0.2, a9 + 0.4, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    ctx.save(); ctx.globalAlpha *= a;
    const z = 1.0 + 0.1 * smooth(prog(t, a5, a8)); ctx.translate(W / 2, 1300); ctx.scale(z, z); ctx.translate(-W / 2, -1300);
    U.vgrad(ctx, [[0, [10, 22, 34]], [0.55, [26, 52, 56]], [1, [40, 70, 60]]], -200, 1060);
    glow(ctx, 760, 280, 260, [210, 230, 200], 0.4); glow(ctx, 760, 280, 60, [245, 250, 235], 0.9);
    for (let i = 0; i < 50; i++) glow(ctx, (i * 173) % W, 60 + (i * 71) % 800, 4, [230, 245, 220], 0.3 * (0.5 + 0.5 * Math.sin(t + i)));
    ctx.fillStyle = 'rgb(16,34,34)'; ctx.beginPath(); ctx.moveTo(-100, 1060); for (let i = 0; i <= 10; i++) ctx.lineTo(-100 + i * 130, 960 - Math.sin(i * 1.3 + 1) * 60); ctx.lineTo(W + 100, 1060); ctx.closePath(); ctx.fill();
    U.vgrad(ctx, [[0, [34, 66, 50]], [1, [10, 20, 16]]], 1060, H + 200);
    U.dust(ctx, t, DUST, [220, 240, 170], 0.7, 14);
    // 当前是哪个词
    let k = -1; WT.forEach((w, i) => { if (t >= w - 0.15) k = i; });
    if (t > a8 - 0.3) k = -1;
    const pose = k >= 0 ? WORDS[k][2] : {};
    const warm = smooth(prog(t, a8, a8 + 1.4));
    // 暖光从脚下升起
    if (warm > 0.01) { U.pool(ctx, 540, 1400, 520, [255, 200, 130], 0.6 * warm); U.beam(ctx, 540, 1400, 600, 540, 300, 200, [255, 210, 150], 0.2 * warm); for (let i = 0; i < 30; i++) { const u = ((t * 0.3 + i / 30) % 1); glow(ctx, 540 + Math.sin(i * 7 + t) * 260 * (1 - u), 1400 - u * 900, 10, [255, 220, 160], 0.6 * warm * (1 - u)); } }
    infp(ctx, 540, 1420, 1.25, { t, a: 1, flies: 1, wind: true, spin: t * 1.5, dim: 0.05, ...pose });
    U.pool(ctx, 540, 1425, 300, [190, 236, 150], 0.3);
    // 前景虚焦草叶
    U.blurLayer(ctx, 10, c => { c.fillStyle = 'rgb(6,14,12)'; for (let i = 0; i < 8; i++) { const bx = i < 4 ? 40 + i * 70 : W - 40 - (i - 4) * 70, h = 300 + (i % 3) * 120, sw = Math.sin(t + i) * 20; c.beginPath(); c.moveTo(bx - 24, 1960); c.quadraticCurveTo(bx + sw * 0.4, 1960 - h * 0.6, bx + sw, 1960 - h); c.quadraticCurveTo(bx + 24 + sw * 0.4, 1960 - h * 0.6, bx + 24, 1960); c.fill(); } });
    ctx.restore();
    return { k };
  }, (ctx, t, a, st) => {
    WORDS.forEach(([w], i) => {
      const t0 = WT[i] - 0.15, t1 = (i + 1 < WT.length ? WT[i + 1] : a8) - 0.15, v = vis(t, t0, t1, 0.18, 0.2); if (v <= 0.003) return;
      const c = i === 4 || i === 6 ? BLUE : (i === 1 ? PINK : LIME), u = easeOut(prog(t, t0, t0 + 0.4));
      glow(ctx, W / 2, 470, 360, c, 0.25 * v * (1.4 - u));
      ctx.save(); ctx.translate(W / 2, 520); ctx.scale(1.25 - 0.25 * u, 1.25 - 0.25 * u);
      L.rich(ctx, w, 0, 0, { size: 170, weight: 600, spacing: 0.15, color: IVORY, keys: [w], keyColor: c, alpha: Math.min(1, a * v * 1.3), glowKey: 0.9 });
      ctx.restore();
    });
  });
  // ===== S5：巨大的 INFP =====
  add(a9 - 0.4, G.b + 0.4, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    ctx.save(); ctx.globalAlpha *= a;
    const t0 = (vs('A09') + 0.9);
    U.vgrad(ctx, [[0, [8, 18, 30]], [0.6, [30, 56, 60]], [1, [50, 80, 64]]], -200, 1100);
    const rise = smooth(prog(t, t0 - 0.2, t0 + 1.2));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 12; i++) { const an = -Math.PI / 2 + (i - 5.5) * 0.17; const g = ctx.createLinearGradient(540, 900, 540 + Math.cos(an) * 1200, 900 + Math.sin(an) * 1200); g.addColorStop(0, `rgba(230,240,160,${0.16 * rise})`); g.addColorStop(1, 'rgba(230,240,160,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(540, 900); ctx.lineTo(540 + Math.cos(an - 0.05) * 1400, 900 + Math.sin(an - 0.05) * 1400); ctx.lineTo(540 + Math.cos(an + 0.05) * 1400, 900 + Math.sin(an + 0.05) * 1400); ctx.closePath(); ctx.fill(); }
    glow(ctx, 540, 860, 800, [220, 240, 160], 0.3 * rise);
    ctx.restore();
    U.vgrad(ctx, [[0, [30, 60, 46]], [1, [6, 12, 10]]], 1100, H + 200);
    // 湿地面上的倒影光
    U.pool(ctx, 540, 1140, 700, [220, 240, 160], 0.35 * rise, 0.1);
    // 旋风：粒子从她的风车卷上去
    for (let i = 0; i < 90; i++) { const u = ((t - t0 + 1.2) * 0.5 + i / 90) % 1, an = i * 2.4 + t * 3, rr = 40 + u * 360; if (t < t0 - 1.2) break; glow(ctx, 600 + Math.cos(an) * rr, 1300 - u * 520 + Math.sin(an) * rr * 0.2, 9, LIME, 0.5 * (1 - u) * (1 - rise * 0.6)); }
    infp(ctx, 540, 1500, 1.0, { t, a: 1, flies: 1, wind: true, spin: t * 5, dim: 0.2, look: [0, -1], ra: -1.2 });
    ctx.restore();
  }, (ctx, t, a) => {
    const t0 = (vs('A09') + 0.9);
    ctx.save(); ctx.globalAlpha *= a;
    C.gather(ctx, 'INFP', W / 2, 800, t, t0 - 0.3, G.b + 2, { size: 300, weight: 600, spacing: 0.08, keys: ['INFP'], keyColor: LIME, from: [600, 1300] });
    ctx.restore();
  });
  return S;
};
