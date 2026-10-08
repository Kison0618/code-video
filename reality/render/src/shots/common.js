// 镜头之间共用的小件：画"你"（金点）、画人群
'use strict';
const K = require('../core');
const { C, rgba, glow, clamp } = K;
const { PEOPLE } = require('../pop');

function you(ctx, x, y, a = 1, r = 5) {
  glow(ctx, x, y, r * 16, C.gold, 0.35 * a);
  glow(ctx, x, y, r * 4, C.gold, 0.8 * a);
  ctx.fillStyle = rgba(C.white, a); ctx.beginPath(); ctx.arc(x, y, r * 0.7, 0, 6.2832); ctx.fill();
}
// pos(p, i) → [x, y, color, alpha, size]；按颜色分桶一次画完
function crowd(ctx, pos) {
  const buckets = new Map();
  PEOPLE.forEach((p, i) => {
    const q = pos(p, i); if (!q || q[3] <= 0.01) return;
    const key = q[2].join(',') + '|' + Math.round(q[3] * 10);
    if (!buckets.has(key)) buckets.set(key, { col: q[2], a: Math.round(q[3] * 10) / 10, pts: [] });
    buckets.get(key).pts.push(q[0], q[1], q[4] || p.sz);
  });
  for (const b of buckets.values()) {
    ctx.fillStyle = rgba(b.col, clamp(b.a));
    ctx.beginPath();
    for (let k = 0; k < b.pts.length; k += 3) { ctx.moveTo(b.pts[k] + b.pts[k + 2], b.pts[k + 1]); ctx.arc(b.pts[k], b.pts[k + 1], b.pts[k + 2], 0, 6.2832); }
    ctx.fill();
  }
}
module.exports = { you, crowd };
