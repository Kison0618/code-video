'use strict';
// 《ESFJ》v8 EC5：E01–E06 工作。一整层有纵深的公司：办公室 → 仓库 → 门店 → 大厅，四个开间沿 X 排开（egenv 透视），
// 镜头在同一个连续空间里慢慢横移（没有柱子扫屏）。天色：清晨 → 白天 → 黄昏。
// 贯穿装置：他胸口一团暖光（眼里有人）。每服务一个人，就从胸口牵出一根暖光带连到那个人，光带留在画面里越积越多，
// 横移时能看到身后一路连着的光带。
//   E01 清晨办公室，胸口暖光聚起 → 飞出去一盏盏点亮吊灯 → 收回胸口成一团暖光；「眼里有人」一圈暖光扫过整间屋，同事被照亮；
//   E02 排班板：取任务卡递给同事，每递一个同事就牵出一根光带；「安排」后越跑越快，光点沿光带来回跑；
//   E03 仓库：同事取走一箱，他抛一箱补进那一格，同时光带连到这位同事；
//   E04 门店：挑实惠的那件装袋，心沿着光带滑进袋子，顾客提着发光的袋子走到门口回头，光带一直连着；
//   E05 大厅：上司举着清单打勾，光带连到上司，每一勾光带亮一下；
//   E06 拉远：所有光带的光往回汇进他胸口，胸口亮满；五个职业道具（黑板/哨子/商品袋/文件夹/前台铃）在他四周一个个亮起围成一圈；
//       句后停顿：光圈极慢地转，灰尘在聚光里漂，光点沿光带慢慢流。
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
const CARE = at('E01', '在意') - 0.2, PULSE = at('E01', '工作') - 0.15, BADGE_T = at('E01', '长处') - 0.1, EYE_T = at('E01', '眼里') - 0.1;
const FAST = at('E02', '安排') - 0.15;
// 句与句之间的横移：从上一句快说完开始，到下一句开口后 0.6 秒到位（慢、连续）
const PANS = [[ve('E02') - 0.5, E3 + 1.4], [ve('E03') - 0.4, E4 + 1.0], [ve('E04') - 0.3, E5 + 0.75]];
const PMID = PANS.map(([a, b]) => (a + b) / 2);
const CONV_T = E6 + 0.15; // E06 所有光带往回汇
const RING_T = ['老师', '教练', '销售', '秘书', '前台'].map(w => at('E06', w) - 0.12);

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
  let t = E2 - 0.1, i = 0, k = 0; const tEnd = PANS[0][0];
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
// 柱子：只留远处两排当开间分界（近处的会扫成黑屏，已去掉）
function pillar(ctx, p, X0, Z0) { box3(ctx, p, X0 - 0.2, X0 + 0.2, 0, CEIL, Z0 - 0.2, Z0 + 0.2, [74, 70, 80], { edge: 0 }); }

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

// ---------- E06 职业道具（画在光球里，x,y 为球心，r 为球半径） ----------
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
function folderIcon(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.12);
  RR(ctx, -52, -58, 44, 16, [8, 8, 0, 0], [70, 118, 206]);
  const g = ctx.createLinearGradient(0, -50, 0, 64); g.addColorStop(0, '#7fb0f4'); g.addColorStop(1, '#3a66b8');
  RR(ctx, -46, -66, 92, 112, 4, [250, 250, 244]); RR(ctx, -38, -74, 84, 112, 4, [236, 234, 224]);
  for (let i = 0; i < 4; i++) RR(ctx, -28, -60 + i * 16, i === 3 ? 34 : 60, 5, 2, [150, 160, 180]);
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-58, -44, 116, 104, 8); ctx.fill();
  RR(ctx, -58, -44, 116, 12, [8, 8, 0, 0], [150, 196, 255], 0.55);
  RR(ctx, -14, -10, 28, 18, 4, [230, 240, 255], 0.9);
  ctx.restore();
}
function bellIcon(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  RR(ctx, -58, 26, 116, 18, 6, [96, 74, 60]); RR(ctx, -50, 22, 100, 8, 4, [140, 110, 86]);
  const bg = ctx.createLinearGradient(-46, -40, 46, 24); bg.addColorStop(0, '#fff6cc'); bg.addColorStop(0.45, '#e8b850'); bg.addColorStop(1, '#8a6420');
  ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(-50, 24); ctx.bezierCurveTo(-50, -34, 50, -34, 50, 24); ctx.closePath(); ctx.fill();
  RR(ctx, -6, -42, 12, 14, 3, [170, 130, 60]); ctx.fillStyle = '#f2d27a'; ctx.beginPath(); ctx.arc(0, -46, 9, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(-22, -6, 9, 16, 0.5, 0, 7); ctx.fill();
  ctx.restore();
}
// 发光实心球（半透明罩 + 亮边 + 高光），里面放道具
const RING_C = [[120, 214, 160], [244, 110, 96], [255, 186, 96], [120, 170, 244], [255, 214, 120]];
function propOrb(ctx, i, x, y, r, a, flash, t) {
  if (a <= 0.003 || r < 2) return;
  const c = RING_C[i];
  glow(ctx, x, y, r * 2.6, c, (0.32 + 0.4 * flash) * a); glow(ctx, x, y, r * 1.3, mix(c, [255, 255, 255], 0.4), 0.22 * a);
  ctx.save(); ctx.globalAlpha *= a;
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r);
  g.addColorStop(0, rgba(mix(c, [255, 255, 255], 0.75), 0.55)); g.addColorStop(0.55, rgba(mix(c, [40, 30, 50], 0.35), 0.42)); g.addColorStop(1, rgba(mix(c, [20, 14, 30], 0.5), 0.6));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  const s = r / 100;
  ctx.beginPath(); ctx.arc(x, y, r * 0.97, 0, 7); ctx.clip();
  if (i === 0) blackboard(ctx, x, y + 245 * s, s * 0.95, 1);
  else if (i === 1) { X.whistle(ctx, x - 26 * s, y + 6 * s, 36 * s, -0.25, 1); ctx.strokeStyle = 'rgba(240,90,80,0.95)'; ctx.lineWidth = 7 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 46 * s, y + 6 * s); ctx.quadraticCurveTo(x - 70 * s, y + 70 * s, x - 10 * s, y + 66 * s); ctx.stroke(); }
  else if (i === 2) { ctx.save(); ctx.translate(x, y + 44 * s); R(ctx, -30 * s, -112 * s, 18 * s, 34 * s, [240, 196, 110]); RR(ctx, 6 * s, -120 * s, 20 * s, 44 * s, 5 * s, [110, 180, 230]); ctx.restore(); paperBag(ctx, x, y + 44 * s, s * 0.95, 1, 0.5); ctx.fillStyle = '#e8606a'; heartPath(ctx, x, y + 2 * s, 12 * s); ctx.fill(); }
  else if (i === 3) folderIcon(ctx, x, y + 4 * s, s * 0.82);
  else bellIcon(ctx, x, y + 6 * s, s * 0.95);
  ctx.restore();
  // 亮边 + 高光
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= a;
  const rg = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 1.02); rg.addColorStop(0, rgba(c, 0)); rg.addColorStop(0.8, rgba(mix(c, [255, 255, 255], 0.5), 0.55 + 0.4 * flash)); rg.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, r * 1.02, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(x - r * 0.42, y - r * 0.5, r * 0.26, r * 0.13, -0.6, 0, 7); ctx.fill();
  ctx.restore();
}

// ---------- 贯穿装置：胸口暖光 + 光带 ----------
const TH_C = [[255, 150, 90], [255, 186, 118], [255, 214, 160], [255, 246, 226]];
const TH_L = [[54, 0.06], [26, 0.14], [11, 0.4], [3.6, 0.85]];
// 曲线：世界坐标里从他胸口拱向目标（光往上拱），两端用实际屏幕点校正
function thCurve(p, Hw, Hs, Bw, Bs, t, seed, arch0) {
  const Hp = p(...Hw), Bp = p(...Bw), oA = [Hs[0] - Hp[0], Hs[1] - Hp[1]], oB = Bs ? [Bs[0] - Bp[0], Bs[1] - Bp[1]] : [0, 0];
  const dist = Math.hypot(Bw[0] - Hw[0], Bw[2] - Hw[2]);
  const arch = (arch0 == null ? Math.min(1.5, 0.1 + 0.07 * dist) : arch0) * (1 + 0.08 * Math.sin(t * 1.3 + seed * 5));
  const N = 34, pts = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, q = p(lerp(Hw[0], Bw[0], u), lerp(Hw[1], Bw[1], u) + Math.sin(u * Math.PI) * arch, lerp(Hw[2], Bw[2], u));
    pts.push([q[0] + oA[0] * (1 - u) + oB[0] * u, q[1] + oA[1] * (1 - u) + oB[1] * u]);
  }
  return pts;
}
function ptAt(pts, u) { const m = clamp(u) * (pts.length - 1), k = Math.min(pts.length - 2, Math.floor(m)), f = m - k; return [lerp(pts[k][0], pts[k + 1][0], f), lerp(pts[k][1], pts[k + 1][1], f)]; }
function drawThread(ctx, pts, g, br, sc = 1) {
  if (g <= 0 || br <= 0.01) return;
  const n = pts.length - 1, m = clamp(g) * n, k = Math.floor(m), f = m - k;
  const P = pts.slice(0, k + 1); if (k < n && f > 0.001) P.push([lerp(pts[k][0], pts[k + 1][0], f), lerp(pts[k][1], pts[k + 1][1], f)]);
  if (P.length < 2) return;
  const cuts = [0, Math.round((P.length - 1) * 0.4), Math.round((P.length - 1) * 0.75), P.length - 1];
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
  for (let L = 0; L < 4; L++) for (let c = 0; c < 3; c++) {
    const a = cuts[c], b = cuts[c + 1]; if (b <= a) continue;
    ctx.strokeStyle = rgba(TH_C[L], TH_L[L][1] * Math.min(1, br)); ctx.lineWidth = TH_L[L][0] * sc * (1 - 0.2 * c) * (L === 3 ? 1 : 0.85 + 0.3 * Math.min(br, 1.6));
    ctx.beginPath(); for (let i = a; i <= b; i++) i === a ? ctx.moveTo(P[i][0], P[i][1]) : ctx.lineTo(P[i][0], P[i][1]); ctx.stroke();
  }
  ctx.restore();
}
// 光带分两层：刚牵出去的（到达后约 1 秒内）画在最上层；之后渐渐转到「场景层」（画在人和家具后面，被他们挡住，
// 所以老光带不会横穿别人的脸，又能看出它在空间里）。layer: 0 = 场景层，1 = 最上层。返回已连上的根数。
function threadPass(ctx, p, t, PTS, hm, Hw, Hs, sc, layer) {
  const gl = (q, r, c, a) => { if (a > 0.004 && q[0] > -160 && q[0] < W + 160 && q[1] > -160 && q[1] < H + 160) glow(ctx, q[0], q[1], r, c, a); };
  const conv = vis(t, CONV_T, 1e9, 0.6, 0);
  let nArr = 0;
  for (const h of TH) {
    if (t < h.tb) continue;
    if (t >= h.ta) nArr++;
    const wTop = 1 - smooth(prog(t, h.ta + 0.9, h.ta + 1.8)), wk = layer ? wTop : 1 - wTop;
    if (wk <= 0.01) continue;
    const Bw = h.w(t), Bs = h.key === 'bag' ? (PTS.bag ? [PTS.bag[0], PTS.bag[1] - 80 * PTS.bag[2]] : null) : (PTS[h.key] ? PTS[h.key].chest : null);
    const pts = thCurve(p, Hw, Hs, Bw, layer ? Bs : null, t, h.seed);
    const g = easeOut(prog(t, h.tb, h.ta));
    let pb = 0;
    for (const pt of h.pulses) { const v = prog(t, pt, pt + 0.35); if (v > 0 && v < 1) { pb = Math.max(pb, Math.sin(v * Math.PI)); const q = ptAt(pts, easeInOut(v)); gl(q, 50 * sc, [255, 206, 140], 0.6 * wk); gl(q, 15 * sc, [255, 250, 235], 0.9 * wk); } }
    drawThread(ctx, pts, g, (0.62 + 0.06 * Math.sin(t * 2 + h.seed * 9) + 0.45 * pb + 0.6 * conv) * wk, sc);
    if (g < 1) { // 光带的头
      const q = ptAt(pts, g);
      if (h.heart) glowHeart(ctx, q[0], q[1], p.px(hm.Z, 0.075) * (1 + 0.1 * Math.sin(t * 14)) * (1 - 0.3 * g), wk);
      else { gl(q, 64 * sc, [255, 196, 124], 0.7 * wk); gl(q, 18 * sc, [255, 250, 235], 0.95 * wk); }
    }
    const ua = t - h.ta; if (ua > 0 && ua < 0.7) gl(pts[pts.length - 1], (40 + ua * 260) * sc, [255, 214, 150], 0.7 * (1 - ua / 0.7) * wk); // 到达：在那个人身上亮开
    if (g >= 1) { // 光点沿光带流：先往外送，E06 起往回流进他胸口
      const ph = t < CONV_T ? 0.3 * t : 0.3 * CONV_T - 0.75 * (t - CONV_T);
      for (let j = 0; j < 4; j++) { const u = ((ph + j / 4 + h.seed) % 1 + 1) % 1, q = ptAt(pts, u), a = Math.sin(u * Math.PI) * (0.5 + 0.4 * conv) * wk; gl(q, 20 * sc, [255, 214, 160], 0.5 * a); gl(q, 6 * sc, [255, 250, 235], 0.8 * a); }
    }
    const vc = prog(t, CONV_T, CONV_T + 0.85); // E06：一团光从每个人那头沿光带汇回来
    if (vc > 0 && vc < 1) { const q = ptAt(pts, 1 - vc * vc); gl(q, 70 * sc, [255, 200, 130], 0.6 * wk); gl(q, 20 * sc, [255, 250, 235], 0.9 * wk); }
  }
  return nArr;
}
function coreDraw(ctx, x, y, I, t, sc) {
  if (I <= 0.01) return;
  const beat = 1 + 0.12 * Math.pow(Math.max(0, Math.sin(t * 4.6)), 8), Ic = Math.min(1, I);
  glow(ctx, x, y, 230 * sc * Math.min(1.8, I) * beat, [255, 150, 90], 0.26 * Ic);
  glow(ctx, x, y, 95 * sc * Math.min(1.8, I), [255, 200, 130], 0.5 * Ic);
  const r = 19 * sc * (0.55 + 0.45 * Math.min(I, 1.7)) * beat;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  g.addColorStop(0, rgba([255, 252, 240], 0.95 * Ic)); g.addColorStop(0.5, rgba([255, 214, 150], 0.8 * Ic)); g.addColorStop(1, rgba([255, 150, 90], 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.restore();
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
const SPOT = t => vis(t, E6 + 0.3, TE + 1, 0.8, 0);
// 顾客：进门 → 柜台前 → 提袋走到门口，回头站着（光带一直连着她）
function custAt(t) {
  let x = SHOP - 1.05, z = 2.25, flip = false, walk = 0;
  if (t < CUST_IN + 1.0) { const u = easeInOut(prog(t, CUST_IN, CUST_IN + 1.0)); x = lerp(SHOP - 2.7, SHOP - 1.05, u); walk = t > CUST_IN && u < 1 ? 1 : 0; }
  else if (t > CUST_OUT) { const u = easeInOut(prog(t, CUST_OUT, CUST_OUT + 1.1)); x = lerp(SHOP - 1.05, SHOP - 2.6, u); z = lerp(2.25, 2.05, u); flip = u < 0.97; walk = u < 1 ? 1 : 0; }
  return { x, z, flip, walk };
}
// 上司：E06 往旁边让一步，站着看他
function bossAt(t) {
  let x = LOB - 0.95, z = 1.95, flip = false, walk = 0;
  if (t > BOSS_OUT) { const u = easeInOut(prog(t, BOSS_OUT, BOSS_OUT + 1.0)); x = lerp(LOB - 0.95, LOB - 2.05, u); z = lerp(1.95, 2.5, u); flip = u < 0.97; walk = u < 1 ? 1 : 0; }
  return { x, z, flip, walk };
}
// 光带：每服务一个人牵出一根（tb 出发，ta 到达），pulses = 之后沿光带再送一次光
const TH = [];
for (let ci = 0; ci < 3; ci++) {
  const cs = CYC.filter(c => c.ci === ci), ta = cs[0].t0 + 0.9 * cs[0].d;
  TH.push({ key: 'c' + ci, tb: ta - 0.4, ta, pulses: cs.slice(1).map(c => c.t0 + 0.9 * c.d - 0.35), w: () => [BX[0] + DESK[ci][0] - 0.12, 1.0, DESK[ci][1] + 0.45] });
}
{ const tc = at('E02', '配合') - 0.1; [3, 4].forEach((ci, j) => TH.push({ key: 'c' + ci, tb: tc + j * 0.3, ta: tc + j * 0.3 + 0.4, pulses: [], w: () => [BX[0] + DESK[ci][0] - 0.12, 1.0, DESK[ci][1] + 0.45] })); }
EV3.forEach((e, i) => TH.push({ key: 'w' + i, tb: e.tl, ta: e.ta, pulses: [], w: () => [e.pos[0], 1.0, e.pos[1]] }));
TH.push({ key: 'bag', tb: H_FLY, ta: H_LAND, heart: true, pulses: [], w: t => { if (t < TAKE_T) return [BAG[0], BAG[1] + 0.35, BAG[2]]; const c = custAt(t); return [c.x + 0.22, 0.95, c.z - 0.1]; } });
TH.push({ key: 'boss', tb: CHK[0] - 0.4, ta: CHK[0] - 0.02, pulses: [CHK[1] - 0.35, CHK[2] - 0.35], w: t => { const b = bossAt(t); return [b.x, 1.05, b.z]; } });
TH.forEach((h, i) => { h.seed = hash(i * 7.3 + 1); });
const TH_BY = {}; for (const h of TH) TH_BY[h.key] = h;
const arrK = (key, t) => { const h = TH_BY[key]; return !h || t < h.ta ? 0 : 0.22 + 0.7 * Math.exp(-(t - h.ta) * 2.4); };
// E01「眼里有人」：暖光环扫到谁，谁就被照亮一下
function eyeWaveAt(X0, Z0, t) { const q = posAt(EYE_T), d = Math.hypot(X0 - q[0], Z0 - q[1]), ta = EYE_T + Math.max(0, d - 0.4) / 5.2; return t < ta ? 0 : 0.08 + 0.6 * Math.exp(-(t - ta) * 2.5); }
// E06 光球圈：倾斜的一圈（后面的高、前面的低），每个职业词亮一个
const RING_A = [162, 90, 18, -54, -126].map(d => d * Math.PI / 180);
function ringW(i, t, hx, hz) {
  const a = RING_A[i] - 0.1 * Math.max(0, t - STILL) - 0.03 * Math.max(0, t - RING_T[4]), R0 = 1.5;
  return [hx + R0 * Math.cos(a), 1.2 + 1.0 * Math.sin(a) + 0.05 * Math.sin(t * 1.4 + i * 1.7), hz + R0 * Math.sin(a) * 0.85];
}

// ---------- 主角路线 ----------
const MOVES = [], START = [BX[0] - 1.8, 2.6];
function along(path, u) { // 按路程长度在折线上取点
  const L = [0]; for (let i = 1; i < path.length; i++) L.push(L[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const d = u * L[L.length - 1]; let i = 1; while (i < L.length - 1 && L[i] < d) i++;
  const f = (d - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]); return [lerp(path[i - 1][0], path[i][0], f), lerp(path[i - 1][1], path[i][1], f)];
}
function posAt(t) { let q = START; for (const m of MOVES) { if (t < m.t0) break; if (t >= m.t1) { q = m.p1; continue; } const u = easeInOut(prog(t, m.t0, m.t1)); return m.path ? along(m.path, u) : [lerp(m.p0[0], m.p1[0], u), lerp(m.p0[1], m.p1[1], u)]; } return q; }
const mvTo = (t0, t1, p1, hz = 2.6) => MOVES.push({ t0, t1, p0: posAt(t0), p1, hz });
const mvPath = (t0, t1, pts, hz) => { const p0 = posAt(t0); MOVES.push({ t0, t1, p0, p1: pts[pts.length - 1], path: [p0, ...pts], hz }); };
const BSPOT = [-0.9, 3.55], CSPOT = DESK.slice(0, 3).map(([x, z]) => [x - 0.62, z - 0.62]);
mvTo(T0, T0 + 1.3, [0.1, 2.75], 2.3);
for (const c of CYC) { const hz = c.fast ? 4.6 : 3.2; mvTo(c.t0, c.t0 + 0.3 * c.d, BSPOT, hz); mvTo(c.t0 + 0.42 * c.d, c.t0 + 0.76 * c.d, CSPOT[c.ci], hz); }
// 开间之间走前面的过道（z≈1.2，在货架和柜台前面），不穿家具
mvPath(PANS[0][0], PANS[0][1], [[1.6, 1.6], [WH - 1.2, 1.15], [WH - 0.78, 1.8], [WH - 0.78, 3.0]], 3.6);
mvTo(PANS[0][1] + 0.05, PANS[1][0] - 0.05, [WH - 0.78, 3.4], 0);
mvPath(PANS[1][0], PANS[1][1], [[WH - 0.7, 1.2], [WH + 0.4, 1.05], [SHOP + 1.7, 1.3], [SHOP + 1.95, 2.3], [SHOP + 1.6, 3.3], [SHOP + 0.42, 3.32]], 3.6);
mvTo(PANS[2][0], PANS[2][1], [LOB + 0.72, 3.55], 3.4);
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
  if (t >= PANS[2][1] - 0.1 && t < E6 - 0.05) { // E05：站直，被打一个勾亮一分
    o.flip = true; let n = 0; for (const c of CHK) if (t >= c + 0.15) n++;
    o.glow = 0.3 * n + 0.3 * vis(t, CHK[Math.max(0, n - 1)], CHK[Math.max(0, n - 1)] + 0.5, 0.05, 0.4) * (n ? 1 : 0); o.mouth = n ? 'grin' : 'smile'; o.eyes = n >= 3 ? 'happy' : 'open';
    for (const c of CHK) o.nod -= 0.7 * Math.sin(prog(t, c + 0.1, c + 0.4) * Math.PI);
    o.bob += bounce(t, CHK[2] + 0.15, 12); o.rs = -0.1; o.re = -0.1;
  }
  if (t >= E6 - 0.05) { // E06：光带汇进胸口，四周一圈职业道具亮起
    if (!m.moving) o.flip = false; o.mouth = 'grin'; o.eyes = t > CONV_T + 0.6 ? 'happy' : 'open';
    const op = vis(t, CONV_T + 0.3, 1e9, 0.5, 0); o.rs = -0.15 - 0.5 * op; o.re = -0.2 + 0.25 * op; // 微微张开手
    o.glow = 0.3 + 0.4 * op;
    for (const r of RING_T) o.nod -= 0.3 * Math.sin(prog(t, r + 0.05, r + 0.4) * Math.PI);
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
  [EYE_T + 0.1, { x0: -0.2, z0: -0.95, h: 1.62, f: 1200, cy: 625, pitch: 0 }],
  [EYE_T + 1.0, { x0: -0.1, z0: -1.55, h: 1.78, f: 1150, cy: 645, pitch: 0.02 }],
  [E2 + 0.3, { x0: -0.45, z0: -0.8, h: 1.6, f: 1200, cy: 610, pitch: 0 }],
  [PANS[0][0], { x0: -0.3, z0: -0.6, h: 1.6, f: 1200, cy: 610, pitch: 0 }],
  [PMID[0], { x0: (2.2 + WH) / 2, z0: -1.7, h: 1.72, f: 1150, cy: 620, pitch: 0.02 }],
  [PANS[0][1], { x0: WH + 0.2, z0: -0.7, h: 1.5, f: 1150, cy: 600, pitch: 0 }],
  [PANS[1][0], { x0: WH + 0.2, z0: 0.1, h: 1.47, f: 1150, cy: 600, pitch: 0 }],
  [PMID[1], { x0: BX[1] + HW + 0.3, z0: -1.9, h: 1.75, f: 1150, cy: 620, pitch: 0.03 }],
  [PANS[1][1], { x0: SHOP - 0.3, z0: -0.55, h: 1.72, f: 1250, cy: 640, pitch: 0.07 }],
  [H_FORM - 0.3, { x0: SHOP - 0.25, z0: -0.4, h: 1.72, f: 1250, cy: 640, pitch: 0.07 }],
  [H_LAND + 0.1, { x0: SHOP - 0.2, z0: 0.45, h: 1.6, f: 1250, cy: 640, pitch: 0.06 }],
  [PANS[2][0], { x0: SHOP - 0.2, z0: 0.35, h: 1.6, f: 1250, cy: 640, pitch: 0.06 }],
  [PMID[2], { x0: (SHOP + LOB) / 2, z0: -1.1, h: 1.6, f: 1150, cy: 620, pitch: 0.03 }],
  [PANS[2][1], { x0: LOB - 0.05, z0: -0.2, h: 1.5, f: 1150, cy: 600, pitch: 0 }],
  [E6 + 0.1, { x0: LOB + 0.0, z0: -0.15, h: 1.5, f: 1150, cy: 600, pitch: 0 }],
  [E6 + 1.9, { x0: LOB + 0.2, z0: -2.1, h: 2.3, f: 1150, cy: 600, pitch: 0.12 }],
  [STILL, { x0: LOB + 0.25, z0: -2.3, h: 2.35, f: 1150, cy: 600, pitch: 0.12 }],
  [TE - 0.35, { x0: LOB + 0.3, z0: -2.75, h: 2.5, f: 1150, cy: 610, pitch: 0.13 }],
];
function camAt(t) {
  let i = 0; while (i < CK.length - 2 && t > CK[i + 1][0]) i++;
  const [ta, a] = CK[i], [tb, b] = CK[i + 1], u = easeInOut(prog(t, ta, tb)), c = {};
  for (const k in a) c[k] = lerp(a[k], b[k], u);
  const fw = vis(t, E2, PANS[0][0], 0.5, 0.45); if (fw > 0) c.x0 += 0.32 * (heroMove(t).X + 0.2) * fw; // E02 镜头跟着他跑
  for (const [a, b] of PANS) { const w = vis(t, a, b, 0.45, 0.45); if (w > 0) c.x0 = lerp(c.x0, heroMove(t).X + 0.25, 0.8 * w); } // 横移：镜头跟着他走
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
  // 老光带（场景层）：画在家具和人后面；胸口位置用世界坐标估，接头藏在他身体后面
  {
    const Hw = [hm.X, 1.15, hm.Z], q = p(hm.X, 1.08, hm.Z);
    threadPass(ctx, p, t, {}, hm, Hw, [q[0], q[1] - ho.bob], clamp(p.px(hm.Z, 1.75) / 585 * 0.9, 0.55, 1.35), 0);
  }
  // —— 柱子（开间分界）：只留远处的，镜头横移时不会扫成黑屏 ——
  for (let b = 0; b <= 4; b++) { const xb = BX[0] - HW + b * 2 * HW; if (!near(xb)) continue; for (const z of [6.2, 9.4]) add(z, () => pillar(ctx, p, xb, z), 0.3); }
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
        inner = Math.max(inner, arrK('c' + ci, t), eyeWaveAt(cx, cz, t));
        if (ci >= 3) bob += bounce(t, TH_BY['c' + ci].ta, 12);
        const out = litAt(ctx, p, t, cx, cz, cc => folk(cc, p, CKEY[ci], cx, cz, { flip: ci < 3 ? (cx > hm.X) : ci === 4, gray: 0.55 * (1 - on), dim: 0.35 * (1 - on), bob, inner, lean }));
        PTS['c' + ci] = out;
        for (let q = 0; q < Math.min(got, 3); q++) taskCard(ctx, out.chest[0] - p.px(cz, 0.12) + q * 4, out.chest[1] + p.px(cz, 0.12) - q * 4, ROWC[ci], p.px(cz, 0.006), -0.15 + q * 0.12, 1);
      });
    }
    // 前景虚焦：一盆很近的绿植
    add(0.95, () => { ctx.save(); ctx.filter = 'blur(16px)'; ctx.globalAlpha = 0.9; plant(ctx, p, BX[0] - 1.25, 0.95, t, 1.2); ctx.restore(); }, 0);
  }
  // —— 仓库 ——
  const cartZ = 3.3 + (3.4 - 3.0) * smooth(prog(t, PANS[0][1] + 0.05, PANS[1][0] - 0.05));
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
        const out = litAt(ctx, p, t, ex, ez, cc => folk(cc, p, e.key, ex, ez, { flip: t > e.tk + 0.55 ? !e.flip : e.flip, lean: dir * 0.1 * reach, inner: Math.max(t > e.tk + 0.3 ? 0.5 * Math.exp(-(t - e.tk - 0.3) * 1.5) + 0.15 : 0, arrK('w' + i, t)), bob: bounce(t, e.tk + 0.3, 10) }));
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
    if (t > CUST_IN - 0.2) {
      const cu = custAt(t), cx = cu.x, cz = cu.z, flip = cu.flip; let bob = 0;
      if (cu.walk) bob = Math.abs(Math.sin(t * 15)) * p.px(cz, 0.02);
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
      if (t > TAKE_T && PTS.cust) { const v = easeInOut(prog(t, TAKE_T, TAKE_T + 0.3)), cz = custAt(t).z; const hq = [PTS.cust.chest[0] + p.px(cz, 0.22), PTS.cust.chest[1] + p.px(cz, 0.42)]; bx = lerp(bq[0], hq[0], v); by = lerp(bq[1], hq[1], v); }
      if (t > BAG_T - 0.1) {
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
    {
      const bo = bossAt(t), bx = bo.x, bz = bo.z; let bob = bo.walk ? Math.abs(Math.sin(t * 14)) * 8 : 0;
      for (const ck of CHK) bob += bounce(t, ck, 5);
      add(bz, () => { const out = litAt(ctx, p, t, bx, bz, cc => folk(cc, p, 'estj-female', bx, bz, { m: 1.7, flip: bo.flip, bob, inner: arrK('boss', t) * 0.8 })); PTS.boss = out; PTS.bossZ = bz; });
    }
    // E06 聚光：远处压暗（光球和人不压），一束光落在他身上，灰尘在光里漂
    if (spot > 0.01) add(hm.Z, () => {
      ctx.save(); ctx.fillStyle = rgba([6, 6, 14], 0.32 * spot); ctx.fillRect(0, 0, W, H); ctx.restore();
      const top = p(hm.X, CEIL, hm.Z), fl = p(hm.X, 0, hm.Z), col = [255, 222, 168];
      E.cone(ctx, top[0], top[1], fl[1] + 20, p.px(hm.Z, 0.5), p.px(hm.Z, 2.2), col, 0.18 * spot);
      E.pool(ctx, p, hm.X, hm.Z, 2.0, col, 0.26 * spot);
      for (let i = 0; i < 26; i++) { const u = (t * 0.05 + hash(i * 2.3)) % 1, q = p(hm.X + (hash(i * 5.1) - 0.5) * 1.8 * (0.3 + u) + Math.sin(t * 0.6 + i) * 0.08, CEIL - u * CEIL, hm.Z + (hash(i * 7.7) - 0.5) * 0.8); glow(ctx, q[0], q[1], p.px(hm.Z, 0.035), [255, 236, 200], 0.6 * spot * Math.sin(u * Math.PI)); }
    }, 1.9);
    // E06 一圈职业道具光球（按深度和他前后遮挡）
    for (let i = 0; i < 5; i++) {
      if (t < RING_T[i] - 0.05) continue;
      const w = ringW(i, t, hm.X, hm.Z);
      add(w[2], () => {
        const q = p(...w), pop = B.popIn(t, RING_T[i]), r = p.px(w[2], 0.5, w[1]) * Math.min(1.15, pop);
        propOrb(ctx, i, q[0], q[1], r, Math.min(1, pop * 1.5), vis(t, RING_T[i], RING_T[i] + 0.8, 0.05, 0.7), t);
        PTS['ring' + i] = q;
      });
    }
  }
  // —— 主角（+ E02 快跑残影） ——
  add(hm.Z, () => {
    const fastNow = CYC.some(cy => cy.fast && t >= cy.t0 && t < cy.t0 + cy.d) && hm.moving; // 只在 E02 快跑时拖两层很淡的残影
    if (fastNow) for (let g = 2; g >= 1; g--) { const q = heroPose(t - g * 0.035); E.hero3(ctx, p, q.m.X, q.m.Z, { ...q.o, a: g === 1 ? 0.12 : 0.06, warm: 0.7, glow: 0, shadow: 0 }); }
    const out = litAt(ctx, p, t, hm.X, hm.Z, cc => E.hero3(cc, p, hm.X, hm.Z, ho), 1.25 + 0.6 * spot);
    PTS.hero = out;
    // E01「眼里有人」：一圈暖光从他脚下扫过整间屋（地上压扁的柔光环）
    const u = t - EYE_T;
    if (u > 0 && u < 1.6) {
      const fq = p(hm.X, 0, hm.Z), rx = p.px(hm.Z, 0.4 + u * 5.2), ry = rx * clamp(p.h / p.depth(hm.Z) * 1.2, 0.12, 0.6), k = 1 - u / 1.6;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(fq[0], fq[1]); ctx.scale(1, ry / rx);
      const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); rg.addColorStop(0, rgba(WARM, 0)); rg.addColorStop(0.6, rgba(WARM, 0.06 * k)); rg.addColorStop(0.88, rgba([255, 214, 160], 0.42 * k)); rg.addColorStop(1, rgba(WARM, 0));
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 7); ctx.fill(); ctx.restore();
    }
  });
  items.sort((a, b) => b.d - a.d);
  for (const it of items) if (it.d > 0.35) it.fn();
  const hero = PTS.hero;
  // —— 飞的东西（在最上层） ——
  // E01：胸口的光飞出去，一盏盏点亮吊灯；再从灯里收回胸口
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
  // E04：心先在胸口聚起来（之后沿光带滑进袋子，见下面光带）
  if (hero && t > H_FORM && t < H_FLY) {
    const grow = smooth(prog(t, H_FORM, H_FORM + 0.4)), r = p.px(hm.Z, 0.075) * grow * (1 + 0.12 * Math.sin(t * 14));
    glowHeart(ctx, hero.chest[0], hero.chest[1] - p.px(hm.Z, 0.04), r, 1);
  }
  // E05：上司举着的清单（前景，大）
  if (PTS.boss && t > PANS[2][0]) {
    const b = PTS.boss, sc = p.px(PTS.bossZ, 0.0042), lift = B.popIn(t, E5 + 0.35);
    const ca = (t > BOSS_OUT ? 1 - prog(t, BOSS_OUT, BOSS_OUT + 0.3) : 1) * Math.min(1, lift);
    clipboard(ctx, t, b.chest[0] + p.px(PTS.bossZ, 0.42), b.chest[1] + p.px(PTS.bossZ, 0.1) + (1 - Math.min(1, lift)) * 120, sc * Math.max(0.6, lift), ca, CHK);
  }
  // —— 贯穿装置：从胸口牵出去的光带（留在画面里越积越多）+ 胸口一团暖光 ——
  if (hero) {
    const Hw = [hm.X, 1.15, hm.Z], Hs = [hero.chest[0], hero.chest[1]];
    const sc = clamp(p.px(hm.Z, 1.75) / 585 * 0.9, 0.55, 1.35);
    const gl = (q, r, c, a) => { if (q[0] > -160 && q[0] < W + 160 && q[1] > -160 && q[1] < H + 160) glow(ctx, q[0], q[1], r, c, a); };
    const conv = vis(t, CONV_T, 1e9, 0.6, 0);
    const nArr = threadPass(ctx, p, t, PTS, hm, Hw, Hs, sc, 1);
    // E06：胸口 → 每个职业光球，再牵一根短光带
    for (let i = 0; i < 5; i++) {
      if (t < RING_T[i] - 0.32 || !PTS['ring' + i] && t > RING_T[i] + 0.05) continue;
      const Bw = ringW(i, t, hm.X, hm.Z), pts = thCurve(p, Hw, Hs, Bw, PTS['ring' + i] || null, t, i * 0.37, 0.12), g = easeOut(prog(t, RING_T[i] - 0.32, RING_T[i]));
      drawThread(ctx, pts, g, 0.55 + 0.3 * vis(t, RING_T[i], RING_T[i] + 0.6, 0.05, 0.5), sc * 0.75);
      if (g < 1) { const q = ptAt(pts, g); gl(q, 56 * sc, RING_C[i], 0.7); gl(q, 16 * sc, [255, 250, 235], 0.95); }
    }
    const careK = smooth(prog(t, CARE, PULSE)), away = 1 - 0.75 * vis(t, PULSE + 0.05, BADGE_T, 0.1, 0.25);
    let I = careK * away * (0.72 + 0.04 * nArr) + 0.9 * vis(t, BADGE_T - 0.05, BADGE_T + 0.6, 0.05, 0.5) + 0.6 * vis(t, EYE_T - 0.05, EYE_T + 0.8, 0.1, 0.6)
      + 0.35 * conv + 0.9 * vis(t, CONV_T + 0.75, CONV_T + 1.6, 0.1, 0.8);
    for (const h of TH) I += 0.35 * vis(t, h.ta, h.ta + 0.4, 0.03, 0.35);
    for (const r of RING_T) I += 0.3 * vis(t, r - 0.3, r + 0.3, 0.05, 0.3);
    coreDraw(ctx, Hs[0], Hs[1], I, t, sc);
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
  { t: BADGE_T, k: 'ding' },          // E01 灯里的光收回胸口，成一团暖光
  { t: TH[0].ta, k: 'pop' },          // E02 第一根光带连上同事
  { t: EV3[0].ta, k: 'pop' },         // E03 第一箱补进货架、光带连上
  { t: H_LAND, k: 'heart' },          // E04 心沿光带落进袋子
  { t: CHK[0] + 0.05, k: 'click' },   // E05 第一个勾，光带连上上司
  { t: RING_T[4] + 0.05, k: 'ding' }, // E06 最后一个职业光球亮起，一圈合上
];

module.exports = { draw, over, SFX };
