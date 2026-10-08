// 合成一帧：按时间找到当前镜头 → 轻微泛光 → 暗角颗粒 → 首尾淡入淡出
'use strict';
const K = require('./core');
const { W, H, C, rgba, prog, smooth } = K;
const A = require('./audio');
const FX = require('./fx');

const SHOTS = ['s01_title', 's03_malice', 's05_monster', 's09_dist'].map(n => require('./shots/' + n));

function renderFrame(ctx, t, frame) {
  ctx.save();
  ctx.fillStyle = rgba(C.bg); ctx.fillRect(0, 0, W, H);
  const sh = SHOTS.find(s => t >= s.t0 && t < s.t1);
  if (sh) sh.draw(ctx, t);
  const base = FX.bake(ctx);
  FX.bloom(ctx, 0.45, base);
  FX.finish(ctx, frame, 0.9);
  FX.black(ctx, Math.max(1 - smooth(prog(t, 0, 0.6)), smooth(prog(t, A.DUR - 1.5, A.DUR - 0.05))));
  ctx.restore();
}
module.exports = { renderFrame };
