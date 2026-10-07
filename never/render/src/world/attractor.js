// 场景三：Aizawa 奇异吸引子。几千个粒子按同一组方程飞行，拖出发光的轨迹，织成一座旋转的光之雕塑
// 方程：dx=(z-b)x-dy, dy=dx+(z-b)y, dz=c+az-z³/3-(x²+y²)(1+ez)+fzx³
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeInOut, glow, glowSegs, rot3, mulberry32 } = K;
const A = require('../audio');

const a = 0.95, b = 0.7, c = 0.6, d = 3.5, e = 0.25, f = 0.1;
function deriv(x, y, z) {
  return [(z - b) * x - d * y, d * x + (z - b) * y, c + a * z - z * z * z / 3 - (x * x + y * y) * (1 + e * z) + f * z * x * x * x];
}
const N = 1600, RATE = 90, T0 = 45.5, SPAN = 32;          // 每秒 90 步，覆盖本段约 32 秒
const STEPS = Math.ceil(SPAN * RATE) + 2, DT = 0.012;
const TRAJ = new Float32Array(N * STEPS * 3);
{
  const r = mulberry32(77);
  for (let i = 0; i < N; i++) {
    let x = (r() - 0.5) * 0.4, y = (r() - 0.5) * 0.4, z = (r() - 0.5) * 0.4;
    for (let w = 0; w < 400 + Math.floor(r() * 600); w++) { const D = deriv(x, y, z); x += D[0] * DT; y += D[1] * DT; z += D[2] * DT; }   // 先落到吸引子上
    for (let s = 0; s < STEPS; s++) {
      const o = (i * STEPS + s) * 3; TRAJ[o] = x; TRAJ[o + 1] = y; TRAJ[o + 2] = z;
      for (let k = 0; k < 2; k++) { const D = deriv(x, y, z); x += D[0] * DT; y += D[1] * DT; z += D[2] * DT; }
    }
  }
}
const ORDER = (() => { const r = mulberry32(3); return Array.from({ length: N }, (_, i) => i).sort(() => r() - 0.5); })();

function draw(ctx, t, S) {
  const local = t - S.t0, u = S.u;
  const mid = A.env('mid', t), rms = A.env('rms', t);
  // 背景：深空 + 一点星
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
  g.addColorStop(0, 'rgb(14,12,30)'); g.addColorStop(1, 'rgb(3,4,10)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const step = clamp((t - T0) * RATE, 0, STEPS - 1);
  const s0 = Math.floor(step);
  const TRAIL = 26;
  // 镜头：慢慢绕着转，逐渐推近
  const ry = local * 0.18, rx = -0.9 + 0.25 * Math.sin(local * 0.11);
  const R = lerp(230, 330, easeInOut(u));
  const camZ = 6.2;
  const visible = Math.floor(lerp(220, N, smooth(prog(u, 0, 0.6))));
  const buckets = [[], [], [], []];
  const heads = [];
  for (let j = 0; j < visible; j++) {
    const i = ORDER[j];
    let prev = null;
    for (let q = Math.max(0, s0 - TRAIL); q <= s0; q += 2) {
      const o = (i * STEPS + q) * 3;
      const p = rot3([TRAJ[o], TRAJ[o + 2] - 0.8, TRAJ[o + 1]], rx, ry, 0);
      const z = p[2] + camZ, sc = R * camZ / z;
      const sp = [W / 2 + p[0] * sc, H / 2 - p[1] * sc];
      if (prev) {
        const age = (s0 - q) / TRAIL;
        const band = Math.min(3, Math.floor((1 - age) * 4));
        buckets[band].push(prev[0], prev[1], sp[0], sp[1]);
      }
      prev = sp;
    }
    if (j % 7 === 0 && prev) heads.push(prev);
  }
  // 越新的一段越亮；颜色从金到青
  const cols = [[120, 90, 160], C.cyan, C.ice, C.gold];
  buckets.forEach((bk, k) => glowSegs(ctx, bk, cols[k], (0.12 + 0.22 * k) * (0.7 + 0.5 * mid), 1.0, 0.6));
  for (const h of heads) glow(ctx, h[0], h[1], 6, C.white, 0.35 + 0.4 * rms);
}
module.exports = { draw, lyricStyle: { y: H - 120, size: 46 } };
