// 合成一帧：背景 → 各幕 → 引文/HUD/字幕 → 暗角与颗粒
'use strict';
const K = require('./core');
const UI = require('./ui');
const SCENES = require('./scenes');

function renderFrame(ctx, t, frame) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  UI.background(ctx, t, starsFor(t));
  for (const s of SCENES) if (t >= s.start - 1 && t <= s.end + 1) s.draw(ctx, t);
  UI.hitFlash(ctx, t);
  UI.quotes(ctx, t);
  UI.subtitles(ctx, t);
  UI.finish(ctx, t, frame);
  // 片尾黑场
  const fo = K.smooth(K.prog(t, 351.2, 352.4));
  if (fo > 0) { ctx.fillStyle = `rgba(0,0,0,${fo})`; ctx.fillRect(0, 0, K.W, K.H); }
  const fi = 1 - K.smooth(K.prog(t, 0, 0.8));
  if (fi > 0) { ctx.fillStyle = `rgba(0,0,0,${fi})`; ctx.fillRect(0, 0, K.W, K.H); }
  ctx.restore();
}
// 星尘在图灵斑纹和细胞段落减弱
function starsFor(t) {
  const dip = K.smooth(K.prog(t, 199, 202)) * (1 - K.smooth(K.prog(t, 222, 226)));
  return { starA: 1 - 0.85 * dip, warm: 0.5 };
}
module.exports = { renderFrame };
