// 场景八（再次蓄力）：时光隧道。镜头沿一条弯曲的光之隧道飞行，墙上是几千道流光，
// 每隔一段悬着一圈会转的刻度环（像钟面）。93–95 小节低音抽空：速度骤降，流光凝成悬停的光点，时间几乎停住；
// 95 小节滚奏：再次加速，尽头的光越来越亮，接最后的高潮
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeIn, glow, glowSegs, mulberry32 } = K;
const A = require('../audio');
const { camera } = require('../cam');

const R = 230, L = 3000, N = 4200;
const center = s => [520 * Math.sin(s * 0.00042) + 260 * Math.sin(s * 0.00093 + 1), 380 * Math.sin(s * 0.00031 + 2), s];
const PAL = [C.cyan, C.violet, C.rose, C.gold, C.ice];
const PTS = (() => { const r = mulberry32(88); return Array.from({ length: N }, () => ({ s: r() * L, th: r() * 6.2832, rr: R * (0.85 + r() * 0.35), c: Math.floor(r() * 5), b: 0.4 + r() * 0.6 })); })();
const RING = 520;

// 速度（单位/秒）：抽空时几乎停住，滚奏时加速
function speed(l) {
  if (l < 9.5) return lerp(700, 1000, l / 9.5);
  if (l < 13.3) return lerp(1000, 40, smooth(prog(l, 9.5, 10.6)));
  return lerp(40, 4200, easeIn(prog(l, 13.3, 15.3)));
}
function dist(l) { let s = 0; const n = 160, dt = l / n; for (let i = 0; i < n; i++) s += speed((i + 0.5) * dt) * dt; return s; }

function draw(ctx, t, S) {
  const local = t - S.t0;
  const mid = A.env('mid', t), hi = A.env('high', t);
  const v = speed(local), cs = dist(local);
  const roll = easeIn(prog(local, 13.3, 15.3));
  const cp = center(cs), ah = center(cs + 400);
  const d = [ah[0] - cp[0], ah[1] - cp[1], ah[2] - cp[2]], dl = Math.hypot(...d);
  const P = camera({ x: cp[0], y: cp[1], z: cp[2], yaw: Math.atan2(d[0], d[2]), pitch: Math.asin(d[1] / dl), f: 900 });

  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
  g.addColorStop(0, 'rgb(16,12,36)'); g.addColorStop(1, 'rgb(3,3,10)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // 尽头的光
  const far = P(center(cs + 2800));
  if (far) {
    glow(ctx, far[0], far[1], 260 + 450 * roll, [255, 210, 160], 0.35 + 0.25 * roll);
    glow(ctx, far[0], far[1], 50 + 120 * roll, C.white, 0.5 + 0.2 * roll);
  }

  // 刻度环：远的先画
  const k0 = Math.ceil(cs / RING);
  for (let k = k0 + 6; k >= k0; k--) {
    const s = k * RING, c = center(s), rel = s - cs;
    if (rel < 30) continue;
    const fade = clamp(rel / 300) * clamp((3400 - rel) / 1800);
    const rot = (k % 2 ? 1 : -1) * (t * 0.25 + k);
    const segs = [], ticks = [];
    const ringR = R * 0.78;
    let prev = null;
    for (let i = 0; i <= 96; i++) {
      const a = i / 96 * 6.2832;
      const q = P([c[0] + Math.cos(a) * ringR, c[1] + Math.sin(a) * ringR, s]);
      if (q && prev) segs.push(prev[0], prev[1], q[0], q[1]);
      prev = q;
    }
    for (let i = 0; i < 60; i++) {
      const a = rot + i / 60 * 6.2832, long = i % 5 === 0;
      const r1 = ringR * (long ? 0.86 : 0.92);
      const q0 = P([c[0] + Math.cos(a) * ringR, c[1] + Math.sin(a) * ringR, s]), q1 = P([c[0] + Math.cos(a) * r1, c[1] + Math.sin(a) * r1, s]);
      if (q0 && q1) ticks.push(q0[0], q0[1], q1[0], q1[1]);
    }
    // 一段缺口弧，像指针
    const arc = [];
    let pa = null;
    for (let i = 0; i <= 30; i++) {
      const a = -rot * 1.7 + i / 30 * 1.6;
      const q = P([c[0] + Math.cos(a) * ringR * 1.08, c[1] + Math.sin(a) * ringR * 1.08, s]);
      if (q && pa) arc.push(pa[0], pa[1], q[0], q[1]);
      pa = q;
    }
    const col = PAL[((k % 5) + 5) % 5];
    glowSegs(ctx, segs, col, 0.35 * fade, 1, 0.8);
    glowSegs(ctx, ticks, C.gold, 0.5 * fade, 1, 0.6);
    glowSegs(ctx, arc, col, 0.7 * fade, 2, 1);
  }

  // 墙上的流光：每个点沿隧道循环；拖尾长度 = 速度 × 快门
  const tail = Math.max(2, v * 0.05);
  const buckets = PAL.map(() => [[], []]);
  const dots = [];
  for (const p of PTS) {
    const rel = ((p.s - cs) % L + L) % L;
    if (rel < 20) continue;
    const s = cs + rel, c0 = center(s), c1 = center(s - tail);
    const th = p.th + s * 0.0004;
    const ox = Math.cos(th) * p.rr, oy = Math.sin(th) * p.rr;
    const a = P([c0[0] + ox, c0[1] + oy, s]), b = P([c1[0] + ox, c1[1] + oy, s - tail]);
    if (!a || !b) continue;
    const fade = clamp(rel / 150) * Math.pow(clamp((L - rel) / L), 1.6);
    const lvl = p.b * fade > 0.5 ? 1 : 0;
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 2.5) dots.push(a[0], a[1], a[2], p.c, p.b * fade);
    else buckets[p.c][lvl].push(a[0], a[1], b[0], b[1]);
  }
  buckets.forEach((bl, ci) => bl.forEach((arr, lvl) => glowSegs(ctx, arr, PAL[ci], (lvl ? 0.55 : 0.25) * (0.8 + 0.4 * mid), 1.2, 0.7)));
  // 时间停住时：悬停的光点，跟着高频轻轻闪
  for (let k = 0; k < dots.length; k += 10) glow(ctx, dots[k], dots[k + 1], 3 + 6 * Math.min(2, dots[k + 2]), PAL[dots[k + 3]], dots[k + 4] * (0.4 + 0.4 * hi));

  if (roll > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba([255, 225, 190], 0.12 * Math.pow(roll, 2.4)); ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}
module.exports = { draw, lyricStyle: { y: H - 130, size: 48 } };
