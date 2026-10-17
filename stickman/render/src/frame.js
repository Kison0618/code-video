// 合成一帧：场景 → 泛光（只有光团、闪电这类亮部会渗光）→ 首尾淡入淡出
'use strict';
const K = require('./core');
const FX = require('./fx');
// 场景：默认是样片；SCENE=motion 渲染动作验证片
const S = require(process.env.SCENE === 'motion' ? './scene_motion' : './scene');

function renderFrame(ctx, t) {
  ctx.save();
  S.draw(ctx, t);
  ctx.restore();
  const base = FX.bake(ctx);
  // 原片的人物和文字是干净的平涂，不发光；泛光只在爆炸、能量这类时刻打开
  FX.bloom(ctx, S.bloomAt ? S.bloomAt(t) : 0, base);
  FX.black(ctx, Math.max(1 - K.smooth(K.prog(t, 0, 0.15)), K.smooth(K.prog(t, S.DUR - 0.6, S.DUR - 0.05))));
}
module.exports = { renderFrame, DUR: S.DUR };
