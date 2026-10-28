// 合成一帧：纸底 → 场景（各自管淡入淡出）→ 左上角栏目名 → 字幕 → 纸纹颗粒 → 开头黑场
'use strict';
const K = require('./core');
const { W, H, prog, smooth } = K;
const P = require('./paper');
const FX = require('./fx');
const SUBS = require('./subs');
const HUD = require('./hud');
const SCENES = require('./scenes');

function renderFrame(ctx, t, frame) {
  ctx.save();
  ctx.fillStyle = P.BG; ctx.fillRect(0, 0, W, H);
  const live = SCENES.filter(s => t >= s.t0 - 1 && t < s.t1 + 1);
  for (const s of live) s.draw(ctx, t);
  for (const s of live) if (s.over) s.over(ctx, t);
  HUD.draw(ctx, t);
  SUBS.draw(ctx, t, live.some(s => s.hideSubs && s.hideSubs(t)), live.some(s => s.photoSubs && s.photoSubs(t)));
  FX.finish(ctx);
  FX.black(ctx, 1 - smooth(prog(t, 0, 0.1)));
  ctx.restore();
}
module.exports = { renderFrame, SCENES };
