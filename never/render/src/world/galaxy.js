// 场景四：星系诞生。一团旋转的星尘向中心坍缩，内圈先成形，旋臂一圈圈长出来；
// 镜头从盘面边缘升到正上方。45–47 小节低音抽空：时间几乎停住；47 小节滚奏：镜头扎向发亮的核心
'use strict';
const K = require('../core');
const { W, H, C, rgba, clamp, lerp, prog, smooth, easeInOut, easeIn, glow, mulberry32 } = K;
const A = require('../audio');
const { camera } = require('../cam');

const R = 1000;   // 星系半径（世界单位）
function gauss(r) { return Math.sqrt(-2 * Math.log(1 - r() * 0.999)) * Math.cos(6.2832 * r()); }

// 颜色档：0 蓝白（年轻星）1 白 2 暖白 3 金（核球）4 玫红（电离氢区）
const PAL = [[150, 185, 255], [225, 232, 255], [255, 222, 185], [255, 190, 120], [255, 120, 170]];
const STARS = (() => {
  const r = mulberry32(404), out = [];
  const N = 30000;
  for (let i = 0; i < N; i++) {
    const s = {};
    if (i < 4500) {                                   // 核球：近似球形
      const rr = Math.abs(gauss(r)) * 0.09;
      s.r = rr; s.th = r() * 6.2832; s.h = gauss(r) * rr * 0.7 * R; s.col = r() < 0.7 ? 3 : 2; s.b = 0.5 + r() * 0.5;
    } else {
      const rr = Math.min(1.1, 0.05 + -Math.log(1 - r() * 0.93) * 0.38);
      const inArm = r() < 0.72;
      const arm = Math.floor(r() * 4);                // 两条主臂 + 两条细臂
      const main = arm < 2 || r() < 0.4;
      const spread = inArm ? gauss(r) * (0.22 + 0.1 * rr) * (main ? 1 : 1.5) : r() * 6.2832;
      s.r = rr; s.th = arm * Math.PI / 2 * (main ? 2 : 1) + (main ? 0 : Math.PI / 2) + Math.log(rr / 0.04) * 2.6 + spread;
      s.h = gauss(r) * R * 0.022 * (1.2 - rr * 0.5);
      const young = inArm && Math.abs(spread) < 0.2;
      s.col = young ? (r() < 0.05 ? 4 : r() < 0.6 ? 0 : 1) : (r() < 0.6 ? 2 : 1);
      s.b = (young ? 0.55 : 0.3) + r() * 0.45;
    }
    // 坍缩前：大、扁圆的星云，绕中心打着旋
    s.cr = 1.8 + r() * 1.6; s.cswirl = 1.5 + r() * 2.5; s.ch = gauss(r) * 0.45 * R;
    s.big = r() < 0.012;
    s.tw = r() * 6.28;
    out.push(s);
  }
  return out;
})();
// 星云：沿旋臂的大片柔光
const NEB = (() => {
  const r = mulberry32(77), out = [];
  for (let i = 0; i < 360; i++) {
    const rr = 0.12 + Math.pow(r(), 0.8) * 0.85, arm = Math.floor(r() * 2);
    out.push({ r: rr, th: arm * Math.PI + Math.log(rr / 0.04) * 2.6 + gauss(r) * 0.2, size: 40 + r() * 110, col: [[120, 90, 220], [70, 110, 230], [230, 90, 150], [90, 150, 230]][Math.floor(r() * 4)], a: 0.04 + r() * 0.07 });
  }
  return out;
})();
// 很远的背景星（3D 方向，跟着镜头一起转）
const FAR = (() => { const r = mulberry32(9); return Array.from({ length: 2200 }, () => { const u = r() * 2 - 1, p = r() * 6.2832, q = Math.sqrt(1 - u * u); return [q * Math.cos(p) * 1e5, u * 1e5, q * Math.sin(p) * 1e5, 0.2 + r() * 0.6]; }); })();

// 星系自己的"时钟"：抽空时几乎停住，滚奏时加速
function gclock(local) {
  const sp = l => (l < 9.3 ? 1 : l < 13.3 ? lerp(1, 0.25, smooth(prog(l, 9.3, 10.5))) : lerp(0.25, 2.2, easeIn(prog(l, 13.3, 15.3))));
  let s = 0; const n = 120, dt = local / n;
  for (let i = 0; i < n; i++) s += sp((i + 0.5) * dt) * dt;
  return s;
}

function lookAt(pos, f) {
  const d = [-pos[0], -pos[1], -pos[2]], L = Math.hypot(...d);
  return camera({ x: pos[0], y: pos[1], z: pos[2], yaw: Math.atan2(d[0], d[2]), pitch: Math.asin(d[1] / L), f });
}

function draw(ctx, t, S) {
  const local = t - S.t0;
  const mid = A.env('mid', t), hi = A.env('high', t);
  const roll = easeIn(prog(local, 13.3, 15.3));
  const gc = gclock(local);
  // 镜头：从盘面边缘（低仰角、远）升到上方，滚奏时俯冲向核心
  const el = lerp(0.1, 0.78, easeInOut(prog(local, 0, 10))) + 0.3 * roll;
  const D = lerp(3000, 1600, easeInOut(prog(local, 0, 10))) * lerp(1, 0.4, roll);
  const az = 0.4 + gc * 0.05;
  const P = lookAt([Math.cos(az) * Math.cos(el) * D, Math.sin(el) * D, Math.sin(az) * Math.cos(el) * D], 1100);

  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.75);
  g.addColorStop(0, 'rgb(12,10,28)'); g.addColorStop(1, 'rgb(2,3,9)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = 'rgba(200,210,255,0.6)';
  ctx.beginPath();
  for (const s of FAR) { const q = P(s); if (q && q[0] > 0 && q[0] < W && q[1] > 0 && q[1] < H) ctx.rect(q[0], q[1], s[3] * 2, s[3] * 2); }
  ctx.fill();
  ctx.restore();

  // 星云柔光（成形之后才出现）
  const form = local;
  const nebA = smooth(prog(form, 4, 9)) * (0.75 + 0.5 * mid);
  if (nebA > 0.01) for (const n of NEB) {
    const th = n.th + gc * (0.18 + 0.1 / (0.2 + n.r));
    const q = P([Math.cos(th) * n.r * R, 0, Math.sin(th) * n.r * R]); if (!q) continue;
    glow(ctx, q[0], q[1], n.size * q[2] * 1.6, n.col, n.a * nebA * 0.35);
  }

  // 恒星：按颜色和亮度分桶，一个桶一次填充
  const buckets = PAL.map(() => [[], [], []]);
  const bigs = [];
  for (const s of STARS) {
    const f = smooth(prog(form, 0.3 + s.r * 3, 3 + s.r * 5.5));       // 内圈先成形
    const rr = s.r * lerp(s.cr, 1, f);
    const th = s.th + gc * (0.18 + 0.1 / (0.2 + s.r)) + (1 - f) * s.cswirl / (0.3 + s.r);
    const h = lerp(s.ch, s.h, f);
    const q = P([Math.cos(th) * rr * R, h, Math.sin(th) * rr * R]); if (!q) continue;
    if (q[0] < -4 || q[0] > W + 4 || q[1] < -4 || q[1] > H + 4) continue;
    let b = s.b * lerp(1.6, 1, f) * (0.85 + 0.15 * Math.sin(t * 2 + s.tw) * hi);
    if (s.big && f > 0.5) bigs.push([q[0], q[1], q[2], s.col, b]);
    const lvl = b > 0.75 ? 2 : b > 0.5 ? 1 : 0;
    const sz = clamp(q[2] * 1.3, 1, 2.6) * (lvl === 2 ? 1.4 : 1);
    buckets[s.col][lvl].push(q[0] - sz / 2, q[1] - sz / 2, sz);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  buckets.forEach((bl, ci) => bl.forEach((arr, lvl) => {
    if (!arr.length) return;
    ctx.fillStyle = rgba(PAL[ci], [0.1, 0.18, 0.34][lvl]);
    ctx.beginPath();
    for (let k = 0; k < arr.length; k += 3) ctx.rect(arr[k], arr[k + 1], arr[k + 2], arr[k + 2]);
    ctx.fill();
  }));
  ctx.restore();
  for (const [x, y, sc, ci, b] of bigs) glow(ctx, x, y, 6 + 8 * sc, PAL[ci], 0.35 * b);

  // 恒星诞生：高频起音处，旋臂上亮起一点玫红
  for (const [ht, amp] of A.hiOnsetsBetween(t - 1.4, t)) {
    if (local < 3) continue;
    const k = Math.floor(ht * 1000) % 360, n = NEB[k];
    const th = n.th + gc * (0.18 + 0.1 / (0.2 + n.r));
    const q = P([Math.cos(th) * n.r * R, 0, Math.sin(th) * n.r * R]); if (!q) continue;
    const age = (t - ht) / 1.4;
    glow(ctx, q[0], q[1], (18 + 30 * age) * q[2] * 2, C.rose, 0.7 * amp * (1 - age));
    glow(ctx, q[0], q[1], 6 * q[2] * 2 + 2, C.white, 0.6 * amp * (1 - age));
  }

  // 核心
  const core = P([0, 0, 0]);
  if (core) {
    const cf = smooth(prog(form, 0.5, 5));
    glow(ctx, core[0], core[1], (260 + 380 * roll) * core[2] * 2.2, C.amber, (0.25 + 0.25 * cf) + 0.15 * roll);
    glow(ctx, core[0], core[1], (80 + 160 * roll) * core[2] * 2.2, [255, 235, 200], 0.4 * cf + 0.2 * roll);
  }
  // 滚奏的尽头：柔和地亮成一片（不是闪白），接下一个场景
  if (roll > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba([255, 220, 180], 0.12 * Math.pow(roll, 2.2)); ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}
module.exports = { draw, lyricStyle: { y: H - 120, size: 46 } };
