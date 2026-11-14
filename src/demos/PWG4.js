'use strict';
// 《INFP》v3 第 4 组（Kiro）：C301–C310 中学里的忍，D01–D09 工作的意义
//   S1 黄昏教室：她课桌上一只玻璃杯，每「忍」一次落下一滴，水位上涨；忍无可忍 → 水鼓出杯口，她却小心端起来扛在肩上（忍辱负重）
//   S2 同一教室：前桌男生回头，手里一颗小石子；她眼里那颗石子变成一块压在桌上的大石头；他头顶冒问号（懵逼）
//   S3 镜头摇到教室角落：INFJ 安静坐着看着；墙上一只发光的大开关，她去按灭，开关自己又弹回来亮着
//   S4 夜里岔路口：INFJ 沿一条笔直亮起的大路看远方；她举着一盏暖灯，走向一条弯弯的小路（个人意义）
//   S5 冷白日光灯办公室：她桌上一支蜡烛越烧越短，人越来越塌（耗竭 → 生无可恋）
const X = require('./pwk');
const { infp } = require('./pf');
const MB = require('./mb');
const U = require('./pwu');
const { C, K, L, LIME, GOLD, IVORY, PINK, BLUE, RED, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, glow, vis, mix, rgba, mulberry32 } = K;
const R0 = mulberry32(404);

// ---------- 黄昏教室 ----------
const HY = 1060;
function desk(ctx, x, y, s, top = [150, 108, 72], lit = 1) {
  const w = 300 * s, d = 70 * s, h = 150 * s;
  ctx.save();
  U.shadow(ctx, x, y + h + 6 * s, w * 0.7, 0.55);
  ctx.fillStyle = rgba(mix(top, [0, 0, 0], 0.55)); ctx.fillRect(x - w / 2 + 14 * s, y + d * 0.4, 14 * s, h); ctx.fillRect(x + w / 2 - 28 * s, y + d * 0.4, 14 * s, h);
  ctx.fillStyle = rgba(mix(top, [0, 0, 0], 0.4)); ctx.fillRect(x - w / 2, y + d * 0.5, w, 22 * s);
  const g = ctx.createLinearGradient(0, y - d * 0.5, 0, y + d * 0.5); g.addColorStop(0, rgba(mix(top, [255, 210, 160], 0.25 * lit))); g.addColorStop(1, rgba(top));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w * 0.46, y - d * 0.5); ctx.lineTo(x + w * 0.46, y - d * 0.5); ctx.lineTo(x + w / 2, y + d * 0.5); ctx.lineTo(x - w / 2, y + d * 0.5); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function classroom(ctx, t, o = {}) {
  const { pan = 0, dusk = 1 } = o;
  U.vgrad(ctx, [[0, [46, 34, 36]], [1, [70, 50, 44]]], -200, HY);
  ctx.save(); ctx.translate(-pan, 0);
  // 黑板
  ctx.fillStyle = 'rgb(40,32,28)'; ctx.fillRect(-220, 240, 760, 430);
  let g = ctx.createLinearGradient(-200, 260, 520, 650); g.addColorStop(0, 'rgb(34,58,48)'); g.addColorStop(1, 'rgb(24,42,36)');
  ctx.fillStyle = g; ctx.fillRect(-200, 260, 720, 390);
  ctx.save(); ctx.globalAlpha = 0.12; for (let i = 0; i < 6; i++) { ctx.fillStyle = '#e8ece4'; ctx.beginPath(); ctx.ellipse(-60 + i * 110, 380 + (i % 2) * 120, 90, 26, -0.1, 0, 6.283); ctx.fill(); } ctx.restore();
  // 大窗：夕阳
  for (const wx of [700, 1180, 1660]) U.windowFrame(ctx, wx, 200, 360, 620, c => {
    U.vgrad(c, [[0, mix([90, 110, 170], [255, 150, 90], dusk * 0.7)], [0.7, mix([150, 140, 170], [255, 190, 120], dusk)], [1, [255, 210, 150]]], 200, 820, wx, wx + 360);
    glow(c, 1300 - pan * 0, 760, 380, [255, 170, 90], 0.6 * dusk);
    c.fillStyle = 'rgba(40,30,40,0.55)'; for (let i = 0; i < 7; i++) { const bx = wx + i * 60, bh = 60 + ((i * 37 + wx) % 90); c.fillRect(bx, 820 - bh, 50, bh); }
  }, { frame: [56, 40, 34] });
  // 窗光斜进来
  for (const wx of [700, 1180]) U.beam(ctx, wx + 180, 480, 360, wx - 260, HY + 420, 640, [255, 180, 110], 0.14 * dusk);
  ctx.restore();
  U.floor(ctx, HY, [82, 60, 46], [40, 28, 22], { vx: W / 2 - pan * 0.4, seam: 0.2, cross: 7 });
  ctx.save(); ctx.translate(-pan * 0.6, 0); U.pool(ctx, 700, HY + 300, 700, [255, 170, 100], 0.22 * dusk); ctx.restore();
}
// 玻璃杯
function cup(ctx, x, y, s, lvl, t, bulge = 0, a = 1) {
  if (a <= 0.003) return;
  const w = 120 * s, h = 190 * s;
  ctx.save(); ctx.globalAlpha *= a;
  U.shadow(ctx, x, y + 4, w * 0.8, 0.4);
  ctx.beginPath(); ctx.moveTo(x - w / 2, y - h); ctx.lineTo(x - w * 0.4, y); ctx.lineTo(x + w * 0.4, y); ctx.lineTo(x + w / 2, y - h); ctx.closePath();
  ctx.fillStyle = 'rgba(200,225,240,0.12)'; ctx.fill();
  ctx.save(); ctx.clip();
  const sy = y - h * clamp(lvl) - bulge * 26 * s;
  ctx.beginPath(); ctx.moveTo(x - w, sy + Math.sin(t * 3) * 3); ctx.quadraticCurveTo(x, sy - 6 - bulge * 20 * s, x + w, sy + Math.cos(t * 3) * 3); ctx.lineTo(x + w, y + 10); ctx.lineTo(x - w, y + 10); ctx.closePath();
  const g = ctx.createLinearGradient(0, sy, 0, y); g.addColorStop(0, 'rgba(170,215,255,0.85)'); g.addColorStop(1, 'rgba(60,110,190,0.9)'); ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  if (bulge > 0.01) { // 水鼓出杯口（表面张力）
    const g = ctx.createRadialGradient(x, y - h, 0, x, y - h, w * 0.55); g.addColorStop(0, 'rgba(170,215,255,0.85)'); g.addColorStop(1, 'rgba(120,180,240,0.55)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y - h, w * 0.5, 30 * s * bulge, 0, Math.PI, 0); ctx.fill();
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(x - w * 0.38, y - h * 0.95); ctx.lineTo(x - w * 0.3, y - h * 0.95); ctx.lineTo(x - w * 0.26, y - h * 0.1); ctx.lineTo(x - w * 0.32, y - h * 0.1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(230,240,255,0.35)'; ctx.beginPath(); ctx.ellipse(x, y - h, w / 2, 9 * s, 0, 0, 6.283); ctx.fill();
  glow(ctx, x, y - h * lvl, w, [140, 200, 255], 0.25);
  ctx.restore(); ctx.restore();
}
// 石头：有体积的低多边形石块
function rock(ctx, x, y, r, a = 1) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a;
  U.shadow(ctx, x, y + r * 0.55, r * 1.3, 0.55);
  const P = [[-1, 0.3], [-0.8, -0.4], [-0.2, -0.75], [0.5, -0.6], [1, -0.05], [0.85, 0.45], [0.1, 0.6], [-0.6, 0.55]].map(([u, v]) => [x + u * r, y + v * r]);
  ctx.fillStyle = 'rgb(84,82,90)'; ctx.beginPath(); P.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.fill();
  const F = [[[0, 1, 2], 'rgb(132,128,136)'], [[2, 3, 4], 'rgb(150,146,152)'], [[0, 2, 6, 7], 'rgb(104,100,110)'], [[2, 4, 5, 6], 'rgb(96,92,102)']];
  for (const [ix, c] of F) { ctx.fillStyle = c; ctx.beginPath(); ix.forEach((k, i) => i ? ctx.lineTo(...P[k]) : ctx.moveTo(...P[k])); ctx.closePath(); ctx.fill(); }
  glow(ctx, x - r * 0.3, y - r * 0.5, r * 0.6, [255, 190, 130], 0.25);
  ctx.restore();
}
// 墙上的大开关：厚面板 + 拨杆 + 亮着时一圈暖光
function lightSwitch(ctx, x, y, s, on, a = 1) {
  ctx.save(); ctx.globalAlpha *= a;
  if (on > 0.01) glow(ctx, x, y, 260 * s, [255, 200, 120], 0.45 * on);
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 24 * s; ctx.shadowOffsetY = 10 * s;
  ctx.fillStyle = 'rgb(222,214,198)'; ctx.beginPath(); ctx.roundRect(x - 90 * s, y - 130 * s, 180 * s, 260 * s, 22 * s); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgb(176,166,150)'; ctx.beginPath(); ctx.roundRect(x - 50 * s, y - 86 * s, 100 * s, 172 * s, 14 * s); ctx.fill();
  const ty = lerp(56, -56, on) * s, g = ctx.createLinearGradient(0, y + ty - 50 * s, 0, y + ty + 50 * s);
  g.addColorStop(0, on > 0.5 ? 'rgb(255,236,190)' : 'rgb(240,234,222)'); g.addColorStop(1, on > 0.5 ? 'rgb(236,180,100)' : 'rgb(190,182,168)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x - 38 * s, y + ty - 46 * s, 76 * s, 92 * s, 12 * s); ctx.fill();
  if (on > 0.01) glow(ctx, x, y + ty, 70 * s, [255, 220, 150], 0.6 * on);
  ctx.restore();
}
const DROPS = Array.from({ length: 3 }, (_, i) => i);

module.exports = function make(G) {
  const S = []; const add = (a, b, draw, over) => S.push({ a, b, draw, over });
  const A = G.a, P2 = G.PAGES.find(p => p.name === 'P2');
  // ===== S1–S3：教室，一镜到底（镜头横移到角落） =====
  const a1 = A, b1 = P2.a + 0.4;
  const ren = [at('C302', '忍让'), at('C302', '一忍'), at('C303', '忍无可忍')];
  const tz = at('C303', '忍辱负重'), c4 = vs('C304'), c5 = vs('C305'), c6 = vs('C306'), c7 = vs('C307'), c8 = vs('C308'), c9 = vs('C309'), c10 = vs('C310');
  add(a1, b1, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    const pan = 520 * easeInOut(prog(t, c8 - 0.4, c9 + 0.8));
    const zoom = 1 + 0.07 * smooth(prog(t, a1, c4)) - 0.07 * smooth(prog(t, c4 - 0.3, c4 + 0.9));
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(W / 2, 1100); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -1100);
    classroom(ctx, t, { pan, dusk: 1 - 0.4 * smooth(prog(t, c9, c10 + 2)) });
    ctx.save(); ctx.translate(-pan, 0);
    // 远处几排空课桌
    for (const [x, y, s] of [[180, HY + 40, 0.55], [560, HY + 40, 0.55], [940, HY + 40, 0.55], [1320, HY + 40, 0.55]]) desk(ctx, x, y, s, [120, 90, 64], 0.6);
    // 前桌男生（S2）：回头，手里一颗小石子
    const him = smooth(prog(t, c4 - 0.6, c4 + 0.4));
    if (him > 0.01) {
      desk(ctx, 820, HY + 150, 0.8);
      const o = MB.person(ctx, 'estp-male', 830, HY + 230, 2.1, { a: him, flip: true, dim: 0.1 });
      const hh = o && o.head ? o.head : [830, HY - 260];
      rock(ctx, 760, HY + 60, 16, him * (1 - smooth(prog(t, c8, c8 + 0.6))));
      // 懵逼：头顶问号
      const q = smooth(prog(t, c6 - 0.1, c6 + 0.6)) * (1 - smooth(prog(t, c8 - 0.2, c8 + 0.4)));
      U.bigQ(ctx, hh[0] + 40, hh[1] - 140 + Math.sin(t * 3) * 8, 0.75, [180, 210, 255], q);
      U.bigQ(ctx, hh[0] - 70, hh[1] - 90 + Math.cos(t * 3) * 8, 0.45, [180, 210, 255], q * 0.8);
    }
    // 她的课桌（近景）+ 杯子
    desk(ctx, 700, HY + 200, 1.1);
    const lvl = 0.25 + 0.2 * ren.filter(x => t > x + 0.5).length + 0.2 * smooth(prog(t, ren[2] + 0.3, ren[2] + 0.9));
    const bulge = smooth(prog(t, ren[2] + 0.4, ren[2] + 1.0));
    const lift = easeInOut(prog(t, tz, tz + 1.3)) * (1 - smooth(prog(t, c4 - 0.3, c4 + 0.6)));
    const slump = smooth(prog(t, c4, c5)) * (1 - smooth(prog(t, c8, c8 + 1)));
    const o = infp(ctx, 420, HY + 470, 1.15, { t, a: 1, wind: false, flies: 1, dim: 0.05,
      ra: lerp(0, -2.2, lift), la: lerp(0, -0.6, lift), nod: lift * 0.4 + slump * 0.3, eyes: slump > 0.5 ? 'sad' : (lift > 0.5 ? 'closed' : 'open'), mouth: slump > 0.4 ? 'flat' : 'smile', tilt: lift * 0.5, look: [0.6, 0] });
    // 杯子：在桌上 → 被端到肩上
    const cx = lerp(720, o.rh ? o.rh[0] + 20 : 520, lift), cy = lerp(HY + 175, o.rh ? o.rh[1] - 10 : HY - 120, lift);
    cup(ctx, cx, cy, 1.0 + 0.15 * lift, lvl, t, bulge, 1 - smooth(prog(t, c4 + 0.6, c4 + 1.2)));
    // 每「忍」一滴：从上方落进杯子
    ren.forEach(t0 => { const u = prog(t, t0 - 0.2, t0 + 0.45); if (u <= 0 || u >= 1) return; const y = lerp(HY - 420, HY + 10, easeIn(u)); U.orb(ctx, 720, y, 16, [150, 210, 255], 1 - u * 0.3); if (u > 0.9) L.shock(ctx, 720, HY + 20, t, t0 + 0.42, { r0: 6, r1: 70, dur: 0.5, c: [180, 220, 255], a: 0.7, sy: 0.3 }); });
    // 她眼里：那颗小石子变成桌上一块大石头
    const big = smooth(prog(t, at('C307', '如此重视') - 0.4, at('C307', '如此重视') + 0.6)) * (1 - smooth(prog(t, c8, c8 + 0.8)));
    rock(ctx, 640, HY + 120, lerp(20, 130, easeOut(big)), big);
    // 角落里的 INFJ（S3）
    const nj = smooth(prog(t, c8, c9 + 0.4));
    if (nj > 0.01) { desk(ctx, 1460, HY + 220, 0.95, [130, 96, 70]); MB.person(ctx, 'infj-male', 1470, HY + 300, 2.3, { a: nj, flip: true, dim: 0.15 }); U.pool(ctx, 1470, HY + 320, 300, [180, 230, 200], 0.18 * nj); }
    // 情绪开关
    const sw = smooth(prog(t, c10 - 0.6, c10 + 0.2));
    if (sw > 0.01) {
      const press = at('C310', '不是想关'), u = prog(t, press - 0.2, press + 0.25), back = prog(t, press + 0.55, press + 0.8);
      const on = 1 - smooth(u) + easeOut(back) * 1 - (back > 0 && back < 1 ? Math.sin(back * Math.PI) * 0.15 : 0);
      lightSwitch(ctx, 1120, 930, 0.85, clamp(on), sw);
      
      L.shock(ctx, 1120, 930, t, press + 0.8, { r0: 40, r1: 300, dur: 0.9, c: GOLD, a: 0.6 * sw });
    }
    ctx.restore(); ctx.restore();
    // 前景：近处虚焦的一排课桌边
    U.blurLayer(ctx, 14, c => { c.save(); c.globalAlpha *= a; c.fillStyle = 'rgb(46,32,24)'; c.fillRect(-100, 1690, W + 200, 260); c.fillStyle = 'rgba(255,190,130,0.25)'; c.fillRect(-100, 1690, W + 200, 10); c.restore(); });
    return { pan };
  }, (ctx, t, a, st) => {
    // 「忍」字：每忍一次落进杯子的那一刻，杯子上方亮一个
    const n = [...'忍忍忍'];
    ren.forEach((t0, i) => { const v = vis(t, t0, tz + 0.8, 0.3, 0.5); if (v <= 0.003) return; K.text(ctx, n[i], 400 + i * 140, 420 + Math.sin(t * 2 + i) * 6, { size: 120, weight: 500, color: [190, 220, 255], alpha: a * v * 0.9 }); });
  });

  // ===== S4：夜里岔路口（D01–D04） =====
  const d1 = vs('D01'), d5 = vs('D05');
  const LAN = Array.from({ length: 9 }, (_, i) => i);
  add(P2.b - 0.3, d5 + 0.3, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    ctx.save(); ctx.globalAlpha *= a;
    const push = 1 + 0.06 * smooth(prog(t, d1, d5));
    ctx.translate(W / 2, 1000); ctx.scale(push, push); ctx.translate(-W / 2, -1000);
    U.vgrad(ctx, [[0, [10, 16, 34]], [0.6, [30, 38, 66]], [1, [44, 50, 74]]], -200, 1000);
    glow(ctx, 760, 260, 300, [200, 220, 255], 0.35); glow(ctx, 760, 260, 60, [240, 246, 255], 0.9);
    for (let i = 0; i < 40; i++) glow(ctx, (i * 173) % W, 80 + (i * 71) % 700, 4, [220, 230, 255], 0.3 * (0.5 + 0.5 * Math.sin(t + i)));
    // 远山
    ctx.fillStyle = 'rgb(22,28,46)'; ctx.beginPath(); ctx.moveTo(-100, 1000); for (let i = 0; i <= 12; i++) ctx.lineTo(-100 + i * 110, 900 - Math.sin(i * 1.7) * 70 - (i % 3) * 30); ctx.lineTo(W + 100, 1000); ctx.closePath(); ctx.fill();
    U.vgrad(ctx, [[0, [30, 40, 50]], [1, [10, 14, 18]]], 1000, H + 100);
    // 左：笔直的大路，一路亮起（INFJ 的方向）
    const road = smooth(prog(t, d1 + 0.3, d1 + 2.5));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    let g = ctx.createLinearGradient(0, 1000, 0, H); g.addColorStop(0, `rgba(140,190,240,${0.12 * road})`); g.addColorStop(1, `rgba(140,190,240,${0.5 * road})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(300, 1000); ctx.lineTo(330, 1000); ctx.lineTo(380, H); ctx.lineTo(-220, H); ctx.closePath(); ctx.fill();
    for (let k = 0; k < 8; k++) { const u = k / 8, y = lerp(1000, H, u * u); if (u > road) continue; U.pool(ctx, lerp(315, 80, u * u), y, lerp(18, 160, u * u), [160, 210, 255], 0.5); }
    // 右：弯弯的小路，一盏盏暖灯沿路亮（她的意义）
    const lp = smooth(prog(t, vs('D02'), vs('D04')));
    LAN.forEach(i => { const u = i / (LAN.length - 1), on = smooth(prog(lp, u - 0.1, u + 0.05)), y = lerp(H - 60, 1010, Math.sqrt(u)), x = 760 + Math.sin(u * 7) * lerp(240, 40, u), s = lerp(1.3, 0.2, Math.sqrt(u));
      U.pool(ctx, x, y, 200 * s, [255, 190, 120], 0.45 * on); glow(ctx, x, y - 60 * s, 70 * s, [255, 210, 150], 0.8 * on); });
    ctx.restore();
    // 两个人：INFJ 背影在左看着大路；她在右，举着一盏灯
    MB.person(ctx, 'infj-female', 170, 1540, 2.2, { a: 1, dim: 0.3 });
    const o = infp(ctx, 760, 1540, 0.95, { t, a: 1, flies: 1, wind: false, ra: -1.6, look: [-0.5, -0.4], dim: 0.05 });
    const hp = o.rh || [850, 1200];
    U.orb(ctx, hp[0] + 10, hp[1] - 40, 36, [255, 200, 130], 1);
    glow(ctx, hp[0], hp[1] - 40, 380, [255, 180, 110], 0.3);
    ctx.restore();
  });

  // ===== S5：冷白日光灯办公室，蜡烛越烧越短（D05–D09） =====
  const d9e = ve('D09');
  add(d5 - 0.3, G.b + 0.4, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    const u = easeInOut(prog(t, at('D06', '无趣'), d9e));
    ctx.save(); ctx.globalAlpha *= a;
    const z = 1 + 0.1 * smooth(prog(t, d5, d9e));
    ctx.translate(W / 2, 1050); ctx.scale(z, z); ctx.translate(-W / 2, -1050);
    U.vgrad(ctx, [[0, mix([60, 70, 80], [40, 44, 50], u)], [1, mix([80, 88, 96], [50, 52, 58], u)]], -200, 1000);
    // 日光灯管（有体积的灯箱，冷白光）
    for (const lx of [180, 900]) { ctx.fillStyle = 'rgb(200,210,214)'; ctx.beginPath(); ctx.roundRect(lx - 220, 120, 440, 46, 16); ctx.fill(); glow(ctx, lx, 150, 420, [210, 230, 240], 0.35 * (1 - 0.15 * Math.max(0, Math.sin(t * 31)) * u)); U.beam(ctx, lx, 170, 420, lx, 1200, 1100, [210, 225, 235], 0.1); }
    // 一排隔板工位（灰色隔板，远处一列列）
    for (let i = 0; i < 6; i++) { const x = -60 + i * 230, y = 860 + (i % 2) * 6; ctx.fillStyle = `rgb(${92 - i * 3},${100 - i * 3},${108 - i * 3})`; ctx.fillRect(x, y - 220, 200, 220); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x, y - 220, 200, 8); }
    U.floor(ctx, 1000, [70, 74, 80], [30, 32, 36], { seam: 0.12, cross: 6 });
    // 她的桌子（近景）：一叠文件越堆越高
    desk(ctx, 560, 1260, 1.9, [120, 118, 116], 0.4);
    const pile = Math.round(2 + 9 * u);
    for (let k = 0; k < pile; k++) U.paper(ctx, 600 + Math.sin(k * 2.1) * 8, 1230 - k * 16, 220, 150, Math.sin(k * 3.3) * 0.05, 1, { lines: false, glowA: 0, tint: [228, 226, 220] });
    // 她：越来越塌
    const o = infp(ctx, 300, 1430, 1.05, { t, a: 1, flies: 1, wind: false, dim: 0.1 + 0.45 * u, nod: 0.9 * u, la: 0.5 * u, ra: 0.5 * u, eyes: u > 0.6 ? 'closed' : (u > 0.3 ? 'sad' : 'open'), mouth: u > 0.3 ? 'flat' : 'smile', lean: 0.08 * u });
    // 桌上的蜡烛：越烧越短，火越来越小（她的心力）
    const ch = lerp(260, 30, u), cx = 790, cy = 1215;
    ctx.save();
    let g = ctx.createLinearGradient(cx - 34, 0, cx + 34, 0); g.addColorStop(0, 'rgb(220,206,180)'); g.addColorStop(0.4, 'rgb(250,240,222)'); g.addColorStop(1, 'rgb(196,180,156)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(cx - 34, cy - ch, 68, ch, 8); ctx.fill();
    ctx.fillStyle = 'rgb(236,226,206)'; for (let k = 0; k < 3 + 4 * u; k++) { ctx.beginPath(); ctx.ellipse(cx - 30 + k * 14 % 60, cy - ch + 14 + (k * 23) % Math.max(10, ch - 20), 9, 20 + k * 3, 0, 0, 6.283); ctx.fill(); }   // 蜡泪
    ctx.fillStyle = 'rgb(230,220,200)'; ctx.beginPath(); ctx.ellipse(cx, cy, 60 + 50 * u, 14, 0, 0, 6.283); ctx.fill();   // 底下化开的一摊
    const fl = lerp(1, 0.35, u) * (0.92 + 0.08 * Math.sin(t * 17));
    glow(ctx, cx, cy - ch - 40 * fl, 260 * fl, [255, 170, 90], 0.5 * fl);
    ctx.fillStyle = `rgba(255,${200 + 30 * fl | 0},140,0.95)`; ctx.beginPath(); ctx.ellipse(cx + Math.sin(t * 9) * 3, cy - ch - 34 * fl, 14 * fl, 34 * fl, 0, 0, 6.283); ctx.fill();
    glow(ctx, cx, cy - ch - 30 * fl, 40 * fl, [255, 250, 220], 0.9);
    ctx.restore();
    // 生无可恋：一缕青烟（D09）
    const sm = smooth(prog(t, vs('D09'), vs('D09') + 1.2));
    if (sm > 0.01) U.fog(ctx, cx, cy - ch - 140 - (t - vs('D09')) * 30, 70, t, sm * 0.6, [150, 150, 160]);
    ctx.restore();
  });
  return S;
};
