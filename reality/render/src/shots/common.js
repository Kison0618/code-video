// 镜头之间共用的小件：画"你"（金点）
'use strict';
const K = require('../core');
const { C, rgba, glow } = K;

function you(ctx, x, y, a = 1, r = 5) {
  glow(ctx, x, y, r * 16, C.gold, 0.35 * a);
  glow(ctx, x, y, r * 4, C.gold, 0.8 * a);
  ctx.fillStyle = rgba(C.white, a); ctx.beginPath(); ctx.arc(x, y, r * 0.7, 0, 6.2832); ctx.fill();
}
module.exports = { you };
