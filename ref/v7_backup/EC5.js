'use strict';
// 《ESFJ》v7 EC5：E01–E06 工作。一整层有纵深的公司：办公室 → 仓库 → 门店 → 大厅，四个开间沿 X 排开（egenv 透视），
// 镜头在里面横移穿行，近处的柱子扫过画面当转场。天色：清晨 → 白天 → 黄昏。
//   E01 清晨办公室，他走进来，胸口的暖光飞出去，沿天花板一盏盏点亮吊灯、同事的屏幕，再收回胸口变成工牌；
//   E02 排班板：取任务卡递给三个同事，「安排」之后越跑越快、带残影，板上的钟快转；
//   E03 仓库货架通道：同事从货架上取走一箱，他立刻从推车上抛一箱补进那一格，货架永远是满的；
//   E04 门店柜台：顾客问哪个好，他挑实惠的那件装袋，胸口飞出一颗发光的心落进袋子，顾客提着发光的袋子走；
//   E05 大厅：上司（ESTJ）在前景举着清单，三行图标（尺子 / 码齐的盒子 / 心）依次打勾，他一勾亮一分；
//   E06 聚光灯下原地转身换五套职业装（老师/教练/销售/秘书/前台）；之后停顿，镜头升起拉远，整层楼在黄昏里亮着灯。
const X = require('./ehk');
const E = require('./egenv');
const B = require('./ebw');
const { K, vs, ve, at } = X;
const { W, H, clamp, lerp, mix, prog, smooth, easeInOut, easeOut, hash, glow, rgba, vis } = K;
const { WARM, CANDLE } = E;

// ---------- 时间 ----------
const T0 = vs('E01') - 0.05, TE = vs('F01') - 0.05;
const E1 = vs('E01'), E2 = vs('E02'), E3 = vs('E03'), E4 = vs('E04'), E5 = vs('E05'), E6 = vs('E06');
const STILL = ve('E06') + 0.3;
const PULSE = at('E01', '工作') - 0.15, BADGE_T = at('E01', '长处') - 0.1;
const FAST = at('E02', '安排') - 0.15;
const PANS = [[E3 - 0.45, E3 + 0.35], [E4 - 0.45, E4 + 0.35], [E5 - 0.45, E5 + 0.35]];

// ---------- 空间 ----------
const HW = 4.2, CEIL = 3.6, BACK = 11, ZF = -9;
const BX = [0, 8.4, 16.8, 25.2]; // 办公室 仓库 门店 大厅
const XL = BX[0] - HW, XR = BX[3] + HW;
const HZ = [14, 14, 28];
const mul = (c, k) => [Math.min(255, c[0] * k), Math.min(255, c[1] * k), Math.min(255, c[2] * k)];
const fz = (c, Z, p, far = 30) => mix(c, HZ, clamp((p.depth(Z) - 2.5) / far, 0, 0.72));
function zClip(p, Y, Z) { const cs = Math.cos(p.pitch), sn = Math.sin(p.pitch); return Math.max(Z, p.z0 + (0.3 + (Y - p.h) * sn) / cs); }
function quad(ctx, p, pts, c, a = 1) { E.poly(ctx, p, pts.map(q => [q[0], q[1], zClip(p, q[1], q[2])]), c, a); }
// 竖直渐变的面（灯从上面照：上亮下暗）
function face(ctx, p, pts, c0, c1, a = 1) {
  const s = pts.map(q => p(...q)); let y0 = 1e9, y1 = -1e9; for (const q of s) { y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
  ctx.save(); ctx.globalAlpha *= a; const g = ctx.createLinearGradient(0, y0, 0, y1 + 0.01); g.addColorStop(0, rgba(c0)); g.addColorStop(1, rgba(c1)); ctx.fillStyle = g;
  ctx.beginPath(); s.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill(); ctx.restore();
}
// 有体积的盒子：正面渐变 + 顶面亮 + 侧面暗 + 顶边一条高光
function box3(ctx, p, x0, x1, y0, y1, z0, z1, c, o = {}) {
  if (p.depth(z0, y0) < 0.4 || p.depth(z0, y1) < 0.4) return;
  const { a = 1, top = 1.18, side = 0.66, edge = 0.35 } = o;
  const zm = (z0 + z1) / 2, C = k => fz(mul(c, k), zm, p);
  if (p.x0 < x0) E.poly(ctx, p, [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], C(side), a);
  if (p.x0 > x1) E.poly(ctx, p, [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], C(side), a);
  if (p.h > y1) E.poly(ctx, p, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], C(top), a);
  face(ctx, p, [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], C(1.05), C(0.7), a);
  if (edge > 0) { const s0 = p(x0, y1, z0), s1 = p(x1, y1, z0); ctx.save(); ctx.globalAlpha *= a * edge; ctx.strokeStyle = rgba(C(1.6)); ctx.lineWidth = Math.max(1.2, p.px(z0, 0.012)); ctx.beginPath(); ctx.moveTo(s0[0], s0[1]); ctx.lineTo(s1[0], s1[1]); ctx.stroke(); ctx.restore(); }
}
const RR = (ctx, x, y, w, h, r, c, a = 1) => { ctx.fillStyle = rgba(c, a); ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
const R = (ctx, x, y, w, h, c, a = 1) => { ctx.fillStyle = rgba(c, a); ctx.fillRect(x, y, w, h); };
const bounce = (t, t0, amp = 12) => { const u = t - t0; return u < 0 || u > 0.6 ? 0 : Math.abs(Math.sin(u * 16)) * amp * Math.exp(-u * 6); };

// ---------- 天色 ----------
const SKYK = [
  [T0, [10, 16, 42], [48, 62, 112], [226, 150, 120]],
  [E3, [30, 58, 108], [104, 134, 182], [210, 204, 200]],
  [E5, [28, 40, 88], [126, 104, 136], [250, 168, 118]],
  [STILL, [22, 18, 50], [112, 64, 96], [255, 140, 84]],
  [TE, [12, 12, 34], [60, 40, 74], [196, 98, 72]],
];
function skyAt(t) {
  let i = 0; while (i < SKYK.length - 2 && t > SKYK[i + 1][0]) i++;
  const [ta, a0, a1, a2] = SKYK[i], [tb, b0, b1, b2] = SKYK[i + 1], u = smooth(prog(t, ta, tb));
  return { top: mix(a0, b0, u), bot: mix(a1, b1, u), hor: mix(a2, b2, u), lit: lerp(i === 0 ? 0.55 : i === 1 ? 0.18 : i === 2 ? 0.4 : 0.75, i === 0 ? 0.18 : i === 1 ? 0.4 : 0.75, u) };
}
// 窗外：天空 + 三层远近不同的城市（真 3D 远处，镜头横移时有视差）
const CITY = [{ Z: 230, n: 70, x0: -160, w: 6.2, c: 0.62 }, { Z: 120, n: 56, x0: -70, w: 3.6, c: 0.45 }, { Z: 62, n: 44, x0: -30, w: 2.2, c: 0.3 }];
function backdrop(ctx, p, t, s) {
  const hy = p(p.x0, p.h, p.z0 + 2000)[1];
  const g = ctx.createLinearGradient(0, 0, 0, hy + 40);
  g.addColorStop(0, rgba(s.top)); g.addColorStop(0.8, rgba(s.bot)); g.addColorStop(1, rgba(mix(s.bot, s.hor, 0.55)));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, hy + 40);
  const g2 = ctx.createLinearGradient(0, hy, 0, H); g2.addColorStop(0, rgba(mix(s.bot, [10, 10, 20], 0.5))); g2.addColorStop(1, rgba([8, 8, 16]));
  ctx.fillStyle = g2; ctx.fillRect(0, hy + 39, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const hg = ctx.createLinearGradient(0, hy - 260, 0, hy + 60); hg.addColorStop(0, rgba(s.hor, 0)); hg.addColorStop(0.75, rgba(s.hor, 0.32)); hg.addColorStop(1, rgba(s.hor, 0));
  ctx.fillStyle = hg; ctx.fillRect(0, hy - 260, W, 320); ctx.restore();
  CITY.forEach((L, li) => {
    const col = mix(mix(s.bot, [8, 10, 22], L.c + 0.25), s.hor, 0.06 * (2 - li));
    for (let i = 0; i < L.n; i++) {
      const bx = L.x0 + i * L.w + hash(i * 3.1 + li) * L.w * 0.3, bw = L.w * (0.55 + hash(i * 5.7 + li) * 0.4), top = -14 + hash(i * 1.7 + li * 9) * (24 + li * 10);
      const a = p(bx, top, L.Z), b = p(bx + bw, -70, L.Z);
      if (b[0] < -20 || a[0] > W + 20) continue;
      ctx.fillStyle = rgba(col); ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
      if (li === 0) continue;
      const ww = Math.max(1.6, (b[0] - a[0]) / 7), cols = 3, rows = Math.min(14, Math.floor((Math.min(b[1], H) - a[1]) / (ww * 2.6)));
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const hsh = hash(i * 17.3 + r * 3.7 + c * 1.3 + li * 31); if (hsh > s.lit) continue;
        const x = a[0] + (b[0] - a[0]) * (0.18 + c * 0.3), y = a[1] + ww * 1.6 + r * ww * 2.6;
        ctx.fillStyle = rgba(mix([255, 196, 120], [200, 220, 255], hash(hsh * 9)), 0.55 + 0.35 * hsh); ctx.beginPath(); ctx.roundRect(x, y, ww, ww * 1.3, ww * 0.3); ctx.fill();
      }
    }
  });
  // 远处的薄雾：把城市下半截融掉
  const mg = ctx.createLinearGradient(0, hy - 30, 0, hy + 260); mg.addColorStop(0, rgba(s.bot, 0)); mg.addColorStop(0.5, rgba(mix(s.bot, s.hor, 0.2), 0.55)); mg.addColorStop(1, rgba(mix(s.bot, [10, 10, 20], 0.4), 0.9));
  ctx.fillStyle = mg; ctx.fillRect(0, hy - 30, W, 300);
}

// ---------- 墙、地、顶 ----------
const WALLC = [[52, 64, 80], [70, 60, 58], [92, 54, 60], [34, 42, 70]];
const FLOORC = [[58, 66, 84], [80, 74, 70], [118, 80, 58], [74, 72, 94]];
function winsOf(b) {
  const c = BX[b];
  if (b === 0) return [[c - 3.5, c - 0.45, 0.95, 3.05], [c + 0.45, c + 3.5, 0.95, 3.05]];
  if (b === 1) return [[c - 3.7, c - 1.9, 2.55, 3.3], [c - 1.7, c + 0.1, 2.55, 3.3], [c + 0.3, c + 2.1, 2.55, 3.3], [c + 2.3, c + 3.7, 2.55, 3.3]];
  if (b === 2) return [[c - 3.3, c + 3.3, 0.55, 2.95]];
  return [[c - 4.0, c - 1.4, 0.12, 3.45], [c - 1.3, c + 1.3, 0.12, 3.45], [c + 1.4, c + 4.0, 0.12, 3.45]];
}
function backWall(ctx, p, t, s, b) {
  const c = BX[b], x0 = c - HW, x1 = c + HW, Z = BACK;
  const pts = [[x0, 0, Z], [x1, 0, Z], [x1, CEIL, Z], [x0, CEIL, Z]].map(q => p(...q));
  if (pts[1][0] < 0 || pts[0][0] > W) return;
  const wc = fz(WALLC[b], Z, p, 40);
  ctx.save(); ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath();
  const ws = winsOf(b);
  for (const [a0, a1, y0, y1] of ws) { const w = [[a0, y0, Z], [a0, y1, Z], [a1, y1, Z], [a1, y0, Z]].map(q => p(...q)); ctx.moveTo(w[0][0], w[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(w[i][0], w[i][1]); ctx.closePath(); }
  const g = ctx.createLinearGradient(0, pts[2][1], 0, pts[0][1]); g.addColorStop(0, rgba(mul(wc, 0.7))); g.addColorStop(1, rgba(mul(wc, 1.05)));
  ctx.fillStyle = g; ctx.fill('evenodd'); ctx.restore();
  // 窗框 + 玻璃反光 + 窗沿暖边
  for (const [a0, a1, y0, y1] of ws) {
    const A = p(a0, y1, Z), Bq = p(a1, y0, Z), fw = Math.max(3, p.px(Z, 0.07));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const rg = ctx.createLinearGradient(A[0], A[1], Bq[0], Bq[1]); rg.addColorStop(0, 'rgba(255,255,255,0)'); rg.addColorStop(0.45, 'rgba(255,240,220,0.06)'); rg.addColorStop(0.55, 'rgba(255,240,220,0.0)');
    ctx.fillStyle = rg; ctx.fillRect(A[0], A[1], Bq[0] - A[0], Bq[1] - A[1]); ctx.restore();
    ctx.fillStyle = rgba(mul(wc, 0.5)); ctx.fillRect(A[0] - fw / 2, A[1] - fw / 2, Bq[0] - A[0] + fw, fw); ctx.fillRect(A[0] - fw / 2, Bq[1] - fw / 2, Bq[0] - A[0] + fw, fw);
    ctx.fillRect(A[0] - fw / 2, A[1], fw, Bq[1] - A[1]); ctx.fillRect(Bq[0] - fw / 2, A[1], fw, Bq[1] - A[1]);
    const n = Math.max(1, Math.round((a1 - a0) / 1.3)); for (let i = 1; i < n; i++) { const xm = lerp(A[0], Bq[0], i / n); ctx.fillRect(xm - fw * 0.35, A[1], fw * 0.7, Bq[1] - A[1]); }
    ctx.fillStyle = rgba(mix(wc, [255, 210, 160], 0.25)); ctx.fillRect(A[0] - fw, Bq[1] - fw * 0.2, Bq[0] - A[0] + fw * 2, fw * 0.9);
  }
  // 门牌（墙上的发光铭牌）
  const NAME = ['办公室', '仓库', '门店', '大厅'][b], ny = b === 1 ? 2.05 : 3.28, q = p(c, ny, Z - 0.02), sz = p.px(Z, 0.2);
  if (b !== 3 && b !== 0) { RR(ctx, q[0] - sz * 2.2, q[1] - sz * 0.8, sz * 4.4, sz * 1.5, sz * 0.3, [30, 24, 26], 0.85); glow(ctx, q[0], q[1], sz * 3.5, WARM, 0.18); K.text(ctx, NAME, q[0], q[1] + sz * 0.35, { size: sz, weight: 700, color: [255, 222, 170] }); }
}
function shell(ctx, p, t, s) {
  // 天花板
  quad(ctx, p, [[XL, CEIL, ZF], [XR, CEIL, ZF], [XR, CEIL, BACK], [XL, CEIL, BACK]], [22, 20, 28]);
  for (let b = 0; b < 4; b++) {
    const c = BX[b];
    // 地面（每间不同材质色）+ 远处压暗
    const fc = FLOORC[b];
    const zn = zClip(p, 0, ZF), A = p(c - HW, 0, BACK), Bq = p(c - HW, 0, zn);
    E.poly(ctx, p, [[c - HW, 0, zn], [c + HW, 0, zn], [c + HW, 0, BACK], [c - HW, 0, BACK]], fc);
    const g = ctx.createLinearGradient(0, A[1], 0, Math.min(H, Bq[1])); g.addColorStop(0, rgba(HZ, 0.7)); g.addColorStop(0.5, rgba(HZ, 0.2)); g.addColorStop(1, rgba([0, 0, 0], 0.35));
    ctx.save(); ctx.fillStyle = g; ctx.beginPath(); [[c - HW, 0, zn], [c + HW, 0, zn], [c + HW, 0, BACK], [c - HW, 0, BACK]].forEach((q, i) => { const r = p(...q); i ? ctx.lineTo(r[0], r[1]) : ctx.moveTo(r[0], r[1]); }); ctx.closePath(); ctx.fill(); ctx.restore();
    // 地砖缝（很淡，只给地面一点材质）
    ctx.save(); ctx.globalAlpha = 0.18; for (let i = 1; i < 7; i++) E.seg(ctx, p, [c - HW + i * 1.2, 0.001, zClip(p, 0, -4)], [c - HW + i * 1.2, 0.001, BACK], mul(fc, 0.6), 1, 1.4); for (let z = -2; z < BACK; z += 1.2) if (p.depth(z) > 0.6) E.seg(ctx, p, [c - HW, 0.001, z], [c + HW, 0.001, z], mul(fc, 0.6), 1, 1.4); ctx.restore();
    backWall(ctx, p, t, s, b);
    // 窗光落在地上（倒影）
    for (const [a0, a1, y0] of winsOf(b)) if (y0 < 1.5) {
      const pts = [[a0, 0.002, BACK], [a1, 0.002, BACK], [a1 + 0.4, 0.002, BACK - 4.5], [a0 - 0.4, 0.002, BACK - 4.5]].map(q => p(...q));
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const rg = ctx.createLinearGradient(0, pts[0][1], 0, pts[2][1]); rg.addColorStop(0, rgba(mix(s.bot, s.hor, 0.3), 0.2)); rg.addColorStop(1, rgba(s.bot, 0));
      ctx.fillStyle = rg; ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill(); ctx.restore();
    }
  }
  // 两头的山墙
  for (const [x, c] of [[XL, WALLC[0]], [XR, WALLC[3]]]) quad(ctx, p, [[x, 0, ZF], [x, CEIL, ZF], [x, CEIL, BACK], [x, 0, BACK]], mul(c, 0.8));
}

// ---------- 灯 ----------
// 办公室吊灯：E01 由他胸口飞出的光一盏盏点亮（近 → 远）
const OL = [[-1.7, 2.6], [1.7, 2.6], [-1.7, 5.4], [1.7, 5.4], [-1.7, 8.2], [1.7, 8.2]];
const LAMP_T = OL.map((q, i) => PULSE + 0.32 + i * 0.11);
const LAMPS = [
  ...OL.map(([x, z], i) => ({ X: BX[0] + x, Z: z, drop: 0.85, R: 1.7, c: WARM, on: t => lerp(0.03, 1, smooth(prog(t, LAMP_T[i], LAMP_T[i] + 0.12))) * (t < LAMP_T[i] + 0.2 ? 1 : 1 - 0.12 * Math.max(0, Math.sin((t - LAMP_T[i]) * 30)) * Math.exp(-(t - LAMP_T[i]) * 6)) })),
  ...[2.4, 5.4, 8.4].map(z => ({ X: BX[1], Z: z, drop: 0.7, R: 1.9, c: [255, 214, 160], ind: true, on: () => 1 })),
  ...[[-0.7, 3.0], [0.9, 3.0], [0, 6.2]].map(([x, z]) => ({ X: BX[2] + x, Z: z, drop: 1.1, R: 1.5, c: WARM2(), on: () => 1 })),
  ...[[-2.4, 6.0], [2.6, 6.0], [-2.4, 2.4], [2.8, 2.6]].map(([x, z]) => ({ X: BX[3] + x, Z: z, drop: 0.6, R: 1.8, c: WARM, on: () => 1 })),
];
function WARM2() { return [255, 186, 110]; }
function lampDraw(ctx, p, L, t, k = 1) {
  const on = L.on(t) * k, top = p(L.X, CEIL, L.Z), lp = p(L.X, CEIL - L.drop, L.Z), s = p.px(L.Z, 0.34);
  if (lp[0] < -300 || lp[0] > W + 300) return;
  ctx.save(); ctx.strokeStyle = 'rgba(16,12,12,0.9)'; ctx.lineWidth = Math.max(1, s * 0.035); ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(lp[0], lp[1]); ctx.stroke();
  // 灯罩：有体积的半球，内壁被灯照亮
  const sh = ctx.createLinearGradient(lp[0] - s * 0.7, 0, lp[0] + s * 0.7, 0);
  const base = L.ind ? [70, 78, 84] : [52, 40, 34];
  sh.addColorStop(0, rgba(mul(base, 0.6))); sh.addColorStop(0.45, rgba(mix(base, [255, 230, 190], 0.25 + 0.25 * on))); sh.addColorStop(1, rgba(mul(base, 0.5)));
  ctx.fillStyle = sh; ctx.beginPath(); ctx.moveTo(lp[0] - s * 0.18, lp[1]); ctx.quadraticCurveTo(lp[0] - s * 0.7, lp[1] + s * 0.1, lp[0] - s * 0.72, lp[1] + s * 0.5); ctx.lineTo(lp[0] + s * 0.72, lp[1] + s * 0.5); ctx.quadraticCurveTo(lp[0] + s * 0.7, lp[1] + s * 0.1, lp[0] + s * 0.18, lp[1]); ctx.closePath(); ctx.fill();
  ctx.fillStyle = rgba(mix([60, 50, 40], [255, 236, 200], on), 0.95); ctx.beginPath(); ctx.ellipse(lp[0], lp[1] + s * 0.5, s * 0.72, s * 0.12, 0, 0, 7); ctx.fill();
  ctx.restore();
  if (on > 0.02) { const fl = p(L.X, 0, L.Z); E.cone(ctx, lp[0], lp[1] + s * 0.5, fl[1], s * 1.3, p.px(L.Z, L.R * 1.5), L.c, 0.075 * on); glow(ctx, lp[0], lp[1] + s * 0.55, s * 2.2, L.c, 0.45 * on); }
}
function lampFloor(ctx, p, L, t, k = 1) {
  const on = L.on(t) * k; if (on < 0.02) return;
  E.pool(ctx, p, L.X, L.Z, L.R, L.c, 0.42 * on);
  const r = p(L.X, -(CEIL - L.drop) + 0.2, L.Z); if (p.depth(L.Z) > 1) glow(ctx, r[0], r[1], p.px(L.Z, 0.5), L.c, 0.14 * on); // 地面倒影
}

// ---------- 道具：办公室 ----------
const DESK = [[0.55, 3.9], [-0.25, 5.6], [1.35, 6.7], [-2.3, 6.6], [2.75, 4.6], [-1.5, 9.0], [1.7, 9.2]];
const deskOn = (i, t) => { const L = [1, 2, 3, 2, 1, 4, 5][i]; return smooth(prog(t, LAMP_T[L] + 0.05, LAMP_T[L] + 0.25)); };
function desk(ctx, p, t, X0, Z0, on) {
  const wood = [150, 106, 74];
  // 显示器背面 + 屏幕光往外漏
  // 显示器在同事旁边（不挡脸），屏幕背面 + 屏幕光往外漏
  const mx = X0 + 0.4, mz = Z0 + 0.12;
  box3(ctx, p, mx - 0.03, mx + 0.03, 0.77, 0.86, mz + 0.02, mz + 0.06, [40, 40, 46], { edge: 0 });
  box3(ctx, p, mx - 0.26, mx + 0.26, 0.84, 1.14, mz - 0.02, mz + 0.03, [36, 38, 46], { edge: 0.5 });
  if (on > 0.01) { const c = p(mx, 1.0, mz); glow(ctx, c[0], c[1], p.px(Z0, 0.9), [150, 200, 255], 0.22 * on); }
  // 桌面 + 前挡板
  box3(ctx, p, X0 - 0.7, X0 + 0.7, 0.72, 0.77, Z0 - 0.35, Z0 + 0.35, wood);
  box3(ctx, p, X0 - 0.66, X0 + 0.66, 0.12, 0.72, Z0 - 0.33, Z0 - 0.3, mul(wood, 0.72), { edge: 0 });
  // 台灯 + 杯子
  const lx = X0 - 0.5, lz = Z0 - 0.05;
  E.seg(ctx, p, [lx, 0.77, lz], [lx - 0.06, 1.05, lz], [40, 36, 34], 1, Math.max(1.5, p.px(lz, 0.018)));
  const lh = p(lx - 0.1, 1.07, lz); glow(ctx, lh[0], lh[1] + p.px(lz, 0.03), p.px(lz, 0.5), WARM, 0.35 * on + 0.05);
  const r = p.px(lz, 0.07); ctx.fillStyle = rgba(fz([60, 44, 36], lz, p)); ctx.beginPath(); ctx.ellipse(lh[0], lh[1], r, r * 0.45, 0, Math.PI, 0); ctx.fill();
  const cp = p(X0 + 0.05, 0.77, Z0 - 0.2), cr = p.px(Z0, 0.045); RR(ctx, cp[0] - cr, cp[1] - cr * 2.2, cr * 2, cr * 2.2, cr * 0.4, fz([236, 228, 214], Z0, p));
}
// 排班板：站立的软木板，三行彩色任务卡 + 顶上一只钟
const BOARD = [-1.5, 4.0], ROWC = [[96, 156, 228], [104, 196, 132], [238, 156, 80]];
const BS = (r, c) => [BOARD[0] - 0.36 + c * 0.24, 1.86 - r * 0.3, BOARD[1] - 0.04];
const CYC = [];
{
  let t = E2 - 0.1, i = 0, k = 0; const tEnd = E3 - 0.5;
  while (true) { const d = t < FAST ? 1.2 : Math.max(0.5, 0.86 - 0.08 * k++); if (t + d > tEnd) break; CYC.push({ t0: t, d, ci: i % 3, i, fast: t >= FAST }); t += d; i++; }
}
const clockMins = t => 540 + 18 * clamp(t - E2, 0, 99) + 520 * clamp(t - FAST, 0, ve('E02') - FAST) ;
function board(ctx, p, t) {
  const [bx, bz] = BOARD;
  for (const s of [-1, 1]) box3(ctx, p, bx + s * 0.5 - 0.03, bx + s * 0.5 + 0.03, 0, 2.1, bz + 0.02, bz + 0.06, [80, 70, 64], { edge: 0 });
  box3(ctx, p, bx - 0.56, bx + 0.56, 1.0, 2.08, bz - 0.03, bz, [120, 86, 60]);
  const a = p(bx - 0.5, 2.02, bz - 0.031), b = p(bx + 0.5, 1.06, bz - 0.031);
  const g = ctx.createLinearGradient(0, a[1], 0, b[1]); g.addColorStop(0, rgba(fz([226, 196, 150], bz, p))); g.addColorStop(1, rgba(fz([176, 140, 100], bz, p)));
  ctx.fillStyle = g; ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    const s = r * 4 + c; let show = 1, dy = 0;
    for (const cy of CYC) if (cy.i % 12 === s) { const tk = cy.t0 + 0.32 * cy.d; if (t >= tk && t < tk + 0.8) { const u = prog(t, tk + 0.5, tk + 0.8); show = u; dy = (1 - easeOut(u)) * 0.12; } }
    const q = p(...BS(r, c)), cw = p.px(bz, 0.18), ch = p.px(bz, 0.22);
    if (show > 0.01) { ctx.save(); ctx.globalAlpha = show; RR(ctx, q[0] - cw / 2 + 2, q[1] - ch / 2 + 3 - p.px(bz, dy), cw, ch, 4, [0, 0, 0], 0.25); RR(ctx, q[0] - cw / 2, q[1] - ch / 2 - p.px(bz, dy), cw, ch, 4, [250, 246, 236]); RR(ctx, q[0] - cw / 2, q[1] - ch / 2 - p.px(bz, dy), cw, ch * 0.26, [4, 4, 0, 0], ROWC[r]); ctx.restore(); }
    else { RR(ctx, q[0] - cw / 2, q[1] - ch / 2, cw, ch, 4, [120, 90, 60], 0.35); }
  }
  const cq = p(bx + 0.32, 2.28, bz - 0.02), R0 = p.px(bz, 0.17);
  X.clock(ctx, cq[0], cq[1], R0, clockMins(t), 1, { rim: [120, 96, 70] });
  const sp = vis(t, FAST, ve('E02') + 0.2, 0.2, 0.4); if (sp > 0) glow(ctx, cq[0], cq[1], R0 * 2.4, [255, 220, 150], 0.3 * sp);
}
function taskCard(ctx, x, y, c, s = 1, rot = 0, a = 1) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  RR(ctx, -17, -19, 36, 42, 4, [0, 0, 0], 0.25); RR(ctx, -18, -21, 36, 42, 4, [250, 248, 240]);
  R(ctx, -18, -21, 36, 10, c); for (let i = 0; i < 3; i++) RR(ctx, -11, -4 + i * 8, i === 2 ? 14 : 22, 3.5, 1.5, mix(c, [60, 60, 70], 0.4));
  ctx.restore();
}
function plant(ctx, p, X0, Z0, t, hgt = 1.4) {
  box3(ctx, p, X0 - 0.22, X0 + 0.22, 0, 0.42, Z0 - 0.22, Z0 + 0.22, [180, 150, 120]);
  const base = p(X0, 0.42, Z0), s = p.px(Z0, 1);
  for (let i = 0; i < 9; i++) {
    const an = -Math.PI / 2 + (hash(i * 3.3 + X0) - 0.5) * 2.2 + Math.sin(t * 0.8 + i) * 0.03, L = s * hgt * (0.45 + hash(i * 7.1 + X0) * 0.5);
    const tip = [base[0] + Math.cos(an) * L * 0.55, base[1] + Math.sin(an) * L];
    const c = fz(mix([46, 96, 64], [96, 156, 96], hash(i * 2.2)), Z0, p);
    ctx.fillStyle = rgba(c); ctx.beginPath(); ctx.moveTo(base[0], base[1]);
    ctx.quadraticCurveTo(lerp(base[0], tip[0], 0.5) - s * 0.12, lerp(base[1], tip[1], 0.5), tip[0], tip[1]);
    ctx.quadraticCurveTo(lerp(base[0], tip[0], 0.5) + s * 0.12, lerp(base[1], tip[1], 0.5), base[0], base[1]); ctx.fill();
  }
}
// 柱子：离镜头很近时压成暗剪影（横移时当前景擦过画面）
function pillar(ctx, p, X0, Z0) { const d = p.depth(Z0); box3(ctx, p, X0 - 0.24, X0 + 0.24, 0, CEIL, Z0 - 0.24, Z0 + 0.24, mul([74, 70, 80], d < 2.2 ? 0.35 : 1), { edge: 0 }); }

// ---------- 道具：仓库 ----------
const WH = BX[1], CARTX = BX[1] - 0.12, SH = { xL: WH - 1.25, xR: WH + 1.25, d: 0.62, z0: 1.6, seg: 1.5, n: 6, lv: [0.12, 0.8, 1.48, 2.16], top: 2.8 };
const BOXC = [[184, 136, 86], [168, 120, 74], [196, 150, 98], [150, 112, 76]];
const slotPos = (s, g, l, k) => ({ X: s ? SH.xR + SH.d / 2 : SH.xL - SH.d / 2, Z: SH.z0 + g * SH.seg + (k + 0.5) * SH.seg / 2, Y: SH.lv[l] + 0.04 });
const boxH = (s, g, l, k) => 0.36 + hash(s * 31 + g * 7 + l * 3 + k) * 0.18;
function cbox(ctx, p, X0, Y0, Z0, hgt, c, a = 1, glo = 0, ww = 0.5, dd = 0.56) {
  box3(ctx, p, X0 - ww / 2, X0 + ww / 2, Y0, Y0 + hgt, Z0 - dd / 2, Z0 + dd / 2, c, { a });
  // 封箱胶带 + 标签（朝通道那一面）
  const sx = p.x0 < X0 ? X0 - ww / 2 : X0 + ww / 2;
  E.poly(ctx, p, [[sx, Y0 + hgt * 0.62, Z0 - dd * 0.22], [sx, Y0 + hgt * 0.62, Z0 + dd * 0.22], [sx, Y0 + hgt * 0.32, Z0 + dd * 0.22], [sx, Y0 + hgt * 0.32, Z0 - dd * 0.22]], fz(mix(c, [250, 240, 220], 0.55), Z0, p), a * 0.8);
  if (glo > 0.01) { const q = p(X0, Y0 + hgt / 2, Z0); glow(ctx, q[0], q[1], p.px(Z0, 0.9), [255, 214, 140], 0.55 * glo); }
}
function shelfSeg(ctx, p, t, s, g, slotFn) {
  const x0 = s ? SH.xR : SH.xL - SH.d, x1 = s ? SH.xR + SH.d : SH.xL, z0 = SH.z0 + g * SH.seg, z1 = z0 + SH.seg;
  const metal = [212, 120, 52], steel = [70, 92, 136];
  // 背板（靠外侧）
  const bxp = s ? x1 : x0; E.poly(ctx, p, [[bxp, 0, z0], [bxp, SH.top, z0], [bxp, SH.top, z1], [bxp, 0, z1]], fz([40, 38, 46], (z0 + z1) / 2, p));
  for (let l = 0; l < 4; l++) {
    const y = SH.lv[l];
    box3(ctx, p, x0, x1, y, y + 0.04, z0, z1, mul(steel, 0.8), { edge: 0.2 });
    for (let k = 0; k < 2; k++) { const st = slotFn(s, g, l, k); if (st.a <= 0.01 && !st.gap) continue; const q = slotPos(s, g, l, k); if (st.gap > 0) { const c = p(q.X, q.Y + 0.25, q.Z); glow(ctx, c[0], c[1], p.px(q.Z, 0.4), [255, 150, 120], 0.25 * st.gap); } if (st.a > 0.01) cbox(ctx, p, q.X, q.Y + st.dy, q.Z, boxH(s, g, l, k), BOXC[(g + l + k) % 4], st.a, st.glo); }
    // 横梁（朝通道的橙色梁）
    const bx0 = s ? x0 : x1 - 0.05, bx1 = s ? x0 + 0.05 : x1;
    box3(ctx, p, bx0, bx1, y - 0.08, y + 0.04, z0, z1, metal, { edge: 0.4 });
  }
  for (const z of [z0, z1]) { const ux = s ? x0 : x1 - 0.06; box3(ctx, p, ux, ux + 0.06, 0, SH.top, z - 0.03, z + 0.03, metal, { edge: 0 }); }
}
function cart(ctx, p, t, X0, Z0, nBox) {
  const c = [78, 96, 128];
  for (const [dx, dz] of [[-0.3, -0.35], [0.3, -0.35], [-0.3, 0.35], [0.3, 0.35]]) { const q = p(X0 + dx, 0.07, Z0 + dz), r = p.px(Z0, 0.07); ctx.fillStyle = rgba(fz([30, 30, 34], Z0, p)); ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, 7); ctx.fill(); }
  box3(ctx, p, X0 - 0.38, X0 + 0.38, 0.14, 0.24, Z0 - 0.48, Z0 + 0.48, c);
  E.seg(ctx, p, [X0 - 0.36, 0.24, Z0 - 0.46], [X0 - 0.36, 1.0, Z0 - 0.52], mul(c, 1.3), 1, Math.max(2, p.px(Z0, 0.03)));
  E.seg(ctx, p, [X0 + 0.36, 0.24, Z0 - 0.46], [X0 + 0.36, 1.0, Z0 - 0.52], mul(c, 1.3), 1, Math.max(2, p.px(Z0, 0.03)));
  E.seg(ctx, p, [X0 - 0.36, 1.0, Z0 - 0.52], [X0 + 0.36, 1.0, Z0 - 0.52], mul(c, 1.3), 1, Math.max(2, p.px(Z0, 0.035)));
  const stack = [[-0.16, 0.24, 0.12], [0.18, 0.24, 0.14], [-0.14, 0.24, -0.22], [0.16, 0.24, -0.2], [0.0, 0.62, 0.0], [-0.12, 0.62, -0.24]];
  for (let i = 0; i < stack.length; i++) if (i < nBox) { const [dx, y, dz] = stack[i]; cbox(ctx, p, X0 + dx, y, Z0 + dz, 0.36, BOXC[i % 4], 1, 0, 0.36, 0.4); }
}

// ---------- 道具：门店 ----------
const SHOP = BX[2], CTR = { x0: SHOP - 1.35, x1: SHOP + 1.45, z0: 2.55, z1: 3.0, y: 0.92 };
function counter(ctx, p, t) {
  const wood = [118, 76, 54];
  box3(ctx, p, CTR.x0, CTR.x1, 0, CTR.y, CTR.z0, CTR.z1, wood);
  box3(ctx, p, CTR.x0 - 0.04, CTR.x1 + 0.04, CTR.y, CTR.y + 0.04, CTR.z0 - 0.04, CTR.z1, [220, 200, 170], { edge: 0.6 });
  for (let i = 0; i < 4; i++) { const xa = lerp(CTR.x0, CTR.x1, (i + 0.12) / 4), xb = lerp(CTR.x0, CTR.x1, (i + 0.88) / 4); face(ctx, p, [[xa, 0.15, CTR.z0 - 0.001], [xb, 0.15, CTR.z0 - 0.001], [xb, 0.78, CTR.z0 - 0.001], [xa, 0.78, CTR.z0 - 0.001]], fz([140, 94, 64], CTR.z0, p), fz([78, 50, 36], CTR.z0, p)); }
  // 柜台下沿的暖光带
  const a = p(CTR.x0, 0.1, CTR.z0), b = p(CTR.x1, 0.1, CTR.z0); ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(0, a[1] - 40, 0, a[1] + 30); g.addColorStop(0, 'rgba(255,190,120,0)'); g.addColorStop(0.6, 'rgba(255,190,120,0.25)'); g.addColorStop(1, 'rgba(255,190,120,0)'); ctx.fillStyle = g; ctx.fillRect(a[0], a[1] - 40, b[0] - a[0], 70); ctx.restore();
  // 收银机
  box3(ctx, p, SHOP + 0.85, SHOP + 1.3, CTR.y + 0.04, CTR.y + 0.2, 2.7, 2.95, [60, 62, 70]);
  box3(ctx, p, SHOP + 0.95, SHOP + 1.25, CTR.y + 0.2, CTR.y + 0.42, 2.84, 2.88, [40, 42, 50], { edge: 0.4 });
  const sc = p(SHOP + 1.1, CTR.y + 0.31, 2.835); glow(ctx, sc[0], sc[1], p.px(2.8, 0.25), [140, 230, 200], 0.4);
}
const PSH = { x0: SHOP - 1.75, x1: SHOP + 1.95, z: 4.5, lv: [0.3, 0.85, 1.4, 1.95], top: 2.45 };
const PRODC = [[96, 178, 120], [236, 120, 110], [250, 200, 90], [120, 160, 236], [220, 150, 210], [240, 160, 90]];
const PLAIN = { X: SHOP - 0.32, l: 2 }, FANCY = { X: SHOP + 0.78, l: 2 };
function product(ctx, x, y, w, h, c, kind, a = 1, shine = 0) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a;
  if (kind === 0) { // 罐子
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, rgba(mul(c, 0.7))); g.addColorStop(0.35, rgba(mix(c, [255, 255, 255], 0.35))); g.addColorStop(1, rgba(mul(c, 0.6)));
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h, w, h, w * 0.18); ctx.fill();
    RR(ctx, x - w * 0.42, y - h - w * 0.18, w * 0.84, w * 0.24, w * 0.08, mul(c, 0.55));
    RR(ctx, x - w / 2, y - h * 0.62, w, h * 0.3, 2, [250, 244, 226], 0.9);
  } else { // 礼盒
    const g = ctx.createLinearGradient(x - w / 2, y - h, x + w / 2, y); g.addColorStop(0, '#fff1b8'); g.addColorStop(0.5, '#e2b048'); g.addColorStop(1, '#8a5e18');
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h, w, h, 3); ctx.fill();
    R(ctx, x - w * 0.06, y - h, w * 0.12, h, [200, 60, 70]); R(ctx, x - w / 2, y - h * 0.58, w, h * 0.1, [200, 60, 70]);
  }
  ctx.restore();
  if (shine > 0) { glow(ctx, x, y - h / 2, w * 2.2, kind ? [255, 220, 130] : [180, 255, 190], 0.5 * shine * a); }
}
function prodShelf(ctx, p, t, st) {
  const { x0, x1, z, lv, top } = PSH;
  box3(ctx, p, x0, x1, 0, top, z, z + 0.35, [92, 60, 44], { edge: 0 });
  face(ctx, p, [[x0 + 0.05, 0.05, z - 0.001], [x1 - 0.05, 0.05, z - 0.001], [x1 - 0.05, top - 0.05, z - 0.001], [x0 + 0.05, top - 0.05, z - 0.001]], fz([60, 38, 32], z, p), fz([34, 22, 20], z, p));
  for (let l = 0; l < 4; l++) {
    const y = lv[l];
    box3(ctx, p, x0, x1, y - 0.04, y, z - 0.04, z + 0.3, [180, 130, 90], { edge: 0.5 });
    const a = p(x0, y + 0.5, z), b = p(x1, y, z); // 每层的暖光
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(0, a[1], 0, b[1]); g.addColorStop(0, 'rgba(255,200,130,0.14)'); g.addColorStop(1, 'rgba(255,200,130,0)'); ctx.fillStyle = g; ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); ctx.restore();
    if (l === 3) continue;
    for (let i = 0; i < 11; i++) {
      const X0 = lerp(x0 + 0.2, x1 - 0.2, i / 10), q = p(X0, y, z + 0.02), w = p.px(z, 0.2), h = p.px(z, 0.26 + hash(i * 3 + l) * 0.12);
      const isPlain = l === PLAIN.l && Math.abs(X0 - PLAIN.X) < 0.18, isFancy = l === FANCY.l && Math.abs(X0 - FANCY.X) < 0.18;
      if (isPlain) { product(ctx, q[0], q[1], w * 1.1, p.px(z, 0.34), PRODC[0], 0, st.plainA, st.plainShine); continue; }
      if (isFancy) { product(ctx, q[0], q[1], w * 1.3, p.px(z, 0.3), null, 1, 1, st.fancyShine); continue; }
      product(ctx, q[0], q[1], w, h, fz(PRODC[(i + l * 2) % 6], z, p, 20), 0, 1);
    }
  }
}
function paperBag(ctx, x, y, s, a, warm) {
  if (a <= 0.003) return;
  if (warm > 0.01) glow(ctx, x, y - 70 * s, 170 * s, [255, 190, 120], 0.6 * warm * a);
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = '#7a5434'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, -86, 18, Math.PI, 0); ctx.stroke();
  const g = ctx.createLinearGradient(-42, 0, 42, 0); g.addColorStop(0, '#a87848'); g.addColorStop(0.4, '#d8a46a'); g.addColorStop(1, '#9a6c40');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-38, -86); ctx.lineTo(38, -86); ctx.lineTo(42, 0); ctx.lineTo(-42, 0); ctx.closePath(); ctx.fill();
  R(ctx, -38, -86, 76, 10, [176, 128, 80]);
  if (warm > 0.01) { const g2 = ctx.createLinearGradient(0, -86, 0, -30); g2.addColorStop(0, rgba([255, 220, 160], 0.85 * warm)); g2.addColorStop(1, 'rgba(255,214,150,0)'); ctx.fillStyle = g2; ctx.fillRect(-38, -86, 76, 56); }
  ctx.restore();
}
function heartPath(ctx, x, y, r) {
  ctx.beginPath(); ctx.moveTo(x, y + r * 0.95);
  ctx.bezierCurveTo(x - r * 1.35, y + r * 0.1, x - r * 1.1, y - r * 1.05, x, y - r * 0.4);
  ctx.bezierCurveTo(x + r * 1.1, y - r * 1.05, x + r * 1.35, y + r * 0.1, x, y + r * 0.95); ctx.closePath();
}
function glowHeart(ctx, x, y, r, a = 1) {
  if (a <= 0.003) return;
  glow(ctx, x, y, r * 5, [255, 170, 120], 0.55 * a); glow(ctx, x, y, r * 2.2, [255, 230, 190], 0.6 * a);
  ctx.save(); ctx.globalAlpha *= a; heartPath(ctx, x, y, r);
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r * 1.3); g.addColorStop(0, '#fff3dc'); g.addColorStop(0.5, '#ff9a7a'); g.addColorStop(1, '#e8505a');
  ctx.fillStyle = g; ctx.fill(); ctx.restore();
}

// ---------- 道具：大厅 ----------
const LOB = BX[3];
function reception(ctx, p, t) {
  const x0 = LOB - 3.4, x1 = LOB - 1.2, z0 = 6.3, z1 = 6.9;
  box3(ctx, p, x0, x1, 0, 1.05, z0, z1, [64, 72, 104]);
  box3(ctx, p, x0 - 0.05, x1 + 0.05, 1.05, 1.1, z0 - 0.06, z1, [220, 210, 196], { edge: 0.6 });
  const a = p(x0, 0.55, z0 - 0.001), b = p(x1, 0.6, z0 - 0.001); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,200,130,0.35)'; ctx.fillRect(a[0], a[1], b[0] - a[0], Math.max(2, p.px(z0, 0.03))); ctx.restore();
  glow(ctx, (a[0] + b[0]) / 2, a[1], p.px(z0, 1.2), WARM, 0.12);
}
function sofa(ctx, p, X0, Z0) {
  const c = [70, 120, 126];
  box3(ctx, p, X0 - 0.9, X0 + 0.9, 0.1, 0.45, Z0 - 0.4, Z0 + 0.4, c);
  box3(ctx, p, X0 - 0.9, X0 + 0.9, 0.45, 0.85, Z0 + 0.22, Z0 + 0.4, mul(c, 0.85));
  for (const s of [-1, 1]) box3(ctx, p, X0 + s * 0.9 - 0.12, X0 + s * 0.9 + 0.12, 0.1, 0.62, Z0 - 0.4, Z0 + 0.4, mul(c, 0.9));
  box3(ctx, p, X0 - 0.6, X0 - 0.2, 0.45, 0.72, Z0 + 0.1, Z0 + 0.22, [220, 110, 110]);
}
// 上司的清单（屏幕坐标，s=缩放）：三行图标 尺子 / 码齐的盒子 / 心，依次打勾
function clipboard(ctx, t, x, y, s, a, CHK) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(-0.06); ctx.scale(s, s);
  RR(ctx, -82, -110, 176, 236, 10, [0, 0, 0], 0.35); RR(ctx, -88, -118, 176, 236, 10, [150, 104, 64]);
  const pg = ctx.createLinearGradient(0, -96, 0, 104); pg.addColorStop(0, '#fffdf6'); pg.addColorStop(1, '#ece6d8'); ctx.fillStyle = pg; ctx.fillRect(-74, -96, 148, 200);
  RR(ctx, -32, -128, 64, 26, 6, [190, 196, 204]); RR(ctx, -20, -134, 40, 12, 5, [150, 156, 166]);
  for (let i = 0; i < 3; i++) {
    const yy = -50 + i * 58;
    ctx.save(); ctx.translate(-34, yy);
    if (i === 0) { RR(ctx, -28, -10, 56, 20, 3, [240, 196, 80]); for (let q = 0; q < 6; q++) R(ctx, -23 + q * 9, -10, 2.2, q % 2 ? 6 : 11, [120, 90, 30]); }
    else if (i === 1) { for (let q = 0; q < 3; q++) RR(ctx, -24, -17 + q * 12, 48, 10, 2, [[110, 160, 230], [104, 196, 132], [238, 156, 80]][q]); }
    else { heartPath(ctx, 0, 0, 16); ctx.fillStyle = '#e8606a'; ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(90,90,100,0.8)'; ctx.lineWidth = 3; ctx.strokeRect(24, yy - 16, 32, 32);
    const u = prog(t, CHK[i], CHK[i] + 0.2);
    if (u > 0) {
      const q = [[26, yy - 2], [38, yy + 12], [64, yy - 24]];
      const pts = u < 0.4 ? [q[0], [lerp(q[0][0], q[1][0], u / 0.4), lerp(q[0][1], q[1][1], u / 0.4)]] : [q[0], q[1], [lerp(q[1][0], q[2][0], (u - 0.4) / 0.6), lerp(q[1][1], q[2][1], (u - 0.4) / 0.6)]];
      ctx.strokeStyle = '#2fa45a'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); pts.forEach(([px, py], j) => j ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.stroke();
    }
  }
  ctx.restore();
  for (let i = 0; i < 3; i++) { const f = vis(t, CHK[i] + 0.12, CHK[i] + 0.7, 0.04, 0.5); if (f > 0) glow(ctx, x + 42 * s, y + (-50 + i * 58 - 6) * s, 90 * s, [140, 255, 170], 0.6 * f * a); }
}

// ---------- 道具：换装（在主角变换里画，跟着转；k2 = 主角相对 0.6 倍时的缩放） ----------
function costumeProps(ctx, k, o, t) {
  const k2 = o.k / 0.891;
  if (k === 0) { // 老师：教鞭
    const [hx, hy] = o.hand; ctx.strokeStyle = '#6a4424'; ctx.lineWidth = 7 * k2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(hx - 6, hy + 4); ctx.lineTo(hx + 128 * k2, hy - 92 * k2); ctx.stroke();
    ctx.fillStyle = '#f4f0e6'; ctx.beginPath(); ctx.arc(hx + 128 * k2, hy - 92 * k2, 5 * k2, 0, 7); ctx.fill();
  } else if (k === 1) { // 教练：红帽 + 哨子
    const [tx, ty] = o.top; ctx.fillStyle = '#e0514a'; ctx.beginPath(); ctx.ellipse(tx + 4, ty + 22 * k2, 58 * k2, 36 * k2, 0.18, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.ellipse(tx + 62 * k2, ty + 26 * k2, 40 * k2, 9 * k2, 0.22, 0, 7); ctx.fill();
    const [mx, my] = o.mouth; ctx.strokeStyle = 'rgba(230,80,70,0.9)'; ctx.lineWidth = 3 * k2; ctx.beginPath(); ctx.moveTo(mx - 30 * k2, my + 30 * k2); ctx.quadraticCurveTo(mx - 10 * k2, my + 70 * k2, mx + 4, my + 6); ctx.stroke();
    X.whistle(ctx, mx + 12 * k2, my + 2, 10 * k2, 0.2, 1);
    const bl = 0.5 + 0.5 * Math.sin(t * 30); ctx.strokeStyle = rgba([255, 255, 255], 0.6 * bl); ctx.lineWidth = 3 * k2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(mx + 42 * k2, my - 6 + (i - 1) * 12 * k2); ctx.lineTo(mx + 66 * k2, my - 10 + (i - 1) * 18 * k2); ctx.stroke(); }
  } else if (k === 2) { // 销售：商品袋
    const [hx, hy] = o.hand, bs = 1.45 * k2, by = hy + 130 * k2;
    ctx.save(); ctx.translate(hx + 10, by); R(ctx, -30 * bs, -112 * bs, 16 * bs, 34 * bs, [240, 196, 110]); RR(ctx, 4 * bs, -122 * bs, 18 * bs, 44 * bs, 5, [110, 180, 230]); ctx.restore();
    paperBag(ctx, hx + 10, by, bs, 1, 0.25);
    ctx.fillStyle = '#e8606a'; heartPath(ctx, hx + 10, by - 42 * bs, 12 * bs); ctx.fill();
  } else if (k === 3) { // 秘书：眼镜 + 文件夹
    ctx.strokeStyle = '#2b2b30'; ctx.lineWidth = 3.4 * k2; for (const e of [o.eyeL, o.eyeR]) { ctx.beginPath(); ctx.arc(e[0], e[1], 11 * k2, 0, 7); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(o.eyeL[0] + 11 * k2, o.eyeL[1]); ctx.lineTo(o.eyeR[0] - 11 * k2, o.eyeR[1]); ctx.stroke();
    const [hx, hy] = o.hand; ctx.save(); ctx.translate(hx - 8, hy + 30 * k2); ctx.rotate(-0.25);
    RR(ctx, -46 * k2, -62 * k2, 92 * k2, 120 * k2, 6, [70, 120, 210]); R(ctx, -40 * k2, -70 * k2, 80 * k2, 10 * k2, [250, 250, 246]); RR(ctx, -46 * k2, -62 * k2, 92 * k2, 18 * k2, 6, [96, 146, 236]);
    ctx.restore();
  } else if (k === 4) { // 前台：耳麦
    const [tx, ty] = o.top, [ex, ey] = o.eyeR; ctx.strokeStyle = '#2f2f36'; ctx.lineWidth = 6 * k2;
    ctx.beginPath(); ctx.arc(tx - 6 * k2, ty + 74 * k2, 66 * k2, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
    RR(ctx, tx - 84 * k2, ty + 64 * k2, 22 * k2, 34 * k2, 8, [47, 47, 54]);
    ctx.lineWidth = 3.5 * k2; ctx.beginPath(); ctx.moveTo(tx - 70 * k2, ty + 96 * k2); ctx.quadraticCurveTo(ex - 24 * k2, ey + 64 * k2, o.mouth[0] - 6 * k2, o.mouth[1] + 6 * k2); ctx.stroke();
    ctx.fillStyle = '#2f2f36'; ctx.beginPath(); ctx.arc(o.mouth[0] - 6 * k2, o.mouth[1] + 6 * k2, 6 * k2, 0, 7); ctx.fill();
  }
}
function blackboard(ctx, x, y, s, a) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = '#7a5434'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(-30, -300); ctx.moveTo(60, 0); ctx.lineTo(30, -300); ctx.stroke();
  RR(ctx, -92, -330, 184, 132, 8, [110, 78, 50]); R(ctx, -82, -320, 164, 112, [38, 72, 58]);
  ctx.strokeStyle = 'rgba(240,244,236,0.9)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(-30, -262, 26, 0, 7); ctx.moveTo(-30, -288); ctx.quadraticCurveTo(-24, -304, -12, -306); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-24, -286); ctx.quadraticCurveTo(-4, -300, 2, -284); ctx.quadraticCurveTo(-14, -278, -24, -286); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(14, -232); ctx.lineTo(40, -232); ctx.lineTo(40, -262); ctx.lineTo(66, -262); ctx.lineTo(66, -232); ctx.moveTo(10, -258); ctx.lineTo(40, -290); ctx.lineTo(70, -258); ctx.stroke();
  ctx.restore();
}
function frontDesk(ctx, x, y, s, a, ring) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s);
  const g = ctx.createLinearGradient(0, -128, 0, 0); g.addColorStop(0, '#a87650'); g.addColorStop(1, '#6e4a32'); ctx.fillStyle = g; ctx.fillRect(-130, -128, 260, 128);
  R(ctx, -138, -140, 276, 16, [104, 70, 48]); R(ctx, -130, -70, 260, 6, [120, 82, 56]); RR(ctx, -70, -108, 140, 26, 6, [232, 200, 120]);
  const bx = 58, by = -140;
  RR(ctx, bx - 30, by - 8, 60, 8, 3, [90, 80, 70]);
  const bg = ctx.createLinearGradient(bx - 26, by - 40, bx + 26, by); bg.addColorStop(0, '#fff2bc'); bg.addColorStop(0.5, '#e2b450'); bg.addColorStop(1, '#8a6420');
  ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(bx, by - 8, 26, Math.PI, 0); ctx.fill(); R(ctx, bx - 3, by - 44, 6, 10, [120, 90, 40]);
  ctx.restore();
  if (ring > 0) glow(ctx, x + bx * s, y + (by - 22) * s, 80 * s, [255, 226, 150], 0.5 * ring * a);
}
function badge(ctx, o, a, flash, dir = 1) {
  if (a <= 0.003) return;
  const k2 = o.k / 0.891, [cx, cy] = o.chest, bx = cx + dir * 18 * k2, by = cy + 40 * k2;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.strokeStyle = '#3a6fc0'; ctx.lineWidth = 3.5 * k2; ctx.beginPath(); ctx.moveTo(cx - dir * 16 * k2, cy - 46 * k2); ctx.lineTo(bx, by - 18 * k2); ctx.lineTo(cx + dir * 44 * k2, cy - 40 * k2); ctx.stroke();
  RR(ctx, bx - 16 * k2, by - 18 * k2, 32 * k2, 42 * k2, 4, [252, 252, 248]); R(ctx, bx - 16 * k2, by - 18 * k2, 32 * k2, 10 * k2, [58, 112, 196]);
  ctx.fillStyle = '#e2b450'; ctx.beginPath(); ctx.arc(bx, by + 6 * k2, 6 * k2, 0, 7); ctx.fill();
  ctx.restore();
  if (flash > 0) glow(ctx, bx, by, 130 * k2, [255, 214, 140], 0.8 * flash);
}

// ---------- 事件时间 ----------
// E03：三个同事各从货架上取走一箱，他从推车上抛一箱补进同一格
const EV3 = [
  { key: 'isfp-female', pos: [WH + 0.82, 5.1], slot: [1, 2, 1, 0], tk: at('E03', '军需官') - 0.3, flip: false },
  { key: 'entp-male', pos: [WH - 0.8, 7.35], slot: [0, 3, 2, 1], tk: at('E03', '要用') - 0.35, flip: true },
  { key: 'istj-male', pos: [WH + 0.82, 8.7], slot: [1, 4, 0, 1], tk: at('E03', '永远') - 0.45, flip: false },
].map(e => ({ ...e, tl: e.tk + 0.3, ta: e.tk + 0.8 }));
// E04：门店
const CUST_IN = E4 + 0.05, Q_T = E4 + 0.95, ANS_T = at('E04', '真心') - 0.05;
const BAG_T = at('E04', '顾客买走') - 0.35, REACH_T = at('E04', '买走') + 0.25;
const H_FORM = at('E04', '不只是') + 0.05, H_FLY = at('E04', '还有') - 0.3, H_LAND = at('E04', '还有') + 0.3;
const TAKE_T = at('E04', '热心') - 0.05, CUST_OUT = TAKE_T + 0.35;
const BAG = [SHOP - 0.18, CTR.y, 2.74];
// E05 / E06
const CHK = [at('E05', '守规矩') - 0.05, at('E05', '有条理') - 0.05, at('E05', '忠心') - 0.05];
const BOSS_OUT = E6 + 0.15;
// 五套职业装，最后（停顿里）再转一圈变回他自己
const SWAP = [...['老师', '教练', '销售', '秘书', '前台'].map(w => at('E06', w) - 0.08), STILL + 0.35];
const COS = [[120, 210, 160], [240, 96, 84], [250, 182, 84], [116, 164, 240], [255, 212, 120], [255, 200, 120]];
const costumeAt = t => { let k = -1; for (let i = 0; i < SWAP.length; i++) if (t >= SWAP[i]) k = i; return k; };
const SPOT = t => vis(t, E6 + 0.3, TE + 1, 0.6, 0);

// ---------- 主角路线 ----------
const MOVES = [], START = [BX[0] - 1.8, 2.6];
function posAt(t) { let q = START; for (const m of MOVES) { if (t < m.t0) break; if (t >= m.t1) { q = m.p1; continue; } const u = easeInOut(prog(t, m.t0, m.t1)); return [lerp(m.p0[0], m.p1[0], u), lerp(m.p0[1], m.p1[1], u)]; } return q; }
const mvTo = (t0, t1, p1, hz = 2.6) => MOVES.push({ t0, t1, p0: posAt(t0), p1, hz });
const BSPOT = [-0.9, 3.55], CSPOT = DESK.slice(0, 3).map(([x, z]) => [x - 0.62, z - 0.62]);
mvTo(T0, T0 + 1.3, [0.1, 2.75], 2.3);
for (const c of CYC) { const hz = c.fast ? 4.6 : 3.2; mvTo(c.t0, c.t0 + 0.3 * c.d, BSPOT, hz); mvTo(c.t0 + 0.42 * c.d, c.t0 + 0.76 * c.d, CSPOT[c.ci], hz); }
mvTo(PANS[0][0], PANS[0][1], [WH - 0.78, 3.0], 5.5);
mvTo(E3 + 0.45, PANS[1][0] - 0.05, [WH - 0.78, 3.4], 0);
mvTo(PANS[1][0], PANS[1][1], [SHOP + 0.42, 3.32], 5.5);
mvTo(PANS[2][0], PANS[2][1], [LOB + 0.72, 3.55], 5.5);
mvTo(E6 + 0.05, E6 + 0.65, [LOB + 0.12, 3.05], 2.4);
function heroMove(t) {
  const q = posAt(t); let m = null, dirX = 1;
  for (const v of MOVES) { if (t >= v.t0 && t < v.t1) m = v; if (v.t0 <= t && Math.abs(v.p1[0] - v.p0[0]) > 0.05) dirX = Math.sign(v.p1[0] - v.p0[0]); }
  const r = { X: q[0], Z: q[1], moving: !!(m && m.hz > 0), flip: dirX < 0, bob: 0, hipB: 0, hipF: 0, hz: m ? m.hz : 0 };
  if (r.moving) { const ph = (t - m.t0) * m.hz * Math.PI * 2; r.bob = Math.abs(Math.sin(ph)) * 9; r.hipB = Math.sin(ph) * 0.38; r.hipF = -Math.sin(ph) * 0.38; }
  return r;
}
function heroPose(t) {
  const m = heroMove(t), o = { flip: m.flip, bob: m.bob, hipB: m.hipB, hipF: m.hipF, mouth: 'smile', eyes: 'open', cake: false, umbrella: true, book: true, rs: -0.15, re: -0.2, glow: 0, nod: 0, m: 1.75 };
  if (t < E2 - 0.1) { // E01：走进来，胸口暖光 → 飞出去点灯 → 收回变工牌
    o.glow = Math.max(0.35 + 0.6 * smooth(prog(t, at('E01', '在意') - 0.2, PULSE)) * (1 - smooth(prog(t, PULSE, PULSE + 0.25))), 1.1 * vis(t, BADGE_T - 0.1, BADGE_T + 0.8, 0.1, 0.6));
    if (t > PULSE - 0.1 && t < PULSE + 0.35) { const u = prog(t, PULSE - 0.1, PULSE + 0.35); o.rs = -0.15 - 1.2 * Math.sin(u * Math.PI); o.re = -0.2 - 0.5 * Math.sin(u * Math.PI); }
    if (t > LAMP_T[2]) { o.eyes = 'happy'; o.mouth = 'grin'; }
    o.nod = -0.5 * Math.sin(prog(t, LAMP_T[0], LAMP_T[5] + 0.3) * Math.PI); // 抬头看灯一盏盏亮
  }
  for (const c of CYC) { // E02：取卡 / 递卡
    const u = (t - c.t0) / c.d; if (u < 0 || u >= 1) continue;
    if (u > 0.28 && u < 0.44) { o.flip = true; const v = Math.sin(prog(u, 0.28, 0.44) * Math.PI); o.rs = -1.15 * v; o.re = -0.4 * v; }
    if (u > 0.74) { o.flip = false; o.rs = -0.6 * Math.sin(prog(u, 0.74, 1) * Math.PI); }
    o.eyes = c.fast ? 'happy' : 'open'; o.mouth = 'grin';
  }
  if (t >= E3 - 0.1 && t < PANS[1][0]) { // E03：从推车上抛箱子
    if (!m.moving) o.flip = false; o.mouth = 'grin'; o.eyes = 'open';
    for (const e of EV3) { const u = prog(t, e.tl - 0.28, e.tl + 0.22); if (u > 0 && u < 1) { o.rs = u < 0.5 ? lerp(-0.15, 0.5, smooth(u / 0.5)) : lerp(0.5, -1.7, easeOut((u - 0.5) / 0.5)); o.re = -0.5 * Math.sin(u * Math.PI); } if (t > e.tl + 0.22 && t < e.tl + 0.6) { o.rs = lerp(-1.7, -0.2, smooth(prog(t, e.tl + 0.22, e.tl + 0.6))); } if (t > e.ta) o.eyes = 'happy'; }
  }
  if (t >= PANS[1][1] - 0.1 && t < PANS[2][0]) { // E04：柜台后
    o.flip = true; o.mouth = 'grin';
    const lk = vis(t, Q_T + 0.15, ANS_T - 0.4, 0.1, 0.1); if (lk > 0) { o.nod = -0.6 * lk; o.flip = Math.sin((t - Q_T) * 7) > 0; o.mouth = 'o'; } // 回头在两件货之间看
    const rc = vis(t, ANS_T - 0.5, ANS_T - 0.1, 0.12, 0.12); if (rc > 0) { o.flip = false; o.rs = -1.3 * rc; o.re = -0.3 * rc; }
    if (t > ANS_T - 0.1 && t < BAG_T + 0.3) { o.rs = -0.5; o.re = -0.3; }
    const hp = vis(t, H_FORM - 0.15, H_FLY + 0.1, 0.15, 0.2); if (hp > 0) { o.rs = lerp(o.rs, 0.4, hp); o.re = lerp(o.re, -1.5, hp); }
    const pu = vis(t, H_FLY, H_LAND + 0.2, 0.08, 0.3); if (pu > 0) o.rs = lerp(o.rs, -0.9, pu);
    o.glow = Math.max(1.2 * vis(t, H_FORM - 0.1, H_FLY + 0.1, 0.25, 0.2), 0.45 * vis(t, H_LAND, PANS[2][0], 0.1, 0.5));
    o.eyes = t > H_LAND ? 'happy' : 'open';
  }
  if (t >= PANS[2][1] - 0.1 && t < SWAP[0] - 0.2) { // E05：站直，被打一个勾亮一分
    o.flip = true; let n = 0; for (const c of CHK) if (t >= c + 0.15) n++;
    o.glow = 0.3 * n + 0.3 * vis(t, CHK[Math.max(0, n - 1)], CHK[Math.max(0, n - 1)] + 0.5, 0.05, 0.4) * (n ? 1 : 0); o.mouth = n ? 'grin' : 'smile'; o.eyes = n >= 3 ? 'happy' : 'open';
    for (const c of CHK) o.nod -= 0.7 * Math.sin(prog(t, c + 0.1, c + 0.4) * Math.PI);
    o.bob += bounce(t, CHK[2] + 0.15, 12); o.rs = -0.1; o.re = -0.1;
  }
  if (t >= SWAP[0] - 0.2) { // E06：换装
    o.umbrella = false; o.book = false; o.flip = false; o.mouth = 'grin'; o.eyes = t > STILL ? 'happy' : 'open'; o.glow = 0.3 + 0.25 * vis(t, SWAP[4], STILL + 0.8, 0.1, 0.6);
    const k = costumeAt(t);
    if (k === 0) { o.rs = -1.2; o.re = -0.3; } else if (k === 1) { o.rs = -0.8; o.re = 0.3; } else if (k === 2) { o.rs = -0.5; o.re = 0.5; } else if (k === 3) { o.rs = -0.25; o.re = 0.2; } else if (k === 4) { o.rs = -0.35; o.re = 0.9; }
    else if (k === 5) { o.umbrella = true; o.book = true; o.rs = -0.15; o.re = -0.2; o.eyes = 'happy'; o.glow = 0.55; }
    if (t > STILL) o.bob += Math.sin((t - STILL) * 2.2) * 2;
  }
  return { m, o };
}

// ---------- 镜头 ----------
const CK = [
  [T0, { x0: -0.7, z0: -0.15, h: 1.4, f: 1250, cy: 590, pitch: 0 }],
  [T0 + 1.35, { x0: -0.22, z0: -0.35, h: 1.45, f: 1250, cy: 600, pitch: 0 }],
  [PULSE + 0.05, { x0: -0.2, z0: -0.42, h: 1.45, f: 1250, cy: 600, pitch: 0 }],
  [PULSE + 0.95, { x0: -0.05, z0: -1.2, h: 1.7, f: 1150, cy: 660, pitch: -0.05 }],
  [BADGE_T + 0.35, { x0: -0.25, z0: -0.85, h: 1.6, f: 1200, cy: 620, pitch: 0 }],
  [E2 + 0.3, { x0: -0.45, z0: -0.8, h: 1.6, f: 1200, cy: 610, pitch: 0 }],
  [PANS[0][0], { x0: -0.3, z0: -0.6, h: 1.6, f: 1200, cy: 610, pitch: 0 }],
  [PANS[0][1], { x0: WH + 0.2, z0: -0.7, h: 1.5, f: 1150, cy: 600, pitch: 0 }],
  [PANS[1][0], { x0: WH + 0.25, z0: 0.4, h: 1.47, f: 1150, cy: 600, pitch: 0 }],
  [PANS[1][1], { x0: SHOP - 0.3, z0: -0.55, h: 1.72, f: 1250, cy: 640, pitch: 0.07 }],
  [H_FORM - 0.3, { x0: SHOP - 0.25, z0: -0.4, h: 1.72, f: 1250, cy: 640, pitch: 0.07 }],
  [H_LAND + 0.1, { x0: SHOP - 0.2, z0: 0.45, h: 1.6, f: 1250, cy: 640, pitch: 0.06 }],
  [PANS[2][0], { x0: SHOP - 0.2, z0: 0.35, h: 1.6, f: 1250, cy: 640, pitch: 0.06 }],
  [PANS[2][1], { x0: LOB - 0.05, z0: -0.2, h: 1.5, f: 1150, cy: 600, pitch: 0 }],
  [E6 + 0.2, { x0: LOB + 0.0, z0: -0.05, h: 1.5, f: 1150, cy: 600, pitch: 0 }],
  [E6 + 1.0, { x0: LOB + 0.3, z0: 0.5, h: 1.5, f: 1150, cy: 560, pitch: 0 }],
  [STILL, { x0: LOB + 0.3, z0: 0.6, h: 1.5, f: 1150, cy: 560, pitch: 0 }],
  [TE - 0.35, { x0: LOB + 0.15, z0: -1.25, h: 1.95, f: 1100, cy: 620, pitch: 0.05 }],
];
function camAt(t) {
  let i = 0; while (i < CK.length - 2 && t > CK[i + 1][0]) i++;
  const [ta, a] = CK[i], [tb, b] = CK[i + 1], u = easeInOut(prog(t, ta, tb)), c = {};
  for (const k in a) c[k] = lerp(a[k], b[k], u);
  const fw = vis(t, E2, PANS[0][0], 0.5, 0.45); if (fw > 0) c.x0 += 0.32 * (heroMove(t).X + 0.2) * fw; // E02 镜头跟着他跑
  c.x0 += Math.sin(t * 0.7) * 0.03; c.h += Math.sin(t * 0.9) * 0.012;
  return c;
}
const panU = t => { for (const [a, b] of PANS) if (t > a && t < b) return prog(t, a, b); return -1; };

// ---------- 人：按场景光上色 ----------
function nearLamp(p, X0, Z0, t) {
  let best = null, bd = 1e9; for (const L of LAMPS) { const d = Math.hypot(L.X - X0, L.Z - Z0) + (L.on(t) < 0.3 ? 6 : 0); if (d < bd) { bd = d; best = L; } }
  const q = p(best.X, CEIL - best.drop, best.Z); return { x: q[0], y: q[1], on: best.on(t), c: best.c };
}
function litAt(ctx, p, t, X0, Z0, fn, k = 1) {
  const L = nearLamp(p, X0, Z0, t);
  return E.lit(ctx, fn, { x: L.x, y: L.y, r: p.px(Z0, 4.2), c: L.c, k: 0.3 * L.on * k, amb: 0.42 + 0.3 * (1 - L.on) });
}
const folk = (c, p, key, X0, Z0, o) => E.folk3(c, p, key, X0, Z0, { m: 1.66, ...o });

// ---------- 画面 ----------
let STATE = null;
function draw(ctx, t) {
  const c = camAt(t), p = E.cam3(c), s = skyAt(t), x0 = p.x0;
  const near = X0 => Math.abs(X0 - x0) < 8.5;
  backdrop(ctx, p, t, s);
  shell(ctx, p, t, s);
  const spot = SPOT(t), dimK = 1 - 0.5 * spot;
  for (const L of LAMPS) if (near(L.X)) lampFloor(ctx, p, L, t, L.X === BX[3] + 0 ? 1 : 1);
  const items = [], add = (Z0, fn, bias = 0) => items.push({ d: p.depth(Z0) + bias, fn });
  const PTS = {};
  const { m: hm, o: ho } = heroPose(t);
  // —— 柱子（开间分界），近处的在横移时扫过画面 ——
  for (let b = 0; b <= 4; b++) { const xb = BX[0] - HW + b * 2 * HW; if (!near(xb)) continue; for (const z of [-5.5, 0.7, 4.6, 8.4]) add(z, () => pillar(ctx, p, xb, z), 0.3); }
  for (const L of LAMPS) if (near(L.X)) add(L.Z, () => lampDraw(ctx, p, L, t), -0.01);
  // —— 办公室 ——
  if (near(BX[0])) {
    DESK.forEach(([dx, dz], i) => add(dz - 0.35, () => desk(ctx, p, t, BX[0] + dx, dz, deskOn(i, t))));
    add(BOARD[1], () => board(ctx, p, t));
    add(2.2, () => plant(ctx, p, BX[0] - 3.4, 2.2, t, 1.5)); add(7.6, () => plant(ctx, p, BX[0] + 3.5, 7.6, t, 1.3));
    const CKEY = ['istj-female', 'enfp-male', 'intp-female', 'isfj-male', 'esfp-female'];
    for (let ci = 0; ci < 5; ci++) {
      const [dx, dz] = DESK[ci], cx = BX[0] + dx - 0.12, cz = dz + 0.45, on = deskOn(ci, t);
      add(cz, () => {
        let got = 0, bob = Math.abs(Math.sin(t * 2.4 + ci)) * 2, inner = 0, lean = 0;
        for (const cy of CYC) if (cy.ci === ci && ci < 3) { const tg = cy.t0 + 0.9 * cy.d; if (t >= tg) { got++; bob += bounce(t, tg, 14); inner = Math.max(inner, 0.2 + 0.6 * Math.exp(-(t - tg) * 3)); } const tr = cy.t0 + 0.72 * cy.d; if (t > tr && t < tg + 0.2) lean = -0.08 * Math.sin(prog(t, tr, tg + 0.2) * Math.PI); }
        const out = litAt(ctx, p, t, cx, cz, cc => folk(cc, p, CKEY[ci], cx, cz, { flip: ci < 3 ? (cx > hm.X) : ci === 4, gray: 0.55 * (1 - on), dim: 0.35 * (1 - on), bob, inner, lean }));
        PTS['c' + ci] = out;
        for (let q = 0; q < Math.min(got, 3); q++) taskCard(ctx, out.chest[0] - p.px(cz, 0.12) + q * 4, out.chest[1] + p.px(cz, 0.12) - q * 4, ROWC[ci], p.px(cz, 0.006), -0.15 + q * 0.12, 1);
      });
    }
    // 前景虚焦：一盆很近的绿植
    add(0.95, () => { ctx.save(); ctx.filter = 'blur(16px)'; ctx.globalAlpha = 0.9; plant(ctx, p, BX[0] - 1.25, 0.95, t, 1.2); ctx.restore(); }, 0);
  }
  // —— 仓库 ——
  const cartZ = 3.3 + (3.4 - 3.0) * smooth(prog(t, E3 + 0.45, PANS[1][0] - 0.05));
  if (near(WH)) {
    const slotFn = (sd, g, l, k) => {
      for (const e of EV3) { const [a, b, c2, d] = e.slot; if (a === sd && b === g && c2 === l && d === k) {
        if (t < e.tk) return { a: 1, dy: 0, glo: 0 };
        if (t < e.ta) return { a: 0, gap: prog(t, e.tk + 0.25, e.tk + 0.4), dy: 0 };
        const u = t - e.ta; return { a: 1, dy: Math.max(0, 0.08 * Math.sin(u * 22) * Math.exp(-u * 8)), glo: Math.exp(-u * 2.5) };
      } }
      return { a: 1, dy: 0, glo: 0 };
    };
    for (let g = 0; g < SH.n; g++) for (let sd = 0; sd < 2; sd++) add(SH.z0 + g * SH.seg, () => shelfSeg(ctx, p, t, sd, g, slotFn), 0.05);
    let nBox = 6; for (const e of EV3) if (t > e.tl) nBox--;
    add(cartZ - 0.48, () => cart(ctx, p, t, CARTX, cartZ, nBox));
    EV3.forEach((e, i) => {
      const [ex, ez] = e.pos, sp = slotPos(...e.slot), dir = e.flip ? -1 : 1;
      add(ez, () => {
        const reach = vis(t, e.tk - 0.3, e.tk + 0.25, 0.2, 0.3);
        const out = litAt(ctx, p, t, ex, ez, cc => folk(cc, p, e.key, ex, ez, { flip: t > e.tk + 0.55 ? !e.flip : e.flip, lean: dir * 0.1 * reach, inner: t > e.tk + 0.3 ? 0.5 * Math.exp(-(t - e.tk - 0.3) * 1.5) + 0.15 : 0, bob: bounce(t, e.tk + 0.3, 10) }));
        PTS['w' + i] = out;
      });
      // 被取走的那一箱：从货架飞到同事手里，然后一直抱着
      if (t > e.tk) add(ez - 0.2, () => {
        const u = easeInOut(prog(t, e.tk, e.tk + 0.3)), hx = ex + dir * (t > e.tk + 0.55 ? -0.05 : 0.18), hy = 0.95;
        cbox(ctx, p, lerp(sp.X, hx, u), lerp(sp.Y, hy, u) + Math.sin(u * Math.PI) * 0.15, lerp(sp.Z, ez - 0.2, u), boxH(...e.slot) * lerp(1, 0.85, u), BOXC[(e.slot[1] + e.slot[2] + e.slot[3]) % 4], 1, 0, 0.42, 0.42);
      });
      // 他抛出的新一箱：从推车划一道弧补进同一格
      if (t > e.tl && t < e.ta) {
        const u = prog(t, e.tl, e.ta), eu = easeInOut(u), fx = lerp(CARTX, sp.X, eu), fy = lerp(1.0, sp.Y, eu) + Math.sin(u * Math.PI) * 0.9, fzz = lerp(cartZ, sp.Z, eu);
        add(fzz, () => {
          for (let q = 1; q < 8; q++) { const u2 = clamp(u - q * 0.04), e2 = easeInOut(u2), tq = p(lerp(CARTX, sp.X, e2), lerp(1.0, sp.Y, e2) + Math.sin(u2 * Math.PI) * 0.9 + 0.2, lerp(cartZ, sp.Z, e2)); glow(ctx, tq[0], tq[1], p.px(fzz, 0.35) * (1 - q / 9), [255, 210, 140], 0.35 * (1 - q / 8)); }
          cbox(ctx, p, fx, fy, fzz, boxH(...e.slot), BOXC[(e.slot[1] + e.slot[2] + e.slot[3]) % 4], 1, 0.6);
        }, -0.02);
      }
      if (t > e.ta && t < e.ta + 0.5) add(sp.Z, () => { const q = p(sp.X, sp.Y + 0.25, sp.Z), u = (t - e.ta) / 0.5; glow(ctx, q[0], q[1], p.px(sp.Z, 0.5 + u * 1.2), [255, 230, 170], 0.7 * (1 - u)); }, -0.05);
    });
  }
  // —— 门店 ——
  if (near(SHOP)) {
    const shine = vis(t, Q_T + 0.15, ANS_T - 0.35, 0.15, 0.15), alt = 0.5 + 0.5 * Math.sin((t - Q_T) * 7);
    add(PSH.z, () => prodShelf(ctx, p, t, { plainA: t > ANS_T - 0.45 && t < ANS_T + 2.5 ? 0 : 1, plainShine: shine * (1 - alt) + 0.6 * vis(t, ANS_T - 0.6, ANS_T - 0.4, 0.05, 0.05), fancyShine: shine * alt }), 0.05);
    add(CTR.z0, () => counter(ctx, p, t));
    add(1.8, () => plant(ctx, p, SHOP - 3.2, 1.8, t, 1.2));
    // 顾客
    if (t > CUST_IN - 0.2 && t < CUST_OUT + 1.6) {
      let cx = SHOP - 1.05, cz = 2.25, flip = false, bob = 0, a = 1, walk = 0;
      if (t < CUST_IN + 1.0) { const u = easeInOut(prog(t, CUST_IN, CUST_IN + 1.0)); cx = lerp(SHOP - 2.7, SHOP - 1.05, u); walk = t > CUST_IN ? 1 : 0; }
      if (t > CUST_OUT) { const u = easeInOut(prog(t, CUST_OUT, CUST_OUT + 1.2)); cx = lerp(SHOP - 1.05, SHOP - 3.0, u); flip = true; walk = u < 1 ? 1 : 0; }
      if (walk) bob = Math.abs(Math.sin(t * 15)) * p.px(cz, 0.02);
      const reach = vis(t, REACH_T, TAKE_T + 0.2, 0.2, 0.2);
      add(cz, () => {
        const out = litAt(ctx, p, t, cx, cz, cc => folk(cc, p, 'infp-female', cx, cz, { flip, bob, lean: 0.06 * reach, inner: 0.7 * vis(t, H_LAND, 1e9, 0.3, 0) }));
        PTS.cust = out; PTS.custX = cx;
      });
    }
    // 袋子、货、心
    add(BAG[2] - 0.05, () => {
      const bq = p(...BAG), bs = p.px(BAG[2], 0.0042);
      let bx = bq[0], by = bq[1], ba = B.popIn(t, BAG_T - 0.1);
      if (t > TAKE_T && PTS.cust) { const v = easeInOut(prog(t, TAKE_T, TAKE_T + 0.3)); const hq = [PTS.cust.chest[0] + p.px(2.25, 0.22), PTS.cust.chest[1] + p.px(2.1, 0.42)]; bx = lerp(bq[0], hq[0], v); by = lerp(bq[1], hq[1], v); }
      if (t > BAG_T - 0.1 && t < CUST_OUT + 1.6) {
        const warm = vis(t, H_LAND - 0.05, 1e9, 0.1, 0) * (0.85 + 0.15 * Math.sin(t * 6));
        paperBag(ctx, bx, by, bs * Math.min(1, ba), 1, warm);
        if (t > H_LAND) glowHeart(ctx, bx, by - 86 * bs + Math.sin(t * 4) * 3, 14 * bs, 0.9);
        if (t > H_LAND && t < H_LAND + 0.7) { const u = (t - H_LAND) / 0.7; glow(ctx, bx, by - 60 * bs, (120 + u * 220) * bs, [255, 214, 150], 0.8 * (1 - u)); }
      }
      PTS.bag = [bx, by, bs];
    }, -0.3);
  }
  // —— 大厅 ——
  if (near(LOB)) {
    add(6.3, () => reception(ctx, p, t));
    add(7.8, () => sofa(ctx, p, LOB + 2.4, 7.8));
    add(5.2, () => plant(ctx, p, LOB + 3.4, 5.2, t, 1.6)); add(3.0, () => plant(ctx, p, LOB - 3.5, 3.0, t, 1.4));
    // 上司
    if (t < BOSS_OUT + 1.3) {
      let bx = LOB - 0.62, bz = 1.95, flip = false, bob = 0, a = 1;
      if (t > BOSS_OUT) { const u = easeInOut(prog(t, BOSS_OUT, BOSS_OUT + 1.1)); bx = lerp(LOB - 0.62, LOB - 2.9, u); flip = true; bob = Math.abs(Math.sin(t * 14)) * 8; a = 1 - prog(t, BOSS_OUT + 0.8, BOSS_OUT + 1.1); }
      for (const ck of CHK) bob += bounce(t, ck, 5);
      add(bz, () => { const out = litAt(ctx, p, t, bx, bz, cc => folk(cc, p, 'estj-female', bx, bz, { m: 1.7, flip, bob, a })); PTS.boss = out; PTS.bossA = a; PTS.bossZ = bz; });
    }
    // E06 聚光：周围压暗，一束光落在他身上
    if (spot > 0.01) add(hm.Z, () => {
      ctx.save(); ctx.fillStyle = rgba([6, 6, 14], 0.42 * spot); ctx.fillRect(0, 0, W, H); ctx.restore();
      const top = p(hm.X, CEIL, hm.Z), fl = p(hm.X, 0, hm.Z), col = mix([255, 226, 170], COS[Math.max(0, costumeAt(t))], 0.25);
      E.cone(ctx, top[0], top[1], fl[1] + 20, p.px(hm.Z, 0.5), p.px(hm.Z, 2.0), col, 0.2 * spot);
      E.pool(ctx, p, hm.X, hm.Z, 1.7, col, 0.26 * spot);
      for (let i = 0; i < 22; i++) { const u = (t * 0.06 + hash(i * 2.3)) % 1, q = p(hm.X + (hash(i * 5.1) - 0.5) * 1.6 * (0.3 + u), CEIL - u * CEIL, hm.Z + (hash(i * 7.7) - 0.5) * 0.6); glow(ctx, q[0], q[1], p.px(hm.Z, 0.03), [255, 236, 200], 0.6 * spot * Math.sin(u * Math.PI)); }
    }, 0.12);
    const k = costumeAt(t);
    if (k === 0) add(hm.Z + 0.35, () => { const q = p(hm.X + 0.72, 0, hm.Z + 0.35); blackboard(ctx, q[0], q[1], p.px(hm.Z + 0.35, 1.5) / 330 * B.popIn(t, SWAP[0]), 1); }, 0.01);
    if (k === 4) add(hm.Z - 0.3, () => { const q = p(hm.X + 0.62, 0, hm.Z - 0.3), sc = p.px(hm.Z - 0.3, 0.58) / 140 * B.popIn(t, SWAP[4]); frontDesk(ctx, q[0], q[1], sc, 1, vis(t, SWAP[4] + 0.1, SWAP[4] + 0.7, 0.05, 0.4)); }, -0.05);
  }
  // —— 主角（+ E02 快跑残影 + E06 转身换装） ——
  add(hm.Z, () => {
    const fastNow = CYC.some(cy => cy.fast && t >= cy.t0 && t < cy.t0 + cy.d) || panU(t) > 0;
    if (fastNow) for (let g = 3; g >= 1; g--) { const q = heroPose(t - g * 0.045); E.hero3(ctx, p, q.m.X, q.m.Z, { ...q.o, a: 0.3 - g * 0.07, warm: 0.7, glow: 0, shadow: 0 }); }
    let sx = 1, spinP = -1;
    for (let i = 0; i < SWAP.length; i++) { const u = prog(t, SWAP[i] - 0.15, SWAP[i] + 0.15); if (u > 0 && u < 1) { sx = Math.cos(u * Math.PI * 2); spinP = u; } }
    if (Math.abs(sx) < 0.06) sx = sx < 0 ? -0.06 : 0.06;
    const hx = p(hm.X, 0, hm.Z)[0], k = costumeAt(t);
    const out = litAt(ctx, p, t, hm.X, hm.Z, cc => {
      cc.save(); cc.translate(hx, 0); cc.scale(sx, 1); cc.translate(-hx, 0);
      const r = E.hero3(cc, p, hm.X, hm.Z, ho);
      const kk = spinP >= 0 && spinP < 0.25 ? k - 1 : k; if (kk >= 0) costumeProps(cc, kk, r, t);
      const bA = (t >= BADGE_T && t < SWAP[0] - 0.15) || kk === 5 ? prog(t, BADGE_T, BADGE_T + 0.12) : 0;
      badge(cc, r, bA, Math.max(vis(t, BADGE_T, BADGE_T + 0.8, 0.05, 0.6), vis(t, SWAP[5], SWAP[5] + 0.8, 0.05, 0.6)), ho.flip ? -1 : 1);
      cc.restore(); return r;
    }, 1.25 + 0.6 * spot);
    PTS.hero = out;
    // 换装余波：彩色碎光甩出去 + 地上一圈光环
    for (let i = 0; i < SWAP.length; i++) {
      const u = t - SWAP[i] + 0.05; if (u < 0 || u > 0.7) continue;
      const col = COS[i], cx = out.chest[0], cy = out.chest[1], R0 = p.px(hm.Z, 0.35);
      for (let q = 0; q < 26; q++) { const an = q / 26 * Math.PI * 2 + hash(q + i * 7) * 0.4, r = R0 + easeOut(u / 0.7) * (R0 * 1.6 + hash(q * 3.1 + i) * R0); glow(ctx, cx + Math.cos(an + u * 2.4) * r, cy + Math.sin(an + u * 2.4) * r * 0.8, p.px(hm.Z, 0.05) * (1 + hash(q)), col, 0.8 * (1 - u / 0.7)); }
      // 地上一圈柔光环往外扩（按透视压扁的径向渐变环，不是细线）
      const fq = p(hm.X, 0, hm.Z), rx = p.px(hm.Z, 0.3 + u * 1.7), ry = rx * clamp(p.h / p.depth(hm.Z) * 1.2, 0.12, 0.6);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(fq[0], fq[1]); ctx.scale(1, ry / rx);
      const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); rg.addColorStop(0, rgba(col, 0)); rg.addColorStop(0.72, rgba(col, 0.05 * (1 - u / 0.7))); rg.addColorStop(0.9, rgba(col, 0.4 * (1 - u / 0.7))); rg.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 7); ctx.fill(); ctx.restore();
    }
  });
  items.sort((a, b) => b.d - a.d);
  for (const it of items) if (it.d > 0.35) it.fn();
  const hero = PTS.hero;
  // —— 飞的东西（在最上层） ——
  // E01：胸口的光飞出去，一盏盏点亮吊灯；再从灯里收回来变成工牌
  if (hero && t > PULSE && t < LAMP_T[5] + 0.1) {
    const pts = [hero.chest, ...OL.map(([x, z]) => p(BX[0] + x, CEIL - 0.85 + 0.12, z))], ts = [PULSE, ...LAMP_T];
    let i = 0; while (i < ts.length - 2 && t > ts[i + 1]) i++;
    const u = prog(t, ts[i], ts[i + 1]), e = easeInOut(u), a = pts[i], b = pts[i + 1];
    const ox = lerp(a[0], b[0], e), oy = lerp(a[1], b[1], e) - Math.sin(u * Math.PI) * 60;
    for (let q = 1; q < 9; q++) { const e2 = easeInOut(clamp(u - q * 0.06)); glow(ctx, lerp(a[0], b[0], e2), lerp(a[1], b[1], e2) - Math.sin(clamp(u - q * 0.06) * Math.PI) * 60, 34 - q * 3, [255, 200, 130], 0.5 * (1 - q / 9)); }
    glow(ctx, ox, oy, 120, [255, 200, 130], 0.6); glow(ctx, ox, oy, 34, [255, 245, 220], 0.95);
  }
  if (hero && t > BADGE_T - 0.55 && t < BADGE_T + 0.05) {
    for (let q = 0; q < 24; q++) { const L = OL[q % 6], a = p(BX[0] + L[0], CEIL - 0.75, L[1]), d = hash(q * 2.7) * 0.2, u = easeInOut(prog(t, BADGE_T - 0.55 + d, BADGE_T)); if (u <= 0 || u >= 1) continue; glow(ctx, lerp(a[0], hero.chest[0], u) + Math.sin(u * 7 + q) * 30 * (1 - u), lerp(a[1], hero.chest[1], u), 22, [255, 214, 150], 0.7); }
  }
  // E02：任务卡 板 → 手 → 同事
  if (hero) for (const cy of CYC) {
    const u = (t - cy.t0) / cy.d; if (u < 0.3 || u > 0.93) continue;
    const s0 = p(...BS(cy.i % 12 >> 2, cy.i % 4)), hand = hero.hand, col = PTS['c' + cy.ci];
    const tgt = col ? [col.chest[0] - p.px(DESK[cy.ci][1] + 0.45, 0.12), col.chest[1] + p.px(DESK[cy.ci][1], 0.1)] : hand;
    const sc = p.px(3.3, 0.006);
    let x, y, rot = 0;
    if (u < 0.42) { const v = easeOut(prog(u, 0.3, 0.42)); x = lerp(s0[0], hand[0], v); y = lerp(s0[1], hand[1], v) - Math.sin(v * Math.PI) * 30; rot = v * 0.4; }
    else if (u < 0.8) { x = hand[0]; y = hand[1] - 10; rot = 0.2; }
    else { const v = easeInOut(prog(u, 0.8, 0.9)); x = lerp(hand[0], tgt[0], v); y = lerp(hand[1], tgt[1], v) - Math.sin(v * Math.PI) * 60; rot = 0.2 - v * 0.35; }
    if (cy.fast) glow(ctx, x, y, 70, ROWC[cy.ci], 0.45);
    taskCard(ctx, x, y, ROWC[cy.ci], sc * 1.1, rot, 1);
  }
  // E04：选中的那件货 货架 → 手 → 袋子；心 胸口 → 袋子
  if (hero && t > ANS_T - 0.45 && t < BAG_T + 0.3) {
    const s0 = p(PLAIN.X, PSH.lv[PLAIN.l], PSH.z); let x = hero.hand[0], y = hero.hand[1];
    if (t < ANS_T - 0.15) { const v = easeOut(prog(t, ANS_T - 0.45, ANS_T - 0.15)); x = lerp(s0[0], x, v); y = lerp(s0[1], y, v) - Math.sin(v * Math.PI) * 40; }
    if (t > BAG_T - 0.05 && PTS.bag) { const v = easeInOut(prog(t, BAG_T - 0.05, BAG_T + 0.25)); x = lerp(x, PTS.bag[0], v); y = lerp(y, PTS.bag[1] - 40 * PTS.bag[2], v) - Math.sin(v * Math.PI) * 50; }
    product(ctx, x, y + p.px(3.3, 0.17), p.px(3.3, 0.22), p.px(3.3, 0.34), PRODC[0], 0, 1 - prog(t, BAG_T + 0.18, BAG_T + 0.28), 0.4);
  }
  if (hero && t > H_FORM && t < H_LAND + 0.05) {
    const c0 = [hero.chest[0] - p.px(hm.Z, 0.12), hero.chest[1] - p.px(hm.Z, 0.05)], c1 = PTS.bag ? [PTS.bag[0], PTS.bag[1] - 80 * PTS.bag[2]] : c0;
    const grow = smooth(prog(t, H_FORM, H_FORM + 0.4)), v = prog(t, H_FLY, H_LAND), e = easeInOut(v);
    const x = lerp(c0[0], c1[0], e), y = lerp(c0[1], c1[1], e) - Math.sin(e * Math.PI) * 160, r = p.px(hm.Z, 0.075) * grow * (1 + 0.12 * Math.sin(t * 14)) * (1 - 0.35 * e);
    if (v > 0) for (let q = 1; q < 8; q++) { const e2 = easeInOut(clamp(v - q * 0.04)); glow(ctx, lerp(c0[0], c1[0], e2), lerp(c0[1], c1[1], e2) - Math.sin(e2 * Math.PI) * 160, r * (1 - q / 9), [255, 190, 130], 0.45 * (1 - q / 8)); }
    glowHeart(ctx, x, y, r, 1);
  }
  // E05：上司举着的清单（前景，大）
  if (PTS.boss && t > PANS[2][0]) {
    const b = PTS.boss, sc = p.px(PTS.bossZ, 0.0042), lift = B.popIn(t, E5 + 0.15);
    const ca = (t > BOSS_OUT ? 1 - prog(t, BOSS_OUT, BOSS_OUT + 0.3) : 1) * Math.min(1, lift);
    clipboard(ctx, t, b.chest[0] + p.px(PTS.bossZ, 0.42), b.chest[1] + p.px(PTS.bossZ, 0.1) + (1 - Math.min(1, lift)) * 120, sc * Math.max(0.6, lift), ca, CHK);
  }
  // 横移时的动态模糊
  const pu = panU(t);
  if (pu > 0) {
    const amt = 70 * Math.sin(pu * Math.PI), tmp = new K.Canvas(W, H), tx = tmp.getContext('2d'); tx.drawImage(ctx.canvas, 0, 0);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); for (let i = 1; i <= 4; i++) { ctx.globalAlpha = 0.2; ctx.drawImage(tmp, -i * amt / 4, 0); } ctx.restore();
  }
  E.bokeh(ctx, t, 0.75);
  E.vignetteWarm(ctx, 0.42);
  STATE = { t, p, PTS };
}

// ---------- 屏幕层：泡泡 ----------
function over(ctx, t) {
  if (!STATE || STATE.t !== t) return;
  const { PTS } = STATE, h = PTS.hero;
  const say = (t0, t1, str, pt, o = {}) => { const a = vis(t, t0, t1, 0.08, 0.2); if (a <= 0 || !pt) return; B.say(ctx, str, pt[0], pt[1], a, { size: 54, pop: B.popIn(t, t0), ...o }); };
  if (h) say(E2 + 0.05, E2 + 1.15, '交给我~', [h.top[0] + 70, h.top[1] - 80], { tail: [-40, 72] });
  if (PTS.cust) say(Q_T, ANS_T + 0.3, '哪个好？', [Math.max(200, PTS.cust.top[0] + 60), PTS.cust.top[1] - 70], { tail: [-30, 72], gray: prog(t, ANS_T, ANS_T + 0.2) });
  if (h) say(ANS_T, ANS_T + 1.3, '这个实惠', [h.top[0] - 40, h.top[1] - 80], { tail: [30, 72] });
}

// ---------- 音效 ----------
const SFX = [
  { t: BADGE_T, k: 'ding' },          // E01 光收回胸口，变成工牌
  { t: EV3[0].ta, k: 'pop' },         // E03 第一箱补进货架
  { t: H_LAND, k: 'heart' },          // E04 心落进袋子
  ...CHK.map(c => ({ t: c + 0.05, k: 'click' })), // E05 三个勾
];

module.exports = { draw, over, SFX };
