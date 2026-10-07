// 走廊（预副歌，没有鼓）：一条望不到头的走廊，一道道霓虹门框，地面像水一样倒映着灯。
// 镜头越走越快，门框一点点扭转（意识开始不对劲）；108 拍急停：灯从远到近一盏盏熄灭，只剩尽头一点光
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeIn, glow, glowLine, mulberry32, hash } = K;
const A = require('../audio');
const { camera } = require('../cam');

const HW = 260, HH = 300, GAP = 340, NF = 30;   // 半宽、高、门框间距
const COLS = [C.cyan, C.magenta, C.violet];

function draw(ctx, t, S) {
  const local = t - S.t0, u = S.u;
  const hi = A.env('high', t), mid = A.env('mid', t);
  const tStop = A.beatT(S.a + 28);                                 // 108 拍
  const stop = t >= tStop;
  // 速度：慢慢加快
  const z = 260 * local + 140 * local * local / (S.t1 - S.t0);
  const twist = 0.5 * smooth(u) * Math.sin(local * 0.4);
  const P = camera({ x: 18 * Math.sin(local * 0.5), y: 150 + 8 * Math.sin(local * 0.9), z, yaw: 0.03 * Math.sin(local * 0.3), pitch: 0, f: 820 });

  ctx.fillStyle = 'rgb(5,5,11)'; ctx.fillRect(0, 0, W, H);
  // 尽头的光
  const end = P([0, 150, z + NF * GAP]);
  if (end) glow(ctx, end[0], end[1], 260, C.pink, 0.35 + (stop ? 0.2 : 0));

  const k0 = Math.floor(z / GAP) + 1;
  for (let k = k0 + NF - 1; k >= k0; k--) {
    const zz = k * GAP, rel = zz - z;
    const fade = clamp(rel / 200) * clamp(1 - rel / (NF * GAP));
    // 急停：从远到近依次熄灭
    let on = 1;
    if (stop) { const order = (tStop + (1 - rel / (NF * GAP)) * 0.8); on = t < order ? 1 : Math.max(0, 1 - (t - order) / 0.08); }
    // 日光灯管偶尔闪一下（跟着高频）
    const flick = hash(k * 13.1 + Math.floor(t * 12)) < 0.04 + 0.12 * hi ? 0.35 : 1;
    const a = fade * on * flick;
    if (a < 0.01) continue;
    const col = COLS[((k % 3) + 3) % 3];
    const rot = twist * (k - k0) * 0.06;
    const corner = (x, y) => { const c = Math.cos(rot), s = Math.sin(rot); return [x * c - (y - 150) * s, 150 + x * s + (y - 150) * c]; };
    const pts = [[-HW, 0], [-HW, HH], [HW, HH], [HW, 0]].map(([x, y]) => { const q = corner(x, y); return P([q[0], q[1], zz]); });
    if (pts.some(q => !q)) continue;
    glowLine(ctx, pts.map(q => [q[0], q[1]]), col, a * 0.9, 2.2, 1.3);
    // 地面倒影：门框在地面以下镜像，淡一点、抖一点
    const ref = [[-HW, 0], [-HW, -HH], [HW, -HH], [HW, 0]].map(([x, y]) => { const q = corner(x, -y); return P([q[0] + Math.sin(t * 2 + k) * 4, -q[1], zz]); });
    if (!ref.some(q => !q)) glowLine(ctx, ref.map(q => [q[0], q[1]]), col, a * 0.22, 2, 1.5);
    // 天花板正中的灯管，和门框之间地面的接缝
    const l0 = P([-HW * 0.45, HH - 4, zz + GAP / 2]), l1 = P([HW * 0.45, HH - 4, zz + GAP / 2]);
    if (l0 && l1) glowLine(ctx, [[l0[0], l0[1]], [l1[0], l1[1]]], C.ice, a * 0.5, 2.5, 1.2);
    const f0 = P([-HW, 0, zz + GAP / 2]), f1 = P([HW, 0, zz + GAP / 2]);
    if (f0 && f1) { ctx.strokeStyle = rgba(C.steel, 0.12 * fade); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(f0[0], f0[1]); ctx.lineTo(f1[0], f1[1]); ctx.stroke(); }
    // 侧墙上的门：一侧青一侧品红，门缝里漏出光
    if (k % 2 === 0) for (const side of [-1, 1]) {
      const dz0 = zz + GAP * 0.25, dz1 = zz + GAP * 0.65;
      const d = [[side * HW, 0, dz0], [side * HW, HH * 0.72, dz0], [side * HW, HH * 0.72, dz1], [side * HW, 0, dz1]].map(P);
      if (d.some(q => !q)) continue;
      ctx.fillStyle = rgba(side < 0 ? [8, 30, 36] : [36, 8, 28], 0.9 * fade);
      ctx.beginPath(); d.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.fill();
      glowLine(ctx, [[d[3][0], d[3][1]], [d[2][0], d[2][1]]], side < 0 ? C.cyan : C.magenta, a * 0.45, 1.4, 1);
    }
    // 顶上的灯在地面上的光斑
    const fl = P([0, 0, zz]);
    if (fl) glow(ctx, fl[0], fl[1], 200 * fl[2], col, 0.12 * a);
  }
  // 地面：一层暗色的"水面"让倒影更像倒影
  const hz = P([0, 0, z + 1e6]);
  if (hz) {
    const g = ctx.createLinearGradient(0, hz[1], 0, H);
    g.addColorStop(0, 'rgba(5,5,11,0.15)'); g.addColorStop(1, 'rgba(5,5,11,0.55)');
    ctx.fillStyle = g; ctx.fillRect(0, hz[1], W, H - hz[1]);
  }
}
const lyricStyle = (t, S) => ({ y: H / 2 + 300, size: 44, accent: C.magenta });
module.exports = { draw, lyricStyle };
