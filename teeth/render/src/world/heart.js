// 心有獠牙：一颗由几千个光点和经纬线织成的 3D 心脏。左半边冷青，右半边品红（同一个人的两面）。
// 正中一道缝，每一下鼓点心脏收缩一次、缝张开，露出两排交错的獠牙。
// intro：每跺一下脚，心脏长出一部分；chorus：完整的心跳与咬合；break：两半分开、碎成光尘
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeOut, easeInOut, glow, glowSegs, rot3, mulberry32 } = K;
const A = require('../audio');

const SC = 15, DZ = 7.5;
function hp(u, v) {                        // 心形曲面：u 绕一圈，v ∈ [-1,1] 是前后
  const s = Math.pow(1 - v * v, 0.42);
  const x = 16 * Math.pow(Math.sin(u), 3), y = 13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u);
  return [x * s * SC, (y + 6) * s * SC - (1 - s) * 30, v * DZ * SC * (0.75 + 0.25 * Math.cos(u * 0.5))];
}
const PTS = (() => {
  const r = mulberry32(14), out = [];
  for (let i = 0; i < 7000; i++) {
    const u = r() * 6.2832, v = (r() * 2 - 1) * 0.98;
    const p = hp(u, v);
    // 散开时的位置：一大团星云
    const th = r() * 6.2832, ph = Math.acos(r() * 2 - 1), rr = 500 + r() * 900;
    out.push({ p, far: [Math.sin(ph) * Math.cos(th) * rr, Math.cos(ph) * rr * 0.6, Math.sin(ph) * Math.sin(th) * rr], ord: r(), tw: r() * 6.28, b: 0.4 + r() * 0.6, dir: [r() - 0.5, r() - 0.5, r() - 0.5] });
  }
  return out;
})();
// 经纬线：16 条横截面 + 28 条经线
const RINGS = [];
for (let k = 1; k < 16; k++) { const v = -1 + k / 16 * 2, pl = []; for (let i = 0; i <= 120; i++) pl.push(hp(i / 120 * 6.2832, v)); RINGS.push(pl); }
for (let k = 0; k < 28; k++) { const u = k / 28 * 6.2832, pl = []; for (let i = 0; i <= 40; i++) pl.push(hp(u, -0.98 + i / 40 * 1.96)); RINGS.push(pl); }
const sideCol = x => (x < -20 ? C.cyan : x > 20 ? C.magenta : C.violet);

function view(t, S) {
  const name = S.name;
  const intro = name === 'intro' || name === 'pre0';
  const yaw = intro ? -0.5 + 0.35 * Math.sin(t * 0.15) : 0.55 * Math.sin(t * 0.21);
  const pitch = 0.12 + 0.08 * Math.sin(t * 0.13);
  const zoom = intro ? 1.0 : name === 'break' ? 1.3 : 1.42;
  return { yaw, pitch, zoom };
}

function draw(ctx, t, S) {
  const name = S.name;
  const intro = name === 'intro' || name === 'pre0', brk = name === 'break';
  const { yaw, pitch, zoom } = view(t, S);
  const h = A.hit(t, 7), hs = A.hit(t, 3.5);
  const mid = A.env('mid', t);
  // 成形进度：intro 里每一下跺脚长一截
  const bites = A.bitesAt(t), introBites = A.bitesAt(A.beatT(47.9)) || 1;
  const form = intro ? smooth(clamp(bites / introBites * 1.05)) * smooth(prog(t, 0.3, 3)) : 1;
  const split = brk ? easeInOut(prog(t, S.t0, S.t1)) : 0;          // break：两半分开
  const scatter = brk ? smooth(prog(t, S.t0 + 0.8, S.t1 + 0.4)) : 0;
  const beatS = 1 - 0.07 * h;                                       // 心跳：收缩
  // 咬：平时张着，鼓点那一下猛地合上，再慢慢张开
  const bite = A.hit(t, 5);
  const gap = S.closed ? 3 : (intro ? 8 + 50 * form * (1 - bite) : 16 + (S.calm ? 36 : 110) * (1 - bite)) + split * 420;  // 中缝张开

  // 背景：两种颜色的光从左右两半后面透出来
  const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
  bg.addColorStop(0, 'rgb(16,10,30)'); bg.addColorStop(1, 'rgb(4,4,10)');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  glow(ctx, W / 2 - 260 - split * 300, H / 2, 900, C.teal, (0.16 + 0.12 * hs) * form);
  glow(ctx, W / 2 + 260 + split * 300, H / 2, 900, [150, 30, 110], (0.2 + 0.12 * hs) * form);

  const yOff = intro ? -20 : 40;
  const T = p => {
    const side = p[0] < 0 ? -1 : 1;
    let q = [p[0] * beatS + side * gap / 2, p[1] * beatS, p[2] * beatS];
    q = rot3(q, pitch, yaw, side * split * 0.25);
    const d = q[2] + 900, s = 900 / d * zoom;
    return [W / 2 + q[0] * s, H / 2 - q[1] * s + yOff, s];
  };

  // 经纬线
  const lineA = (intro ? 0.15 + 0.5 * form * form : 0.45) * (1 - scatter) * (0.8 + 0.4 * mid);
  if (lineA > 0.01) {
    const bk = { c: [], v: [], m: [] };
    for (const pl of RINGS) {
      let pv = null, px = 0;
      for (const p of pl) {
        const q = T(p);
        if (pv && (px < 0) !== (p[0] < 0)) { pv = q; px = p[0]; continue; }   // 不跨过中缝
        px = p[0];
        if (pv) { const key = p[0] < -20 ? 'c' : p[0] > 20 ? 'm' : 'v'; bk[key].push(pv[0], pv[1], q[0], q[1]); }
        pv = q;
      }
    }
    glowSegs(ctx, bk.c, C.cyan, lineA * 0.5, 1, 0.7);
    glowSegs(ctx, bk.m, C.magenta, lineA * 0.5, 1, 0.7);
    glowSegs(ctx, bk.v, C.violet, lineA * 0.5, 1, 0.7);
  }

  // 光点：intro 里从星云聚拢；break 里四散
  const buckets = { c: [], v: [], m: [] };
  for (const P of PTS) {
    const f = intro ? smooth(clamp((form - P.ord * 0.85) / 0.15)) : 1;
    let p = P.p;
    if (f < 1) p = [lerp(P.far[0], p[0], f), lerp(P.far[1], p[1], f), lerp(P.far[2], p[2], f)];
    if (scatter > 0) { const e = scatter * scatter * 700; p = [p[0] + P.dir[0] * e, p[1] + P.dir[1] * e - scatter * 120, p[2] + P.dir[2] * e]; }
    const q = T(p);
    const a = P.b * (0.55 + 0.45 * Math.sin(t * 2 + P.tw)) * (0.35 + 0.65 * f);
    if (a < 0.15) continue;
    const key = P.p[0] < -20 ? 'c' : P.p[0] > 20 ? 'm' : 'v';
    buckets[key].push(q[0], q[1], clamp(q[2] * 2.2, 1, 3));
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const [key, col] of [['c', C.cyan], ['m', C.magenta], ['v', C.violet]]) {
    const arr = buckets[key]; ctx.fillStyle = rgba(mix(col, C.white, 0.35), 0.75 * (1 - scatter * 0.6));
    ctx.beginPath(); for (let i = 0; i < arr.length; i += 3) ctx.rect(arr[i] - arr[i + 2] / 2, arr[i + 1] - arr[i + 2] / 2, arr[i + 2], arr[i + 2]); ctx.fill();
  }
  ctx.restore();

  // 獠牙：沿中缝两排，交错咬合；缝越开露得越多
  const teethA = (intro ? smooth(prog(form, 0.7, 1)) : 1) * (1 - scatter);
  if (teethA > 0.01) {
    const N = 9;
    for (const side of [-1, 1]) {
      for (let i = 0; i < N; i++) {
        const v0 = (i + (side > 0 ? 0.5 : 0)) / N;
        const y0 = lerp(150, -150, v0), y1 = lerp(150, -150, v0 + 1 / N);
        const zf = DZ * SC * 0.92;
        const len = (34 + 16 * Math.sin(i * 1.7 + (side > 0 ? 1 : 0)) + (i === 2 || i === 6 ? 34 : 0)) * (1 - 0.6 * Math.pow(Math.abs(v0 - 0.5) * 2, 2)) * (0.7 + 0.3 * clamp(gap / 60));
        const base0 = [side * 2, y0, zf], base1 = [side * 2, y1, zf], tip = [-side * (len - gap / 2 + 2), (y0 + y1) / 2 - 4, zf + 4];
        const a = T(base0), b = T(base1);
        // 牙尖用"另一半"的位移：直接按 side 的方向算
        const cq = rot3([tip[0] * beatS + side * gap / 2, tip[1] * beatS, tip[2] * beatS], pitch, yaw, side * split * 0.25);
        const s = 900 / (cq[2] + 900) * zoom, cx = W / 2 + cq[0] * s, cy = H / 2 - cq[1] * s + yOff;
        const g = ctx.createLinearGradient((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, cx, cy);
        g.addColorStop(0, rgba(mix(C.bone, side < 0 ? C.teal : [150, 30, 110], 0.55), 0.85 * teethA)); g.addColorStop(1, rgba(C.bone, 0.95 * teethA));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo((a[0] + cx) / 2, (a[1] + cy) / 2 - 3, cx, cy); ctx.quadraticCurveTo((b[0] + cx) / 2, (b[1] + cy) / 2 + 3, b[0], b[1]); ctx.closePath(); ctx.fill();
        glow(ctx, cx, cy, 8, C.white, 0.3 * teethA * h);
      }
    }
    // 缝里透出的光
    const top = T([0, 150, DZ * SC * 0.9]), bot = T([0, -150, DZ * SC * 0.9]);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const sg = ctx.createLinearGradient(top[0], top[1], bot[0], bot[1]);
    sg.addColorStop(0, rgba(C.pink, 0)); sg.addColorStop(0.5, rgba(C.pink, 0.22 * teethA * (0.3 + h))); sg.addColorStop(1, rgba(C.cyan, 0));
    ctx.strokeStyle = sg; ctx.lineWidth = 3 + gap * 0.25; ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(bot[0], bot[1]); ctx.stroke();
    ctx.restore();
  }

  // 每一下鼓点：一圈光波从心脏向外扩散
  const { k } = A.sinceBeat(t);
  if (!intro || form > 0.3) for (let j = k; j > k - 4; j--) {
    if (!A.isHit(j)) continue;
    const age = t - A.beatT(j); if (age < 0 || age > 1.6) continue;
    const r = 260 + age * 520, a = A.hitAt(j) * Math.pow(1 - age / 1.6, 2) * (1 - scatter);
    const segs = { c: [], m: [] };
    let pv = null;
    for (let i = 0; i <= 96; i++) {
      const th = i / 96 * 6.2832;
      const q = T([Math.cos(th) * r, -40 + Math.sin(th) * r * 0.25, Math.sin(th) * r]);
      if (pv) (Math.cos(th) < 0 ? segs.c : segs.m).push(pv[0], pv[1], q[0], q[1]);
      pv = q;
    }
    glowSegs(ctx, segs.c, C.cyan, a * 0.7, 1.3, 1);
    glowSegs(ctx, segs.m, C.magenta, a * 0.7, 1.3, 1);
  }
}
const lyricStyle = (t, S) => ({ y: H - 170, size: 46, accent: C.pink, a: S.name === 'intro' || S.name === 'pre0' ? 0.9 : 1 });
module.exports = { draw, lyricStyle };
