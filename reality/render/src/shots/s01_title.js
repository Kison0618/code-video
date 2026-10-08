// 1 · 前奏：一个金点亮起，人群一批批出现，铺成 80 亿人；镜头拉远，金点越来越小。片名
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeInOut } = K;
const A = require('../audio');
const U = require('../ui');
const { you, crowd } = require('./common');

function draw(ctx, t) {
  const born = smooth(prog(t, A.beatT(8), A.beatT(40)));          // 人群出现的进度
  const zoom = lerp(2.6, 1, easeInOut(prog(t, A.beatT(4), A.beatT(44))));
  const cx = W / 2, cy = H / 2;
  const P = (x, y) => [cx + (x - cx) * zoom, cy + (y - cy) * zoom];
  crowd(ctx, p => {
    if (p.ord > born) return null;
    const [x, y] = P(p.x, p.y);
    const a = (0.35 + 0.35 * Math.sin(t * 0.8 + p.tw)) * clamp((born - p.ord) * 20);
    return [x, y, C.gray, 0.4 + a, p.sz * Math.sqrt(zoom)];
  });
  you(ctx, cx, cy, smooth(prog(t, 0.5, 3)), 5 * Math.sqrt(zoom) * 0.8);
  // 计数器
  const ca = smooth(prog(t, A.beatT(8), A.beatT(10)));
  if (ca > 0) {
    U.note(ctx, '样本 · POPULATION', W - 120, 92, { align: 'right', alpha: 0.7 * ca });
    U.rolling(ctx, t, A.beatT(8), A.beatT(40) - A.beatT(8), 1, 8000000000, W - 120, 132, { alpha: ca, size: 30 });
    U.note(ctx, '1 点 ≈ 4,000,000 人', 120, H - 90, { alpha: 0.6 * ca });
    U.note(ctx, '金色 = 你', 120, H - 68, { alpha: 0.6 * ca, color: C.gold });
  }
  // 片名
  const T0 = A.beatT(24);
  const fade = 1 - smooth(prog(t, A.beatT(46), A.beatT(48)));
  if (t > T0) {
    ctx.save(); ctx.globalAlpha = fade;
    const g = ctx.createRadialGradient(W / 2, H * 0.72, 0, W / 2, H * 0.72, 700);
    g.addColorStop(0, 'rgba(7,7,9,0.75)'); g.addColorStop(1, 'rgba(7,7,9,0)');
    ctx.fillStyle = g; ctx.fillRect(0, H * 0.45, W, H * 0.55);
    U.caption(ctx, t, '你永远都只能成为', { t0: T0, y: H * 0.72, size: 54, cps: 9 });
    U.caption(ctx, t, '少部分人心中的高级', { t0: T0 + 1.1, y: H * 0.72 + 78, size: 54, cps: 9, hl: { '少部分人': C.gold }, en: 'You will only ever be worth it to a few.' });
    ctx.restore();
  }
}
module.exports = { draw, t0: 0, t1: A.beatT(48) };
