// 场景一：夜城俯瞰。线框高楼、窗灯、车流光河；两束车灯（我们）在不同的街上，慢慢靠近
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeInOut, glow, glowSegs, line, mulberry32, hash } = K;
const A = require('../audio');
const { camera } = require('../cam');

const GRID = 22, STEP = 170;
const BUILDINGS = (() => {
  const r = mulberry32(31), out = [];
  for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
    const x = (i - GRID / 2) * STEP, z = j * STEP;
    const dc = Math.hypot(i - GRID / 2, j - 11) / 11;          // 离市中心多远
    const h = 30 + Math.pow(r(), 2.4) * 380 * (1.3 - Math.min(1, dc)) + (r() < 0.035 ? 330 : 0);
    const w = 60 + r() * 50, d = 60 + r() * 50;
    const win = [];
    const nw = Math.floor(h / 9) + 4;
    for (let k = 0; k < nw * 4; k++) win.push({ face: Math.floor(r() * 4), u: 0.08 + r() * 0.84, v: 0.05 + Math.floor(r() * (h / 14)) / (h / 14) * 0.9, lit: r() < 0.62, warm: r() < 0.72, ph: r() * 6.28 });
    out.push({ x, z, w, d, h, win, seed: r() });
  }
  return out;
})();
// 街道上的车：沿 x 方向和 z 方向的车道
const CARS = (() => {
  const r = mulberry32(8), out = [];
  for (let n = 0; n < 900; n++) {
    const alongZ = r() < 0.5, lane = Math.floor(r() * GRID) - GRID / 2 + 0.5;
    out.push({ alongZ, lane, off: r(), sp: 0.03 + r() * 0.05, dir: r() < 0.5 ? 1 : -1, len: 14 + r() * 20 });
  }
  return out;
})();

function cam(t) {
  // 从高空缓缓前推、下降、轻微转向
  const u = prog(t, 0, 31);
  // 斜 45° 看街区，更像电影里的航拍
  return camera({ x: lerp(-2400, -1300, u), y: lerp(2300, 1500, easeInOut(u)), z: lerp(-700, 500, u), yaw: lerp(0.62, 0.74, easeInOut(u)), pitch: lerp(-0.5, -0.42, easeInOut(u)), f: 1150 });
}

function draw(ctx, t, S) {
  const P = cam(t);
  const hi = A.env('high', t), mid = A.env('mid', t);
  // 天际的城市光雾
  // 天空：高处深蓝，地平线一带是城市灯光照亮的暖色雾
  const hz = P([0, 0, 1e6]); const hy = hz ? hz[1] : H * 0.15;
  const g = ctx.createLinearGradient(0, hy - 500, 0, hy + 260);
  g.addColorStop(0, 'rgb(5,8,22)'); g.addColorStop(0.6, 'rgb(28,26,62)'); g.addColorStop(0.85, 'rgb(92,58,70)'); g.addColorStop(1, 'rgb(20,16,30)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // 远处一直铺到地平线的灯海（只画光点）
  ctx.save();
  for (let k = 0; k < 16000; k++) {
    const a = hash(k * 1.7), b = hash(k * 3.1 + 2), c = hash(k * 5.3 + 7);
    const rr = 1800 + Math.pow(b, 0.8) * 42000, th = a * 6.2832;
    const p = [Math.cos(th) * rr, 0, GRID * STEP / 2 + Math.sin(th) * rr];
    if (Math.abs(p[0]) < GRID * STEP / 2 && Math.abs(p[2] - GRID * STEP / 2) < GRID * STEP / 2) continue;
    const q = P(p); if (!q || q[0] < -10 || q[0] > W + 10) continue;
    const tw = 0.6 + 0.4 * Math.sin(t * (0.4 + c) + k);
    ctx.fillStyle = rgba(c < 0.75 ? [255, 190, 120] : C.ice, (0.35 + 0.4 * c) * tw * clamp(q[2] * 40));
    const sz = clamp(q[2] * 5, 1.2, 2.6); ctx.fillRect(q[0], q[1], sz, sz);
  }
  ctx.restore();

  // 车流：红色尾灯与白色前灯组成的光河
  const red = [], white = [];
  const L = GRID * STEP;
  for (const c of CARS) {
    const s = ((c.off + c.dir * c.sp * t) % 1 + 1) % 1;
    const along = (s - 0.5) * L, laneP = c.lane * STEP + (c.dir > 0 ? 12 : -12);
    const p0 = c.alongZ ? [laneP, 1, along + L / 2] : [along, 1, laneP + L / 2];
    const p1 = c.alongZ ? [laneP, 1, along + L / 2 - c.dir * c.len] : [along - c.dir * c.len, 1, laneP + L / 2];
    const a = P(p0), b = P(p1);
    if (!a || !b) continue;
    (c.dir > 0 ? red : white).push(a[0], a[1], b[0], b[1]);
  }
  glowSegs(ctx, red, [255, 70, 60], 0.55, 1.4, 1.2);
  glowSegs(ctx, white, [255, 230, 190], 0.45, 1.2, 1.2);

  // 路灯：沿每条街一串暖色光点
  ctx.save();
  for (let i = 0; i <= GRID; i++) for (let j = 0; j <= GRID * 3; j++) {
    for (const p of [[(i - GRID / 2 - 0.5) * STEP, 3, j * STEP / 3 - STEP / 2], [(j / 3 - GRID / 2 - 0.5) * STEP, 3, i * STEP - STEP / 2]]) {
      const q = P(p); if (!q) continue;
      const fog = clamp(1 - q[3] / 9000);
      ctx.fillStyle = rgba([255, 190, 110], 0.55 * fog);
      const sz = Math.max(1, 2.2 * q[2]);
      ctx.fillRect(q[0] - sz / 2, q[1] - sz / 2, sz, sz);
    }
  }
  ctx.restore();
  // 楼：从远到近画，暗色面遮挡后面的光
  const items = [];
  for (const b of BUILDINGS) { const c = P([b.x, b.h / 2, b.z]); if (c) items.push([c[3], b]); }
  items.sort((a, b) => b[0] - a[0]);
  ctx.save();
  for (const [depth, b] of items) {
    const fog = clamp(1 - depth / 9000);
    if (fog <= 0.02) continue;
    const x0 = b.x - b.w / 2, x1 = b.x + b.w / 2, z0 = b.z - b.d / 2, z1 = b.z + b.d / 2;
    const corners = [[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1], [x0, b.h, z0], [x1, b.h, z0], [x1, b.h, z1], [x0, b.h, z1]].map(P);
    if (corners.some(q => !q)) continue;
    // 实心的暗面
    ctx.fillStyle = rgba(mix([22, 26, 58], [7, 9, 20], fog), 0.97);
    for (const f of [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7], [4, 5, 6, 7]]) {
      ctx.beginPath(); ctx.moveTo(corners[f[0]][0], corners[f[0]][1]);
      for (const k of f.slice(1)) ctx.lineTo(corners[k][0], corners[k][1]);
      ctx.closePath(); ctx.fill();
    }
    // 窗灯
    for (const w of b.win) {
      if (!w.lit) continue;
      const tw = 0.55 + 0.45 * Math.sin(t * (0.5 + w.ph) + w.ph) * (0.4 + hi);
      const fx = w.face % 2 ? [x0 + w.u * b.w, z0, x1 - x0] : [x0, z0 + w.u * b.d, 0];
      const p = w.face === 0 ? [x0 + w.u * b.w, w.v * b.h, z0] : w.face === 1 ? [x1, w.v * b.h, z0 + w.u * b.d] : w.face === 2 ? [x0 + w.u * b.w, w.v * b.h, z1] : [x0, w.v * b.h, z0 + w.u * b.d];
      const q = P(p); if (!q) continue;
      const sz = Math.max(1.2, 3.4 * q[2]);
      ctx.fillStyle = rgba(w.warm ? C.gold : C.ice, (0.25 + 0.75 * fog) * clamp(tw));
      ctx.fillRect(q[0] - sz / 2, q[1] - sz / 2, sz, sz * 1.4);
    }
    // 楼顶的细线轮廓
    const top = [4, 5, 6, 7, 4].map(k => corners[k]);
    const segs = [];
    for (let k = 0; k < 4; k++) segs.push(top[k][0], top[k][1], top[k + 1][0], top[k + 1][1]);
    for (const k of [4, 5, 6, 7]) segs.push(corners[k][0], corners[k][1], corners[k - 4][0], corners[k - 4][1]);
    ctx.strokeStyle = rgba(C.cyan, 0.16 * fog);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < segs.length; k += 4) { ctx.moveTo(segs[k], segs[k + 1]); ctx.lineTo(segs[k + 2], segs[k + 3]); }
    ctx.stroke();
    // 高楼顶的红色航空灯
    if (b.h > 380) { const q = P([b.x, b.h + 8, b.z]); if (q) glow(ctx, q[0], q[1], 16 * q[2] + 4, [255, 60, 50], fog * (0.5 + 0.5 * Math.sin(t * 3 + b.seed * 9))); }
  }
  ctx.restore();

  // 两束光（我们）：沿两条街驶向同一个路口
  const meet = [0.5 * STEP, 1, 12 * STEP];
  const u = easeInOut(prog(t, 2, 30));
  const A1 = [lerp(-7.5 * STEP, meet[0], u), 2, meet[2] - 2], A2 = [meet[0] + 2, 2, lerp(meet[2] + 9 * STEP, meet[2], u)];
  for (const [p, col] of [[A1, C.gold], [A2, C.ice]]) {
    const q = P(p); if (!q) continue;
    glow(ctx, q[0], q[1], 70 * q[2] + 20, col, 0.6);
    glow(ctx, q[0], q[1], 14 * q[2] + 5, C.white, 0.9);
  }
}
module.exports = { draw, lyricStyle: { y: H - 140, size: 50 } };
