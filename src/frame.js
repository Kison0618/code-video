// 合成一帧：背景/图形层(draw) → 泛光 → 清晰文字层(over) → 字幕 → 暗角颗粒 → 首尾淡黑
//   演示由环境变量 JQ_DEMO=A|B 选择
'use strict';
const K = require('./core');
const FX = require('./fx');
const L = require('./lib');
const D = require('./demos/' + (process.env.JQ_DEMO || 'A'));

function renderFrame(ctx, t, frame) {
  ctx.save();
  D.draw(ctx, t);
  const bl = D.bloomAt ? D.bloomAt(t) : (D.bloom == null ? 0.9 : D.bloom);
  if (bl > 0.001) FX.bloom(ctx, bl, FX.bake(ctx));
  D.over && D.over(ctx, t);
  L.subs(ctx, t, D.SUBS);
  FX.finish(ctx, frame, D.vig == null ? 0.75 : D.vig, 0.05);
  FX.black(ctx, 1 - K.smooth(t / 0.6));
  if (!D.customFade) FX.black(ctx, K.smooth(K.prog(t, D.DUR - 0.9, D.DUR)));
  ctx.restore();
}
module.exports = { renderFrame, D };
