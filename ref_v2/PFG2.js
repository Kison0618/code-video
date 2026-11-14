'use strict';
// 《INFP》v2 第 2 组：B01-C103（医治者 / 修补裂痕 / 1% / 孤单与理想 / 理想主义 / 牺牲 / 童话与风车）
const X = require('./pfk');
const { infp } = require('./pf');
const MB = require('./mb');
const { C, K, L, LIME, GOLD, IVORY, PINK, BLUE, RED, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, glow, glowLine, hash, mix, rgba, noise1 } = K;
const TAU = Math.PI * 2;

// ---------- 小工具 ----------
function poly(ctx, pts) { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); }
function base(ctx, a, stops) {
  ctx.save(); ctx.globalAlpha = clamp(a * 1.5);
  const g = ctx.createLinearGradient(0, 0, 0, H); stops.forEach(([p, c]) => g.addColorStop(p, rgba(c, 1)));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}
// 体积光：从 (x0,y0) 宽 w0 到 (x1,y1) 宽 w1 的梯形，沿长度渐隐，横向软边
function beam(ctx, x0, y0, w0, x1, y1, w1, c, a) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const [k, aa] of [[1, 0.35], [0.62, 0.5], [0.3, 0.7]]) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, rgba(c, a * aa)); g.addColorStop(0.55, rgba(c, a * aa * 0.35)); g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g; poly(ctx, [[x0 - w0 * k / 2, y0], [x0 + w0 * k / 2, y0], [x1 + w1 * k / 2, y1], [x1 - w1 * k / 2, y1]]); ctx.fill();
  }
  ctx.restore();
}
function band(ctx, y, h, c, a) {
  if (a <= 0.003) return;
  ctx.save(); const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
  g.addColorStop(0, rgba(c, 0)); g.addColorStop(0.5, rgba(c, a)); g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g; ctx.fillRect(0, y - h / 2, W, h); ctx.restore();
}
function cam(ctx, s, fx, fy, cx = W / 2, cy = H / 2) { ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-fx, -fy); }
// 近景虚焦草叶（画面最下沿，字幕带以下）
function nearGrass(ctx, t, a, c = [6, 16, 14], dx = 0) {
  ctx.save(); ctx.globalAlpha *= a; ctx.filter = 'blur(7px)'; ctx.fillStyle = rgba(c, 0.95);
  for (let i = 0; i < 16; i++) {
    const x = (i / 15) * (W + 200) - 100 + dx * (0.6 + hash(i)), h = 160 + 240 * hash(i + 3), sw = Math.sin(t * 1.1 + i) * 14;
    ctx.beginPath(); ctx.moveTo(x - 26, H + 10); ctx.quadraticCurveTo(x + sw * 0.5, H - h * 0.6, x + sw + 30 * (hash(i + 9) - 0.5), H - h); ctx.quadraticCurveTo(x + 8, H - h * 0.5, x + 26, H + 10); ctx.fill();
  }
  ctx.restore();
}
function stars(ctx, t, a, n, seed, y0, y1, c = [230, 245, 220]) {
  const R = K.mulberry32(seed);
  for (let i = 0; i < n; i++) { const x = R() * W, y = lerp(y0, y1, R()), r = 1 + R() * 3, ph = R() * 6.3, sp = 0.5 + R(); glow(ctx, x, y, r * 3, c, a * (0.25 + 0.35 * Math.sin(t * sp + ph) ** 2)); }
}
function mirror(ctx, x, fn) { ctx.save(); ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); const o = fn(); ctx.restore(); const m = p => p && [2 * x - p[0], p[1]]; const r = {}; for (const k in o) r[k] = m(o[k]); return r; }
function crown(ctx, x, y, s, a) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s);
  const g = ctx.createLinearGradient(0, -46, 0, 10); g.addColorStop(0, 'rgb(255,236,170)'); g.addColorStop(1, 'rgb(214,160,70)');
  ctx.fillStyle = g; poly(ctx, [[-50, 10], [-58, -36], [-26, -10], [0, -50], [26, -10], [58, -36], [50, 10]]); ctx.fill();
  ctx.fillStyle = 'rgb(240,110,120)'; ctx.beginPath(); ctx.arc(0, -8, 7, 0, TAU); ctx.fill();
  ctx.restore(); glow(ctx, x, y - 20 * s, 110 * s, GOLD, 0.45 * a);
}

// ================= B01：草地上一本合着的书，封面《请理解我》；书翻开，书页里升起一道光柱，光里聚出「医治者」 =================
const S0 = [540, 1000], S1 = [540, 1272], R0 = [862, 1012], R1 = [978, 1290];
function pageLines(ctx, A0, A1, B0, B1, a, n = 11) {
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = 'rgba(110,92,70,0.32)'; ctx.lineWidth = 2;
  for (let k = 0; k < n; k++) { const v = 0.14 + k / n * 0.74; const p = [lerp(A0[0], A1[0], v), lerp(A0[1], A1[1], v)], q = [lerp(B0[0], B1[0], v), lerp(B0[1], B1[1], v)];
    ctx.beginPath(); ctx.moveTo(lerp(p[0], q[0], 0.12), lerp(p[1], q[1], 0.12)); ctx.lineTo(lerp(p[0], q[0], 0.86 - 0.3 * hash(k * 3.7)), lerp(p[1], q[1], 0.86 - 0.3 * hash(k * 3.7))); ctx.stroke(); }
  ctx.restore();
}
function pageFill(ctx, pts, a, warm = 0) {
  ctx.save(); ctx.globalAlpha *= a;
  const g = ctx.createLinearGradient(pts[0][0], 0, pts[1][0], 0); g.addColorStop(0, rgba(mix([196, 180, 146], [255, 236, 190], warm), 1)); g.addColorStop(1, rgba(mix([238, 228, 202], [255, 248, 222], warm), 1));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(...pts[0]);
  ctx.quadraticCurveTo((pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2 - 22, ...pts[1]); ctx.lineTo(...pts[2]);
  ctx.quadraticCurveTo((pts[2][0] + pts[3][0]) / 2, (pts[2][1] + pts[3][1]) / 2 - 26, ...pts[3]); ctx.closePath(); ctx.fill(); ctx.restore();
}
function sB1(ctx, t, a) {
  X.back(ctx, t, { floor: 0, pool: null, lift: 0.3 });
  const t0 = vs('B01'), op = easeInOut(prog(t, t0 + 0.2, t0 + 1.55)), th = Math.PI * op;
  base(ctx, a, [[0, [3, 12, 12]], [0.45, [10, 32, 28]], [0.53, [16, 44, 36]], [1, [3, 9, 8]]]);
  stars(ctx, t, a * 0.8, 50, 21, 80, 900);
  const cu = easeInOut(prog(t, t0 - 0.3, t0 + 2.0)), late = smooth(prog(t, t0 + 2.0, ve('B01') + 0.4));
  ctx.save(); cam(ctx, lerp(1.34, 1.0, cu) * (1 + 0.04 * late), lerp(770, 540, cu), lerp(1150, 1040, cu), W / 2, 1040);
  // 远山 + 地平线雾
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgb(8,24,22)'; ctx.beginPath(); ctx.moveTo(-300, 960);
  for (let x = -300; x <= W + 300; x += 60) ctx.lineTo(x, 930 - 50 * Math.abs(noise1(x * 0.006, 2)) - 30 * hash(Math.floor(x / 60)));
  ctx.lineTo(W + 300, 980); ctx.lineTo(-300, 980); ctx.fill();
  const gg = ctx.createLinearGradient(0, 950, 0, 1500); gg.addColorStop(0, 'rgb(22,54,42)'); gg.addColorStop(1, 'rgb(6,16,13)');
  ctx.fillStyle = gg; ctx.fillRect(-400, 955, W + 800, 900); ctx.restore();
  band(ctx, 955, 90, [120, 190, 150], 0.18 * a);
  // 光柱（书页里升起）
  const lit = smooth(prog(t, t0 + 0.7, t0 + 1.8));
  beam(ctx, 540, 1150, 720, 540, 40, 1250, [214, 236, 168], 0.26 * a * lit);
  for (let k = 0; k < 7; k++) { const x0 = 300 + k * 80, sw = Math.sin(t * 0.7 + k * 1.3) * 60; glowLine(ctx, [[x0, 1110], [x0 + (x0 - 540) * 0.8 + sw, 120]], [230, 240, 190], a * lit * 0.07, 10, 1.4); }
  glow(ctx, 540, 1060, 460, [255, 236, 170], 0.12 * a * lit);
  // 书：右半书芯厚度
  ctx.save(); ctx.globalAlpha *= a;
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(540, 1300, 520, 46, 0, 0, TAU); ctx.fill();
  const thick = (P0, P1, h) => { ctx.fillStyle = 'rgb(206,192,160)'; poly(ctx, [P0, P1, [P1[0], P1[1] + h], [P0[0], P0[1] + h]]); ctx.fill(); ctx.strokeStyle = 'rgba(120,100,76,0.45)'; ctx.lineWidth = 1.4; for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(P0[0], P0[1] + h * k / 5); ctx.lineTo(P1[0], P1[1] + h * k / 5); ctx.stroke(); } };
  thick(S1, R1, lerp(52, 28, op)); if (op > 0.5) thick([2 * 540 - R1[0], R1[1]], S1, 28 * smooth(prog(op, 0.5, 1)));
  ctx.restore();
  pageFill(ctx, [S0, R0, R1, S1], a * 0.92, lit * 0.15); pageLines(ctx, S0, S1, R0, R1, a * smooth(prog(op, 0.3, 0.8)));
  // 翻动的那一页：正面是封面，翻过 90° 后露出左页
  const F0 = [540 + Math.cos(th) * 322, 1006 - Math.sin(th) * 200], F1 = [540 + Math.cos(th) * 438, 1281 - Math.sin(th) * 270];
  if (th < Math.PI / 2) {
    ctx.save(); ctx.globalAlpha *= a;
    const g = ctx.createLinearGradient(540, 1000, F1[0], F1[1]); g.addColorStop(0, 'rgb(20,64,50)'); g.addColorStop(1, 'rgb(34,92,70)');
    ctx.fillStyle = g; poly(ctx, [S0, F0, F1, S1]); ctx.fill();
    ctx.strokeStyle = 'rgba(10,30,24,0.9)'; ctx.lineWidth = 6; ctx.stroke();
    const cx = (S0[0] + S1[0] + F0[0] + F1[0]) / 4, cy = (S0[1] + S1[1] + F0[1] + F1[1]) / 4, ux = ((F0[0] + F1[0]) - (S0[0] + S1[0])) / 2, uy = ((F0[1] + F1[1]) - (S0[1] + S1[1])) / 2, vx = ((S1[0] + F1[0]) - (S0[0] + F0[0])) / 2, vy = ((S1[1] + F1[1]) - (S0[1] + F0[1])) / 2;
    ctx.transform(ux / 400, uy / 400, vx / 400, vy / 400, cx, cy);
    ctx.strokeStyle = 'rgba(232,200,130,0.85)'; ctx.lineWidth = 4; ctx.strokeRect(-170, -175, 340, 350); ctx.lineWidth = 1.5; ctx.strokeRect(-150, -155, 300, 310);
    ctx.fillStyle = 'rgba(240,206,140,0.95)'; ctx.font = '600 60px Serif'; ctx.textAlign = 'center'; ctx.fillText('请理解我', 0, -10);
    ctx.font = '400 34px Serif'; ctx.fillText('凯尔西', 0, 80);
    poly(ctx, [[0, -120], [16, -100], [0, -80], [-16, -100]]); ctx.fill();
    ctx.restore();
  } else { pageFill(ctx, [S0, F0, F1, S1], a * 0.92, lit * 0.15); pageLines(ctx, S0, S1, F0, F1, a * smooth(prog(op, 0.75, 1))); }
  // 书页被风翻过去几张
  for (let k = 0; k < 3; k++) {
    const u = easeInOut(prog(t, t0 + 1.6 + k * 0.28, t0 + 2.3 + k * 0.28)); if (u <= 0 || u >= 1) continue;
    const q = Math.PI * u, Q0 = [540 + Math.cos(q) * 318, 1004 - Math.sin(q) * 210], Q1 = [540 + Math.cos(q) * 432, 1278 - Math.sin(q) * 280];
    ctx.save(); ctx.globalAlpha *= a * 0.85; ctx.fillStyle = 'rgba(250,244,222,0.8)'; ctx.beginPath(); ctx.moveTo(...S0); ctx.quadraticCurveTo((S0[0] + Q0[0]) / 2, (S0[1] + Q0[1]) / 2 - 40, ...Q0); ctx.lineTo(...Q1); ctx.quadraticCurveTo((S1[0] + Q1[0]) / 2, (S1[1] + Q1[1]) / 2 - 50, ...S1); ctx.closePath(); ctx.fill(); ctx.restore();
    glowLine(ctx, [Q0, Q1], [255, 240, 200], a * 0.6, 2, 0.8);
  }
  // 书脊上的亮缝 + 光尘升起
  glowLine(ctx, [S0, S1], [255, 244, 210], a * lit * 0.9, 3, 1.2);
  for (let i = 0; i < 70; i++) { const v = ((t - t0) * (0.12 + 0.1 * hash(i)) + hash(i + 7)) % 1, x = 540 + (hash(i * 3) - 0.5) * lerp(600, 1100, v) + Math.sin(t + i) * 20, y = lerp(1120, 150, v); glow(ctx, x, y, 4 + 7 * hash(i + 2), i % 3 ? [255, 238, 180] : LIME, a * lit * (1 - v) * 0.8); }
  ctx.restore();
  nearGrass(ctx, t, a, [4, 12, 10], -cu * 60);
}
function oB1(ctx, t, a) {
  const t0 = vs('B01');
  ctx.save(); ctx.globalAlpha *= a; C.gather(ctx, '医治者', W / 2, 640, t, t0 + 1.1, ve('B01') - 0.4, { size: 156, weight: 600, spacing: 0.16, keys: ['医治者'], keyColor: GOLD }); ctx.restore();
}

// ================= B02：俯视长地面，两人中间裂开一道从远处一直裂到镜头前的深缝；她用光一针针缝，缝过的地方灌满金（金缮），最后金缝一亮，两人重新亮起来 =================
const CK = Array.from({ length: 48 }, (_, i) => { const v = i / 47; return { v, y: 760 + 1220 * Math.pow(v, 1.5), x: 540 + noise1(v * 5, 4) * lerp(6, 70, v) + Math.sin(v * 23) * lerp(2, 12, v) }; });
function sB2(ctx, t, a) {
  X.back(ctx, t, { floor: 0, pool: null, lift: 0.3 });
  const t0 = vs('B02'), tc = at('B02', '裂痕'), tm = at('B02', '修补'), tz = at('B02', '自己'), tw = at('B02', '完整');
  const open = smooth(prog(t, t0 - 0.1, tm + 0.2)), sew = easeInOut(prog(t, tc - 0.4, tw - 0.1)), heal = smooth(prog(t, tw - 0.15, tw + 0.7)), self = smooth(prog(t, tz - 0.1, tz + 0.6));
  base(ctx, a, [[0, [4, 12, 14]], [0.36, [14, 36, 34]], [0.4, [26, 54, 44]], [1, [6, 14, 12]]]);
  stars(ctx, t, a * 0.6, 30, 33, 60, 700);
  ctx.save(); cam(ctx, 1 + 0.06 * smooth(prog(t, t0 - 0.2, ve('B02') + 0.4)), 540 + 20 * Math.sin(t * 0.3), 1020, W / 2, 1020);
  // 地面：远处雾，近处暗；地面上一行行草纹往远处退
  ctx.save(); ctx.globalAlpha *= a; const gg = ctx.createLinearGradient(0, 750, 0, H); gg.addColorStop(0, 'rgb(40,74,58)'); gg.addColorStop(0.25, 'rgb(22,46,36)'); gg.addColorStop(1, 'rgb(5,12,10)');
  ctx.fillStyle = gg; ctx.fillRect(-200, 752, W + 400, H); ctx.restore();
  for (let r = 0; r < 18; r++) { const v = r / 17, y = 760 + 1220 * Math.pow(v, 1.5); ctx.save(); ctx.globalAlpha *= a * (0.05 + 0.1 * v); ctx.strokeStyle = 'rgb(140,200,150)'; ctx.lineWidth = 1 + 2 * v; for (let k = 0; k < 14; k++) { const x = (k + 0.5 * (r % 2)) / 13 * (W + 400) - 200; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 6, y - 10 - 30 * v); ctx.stroke(); } ctx.restore(); }
  band(ctx, 760, 120, [140, 200, 170], 0.22 * a);
  // 两个人（远一点，中景）
  const LP = [165, 950], RP = [905, 940];
  const pg = 0.6 * (1 - heal) * open;
  MB.person(ctx, 'enfp-female', LP[0] - 30 * open * (1 - heal), LP[1], 1.5, { a, slump: pg, gray: pg * 0.7, dim: pg * 0.35, lean: 0.06 * heal, inner: heal, innerC: [255, 226, 160] });
  MB.person(ctx, 'isfj-male', RP[0] + 30 * open * (1 - heal), RP[1], 1.5, { a, flip: true, slump: pg, gray: pg * 0.7, dim: pg * 0.35, lean: -0.06 * heal, inner: heal, innerC: [255, 226, 160] });
  // 裂缝
  const hw = c => lerp(3, 150, Math.pow(c.v, 1.15)) * open * (1 - 0.82 * heal);
  const Lft = CK.map(c => [c.x - hw(c), c.y]), Rgt = CK.map(c => [c.x + hw(c), c.y]).reverse();
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgb(2,4,4)'; poly(ctx, [...Lft, ...Rgt]); ctx.fill();
  ctx.strokeStyle = 'rgba(120,170,140,0.25)'; ctx.lineWidth = 2; ctx.beginPath(); Lft.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.restore();
  glowLine(ctx, CK.map(c => [c.x, c.y]), RED, a * 0.45 * open * (1 - sew), 3, 1.2);
  // 分叉的小裂纹
  for (let k = 0; k < 9; k++) { const c = CK[6 + k * 4], sd = k % 2 ? 1 : -1, len = lerp(30, 160, c.v) * open; const pts = [[c.x + sd * hw(c) * 0.8, c.y], [c.x + sd * (hw(c) + len * 0.5), c.y - 10 * c.v], [c.x + sd * (hw(c) + len), c.y + 16 * c.v]]; glowLine(ctx, pts, [8, 10, 10], a * 0.9 * (1 - heal), 2 + 3 * c.v, 0.2); if (sew > 1 - c.v) glowLine(ctx, pts, GOLD, a * 0.8, 1.4 + 1.5 * c.v, 0.6); }
  // 金缮：针从近处往远处走，走过的地方灌满金
  const vn = 1 - sew, ni = CK.findIndex(c => c.v >= vn);
  if (sew > 0) {
    const seg = CK.filter(c => c.v >= vn);
    if (seg.length > 1) {
      const gl = seg.map(c => [c.x - hw(c) * 0.9, c.y]), gr = seg.map(c => [c.x + hw(c) * 0.9, c.y]).reverse();
      ctx.save(); ctx.globalAlpha *= a; const g = ctx.createLinearGradient(0, 760, 0, 1900); g.addColorStop(0, 'rgb(255,226,150)'); g.addColorStop(1, 'rgb(214,150,60)'); ctx.fillStyle = g; poly(ctx, [...gl, ...gr]); ctx.fill(); ctx.restore();
      glowLine(ctx, seg.map(c => [c.x, c.y]), GOLD, a * (0.8 + 0.6 * heal), 3 + 4 * heal, 1.4);
      // 跨缝的针脚
      seg.forEach((c, i) => { if (i % 3) return; glowLine(ctx, [[c.x - hw(c) - 14 - 20 * c.v, c.y - 8], [c.x + hw(c) + 14 + 20 * c.v, c.y + 8]], [255, 236, 180], a * 0.85, 1.6 + 2 * c.v, 0.7); });
    }
  }
  // 她：站在近处左侧，身子前倾，手里那根光线一直连到针头
  const o = infp(ctx, 330, 1318, 1.0, { a, t, lean: 0.1 * (1 - heal), nod: 0.6 * (1 - heal), ra: 0.4, la: 0.3, look: [1, 1 - heal * 1.5], eyes: heal > 0.4 ? 'happy' : 'open', mouth: heal > 0.4 ? 'smile' : 'flat', spin: t * 1.5, flies: 1, dim: 0.25 * open * (1 - self) });
  if (sew > 0 && sew < 1 && ni >= 0) {
    const c = CK[ni], nx = c.x + Math.sin(t * 22) * hw(c), ny = c.y;
    glowLine(ctx, [o.rh, [lerp(o.rh[0], nx, 0.5), Math.min(o.rh[1], ny) - 60], [nx, ny]], LIME, a * 0.9, 2, 0.8);
    glow(ctx, nx, ny, 60 + 30 * c.v, [255, 244, 200], a); for (let k = 0; k < 8; k++) { const v = ((t * 2.5) + k / 8) % 1; glow(ctx, nx + Math.cos(k * 2.4) * v * 90, ny - v * 70 + Math.sin(k) * 20, 6 * (1 - v), GOLD, a * (1 - v)); }
  }
  // 「让自己」：她自己身上也亮起一圈金
  if (self > 0) { glow(ctx, o.chest[0], o.chest[1], 220, GOLD, 0.3 * a * self); L.shock(ctx, o.chest[0], o.chest[1], t, tz + 0.1, { r0: 20, r1: 260, dur: 1.0, c: GOLD, a }); }
  // 「完整」：金缝从近到远亮一遍，冲击波沿缝扩散到两人脚下
  if (heal > 0) { const pv = prog(t, tw - 0.1, tw + 0.9); CK.forEach((c, i) => { const d = Math.abs(c.v - (1 - pv)); if (d < 0.12) glow(ctx, c.x, c.y, 90 + 120 * c.v, [255, 240, 190], a * (1 - d / 0.12) * 0.7); });
    for (const P of [LP, RP]) { ctx.save(); ctx.translate(P[0], P[1]); ctx.scale(1, 0.22); L.shock(ctx, 0, 0, t, tw + 0.5, { r0: 30, r1: 420, dur: 1.1, c: GOLD, a }); ctx.restore(); } }
  ctx.restore();
  nearGrass(ctx, t, a, [4, 10, 9], 0);
}

// ================= B03：高处俯看一大片人往远处排到雾里；念到「百分之一」，所有人暗下去，天上一道光只落在她一个人身上，镜头推过去 =================
const TYPES = ['istj-male', 'isfj-female', 'estj-male', 'esfj-female', 'istp-male', 'isfp-male', 'estp-male', 'esfp-female', 'intj-male', 'intp-female', 'entj-female', 'entp-male', 'enfj-male', 'enfp-female', 'infj-female', 'istj-female', 'esfj-male', 'isfp-female'];
const ROWS = 11, COLS = 10, ME = [3, 6];
const gridPos = (r, c) => { const d = 1.08 + r * 0.34, X0 = (c - (COLS - 1) / 2) * 0.125 + (r % 2 ? 0.03 : -0.03); return [540 + X0 * 900 / d, 520 + 760 / d, 1 / d]; };
function sB3(ctx, t, a) {
  X.back(ctx, t, { floor: 0, pool: null, lift: 0.3 });
  const t0 = vs('B03'), tp = at('B03', '百分之一'), few = smooth(prog(t, tp - 0.35, tp + 0.4));
  base(ctx, a, [[0, [3, 9, 12]], [0.27, [14, 30, 34]], [0.3, [22, 44, 42]], [1, [4, 10, 10]]]);
  const [mx, my, ms] = gridPos(...ME);
  const pu = easeInOut(prog(t, tp, ve('B03') + 0.5));
  ctx.save(); cam(ctx, lerp(1.0, 1.55, pu) * (1 + 0.03 * smooth(prog(t, t0 - 0.2, tp))), lerp(540, mx, pu), lerp(900, my - 80, pu), W / 2, lerp(900, 860, pu));
  // 地面：透视网格往远处退进雾
  ctx.save(); ctx.globalAlpha *= a; const gg = ctx.createLinearGradient(0, 560, 0, 1500); gg.addColorStop(0, 'rgb(30,56,50)'); gg.addColorStop(1, 'rgb(8,18,16)'); ctx.fillStyle = gg; ctx.fillRect(-300, 570, W + 600, 1400); ctx.restore();
  for (let k = -12; k <= 12; k++) glowLine(ctx, [[540 + k * 8, 580], [540 + k * 230, 1900]], [120, 180, 160], a * 0.06, 1.2, 0.3);
  for (let r = 0; r < 16; r++) { const d = 1 + r * 0.32, y = 520 + 760 / d; glowLine(ctx, [[-300, y], [W + 300, y]], [120, 180, 160], a * 0.05 * (1 - r / 16), 1.2, 0.3); }
  // 人群：从远往近画
  for (let r = ROWS - 1; r >= 0; r--) {
    const fogA = 1 - smooth(prog(r, 5, ROWS));
    for (let c = 0; c < COLS; c++) {
      const [x, y, s] = gridPos(r, c), i = r * COLS + c;
      if (r === ME[0] && c === ME[1]) { infp(ctx, x, y, s * 0.43, { a, t, flies: 1, spin: t * 3, look: [0, -1 * few], eyes: few > 0.5 ? 'wide' : 'open', dim: 0 }); continue; }
      const dk = smooth(prog(t, tp - 0.35 + hash(i) * 0.5, tp + 0.15 + hash(i) * 0.5));
      MB.person(ctx, TYPES[(i * 7) % TYPES.length], x, y, s, { a: a * lerp(0.95, 0.4, dk) * (0.35 + 0.65 * fogA), gray: dk * 0.85, dim: dk * 0.55, bob: Math.abs(Math.sin(t * 2.2 + i)) * 3 * s * (1 - dk) });
    }
    if (r === 5) band(ctx, gridPos(r, 0)[1] - 40, 140, [30, 56, 54], 0.5 * a);
  }
  // 天上落下的一道光
  const bl = easeOut(prog(t, tp - 0.1, tp + 0.35));
  if (bl > 0) {
    beam(ctx, mx, my + 6, 170 * ms * 2.2, mx + 60, -200, 520, [230, 250, 190], a * bl * 0.55);
    ctx.save(); ctx.translate(mx, my); ctx.scale(1, 0.25); glow(ctx, 0, 0, 260 * ms * 2, [220, 250, 170], a * bl * 0.9); L.shock(ctx, 0, 0, t, tp + 0.25, { r0: 20, r1: 520 * ms * 2, dur: 1.1, c: LIME, a }); ctx.restore();
    for (let k = 0; k < 24; k++) { const v = ((t - tp) * 0.5 + hash(k)) % 1; glow(ctx, mx + (hash(k + 3) - 0.5) * 140 * ms * 2 + v * 30, lerp(my, my - 700, 1 - v), 3 + 3 * hash(k), [255, 250, 220], a * bl * v * 0.8); }
  }
  ctx.restore();
}
function oB3(ctx, t, a) {
  const tp = at('B03', '百分之一'), pa = a * smooth(prog(t, tp - 0.05, tp + 0.3)), pop = easeOut(prog(t, tp, tp + 0.45));
  if (pa <= 0.003) return;
  ctx.save(); ctx.translate(W / 2, 360); ctx.scale(0.75 + 0.25 * pop, 0.75 + 0.25 * pop);
  ctx.shadowColor = rgba(LIME, 0.55 * pa); ctx.shadowBlur = 70;
  K.text(ctx, '1%', 0, 60, { size: 230, weight: 700, color: LIME, alpha: pa, align: 'center', spacing: 0.02 });
  ctx.restore();
}

// ================= B04：大远景，她一个人站在山脊上，远处几个人走散；她胸口一道光升上天，开成一颗比她大很多倍的光球（理想）；念到「孤单」整片天转冷 =================
function hillY(x) { return 1215 + Math.pow((x - 330) / 520, 2) * 170 + Math.sin(x * 0.01) * 10; }
function sB4(ctx, t, a) {
  X.back(ctx, t, { floor: 0, pool: null, lift: 0.3 });
  const t0 = vs('B04'), tr = at('B04', '独处'), tl = at('B04', '理想'), tg = at('B04', '孤单');
  const mood = smooth(prog(t, tg - 0.5, tg + 1.0)), grow = easeOut(prog(t, tl - 0.2, tl + 1.3)), rise = easeInOut(prog(t, tl - 0.7, tl + 0.4));
  const sky0 = mix([4, 14, 16], [3, 8, 22], mood), sky1 = mix([14, 40, 36], [12, 26, 52], mood);
  base(ctx, a, [[0, sky0], [0.6, sky1], [0.66, mix([20, 48, 42], [16, 30, 56], mood)], [1, [2, 6, 8]]]);
  stars(ctx, t, a * (0.7 + 0.5 * mood), 110, 44, 40, 1000, mix([230, 245, 210], [200, 215, 255], mood));
  const cu = easeInOut(prog(t, t0 - 0.2, tl + 1.2)), back2 = smooth(prog(t, tg - 0.2, vs('C101')));
  const s = lerp(1.3, 1.0, cu) * (1 - 0.05 * back2), oy = lerp(-240, 0, cu);
  ctx.save(); cam(ctx, s, lerp(380, 540, cu), lerp(1060, 900, cu) + oy * 0.2, W / 2, 900);
  // 光球（远景，几乎不随镜头动）
  const OX = 640, OY = 560, OR = 330 * grow * (1 - 0.1 * mood);
  if (OR > 4) {
    const oc = mix([255, 232, 170], [190, 214, 255], mood * 0.7);
    glow(ctx, OX, OY, OR * 2.4, oc, 0.22 * a); glow(ctx, OX, OY, OR * 1.2, oc, 0.3 * a);
    ctx.save(); ctx.globalAlpha *= a * 0.92; const g = ctx.createRadialGradient(OX - OR * 0.3, OY - OR * 0.35, OR * 0.1, OX, OY, OR); g.addColorStop(0, rgba(mix(oc, [255, 255, 245], 0.6), 0.95)); g.addColorStop(0.7, rgba(oc, 0.55)); g.addColorStop(1, rgba(oc, 0.12));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(OX, OY, OR, 0, TAU); ctx.fill();
    // 球里的小世界剪影：沿下沿一圈房子和树
    ctx.save(); ctx.beginPath(); ctx.arc(OX, OY, OR * 0.98, 0, TAU); ctx.clip(); ctx.fillStyle = rgba(mix([60, 110, 90], [60, 80, 130], mood), 0.75);
    ctx.beginPath(); ctx.moveTo(OX - OR, OY + OR); for (let x = -OR; x <= OR; x += 8) ctx.lineTo(OX + x, OY + OR * 0.55 - Math.cos(x / OR * 1.6) * OR * 0.12); ctx.lineTo(OX + OR, OY + OR); ctx.fill();
    for (let k = 0; k < 9; k++) { const x = OX - OR * 0.75 + k * OR * 0.19, y = OY + OR * 0.5 - Math.cos((x - OX) / OR * 1.6) * OR * 0.12, hh = OR * (0.08 + 0.08 * hash(k)); if (k % 3 === 1) { ctx.fillRect(x - hh * 0.4, y - hh, hh * 0.8, hh); poly(ctx, [[x - hh * 0.55, y - hh], [x, y - hh * 1.6], [x + hh * 0.55, y - hh]]); ctx.fill(); glow(ctx, x, y - hh * 0.5, hh * 0.5, [255, 230, 160], a * 0.8); } else { ctx.beginPath(); ctx.arc(x, y - hh * 1.1, hh * 0.55, 0, TAU); ctx.fill(); ctx.fillRect(x - 2, y - hh * 0.8, 4, hh * 0.8); } }
    ctx.restore(); ctx.restore();
    for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate(OX, OY); ctx.rotate(-0.35 + k * 0.5 + t * 0.05 * (k + 1)); L.ellipse(ctx, 0, 0, OR * (1.25 + k * 0.18), OR * (0.28 + k * 0.05), oc, a * 0.35 * grow, 1.6); ctx.restore(); }
  }
  // 远处山
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = rgba(mix([10, 28, 28], [10, 18, 36], mood), 1); ctx.beginPath(); ctx.moveTo(-300, 1250);
  for (let x = -300; x <= W + 300; x += 50) ctx.lineTo(x, 1090 - 90 * Math.abs(noise1(x * 0.004, 7)) - 20 * hash(x)); ctx.lineTo(W + 300, 1300); ctx.lineTo(-300, 1300); ctx.fill(); ctx.restore();
  band(ctx, 1110, 110, mix([90, 150, 130], [80, 100, 160], mood), 0.18 * a);
  // 远处走散的几个人（站在远山脚下，越走越淡）
  const away = smooth(prog(t, t0 - 0.2, tr + 0.4));
  for (let i = 0; i < 4; i++) { const x = 700 + i * 90 + away * (120 + i * 70), y = 1150 + (i % 2) * 14; MB.person(ctx, TYPES[(i * 5 + 3) % TYPES.length], x, y, 0.42, { a: a * (1 - away) * 0.6, dim: 0.4, flip: false }); }
  // 山脊（中景）
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgb(4,10,10)'; ctx.beginPath(); ctx.moveTo(-300, H); for (let x = -300; x <= W + 300; x += 20) ctx.lineTo(x, hillY(x)); ctx.lineTo(W + 300, H); ctx.fill();
  ctx.strokeStyle = rgba(mix([200, 230, 170], [170, 190, 255], mood), 0.35 * (0.5 + grow)); ctx.lineWidth = 3; ctx.beginPath(); for (let x = -300; x <= W + 300; x += 20) x === -300 ? ctx.moveTo(x, hillY(x)) : ctx.lineTo(x, hillY(x)); ctx.stroke(); ctx.restore();
  // 她
  const o = infp(ctx, 330, hillY(330) + 4, 0.66, { a, t, look: [1, -1.2 * rise], tilt: -0.3 * rise, eyes: mood > 0.5 ? 'sad' : 'open', mouth: mood > 0.5 ? 'flat' : 'smile', ra: 0.5, la: 0.35, spin: t * 0.25, flies: 1, dim: mood * 0.2 });
  // 胸口升起的那道光
  if (rise > 0) { const p = K.partial([o.chest, [lerp(o.chest[0], OX, 0.4), o.chest[1] - 260], [OX - 60, OY + OR * 0.6 + 120], [OX, OY + OR * 0.5]], rise); glowLine(ctx, p, [255, 236, 180], a * (1 - 0.6 * grow) * 0.9, 2.4, 1.2); glow(ctx, ...p[p.length - 1], 40, [255, 246, 210], a * (1 - grow)); }
  glow(ctx, o.chest[0], o.chest[1], 60, mix(GOLD, BLUE, mood), a * 0.4);
  // 她身后被光拉长的影子
  ctx.save(); ctx.globalAlpha *= a * 0.5 * grow; ctx.fillStyle = 'rgb(0,0,0)'; ctx.beginPath(); ctx.ellipse(250, hillY(250) + 10, 140, 10, -0.15, 0, TAU); ctx.fill(); ctx.restore();
  // 冷下来以后飘过的一颗流星
  if (mood > 0.2) { const v = prog(t, tg + 0.4, tg + 1.6); if (v > 0 && v < 1) glowLine(ctx, [[900 - v * 600, 200 + v * 220], [960 - v * 600, 175 + v * 220]], [220, 230, 255], a * Math.sin(v * Math.PI), 2, 1); }
  ctx.restore();
  nearGrass(ctx, t, a, [2, 6, 7], (1 - cu) * 120);
}

// ================= C101：中近景，她举起风车，风车上吹出一个大玻璃球；球里是她心里那个世界该有的样子：日出、小房子、花开，一群小人手拉手围成一圈 =================
function sC1(ctx, t, a) {
  X.back(ctx, t, { floor: 0, pool: null, lift: 0.3 });
  const t0 = vs('C101'), ti = at('C101', '理想化'), tw = at('C101', '美好'), td = at('C101', '道德');
  const blow = easeOut(prog(t, t0 - 0.2, ti + 0.6)), bloom = smooth(prog(t, tw - 0.3, tw + 0.8)), ring = smooth(prog(t, td - 0.3, td + 0.7));
  base(ctx, a, [[0, [5, 14, 16]], [0.5, [16, 40, 36]], [0.7, [18, 42, 34]], [1, [4, 10, 9]]]);
  stars(ctx, t, a * 0.5, 40, 55, 60, 1100);
  const G = [680, 660], push = smooth(prog(t, tw - 0.5, ve('C102') + 0.4));
  ctx.save(); cam(ctx, 1 + 0.12 * push, lerp(540, G[0] - 60, push), lerp(980, G[1] + 120, push), W / 2, lerp(980, 860, push));
  // 远处虚焦的树影（后景）
  ctx.save(); ctx.globalAlpha *= a * 0.6; ctx.filter = 'blur(10px)'; ctx.fillStyle = 'rgb(10,30,26)';
  for (let k = 0; k < 6; k++) { const x = 60 + k * 200, h = 260 + 120 * hash(k + 11); ctx.beginPath(); ctx.ellipse(x, 1120 - h, 120, h * 0.6, 0, 0, TAU); ctx.fill(); ctx.fillRect(x - 10, 1120 - h * 0.6, 20, h * 0.6); }
  ctx.restore();
  // 地面
  ctx.save(); ctx.globalAlpha *= a; const gg = ctx.createLinearGradient(0, 1100, 0, H); gg.addColorStop(0, 'rgb(26,56,44)'); gg.addColorStop(1, 'rgb(5,12,10)'); ctx.fillStyle = gg; ctx.fillRect(-300, 1110, W + 600, 1000); ctx.restore();
  band(ctx, 1112, 80, [150, 210, 170], 0.16 * a);
  const o = infp(ctx, 300, 1330, 1.18, { a, t, ra: lerp(0.2, -0.85, blow), la: 0.3, look: [1, -1], tilt: -0.2, eyes: bloom > 0.4 ? 'happy' : 'open', mouth: 'smile', spin: t * (1 + 4 * (1 - blow)), flies: 1 });
  // 玻璃球：从风车上吹出来，越胀越大，飘到右上
  const R = lerp(30, 290, blow), cx = lerp(o.wheel[0] + 30, G[0], blow), cy = lerp(o.wheel[1] - 30, G[1], blow) + Math.sin(t * 1.1) * 8 * blow;
  glow(ctx, cx, cy, R * 2.1, [255, 226, 170], 0.18 * a * (0.4 + bloom));
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
  ctx.globalAlpha *= a;
  const sky = ctx.createLinearGradient(0, cy - R, 0, cy + R); sky.addColorStop(0, rgba(mix([20, 40, 70], [90, 150, 200], bloom))); sky.addColorStop(0.6, rgba(mix([60, 60, 80], [255, 200, 160], bloom))); sky.addColorStop(1, 'rgb(60,110,80)');
  ctx.fillStyle = sky; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  const sx = cx + R * 0.28, sy = cy + R * lerp(0.3, -0.1, bloom);
  glow(ctx, sx, sy, R * 0.9, [255, 220, 160], 0.6 * (0.3 + bloom)); ctx.fillStyle = 'rgb(255,240,200)'; ctx.beginPath(); ctx.arc(sx, sy, R * 0.12, 0, TAU); ctx.fill();
  // 彩虹
  if (bloom > 0) for (let k = 0; k < 5; k++) { ctx.strokeStyle = rgba([[240, 120, 120], [250, 190, 110], [240, 230, 130], [140, 210, 150], [140, 180, 240]][k], 0.5 * bloom); ctx.lineWidth = R * 0.035; ctx.beginPath(); ctx.arc(cx - R * 0.1, cy + R * 0.45, R * (0.78 - k * 0.04), Math.PI * 1.05, Math.PI * lerp(1.05, 1.95, bloom)); ctx.stroke(); }
  // 两层山丘（视差）
  const hl = (yy, amp, ph, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx - R, cy + R); for (let x = -R; x <= R; x += 6) ctx.lineTo(cx + x, cy + yy * R - Math.cos(x / R * 2 + ph + t * 0.1) * amp * R); ctx.lineTo(cx + R, cy + R); ctx.fill(); };
  hl(0.32, 0.1, 0.5, 'rgb(80,150,110)'); hl(0.5, 0.06, 2.0, 'rgb(60,128,90)');
  // 小房子
  const hx = cx - R * 0.42, hy = cy + R * 0.4;
  ctx.fillStyle = 'rgb(250,236,210)'; ctx.fillRect(hx - R * 0.09, hy - R * 0.13, R * 0.18, R * 0.13); ctx.fillStyle = 'rgb(220,110,100)'; poly(ctx, [[hx - R * 0.12, hy - R * 0.13], [hx, hy - R * 0.25], [hx + R * 0.12, hy - R * 0.13]]); ctx.fill();
  ctx.fillStyle = 'rgb(255,210,130)'; ctx.fillRect(hx - R * 0.03, hy - R * 0.09, R * 0.05, R * 0.05);
  // 花一朵朵开
  for (let k = 0; k < 14; k++) { const fx = cx - R * 0.8 + k * R * 0.12, fy = cy + R * (0.62 + 0.12 * hash(k)), u = smooth(prog(bloom, k / 20, k / 20 + 0.4)); if (u <= 0) continue; ctx.strokeStyle = 'rgb(90,160,100)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - R * 0.08 * u); ctx.stroke(); ctx.fillStyle = rgba(k % 3 ? PINK : [255, 230, 140]); ctx.beginPath(); ctx.arc(fx, fy - R * 0.08 * u, R * 0.025 * u, 0, TAU); ctx.fill(); }
  // 手拉手的一圈小人（讲道德：谁也不落下）
  const N = 7, rc = [cx + R * 0.22, cy + R * 0.56];
  const ps = []; for (let k = 0; k < N; k++) { const an = k / N * TAU + t * 0.25; ps.push([rc[0] + Math.cos(an) * R * 0.3, rc[1] + Math.sin(an) * R * 0.07, Math.sin(an)]); }
  ps.slice().sort((p, q) => p[2] - q[2]).forEach((p, k) => { ctx.fillStyle = rgba(mix([60, 90, 80], [255, 236, 200], ring * (0.6 + 0.4 * (p[2] + 1) / 2))); ctx.beginPath(); ctx.arc(p[0], p[1] - R * 0.11, R * 0.028, 0, TAU); ctx.fill(); ctx.fillRect(p[0] - R * 0.02, p[1] - R * 0.08, R * 0.04, R * 0.08); });
  if (ring > 0) glowLine(ctx, [...ps.map(p => [p[0], p[1] - R * 0.06]), [ps[0][0], ps[0][1] - R * 0.06]], [255, 236, 180], ring, 1.6, 0.8);
  ctx.restore();
  // 玻璃：边缘、高光、底部折射
  ctx.save(); ctx.globalAlpha *= a;
  const rim = ctx.createRadialGradient(cx, cy, R * 0.75, cx, cy, R); rim.addColorStop(0, 'rgba(255,255,255,0)'); rim.addColorStop(1, 'rgba(220,250,240,0.35)'); ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(230,255,240,0.55)'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = R * 0.05; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.86, Math.PI * 1.12, Math.PI * 1.42); ctx.stroke();
  ctx.restore();
  glow(ctx, cx - R * 0.45, cy - R * 0.5, R * 0.16, [255, 255, 255], a * 0.8);
  ctx.save(); ctx.translate(cx, 1290); ctx.scale(1, 0.14); glow(ctx, 0, 0, R * 1.3, [255, 220, 170], a * 0.5 * blow); ctx.restore();
  // 球周围飘的光点
  for (let k = 0; k < 26; k++) { const an = k * 2.4 + t * (0.2 + 0.1 * hash(k)), rr = R * (1.1 + 0.4 * hash(k + 4)); glow(ctx, cx + Math.cos(an) * rr, cy + Math.sin(an) * rr * 0.8, 4 + 5 * hash(k), k % 2 ? LIME : [255, 236, 190], a * blow * (0.3 + 0.5 * Math.sin(t * 2 + k) ** 2)); }
  ctx.restore();
  nearGrass(ctx, t, a, [4, 10, 9], push * -80);
}

// ================= C102：侧面低机位，左边黑风暴裹着碎片砸过来，她转身面向风暴，把风车转成一面光盾挡在两个人前面；念到「牺牲」最大一波砸上来，她身上的光被打散，飘到身后的人身上 =================
function sC2(ctx, t, a) {
  X.back(ctx, t, { floor: 0, pool: null, lift: 0.3 });
  const t0 = vs('C102'), ts = at('C102', '牺牲'), sh = easeOut(prog(t, t0 - 0.1, t0 + 0.7)), hit = prog(t, ts - 0.35, ts), after = smooth(prog(t, ts, ts + 0.9));
  // 冷暖两半的天
  ctx.save(); ctx.globalAlpha = clamp(a * 1.5); const g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgb(10,8,24)'); g.addColorStop(0.45, 'rgb(12,22,30)'); g.addColorStop(1, 'rgb(34,40,26)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  const shake = Math.exp(-Math.max(0, t - ts) * 6) * (t > ts ? 1 : 0) * 10;
  ctx.save(); cam(ctx, 1.04 + 0.04 * smooth(prog(t, t0 - 0.2, ve('C102') + 0.4)), 560 + Math.sin(t * 40) * shake, 1000 + Math.cos(t * 37) * shake, W / 2, 1000);
  // 远处被风暴压弯的地平线、雾
  ctx.save(); ctx.globalAlpha *= a; const gg = ctx.createLinearGradient(0, 1150, 0, H); gg.addColorStop(0, 'rgb(20,30,32)'); gg.addColorStop(1, 'rgb(4,6,8)'); ctx.fillStyle = gg; ctx.fillRect(-200, 1180, W + 400, 900); ctx.restore();
  // 左边的风暴云团
  for (let k = 0; k < 18; k++) { const x = -120 + 260 * hash(k) + Math.sin(t * 1.4 + k) * 30 + 260 * smooth(hit) * (1 - after), y = 300 + k * 60 + Math.cos(t + k) * 20; ctx.save(); ctx.globalAlpha *= a * 0.75; ctx.fillStyle = rgba(mix([24, 18, 46], [50, 36, 80], hash(k + 5))); ctx.beginPath(); ctx.arc(x, y, 120 + 80 * hash(k + 2), 0, TAU); ctx.fill(); ctx.restore(); }
  for (let k = 0; k < 3; k++) { const fl = Math.max(0, Math.sin(t * 3.1 + k * 2.2)) ** 18; if (fl > 0.05) glowLine(ctx, [[60 + k * 70, 300 + k * 200], [140 + k * 60, 420 + k * 200], [90 + k * 70, 520 + k * 200], [180 + k * 50, 640 + k * 200]], [190, 170, 255], a * fl, 2.4, 1.2); }
  // 身后被护住的两个人：暖光
  glow(ctx, 860, 1060, 420, [255, 210, 140], a * 0.28 * (0.6 + 0.6 * after));
  MB.person(ctx, 'isfj-female', 830, 1290, 1.75, { a, flip: true, warm: 0.4 + 0.5 * after, inner: 0.4 + 0.6 * after, innerC: [255, 220, 150] });
  MB.person(ctx, 'esfp-male', 975, 1300, 1.3, { a, flip: true, warm: 0.4 + 0.5 * after, inner: 0.3 + 0.6 * after, innerC: [255, 220, 150] });
  // 她：朝左，风车举在身前
  const dim = 0.1 + 0.4 * after, push = smooth(hit) * (1 - after * 0.6);
  const o = mirror(ctx, 560, () => infp(ctx, 560 + 20 * push, 1300, 1.12, { a, t, ra: -0.75, la: 0.45, lean: -0.1 * push + 0.03, eyes: hit > 0.6 && after < 0.5 ? 'closed' : 'open', mouth: 'flat', spin: t * 14, wind: true, flies: after > 0.6 ? 0 : 1, dim }));
  // 光盾
  const SC = [o.wheel[0] - 120, o.wheel[1] + 20], SR = 330 * sh, flash = Math.exp(-Math.max(0, t - ts) * 4) * (t > ts ? 1 : 0);
  if (SR > 5) {
    ctx.save(); ctx.translate(...SC);
    ctx.save(); ctx.scale(0.42, 1); glow(ctx, 0, 0, SR * 1.5, LIME, a * (0.45 + 0.5 * flash));
    const sg = ctx.createRadialGradient(0, 0, SR * 0.2, 0, 0, SR); sg.addColorStop(0, rgba(LIME, 0.05 * a)); sg.addColorStop(0.85, rgba(LIME, (0.22 + 0.3 * flash) * a)); sg.addColorStop(1, rgba([250, 255, 220], (0.5 + 0.4 * flash) * a));
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 0, SR, 0, TAU); ctx.fill();
    for (let k = 0; k < 5; k++) { const v = ((t * 0.9 + k / 5) % 1); ctx.strokeStyle = rgba(LIME, 0.3 * (1 - v) * a); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, SR * v, 0, TAU); ctx.stroke(); }
    ctx.restore();
    L.ellipse(ctx, 0, 0, SR * 0.42, SR, LIME, a * (0.8 + 0.2 * flash), 3.2); L.ellipse(ctx, 0, 0, SR * 0.24, SR * 0.78, [240, 250, 200], a * 0.4, 1.4);
    for (let k = 0; k < 4; k++) { const an = t * 9 + k * Math.PI / 2; glowLine(ctx, [[0, 0], [Math.cos(an) * SR * 0.3, Math.sin(an) * SR * 0.95]], LIME, a * 0.35, 6, 1.2); }
    ctx.restore();
  }
  // 碎片：从左边飞来，撞到盾面炸成火花
  const sx = (y) => SC[0] - SR * 0.42 * Math.sqrt(Math.max(0, 1 - ((y - SC[1]) / SR) ** 2));
  for (let i = 0; i < 70; i++) {
    const sp = 900 + 400 * hash(i), per = 1.4, ph = ((t * sp / 1000 + hash(i + 1) * per) % per) / per, y = SC[1] + (hash(i + 2) - 0.5) * SR * 1.7 + Math.sin(i) * 20, xs = -150 + ph * 900, wall = Math.abs(y - SC[1]) < SR * 0.98 ? sx(y) : W + 200;
    if (xs < wall) { const L0 = 40 + 50 * hash(i + 3); glowLine(ctx, [[xs - L0 * 2, y - L0 * 0.2], [xs, y]], [170, 150, 240], a * 0.8 * sh, 2.2, 0.8); ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgb(70,56,110)'; ctx.translate(xs, y); ctx.rotate(t * 6 + i); poly(ctx, [[-14, -6], [10, -10], [16, 6], [-6, 10]]); ctx.fill(); ctx.restore(); }
    else if (xs < wall + 70 && wall < W) { const v = (xs - wall) / 70; for (let k = 0; k < 4; k++) glow(ctx, wall - v * 70 * Math.cos(k * 1.3), y + (k - 1.5) * 18 * v, 7 * (1 - v), [255, 250, 210], a * (1 - v)); }
  }
  // 最大的一波
  if (hit > 0 && after < 1) { const xw = lerp(-500, sx(SC[1]) - 260, easeIn(hit)) - after * 200; ctx.save(); ctx.globalAlpha *= a * (1 - after); ctx.fillStyle = 'rgb(18,12,34)'; ctx.beginPath(); ctx.ellipse(xw, SC[1], 300, SR * 1.15, 0, 0, TAU); ctx.fill(); ctx.restore(); glowLine(ctx, Array.from({ length: 30 }, (_, k) => { const an = -Math.PI / 2 + k / 29 * Math.PI; return [xw + Math.cos(an) * 300, SC[1] + Math.sin(an) * SR * 1.15]; }), [170, 140, 255], a * (1 - after) * 0.8, 3, 1.2); }
  if (t > ts) { ctx.save(); ctx.translate(...SC); ctx.scale(0.4, 1); L.shock(ctx, 0, 0, t, ts, { r0: 40, r1: SR * 1.6, dur: 0.8, c: [255, 250, 220], a }); ctx.restore(); }
  // 她身上的光被打散，飘去身后的人
  if (t > ts - 0.05) for (let k = 0; k < 40; k++) { const v = clamp((t - ts - hash(k) * 0.6) / (1.5 + hash(k + 2))); if (v <= 0 || v >= 1) continue; const p0 = [o.chest[0] + (hash(k + 4) - 0.5) * 120, o.chest[1] + (hash(k + 6) - 0.5) * 260], p1 = [k % 2 ? 830 : 975, k % 2 ? 1020 : 1090]; const e = easeInOut(v); glow(ctx, lerp(p0[0], p1[0], e), lerp(p0[1], p1[1], e) - Math.sin(v * Math.PI) * 160, 8 + 6 * hash(k), k % 3 ? GOLD : LIME, a * Math.sin(v * Math.PI)); }
  // 雨
  for (let i = 0; i < 90; i++) { const v = ((t * (1.4 + hash(i)) + hash(i + 9)) % 1), x = hash(i + 4) * (W + 400) - 200 + v * 260, y = v * (H + 200) - 100; glowLine(ctx, [[x, y], [x - 26, y - 70]], [150, 160, 210], a * 0.18, 1, 0.3); }
  ctx.restore();
  nearGrass(ctx, t, a, [3, 4, 8], Math.sin(t * 2) * 30);
}

// ================= C103：纸片剧场（童话书立体页）。先是一层层纸城堡和树，她戴王冠站在中间；念到「冲向风车」，城堡那几层纸往下折倒，一架巨大的纸风车和大月亮立起来，她举着风车当长矛冲过去 =================
function paper(ctx, a, fold, baseY, col, draw, shadow = 1) {
  if (fold <= 0.01 || a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(0, baseY); ctx.scale(1, fold); ctx.translate(0, -baseY);
  ctx.shadowColor = `rgba(0,0,0,${0.55 * shadow})`; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
  ctx.fillStyle = rgba(col); ctx.beginPath(); draw(); ctx.fill();
  ctx.shadowColor = 'rgba(0,0,0,0)'; ctx.strokeStyle = rgba(mix(col, [255, 250, 230], 0.35), 0.6); ctx.lineWidth = 2.5; ctx.stroke();
  ctx.restore();
}
function sC3(ctx, t, a) {
  X.back(ctx, t, { floor: 0, pool: null, lift: 0.3 });
  const t0 = vs('C103'), tf = at('C103', '童话'), tq = at('C103', '冲向'), tm = at('C103', '堂吉诃德');
  const upA = easeOut(prog(t, t0 - 0.2, tf + 0.5)), dnA = smooth(prog(t, tq - 0.55, tq)), fA = upA * (1 - dnA);
  const fB = Math.min(1.06, easeOut(prog(t, tq - 0.15, tq + 0.5)) * 1.06) - 0.06 * smooth(prog(t, tq + 0.5, tq + 0.8));
  const run = easeIn(prog(t, tq + 0.1, ve('C103') + 0.6)), drift = run * 160;
  const warm = smooth(prog(t, tq - 0.3, tq + 0.4));
  base(ctx, a, [[0, mix([10, 18, 34], [26, 18, 30], warm)], [0.55, mix([28, 44, 60], [70, 46, 44], warm)], [0.68, mix([30, 54, 52], [60, 50, 40], warm)], [1, [8, 10, 10]]]);
  // 纸星星挂在线上晃
  for (let k = 0; k < 7; k++) { const x = 90 + k * 150, len = 180 + 160 * hash(k), sw = Math.sin(t * 1.3 + k) * 0.06, ex = x + Math.sin(sw) * len, ey = 40 + len; ctx.save(); ctx.globalAlpha *= a * 0.7; ctx.strokeStyle = 'rgba(230,220,190,0.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(ex, ey); ctx.stroke(); ctx.restore(); glow(ctx, ex, ey + 14, 30, GOLD, a * 0.5); ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgb(246,222,150)'; ctx.translate(ex, ey + 14); ctx.rotate(sw * 3); poly(ctx, Array.from({ length: 10 }, (_, j) => { const r = j % 2 ? 9 : 22, an = -Math.PI / 2 + j * Math.PI / 5; return [Math.cos(an) * r, Math.sin(an) * r]; })); ctx.fill(); ctx.restore(); }
  ctx.save(); cam(ctx, 1 + 0.05 * smooth(prog(t, t0 - 0.2, ve('C103') + 0.5)), 540, 1000, W / 2, 1000);
  // 月亮（两幕共用，第二幕变大变暖、被风车挡住一角）
  const MR = lerp(170, 330, warm), MX = lerp(540, 700, warm), MY = lerp(470, 560, warm);
  glow(ctx, MX, MY, MR * 2.3, mix([220, 230, 255], [255, 210, 150], warm), 0.28 * a);
  ctx.save(); ctx.globalAlpha *= a; ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 30; ctx.fillStyle = rgba(mix([236, 236, 220], [255, 226, 170], warm)); ctx.beginPath(); ctx.arc(MX - drift * 0.15, MY, MR, 0, TAU); ctx.fill(); ctx.restore();
  // ---- 第一幕：城堡、树丛 ----
  paper(ctx, a, fA, 1120, [40, 66, 80], () => { ctx.moveTo(120, 1120); const tw = [[180, 760, 70], [330, 640, 90], [560, 560, 110], [780, 660, 90], [930, 780, 70]]; for (const [x, y, w] of tw) { ctx.lineTo(x - w / 2, 1000); ctx.lineTo(x - w / 2, y + 60); ctx.lineTo(x, y - 40); ctx.lineTo(x + w / 2, y + 60); ctx.lineTo(x + w / 2, 1000); } ctx.lineTo(980, 1120); ctx.closePath(); });
  if (fA > 0.6) for (const [x, y] of [[330, 760], [560, 690], [560, 800], [780, 780], [180, 860], [930, 880]]) { const fy = 1120 - (1120 - y) * fA; glow(ctx, x, fy, 40, [255, 220, 140], a * 0.7 * fA); ctx.save(); ctx.globalAlpha *= a * fA; ctx.fillStyle = 'rgb(255,226,150)'; ctx.fillRect(x - 10, fy - 16, 20, 28); ctx.restore(); }
  paper(ctx, a, fA, 1200, [30, 70, 56], () => { ctx.moveTo(-50, 1200); for (let k = 0; k <= 12; k++) { const x = -50 + k * 100; ctx.quadraticCurveTo(x + 50, 1030 - 60 * hash(k + 1), x + 100, 1200); } ctx.closePath(); });
  // ---- 第二幕：山丘、大风车 ----
  paper(ctx, a, fB, 1140, [60, 50, 46], () => { ctx.moveTo(-100, 1140); ctx.quadraticCurveTo(300 - drift * 0.3, 900, 700 - drift * 0.3, 1000); ctx.quadraticCurveTo(1000, 1060, 1200, 980); ctx.lineTo(1200, 1140); ctx.closePath(); });
  const WX = 790 - drift * 0.5, WY = 620;
  paper(ctx, a, fB, 1140, [34, 30, 34], () => { ctx.moveTo(WX - 140, 1140); ctx.lineTo(WX - 70, WY + 30); ctx.lineTo(WX - 90, WY + 30); ctx.lineTo(WX, WY - 70); ctx.lineTo(WX + 90, WY + 30); ctx.lineTo(WX + 70, WY + 30); ctx.lineTo(WX + 140, 1140); ctx.closePath(); });
  if (fB > 0.5) {
    const hy = 1140 - (1140 - WY) * fB, sp = t * 0.9 + run * 2.2;
    glow(ctx, WX, hy + 220, 50, [255, 210, 140], a * 0.8); ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgb(255,214,140)'; ctx.fillRect(WX - 14, hy + 190, 28, 44); ctx.restore();
    ctx.save(); ctx.globalAlpha *= a * smooth(prog(fB, 0.5, 1)); ctx.translate(WX, hy); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14;
    for (let k = 0; k < 4; k++) { ctx.save(); ctx.rotate(sp + k * Math.PI / 2); ctx.fillStyle = 'rgb(52,44,44)'; ctx.fillRect(-10, -660, 20, 640); ctx.fillStyle = 'rgba(214,190,150,0.9)'; ctx.fillRect(12, -640, 96, 520); ctx.strokeStyle = 'rgba(60,46,40,0.9)'; ctx.lineWidth = 4; for (let j = 0; j < 7; j++) { ctx.beginPath(); ctx.moveTo(12, -640 + j * 86); ctx.lineTo(108, -640 + j * 86); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(60, -640); ctx.lineTo(60, -120); ctx.stroke(); ctx.restore(); }
    ctx.shadowColor = 'rgba(0,0,0,0)'; ctx.fillStyle = 'rgb(80,64,56)'; ctx.beginPath(); ctx.arc(0, 0, 26, 0, TAU); ctx.fill(); ctx.restore();
  }
  // 地面纸条
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = rgba(mix([22, 46, 40], [44, 38, 32], warm)); ctx.fillRect(-200, 1200, W + 400, 800); ctx.restore();
  band(ctx, 1200, 30, [255, 240, 200], 0.12 * a);
  // 她
  const x = lerp(lerp(540, 300, smooth(prog(t, tq - 0.6, tq))), 560, run);
  const charge = smooth(prog(t, tq - 0.3, tq + 0.2));
  const o = infp(ctx, x, 1290 - Math.abs(Math.sin(t * 14)) * 16 * run, 1.02, { a, t, lean: 0.2 * charge, ra: lerp(0.2, -1.3, charge), la: lerp(0.2, 0.7, charge), spin: t * (1.5 + run * 12), eyes: charge > 0.5 ? 'wide' : 'happy', mouth: charge > 0.5 ? 'o' : 'smile', tilt: 0.2 * (1 - charge), flies: 1 });
  crown(ctx, o.top[0], o.top[1] + 26, 0.95, a * smooth(prog(t, tf - 0.2, tf + 0.3)));
  if (run > 0) { const tip = o.wheel; glowLine(ctx, [[tip[0] - 40, tip[1] + 6], [tip[0] + 160 * run, tip[1] - 10 * run]], LIME, a * run * 0.7, 2.6, 1); for (let k = 0; k < 22; k++) { const v = (t * 1.8 + k / 22) % 1; ctx.save(); ctx.globalAlpha *= a * run * (1 - v); ctx.fillStyle = rgba(k % 3 ? [230, 210, 170] : LIME); ctx.translate(x - 80 - v * 360, 1270 - v * 120 * hash(k) - 10); ctx.rotate(t * 5 + k); ctx.fillRect(-7, -4, 14, 8); ctx.restore(); } }
  ctx.restore();
  // 近景：纸做的草叶边框（视差更快）
  ctx.save(); ctx.globalAlpha *= a; ctx.filter = 'blur(3px)'; ctx.fillStyle = 'rgb(10,22,18)'; ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 20;
  for (let k = 0; k < 9; k++) { const bx = -60 + k * 150 - drift * 1.4 % 150, hh = 220 + 140 * hash(k + 30); ctx.beginPath(); ctx.moveTo(bx - 40, H); ctx.quadraticCurveTo(bx + 20, H - hh, bx + 60 + 20 * Math.sin(t + k), H - hh - 30); ctx.quadraticCurveTo(bx + 30, H - hh * 0.4, bx + 50, H); ctx.fill(); }
  ctx.restore();
}

// ================= 合成 =================
module.exports = function make() {
  const S = [
    { a: vs('B01') - 0.3, b: vs('B02') + 0.1, draw: sB1, over: oB1 },
    { a: vs('B02') - 0.2, b: vs('B03') + 0.1, draw: sB2 },
    { a: vs('B03') - 0.2, b: vs('B04') + 0.1, draw: sB3, over: oB3 },
    { a: vs('B04') - 0.2, b: vs('C101') + 0.1, draw: sB4 },
    { a: vs('C101') - 0.3, b: vs('C102') + 0.1, draw: sC1 },
    { a: vs('C102') - 0.2, b: vs('C103') + 0.1, draw: sC2 },
    { a: vs('C103') - 0.2, b: vs('C104') + 0.1, draw: sC3 },
  ];
  S.push({ a: vs('C101') - 0.3, b: ve('C103') + 0.4, draw: () => {}, over: (ctx, t) => X.trait(ctx, '1', '理想主义', ['理想主义'], t, vs('C101') - 0.2, ve('C103') + 0.3, GOLD) });
  return S;
};
