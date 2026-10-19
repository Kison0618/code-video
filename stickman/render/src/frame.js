// 合成一帧：场景 → 泛光（只有光团、闪电这类亮部会渗光）→ 首尾淡入淡出
'use strict';
const K = require('./core');
const FX = require('./fx');
// 场景：默认是样片；SCENE=motion 动作验证片；SCENE=impact 打击特效样片；SCENE=react 反应动作验证片；SCENE=v2 样片 v2；SCENE=v3 样片 v3；SCENE=v4 探索开头；SCENE=loop 火柴人VS循环；SCENE=loop2 火柴人VS循环 v2
const S = require({ motion: './scene_motion', impact: './scene_impact', react: './scene_react', v2: './scene_v2', v3: './scene_v3', v4: './scene_v4', loop: './scene_loop', loop2: './scene_loop2', fight: './scene_fight_demo', garble: './scene_garble' }[process.env.SCENE] || './scene');

function renderFrame(ctx, t) {
  ctx.save();
  S.draw(ctx, t);
  ctx.restore();
  let base = FX.bake(ctx);
  if (S.post) { S.post(ctx, t, base); base = FX.bake(ctx); }      // 场景自己的后期（冲击波扭曲、反色冲击帧等）
  // 原片的人物和文字是干净的平涂，不发光；泛光只在爆炸、能量这类时刻打开
  FX.bloom(ctx, S.bloomAt ? S.bloomAt(t) : 0, base);
  FX.black(ctx, Math.max(1 - K.smooth(K.prog(t, 0, 0.15)), K.smooth(K.prog(t, S.DUR - 0.6, S.DUR - 0.05))));
}
module.exports = { renderFrame, DUR: S.DUR };
